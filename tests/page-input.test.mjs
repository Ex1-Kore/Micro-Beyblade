import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolvePageContent } from '../lib/content/page-input.ts';

test('legacy path: HTML only → sanitized content, no contentJson', () => {
  const r = resolvePageContent({ content: '<p>Hello <b>world</b></p>' });
  assert.ok(r.ok);
  assert.equal(r.data.content, '<p>Hello <b>world</b></p>');
  assert.equal(r.data.contentJson, undefined);
});

test('legacy path: unsafe HTML is sanitized', () => {
  const r = resolvePageContent({ content: '<p>ok</p><script>alert(1)</script>' });
  assert.ok(r.ok);
  assert.ok(!r.data.content.includes('<script'));
});

test('json wins when both html and json present', () => {
  const doc = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'from json' }] }] };
  const r = resolvePageContent({ content: '<p>from html</p>', contentJson: { version: 1, doc } });
  assert.ok(r.ok);
  assert.ok(r.data.content.includes('from json'));
  assert.ok(!r.data.content.includes('from html'));
  assert.deepEqual(r.data.contentJson, { version: 1, doc });
  assert.equal(r.data.contentVer, 1);
});

test('bare tiptap doc node is normalized to versioned document', () => {
  const doc = { type: 'doc', content: [] };
  const r = resolvePageContent({ contentJson: doc });
  assert.ok(r.ok);
  assert.deepEqual(r.data.contentJson, { version: 1, doc });
});

test('invalid json returns error, not a throw', () => {
  const bad = { version: 1, doc: { type: 'doc', content: [{ type: 'text', text: 'missing parent' }] } };
  const r = resolvePageContent({ contentJson: bad });
  assert.ok(!r.ok);
  assert.ok(String(r.error).includes('Invalid contentJson'));
});

test('empty input → empty content result', () => {
  const r = resolvePageContent({ content: '', contentJson: null });
  assert.ok(r.ok);
  assert.equal(r.data.content, '');
});

test('contentJson with unallowed node type is rejected', () => {
  const bad = { version: 1, doc: { type: 'doc', content: [{ type: 'script' }] } };
  const r = resolvePageContent({ contentJson: bad });
  assert.ok(!r.ok);
});

test('contentJson with wrong version is rejected', () => {
  const doc = { type: 'doc', content: [{ type: 'paragraph' }] };
  const r = resolvePageContent({ contentJson: { version: 99, doc } });
  assert.ok(!r.ok);
});

test('contentJson with javascript: link is rejected', () => {
  const doc = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'x', marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }] }],
      },
    ],
  };
  const r = resolvePageContent({ contentJson: { version: 1, doc } });
  assert.ok(!r.ok);
});

test('html derived from json is valid and versioned', () => {
  const doc = {
    type: 'doc',
    content: [
      { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Title' }] },
      { type: 'table', attrs: { colCount: 1, rowCount: 1 }, content: [{ type: 'tableRow', content: [{ type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'cell' }] }] }] }] },
    ],
  };
  const r = resolvePageContent({ contentJson: { version: 1, doc } });
  assert.ok(r.ok);
  assert.ok(r.data.content.startsWith('<h1>'));
  assert.ok(r.data.content.includes('<table>'));
  assert.equal(r.data.contentVer, 1);
});
// --- resolveCampaignPageContent (8.2 step 3: AI auto-post dual-write) ---

test('campaign: AI sends valid JSON → JSON wins, HTML derived', async () => {
  const { resolveCampaignPageContent } = await import('../lib/content/page-input.ts');
  const doc = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'from ai json' }] }] };
  const r = resolveCampaignPageContent('<p>stale html</p>', { version: 1, doc });
  assert.ok(r.content.includes('from ai json'));
  assert.ok(r.contentJson);
  assert.equal(r.contentVer, 1);
});

test('campaign: AI sends no JSON → HTML converted to block document', async () => {
  const { resolveCampaignPageContent } = await import('../lib/content/page-input.ts');
  const r = resolveCampaignPageContent('<p>plain article</p><h2>Sub</h2>', null);
  assert.ok(r.content.includes('plain article'));
  assert.ok(r.contentJson, 'contentJson should be backfilled from HTML');
  assert.equal(r.contentJson.doc.type, 'doc');
});

test('campaign: AI sends invalid JSON → falls back to sanitized HTML, article kept', async () => {
  const { resolveCampaignPageContent } = await import('../lib/content/page-input.ts');
  const r = resolveCampaignPageContent('<p>keep me</p><script>alert(1)</script>', { bogus: true });
  assert.ok(r.content.includes('keep me'));
  assert.ok(!r.content.includes('script'));
  assert.equal(r.contentJson, undefined);
});
