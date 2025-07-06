import { NextRequest, NextResponse } from 'next/server';
import { getSoftwareDevJobCount } from '@/lib/blsScraper';

// Get emails from env or hardcode for now (replace with env in prod)
const EMAILS = [
  process.env.REPORT_EMAIL_SHWN || 'shawn@example.com',
  process.env.REPORT_EMAIL_MARK || 'mark@example.com',
];

export async function POST(req: NextRequest) {
  try {
    // Accept { live?: boolean, mockHtml?: string } in body
    const body = await req.json();
    const { live = true, mockHtml } = body;
    const data = await getSoftwareDevJobCount({ live, mockHtml });

    // Compose email
    const subject = `BLS Software Developer Jobs (${data.year})`;
    const html = `<h1>Software Developer Jobs (${data.year})</h1><p>Employment: <b>${data.count.toLocaleString()}</b></p>`;

    // Only require resend when actually sending email
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Send to both recipients
    const results = await Promise.all(
      EMAILS.map(email =>
        resend.emails.send({
          from: 'Codepocalypse Tracker <noreply@codepocalypse.dev>',
          to: email,
          subject,
          html,
        })
      )
    );

    return NextResponse.json({ ok: true, data, results });
  } catch (err: unknown) {
    let message = 'Unknown error';
    if (err instanceof Error) message = err.message;
    else if (typeof err === 'string') message = err;
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET() {
  // For quick testing: just fetch and return the latest job count
  try {
    const data = await getSoftwareDevJobCount({ live: true });
    return NextResponse.json({ ok: true, data });
  } catch (err: unknown) {
    let message = 'Unknown error';
    if (err instanceof Error) message = err.message;
    else if (typeof err === 'string') message = err;
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
