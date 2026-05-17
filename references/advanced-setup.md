# Advanced Setup

Use advanced setup only after a manual PostHog MCP run succeeds.

## API Fallback

The skill can run a limited direct PostHog API fallback through `scripts/export-posthog-summary.mjs` when MCP is unavailable. Configure:

```bash
export POSTHOG_HOST="https://us.posthog.com"
export POSTHOG_PROJECT_ID="12345"
export POSTHOG_PERSONAL_API_KEY="..."
```

This fallback is intentionally narrow. It is for smoke tests and basic aggregate summaries, not a replacement for MCP-led analysis.

## Warehouse / Batch Export

For high-volume recurring analysis, configure PostHog batch exports to a warehouse and add the aggregate output as `sources.extra[]`.

Do not paginate raw events through PostHog `/query` for recurring exports.

## Multiple Apps

Prefer one config per app unless the projects share a release train and event taxonomy. If one PostHog project covers multiple apps, segment every query by app identifier, platform, and app version.
