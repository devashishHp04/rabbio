
import { db, docToPipeline } from '@/lib/firebase';
import type { Pipeline, AuthenticatedUser } from '@/lib/types';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';

// Normalizes company names to ensure consistent matching.
function normalizeCompanyName(name: string): string {
    if (!name || typeof name !== 'string') return '';
    
    let normalized = name.toLowerCase();
    
    // List of common suffixes to remove. Order can be important.
    const suffixes = [
        // Other Countries
        'pvt ltd', 'pty ltd', 'kk', 'co., ltd.', 's.a.', 'eurl', 'ooo',
        // EU
        ' se', ' ag', ' bv', ' nv', ' sas', ' sarl',
        ' s.p.a.', ' s.r.l.', ' ab', ' oy', ' as', ' a/s', ' gmbh',
        // UK
        ' ltd by guarantee', ' cic', ' plc', ' ltd.', ' ltd',
        // US
        ' holdings, inc.', ', inc.', ' inc.', ' inc', ' holdings',
        ', ltd.', ', co.', ' co.',
        ' llc', ' corp.', ' corp', ' lp', ' llp',
        ' pc', ' pllc', ' s corp', ' c corp'
    ];
    
    suffixes.forEach(suffix => {
        if (normalized.endsWith(suffix)) {
            normalized = normalized.slice(0, -suffix.length);
        }
    });

    // Remove remaining punctuation and extra spaces
    normalized = normalized.replace(/[.,]/g, ' ');
    normalized = normalized.replace(/\s+/g, ' ').trim();
    
    return normalized;
}


// Fetch all companies and create a map of company name to country and logo URL.
async function getCompaniesData(): Promise<Map<string, { country: string, logoUrl?: string }>> {
  const companiesMap = new Map<string, { country: string, logoUrl?: string }>();
  try {
    const querySnapshot = await getDocs(collection(db, 'parallelGPT'));
    querySnapshot.forEach(doc => {
      const data = doc.data();
      const companyName = data.companyName;
      if (companyName && typeof companyName === 'string') {
        const country = data.country || 'Unknown';
        
        let logoUrl: string | undefined = undefined;
        // Check for the nested logo structure
        if (Array.isArray(data.logo) && data.logo.length > 0 && data.logo[0].downloadURL) {
            logoUrl = data.logo[0].downloadURL;
        }

        // Use the normalized name as the key
        companiesMap.set(normalizeCompanyName(companyName), { country, logoUrl });
      }
    });
    return companiesMap;
  } catch (error) {
    console.error("Error fetching companies from Firestore:", error);
    return companiesMap; // Return empty map on error
  }
}

// Fetch all pipelines from Firestore and enrich them with company country and logo data.
export async function getPipelines(user: AuthenticatedUser | null): Promise<Pipeline[]> {
  try {
    const companiesMap = await getCompaniesData();
    let q = query(collection(db, 'Pipeline'));

    // If the user is on the standard plan and has selected a therapeutic area, filter by it.
    if (user?.plan === 'standard' && user.selectedTherapeuticArea) {
        q = query(collection(db, 'Pipeline'), where('therapeuticArea', '==', user.selectedTherapeuticArea));
    }
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('No documents found in the "Pipeline" collection for the given filter.');
      return [];
    }
    
    const pipelines = querySnapshot.docs.map(doc => {
      const pipeline = docToPipeline(doc);
      if (pipeline.company) {
        // Use the normalized name for lookup
        const companyData = companiesMap.get(normalizeCompanyName(pipeline.company));
        if (companyData) {
          pipeline.headquarters = companyData.country;
          pipeline.companyLogoUrl = companyData.logoUrl;
        }
      }
      return pipeline;
    });

    // If user is NOT pro and has NOT selected an area, we still return all pipelines for the selection UI.
    // The filtering on the page will be limited by the UI in that case.
    console.log(`Fetched and mapped ${pipelines.length} pipelines from Firestore.`);
    return pipelines;
  } catch (error) {
    console.error("Error fetching pipelines from Firestore:", error);
    return [];
  }
}

// Fetch a single pipeline by its ID from Firestore and enrich it with company country and logo data.
export async function getPipeline(id: string): Promise<Pipeline | null> {
  try {
    const docRef = doc(db, 'Pipeline', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const pipeline = docToPipeline(docSnap);
      
      // Enrich with company country and logo data
      if (pipeline.company) {
          const companiesMap = await getCompaniesData();
          // Use the normalized name for lookup
          const companyData = companiesMap.get(normalizeCompanyName(pipeline.company));
          if (companyData) {
              pipeline.headquarters = companyData.country;
              pipeline.companyLogoUrl = companyData.logoUrl;
          }
      }

      console.log(`Fetched pipeline with ID: ${id}`);
      return pipeline;
    } else {
      console.warn(`No pipeline found with ID: ${id}`);
      return null;
    }
  } catch (error) {
     console.error(`Error fetching pipeline with ID ${id}:`, error);
     return null;
  }
}
