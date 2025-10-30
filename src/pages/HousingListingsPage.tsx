import React, { useState, useEffect } from 'react';
import { Search, MapPin, Euro, Home, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { useListingStore } from '../stores/useListingStore';
import { ListingCard } from '../components/listing/ListingCard';
import { Link } from 'react-router-dom';

// Cette page consomme désormais les vraies annonces via useListingStore

export const HousingListingsPage: React.FC = () => {
  const { listings, loading, searchListings } = useListingStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    minPrice: '',
    maxPrice: '',
    university: '',
    furnished: '',
  });

  // Charger et appliquer les filtres supportés par le store (catégorie, recherche, prix)
  useEffect(() => {
    const min = filters.minPrice ? parseInt(filters.minPrice, 10) : undefined;
    const max = filters.maxPrice ? parseInt(filters.maxPrice, 10) : undefined;
    searchListings({
      category: 'housing',
      query: searchQuery || undefined,
      minPrice: Number.isFinite(min as number) ? min : undefined,
      maxPrice: Number.isFinite(max as number) ? max : undefined,
      sortBy: 'date',
    });
  }, [searchQuery, filters.minPrice, filters.maxPrice, searchListings]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'studio': return <Home className="w-4 h-4" />;
      case 'appartement': return <Home className="w-4 h-4" />;
      case 'chambre': return <Home className="w-4 h-4" />;
      case 'colocation': return <Users className="w-4 h-4" />;
      default: return <Home className="w-4 h-4" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'studio': return 'bg-blue-100 text-blue-800';
      case 'appartement': return 'bg-green-100 text-green-800';
      case 'chambre': return 'bg-purple-100 text-purple-800';
      case 'colocation': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Breadcrumb
        items={[{ label: 'Accueil', to: '/' }, { label: 'Logements' }]}
        maxItems={3}
        showHome={true}
        showBackButton={true}
      />
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Logements étudiants
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Trouvez le logement parfait près de votre campus
          </p>
        </div>

        {/* Barre de recherche */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Rechercher par ville, université, quartier..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 py-3 text-base sm:text-lg"
            />
          </div>
        </div>

        {/* Filtres */}
        <div className="mb-6 sm:mb-8 grid grid-cols-1 md:grid-cols-5 gap-3 sm:gap-4">
          <Select onValueChange={(value) => handleFilterChange('type', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Type de logement" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="studio">Studio</SelectItem>
              <SelectItem value="appartement">Appartement</SelectItem>
              <SelectItem value="chambre">Chambre</SelectItem>
              <SelectItem value="colocation">Colocation</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="number"
            placeholder="Prix min (€)"
            value={filters.minPrice}
            onChange={(e) => handleFilterChange('minPrice', e.target.value)}
          />

          <Input
            type="number"
            placeholder="Prix max (€)"
            value={filters.maxPrice}
            onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
          />

          <Select onValueChange={(value) => handleFilterChange('university', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Université" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sorbonne">Sorbonne Université</SelectItem>
              <SelectItem value="dauphine">Paris-Dauphine</SelectItem>
              <SelectItem value="assas">Panthéon-Assas</SelectItem>
              <SelectItem value="sciences-po">Sciences Po</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={(value) => handleFilterChange('furnished', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Meublé" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Meublé</SelectItem>
              <SelectItem value="false">Non meublé</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Résultats */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings
              .filter(l => l.category === 'housing')
              .map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
          </div>
        )}

        {/* Message si aucun résultat */}
        {!loading && listings.filter(l => l.category === 'housing').length === 0 && (
          <div className="text-center py-12">
            <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Aucun logement trouvé
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Essayez de modifier vos critères de recherche
            </p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 text-center">
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-2">
                Vous proposez un logement ?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Publiez votre annonce gratuitement et touchez des milliers d'étudiants
              </p>
              <Button size="lg" className="w-full sm:w-auto" asChild>
                <Link to="/create?category=housing" aria-label="Publier une annonce logement">
                  Publier une annonce logement
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

