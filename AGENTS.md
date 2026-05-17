# AGENTS.md

## Operating Principles

- State assumptions before implementing when the request has multiple plausible interpretations.
- Keep changes surgical. Touch only the files needed for the requested outcome.
- Prefer the simplest working change over new abstraction or speculative flexibility.
- Match the style already used in this repository.
- Do not remove unrelated dead code or reformat adjacent files.

## Project Context

This repository packages the `posthog-growth-engineer` Codex skill. The canonical product behavior lives in `SKILL.md`; update that file only when changing the skill contract itself.

Key areas:

- `SKILL.md`: skill metadata, usage rules, and operating contract.
- `scripts/`: Node.js command-line helpers for setup, preflight, exports, status, and runner workflows.
- `tests/`: Node test files for the scripts and generated behavior.
- `references/`: supporting setup, schema, and connector documentation.
- `data/posthog-growth-engineer/*.example.json`: safe example inputs.

## Shell And Editing

- Prefix shell commands with `rtk` when it is available in this workspace.
- Use `rg` or `rg --files` for searches before slower alternatives.
- Use `apply_patch` for manual edits.
- Do not commit generated runtime files, local configs, state, secrets, or `.openclaw/` output.
- Never ask the user to paste secrets into chat. Use MCP OAuth, secure local config, environment variables, or `~/.config/posthog-growth/secrets.env` with mode `600`.

## PostHog Contract

- Treat PostHog MCP as the analytics baseline.
- Do not introduce or recommend a separate analytics CLI for this fork.
- Keep PostHog queries bounded by an explicit recent window.
- Use direct PostHog API fallback only when MCP is unavailable and the documented fallback environment variables are configured.
- Keep GitHub write actions disabled unless the user explicitly asks for them.

## Verification

- For script or behavior changes, run `npm run quality`.
- For docs-only changes, still run `npm run quality` when feasible because the repository is small.
- After completing a task, use the Refactor Pass skill and keep any cleanup limited to mistakes introduced by the current change.
