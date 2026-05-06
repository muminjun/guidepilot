# Guidepilot — Design Spec

> **작성일**: 2026-05-06
> **상태**: 설계 확정

---

## 1. 한 줄 정의

> "preview/ 폴더에 스크린샷 넣으면, CLI가 알아서 편집 가능한 가이드를 만들어준다."

---

## 2. 핵심 가치

| 강점 | 설명 |
|------|------|
| 모바일(Flutter) 지원 | Scribe/Guidde가 못 하는 것. Flutter CI가 생성한 스크린샷 그대로 사용. |
| 어노테이션 영속성 | 이미지가 교체돼도 화살표/원/텍스트 유지. Screen ID 기반 저장. |
| 프레임워크 무관 | preview/ 폴더 컨벤션만 따르면 Flutter, React, Vue, 무엇이든 동작. |
| 오픈소스 | npm 배포. 신뢰 + 커뮤니티. 서버 없음, 비용 $0. |

---

## 3. 전체 아키텍처

```
[개발자 레포]
  preview/
  ├── 레시피관리/
  │   ├── 01_목록.png        ← Flutter CI / React CI가 생성
  │   └── 02_등록폼.png
  └── guidepilot.yaml       ← 선택사항 (오버라이드)

  .guidepilot/
  └── data.json             ← 어노테이션 + 블록 저장 (git 커밋)

[CLI]
  $ guidepilot dev          → 로컬 웹서버 + 브라우저 오픈 (편집)
  $ guidepilot build        → 정적 HTML 가이드 생성
  $ guidepilot export pdf   → PDF 생성
  $ guidepilot export notion → Notion 동기화

[GitHub Actions]
  preview/ 변경 감지
    → npx guidepilot build
    → GitHub Pages 배포
```

**핵심 원칙**: 서버 없음. 클라우드 없음. 데이터는 레포 안에. Storybook과 동일한 모델.

---

## 4. 폴더 컨벤션

### 기본 (설정 불필요)

```
preview/
├── 레시피관리/
│   ├── 01_목록.png
│   └── 02_등록폼.png
└── 매장요청/
    └── 01_목록.png
```

- 폴더명 → 섹션명
- 파일명 → 화면명 (숫자 prefix로 순서 결정)
- PNG/JPG 모두 지원

### 오버라이드 (선택사항)

```yaml
# preview/guidepilot.yaml
sections:
  - id: recipe
    label: 레시피 관리   # 폴더명 대신 표시할 이름
    order: 1
```

---

## 5. 데이터 모델

어노테이션은 이미지가 아니라 **Screen ID에 묶인다.** 이미지 교체 후에도 유지되는 핵심 메커니즘.

```json
// .guidepilot/data.json
{
  "screens": {
    "레시피관리/01_목록": {
      "annotations": [
        {
          "type": "arrow",
          "x_ratio": 0.3,
          "y_ratio": 0.15,
          "properties": { "color": "#FF5500", "label": "검색 바" }
        },
        {
          "type": "badge",
          "x_ratio": 0.8,
          "y_ratio": 0.4,
          "properties": { "number": 1 }
        }
      ],
      "blocks": [
        { "type": "steps", "content": "1. 검색 바에 키워드 입력\n2. 필터 선택" },
        { "type": "warning", "content": "레시피명은 최대 50자" }
      ]
    }
  }
}
```

**좌표 저장 방식**: `x_ratio`, `y_ratio` (0~1 상대 좌표) → 해상도 변경에도 위치 유지.

### Annotation 타입

| 타입 | 설명 |
|------|------|
| `arrow` | 화살표 (방향, 색상) |
| `circle` | 원형 강조 |
| `rect` | 사각형 강조 |
| `text` | 텍스트 레이블 |
| `badge` | 번호 마커 (①②③) |

### ContentBlock 타입

| 타입 | 설명 |
|------|------|
| `heading` | 제목 |
| `paragraph` | 텍스트 |
| `steps` | 단계별 목록 |
| `warning` | 주의사항 |
| `callout` | 콜아웃 |

---

## 6. 에디터 UX

`guidepilot dev` 실행 시 브라우저에서 열리는 로컬 웹앱.

```
┌─────────────────────────────────────────────────────┐
│  레시피 관리  >  목록                               │
├──────────────────────────┬──────────────────────────┤
│                          │  ## 레시피 목록           │
│   [이미지 캔버스]         │                          │
│   (Konva.js)             │  1. 검색 바에 키워드 입력 │
│                          │  2. 필터 선택             │
│   ①── 검색 바            │                          │
│   ②── 필터               │  ⚠️ 주의: 최대 50자      │
│   ③→  레시피 카드        │                          │
│                          │  [+ 블록 추가]            │
├──────────────────────────┴──────────────────────────┤
│  [→ 화살표]  [○ 원]  [□ 박스]  [① 번호]  [T 텍스트] │
└─────────────────────────────────────────────────────┘
```

편집 내용은 `.guidepilot/data.json`에 실시간 저장.

---

## 7. CLI 인터페이스

```bash
# 초기화
guidepilot init

# 편집 모드 (로컬 웹서버 + 브라우저)
guidepilot dev

# 정적 가이드 빌드
guidepilot build

# 내보내기
guidepilot export pdf
guidepilot export notion --token <NOTION_TOKEN>
```

---

## 8. GitHub Actions 템플릿

플러그인이 제공하는 공식 템플릿:

```yaml
# .github/workflows/guidepilot.yml
name: Guidepilot — Build Guide

on:
  push:
    paths: ['preview/**']

jobs:
  build-guide:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npx guidepilot build
      - uses: actions/deploy-pages@v4
```

Flutter 프로젝트 예시:

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: subosito/flutter-action@v2
  - run: flutter test test/preview_screenshot_test.dart  # preview/ 에 PNG 생성
  - run: npx guidepilot build
  - uses: actions/deploy-pages@v4
```

---

## 9. 기술 스택

| 컴포넌트 | 기술 | 이유 |
|---------|------|------|
| CLI | Node.js + Commander.js | npm 배포 표준 |
| 로컬 웹서버 | Vite + React | 빠른 HMR |
| 어노테이션 에디터 | Konva.js | Canvas 기반, 성숙한 라이브러리 |
| 블록 에디터 | Tiptap | Notion 클론급, 오픈소스 |
| 정적 빌드 | Vite build | HTML/CSS/JS 번들 |
| PDF 생성 | Puppeteer | headless Chrome |
| Notion 연동 | Notion API | |
| 데이터 저장 | `.guidepilot/data.json` | git으로 버전 관리 |

**운영비: $0** (전부 로컬, 배포는 GitHub Pages)

---

## 10. MVP 범위

### In Scope

- `guidepilot init / dev / build / export`
- `preview/` 폴더 파싱 (폴더명 → 섹션, 파일명 → 화면)
- `guidepilot.yaml` 오버라이드 지원
- 어노테이션 에디터 (화살표, 원, 번호, 텍스트)
- 블록 에디터 (텍스트, 단계 목록, 주의사항)
- 어노테이션 영속성 (이미지 교체 후 유지)
- 정적 HTML 빌드 + GitHub Pages 배포
- PDF 내보내기
- Notion 동기화
- GitHub Actions 템플릿

### Out of Scope (v2)

- VS Code 익스텐션
- 팀 협업 / 댓글
- 버전 히스토리
- 가이드 내 검색
- 다국어 지원

---

## 11. 첫 번째 고객 (레퍼런스 구현)

**FC다움 (fnb-app-v2)**
- Flutter 앱, `lib/src/dev/preview/` 이미 구현됨
- 이 레포가 레퍼런스 구현체이자 첫 번째 고객
- 성공 기준: 레시피 도메인 가이드가 코드 변경 후 자동 갱신됨

---

## 12. 경쟁 비교

| 도구 | 모바일 지원 | 자동 업데이트 | 어노테이션 영속 | 프레임워크 무관 |
|------|-----------|------------|--------------|--------------|
| **Guidepilot** | ✅ | ✅ | ✅ | ✅ |
| Scribe | ❌ | ❌ | ❌ | ❌ |
| Guidde | ❌ | ❌ | ❌ | ❌ |
| Storybook | ✅ (컴포넌트만) | ✅ | ❌ | ✅ |
| Zendesk/GitBook | ❌ | ❌ | ❌ | ❌ |

**Guidepilot만 4가지 모두 ✅**
