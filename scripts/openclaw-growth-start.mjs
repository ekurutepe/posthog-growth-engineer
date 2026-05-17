#!/usr/bin/env node
import process from 'node:process';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const runtimeDir = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const args = {
    config: 'data/posthog-growth-engineer/config.json',
    state: 'data/posthog-growth-engineer/state.json',
    loop: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];
    if (token === '--config') {
      args.config = String(next || '').trim();
      i += 1;
    } else if (token === '--state') {
      args.state = String(next || '').trim();
      i += 1;
    } else if (token === '--loop') {
      args.loop = true;
    } else if (token === '--help' || token === '-h') {
      process.stdout.write(`Usage: node scripts/openclaw-growth-start.mjs [--config <file>] [--state <file>] [--loop]\n`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }
  return args;
}

function runNode(scriptName, args) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(runtimeDir, scriptName), ...args], { stdio: 'inherit' });
    child.on('close', (code) => resolve(code === 0));
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const preflightOk = await runNode('openclaw-growth-preflight.mjs', ['--config', args.config]);
  if (!preflightOk) {
    process.stderr.write('Preflight failed. Configure PostHog MCP or provide a PostHog MCP summary file before starting.\n');
    process.exitCode = 1;
    return;
  }
  const runnerArgs = ['--config', args.config, '--state', args.state];
  if (args.loop) runnerArgs.push('--loop');
  const runnerOk = await runNode('openclaw-growth-runner.mjs', runnerArgs);
  process.exitCode = runnerOk ? 0 : 1;
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
