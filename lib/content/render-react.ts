// Block-document → React elements (8.2 step 5).
// Thin mapping over lib/content/render-model.ts; no logic beyond element creation.
// Returns null when `value` is not a recognizable block document, so callers
// fall back to the sanitized legacy HTML.

import { createElement, Fragment, type ReactNode } from 'react';

import { buildBlockRenderTree, type RenderChild, type RenderElement } from './render-model.ts';

export function renderBlockDocument(value: unknown): ReactNode | null {
  const tree = buildBlockRenderTree(value);
  if (!tree || tree.length === 0) return null;
  return createElement(
    Fragment,
    null,
    ...tree.map((node, index) => renderElement(node, `n${index}`)),
  );
}

function renderElement(node: RenderElement, key: string): ReactNode {
  const children = node.children.map((child: RenderChild, index) =>
    typeof child === 'string' ? child : renderElement(child, `${key}.${index}`),
  );
  return createElement(node.tag, { key, ...node.props }, ...children);
}
