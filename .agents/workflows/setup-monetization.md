---
description: Implement and verify monetization and security enhancements
---

This workflow outlines the steps to implement and verify the security (PII masking, rate limiting) and monetization (subscription gating) features for MarketX.

### 1. Implementation Checklist

Ensure the following core modules are present:
- [lib/rate-limit.ts](file:///home/mathu/projects/markets/src/lib/rate-limit.ts): Redis-backed rate limiter.
- [lib/subscription.ts](file:///home/mathu/projects/markets/src/lib/subscription.ts): Subscription tier definitions and helpers.
- [lib/ai/gemini.ts](file:///home/mathu/projects/markets/src/lib/ai/gemini.ts): Includes `maskPII` logic.

### 2. Dependency Check
// turbo
Run `npm list ioredis @prisma/client` to ensure required dependencies are installed.

### 3. Verification

Run the unified verification script to test PII masking and Rate Limiting:
// turbo
`npx tsx scripts/verify-enhancements.ts`

### 4. API Integration Test (Experimental)
If Jest is configured correctly, run:
`npm test src/app/api/ai/advisor/advisor.test.ts`

### 5. Deployment Notes
- Ensure `REDIS_URL` and `ENCRYPTION_KEY` are set in the production environment.
- Confirm `user.subscriptionTier` exists in the database schema.
