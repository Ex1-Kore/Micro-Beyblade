-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "thumbnail" TEXT,
    "gallery" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "videoLink" TEXT,
    "projectUrl" TEXT,
    "toolsUsed" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "siteName" TEXT NOT NULL DEFAULT 'Micro Headless CMS',
    "domain" TEXT NOT NULL DEFAULT '',
    "language" TEXT NOT NULL DEFAULT 'th',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Bangkok',
    "logoUrl" TEXT NOT NULL DEFAULT '',
    "logoAlt" TEXT NOT NULL DEFAULT 'Logo',
    "showLogoText" BOOLEAN NOT NULL DEFAULT true,
    "navStyle" TEXT NOT NULL DEFAULT 'fixed',
    "navBgColor" TEXT NOT NULL DEFAULT '#0ea5e9',
    "navTextColor" TEXT NOT NULL DEFAULT '#ffffff',
    "showHero" BOOLEAN NOT NULL DEFAULT true,
    "heroStyle" TEXT NOT NULL DEFAULT 'centered',
    "heroHeading" TEXT NOT NULL DEFAULT 'Welcome to your site',
    "heroSubheading" TEXT NOT NULL DEFAULT 'Use the CMS to manage reusable content for any frontend application',
    "heroBgColor" TEXT NOT NULL DEFAULT '#f0f9ff',
    "heroTextColor" TEXT NOT NULL DEFAULT '#0f172a',
    "heroImageUrl" TEXT NOT NULL DEFAULT '',
    "heroBtnLabel" TEXT NOT NULL DEFAULT 'Explore content',
    "heroBtnColor" TEXT NOT NULL DEFAULT '#f59e0b',
    "primaryColor" TEXT NOT NULL DEFAULT '#0ea5e9',
    "accentColor" TEXT NOT NULL DEFAULT '#f59e0b',
    "bgColor" TEXT NOT NULL DEFAULT '#f8fafc',
    "textColor" TEXT NOT NULL DEFAULT '#1e293b',
    "fontFamily" TEXT NOT NULL DEFAULT 'Inter',
    "layoutStyle" TEXT NOT NULL DEFAULT 'grid',
    "showSidebar" BOOLEAN NOT NULL DEFAULT false,
    "sidebarPosition" TEXT NOT NULL DEFAULT 'left',
    "footerCopyright" TEXT NOT NULL DEFAULT '© 2024 My Site',
    "footerBgColor" TEXT NOT NULL DEFAULT '#1e293b',
    "footerTextColor" TEXT NOT NULL DEFAULT '#94a3b8',
    "discordUrl" TEXT NOT NULL DEFAULT '',
    "githubUrl" TEXT NOT NULL DEFAULT '',
    "twitterUrl" TEXT NOT NULL DEFAULT '',
    "linkedinUrl" TEXT NOT NULL DEFAULT '',
    "privacyUrl" TEXT NOT NULL DEFAULT '',
    "termsUrl" TEXT NOT NULL DEFAULT '',
    "cookiePolicyUrl" TEXT NOT NULL DEFAULT '',
    "marketplaceUrl" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isExternal" BOOLEAN NOT NULL DEFAULT false,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "showInNavbar" BOOLEAN NOT NULL DEFAULT true,
    "showInSidebar" BOOLEAN NOT NULL DEFAULT false,
    "showInFooter" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Page" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "contentJson" JSONB,
    "contentVer" INTEGER NOT NULL DEFAULT 1,
    "excerpt" TEXT NOT NULL DEFAULT '',
    "sourceType" TEXT NOT NULL DEFAULT 'manual',
    "sourceRef" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffMember" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "email" TEXT,
    "bio" TEXT NOT NULL DEFAULT '',
    "avatarUrl" TEXT,
    "accentColor" TEXT NOT NULL DEFAULT 'blue',
    "githubUrl" TEXT,
    "projectUrl" TEXT,
    "projectHighlights" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "customLinks" JSONB DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storageProvider" TEXT NOT NULL DEFAULT 'local',
    "storageKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecretStore" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "provider" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecretStore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiAutoPostCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'google-ai-studio',
    "model" TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
    "topic" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL DEFAULT '',
    "slugPrefix" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Bangkok',
    "scheduleType" TEXT NOT NULL DEFAULT 'daily',
    "scheduleTime" TEXT NOT NULL DEFAULT '09:00',
    "publishAsPublished" BOOLEAN NOT NULL DEFAULT false,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "lastResult" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiAutoPostCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiAutoPostRun" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "title" TEXT,
    "slug" TEXT,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "prompt" TEXT NOT NULL DEFAULT '',
    "output" TEXT NOT NULL DEFAULT '',
    "error" TEXT,
    "ranAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiAutoPostRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffRepo" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "demoUrl" TEXT,
    "sourceUrl" TEXT,
    "landingUrl" TEXT,
    "staffMemberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffRepo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Page_slug_key" ON "Page"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "StaffMember_slug_key" ON "StaffMember"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "SecretStore_key_key" ON "SecretStore"("key");

-- CreateIndex
CREATE INDEX "AiAutoPostRun_campaignId_ranAt_idx" ON "AiAutoPostRun"("campaignId", "ranAt");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiAutoPostRun" ADD CONSTRAINT "AiAutoPostRun_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AiAutoPostCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffRepo" ADD CONSTRAINT "StaffRepo_staffMemberId_fkey" FOREIGN KEY ("staffMemberId") REFERENCES "StaffMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

