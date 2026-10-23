import type { CSSProperties } from "react";
import { api } from "./api-client";
import type { TemplateTokens } from "./types";

/**
 * The active theme's design tokens, or null when none is active or the CMS is
 * unreachable. The public site must always render, so this never throws.
 */
export async function getActiveTemplateTokens(): Promise<TemplateTokens | null> {
  try {
    const result = await api.template.active();
    if (!result.active) return null;
    return result.tokens ?? null;
  } catch {
    return null;
  }
}

/**
 * Map template tokens to CSS custom properties consumed by `globals.css`.
 * Values were already validated on the CMS, and only known keys are mapped.
 */
export function templateCssVars(tokens: TemplateTokens | null | undefined): CSSProperties {
  const vars: Record<string, string> = {};
  if (!tokens) return vars as CSSProperties;

  if (tokens.primaryColor) vars["--thoth-primary"] = tokens.primaryColor;
  if (tokens.accentColor) vars["--thoth-accent"] = tokens.accentColor;
  if (tokens.bgColor) vars["--thoth-bg"] = tokens.bgColor;
  if (tokens.textColor) vars["--thoth-text"] = tokens.textColor;
  if (tokens.fontFamily) vars["--thoth-font"] = tokens.fontFamily;

  return vars as CSSProperties;
}
