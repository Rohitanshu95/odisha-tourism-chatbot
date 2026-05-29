# Pathik AI — Task Backlog

Derived from [PRD.md](PRD.md) and [docs/phases.md](docs/phases.md). Each task has:

- **ID** — stable reference (e.g., `P0-BE-001`)
- **Area** — `BE` backend, `FE` frontend, `INFRA`, `DATA`, `SEC`, `ML`, `OPS`, `DOCS`
- **Depends on** — prerequisite task IDs
- **PRD** — section in [PRD.md](PRD.md)
- **Acceptance** — testable done criteria

LLM stack: **Google Gemini as primary provider**. The client is managed via `langchain-google-genai`. This aligns with the updated PRD §3.C — see [docs/phases.md](docs/phases.md) Phase 0 for the trade-off note regarding hardware constraints.

---

## Phase 0 — Foundation

### Repository & CI

- **P0-OPS-001 — Initialize git repo and branching policy**
  - Area: OPS
  - Depends on: —
  - Acceptance: `git init` done, `main` protected, feature-branch workflow documented in `CONTRIBUTING.md`, `.gitignore` covers `.venv/`, `node_modules/`, `dist/`, `.env*`, `*.local`.

- **P0-OPS-002 — CI pipeline (lint + typecheck + tests)**
  - Area: OPS
  - Depends on: P0-OPS-001, P0-BE-001, P0-FE-001
  - Acceptance: GitHub Actions (or equivalent) runs `npm run lint`, `npm test` (vitest), `pytest`, and `ruff`/`mypy` on every PR; status check blocks merge on failure.

- **P0-OPS-003 — Pre-commit hooks**
  - Area: OPS
  - Depends on: P0-OPS-001
  - Acceptance: `pre-commit` config installs `ruff`, `prettier`, secret-scan; runs on staged files before commit.

- **P0-DOCS-001 — `.env.example` for backend and client**
  - Area: DOCS
  - Acceptance: Both files list every required key (OpenAI, Gemini, DB URL, Maps key, SMTP, JWT secret) with placeholder values and inline comments. Real `.env` is git-ignored.

### Backend skeleton

- **P0-BE-001 — FastAPI app shell**
  - Area: BE
  - Depends on: —
  - Acceptance: Replace stub [backend/main.py](backend/main.py) with a FastAPI app exposing `GET /health` returning `{status: "ok", version}`. `uvicorn main:app --reload --port 8000` starts cleanly.

- **P0-BE-002 — Pydantic Settings loader**
  - Area: BE
  - Depends on: P0-BE-001
  - Acceptance: Single `Settings` class loads from env, validates required keys at startup, exits with a clear error if any are missing.

- **P0-BE-003 — Structured JSON logging with correlation IDs**
  - Area: BE
  - Depends on: P0-BE-001
  - Acceptance: Every request gets a UUID correlation ID via middleware; all logs are single-line JSON with `correlation_id`, `level`, `event`, `timestamp`.

- **P0-BE-004 — PII-masking log filter**
  - Area: BE / SEC
  - Depends on: P0-BE-003
  - PRD: §3.D
  - Acceptance: Log filter masks emails, Indian mobile numbers, Aadhaar, full names; unit tests cover each pattern; sample payloads with PII produce zero unmasked instances in log output.

- **P0-BE-005 — Pydantic input sanitizer middleware**
  - Area: BE / SEC
  - Depends on: P0-BE-001
  - PRD: §3.D
  - Acceptance: Custom validators reject SQLi patterns, `<script>` payloads, and known prompt-injection markers; bad input returns 400 with a generic error; tests cover each vector class.

- **P0-BE-006 — Rate limiter (10 req/min/IP and /session)**
  - Area: BE
  - Depends on: P0-BE-001
  - PRD: §3.B
  - Acceptance: 11th request in 60s window returns 429; per-IP and per-session counters tracked independently; tests verify both axes.

- **P0-BE-007 — CORS allowlist**
  - Area: BE
  - Depends on: P0-BE-001
  - Acceptance: Vite dev origin and a configurable production origin permitted; all others rejected; `withCredentials` works against the matching client.

- **P0-BE-008 — pytest scaffold**
  - Area: BE
  - Depends on: P0-BE-001
  - Acceptance: `pytest` runs and finds at least one passing test; `httpx.AsyncClient` fixture for endpoint tests; coverage report generated.

### LLM provider abstraction

- **P0-ML-001 — `LLMClient` interface**
  - Area: ML / BE
  - Depends on: P0-BE-002
  - Acceptance: ABC with `astream(messages, **kwargs)` and `acomplete(messages, **kwargs)`; non-streaming wraps streaming. Documented in `backend/llm/__init__.py`.

- **P0-ML-002 — Gemini implementation (primary)**
  - Area: ML
  - Depends on: P0-ML-001
  - Acceptance: Wraps `langchain-google-genai`; supports streaming; respects `temperature`, `max_tokens`; integration test against a real key in CI on a small prompt.

- **P0-ML-003 — Provider-resiliency wrapper**
  - Area: ML
  - Depends on: P0-ML-002
  - Acceptance: Single `get_llm()` factory returns the Gemini client with robust retry mechanisms and exponential backoff configuration; logs latency and retry events.

- **P0-BE-009 — `/echo` endpoint round-tripping LLM**
  - Area: BE
  - Depends on: P0-ML-004
  - Acceptance: `POST /api/echo {prompt}` streams back the LLM completion using the configured provider; integration test passes for both providers.

### Data layer

- **P0-DATA-001 — Choose DB and bootstrap**
  - Area: DATA
  - PRD: §1.B
  - Acceptance: Decision recorded in `docs/adr/0001-database.md` (recommend PostgreSQL); local Docker Compose brings up the DB; connection verified from backend.

- **P0-DATA-002 — Migrations tool wired**
  - Area: DATA
  - Depends on: P0-DATA-001
  - Acceptance: Alembic (or chosen tool) initialized; `alembic upgrade head` runs against fresh DB; rollback verified.

### Vector store + embeddings

- **P0-ML-005 — Vector store interface**
  - Area: ML
  - Acceptance: ABC `VectorStore` with `upsert(chunks)`, `search(query, k, filters)`; one implementation for Chroma (local dev) and a stub for Pinecone (prod) selected via env.

- **P0-ML-006 — Embedding model loader**
  - Area: ML
  - PRD: §4
  - Acceptance: `Google Generative AI Embeddings` chosen and documented in `docs/adr/0002-embedding-model.md`; loader initializes the model; benchmark on 100 sample docs recorded.

### Frontend skeleton

- **P0-FE-001 — Routing and layout shell**
  - Area: FE
  - Acceptance: React Router (or equivalent) wired; root layout with header/main/footer landmarks; `/` and `/chat` routes render placeholders; replaces the default [client/src/App.jsx](client/src/App.jsx).

- **P0-FE-002 — Design tokens extending `index.css`**
  - Area: FE
  - Acceptance: Tokens for spacing, radius, motion added to [client/src/index.css](client/src/index.css); existing color tokens preserved; documented in `client/src/styles/README.md`.

- **P0-FE-003 — Accessible base components**
  - Area: FE
  - PRD: §4 (WCAG 2.1 AA)
  - Acceptance: `Button`, `Input`, `Dialog` components with ARIA, focus management, keyboard handlers; axe scan reports zero AA violations on a demo page.

- **P0-FE-004 — vitest scaffold**
  - Area: FE
  - Acceptance: `npm test` runs vitest; one component test passes; jsdom environment configured.

- **P0-FE-005 — Axios client wired into routing**
  - Area: FE
  - Depends on: P0-FE-001
  - Acceptance: All future API calls go through the `instance` from [client/src/config/axios.js](client/src/config/axios.js); a typed wrapper or hook (e.g., `useApi`) centralizes error handling.

---

## Phase 1 — RAG MVP with Source Attribution

### Ingestion

- **P1-ML-001 — HTML loader (Odisha Tourism portal)**
  - Area: ML
  - PRD: §1.A, §5 Tier 1
  - Acceptance: Crawler fetches a configurable seed list, extracts main content, preserves canonical URL; respects `robots.txt` and a per-domain rate limit.

- **P1-ML-002 — PDF loader for curated docs**
  - Area: ML
  - Acceptance: Loads PDFs from a config-driven manifest (path + source URL); OCR fallback for scanned pages; metadata includes original URL.

- **P1-ML-003 — Chunker with metadata binding**
  - Area: ML
  - PRD: §1.A
  - Acceptance: Recursive chunker with overlap; every chunk carries `source_url`, `tier` (1/2/3), `published_at`, `language`; chunk size tuned for the chosen embedding model.

- **P1-ML-004 — Idempotent vector upsert**
  - Area: ML
  - Depends on: P0-ML-005, P1-ML-003
  - Acceptance: Upsert keyed by `(source_url, chunk_index)`; re-running ingestion does not duplicate; deletes orphaned chunks when a doc is removed.

- **P1-ML-005 — Tier 1 corpus ingested**
  - Area: ML / DATA
  - Depends on: P1-ML-001, P1-ML-002, P1-ML-004
  - Acceptance: Odisha Tourism portal + curated PDFs ingested end-to-end; vector count and per-source breakdown logged.

### Retrieval & answer

- **P1-ML-006 — Hybrid retrieval with re-ranking**
  - Area: ML
  - Acceptance: Dense (Gemini Embeddings) + keyword (BM25) retrieval combined; cross-encoder re-ranker on top-K; latency budget for retrieval ≤ 600ms recorded.

- **P1-ML-007 — Output formatter prompt with mandatory citation**
  - Area: ML
  - PRD: §1.A
  - Acceptance: System prompt forces a markdown hyperlink to the top-cited source at end of answer; regex post-check rejects answers without it and regenerates once before falling back.

- **P1-ML-008 — Confidence threshold + fallback hook**
  - Area: ML
  - PRD: §2.D
  - Acceptance: Confidence score defined (re-ranker score, documented in `docs/adr/0003-confidence.md`); below threshold returns a fallback marker that Phase 6 will turn into the email-capture flow.

### API & UI

- **P1-BE-001 — `/api/chat` streaming endpoint**
  - Area: BE
  - Depends on: P1-ML-006, P1-ML-007, P0-ML-004
  - Acceptance: SSE or chunked-encoding stream; emits tokens as they arrive; final event includes citations and confidence; integration test against a fixture corpus.

- **P1-FE-001 — Minimal chat UI**
  - Area: FE
  - Depends on: P0-FE-003, P1-BE-001
  - Acceptance: Message list with user/assistant roles, input box, streaming render, citation rendering as a clickable link; manual smoke test answers a Tier 1 question end-to-end.

### Evaluation

- **P1-ML-009 — Eval set + CI gate**
  - Area: ML / OPS
  - Acceptance: `eval/questions.yaml` with ~50 questions, expected facts, and acceptable source URLs; CI job runs the eval, fails if citation rate < 100% or hallucination rate > 0%.

---

## Phase 2 — Sessions & User Classification

- **P2-FE-001 — Guest in-memory conversation buffer**
  - Area: FE
  - PRD: §1.B
  - Acceptance: Conversation lives in React state + `sessionStorage`; cleared on `beforeunload`; no API call writes guest messages to a DB.

- **P2-BE-001 — Guest path: zero DB writes**
  - Area: BE / SEC
  - PRD: §1.B
  - Acceptance: Integration test: send 5 guest messages, query DB → empty.

- **P2-FE-002 — Identity capture form (bypassable)**
  - Area: FE
  - PRD: §1.B
  - Acceptance: First chat opens with optional Name/Email/Mobile; `Skip` button sets guest mode; submitting promotes to identified session.

- **P2-DATA-001 — `users`, `sessions`, `chat_messages` schema**
  - Area: DATA
  - Depends on: P0-DATA-002
  - PRD: §1.B, §3.D
  - Acceptance: Migrations create the tables; PII columns (name, email, mobile) wrapped in field-level AES-256 encryption; encryption key sourced from env/KMS.

- **P2-DATA-002 — TTL hard-delete (3 days / 259,200s)**
  - Area: DATA
  - Depends on: P2-DATA-001
  - PRD: §1.B
  - Acceptance: For Postgres: `pg_cron` job deletes rows where `created_at < now() - interval '3 days'`; verified by inserting a backdated row and observing automatic removal. For Mongo: native TTL index.

- **P2-BE-002 — Session resume within 72h**
  - Area: BE
  - Depends on: P2-DATA-002
  - Acceptance: Returning user (cookie or token) within 72h gets prior turns loaded into the next prompt; after 72h the history is gone.

- **P2-BE-003 — Token-budget context assembly**
  - Area: BE / ML
  - Acceptance: Trims oldest turns first; preserves system prompt and last K turns; emits a metric `context_truncated_total`; unit-tested at the budget boundary.

---

## Phase 3 — Conversational Intelligence

- **P3-ML-001 — Intent classifier**
  - Area: ML
  - PRD: §1.C, §2.C
  - Acceptance: Classifies into `booking | exploration | historical | transport | pricing | other`; ≥ 90% accuracy on a labeled dev set; pricing label routes to a stub handoff (full handoff in Phase 6).

- **P3-ML-002 — Disambiguation prompt for short queries**
  - Area: ML
  - PRD: §1.C
  - Acceptance: Single-word location queries (e.g., `Puri`) return overview + structured quick-reply filters matching the PRD example; no generic failure responses on a curated short-query test set.

- **P3-FE-001 — Quick-reply chip rendering**
  - Area: FE
  - Depends on: P3-ML-002
  - Acceptance: Backend can return chip suggestions; UI renders them as accessible buttons that submit the chip text on click/Enter.

- **P3-DATA-001 — `query_log` table**
  - Area: DATA
  - PRD: §1.E
  - Acceptance: Schema with `query_text`, `embedding`, `intent`, `created_at`, `session_kind` (`guest|identified`); explicit comment that no user identifiers are stored.

- **P3-BE-001 — Async query logging worker**
  - Area: BE
  - Depends on: P3-DATA-001
  - PRD: §1.E
  - Acceptance: Chat path enqueues; worker writes; load test confirms enqueue adds < 5ms p99 to chat path.

- **P3-BE-002 — Frequency aggregation job**
  - Area: BE / DATA
  - Depends on: P3-DATA-001
  - Acceptance: Scheduled job computes top topics over rolling 24h/7d/30d windows; results stored in `query_aggregates` for low-latency reads.

- **P3-ML-003 — Predictive recommendations**
  - Area: ML
  - Depends on: P3-BE-002, P2-DATA-001
  - PRD: §1.E
  - Acceptance: For an identified returning user, surfaces ≥ 1 recommendation grounded in their prior topics; for guests, surfaces global trending topics.

---

## Phase 4 — Multilingual & Voice

- **P4-FE-001 — Odia rendering verification**
  - Area: FE
  - PRD: §4
  - Acceptance: Odia script renders correctly on Windows Edge/Chrome/Firefox, Android Chrome, iOS Safari; font fallback stack documented; no garbled glyphs in screenshot tests.

- **P4-ML-001 — Code-switching retrieval validation**
  - Area: ML
  - PRD: §4
  - Acceptance: Eval set includes Romanized Odia and mixed-language queries; retrieval recall on these matches Tier 1 English queries within 10%.

- **P4-FE-002 — Microphone UI + Web Speech API**
  - Area: FE
  - PRD: §4
  - Acceptance: Mic button records, shows live transcript, submits on stop; clear consent prompt on first use; recording indicator visible while active.

- **P4-BE-001 — Whisper STT fallback endpoint**
  - Area: BE
  - PRD: §4
  - Acceptance: `POST /api/stt` accepts audio chunks, returns transcript; used by FE when Web Speech API is unavailable; tested for Odia and Romanized Odia samples.

- **P4-FE-003 — WCAG 2.1 AA audit on chat surface**
  - Area: FE
  - PRD: §4
  - Acceptance: axe / Lighthouse report zero AA violations; manual screen-reader smoke test (NVDA on Windows) passes; keyboard-only navigation completes a full chat turn.

---

## Phase 5 — Maps & Spatial Routing

- **P5-FE-001 — Location-consent banner**
  - Area: FE
  - PRD: §1.D
  - Acceptance: Geolocation is never called before consent; banner re-prompts if browser permission is later revoked; "Deny" path still allows map URLs without device location.

- **P5-ML-001 — Itinerary intent → Maps URL injection**
  - Area: ML / BE
  - Depends on: P3-ML-001
  - PRD: §1.D
  - Acceptance: Itinerary answers include a Google Maps Route URL synced with the textual stops; URL format validated; no URL when no stops are extractable.

- **P5-FE-002 — Slow-network text-only fallback**
  - Area: FE
  - PRD: §1.D
  - Acceptance: When Network Information API reports `2g`/`slow-2g` or response time exceeds threshold, UI requests text-only directions and hides the map link.

- **P5-OPS-001 — Daily link-health cron**
  - Area: OPS / BE
  - PRD: §1.D
  - Acceptance: Job validates every URL surfaced in the last N days; broken URLs flagged in DB and emit an admin alert; subsequent answers using that source switch to fallback template.

---

## Phase 6 — Safety Guardrails

- **P6-ML-001 — Sentiment scoring on user input**
  - Area: ML
  - PRD: §2.A
  - Acceptance: Per-message sentiment score; threshold for "high frustration" defined; tunable via config.

- **P6-BE-001 — Escalation flow with frozen demographics**
  - Area: BE / FE
  - Depends on: P6-ML-001
  - PRD: §2.A
  - Acceptance: On trigger, response surfaces official Odisha Tourism contact registry; previously captured Name/Email/Mobile are pre-filled and locked behind a token so the user cannot re-enter them.

- **P6-ML-002 — Profanity filter + identity rectification**
  - Area: ML / BE
  - PRD: §2.B
  - Acceptance: Offensive input triggers display-name reset to `Srimaan` or `Srimati` (gender heuristic) and switches the system prompt to a strict formal register; admin-editable wordlist.

- **P6-BE-002 — Pricing handoff interceptor**
  - Area: BE
  - Depends on: P3-ML-001
  - PRD: §2.C
  - Acceptance: Pricing intent never reaches the LLM; response is a fixed template linking to OTDC booking system / Book Odisha; tracing test confirms zero LLM calls on pricing prompts.

- **P6-BE-003 — Email-fallback resolution loop**
  - Area: BE / FE
  - Depends on: P1-ML-008
  - PRD: §2.D
  - Acceptance: Low-confidence answer triggers polite apology + email capture; ticket auto-created with `priority=high`; SMTP sends acknowledgement within 1 minute.

- **P6-DATA-001 — `tickets` table for fallback queue**
  - Area: DATA
  - Depends on: P6-BE-003
  - Acceptance: Schema with `query`, `confidence`, `category`, `email`, `status`, `created_at`; admin actions later reference this table.

- **P6-FE-001 — Idle-timeout flow**
  - Area: FE / BE
  - PRD: §2.E
  - Acceptance: After 5 min idle, server pings "Do you need further assistance?"; after additional 120s no response, formal closing message and channel terminated.

---

## Phase 7 — Compliance & Hardening

- **P7-SEC-001 — AES-256 PII encryption review**
  - Area: SEC / DATA
  - Depends on: P2-DATA-001
  - PRD: §3.D
  - Acceptance: Every PII column verified encrypted at field level; key rotation procedure documented in `docs/runbooks/key-rotation.md`.

- **P7-OPS-001 — TLS 1.3 enforcement**
  - Area: OPS
  - PRD: §3.D
  - Acceptance: Reverse proxy config enforces TLS 1.3, HSTS enabled, plain HTTP redirects to HTTPS; verified by `testssl.sh` or equivalent.

- **P7-SEC-002 — Log-masking regex suite**
  - Area: SEC
  - Depends on: P0-BE-004
  - Acceptance: Coverage extended to Aadhaar, PAN, multiple mobile-number formats; fuzz tests confirm no leakage on a 10k-line synthetic log.

- **P7-SEC-003 — Security test suite (SQLi/XSS/CSRF)**
  - Area: SEC
  - Acceptance: Automated checks on every endpoint; OWASP ZAP baseline scan green in CI.

- **P7-SEC-004 — Prompt-injection eval**
  - Area: SEC / ML
  - Acceptance: Curated jailbreak corpus (50+ prompts) run against `/api/chat`; system prompt never leaks; guardrails (pricing, profanity, fallback) never bypassed; CI gate.

- **P7-ML-001 — Tier 2 corpus ingestion**
  - Area: ML
  - PRD: §5
  - Acceptance: Central Government repos, Incredible India, ASI monument analytics ingested with `tier=2` metadata.

- **P7-ML-002 — Tier 3 corpus ingestion**
  - Area: ML
  - PRD: §5
  - Acceptance: Wikipedia + peer-reviewed cultural analytics ingested with `tier=3`.

- **P7-ML-003 — Tier-aware re-ranker**
  - Area: ML
  - Depends on: P1-ML-006, P7-ML-001, P7-ML-002
  - Acceptance: Re-ranker prefers Tier 1 ≻ Tier 2 ≻ Tier 3 on a deliberately overlapping query set; demonstrated in eval.

---

## Phase 8 — Admin Console

- **P8-BE-001 — Admin auth (separate from user auth)**
  - Area: BE / SEC
  - Acceptance: Separate user model, role-based access (`admin`, `operator`, `viewer`), MFA optional; admin endpoints rejected without admin token.

- **P8-FE-001 — Admin dashboard shell**
  - Area: FE
  - Depends on: P8-BE-001
  - Acceptance: Routes for tickets, content, analytics; protected by admin auth; logout clears session.

- **P8-FE-002 — Workflow routing dashboard**
  - Area: FE
  - Depends on: P6-DATA-001
  - PRD: §5
  - Acceptance: Lists tickets categorized as `booking | complaint | informational`; filters and priority flags; pagination.

- **P8-BE-002 — Bulk Approve & Send**
  - Area: BE
  - PRD: §5
  - Acceptance: `POST /api/admin/tickets/bulk-resolve` accepts up to 100 IDs; sends responses via SMTP; updates ticket status; audit log row per item.

- **P8-FE-003 — Document upload UI**
  - Area: FE / ML
  - PRD: §5
  - Acceptance: Operator uploads a PDF; UI shows a job ID; live status of chunking → embedding → upsert.

- **P8-BE-003 — Re-embedding pipeline as background job**
  - Area: BE / ML
  - Depends on: P8-FE-003, P1-ML-004
  - Acceptance: Upload returns immediately; worker processes in background; no UI block during long jobs.

---

## Phase 9 — Performance & Resiliency

- **P9-ML-001 — Per-intent model selection**
  - Area: ML
  - Acceptance: Fast-path intents use a smaller OpenAI model; complex reasoning uses a larger model; mapping documented.

- **P9-OPS-002 — Load test rig (k6 or Locust)**
  - Area: OPS
  - PRD: §3.A
  - Acceptance: Reproducible script simulating 1k concurrent sessions with realistic conversation patterns; report includes p50/p95/p99 chat latency, TTFT, error rate.

- **P9-OPS-003 — Autoscaling rules**
  - Area: OPS
  - Acceptance: App-server and worker autoscaling tied to queue depth or p95 latency; verified by load test.

- **P9-ML-002 — Provider circuit breaker (Gemini Rate Limits)**
  - Area: ML
  - Depends on: P0-ML-003
  - Acceptance: Opens after N consecutive 429s/5xx or sustained latency breach; half-open probe restores when healthy; chaos test forcing Gemini API failures recovers within SLA via retry backoff.

- **P9-ML-003 — Per-provider quota and cost tracking**
  - Area: ML / OPS
  - Acceptance: Token usage and cost emitted as Prometheus metrics; alert when daily spend exceeds budget threshold.

- **P9-OPS-004 — Observability dashboards**
  - Area: OPS
  - Acceptance: Grafana dashboards for retrieval latency, LLM TTFT, tokens/sec, per-provider error rate, cost; runbook links.

---

## Phase 10 — Pilot & Launch

- **P10-SEC-001 — DPDP self-audit closure**
  - Area: SEC / DOCS
  - Acceptance: Checklist covering §3.D items signed off; gaps tracked to issues; report stored in `docs/compliance/dpdp-audit.md`.

- **P10-SEC-002 — Third-party security review**
  - Area: SEC
  - Acceptance: External review report attached; no high-severity findings open at launch.

- **P10-OPS-005 — UAT environment with Tier 1-only corpus**
  - Area: OPS
  - Acceptance: Isolated environment loaded with Tier 1 snapshot; access restricted to UAT users.

- **P10-DOCS-002 — Runbooks**
  - Area: DOCS / OPS
  - Acceptance: `docs/runbooks/` covers incident response, on-call rotation, rollback, key rotation, DB restore, provider failover.

- **P10-OPS-006 — Staged rollout**
  - Area: OPS
  - Acceptance: Internal → small public cohort → full public; rollback rehearsed in UAT before production cutover.

---

## Cross-cutting tasks (apply continuously)

- **X-DOCS-001 — ADR per architectural decision**
  - Each non-trivial choice (DB, embeddings, confidence metric, LLM provider strategy) gets an ADR in `docs/adr/`.

- **X-SEC-001 — Secret scanning in CI**
  - `gitleaks` or equivalent runs on every PR; failure blocks merge.

- **X-OPS-001 — Dependency update cadence**
  - Monthly review of `requirements.txt` and `package.json`; security advisories actioned within SLA.

- **X-FE-001 — i18n discipline**
  - No hardcoded user-visible English; all strings go through the i18n layer once one is introduced.

- **X-OPS-002 — Backup and restore drills**
  - Quarterly DB restore drill from backup; verified RPO/RTO.
