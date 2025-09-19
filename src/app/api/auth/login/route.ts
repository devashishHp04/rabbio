import { NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebase-admin';
import { auth as adminAuth } from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();
    if (!idToken) {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
    }

    getAdminApp();

    const expiresIn = 14 * 24 * 60 * 60 * 1000; // 2 weeks

    // Decode token to capture user info and upsert into Firestore
    const decoded = await adminAuth().verifyIdToken(idToken, true);

    try {
      const db = getFirestore();
      const userRef = db.doc(`users/${decoded.uid}`);
      const existingSnap = await userRef.get();
      let existing = existingSnap.exists ? existingSnap.data() || {} : {};

      // If no doc for uid, but we can find one by email, migrate it
      if (!existingSnap.exists && decoded.email) {
        const q = await db.collection('users').where('email', '==', decoded.email).limit(1).get();
        if (!q.empty) {
          const found = q.docs[0];
          if (found.id !== decoded.uid) {
            const foundData = found.data() || {};
            existing = { ...foundData };
            // Upsert to canonical uid doc with found data
            await userRef.set(foundData, { merge: true });
            // Optionally delete the old doc to prevent duplicates
            try { await db.doc(`users/${found.id}`).delete(); } catch {}
          }
        }
      }

      // Prepare updates without clobbering existing values
      const updates: any = {
        provider: (decoded as any).provider || decoded.firebase?.sign_in_provider || existing.provider || 'custom',
        linkedinId: (decoded as any).linkedin_id ?? existing.linkedinId ?? null,
        firstName: (decoded as any).first_name ?? existing.firstName ?? null,
        lastName: (decoded as any).last_name ?? existing.lastName ?? null,
        emailVerified: (decoded as any).email_verified ?? existing.emailVerified ?? false,
        displayName: (decoded as any).name ?? existing.displayName ?? null,
        photoURL: (decoded as any).picture ?? existing.photoURL ?? null,
        // Preserve existing role/plan; set defaults only if still missing
        role: (existing as any).role ?? 'viewer',
        plan: (existing as any).plan ?? 'free',
        subscriptionStatus: existing.subscriptionStatus ?? null,
        selectedTherapeuticArea: existing.selectedTherapeuticArea ?? null,
        dateUpdated: new Date(),
      };

      // Only write email if we have one; never overwrite with null
      if (decoded.email) {
        updates.email = decoded.email;
      } else if (existing.email) {
        updates.email = existing.email;
      } else {
        updates.email = null;
      }

      await userRef.set(updates, { merge: true });
    } catch (e) {
      console.error('Failed to upsert user profile:', e);
    }

    const sessionCookie = await adminAuth().createSessionCookie(idToken, { expiresIn });

    const response = NextResponse.json({ status: 'ok' });
    response.cookies.set({
      name: '__session',
      value: sessionCookie,
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: expiresIn / 1000,
    });
    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error?.message || 'Login failed' }, { status: 401 });
  }
}


