
'use server';

import { db } from '@/lib/firebase';
import { docToPipeline } from '@/lib/firebase';
import { doc, addDoc, updateDoc, deleteDoc, getDoc, collection, serverTimestamp, getDocs } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import type { Pipeline, UserRole } from '@/lib/types';
import { getCurrentUser } from '@/services/auth';

// --- GENERIC CRUD ACTIONS (INTERNAL-ONLY HELPERS) ---

/**
 * Creates a document. This function is now for internal use and permission should be checked by the caller.
 * @param collectionName The name of the Firestore collection.
 * @param data The data for the new document.
 */
async function createDocument(collectionName: string, data: { [key: string]: any }, createdBy: string) {
  const coll = collection(db, collectionName);
  const docRef = await addDoc(coll, {
    ...data,
    dateCreated: serverTimestamp(),
    createdBy: createdBy,
  });
  return docRef.id;
}

/**
 * Updates a document. This function is now for internal use and permission should be checked by the caller.
 * @param collectionName The name of the Firestore collection.
 * @param id The ID of the document to update.
 * @param data The data to update.
 */
async function updateDocument(collectionName: string, id: string, data: { [key: string]: any }, updatedBy: string) {
  const docRef = doc(db, collectionName, id);
  await updateDoc(docRef, {
      ...data,
      dateUpdated: serverTimestamp(),
      updatedBy: updatedBy,
  });
}

/**
 * Deletes a document. This function is now for internal use and permission should be checked by the caller.
 * @param collectionName The name of the Firestore collection.
 * @param id The ID of the document to delete.
 */
async function deleteDocument(collectionName: string, id: string) {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
}


// --- PIPELINE-SPECIFIC ACTIONS (NOW READ-ONLY FOR CLIENTS) ---

/**
 * Creates a new pipeline document in Firestore.
 * This action is now disabled for all client-facing roles.
 */
export async function createPipeline(data: Partial<Pipeline>): Promise<Pipeline> {
    throw new Error('You do not have permission to create pipelines.');
}

/**
 * Updates an existing pipeline document in Firestore.
 * This action is now disabled for all client-facing roles.
 */
export async function updatePipeline(id: string, data: Partial<Pipeline>): Promise<Pipeline> {
    throw new Error('You do not have permission to update pipelines.');
}

/**
 * Deletes a pipeline document from Firestore.
 * This action is now disabled for all client-facing roles.
 */
export async function deletePipeline(id: string): Promise<void> {
  throw new Error('You do not have permission to delete pipelines.');
}


// --- USER MANAGEMENT ACTIONS ---

/**
 * Updates the role of a specific user.
 * Only admins can perform this action.
 * @param userId The ID of the user to update.
 * @param newRole The new role to assign.
 */
export async function updateUserRole(userId: string, newRole: UserRole): Promise<void> {
    const adminUser = await getCurrentUser();
    if (adminUser?.role !== 'admin') {
        throw new Error("You don't have permission to change user roles.");
    }
    if (adminUser.uid === userId) {
        throw new Error("Admins cannot change their own role.");
    }
    
    // Using a direct firestore update instead of the generic helper
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, { role: newRole });

    revalidatePath('/admin/users');
}
