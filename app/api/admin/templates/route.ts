import { NextResponse } from 'next/server';
import {
  CMS_TEMPLATE_API_VERSION,
  canWriteTemplates,
  getTemplatesDir,
  getTemplateRuntimeIndex,
  installTemplateArchive,
  installTemplateFromUrl,
  listInstalledTemplates,
  readTemplatesState,
} from '@/lib/templates/registry';
import { guardApiSession } from '@/lib/security/api-policy';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error';
}

export const dynamic = 'force-dynamic';

export async function GET() {
  const denied = await guardApiSession();
  if (denied) return denied;
  try {
    return NextResponse.json({
      apiVersion: CMS_TEMPLATE_API_VERSION,
      installMode: canWriteTemplates() ? 'filesystem-write' : 'manual-only',
      templatesDir: getTemplatesDir(),
      state: readTemplatesState(),
      items: listInstalledTemplates(),
      runtime: getTemplateRuntimeIndex(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to read templates: ${getErrorMessage(error)}` },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const denied = await guardApiSession();
  if (denied) return denied;

  const contentType = req.headers.get('content-type') ?? '';

  try {
    if (contentType.includes('application/json')) {
      const body = (await req.json()) as { url?: unknown };
      if (typeof body.url !== 'string' || body.url.trim().length === 0) {
        return NextResponse.json({ error: 'Provide a "url" pointing to a .zip template archive.' }, { status: 400 });
      }

      const installed = await installTemplateFromUrl(body.url.trim());

      return NextResponse.json({
        success: true,
        item: installed,
        message: `Template '${installed.manifest?.name ?? installed.directoryName}' installed successfully.`,
      });
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Please upload a .zip template package.' }, { status: 400 });
    }

    const installed = await installTemplateArchive(file);

    return NextResponse.json({
      success: true,
      item: installed,
      message: `Template '${installed.manifest?.name ?? installed.directoryName}' installed successfully.`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 400 },
    );
  }
}
