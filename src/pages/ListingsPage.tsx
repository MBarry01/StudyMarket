import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, Grid, List, SlidersHorizontal, Smartphone, Car, Home, Shirt, Gamepad2, Baby, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useListingStore } from '../stores/useListingStore';
import { ListingCard } from '../components/listing/ListingCard';
import { SearchFilters } from '../types';

const categories = [
  { value: 'all', label: 'Toutes catégories', icon: null },
  { value: 'electronics', label: 'Électronique', icon: Smartphone },
  { value: 'vehicles', label: 'Véhicules', icon: Car },
  { value: 'real-estate', label: 'Immobilier', icon: Home },
  { value: 'fashion', label: 'Mode', icon: Shirt },
  { value: 'gaming', label: 'Jeux & Jouets', icon: Gamepad2 },
  { value: 'baby', label: 'Bébé & Enfant', icon: Baby },
  { value: 'business', label: 'Équipement Pro', icon: Briefcase },
];

const conditions = [
  { value: 'new', label: 'Neuf' },
  { value: 'like-new', label: 'Comme neuf' },
  { value: 'good', label: 'Bon état' },
  { value: 'fair', label: 'État correct' },
  { value: 'poor', label: 'Mauvais état' },
];

const sortOptions = [
  { value: 'relevance', label: 'Pertinence' },
  { value: 'date', label: 'Plus récent' },
  { value: 'price-asc', label: 'Prix croissant' },
  { value: 'price-desc', label: 'Prix décroissant' },
];

export const ListingsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { listings, loading, hasMore, fetchListings, searchListings } = useListingStore();
  
  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams.get('q') || '',
    category: searchParams.get('category') || '',
    sortBy: 'date',
  });
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const initialFilters: SearchFilters = {
      query: searchParams.get('q') || '',
      category: searchParams.get('category') || '',
      sortBy: 'date',
    };
    
    setFilters(initialFilters);
    searchListings(initialFilters);
  }, [searchParams, searchListings]);

  const handleSearch = () => {
    const newFilters = { ...filters };
    searchListings(newFilters);
    
    // Update URL params
    const params = new URLSearchParams();
    if (newFilters.query) params.set('q', newFilters.query);
    if (newFilters.category) params.set('category', newFilters.category);
    setSearchParams(params);
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const loadMore = () => {
    fetchListings(filters, false);
  };

  const clearFilters = () => {
    const clearedFilters: SearchFilters = {
      query: '',
      sortBy: 'date',
    };
    setFilters(clearedFilters);
    searchListings(clearedFilters);
    setSearchParams({});
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Toutes les annonces</h1>
        
        {/* Search Bar */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher des articles..."
              value={filters.query || ''}
              onChange={(e) => handleFilterChange('query', e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleSearch} className="whitespace-nowrap">
              <Search className="w-4 h-4 mr-2" />
              Rechercher
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtres
            </Button>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.slice(1, 6).map((category) => {
            const IconComponent = category.icon;
            return (
              <Button
                key={category.value}
                variant={filters.category === category.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('category', 
                  filters.category === category.value ? '' : category.value
                )}
                className="flex items-center gap-2"
              >
                {IconComponent && <IconComponent className="w-4 h-4" />}
                {category.label}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className={`lg:w-80 space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Filtres</span>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Effacer
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Category */}
              <div>
                <label className="text-sm font-medium mb-2 block">Catégorie</label>
                <Select
                  value={filters.category || 'all'}
                  onValueChange={(value) => handleFilterChange('category', value === 'all' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => {
                      const IconComponent = category.icon;
                      return (
                        <SelectItem key={category.value} value={category.value}>
                          <div className="flex items-center gap-2">
                            {IconComponent && <IconComponent className="w-4 h-4" />}
                            {category.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range */}
              <div>
                <label className="text-sm font-medium mb-2 block">Prix</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice || ''}
                    onChange={(e) => handleFilterChange('minPrice', 
                      e.target.value ? parseInt(e.target.value) : undefined
                    )}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice || ''}
                    onChange={(e) => handleFilterChange('maxPrice', 
                      e.target.value ? parseInt(e.target.value) : undefined
                    )}
                  />
                </div>
              </div>

              {/* Condition */}
              <div>
                <label className="text-sm font-medium mb-2 block">État</label>
                <div className="space-y-2">
                  {conditions.map((condition) => (
                    <label key={condition.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={filters.condition?.includes(condition.value) || false}
                        onChange={(e) => {
                          const current = filters.condition || [];
                          const newConditions = e.target.checked
                            ? [...current, condition.value]
                            : current.filter(c => c !== condition.value);
                          handleFilterChange('condition', newConditions.length > 0 ? newConditions : undefined);
                        }}
                        className="rounded border-border"
                      />
                      <span className="text-sm">{condition.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button onClick={handleSearch} className="w-full">
                Appliquer les filtres
              </Button>
            </CardContent>
          </Card>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">
                {listings.length} résultat(s)
              </span>
              
              {(filters.query || filters.category || filters.minPrice || filters.maxPrice) && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Filtres actifs:</span>
                  {filters.query && (
                    <Badge variant="secondary">
                      "{filters.query}"
                    </Badge>
                  )}
                  {filters.category && (
                    <Badge variant="secondary">
                      {categories.find(c => c.value === filters.category)?.label}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Sort */}
              <Select
                value={filters.sortBy || 'date'}
                onValueChange={(value) => handleFilterChange('sortBy', value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Separator orientation="vertical" className="h-6" />

              {/* View Mode avec icônes uniquement */}
              <div className="flex border rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className="rounded-none w-15 h-15"
                  title="Vue en grille"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                  className="rounded-none w-15 h-15"
                  title="Vue en liste"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Results */}
          {loading && listings.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="aspect-[4/3] bg-muted" />
                  <CardContent className="p-4 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : listings.length > 0 ? (
            <>
              <div className={`grid gap-8 justify-items-center ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                  : 'grid-cols-1'
              }`}>
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="text-center mt-8">
                  <Button 
                    onClick={loadMore} 
                    disabled={loading}
                    variant="outline"
                    size="lg"
                  >
                    {loading ? 'Chargement...' : 'Charger plus'}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2">Aucun résultat trouvé</h3>
              <p className="text-muted-foreground mb-4">
                Essayez de modifier vos critères de recherche
              </p>
              <Button onClick={clearFilters} variant="outline">
                Effacer les filtres
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};