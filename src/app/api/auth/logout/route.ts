import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ status: 'ok' });
  response.cookies.set({
    name: '__session',
    value: '',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}


