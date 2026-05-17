# Setup And Scheduling

## First Setup

1. Configure PostHog MCP:

   ```bash
   npx @posthog/wizard mcp add
   ```

2. Copy the example config:

   ```bash
   cp data/posthog-growth-engineer/config.example.json data/posthog-growth-engineer/config.json
   ```

3. Use PostHog MCP to gather bounded evidence and save it to:

   ```text
   data/posthog-growth-engineer/posthog_mcp_summary.json
   ```

4. Run preflight:

   ```bash
   node scripts/openclaw-growth-preflight.mjs --config data/posthog-growth-engineer/config.json --json
   ```

5. Run once:

   ```bash
   node scripts/openclaw-growth-runner.mjs --config data/posthog-growth-engineer/config.json --state data/posthog-growth-engineer/state.json
   ```

## Recurring Runs

Do not enable recurring runs until:

- PostHog MCP is pinned to the intended project or organization.
- GitHub auto-creation is disabled or explicitly approved.
- notification channels are trusted.
- source commands are reviewed.

The config's cadence decides what is due after the runner is invoked. It does not wake the agent by itself. Use OpenClaw cron, Hermes cron, Codex automations, `launchd`, or another scheduler only after a manual run succeeds.

## PostHog Data Freshness

For daily and weekly runs, use bounded MCP queries rather than raw exports. For large recurring exports, configure PostHog batch exports to S3, BigQuery, Snowflake, Postgres, or another warehouse and feed the aggregate result back as a file source.
