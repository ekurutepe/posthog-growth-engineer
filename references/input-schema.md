# Input Schema

All source commands and files should emit JSON. The runner accepts provider-specific payloads, but the most portable shape is:

```json
{
  "project": "Example App",
  "window": "last_30d",
  "signals": [
    {
      "id": "activation_drop_ios_2_4_0",
      "title": "Activation dropped for iOS 2.4.0",
      "priority": "high",
      "area": "onboarding",
      "metric": "onboarding_completion",
      "current": 0.42,
      "baseline": 0.57,
      "delta_percent": -26.3,
      "evidence": [
        "PostHog funnel signup_started -> onboarding_completed dropped from 57% to 42%",
        "Affected appVersion=2.4.0, platform=iOS"
      ],
      "hypothesis": "A 2.4.0 onboarding change blocks completion before the first value moment.",
      "recommendation": "Inspect the first-run permission and account creation flow for 2.4.0.",
      "kpi": "activation",
      "confidence": "medium"
    }
  ],
  "meta": {
    "source": "posthog_mcp",
    "generatedAt": "2026-05-17T00:00:00.000Z"
  }
}
```

## Signal Fields

- `id`: stable identifier for deduping.
- `title`: short human-readable finding.
- `priority`: `high`, `medium`, or `low`.
- `area`: `onboarding`, `paywall`, `purchase`, `retention`, `marketing`, `stability`, `feedback`, `store`, `instrumentation`, or `general`.
- `metric`: KPI or metric name.
- `current`, `baseline`, `delta_percent`: numeric evidence when available.
- `evidence`: concrete source facts, not interpretation alone.
- `hypothesis`: likely cause.
- `recommendation`: action to take.
- `kpi`: KPI expected to move.
- `confidence`: `high`, `medium`, or `low`.

## PostHog MCP Summary

When using PostHog MCP directly, save a summary at `data/posthog-growth-engineer/posthog_mcp_summary.json`.

Recommended shape:

```json
{
  "project": "Example App",
  "window": "last_30d",
  "queries": [
    {
      "name": "activation_funnel_by_version",
      "tool": "query-run",
      "query": "bounded HogQL or saved insight id",
      "result": []
    }
  ],
  "funnels": [],
  "retention": [],
  "events": [],
  "experiments": [],
  "surveys": [],
  "errors": [],
  "signals": []
}
```

The exporter preserves provided `signals[]`. If no signals are provided, it creates conservative instrumentation/adoption signals from event and query summaries.
