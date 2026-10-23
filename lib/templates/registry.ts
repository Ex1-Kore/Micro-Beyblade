import { readdirSync, existsSync, mkdirSync, readFileSync, rmSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { safeExtractZipBuffer } from '../archive/safe-zip';
import { MAX_ARCHIVE_BYTES, downloadArchiveBuffer } from '../extensions/url-guard';
import {
  CMS_TEMPLATE_API_VERSION,
  type TemplateManifest,
  type TemplateTokens,
  sanitizeTemplateId,
  validateTemplateManifest,
} from './validator';

const TEMPLATES_STATE_FILE = '.cms-template-state.json';
const TEMPLATE_META_FILE = '.cms-template-meta.json';
const REGISTRY_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const TEMPLATES_DIR = path.join(REGISTRY_ROOT, 'templates');
const TEMPLATE_TMP_DIR = path.join(REGISTRY_ROOT, 'tmp', 'templates');

export { CMS_TEMPLATE_API_VERSION, MAX_ARCHIVE_BYTES };
export type { TemplateManifest, TemplateTokens } from './validator';

export type TemplateMeta = {
  installedAt: string;
  updatedAt: string;
  lastValidatedAt: string | null;
  source?: string | null;
};

export type InstalledTemplate = {
  directoryName: string;
  directoryPath: string;
  manifestPath: string | null;
  status: 'ready' | 'invalid';
  manifest: TemplateManifest | null;
  errors: string[];
  meta: TemplateMeta | null;
};

export type TemplatesState = {
  activeTemplateId: string | null;
  updatedAt: string;
};

export function getTemplatesDir() {
  return TEMPLATES_DIR;
}

export function canWriteTemplates() {
  return process.env.TEMPLATES_WRITE_ENABLED === 'true';
}

export function ensureTemplatesDir() {
  mkdirSync(TEMPLATES_DIR, { recursive: true });
  return TEMPLATES_DIR;
}

function getMetaPath(directoryPath: string) {
  return path.join(directoryPath, TEMPLATE_META_FILE);
}

function nowIso() {
  return new Date().toISOString();
}

function readMeta(directoryPath: string): TemplateMeta | null {
  const metaPath = getMetaPath(directoryPath);
  if (!existsSync(metaPath)) return null;

  try {
    const parsed = JSON.parse(readFileSync(metaPath, 'utf8')) as Partial<TemplateMeta>;
    return {
      installedAt: parsed.installedAt ?? nowIso(),
      updatedAt: parsed.updatedAt ?? nowIso(),
      lastValidatedAt: parsed.lastValidatedAt ?? null,
      source: parsed.source ?? null,
    };
  } catch {
    return null;
  }
}

function writeMeta(directoryPath: string, nextMeta: TemplateMeta) {
  writeFileSync(getMetaPath(directoryPath), JSON.stringify(nextMeta, null, 2), 'utf8');
}

function ensureMeta(directoryPath: string, source?: string | null) {
  const current = readMeta(directoryPath);
  if (current) return current;

  const initial: TemplateMeta = {
    installedAt: nowIso(),
    updatedAt: nowIso(),
    lastValidatedAt: null,
    source: source ?? null,
  };
  writeMeta(directoryPath, initial);
  return initial;
}

function buildTemplate(directoryPath: string): InstalledTemplate {
  const manifestPath = path.join(directoryPath, 'template.json');

  if (!existsSync(manifestPath)) {
    return {
      directoryName: path.basename(directoryPath),
      directoryPath,
      manifestPath: null,
      status: 'invalid',
      manifest: null,
      errors: ['Missing template.json manifest.'],
      meta: readMeta(directoryPath),
    };
  }

  try {
    const parsed = JSON.parse(readFileSync(manifestPath, 'utf8')) as unknown;
    const { manifest, errors } = validateTemplateManifest(parsed, directoryPath);
    const meta = ensureMeta(directoryPath);

    return {
      directoryName: path.basename(directoryPath),
      directoryPath,
      manifestPath,
      status: errors.length === 0 ? 'ready' : 'invalid',
      manifest,
      errors,
      meta,
    };
  } catch (error) {
    return {
      directoryName: path.basename(directoryPath),
      directoryPath,
      manifestPath,
      status: 'invalid',
      manifest: null,
      errors: [error instanceof Error ? error.message : 'Failed to read manifest.'],
      meta: readMeta(directoryPath),
    };
  }
}

export function listInstalledTemplates(): InstalledTemplate[] {
  const templatesDir = ensureTemplatesDir();

  return readdirSync(templatesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => buildTemplate(path.join(templatesDir, entry.name)))
    .sort((a, b) => a.directoryName.localeCompare(b.directoryName));
}

export function getTemplateById(id: string) {
  const all = listInstalledTemplates();
  const exact = all.find(
    (item) => item.manifest?.id === id || item.directoryName === sanitizeTemplateId(id),
  );

  if (!exact) {
    throw new Error(`Template '${id}' was not found.`);
  }

  return exact;
}

function getStatePath() {
  return path.join(ensureTemplatesDir(), TEMPLATES_STATE_FILE);
}

export function readTemplatesState(): TemplatesState {
  const statePath = getStatePath();
  if (!existsSync(statePath)) return { activeTemplateId: null, updatedAt: nowIso() };

  try {
    const parsed = JSON.parse(readFileSync(statePath, 'utf8')) as Partial<TemplatesState>;
    return {
      activeTemplateId: typeof parsed.activeTemplateId === 'string' ? parsed.activeTemplateId : null,
      updatedAt: parsed.updatedAt ?? nowIso(),
    };
  } catch {
    return { activeTemplateId: null, updatedAt: nowIso() };
  }
}

function writeTemplatesState(activeTemplateId: string | null): TemplatesState {
  const nextState: TemplatesState = { activeTemplateId, updatedAt: nowIso() };
  writeFileSync(getStatePath(), JSON.stringify(nextState, null, 2), 'utf8');
  return nextState;
}

export function setActiveTemplate(id: string) {
  if (!canWriteTemplates()) {
    throw new Error('Template activation is disabled. Set TEMPLATES_WRITE_ENABLED=true to allow filesystem changes.');
  }

  const template = getTemplateById(id);
  if (template.status !== 'ready' || !template.manifest) {
    throw new Error('Cannot activate an invalid template. Validate it first.');
  }

  return writeTemplatesState(template.manifest.id);
}

export function clearActiveTemplate() {
  if (!canWriteTemplates()) {
    throw new Error('Template activation is disabled. Set TEMPLATES_WRITE_ENABLED=true to allow filesystem changes.');
  }

  return writeTemplatesState(null);
}

/** Active template only if it exists and is valid. */
export function getActiveTemplate(): InstalledTemplate | null {
  const { activeTemplateId } = readTemplatesState();
  if (!activeTemplateId) return null;

  const match = listInstalledTemplates().find((item) => item.manifest?.id === activeTemplateId);
  if (!match || match.status !== 'ready' || !match.manifest) return null;
  return match;
}

export function getActiveTemplateTokens(): TemplateTokens | null {
  return getActiveTemplate()?.manifest?.tokens ?? null;
}

function resolveExtractedRoot(stagingDir: string) {
  const directManifest = path.join(stagingDir, 'template.json');
  if (existsSync(directManifest)) return stagingDir;

  const nestedDirectories = readdirSync(stagingDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(stagingDir, entry.name));

  for (const dir of nestedDirectories) {
    if (existsSync(path.join(dir, 'template.json'))) {
      return dir;
    }
  }

  throw new Error('Uploaded package does not contain template.json at the root of the archive.');
}

async function installTemplateFromBuffer(buffer: Buffer, baseName: string, source: string | null) {
  if (buffer.length > MAX_ARCHIVE_BYTES) {
    throw new Error(`Template archive exceeds the ${Math.round(MAX_ARCHIVE_BYTES / 1024 / 1024)} MB limit.`);
  }

  const templatesDir = ensureTemplatesDir();
  mkdirSync(TEMPLATE_TMP_DIR, { recursive: true });

  const fileBase = sanitizeTemplateId(baseName) || `template-${Date.now()}`;
  const stagingDir = path.join(TEMPLATE_TMP_DIR, `${Date.now()}-${fileBase}`);
  mkdirSync(stagingDir, { recursive: true });

  try {
    safeExtractZipBuffer(buffer, stagingDir);

    const extractedRoot = resolveExtractedRoot(stagingDir);
    const template = buildTemplate(extractedRoot);

    if (!template.manifest || template.errors.length > 0) {
      throw new Error(template.errors.join(' '));
    }

    const destination = path.join(templatesDir, sanitizeTemplateId(template.manifest.id));
    if (existsSync(destination)) {
      throw new Error(`Template '${template.manifest.id}' is already installed.`);
    }

    renameSync(extractedRoot, destination);
    ensureMeta(destination, source);

    return buildTemplate(destination);
  } finally {
    if (existsSync(stagingDir)) rmSync(stagingDir, { recursive: true, force: true });
  }
}

export async function installTemplateArchive(file: File) {
  if (!canWriteTemplates()) {
    throw new Error('Template installer is disabled. Set TEMPLATES_WRITE_ENABLED=true to enable filesystem installation.');
  }

  if (!file.name.toLowerCase().endsWith('.zip')) {
    throw new Error('Please upload a valid .zip file.');
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const baseName = file.name.replace(/\.zip$/i, '');
  return installTemplateFromBuffer(buffer, baseName, `upload:${file.name}`);
}

export async function installTemplateFromUrl(url: string) {
  if (!canWriteTemplates()) {
    throw new Error('Template installer is disabled. Set TEMPLATES_WRITE_ENABLED=true to enable filesystem installation.');
  }

  const buffer = await downloadArchiveBuffer(url);
  const parsed = new URL(url);
  const baseName =
    parsed.pathname.split('/').filter(Boolean).pop()?.replace(/\.zip$/i, '') ?? 'remote-template';
  return installTemplateFromBuffer(buffer, baseName, parsed.toString());
}

export function validateTemplate(id: string) {
  const template = getTemplateById(id);
  const current = ensureMeta(template.directoryPath);
  const nextMeta: TemplateMeta = {
    ...current,
    updatedAt: nowIso(),
    lastValidatedAt: nowIso(),
  };
  writeMeta(template.directoryPath, nextMeta);
  return buildTemplate(template.directoryPath);
}

export function uninstallTemplate(id: string) {
  if (!canWriteTemplates()) {
    throw new Error('Template uninstall is disabled. Set TEMPLATES_WRITE_ENABLED=true to allow filesystem changes.');
  }

  const template = getTemplateById(id);
  rmSync(template.directoryPath, { recursive: true, force: true });

  const { activeTemplateId } = readTemplatesState();
  if (activeTemplateId && template.manifest?.id === activeTemplateId) {
    writeTemplatesState(null);
  }

  return { success: true, id };
}

export type ReadyTemplate = InstalledTemplate & {
  manifest: TemplateManifest;
  meta: TemplateMeta;
};

export function listReadyTemplates(): ReadyTemplate[] {
  return listInstalledTemplates().filter(
    (item): item is ReadyTemplate => item.status === 'ready' && item.manifest !== null,
  );
}

export type TemplateRuntimeEntry = {
  id: string;
  name: string;
  version: string;
  kind: TemplateManifest['kind'];
  description: string | null;
  tokens: TemplateTokens;
  directoryName: string;
};

export type TemplateRuntimeIndex = {
  apiVersion: string;
  loadMode: 'metadata-only';
  activeTemplateId: string | null;
  templates: TemplateRuntimeEntry[];
};

export function getTemplateRuntimeIndex(): TemplateRuntimeIndex {
  const { activeTemplateId } = readTemplatesState();
  const ready = listReadyTemplates();
  const activeId = ready.some((item) => item.manifest.id === activeTemplateId)
    ? activeTemplateId
    : null;

  return {
    apiVersion: CMS_TEMPLATE_API_VERSION,
    loadMode: 'metadata-only',
    activeTemplateId: activeId,
    templates: ready.map((item) => ({
      id: item.manifest.id,
      name: item.manifest.name,
      version: item.manifest.version,
      kind: item.manifest.kind,
      description: item.manifest.description ?? null,
      tokens: item.manifest.tokens ?? {},
      directoryName: item.directoryName,
    })),
  };
}
