
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import type { Pipeline, PipelinePhase, TeamMember, FinancialData } from './types';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCXfqt1t2dsmGoYnbapHtVM8g4ZZbwmNhA",
  authDomain: "pipeline-oq1i42.firebaseapp.com",
  projectId: "pipeline-oq1i42",
  storageBucket: "pipeline-oq1i42.appspot.com",
  messagingSenderId: "195364901049",
  appId: "1:195364901049:web:a4cfb4cdbc3189467b0b68"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };

// Helper to safely convert Firestore Timestamps to ISO strings
function toISOString(date: any): string {
    if (!date) {
        return new Date().toISOString(); 
    }
    if (date?.toDate) {
        return date.toDate().toISOString();
    }
    if (typeof date === 'string') {
        try {
            const d = new Date(date);
            if (isNaN(d.getTime())) {
              return new Date().toISOString();
            }
            return d.toISOString();
        } catch (e) {
             return new Date().toISOString();
        }
    }
    if (date instanceof Date) {
        return date.toISOString();
    }
    return new Date().toISOString(); 
}

/**
 * Translates a Firestore document into a Pipeline object for the application.
 *
 * @param doc A Firestore document snapshot.
 * @returns A Pipeline object.
 *
 * HOW TO MANUALLY MAP YOUR FIELDS:
 * 1. Look at a document in your Firestore 'Pipeline' collection.
 * 2. For each line below (e.g., `drug: data.drug`), replace `data.drug` with `data.YOUR_FIELD_NAME`.
 * 3. For example, if your drug's name is stored in a field called `drugName`, change `drug: data.drug` to `drug: data.drugName`.
 * 4. If a field doesn't exist in your Firestore document, the part after `||` (e.g., `|| 'Untitled Pipeline'`) will be used as a default.
 */
export function docToPipeline(doc: any): Pipeline {
    const data = doc.data() || {};
    
    // Default values for robustness
    const defaultLead: TeamMember = { id: 'unassigned', name: 'Unassigned', avatarUrl: '' };
    const now = new Date();
    
    // This maps the `phases` array from your Firestore doc.
    // Ensure your `phases` field is an array of objects, where each object has fields like `name`, `startDate`, `endDate`, and `resources`.
    const phases = (data.phases || []).map((phase: any): PipelinePhase => ({
        name: phase.name || 'Preclinical',
        startDate: toISOString(phase.startDate),
        endDate: toISOString(phase.endDate),
        resources: phase.resources || [],
    }));

    return {
        // REQUIRED FIELDS - Your app will look best if these are mapped.
        id: doc.id, // This is the document ID, you don't need to change this.
        drug: data.drug || 'Untitled Pipeline',
        status: data.phase || 'Preclinical', // <-- Change `data.status` to your field for the current phase/status.
        progress: data.progress || 0, // <-- Change `data.progress` to your field for completion percentage (a number from 0 to 100).
        startDate: toISOString(data.startDate), // <-- Change `data.startDate` to your field for the pipeline start date.
        endDate: toISOString(data.endDate), // <-- Change `data.endDate` to your field for the estimated end date.
        description: data.description || 'No description available.', // <-- Change `data.description` to your field for the short description.
        therapeuticArea: data.therapeuticArea || 'N/A', // <-- Change `data.therapeuticArea` to your field.
        indication: data.indication || 'N/A', // <-- Change `data.indication` to your field.
        mechanism: data.action || 'N/A', // <-- Change `data.mechanism` to your field for Mechanism of Action.
        company: data.company || 'N/A', // <-- Change `data.company` to your field for the company name.
        phases: phases.length > 0 ? phases : [{ name: 'Preclinical', startDate: toISOString(now), endDate: toISOString(now), resources: [] }], // <-- This handles the phases array mentioned above.

        // OPTIONAL FIELDS - These are for the pipeline detail page. Map as many as you have.
        lead: data.lead || defaultLead, // <-- This expects an object { id, name, avatarUrl }.
        synonyms: data.synonyms || undefined,
        class: data.drugClass || undefined,
        target: data.target || undefined,
        pharmacokinetics: data.pharmacokinetics || undefined,
        biomarkers: data.biomarkers || undefined,
        routes: data.route || undefined,
        deliveryPlatform: data.deliveryPlatform || undefined,
        discontinuationStatus: data.discontinuationStatus || undefined,
        designation: data.designation || undefined,
        primaryEndpoint: data.primaryEndpoint || undefined,
        clinicalResultsSummary: data.clinicalResultsSummary || undefined,
        trialSitesAndEnrollment: data.trialSitesAndEnrollment || undefined,
        clinicalTrialRegistryLinks: data.clinicalTrialRegistryLinks || undefined,
        sponsorType: data.sponsorType || undefined,
        geographicStatus: data.geographicStatus || undefined,
        licensingStatus: data.licensingStatus || undefined,
        licensingDealInfo: data.licensingDealInfo || undefined,
        competitiveLandscape: data.competitiveLandscape || undefined,
        adverseEvents: data.adverseEvents || undefined,
        regulatoryMilestones: data.regulatoryMilestones || undefined,
        priorityDesignation: data.priorityDesignation || undefined,
        patentExpiry: data.patentExpiry || undefined,
        forecastSales: data.forecastSales || undefined,
        launchDate: data.launchDate || undefined,
        commercializationStrategy: data.commercializationStrategy || undefined,
        companyType: data.companyType || undefined,
        tradedAs: data.tradedAs || undefined,
        industry: data.industry || undefined,
        founded: data.founded || undefined,
        founders: data.founders || [],
        headquarters: data.headquarters || undefined,
        keyPeople: data.keyPeople || [],
        products: data.products || [],
        employees: data.employees || undefined,
        website: data.companyWebsite || undefined,
        dateCreated: data.dateCreated ? toISOString(data.dateCreated) : undefined,
        dateUpdated: data.dateUpdated ? toISOString(data.dateUpdated) : undefined,
        createdBy: data.createdBy || undefined,
        updatedBy: data.updatedBy || undefined,
        financials: data.financials || {}, // <-- This expects an object with financial data.
        sourceSummary: data.sourceSummary || undefined, // Added from docToPipeline
    };
}
