# MarketX

MarketX is a comprehensive financial dashboard, trading simulator, and AI-powered wealth management platform built with Next.js. It helps users track their portfolios, analyze market data, manage budgets, and make informed financial decisions using personalized AI insights.

## ✨ Features

### 📈 Trading & Portfolio
- **Paper Trading Simulation:** Execute simulated buy/sell orders (Market & Limit) using the Alpaca API.
- **Real-Time Market Data:** Live quotes, charts, and news for Stocks, Crypto, and Forex using multiple data providers (FMP, Finnhub, EODHD).
- **Watchlists:** Track your favorite assets with custom watchlists.
- **Portfolio Analytics:** Track performance, view recent trades, and manage active positions.

### 🤖 AI Financial Advisor
- **Portfolio Analysis:** Get holistic, AI-driven analysis of your overall financial health, budgets, and portfolio.
- **Interactive Chatbot:** Ask general or specific financial questions and get answers powered by Google Gemini.
- **Trading Suggestions:** Receive contextual trading ideas with confidence scores and risk levels.
- **Smart Product Recommendations:** Relevant affiliate product suggestions based on user profiles.

### 💰 Finance & Budgeting
- **Goal Tracking:** Set and track progress towards financial goals.
- **Budget Management:** Create and monitor monthly budgets across different categories.
- **Transaction History:** Detailed logs of your simulated financial activity.

### 🔐 Security & Auth
- **NextAuth.js Integration:** Secure credentials-based authentication.
- **Two-Factor Authentication (2FA):** Enhanced security via TOTP Authenticator apps.
- **Role-Based Access Control:** Dedicated Admin and Superadmin dashboards.
- **Rate Limiting:** IP and user-based rate-limiting using Redis to protect public and authenticated API endpoints.

### 💎 Subscriptions (Monetization)
- **Tiered Plans:** Free, Premium, and Pro subscription options.
- **Stripe Integration:** Fully integrated Stripe Checkout for upgrades, Webhooks for state synchronization, and Customer Portal for managing active subscriptions.
- **Usage Quotas:** Tier-based limits on AI calls, watchlists, and feature access.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL with [Prisma ORM](https://www.prisma.io/)
- **Authentication:** [NextAuth.js](https://next-auth.js.org/) (Auth.js)
- **Styling:** CSS Modules with glassmorphic, modern design patterns
- **AI Integration:** Google Generative AI (Gemini)
- **External APIs:** Stripe, Alpaca (Trading), FMP / Finnhub / EODHD (Market Data)
- **Caching/Rate Limit:** Redis

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- Node.js (v18 or higher)
- PostgreSQL
- Redis Server (for rate limiting)

### 1. Clone the repository

```bash
git clone <repository-url>
cd markets
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env.local` file in the root of the project. You can copy the structure from `.env.example` if available. You will need API keys for:
- Database connection strings (`DATABASE_URL`)
- NextAuth configuration (`NEXTAUTH_URL`, `NEXTAUTH_SECRET`)
- Free market data APIs (FMP, Finnhub, EODHD)
- Alpaca Paper Trading (`ALPACA_API_KEY_ID`, `ALPACA_API_SECRET`)
- Redis (`REDIS_URL`)
- Google Gemini API (`GOOGLE_GENERATIVE_AI_API_KEY`)
- Stripe API keys (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`)

### 4. Database Setup

Initialize the database schema and apply migrations:

```bash
npx prisma generate
npx prisma db push
```

*(Optional)* Seed the database with initial configurations or test users if a seed script is provided:
```bash
npx tsx scripts/seed-finance-data.ts
```

### 5. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

---

## 📁 Project Structure highlights

- `src/app/`: Next.js App Router pages and API endpoints. 
  - `api/`: REST endpoints for trading, ai, auth, admin, etc.
  - `advisor/`: AI Chatbot and Portfolio Analysis page.
  - `pricing/`: Stripe Payment integration and Tier comparison.
  - `(market, stocks, crypto, forex)/`: Market data exploration.
- `src/components/`: Reusable React components (UI, Auth, Client layouts).
- `src/hooks/`: Custom React hooks for data fetching and state management (`useChat`, `useAdvisor`, `useMarketData`).
- `src/lib/`: Core utilities, including DB clients, Stripe utilities, Gemini API wrapper, API rate limiters, and authentication helpers.
- `prisma/`: Database schema (`schema.prisma`).

---

## 🔒 Security Practices
- Environment variables are strictly typed and never exposed to the client unless prefixed with `NEXT_PUBLIC_`.
- Sensitive AI prompts strip off Personal Identifiable Information (PII) before making requests to LLMs.
- All user-mutating API routes perform robust session validation.
- Critical actions are rate-limited via a Redis token-bucket implementation.

## 📄 License
This project is proprietary and confidential.
