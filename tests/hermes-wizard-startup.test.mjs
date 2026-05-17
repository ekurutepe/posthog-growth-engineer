import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

const skillRoot = new URL('..', import.meta.url).pathname;

test('skill routes setup to PostHog MCP wizard', async () => {
  const skill = await readFile(join(skillRoot, 'SKILL.md'), 'utf8');
  assert.match(skill, /npx @posthog\/wizard mcp add/);
  assert.match(skill, /https:\/\/mcp\.posthog\.com\/mcp/);
  assert.doesNotMatch(skill, /@posthog\/cli/);
});
