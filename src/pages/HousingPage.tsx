import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  Home, 
  Users, 
  Euro, 
  Calendar,
  Filter,
  SortAsc,
  SortDesc,
  Heart,
  Star,
  Shield,
  GraduationCap,
  Building,
  Bed,
  Wifi,
  Car,
  Utensils,
  WashingMachine,
  Tv,
  AirVent,
  Plus,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { useListingStore } from '../stores/useListingStore';
import { ListingCard } from '../components/listing/ListingCard';
import { useAuth } from '../contexts/AuthContext';

interface HousingFilter {
  priceRange: [number, number];
  location: string;
  roomType: string;
  amenities: string[];
  availability: string;
  sortBy: string;
}

const HousingPage: React.FC = () => {
  const { listings, fetchListings, loading } = useListingStore();
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<HousingFilter>({
    priceRange: [0, 2000],
    location: '',
    roomType: '',
    amenities: [],
    availability: '',
    sortBy: 'newest'
  });
  const [showFilters, setShowFilters] = useState(false);

  // Filtrer les annonces de logement
  const housingListings = listings.filter(listing => 
    listing.category === 'housing' &&
    listing.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const amenities = [
    { id: 'wifi', label: 'WiFi', icon: Wifi },
    { id: 'parking', label: 'Parking', icon: Car },
    { id: 'kitchen', label: 'Cuisine équipée', icon: Utensils },
    { id: 'laundry', label: 'Machine à laver', icon: WashingMachine },
    { id: 'tv', label: 'TV', icon: Tv },
    { id: 'ac', label: 'Climatisation', icon: AirVent }
  ];

  const roomTypes = [
    { value: 'studio', label: 'Studio' },
    { value: 'room', label: 'Chambre privée' },
    { value: 'shared-room', label: 'Chambre partagée' },
    { value: 'apartment', label: 'Appartement complet' },
    { value: 'house', label: 'Maison' }
  ];

  const availabilityOptions = [
    { value: 'immediate', label: 'Disponible immédiatement' },
    { value: 'next-month', label: 'Prochain mois' },
    { value: 'flexible', label: 'Date flexible' }
  ];

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleAmenityToggle = (amenityId: string) => {
    setFilters(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter(id => id !== amenityId)
        : [...prev.amenities, amenityId]
    }));
  };

  const handlePriceChange = (value: number[]) => {
    setFilters(prev => ({
      ...prev,
      priceRange: [value[0], value[1]]
    }));
  };

  const clearFilters = () => {
    setFilters({
      priceRange: [0, 2000],
      location: '',
      roomType: '',
      amenities: [],
      availability: '',
      sortBy: 'newest'
    });
    setSearchQuery('');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Logement & Colocation
            </h1>
            <p className="text-muted-foreground mt-2">
              Trouvez votre logement étudiant idéal ou partagez votre espace
            </p>
          </div>
          {currentUser && (
            <Button asChild className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90">
              <Link to="/create?category=housing">
                <Plus className="w-4 h-4 mr-2" />
                Publier un logement
              </Link>
            </Button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative max-w-2xl">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher un logement, une ville, une université..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filtres */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtres
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden"
                >
                  {showFilters ? 'Masquer' : 'Afficher'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className={`space-y-6 ${!showFilters ? 'hidden lg:block' : ''}`}>
              {/* Prix */}
              <div>
                <h3 className="font-semibold mb-3">Prix mensuel</h3>
                <div className="px-2">
                  <Slider
                    value={filters.priceRange}
                    onValueChange={handlePriceChange}
                    max={2000}
                    min={0}
                    step={50}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-2">
                    <span>{filters.priceRange[0]}€</span>
                    <span>{filters.priceRange[1]}€</span>
                  </div>
                </div>
              </div>

              {/* Localisation */}
              <div>
                <h3 className="font-semibold mb-3">Localisation</h3>
                <Input
                  placeholder="Ville, quartier..."
                  value={filters.location}
                  onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>

              {/* Type de chambre */}
              <div>
                <h3 className="font-semibold mb-3">Type de logement</h3>
                <Select value={filters.roomType} onValueChange={(value) => setFilters(prev => ({ ...prev, roomType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    {roomTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Équipements */}
              <div>
                <h3 className="font-semibold mb-3">Équipements</h3>
                <div className="space-y-2">
                  {amenities.map((amenity) => {
                    const Icon = amenity.icon;
                    const isChecked = filters.amenities.includes(amenity.id);
                    return (
                      <div 
                        key={amenity.id} 
                        className={`
                          flex items-center space-x-3 p-3 rounded-lg border-2 transition-all cursor-pointer
                          ${isChecked 
                            ? 'border-primary bg-primary/5 shadow-sm' 
                            : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                          }
                        `}
                        onClick={() => handleAmenityToggle(amenity.id)}
                      >
                        <div className={`
                          w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                          ${isChecked
                            ? 'bg-primary border-primary'
                            : 'border-gray-300 dark:border-gray-600'
                          }
                        `}>
                          {isChecked && (
                            <svg className="w-3 h-3 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                              <path d="M5 13l4 4L19 7"></path>
                            </svg>
                          )}
                        </div>
                        <label htmlFor={amenity.id} className="text-sm flex items-center cursor-pointer flex-1">
                          <Icon className="w-5 h-5 mr-2" />
                          <span className="font-medium">{amenity.label}</span>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Disponibilité */}
              <div>
                <h3 className="font-semibold mb-3">Disponibilité</h3>
                <Select value={filters.availability} onValueChange={(value) => setFilters(prev => ({ ...prev, availability: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les dates" />
                  </SelectTrigger>
                  <SelectContent>
                    {availabilityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tri */}
              <div>
                <h3 className="font-semibold mb-3">Trier par</h3>
                <Select value={filters.sortBy} onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Plus récent</SelectItem>
                    <SelectItem value="price-low">Prix croissant</SelectItem>
                    <SelectItem value="price-high">Prix décroissant</SelectItem>
                    <SelectItem value="popular">Plus populaire</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bouton réinitialiser */}
              <Button variant="outline" onClick={clearFilters} className="w-full">
                Réinitialiser les filtres
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Résultats */}
        <div className="lg:col-span-3">
          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Home className="w-8 h-8 text-primary mr-3" />
                  <div>
                    <p className="text-2xl font-bold">{housingListings.length}</p>
                    <p className="text-sm text-muted-foreground">Logements disponibles</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Users className="w-8 h-8 text-secondary mr-3" />
                  <div>
                    <p className="text-2xl font-bold">
                      {housingListings.filter(l => l.transactionType === 'rent').length}
                    </p>
                    <p className="text-sm text-muted-foreground">Colocations</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Shield className="w-8 h-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold">
                      {housingListings.filter(l => l.user?.isVerified).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Propriétaires vérifiés</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Liste des annonces */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : housingListings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {housingListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Home className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Aucun logement trouvé</h3>
                <p className="text-muted-foreground mb-4">
                  Essayez de modifier vos critères de recherche ou de publier une annonce.
                </p>
                {currentUser && (
                  <Button asChild>
                    <Link to="/create?category=housing">
                      <Plus className="w-4 h-4 mr-2" />
                      Publier un logement
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Section d'aide */}
      <div className="mt-12">
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-semibold mb-3">Conseils pour trouver un logement</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <Shield className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    Privilégiez les propriétaires vérifiés
                  </li>
                  <li className="flex items-start">
                    <MapPin className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    Vérifiez la proximité avec votre université
                  </li>
                  <li className="flex items-start">
                    <Euro className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                    N'oubliez pas les charges et le dépôt de garantie
                  </li>
                  <li className="flex items-start">
                    <Calendar className="w-4 h-4 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                    Planifiez vos visites à l'avance
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3">Besoin d'aide ?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Notre équipe est là pour vous accompagner dans votre recherche de logement.
                </p>
                <div className="space-y-2">
                  <Button variant="outline" asChild className="w-full justify-start">
                    <Link to="/help">
                      <GraduationCap className="w-4 h-4 mr-2" />
                      Guide du logement étudiant
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full justify-start">
                    <Link to="/safety">
                      <Shield className="w-4 h-4 mr-2" />
                      Conseils de sécurité
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HousingPage;

