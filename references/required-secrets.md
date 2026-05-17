# Required Secrets

Secrets must not be pasted into chat.

## PostHog

Preferred: PostHog MCP OAuth or a scoped MCP Server preset API key in the MCP client config.

Fallback env vars for direct API queries:

- `POSTHOG_PERSONAL_API_KEY`
- `POSTHOG_PROJECT_ID`
- `POSTHOG_HOST`

Use `https://us.posthog.com` or `https://eu.posthog.com` for PostHog Cloud private API hosts. Public ingestion hosts are not used for analysis queries.

## GitHub

- `GITHUB_TOKEN` is optional.
- Required only when issue or PR delivery is enabled.
- Use least privilege: read-only repo access for analysis; write scopes only for issue/PR creation.

## RevenueCat

- `REVENUECAT_API_KEY` is optional.
- Use a server-side secret API key with read access to charts/metrics, customer information, and project configuration.

## Sentry / GlitchTip

- `SENTRY_AUTH_TOKEN` or account-specific token env names are optional.
- Use read-only scopes for org, project, and event data.

## App Store Connect

- `ASC_KEY_ID`
- `ASC_ISSUER_ID`
- `ASC_PRIVATE_KEY_PATH`

Use Sales for analytics reports. Add Customer Support for reviews and Developer for builds/TestFlight only when those signals are needed.
