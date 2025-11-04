# Repository Guidelines

## Project Structure & Module Organization
The codebase is split into `reflecta-frontend` (React SPA) and `reflecta-backend` (Express API). Frontend UI logic lives in `src/components/`, shared context in `src/contexts/`, and API wrappers in `src/services/`; static assets stay in `public/`. The backend exposes REST endpoints from `server.js`, with MongoDB schemas organized under `models/`. Keep shared scripts in `bin/` and larger experiments or docs inside `ideaton/`. Place new feature code alongside related modules so domain concerns stay encapsulated.

## Build, Test & Development Commands
Run `npm install` inside each subproject before first use. For the frontend: `npm start` launches the CRA dev server, `npm run build` outputs the production bundle in `build/`, and `npm test` runs Jest in watch mode. For the backend: `npm run dev` starts the API with hot reload via `nodemon`, `npm start` runs the production server, and `npm run prod` boots with `.env.production`. Tailor local `.env.development` files to match the sample keys referenced in deployment docs.

## Coding Style & Naming Conventions
Use 2-space indentation, ES2020+ syntax, and const/let over var. React components and context providers should be `PascalCase` (`GoalTimeline.jsx`), hooks and helpers stay `camelCase` (`useJournalFilters`). Keep route files named by resource (e.g., `journalRoutes.js`) and Mongo models singular (`JournalEntry.js`). Stick with the default CRA ESLint rules; format JSX before submitting (Prettier defaults are acceptable when available).

## Testing Guidelines
Frontend tests rely on React Testing Library and Jest; co-locate specs as `*.test.jsx` beside the component they cover and focus on user-visible behavior. Aim to exercise new UI states and API adapters before opening a PR. The backend currently lacks an automated suite—if you add endpoints, include lightweight integration tests (Jest + supertest) under `reflecta-backend/tests/` and document any manual verification steps.

## Commit & Pull Request Guidelines
Follow the existing Git history pattern: imperative, goal-oriented commit subjects (`Add mood selector to chat-to-diary conversion`). Group related changes logically and keep commits scoped to one feature or fix. Pull requests should summarize impact, list testing performed (`npm test`, manual API checks), mention any environment needs, and link relevant issues or product specs. Attach screenshots or GIFs when UI changes affect layout or flows.

## Environment & Secrets
Never commit `.env*` files. Reference `ENV_SETUP.md` for required keys such as `REACT_APP_API_URL`, `MONGODB_URI`, and `OPENAI_API_KEY`. Use placeholder values in shared configs and confirm secrets are injected through Vercel or Cloud Run before merging.
