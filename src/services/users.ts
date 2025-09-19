
'use server';

import { db } from '@/lib/firebase';
import type { AuthenticatedUser } from '@/lib/types';
import { collection, getDocs } from 'firebase/firestore';

/**
 * Fetches all users from the Firestore 'users' collection.
 * @returns A promise that resolves to an array of user objects.
 */
export async function getAllUsers(): Promise<AuthenticatedUser[]> {
  try {
    const usersCol = collection(db, 'users');
    const snapshot = await getDocs(usersCol);
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            uid: doc.id,
            email: data.email || null,
            role: data.role || 'viewer',
            plan: data.plan || 'free',
            subscriptionStatus: data.subscriptionStatus || null,
        }
    });
  } catch (error) {
    console.error("Error fetching all users:", error);
    return [];
  }
}
