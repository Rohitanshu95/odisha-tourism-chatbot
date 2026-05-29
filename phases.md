# Pathik AI — Phase Breakdown

Source of truth: [../PRD.md](../PRD.md). PRD section references appear as `§1.A`, `§3.D`, etc.

This plan is risk-front-loaded: RAG accuracy, latency, and compliance get validated early, and cross-cutting concerns (rate limiting, PII masking, input validation, LLM-provider abstraction) live in the foundation rather than a late hardening sprint. Phases are sequenced for a single team building MVP-first; suggested parallelization is at the bottom.

Status legend used inside each phase:
- **Objective** — what this phase proves or unlocks
- **Deliverables** — concrete artifacts and code
- **PRD refs** — sections of [../PRD.md](../PRD.md) this phase implements
- **Exit criteria** — testable conditions to call the phase done
- **Risks / notes** — non-obvious gotchas

---

## Phase 0 — Foundation

**Objective.** Set up the rails everything else rides on. Skipping these now creates rework later, especially around PII masking, the LLM-provider abstraction, and rate limiting.

**Deliverables.**
- Repository hygiene: `git init`, branching policy, CI workflow (lint + typecheck + tests on PR), commit hooks.
- Environment configuration: `.env.example` for backend and client, Pydantic `Settings` loader, secret-management strategy (no secrets in repo).
- Backend skeleton:
  - FastAPI app with structured logging (JSON), correlation IDs, and a PII-masking log filter (regex on email, phone, name fields).
  - Global Pydantic input sanitizer middleware to neutralize SQLi, XSS, and prompt-injection vectors at the API boundary (§3.D).
  - Rate-limiting middleware: 10 requests/min per IP and per active session (§3.B).
  - CORS allowlist matching the Vite dev origin and future production origin.
  - Health endpoint and a `/echo` test endpoint that round-trips through the LLM provider interface.
- Frontend skeleton:
  - Routing, layout shell, design tokens (extending the variables already in [../client/src/index.css](../client/src/index.css)).
  - Accessible base components (button, input, dialog) targeting WCAG 2.1 AA from day one.
  - Reuse the shared axios `instance` from [../client/src/config/axios.js](../client/src/config/axios.js) for every API call.
- Data layer:
  - DB selection (PostgreSQL or MongoDB per §1.B). Recommend PostgreSQL for relational integrity on tickets/leads, with a separate Mongo-style chat-history collection only if `MongoDBChatMessageHistory` is preferred.
  - Migrations tool wired (Alembic if Postgres).
- Vector store + embeddings scaffold:
  - Chroma or Pinecone client behind an interface so the choice is swappable.
  - Embedding model loader for `BGE-M3` or `multilingual-e5-large` (chosen up front because Phase 4 multilingual support depends on it).
- LLM provider abstraction:
  - Single `LLMClient` interface with two implementations: **OpenAI as primary, Google Gemini as fallback** (via `langchain-openai` and `langchain-google-genai`, both already pinned in [../backend/requirements.txt](../backend/requirements.txt)).
  - Streaming-first API; non-streaming is a wrapper, not a separate method.
  - **Deviation from PRD §3.C.** The PRD specifies open-source LLMs (Llama 3 8B / Mistral 7B via vLLM) with Groq Cloud as fallback. This project uses managed APIs (OpenAI + Gemini) instead. Trade-offs: simpler ops and faster delivery; recurring per-token cost, external data egress, and dependency on third-party availability. Revisit before government UAT in Phase 10 if data-residency or sovereignty constraints surface.
- Test scaffolding: `pytest` for backend, `vitest` for client.

**PRD refs.** §3.B, §3.C, §3.D, §4 (embedding choice).

**Exit criteria.**
- Echo endpoint round-trips through the `LLMClient` interface using both providers behind a runtime flag.
- Rate limit returns 429 once thresholds are exceeded; covered by tests.
- PII masking middleware strips emails/phones/names from a sample log payload; covered by tests.
- CI green on a clean clone.

**Risks / notes.**
- LangChain 1.x and LangGraph 1.x APIs are pinned in [../backend/requirements.txt](../backend/requirements.txt). Many internet examples target 0.x and will not compile.
- [../backend/requirements.txt](../backend/requirements.txt) is UTF-16 LE. Preserve encoding when editing or `pip install` will break on Windows.
- Pick the embedding model before ingesting any documents. Re-embedding the corpus later is expensive.

---

## Phase 1 — RAG MVP with Source Attribution

**Objective.** Validate the *core product contract* on the simplest possible surface: an answer is only as good as the verifiable source it cites.

**Deliverables.**
- Ingestion pipeline:
  - Loaders for HTML (Odisha Tourism portal scrape) and PDF (curated government docs).
  - Chunker with overlap; each chunk carries `source_url`, `tier`, `published_at`, `language` metadata (§1.A).
  - Idempotent upsert into the vector store keyed by `source_url + chunk_index`.
- Tier 1 corpus: official Odisha Tourism portal + a curated set of department PDFs, ingested end-to-end.
- Retrieval + answer pipeline:
  - Hybrid retrieval (dense + keyword) with re-ranking.
  - Output formatter prompt that *forces* a markdown hyperlink to the top-cited source at the end of the answer (§1.A).
  - Confidence threshold; below it, route to the fallback template (full email-capture flow lands in Phase 6).
- Streaming chat endpoint (`/api/chat`) and a minimal chat UI on the frontend.
- Eval set: ~50 fixed questions with known correct answers and acceptable source URLs, run in CI.

**PRD refs.** §1.A, §2.D, plus the Tier 1/2/3 classification at the bottom of §5.

**Exit criteria.**
- 100% of answers in the eval set cite at least one Tier 1 URL.
- 0 hallucinated facts on the eval set (manual review).
- Low-confidence path triggers the fallback template instead of inventing an answer.
- p99 chat latency under typical load is at or below 3s (preliminary; full SLA validation is Phase 9).

**Risks / notes.**
- Output-format prompts are fragile. Lock the markdown-hyperlink format with a regex post-check; reject and regenerate if missing.
- "Confidence" needs a concrete definition (top-k score threshold or a re-ranker score). Pick one and document it.

---

## Phase 2 — Sessions & User Classification

**Objective.** Implement §1.B end-to-end before analytics so telemetry has a stable session shape.

**Deliverables.**
- Guest session:
  - In-memory `ConversationBufferMemory` keyed by browser session ID.
  - No DB writes for guest messages, period. Verified by an integration test.
  - On window close/refresh: client purges, server has nothing to purge.
- Identified session:
  - Identity capture flow (Name, Email, Mobile) that is fully bypassable on first interaction.
  - DB schema for `users`, `sessions`, `chat_messages` with PII columns AES-256 encrypted at rest (§3.D).
  - TTL index of 259,200 seconds (3 days) on `chat_messages` enforcing hard-delete (§1.B).
  - 3-day resume: returning user gets prior context loaded into the prompt within token budget.
- Token-budget context window assembly: trim oldest turns first, preserve system prompt and the most recent K turns.

**PRD refs.** §1.B, §3.D.

**Exit criteria.**
- TTL hard-delete verified by inserting a row with backdated timestamp and observing automatic removal.
- Guest data leaves zero residue: searching the DB for a guest's payload returns empty after the session ends.
- Resume-after-2-days test passes for an identified user.

**Risks / notes.**
- Postgres does not have a native TTL index. Use a scheduled cleanup job (e.g., `pg_cron`) and document it; or use Mongo if TTL is a hard constraint.
- Encryption at rest must be at the field level for PII, not just disk encryption, to satisfy §3.D's intent.

---

## Phase 3 — Conversational Intelligence

**Objective.** Make the bot feel intelligent on ambiguous and short queries, and start building the analytics loop.

**Deliverables.**
- Intent classifier (booking / exploration / historical / transport / pricing / other). Pricing branches to a hard handoff in Phase 6 — wire the routing now even if the handoff is stubbed.
- Smart disambiguation prompting:
  - Detect short / ambiguous queries (e.g., `Puri`).
  - Generate authoritative overview + structured quick-reply filters per the Puri example in §1.C.
- Query analytics pipeline (§1.E):
  - Async write of every query to a `query_log` table with raw semantic vector and stripped identifiers.
  - Aggregation job computing query frequency by topic over rolling windows.
- Predictive recommendations:
  - Build a per-session interest profile from log aggregation.
  - Surface trending suggestions and personalized itineraries inline in the chat UI.

**PRD refs.** §1.C, §1.E.

**Exit criteria.**
- Disambiguation triggers reliably on a curated short-query test set; no generic failure responses.
- Query log captures 100% of queries asynchronously with no measurable impact on p99 latency.
- A returning user sees at least one recommendation grounded in their prior topics.

**Risks / notes.**
- Async logging must not back-pressure the chat path. Use a queue (e.g., `asyncio.Queue` + worker, or Redis Streams).
- Make sure identifier stripping happens *before* the vector is persisted, not after.

---

## Phase 4 — Multilingual & Voice

**Objective.** Deliver §4 in full: Odia, Romanized Odia, code-switching, voice input, and accessibility.

**Deliverables.**
- Native Odia rendering: UTF-8 verified end-to-end, font fallback stack tested on Windows / Android / iOS.
- Code-switching handled by the multilingual embedding choice from Phase 0 (`multilingual-e5-large` or `BGE-M3`).
- Speech-to-Text:
  - Web Speech API in supporting browsers.
  - Multilingual Whisper endpoint as fallback for unsupported browsers and accuracy-critical paths.
  - Microphone UI with clear consent and recording indicator.
- WCAG 2.1 AA pass on the chat UI:
  - Semantic landmarks, ARIA labels for live chat region, focus management on new messages.
  - Full keyboard navigation (Tab, Shift+Tab, Enter, Esc).
  - Color contrast verified against the tokens in [../client/src/index.css](../client/src/index.css).

**PRD refs.** §4.

**Exit criteria.**
- A user can ask a question in Odia script and get a correct, source-cited answer.
- A user can ask the same question by voice in Romanized Odia and get an equivalent answer.
- Automated accessibility scan (axe or Lighthouse) reports zero AA violations on the chat surface; manual screen-reader smoke test passes.

**Risks / notes.**
- Web Speech API browser support is uneven. Decide early whether to require a fallback for Firefox/Safari or accept degraded UX there.
- Whisper streaming latency can blow the 3s SLA on long utterances. Cap utterance length and stream partial transcripts.

---

## Phase 5 — Maps & Spatial Routing

**Objective.** Implement §1.D with privacy and bandwidth fallbacks built in, not bolted on.

**Deliverables.**
- Explicit location-consent banner before any geolocation API call. No silent location reads.
- Itinerary intent → injected Google Maps Route URL alongside the text response.
- Slow-network detection (Network Information API + timing heuristic) → text-only output with landmarks and transport numbers.
- Daily cron / scheduled task validating every embedded URL surfaced in answers in the last N days:
  - Broken URL → admin alert + DB flag → fallback template activated for that source.
- Admin alert sink (email or dashboard widget; full dashboard is Phase 8).

**PRD refs.** §1.D.

**Exit criteria.**
- Geolocation never fires before consent is granted; verified with a no-consent test.
- Slow-network simulation produces text-only directions, not a map link.
- A deliberately broken URL in the corpus surfaces an admin alert within 24h and is suppressed from new answers.

**Risks / notes.**
- Google Maps Platform requires API key management and billing; budget for it before integrating.
- Don't ship the consent banner as a one-time dismissal — re-prompt if the user revokes browser-level permission.

---

## Phase 6 — Safety Guardrails

**Objective.** Implement §2 functional safety. Compliance hardening (audit trails, encryption review) lives in Phase 7.

**Deliverables.**
- Sentiment analysis on incoming user text:
  - Real-time scoring; threshold for "high frustration" defined and tuned.
  - On trigger: surface the official Odisha Tourism Department contact registry (support email + helpline).
  - Freeze previously captured demographics with a unique token so the user does not re-enter them (§2.A).
- Profanity filter:
  - String-filtering engine on the input pipeline.
  - On detection: sanitize the stored display name to `Srimaan` or `Srimati` and switch the system prompt to a strict formal register (§2.B).
- Pricing handoff:
  - Pricing intent is intercepted *before* the LLM sees it.
  - Response is a fixed template directing to OTDC booking system / Book Odisha API gate (§2.C).
- Email-fallback resolution loop (full version):
  - Low-confidence answers → polite apology template + email capture.
  - Auto-create a high-priority ticket in the admin queue.
  - SMTP-driven offline resolution path (§2.D).
- Idle-timeout flow:
  - 5 minutes idle → ping ("Do you need further assistance?").
  - Additional 120s no response → formal closing message, terminate the websocket / SSE channel (§2.E).

**PRD refs.** §2.A through §2.E.

**Exit criteria.**
- Pricing question never reaches the LLM; verified by tracing.
- Profanity test corpus produces sanitized name + formal-register response on every trip.
- Negative-sentiment scenario surfaces the contact registry with frozen demographics.
- Idle-timeout sequence verified end-to-end.

**Risks / notes.**
- The pricing interceptor needs to fail open to safety: if intent classification is uncertain, treat it as pricing and hand off, rather than risk an LLM-quoted figure.
- Profanity filters are notoriously bad at vernacular abuse. Plan for an updateable wordlist and an admin override.

---

## Phase 7 — Compliance & Hardening

**Objective.** Finish the DPDP Act 2023 audit story. Many controls are enforced earlier; this phase formalizes them.

**Deliverables.**
- AES-256 at rest verified for all PII columns; key rotation procedure documented.
- TLS 1.3 enforced end-to-end (server config + HSTS + redirect from any non-TLS endpoint).
- Log-masking regex suite covering email, phone, Aadhaar, mobile-number variants, and full names; tested.
- Security test suite:
  - SQLi, XSS, CSRF.
  - Prompt-injection: a curated corpus of jailbreaks must fail to extract system prompts or bypass guardrails.
- Tier 2 corpus ingested: Central Government repos, Incredible India dataset, ASI monument analytics — all with source-URL binding.
- Tier 3 corpus ingested: Wikipedia + peer-reviewed cultural analytics, clearly tier-tagged so retrieval can prefer Tier 1.

**PRD refs.** §3.D, §5 (Tier classification).

**Exit criteria.**
- Third-party (or internal) security review report with no high-severity findings.
- DPDP self-audit checklist green.
- Retrieval re-ranker prefers Tier 1 over Tier 2 over Tier 3 on a deliberately overlapping query set.

**Risks / notes.**
- Tier 3 sources can pollute answers if not tier-weighted in the re-ranker. Treat tier as a first-class retrieval signal, not a post-hoc filter.

---

## Phase 8 — Admin Console

**Objective.** Implement §5 so operations and content lifecycle stop being engineering-only tasks.

**Deliverables.**
- Workflow routing dashboard:
  - Visualization of unresolved tokens and email-fallback tickets.
  - Auto-categorization: booking, complaint, informational; priority flags.
- Bulk transaction ledger:
  - Queue of pending responses with **Bulk Approve & Send** action.
  - Audit trail per item (who approved, when).
- Knowledge-stream lifecycle:
  - Document upload UI.
  - Server-side chunking + embedding + vector-store upsert pipeline.
  - Live status of re-embedding jobs.
- Admin auth (separate from user auth) with role-based access.

**PRD refs.** §5.

**Exit criteria.**
- An operator can upload a new policy PDF and see it answering questions within minutes.
- Bulk approve handles 100 queued items in a single action without timing out.
- All admin actions are auditable.

**Risks / notes.**
- Re-embedding is CPU/GPU heavy. Run it as a background job with a visible progress UI; never block the upload request.

---

## Phase 9 — Performance & Resiliency

**Objective.** Validate §3.A and §3.C under realistic and peak loads.

**Deliverables.**
- LLM tuning: model selection per intent (e.g., GPT-4o-mini for fast paths, GPT-4o for complex reasoning), token-budget caps, response-cache for repeat queries, streaming-first transport.
- Load test rig (k6 or Locust) modeling Ratha Yatra-scale concurrency.
- Elastic compute pooling for app servers and worker queues; autoscaling tied to queue depth or p95 latency.
- Provider failover wired with a circuit breaker:
  - Primary OpenAI → Gemini fallback on consecutive failures, 429s, or sustained latency breach.
  - Half-open probe on a schedule.
  - Per-provider quota tracking to avoid burning a single key.
- Observability: Prometheus metrics for retrieval latency, LLM TTFT, tokens/sec, per-provider error rate and cost; dashboards.

**PRD refs.** §3.A, §3.C.

**Exit criteria.**
- p99 latency at or under 3 seconds under the simulated peak with the primary provider degraded to fallback.
- Circuit breaker opens and recovers correctly in chaos tests (forced 429s and 5xx from OpenAI, then recovery).
- No request loss when the primary provider is rate-limited or returns sustained errors.

**Risks / notes.**
- Streaming latency (TTFT) matters more than total wall time for perceived UX. Track both.
- Managed-API cost grows linearly with traffic; budget alerts and per-route token caps belong in this phase, not after launch.
- Cross-border data egress to OpenAI/Gemini is the headline risk for a government deployment — confirm with the compliance owner before pilot (see Phase 10).

---

## Phase 10 — Pilot & Launch

**Objective.** Government UAT and staged rollout.

**Deliverables.**
- DPDP audit closure with signed-off report.
- Third-party security review closure.
- UAT environment loaded with a Tier 1-only corpus snapshot.
- Runbooks: incident response, on-call rotation, rollback procedure.
- Staged rollout plan: internal → small public cohort → full public.

**PRD refs.** governance and compliance themes across §2 and §3.

**Exit criteria.**
- UAT sign-off from the Odisha Tourism Department.
- Production cutover completed without rollback.

---

## Suggested parallelization

Once Phase 1 lands, several tracks become mostly independent:

- **Track A (intelligence):** Phase 2 → Phase 3 → Phase 6
- **Track B (multilingual / voice):** Phase 4
- **Track C (spatial):** Phase 5
- **Track D (admin):** Phase 8

Phase 7 (compliance) is best drip-fed into earlier phases rather than batched; treat its exit criteria as a checklist that closes out as features land. Phase 9 (perf) needs feature-complete code paths to be meaningful, so it stays late.

## Cross-cutting checklists

These items recur across phases and are easy to forget. Treat them as "definition of done" extensions on every PR.

- **Source attribution.** Any new answer-producing path must emit a markdown hyperlink to a Tier 1/2/3 source.
- **PII handling.** New fields → encrypted at rest; new logs → run through the masking filter; new endpoints → Pydantic validators.
- **Latency budget.** Any new step in the chat path must declare its latency budget against the 3s p99 SLA.
- **Accessibility.** Any new UI surface must keyboard-navigate and pass an axe scan before merge.
- **i18n.** Any user-visible string must be translatable; no hardcoded English in components.
