
'use server';

import { db } from '@/lib/firebase';
import type { UserSettings } from '@/lib/types';
import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc, writeBatch } from 'firebase/firestore';
import { getCurrentUser } from './auth';

/**
 * Retrieves the settings for a specific user from Firestore.
 * If no settings exist, it returns a default set of values.
 * @param userId The ID of the user whose settings are to be fetched.
 * @returns A promise that resolves to the user's settings.
 */
export async function getSettings(userId: string): Promise<UserSettings> {
    const settingsDocRef = doc(db, 'users', userId, 'settings', 'profile');
    const user = await getCurrentUser();
    const defaultName = user?.email?.split('@')[0] || 'New User';
    
    try {
        const docSnap = await getDoc(settingsDocRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                name: data.name || defaultName,
                language: data.language || 'en',
                locale: data.locale || 'en-us',
                timezone: data.timezone || 'gmt-5',
                country: data.country || 'USA',
            };
        } else {
            // Return default settings if the document doesn't exist
            return {
                name: defaultName,
                language: 'en',
                locale: 'en-us',
                timezone: 'gmt-5',
                country: 'USA',
            };
        }
    } catch (error) {
        console.error("Error fetching user settings:", error);
        // Return default settings in case of an error
        return {
            name: defaultName,
            language: 'en',
            locale: 'en-us',
            timezone: 'gmt-5',
            country: 'USA',
        };
    }
}

/**
 * Updates the settings for a specific user in Firestore and saves a copy to the history.
 * @param userId The ID of the user whose settings are to be updated.
 * @param settings The new settings object.
 * @returns A promise that resolves when the update is complete.
 */
export async function updateSettings(userId: string, settings: UserSettings): Promise<void> {
    const userDocRef = doc(db, 'users', userId);
    const settingsDocRef = doc(db, 'users', userId, 'settings', 'profile');
    const historyColRef = collection(db, 'users', userId, 'settings', 'profile', 'history');

    try {
        const timestamp = serverTimestamp();

        // Step 1: Ensure the parent user document exists before trying to write to subcollections.
        // This must be a separate operation from the batch.
        await setDoc(userDocRef, { updatedAt: timestamp }, { merge: true });

        // Step 2: Now that we're sure the parent exists, perform the batch write for settings and history.
        const batch = writeBatch(db);

        // Save the current settings to the main document
        batch.set(settingsDocRef, {
            ...settings,
            updatedAt: timestamp,
        }, { merge: true });

        // Add a new entry to the history sub-collection for the audit trail
        const historyDocRef = doc(historyColRef); // Create a new doc reference
        batch.set(historyDocRef, {
            ...settings,
            changedAt: timestamp,
        });
        
        await batch.commit();

        console.log(`Settings updated and history recorded for user ${userId}`);
    } catch (error) {
        console.error("Error updating user settings and creating history record:", error);
        throw new Error("Failed to update settings.");
    }
}
