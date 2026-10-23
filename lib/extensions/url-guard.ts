import { isIP } from 'node:net';
import { lookup } from 'node:dns/promises';

export const MAX_ARCHIVE_BYTES = 8 * 1024 * 1024;
const MAX_REDIRECTS = 5;
const FETCH_TIMEOUT_MS = 20_000;
const INSTALLER_USER_AGENT = 'thoth-extension-installer/1.0';

function getAllowedHosts() {
  return (process.env.EXTENSIONS_ALLOWED_HOSTS ?? '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function normalizeHostname(hostname: string) {
  return hostname.startsWith('[') && hostname.endsWith(']') ? hostname.slice(1, -1) : hostname;
}

function isAllowedHost(hostname: string) {
  return getAllowedHosts().includes(normalizeHostname(hostname).toLowerCase());
}

function ipv4IsDisallowed(address: string) {
  const parts = address.split('.').map((part) => Number.parseInt(part, 10));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return true;

  const [a, b] = parts;
  if (a === 0) return true;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 192 && b === 0) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  if (a >= 224) return true;
  return false;
}

function ipv6IsDisallowed(address: string) {
  const normalized = address.toLowerCase();

  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return ipv4IsDisallowed(mapped[1]);

  if (normalized === '::' || normalized === '::1') return true;
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
  if (normalized.startsWith('fe8') || normalized.startsWith('fe9')) return true;
  if (normalized.startsWith('fea') || normalized.startsWith('feb')) return true;
  if (normalized.startsWith('ff')) return true;
  if (normalized.startsWith('2001:db8')) return true;
  return false;
}

export function isDisallowedAddress(address: string): boolean {
  const version = isIP(address);
  if (version === 4) return ipv4IsDisallowed(address);
  if (version === 6) return ipv6IsDisallowed(address);
  return true;
}

export function assertAllowedArchiveUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new Error('Provide a valid absolute URL for the extension archive.');
  }

  const hostname = normalizeHostname(url.hostname);

  if (isAllowedHost(hostname)) return url;

  if (url.protocol !== 'https:') {
    throw new Error('Extension archives must be downloaded over https.');
  }

  if (isIP(hostname) && isDisallowedAddress(hostname)) {
    throw new Error('Refusing to download from a private or reserved network address.');
  }

  return url;
}

export async function assertPublicHost(rawHostname: string) {
  const hostname = normalizeHostname(rawHostname);
  if (isAllowedHost(hostname)) return;
  if (isIP(hostname)) {
    if (isDisallowedAddress(hostname)) {
      throw new Error('Refusing to download from a private or reserved network address.');
    }
    return;
  }

  let resolved: { address: string }[];
  try {
    resolved = await lookup(hostname, { all: true });
  } catch {
    throw new Error(`Could not resolve host '${hostname}'.`);
  }

  if (resolved.length === 0) {
    throw new Error(`Could not resolve host '${hostname}'.`);
  }

  if (resolved.some((entry) => isDisallowedAddress(entry.address))) {
    throw new Error('Refusing to download from a host that resolves to a private or reserved address.');
  }
}

async function readCapped(response: Response, maxBytes: number) {
  const reader = response.body?.getReader();
  if (!reader) {
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > maxBytes) {
      throw new Error(`Extension archive exceeds the ${Math.round(maxBytes / 1024 / 1024)} MB limit.`);
    }
    return buffer;
  }

  const chunks: Buffer[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.length;
    if (total > maxBytes) {
      await reader.cancel();
      throw new Error(`Extension archive exceeds the ${Math.round(maxBytes / 1024 / 1024)} MB limit.`);
    }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks);
}

export async function downloadArchiveBuffer(raw: string) {
  let current = assertAllowedArchiveUrl(raw).toString();

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    const parsed = new URL(current);
    await assertPublicHost(parsed.hostname);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(current, {
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          accept: 'application/zip, application/octet-stream',
          'user-agent': INSTALLER_USER_AGENT,
        },
      });
    } catch (error) {
      throw new Error(
        error instanceof Error && error.name === 'AbortError'
          ? 'Timed out while downloading the extension archive.'
          : 'Failed to download the extension archive.',
      );
    } finally {
      clearTimeout(timer);
    }

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location) throw new Error('Download redirected without a location header.');
      current = assertAllowedArchiveUrl(new URL(location, current).toString()).toString();
      continue;
    }

    if (!response.ok) {
      throw new Error(`Download failed with status ${response.status}.`);
    }

    const declared = Number.parseInt(response.headers.get('content-length') ?? '', 10);
    if (Number.isFinite(declared) && declared > MAX_ARCHIVE_BYTES) {
      throw new Error(`Extension archive exceeds the ${Math.round(MAX_ARCHIVE_BYTES / 1024 / 1024)} MB limit.`);
    }

    return readCapped(response, MAX_ARCHIVE_BYTES);
  }

  throw new Error('Extension archive download exceeded the maximum number of redirects.');
}
