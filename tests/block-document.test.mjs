import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BLOCK_DOCUMENT_VERSION,
  validateBlockDocument,
  isValidBlockDocumentJson,
} from '../lib/content/block-document.ts';
import { htmlToBlockDocument } from '../lib/content/html-to-json.ts';
import { blockDocumentToHtml } from '../lib/content/json-to-html.ts';

test('valid versioned document passes', () => {
  const v = {
    version: BLOCK_DOCUMENT_VERSION,
    doc: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Hello' }],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Link to ' },
            {
              type: 'text',
              marks: [{ type: 'link', attrs: { href: 'https://example.com' } }],
              text: 'example',
            },
          ],
        },
      ],
    },
  };
  assert.equal(validateBlockDocument(v).ok, true);
  assert.equal(isValidBlockDocumentJson(v), true);
});

test('rejects unknown node types (script/iframe/style)', () => {
  const v = {
    version: 1,
    doc: { type: 'doc', content: [{ type: 'script', content: [{ type: 'text', text: 'alert(1)' }] }] },
  };
  const res = validateBlockDocument(v);
  assert.equal(res.ok, false);
  if (!res.ok) assert.ok(res.issues.some((i) => i.message.includes('script')));
});

test('rejects disallowed marks', () => {
  const v = {
    version: 1,
    doc: {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'onmouseover' }], text: 'x' }] }],
    },
  };
  const res = validateBlockDocument(v);
  assert.equal(res.ok, false);
});

test('rejects blocked URL schemes on link.href', () => {
  const v = {
    version: 1,
    doc: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }], text: 'x' },
          ],
        },
      ],
    },
  };
  const res = validateBlockDocument(v);
  assert.equal(res.ok, false);
});

test('rejects blocked URL schemes on image.src', () => {
  const v = {
    version: 1,
    doc: {
      type: 'doc',
      content: [
        { type: 'image', attrs: { src: 'data:text/html,<script>alert(1)</script>', alt: 'x' } },
      ],
    },
  };
  const res = validateBlockDocument(v);
  assert.equal(res.ok, false);
});

test('invalid heading level rejected', () => {
  const v = {
    version: 1,
    doc: {
      type: 'doc',
      content: [{ type: 'heading', attrs: { level: 9 }, content: [{ type: 'text', text: 'x' }] }],
    },
  };
  assert.equal(validateBlockDocument(v).ok, false);
});

test('text node without text string rejected', () => {
  const v = {
    version: 1,
    doc: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text' }] }] },
  };
  assert.equal(validateBlockDocument(v).ok, false);
});

test('unsupported version rejected', () => {
  const v = { version: 99, doc: { type: 'doc' } };
  assert.equal(validateBlockDocument(v).ok, false);
});

test('non-object input rejected', () => {
  assert.equal(validateBlockDocument('nope').ok, false);
  assert.equal(validateBlockDocument(null).ok, false);
  assert.equal(validateBlockDocument(42).ok, false);
});

test('htmlToBlockDocument converts a heading+paragraph', () => {
  const json = htmlToBlockDocument('<h2>Title</h2><p>Body text</p>');
  assert.ok(json);
  assert.equal(json.version, BLOCK_DOCUMENT_VERSION);
  assert.equal(json.doc.type, 'doc');
  assert.equal(json.doc.content?.[0]?.type, 'heading');
  assert.equal(json.doc.content?.[1]?.type, 'paragraph');
});

test('htmlToBlockDocument strips script and keeps safe content', () => {
  const json = htmlToBlockDocument('<script>alert(1)</script><p>ok</p>');
  assert.ok(json);
  const html = json ? blockDocumentToHtml(json) : '';
  assert.ok(!html.includes('script'));
  assert.ok(html.includes('ok'));
});

test('htmlToBlockDocument converts table', () => {
  const json = htmlToBlockDocument('<table><tbody><tr><td>cell</td></tr></tbody></table>');
  assert.ok(json);
  assert.equal(json.doc.content?.[0]?.type, 'table');
});

test('htmlToBlockDocument neutralizes javascript: link', () => {
  const json = htmlToBlockDocument('<a href="javascript:alert(1)">x</a>');
  assert.ok(json);
  // generateJSON drops the link mark entirely for blocked schemes
  const html = json ? blockDocumentToHtml(json) : '';
  assert.ok(!html.includes('javascript:'));
});

test('blockDocumentToHtml round-trips paragraph', () => {
  const doc = {
    version: 1,
    doc: {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'hello' }] }],
    },
  };
  const html = blockDocumentToHtml(doc);
  assert.equal(html, '<p>hello</p>');
});

test('blockDocumentToHtml returns "" for invalid input', () => {
  assert.equal(blockDocumentToHtml('garbage'), '');
  assert.equal(blockDocumentToHtml({ version: 9, doc: { type: 'doc' } }), '');
});

test('blockDocumentToHtml accepts a bare Tiptap doc node', () => {
  const html = blockDocumentToHtml({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'bare' }] }] });
  assert.equal(html, '<p>bare</p>');
});