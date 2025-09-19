
'use server';

import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { auth as adminAuth } from 'firebase-admin';
import type { UserRole, Plan } from '@/lib/types';
import { getAdminApp } from '@/lib/firebase-admin';

interface CreateUserInput {
    email: string;
    role: UserRole;
    plan: Plan;
}

/**
 * Creates a sample user in Firebase Auth and Firestore.
 */
export async function createSampleUser(user: CreateUserInput): Promise<{ success: boolean; message: string; }> {
    try {
        getAdminApp(); // Ensure the admin app is initialized
        const { email, role, plan } = user;
        const password = 'password123'; // Standard password for all sample users

        let userRecord;
        try {
            // Check if user already exists
            userRecord = await adminAuth().getUserByEmail(email);
            // If user exists, we'll just update their Firestore record below.
            console.log(`User ${email} already exists in Auth. Updating Firestore record.`);
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                // User does not exist, so create them.
                userRecord = await adminAuth().createUser({
                    email: email,
                    password: password,
                    emailVerified: true,
                    disabled: false,
                });
                console.log(`Created new user in Auth: ${email}`);
            } else {
                throw error; // Re-throw other errors
            }
        }

        // Create or update user role document in Firestore
        const userDocRef = doc(db, 'users', userRecord.uid);
        await setDoc(userDocRef, {
            email: userRecord.email,
            role: role,
            plan: plan,
            subscriptionStatus: plan === 'free' ? null : 'active',
            selectedTherapeuticArea: null,
        }, { merge: true });

        const message = `User ${email} created/updated successfully with plan: ${plan}.`;
        console.log(message);
        return { success: true, message };

    } catch (error: any)
        {
        console.error(`Error creating sample user ${user.email}:`, error);
        return { success: false, message: error.message || 'An unknown error occurred.' };
    }
}
