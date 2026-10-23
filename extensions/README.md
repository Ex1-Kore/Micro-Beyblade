# Extensions

This directory is reserved for optional runtime extensions.

Important rules:
- core framework code must stay outside this directory
- extensions should be installable, removable, enabled, disabled, or validated without modifying core files
- each extension must live in its own directory
- each extension must provide an `extension.json` manifest
- lifecycle state is stored beside the extension package, not inside the framework core
- follow `docs/MODULE_STANDARD.md` when building new modules
- validate manifests against `extensions/extension.schema.json`

Recommended layout:
- `extensions/<extension-id>/extension.json`
- `extensions/<extension-id>/README.md`
- optional entrypoints referenced from the manifest

Manifest example:
```json
{
  "id": "example-extension",
  "name": "Example Extension",
  "version": "0.1.0",
  "apiVersion": "1",
  "description": "Optional extension package for Micro Headless CMS",
  "author": "Your Team",
  "capabilities": ["admin-page", "api"],
  "entrypoints": {
    "adminPage": "./admin/page.tsx",
    "api": "./api/route.ts"
  }
}
```

Current installation strategy:
- production-safe default: manual filesystem install
- optional installer (enabled with `EXTENSIONS_WRITE_ENABLED=true`): either
  - ZIP upload through `/admin/modules`, or
  - install-from-URL (`POST /api/admin/modules` with JSON `{ "url": "https://…/x.zip" }`)
- ZIP extraction is cross-platform (pure JavaScript via `adm-zip`) — no host shell or PowerShell required
- install-from-URL accepts https only, rejects private/reserved addresses (SSRF guard), and caps the archive at 8 MB
- `EXTENSIONS_ALLOWED_HOSTS` (optional) is a comma-separated allowlist for trusted internal artifact hosts
- uploaded packages install into `extensions/`, never into core `modules/`
- lifecycle actions available in admin: `enable`, `disable`, `validate`, `uninstall`

## Runtime loading

Extensions are **not** executed automatically. The loader is metadata-only:
`getExtensionRuntimeIndex()` returns the enabled extensions and their declared
`entrypoints` so admin tooling can surface them. Nothing from an uploaded package
is imported or run inside the core process. See `docs/MODULE_STANDARD.md`.

This separation keeps the framework lightweight and reduces the risk of extensions mutating core internals.
