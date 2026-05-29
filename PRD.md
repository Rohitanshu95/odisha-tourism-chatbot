# System Requirement Document (SRD): \[Pathik AI\]

**Project Phase:** Version 2.0 (Official Government Approval & Technical Blueprint)

**Project Objective:** To build a highly secure, intelligent, multilingual, and government-compliant AI chatbot system for Odisha Tourism. This system will give priority to official data sources, provide dynamic functionalities (maps, links, routing), and transition unresolved queries into an automated lead conversion system.

## 1\. Core AI Capabilities & Functional Features

### A. Intent-Driven Responses with Official Reference Links

- **Behavior Specifications:** The Machine Learning Engine must identify the user's exact intent (such as booking, exploration, historical inquiry, or transport logistics) at a semantic level to generate the response.
- **SEO & Knowledge Source Integration:** Every answer delivered by the chatbot must be 100% authentic and verifiable. If a landing page related to the inquiry is live on the official website of Odisha Tourism or primary government portals, the system must append its Referral Hyperlink at the end of the response.
- **Technical Architecture:** A metadata tag of the source URL will remain bound with every document data upserted into the Retrieval-Augmented Generation (RAG) pipeline. The Language Model (LLM) will be restricted through an output formatting prompt to display hyperlinks in standard markdown format.

### B. Conversation Memory Management & User Classification

User data retention in the system architecture is classified into two distinct parts:

- **Option 1: Guest User (Unauthenticated Session):** Identification inputs (Name, Email, Mobile) will not be mandatory at the time of chatbot initialization. The user can bypass this. If the guest user closes or refreshes the browser window, the session context will be permanently wiped (In-memory storage isolation, zero database persistence).
- **Option 2: Identified User (Authenticated Session):** As soon as user details are captured, a profile will be created on a secure database cloud. The system will retain the user's interaction context for **72 hours (3 Days)**. If the user returns within 3 days, the system will resume the conversation from a context-aware state.
- **Technical Implementation:** A persistent session table will be registered for identified profiles in the database structural layer (PostgreSQL/MongoDB), where a **TTL (Time-To-Live) index will be configured at 259,200 seconds (3 days)** so that data is automatically hard-deleted post-expiry. For guest sessions, ConversationBufferMemory will initialize on the local interface layer.
- **Deep Context Retention:** The system context must not drop during a long conversation. Using MongoDBChatMessageHistory or a similar stack, the evaluation of the complete interaction chain will be pipelined within the token memory limit.

### C. Smart Disambiguation Prompting

- **Behavior Specifications:** The system will not go into a generic failure state when single-word queries or short semantic inputs (e.g., "Puri") are received. The core processor will generate an authoritative overview of the target destination and trigger user validation by displaying structural quick reply filters.
- **Standard Interaction Flow:**
  - _User:_ "Puri"
  - _Pathik AI:_ "Puri is a highly revered and iconic coastal ecosystem of Odisha. In which domain related to Puri do you need specialized data?
    - Shri Jagannath Mandir
    - Blue Flag Golden Beach
    - Ratha Yatra & Festivals
    - OTDC Hotels & Accommodation "

### D. Dynamic Spatial Routing (Google Maps API Integration)

- **Behavior Specifications:** When itinerary inquiries or multi-destination routes are created, the system will inject an explicit **Google Maps Route URL** synced with detailed text responses.
- **Geo-permissions & Privacy:** It is mandatory to display a standard browser validation (Explicit Location Consent Banner) on the frontend client before activating map redirection or device location tracking.
- **Bandwidth Constraint Fallback (Slow Internet):** The system will load linear textual directions (Landmarks, Transport Numbers) when low network bandwidth is detected or to optimize API timeout errors.
- **Link Health Monitoring Engine:** A script-driven automated cron job will compile on the database layer to run a validation test on the system's embedded links every 24 hours. If a broken URL is detected, an alert will be emitted on the admin panel and the database fallback state will activate an automatic text template.

### E. Query Analytics & Suggestion Optimization Engine

- **Persistent Query Logging:** The data pipeline will log and archive all incoming user queries asynchronously into a centralized telemetry table. This transaction log will strip personal identifiers to maintain privacy while saving raw semantic vectors.
- **Frequency Tracking & Aggregation:** The system will automatically compute query repetition counts. It will track exactly how many times a specific query or semantic topic has been asked across the platform within a defined timeframe.
- **Predictive Recommendations:** Based on historical log aggregation, the AI will build a contextual user-interest profile. This data will be leveraged to dynamically surface better suggestions, personalized travel itineraries, and trending information modules during active sessions.

## 2\. Security, Compliance & Governance Guardrails

### A. Sentiment Analysis & Exception Handling

- **Behavior Specifications:** Real-time text tokens will undergo continuous contextual analysis computation. If high frustration or negative sentiment indices are registered in the user output, the system will activate a dynamic resolution loop.
- **Escalation Architecture:** If an instantaneous solution does not match from the contextual database, the chatbot will display the **Official Contact Registry (Support Email & Helpline) of the Odisha Tourism Department** on the primary communication layer. Previously captured user demographics data will be frozen at the form level with a unique token to avoid repetitive input entry.

### B. Profanity Sanitization & Token Normalization

- **Behavior Specifications:** The system will execute a strict string filtering engine as soon as offensive text streams, vernacular abuses, or anomalous profile formatting are identified in the user input pipeline.
- **Identity Rectification:** Upon detecting bad string inputs, user profile name variables will be strictly sanitized in the system memory and reset to **"Srimaan" (Sir) or "Srimati" (Ma'am)** format, and the engine will enforce a strict formal, respectful response formatting constraint.

### C. Static Pricing Architecture & Financial Non-Commitment

- **Behavior Specifications:** Pricing quotes, dynamic booking values, or ticketing estimations will not be handled by the core LLM data baseline, avoiding dynamic valuation inconsistencies (Hallucinations) and preventing legal liabilities.
- **Resolution Engine:** As soon as pricing inputs are triggered, a prompt restriction mechanism will load an explicit response and hand off the user data interface to primary transactional portals (OTDC booking system, Book Odisha API gate).

### D. Zero-Hallucination & Email Fallback Protocol

- **Absolute Accuracy Constraint:** Under no circumstances is Pathik AI permitted to generate unverified, ambiguous, or hallucinated information. Ensuring factual correctness is a hard constraint for government regulatory compliance.
- **Fallback Resolution Loop:** In instances where the confidence score of the retrieved RAG content falls below the structural threshold, or if the system cannot verify the facts, the model will immediately trigger a polite apology template.
- **Lead Capture & Resolution Delivery:**
  - _System Response:_ "We apologize, but we cannot verify that specific information at the moment. Please provide your Email ID, and our support team will email the verified details to you shortly."
  - _Technical Action:_ The system will isolate the query, flag it as unverified, automatically generate a high-priority ticket in the admin dashboard, and capture the user's email address to execute an offline resolution fulfillment via SMTP email.

### E. Session Dormancy & Idle Timeout Action

- **Behavior Specifications:** If the frontend chat widget goes into a static background state and no request processing state is emitted on the text socket, a pre-configured inactivity schedule will initialize.
- **System Action:** A backend ping will be triggered when a continuous 5-minute idle state is detected: _"Do you need further assistance on this topic?"_. If the response socket remains inactive, a formal closing function token will be pushed in the next 120 seconds to destroy the network channel.

## 3\. Systems Architecture & Non-Functional Specifications

### A. Latency SLA Matrix

- **Requirement:** The total system latency optimization profile will be bound within the standard operational threshold. The maximum transaction response time limit (p99 latency analysis) will be configured at **less than 3 seconds**, which includes the multi-vector search processing time and the full context streaming window compute matrix.

### B. Elastic Scaling & Concurrency Infrastructure

- **Scalability Profile:** The infrastructure will leverage dynamic compute pooling to handle thousands of parallel interactive sockets during high-demand cultural phases (e.g., Shri Ratha Yatra peak seasons).
- **Rate Limiting Layer:** A network layer spam filtration will be implemented on single IP endpoints and active sessions (through a configured rule of max 10 payload dispatches per minute using the FastAPI rate-limiting plugin framework).

### C. Enterprise AI Stack Optimization

- **Core Engineering Layer:** The system architecture will deploy open-source LLM layers (**Llama 3 8B / Mistral 7B** execution profiles via an optimized vLLM engine inference framework), structural extraction standard engines (**LangChain/LlamaIndex** architectures), and low-latency vector indexing cluster databases (**ChromaDB/Pinecone** structures).
- **Resiliency Configuration:** To optimize primary enterprise local server runtime degradation or connectivity failures, the exception handling system will instantaneously activate tertiary API clusters (e.g., Fallback Groq Cloud / alternative endpoints).

### D. Security Architecture & Regulatory Alignment

- **DPDP Act 2023 Compliance:** Captured personal data profiles (PII data) will be processed in the database memory stack with **AES-256 bit structure array encryption** at baseline levels, and network channel transit streams will enforce a **TLS 1.3 architecture** baseline. System monitoring dashboard logs will completely mask (\*\*\*\*\*\*) identity parameters using high-security regex algorithms at structural layers.
- **Input Injection Mitigation:** Pydantic text sanitizers will be configured at the backend gateway core validation level to neutralize SQL Injection vectors, Cross-Site Scripting (XSS) code snippets, and LLM Prompt Hijacking attacks.

## 4\. Multi-language Core Optimization & Accessibility

- **Native Unicode Script Execution:** Native Odia typography script input parameters will comply with proper UTF-8 code standard layouts in the system parsing engines. The UI optimization criteria will run standard script templates to avoid text garbling on structural devices.
- **Code-Switching Processing:** A multilingual dense embeddings (multilingual-e5-large / BGE-M3) process layer will be set up to accurately compute and classify vernacular code-switching syntax expressions (e.g., Romanized Odia queries, mixed linguistic dialects).
- **Voice Input & Speech-to-Text (STT) Integration (New Feature):** To enable hands-free interaction, the system will integrate a native microphone interface on the frontend. Users can speak their queries directly into the chatbot. The system will leverage low-latency Speech-to-Text streaming APIs (such as the Web Speech API or multilingual Whisper endpoints) to translate spoken voice into text in real-time before pushing it into the AI core engine.
- **WCAG 2.1 AA Inclusion Standards:** The frontend rendering component will align with complete compliance configurations-Semantic layout tags, ARIA identifiers, full Keyboard Tab/Enter event listeners tracking, and structural contrast profiles will be natively integrated.

## 5\. Administration Control & Lifecycle Framework

- **Workflow Routing Dashboard:** A user metrics visualization cluster will be deployed in the main processing state. Unresolved tokens and fallback email requests will apply categorization routing through the system engine-category splits will generate automatic logic maps (Booking tickets, complaints metrics, informational tracks) to prioritize alert flags.
- **Bulk Transaction Ledger:** An optimization logic layer for system operations monitoring will verify multiple pending queues of system responses to allow batch array optimization processing (**"Bulk Approve & Send"** state mechanisms).
- **Knowledge Stream Lifecycle:** When government documentation parameters change or dynamic policy index parameters are pushed, the dashboard upload handler will run a custom data processing routine. This will compute local storage document split chunks and automatically trigger real-time dynamic vector base recalculation pipeline updates.

### System Priority Data Classification Checklists

- **Tier 1 Data Profile:** Odisha State Government Portals, Certified Department Guidelines, Official Document Publications.
- **Tier 2 Data Profile:** Central Indian Government Repositories, Incredible India Dataset Matrix, ASI Monument Analytics.
- **Tier 3 Data Profile:** Wikipedia Data Engines, Standard Peer-reviewed Cultural Analytics.