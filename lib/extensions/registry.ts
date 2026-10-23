import { readdirSync, existsSync, mkdirSync, readFileSync, rmSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { safeExtractZipBuffer } from '../archive/safe-zip';
import {
  CMS_EXTENSION_API_VERSION,
  type ExtensionManifest,
  sanitizeExtensionId,
  validateExtensionManifest,
} from './validator';
import { MAX_ARCHIVE_BYTES, downloadArchiveBuffer } from './url-guard';

const EXTENSION_STATE_FILE = '.cms-extension-state.json';
const REGISTRY_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const EXTENSIONS_DIR = path.join(REGISTRY_ROOT, 'extensions');
const EXTENSION_TMP_DIR = path.join(REGISTRY_ROOT, 'tmp', 'extensions');

export { CMS_EXTENSION_API_VERSION, MAX_ARCHIVE_BYTES };
export type { ExtensionManifest } from './validator';

export type InstalledExtension = {
  directoryName: string;
  directoryPath: string;
  manifestPath: string | null;
  status: 'ready' | 'invalid';
  manifest: ExtensionManifest | null;
  errors: string[];
  state: ExtensionLifecycleState | null;
};

export type ExtensionLifecycleState = {
  enabled: boolean;
  installedAt: string;
  updatedAt: string;
  lastValidatedAt: string | null;
  source?: string | null;
};

export function getExtensionsDir() {
  return EXTENSIONS_DIR;
}

export function canWriteExtensions() {
  return process.env.EXTENSIONS_WRITE_ENABLED === 'true';
}

export function ensureExtensionsDir() {
  mkdirSync(EXTENSIONS_DIR, { recursive: true });
  return EXTENSIONS_DIR;
}

function getStatePath(directoryPath: string) {
  return path.join(directoryPath, EXTENSION_STATE_FILE);
}

function nowIso() {
  return new Date().toISOString();
}

function readState(directoryPath: string): ExtensionLifecycleState | null {
  const statePath = getStatePath(directoryPath);
  if (!existsSync(statePath)) return null;

  try {
    const parsed = JSON.parse(readFileSync(statePath, 'utf8')) as Partial<ExtensionLifecycleState>;
    return {
      enabled: parsed.enabled ?? true,
      installedAt: parsed.installedAt ?? nowIso(),
      updatedAt: parsed.updatedAt ?? nowIso(),
      lastValidatedAt: parsed.lastValidatedAt ?? null,
      source: parsed.source ?? null,
    };
  } catch {
    return null;
  }
}

function writeState(directoryPath: string, nextState: ExtensionLifecycleState) {
  writeFileSync(getStatePath(directoryPath), JSON.stringify(nextState, null, 2), 'utf8');
}

function ensureState(directoryPath: string, source?: string | null) {
  const current = readState(directoryPath);
  if (current) return current;

  const initial: ExtensionLifecycleState = {
    enabled: true,
    installedAt: nowIso(),
    updatedAt: nowIso(),
    lastValidatedAt: null,
    source: source ?? null,
  };
  writeState(directoryPath, initial);
  return initial;
}

function buildExtension(directoryPath: string): InstalledExtension {
  const manifestPath = path.join(directoryPath, 'extension.json');

  if (!existsSync(manifestPath)) {
    return {
      directoryName: path.basename(directoryPath),
      directoryPath,
      manifestPath: null,
      status: 'invalid',
      manifest: null,
      errors: ['Missing extension.json manifest.'],
      state: readState(directoryPath),
    };
  }

  try {
    const parsed = JSON.parse(readFileSync(manifestPath, 'utf8')) as unknown;
    const { manifest, errors } = validateExtensionManifest(parsed, directoryPath);
    const state = ensureState(directoryPath);

    return {
      directoryName: path.basename(directoryPath),
      directoryPath,
      manifestPath,
      status: errors.length === 0 ? 'ready' : 'invalid',
      manifest,
      errors,
      state,
    };
  } catch (error) {
    return {
      directoryName: path.basename(directoryPath),
      directoryPath,
      manifestPath,
      status: 'invalid',
      manifest: null,
      errors: [error instanceof Error ? error.message : 'Failed to read manifest.'],
      state: readState(directoryPath),
    };
  }
}

export function listInstalledExtensions(): InstalledExtension[] {
  const extensionsDir = ensureExtensionsDir();

  return readdirSync(extensionsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => buildExtension(path.join(extensionsDir, entry.name)))
    .sort((a, b) => a.directoryName.localeCompare(b.directoryName));
}

export function getExtensionById(id: string) {
  const all = listInstalledExtensions();
  const exact = all.find(
    (item) => item.manifest?.id === id || item.directoryName === sanitizeExtensionId(id),
  );

  if (!exact) {
    throw new Error(`Extension '${id}' was not found.`);
  }

  return exact;
}

function resolveExtractedRoot(stagingDir: string) {
  const directManifest = path.join(stagingDir, 'extension.json');
  if (existsSync(directManifest)) return stagingDir;

  const nestedDirectories = readdirSync(stagingDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(stagingDir, entry.name));

  for (const dir of nestedDirectories) {
    if (existsSync(path.join(dir, 'extension.json'))) {
      return dir;
    }
  }

  throw new Error('Uploaded package does not contain extension.json at the root of the archive.');
}

async function installExtensionFromBuffer(buffer: Buffer, baseName: string, source: string | null) {
  if (buffer.length > MAX_ARCHIVE_BYTES) {
    throw new Error(`Extension archive exceeds the ${Math.round(MAX_ARCHIVE_BYTES / 1024 / 1024)} MB limit.`);
  }

  const extensionsDir = ensureExtensionsDir();
  mkdirSync(EXTENSION_TMP_DIR, { recursive: true });

  const fileBase = sanitizeExtensionId(baseName) || `extension-${Date.now()}`;
  const stagingDir = path.join(EXTENSION_TMP_DIR, `${Date.now()}-${fileBase}`);
  mkdirSync(stagingDir, { recursive: true });

  try {
    safeExtractZipBuffer(buffer, stagingDir);

    const extractedRoot = resolveExtractedRoot(stagingDir);
    const extension = buildExtension(extractedRoot);

    if (!extension.manifest || extension.errors.length > 0) {
      throw new Error(extension.errors.join(' '));
    }

    const destination = path.join(extensionsDir, sanitizeExtensionId(extension.manifest.id));
    if (existsSync(destination)) {
      throw new Error(`Extension '${extension.manifest.id}' is already installed.`);
    }

    renameSync(extractedRoot, destination);
    ensureState(destination, source);

    return buildExtension(destination);
  } finally {
    if (existsSync(stagingDir)) rmSync(stagingDir, { recursive: true, force: true });
  }
}

export async function installExtensionArchive(file: File) {
  if (!canWriteExtensions()) {
    throw new Error('Extension installer is disabled. Set EXTENSIONS_WRITE_ENABLED=true to enable filesystem installation.');
  }

  if (!file.name.toLowerCase().endsWith('.zip')) {
    throw new Error('Please upload a valid .zip file.');
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const baseName = file.name.replace(/\.zip$/i, '');
  return installExtensionFromBuffer(buffer, baseName, `upload:${file.name}`);
}

export async function installExtensionFromUrl(url: string) {
  if (!canWriteExtensions()) {
    throw new Error('Extension installer is disabled. Set EXTENSIONS_WRITE_ENABLED=true to enable filesystem installation.');
  }

  const buffer = await downloadArchiveBuffer(url);
  const parsed = new URL(url);
  const baseName =
    parsed.pathname.split('/').filter(Boolean).pop()?.replace(/\.zip$/i, '') ?? 'remote-extension';
  return installExtensionFromBuffer(buffer, baseName, parsed.toString());
}

export function setExtensionEnabled(id: string, enabled: boolean) {
  const extension = getExtensionById(id);
  if (extension.status !== 'ready') {
    throw new Error('Cannot change lifecycle state for an invalid extension. Validate it first.');
  }

  const current = ensureState(extension.directoryPath);
  const nextState: ExtensionLifecycleState = {
    ...current,
    enabled,
    updatedAt: nowIso(),
  };
  writeState(extension.directoryPath, nextState);
  return buildExtension(extension.directoryPath);
}

export function validateExtension(id: string) {
  const extension = getExtensionById(id);
  const current = ensureState(extension.directoryPath);
  const nextState: ExtensionLifecycleState = {
    ...current,
    enabled: extension.status === 'ready' ? current.enabled : false,
    updatedAt: nowIso(),
    lastValidatedAt: nowIso(),
  };
  writeState(extension.directoryPath, nextState);
  return buildExtension(extension.directoryPath);
}

export function uninstallExtension(id: string) {
  if (!canWriteExtensions()) {
    throw new Error('Extension uninstall is disabled. Set EXTENSIONS_WRITE_ENABLED=true to allow filesystem changes.');
  }

  const extension = getExtensionById(id);
  rmSync(extension.directoryPath, { recursive: true, force: true });
  return { success: true, id };
}

export type ReadyExtension = InstalledExtension & {
  manifest: ExtensionManifest;
  state: ExtensionLifecycleState;
};

export function listEnabledExtensions(): ReadyExtension[] {
  return listInstalledExtensions().filter(
    (item): item is ReadyExtension =>
      item.status === 'ready' && item.manifest !== null && item.state?.enabled === true,
  );
}

export type ExtensionRuntimeEntry = {
  id: string;
  name: string;
  version: string;
  kind: ExtensionManifest['kind'];
  capabilities: string[];
  entrypoints: NonNullable<ExtensionManifest['entrypoints']>;
  directoryName: string;
};

export type ExtensionRuntimeIndex = {
  apiVersion: string;
  loadMode: 'metadata-only';
  extensions: ExtensionRuntimeEntry[];
};

export function getExtensionRuntimeIndex(): ExtensionRuntimeIndex {
  return {
    apiVersion: CMS_EXTENSION_API_VERSION,
    loadMode: 'metadata-only',
    extensions: listEnabledExtensions().map((item) => ({
      id: item.manifest.id,
      name: item.manifest.name,
      version: item.manifest.version,
      kind: item.manifest.kind,
      capabilities: item.manifest.capabilities ?? [],
      entrypoints: item.manifest.entrypoints ?? {},
      directoryName: item.directoryName,
    })),
  };
}
