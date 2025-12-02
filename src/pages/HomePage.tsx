import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Shield,
  GraduationCap,
  Leaf,
  Award,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useListingStore } from '../stores/useListingStore';
import { ListingCard } from '../components/listing/ListingCard';
import { useAuth } from '../contexts/AuthContext';
import {
  sortListingsByPriority,
  getUserLocation,
  saveUserLocation,
  getSavedUserLocation,
  fetchNearbyListings,
  ListingWithDistance
} from '../lib/geolocation';
import { ImBook, ImGift, ImHome, ImLocation, ImMobile, ImSpinner9, ImUsers, ImUserTie } from "react-icons/im";


const categoryIcons: { [key: string]: string } = {
  electronics: `${import.meta.env.BASE_URL}assets/Icon/Gradient/electronic.svg`,
  books: `${import.meta.env.BASE_URL}assets/Icon/Gradient/livre.svg`,
  furniture: `${import.meta.env.BASE_URL}assets/Icon/Gradient/mobilier.svg`,
  housing: `${import.meta.env.BASE_URL}assets/Icon/Gradient/logement.svg`,
  services: `${import.meta.env.BASE_URL}assets/Icon/Gradient/services.svg`,
  jobs: `${import.meta.env.BASE_URL}assets/Icon/Gradient/job.svg`,
  donations: `${import.meta.env.BASE_URL}assets/Icon/Gradient/don.svg`,
  exchange: `${import.meta.env.BASE_URL}assets/Icon/Gradient/troc.svg`,
};

const TrendingUpIcon: React.FC<{ className?: string }> = ({ className }) => (
  <img
    src={`${import.meta.env.BASE_URL}assets/Icon/Gradient/launch.svg`}
    alt="Trending Up"
    className={className}
  />
);
const GiveUpIcon: React.FC<{ className?: string }> = ({ className }) => (
  <img
    src={`${import.meta.env.BASE_URL}assets/Icon/Gradient/handshake.svg`}
    alt="Give Up"
    className={className}
  />
);
const ExchangeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <img
    src={`${import.meta.env.BASE_URL}assets/Icon/Gradient/refresh.svg`}
    alt="Exchange"
    className={className}
  />
);
const ChatIcon: React.FC<{ className?: string }> = ({ className }) => (
  <img
    src={`${import.meta.env.BASE_URL}assets/Icon/Bleu/chat.svg`}
    alt="Chat"
    className={className}
  />
);
const studentCategories = [
  {
    id: 'electronics',
    name: 'Électronique',
    icon: ImMobile,
    color: 'text-blue-600',
    description: 'Ordinateurs, téléphones, accessoires tech'
  },
  {
    id: 'books',
    name: 'Livres & Cours',
    icon: ImBook,
    color: 'text-blue-600',
    description: 'Manuels, livres, notes de cours'
  },
  {
    id: 'furniture',
    name: 'Mobilier',
    icon: ImHome,
    color: 'text-blue-600',
    description: 'Meubles, déco, électroménager'
  },
  {
    id: 'housing',
    name: 'Logement',
    icon: ImLocation,
    color: 'text-blue-600',
    description: 'Colocations, studios, chambres'
  },
  {
    id: 'services',
    name: 'Services',
    icon: ImUsers,
    color: 'text-blue-600',
    description: 'Cours particuliers, aide, babysitting'
  },
  {
    id: 'jobs',
    name: 'Jobs & Stages',
    icon: ImUserTie,
    color: 'text-blue-600',
    description: 'Petits boulots, stages, missions'
  },
  {
    id: 'donations',
    name: 'Dons',
    icon: ImGift,
    color: 'text-blue-600',
    description: 'Objets gratuits, entraide'
  },
  {
    id: 'exchange',
    name: 'Troc',
    icon: ImSpinner9,
    color: 'text-blue-600',
    description: 'Échanges de services et objets'
  },
];

const features = [
  {
    icon: Shield,
    title: 'Étudiants vérifiés uniquement',
    description: 'Chaque membre est vérifié avec son adresse universitaire. Badge "Étudiant certifié" sur tous les profils.'
  },
  {
    icon: ChatIcon,
    title: 'Chat sécurisé intégré',
    description: 'Messagerie avec proposition de rendez-vous, points de rencontre campus et protection des données.'
  },
  {
    icon: Leaf,
    title: 'Impact écologique mesuré',
    description: 'Suivez votre impact environnemental : CO₂ économisé, ressources préservées grâce à vos achats d\'occasion.'
  },
  {
    icon: Award,
    title: 'Avis publics et réputation',
    description: 'Système de notation transparent. Consultez les avis avant chaque transaction pour échanger en confiance.'
  }
];

const quickActions = [
  {
    title: 'Vendre rapidement',
    description: 'Publiez votre annonce en moins d\'une minute',
    icon: TrendingUpIcon,
    link: '/create',
    color: 'border-2 border-green-500 text-green-500'
  },
  {
    title: 'Donner gratuitement',
    description: 'Offrez ce dont vous n\'avez plus besoin',
    icon: GiveUpIcon,
    link: '/create?type=donation',
    color: 'border-2 border-green-500 text-green-500'
  },
  {
    title: 'Proposer un troc',
    description: 'Échangez services et objets sans argent',
    icon: ExchangeIcon,
    link: '/create?type=exchange',
    color: 'border-2 border-green-500 text-green-500'
  }
];

export const HomePage: React.FC = () => {
  const { featuredListings, fetchFeaturedListings } = useListingStore();
  const { userProfile } = useAuth();
  const [nearbyListings, setNearbyListings] = useState<ListingWithDistance[]>([]);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const nearbyMap = useMemo(() => {
    return nearbyListings.reduce<Record<string, ListingWithDistance>>((acc, listing) => {
      acc[listing.id] = listing;
      return acc;
    }, {});
  }, [nearbyListings]);

  const prioritizedListings = useMemo<ListingWithDistance[]>(() => {
    if (featuredListings.length === 0) {
      return [];
    }

    if (!userProfile || nearbyListings.length === 0) {
      return featuredListings.slice(0, 6).map((listing, index) => ({
        ...listing,
        distance: Infinity,
        priority: 1000 + index,
      }));
    }

    const combined: (ListingWithDistance)[] = [];
    const seen = new Set<string>();

    nearbyListings.forEach((listing) => {
      combined.push(listing);
      seen.add(listing.id);
    });

    featuredListings.forEach((listing) => {
      if (!seen.has(listing.id)) {
        combined.push({
          ...listing,
          distance: Infinity,
          priority: 999,
        } as ListingWithDistance);
      }
    });

    return combined.slice(0, 6);
  }, [featuredListings, nearbyListings, userProfile]);

  useEffect(() => {
    fetchFeaturedListings();
  }, [fetchFeaturedListings]);

  // Charger la position de l'utilisateur et les annonces proches - OPTIMISÉ
  useEffect(() => {
    const loadNearbyListings = async () => {
      if (!userProfile) return;

      setIsLoadingNearby(true);

      // Récupérer la position sauvegardée ou demander la géolocalisation
      const savedLocation = getSavedUserLocation();
      let location = savedLocation;

      if (!location) {
        location = await getUserLocation();
        if (location) {
          saveUserLocation(location);
        }
      }

      if (location) {
        // Location is used for sorting below
      }

      // OPTIMISÉ : Charger seulement les listings nécessaires (max 20)
      const listings = await fetchNearbyListings(userProfile, 20);

      // Trier par priorité
      if (location && listings.length > 0) {
        const sorted = sortListingsByPriority(listings, location, userProfile);
        setNearbyListings(sorted.slice(0, 6)); // Limiter à 6 annonces
      } else if (listings.length > 0) {
        // Si pas de géolocalisation, prendre les premières
        setNearbyListings(listings.slice(0, 6).map(l => ({ ...l, distance: Infinity, priority: 6 })));
      }

      setIsLoadingNearby(false);
    };

    loadNearbyListings();
  }, [userProfile]);

  // Mémoriser le handler de refresh
  const handleRefresh = useCallback(async () => {
    if (!userProfile) return;

    setIsRefreshing(true);
    const location = await getUserLocation();
    if (location) {
      saveUserLocation(location);

      // Recharger les listings
      const listings = await fetchNearbyListings(userProfile, 20);
      if (listings.length > 0) {
        const sorted = sortListingsByPriority(listings, location, userProfile);
        setNearbyListings(sorted.slice(0, 6));
      }
    }
    setIsRefreshing(false);
  }, [userProfile]);

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/10 rounded-lg sm:rounded-xl overflow-hidden mb-8">

        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 lg:mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent px-2 text-center mt-0 sm:mt-8">
            La marketplace des étudiants
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mb-4 sm:mb-6 lg:mb-8 max-w-2xl mx-auto px-2 text-center">
            Achetez, vendez, donnez et échangez entre étudiants certifiés de votre région.
            Sécurisé, écologique et pensé pour la vie étudiante.
          </p>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 sm:mb-8">
            {quickActions.map((action, index) => (
              <Link key={index} to={action.link} className="group">
                <Card className="border-2 hover:border-primary/20 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                  <CardContent className="p-3 sm:p-4 text-center">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 ${action.color} rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform`}>
                      <action.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <h3 className="font-semibold mb-1 text-sm sm:text-base text-center">{action.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground text-center">{action.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center px-2">
            <Button size="lg" asChild className="bg-gradient-to-r from-primary to-secondary w-full sm:w-auto text-sm sm:text-base">
              <Link to="/listings">
                Parcourir les annonces
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto text-sm sm:text-base">
              <Link to="/auth?signup=true">Rejoindre la communauté</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 sm:py-10 lg:py-16 px-2 sm:px-4">
        <div className="container mx-auto">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center mb-2 sm:mb-3 lg:mb-4">Catégories étudiantes</h2>
          <p className="text-center text-muted-foreground mb-6 sm:mb-8 lg:mb-12 max-w-2xl mx-auto text-xs sm:text-sm lg:text-base px-2">
            Des catégories pensées spécifiquement pour la vie étudiante, avec des filtres adaptés à vos besoins
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {studentCategories.map((category) => {
              // Détermine la route en fonction de l'ID de catégorie
              let route;
              if (category.id === 'jobs') {
                route = '/jobs';
              } else if (category.id === 'housing') {
                route = '/housing'; // Nouvelle route pour le logement
              } else {
                route = `/listings?category=${category.id}`;
              }

              return (
                <Link key={category.id} to={route} className="group">
                  <Card className="h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-2 hover:border-primary/20">
                    <CardContent className="p-3 sm:p-4 text-center">
                      <img
                        src={categoryIcons[category.id as keyof typeof categoryIcons]}
                        alt={category.name}
                        className="w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 mx-auto mb-2 sm:mb-3"
                      />
                      <h3 className="font-semibold text-xs sm:text-sm lg:text-base mb-1 text-center">{category.name}</h3>
                      <p className="text-xs text-muted-foreground hidden sm:block text-center">{category.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Listings with location-aware ordering */}
      {prioritizedListings.length > 0 && (
        <section className="py-8 sm:py-12 lg:py-16 px-2 sm:px-4 bg-muted/30">
          <div className="container mx-auto">
            <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center mb-6">
              <div className="text-center sm:text-left">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2">
                  Annonces récentes
                </h2>
                {userProfile && nearbyListings.length > 0 ? (
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Triées en priorité selon {userProfile.campus ? `ton campus ${userProfile.campus}` : 'ta localisation'}.
                  </p>
                ) : (
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Les dernières offres publiées par la communauté étudiante.
                  </p>
                )}
              </div>
              <div className="flex items-center justify-center sm:justify-end gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={isRefreshing || !userProfile}
                  className="flex-shrink-0"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
                <Button variant="outline" asChild className="w-full sm:w-auto">
                  <Link to="/listings">
                    Voir tout
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
            {isLoadingNearby ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {prioritizedListings.map((listing) => {
                  const locationMetadata = userProfile ? nearbyMap[listing.id] : undefined;
                  const isSameCampus =
                    userProfile?.campus && listing.location.campus === userProfile.campus;
                  const isSameCity =
                    listing.location.city === userProfile?.location?.split(',')[0]?.trim();
                  const showBadge = Boolean(locationMetadata);

                  return (
                    <div key={listing.id} className="relative">
                      <ListingCard listing={listing} />
                      {showBadge && (isSameCampus || isSameCity || (locationMetadata?.distance !== undefined && locationMetadata.distance < 5)) && (
                        <Badge
                          className="absolute top-2 right-2 z-10"
                          variant={isSameCampus ? 'default' : 'secondary'}
                        >
                          {isSameCampus
                            ? 'Campus'
                            : isSameCity
                              ? 'Ville'
                              : `${locationMetadata?.distance?.toFixed(1) ?? '—'} km`}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Features */}
      <section className="py-8 sm:py-12 lg:py-16 px-2 sm:px-4">
        <div className="container mx-auto">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center mb-3 sm:mb-4">Pourquoi StudyMarket ?</h2>
          <p className="text-center text-muted-foreground mb-8 sm:mb-12 max-w-2xl mx-auto text-sm sm:text-base px-2">
            Une plateforme pensée par et pour les étudiants, avec des fonctionnalités uniques pour votre sécurité et votre tranquillité d'esprit
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-none">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg lg:text-xl font-semibold mb-1 sm:mb-2">{feature.title}</h3>
                      <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Environmental Impact Section */}
      <section className="py-8 sm:py-12 lg:py-16 px-2 sm:px-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg sm:rounded-xl">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <Leaf className="w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-green-600 mx-auto mb-4 sm:mb-6" />
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 text-center">
              Votre impact écologique compte
            </h2>
            <p className="text-sm sm:text-base lg:text-xl text-muted-foreground mb-6 sm:mb-8 px-2 text-center">
              Chaque achat d'occasion évite la production d'un objet neuf. Suivez votre impact environnemental
              et découvrez combien de CO₂ vous économisez grâce à vos échanges étudiants.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-0">
              <div className="text-center">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600 mb-1 sm:mb-2 text-center">2.5T</div>
                <div className="text-xs sm:text-sm text-muted-foreground text-center">CO₂ économisé par la communauté</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600 mb-1 sm:mb-2 text-center">15K</div>
                <div className="text-xs sm:text-sm text-muted-foreground text-center">Objets donnés cette année</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600 mb-1 sm:mb-2 text-center">8K</div>
                <div className="text-xs sm:text-sm text-muted-foreground text-center">Étudiants engagés</div>
              </div>
            </div>
            <Button size="lg" variant="outline" className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white w-full sm:w-auto mx-auto text-center p-0 mt-4" asChild>
              <Link to="/impact" className="cursor-pointer py-2 px-6">
                Découvrir mon impact
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-8 sm:py-12 lg:py-16 px-2 sm:px-4 bg-gradient-to-r from-primary to-secondary rounded-lg sm:rounded-xl">
        <div className="container mx-auto text-center">
          <GraduationCap className="w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-white mx-auto mb-4 sm:mb-6" />
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-3 sm:mb-4 text-center">
            Rejoignez la communauté étudiante
          </h2>
          <p className="text-sm sm:text-base lg:text-xl text-white/90 mb-6 sm:mb-8 max-w-2xl mx-auto px-2 text-center">
            Plus de 10 000 étudiants font déjà confiance à StudyMarket pour leurs achats, ventes et échanges.
            Rejoignez une communauté sûre, vérifiée et solidaire.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild className="w-full sm:w-auto">
              <Link to="/auth">
                <Shield className="w-4 h-4 mr-2" />
                Inscription vérifiée
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white bg-transparent hover:bg-white hover:text-primary w-full sm:w-auto" asChild>
              <Link to="/listings">Commencer à explorer</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};