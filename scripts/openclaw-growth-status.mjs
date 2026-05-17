#!/usr/bin/env node
import process from 'node:process';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const runtimeDir = path.dirname(fileURLToPath(import.meta.url));
const preflightPath = path.join(runtimeDir, 'openclaw-growth-preflight.mjs');

function parseArgs(argv) {
  const args = { config: 'data/posthog-growth-engineer/config.json', json: false };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];
    if (token === '--config') {
      args.config = String(next || '').trim();
      i += 1;
    } else if (token === '--json') {
      args.json = true;
    } else if (token === '--help' || token === '-h') {
      process.stdout.write(`Usage: node scripts/openclaw-growth-status.mjs [--config <file>] [--json]\n`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }
  return args;
}

function runPreflight(config) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [preflightPath, '--config', config, '--json'], { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });
    child.on('close', (code) => {
      try {
        resolve({ ok: code === 0, payload: JSON.parse(stdout), stderr });
      } catch {
        resolve({ ok: false, payload: null, stderr: stderr || stdout });
      }
    });
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = await runPreflight(args.config);
  const payload = result.payload || {
    ok: false,
    connectors: {
      posthog: {
        status: 'unknown',
        detail: result.stderr || 'Preflight did not return JSON',
        nextAction: 'Run node scripts/openclaw-growth-preflight.mjs --json',
      },
    },
  };
  if (args.json) {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  } else {
    for (const [key, connector] of Object.entries(payload.connectors || {})) {
      process.stdout.write(`${key}: ${connector.status} - ${connector.detail}\n`);
      if (connector.nextAction) process.stdout.write(`  next: ${connector.nextAction}\n`);
    }
  }
  process.exitCode = payload.ok ? 0 : 1;
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
