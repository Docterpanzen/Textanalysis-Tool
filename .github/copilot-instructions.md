# Copilot instructions

## Big picture architecture

- This repo is a full-stack app: Angular 20 frontend in `src/` and FastAPI backend in `backend/textanalyse_backend/`.
- Frontend uses standalone Angular components and router-based pages: see `src/app/app.routes.ts` and page components under `src/app/pages/**`.
- Backend exposes REST endpoints via routers in `backend/textanalyse_backend/api/` and wires them in `backend/textanalyse_backend/main.py`.
- SQLite is the only datastore; tables are defined in `backend/textanalyse_backend/db/models.py` and created on app startup in `backend/textanalyse_backend/main.py`. The DB file is `textanalyse.db` in the backend working directory.

## Core data flows (frontend ↔ backend)

- Text upload for later analysis: `Input` page (`src/app/pages/input/input.ts`) calls `TextsApiService` (`src/app/api/texts_api.service.ts`) → `POST /texts` in `backend/textanalyse_backend/api/texts.py`.
- Text analysis by DB IDs: `Textanalyse` page (`src/app/pages/textanalyse/textanalyse.ts`) calls `TextanalysisApiService.analyzeByIds` → `POST /analyze/byIds` in `backend/textanalyse_backend/api/textanalyse.py`.
  - Options shape must match `TextAnalysisOptions` in `src/app/api/textanalyse_api.service.ts` and `backend/textanalyse_backend/schemas/textanalyse.py`.
  - Pipeline: preprocess → vectorize → optional SVD → KMeans → top terms + wordclouds (`backend/textanalyse_backend/services/pipeline.py`, `vectorization.py`, `clustering.py`, `wordclouds.py`).
- Plagiarism check by file upload: `Plagiatchecker` page (`src/app/pages/plagiatchecker/plagiatchecker.ts`) posts multipart with `fileA`, `fileB`, and JSON `options` → `POST /plagiarism/checkFiles` (`backend/textanalyse_backend/api/plagiarism.py`).
  - Backend extracts text by extension in `backend/textanalyse_backend/services/helpers.py` (supports .txt/.md/.pdf/.docx). Client-side cleaning is optional and mirrored in request options.
- Analysis history: `HistoryApiService` (`src/app/api/history_api.service.ts`) → `GET /history` and `/history/{id}` (`backend/textanalyse_backend/api/history.py`), persisted via `backend/textanalyse_backend/services/history.py`.

## Project-specific conventions

- Frontend API base URLs are hardcoded to `http://localhost:8000` in `src/app/api/*.service.ts`; if the backend host/port changes, update these and CORS in `backend/textanalyse_backend/config.py`.
- Stopword handling uses NLTK; `get_stopwords()` will auto-download the corpus on first use (`backend/textanalyse_backend/services/helpers.py`).
- Plagiarism responses use Pydantic field aliases (e.g., `similarityPercent`) in `backend/textanalyse_backend/schemas/plagiarism.py`.

## Developer workflows

- Run with Docker: `docker compose up` (frontend on :4200, backend on :8000). See `compose.yaml`, `Dockerfile.frontend`, `backend/Dockerfile.backend`.
- Frontend dev server: `npm install` then `npm start` or `npm run RunAngular` from repo root (Angular CLI).
- Backend dev server: `cd backend; pdm install; pdm run api` (requires Python 3.11).
- Tests:
  - Backend: `cd backend; pdm run test` (pytest in `backend/tests/`).
  - Frontend unit tests: `npm run TestAngular` (Karma/Jasmine).
  - E2E (Playwright): `cd test_frontend; npx playwright test`.
- Lint/format: `npm run lint`, `npm run format` (Prettier config in `package.json`).
