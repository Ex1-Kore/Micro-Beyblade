# Hello Module

Reference extension package for THOTH. It shows the smallest **complete** module: a manifest,
an admin page entrypoint, and a JSON API entrypoint.

## Layout

```
extensions/hello-module/
├── extension.json      # required manifest
├── README.md           # this file
├── admin/page.tsx      # entrypoints.adminPage
├── api/route.ts        # entrypoints.api
└── hooks/README.md     # optional, not declared in the manifest
```

## How it is discovered

The registry (`lib/extensions/registry.ts`) reads every directory under `extensions/` and
validates its `extension.json`. A package with no validation errors shows up as `ready` in
`/admin/modules` (data from `GET /api/admin/modules`). Entrypoint paths must start with `./`,
must not contain `..`, and the referenced files must exist.

## Install paths

- Production-safe default: copy this folder into `extensions/` on the host (manual install).
- Optional installer: set `EXTENSIONS_WRITE_ENABLED=true` to allow ZIP upload or
  install-from-URL through `/admin/modules`.

## Runtime model

Extensions are **not** executed. `getExtensionRuntimeIndex()` returns enabled packages and their
declared entrypoints in `metadata-only` mode, so admin tooling can surface them without importing
any code from the package. See `docs/MODULE_STANDARD.md` before building a real module.
