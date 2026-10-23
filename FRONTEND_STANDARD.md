# Frontend Standard Operating Procedure (SOP)

## 1. Architecture Principle

This repository is a Backend-Centric Monolith.

- Backend is the Master Product.
- Frontend is the UI Template nested inside the monolith.
- The backend owns the server, routing, database, auth, and system APIs.
- The frontend is responsible for presentation and UI/UX, not for owning business logic or data source authority.

## 2. Directory Structure

All frontend assets must live under `/frontend`.

- `/frontend/app`: public Next.js App Router routes, pages, layouts, and entrypoints.
- `/frontend/components`: reusable UI components used by frontend pages.
- `/frontend/styles`: CSS and Tailwind style assets for frontend templates.
- `/frontend/hooks`: custom React hooks and UI helper logic.
- `/frontend/lib`: frontend-only helper functions, including the API client hub.

Any new frontend template must follow this exact folder pattern and must not scatter page logic outside `/frontend/app`, `/frontend/components`, or `/frontend/styles`.

## 3. Database Protocol

The primary database (configured via `DATABASE_URL`) is the Single Source of Truth.

- Only one database is allowed.
- No second database may be introduced for frontend or experimental storage.
- All schema definitions are owned by the root `prisma/schema.prisma` file.
- The backend Prisma client is the shared gateway to the database.

## 4. Syncing Rule

Schema changes must always be synced to the database.

- After modifying `prisma/schema.prisma`, run:

  ```bash
  npx prisma db push
  ```

- Document schema changes in the repository or release notes.
- Do not let the schema drift between `schema.prisma` and the database.

## 5. UI Standards

Header and Footer must follow the predefined Admin/Global components.

- Use shared, centralized header/footer UI components whenever available.
- Do not create duplicate branding or navigation patterns in the frontend.
- Maintain brand consistency between the public UI template and the backend admin UI.

## 6. API Interaction Standard

Frontend must use `frontend/lib/api.ts` as the central API hub.

- `frontend/lib/api.ts` is the single source of truth for frontend backend requests.
- All frontend fetches must go through this file or through helpers imported from this file.
- Do not call backend endpoints directly from isolated frontend components.

Use `NEXT_PUBLIC_BACKEND_URL` for API endpoint base URLs.

- The frontend must build using `NEXT_PUBLIC_BACKEND_URL`.
- This environment variable defines the API base for the current deployment.
- If the variable is not set, the frontend may fall back to relative `/api/*` requests.

Example contract:

- `/api/products`
- `/api/categories`
- `/api/site-config`
- `/api/pages`
- `/api/staff`

## 7. Versioning & Stability

Backend Core must remain stable.

- Auth, database logic, system APIs, and `prisma/schema.prisma` are the stable core.
- Backend core changes must be reviewed carefully and treated as breaking-object-impact changes.
- Frontend UI/UX changes can iterate frequently as long as they do not break backend API contracts.
- Any change that impacts request/response shapes must be coordinated across frontend and backend.

## 8. Routing Expectations

- The root path `/` is the Frontend Home.
- The backend CMS/Admin UI is served under `/admin`.

This is the final monolithic routing model:

- `/` → Frontend landing page / public UI template.
- `/admin` → Backend CMS and admin console.
- `/api/*` → Backend system APIs used by both frontend and admin.

## 9. How to Add or Edit a Page

1. Add the page under `/frontend/app`.
2. Add supporting UI components under `/frontend/components`.
3. Keep styles scoped to `/frontend/styles` and use shared Tailwind utility classes.
4. Retrieve data through `frontend/lib/api.ts`.
5. Do not add new database models without updating `prisma/schema.prisma` and running `npx prisma db push`.
6. Do not introduce new top-level route folders outside `/frontend/app` for public UI pages.

## 10. Enforcement Checklist

- Is the page located in `/frontend/app`?
- Are reusable UI elements in `/frontend/components`?
- Are styles in `/frontend/styles`?
- Is backend data fetched through `frontend/lib/api.ts`?
- Is `NEXT_PUBLIC_BACKEND_URL` used for backend endpoint construction?
- Are schema changes documented and synced with `npx prisma db push`?
- Does the page preserve `/` for public UI and `/admin` for CMS?

---

> This SOP ensures the Backend remains the Master Product, the Frontend remains the UI Template, and the monolithic structure stays maintainable.
