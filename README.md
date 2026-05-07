# Guidepilot

> Drop screenshots in `preview/`, edit annotations, export anywhere.

Code-first guide editor for any framework — Flutter, React, Vue, anything.

## Install

```bash
npm install -g guidepilot
# or
npx guidepilot
```

## Quick Start

```bash
# 1. Initialize in your project
cd your-project
guidepilot init

# 2. Add screenshots
mkdir -p preview/Your-Feature
cp screenshot.png preview/Your-Feature/01_Screen.png

# 3. Open the editor
guidepilot dev

# 4. Build static guide
guidepilot build

# 5. Export
guidepilot export pdf
guidepilot export notion --token <TOKEN> --page-id <PAGE_ID>
```

## Folder Convention

```
preview/
├── Feature-Name/
│   ├── 01_Screen.png   # numbered prefix = order
│   └── 02_Other.png
└── guidepilot.yaml     # optional label overrides
```

## How annotations survive image updates

Annotations are stored in `.guidepilot/data.json` keyed by screen ID
(`Feature-Name/01_Screen`), not by image content. Replace the image, the
annotations stay exactly where you placed them.

## CI / GitHub Pages

Copy `templates/guidepilot.yml` (or `templates/guidepilot-flutter.yml` for
Flutter) to `.github/workflows/` in your project.

## Why Guidepilot?

| | Scribe | Guidde | Storybook | **Guidepilot** |
|---|---|---|---|---|
| Mobile (Flutter) | ❌ | ❌ | ✅ (components only) | ✅ |
| Auto-update | ❌ | ❌ | ✅ | ✅ |
| Annotation persistence | ❌ | ❌ | ❌ | ✅ |
| Framework-agnostic | ❌ | ❌ | ✅ | ✅ |

## License

MIT
