import { NextRequest, NextResponse } from "next/server";
import { getSiteConfig, updateSiteConfig, type SiteConfig } from "@/lib/site-config-data";
import { guardApiSession } from "@/lib/security/api-policy";

export async function GET() {
  try {
    const config = await getSiteConfig();
    return NextResponse.json(config);
  } catch (error) {
    console.error("GET /api/site-config error:", error);
    return NextResponse.json({ error: "Failed to fetch site config" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const denied = await guardApiSession();
  if (denied) return denied;
  try {
    const body = await request.json();

    const allowed = [
      "siteName", "domain", "language", "timezone",
      // Zone 1 - Logo
      "logoUrl", "logoAlt", "showLogoText",
      // Zone 1 - Navbar
      "navStyle", "navBgColor", "navTextColor",
      // Zone 1 - Hero
      "showHero", "heroStyle", "heroHeading", "heroSubheading",
      "heroBgColor", "heroTextColor", "heroImageUrl", "heroBtnLabel", "heroBtnColor",
      // Zone 2 - Main
      "primaryColor", "accentColor", "bgColor", "textColor",
      "fontFamily", "layoutStyle",
      // Zone 3 - Footer
      "footerCopyright", "footerBgColor", "footerTextColor",
      "discordUrl", "githubUrl", "twitterUrl", "linkedinUrl",
      "privacyUrl", "termsUrl", "cookiePolicyUrl", "marketplaceUrl",
    ] as const;

    const data: Partial<Omit<SiteConfig, "id" | "createdAt" | "updatedAt">> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key];
    }

    const config = await updateSiteConfig(data);
    return NextResponse.json(config);
  } catch (error) {
    console.error("PATCH /api/site-config error:", error);
    return NextResponse.json({ error: "Failed to update site config" }, { status: 500 });
  }
}
