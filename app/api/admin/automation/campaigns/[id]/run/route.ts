import { NextResponse } from 'next/server';
import { runCampaign } from '@/lib/automation/service';
import { guardApiSession } from "@/lib/security/api-policy";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guardApiSession();
  if (denied) return denied;
  try {
    const { id } = await params;
    return NextResponse.json(await runCampaign(id));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to run campaign';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
