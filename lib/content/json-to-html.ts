import { generateHTML } from '@tiptap/html/server';
import { StarterKit } from '@tiptap/starter-kit';
import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';

import { validateBlockDocument } from './block-document.ts';

const EXTENSIONS = [
  StarterKit.configure({ link: { openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' } } }),
  Image,
  Table,
  TableRow,
  TableCell,
  TableHeader,
];

/**
 * Render a validated block document back to HTML (string).
 * Used by dual-write so legacy `Page.content` / read API keep working.
 * Returns '' for anything that fails validation.
 */
export function blockDocumentToHtml(value: unknown): string {
  // Accept both a versioned document and a bare Tiptap doc node (editor output).
  const doc = resolveDoc(value);
  if (!doc) return '';

  const result = validateBlockDocument({ version: 1, doc });
  if (!result.ok) return '';

  return generateHTML(result.doc.doc, EXTENSIONS);
}

function resolveDoc(value: unknown): unknown {
  if (typeof value !== 'object' || value === null) return null;
  if (typeof (value as { doc?: unknown }).doc === 'object') return (value as { doc: unknown }).doc;
  if ((value as { type?: unknown }).type === 'doc') return value;
  return null;
}