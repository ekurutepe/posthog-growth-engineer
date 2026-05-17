import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import test from 'node:test';

const skillRoot = new URL('..', import.meta.url).pathname;
const script = join(skillRoot, 'scripts', 'setup-posthog-mcp.sh');

test('setup-posthog-mcp prints the official MCP setup command', () => {
  const result = spawnSync('bash', [script], {
    cwd: skillRoot,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /npx @posthog\/wizard mcp add/);
  assert.match(result.stdout, /https:\/\/mcp\.posthog\.com\/mcp/);
  assert.doesNotMatch(result.stdout, /npm install -g/);
});
