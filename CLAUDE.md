# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Trade Binder is a Magic: The Gathering marketplace and collection management platform. Players can buy, sell, and
organize their card collections in digital binders.

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Slonik SQL client
- **API**: tRPC for type-safe API routes
- **Authentication**: NextAuth
- **Migrations**: Ley
- **Card Data**: Scryfall API integration (self-hosted on vercel neon postgreSQL, periodically refreshed)
- **Package Manager**: pnpm 9+
- **Monorepo**: Turborepo
- **Node Version**: 20+

## Development Commands

### Root (Monorepo)

```bash
pnpm dev              # Setup database, run migrations, start dev server
pnpm build            # Build all apps for production
pnpm lint             # Run ESLint across all apps
pnpm type-check       # Run TypeScript type checking
pnpm test             # Run Vitest tests
pnpm test:watch       # Run Vitest in watch mode
pnpm setup-db         # Start database and run migrations only
pnpm clean            # Clean turbo cache and node_modules
```

### Web App (apps/web/)

```bash
pnpm dev                # Start dev server only (no DB setup)
pnpm build              # Build for production
pnpm start              # Start production server
pnpm lint               # Run ESLint
pnpm type-check         # Run TypeScript type checking

# Database
pnpm start-docker       # Start PostgreSQL container
pnpm restart-docker     # Restart PostgreSQL container
pnpm migrate            # Run database migrations
pnpm migrate:rollback   # Rollback last migration
pnpm migrate:status     # Check migration status
pnpm peek-db            # Quick look at database tables

# Data Import
pnpm import-cards       # Import card data from Scryfall
```

## Architecture

### tRPC API Layer

The API is organized in `apps/web/src/server/`:

- **`trpc.ts`**: Root tRPC context file containing:
  - `protectedProcedure`: Requires authentication (blocks by authorization)
  - `publicProcedure`: Available to all users
- **`routers/`**: Domain-specific routers (card, binder, inventory, marketplace, profile, user)
  - `_app.ts`: Root router that merges all domain routers
  - Each router uses Zod schemas for input validation and type-safe SQL queries
- **`__test__/`**: Unit tests for tRPC routers

### Database Layer (Slonik)

- Type-safe SQL queries using Slonik throughout the codebase
- Primary usage in `apps/web/src/scripts/import-cards.ts`:
  - Fetches Scryfall bulk data JSON (~100k cards)
  - Caches and imports cards into PostgreSQL database tables
- Migrations managed with Ley in `apps/web/src/migrations/`

### Authentication

- NextAuth configured with standard boilerplate setup
- Integration with tRPC via `protectedProcedure` for authenticated routes

### Component Organization

- **Feature components**: Located directly in `src/components/` (e.g., Navbar, FuzzySearchBar, BinderPageContent, FilterBar)
- **UI primitives**: Located in `src/components/ui/` (button, card, drawer, tabs) - shadcn/ui-style components
- Components are colocated by feature rather than by type

### Monorepo Structure

```
trade-binder/
├── apps/
│   └── web/              # Main Next.js application
│       ├── src/
│       │   ├── app/      # Next.js App Router pages
│       │   ├── components/  # React components
│       │   ├── lib/      # Utilities and configurations
│       │   ├── server/   # tRPC routers and database layer
│       │   ├── migrations/  # Ley database migrations
│       │   └── scripts/  # Utility scripts (e.g., import-cards.ts)
│       └── public/       # Static assets
├── packages/             # Shared packages (if any)
└── scripts/              # Root-level scripts (e.g., setup-db.sh)
```

### Database Setup

The project uses Docker/Podman for PostgreSQL. The `pnpm dev` command automatically:

1. Creates a `.env` file with default database configuration (if missing)
2. Starts PostgreSQL in Docker
3. Runs migrations via Ley
4. Starts the Next.js dev server

Database queries use Slonik for type-safe SQL with PostgreSQL.

### Environment Variables

Default `.env` is auto-generated during `pnpm dev`. Check `apps/web/.env.example` if it exists for required variables.

### Package Manager

This project uses **pnpm** with workspaces. Do not use npm or yarn.

## Key Features

- Card marketplace (buy/sell MTG cards)
- Digital binders for collection management
- Advanced search and filtering
- Multi-language support (i18next)
- Dark mode (next-themes)
- Responsive design

## Notes

- The project is not affiliated with or endorsed by Wizards of the Coast
- Card data provided by Scryfall API
- Migrations are managed with Ley (see `apps/web/src/migrations/`)
- Git hooks managed by Husky with lint-staged for pre-commit linting
