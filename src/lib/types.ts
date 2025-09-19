export type PipelineStatus = 'Preclinical' | 'Phase 1' | 'Phase 2' | 'Phase 3' | 'Phase 4' | 'Approved';

export interface TeamMember {
  id: string;
  name: string;
  avatarUrl: string;
}

export interface PipelinePhase {
  name: PipelineStatus;
  startDate: string;
  endDate: string;
  resources: TeamMember[];
}

export interface FinancialData {
  revenue?: string;
  operatingIncome?: string;
  netIncome?: string;
  totalAssets?: string;
  totalEquity?: string;
  marketCap?: string;
}

export interface Pipeline {
  id: string;
  drug: string;
  status: PipelineStatus;
  progress: number;
  lead: TeamMember;
  startDate: string;
  endDate: string;
  description: string;
  phases: PipelinePhase[];
  therapeuticArea: string;
  indication: string;
  mechanism: string;
  // Detailed fields
  synonyms?: string;
  class?: string;
  target?: string;
  pharmacokinetics?: string;
  biomarkers?: string;
  routes?: string;
  deliveryPlatform?: string;
  discontinuationStatus?: string;
  designation?: string;
  primaryEndpoint?: string;
  clinicalResultsSummary?: string;
  trialSitesAndEnrollment?: string;
  clinicalTrialRegistryLinks?: string;
  sponsorType?: string;
  geographicStatus?: string;
  licensingStatus?: string;
  licensingDealInfo?: string;
  competitiveLandscape?: string;
  adverseEvents?: string;
  regulatoryMilestones?: string;
  priorityDesignation?: string;
  patentExpiry?: string;
  forecastSales?: string;
  launchDate?: string;
  commercializationStrategy?: string;
  company?: string;
  companyLogoUrl?: string;
  companyType?: string;
  tradedAs?: string;
  industry?: string;
  founded?: string;
  founders?: string[];
  headquarters?: string;
  keyPeople?: string[];
  products?: string[];
  employees?: string;
  website?: string;
  dateCreated?: string;
  dateUpdated?: string;
  createdBy?: string;
  updatedBy?: string;
  financials?: FinancialData;
  sourceSummary?: string; // Added from docToPipeline
}

export interface Outcome {
    type: string | null;
    measure: string | null;
    timeFrame: string | null;
    description: string | null;
    populationDescription?: string | null;
}

export interface ClinicalTrial {
    nctId: string;
    briefTitle: string;
    officialTitle?: string;
    overallStatus: string;
    startDate: string | null;
    completionDate: string | null;
    phase: string | null;
    condition: string | null;
    url: string;
    primaryCompletionDate: string | null;
    enrollmentCount: number | null;
    studyType: string | null;
    leadSponsorName: string | null;
    collaboratorNames: string[] | null;
    locationCountries: string[] | null;
    locationCities: string[] | null;
    locationFacilities: string[] | null;
    eligibilityCriteria: string | null;
    minimumAge: string | null;
    maximumAge: string | null;
    gender: string | null;
    healthyVolunteers: string | null;
    briefSummary: string | null;
    detailedDescription?: string;
    interventionTypes: string[] | null;
    interventionNames: string[] | null;
    outcomes: Outcome[] | null;
    lastUpdatePostDate: string | null;
    whyStopped: string | null;
    hasResults: boolean;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  createdAt: string; // ISO string
  read: boolean;
}

export interface UserSettings {
  name: string;
  language: string;
  locale: string;
  timezone: string;
  country: string;
}

export interface UserSettingsHistory extends UserSettings {
  changedAt: string; // ISO string format
}

export type UserRole = 'admin' | 'editor' | 'viewer';
export type Plan = 'pro' | 'standard' | 'free';


export interface AuthenticatedUser {
  uid: string;
  email: string | null;
  role: UserRole | null;
  plan: Plan | null;
  subscriptionStatus: string | null;
  selectedTherapeuticArea?: string | null;
}
