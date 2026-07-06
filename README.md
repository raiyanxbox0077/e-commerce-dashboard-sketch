# LarynxAI Dashboard

A multi-tenant SaaS dashboard for AI-powered voice calls, Shopify order management, and WhatsApp CRM — built with Next.js 16, Supabase, and Tailwind CSS v4.

## Quick Links

- [Live App (Vercel)](https://v0.app/chat/projects/prj_0UzcplpuFANwL7ahhaUnMVzboKry)
- [Continue on v0](https://v0.app/chat/projects/prj_0UzcplpuFANwL7ahhaUnMVzboKry)

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## LLM Context Files

For AI-assisted development, read these files first:

| File | Contents |
|------|----------|
| `ARCHITECTURE.md` | Full system architecture, data flow, auth model |
| `API.md` | All API routes with request/response shapes |
| `DESIGN_SYSTEM.md` | Design tokens, component patterns, CSS utilities |
| `DATABASE.md` | Supabase schema, RLS, tenant model |
| `INTEGRATIONS.md` | Dograh voice API, BotSailor WhatsApp, Shopify, Razorpay |
| `DEVELOPMENT.md` | Setup, conventions, gotchas |
| `DEPLOY.md` | Self-host on Hetzner VPS (copy-paste guide, port 3721) |

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Auth + DB**: Supabase (email/password, RLS)
- **Styling**: Tailwind CSS v4 + Apple design system
- **State**: SWR (server-state), React useState (local UI)
- **Payments**: Razorpay
- **Analytics**: Vercel Analytics
- **Package manager**: pnpm
