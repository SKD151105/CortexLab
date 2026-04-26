# CortexLab

CortexLab is a full-stack AI learning platform that converts PDF documents into interactive study experiences. Users can upload PDFs, generate AI flashcards and quizzes, chat with document context, and monitor progress from a centralized dashboard.

Live frontend: https://cortex-lab-ten.vercel.app

## Table of Contents

1. Product Overview
2. Core Features
3. Tech Stack
4. Architecture
5. Project Structure
6. API Overview
7. Environment Variables
8. Local Development Setup
9. Build and Deployment
10. Security and Operational Notes
11. Current Limitations
12. Future Improvements

## Product Overview

CortexLab is designed for students and self-learners who want to turn static learning material into active recall workflows.

High-level user flow:

1. Register or log in.
2. Upload a PDF document.
3. Backend parses and chunks extracted text.
4. Use AI actions to generate:
   - Flashcards
   - Quizzes
   - Summaries
   - Chat answers grounded in document chunks
5. Review performance through dashboard statistics and recent activity.

## Core Features

- Authentication and profile management with JWT-based protected routes.
- PDF-only document upload with server-side processing.
- Automatic text extraction and chunking for retrieval-aware AI responses.
- AI flashcard generation with difficulty labels.
- AI quiz generation with 4-option MCQs, answer submission, and scoring.
- AI summary generation for long-form documents.
- Context-aware document chat and concept explanation.
- Flashcard review tracking (review count, last reviewed, starred cards).
- Dashboard analytics for learning activity.
- Pagination support on list endpoints (documents, flashcards, quizzes).
- Frontend route-level lazy loading for improved initial load behavior.

## Tech Stack

Frontend (client):

- React 19
- React Router
- TanStack React Query
- Axios
- Tailwind CSS 4 + Vite
- React Markdown + remark-gfm

Backend (server):

- Node.js + Express 5
- MongoDB + Mongoose
- Google Gemini API via @google/genai
- Multer (PDF uploads)
- JWT + bcryptjs
- express-validator

## Architecture

Frontend:

- SPA with protected and public routes.
- Local storage token persistence.
- Axios interceptors for auth header injection and 401 handling.

Backend:

- REST API grouped by domain modules:
  - auth
  - documents
  - ai
  - flashcards
  - quizzes
  - progress
- Document ingestion pipeline:
  - upload PDF
  - parse text
  - chunk text with overlap
  - persist extracted text + chunks
- AI generation pipeline uses Gemini model gemini-2.5-flash-lite.

Data layer:

- MongoDB collections for users, documents, flashcard sets, quizzes, and chat history.
- Indexed fields for user-scoped reads and recency-based listings.

## Project Structure

Top-level monorepo layout:

	CortexLab/
	  client/   # React + Vite frontend
	  server/   # Express + MongoDB backend
	  README.md

Important backend modules:

- server/routes for API route declarations.
- server/controllers for request handling and business logic.
- server/models for Mongoose schemas.
- server/utils for PDF parsing, text chunking, pagination, and Gemini integration.

Important frontend modules:

- client/src/pages for route-level screens.
- client/src/components for reusable UI and feature components.
- client/src/services for API consumption by feature.
- client/src/context for authentication state.

## API Overview

Base URL in development:

- http://localhost:8000

Auth routes:

- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/profile (protected)
- PUT /api/auth/profile (protected)
- POST /api/auth/change-password (protected)

Document routes (protected):

- POST /api/documents/upload
- GET /api/documents
- GET /api/documents/:id
- DELETE /api/documents/:id

AI routes (protected):

- POST /api/ai/generate-flashcards
- POST /api/ai/generate-quiz
- POST /api/ai/generate-summary
- POST /api/ai/chat
- POST /api/ai/explain-concept
- GET /api/ai/chat-history/:documentId

Flashcard routes (protected):

- GET /api/flashcards
- GET /api/flashcards/:documentId
- POST /api/flashcards/:cardId/review
- PUT /api/flashcards/:cardId/star
- DELETE /api/flashcards/:id

Quiz routes (protected):

- GET /api/quizzes/:documentId
- GET /api/quizzes/quiz/:id
- POST /api/quizzes/:id/submit
- GET /api/quizzes/:id/results
- DELETE /api/quizzes/:id

Progress routes (protected):

- GET /api/progress/dashboard

## Environment Variables

Server (.env in server/):

- PORT=8000
- NODE_ENV=development
- MONGODB_URI=your_mongodb_connection_string
- JWT_SECRET=your_secure_random_secret
- JWT_EXPIRE=7d
- GEMINI_API_KEY=your_google_gemini_api_key
- GEMINI_TIMEOUT_MS=45000
- MAX_FILE_SIZE=41943040
- MAX_CHUNKS=3000

Client (.env in client/):

- VITE_API_BASE_URL=http://localhost:8000

## Local Development Setup

Prerequisites:

- Node.js 18+
- npm 9+
- MongoDB connection string
- Gemini API key

1. Clone repository:

	git clone https://github.com/SKD151105/CortexLab.git
	cd CortexLab

2. Install backend dependencies:

	cd server
	npm install

3. Create backend environment file at server/.env and add required variables.

4. Start backend:

	npm run dev

5. Install frontend dependencies:

	cd ../client
	npm install

6. Create frontend environment file at client/.env:

	VITE_API_BASE_URL=http://localhost:8000

7. Start frontend:

	npm run dev

Frontend default dev URL is typically http://localhost:5173.

## Build and Deployment

Frontend build:

	cd client
	npm run build

Backend production start:

	cd server
	npm start

Current live frontend appears deployed on Vercel.

For production backend hosting:

- Use a persistent process manager or managed runtime.
- Configure secure CORS origin allowlist.
- Store secrets in provider-managed environment variables.

## Security and Operational Notes

- Authentication uses bearer JWT tokens.
- Protected endpoints are guarded by auth middleware.
- Passwords are hashed using bcrypt before persistence.
- Uploads are restricted to PDF MIME type and max file size.

Operational considerations:

- API CORS currently allows wildcard origin; lock this down for production.
- Background PDF processing is handled in-process; a queue is recommended at scale.
- Tokens are stored in localStorage on the client.

## Current Limitations

- No automated test suite is configured yet.
- No refresh-token flow is implemented.
- Study streak in dashboard is mock/randomized in current backend logic.
- No rate-limiting or brute-force protection layer is currently included.

## Future Improvements

- Add refresh-token based long-session auth.
- Introduce job queue for document processing workloads.
- Add request rate limiting and security headers.
- Add API and component test coverage.
- Extend analytics to include true streak and spaced-repetition quality signals.

