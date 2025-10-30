import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Calendar, 
  Star, 
  Heart, 
  Package,
  Shield,
  Leaf,
  TrendingUp,
  MessageCircle,
  GraduationCap,
  User,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  BadgeCheck
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  limit,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Listing } from '../types';
import { ListingCard } from '../components/listing/ListingCard';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ProfilePhotoUpload } from '../components/profile/ProfilePhotoUpload';
import { Label } from '../components/ui/label';
import { toast } from 'react-hot-toast';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { useNavigate } from 'react-router-dom';

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
  createdAt: unknown;
  reviewerName?: string;
  replies: {
    userId: string;
    comment: string;
    createdAt: Date;
  }[];
  likes: string[];
  dislikes: string[];
}

interface Favorite {
  id: string;
  userId: string;
  listingId: string;
  createdAt: unknown;
}

// Helper function to safely convert dates
const safeToDate = (date: unknown): Date => {
  if (!date) return new Date();

  if (date instanceof Date) return date;

  if (typeof date === 'object' && date !== null && 'toDate' in date && typeof (date as { toDate: unknown }).toDate === 'function') {
    try {
      return (date as { toDate: () => Date }).toDate();
    } catch {
      return new Date();
    }
  }

  if (typeof date === 'string' || typeof date === 'number') {
    const parsedDate = new Date(date);
    return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  }

  if (typeof date === 'object' && date !== null && 'seconds' in date && typeof (date as { seconds: unknown }).seconds === 'number') {
    return new Date((date as { seconds: number }).seconds * 1000);
  }

  return new Date();
};

export const ProfilePage: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [userListings, setUserListings] = useState<Listing[]>([]);
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [favoriteListings, setFavoriteListings] = useState<Listing[]>([]);
  const [profileData, setProfileData] = useState<Record<string, unknown> | null>(null);
  const [stats, setStats] = useState<ProfileStats>({
    totalListings: 0,
    activeListings: 0,
    totalReviews: 0,
    averageRating: 0,
    totalFavorites: 0
  });
  const [loading, setLoading] = useState({
    profile: true,
    listings: true,
    reviews: true,
    favorites: true
  });
  const [reviewerProfiles, setReviewerProfiles] = useState<Record<string, { displayName: string; photoURL?: string }>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [firstName, setFirstName] = useState<string>(profileData?.firstName as string || '');
  const [lastName, setLastName] = useState<string>(profileData?.lastName as string || '');

  // Fonctions pour gérer les annonces
  const handleEditListing = (listing: Listing) => {
    navigate(`/edit-listing/${listing.id}`);
  };

  const handleDeleteListing = async (listing: Listing) => {
    if (!currentUser) return;
    
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer l'annonce "${listing.title}" ?\n\nCette action est irréversible.`
    );
    
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, 'listings', listing.id));
      
      // Mettre à jour la liste locale
      setUserListings(prev => prev.filter(l => l.id !== listing.id));
      
      // Mettre à jour les stats
      setStats(prev => ({
        ...prev,
        totalListings: prev.totalListings - 1,
        activeListings: listing.status === 'active' ? prev.activeListings - 1 : prev.activeListings
      }));
      
      toast.success('Annonce supprimée avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression de l\'annonce');
    }
  };

  // Charger les données du profil depuis Firestore
  const loadUserProfile = async () => {
    if (!currentUser) return;

    try {
      setLoading(prev => ({ ...prev, profile: true }));
      
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        console.log('🔍 ProfilePage - Données récupérées de Firestore:', data);
        console.log('📊 Détails:', {
          firstName: data.firstName,
          lastName: data.lastName,
          displayName: data.displayName,
          university: data.university,
          otherUniversity: data.otherUniversity,
          fieldOfStudy: data.fieldOfStudy,
          otherFieldOfStudy: data.otherFieldOfStudy,
          graduationYear: data.graduationYear
        });
        
        setProfileData({
          ...data,
          createdAt: safeToDate(data.createdAt),
          updatedAt: safeToDate(data.updatedAt)
        });
        
        // Mettre à jour les états firstName et lastName pour l'édition
        if (data.firstName) setFirstName(data.firstName);
        if (data.lastName) setLastName(data.lastName);
      } else {
        console.log('❌ Aucun document utilisateur trouvé dans Firestore');
        setProfileData(null);
      }
    } catch (error: unknown) {
      console.error('❌ Erreur lors du chargement du profil:', error);
      setProfileData(null);
    } finally {
      setLoading(prev => ({ ...prev, profile: false }));
    }
  };

  useEffect(() => {
    if (currentUser) {
      // Charger le profil en premier
      loadUserProfile();
      // Puis charger les autres données
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
      listings.sort((a, b) => safeToDate(b.createdAt).getTime() - safeToDate(a.createdAt).getTime());
      
      setUserListings(listings);
      
      // Calculer les stats des annonces
      const activeListings = listings.filter(listing => listing.status === 'active');
      setStats(prev => ({
        ...prev,
        totalListings: listings.length,
        activeListings: activeListings.length
      }));
      
    } catch (error: unknown) {
      console.error('Erreur lors du chargement des annonces:', error);
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
          replies: Array.isArray(data.replies)
            ? data.replies.map((reply) => ({
                ...reply,
                createdAt: reply.createdAt instanceof Date
                  ? reply.createdAt
                  : (reply.createdAt && typeof reply.createdAt.toDate === 'function')
                    ? reply.createdAt.toDate()
                    : new Date()
              }))
            : [],
          likes: Array.isArray(data.likes) ? data.likes : [],
          dislikes: Array.isArray(data.dislikes) ? data.dislikes : [],
          createdAt: safeToDate(data.createdAt)
        } as Review);
      });
      
      // Trier côté client par date
      reviews.sort((a, b) => safeToDate(b.createdAt).getTime() - safeToDate(a.createdAt).getTime());
      
      setUserReviews(reviews);
      
      // Fetch reviewer profiles
      const uniqueReviewerIds = Array.from(new Set(reviews.map(r => r.reviewerId)));
      const newProfiles: Record<string, { displayName: string; photoURL?: string }> = { ...reviewerProfiles };
      await Promise.all(uniqueReviewerIds.map(async (uid) => {
        if (!newProfiles[uid]) {
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            newProfiles[uid] = {
              displayName: userData.displayName || 'Utilisateur',
              photoURL: userData.photoURL || undefined,
            };
          } else {
            newProfiles[uid] = { displayName: '' };
          }
        }
      }));
      setReviewerProfiles(newProfiles);
      
      // Calculer les stats des avis
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;
      
      setStats(prev => ({
        ...prev,
        totalReviews: reviews.length,
        averageRating: Math.round(averageRating * 10) / 10
      }));
      
    } catch (error: unknown) {
      console.error('Erreur lors du chargement des avis:', error);
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
      favorites.sort((a, b) => safeToDate(b.createdAt).getTime() - safeToDate(a.createdAt).getTime());
      
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
        // Dédupliquer les listings par ID pour éviter les clés dupliquées
        const uniqueListings = listings
          .filter(listing => listing !== null) as Listing[];
        const deduplicatedListings = Array.from(
          new Map(uniqueListings.map(listing => [listing.id, listing])).values()
        );
        setFavoriteListings(deduplicatedListings);
      } else {
        // Aucun favori, initialiser à un tableau vide
        setFavoriteListings([]);
      }
      
    } catch (error: unknown) {
      console.error('Erreur lors du chargement des favoris:', error);
      setFavoriteListings([]);
    } finally {
      setLoading(prev => ({ ...prev, favorites: false }));
    }
  };

  const formatDate = (date: unknown) => {
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
    } catch {
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

  // Ajout de la logique de fallback comme dans le Header
  const pendingUserData = localStorage.getItem('pendingUserData');
  const fallbackData = pendingUserData ? JSON.parse(pendingUserData) : {};

  let displayName = profileData?.displayName || userProfile?.displayName || fallbackData.displayName || '';
  if (!displayName && currentUser?.displayName) displayName = currentUser.displayName;
  if (!displayName && currentUser?.email) displayName = currentUser.email.split('@')[0];
  if (!displayName) displayName = 'Utilisateur';

  let university = profileData?.university || userProfile?.university || fallbackData.university || '';
  if ((profileData?.university === 'Autre université' && (profileData as Record<string, unknown>).otherUniversity) || (userProfile?.university === 'Autre université' && (userProfile as unknown as Record<string, unknown>).otherUniversity) || (fallbackData.university === 'Autre université' && fallbackData.otherUniversity)) {
    const profileOtherUni = (profileData as Record<string, unknown>)?.otherUniversity as string;
    const userOtherUni = (userProfile as unknown as Record<string, unknown>)?.otherUniversity as string;
    const fallbackOtherUni = fallbackData.otherUniversity as string;
    university = profileOtherUni || userOtherUni || fallbackOtherUni || "Université personnalisée";
  }
  if (!university) university = "Université spécifiée lors de l'inscription";

  let fieldOfStudy = profileData?.fieldOfStudy || userProfile?.fieldOfStudy || fallbackData.fieldOfStudy || '';
  if ((profileData?.fieldOfStudy === 'Autre' && (profileData as Record<string, unknown>).otherFieldOfStudy) || (userProfile?.fieldOfStudy === 'Autre' && (userProfile as unknown as Record<string, unknown>).otherFieldOfStudy) || (fallbackData.fieldOfStudy === 'Autre' && fallbackData.otherFieldOfStudy)) {
    const profileOtherField = (profileData as Record<string, unknown>)?.otherFieldOfStudy as string;
    const userOtherField = (userProfile as unknown as Record<string, unknown>)?.otherFieldOfStudy as string;
    const fallbackOtherField = fallbackData.otherFieldOfStudy as string;
    fieldOfStudy = profileOtherField || userOtherField || fallbackOtherField || "Filière personnalisée";
  }
  if (!fieldOfStudy) fieldOfStudy = "Filière non spécifiée";

  const graduationYear = profileData?.graduationYear || userProfile?.graduationYear || fallbackData.graduationYear || '';
  const email = profileData?.email || userProfile?.email || fallbackData.email || currentUser?.email || '';
  const photoURL = (profileData?.photoURL || userProfile?.photoURL || '') as string;
  const createdAt = profileData?.createdAt || userProfile?.createdAt;
  const isVerified = profileData?.isVerified || userProfile?.isVerified;
  const location = (profileData?.location || userProfile?.location || '') as string;
  const co2Saved = (profileData?.co2Saved || userProfile?.co2Saved || 0) as number;

  // Détecter si on consulte son propre profil
  const isOwnProfile = currentUser && userProfile && currentUser.uid === userProfile.id;

  const handleLike = async (reviewId: string) => {
    if (!currentUser) return;
    
    try {
      const reviewRef = doc(db, 'reviews', reviewId);
      const review = userReviews.find(r => r.id === reviewId);
      
      if (!review) return;
      
      const newLikes = review.likes || [];
      const newDislikes = review.dislikes || [];
      
      if (newLikes.includes(currentUser.uid)) {
        // Unlike
        await updateDoc(reviewRef, {
          likes: newLikes.filter(id => id !== currentUser.uid)
        });
      } else {
        // Like
        await updateDoc(reviewRef, {
          likes: [...newLikes, currentUser.uid],
          dislikes: newDislikes.filter(id => id !== currentUser.uid)
        });
      }
      
      // Update local state
      setUserReviews(prev => prev.map(r => {
        if (r.id === reviewId) {
          const updatedLikes = r.likes || [];
          const updatedDislikes = r.dislikes || [];
          
          if (updatedLikes.includes(currentUser.uid)) {
            return {
              ...r,
              likes: updatedLikes.filter(id => id !== currentUser.uid)
            };
          } else {
            return {
              ...r,
              likes: [...updatedLikes, currentUser.uid],
              dislikes: updatedDislikes.filter(id => id !== currentUser.uid)
            };
          }
        }
        return r;
      }));
    } catch (error) {
      console.error('Error liking review:', error);
      toast.error('Erreur lors du like');
    }
  };

  const handleDislike = async (reviewId: string) => {
    if (!currentUser) return;
    
    try {
      const reviewRef = doc(db, 'reviews', reviewId);
      const review = userReviews.find(r => r.id === reviewId);
      
      if (!review) return;
      
      const newLikes = review.likes || [];
      const newDislikes = review.dislikes || [];
      
      if (newDislikes.includes(currentUser.uid)) {
        // Remove dislike
        await updateDoc(reviewRef, {
          dislikes: newDislikes.filter(id => id !== currentUser.uid)
        });
      } else {
        // Add dislike
        await updateDoc(reviewRef, {
          dislikes: [...newDislikes, currentUser.uid],
          likes: newLikes.filter(id => id !== currentUser.uid)
        });
      }
      
      // Update local state
      setUserReviews(prev => prev.map(r => {
        if (r.id === reviewId) {
          const updatedLikes = r.likes || [];
          const updatedDislikes = r.dislikes || [];
          
          if (updatedDislikes.includes(currentUser.uid)) {
            return {
              ...r,
              dislikes: updatedDislikes.filter(id => id !== currentUser.uid)
            };
          } else {
            return {
              ...r,
              dislikes: [...updatedDislikes, currentUser.uid],
              likes: updatedLikes.filter(id => id !== currentUser.uid)
            };
          }
        }
        return r;
      }));
    } catch (error) {
      console.error('Error disliking review:', error);
      toast.error('Erreur lors du dislike');
    }
  };

  const handleReply = async (reviewId: string) => {
    if (!currentUser || !replyText.trim()) return;
    
    try {
      const reviewRef = doc(db, 'reviews', reviewId);
      const review = userReviews.find(r => r.id === reviewId);
      
      if (!review) return;
      
      const newReply = {
        userId: currentUser.uid,
        comment: replyText.trim(),
        createdAt: new Date()
      };
      
      await updateDoc(reviewRef, {
        replies: [...(review.replies || []), newReply]
      });
      
      // Update local state
      setUserReviews(prev => prev.map(r => {
        if (r.id === reviewId) {
          return {
            ...r,
            replies: [...(r.replies || []), newReply]
          };
        }
        return r;
      }));
      
      setReplyText('');
      setReplyingTo(null);
      toast.success('Réponse envoyée');
    } catch (error) {
      console.error('Error replying to review:', error);
      toast.error('Erreur lors de l\'envoi de la réponse');
    }
  };

  const handleSaveName = async () => {
    if (!currentUser) return;
    try {
      const displayName = `${firstName} ${lastName}`.trim();
      await updateDoc(doc(db, 'users', currentUser.uid), {
        firstName,
        lastName,
        displayName,
        updatedAt: new Date(),
      });
      await currentUser.reload();
      toast.success('Nom mis à jour !');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du nom');
    }
  };

  if (!currentUser) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
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
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">
      {/* Alerte d'erreurs d'index */}
      {/* {errors.length > 0 && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
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
                className="text-blue-700 border-blue-300 hover:bg-blue-100"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Optimiser la base de données
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )} */}

      {/* En-tête du profil */}
      <Card>
        <CardHeader className="text-left">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:space-x-4 text-center sm:text-left">
            <div className="relative flex-shrink-0 mx-auto sm:mx-0">
              <ProfilePhotoUpload
                currentPhotoURL={photoURL}
                displayName={displayName}
              />
              {isVerified && (
                <div className="absolute bottom-0 right-0 transform translate-x-1/1 -translate-y-1/4 z-10">
                  <BadgeCheck size={18} fill="#3b82f6" stroke="white" strokeWidth={2} />
                </div>
              )}
            </div>
            <div className="flex-1 w-full">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 mb-1">
                <CardTitle className="text-xl sm:text-2xl lg:text-3xl text-center sm:text-left w-full sm:w-auto">
                  {displayName}
                </CardTitle>
              </div>
              <CardDescription className="text-sm sm:text-base text-center sm:text-left break-all">{email}</CardDescription>
              <div className="flex flex-col gap-1 mt-2 text-muted-foreground text-center sm:text-left text-xs sm:text-sm">
                <div><User className="h-3 w-3 sm:h-4 sm:w-4 mr-1 inline" /> Université : <span className="text-xs sm:text-sm">{university}</span></div>
                <div><GraduationCap className="h-3 w-3 sm:h-4 sm:w-4 mr-1 inline" /> Filière : <span className="text-xs sm:text-sm">{fieldOfStudy}</span></div>
                <div><span className="font-bold">Année de diplôme :</span> <span className="text-xs sm:text-sm">{graduationYear}</span></div>
              </div>
              {location && (
                <div className="flex items-center justify-center sm:justify-start mt-1 text-muted-foreground text-center sm:text-left">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="text-xs sm:text-sm">{location}</span>
                </div>
              )}
              <div className="flex items-center justify-center sm:justify-start mt-1 text-muted-foreground text-center sm:text-left">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="text-xs sm:text-sm">
                  Membre depuis {formatDate(createdAt)}
                </span>
              </div>
              {co2Saved && co2Saved > 0 && (
                <div className="flex items-center justify-center sm:justify-start mt-1 text-green-600 text-center sm:text-left">
                  <Leaf className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="text-xs sm:text-sm font-medium">
                    {co2Saved} kg CO₂ économisés
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center mb-2">
                <Package className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold">
                  {loading.listings ? (
                    <div className="h-6 w-6 sm:h-8 sm:w-8 bg-muted animate-pulse rounded" />
                  ) : (
                    stats.totalListings
                  )}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">Annonces totales</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center mb-2">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold">
                  {loading.listings ? (
                    <div className="h-6 w-6 sm:h-8 sm:w-8 bg-muted animate-pulse rounded" />
                  ) : (
                    stats.activeListings
                  )}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">Annonces actives</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center mb-2">
                <Star className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold">
                  {loading.reviews ? (
                    <div className="h-6 w-6 sm:h-8 sm:w-8 bg-muted animate-pulse rounded" />
                  ) : (
                    stats.averageRating || '—'
                  )}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">Note moyenne</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center mb-2">
                <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold">
                  {loading.favorites ? (
                    <div className="h-6 w-6 sm:h-8 sm:w-8 bg-muted animate-pulse rounded" />
                  ) : (
                    stats.totalFavorites
                  )}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">Favoris</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contenu des onglets */}
      <Tabs defaultValue="listings" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 sm:grid-cols-4 p-0 gap-0 items-center h-15">
          <TabsTrigger value="listings" className="flex items-center gap-0.5 sm:gap-1 text-xs sm:text-sm rounded-l-lg rounded-r-none h-10 px-1 sm:px-2">
            <Package className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="hidden sm:inline whitespace-nowrap">Mes Annonces</span>
            <span className="sm:hidden whitespace-nowrap">Annonces</span>
            {!loading.listings && stats.totalListings > 0 && (
              <span className="pointer-events-none h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center text-[9px] sm:text-[10px] font-semibold bg-red-600 text-white rounded-full shadow-sm ring-2 ring-background badge-pop ml-0.5 sm:ml-1 flex-shrink-0">
                {stats.totalListings > 9 ? '9+' : stats.totalListings}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex items-center gap-0.5 sm:gap-1 text-xs sm:text-sm rounded-none h-10 px-1 sm:px-2">
            <Star className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="hidden sm:inline whitespace-nowrap">Avis Reçus</span>
            <span className="sm:hidden whitespace-nowrap">Avis</span>
            {!loading.reviews && stats.totalReviews > 0 && (
              <span className="pointer-events-none h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center text-[9px] sm:text-[10px] font-semibold bg-red-600 text-white rounded-full shadow-sm ring-2 ring-background badge-pop ml-0.5 sm:ml-1 flex-shrink-0">
                {stats.totalReviews > 9 ? '9+' : stats.totalReviews}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="favorites" className="flex items-center gap-0.5 sm:gap-1 text-xs sm:text-sm rounded-none h-10 px-1 sm:px-2">
            <Heart className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="hidden sm:inline whitespace-nowrap">Favoris</span>
            <span className="sm:hidden whitespace-nowrap">Favoris</span>
            {!loading.favorites && stats.totalFavorites > 0 && (
              <span className="pointer-events-none h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center text-[9px] sm:text-[10px] font-semibold bg-red-600 text-white rounded-full shadow-sm ring-2 ring-background badge-pop ml-0.5 sm:ml-1 flex-shrink-0">
                {stats.totalFavorites > 9 ? '9+' : stats.totalFavorites}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-0.5 sm:gap-1 text-xs sm:text-sm rounded-r-lg rounded-l-none h-10 px-1 sm:px-2">
            <User className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="hidden sm:inline whitespace-nowrap">Paramètres</span>
            <span className="sm:hidden whitespace-nowrap">Paramètres</span>
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
                <div className="flex flex-col items-center py-12">
                  <Package className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2 text-center">Aucune annonce</h3>
                  <p className="text-muted-foreground mb-4 text-center">
                    Vous n'avez pas encore publié d'annonces.
                  </p>
                  <Button asChild>
                    <Link to="/create">Publier ma première annonce</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userListings.map((listing) => (
                    <ListingCard 
                      key={listing.id} 
                      listing={listing}
                      showActions={true}
                      onEdit={handleEditListing}
                      onDelete={handleDeleteListing}
                    />
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
                <div className="flex flex-col items-center py-12">
                  <MessageCircle className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2 text-center">Aucun avis</h3>
                  <p className="text-muted-foreground text-center">
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
                      <p className="text-foreground mb-3 leading-relaxed text-left">{review.comment}</p>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span className="flex items-center gap-2 font-medium">
                          {reviewerProfiles[review.reviewerId]?.photoURL && (
                            <img src={reviewerProfiles[review.reviewerId].photoURL} alt="avatar" className="w-7 h-7 rounded-full object-cover" />
                          )}
                          {review.reviewerId === currentUser.uid
                            ? (userProfile?.displayName || 'Vous')
                            : reviewerProfiles[review.reviewerId]?.displayName
                              ? reviewerProfiles[review.reviewerId].displayName
                              : <span className="inline-block bg-gray-200 text-gray-600 px-2 py-0.5 rounded text-xs">Profil supprimé</span>
                          }
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {review.reviewType === 'buyer' ? 'Acheteur' : 'Vendeur'}
                        </Badge>
                      </div>

                      {/* Interactions */}
                      <div className="mt-3 flex items-center gap-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`flex items-center gap-1 ${review.likes?.includes(currentUser?.uid || '') ? 'text-primary' : ''}`}
                          onClick={() => handleLike(review.id)}
                        >
                          <ThumbsUp className="w-4 h-4" />
                          <span>{review.likes?.length || 0}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`flex items-center gap-1 ${review.dislikes?.includes(currentUser?.uid || '') ? 'text-destructive' : ''}`}
                          onClick={() => handleDislike(review.id)}
                        >
                          <ThumbsDown className="w-4 h-4" />
                          <span>{review.dislikes?.length || 0}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex items-center gap-1"
                          onClick={() => setReplyingTo(replyingTo === review.id ? null : review.id)}
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Répondre</span>
                        </Button>
                      </div>

                      {/* Reply form */}
                      {replyingTo === review.id && (
                        <div className="mt-3 space-y-2">
                          <Textarea
                            placeholder="Votre réponse..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className="min-h-[80px]"
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyText('');
                              }}
                            >
                              Annuler
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleReply(review.id)}
                              disabled={!replyText.trim()}
                            >
                              Envoyer
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Replies */}
                      {review.replies && review.replies.length > 0 && (
                        <div className="mt-4 space-y-3 pl-4 border-l-2 border-muted">
                          {review.replies.map((reply, index) => (
                            <div key={index} className="text-sm">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">
                                  {isOwnProfile && reply.userId === currentUser?.uid
                                    ? 'Vous'
                                    : reviewerProfiles[reply.userId]?.displayName || 'Utilisateur'}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(reply.createdAt)}
                                </span>
                              </div>
                              <p className="text-muted-foreground text-left">{reply.comment}</p>
                            </div>
                          ))}
                        </div>
                      )}
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
                    <Link to="/create">Publier ma première annonce</Link>
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

        <TabsContent value="settings" className="space-y-4">
          {/* Section Vérification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Vérification du compte
              </CardTitle>
              <CardDescription>
                Vérifiez votre statut d'étudiant pour accéder à toutes les fonctionnalités
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {userProfile?.isVerified ? (
                    <div className="flex items-center gap-2">
                      <BadgeCheck size={20} fill="#3b82f6" stroke="white" strokeWidth={2} />
                      <span className="text-sm font-medium text-foreground">Vérifié</span>
                    </div>
                  ) : (
                    <Badge className="bg-yellow-500 text-white">
                      {userProfile?.verificationStatus === 'rejected' ? 'Rejeté' : 'En attente'}
                    </Badge>
                  )}
                  <div className="text-sm text-muted-foreground">
                    {userProfile?.verificationStatus === 'verified'
                      ? 'Votre compte est vérifié' 
                      : userProfile?.verificationStatus === 'rejected'
                      ? 'Votre demande a été rejetée'
                      : 'Votre compte n\'est pas encore vérifié'}
                  </div>
                </div>
                <Button asChild className="w-full sm:w-auto">
                  <Link to="/verification">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {userProfile?.isVerified ? 'Voir le statut' : 'Demander la vérification'}
                  </Link>
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                Les comptes vérifiés bénéficient de plus de confiance et d'avantages sur la plateforme
              </div>
            </CardContent>
          </Card>

          {/* Paramètres du profil */}
          <Card>
            <CardHeader>
              <CardTitle>Paramètres du profil</CardTitle>
              <CardDescription>Modifie tes informations principales.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-2">
                <div className="flex-1">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} autoComplete="given-name" />
                </div>
                <div className="flex-1">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} autoComplete="family-name" />
                </div>
              </div>
              <Button onClick={handleSaveName} disabled={!firstName || !lastName}>Enregistrer</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfilePage;