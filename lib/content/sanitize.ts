import sanitizeHtml from 'sanitize-html';

const DEFAULT_ALLOWED_TAGS = [
  'a',
  'b',
  'i',
  'em',
  'strong',
  'u',
  's',
  'p',
  'br',
  'ul',
  'ol',
  'li',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'blockquote',
  'code',
  'pre',
  'img',
  'figure',
  'figcaption',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'div',
  'span',
  'hr',
];

const DEFAULT_ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions['allowedAttributes'] = {
  a: ['href', 'target', 'rel', 'title'],
  img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
  table: ['border', 'cellspacing', 'cellpadding'],
  td: ['colspan', 'rowspan'],
  th: ['colspan', 'rowspan'],
  div: ['class'],
  span: ['class'],
  figure: ['class'],
  figcaption: ['class'],
};

const DEFAULT_NON_TEXT_TAGS: string[] = ['style', 'script', 'noscript', 'iframe', 'object', 'embed', 'form', 'input', 'button'];

export function normalizeUrl(url?: string) {
  if (!url || typeof url !== 'string') return undefined;
  const trimmed = url.trim();
  // Browsers ignore C0 controls/whitespace inside a scheme (e.g. "java\tscript:"),
  // so compact before the scheme check to block obfuscated payloads.
  const compact = trimmed.replace(/[\u0000-\u0020\u007f]+/g, '');
  const prefix = compact.slice(0, 16).toLowerCase();
  if (prefix.startsWith('javascript:') || prefix.startsWith('data:') || prefix.startsWith('vbscript:')) {
    return undefined;
  }
  return trimmed;
}

export const HTML_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: DEFAULT_ALLOWED_TAGS,
  allowedAttributes: DEFAULT_ALLOWED_ATTRIBUTES,
  disallowedTagsMode: 'discard',
  nonTextTags: DEFAULT_NON_TEXT_TAGS,
  transformTags: {
    a: (tagName, attribs) => {
      const href = normalizeUrl(attribs.href);
      if (!href) {
        const rest: sanitizeHtml.Attributes = { ...attribs };
        delete rest.href;
        return { tagName: 'span', attribs: rest } as sanitizeHtml.Tag;
      }
      return {
        tagName: 'a',
        attribs: {
          ...attribs,
          href,
          rel: attribs.rel ?? 'noopener noreferrer',
          target: attribs.target ?? '_blank',
        },
      };
    },
    img: (tagName, attribs) => {
      const src = normalizeUrl(attribs.src);
      if (!src) {
        return { tagName: 'span', attribs: {} };
      }
      return {
        tagName: 'img',
        attribs: { ...attribs, src },
      };
    },
  },
  enforceHtmlBoundary: true,
};

export function sanitizePageHtml(html: unknown): string {
  if (typeof html !== 'string') return '';
  return sanitizeHtml(html, HTML_SANITIZE_OPTIONS).trim();
}
