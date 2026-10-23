# Aurora

Reference template (theme pack) for THOTH. It publishes **design tokens only** — never scripts,
executable code, or filesystem paths.

## Layout

```
templates/aurora/
├── template.json   # required manifest
└── README.md       # this file
```

## Tokens

| Token | Value |
| --- | --- |
| `primaryColor` | `#4f46e5` |
| `accentColor` | `#06b6d4` |
| `bgColor` | `#ffffff` |
| `textColor` | `#0f172a` |
| `fontFamily` | `Inter, sans-serif` |
| `layoutStyle` | `wide` |
| `mode` | `light` |

## How it is discovered

The registry (`lib/templates/registry.ts`) reads every directory under `templates/` and validates
its `template.json`. A valid pack shows up as `ready` in `/admin/templates` (data from
`GET /api/admin/templates`).

## Activation

Only one template is active at a time. Activation writes `.cms-template-state.json` in
`templates/` and requires `TEMPLATES_WRITE_ENABLED=true`. When active, the tokens are published to
the public web app at `GET /api/templates/active` and mapped to CSS custom properties
(`--thoth-primary`, `--thoth-accent`, `--thoth-bg`, `--thoth-text`, `--thoth-font`).

To activate manually instead of through the admin UI, set the state file:

```json
{ "activeTemplateId": "aurora", "updatedAt": "<ISO timestamp>" }
```

See `docs/TEMPLATE_STANDARD.md` before building a real template.
