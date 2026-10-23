import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';

import { buildBlockRenderTree } from '../lib/content/render-model.ts';
import { renderBlockDocument } from '../lib/content/render-react.ts';

const doc = {
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Title' }] },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Hello ' },
        { type: 'text', text: 'bold', marks: [{ type: 'bold' }] },
        { type: 'text', text: ' and ' },
        { type: 'text', text: 'link', marks: [{ type: 'link', attrs: { href: 'https://example.com' } }] },
        { type: 'hardBreak' },
        { type: 'text', text: 'after' },
      ],
    },
    {
      type: 'bulletList',
      content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'item' }] }] }],
    },
    { type: 'codeBlock', attrs: {}, content: [{ type: 'text', text: 'const x = 1;' }] },
    { type: 'horizontalRule' },
    { type: 'image', attrs: { src: 'https://example.com/a.png', alt: 'A' } },
  ],
};

function html(value) {
  return renderToStaticMarkup(renderBlockDocument(value));
}

test('renders a versioned document to the expected elements', () => {
  const out = html({ version: 1, doc });
  assert.match(out, /<h2>Title<\/h2>/);
  assert.match(out, /<p>Hello <strong>bold<\/strong> and <a href="https:\/\/example\.com" target="_blank" rel="noopener noreferrer">link<\/a><br\/>after<\/p>/);
  assert.match(out, /<ul><li><p>item<\/p><\/li><\/ul>/);
  assert.match(out, /<pre><code>const x = 1;<\/code><\/pre>/);
  assert.match(out, /<hr\/>/);
  assert.match(out, /<img src="https:\/\/example\.com\/a\.png" alt="A"\/>/);
});

test('accepts a bare doc node as well as a versioned envelope', () => {
  assert.equal(html(doc), html({ version: 1, doc }));
});

test('returns null for unrecognizable input (caller falls back to HTML)', () => {
  assert.equal(renderBlockDocument(null), null);
  assert.equal(renderBlockDocument({ not: 'a doc' }), null);
  assert.equal(renderBlockDocument({ type: 'doc', content: [] }), null);
  assert.equal(buildBlockRenderTree('nope'), null);
});

test('clamps an out-of-range heading level instead of dropping it', () => {
  const tree = buildBlockRenderTree({
    type: 'doc',
    content: [{ type: 'heading', attrs: { level: 9 }, content: [{ type: 'text', text: 'x' }] }],
  });
  assert.equal(tree[0].tag, 'h1');
});

test('ordered list honours a non-default start', () => {
  const out = html({
    type: 'doc',
    content: [
      {
        type: 'orderedList',
        attrs: { start: 3 },
        content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'x' }] }] }],
      },
    ],
  });
  assert.match(out, /<ol start="3">/);
});

test('table cells carry colspan/rowspan', () => {
  const out = html({
    type: 'doc',
    content: [
      {
        type: 'table',
        content: [
          {
            type: 'tableRow',
            content: [
              { type: 'tableHeader', attrs: { colspan: 2 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'h' }] }] },
              { type: 'tableCell', attrs: { rowspan: 2 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'c' }] }] },
            ],
          },
        ],
      },
    ],
  });
  assert.match(out, /<th colSpan="2">/);
  assert.match(out, /<td rowSpan="2">/);
});

test('blocked link schemes are dropped, text is preserved', () => {
  const out = html({
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'xss', marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }] }],
      },
    ],
  });
  assert.equal(out, '<p>xss</p>');
});

test('obfuscated link schemes (embedded whitespace/controls) are blocked', () => {
  const out = html({
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'xss', marks: [{ type: 'link', attrs: { href: 'java\tscript:alert(1)' } }] }],
      },
    ],
  });
  assert.equal(out, '<p>xss</p>');
});

test('image with a blocked src is omitted entirely', () => {
  const out = html({
    type: 'doc',
    content: [{ type: 'image', attrs: { src: 'javascript:alert(1)', alt: 'x' } }],
  });
  assert.equal(out, '');
});

test('unknown node and mark types are ignored', () => {
  const out = html({
    type: 'doc',
    content: [
      { type: 'script', content: [] },
      { type: 'paragraph', content: [{ type: 'text', text: 'safe', marks: [{ type: 'evil' }] }] },
    ],
  });
  assert.equal(out, '<p>safe</p>');
});

test('apps/web copies stay in sync with root (only import extensions differ)', () => {
  const normalize = (source) =>
    source.replace(/from '\.\/(sanitize|render-model)\.ts'/g, "from './$1'");

  const pairs = [
    ['../lib/content/render-model.ts', '../apps/web/lib/content/render-model.ts'],
    ['../lib/content/render-react.ts', '../apps/web/lib/content/render-react.ts'],
  ];

  for (const [rootPath, webPath] of pairs) {
    const root = normalize(readFileSync(new URL(rootPath, import.meta.url), 'utf8'));
    const web = readFileSync(new URL(webPath, import.meta.url), 'utf8');
    assert.equal(web, root, `${webPath} drifted from ${rootPath}`);
  }
});
