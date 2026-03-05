# ⚡ GYM-AI

> AI-powered fitness app that builds personalized workout plans, tracks your progress, and levels you up — literally.

Built with a dark neon aesthetic and a RAG pipeline under the hood. No generic plans. No cookie-cutter routines. Just workouts that actually match your goals, equipment, and fitness level.

---

## 📸 Screenshots

| Dashboard | Workout Tracker | Exercise Library |
|-----------|----------------|-----------------|
| ![Dashboard](./docs/screenshots/dashboard.png) | ![Tracker](./docs/screenshots/tracker.png) | ![Library](./docs/screenshots/library.png) |

> _Screenshots coming soon_

---

## 🧰 Tech Stack

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Gemini_2.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Server Components) |
| UI | shadcn/ui · Radix UI · Framer Motion · Lucide |
| Styling | Tailwind CSS v4 · Space Grotesk font |
| Auth & DB | Supabase (RLS enforced, pgvector for similarity search) |
| AI | Google Gemini 2.5 Flash + gemini-embedding-001 |
| Language | TypeScript 5 |

---

## ✨ Features

### 🤖 AI-Powered Recommendations (RAG Pipeline)
- Gemini 2.5 Flash generates personalized module plans based on your profile
- Exercise queries embedded via `gemini-embedding-001` (768 dims, MRL truncation)
- pgvector cosine similarity search matches you to the best exercises from the library
- Results cached for 60 days — fast returns, zero redundant API calls

### 🔐 Auth & Onboarding
- Email/password auth via Supabase with server-side session management
- 6-step onboarding wizard: personal info → fitness goals → activity level → equipment → body metrics → preferences
- Supported goals: lose fat · build muscle · strength · general health · athletic performance

### 🏋️ Workout System
- **AI module recommendations** with percentage match score
- **Exercise Library** filterable by category (Push · Pull · Legs · Core)
- **Workout Tracker** — log sets, reps, and weight (kg) per exercise in real time
- **Training Log** — full history with duration, RPE, and date

### 🎮 Gamification
- XP system with progressive levels (starting at Sedentary)
- Level progression tied to logged workouts and consistency

### 🌐 Internationalization
- English / Spanish toggle via cookie-based locale
- All UI strings, exercise names, and AI-generated module titles are localized

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project with pgvector enabled
- A [Google AI Studio](https://aistudio.google.com) API key

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/gym-ai.git
cd gym-ai/gym-app
npm install
```

### Environment Variables

Create `gym-app/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key
```

### Run

```bash
npm run dev       # Dev server → http://localhost:3000
npm run build     # Production build
npm run lint      # ESLint
```

After seeding your exercise library, generate embeddings once:

```
GET http://localhost:3000/api/setup-ai
```

---

## 📁 Project Structure

```
gym-ai/
└── gym-app/
    ├── src/
    │   ├── app/
    │   │   ├── (auth)/login/         # Login & signup pages
    │   │   ├── onboarding/           # 6-step onboarding wizard
    │   │   ├── workouts/
    │   │   │   ├── [id]/             # Workout detail & tracker
    │   │   │   └── new/              # Create new workout
    │   │   ├── log/                  # Training history
    │   │   ├── stats/                # Progress & statistics
    │   │   ├── profile/              # User settings
    │   │   └── page.tsx              # Dashboard (Server Component)
    │   ├── lib/
    │   │   ├── ai/
    │   │   │   └── recommendations.ts  # Full RAG pipeline
    │   │   └── supabase/
    │   │       ├── queries.ts          # All DB queries
    │   │       ├── server.ts           # Server-side Supabase client
    │   │       ├── client.ts           # Browser Supabase client
    │   │       └── database.types.ts   # Auto-generated DB types
    │   ├── components/               # Shared UI components
    │   └── middleware.ts             # Auth guard + session refresh
    └── scripts/
        └── seed-exercises.sql        # 120+ exercises (EN + ES)
```

---

## 🗺️ Roadmap

- [x] Supabase Auth (login / signup)
- [x] Multi-step onboarding wizard
- [x] AI workout module recommendations (RAG)
- [x] Exercise Library with category filters
- [x] Workout tracker (sets · reps · kg)
- [x] Training log with history
- [x] XP & level gamification system
- [x] EN / ES internationalization
- [x] Dark neon UI
- [ ] Progress charts & body metrics over time
- [ ] Social features — share workouts, follow friends
- [ ] Native mobile app (React Native / Expo)
- [ ] Push notifications for workout reminders
- [ ] Wearable integration (Apple Health, Google Fit)

---

## 📄 License

MIT © [Your Name](https://github.com/YOUR_USERNAME)
