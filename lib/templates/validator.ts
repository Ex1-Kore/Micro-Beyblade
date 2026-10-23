import { existsSync } from 'node:fs';
import path from 'node:path';

export const CMS_TEMPLATE_API_VERSION = '1';

export const TEMPLATE_KINDS = ['template', 'theme'] as const;

export type TemplateKind = (typeof TEMPLATE_KINDS)[number];

/**
 * Design tokens a template may publish to the public web app.
 * Every value is validated before it is exposed as a CSS variable, so a
 * template pack can never inject arbitrary CSS.
 */
export type TemplateTokens = {
  primaryColor?: string;
  accentColor?: string;
  bgColor?: string;
  textColor?: string;
  fontFamily?: string;
  layoutStyle?: string;
  mode?: string;
};

export type TemplateManifest = {
  id: string;
  name: string;
  version: string;
  apiVersion: string;
  kind?: TemplateKind;
  description?: string;
  author?: string;
  website?: string;
  previewImage?: string;
  tokens?: TemplateTokens;
};

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const FONT_FAMILY = /^[a-zA-Z0-9 ,"'_-]+$/;
const SIMPLE_TOKEN = /^[a-zA-Z0-9 _-]+$/;
const LAYOUT_STYLES = ['default', 'boxed', 'wide', 'centered'] as const;
const MODES = ['light', 'dark'] as const;

function isNonEmptyString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function sanitizeTemplateId(input: string) {
  return input.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
}

function isSafeRelativeAsset(value: string) {
  return value.startsWith('./') && !value.includes('..');
}

function validateTokens(raw: unknown, errors: string[]): TemplateTokens | undefined {
  if (raw === undefined) return undefined;
  if (!raw || typeof raw !== 'object') {
    errors.push('Field "tokens" must be an object.');
    return undefined;
  }

  const candidate = raw as Record<string, unknown>;
  const tokens: TemplateTokens = {};

  for (const key of ['primaryColor', 'accentColor', 'bgColor', 'textColor'] as const) {
    const value = candidate[key];
    if (value === undefined) continue;
    if (typeof value !== 'string' || !HEX_COLOR.test(value.trim())) {
      errors.push(`Token "${key}" must be a hex color (e.g. #4f46e5).`);
      continue;
    }
    tokens[key] = value.trim();
  }

  if (candidate.fontFamily !== undefined) {
    if (typeof candidate.fontFamily !== 'string' || !FONT_FAMILY.test(candidate.fontFamily.trim())) {
      errors.push('Token "fontFamily" contains unsupported characters.');
    } else {
      tokens.fontFamily = candidate.fontFamily.trim();
    }
  }

  if (candidate.layoutStyle !== undefined) {
    const value = String(candidate.layoutStyle).trim();
    if (!LAYOUT_STYLES.includes(value as (typeof LAYOUT_STYLES)[number])) {
      errors.push(`Token "layoutStyle" must be one of: ${LAYOUT_STYLES.join(', ')}.`);
    } else {
      tokens.layoutStyle = value;
    }
  }

  if (candidate.mode !== undefined) {
    const value = String(candidate.mode).trim();
    if (!MODES.includes(value as (typeof MODES)[number])) {
      errors.push(`Token "mode" must be one of: ${MODES.join(', ')}.`);
    } else {
      tokens.mode = value;
    }
  }

  for (const key of Object.keys(candidate)) {
    if (!SIMPLE_TOKEN.test(key)) {
      errors.push(`Token key "${key}" contains unsupported characters.`);
    }
  }

  return tokens;
}

export function validateTemplateManifest(raw: unknown, directoryPath?: string) {
  const errors: string[] = [];

  if (!raw || typeof raw !== 'object') {
    return { manifest: null, errors: ['Manifest must be a JSON object.'] };
  }

  const candidate = raw as Record<string, unknown>;
  const kindCandidate = isNonEmptyString(candidate.kind) ? String(candidate.kind).trim() : undefined;

  const manifest: TemplateManifest = {
    id: String(candidate.id ?? '').trim(),
    name: String(candidate.name ?? '').trim(),
    version: String(candidate.version ?? '').trim(),
    apiVersion: String(candidate.apiVersion ?? '').trim(),
    kind: TEMPLATE_KINDS.includes(kindCandidate as TemplateKind)
      ? (kindCandidate as TemplateKind)
      : undefined,
    description: isNonEmptyString(candidate.description) ? String(candidate.description).trim() : undefined,
    author: isNonEmptyString(candidate.author) ? String(candidate.author).trim() : undefined,
    website: isNonEmptyString(candidate.website) ? String(candidate.website).trim() : undefined,
    previewImage: isNonEmptyString(candidate.previewImage) ? String(candidate.previewImage).trim() : undefined,
    tokens: validateTokens(candidate.tokens, errors),
  };

  if (!manifest.id) errors.push('Missing required field: id');
  if (!manifest.name) errors.push('Missing required field: name');
  if (!manifest.version) errors.push('Missing required field: version');
  if (!manifest.apiVersion) errors.push('Missing required field: apiVersion');

  if (manifest.id && manifest.id !== sanitizeTemplateId(manifest.id)) {
    errors.push('Template id must use lowercase letters, numbers, dots, underscores, or hyphens only.');
  }

  if (manifest.apiVersion && manifest.apiVersion !== CMS_TEMPLATE_API_VERSION) {
    errors.push(`Unsupported apiVersion '${manifest.apiVersion}'. Expected '${CMS_TEMPLATE_API_VERSION}'.`);
  }

  if (kindCandidate && !TEMPLATE_KINDS.includes(kindCandidate as TemplateKind)) {
    errors.push(`Unsupported kind '${kindCandidate}'. Expected one of: ${TEMPLATE_KINDS.join(', ')}.`);
  }

  if (manifest.previewImage && !isSafeRelativeAsset(manifest.previewImage)) {
    errors.push('Field "previewImage" must be a safe relative path starting with "./".');
  } else if (manifest.previewImage && directoryPath) {
    const resolved = path.join(directoryPath, manifest.previewImage);
    if (!existsSync(resolved)) {
      errors.push(`Field "previewImage" does not exist: ${manifest.previewImage}`);
    }
  }

  return { manifest, errors };
}
