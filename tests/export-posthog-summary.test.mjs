import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const skillRoot = new URL('..', import.meta.url).pathname;
const exporter = join(skillRoot, 'scripts', 'export-posthog-summary.mjs');

test('export-posthog-summary normalizes PostHog MCP summary files', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'posthog-summary-'));
  const input = join(dir, 'posthog_mcp_summary.json');
  const output = join(dir, 'posthog_summary.json');
  await writeFile(input, JSON.stringify({
    project: 'Demo',
    window: 'last_7d',
    signals: [{
      id: 'activation_drop',
      title: 'Activation dropped',
      priority: 'high',
      area: 'onboarding',
      metric: 'activation',
      evidence: ['PostHog funnel dropped from 60% to 45%'],
    }],
  }));

  const result = spawnSync(process.execPath, [exporter, '--mcp-summary', input, '--out', output], {
    cwd: skillRoot,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(await readFile(output, 'utf8'));
  assert.equal(payload.meta.source, 'posthog_mcp');
  assert.equal(payload.project, 'Demo');
  assert.equal(payload.signals[0].id, 'activation_drop');
});

test('export-posthog-summary can emit a partial payload when no source is configured', () => {
  const result = spawnSync(process.execPath, [exporter, '--mcp-summary', '/missing/file.json', '--allow-empty'], {
    cwd: skillRoot,
    encoding: 'utf8',
    env: { PATH: process.env.PATH },
  });

  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.meta.status, 'partial');
  assert.equal(payload.meta.source, 'posthog_mcp');
});
