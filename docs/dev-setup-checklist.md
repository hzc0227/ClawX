# ClawX Dev Setup Checklist

This document captures the baseline local development checks for ClawX secondary development, with a focus on Electron + bundled OpenClaw readiness.

## Goal

Use this checklist before starting feature development so the team can confirm a machine is ready for:

- local Electron development
- bundled OpenClaw runtime development
- type checking and unit testing
- packaging-related resource preparation

## Setup Checklist

- `Node.js` is installed
- `corepack` is available
- `pnpm` matches the version pinned in `package.json`
- repository is cloned successfully
- working tree is clean before branch switching
- `pnpm-lock.yaml` exists
- `node_modules` is installed
- `openclaw` dependency is present in local source dependencies
- bundled `uv` binary is downloaded into `resources/bin/<platform-arch>/uv`
- `pnpm run typecheck` passes
- `pnpm test` passes
- `pnpm dev` starts successfully

## Commands

Run these in the repository root:

```bash
node -v
corepack --version
pnpm -v
git status --short
test -f pnpm-lock.yaml && echo lockfile-present || echo lockfile-missing
test -d node_modules && echo installed || echo missing
pnpm install
pnpm run uv:download
pnpm run typecheck
pnpm test
pnpm dev
```

## Verified Result On 2026-03-18

Environment that was checked:

- OS: macOS arm64
- repo path: `/Users/hanzhichao7/Documents/code/JoyClaw/ClawX`
- branch at verification time: `main`

Observed results:

- `node -v` -> `v24.13.0`
- `corepack --version` -> `0.34.5`
- `pnpm -v` -> `10.31.0`
- working tree was clean before branch creation
- `pnpm install` completed successfully
- local `openclaw` dependency resolved to version `2026.3.13`
- `pnpm exec zx scripts/download-bundled-uv.mjs` completed successfully
- bundled `uv` was created at `resources/bin/darwin-arm64/uv`
- `pnpm run typecheck` passed
- `pnpm test` passed with `47` test files and `249` tests
- `pnpm dev --host 127.0.0.1` reached the `predev` stage successfully

## Notes

- ClawX bundles OpenClaw as an application dependency. Developers do not need to install a separate standalone OpenClaw for source development, but they do need the project dependencies installed locally.
- `pnpm dev` prepares preinstalled skills during startup. In restricted corporate network environments, access to upstream skill repositories may need to be mirrored or replaced with internal sources.
- The local npm and pnpm registry were unified to `https://registry.npmmirror.com/` during setup to reduce source inconsistency.
- The repository `.npmrc` contains pnpm-oriented options. `npm` may print warnings when reading them, but the registry setting can still apply successfully.

## JdiCLaw Data Isolation

JdiCLaw no longer reuses the user's default `~/.openclaw` directory by default.

The desktop app now manages an isolated OpenClaw state directory under the app data path:

- macOS dev path example: `~/Library/Application Support/jdiclaw/openclaw`

This isolated directory is used for:

- `openclaw.json`
- skills
- extensions
- credentials
- agents
- sessions
- workspace
- outbound media staging

### Why This Matters

- prevents JdiCLaw from automatically loading the developer's historical personal OpenClaw data
- keeps enterprise product data separate from local experimental CLI usage
- makes support, migration, and troubleshooting more predictable

### How It Works

JdiCLaw now injects OpenClaw runtime environment overrides when starting the embedded runtime:

- `OPENCLAW_STATE_DIR`
- `OPENCLAW_CONFIG_PATH`
- `OPENCLAW_WORKSPACE_DIR`

### Verification

After startup, confirm logs and generated files point to the isolated app directory instead of `~/.openclaw`.

Examples observed during verification:

- skills installed under `~/Library/Application Support/jdiclaw/openclaw/skills`
- plugins installed under `~/Library/Application Support/jdiclaw/openclaw/extensions`
- workspace under `~/Library/Application Support/jdiclaw/openclaw/workspace`

## Recommended Team Workflow

1. Run the checklist on a new machine before feature work starts.
2. Create a dedicated feature branch before making any product changes.
3. Keep package manager usage consistent across the team and prefer `pnpm`.
4. If startup depends on external skill sources, document the company-approved mirrors or internal replacements.
