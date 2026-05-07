#!/usr/bin/env node
import { Command } from 'commander';
import { runInit } from './cmd-init.js';

const program = new Command();

program
  .name('guidepilot')
  .description('Code-first guide editor for any framework')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize guidepilot in the current project')
  .action(() => runInit(process.cwd()));

program
  .command('dev')
  .description('Start the guide editor (local web server)')
  .option('-p, --port <port>', 'Port to listen on', '4242')
  .action(async (opts) => {
    const { runDev } = await import('./cmd-dev.js');
    await runDev(process.cwd(), parseInt(opts.port, 10));
  });

program
  .command('build')
  .description('Build static guide to guidepilot-dist/')
  .action(async () => {
    const { runBuild } = await import('./cmd-build.js');
    await runBuild(process.cwd());
  });

program
  .command('export')
  .description('Export guide to pdf or notion')
  .argument('<target>', 'pdf | notion')
  .option('--token <token>', 'Notion API token (for notion target)')
  .option('--page-id <id>', 'Notion parent page ID (for notion target)')
  .option('-o, --output <path>', 'Output PDF path (for pdf target)', 'guidepilot-guide.pdf')
  .option('--image-base-url <url>', 'Public base URL for images in Notion export')
  .action(async (target, opts) => {
    const { runExport } = await import('./cmd-export.js');
    await runExport(process.cwd(), target, opts);
  });

program.parse();
