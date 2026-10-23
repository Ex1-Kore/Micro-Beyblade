#!/usr/bin/env node
import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const extensionsDir = path.join(root, 'extensions');

function readArg(flag) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function sanitize(input) {
  return String(input || '').trim().toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
}

const id = sanitize(readArg('--id'));
const name = readArg('--name')?.trim() || 'New Extension';
const author = readArg('--author')?.trim() || 'Your Team';

if (!id) {
  console.error('Usage: npm run scaffold:module -- --id my-extension --name "My Extension"');
  process.exit(1);
}

const targetDir = path.join(extensionsDir, id);
if (existsSync(targetDir)) {
  console.error(`Extension '${id}' already exists.`);
  process.exit(1);
}

mkdirSync(path.join(targetDir, 'admin'), { recursive: true });
mkdirSync(path.join(targetDir, 'api'), { recursive: true });
mkdirSync(path.join(targetDir, 'hooks'), { recursive: true });

const manifest = {
  id,
  name,
  version: '0.1.0',
  apiVersion: '1',
  kind: 'module',
  description: `Optional extension package for ${name}`,
  author,
  capabilities: ['admin-page', 'api'],
  entrypoints: {
    adminPage: './admin/page.tsx',
    api: './api/route.ts',
  },
};

writeFileSync(path.join(targetDir, 'extension.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
writeFileSync(path.join(targetDir, 'README.md'), `# ${name}\n\nDescribe what this module adds, which env vars it needs, and how to enable it.\n`, 'utf8');
writeFileSync(path.join(targetDir, 'admin', 'page.tsx'), `export default function ${id.replace(/[^a-z0-9]/gi, '') || 'Extension'}AdminPage() {\n  return null;\n}\n`, 'utf8');
writeFileSync(path.join(targetDir, 'api', 'route.ts'), `export async function GET() {\n  return Response.json({ ok: true, module: '${id}' });\n}\n`, 'utf8');
writeFileSync(path.join(targetDir, 'hooks', 'README.md'), 'Document optional lifecycle hooks for this module here.\n', 'utf8');

console.log(`Created extension scaffold at extensions/${id}`);
