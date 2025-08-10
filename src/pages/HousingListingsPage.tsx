import React, { useState, useEffect } from 'react';
import { Search, MapPin, Euro, Home, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface HousingListing {
  id: string;
  title: string;
  description: string;
  price: number;
  type: 'studio' | 'appartement' | 'chambre' | 'colocation';
  location: {
    address: string;
    city: string;
    university: string;
    distance: number; // en km du campus
  };
  features: {
    rooms: number;
    surface: number; // en m²
    furnished: boolean;
    charges: boolean;
  };
  images: string[];
  contact: {
    name: string;
    phone?: string;
    email: string;
  };
  availability: Date;
  createdAt: Date;
}

export const HousingListingsPage: React.FC = () => {
  const [listings, setListings] = useState<HousingListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    minPrice: '',
    maxPrice: '',
    university: '',
    furnished: '',
  });

  // Données d'exemple pour le développement
  const mockListings: HousingListing[] = [
    {
      id: '1',
      title: 'Studio proche Sorbonne',
      description: 'Joli studio meublé à 5min à pied de la Sorbonne. Parfait pour étudiant.',
      price: 650,
      type: 'studio',
      location: {
        address: '12 rue de la Sorbonne',
        city: 'Paris',
        university: 'Sorbonne Université',
        distance: 0.3
      },
      features: {
        rooms: 1,
        surface: 25,
        furnished: true,
        charges: true
      },
      images: ['/api/placeholder/400/300'],
      contact: {
        name: 'Marie D.',
        email: 'marie.d@example.com'
      },
      availability: new Date('2025-02-01'),
      createdAt: new Date()
    },
    {
      id: '2',
      title: 'Chambre en colocation - Dauphine',
      description: 'Chambre dans coloc sympa avec 3 autres étudiants. Cuisine équipée.',
      price: 480,
      type: 'colocation',
      location: {
        address: '45 avenue de Neuilly',
        city: 'Paris',
        university: 'Université Paris-Dauphine',
        distance: 0.8
      },
      features: {
        rooms: 1,
        surface: 15,
        furnished: true,
        charges: true
      },
      images: ['/api/placeholder/400/300'],
      contact: {
        name: 'Thomas L.',
        email: 'thomas.l@example.com'
      },
      availability: new Date('2025-01-20'),
      createdAt: new Date()
    }
  ];

  useEffect(() => {
    const fetchHousings = async () => {
      setLoading(true);
      try {
        // Utiliser la vraie recherche Algolia si disponible, sinon les données mock
        if (searchQuery || Object.keys(filters).length > 0) {
          // Ici vous pouvez importer et utiliser searchHousing d'algoliaConfig
          // const { searchHousing } = await import('../components/ui/algoliaConfig');
          // const results = await searchHousing(searchQuery, filters);
          // setListings(results.hits);
        }
        
        // Pour l'instant, utiliser les données mock
        setTimeout(() => {
          setListings(mockListings);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Erreur recherche logements:', error);
        setLoading(false);
      }
    };

    fetchHousings();
  }, [searchQuery, filters]);

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
      case 'colocation': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="container mx-auto px-4 py-8">
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
              className="pl-10 py-3 text-lg"
            />
          </div>
        </div>

        {/* Filtres */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-5 gap-4">
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
            {listings.map((listing) => (
              <Card key={listing.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <div className="relative">
                  <img
                    src={listing.images[0]}
                    alt={listing.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  <Badge className={`absolute top-3 left-3 ${getTypeBadgeColor(listing.type)}`}>
                    {getTypeIcon(listing.type)}
                    <span className="ml-1 capitalize">{listing.type}</span>
                  </Badge>
                </div>
                
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                    {listing.title}
                  </h3>
                  
                  <div className="flex items-center text-gray-600 dark:text-gray-400 mb-2">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span className="text-sm">
                      {listing.location.city} • {listing.location.distance}km du campus
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center text-primary font-bold text-xl">
                      <Euro className="w-5 h-5 mr-1" />
                      {listing.price}
                      <span className="text-sm font-normal text-gray-500 ml-1">/mois</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {listing.features.surface}m²
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {listing.features.furnished && (
                      <Badge variant="secondary" className="text-xs">Meublé</Badge>
                    )}
                    {listing.features.charges && (
                      <Badge variant="secondary" className="text-xs">Charges comprises</Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      Disponible le {listing.availability.toLocaleDateString('fr-FR')}
                    </span>
                    <Button size="sm">
                      Contacter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Message si aucun résultat */}
        {!loading && listings.length === 0 && (
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
              <Button size="lg">
                Publier une annonce logement
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

