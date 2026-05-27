# Project Plan: Odisha Tourism Chatbot

## Context
- **Goal:** Develop an Agentic RAG chatbot for Odisha Tourism with real-time capabilities (routing, weather, budget) and cultural knowledge.
- **Architecture:** 
  - Backend: Python (FastAPI/LangChain or LlamaIndex) in the `server` directory.
  - LLM: OpenAI (`gpt-4o` or `gpt-4o-mini`).
  - Vector DB: ChromaDB.
  - Data Source: Web scraping from `odishatourism.gov.in`.
  - Frontend: React in the `client` directory.
- **Strategy:** Backend-first development utilizing the existing structure (`server/src`, `server/data`, `server/vector_store`).

## Task Breakdown (Development Phases)

### Phase 1: Backend Setup & Web Scraping (Current Focus)
- `[ ]` Initialize Python backend environment and update `requirements.txt` (`openai`, `chromadb`, `langchain`/`llamaindex`, `beautifulsoup4`, `fastapi`, `uvicorn`).
- `[ ]` Build a web scraper targeting `https://odishatourism.gov.in/content/tourism/en.html#immersiveOdisha`.
- `[ ]` Clean and chunk the scraped text (focusing on heritage, culture, food, and dress codes).
- `[ ]` Save raw and cleaned data into the `server/data/` folder.

### Phase 2: Vector Database & RAG Pipeline
- `[ ]` Initialize ChromaDB locally in `server/vector_store/`.
- `[ ]` Create the embedding pipeline using OpenAI's embedding models (e.g., `text-embedding-3-small`).
- `[ ]` Implement the base RAG retrieval logic to accurately query cultural, food, and heritage data.

### Phase 3: Agentic Tool Integration
- `[ ]` Implement external API tools for the LLM:
  - **Weather Tool** (e.g., OpenWeather API).
  - **Distance/Routing Tool** (e.g., Google Maps API or OpenStreetMap).
  - **Budget/Hotel Estimator Tool** (Mocked logic or simple heuristic based API for MVP).
- `[ ]` Configure the central OpenAI Agent with tool-calling capabilities to route between standard RAG (culture/food) and dynamic tools (weather/distance/budget).
- `[ ]` Implement the "Trip Planner" prompt/chain that orchestrates and synthesizes routes, stays, and budgets.

### Phase 4: API Layer & Memory Setup
- `[ ]` Set up FastAPI in `server/main.py`.
- `[ ]` Create chat endpoints (e.g., `/api/v1/chat`).
- `[ ]` Add session memory management so the bot remembers the user's ongoing trip context across messages.
- `[ ]` Test the backend via Swagger UI (`/docs`).

### Phase 5: Frontend Development (React)
- `[ ]` Initialize React frontend in the `client` folder.
- `[ ]` Build the Chat UI component (messages, input, loading states, markdown rendering).
- `[ ]` Integrate with the backend API and handle response rendering.

## Agent Assignments
- **`backend-specialist`**: Handles Phases 1-4 (Scraping, FastAPI, OpenAI integration, ChromaDB, Tool creation).
- **`frontend-specialist`**: Handles Phase 5 (React Chatbot UI).

## Verification Checklist
- `[ ]` **Distance Tool:** Can the bot retrieve distance between Bhubaneswar and Puri?
- `[ ]` **Weather Tool:** Can the bot fetch current weather for Konark?
- `[ ]` **RAG Accuracy:** Can the bot provide dress code rules for Jagannath Temple based on scraped data?
- `[ ]` **Trip Planner:** Can the bot generate a coherent 3-day trip plan within a given budget?
- `[ ]` **API Health:** Is the backend API responding to chat queries in under a reasonable time limit?
