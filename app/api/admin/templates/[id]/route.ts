import { NextResponse } from 'next/server';
import {
  canWriteTemplates,
  clearActiveTemplate,
  getTemplateById,
  setActiveTemplate,
  uninstallTemplate,
  validateTemplate,
} from '@/lib/templates/registry';
import { guardApiSession } from '@/lib/security/api-policy';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error';
}

export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guardApiSession();
  if (denied) return denied;
  try {
    const { id } = await params;
    return NextResponse.json({ item: getTemplateById(id) });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 404 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guardApiSession();
  if (denied) return denied;
  try {
    const { id } = await params;
    const body = (await req.json()) as { action?: string };

    if (body.action === 'activate') {
      return NextResponse.json({ success: true, state: setActiveTemplate(id) });
    }

    if (body.action === 'deactivate') {
      return NextResponse.json({ success: true, state: clearActiveTemplate() });
    }

    if (body.action === 'validate') {
      return NextResponse.json({ success: true, item: validateTemplate(id) });
    }

    return NextResponse.json({ error: 'Unsupported action. Use activate, deactivate, or validate.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guardApiSession();
  if (denied) return denied;
  try {
    const { id } = await params;

    if (!canWriteTemplates()) {
      return NextResponse.json(
        { error: 'Template uninstall is disabled in this environment.' },
        { status: 403 },
      );
    }

    return NextResponse.json(uninstallTemplate(id));
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}
