# Module Standard

This CMS treats every optional module as an isolated extension. Modules must integrate with the platform through stable contracts instead of editing core code.

## Core principles
- never write new module code into `app/`, `modules/`, or other core framework folders
- keep module runtime files inside `extensions/<module-id>/`
- use shared platform models and adapters where possible instead of duplicating infrastructure
- do not mutate existing core routes or Prisma models from inside a module package
- prefer additive APIs and stable JSON contracts

## Required module structure
```text
extensions/<module-id>/
  extension.json
  README.md
  admin/
  api/
  hooks/
```

Only `extension.json` is required. Other folders are optional.

## Manifest contract
Every module must provide `extension.json`.

Required fields:
- `id`: globally unique module id in kebab-case
- `name`: display name
- `version`: module version
- `apiVersion`: framework extension API version

Recommended fields:
- `kind`: `module` (default), `template`, or `theme`
- `description`
- `author`
- `website`
- `capabilities`
- `entrypoints.adminPage`
- `entrypoints.api`
- `entrypoints.hooks`

## API standards for modules
- module APIs should live under a clear namespace, for example `/api/extensions/<module-id>/...`
- use JSON request and response bodies by default
- return stable shapes with top-level `data` or top-level `error`
- avoid provider-specific payloads leaking into public module APIs
- every write route should validate input and return actionable error messages

Recommended response shape:
```json
{
  "data": { "id": "..." }
}
```

Error shape:
```json
{
  "error": "Human-readable message"
}
```

## Data access rules
- module data should use its own tables or clearly scoped fields
- shared tables must only be extended when the field is generic and reusable platform-wide
- provider credentials must be encrypted before persistence
- files must go through the storage adapter contract, never direct filesystem writes in module routes
- background jobs must go through schedulable endpoints or job adapters, never hardcoded GitHub Actions assumptions

## Admin UI standards
- module admin pages should live under `/admin/<module-id>`
- use the existing admin shell and typography system
- keep labels oriented around content operations, not one specific frontend project
- expose lifecycle status, validation state, and configuration requirements clearly

## Compatibility rules
- a module must declare the extension `apiVersion` it supports
- if a module depends on optional providers, the module should fail gracefully with setup guidance
- do not assume Vercel, GitHub, or one storage provider
- do not assume one frontend consumer

## Security rules
- do not store raw API secrets in plaintext
- do not execute arbitrary uploaded code automatically
- ZIP install should stay optional and can be disabled in production
- modules must be removable without corrupting core data

## Installation

- default, production-safe: manual filesystem install into `extensions/<id>/`
- optional filesystem install requires `EXTENSIONS_WRITE_ENABLED=true` and is cross-platform
  (pure-JS extraction via `adm-zip`; no host shell)
- two optional install sources produce the same result:
  - ZIP upload via `/admin/modules`
  - install-from-URL: `POST /api/admin/modules` with JSON `{ "url": "https://…/x.zip" }`
- install-from-URL is https-only, rejects private/reserved addresses (SSRF guard),
  follows a bounded number of redirects, and caps the archive at 8 MB
- `EXTENSIONS_ALLOWED_HOSTS` (optional, comma-separated) bypasses the public-https
  guard for trusted internal artifact hosts
- archives are rejected on zip-slip paths, excessive entry counts (2,000), or
  oversized expansion (64 MB uncompressed)

## Runtime loading (metadata-only)

The framework does **not** hot-load or execute extension code. `getExtensionRuntimeIndex()`
exposes only enabled extensions plus their declared `entrypoints` as data. Any behaviour a
module adds must be wired deliberately by the integrator (for example a direct import, as
`modules/staff-member` does). This keeps uploaded packages from running inside the core
process.

## Developer checklist
1. Create `extensions/<module-id>/extension.json`
2. Declare API version and capabilities
3. Keep all provider-specific logic behind adapters
4. Validate every input at the route boundary
5. Return stable JSON responses
6. Document required environment variables and secrets
7. Make the module safe to disable or uninstall
