interface ExportOptions {
  token?: string;
  pageId?: string;
  output?: string;
  imageBaseUrl?: string;
}

export async function runExport(projectRoot: string, target: string, opts: ExportOptions): Promise<void> {
  if (target === 'pdf') {
    const { exportPdf } = await import('../export/pdf.js');
    await exportPdf(projectRoot, opts.output ?? 'guidepilot-guide.pdf');
  } else if (target === 'notion') {
    if (!opts.token) {
      console.error('--token <NOTION_TOKEN> is required for notion export.');
      process.exit(1);
    }
    if (!opts.pageId) {
      console.error('--page-id <NOTION_PAGE_ID> is required for notion export.');
      process.exit(1);
    }
    const { exportNotion } = await import('../export/notion.js');
    await exportNotion(projectRoot, opts.token, opts.pageId, opts.imageBaseUrl);
  } else {
    console.error(`Unknown export target: ${target}. Use: pdf | notion`);
    process.exit(1);
  }
}
