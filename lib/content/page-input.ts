// Shared resolver for Page create/update payloads (8.2 dual-write).
// - Accepts either legacy `content` (HTML, sanitize as before) or `contentJson`
//   (versioned block document). JSON wins when both are present.
// - Resolves the validated JSON document back to sanitized HTML so the legacy
//   `content` column / read API keep working during migration.
import { BLOCK_DOCUMENT_VERSION, validateBlockDocument } from './block-document.ts';
import { blockDocumentToHtml } from './json-to-html.ts';
import { sanitizePageHtml } from './sanitize.ts';
import { htmlToBlockDocument } from './html-to-json.ts';

export interface ResolvedPageContent {
  content: string;
  contentJson?: unknown;
  contentVer?: number;
}

export interface PageContentInput {
  content?: unknown;
  contentJson?: unknown;
}

export type PageContentResult =
  | { ok: true; data: ResolvedPageContent }
  | { ok: false; error: string };

/**
 * Sanitize/validate incoming Page content into dual-write output.
 * Throws nothing; failed JSON validation returns { ok:false } for a 400 response.
 */
export function resolvePageContent(input: PageContentInput): PageContentResult {
  const hasJson = input.contentJson !== undefined && input.contentJson !== null;
  const hasHtml = typeof input.content === 'string';

  if (!hasJson && !hasHtml) {
    return { ok: true, data: { content: '' } };
  }

  // Legacy path (HTML only): keep storing sanitized HTML, no JSON yet.
  // Migration script (plan step 4) backfills contentJson later.
  if (!hasJson) {
    return { ok: true, data: { content: sanitizePageHtml(input.content) } };
  }

  // Editor/API may send a bare Tiptap doc node — normalize to versioned document.
  const versioned = normalizeInput(input.contentJson);

  if (!versioned) return { ok: false, error: 'contentJson must be a valid block document' };

  const result = validateBlockDocument(versioned);
  if (!result.ok) {
    const reason = result.issues.map((i) => `${i.path}: ${i.message}`).join('; ');
    return { ok: false, error: `Invalid contentJson — ${reason}` };
  }

  const verified = result.doc;
  // JSON is the source of truth; derive legacy HTML from it (sanitized twice: render-safe + validator URL guard).
  const html = blockDocumentToHtml(verified);
  return {
    ok: true,
    data: {
      content: sanitizePageHtml(html),
      contentJson: verified,
      contentVer: verified.version,
    },
  };
}

function normalizeInput(value: unknown): unknown {
  if (typeof value !== 'object' || value === null) return null;
  const v = value as Record<string, unknown>;
  // Versioned document: { version, doc }
  if (typeof v.version === 'number' && v.doc) return value;
  // Bare ProseMirror doc node from the Tiptap editor: { type: 'doc', ... }
  if (v.type === 'doc') return { version: BLOCK_DOCUMENT_VERSION, doc: value };
  return null;
}

/**
 * Dual-write resolver for AI-generated content (plan 8.2 step 3).
 * - Valid JSON (from AI) wins via resolvePageContent.
 * - JSON missing → convert the returned HTML to a block document first so
 *   contentJson is populated; keep sanitized HTML as the last resort.
 * - JSON invalid → do not drop the article; fall back to the HTML path.
 */
export function resolveCampaignPageContent(contentHtml: string, contentJson: unknown): ResolvedPageContent {
  if (contentJson === null || contentJson === undefined) {
    const converted = htmlToBlockDocument(contentHtml);
    const retry = converted ? resolvePageContent({ content: contentHtml, contentJson: converted }) : null;
    if (retry?.ok) return retry.data;
    const htmlOnly = resolvePageContent({ content: contentHtml });
    return htmlOnly.ok ? htmlOnly.data : { content: contentHtml };
  }
  const withJson = resolvePageContent({ content: contentHtml, contentJson });
  if (withJson.ok) return withJson.data;
  // AI returned an invalid doc — fall back to the HTML we already have.
  const htmlOnly = resolvePageContent({ content: contentHtml });
  return htmlOnly.ok ? htmlOnly.data : { content: contentHtml };
}