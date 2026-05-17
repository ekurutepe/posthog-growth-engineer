# PostHog MCP

Use PostHog MCP as the primary analytics interface.

## Setup

```bash
npx @posthog/wizard mcp add
```

Manual server URL:

```text
https://mcp.posthog.com/mcp
```

Use OAuth when supported. If the client does not support OAuth, configure an authorization header with a scoped personal API key:

```text
Authorization: Bearer <POSTHOG_PERSONAL_API_KEY>
```

Pin long-running jobs with `x-posthog-project-id` when possible.

## Preferred Tool Order

1. `read-data-schema`
2. `hogql-schema`
3. `query-validate`
4. `query-run`
5. `insight-query`
6. `dashboard-insights-run`
7. `event-definitions-list`
8. `properties-list`
9. experiment, survey, feature flag, and error-tracking tools as needed

## Query Rules

- Always include an explicit time window.
- Prefer aggregate queries over raw rows.
- Name queries clearly.
- Use saved insights/dashboards when they already represent the product team's source of truth.
- Do not use `/query` as a bulk recurring export path. Use PostHog batch exports for that.

## Core Mobile Queries

Ask PostHog MCP for:

- DAU/WAU/MAU by platform/app version.
- first-run to activation funnel.
- onboarding step conversion by app version.
- paywall view to trial/purchase funnel.
- trial start to conversion when RevenueCat data is present in PostHog or available separately.
- D1/D3/D7 retention by app version/source.
- top events and unused/stale events.
- survey/feedback themes.
- experiment exposure and result summaries.
- error tracking issues by affected users/events when PostHog error tracking is used.
