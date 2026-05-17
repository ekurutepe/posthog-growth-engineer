#!/usr/bin/env node
import { existsSync, promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';
import { loadOpenClawGrowthSecrets } from './openclaw-growth-env.mjs';

const DEFAULT_CONFIG_PATH = 'data/posthog-growth-engineer/config.json';
const DEFAULT_MCP_SUMMARY_PATH = 'data/posthog-growth-engineer/posthog_mcp_summary.json';

function parseArgs(argv) {
  const args = { config: DEFAULT_CONFIG_PATH, json: false };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];
    if (token === '--config') {
      args.config = String(next || '').trim();
      i += 1;
    } else if (token === '--json') {
      args.json = true;
    } else if (token === '--help' || token === '-h') {
      process.stdout.write(`Usage: node scripts/openclaw-growth-preflight.mjs [--config <file>] [--json]\n`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }
  return args;
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

function check(name, ok, detail, nextAction = null) {
  return { name, ok, detail, nextAction };
}

function run(command, args, timeoutMs = 15000) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      resolve({ ok: false, stdout, stderr: `${stderr}\nTimed out after ${timeoutMs}ms` });
    }, timeoutMs);
    child.stdout.on('data', (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ ok: code === 0, stdout, stderr, code });
    });
    child.on('error', (error) => {
      clearTimeout(timer);
      resolve({ ok: false, stdout, stderr: error.message });
    });
  });
}

function posthogApiFallbackConfigured(config) {
  const fallback = config?.posthog?.apiFallback || {};
  const tokenEnv = String(fallback.tokenEnv || 'POSTHOG_PERSONAL_API_KEY');
  const projectIdEnv = String(fallback.projectIdEnv || 'POSTHOG_PROJECT_ID');
  const hostEnv = String(fallback.hostEnv || 'POSTHOG_HOST');
  return Boolean(process.env[tokenEnv] && process.env[projectIdEnv] && (process.env[hostEnv] || fallback.hostOptional === true));
}

function mcpEvidencePath(config) {
  return String(config?.posthog?.mcp?.summaryPath || DEFAULT_MCP_SUMMARY_PATH);
}

function analyticsSourceConfigured(config) {
  const source = config?.sources?.analytics;
  if (!source || source.enabled === false) return false;
  if (source.mode === 'file') return Boolean(source.path);
  if (source.mode === 'command') return /export-posthog-summary\.mjs/.test(String(source.command || ''));
  return false;
}

async function main() {
  await loadOpenClawGrowthSecrets();
  const args = parseArgs(process.argv.slice(2));
  const checks = [];
  const configPath = path.resolve(args.config);
  checks.push(check('config:file', existsSync(configPath), `Config path: ${configPath}`, `Copy data/posthog-growth-engineer/config.example.json to ${args.config}`));

  let config = null;
  if (existsSync(configPath)) {
    config = await readJson(configPath);
  }

  const nodeCheck = await run(process.execPath, ['--version']);
  checks.push(check('dependency:node', nodeCheck.ok, nodeCheck.ok ? nodeCheck.stdout.trim() : nodeCheck.stderr));

  if (config) {
    checks.push(check(
      'source:posthog',
      analyticsSourceConfigured(config),
      analyticsSourceConfigured(config)
        ? 'PostHog analytics source is configured'
        : 'sources.analytics must use scripts/export-posthog-summary.mjs or a compatible file source',
      'Enable sources.analytics with the PostHog MCP exporter'
    ));

    const summaryPath = path.resolve(mcpEvidencePath(config));
    const hasMcpEvidence = existsSync(summaryPath);
    const hasApiFallback = posthogApiFallbackConfigured(config);
    checks.push(check(
      'posthog:mcp-or-api',
      hasMcpEvidence || hasApiFallback,
      hasMcpEvidence
        ? `PostHog MCP evidence file exists: ${summaryPath}`
        : hasApiFallback
          ? 'PostHog API fallback env vars are configured'
          : 'No PostHog MCP evidence file or API fallback env vars found',
      'Run PostHog MCP queries and save data/posthog-growth-engineer/posthog_mcp_summary.json, or configure POSTHOG_PERSONAL_API_KEY, POSTHOG_PROJECT_ID, and POSTHOG_HOST'
    ));

    const repoRoot = path.resolve(String(config.project?.repoRoot || '.'));
    checks.push(check('repo:readable', existsSync(repoRoot), `Repo root: ${repoRoot}`, 'Set project.repoRoot to a readable checkout'));
  }

  const ok = checks.every((entry) => entry.ok);
  const payload = {
    ok,
    generatedAt: new Date().toISOString(),
    configPath,
    checks,
    connectors: {
      posthog: {
        status: checks.find((entry) => entry.name === 'posthog:mcp-or-api')?.ok ? 'connected' : 'blocked',
        detail: checks.find((entry) => entry.name === 'posthog:mcp-or-api')?.detail || 'PostHog check did not run',
        nextAction: checks.find((entry) => entry.name === 'posthog:mcp-or-api')?.nextAction || null,
      },
      github: {
        status: process.env.GITHUB_TOKEN ? 'connected' : 'unknown',
        detail: process.env.GITHUB_TOKEN ? 'GITHUB_TOKEN is set' : 'GitHub token not configured; repo read may still work locally',
      },
      revenuecat: {
        status: process.env.REVENUECAT_API_KEY ? 'connected' : 'unknown',
        detail: process.env.REVENUECAT_API_KEY ? 'REVENUECAT_API_KEY is set' : 'RevenueCat disabled or not configured',
      },
      sentry: {
        status: process.env.SENTRY_AUTH_TOKEN ? 'connected' : 'unknown',
        detail: process.env.SENTRY_AUTH_TOKEN ? 'SENTRY_AUTH_TOKEN is set' : 'Sentry disabled or not configured',
      },
    },
  };

  if (args.json) {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  } else {
    for (const entry of checks) {
      process.stdout.write(`${entry.ok ? 'OK' : 'BLOCKED'} ${entry.name}: ${entry.detail}\n`);
      if (!entry.ok && entry.nextAction) process.stdout.write(`  next: ${entry.nextAction}\n`);
    }
  }
  process.exitCode = ok ? 0 : 1;
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
