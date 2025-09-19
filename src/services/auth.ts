
'use server';
 
 import { db } from '@/lib/firebase';
 import { doc, setDoc } from 'firebase/firestore';
 import { cookies } from 'next/headers';
 import { auth as adminAuth } from 'firebase-admin';
 import { getAdminApp } from '@/lib/firebase-admin';
 import { getFirestore } from 'firebase-admin/firestore';
 import type { AuthenticatedUser } from '@/lib/types';


/**
 * Creates the initial admin user in Firebase Auth and Firestore.
 * This is intended to be a one-time setup action.
 */
export async function createAdminUser() {
    try {
        getAdminApp(); // Ensure the admin app is initialized
        const email = 'admin@rabbio.com';
        const password = 'password123'; // A temporary, known password
        const role = 'admin';

        // Check if user already exists
        let userRecord;
        try {
            userRecord = await adminAuth().getUserByEmail(email);
        } catch (error: any) {
            if (error.code !== 'auth/user-not-found') {
                throw error; // Re-throw other errors
            }
        }

        if (userRecord) {
             throw new Error(`User with email ${email} already exists.`);
        }

        // Create user in Firebase Authentication
        userRecord = await adminAuth().createUser({
            email: email,
            password: password,
            emailVerified: true,
            disabled: false,
        });

        // Create user role document in Firestore
        const userDocRef = doc(db, 'users', userRecord.uid);
        await setDoc(userDocRef, {
            email: userRecord.email,
            role: role,
            plan: 'pro',
            subscriptionStatus: 'active',
            selectedTherapeuticArea: null,
        });

        console.log(`Successfully created new admin user: ${userRecord.uid}`);
        return { uid: userRecord.uid, email: userRecord.email };

    } catch (error: any) {
        console.error('Error creating admin user:', error);
        throw new Error(error.message || 'An unknown error occurred while creating the admin user.');
    }
}


/**
 * Gets the current authenticated user and their role from Firebase.
 * This is a mock implementation and should be replaced with real auth.
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('__session')?.value;
    console.log('[auth] getCurrentUser: session cookie', session ? 'present' : 'missing');
    if (!session) return null;

    getAdminApp();
    const decoded = await adminAuth().verifySessionCookie(session, true);
    console.log('[auth] verified session cookie for uid:', decoded.uid, 'email:', decoded.email);
    const adminDb = getFirestore();
    let userSnap = await adminDb.doc(`users/${decoded.uid}`).get();
    if (!userSnap.exists) {
      // Try fallback by email (handles older accounts where doc id != auth uid)
      if (decoded.email) {
        const byEmail = await adminDb.collection('users').where('email', '==', decoded.email).limit(1).get();
        if (!byEmail.empty) {
          const found = byEmail.docs[0];
          const foundData = found.data();
          console.log('[auth] migrating user doc from', found.id, 'to', decoded.uid);
          // Create/merge canonical doc at auth uid
          await adminDb.doc(`users/${decoded.uid}`).set({
            email: decoded.email,
            role: foundData.role ?? 'viewer',
            plan: foundData.plan ?? 'free',
            subscriptionStatus: foundData.subscriptionStatus ?? null,
            selectedTherapeuticArea: foundData.selectedTherapeuticArea ?? null,
          }, { merge: true });
          userSnap = await adminDb.doc(`users/${decoded.uid}`).get();
        }
      }
    }
    if (!userSnap.exists) {
      console.log('[auth] user doc still not found; returning minimal defaults');
      return {
        uid: decoded.uid,
        email: decoded.email || '',
        role: 'viewer',
        plan: 'free',
        subscriptionStatus: null,
        selectedTherapeuticArea: null,
      };
    }
    const userData = userSnap.data() as any;
    console.log('[auth] loaded user doc:', { uid: userSnap.id, email: userData?.email, role: userData?.role, plan: userData?.plan });
    return {
      uid: userSnap.id,
      email: userData.email || decoded.email || '',
      role: userData.role || 'viewer',
      plan: userData.plan || 'free',
      subscriptionStatus: userData.subscriptionStatus || null,
      selectedTherapeuticArea: userData.selectedTherapeuticArea || null,
    };
  } catch (error) {
    console.error('[auth] getCurrentUser error:', error);
    return null;
  }
}


/**
 * Updates the selected therapeutic area for a user.
 * @param userId The ID of the user.
 * @param therapeuticArea The therapeutic area to set.
 */
export async function selectTherapeuticArea(userId: string, therapeuticArea: string): Promise<void> {
    if (!userId || !therapeuticArea) {
        throw new Error("User ID and therapeutic area are required.");
    }
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, { selectedTherapeuticArea: therapeuticArea }, { merge: true });
}
