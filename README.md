# Project Velon

Full-stack fitness tracking app — workouts, meals, fasting, health metrics, and AI coaching.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-4.1-38bdf8)
![MongoDB](https://img.shields.io/badge/MongoDB-7-green)

## Features

- **Workout Logger** — Log sets/reps/weight, 1300+ seeded exercises, AI-powered session parsing
- **AI Coach** — Post-workout analysis with progression recommendations, volume balance, and plateau detection
- **Calorie Tracker** — USDA food search, macro tracking, meal logging with date filtering
- **Fasting Timer** — Multiple protocols (16:8, 18:6, 20:4, 24h), real-time progress
- **Health Metrics** — Weight, body fat, BMI, BMR/TDEE calculations with progress charts
- **Health Calculators** — BMI, BMR, TDEE, body fat percentage
- **Responsive UI** — Glassmorphic dark theme, mobile-first

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Backend | Next.js API routes, proxy.ts (auth middleware) |
| Database | MongoDB 7 (native driver, no Mongoose) |
| Auth | JWT session cookies via `jose`, HttpOnly cookies |
| AI | Google Gemini (`@google/genai`) |
| External | USDA FoodData Central API |

## Quick Start

### Prerequisites
- Node.js 18+
- Docker (for MongoDB)

### 1. Start MongoDB
```bash
docker run -d --name velon-mongo -p 27017:27017 mongo:7
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
MONGODB_URI=mongodb://localhost:27017/fitness_website
JWT_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
GEMINI_API_KEY=       # optional, for AI coach
USDA_API_KEY=DEMO_KEY
```

### 4. Create indexes (one-time)
```bash
node scripts/create-indexes.mjs
```

### 5. Run
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npx tsc --noEmit` | Typecheck |
| `npx eslint app/ lib/ --ext .ts,.tsx` | Lint |
| `node scripts/smoke-test.mjs` | Run smoke tests (25 tests) |
| `node scripts/create-indexes.mjs` | Create MongoDB indexes |

## Project Structure

```
├── app/
│   ├── api/                  # API routes (24 endpoints)
│   │   ├── auth/             # login, signup, logout, me, status
│   │   ├── chat/             # AI coach chat
│   │   ├── coach/            # Post-workout AI analysis
│   │   ├── exercises/        # search, seed, import, export
│   │   ├── fasting/          # fasting sessions
│   │   ├── food/             # USDA search, image analysis
│   │   ├── meals/            # meal tracking
│   │   ├── metrics/          # health metrics
│   │   ├── user/             # profile, preferences, stats
│   │   ├── workout-sessions/ # sessions, parse, planned
│   │   ├── workout-templates/# templates CRUD
│   │   └── workouts/         # legacy workout CRUD
│   ├── components/           # React components
│   ├── hooks/useAuth.ts      # Client auth hook
│   ├── types/                # TypeScript types
│   └── utils/                # Utility functions
├── lib/
│   ├── auth.ts               # JWT helpers, session management
│   ├── coach-engine.ts       # Deterministic coaching logic
│   ├── csv.ts                # CSV parse/serialize
│   ├── logger.ts             # Structured logger with PII stripping
│   └── mongodb.ts            # MongoDB connection
├── scripts/
│   ├── create-indexes.mjs    # Database index setup
│   └── smoke-test.mjs        # API smoke tests
├── proxy.ts                  # Auth middleware (Next.js 16)
└── package.json
```

## API Endpoints

All endpoints require auth via session cookie unless noted.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Login (rate-limited) |
| POST | `/api/auth/logout` | Clear session |
| GET | `/api/auth/me` | Current user |
| GET | `/api/auth/status` | Auth status |
| GET/POST | `/api/workout-sessions` | List/create sessions |
| GET/PUT/DELETE | `/api/workout-sessions/[id]` | Session CRUD |
| POST | `/api/workout-sessions/parse` | AI-powered workout parsing |
| POST | `/api/workout-sessions/planned` | Create planned session |
| GET/POST | `/api/workout-templates` | List/create templates |
| GET/PUT/DELETE | `/api/workout-templates/[id]` | Template CRUD |
| POST | `/api/coach` | Generate AI coaching feedback |
| POST | `/api/chat` | AI coach chat |
| GET/POST | `/api/meals` | List/create meals |
| DELETE | `/api/meals/[id]` | Delete meal |
| GET/POST | `/api/fasting` | List/create fasting sessions |
| PATCH | `/api/fasting/[id]` | Update fasting session |
| GET/POST | `/api/metrics` | List/create health metrics |
| GET/POST | `/api/exercises` | List/create exercises |
| GET | `/api/exercises/search` | Search exercises |
| POST | `/api/exercises/seed` | Seed exercise database |
| POST | `/api/exercises/import` | CSV import |
| GET | `/api/exercises/export` | CSV export |
| GET | `/api/food/search` | USDA food search |
| POST | `/api/food/analyze-image` | Food image analysis (stub) |
| GET/POST | `/api/user/preferences` | User preferences |
| PUT | `/api/user/profile` | Update profile |
| GET | `/api/user/stats` | Dashboard stats |
| GET/POST | `/api/workouts` | Legacy workout CRUD |
| DELETE | `/api/workouts/[id]` | Delete legacy workout |

## License

Public - Open Source
