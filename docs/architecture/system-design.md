# PrepVerse System Architecture & Design

This document details the high-level and component architecture for **PrepVerse** (Personal Placement Operating System).

---

## 1. High-Level Data Flow Pipeline

```text
[ Browser / Client ]
  (React + Vite + Tailwind CSS)
         │
         │ HTTP / JSON Requests (via Axios)
         ▼
[ API Versioning Layer ]
  (/api/v1/...)
         │
         ▼
[ Express Application Pipeline ]
  ├── Helmet (Security Headers)
  ├── CORS (Cross-Origin Policy Enforcement)
  ├── Morgan (Request Logging)
  ├── Express.json() (Body Parsing)
  ├── Route Handlers & Controllers
  └── Centralized Error & 404 Handlers
         │
         ▼
[ Data Access Layer (Mongoose) ]
  ├── Schemas & Models (User, Assessment, etc.)
  └── Connection Pooling & State Inspector
         │
         ▼
[ Database (MongoDB) ]
  (MongoDB Atlas / Local MongoDB)
```

---

## 2. Layer Responsibilities

### 2.1 Browser (Frontend)
- **Role**: Renders user interfaces, captures user actions (taking assessments, creating study rooms, viewing preparation plans), and manages client-side state.
- **Technologies**: React 18, Vite (fast HMR build tool), Tailwind CSS (design token utility classes), React Router (client routing), Axios (HTTP client with interceptors).
- **Communication**: Communicates with the backend exclusively through `/api/v1` REST endpoints and (in future phases) Socket.IO WebSocket channels.

### 2.2 API Gateway & Versioning (`/api/v1`)
- **Role**: Establishes a predictable, backwards-compatible contract between client and server.
- **Why `/api/v1`?**: Allows evolving APIs over time without breaking existing clients or mobile frontends.

### 2.3 Express Server (Backend Core)
- **Role**: Business logic execution, authentication validation, request sanitization, and readiness calculation.
- **Security Middleware**:
  - `helmet`: Sets HTTP security headers (X-Content-Type-Options, HSTS, frameguard, etc.).
  - `cors`: Restricts API access exclusively to trusted origins (e.g. `http://localhost:5173` or production domains).
  - Centralized Error Handling: Catches asynchronous and synchronous errors, standardizes response formats (`{ success: false, message: ... }`), and suppresses sensitive stack traces in production.

### 2.4 MongoDB & Mongoose
- **Role**: Primary document database storing user profiles, diagnostic questions, assessment scores, and preparation roadmaps.
- **Design Philosophy**: Normalized schemas for critical relational data (Users, Assessments), embedded sub-documents for fast read access where appropriate.
- **Connection Management**: Persistent connection pool managed in `server/src/config/db.js` with active health state reporting (`connected`, `connecting`, `disconnected`).

---

## 3. Future Architectural Components (Planned Roadmap)

```text
                                  ┌───────────────────────────────┐
                                  │      AI Service Gateway       │
                                  │  (LLM Prompt Orchestration)   │
                                  └───────────────▲───────────────┘
                                                  │
                                                  │ Deterministic JD Parsing / Feedback
                                                  │
┌─────────────────┐   HTTP REST   ┌───────────────▼───────────────┐   Mongoose    ┌─────────────────┐
│ Browser Client  ├───────────────►        Express Server         ├───────────────►  MongoDB Atlas  │
│  (React + Vite) ◄───────────────┤          (/api/v1)            ◄───────────────┤                 │
└────────▲────────┘               └───────────────┬───────────────┘               └─────────────────┘
         │                                        │
         │ WebSocket (Socket.IO)                  │ Pub/Sub & Fast Cache
         ▼                                        ▼
┌─────────────────┐                       ┌───────────────────────┐
│ Real-Time Sockets                       │     Redis Cache       │
│ (Study Rooms /                          │ (Presence, Leaderboard│
│  Peer Practice)                         │  & Distributed State) │
└─────────────────┘                       └───────────────────────┘
```

### 3.1 Real-Time WebSockets (`Socket.IO` — Phase 6)
- **Purpose**: Low-latency, bidirectional events for live study rooms, peer matching, and presence indicators ("3 peers studying DSA right now").
- **Integration**: Attached to the same HTTP server instance in `server/src/server.js`, separated into `server/src/sockets/` handlers.

### 3.2 Redis Caching & Pub/Sub (Optional / Scaling)
- **Purpose**: Fast in-memory leaderboard calculation, real-time active user counting, and shared session storage when horizontally scaling Express nodes.

### 3.3 AI Service (Job Description & Interview Feedback — Phase 5)
- **Purpose**: Converts unstructured job descriptions into structured skill requirements, generates deterministic interview prompts, and provides targeted weakness suggestions.
- **Principle**: Backend-only orchestration. API keys never reach the browser client. Responses are parsed and validated strictly against defined JSON schemas before saving to MongoDB.

---

## 4. Security Architecture

1. **Environment Segregation**: Secrets and connection URIs live strictly in `.env` files, templated by `.env.example`.
2. **Strict CORS Policy**: Disallows wildcard origins when credentials (cookies/tokens) are passed.
3. **Data Sanitization**: Mongoose schema casting and input validation middleware to mitigate NoSQL injection.
4. **Edge Defense Plan**: Fronted by CDN/WAF (such as Cloudflare) for SSL termination, DDoS absorption, and rate limiting in production.
