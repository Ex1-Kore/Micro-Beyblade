import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import AdmZip from 'adm-zip';

export const MAX_EXTRACTED_BYTES = 64 * 1024 * 1024;
export const MAX_ARCHIVE_ENTRIES = 2_000;

/**
 * Extract a ZIP buffer into `stagingDir`, rejecting unsafe entries:
 * absolute paths, `..` traversal, null bytes, excessive entry counts,
 * and archives that expand beyond `MAX_EXTRACTED_BYTES`.
 */
export function safeExtractZipBuffer(buffer: Buffer, stagingDir: string) {
  let archive: AdmZip;
  try {
    archive = new AdmZip(buffer);
  } catch {
    throw new Error('The uploaded file is not a readable ZIP archive.');
  }

  const entries = archive.getEntries();
  if (entries.length > MAX_ARCHIVE_ENTRIES) {
    throw new Error(`Archive contains too many files (limit ${MAX_ARCHIVE_ENTRIES}).`);
  }

  let extractedBytes = 0;
  for (const entry of entries) {
    if (entry.isDirectory) continue;

    const rawName = entry.entryName.replace(/\\/g, '/');
    const normalized = path.posix.normalize(rawName);
    if (
      rawName.includes('\0') ||
      path.posix.isAbsolute(rawName) ||
      normalized === '..' ||
      normalized.startsWith('../')
    ) {
      throw new Error(`Archive entry has an unsafe path: ${entry.entryName}`);
    }

    const destination = path.join(stagingDir, normalized);
    const relative = path.relative(stagingDir, destination);
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error(`Archive entry escapes the staging directory: ${entry.entryName}`);
    }

    const data = entry.getData();
    extractedBytes += data.length;
    if (extractedBytes > MAX_EXTRACTED_BYTES) {
      throw new Error(`Archive expands beyond the ${Math.round(MAX_EXTRACTED_BYTES / 1024 / 1024)} MB limit.`);
    }

    mkdirSync(path.dirname(destination), { recursive: true });
    writeFileSync(destination, data);
  }
}
