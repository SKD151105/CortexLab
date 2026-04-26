<p align="center">
	<img src="https://capsule-render.vercel.app/api?type=waving&height=240&color=0:0f172a,30:1d4ed8,65:0ea5e9,100:14b8a6&text=CortexLab&fontSize=56&fontColor=ffffff&fontAlignY=38&desc=Transform%20PDFs%20into%20Interactive%20AI%20Learning%20Experiences&descAlignY=58" alt="CortexLab banner" />
</p>

<p align="center">
	<a href="https://cortex-lab-ten.vercel.app"><img src="https://img.shields.io/badge/Live%20App-Vercel-111827?style=for-the-badge&logo=vercel" alt="Live App" /></a>
	<img src="https://img.shields.io/badge/Stack-MERN-0f766e?style=for-the-badge" alt="MERN" />
	<img src="https://img.shields.io/badge/Frontend-React%20%2B%20Vite-1e3a8a?style=for-the-badge&logo=react" alt="Frontend" />
	<img src="https://img.shields.io/badge/Backend-Node%20%2B%20Express-1f2937?style=for-the-badge&logo=nodedotjs" alt="Backend" />
	<img src="https://img.shields.io/badge/Database-MongoDB-14532d?style=for-the-badge&logo=mongodb" alt="MongoDB" />
	<img src="https://img.shields.io/badge/AI-Gemini-0c4a6e?style=for-the-badge&logo=google" alt="Gemini" />
</p>

## What Is CortexLab

CortexLab is a full-stack AI learning platform that converts PDF documents into active, test-driven study experiences. Instead of passively reading notes, learners can upload documents and instantly generate flashcards, quizzes, summaries, and contextual AI explanations.

Deployed (Live): https://cortex-lab-ten.vercel.app

## Table of Contents

1. Vision
2. Feature Highlights
3. Product Workflow
4. Tech Stack
5. Architecture
6. Project Structure
7. API Surface
8. Environment Variables
9. Local Setup
10. Build and Deployment
11. Security and Operations
12. Limitations and Roadmap

## Vision

CortexLab is built for students and self-learners who want to turn static study material into active recall loops:

- Learn by questioning, not just reading.
- Focus on comprehension through AI-assisted dialogue.
- Track real study activity over time.

## Feature Highlights

| Domain | Capability | Details |
| --- | --- | --- |
| Authentication | JWT-based auth, refresh-token sessions, protected routes | Register, login, refresh, profile update, password change, logout |
| Document Ingestion | PDF upload and parsing | Upload PDF, extract text, chunk for retrieval |
| AI Study Tools | Flashcards, quizzes, summaries | Gemini-backed generation from document context |
| AI Chat | Context-aware Q&A | Retrieves relevant chunks before answer generation |
| Flashcard Practice | Review and star workflow | Tracks review count, last reviewed, starred cards |
| Quiz Engine | Submission and scoring | Computes correctness and percentage with result review |
| Progress Tracking | Dashboard analytics | Learning overview + recent activity |
| Performance UX | Pagination + lazy loading | Paginated server APIs and route-level code splitting |

## Product Workflow

```mermaid
flowchart TD
		A[User Login] --> B[Upload PDF]
		B --> C[Extract Text]
		C --> D[Chunk Text]
		D --> E[Store Document + Chunks]
		E --> F[Generate Flashcards]
		E --> G[Generate Quiz]
		E --> H[Generate Summary]
		E --> I[Chat with Document]
		F --> J[Review + Star Cards]
		G --> K[Submit Answers + Score]
		J --> L[Progress Dashboard]
		K --> L
		I --> L
```

## Tech Stack

### Frontend (client)

- React 19
- React Router
- TanStack React Query
- Axios
- Tailwind CSS 4 + Vite
- React Markdown + remark-gfm

### Backend (server)

- Node.js + Express 5
- MongoDB + Mongoose
- @google/genai (Gemini)
- Multer (PDF upload)
- JWT + bcryptjs
- express-validator

## Architecture

### Frontend

- Single-page app with public and protected routing.
- Auth state persisted via localStorage token + user payload.
- Central Axios instance with auth header injection and 401 redirect handling.
- Route-level lazy loading for key pages.

### Backend

- Domain-based REST modules:
	- auth
	- documents
	- ai
	- flashcards
	- quizzes
	- progress
- Security middleware:
	- Helmet security headers
	- Global request rate limiting
	- Stricter auth route throttling
- PDF ingestion pipeline:
	1. Upload PDF (Multer)
	2. Extract text (pdf-parse)
	3. Chunk text with overlap
	4. Persist document + chunks
- AI generation layer uses gemini-2.5-flash-lite.

### Data Model Overview

- User: credentials + profile metadata.
- Document: source metadata, extracted text, chunk array, processing status.
- Flashcard: per-document card sets with review metadata.
- Quiz: generated questions, user answers, score, completion data.
- ChatHistory: per-document user/assistant transcript with relevant chunk indices.

## Project Structure

```text
CortexLab/
	client/
		src/
			components/
			context/
			pages/
			services/
			utils/
	server/
		config/
		controllers/
		middleware/
		models/
		routes/
		utils/
	README.md
```

## API Surface

Base URL (development): http://localhost:8000

### Auth

- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh-token
- POST /api/auth/logout
- GET /api/auth/profile
- PUT /api/auth/profile
- POST /api/auth/change-password

### Documents

- POST /api/documents/upload
- GET /api/documents
- GET /api/documents/:id
- DELETE /api/documents/:id

### AI

- POST /api/ai/generate-flashcards
- POST /api/ai/generate-quiz
- POST /api/ai/generate-summary
- POST /api/ai/chat
- POST /api/ai/explain-concept
- GET /api/ai/chat-history/:documentId

### Flashcards

- GET /api/flashcards
- GET /api/flashcards/:documentId
- POST /api/flashcards/:cardId/review
- PUT /api/flashcards/:cardId/star
- DELETE /api/flashcards/:id

### Quizzes

- GET /api/quizzes/:documentId
- GET /api/quizzes/quiz/:id
- POST /api/quizzes/:id/submit
- GET /api/quizzes/:id/results
- DELETE /api/quizzes/:id

### Progress

- GET /api/progress/dashboard

Note: All routes except register/login are protected and require a Bearer token.

## Environment Variables

### Server (.env in server/)

```env
PORT=8000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_random_secret
JWT_EXPIRE=15m
REFRESH_TOKEN_EXPIRE_DAYS=30
GEMINI_API_KEY=your_google_gemini_api_key
GEMINI_TIMEOUT_MS=45000
MAX_FILE_SIZE=41943040
MAX_CHUNKS=3000
CORS_ORIGIN=http://localhost:5173,https://your-production-domain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=500
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX_REQUESTS=20
```

### Client (.env in client/)

```env
VITE_API_BASE_URL=http://localhost:8000
```

## Local Setup

### Prerequisites

- Node.js 18+
- npm 9+
- MongoDB URI
- Gemini API key

### 1) Clone

```bash
git clone https://github.com/SKD151105/CortexLab.git
cd CortexLab
```

### 2) Start Backend

```bash
cd server
npm install
npm run dev
```

### 3) Start Frontend

```bash
cd ../client
npm install
npm run dev
```

Typical frontend dev URL: http://localhost:5173

## Build and Deployment

### Frontend Build

```bash
cd client
npm run build
```

### Backend Production Start

```bash
cd server
npm start
```

Frontend is currently deployed on Vercel.

## Security and Operations

### Security Implemented

- JWT bearer authentication
- Refresh-token based session persistence with token rotation
- Protected route middleware
- Helmet-powered security headers
- Global request throttling and tighter auth endpoint rate limiting
- bcrypt password hashing
- PDF MIME-type filtering and upload size limits

### Operational Notes

- CORS should be configured with explicit allowed origins in production.
- PDF processing runs in-process; a queue worker architecture is recommended for scale.
- Client stores the access token and refresh token locally for session restoration.

## Limitations and Roadmap

### Current Limitations

- No automated test suite yet.
- Study streak currently uses placeholder logic.
- Refresh tokens are currently persisted on the client side, so moving them to HttpOnly cookies would improve XSS resistance.

### Planned Improvements

- Move PDF processing to a queue-backed worker.
- Add API and frontend test coverage.
- Expand progress analytics with true streak and spaced-repetition signals.

