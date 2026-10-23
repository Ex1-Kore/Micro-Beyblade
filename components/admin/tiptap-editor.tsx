'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableRow } from '@tiptap/extension-table-row';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Underline } from '@tiptap/extension-underline';
import { useEffect } from 'react';
import type { Editor } from '@tiptap/react';

const BLOCK_DOCUMENT_VERSION = 1;

type TiptapEditorProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onJsonChange?: (json: unknown) => void;
  placeholder?: string;
  minHeight?: number;
  toolbar?: string[]; // ограниченный набор кнопок: 'basic' | 'advanced'
};

type ToolbarButton = {
  label: string;
  title: string;
  onClick: (editor: Editor) => void;
  isActive?: (editor: Editor) => boolean;
};

const advancedActions: ToolbarButton[] = [
  { label: 'B', title: 'Bold', isActive: (e) => e.isActive('bold'), onClick: (e) => e.chain().focus().toggleBold().run() },
  { label: 'I', title: 'Italic', isActive: (e) => e.isActive('italic'), onClick: (e) => e.chain().focus().toggleItalic().run() },
  { label: 'U', title: 'Underline', isActive: (e) => e.isActive('underline'), onClick: (e) => e.chain().focus().toggleUnderline().run() },
  { label: 'S', title: 'Strike', isActive: (e) => e.isActive('strike'), onClick: (e) => e.chain().focus().toggleStrike().run() },
  { label: 'H1', title: 'Heading 1', isActive: (e) => e.isActive('heading', { level: 1 }), onClick: (e) => e.chain().focus().toggleHeading({ level: 1 }).run() },
  { label: 'H2', title: 'Heading 2', isActive: (e) => e.isActive('heading', { level: 2 }), onClick: (e) => e.chain().focus().toggleHeading({ level: 2 }).run() },
  { label: 'H3', title: 'Heading 3', isActive: (e) => e.isActive('heading', { level: 3 }), onClick: (e) => e.chain().focus().toggleHeading({ level: 3 }).run() },
  { label: 'P', title: 'Paragraph', isActive: (e) => e.isActive('paragraph'), onClick: (e) => e.chain().focus().setParagraph().run() },
  { label: '• List', title: 'Bullet List', isActive: (e) => e.isActive('bulletList'), onClick: (e) => e.chain().focus().toggleBulletList().run() },
  { label: '1. List', title: 'Numbered List', isActive: (e) => e.isActive('orderedList'), onClick: (e) => e.chain().focus().toggleOrderedList().run() },
  { label: 'Quote', title: 'Blockquote', isActive: (e) => e.isActive('blockquote'), onClick: (e) => e.chain().focus().toggleBlockquote().run() },
  { label: '↵', title: 'Hard Break', onClick: (e) => e.chain().focus().setHardBreak().run() },
  { label: 'Link', title: 'Insert Link', onClick: (e) => insertLink(e) },
  { label: 'Image', title: 'Insert Image from URL', onClick: (e) => insertImage(e) },
  { label: 'Table', title: 'Insert Table', onClick: (e) => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
  { label: '⟲', title: 'Undo', onClick: (e) => e.chain().focus().undo().run() },
  { label: '⟳', title: 'Redo', onClick: (e) => e.chain().focus().redo().run() },
  { label: 'Clear', title: 'Clear Formatting', onClick: (e) => e.chain().focus().clearNodes().unsetAllMarks().run() },
];

function insertLink(editor: Editor) {
  const url = window.prompt('Paste the link URL');
  if (!url) return;
  editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
}

function insertImage(editor: Editor) {
  const url = window.prompt('Paste the image URL');
  if (!url) return;
  editor.chain().focus().setImage({ src: url }).run();
}

function buildToolbar(toolbar?: string[]): ToolbarButton[] {
  if (!toolbar || toolbar.length === 0) {
    return [...advancedActions];
  }
  return [...advancedActions].filter((action) => {
    const title = action.title.toLowerCase();
    return toolbar.some((item) => title.includes(item.toLowerCase()));
  });
}

export default function TiptapEditor({ label, value, onChange, onJsonChange, placeholder = 'Start writing here...', minHeight = 280, toolbar }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
        },
      }),
      Image,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Underline,
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
      if (onJsonChange) {
        const json = editor.getJSON();
        onJsonChange({ version: BLOCK_DOCUMENT_VERSION, doc: json });
      }
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  const actions = buildToolbar(toolbar);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <p className="text-xs text-slate-500">Rich text powered by Tiptap — JSON block document (v{BLOCK_DOCUMENT_VERSION}).</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/40 bg-white/70 shadow-[0_18px_35px_-28px_rgba(15,23,42,0.28)] backdrop-blur">
        <div className="flex flex-wrap gap-2 border-b border-slate-200/70 bg-slate-50/80 px-3 py-3">
          {actions.map((action) => (
            <button
              key={action.title}
              type="button"
              title={action.title}
              onClick={() => action.onClick(editor!)}
              className={`rounded-xl border border-white/40 px-3 py-2 text-xs font-bold text-slate-700 transition-all hover:border-indigo-300 hover:text-indigo-700 ${action.isActive?.(editor!) ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'bg-white'}`}
            >
              {action.label}
            </button>
          ))}
        </div>

        <EditorContent
          editor={editor}
          className="tiptap-editor min-h-[260px] w-full px-5 py-4"
          style={{ minHeight }}
        />
      </div>
    </div>
  );
}