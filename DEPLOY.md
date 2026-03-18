# SubTrack — Deployment Guide

This document covers every command needed to build and deploy SubTrack to InsForge from scratch.

---

## Prerequisites

| Tool | Install |
|------|---------|
| Node.js ≥ 18 | https://nodejs.org |
| npm | bundled with Node |
| InsForge CLI | `npm install -g @insforge/cli` (or use `npx`) |

---

## 1. Link the Project to InsForge

Run once per machine / fresh checkout:

```bash
npx @insforge/cli link --project-id 01dc022b-f575-4948-b07c-75716d058e05
```

This writes a `.insforge` config file that the CLI reads during deployment.

---

## 2. Install Frontend Dependencies

```bash
cd frontend
npm install --legacy-peer-deps
```

`--legacy-peer-deps` is required because `react-native-razorpay` has peer-dep conflicts with Expo 51.

---

## 3. Build the Web Bundle

```bash
cd frontend
npx expo export --platform web
```

Output goes to `frontend/dist/`. This is the static web bundle (HTML + JS + assets).

---

## 4. Deploy to InsForge

Run from the project root (where `.insforge` config lives):

```bash
npx @insforge/cli deployments deploy frontend/dist
```

The CLI compresses the `frontend/dist/` folder, uploads it, and deploys it as a static site.

**Live URL:** https://si2r3edb.insforge.site

---

## Full End-to-End Script (copy-paste)

```bash
# 1. Link project (only needed once)
npx @insforge/cli link --project-id 01dc022b-f575-4948-b07c-75716d058e05

# 2. Install deps
cd frontend
npm install --legacy-peer-deps

# 3. Build
npx expo export --platform web

# 4. Deploy (run from project root)
cd ..
npx @insforge/cli deployments deploy frontend/dist
```

---

## Re-deploy After Code Changes

Once already linked, only steps 3–4 are needed:

```bash
cd frontend && npx expo export --platform web && cd ..
npx @insforge/cli deployments deploy frontend/dist
```

---

## Deployment History

| Date       | Deployment ID                          | Notes |
|------------|----------------------------------------|-------|
| 2026-03-18 | 1b1c461f-8d25-4a18-90b5-46d7ffd74970  | Initial deploy — all bugs fixed |
| 2026-03-18 | 77e0fd61-1021-4364-91b4-b0d92965637f  | Premium UI redesign |
| 2026-03-18 | eb601ab1-63a4-4807-a28f-2f6cbf596650  | Fix subscription add (allSettled) |

---

## Environment Variables

Set in `frontend/src/config.js` or via `EXPO_PUBLIC_*` env vars:

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_INSFORGE_URL` | InsForge project base URL |
| `EXPO_PUBLIC_INSFORGE_ANON_KEY` | InsForge anon key |
| `EXPO_PUBLIC_WEB_UPGRADE_URL` | Fallback Razorpay web checkout URL |

---

## InsForge MCP Server (for Claude integration)

```bash
npx @insforge/install --client claude-code \
  --env API_KEY=ik_65e9bf64b6e8d6240373a7f4ce8602f2 \
  --env API_BASE_URL=https://si2r3edb.ap-southeast.insforge.app
```
