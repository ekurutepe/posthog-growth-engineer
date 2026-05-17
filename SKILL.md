---
name: posthog-growth-engineer
description: Growth Engineer for mobile apps and agent runtimes using PostHog MCP as the product analytics baseline. Correlate PostHog analytics, surveys, experiments, error tracking, RevenueCat, Sentry or GlitchTip, App Store Connect, reviews, and repo context into implementation-ready proposals, GitHub issues, or draft PRs.
license: MIT-0
homepage: https://github.com/ekurutepe/posthog-growth-engineer
metadata:
  author: local
  forked-from: wotaso-dev/growth-engineer
  analytics-baseline: posthog-mcp
  openclaw:
    requires:
      bins: ["node"]
    mcp:
      - name: posthog
        url: https://mcp.posthog.com/mcp
  hermes:
    tags: ["Growth", "PostHog", "MCP", "Mobile", "Product"]
---

# PostHog Growth Engineer

## Canonical Skill Identity

`posthog-growth-engineer` is a fork of the public `growth-engineer` skill. It keeps the growth operating model, delivery modes, and mobile-first source correlation, but uses PostHog MCP as the analytics baseline.

Do not install or load this skill together with the original `growth-engineer` for the same task. If both are present, use this skill only when PostHog is the product analytics source of truth.

## Hard Boundary

- Do not install, update, invoke, or troubleshoot a separate analytics CLI.
- Do not ask the user for any legacy analytics-service token unrelated to PostHog.
- Do not suggest a separate analytics login flow, analytics project-selection CLI, or analytics SDK migration path outside PostHog.
- Use PostHog MCP first. Use direct PostHog API only as a fallback when MCP is unavailable and the user has explicitly configured `POSTHOG_PERSONAL_API_KEY`, `POSTHOG_PROJECT_ID`, and `POSTHOG_HOST`.

## Use This Skill When

- The user wants an agent to turn product analytics and product-health signals into execution-ready backlog work.
- The product uses PostHog for product analytics, funnels, retention, surveys, experiments, feature flags, session replay, error tracking, or data warehouse queries.
- The user wants mobile-first analysis across PostHog, RevenueCat, Sentry-compatible crash monitoring, ASC / App Store Connect, app reviews, and GitHub code context.
- The user wants output that can become an agent chat handoff, GitHub issue, or draft PR proposal.

## Product Focus

- Primary focus: mobile apps.
- Works well with native iOS/Android, React Native, Expo, mobile paywalls, onboarding funnels, subscriptions, store reviews, crashes, release readiness, and feature adoption.
- Valid for web/SaaS products when PostHog MCP can provide the same activation, conversion, retention, experiment, and feedback signals.

## PostHog MCP Setup Contract

When setup is incomplete, give exactly one local-terminal path first:

```bash
npx @posthog/wizard mcp add
```

Tell the user to complete OAuth or provide a PostHog personal API key in the local host/tool configuration, not in chat. If OAuth is unavailable, direct them to create a scoped PostHog personal API key with the MCP Server preset or at minimum query/read access for the target project.

For manual MCP configuration, use:

- Server URL: `https://mcp.posthog.com/mcp`
- Authorization header: `Bearer <POSTHOG_PERSONAL_API_KEY>`
- Optional project pin: `x-posthog-project-id`
- Optional organization pin: `x-posthog-organization-id`

Prefer a project-pinned MCP session for scheduled or unattended runs.

## Connector Model

Built-in source groups:

- `analytics`: PostHog MCP product analytics baseline. This is mandatory for growth analysis.
- `feedback`: PostHog surveys, user interviews, feedback events, support tickets synced into PostHog, or a file/command extra source.
- `revenuecat`: subscriptions, trials, revenue, churn, entitlement, and offering/package signals.
- `sentry`: Sentry Cloud or Sentry-compatible GlitchTip accounts for production exceptions, crashes, hangs, and performance regressions.
- `asc_cli`: App Store Connect via `asc` CLI for downloads/units, conversion, source traffic, ratings/reviews, builds/TestFlight/release context, app usage, purchases, subscriptions, and crash totals.
- `github`: repo context and optional issue/PR delivery.

Additional connectors live in `sources.extra[]` and can use `mode=file` or `mode=command`. Preferred output is the shared `signals[]` shape documented in `references/input-schema.md`.

## PostHog MCP Tooling

When PostHog MCP tools are available, use them in this order:

1. `read-data-schema` and `hogql-schema` to discover events, properties, persons, groups, and warehouse tables.
2. `query-validate` before expensive or complex HogQL.
3. `query-run` for bounded HogQL queries.
4. `insight-query` or `dashboard-insights-run` for existing saved insights and dashboards.
5. `event-definitions-list` and `properties-list` for taxonomy quality.
6. `experiment-results-get`, survey tools, error-tracking tools, and feature-flag tools when relevant.

Always keep PostHog queries bounded. Prefer last 7, 14, or 30 days for daily/weekly work and explicit month windows for monthly work. Do not use PostHog `/query` as a recurring raw export mechanism. For bulk recurring export needs, tell the user to configure PostHog batch exports to a warehouse and query the warehouse/table through MCP or a file source.

## Evidence Workflow

1. Determine the production app version before mapping data to files:
   - app version/build in PostHog event properties
   - ASC build/version
   - Sentry release/environment
   - Git default/release branch and recent tags
   - RevenueCat app/project context

2. Gather PostHog evidence:
   - active users and new users
   - activation/onboarding funnel
   - paywall/purchase funnel
   - retention by cohort and version
   - feature adoption and frequency
   - acquisition/source/channel quality
   - experiments and feature flag exposure
   - survey/feedback themes
   - error tracking or session replay context when connected

3. Correlate with non-PostHog sources:
   - RevenueCat churn/trials/MRR movement
   - Sentry/GlitchTip crash or error regressions
   - ASC downloads, conversion, reviews, release/build state
   - GitHub code changes and release branches

4. Produce at most 3-5 proposals. Each proposal must include:
   - what should change
   - evidence
   - impacted KPI
   - likely code/store surface
   - verification plan
   - confidence level

## Cadence

Daily default:
Analyze configured projects for critical production or business-health issues only: crashes/errors, release failures, onboarding or purchase drop-offs, zero-conversion days, missing buyers, very low users, and severe PostHog anomalies. Do not generate generic growth ideas on daily runs.

Weekly default:
Create an executive product and growth summary across PostHog, RevenueCat, Sentry/GlitchTip, ASC, reviews, recent releases, and code changes. Pick one to three high-confidence improvements.

Monthly default:
Compare month-over-month conversion, retention, channel quality, reviews, churn, crash totals, feature usage, and codebase changes. Decide what to build, change, delete, or instrument next.

Quarterly and longer:
Revisit positioning, pricing/packaging, onboarding architecture, roadmap assumptions, tracking quality, and whether the product still matches the best-retained users.

## Retention Reliability

Treat D1/D3/D7 retention as identity-quality-sensitive. Before making strong retention claims, inspect whether PostHog person profiles and `distinct_id`/`identify` behavior are stable enough for the claim.

If identity quality is unclear, say the metric may be undercounted or cohort-inconsistent. Pair retention recommendations with an instrumentation action such as verifying mobile `identify`, anonymous-to-known merging, app reinstall behavior, and version/source properties.

Do not silently filter. If using identified users only, disclose that anonymous users were excluded and compare cohort size.

## Setup And Status Questions

If the user asks whether connectors are connected, do not infer from memory, config text, or whether helper files exist. Run:

```bash
node scripts/openclaw-growth-status.mjs --config data/posthog-growth-engineer/config.json --json
```

Answer from that command only. If it cannot run, say that a connector status check has not run yet and give the PostHog MCP setup command.

## Mandatory Baseline

Before autopilot runs:

- PostHog MCP must be configured and able to query the target project, or the fallback PostHog API env vars must be configured.
- The target repo checkout must be readable via `project.repoRoot`.
- A writable config must exist at `data/posthog-growth-engineer/config.json`.
- `sources.analytics` must be enabled and point at `scripts/export-posthog-summary.mjs` or a file/command that emits the shared summary shape.

GitHub connection is strongly recommended for serious analysis. Without repo context, findings stay generic and file/module hypotheses are lower confidence.

## Secret Handling

Never ask the user to paste secrets into chat. Secrets belong in:

- PostHog MCP OAuth
- the MCP client's secure header/config store
- host environment variables
- `~/.config/posthog-growth/secrets.env` with mode `600`
- a password-manager or deployment secret injection flow

Required or optional env names:

- `POSTHOG_PERSONAL_API_KEY`: optional fallback for direct PostHog API queries when MCP is not available.
- `POSTHOG_PROJECT_ID`: optional fallback project id.
- `POSTHOG_HOST`: optional fallback host, for example `https://us.posthog.com` or `https://eu.posthog.com`.
- `GITHUB_TOKEN`: optional; required only for GitHub issue/PR delivery.
- `REVENUECAT_API_KEY`: optional RevenueCat read key.
- `SENTRY_AUTH_TOKEN` or account-specific Sentry/GlitchTip token envs: optional crash source.
- `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_PRIVATE_KEY_PATH`: optional App Store Connect source.

## Delivery Modes

- Chat handoff: write `.openclaw/chat/latest.md` and `.openclaw/chat/latest.json`.
- GitHub issue mode: create implementation-ready issues only when write access and user intent are clear.
- Draft PR proposal mode: create proposal-only draft PRs that add proposal files. Use this only when the user explicitly wants proposal PRs.
- Implementation PR mode: if the user asks to implement, inspect the app repo and make real code changes. Do not create a markdown-only PR unless explicitly requested.

Default this fork to local/chat output and disabled GitHub auto-creation. Enable GitHub writes only after the user explicitly chooses it.

## Startup Protocol

When the user says "start", "run", or "kick off":

1. Verify PostHog MCP availability. If unavailable, route to:

   ```bash
   npx @posthog/wizard mcp add
   ```

2. Run:

   ```bash
   node scripts/openclaw-growth-preflight.mjs --config data/posthog-growth-engineer/config.json --json
   ```

3. If the preflight passes, run:

   ```bash
   node scripts/openclaw-growth-runner.mjs --config data/posthog-growth-engineer/config.json --state data/posthog-growth-engineer/state.json
   ```

4. If fresh PostHog MCP evidence is needed, query PostHog with MCP, save the normalized MCP evidence file at:

   ```text
   data/posthog-growth-engineer/posthog_mcp_summary.json
   ```

   Then rerun the runner.

## Output Rules

- Max 3-5 proposals per pass.
- Every proposal must include measurable impact and code/store hypotheses.
- Low-confidence findings must be marked explicitly.
- Do not overfit on a single connector. Cross-check PostHog movement against RevenueCat, Sentry/GlitchTip, ASC, reviews, and releases when available.
- Do not blame code files unless production version and recent code/release evidence support the connection.

## References

- Read `references/posthog-mcp.md` when setting up or using PostHog MCP.
- Read `references/input-schema.md` before creating custom source files or scripts.
- Read `references/setup-and-scheduling.md` before enabling recurring runs.
- Read `references/required-secrets.md` before configuring provider credentials.
- Use `references/issue-template.md` for GitHub issue output.
