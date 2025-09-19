
import admin from 'firebase-admin';
import serviceAccount from '@/firebase-service-account.json';

export function getAdminApp() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // Check if the service account has been configured. If not, don't initialize.
  if (serviceAccount.project_id === 'your-project-id') {
     console.warn("Firebase Admin SDK not initialized. Please configure src/firebase-service-account.json");
     // Return a mock or minimal object, or handle appropriately for your app's needs.
     // For this case, throwing an error that can be caught by the action is appropriate.
     throw new Error('Firebase Admin SDK is not configured. Please add your service account key to src/firebase-service-account.json.');
  }

  // Cast the imported JSON to the type expected by admin.credential.cert
  const serviceAccountKey = serviceAccount as admin.ServiceAccount;

  try {
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccountKey),
    });
  } catch (error: any) {
     console.error("Failed to initialize Firebase Admin SDK with Service Account.", error);
     throw new Error(
      'Firebase Admin SDK initialization failed. Please ensure src/firebase-service-account.json is valid.'
    );
  }
}
