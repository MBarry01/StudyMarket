import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Heart, 
  Search, 
  Filter, 
  Grid, 
  List,
  Trash2,
  ExternalLink,
  Calendar,
  Euro,
  MapPin,
  User,
  Package,
  BookOpen,
  Smartphone,
  Home,
  Shirt,
  Users,
  Briefcase,
  Gift,
  RefreshCw,
  Star,
  Eye,
  Share2,
  Download,
  SortAsc,
  SortDesc,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Bookmark,
  Archive,
  Tag,
  Zap
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  addDoc,
  deleteDoc,
  updateDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Listing } from '../types';
import { ListingCard } from '../components/listing/ListingCard';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

// Types pour les favoris
interface Favorite {
  id: string;
  userId: string;
  listingId: string;
  listingTitle: string;
  listingPrice: number;
  listingImage?: string;
  listingCategory: string;
  listingTransactionType: string;
  sellerName: string;
  sellerUniversity: string;
  notes?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface FavoriteStats {
  totalFavorites: number;
  byCategory: Record<string, number>;
  byTransactionType: Record<string, number>;
  averagePrice: number;
  recentlyAdded: number;
  availableCount: number;
  soldCount: number;
}

// Helper function to safely convert dates
const safeToDate = (date: any): Date => {
  if (!date) return new Date();
  
  if (date instanceof Date) return date;
  
  if (date && typeof date.toDate === 'function') {
    try {
      return date.toDate();
    } catch (error) {
      return new Date();
    }
  }
  
  if (typeof date === 'string' || typeof date === 'number') {
    const parsedDate = new Date(date);
    return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  }
  
  if (date && typeof date === 'object' && date.seconds) {
    return new Date(date.seconds * 1000);
  }
  
  return new Date();
};

// Catégories avec icônes
const categories = [
  { value: 'all', label: 'Toutes catégories', icon: Package },
  { value: 'electronics', label: 'Électronique', icon: Smartphone },
  { value: 'books', label: 'Livres & Cours', icon: BookOpen },
  { value: 'furniture', label: 'Mobilier', icon: Home },
  { value: 'clothing', label: 'Vêtements', icon: Shirt },
  { value: 'services', label: 'Services', icon: Users },
  { value: 'housing', label: 'Logement', icon: Home },
  { value: 'jobs', label: 'Jobs & Stages', icon: Briefcase }
];

// Types de transaction
const transactionTypes = [
  { value: 'all', label: 'Tous types', icon: Package },
  { value: 'sale', label: 'Vente', icon: Euro },
  { value: 'donation', label: 'Don', icon: Gift },
  { value: 'exchange', label: 'Échange', icon: RefreshCw },
  { value: 'service', label: 'Service', icon: Users }
];

// Options de tri
const sortOptions = [
  { value: 'recent', label: 'Plus récents', icon: Clock },
  { value: 'oldest', label: 'Plus anciens', icon: Calendar },
  { value: 'price-asc', label: 'Prix croissant', icon: SortAsc },
  { value: 'price-desc', label: 'Prix décroissant', icon: SortDesc },
  { value: 'title', label: 'Titre A-Z', icon: SortAsc },
  { value: 'category', label: 'Par catégorie', icon: Tag }
];

export const FavoritesPage: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [favoriteListings, setFavoriteListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState<FavoriteStats>({
    totalFavorites: 0,
    byCategory: {},
    byTransactionType: {},
    averagePrice: 0,
    recentlyAdded: 0,
    availableCount: 0,
    soldCount: 0
  });
  const [loading, setLoading] = useState({
    favorites: true,
    listings: true,
    removing: false
  });
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    transactionType: 'all',
    priceRange: 'all',
    availability: 'all'
  });
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFavorites, setSelectedFavorites] = useState<string[]>([]);

  useEffect(() => {
    if (currentUser) {
      loadFavorites();
    }
  }, [currentUser]);

  useEffect(() => {
    if (favorites.length > 0) {
      loadFavoriteListings();
    }
  }, [favorites]);

  const loadFavorites = async () => {
    if (!currentUser) return;

    try {
      setLoading(prev => ({ ...prev, favorites: true }));
      
      // Simple query without orderBy to avoid index requirements
      const favoritesQuery = query(
        collection(db, 'favorites'),
        where('userId', '==', currentUser.uid),
        limit(100)
      );
      
      const querySnapshot = await getDocs(favoritesQuery);
      const favoritesData: Favorite[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        favoritesData.push({
          id: doc.id,
          ...data,
          createdAt: safeToDate(data.createdAt),
          updatedAt: safeToDate(data.updatedAt)
        } as Favorite);
      });
      
      // Sort client-side by creation date (most recent first)
      favoritesData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      setFavorites(favoritesData);
      calculateStats(favoritesData);
      
    } catch (error: any) {
      console.error('Erreur lors du chargement des favoris:', error);
      toast.error('Erreur lors du chargement des favoris');
    } finally {
      setLoading(prev => ({ ...prev, favorites: false }));
    }
  };

  const loadFavoriteListings = async () => {
    try {
      setLoading(prev => ({ ...prev, listings: true }));
      
      // Load actual listings for favorites
      const listingPromises = favorites.map(async (favorite) => {
        try {
          const listingDoc = await getDoc(doc(db, 'listings', favorite.listingId));
          if (listingDoc.exists()) {
            const data = listingDoc.data();
            return {
              id: listingDoc.id,
              ...data,
              createdAt: safeToDate(data.createdAt),
              updatedAt: safeToDate(data.updatedAt)
            } as Listing;
          }
          return null;
        } catch (error) {
          console.error(`Erreur lors du chargement de l'annonce ${favorite.listingId}:`, error);
          return null;
        }
      });

      const listings = await Promise.all(listingPromises);
      const validListings = listings.filter(listing => listing !== null) as Listing[];
      
      setFavoriteListings(validListings);
      
    } catch (error) {
      console.error('Erreur lors du chargement des annonces favorites:', error);
    } finally {
      setLoading(prev => ({ ...prev, listings: false }));
    }
  };

  const calculateStats = (favoritesData: Favorite[]) => {
    const byCategory: Record<string, number> = {};
    const byTransactionType: Record<string, number> = {};
    let totalPrice = 0;
    let priceCount = 0;
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    let recentlyAdded = 0;
    
    favoritesData.forEach(favorite => {
      // Count by category
      byCategory[favorite.listingCategory] = (byCategory[favorite.listingCategory] || 0) + 1;
      
      // Count by transaction type
      byTransactionType[favorite.listingTransactionType] = (byTransactionType[favorite.listingTransactionType] || 0) + 1;
      
      // Calculate average price (excluding free items)
      if (favorite.listingPrice > 0) {
        totalPrice += favorite.listingPrice;
        priceCount++;
      }
      
      // Count recently added
      if (favorite.createdAt >= oneWeekAgo) {
        recentlyAdded++;
      }
    });

    setStats({
      totalFavorites: favoritesData.length,
      byCategory,
      byTransactionType,
      averagePrice: priceCount > 0 ? Math.round(totalPrice / priceCount) : 0,
      recentlyAdded,
      availableCount: favoritesData.length, // Will be updated when we check listing status
      soldCount: 0
    });
  };

  const removeFavorite = async (favoriteId: string) => {
    try {
      await deleteDoc(doc(db, 'favorites', favoriteId));
      toast.success('Favori supprimé');
      loadFavorites();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const removeSelectedFavorites = async () => {
    if (selectedFavorites.length === 0) return;
    
    if (!window.confirm(`Supprimer ${selectedFavorites.length} favori(s) sélectionné(s) ?`)) {
      return;
    }

    setLoading(prev => ({ ...prev, removing: true }));

    try {
      const deletePromises = selectedFavorites.map(id => 
        deleteDoc(doc(db, 'favorites', id))
      );
      
      await Promise.all(deletePromises);
      
      toast.success(`${selectedFavorites.length} favori(s) supprimé(s)`);
      setSelectedFavorites([]);
      loadFavorites();
      
    } catch (error) {
      console.error('Erreur lors de la suppression multiple:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setLoading(prev => ({ ...prev, removing: false }));
    }
  };

  const addToFavorites = async (listing: Listing) => {
    if (!currentUser) return;

    try {
      const favoriteData = {
        userId: currentUser.uid,
        listingId: listing.id,
        listingTitle: listing.title,
        listingPrice: listing.price,
        listingImage: listing.images?.[0] || null,
        listingCategory: listing.category,
        listingTransactionType: listing.transactionType,
        sellerName: listing.sellerName,
        sellerUniversity: listing.sellerUniversity,
        notes: '',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, 'favorites'), favoriteData);
      toast.success('Ajouté aux favoris');
      loadFavorites();
      
    } catch (error) {
      console.error('Erreur lors de l\'ajout aux favoris:', error);
      toast.error('Erreur lors de l\'ajout aux favoris');
    }
  };

  const exportFavorites = () => {
    const exportData = {
      user: userProfile?.displayName,
      exportDate: new Date().toISOString(),
      totalFavorites: favorites.length,
      favorites: favorites.map(fav => ({
        title: fav.listingTitle,
        price: fav.listingPrice,
        category: fav.listingCategory,
        transactionType: fav.listingTransactionType,
        seller: fav.sellerName,
        university: fav.sellerUniversity,
        addedDate: fav.createdAt.toISOString(),
        notes: fav.notes || '',
        tags: fav.tags
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mes-favoris-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const shareFavorites = async () => {
    const shareText = `🌟 Mes favoris StudyMarket :\n\n` +
      `📚 ${stats.totalFavorites} annonces sauvegardées\n` +
      `💰 Prix moyen : ${stats.averagePrice}€\n` +
      `🆕 ${stats.recentlyAdded} ajoutées cette semaine\n\n` +
      `Découvrez la marketplace étudiante ! 🎓`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mes Favoris - StudyMarket',
          text: shareText,
          url: window.location.origin
        });
      } catch (error) {
        navigator.clipboard.writeText(shareText);
        toast.success('Lien copié dans le presse-papiers');
      }
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success('Lien copié dans le presse-papiers');
    }
  };

  const getFilteredAndSortedFavorites = () => {
    let filtered = favorites;

    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(fav => 
        fav.listingTitle.toLowerCase().includes(searchLower) ||
        fav.sellerName.toLowerCase().includes(searchLower) ||
        fav.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    if (filters.category !== 'all') {
      filtered = filtered.filter(fav => fav.listingCategory === filters.category);
    }

    if (filters.transactionType !== 'all') {
      filtered = filtered.filter(fav => fav.listingTransactionType === filters.transactionType);
    }

    if (filters.priceRange !== 'all') {
      switch (filters.priceRange) {
        case 'free':
          filtered = filtered.filter(fav => fav.listingPrice === 0);
          break;
        case 'under-50':
          filtered = filtered.filter(fav => fav.listingPrice > 0 && fav.listingPrice < 50);
          break;
        case '50-200':
          filtered = filtered.filter(fav => fav.listingPrice >= 50 && fav.listingPrice <= 200);
          break;
        case 'over-200':
          filtered = filtered.filter(fav => fav.listingPrice > 200);
          break;
      }
    }

    // Apply sorting
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        break;
      case 'price-asc':
        filtered.sort((a, b) => a.listingPrice - b.listingPrice);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.listingPrice - a.listingPrice);
        break;
      case 'title':
        filtered.sort((a, b) => a.listingTitle.localeCompare(b.listingTitle));
        break;
      case 'category':
        filtered.sort((a, b) => a.listingCategory.localeCompare(b.listingCategory));
        break;
    }

    return filtered;
  };

  const formatDate = (date: Date) => {
    try {
      return formatDistanceToNow(date, { 
        addSuffix: true, 
        locale: fr 
      });
    } catch (error) {
      return 'Date inconnue';
    }
  };

  const formatPrice = (price: number, transactionType: string) => {
    if (transactionType === 'donation') return 'Gratuit';
    if (transactionType === 'exchange') return 'Échange';
    if (price === 0) return 'Gratuit';
    
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const filteredFavorites = getFilteredAndSortedFavorites();

  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <Heart className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Connectez-vous pour voir vos favoris</h2>
            <p className="text-muted-foreground">
              Sauvegardez vos annonces préférées et retrouvez-les facilement
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Heart className="w-8 h-8 text-red-500" />
            Mes Favoris
            {stats.totalFavorites > 0 && (
              <Badge variant="secondary\" className="ml-1">
                {stats.totalFavorites}
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">
            Retrouvez toutes vos annonces sauvegardées
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={shareFavorites} className="flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Partager
          </Button>
          <Button variant="outline" onClick={exportFavorites} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.totalFavorites}</p>
                <p className="text-sm text-muted-foreground">Favoris totaux</p>
              </div>
              <Heart className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.averagePrice}€</p>
                <p className="text-sm text-muted-foreground">Prix moyen</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.recentlyAdded}</p>
                <p className="text-sm text-muted-foreground">Cette semaine</p>
              </div>
              <Zap className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{Object.keys(stats.byCategory).length}</p>
                <p className="text-sm text-muted-foreground">Catégories</p>
              </div>
              <Tag className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et contrôles */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Barre de recherche */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher dans vos favoris..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <option.icon className="w-4 h-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex border rounded-lg overflow-hidden">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="icon"
                    onClick={() => setViewMode('grid')}
                    className="rounded-none"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="icon"
                    onClick={() => setViewMode('list')}
                    className="rounded-none"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Filtres avancés */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      <div className="flex items-center gap-2">
                        <category.icon className="w-4 h-4" />
                        {category.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.transactionType} onValueChange={(value) => setFilters(prev => ({ ...prev, transactionType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {transactionTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="w-4 h-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.priceRange} onValueChange={(value) => setFilters(prev => ({ ...prev, priceRange: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Prix" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les prix</SelectItem>
                  <SelectItem value="free">Gratuit</SelectItem>
                  <SelectItem value="under-50">Moins de 50€</SelectItem>
                  <SelectItem value="50-200">50€ - 200€</SelectItem>
                  <SelectItem value="over-200">Plus de 200€</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.availability} onValueChange={(value) => setFilters(prev => ({ ...prev, availability: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Disponibilité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="available">Disponibles</SelectItem>
                  <SelectItem value="sold">Vendues</SelectItem>
                  <SelectItem value="reserved">Réservées</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Actions de sélection multiple */}
            {selectedFavorites.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-sm font-medium text-blue-800">
                  {selectedFavorites.length} favori(s) sélectionné(s)
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFavorites([])}
                  >
                    Désélectionner
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={removeSelectedFavorites}
                    disabled={loading.removing}
                  >
                    {loading.removing ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                        Suppression...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3 h-3 mr-1" />
                        Supprimer
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contenu principal */}
      <div className="space-y-4">
        {loading.favorites ? (
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-[4/3] bg-muted" />
                <CardContent className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-4 bg-muted rounded w-1/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredFavorites.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              {favorites.length === 0 ? (
                <>
                  <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Aucun favori</h3>
                  <p className="text-muted-foreground mb-6">
                    Vous n'avez pas encore ajouté d'annonces à vos favoris.
                    Explorez les annonces et cliquez sur ❤️ pour les sauvegarder !
                  </p>
                  <Button asChild>
                    <a href="/listings">
                      <Search className="w-4 h-4 mr-2" />
                      Explorer les annonces
                    </a>
                  </Button>
                </>
              ) : (
                <>
                  <Filter className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Aucun résultat</h3>
                  <p className="text-muted-foreground mb-6">
                    Aucun favori ne correspond à vos critères de recherche.
                    Essayez de modifier vos filtres.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setFilters({
                      search: '',
                      category: 'all',
                      transactionType: 'all',
                      priceRange: 'all',
                      availability: 'all'
                    })}
                  >
                    Réinitialiser les filtres
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Résultats */}
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">
                {filteredFavorites.length} favori(s) trouvé(s)
                {filteredFavorites.length !== favorites.length && ` sur ${favorites.length}`}
              </p>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (selectedFavorites.length === filteredFavorites.length) {
                    setSelectedFavorites([]);
                  } else {
                    setSelectedFavorites(filteredFavorites.map(f => f.id));
                  }
                }}
              >
                {selectedFavorites.length === filteredFavorites.length ? 'Désélectionner tout' : 'Sélectionner tout'}
              </Button>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFavorites.map((favorite) => {
                  const listing = favoriteListings.find(l => l.id === favorite.listingId);
                  
                  return (
                    <div key={favorite.id} className="relative group">
                      {/* Checkbox de sélection */}
                      <div className="absolute top-2 left-2 z-10">
                        <input
                          type="checkbox"
                          checked={selectedFavorites.includes(favorite.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedFavorites(prev => [...prev, favorite.id]);
                            } else {
                              setSelectedFavorites(prev => prev.filter(id => id !== favorite.id));
                            }
                          }}
                          className="w-4 h-4 rounded border-border bg-background"
                        />
                      </div>

                      {/* Bouton de suppression */}
                      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="destructive"
                          size="icon"
                          className="w-8 h-8"
                          onClick={() => removeFavorite(favorite.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {listing ? (
                        <ListingCard listing={listing} />
                      ) : (
                        <Card>
                          <div className="aspect-[4/3] bg-muted flex items-center justify-center">
                            <div className="text-center text-muted-foreground">
                              <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                              <p className="text-sm">Annonce non disponible</p>
                            </div>
                          </div>
                          <CardContent className="p-4">
                            <h3 className="font-semibold mb-2">{favorite.listingTitle}</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              {formatPrice(favorite.listingPrice, favorite.listingTransactionType)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Ajouté {formatDate(favorite.createdAt)}
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFavorites.map((favorite) => {
                  const listing = favoriteListings.find(l => l.id === favorite.listingId);
                  
                  return (
                    <Card key={favorite.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          {/* Checkbox */}
                          <input
                            type="checkbox"
                            checked={selectedFavorites.includes(favorite.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedFavorites(prev => [...prev, favorite.id]);
                              } else {
                                setSelectedFavorites(prev => prev.filter(id => id !== favorite.id));
                              }
                            }}
                            className="w-4 h-4 rounded border-border"
                          />

                          {/* Image */}
                          <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                            {favorite.listingImage ? (
                              <img
                                src={favorite.listingImage}
                                alt={favorite.listingTitle}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <Package className="w-8 h-8 text-muted-foreground" />
                            )}
                          </div>

                          {/* Contenu */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold truncate">{favorite.listingTitle}</h3>
                              <div className="flex items-center gap-2 ml-4">
                                <span className="font-semibold text-primary">
                                  {formatPrice(favorite.listingPrice, favorite.listingTransactionType)}
                                </span>
                                {listing?.status && (
                                  <Badge variant={listing.status === 'active' ? 'default' : 'secondary'}>
                                    {listing.status === 'active' ? 'Disponible' : 
                                     listing.status === 'sold' ? 'Vendu' : 'Réservé'}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {favorite.sellerName}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {favorite.sellerUniversity}
                              </span>
                              <span className="flex items-center gap-1">
                                <Tag className="w-3 h-3" />
                                {categories.find(c => c.value === favorite.listingCategory)?.label}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                Ajouté {formatDate(favorite.createdAt)}
                              </span>
                              
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(`/listing/${favorite.listingId}`, '_blank')}
                                >
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  Voir
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFavorite(favorite.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};