import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const clientId = process.env.LINKEDIN_CLIENT_ID as string;
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI as string;
    const rawScope = process.env.LINKEDIN_SCOPE || 'r_liteprofile r_emailaddress openid';
    const state = process.env.LINKEDIN_STATE || Math.random().toString(36).slice(2);

    if (!clientId || !redirectUri) {
      return NextResponse.json({ error: 'LinkedIn env not configured' }, { status: 500 });
    }

    const scope = encodeURIComponent(rawScope);
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${encodeURIComponent(state)}`;

    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to start LinkedIn auth' }, { status: 500 });
  }
}


