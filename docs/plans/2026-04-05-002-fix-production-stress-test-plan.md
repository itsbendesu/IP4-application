---
title: "fix: Production stress test — verify zero data loss under load"
type: fix
status: active
date: 2026-04-05
---

# Production Stress Test — Verify Zero Data Loss Under Load

## Overview

Hammer the live production site (interestingpeople.com) with realistic traffic patterns to prove that form submissions won't be lost, videos won't be corrupted, and the system holds up when thousands of people hit it simultaneously. Clean up all test data afterward.

## Problem Frame

The IP4 application was just hardened with 18 fixes. The API stress test confirmed endpoints work individually. But we haven't tested the full end-to-end flows under realistic conditions — a real user filling out the form, recording video, uploading it, and completing their application. We also haven't verified that concurrent submissions don't corrupt each other, that the database handles simultaneous writes, or that R2 video uploads survive under load.

This is a production validation plan, not a code change plan. The output is a confidence report, not a PR.

## Requirements Trace

- R1. Form submissions must be persisted correctly — no data loss, no truncation, no field mixing between concurrent users
- R2. Video uploads to R2 must complete successfully and be accessible via the public URL
- R3. The complete application flow (form → presign → upload → complete) must work end-to-end
- R4. Concurrent submissions must not interfere with each other
- R5. Rate limiting must engage correctly and not block legitimate users
- R6. The system must handle at least 50 concurrent form submissions without errors
- R7. All test data must be cleaned up after testing

## Scope Boundaries

- Not load testing to find the breaking point (that's a capacity planning exercise)
- Not testing the admin panel under load (small user count, not a concern)
- Not testing email delivery (Resend is a managed service)
- Not testing IPHQ webhook delivery (external system)

## Implementation Units

- [ ] **Unit 1: End-to-end application flow (single user)**

  **Goal:** Verify the complete happy path works on production — create a pending application via the API, get a presigned URL, upload a real video file to R2, complete the application, then verify all data was stored correctly.

  **Approach:**
  - POST `/api/apply/start` with a test application (email: `stress-test-e2e@example.com`)
  - Use the returned token to GET `/api/apply/{token}` and verify prompts are returned
  - POST `/api/upload/presign` with the token to get a presigned R2 URL
  - Generate a small test video file (a few seconds of blank video using ffmpeg) and PUT it to the presigned URL
  - POST `/api/apply/complete` with the token, video key, and video URL
  - Verify the response is success
  - Query the production database directly to confirm: Applicant record exists with correct fields, Submission record exists with correct video URL, PendingApplication was deleted
  - Fetch the video URL from R2 to verify it's accessible
  - Clean up: delete the Applicant, Submission from the database; delete the video from R2

  **Verification:**
  - Every field submitted matches what's stored in the database
  - Video is accessible at the R2 public URL
  - PendingApplication was cleaned up after completion

- [ ] **Unit 2: End-to-end friends/gratis/patron flows**

  **Goal:** Verify all three invite flows work on production.

  **Approach:**
  - POST `/api/apply/friends` with ticketType `friends-hotel`, verify success
  - POST `/api/apply/friends` with ticketType `gratis-local` and amount 0, verify success
  - POST `/api/apply/friends` with ticketType `patron-hotel` and amount 19999, verify success
  - For each: query database to verify Applicant and Submission records exist with correct data
  - Verify timezone field is stored (should be the value we send, not "UTC")
  - Clean up all test records

  **Verification:**
  - All three ticket types create correct records
  - Timezone field stores the client-provided value
  - Patron amount is stored correctly as scholarshipAmount

- [ ] **Unit 3: Concurrent submission stress test (50 parallel)**

  **Goal:** Submit 50 applications simultaneously and verify every single one is stored correctly with no data mixing or loss.

  **Approach:**
  - Generate 50 unique test payloads with emails like `stress-test-concurrent-{N}@example.com`
  - Each payload has unique name, bio, threeWords to verify no field mixing
  - Fire all 50 POST requests to `/api/apply/start` simultaneously using parallel curl or a Node.js script
  - Collect all responses — every one should succeed (rate limit is 10/hr per IP, but these are different from the same IP so they share a rate limit; may need to account for this)
  - If rate limited: split into batches of 8 with 5s delays between batches
  - After all succeed: query database to verify all 50 PendingApplications exist with correct data
  - For each: verify name, email, bio, threeWords match what was submitted (no cross-contamination)
  - Clean up all 50 records

  **Verification:**
  - All 50 submissions stored correctly
  - No field values mixed between different applications
  - Each PendingApplication has the correct prompt assigned
  - No duplicate records created

- [ ] **Unit 4: Duplicate email protection test**

  **Goal:** Verify that submitting the same email twice is handled correctly without data corruption.

  **Approach:**
  - Submit application with `stress-test-dup@example.com`
  - Complete the application (create Applicant + Submission)
  - Submit another application with the same email
  - Verify the second attempt returns a generic error (not "already exists")
  - Verify the original application is untouched in the database
  - Clean up

  **Verification:**
  - Second submission rejected with generic message
  - Original applicant data unchanged
  - No orphaned PendingApplication records

- [ ] **Unit 5: Video upload integrity test**

  **Goal:** Upload videos of different formats and sizes and verify they're stored correctly and playable.

  **Approach:**
  - Create 3 test video files using ffmpeg:
    - Small WebM (5 seconds, ~100KB)
    - Larger WebM (30 seconds, ~1MB)
    - MP4 format (5 seconds, for Safari compatibility verification)
  - For each: create pending application, get presigned URL, upload video, complete application
  - Verify each video is accessible at its R2 public URL
  - Download each video and verify file size matches what was uploaded
  - Clean up all records and R2 objects

  **Verification:**
  - All 3 videos upload successfully
  - All 3 are accessible via R2 public URLs
  - Downloaded file sizes match uploaded sizes (no corruption)
  - Both WebM and MP4 formats accepted

- [ ] **Unit 6: Rate limiting verification**

  **Goal:** Verify database-backed rate limiting works correctly under real conditions.

  **Approach:**
  - Submit 10 applications rapidly from the same conceptual user (same IP)
  - Verify the rate limit kicks in (should get 429 after ~8-10 requests)
  - Wait for the rate limit window to pass (or use a different key)
  - Verify requests succeed again after the window
  - Check the RateLimit table in the database to confirm records exist
  - Clean up rate limit records and any test applications

  **Verification:**
  - Rate limiting engages at the configured threshold
  - Rate limit error includes retryAfter timestamp
  - Requests succeed after window expires
  - RateLimit records exist in the database

- [ ] **Unit 7: Security verification sweep**

  **Goal:** Verify all security hardening measures work in production.

  **Approach:**
  - Presign without token → 403
  - Admin export without auth → 401
  - Admin stats without auth → 401
  - Admin submissions without auth → 401
  - Submission status change without admin role → 403
  - Honeypot submission → fake success with delay
  - Duplicate email → generic error message (grep response for "already exists" — should NOT be present)
  - Webhook secret consistency → check that reviews endpoint doesn't send empty x-webhook-secret header (code review, can't test externally)
  - Session secret → verify /api/admin/auth GET works (session is functional)

  **Verification:**
  - All auth-protected endpoints return 401/403 when unauthenticated
  - No information leakage in error messages
  - Honeypot detection works

- [ ] **Unit 8: Database and infrastructure health**

  **Goal:** Verify the production database and storage are healthy and correctly configured.

  **Approach:**
  - Hit /api/health and verify all checks pass
  - Check database latency (should be <500ms)
  - Verify R2 storage is configured (status: ok)
  - Check the RateLimit table exists (our migration was applied)
  - Verify emailVerified column is gone from PendingApplication
  - Count existing applicants to confirm no test data leaked from earlier runs
  - Check connection pool behavior by hitting health 10 times rapidly

  **Verification:**
  - Health check returns status: healthy
  - Database latency is acceptable (<500ms)
  - Schema changes are applied (RateLimit table exists, emailVerified gone)
  - No connection pool exhaustion under rapid requests

- [ ] **Unit 9: Full cleanup and final report**

  **Goal:** Clean up ALL test data and produce a confidence report.

  **Approach:**
  - Query database for all records with emails matching `stress-test-*@example.com`
  - Delete all matching Submissions, Applicants, PendingApplications
  - Delete all RateLimit records created during testing
  - Delete all test videos from R2
  - Verify cleanup is complete (re-query, expect 0 results)
  - Produce a final confidence report with pass/fail for each test

  **Verification:**
  - Zero test records remain in the database
  - Zero test videos remain in R2
  - Production data (29 real applicants) is untouched

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Test data accidentally left in production | Unit 9 does comprehensive cleanup; all test emails use `stress-test-*@example.com` prefix |
| Rate limiting blocks our own tests | Use batched submissions with delays; clean rate limit records between test units |
| R2 video cleanup fails | Track all uploaded keys; retry deletion; worst case is a few KB of test files |
| Tests create real IPHQ webhook calls | These will fail silently (test emails won't match real IPHQ records); harmless |
| Concurrent test causes production outage | Starting with 50 concurrent, not 1000; Vercel auto-scales; low risk |
