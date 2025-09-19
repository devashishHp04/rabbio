// src/services/clinical-trials.ts
import type { ClinicalTrial, Outcome } from '@/lib/types';
import { extractDisease } from '@/ai/flows/extract-disease';


/**
 * Searches the clinicaltrials.gov API for studies matching a given query, handling pagination to fetch all results.
 * @param query The search term (e.g., a drug name or condition).
 * @returns A promise that resolves to an array of all found ClinicalTrial objects.
 */
export async function searchClinicalTrials(query: string): Promise<ClinicalTrial[]> {
    const baseUrl = 'https://clinicaltrials.gov/api/v2/studies';
    const fields = [
        'NCTId', 'BriefTitle', 'OfficialTitle', 'Condition', 'Phase', 
        'OverallStatus', 'StartDate', 'CompletionDate', 'PrimaryCompletionDate', 
        'EnrollmentCount', 'StudyType', 'LeadSponsorName', 'CollaboratorName', 
        'LocationCountry', 'LocationCity', 'LocationFacility', 'EligibilityCriteria', 
        'MinimumAge', 'MaximumAge', 'Gender', 'HealthyVolunteers', 'BriefSummary', 
        'DetailedDescription', 'InterventionType', 'InterventionName', 
        'LastUpdatePostDate', 'WhyStopped', 'PrimaryOutcome', 'SecondaryOutcome',
        'HasResults'
    ].join(',');
    
    const pageSize = 1000;

    let allStudies: any[] = [];
    let nextPageToken: string | undefined = undefined;

    try {
        do {
            const url = new URL(baseUrl);
            url.searchParams.set('format', 'json');
            url.searchParams.set('query.term', query);
            url.searchParams.set('fields', fields);
            url.searchParams.set('pageSize', String(pageSize));

            if (nextPageToken) {
                url.searchParams.set('pageToken', nextPageToken);
            }
            
            console.log(`Fetching from URL: ${url.toString()}`);
            const response = await fetch(url.toString(), { headers: { 'Accept': 'application/json' } });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`API call failed with status: ${response.status}`, errorBody);
                let rawData;
                try {
                  // If the error response is JSON, parse it.
                  rawData = JSON.parse(errorBody);
                } catch {
                  // If it's not JSON (e.g., HTML), return the raw text.
                  rawData = { message: `API returned non-JSON error: ${errorBody}` };
                }
                const error: any = new Error(`API call failed with status: ${response.status}`);
                error.rawData = rawData;
                throw error;
            }
            
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                 const pageData = await response.json();
                 if (pageData?.studies && Array.isArray(pageData.studies)) {
                    allStudies = allStudies.concat(pageData.studies);
                 }
                 nextPageToken = pageData.nextPageToken;
            } else {
                const errorText = await response.text();
                console.error("Received non-JSON response from API:", errorText);
                throw new Error("The ClinicalTrials.gov API returned an unexpected response.");
            }

        } while (nextPageToken);
        
        console.log(`Total studies fetched after pagination: ${allStudies.length}`);

        const processedStudies = await Promise.all(allStudies.map(async (study: any): Promise<ClinicalTrial> => {
            const protocolSection = study.protocolSection || {};
            const resultsSection = study.resultsSection;
            
            const idModule = protocolSection.identificationModule || {};
            const statusModule = protocolSection.statusModule || {};
            const conditionsModule = protocolSection.conditionsModule || {};
            const designModule = protocolSection.designModule || {};
            const contactsLocationsModule = protocolSection.contactsLocationsModule || {};
            const sponsorCollaboratorsModule = protocolSection.sponsorCollaboratorsModule || {};
            const eligibilityModule = protocolSection.eligibilityModule || {};
            const descriptionModule = protocolSection.descriptionModule || {};
            const armsInterventionsModule = protocolSection.armsInterventionsModule || {};
            const outcomesModule = protocolSection.outcomesModule || {};

            const nctId = idModule.nctId || 'N/A';
            const uniqueInterventionTypes = [...new Set(armsInterventionsModule.interventions?.map((i: any) => i.type).filter(Boolean) || [])];
            const uniqueInterventionNames = [...new Set(armsInterventionsModule.interventions?.map((i: any) => i.name).filter(Boolean) || [])];
            
             const primaryOutcomes: Outcome[] = (outcomesModule.primaryOutcomes || []).map((o: any) => ({ ...o, type: 'Primary' }));
             const secondaryOutcomes: Outcome[] = (outcomesModule.secondaryOutcomes || []).map((o: any) => ({ ...o, type: 'Secondary' }));
             const allOutcomes = [...primaryOutcomes, ...secondaryOutcomes];
            
             const rawCondition = conditionsModule.conditions?.join(', ') || 'N/A';
             const briefTitle = idModule.briefTitle || '';
             const briefSummary = descriptionModule.briefSummary || '';
             let formattedCondition = rawCondition;
             try {
                if (rawCondition !== 'N/A') {
                    const result = await extractDisease({ 
                        conditionText: rawCondition,
                        briefTitle: briefTitle,
                        briefSummary: briefSummary
                    });
                    if (result.diseaseName) {
                        formattedCondition = result.diseaseName;
                    }
                }
             } catch (e) {
                console.error("Failed to extract disease name for:", rawCondition, e);
                formattedCondition = rawCondition;
             }

            return {
                nctId: nctId,
                briefTitle: briefTitle,
                officialTitle: idModule.officialTitle,
                overallStatus: statusModule.overallStatus || 'N/A',
                startDate: statusModule.startDateStruct?.date || null,
                completionDate: statusModule.completionDateStruct?.date || null,
                phase: designModule.phases?.join(', ') || 'N/A',
                condition: formattedCondition,
                url: `https://clinicaltrials.gov/study/${nctId}`,
                
                primaryCompletionDate: statusModule.primaryCompletionDateStruct?.date || null,
                enrollmentCount: designModule.enrollmentInfo?.count || null,
                studyType: designModule.studyType || null,
                leadSponsorName: sponsorCollaboratorsModule.leadSponsor?.name || null,
                collaboratorNames: sponsorCollaboratorsModule.collaborators?.map((c: any) => c.name) || null,
                locationCountries: contactsLocationsModule.locations?.map((l: any) => l.country) || null,
                locationCities: contactsLocationsModule.locations?.map((l: any) => l.city) || null,
                locationFacilities: contactsLocationsModule.locations?.map((l: any) => l.facility) || null,
                eligibilityCriteria: eligibilityModule.eligibilityCriteria || null,
                minimumAge: eligibilityModule.minimumAge || null,
                maximumAge: eligibilityModule.maximumAge || null,
                gender: eligibilityModule.gender || null,
                healthyVolunteers: eligibilityModule.healthyVolunteers || null,
                briefSummary: briefSummary,
                detailedDescription: descriptionModule.detailedDescription,
                interventionTypes: uniqueInterventionTypes.length > 0 ? uniqueInterventionTypes : null,
                interventionNames: uniqueInterventionNames.length > 0 ? uniqueInterventionNames : null,
                outcomes: allOutcomes.length > 0 ? allOutcomes : null,
                lastUpdatePostDate: statusModule.lastUpdatePostDateStruct?.date || null,
                whyStopped: statusModule.whyStopped || null,
                hasResults: !!resultsSection,
            };
        }));
        
        return processedStudies;

    } catch (error: any) {
        console.error('Error fetching or parsing from clinicaltrials.gov API:', error.message);
        if (error.rawData) {
            throw error;
        }
        const customError: any = new Error('Failed to fetch or parse data from ClinicalTrials.gov API.');
        throw customError;
    }
}
