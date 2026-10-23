import { NextResponse } from 'next/server';
import { runDueCampaigns } from '@/lib/automation/service';
import { isCronAuthorized } from '@/lib/automation/cron-auth';

export async function POST(request: Request) {
  try {
    if (!isCronAuthorized(request.headers, process.env.AUTOMATION_CRON_SECRET)) {
      return NextResponse.json({ error: 'Unauthorized automation runner.' }, { status: 401 });
    }

    const results = await runDueCampaigns();
    return NextResponse.json({ success: true, results });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to run automation';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
