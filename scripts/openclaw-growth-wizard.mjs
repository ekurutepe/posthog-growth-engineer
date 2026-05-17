#!/usr/bin/env node
import { existsSync, promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const DEFAULT_CONFIG = 'data/posthog-growth-engineer/config.json';
const EXAMPLE_CONFIG = 'data/posthog-growth-engineer/config.example.json';

function parseArgs(argv) {
  const args = { config: DEFAULT_CONFIG, write: false };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];
    if (token === '--config') {
      args.config = String(next || '').trim();
      i += 1;
    } else if (token === '--write') {
      args.write = true;
    } else if (token === '--connectors') {
      if (next && !next.startsWith('--')) i += 1;
    } else if (token === '--help' || token === '-h') {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }
  return args;
}

function printHelp() {
  process.stdout.write(`Usage: node scripts/openclaw-growth-wizard.mjs [--write] [--config <file>]\n`);
}

async function copyExampleConfig(configPath) {
  if (existsSync(configPath)) return false;
  const source = path.resolve(EXAMPLE_CONFIG);
  await fs.mkdir(path.dirname(path.resolve(configPath)), { recursive: true });
  await fs.copyFile(source, path.resolve(configPath));
  return true;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  process.stdout.write(`PostHog Growth Engineer setup\n\n`);
  process.stdout.write(`1. Configure PostHog MCP in the host shell:\n\n`);
  process.stdout.write(`   npx @posthog/wizard mcp add\n\n`);
  process.stdout.write(`2. Use PostHog MCP to gather bounded project evidence and save:\n\n`);
  process.stdout.write(`   data/posthog-growth-engineer/posthog_mcp_summary.json\n\n`);
  process.stdout.write(`3. Run preflight:\n\n`);
  process.stdout.write(`   node scripts/openclaw-growth-preflight.mjs --config ${args.config} --json\n\n`);
  if (args.write) {
    const created = await copyExampleConfig(args.config);
    process.stdout.write(created ? `Created ${args.config}\n` : `${args.config} already exists\n`);
  } else {
    process.stdout.write(`To create the default config, rerun with --write.\n`);
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
