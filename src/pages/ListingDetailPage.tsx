import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Flag, 
  MapPin, 
  Clock, 
  Eye, 
  Star, 
  Shield, 
  ChevronLeft,
  ChevronRight,
  Zap,
  Leaf,
  Gift,
  RefreshCw,
  Euro,
  User,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
  Camera,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogHeader } from '@/components/ui/dialog';
import { FavoriteButton } from '@/components/ui/FavoriteButton';
import { ShareButton } from '@/components/ui/ShareButton';
import { useListingStore } from '../stores/useListingStore';
import { useFavoritesStore } from '../stores/useFavoritesStore';
import { useAuth } from '../contexts/AuthContext';
import { ContactButton } from '../components/messaging/ContactButton';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export const ListingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { currentListing, loading, fetchListingById } = useListingStore();
  const { fetchUserFavorites } = useFavoritesStore();
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      fetchListingById(id);
    }
  }, [id, fetchListingById]);

  useEffect(() => {
    if (currentUser) {
      fetchUserFavorites(currentUser.uid);
    }
  }, [currentUser, fetchUserFavorites]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="aspect-square bg-muted rounded-lg" />
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded w-3/4" />
              <div className="h-6 bg-muted rounded w-1/2" />
              <div className="h-20 bg-muted rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentListing) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="max-w-md mx-auto">
          <AlertTriangle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Annonce introuvable</h1>
          <p className="text-muted-foreground mb-6">
            Cette annonce n'existe pas ou a été supprimée.
          </p>
          <Button onClick={() => navigate('/listings')}>
            Retour aux annonces
          </Button>
        </div>
      </div>
    );
  }

  const listing = currentListing;
  const isOwner = currentUser?.uid === listing.sellerId;

  const formatPrice = (price: number, currency?: string) => {
    if (listing.transactionType === 'donation') return 'Gratuit';
    if (listing.transactionType === 'exchange') return 'Échange';
    
    const currencyCode = currency || 'EUR';
    try {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currencyCode,
      }).format(price);
    } catch (error) {
      return `${price} €`;
    }
  };

  const getConditionLabel = (condition: string) => {
    switch (condition) {
      case 'new': return 'Neuf';
      case 'like-new': return 'Comme neuf';
      case 'good': return 'Bon état';
      case 'fair': return 'État correct';
      case 'poor': return 'Mauvais état';
      default: return condition;
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'new': return 'bg-green-100 text-green-800 border-green-200';
      case 'like-new': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'good': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'fair': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'poor': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTransactionIcon = () => {
    switch (listing.transactionType) {
      case 'donation': return <Gift className="w-4 h-4" />;
      case 'exchange': return <RefreshCw className="w-4 h-4" />;
      case 'service': return <Zap className="w-4 h-4" />;
      default: return <Euro className="w-4 h-4" />;
    }
  };

  const getTransactionLabel = () => {
    switch (listing.transactionType) {
      case 'donation': return 'Don gratuit';
      case 'exchange': return 'Troc';
      case 'service': return 'Service';
      default: return 'Vente';
    }
  };

  const nextImage = () => {
    if (listing.images && listing.images.length > 1) {
      setCurrentImageIndex((prev) => 
        prev === listing.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (listing.images && listing.images.length > 1) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? listing.images.length - 1 : prev - 1
      );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b border-border bg-muted/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">
              Accueil
            </Link>
            <span>/</span>
            <Link to="/listings" className="hover:text-foreground transition-colors">
              Annonces
            </Link>
            <span>/</span>
            <span className="text-foreground">{listing.title}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6 -ml-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Images Section */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-muted">
                {listing.images && listing.images.length > 0 ? (
                  <>
                    <img
                      src={listing.images[currentImageIndex]}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Image Navigation */}
                    {listing.images.length > 1 && (
                      <>
                        <div
                          onClick={prevImage}
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 cursor-pointer text-white hover:text-primary transition-colors bg-black/50 rounded-full p-2"
                          aria-label="Image précédente"
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </div>
                        <div
                          onClick={nextImage}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 cursor-pointer text-white hover:text-primary transition-colors bg-black/50 rounded-full p-2"
                          aria-label="Image suivante"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </div>
                        
                        {/* Image Counter */}
                        <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                          {currentImageIndex + 1} / {listing.images.length}
                        </div>
                      </>
                    )}

                    {/* Zoom Button */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <div
                          className="absolute top-4 right-4 cursor-pointer text-white hover:text-primary transition-colors bg-black/50 rounded-full p-2"
                          aria-label="Agrandir l'image"
                        >
                          <Camera className="w-5 h-5" />
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <DialogTitle>Image en plein écran de l'annonce</DialogTitle>
                        <img
                          src={listing.images[currentImageIndex]}
                          alt={listing.title}
                          className="w-full h-auto max-h-[80vh] object-contain"
                        />
                      </DialogContent>
                    </Dialog>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <Camera className="w-16 h-16 mx-auto mb-4" />
                      <p>Aucune image disponible</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Thumbnail Images */}
              {listing.images && listing.images.length > 1 && (
                <div className="grid grid-cols-6 gap-2">
                  {listing.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        index === currentImageIndex 
                          ? 'border-primary' 
                          : 'border-transparent hover:border-muted-foreground'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${listing.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            {/* Price and Actions */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Transaction Type Badge */}
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                      {getTransactionIcon()}
                      <span className="ml-1">{getTransactionLabel()}</span>
                    </Badge>
                    {listing.sellerVerified && (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        <Shield className="w-3 h-3 mr-1" />
                        Vérifié
                      </Badge>
                    )}
                  </div>

                  {/* Price */}
                  <div className="text-3xl font-bold text-primary">
                    {formatPrice(listing.price, listing.currency)}
                    {listing.transactionType === 'service' && (
                      <span className="text-lg text-muted-foreground">/h</span>
                    )}
                  </div>

                  {/* Exchange Info */}
                  {listing.transactionType === 'exchange' && listing.exchangeFor && (
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex items-center gap-2 text-purple-800">
                        <RefreshCw className="w-4 h-4" />
                        <span className="font-medium">Recherche en échange :</span>
                      </div>
                      <p className="text-purple-700 mt-1">{listing.exchangeFor}</p>
                    </div>
                  )}

                  {/* AI Price Estimate */}
                  {listing.aiPriceEstimate && listing.transactionType === 'sale' && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-800">
                        <TrendingUp className="w-4 h-4" />
                        <span className="font-medium">Prix estimé par IA :</span>
                      </div>
                      <p className="text-green-700 text-sm">
                        {listing.aiPriceEstimate.min}€ - {listing.aiPriceEstimate.max}€
                        <span className="ml-2 text-xs">
                          (Confiance: {Math.round(listing.aiPriceEstimate.confidence * 100)}%)
                        </span>
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {!isOwner ? (
                      <>
                        <ContactButton listing={listing} className="w-full" />
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <FavoriteButton 
                              listing={listing} 
                              size="lg"
                              showText={false}
                            />
                            <ShareButton 
                              listing={listing} 
                              size="lg"
                              showText={false}
                            />
                          </div>
                          <div
                            className="cursor-pointer text-muted-foreground hover:text-destructive transition-colors"
                            aria-label="Signaler"
                          >
                            <Flag className="w-5 h-5" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-2">
                        <Button variant="outline" className="w-full">
                          <User className="w-4 h-4 mr-2" />
                          Modifier l'annonce
                        </Button>
                        <p className="text-sm text-muted-foreground text-center">
                          C'est votre annonce
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seller Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Vendeur</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={listing.sellerAvatar || undefined} />
                      <AvatarFallback>
                        {listing.sellerName[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{listing.sellerName}</h3>
                        {listing.sellerVerified && (
                          <Shield className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {listing.sellerUniversity}
                      </p>
                    </div>
                  </div>

                  {/* Seller Stats */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold">4.8</div>
                      <div className="text-xs text-muted-foreground">Note</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">23</div>
                      <div className="text-xs text-muted-foreground">Ventes</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">98%</div>
                      <div className="text-xs text-muted-foreground">Confiance</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Environmental Impact */}
            {listing.environmentalImpact && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Leaf className="w-5 h-5 text-green-600" />
                    Impact écologique
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      -{listing.environmentalImpact.co2Saved} kg CO₂
                    </div>
                    <p className="text-sm text-muted-foreground">
                      économisés en achetant d'occasion
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Description and Details */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Title and Description */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold mb-2">{listing.title}</h1>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{listing.views} vues</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>
                          {formatDistanceToNow(listing.createdAt, { 
                            addSuffix: true, 
                            locale: fr 
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{listing.location.city}</span>
                      </div>
                    </div>
                  </div>
                  <Badge className={getConditionColor(listing.condition)}>
                    {getConditionLabel(listing.condition)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{listing.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            {listing.tags && listing.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {listing.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Additional Info */}
          <div className="space-y-6">
            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Localisation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="font-medium">{listing.location.city}</div>
                  <div className="text-sm text-muted-foreground">
                    {listing.location.state}, {listing.location.country}
                  </div>
                </div>
                {listing.location.campus && (
                  <div>
                    <div className="text-sm font-medium">Campus</div>
                    <div className="text-sm text-muted-foreground">
                      {listing.location.campus}
                    </div>
                  </div>
                )}
                {listing.location.university && (
                  <div>
                    <div className="text-sm font-medium">Université</div>
                    <div className="text-sm text-muted-foreground">
                      {listing.location.university}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Safety Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Conseils de sécurité
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Rencontrez-vous dans un lieu public</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Vérifiez l'identité de l'autre personne</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Testez l'objet avant la transaction</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>Utilisez la messagerie StudyMarket</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};