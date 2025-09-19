
'use server';

import { db } from '@/lib/firebase';
import type { ClinicalTrial, Folder, Pipeline } from '@/lib/types';
import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';

const getFoldersCollection = (userId: string) => {
    return collection(db, 'users', userId, 'folders');
}

const getStudiesCollection = (userId: string, folderId: string) => {
    return collection(db, 'users', userId, 'folders', folderId, 'studies');
}

const getPipelinesCollection = (userId: string, folderId: string) => {
    return collection(db, 'users', userId, 'folders', folderId, 'pipelines');
}


/**
 * Creates a new folder for a user using an auto-generated ID.
 */
export async function createFolder(userId: string, folderName: string): Promise<Folder> {
    try {
        const foldersColRef = getFoldersCollection(userId);
        
        // Use addDoc to create a new document with an auto-generated ID
        const newDocRef = await addDoc(foldersColRef, {
            name: folderName,
            createdAt: serverTimestamp(),
        });
        
        // Fetch the newly created document to get the server-generated timestamp
        const newDocSnap = await getDoc(newDocRef);
        if (!newDocSnap.exists()) {
             throw new Error("Failed to retrieve the created folder immediately after creation.");
        }
        const data = newDocSnap.data();

        console.log(`Successfully created folder "${folderName}" for user ${userId} with ID ${newDocRef.id}`);
        
        // Construct and return the full Folder object
        return { 
            id: newDocRef.id, 
            name: data.name, 
            createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString()
        };
    } catch (error) {
        console.error("Error creating folder in Firestore:", error);
        throw new Error("A database error occurred while creating the folder.");
    }
}

/**
 * Gets all folders for a user, ordered by creation date.
 */
export async function getFolders(userId: string): Promise<Folder[]> {
    try {
        const foldersCol = getFoldersCollection(userId);
        const q = query(foldersCol, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            return [];
        }
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name,
                createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
            };
        });
    } catch (error) {
        console.error("Error fetching folders:", error);
        return [];
    }
}


/**
 * Saves a clinical trial to a specific folder.
 * This function also ensures the folder document itself exists.
 */
export async function saveStudyToFolder(userId: string, folderId: string, study: ClinicalTrial): Promise<void> {
    try {
        // Ensure the folder document exists.
        const folderDocRef = doc(db, 'users', userId, 'folders', folderId);
        await setDoc(folderDocRef, { 
            name: folderId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), // Prettify name from ID
            createdAt: serverTimestamp() 
        }, { merge: true });

        // Save the study to the subcollection
        const studiesCol = getStudiesCollection(userId, folderId);
        await setDoc(doc(studiesCol, study.nctId), {
            ...study,
            savedAt: serverTimestamp(),
        });
        console.log(`Saved study ${study.nctId} to folder ${folderId}`);
    } catch (error) {
        console.error("Error saving study to folder:", error);
        throw new Error("Failed to save study.");
    }
}

/**
 * Saves a pipeline to a specific folder.
 * This function also ensures the folder document itself exists.
 */
export async function savePipelineToFolder(userId: string, folderId: string, pipeline: Pipeline): Promise<void> {
    try {
        // Ensure the folder document exists.
        const folderDocRef = doc(db, 'users', userId, 'folders', folderId);
        await setDoc(folderDocRef, { 
            name: folderId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), // Prettify name from ID
            createdAt: serverTimestamp() 
        }, { merge: true });
        
        // Save the pipeline to the subcollection
        const pipelinesCol = getPipelinesCollection(userId, folderId);
        await setDoc(doc(pipelinesCol, pipeline.id), {
            ...pipeline,
            savedAt: serverTimestamp(),
        });
        console.log(`Saved pipeline ${pipeline.id} to folder ${folderId}`);
    } catch (error) {
        console.error("Error saving pipeline to folder:", error);
        throw new Error("Failed to save pipeline.");
    }
}


/**
 * Gets all studies saved in a specific folder.
 */
export async function getStudiesInFolder(userId: string, folderId: string): Promise<ClinicalTrial[]> {
    try {
        const studiesCol = getStudiesCollection(userId, folderId);
        const q = query(studiesCol, orderBy('savedAt', 'desc'));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            return [];
        }
        return snapshot.docs.map(doc => doc.data() as ClinicalTrial);
    } catch (error) {
        console.error(`Error fetching studies from folder ${folderId}:`, error);
        return [];
    }
}

/**
 * Gets all pipelines saved in a specific folder.
 */
export async function getPipelinesInFolder(userId: string, folderId: string): Promise<Pipeline[]> {
    try {
        const pipelinesCol = getPipelinesCollection(userId, folderId);
        const q = query(pipelinesCol, orderBy('savedAt', 'desc'));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            return [];
        }
        return snapshot.docs.map(doc => doc.data() as Pipeline);
    } catch (error) {
        console.error(`Error fetching pipelines from folder ${folderId}:`, error);
        return [];
    }
}
