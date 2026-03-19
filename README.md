# glassrevival

A full-stack fitness tracking application with AI integration. Built as a React/TypeScript SPA with Express backend, PostgreSQL database via Drizzle ORM, and authentication.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui components
- **Backend:** Express.js, Node.js
- **Database:** PostgreSQL (Neon), Drizzle ORM
- **Authentication:** Passport.js (local strategy), express-session
- **AI Integration:** OpenRouter API (configurable models)
- **UI Components:** Radix UI primitives, Framer Motion, Recharts

## Getting Started

### Prerequisites

- Node.js
- PostgreSQL database

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description |
|----------|-------------|
| `VITE_OPENROUTER_API_KEY` | OpenRouter API key from https://openrouter.ai/ |
| `VITE_AI_MODEL` | AI model selection (default: x-ai/grok-4-fast:free) |

### Running

```bash
npm run dev       # Development server
npm run build     # Production build
npm run start     # Production server
```

### Database

```bash
npm run db:push   # Push schema changes to database
```

## Project Structure

```
glassrevival/
├── client/         # React frontend source
├── server/         # Express backend
├── shared/         # Shared types and schemas
├── attached_assets/# Static assets
├── docs/           # Documentation
└── components.json # shadcn/ui configuration
```

## License

MIT License
