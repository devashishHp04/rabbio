import { NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebase-admin';
import { auth as adminAuth } from 'firebase-admin';

// Using the requested package
import { AuthClient } from 'linkedin-api-client';

function popupCloseHtml(message: any) {
  const payload = JSON.stringify(message);
  return `<!doctype html><html><body><script>window.opener && window.opener.postMessage(${payload}, window.location.origin); window.close();</script></body></html>`;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    if (error) {
      return new NextResponse(popupCloseHtml({ type: 'linkedin-auth', error, errorDescription }), { headers: { 'Content-Type': 'text/html' } });
    }

    if (!code) {
      return new NextResponse(popupCloseHtml({ type: 'linkedin-auth', error: 'missing_code' }), { headers: { 'Content-Type': 'text/html' } });
    }

    const clientId = process.env.LINKEDIN_CLIENT_ID as string;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET as string;
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI as string;

    if (!clientId || !clientSecret || !redirectUri) {
      return new NextResponse(popupCloseHtml({ type: 'linkedin-auth', error: 'server_config' }), { headers: { 'Content-Type': 'text/html' } });
    }

    const authClient = new AuthClient({ clientId, clientSecret, redirectUrl: redirectUri });
    const tokenResponse = await authClient.exchangeAuthCodeForAccessToken(code);

    // Use OpenID Connect UserInfo endpoint (requires openid scope)
    let email: string | undefined;
    let linkedinId: string | undefined;
    try {
      const userinfoResp = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      });
      if (userinfoResp.ok) {
        const userinfo = await userinfoResp.json();
        linkedinId = userinfo?.sub;
        email = userinfo?.email ?? userinfo?.email_verified ? userinfo?.email : undefined;
      }
    } catch {}

    if (!linkedinId) {
      return new NextResponse(popupCloseHtml({ type: 'linkedin-auth', error: 'missing_linkedin_id' }), { headers: { 'Content-Type': 'text/html' } });
    }

    // Create a Firebase custom token for this LinkedIn user
    getAdminApp();
    const uid = `li_${linkedinId}`;
    const claims: Record<string, any> = { provider: 'linkedin' };
    if (email) claims.email = email;
    const customToken = await adminAuth().createCustomToken(uid, claims);

    // Return to the popup to pass custom token back to opener
    return new NextResponse(popupCloseHtml({ type: 'linkedin-auth', customToken }), { headers: { 'Content-Type': 'text/html' } });
  } catch (error: any) {
    return new NextResponse(popupCloseHtml({ type: 'linkedin-auth', error: error?.message || 'callback_failed' }), { headers: { 'Content-Type': 'text/html' } });
  }
}


