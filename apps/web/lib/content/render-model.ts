// Block-document → neutral render tree (8.2 step 5).
// Allowlist-by-construction: only known node/mark types map to known tags, so
// nothing can be injected through the document even if it skipped validation.
// URLs are re-normalized (normalizeUrl) before they reach an attribute.
// Spec: docs/EDITOR_RICH_TEXT_PLAN_2026-10.md §5

import { normalizeUrl } from './sanitize';

export type RenderChild = RenderElement | string;

export interface RenderElement {
  tag: string;
  props: Record<string, unknown>;
  children: RenderChild[];
}

interface BlockNode {
  type?: unknown;
  attrs?: unknown;
  content?: unknown;
  marks?: unknown;
  text?: unknown;
}

interface BlockMark {
  type?: unknown;
  attrs?: unknown;
}

// Wrapper tags for inline marks, applied outermost-first so nesting is stable.
// Must stay in sync with lib/content/block-document.ts BLOCK_MARK_TYPES.
const MARK_ORDER = ['link', 'code', 'bold', 'italic', 'strike', 'underline'] as const;
const MARK_TAGS: Record<string, string> = {
  code: 'code',
  bold: 'strong',
  italic: 'em',
  strike: 's',
  underline: 'u',
};

/**
 * Build a serializable render tree from a block document.
 * Accepts a versioned envelope `{ version, doc }` or a bare `{ type: 'doc' }`.
 * Returns null when the value is not a recognizable document.
 */
export function buildBlockRenderTree(value: unknown): RenderElement[] | null {
  const doc = extractDocument(value);
  if (!doc) return null;
  return renderBlocks(doc.content);
}

function extractDocument(value: unknown): BlockNode | null {
  if (!isRecord(value)) return null;
  const inner = value.doc;
  if (isRecord(inner) && inner.type === 'doc') return inner as BlockNode;
  if (value.type === 'doc') return value as BlockNode;
  return null;
}

function renderBlocks(content: unknown): RenderElement[] {
  if (!Array.isArray(content)) return [];
  const out: RenderElement[] = [];
  for (const raw of content) {
    const el = renderBlock(raw);
    if (el) out.push(el);
  }
  return out;
}

function renderInline(content: unknown): RenderChild[] {
  if (!Array.isArray(content)) return [];
  const out: RenderChild[] = [];
  for (const raw of content) {
    if (!isRecord(raw)) continue;
    const node = raw as BlockNode;
    if (node.type === 'text') {
      out.push(...applyMarks(typeof node.text === 'string' ? node.text : '', node.marks));
    } else if (node.type === 'hardBreak') {
      out.push(element('br', {}, []));
    } else {
      const el = renderBlock(node);
      if (el) out.push(el);
    }
  }
  return out;
}

function renderBlock(raw: unknown): RenderElement | null {
  if (!isRecord(raw)) return null;
  const node = raw as BlockNode;
  const attrs = isRecord(node.attrs) ? node.attrs : {};

  switch (node.type) {
    case 'paragraph':
      return element('p', {}, renderInline(node.content));
    case 'heading':
      return element(`h${clampLevel(attrs.level)}`, {}, renderInline(node.content));
    case 'blockquote':
      return element('blockquote', {}, renderBlocks(node.content));
    case 'codeBlock':
      return element('pre', {}, [element('code', {}, [plainText(node.content)])]);
    case 'bulletList':
      return element('ul', {}, renderBlocks(node.content));
    case 'orderedList': {
      const start = intAttr(attrs.start);
      return element('ol', start && start !== 1 ? { start } : {}, renderBlocks(node.content));
    }
    case 'listItem':
      return element('li', {}, renderBlocks(node.content));
    case 'horizontalRule':
      return element('hr', {}, []);
    case 'hardBreak':
      return element('br', {}, []);
    case 'image': {
      const src = normalizeUrl(strAttr(attrs.src));
      if (!src) return null;
      const props: Record<string, unknown> = { src, alt: strAttr(attrs.alt) ?? '' };
      const title = strAttr(attrs.title);
      if (title) props.title = title;
      const width = intAttr(attrs.width);
      const height = intAttr(attrs.height);
      if (width) props.width = width;
      if (height) props.height = height;
      return element('img', props, []);
    }
    case 'table':
      return element('table', {}, renderBlocks(node.content));
    case 'tableRow':
      return element('tr', {}, renderBlocks(node.content));
    case 'tableHeader':
      return element('th', cellProps(attrs), renderBlocks(node.content));
    case 'tableCell':
      return element('td', cellProps(attrs), renderBlocks(node.content));
    default:
      return null;
  }
}

function applyMarks(text: string, marks: unknown): RenderChild[] {
  if (!text) return [];
  const present = new Map<string, BlockMark>();
  if (Array.isArray(marks)) {
    for (const mark of marks) {
      if (isRecord(mark) && typeof mark.type === 'string') present.set(mark.type, mark as BlockMark);
    }
  }

  let child: RenderChild = text;
  for (const type of MARK_ORDER) {
    const mark = present.get(type);
    if (!mark) continue;
    if (type === 'link') {
      const attrMap = isRecord(mark.attrs) ? mark.attrs : {};
      const href = normalizeUrl(strAttr(attrMap.href));
      if (!href) continue;
      child = element('a', { href, target: '_blank', rel: 'noopener noreferrer' }, [child]);
    } else {
      child = element(MARK_TAGS[type], {}, [child]);
    }
  }
  return [child];
}

function plainText(content: unknown): string {
  if (!Array.isArray(content)) return '';
  let out = '';
  for (const raw of content) {
    if (isRecord(raw) && typeof raw.text === 'string') out += raw.text;
  }
  return out;
}

function cellProps(attrs: Record<string, unknown>): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  const colspan = intAttr(attrs.colspan);
  const rowspan = intAttr(attrs.rowspan);
  if (colspan && colspan > 1) props.colSpan = colspan;
  if (rowspan && rowspan > 1) props.rowSpan = rowspan;
  return props;
}

function element(tag: string, props: Record<string, unknown>, children: RenderChild[]): RenderElement {
  return { tag, props, children };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function strAttr(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

function intAttr(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isInteger(v) ? v : undefined;
}

function clampLevel(v: unknown): number {
  const level = intAttr(v);
  return level && level >= 1 && level <= 6 ? level : 1;
}
