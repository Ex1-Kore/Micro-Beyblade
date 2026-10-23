# Template Standard

Templates (aka themes) are optional public-UI packs. Unlike modules, a template does not
ship routes or executable code: it publishes **design tokens** that the headless web app
(`apps/web`) applies as CSS custom properties. This keeps styling portable and safe — a
template can never inject arbitrary CSS or JavaScript.

## Core principles
- never write template code into `app/`, `components/`, or other core framework folders
- keep template files inside `templates/<template-id>/`
- templates expose design tokens only — no scripts, no remote fetches, no filesystem paths
- token values are validated before they ever reach a browser
- a template must be removable and deactivatable without touching core data

## Required template structure
```text
templates/<template-id>/
  template.json
  README.md            (recommended)
  preview.png          (optional, referenced by manifest)
```

Only `template.json` is required.

## Manifest contract
Every template must provide `template.json`. Validate it against `templates/template.schema.json`.

Required fields:
- `id`: globally unique template id (`^[a-z0-9._-]+$`)
- `name`: display name
- `version`: template version
- `apiVersion`: framework template API version — currently `"1"`

Recommended/optional fields:
- `kind`: `template` or `theme`
- `description`
- `author`
- `website`
- `previewImage`: safe relative path (must start with `./`, no `..`)
- `tokens`: the design tokens (see below)

`template.json` example:
```json
{
  "id": "aurora",
  "name": "Aurora",
  "version": "0.1.0",
  "apiVersion": "1",
  "kind": "theme",
  "description": "Cool blue theme for the public web app",
  "author": "Your Team",
  "tokens": {
    "primaryColor": "#4f46e5",
    "accentColor": "#06b6d4",
    "bgColor": "#ffffff",
    "textColor": "#0f172a",
    "fontFamily": "Inter, sans-serif",
    "layoutStyle": "wide",
    "mode": "light"
  }
}
```

## Token contract
Tokens are validated on install and again when read. Anything that fails validation is dropped
from the active set rather than passed through.

| Token | Rule |
| --- | --- |
| `primaryColor` | hex color (`#rgb`, `#rrggbb`, `#rrggbbaa`) |
| `accentColor` | hex color |
| `bgColor` | hex color |
| `textColor` | hex color |
| `fontFamily` | letters, numbers, spaces, commas, quotes, `_` and `-` only |
| `layoutStyle` | `default` \| `boxed` \| `wide` \| `centered` |
| `mode` | `light` \| `dark` |

Token keys themselves are restricted to letters, numbers, spaces, `_` and `-`.

## How tokens reach the public web app
1. Activate a template in `/admin/templates` (or via `PATCH /api/admin/templates/<id>` with `{ "action": "activate" }`).
2. The CMS publishes the active tokens at the public endpoint `GET /api/templates/active`:
   ```json
   {
     "active": true,
     "templateId": "aurora",
     "name": "Aurora",
     "version": "0.1.0",
     "tokens": { "primaryColor": "#4f46e5", "mode": "light" }
   }
   ```
   When no template is active the endpoint returns `{ "active": false, "templateId": null, "tokens": {} }`.
3. `apps/web` maps tokens to CSS variables:
   `primaryColor → --thoth-primary`, `accentColor → --thoth-accent`,
   `bgColor → --thoth-bg`, `textColor → --thoth-text`, `fontFamily → --thoth-font`.
   `layoutStyle` and `mode` are available as data for layout decisions.
4. If the CMS is unreachable or no template is active, `apps/web` falls back to its built-in styling.

The endpoint exposes tokens only — never directory names, paths, or the raw manifest.

## State and lifecycle
- Registry root: `templates/` (`TEMPLATES_DIR`)
- Active state: `templates/.cms-template-state.json` → `{ "activeTemplateId": string | null, "updatedAt": ISO }`
- Per-template install metadata: `templates/<id>/.cms-template-meta.json`
  (installed/updated/validated timestamps + install source)
- Only one template is active at a time. Uninstalling the active template clears the selection.

## Installation
- default, production-safe: manual filesystem install into `templates/<id>/`
- optional filesystem install requires `TEMPLATES_WRITE_ENABLED=true` and is cross-platform
  (pure-JS extraction via `adm-zip`; no host shell)
- two optional install sources produce the same result:
  - ZIP upload via `/admin/templates`
  - install-from-URL: `POST /api/admin/templates` with JSON `{ "url": "https://…/x.zip" }`
- install-from-URL is https-only, rejects private/reserved addresses (SSRF guard),
  follows a bounded number of redirects, and caps the archive at 8 MB
- install-from-URL reuses `EXTENSIONS_ALLOWED_HOSTS` (optional, comma-separated) as its
  trusted-host allowlist
- archives are rejected on zip-slip paths, excessive entry counts (2,000), or
  oversized expansion (64 MB uncompressed)
- the archive must contain `template.json` either at its root or in a single top-level folder

## Security rules
- templates never execute code inside the CMS process
- only validated tokens are exposed publicly
- ZIP install stays optional and can be disabled in production
- templates must be removable without corrupting core data

## Developer checklist
1. Create `templates/<template-id>/template.json` with `apiVersion: "1"`.
2. Declare only validated design tokens.
3. Add a `README.md` and an optional `preview.png` (`./preview.png`).
4. Validate against `templates/template.schema.json` before packaging.
5. Keep the template removable and deactivatable.
