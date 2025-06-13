import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Smartphone, 
  Car, 
  Home, 
  BookOpen, 
  Users, 
  Briefcase,
  ArrowRight,
  Star,
  Shield,
  GraduationCap,
  TrendingUp,
  Heart,
  Recycle,
  MessageCircle,
  Gift,
  RefreshCw,
  Leaf,
  Award,
  MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useListingStore } from '../stores/useListingStore';
import { ListingCard } from '../components/listing/ListingCard';
import { PopulateDataButton } from '../components/admin/PopulateDataButton';
import { ImBook, ImGift, ImHome, ImLocation, ImMobile, ImSpinner, ImSpinner9, ImUser, ImUsers, ImUserTie } from "react-icons/im";
import GradientIcon from "@/components/ui/GradientIcon";

const categoryIcons = {
  electronics: "/src/assets/icon/Gradient/electronic.svg",
  books: "/src/assets/icon/Gradient/livre.svg",
  furniture: "/src/assets/icon/Gradient/mobilier.svg",
  housing: "/src/assets/icon/Gradient/logement.svg",
  services: "/src/assets/icon/Gradient/services.svg",
  jobs: "/src/assets/icon/Gradient/job.svg",
  donations: "/src/assets/icon/Gradient/don.svg",
  exchange: "/src/assets/icon/Gradient/troc.svg",
};

<GradientIcon icon={ImMobile} gradientId="gradient-electronics" size={32} />

const TrendingUpIcon = () => (
  <img 
    src="/src/assets/icon/Gradient/launch.svg" 
    alt="Trending Up" 
    className="w-50 h-50" 
  />
);
const GiveUpIcon = () => (
  <img 
    src="/src/assets/icon/Gradient/handshake.svg" 
    alt="Trending Up" 
    className="w-50 h-50" 
  />
);
const ExchangeIcon = () => (
  <img 
    src="/src/assets/icon/Gradient/refresh.svg" 
    alt="Trending Up" 
    className="w-50 h-50" 
  />
);
const ChatIcon = () => (
  <img 
    src="/src/assets/icon/Bleu/chat.svg" 
    alt="Trending Up" 
    className="w-50 h-50" 
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

  useEffect(() => {
    fetchFeaturedListings();
  }, [fetchFeaturedListings]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="flex items-center justify-center mb-6">
            <Badge className="bg-green-100 text-green-800 border-green-200 px-4 py-2">
              <Shield className="w-4 h-4 mr-2" />
              Communauté 100% étudiants vérifiés
            </Badge>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            La marketplace des étudiants
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Achetez, vendez, donnez et échangez entre étudiants certifiés de votre région. 
            Sécurisé, écologique et pensé pour la vie étudiante.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Rechercher parmi les étudiants de votre région..."
                className="pl-12 h-14 text-lg rounded-full border-2"
              />
              <Button 
                size="lg" 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full bg-gradient-to-r from-primary to-secondary"
              >
                Rechercher
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {quickActions.map((action, index) => (
              <Link key={index} to={action.link} className="group">
                <Card className="border-2 hover:border-primary/20 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                  <CardContent className="p-4 text-center">
                    <div className={`w-14 h-14 ${action.color} rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold mb-1">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="bg-gradient-to-r from-primary to-secondary">
              <Link to="/listings">
                Parcourir les annonces
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/auth">Rejoindre la communauté</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Catégories étudiantes</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Des catégories pensées spécifiquement pour la vie étudiante, avec des filtres adaptés à vos besoins
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {studentCategories.map((category) => (
              <Link
                key={category.id}
                to={`/listings?category=${category.id}`}
                className="group"
              >
                <Card className="h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-2 hover:border-primary/20">
                  <CardContent className="p-6 text-center">
                    <img
                      src={categoryIcons[category.id]}
                      alt={category.name}
                      className="w-16 h-16 mx-auto mb-4"
                    />
                    <h3 className="font-semibold text-sm mb-2">{category.name}</h3>
                    <p className="text-xs text-muted-foreground">{category.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      {featuredListings.length > 0 && (
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto">
            <div className="flex justify-between items-center mb-12">
              <div>
                <h2 className="text-3xl font-bold mb-2">Annonces récentes</h2>
                <p className="text-muted-foreground">Les dernières offres de la communauté étudiante</p>
              </div>
              <Button variant="outline" asChild>
                <Link to="/listings">
                  Voir tout
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredListings.slice(0, 6).map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Pourquoi StudyMarket ?</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Une plateforme pensée par et pour les étudiants, avec des fonctionnalités uniques pour votre sécurité et votre tranquillité d'esprit
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-none">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Environmental Impact Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <Leaf className="w-16 h-16 text-green-600 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">
              Votre impact écologique compte
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Chaque achat d'occasion évite la production d'un objet neuf. Suivez votre impact environnemental 
              et découvrez combien de CO₂ vous économisez grâce à vos échanges étudiants.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">2.5T</div>
                <div className="text-sm text-muted-foreground">CO₂ économisé par la communauté</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">15K</div>
                <div className="text-sm text-muted-foreground">Objets donnés cette année</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">8K</div>
                <div className="text-sm text-muted-foreground">Étudiants engagés</div>
              </div>
            </div>
            <Button size="lg" variant="outline" className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white">
              
               <Link to="/impact" className="cursor-pointer">
                Découvrir mon impact
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-primary to-secondary">
        <div className="container mx-auto text-center">
          <GraduationCap className="w-16 h-16 text-white mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">
            Rejoignez la communauté étudiante
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Plus de 10 000 étudiants font déjà confiance à StudyMarket pour leurs achats, ventes et échanges. 
            Rejoignez une communauté sûre, vérifiée et solidaire.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/auth">
                <Shield className="w-4 h-4 mr-2" />
                Inscription vérifiée
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white bg-tranparent hover:bg-white hover:text-primary" asChild>
              <Link to="/listings">Commencer à explorer</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Admin Button for populating data */}
      <PopulateDataButton />
    </div>
  );
};