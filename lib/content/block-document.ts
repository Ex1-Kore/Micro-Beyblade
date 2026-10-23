// Block document format (8.2) — versioned JSON document for Page.contentJson.
// Spec: docs/EDITOR_RICH_TEXT_PLAN_2026-10.md §4

import { normalizeUrl } from './sanitize.ts';

export const BLOCK_DOCUMENT_VERSION = 1;

export const BLOCK_NODE_TYPES = [
  'doc',
  'paragraph',
  'text',
  'heading',
  'blockquote',
  'codeBlock',
  'bulletList',
  'orderedList',
  'listItem',
  'horizontalRule',
  'hardBreak',
  'image',
  'table',
  'tableRow',
  'tableHeader',
  'tableCell',
] as const;

export const BLOCK_MARK_TYPES = ['bold', 'italic', 'strike', 'underline', 'code', 'link'] as const;

export type BlockMarkType = (typeof BLOCK_MARK_TYPES)[number];
export type BlockNodeType = (typeof BLOCK_NODE_TYPES)[number];

export interface BlockMark {
  type: BlockMarkType;
  attrs?: Record<string, unknown>;
}

export interface BlockNode {
  type: BlockNodeType;
  attrs?: Record<string, unknown>;
  content?: BlockNode[];
  marks?: BlockMark[];
  text?: string;
}

export interface BlockDocument {
  version: number;
  doc: BlockNode;
}

export interface ValidationIssue {
  path: string;
  message: string;
}

// Structural checks mirroring the Tiptap/ProseMirror schema used at render time.
// `null` = leaf node (must not carry children). `'inline-only'` = text/hardBreak.
// `'text-only'` = text nodes only.
const INLINE_TYPES = ['text', 'hardBreak'] as const;
const ALLOWED_CHILDREN: Record<string, string[] | 'inline-only' | 'text-only' | null> = {
  doc: ['heading', 'paragraph', 'blockquote', 'codeBlock', 'bulletList', 'orderedList', 'table', 'horizontalRule', 'image'],
  paragraph: 'inline-only',
  heading: 'inline-only',
  blockquote: ['heading', 'paragraph', 'bulletList', 'orderedList'],
  listItem: ['heading', 'paragraph', 'blockquote', 'bulletList', 'orderedList'],
  bulletList: ['listItem'],
  orderedList: ['listItem'],
  table: ['tableRow'],
  tableRow: ['tableHeader', 'tableCell'],
  tableHeader: ['paragraph'],
  tableCell: ['paragraph'],
  codeBlock: 'text-only',
  text: null,
  hardBreak: null,
  image: null,
  horizontalRule: null,
};

export function isValidBlockDocumentJson(value: unknown): value is BlockDocument {
  return validateBlockDocument(value).ok;
}

/**
 * Validate an unknown value as a versioned block document.
 * - Rejects unknown node/mark types (XSS by structure: no script/iframe/style).
 * - Enforces URL safety on image.src and link.href (reuses normalizeUrl).
 * - Enforces text nodes carry plain `text` strings only.
 */
export function validateBlockDocument(value: unknown): { ok: true; doc: BlockDocument } | { ok: false; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];

  if (!isRecord(value)) {
    return { ok: false, issues: [{ path: '$', message: 'document must be an object' }] };
  }
  if (value.version !== BLOCK_DOCUMENT_VERSION) {
    return {
      ok: false,
      issues: [{ path: '$.version', message: `unsupported version ${String(value.version)}` }],
    };
  }

  const doc = value.doc;
  if (!isRecord(doc)) {
    return { ok: false, issues: [{ path: '$.doc', message: 'doc must be an object' }] };
  }

  walkNode(doc, '$.doc', issues);
  if (issues.length > 0) {
    return { ok: false, issues };
  }
  return { ok: true, doc: { version: value.version, doc: doc as unknown as BlockNode } };
}

function walkNode(node: unknown, path: string, issues: ValidationIssue[]): void {
  if (!isRecord(node)) {
    issues.push({ path, message: 'node must be an object' });
    return;
  }
  const type = node.type;
  if (typeof type !== 'string') {
    issues.push({ path: `${path}.type`, message: 'node.type must be a string' });
    return;
  }
  if (!BLOCK_NODE_TYPES.includes(type as BlockNodeType)) {
    issues.push({ path: `${path}.type`, message: `disallowed node type "${type}"` });
    return;
  }

  switch (type) {
    case 'heading': {
      const level = (node.attrs as { level?: unknown } | undefined)?.level;
      if (!(typeof level === 'number' && Number.isInteger(level) && level >= 1 && level <= 6)) {
        issues.push({ path: `${path}.attrs.level`, message: 'heading level must be integer 1..6' });
      }
      break;
    }
    case 'image': {
      const attrs = (node.attrs ?? {}) as Record<string, unknown>;
      const src = normalizeUrl(typeof attrs.src === 'string' ? attrs.src : undefined);
      if (!src) {
        issues.push({ path: `${path}.attrs.src`, message: 'image src is missing or uses a blocked scheme' });
      }
      for (const key of ['width', 'height'] as const) {
        const v = attrs[key];
        if (v !== undefined && v !== null && !(typeof v === 'number' && Number.isFinite(v))) {
          issues.push({ path: `${path}.attrs.${key}`, message: `${key} must be a number` });
        }
      }
      break;
    }
    case 'text': {
      if (typeof node.text !== 'string') {
        issues.push({ path: `${path}.text`, message: 'text node requires a text string' });
      }
      const marks = node.marks;
      if (marks !== undefined) {
        if (!Array.isArray(marks)) {
          issues.push({ path: `${path}.marks`, message: 'marks must be an array' });
        } else {
          for (const mark of marks) {
            validateMark(mark, `${path}.marks[]`, issues);
          }
        }
      }
      break;
    }
    default:
      break;
  }

  const content = node.content;
  if (content !== undefined && content !== null) {
    if (!Array.isArray(content)) {
      issues.push({ path: `${path}.content`, message: 'content must be an array' });
      return;
    }
    const allowed = ALLOWED_CHILDREN[type];
    if (allowed === null) {
      issues.push({ path: `${path}.content`, message: `node type "${type}" must not have children` });
      return;
    }
    for (let i = 0; i < content.length; i++) {
      const child = content[i];
      const childType = isRecord(child) ? child.type : undefined;
      if (allowed === 'inline-only') {
        if (typeof childType !== 'string' || !(INLINE_TYPES as readonly string[]).includes(childType)) {
          issues.push({ path: `${path}.content[${i}].type`, message: `node type "${String(childType)}" is not allowed inside "${type}"` });
        }
      } else if (allowed === 'text-only') {
        if (childType !== 'text') {
          issues.push({ path: `${path}.content[${i}].type`, message: `node type "${String(childType)}" is not allowed inside "${type}"; expected text` });
        }
      } else if (typeof childType !== 'string' || !allowed.includes(childType)) {
        issues.push({ path: `${path}.content[${i}].type`, message: `node type "${String(childType)}" is not allowed inside "${type}"` });
      }
      walkNode(child, `${path}.content[${i}]`, issues);
    }
  }
}

function validateMark(mark: unknown, path: string, issues: ValidationIssue[]): void {
  if (!isRecord(mark) || typeof mark.type !== 'string') {
    issues.push({ path, message: 'mark must be an object with a type string' });
    return;
  }
  if (!BLOCK_MARK_TYPES.includes(mark.type as BlockMarkType)) {
    issues.push({ path: `${path}.type`, message: `disallowed mark type "${mark.type}"` });
    return;
  }
  if (mark.type === 'link') {
    const attrs = (mark.attrs ?? {}) as Record<string, unknown>;
    const href = normalizeUrl(typeof attrs.href === 'string' ? attrs.href : undefined);
    if (!href) {
      issues.push({ path: `${path}.attrs.href`, message: 'link href is missing or uses a blocked scheme' });
    }
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}