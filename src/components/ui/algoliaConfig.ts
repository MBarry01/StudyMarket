

  // src/components/ui/algoliaConfig.ts
import { InstantSearch, SearchBox, Hits, Configure } from 'react-instantsearch';

// Configuration Algolia
export const algoliaConfig = {
  // Remplace par tes vraies clés Algolia
  appId: process.env.VITE_ALGOLIA_APP_ID || 'Q3E5Y56YF4',
  searchApiKey: process.env.VITE_ALGOLIA_SEARCH_KEY || 'ff26b6f0fa03bc6384566ea42dfe0ab4',
  adminApiKey: process.env.VITE_ALGOLIA_ADMIN_KEY || 'b77130fd07930d42f1a6284651395b65', // Côté serveur uniquement
  
  // Index names
  indices: {
    housing: 'studymarket_housing',
    jobs: 'studymarket_jobs',
    listings: 'studymarket_listings',
    users: 'studymarket_users'
  }
};

// Attributs pour la recherche Housing
export const housingSearchConfig = {
  searchableAttributes: [
    'title',
    'description',
    'location.address',
    'location.city',
    'location.university',
    'type'
  ],
  attributesForFaceting: [
    'type',
    'location.city',
    'location.university',
    'features.furnished',
    'price'
  ],
  ranking: [
    'typo',
    'geo',
    'words',
    'filters',
    'proximity',
    'attribute',
    'exact',
    'custom'
  ],
  customRanking: [
    'desc(createdAt)',
    'asc(price)',
    'asc(location.distance)'
  ]
};

// Attributs pour la recherche Jobs
export const jobsSearchConfig = {
  searchableAttributes: [
    'title',
    'company',
    'description',
    'requirements.skills',
    'location.city'
  ],
  attributesForFaceting: [
    'type',
    'contract',
    'requirements.level',
    'location.city',
    'location.remote',
    'salary.period'
  ],
  ranking: [
    'typo',
    'geo',
    'words',
    'filters',
    'proximity',
    'attribute',
    'exact',
    'custom'
  ],
  customRanking: [
    'desc(postedAt)',
    'desc(salary.max)'
  ]
};

// Helper pour initialiser un index
export const createSearchIndex = (indexName: string) => {
  if (typeof window === 'undefined') return null;
  
  try {
    const algoliasearch = require('algoliasearch');
    const client = algoliasearch(algoliaConfig.appId, algoliaConfig.searchApiKey);
    return client.initIndex(indexName);
  } catch (error) {
    console.warn('Algolia not configured:', error);
    return null;
  }
};

// Fonction de recherche Housing
export const searchHousing = async (query: string, filters: any = {}) => {
  const index = createSearchIndex(algoliaConfig.indices.housing);
  if (!index) return { hits: [], nbHits: 0 };

  try {
    const searchParams: any = {
      query,
      hitsPerPage: 20,
      facetFilters: []
    };

    // Appliquer les filtres
    if (filters.type) {
      searchParams.facetFilters.push(`type:${filters.type}`);
    }
    if (filters.city) {
      searchParams.facetFilters.push(`location.city:${filters.city}`);
    }
    if (filters.university) {
      searchParams.facetFilters.push(`location.university:${filters.university}`);
    }
    if (filters.furnished) {
      searchParams.facetFilters.push(`features.furnished:${filters.furnished === 'true'}`);
    }

    // Filtres de prix
    if (filters.minPrice || filters.maxPrice) {
      const priceFilter = `price:${filters.minPrice || 0} TO ${filters.maxPrice || 99999}`;
      searchParams.numericFilters = [priceFilter];
    }

    const results = await index.search(query, searchParams);
    return results;
  } catch (error) {
    console.error('Erreur recherche housing:', error);
    return { hits: [], nbHits: 0 };
  }
};

// Fonction de recherche Jobs
export const searchJobs = async (query: string, filters: any = {}) => {
  const index = createSearchIndex(algoliaConfig.indices.jobs);
  if (!index) return { hits: [], nbHits: 0 };

  try {
    const searchParams: any = {
      query,
      hitsPerPage: 20,
      facetFilters: []
    };

    // Appliquer les filtres
    if (filters.type) {
      searchParams.facetFilters.push(`type:${filters.type}`);
    }
    if (filters.contract) {
      searchParams.facetFilters.push(`contract:${filters.contract}`);
    }
    if (filters.level) {
      searchParams.facetFilters.push(`requirements.level:${filters.level}`);
    }
    if (filters.city) {
      searchParams.facetFilters.push(`location.city:${filters.city}`);
    }
    if (filters.remote) {
      searchParams.facetFilters.push(`location.remote:${filters.remote === 'true'}`);
    }

    const results = await index.search(query, searchParams);
    return results;
  } catch (error) {
    console.error('Erreur recherche jobs:', error);
    return { hits: [], nbHits: 0 };
  }
};

// Hook React pour Housing
export const useHousingSearch = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = async (query: string, filters: any = {}) => {
    setLoading(true);
    try {
      const searchResults = await searchHousing(query, filters);
      setResults(searchResults.hits);
    } catch (error) {
      console.error('Erreur search hook:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return { results, loading, search };
};

// Hook React pour Jobs
export const useJobsSearch = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = async (query: string, filters: any = {}) => {
    setLoading(true);
    try {
      const searchResults = await searchJobs(query, filters);
      setResults(searchResults.hits);
    } catch (error) {
      console.error('Erreur search hook:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return { results, loading, search };
};

// Utilitaires pour indexer les données
export const indexHousingData = async (housingData: any[]) => {
  // Fonction pour indexer les données Housing (côté admin)
  // À utiliser avec la clé admin côté serveur
  console.log('Index housing data:', housingData.length, 'items');
};

export const indexJobsData = async (jobsData: any[]) => {
  // Fonction pour indexer les données Jobs (côté admin)
  // À utiliser avec la clé admin côté serveur
  console.log('Index jobs data:', jobsData.length, 'items');
};

export default algoliaConfig;