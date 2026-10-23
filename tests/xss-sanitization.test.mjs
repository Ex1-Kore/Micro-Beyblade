import test from 'node:test';
import assert from 'node:assert';
import { sanitizePageHtml } from '../lib/content/sanitize.ts';

test('strips script tags', () => {
  const out = sanitizePageHtml('<script>alert(1)</script><p>ok</p>');
  assert.ok(!out.includes('<script'));
  assert.ok(out.includes('<p>ok</p>'));
});

test('strips inline event handlers', () => {
  const out = sanitizePageHtml('<img src="x.png" onerror="alert(1)" />');
  assert.ok(!out.includes('onerror'));
});

test('normalizes javascript: links to span', () => {
  const out = sanitizePageHtml('<a href="javascript:alert(1)">x</a>');
  assert.ok(out.includes('<span'));
  assert.ok(!out.includes('javascript:'));
});

test('keeps safe links', () => {
  const out = sanitizePageHtml('<a href="https://example.com">x</a>');
  assert.ok(out.includes('https://example.com'));
  assert.ok(out.includes('rel="noopener noreferrer"'));
});

test('strips iframe/object/embed', () => {
  const out = sanitizePageHtml('<iframe src="evil"></iframe><object></object><embed>');
  assert.ok(!out.includes('<iframe'));
  assert.ok(!out.includes('<object'));
  assert.ok(!out.includes('<embed'));
});
