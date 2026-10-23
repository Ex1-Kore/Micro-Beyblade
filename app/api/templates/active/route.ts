import { NextResponse } from 'next/server';
import { getActiveTemplate } from '@/lib/templates/registry';

export const dynamic = 'force-dynamic';

/**
 * Public read: the currently active template's design tokens only.
 * Never exposes filesystem paths or manifest internals.
 */
export async function GET() {
  try {
    const template = getActiveTemplate();

    if (!template || !template.manifest) {
      return NextResponse.json({ active: false, templateId: null, tokens: {} });
    }

    return NextResponse.json({
      active: true,
      templateId: template.manifest.id,
      name: template.manifest.name,
      version: template.manifest.version,
      tokens: template.manifest.tokens ?? {},
    });
  } catch (error) {
    console.error('GET /api/templates/active error:', error);
    return NextResponse.json({ error: 'Failed to read active template' }, { status: 500 });
  }
}
