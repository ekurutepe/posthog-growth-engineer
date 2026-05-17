# PostHog Growth Engineer

PostHog Growth Engineer is a Codex skill for turning product analytics and product-health signals into implementation-ready growth work. It uses PostHog MCP as the analytics baseline, then can correlate those findings with RevenueCat, Sentry or GlitchTip, App Store Connect, reviews, and GitHub context.

This project is based on [wotaso-dev/growth-engineer](https://clawhub.ai/wotaso-dev/growth-engineer). This fork keeps the growth operating model while making PostHog MCP the source of truth for product analytics.

## What It Does

- Reviews activation, onboarding, paywall, purchase, retention, feature adoption, feedback, and stability signals.
- Produces at most 3-5 prioritized proposals with evidence, KPI impact, likely code or store surface, confidence, and a verification plan.
- Supports daily critical-issue checks, weekly executive summaries, and monthly product/growth review cadences.
- Defaults to local chat output. GitHub issue or PR delivery should only be enabled intentionally.

## Requirements

- Node.js with ES module and `node:test` support.
- PostHog MCP configured for the target project.
- A readable target product repository when running real analysis.
- Optional source credentials for RevenueCat, Sentry or GlitchTip, App Store Connect, and GitHub.

Secrets should stay in MCP OAuth, secure tool configuration, environment variables, or local secret files. Do not put secrets in chat, configs committed to git, or example data.

## Quick Start

Configure PostHog MCP:

```bash
npx @posthog/wizard mcp add
```

Create a local config:

```bash
cp data/posthog-growth-engineer/config.example.json data/posthog-growth-engineer/config.json
```

Gather bounded PostHog MCP evidence and save it to:

```text
data/posthog-growth-engineer/posthog_mcp_summary.json
```

Run preflight:

```bash
node scripts/openclaw-growth-preflight.mjs --config data/posthog-growth-engineer/config.json --json
```

Run the growth pass:

```bash
node scripts/openclaw-growth-runner.mjs --config data/posthog-growth-engineer/config.json --state data/posthog-growth-engineer/state.json
```

Or use the start wrapper:

```bash
node scripts/openclaw-growth-start.mjs --config data/posthog-growth-engineer/config.json --state data/posthog-growth-engineer/state.json
```

## Development

This package currently has no external npm dependencies. The available checks are:

```bash
npm run syntax
npm test
npm run quality
```

`npm run quality` runs syntax checks and the full test suite.

## Project Layout

- `SKILL.md`: canonical skill identity, usage rules, and operating contract.
- `scripts/`: setup, status, export, preflight, runner, and chart helpers.
- `tests/`: Node test coverage for the command-line helpers.
- `references/`: setup notes, PostHog MCP guidance, input schema, and required secrets.
- `data/posthog-growth-engineer/`: example configs and sample source summaries.
- `agents/`: agent metadata for OpenClaw or compatible runtimes.

## References

- `references/setup-and-scheduling.md`
- `references/posthog-mcp.md`
- `references/input-schema.md`
- `references/required-secrets.md`

## License

MIT-0. See `license.txt`.
