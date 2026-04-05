---
title: "fix: Pre-launch hardening for IP4 application"
type: fix
status: completed
date: 2026-04-05
---

# Pre-Launch Hardening for IP4 Application

## Overview

The IP4 conference application system was vibe-coded and needs hardening before being sent to thousands of applicants. A comprehensive code review and browser testing session surfaced 25 findings across security, correctness, performance, reliability, and cross-browser compatibility. This plan addresses all of them.

## Problem Frame

The app will be used by thousands of people to apply to a curated conference. The most critical failure mode is that ~40% of users (Safari/iOS) cannot record video at all. Secondary concerns include in-memory state that doesn't survive Vercel serverless cold starts, admin panel performance that will degrade as submissions grow, and several security gaps.

## Requirements Trace

- R1. Video recording must work on Safari/iOS (currently broken)
- R2. Rate limiting must persist across serverless cold starts
- R3. Session security must not rely on hardcoded fallback secrets
- R4. Admin panel must handle thousands of submissions without OOM/timeout
- R5. CSV export must be restricted to admin role only
- R6. Dead code (email verification) should be removed
- R7. All P2/P3 findings from the review should be addressed
- R8. No new dependencies that require provisioning additional services (use existing PostgreSQL)

## Scope Boundaries

- Not overhauling admin auth (keeping shared password model per user decision)
- Not adding OAuth or per-user passwords
- Not restructuring the monolithic apply/page.tsx (P3, cosmetic)
- Not adding end-to-end test suite (separate effort)

## Key Technical Decisions

- **PostgreSQL for rate limiting instead of Redis/Vercel KV**: The project already has a PostgreSQL database. Adding a `RateLimit` table avoids provisioning a new service. Write load is minimal (one upsert per application submission, not per page view).
- **Delete email verification entirely**: The feature is disabled, never sends emails, and the in-memory code storage is broken on serverless. Removing it simplifies the codebase and eliminates a broken code path.
- **Safari MediaRecorder fix via codec negotiation**: Check `MediaRecorder.isTypeSupported()` with fallback chain: VP9 -> VP8 -> MP4. Update blob type and upload content-type to match.
- **Database-level pagination for admin**: Replace in-memory fetch-all-then-paginate with Prisma `skip`/`take` and SQL-level aggregation for scores.
- **R2 client lazy initialization**: Replace module-level `new S3Client()` with lazy getter to avoid crash when env vars aren't set.

## Implementation Units

### Phase 1: Critical Fixes (P0)

- [ ] **Unit 1: Safari/iOS MediaRecorder codec negotiation**

  **Goal:** Make video recording work on Safari, iOS Safari, and all modern browsers.

  **Requirements:** R1

  **Dependencies:** None

  **Files:**
  - Modify: `src/app/apply/page.tsx` (startRecording function)
  - Modify: `src/app/upload/[token]/page.tsx` (startRecording function)
  - Delete: `src/components/VideoRecorder.tsx` (unused standalone component with same bug)

  **Approach:**
  - Create a helper function `getSupportedMimeType()` that checks `MediaRecorder.isTypeSupported()` in priority order: `video/webm;codecs=vp9,opus` -> `video/webm;codecs=vp8,opus` -> `video/webm` -> `video/mp4` -> empty string (browser default)
  - Use the resolved mime type when constructing `MediaRecorder` and when creating the `Blob`
  - Pass the correct content type through the upload flow (presign request, XHR headers, Blob upload)
  - If no supported type is found, show a clear error message telling the user their browser doesn't support video recording
  - The upload endpoints already accept `video/mp4` in their allowed types lists, so no backend changes needed

  **Patterns to follow:**
  - Existing `startCamera` error handling pattern in `apply/page.tsx` for browser-specific error messages

  **Test scenarios:**
  - Happy path: `getSupportedMimeType()` returns first supported type from the priority chain
  - Edge case: When only `video/mp4` is supported (Safari), function returns `video/mp4` and recording works
  - Edge case: When no types are supported, returns empty string and browser uses default codec
  - Error path: Browser with no MediaRecorder support at all shows helpful error message
  - Integration: Recorded blob type matches the mime type passed to upload presign request

  **Verification:**
  - MediaRecorder construction does not throw on Safari
  - Recorded video plays back correctly in the preview element
  - Upload flow sends correct content-type header matching the actual recording format

- [ ] **Unit 2: Remove email verification system**

  **Goal:** Delete the unused, broken email verification feature entirely.

  **Requirements:** R6

  **Dependencies:** None

  **Files:**
  - Delete: `src/lib/email-verification.ts`
  - Modify: `src/app/api/apply/start/route.ts` (remove verification imports and logic)
  - Modify: `src/app/api/apply/complete/route.ts` (remove verification check)
  - Delete: `src/app/api/apply/verify/route.ts` (entire file)
  - Modify: `src/app/api/apply/[token]/route.ts` (remove verification check and email disclosure)
  - Modify: `src/app/apply/page.tsx` (remove verification step, verification state, resend logic)
  - Modify: `src/app/upload/[token]/page.tsx` (remove verification redirect)
  - Modify: `prisma/schema.prisma` (remove `emailVerified` field from PendingApplication)

  **Approach:**
  - Remove the `isEmailVerificationEnabled()` checks and `createVerificationCode` / `verifyCode` imports from all API routes
  - Remove the "verification" step from the Step type union and all related UI in `apply/page.tsx`
  - Remove the `emailVerified` field from PendingApplication schema (create a migration)
  - Remove the `ENABLE_EMAIL_VERIFICATION` env var from `.env.local` and `.env.example`
  - Remove the verify API route entirely
  - In `apply/start`, always set `requiresVerification: false` in the response (or remove the field)
  - In `apply/[token]`, remove the 403 response that returns the user's email address (fixes email disclosure security issue)
  - In `apply/complete`, remove the `emailVerified` check

  **Patterns to follow:**
  - Clean removal — grep for all references to `emailVerif`, `verifyCode`, `createVerificationCode`, `isEmailVerificationEnabled`, `ENABLE_EMAIL_VERIFICATION`

  **Test scenarios:**
  - Happy path: Application flow goes directly from form submission to video recording (no verification step)
  - Integration: `POST /api/apply/start` response no longer includes `requiresVerification` field
  - Integration: `GET /api/apply/[token]` no longer returns 403 with email address for unverified applications

  **Verification:**
  - No references to email verification remain in the codebase (grep clean)
  - Application flow works end-to-end without verification step
  - Prisma migration runs successfully

- [ ] **Unit 3: Move rate limiting to PostgreSQL**

  **Goal:** Replace in-memory rate limiting with database-backed persistence that survives serverless cold starts.

  **Requirements:** R2

  **Dependencies:** Unit 2 (schema changes should be in one migration)

  **Files:**
  - Modify: `src/lib/rate-limit.ts` (replace Map with Prisma queries)
  - Modify: `prisma/schema.prisma` (add RateLimit model)
  - Modify: `src/app/api/admin/auth/route.ts` (replace in-memory loginAttempts with rate-limit lib)

  **Approach:**
  - Add a `RateLimit` model to Prisma: `id`, `key` (string, indexed), `count` (int), `windowStart` (DateTime), with a unique index on `key`
  - Rewrite `checkRateLimit()` to use an upsert: if a record exists for this key and the window hasn't expired, increment count; if expired or missing, create/reset with count=1
  - Add a cleanup mechanism: either a periodic Vercel Cron endpoint that deletes expired rows, or a simple `deleteMany` call at the start of `checkRateLimit` that prunes rows older than 2 hours (cheap, runs inline)
  - Replace the admin auth route's in-memory `loginAttempts` Map with calls to the shared `checkRateLimit()` function using a `login:${ip}` key
  - Remove all `setInterval` cleanup code (not compatible with serverless anyway)

  **Patterns to follow:**
  - Existing Prisma usage pattern in `src/lib/prisma.ts`
  - Existing rate limit config constants in `RATE_LIMITS`

  **Test scenarios:**
  - Happy path: First request within window succeeds, counter increments
  - Happy path: Request exceeding max within window returns `success: false` with correct `resetAt`
  - Edge case: Window expiry resets the counter — request after window passes succeeds
  - Edge case: Concurrent requests from same IP correctly increment (database handles atomicity)
  - Integration: Admin login rate limiting uses the same database-backed system
  - Integration: Rate limit survives across different function instances (no in-memory state)

  **Verification:**
  - `rate-limit.ts` has no `Map` or `setInterval` references
  - `admin/auth/route.ts` has no `loginAttempts` Map
  - Rate limiting works after Vercel deploy (not reset)

- [ ] **Unit 4: Fix session secret fallback**

  **Goal:** Remove the hardcoded session secret fallback so production can never use a known key.

  **Requirements:** R3

  **Dependencies:** None

  **Files:**
  - Modify: `src/lib/session.ts`

  **Approach:**
  - Remove the `|| "complex_password_at_least_32_characters_long_for_dev_only"` fallback
  - Throw a clear error at the point of session creation if `SESSION_SECRET` is not set
  - For development convenience, check `process.env.NODE_ENV === "development"` and only then allow a generated dev-only fallback (or just require it in `.env.local`)

  **Patterns to follow:**
  - Fail-fast pattern — crash early with a helpful message rather than silently using a weak secret

  **Test scenarios:**
  - Happy path: Session works normally when `SESSION_SECRET` is set
  - Error path: Application throws descriptive error at startup when `SESSION_SECRET` is missing in production

  **Verification:**
  - No hardcoded secret string in `session.ts`
  - Dev environment still works (`.env.local` has `SESSION_SECRET`)

### Phase 2: High-Priority Fixes (P1)

- [ ] **Unit 5: Database-level pagination for admin submissions**

  **Goal:** Replace the fetch-all-then-paginate pattern with proper database pagination.

  **Requirements:** R4

  **Dependencies:** None

  **Files:**
  - Modify: `src/app/api/admin/submissions/route.ts`

  **Approach:**
  - Use Prisma `skip` and `take` for pagination instead of fetching all and slicing
  - For score-based sorting/filtering: since scores are computed from reviews, use a raw SQL query with aggregation or compute scores only for the returned page
  - For the `needs_review` sort: use `orderBy: [{ reviews: { _count: 'asc' } }, { createdAt: 'desc' }]`
  - For score filtering (`minScore`/`maxScore`): use a `HAVING` clause in raw SQL or fetch the page first and do a light in-memory filter on just the page (20 items, not thousands)
  - Use `prisma.submission.count()` with the same `where` clause for total count (pagination metadata)
  - The key insight: most sorting (newest, oldest, needs_review) can be done at the database level. Only score-based sorting requires computing averages, which can be done with SQL `AVG()` in a subquery

  **Patterns to follow:**
  - Existing Prisma query patterns in the codebase
  - Standard offset/limit pagination

  **Test scenarios:**
  - Happy path: Page 1 returns `limit` items, page 2 returns next `limit` items, no overlap
  - Happy path: `newest` and `oldest` sort orders return correct ordering
  - Happy path: `needs_review` sort returns submissions with 0 reviews first
  - Edge case: Score-based sort with `minScore`/`maxScore` filters correctly
  - Edge case: Empty result set returns `{ submissions: [], pagination: { total: 0, ... } }`
  - Edge case: Page beyond total returns empty array

  **Verification:**
  - `findMany` calls include `skip` and `take`
  - No full-table fetch followed by in-memory `.slice()`
  - Admin panel loads quickly with 1000+ submissions

- [ ] **Unit 6: Fix admin stats endpoint unbounded fetch**

  **Goal:** Replace in-memory score aggregation with SQL aggregation.

  **Requirements:** R4

  **Dependencies:** None

  **Files:**
  - Modify: `src/app/api/admin/stats/route.ts`

  **Approach:**
  - Replace the `findMany` + in-memory loop with a raw SQL query: `SELECT AVG((r."curiosityVsEgo" + r."participationVsSpectatorship" + r."emotionalIntelligence") / 3.0) as avg_score FROM "Review" r`
  - Keep the existing parallel `count()` queries (they're already efficient)
  - Remove the `findMany` on reviewed submissions entirely

  **Patterns to follow:**
  - Prisma `$queryRaw` for aggregate queries (already used in health check)

  **Test scenarios:**
  - Happy path: Stats endpoint returns correct counts and average score
  - Edge case: No reviews exist — `averageScore` returns "0.00" or null
  - Integration: Response shape matches existing frontend expectations

  **Verification:**
  - No `findMany` with `include: { reviews }` in stats endpoint
  - Endpoint responds in <200ms regardless of submission count

- [ ] **Unit 7: Restrict CSV export to admin role**

  **Goal:** Prevent non-admin reviewers from bulk-downloading applicant PII.

  **Requirements:** R5

  **Dependencies:** None

  **Files:**
  - Modify: `src/app/api/admin/export/route.ts`

  **Approach:**
  - Change `requireAuth()` to `requireAdmin()` on line 27
  - The import for `requireAdmin` already exists in the file

  **Patterns to follow:**
  - `src/app/api/admin/submissions/[id]/route.ts` PATCH handler already uses `requireAdmin()`

  **Test scenarios:**
  - Happy path: Admin user can download CSV export
  - Error path: Non-admin reviewer gets 403 "Admin access required"

  **Verification:**
  - Export endpoint uses `requireAdmin()` not `requireAuth()`

- [ ] **Unit 8: Lazy-initialize R2 client and add timeouts**

  **Goal:** Prevent crashes when R2 env vars aren't set and add request timeouts.

  **Requirements:** R7

  **Dependencies:** None

  **Files:**
  - Modify: `src/lib/r2.ts`

  **Approach:**
  - Replace the module-level `const r2Client = new S3Client(...)` with a lazy getter that initializes on first use
  - Guard with `isR2Configured()` check before initializing
  - Add `requestTimeout: 10000` to the S3Client config
  - The existing `isR2Configured()` function already exists and is called in the upload routes, but the client construction runs before it's ever checked

  **Patterns to follow:**
  - Lazy initialization pattern already used in `src/lib/email.ts` (the Resend client)

  **Test scenarios:**
  - Happy path: R2 client initializes correctly when env vars are set
  - Error path: Calling R2 functions when not configured throws clear error (not undefined property access)
  - Edge case: R2 request that takes >10s times out instead of hanging

  **Verification:**
  - Module import of `r2.ts` does not throw when R2 env vars are missing
  - Timeout is configured on the S3Client

- [ ] **Unit 9: Fix race condition in apply/complete**

  **Goal:** Move duplicate email check inside the transaction to prevent race conditions.

  **Requirements:** R7

  **Dependencies:** None

  **Files:**
  - Modify: `src/app/api/apply/complete/route.ts`

  **Approach:**
  - Move the `existingApplicant` check inside the `$transaction` callback, using the `tx` client
  - If a duplicate is found inside the transaction, throw an error that the outer catch handles
  - The database unique constraint on `Applicant.email` is the ultimate guard, but the explicit check provides a better error message

  **Patterns to follow:**
  - Existing transaction pattern in the same file

  **Test scenarios:**
  - Happy path: Application completes successfully when no duplicate exists
  - Edge case: Two simultaneous completions with same email — one succeeds, other gets clear error
  - Error path: Duplicate email inside transaction returns 400 with friendly message

  **Verification:**
  - No `findUnique` for duplicate email check outside of `$transaction`

### Phase 3: Moderate Fixes (P2)

- [ ] **Unit 10: Clean up console.log leaks and debug logging**

  **Goal:** Remove PII and secrets from production logs.

  **Requirements:** R7

  **Dependencies:** None

  **Files:**
  - Modify: `src/lib/email-verification.ts` (will be deleted in Unit 2, skip if already done)
  - Modify: `src/app/api/upload/presign/route.ts` (remove `console.log('Presign body received:')`)
  - Modify: `src/app/api/apply/complete/route.ts` (remove `console.error` that logs full validation issues)

  **Approach:**
  - Remove or replace debug `console.log` statements that leak PII
  - Keep error-level logging but redact sensitive fields

  **Test scenarios:**
  - Test expectation: none -- pure cleanup, no behavioral change

  **Verification:**
  - grep for `console.log` in API routes returns no PII-leaking statements

- [ ] **Unit 11: Add webhook timeouts and fix inconsistent secret handling**

  **Goal:** Prevent webhook calls from hanging and fix the inconsistent WEBHOOK_SECRET header pattern.

  **Requirements:** R7

  **Dependencies:** None

  **Files:**
  - Modify: `src/app/api/apply/complete/route.ts` (add timeout to fetch)
  - Modify: `src/app/api/apply/friends/route.ts` (add timeout to fetch)
  - Modify: `src/app/api/admin/reviews/route.ts` (add timeout, fix empty-string secret header)

  **Approach:**
  - Add `signal: AbortSignal.timeout(5000)` to all webhook `fetch()` calls
  - In `reviews/route.ts`, change the header pattern from `process.env.WEBHOOK_SECRET || ""` to the conditional pattern used in `complete/route.ts`: `if (process.env.WEBHOOK_SECRET) headers["x-webhook-secret"] = process.env.WEBHOOK_SECRET`
  - Log webhook failures (currently silently swallowed) at warn level before ignoring

  **Patterns to follow:**
  - Conditional header pattern in `src/app/api/apply/complete/route.ts`

  **Test scenarios:**
  - Happy path: Webhook with 5s timeout sends successfully
  - Error path: Slow/unreachable IPHQ times out after 5s without blocking user response
  - Edge case: Missing WEBHOOK_SECRET env var doesn't send empty header

  **Verification:**
  - All webhook `fetch()` calls have `AbortSignal.timeout()`
  - No `|| ""` fallback for webhook secret headers

- [ ] **Unit 12: Fix upload endpoint auth and abuse prevention**

  **Goal:** Require a valid pending application token for presigned upload URLs.

  **Requirements:** R7

  **Dependencies:** None

  **Files:**
  - Modify: `src/app/api/upload/presign/route.ts`

  **Approach:**
  - Add a `token` field to the presign request schema
  - Validate the token against `PendingApplication` (exists, not expired)
  - Use the pending application's email instead of the request body's email for the R2 key
  - This prevents unauthenticated users from generating unlimited presigned URLs
  - Rate limit presign requests using the same database-backed rate limiter (key: `presign:${token}`)

  **Patterns to follow:**
  - Token validation pattern in `src/app/api/apply/[token]/route.ts`

  **Test scenarios:**
  - Happy path: Valid token returns presigned URL with correct email in key
  - Error path: Missing/invalid token returns 403
  - Error path: Expired token returns 410
  - Edge case: Rate limited presign requests return 429

  **Verification:**
  - Presign endpoint validates token before generating URL

- [ ] **Unit 13: Fix friends endpoint timezone and minor validation issues**

  **Goal:** Use client-provided timezone instead of server timezone; validate patron minimum amount.

  **Requirements:** R7

  **Dependencies:** None

  **Files:**
  - Modify: `src/app/api/apply/friends/route.ts`
  - Modify: `src/app/friends/page.tsx`
  - Modify: `src/app/gratis/page.tsx`
  - Modify: `src/app/patron/page.tsx`

  **Approach:**
  - Add `timezone` field to the friends schema (string, default to empty)
  - Pass `Intl.DateTimeFormat().resolvedOptions().timeZone` from the client pages in the form submission
  - Use the client-provided timezone in the applicant creation instead of server-side detection
  - For patron page: the UI already prevents $0 with `disabled={value <= 0}`, but add server-side validation: check if ticketType starts with "patron" and amount < some minimum (e.g., 1)

  **Patterns to follow:**
  - Client-side timezone detection already used in `src/app/apply/page.tsx`

  **Test scenarios:**
  - Happy path: Friends/gratis/patron registration stores the client's timezone, not server's
  - Edge case: Missing timezone field falls back to server timezone (backward compatible)
  - Error path: Patron with amount=0 returns validation error

  **Verification:**
  - No server-side `Intl.DateTimeFormat()` calls in friends route
  - Client pages send timezone in request body

- [ ] **Unit 14: Fix email enumeration and honeypot response**

  **Goal:** Prevent email enumeration via error messages; improve honeypot behavior.

  **Requirements:** R7

  **Dependencies:** None

  **Files:**
  - Modify: `src/app/api/apply/start/route.ts`
  - Modify: `src/app/api/apply/complete/route.ts`
  - Modify: `src/app/api/apply/friends/route.ts`

  **Approach:**
  - Change duplicate email error messages to be generic: "Unable to process application. If you've already applied, check your email for confirmation." This doesn't reveal whether the email exists
  - Change honeypot detection to return a 200 with a fake delay (simulate processing time) rather than immediately returning success. This makes it harder for bots to distinguish real vs fake responses
  - Keep the silent acceptance behavior but add a small random delay (500-1500ms) before responding

  **Patterns to follow:**
  - Security-conscious error messages that don't leak information

  **Test scenarios:**
  - Happy path: Duplicate email returns generic message, not "email already exists"
  - Edge case: Honeypot-triggered request returns 200 after slight delay
  - Integration: Legitimate users who already applied still understand they can't re-apply

  **Verification:**
  - grep for "already exists" returns no results in public-facing API responses

- [ ] **Unit 15: Fix Prisma connection pool sizing**

  **Goal:** Set appropriate connection pool size for serverless environment.

  **Requirements:** R7

  **Dependencies:** None

  **Files:**
  - Modify: `src/lib/prisma.ts`

  **Approach:**
  - Set `max: 3` on the pg Pool constructor (serverless functions should use minimal connections)
  - Add `connectionTimeoutMillis: 5000` to fail fast rather than hang
  - Add `idleTimeoutMillis: 10000` to release connections quickly
  - These settings work well with Neon's connection pooler or Supabase's Supavisor

  **Patterns to follow:**
  - Vercel's recommended Prisma serverless configuration

  **Test scenarios:**
  - Happy path: Database queries work with reduced pool size
  - Edge case: Pool exhaustion returns timeout error rather than hanging indefinitely

  **Verification:**
  - Pool constructor includes `max`, `connectionTimeoutMillis`, and `idleTimeoutMillis`

- [ ] **Unit 16: Fix comment/code mismatch and Vercel Blob token parsing**

  **Goal:** Fix the "3 prompts" comment that should say "2", and add safety to Blob token parsing.

  **Requirements:** R7

  **Dependencies:** None

  **Files:**
  - Modify: `src/app/api/apply/[token]/route.ts` (fix comment)
  - Modify: `src/app/upload/[token]/page.tsx` (add Blob token validation)
  - Modify: `src/app/apply/page.tsx` (same Blob token validation if duplicated here)

  **Approach:**
  - Fix the comment from "Fetch 3 random prompts" to "Fetch 2 random prompts" and "take 3" to "take 2"
  - Add validation around the Vercel Blob token parsing: check `parts.length >= 4` and that `parts[3]` exists before constructing the URL. If invalid, throw a descriptive error

  **Test scenarios:**
  - Edge case: Blob token with unexpected format throws clear error instead of constructing bad URL
  - Test expectation for comment fix: none -- documentation correction

  **Verification:**
  - Comments match actual behavior
  - Blob token parsing has a guard clause

### Phase 4: Low-Priority Fixes (P3)

- [ ] **Unit 17: Improve video duration tracking accuracy**

  **Goal:** Use actual recorded duration instead of interval-based approximation.

  **Requirements:** R7

  **Dependencies:** Unit 1 (codec negotiation changes same code area)

  **Files:**
  - Modify: `src/app/apply/page.tsx` (recording completion handler)
  - Modify: `src/app/upload/[token]/page.tsx` (recording completion handler)

  **Approach:**
  - After recording stops and the Blob is created, create a temporary `<video>` element, set its `src` to the blob URL, and read `video.duration` in the `loadedmetadata` event
  - Use this actual duration for the `videoDurationSec` field sent to the server
  - Keep the interval timer for the UI countdown display (it's fine for visual feedback)
  - Add a minimum duration check: if actual duration < 5 seconds, show "Recording too short" error

  **Patterns to follow:**
  - Existing blob URL creation in the `onstop` handler

  **Test scenarios:**
  - Happy path: `videoDurationSec` sent to server matches actual video duration from metadata
  - Edge case: Very short recording (<5s) shows error and doesn't allow submission
  - Edge case: `loadedmetadata` event doesn't fire (fallback to interval-based duration)

  **Verification:**
  - Server receives accurate duration, not interval approximation

- [ ] **Unit 18: Remove committed .env.local from git history**

  **Goal:** Remove secrets from git history.

  **Requirements:** R7

  **Dependencies:** None (but should be done after all other changes)

  **Files:**
  - Modify: `.gitignore` (ensure `.env.local` is listed)
  - Remove from tracking: `.env.local`

  **Approach:**
  - Verify `.env.local` is in `.gitignore` (it likely already is but the file was committed before gitignore)
  - Run `git rm --cached .env.local` to untrack it without deleting the local file
  - The passwords in the committed file are dev-only values, but it sets a bad precedent
  - Verify production uses different values (DEPLOYMENT.md already instructs this)

  **Test scenarios:**
  - Test expectation: none -- git hygiene, no behavioral change

  **Verification:**
  - `git status` shows `.env.local` as untracked, not modified
  - `.env.local` still exists locally for development

## System-Wide Impact

- **Interaction graph:** Rate limit changes affect `apply/start`, `apply/verify` (deleted), `upload/presign`, and `admin/auth`. All callers of `checkRateLimit()` need to be updated for the async database version.
- **Error propagation:** The new database-backed rate limiter introduces a database dependency on every rate-limited request. If the database is down, rate limiting should fail open (allow the request) rather than blocking users.
- **State lifecycle risks:** The Prisma migration (Units 2 + 3) removes `emailVerified` and adds `RateLimit`. These should be combined into a single migration to avoid partial state.
- **API surface parity:** The `POST /api/apply/start` response shape changes (no more `requiresVerification` field). Frontend already handles this gracefully.
- **Unchanged invariants:** The application form flow, video recording UX, admin review flow, webhook integration with IPHQ, and email confirmation via Resend are all unchanged in behavior.

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Safari MediaRecorder may have quirks beyond codec support | Test on real iOS device before launch, not just browser emulation |
| Database migration on production | Run `prisma migrate deploy` during a quiet period; migration is additive (new table) + column removal (emailVerified) |
| Rate limiting fail-open on DB outage could allow spam | Acceptable for launch — DB outage means the whole app is down anyway |
| Vercel Blob token format may already have changed | Add validation guard (Unit 16) to fail with clear error rather than silent corruption |

## Sources & References

- Code review findings from 9 parallel agents (security, correctness, performance, reliability, 5 browser testers)
- Vercel serverless best practices for connection pooling
- MDN MediaRecorder.isTypeSupported() documentation
- Project deployment guide: `DEPLOYMENT.md`
