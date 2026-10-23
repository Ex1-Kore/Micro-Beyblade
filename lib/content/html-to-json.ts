import { generateJSON } from '@tiptap/html/server';
import { StarterKit } from '@tiptap/starter-kit';
import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';

import {
  BLOCK_DOCUMENT_VERSION,
  validateBlockDocument,
  type BlockDocument,
  type BlockNode,
} from './block-document.ts';

const EXTENSIONS = [
  StarterKit.configure({ link: { openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' } } }),
  Image,
  Table,
  TableRow,
  TableCell,
  TableHeader,
];

/**
 * Convert legacy HTML (Page.content) to a versioned block document.
 * Returns null when the HTML produced an invalid document (should not happen
 * for well-formed input, but never trust the parser output blindly).
 */
export function htmlToBlockDocument(html: unknown): BlockDocument | null {
  if (typeof html !== 'string') return null;
  const doc = generateJSON(html, EXTENSIONS) as BlockNode;
  const result = validateBlockDocument({ version: BLOCK_DOCUMENT_VERSION, doc });
  if (!result.ok) return null;
  return result.doc;
}