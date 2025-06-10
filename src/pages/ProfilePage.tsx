import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Separator } from '../components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProfilePhotoUpload } from '../components/profile/ProfilePhotoUpload';
import { 
  User, 
  MapPin, 
  Calendar, 
  Star, 
  Heart, 
  Package,
  AlertCircle,
  ExternalLink,
  Shield,
  Leaf,
  TrendingUp,
  MessageCircle
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Listing } from '../types';
import { ListingCard } from '../components/listing/ListingCard';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ProfileStats {
  totalListings: number;
  activeListings: number;
  totalReviews: number;
  averageRating: number;
  totalFavorites: number;
}

interface Review {
  id: string;
  reviewerId: string;
  revieweeId: string;
  listingId: string;
  rating: number;
  comment: string;
  reviewType: 'buyer' | 'seller';
  isPublic: boolean;
  helpfulCount: number;
  createdAt: any;
  reviewerName?: string;
}

interface Favorite {
  id: string;
  userId: string;
  listingId: string;
  createdAt: any;
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

export const ProfilePage: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [userListings, setUserListings] = useState<Listing[]>([]);
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [favoriteListings, setFavoriteListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState<ProfileStats>({
    totalListings: 0,
    activeListings: 0,
    totalReviews: 0,
    averageRating: 0,
    totalFavorites: 0
  });
  const [loading, setLoading] = useState({
    profile: false,
    listings: true,
    reviews: true,
    favorites: true
  });
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (currentUser) {
      // Charger les données en parallèle avec un chargement progressif
      loadUserListings();
      loadUserReviews();
      loadUserFavorites();
    }
  }, [currentUser]);

  const loadUserListings = async () => {
    if (!currentUser) return;

    try {
      setLoading(prev => ({ ...prev, listings: true }));
      
      // Requête simple sans orderBy pour éviter les problèmes d'index
      const listingsQuery = query(
        collection(db, 'listings'),
        where('sellerId', '==', currentUser.uid),
        limit(20) // Limiter pour améliorer les performances
      );
      
      const querySnapshot = await getDocs(listingsQuery);
      const listings: Listing[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        listings.push({ 
          id: doc.id, 
          ...data,
          createdAt: safeToDate(data.createdAt),
          updatedAt: safeToDate(data.updatedAt)
        } as Listing);
      });
      
      // Trier côté client par date de création
      listings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      setUserListings(listings);
      
      // Calculer les stats des annonces
      const activeListings = listings.filter(listing => listing.status === 'active');
      setStats(prev => ({
        ...prev,
        totalListings: listings.length,
        activeListings: activeListings.length
      }));
      
    } catch (error: any) {
      console.error('Erreur lors du chargement des annonces:', error);
      if (error.message?.includes('index')) {
        setErrors(prev => [...prev, 'listings']);
      }
    } finally {
      setLoading(prev => ({ ...prev, listings: false }));
    }
  };

  const loadUserReviews = async () => {
    if (!currentUser) return;

    try {
      setLoading(prev => ({ ...prev, reviews: true }));
      
      // Requête simple sans orderBy
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('revieweeId', '==', currentUser.uid),
        limit(10) // Limiter pour améliorer les performances
      );
      
      const querySnapshot = await getDocs(reviewsQuery);
      const reviews: Review[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        reviews.push({ 
          id: doc.id, 
          ...data,
          createdAt: safeToDate(data.createdAt)
        } as Review);
      });
      
      // Trier côté client par date
      reviews.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      setUserReviews(reviews);
      
      // Calculer les stats des avis
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;
      
      setStats(prev => ({
        ...prev,
        totalReviews: reviews.length,
        averageRating: Math.round(averageRating * 10) / 10
      }));
      
    } catch (error: any) {
      console.error('Erreur lors du chargement des avis:', error);
      if (error.message?.includes('index')) {
        setErrors(prev => [...prev, 'reviews']);
      }
    } finally {
      setLoading(prev => ({ ...prev, reviews: false }));
    }
  };

  const loadUserFavorites = async () => {
    if (!currentUser) return;

    try {
      setLoading(prev => ({ ...prev, favorites: true }));
      
      // Requête simple sans orderBy
      const favoritesQuery = query(
        collection(db, 'favorites'),
        where('userId', '==', currentUser.uid),
        limit(20) // Limiter pour améliorer les performances
      );
      
      const querySnapshot = await getDocs(favoritesQuery);
      const favorites: Favorite[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        favorites.push({ 
          id: doc.id, 
          ...data,
          createdAt: safeToDate(data.createdAt)
        } as Favorite);
      });
      
      // Trier côté client
      favorites.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      setStats(prev => ({
        ...prev,
        totalFavorites: favorites.length
      }));

      // Charger les annonces favorites (seulement les 6 premières pour l'affichage)
      if (favorites.length > 0) {
        const listingPromises = favorites.slice(0, 6).map(async (favorite) => {
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
            console.error('Erreur lors du chargement d\'une annonce favorite:', error);
            return null;
          }
        });

        const listings = await Promise.all(listingPromises);
        setFavoriteListings(listings.filter(listing => listing !== null) as Listing[]);
      }
      
    } catch (error: any) {
      console.error('Erreur lors du chargement des favoris:', error);
      if (error.message?.includes('index')) {
        setErrors(prev => [...prev, 'favorites']);
      }
    } finally {
      setLoading(prev => ({ ...prev, favorites: false }));
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'Date inconnue';
    
    try {
      const dateObj = safeToDate(date);
      
      if (isNaN(dateObj.getTime())) {
        return 'Date invalide';
      }
      
      return formatDistanceToNow(dateObj, { 
        addSuffix: true, 
        locale: fr 
      });
    } catch (error) {
      return 'Date invalide';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const isLoading = loading.listings || loading.reviews || loading.favorites;

  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Vous devez être connecté pour voir votre profil.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Alerte d'erreurs d'index */}
      {errors.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <div className="space-y-2">
              <p className="font-medium">⚡ Chargement optimisé activé</p>
              <p className="text-sm">
                Certaines fonctionnalités utilisent un mode de chargement optimisé. 
                Les données sont triées côté client pour de meilleures performances.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://console.firebase.google.com/project/annonces-app-44d27/firestore/indexes', '_blank')}
                className="text-orange-700 border-orange-300 hover:bg-orange-100"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Optimiser la base de données
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* En-tête du profil */}
      <Card>
        <CardHeader>
          <div className="flex items-start space-x-4">
            <div className="relative">
              <ProfilePhotoUpload
                currentPhotoURL={userProfile?.photoURL || ''}
                displayName={userProfile?.displayName || currentUser.email || 'Utilisateur'}
              />
              {userProfile?.isVerified && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-background">
                  <Shield className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-2xl">
                  {userProfile?.displayName || 'Utilisateur'}
                </CardTitle>
                {userProfile?.isVerified && (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <Shield className="w-3 h-3 mr-1" />
                    Vérifié
                  </Badge>
                )}
              </div>
              <CardDescription className="text-base">
                {currentUser.email}
              </CardDescription>
              {userProfile?.university && (
                <div className="flex items-center mt-2 text-muted-foreground">
                  <User className="h-4 w-4 mr-1" />
                  <span className="text-sm">{userProfile.university}</span>
                </div>
              )}
              {userProfile?.location && (
                <div className="flex items-center mt-1 text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="text-sm">{userProfile.location}</span>
                </div>
              )}
              <div className="flex items-center mt-1 text-muted-foreground">
                <Calendar className="h-4 w-4 mr-1" />
                <span className="text-sm">
                  Membre depuis {formatDate(userProfile?.createdAt)}
                </span>
              </div>
              {userProfile?.co2Saved && userProfile.co2Saved > 0 && (
                <div className="flex items-center mt-1 text-green-600">
                  <Leaf className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">
                    {userProfile.co2Saved} kg CO₂ économisés
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">
                  {loading.listings ? (
                    <div className="h-8 w-8 bg-muted animate-pulse rounded" />
                  ) : (
                    stats.totalListings
                  )}
                </p>
                <p className="text-sm text-muted-foreground">Annonces totales</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">
                  {loading.listings ? (
                    <div className="h-8 w-8 bg-muted animate-pulse rounded" />
                  ) : (
                    stats.activeListings
                  )}
                </p>
                <p className="text-sm text-muted-foreground">Annonces actives</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">
                  {loading.reviews ? (
                    <div className="h-8 w-8 bg-muted animate-pulse rounded" />
                  ) : (
                    stats.averageRating || '—'
                  )}
                </p>
                <p className="text-sm text-muted-foreground">Note moyenne</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Heart className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">
                  {loading.favorites ? (
                    <div className="h-8 w-8 bg-muted animate-pulse rounded" />
                  ) : (
                    stats.totalFavorites
                  )}
                </p>
                <p className="text-sm text-muted-foreground">Favoris</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contenu des onglets */}
      <Tabs defaultValue="listings" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="listings" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Mes Annonces
            {!loading.listings && stats.totalListings > 0 && (
              <Badge variant="secondary\" className="ml-1">
                {stats.totalListings}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            Avis Reçus
            {!loading.reviews && stats.totalReviews > 0 && (
              <Badge variant="secondary\" className="ml-1">
                {stats.totalReviews}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="favorites" className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Favoris
            {!loading.favorites && stats.totalFavorites > 0 && (
              <Badge variant="secondary\" className="ml-1">
                {stats.totalFavorites}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="listings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Mes Annonces
              </CardTitle>
              <CardDescription>
                Gérez vos annonces publiées sur StudyMarket
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading.listings ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 3 }).map((_, i) => (
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
              ) : userListings.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Aucune annonce</h3>
                  <p className="text-muted-foreground mb-4">
                    Vous n'avez pas encore publié d'annonces.
                  </p>
                  <Button asChild>
                    <a href="/create">Publier ma première annonce</a>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userListings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                Avis Reçus
              </CardTitle>
              <CardDescription>
                Les avis laissés par d'autres étudiants
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading.reviews ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="border rounded-lg p-4 animate-pulse">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex space-x-1">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <div key={j} className="w-4 h-4 bg-muted rounded" />
                          ))}
                        </div>
                        <div className="h-4 w-20 bg-muted rounded" />
                      </div>
                      <div className="h-4 bg-muted rounded w-full mb-2" />
                      <div className="h-4 bg-muted rounded w-1/3" />
                    </div>
                  ))}
                </div>
              ) : userReviews.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Aucun avis</h3>
                  <p className="text-muted-foreground">
                    Aucun avis reçu pour le moment. Les avis apparaîtront après vos premières transactions.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userReviews.map((review) => (
                    <div key={review.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className="flex">
                            {renderStars(review.rating)}
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {review.rating}/5
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                      <p className="text-foreground mb-3 leading-relaxed">{review.comment}</p>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Par {review.reviewerName || 'Utilisateur anonyme'}</span>
                        <Badge variant="outline" className="text-xs">
                          {review.reviewType === 'buyer' ? 'Acheteur' : 'Vendeur'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="favorites" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Mes Favoris
              </CardTitle>
              <CardDescription>
                Les annonces que vous avez ajoutées à vos favoris
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading.favorites ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 3 }).map((_, i) => (
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
              ) : favoriteListings.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Aucun favori</h3>
                  <p className="text-muted-foreground mb-4">
                    Vous n'avez pas encore d'annonces favorites. Explorez les annonces et ajoutez-les à vos favoris !
                  </p>
                  <Button asChild>
                    <a href="/listings">Explorer les annonces</a>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favoriteListings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};