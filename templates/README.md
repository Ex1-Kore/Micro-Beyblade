# Templates

This directory is reserved for optional public-UI theme packs.

Important rules:
- core framework code must stay outside this directory
- templates should be installable, removable, validated, and activated without modifying core files
- each template must live in its own directory
- each template must provide a `template.json` manifest
- a template publishes **design tokens only** — never scripts, executable code, or filesystem paths
- only one template is active at a time; activation state lives in `.cms-template-state.json`
- follow `docs/TEMPLATE_STANDARD.md` when building templates
- validate manifests against `templates/template.schema.json`

Recommended layout:
- `templates/<template-id>/template.json`
- `templates/<template-id>/README.md`
- optional assets referenced from the manifest (`previewImage`)

Manifest example:
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

Current installation strategy:
- production-safe default: manual filesystem install
- optional installer (enabled with `TEMPLATES_WRITE_ENABLED=true`): either
  - ZIP upload through `/admin/templates`, or
  - install-from-URL (`POST /api/admin/templates` with JSON `{ "url": "https://…/x.zip" }`)
- ZIP extraction is cross-platform (pure JavaScript via `adm-zip`) — no host shell required
- install-from-URL accepts https only, rejects private/reserved addresses (SSRF guard), and caps the archive at 8 MB
- install-from-URL reuses `EXTENSIONS_ALLOWED_HOSTS` as its trusted-host allowlist
- uploaded packages install into `templates/`, never into core app code
- lifecycle actions available in admin: `activate`, `deactivate`, `validate`, `uninstall`

## Runtime consumption

The active template is published to the public web app at `GET /api/templates/active`.
Only design tokens are exposed. The headless web app (`apps/web`) reads them and maps
them to CSS custom properties (`--thoth-primary`, `--thoth-accent`, `--thoth-bg`,
`--thoth-text`, `--thoth-font`). When no template is active — or the CMS is
unreachable — the web app falls back to its built-in styling. See
`docs/TEMPLATE_STANDARD.md`.
