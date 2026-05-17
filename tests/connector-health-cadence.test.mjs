import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const skillRoot = new URL('..', import.meta.url).pathname;
const preflight = join(skillRoot, 'scripts', 'openclaw-growth-preflight.mjs');
const status = join(skillRoot, 'scripts', 'openclaw-growth-status.mjs');
const exampleConfig = join(skillRoot, 'data', 'posthog-growth-engineer', 'config.example.json');

test('preflight passes with a PostHog MCP evidence file', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'posthog-growth-preflight-'));
  const dataDir = join(dir, 'data', 'posthog-growth-engineer');
  await mkdir(dataDir, { recursive: true });
  const configPath = join(dataDir, 'config.json');
  const summaryPath = join(dataDir, 'posthog_mcp_summary.json');
  await copyFile(exampleConfig, configPath);
  const config = JSON.parse(await readFile(configPath, 'utf8'));
  config.project.repoRoot = dir;
  config.posthog.mcp.summaryPath = summaryPath;
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
  await writeFile(summaryPath, JSON.stringify({ project: 'Demo', signals: [] }));

  const result = spawnSync(process.execPath, [preflight, '--config', configPath, '--json'], {
    cwd: skillRoot,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, true);
  assert.equal(payload.connectors.posthog.status, 'connected');
});

test('status reports blocked when PostHog evidence is missing', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'posthog-growth-status-'));
  const dataDir = join(dir, 'data', 'posthog-growth-engineer');
  await mkdir(dataDir, { recursive: true });
  const configPath = join(dataDir, 'config.json');
  await copyFile(exampleConfig, configPath);
  const config = JSON.parse(await readFile(configPath, 'utf8'));
  config.project.repoRoot = dir;
  config.posthog.mcp.summaryPath = join(dataDir, 'missing.json');
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);

  const result = spawnSync(process.execPath, [status, '--config', configPath, '--json'], {
    cwd: skillRoot,
    encoding: 'utf8',
  });

  assert.notEqual(result.status, 0);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.connectors.posthog.status, 'blocked');
});
