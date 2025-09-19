
'use server';

import { z } from 'zod';
import { fetchAndSummarizeUrl, SummarizeUrlInput } from '@/ai/flows/summarize-publication';
import { suggestExperiments, SuggestExperimentsInput } from '@/ai/flows/suggest-experiments';
import { revalidatePath } from 'next/cache';
import { createFolder, getFolders, getStudiesInFolder, saveStudyToFolder, savePipelineToFolder, getPipelinesInFolder } from '@/services/folders';
import type { ClinicalTrial, Folder, UserSettings, Pipeline } from '@/lib/types';
import { updateSettings } from '@/services/settings';
import { createAdminUser, getCurrentUser, selectTherapeuticArea as selectTherapeuticAreaForUser } from '@/services/auth';
import Stripe from 'stripe';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getAdminApp } from '@/lib/firebase-admin';
import { auth as adminAuth } from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';


const SummarizeSchema = z.object({
  publicationUrl: z.string().url('Please enter a valid URL.'),
  projectDescription: z.string().optional(),
});

const SuggestSchema = z.object({
  projectState: z.string().min(20, 'Project state must be at least 20 characters.'),
  relevantLiterature: z.string().min(50, 'Relevant literature must be at least 50 characters.'),
});

const CreateFolderSchema = z.object({
    folderName: z.string().min(1, "Folder name cannot be empty."),
});

const SettingsSchema = z.object({
    name: z.string().min(1, "Name is required.").max(250, "Name must be less than 250 characters."),
    language: z.string(),
    locale: z.string(),
    timezone: z.string(),
    country: z.string(),
});

const SignupSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});


export async function handleSignup(prevState: any, formData: FormData) {
  const validatedFields = SignupSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Invalid form data.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { email, password, firstName, lastName } = validatedFields.data;
  const fullName = `${firstName} ${lastName}`;

  try {
    // Ensure Firebase Admin is initialized and get Admin Firestore
    getAdminApp();
    const adminDb = getFirestore();

    const userRecord = await adminAuth().createUser({
      email,
      password,
      displayName: fullName,
      emailVerified: true, // For simplicity in this app
      disabled: false,
    });

    // Create a corresponding user document in Firestore (Admin SDK)
    const userDocRef = adminDb.doc(`users/${userRecord.uid}`);
    await userDocRef.set({
      email: userRecord.email,
      role: 'viewer', // Default role
      plan: 'free', // Default plan
      subscriptionStatus: null,
      selectedTherapeuticArea: null,
    });
    
    // Also create initial settings for the user (Admin SDK)
    const settingsDocRef = adminDb.doc(`users/${userRecord.uid}/settings/profile`);
    await settingsDocRef.set({
      name: fullName,
      language: 'en',
      locale: 'en-us',
      timezone: 'gmt-5',
      country: 'USA',
    });


    console.log(`Successfully created new user: ${userRecord.uid}`);
    return { success: true, message: `Account created for ${email}. Redirecting...` };
  } catch (error: any) {
    console.error('Error creating user:', error);
    if (error?.code === 'auth/email-already-exists') {
      return { success: false, message: 'This email address is already in use.' };
    }
    const message = typeof error?.message === 'string' ? error.message : 'An unknown error occurred. Please try again.';
    return { success: false, message };
  }
}

export async function handleSummarizePublication(prevState: any, formData: FormData) {
  const validatedFields = SummarizeSchema.safeParse({
    publicationUrl: formData.get('publicationUrl'),
    projectDescription: formData.get('projectDescription'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Invalid form data.',
      errors: validatedFields.error.flatten().fieldErrors,
      data: null,
    };
  }
  
  try {
    const result = await fetchAndSummarizeUrl(validatedFields.data as SummarizeUrlInput);
    return { message: 'Success', errors: null, data: result };
  } catch (error) {
    console.error(error);
    return { message: 'An AI error occurred while fetching or summarizing the URL.', errors: null, data: null };
  }
}

export async function handleSuggestExperiments(prevState: any, formData: FormData) {
  const user = await getCurrentUser();
  if (user?.plan !== 'pro') {
    return {
      message: 'This is a Pro feature. Please upgrade your plan to suggest experiments.',
      errors: null,
      data: null,
    };
  }

  const validatedFields = SuggestSchema.safeParse({
    projectState: formData.get('projectState'),
    relevantLiterature: formData.get('relevantLiterature'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Invalid form data.',
      errors: validatedFields.error.flatten().fieldErrors,
      data: null,
    };
  }

  try {
    const result = await suggestExperiments(validatedFields.data as SuggestExperimentsInput);
    return { message: 'Success', errors: null, data: result };
  } catch (error) {
    console.error(error);
    return { message: 'An AI error occurred.', errors: null, data: null };
  }
}

// Folder Actions
export async function handleGetFolders() {
    const user = await getCurrentUser();
    if (!user) return [];
    return await getFolders(user.uid);
}

export async function handleCreateFolder(prevState: any, formData: FormData) {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: "You must be logged in to create a folder." };
    
    const validatedFields = CreateFolderSchema.safeParse({
        folderName: formData.get('folderName'),
    });

    if (!validatedFields.success) {
        return { 
            success: false, 
            message: validatedFields.error.flatten().fieldErrors.folderName?.[0] || 'Invalid folder name.' 
        };
    }

    try {
        const newFolder = await createFolder(user.uid, validatedFields.data.folderName);
        revalidatePath('/profile/folders');
        return { 
            success: true, 
            message: `Folder "${validatedFields.data.folderName}" created.`, 
            folder: newFolder 
        };
    } catch (error: any) {
        console.error('Failed to create folder:', error);
        return { 
            success: false, 
            message: error.message || 'An unknown error occurred while creating the folder.' 
        };
    }
}

export async function handleSaveStudyToFolders(study: ClinicalTrial, folderIds: string[]) {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: "You must be logged in." };
    try {
        await Promise.all(folderIds.map(folderId => saveStudyToFolder(user.uid, folderId, study)));
        revalidatePath('/profile/folders/[id]', 'page');
        return { success: true, message: `Study saved to ${folderIds.length} folder(s).` };
    } catch (error) {
        console.error('Failed to save study to folder:', error);
        return { success: false, message: 'Failed to save study.' };
    }
}

export async function handleSavePipelinesToFolders(pipelines: Pipeline[], folderIds: string[]) {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: "You must be logged in." };
    try {
        await Promise.all(
            folderIds.map(folderId => 
                Promise.all(pipelines.map(pipeline => savePipelineToFolder(user.uid, folderId, pipeline)))
            )
        );
        revalidatePath('/profile/folders/[id]', 'page');
        return { success: true, message: `Saved ${pipelines.length} pipeline(s) to ${folderIds.length} folder(s).` };
    } catch (error: any) {
        console.error('Failed to save pipelines to folder:', error);
        return { success: false, message: 'Failed to save pipelines.' };
    }
}


export async function handleGetStudiesInFolder(folderId: string) {
    const user = await getCurrentUser();
    if (!user) return [];
    return await getStudiesInFolder(user.uid, folderId);
}

export async function handleGetPipelinesInFolder(folderId: string) {
    const user = await getCurrentUser();
    if (!user) return [];
    return await getPipelinesInFolder(user.uid, folderId);
}

export async function handleUpdateSettings(prevState: any, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "You must be logged in." };

  const validatedFields = SettingsSchema.safeParse({
    name: formData.get('name'),
    language: formData.get('language'),
    locale: formData.get('locale'),
    timezone: formData.get('timezone'),
    country: formData.get('country'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Invalid form data.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    await updateSettings(user.uid, validatedFields.data as UserSettings);
    revalidatePath('/settings');
    revalidatePath('/profile');
    return { success: true, message: 'Settings saved successfully.' };
  } catch (error) {
    console.error('Failed to save settings:', error);
    return { success: false, message: 'An unknown error occurred while saving settings.' };
  }
}

export async function handleCreateAdminUser(prevState: any, formData: FormData) {
    try {
        const newUser = await createAdminUser();
        return { success: true, message: `Admin user ${newUser.email} created successfully.` };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function createCheckoutSession(priceId: string) {
  if (!priceId) {
    throw new Error('Price ID is missing.');
  }

  const user = await getCurrentUser();
  if (!user) {
    throw new Error('You must be logged in to subscribe.');
  }
  
  if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Server configuration error: Stripe secret key is not set.');
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20',
  });
  
  const headersList = headers();
  const origin = headersList.get('origin');
  
  if(!origin) {
      throw new Error('Could not determine request origin.');
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    subscription_data: {
      trial_period_days: 7, // All plans start with a 7-day free trial
    },
    allow_promotion_codes: true,
    // The `client_reference_id` is used to associate the checkout session with your user
    client_reference_id: user.uid,
    // Pass customer email to pre-fill checkout or link to existing Stripe customer
    customer_email: user.email || undefined,
    success_url: `${origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing`,
  });
  
  if (session.url) {
    redirect(session.url);
  } else {
      throw new Error("Could not create Stripe checkout session.");
  }
}

export async function selectTherapeuticArea(therapeuticArea: string) {
    const user = await getCurrentUser();
    if (!user) {
        throw new Error("You must be logged in to perform this action.");
    }
    if (user.plan !== 'standard' || user.selectedTherapeuticArea) {
        throw new Error("This action is not available for your current plan or you have already selected an area.");
    }
    try {
        await selectTherapeuticAreaForUser(user.uid, therapeuticArea);
        revalidatePath('/pipeline'); // Revalidate the pipeline page to reflect the changes
        return { success: true, message: `Successfully selected ${therapeuticArea}.` };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

    