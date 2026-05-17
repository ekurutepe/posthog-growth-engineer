#!/usr/bin/env bash
set -euo pipefail

cat <<'EOF'
PostHog MCP setup

Run the official PostHog wizard in the host shell:

  npx @posthog/wizard mcp add

Use OAuth when available. If your MCP client does not support OAuth,
configure https://mcp.posthog.com/mcp with:

  Authorization: Bearer <POSTHOG_PERSONAL_API_KEY>

Do not paste the key into chat. Store it in your MCP client, host env,
or a secret manager.
EOF
