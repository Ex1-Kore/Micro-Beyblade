import type { Metadata } from "next";
import "./globals.css";
import { getActiveTemplateTokens, templateCssVars } from "@/lib/template";

export const metadata: Metadata = {
  title: {
    default: "Micro-Beyblade",
    template: "%s · Micro-Beyblade",
  },
  description: "Public website for Micro-Beyblade powered by headless CMS",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const tokens = await getActiveTemplateTokens();

  return (
    <html lang="th" style={templateCssVars(tokens)}>
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
