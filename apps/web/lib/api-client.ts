// Central API client for the public web app.
// All data access goes through here — components never fetch CMS URLs directly.

import type { ActiveTemplate, MenuItem, Page, Project, SiteConfig } from "./types";

/** Env var missing or empty → app is misconfigured. */
export class ApiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiConfigError";
  }
}

/** CMS unreachable (network / DNS / connection refused). */
export class ApiNetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiNetworkError";
  }
}

/** CMS answered with a non-2xx status. */
export class ApiHttpError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiHttpError";
    this.status = status;
  }
}

function getBaseUrl(): string {
  const base = (process.env.NEXT_PUBLIC_THOTH_API_URL ?? "").trim().replace(/\/+$/, "");
  if (!base) {
    throw new ApiConfigError(
      "NEXT_PUBLIC_THOTH_API_URL is not set — copy .env.example to .env.local and set the CMS API base URL."
    );
  }
  return base;
}

export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getBaseUrl()}${normalized}`;
}

export async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(apiUrl(path), {
      ...init,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiNetworkError(`Cannot reach the CMS API at ${getBaseUrl()}`);
  }
  if (!res.ok) {
    throw new ApiHttpError(res.status, `CMS API responded ${res.status} for ${path}`);
  }
  return (await res.json()) as T;
}

/** Endpoints that exist on the CMS today (public read). */
export const api = {
  pages: {
    list: () => getJson<Page[]>("/api/pages"),
    bySlug: (slug: string) => getJson<Page>(`/api/pages/${encodeURIComponent(slug)}`),
  },
  menu: {
    list: () => getJson<MenuItem[]>("/api/menu-items"),
  },
  siteConfig: {
    get: () => getJson<SiteConfig>("/api/site-config"),
  },
  projects: {
    list: () => getJson<Project[]>("/api/projects"),
  },
  template: {
    active: () => getJson<ActiveTemplate>("/api/templates/active"),
  },
};
