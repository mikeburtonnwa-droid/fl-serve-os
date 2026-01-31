# SERVE OS

AI Implementation Operating System by Frontier Logic.

## Overview

SERVE OS is an internal tool that guides consultants through the SERVE methodology (Standardize, Establish, Re-engineer, Verify, Expand) with AI-powered stations, human-in-the-loop governance, and comprehensive audit logging.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI**: Anthropic Claude API
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## Getting Started

### 1. Clone and Install

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the schema in `supabase/schema.sql` in the SQL Editor
3. Copy your project URL and anon key from Project Settings > API

### 3. Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your credentials:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ANTHROPIC_API_KEY`

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
serve-os/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── (auth)/          # Login/Register pages
│   │   ├── (dashboard)/     # Protected dashboard pages
│   │   └── api/             # API routes
│   ├── components/          # React components
│   │   ├── ui/              # Reusable UI components
│   │   ├── layout/          # Layout components
│   │   └── auth/            # Auth components
│   ├── lib/                 # Utilities and configurations
│   │   └── supabase/        # Supabase client setup
│   ├── types/               # TypeScript type definitions
│   └── hooks/               # Custom React hooks
├── supabase/
│   └── schema.sql           # Database schema
└── public/                  # Static assets
```

## Features

- **Client Management**: Track and manage client relationships
- **Engagement Workflows**: Three service pathways (Knowledge Spine, ROI Audit, Workflow Sprint)
- **AI Stations**: Controlled AI execution with governance
- **Artifact Management**: Document generation and approval workflows
- **Audit Logging**: Complete compliance trail

## Deployment

Deploy to Vercel:

```bash
vercel
```

Or connect your GitHub repository to Vercel for automatic deployments.

## License

Proprietary - Frontier Logic
