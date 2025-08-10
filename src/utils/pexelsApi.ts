// Utilitaire pour l'API Pexels
import { useState } from 'react';
import { ENV_CONFIG } from '@/config/env';

export interface PexelsPhoto {
  id: number;
  url: string;
  photographer: string;
  photographer_url: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  alt: string;
}

export interface PexelsResponse {
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
  total_results: number;
  next_page?: string;
}

class PexelsAPI {
  private apiKey: string;
  private baseUrl = 'https://api.pexels.com/v1';

  constructor() {
    this.apiKey = ENV_CONFIG.PEXELS_API_KEY;
  }

  private async makeRequest(endpoint: string): Promise<PexelsResponse | null> {
    if (!this.apiKey) {
      console.warn('Pexels API key not configured');
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Authorization': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Pexels API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur API Pexels:', error);
      return null;
    }
  }

  async searchPhotos(query: string, perPage = 20, page = 1): Promise<PexelsPhoto[]> {
    const endpoint = `/search?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}`;
    const response = await this.makeRequest(endpoint);
    return response?.photos || [];
  }

  async getCuratedPhotos(perPage = 20, page = 1): Promise<PexelsPhoto[]> {
    const endpoint = `/curated?per_page=${perPage}&page=${page}`;
    const response = await this.makeRequest(endpoint);
    return response?.photos || [];
  }

  async getPhoto(id: number): Promise<PexelsPhoto | null> {
    const endpoint = `/photos/${id}`;
    const response = await this.makeRequest(endpoint);
    return response as PexelsPhoto | null;
  }

  // Obtenir des images par catégorie pour les annonces
  async getImagesByCategory(category: string): Promise<PexelsPhoto[]> {
    const categoryQueries: Record<string, string> = {
      'livres': 'books study',
      'meubles': 'furniture room',
      'electronique': 'electronics laptop',
      'vetements': 'clothes fashion',
      'sport': 'sports equipment',
      'maison': 'home decoration',
      'transport': 'bicycle car transport',
      'logement': 'apartment room housing',
      'emploi': 'office work business',
      'services': 'services help',
      'default': 'university student life'
    };

    const query = categoryQueries[category] || categoryQueries.default;
    return this.searchPhotos(query, 10);
  }
}

export const pexelsApi = new PexelsAPI();

// Hook React pour utiliser Pexels
export const usePexelsSearch = () => {
  const [photos, setPhotos] = useState<PexelsPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchPhotos = async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const results = await pexelsApi.searchPhotos(query);
      setPhotos(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de recherche');
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  const getImagesByCategory = async (category: string) => {
    setLoading(true);
    setError(null);
    try {
      const results = await pexelsApi.getImagesByCategory(category);
      setPhotos(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de recherche');
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    photos,
    loading,
    error,
    searchPhotos,
    getImagesByCategory
  };
};

// Fallback images statiques en cas d'échec API Pexels
export const getFallbackImage = (category: string): string => {
  const fallbackImages: Record<string, string> = {
    'livres': 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=800',
    'meubles': 'https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg?auto=compress&cs=tinysrgb&w=800',
    'electronique': 'https://images.pexels.com/photos/205421/pexels-photo-205421.jpeg?auto=compress&cs=tinysrgb&w=800',
    'transport': 'https://images.pexels.com/photos/100582/pexels-photo-100582.jpeg?auto=compress&cs=tinysrgb&w=800',
    'logement': 'https://images.pexels.com/photos/1029757/pexels-photo-1029757.jpeg?auto=compress&cs=tinysrgb&w=800',
    'emploi': 'https://images.pexels.com/photos/4050315/pexels-photo-4050315.jpeg?auto=compress&cs=tinysrgb&w=800',
    'default': 'https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=800'
  };

  return fallbackImages[category] || fallbackImages.default;
};
