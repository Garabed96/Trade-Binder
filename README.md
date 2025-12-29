# Trade Binder

A modern Magic: The Gathering marketplace and collection management platform where players can buy, sell, and organize their card collections in digital binders.

## Features

- 🃏 **Card Marketplace** - Buy and sell Magic: The Gathering cards with other players
- 📚 **Digital Binders** - Create and organize your personal card collection in customizable binders
- 🔍 **Advanced Search** - Find cards quickly with powerful filtering and search capabilities
- 🌐 **Multi-language Support** - Available in multiple languages
- 🌓 **Dark Mode** - Toggle between light and dark themes for comfortable viewing
- 📱 **Responsive Design** - Seamless experience across desktop, tablet, and mobile devices

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Slonik SQL 
- **API**: tRPC for type-safe API routes
- **Card Data**: Scryfall API integration (Self-hosted, periodically refresh w/ their API)
- **Package Manager**: pnpm
- **Monorepo**: Turborepo

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- PostgreSQL database

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/trade-binder.git
cd trade-binder
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp apps/web/.env.example apps/web/.env
```

Edit `.env` and add your database connection string:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/tradebinder"
```

4. Run database migrations:
```bash
pnpm migrate
```

5. Start the development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see your application.

## Development

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm migrate` - Push database schema changes

### Project Structure
```
trade-binder/
├── apps/
│   └── web/              # Next.js application
│       ├── src/
│       │   ├── app/      # App router pages
│       │   ├── components/  # React components
│       │   ├── lib/      # Utilities and configurations
│       │   └── server/   # tRPC routers and database
│       └── public/       # Static assets
├── packages/             # Shared packages (if any)
└── turbo.json           # Turborepo configuration
```

## License

[MIT License](LICENSE)

## Acknowledgments

- Card data provided by [Scryfall](https://scryfall.com)
- Built with [Next.js](https://nextjs.org)
- Font optimization with [Geist](https://vercel.com/font)

---

**Note**: This project is not affiliated with or endorsed by Wizards of the Coast.