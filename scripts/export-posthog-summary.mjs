#!/usr/bin/env node
import { existsSync, promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { loadOpenClawGrowthSecrets } from './openclaw-growth-env.mjs';

const DEFAULT_MCP_SUMMARY = 'data/posthog-growth-engineer/posthog_mcp_summary.json';

function printHelpAndExit(exitCode, reason = null) {
  if (reason) {
    process.stderr.write(`${reason}\n\n`);
  }
  process.stdout.write(`
Export PostHog Summary

Builds a Growth Engineer-compatible analytics summary from PostHog MCP evidence.

Usage:
  node scripts/export-posthog-summary.mjs [options]

Options:
  --mcp-summary <file>  PostHog MCP evidence JSON (default: ${DEFAULT_MCP_SUMMARY})
  --project <id>        Optional PostHog project id for API fallback
  --last <duration>     Relative time window like 7d or 30d (default: 30d)
  --out <file>          Write JSON to file instead of stdout
  --max-signals <n>     Maximum signals to emit (default: 4)
  --allow-empty         Emit an empty partial payload instead of failing when no source is available
  --help, -h            Show help

API fallback env:
  POSTHOG_PERSONAL_API_KEY
  POSTHOG_PROJECT_ID
  POSTHOG_HOST
`);
  process.exit(exitCode);
}

function parseArgs(argv) {
  const args = {
    mcpSummary: DEFAULT_MCP_SUMMARY,
    project: '',
    last: '30d',
    out: '',
    maxSignals: 4,
    allowEmpty: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const next = argv[index + 1];
    if (token === '--mcp-summary') {
      args.mcpSummary = String(next || '').trim();
      index += 1;
    } else if (token === '--project') {
      args.project = String(next || '').trim();
      index += 1;
    } else if (token === '--last') {
      args.last = String(next || '30d').trim() || '30d';
      index += 1;
    } else if (token === '--out') {
      args.out = String(next || '').trim();
      index += 1;
    } else if (token === '--max-signals') {
      const parsed = Number.parseInt(String(next || ''), 10);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        printHelpAndExit(1, `Invalid value for --max-signals: ${String(next || '')}`);
      }
      args.maxSignals = parsed;
      index += 1;
    } else if (token === '--allow-empty') {
      args.allowEmpty = true;
    } else if (token === '--help' || token === '-h') {
      printHelpAndExit(0);
    } else {
      printHelpAndExit(1, `Unknown argument: ${token}`);
    }
  }
  return args;
}

function durationToDays(value) {
  const match = String(value || '').trim().match(/^(\d+)([dwmy])$/i);
  if (!match) return 30;
  const amount = Number.parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  if (unit === 'd') return amount;
  if (unit === 'w') return amount * 7;
  if (unit === 'm') return amount * 30;
  if (unit === 'y') return amount * 365;
  return 30;
}

async function readJsonIfExists(filePath) {
  if (!filePath || !existsSync(filePath)) {
    return null;
  }
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

function coerceNumber(value, fallback = 0) {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizePriority(value) {
  const text = String(value || '').toLowerCase();
  if (text === 'high' || text === 'medium' || text === 'low') return text;
  return 'medium';
}

function normalizeSignals(payload, maxSignals) {
  const signals = asArray(payload?.signals).map((signal, index) => ({
    id: String(signal.id || `posthog_signal_${index + 1}`),
    title: String(signal.title || signal.summary || 'PostHog signal'),
    priority: normalizePriority(signal.priority),
    area: String(signal.area || 'general'),
    metric: signal.metric ? String(signal.metric) : null,
    current_value: signal.current_value ?? signal.currentValue ?? signal.current ?? null,
    baseline_value: signal.baseline_value ?? signal.baselineValue ?? signal.baseline ?? null,
    delta_percent: signal.delta_percent ?? signal.deltaPercent ?? null,
    evidence: asArray(signal.evidence).map(String),
    suggested_actions: asArray(signal.suggested_actions || signal.suggestedActions).map(String),
    confidence: signal.confidence ? String(signal.confidence) : null,
  }));
  if (signals.length > 0) {
    return signals.slice(0, maxSignals);
  }

  const events = asArray(payload?.events);
  const topEvent = events[0];
  if (topEvent) {
    return [
      {
        id: 'posthog_top_event_review',
        title: `Review top PostHog event: ${String(topEvent.event || topEvent.name || 'unknown')}`,
        priority: 'low',
        area: 'instrumentation',
        metric: 'event_volume',
        current_value: coerceNumber(topEvent.count ?? topEvent.events),
        baseline_value: null,
        delta_percent: null,
        evidence: [`Top event in summary: ${JSON.stringify(topEvent)}`],
        suggested_actions: ['Check whether the top events align with activation, paywall, purchase, and retention decisions.'],
        confidence: 'low',
      },
    ];
  }
  return [];
}

function normalizeMcpPayload(payload, input) {
  const project = String(payload?.project || payload?.projectName || input.project || 'posthog_project');
  const window = String(payload?.window || `last_${input.last}`);
  return {
    project,
    window,
    signals: normalizeSignals(payload, input.maxSignals),
    funnels: asArray(payload?.funnels),
    retention: asArray(payload?.retention),
    events: asArray(payload?.events),
    experiments: asArray(payload?.experiments),
    surveys: asArray(payload?.surveys),
    errors: asArray(payload?.errors),
    queries: asArray(payload?.queries),
    meta: {
      ...(payload?.meta && typeof payload.meta === 'object' ? payload.meta : {}),
      generatedAt: new Date().toISOString(),
      source: 'posthog_mcp',
      collection: 'mcp_summary_file',
      mcpSummaryPath: input.mcpSummary,
    },
  };
}

function posthogHost() {
  return String(process.env.POSTHOG_HOST || 'https://us.posthog.com').replace(/\/+$/, '');
}

async function posthogQuery({ project, query, name }) {
  const token = String(process.env.POSTHOG_PERSONAL_API_KEY || '').trim();
  if (!token) {
    throw new Error('POSTHOG_PERSONAL_API_KEY is not set');
  }
  const url = `${posthogHost()}/api/projects/${encodeURIComponent(project)}/query/`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: {
        kind: 'HogQLQuery',
        query,
      },
      name,
    }),
  });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`PostHog query failed (${response.status}): ${body.slice(0, 500)}`);
  }
  return JSON.parse(body);
}

async function buildApiFallback(input) {
  const project = input.project || String(process.env.POSTHOG_PROJECT_ID || '').trim();
  if (!project) {
    throw new Error('POSTHOG_PROJECT_ID is not set');
  }
  const days = durationToDays(input.last);
  const eventQuery = `
    SELECT event, count() AS events, count(DISTINCT distinct_id) AS users
    FROM events
    WHERE timestamp >= now() - INTERVAL ${days} DAY
    GROUP BY event
    ORDER BY events DESC
    LIMIT 20
  `;
  const result = await posthogQuery({
    project,
    query: eventQuery,
    name: `posthog_growth_top_events_last_${days}d`,
  });
  const rows = asArray(result?.results).map((row) => ({
    event: row[0],
    count: row[1],
    users: row[2],
  }));
  return {
    project,
    window: `last_${input.last}`,
    events: rows,
    signals: normalizeSignals({ events: rows }, input.maxSignals),
    meta: {
      generatedAt: new Date().toISOString(),
      source: 'posthog_api',
      collection: 'query_api_fallback',
      host: posthogHost(),
      project,
      warning: 'API fallback is limited. Prefer PostHog MCP for full growth analysis.',
    },
  };
}

function emptyPayload(input, reason) {
  return {
    project: input.project || 'posthog_project',
    window: `last_${input.last}`,
    signals: [],
    meta: {
      generatedAt: new Date().toISOString(),
      source: 'posthog_mcp',
      collection: 'empty',
      status: 'partial',
      reason,
      nextAction: 'Configure PostHog MCP or save data/posthog-growth-engineer/posthog_mcp_summary.json.',
    },
  };
}

async function writeJsonOutput(outPath, payload) {
  const json = `${JSON.stringify(payload, null, 2)}\n`;
  if (!outPath) {
    process.stdout.write(json);
    return;
  }
  await fs.mkdir(path.dirname(path.resolve(outPath)), { recursive: true });
  await fs.writeFile(outPath, json, 'utf8');
}

async function main() {
  await loadOpenClawGrowthSecrets();
  const args = parseArgs(process.argv.slice(2));
  const mcpPayload = await readJsonIfExists(args.mcpSummary);
  if (mcpPayload) {
    await writeJsonOutput(args.out, normalizeMcpPayload(mcpPayload, args));
    return;
  }
  try {
    await writeJsonOutput(args.out, await buildApiFallback(args));
    return;
  } catch (error) {
    if (args.allowEmpty) {
      await writeJsonOutput(args.out, emptyPayload(args, error instanceof Error ? error.message : String(error)));
      return;
    }
    throw error;
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
