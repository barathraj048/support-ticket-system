# Support Ticket System

A full-stack support ticket system with LLM-powered auto-categorization.

## Stack
- **Backend**: Django + Django REST Framework + PostgreSQL
- **Frontend**: React (Vite)
- **LLM**: Groq Cloud (llama3-8b-8192) — chosen for speed, free tier, and OpenAI-compatible API
- **Infrastructure**: Docker + Docker Compose

## Why Groq?
Groq offers extremely fast inference (LPU hardware), has an OpenAI-compatible API, generous free tier, and low latency — ideal for real-time UX while a user is typing a ticket description.

## Setup

1. Clone / unzip the project
2. Copy `.env.example` to `.env` and add your Groq API key:
   ```
   GROQ_API_KEY=your_key_here
   ```
3. Run:
   ```bash
   docker-compose up --build
   ```
4. Open http://localhost:3000

## Design Decisions

- **LLM classify endpoint** is called on description blur (not on every keystroke) to avoid excessive API calls
- **Graceful degradation**: if LLM fails, form still works — dropdowns just keep defaults
- **DB-level aggregation**: stats endpoint uses Django ORM `aggregate()` and `annotate()` — no Python loops
- **Category/priority** are enforced at DB level via CharField choices + constraints
- Migrations run automatically on container startup via entrypoint script

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/tickets/ | Create ticket |
| GET | /api/tickets/ | List tickets (filterable) |
| PATCH | /api/tickets/:id/ | Update ticket |
| GET | /api/tickets/stats/ | Aggregated stats |
| POST | /api/tickets/classify/ | LLM classification |