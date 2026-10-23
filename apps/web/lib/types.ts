// Public types mirrored from THOTH CMS API responses (JSON-serialized).
// Dates arrive as ISO 8601 strings.

export interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  contentJson?: unknown;
  contentVer?: number;
  excerpt: string;
  sourceType: string;
  sourceRef: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  date: string;
  thumbnail: string | null;
  gallery: string[];
  videoLink: string | null;
  projectUrl: string | null;
  toolsUsed: string[];
  createdAt: string;
  updatedAt: string;
  category: { id: string; name: string };
}

export interface MenuItem {
  id: string;
  label: string;
  url: string;
  order: number;
  isExternal: boolean;
  isVisible: boolean;
  showInNavbar: boolean;
  showInSidebar: boolean;
  showInFooter: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateTokens {
  primaryColor?: string;
  accentColor?: string;
  bgColor?: string;
  textColor?: string;
  fontFamily?: string;
  layoutStyle?: string;
  mode?: string;
}

export interface ActiveTemplate {
  active: boolean;
  templateId: string | null;
  name?: string;
  version?: string;
  tokens: TemplateTokens;
}

export interface SiteConfig {
  id: string;
  siteName: string;
  domain: string;
  language: string;
  timezone: string;
  logoUrl: string;
  logoAlt: string;
  showLogoText: boolean;
  navStyle: string;
  navBgColor: string;
  navTextColor: string;
  showHero: boolean;
  heroStyle: string;
  heroHeading: string;
  heroSubheading: string;
  heroBgColor: string;
  heroTextColor: string;
  heroImageUrl: string;
  heroBtnLabel: string;
  heroBtnColor: string;
  primaryColor: string;
  accentColor: string;
  bgColor: string;
  textColor: string;
  fontFamily: string;
  layoutStyle: string;
  showSidebar: boolean;
  sidebarPosition: string;
  footerCopyright: string;
  footerBgColor: string;
  footerTextColor: string;
  discordUrl: string;
  githubUrl: string;
  twitterUrl: string;
  linkedinUrl: string;
  privacyUrl: string;
  termsUrl: string;
  cookiePolicyUrl: string;
  createdAt: string;
  updatedAt: string;
}
