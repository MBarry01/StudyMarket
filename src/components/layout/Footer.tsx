import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Mail, GraduationCap, Shield, Leaf, ExternalLink } from 'lucide-react';
import GradientIcon from "@/components/ui/GradientIcon";

export const Footer: React.FC = () => {
  const [openSection, setOpenSection] = React.useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <footer className="bg-muted/50 border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {/* Company Info */}
              <div className="space-y-4 text-left">
                <div className="flex items-center justify-start space-x-2">
              <GradientIcon icon={GraduationCap} gradientId="gradient-footer" size={32} />
              <div>
                <span className="font-bold text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  StudyMarket
                </span>
                <div className="text-xs text-muted-foreground -mt-1">
                  Étudiants certifiés
                </div>
              </div>
            </div>
                <p className="text-muted-foreground text-sm">
              La première plateforme d'échange entre étudiants vérifiés. Achetez, vendez, donnez et échangez en toute sécurité au sein de votre communauté universitaire.
            </p>
                <div className="flex space-x-4 justify-start">
              <a href="https://facebook.com/studymarket" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://twitter.com/studymarket" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="https://instagram.com/studymarket" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3 md:space-y-4 text-center md:text-left">
            <button 
              onClick={() => toggleSection('navigation')}
              className="flex items-center justify-between w-full md:cursor-default font-semibold md:justify-start"
            >
              <span>Navigation</span>
              <span className="md:hidden text-xl">{openSection === 'navigation' ? '−' : '+'}</span>
            </button>
            <ul className={`space-y-2 text-sm ${openSection === 'navigation' ? 'block' : 'hidden'} md:block`}>
              <li>
                <Link to="/listings" className="text-muted-foreground hover:text-primary transition-colors">
                  Toutes les annonces
                </Link>
              </li>
              <li>
                <Link to="/listings?transactionType=donation" className="text-muted-foreground hover:text-primary transition-colors">
                  Dons entre étudiants
                </Link>
              </li>
              <li>
                <Link to="/listings?transactionType=exchange" className="text-muted-foreground hover:text-primary transition-colors">
                  Troc & Échanges
                </Link>
              </li>
              <li>
                <Link to="/create" className="text-muted-foreground hover:text-primary transition-colors">
                  Publier une annonce
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-muted-foreground hover:text-primary transition-colors">
                  Comment ça marche
                </Link>
              </li>
            </ul>
          </div>

          {/* Student Categories */}
          <div className="space-y-3 md:space-y-4 text-center md:text-left">
            <button 
              onClick={() => toggleSection('categories')}
              className="flex items-center justify-between w-full md:cursor-default font-semibold md:justify-start"
            >
              <span>Catégories populaires</span>
              <span className="md:hidden text-xl">{openSection === 'categories' ? '−' : '+'}</span>
            </button>
            <ul className={`space-y-2 text-sm ${openSection === 'categories' ? 'block' : 'hidden'} md:block`}>
              <li>
                <Link to="/listings?category=books" className="text-muted-foreground hover:text-primary transition-colors">
                  Livres & Cours
                </Link>
              </li>
              <li>
                <Link to="/listings?category=electronics" className="text-muted-foreground hover:text-primary transition-colors">
                  Électronique
                </Link>
              </li>
              <li>
                <Link to="/housing" className="text-muted-foreground hover:text-primary transition-colors">
                  Logement & Colocation
                </Link>
              </li>
              <li>
                <Link to="/listings?category=services" className="text-muted-foreground hover:text-primary transition-colors">
                  Services étudiants
                </Link>
              </li>
              <li>
                <Link to="/listings?category=jobs" className="text-muted-foreground hover:text-primary transition-colors">
                  Jobs & Stages
                </Link>
              </li>
            </ul>
          </div>

          {/* Trust & Safety */}
          <div className="space-y-3 md:space-y-4 text-center md:text-left">
            <button 
              onClick={() => toggleSection('safety')}
              className="flex items-center justify-between w-full md:cursor-default font-semibold md:justify-start"
            >
              <span>Sécurité & Confiance</span>
              <span className="md:hidden text-xl">{openSection === 'safety' ? '−' : '+'}</span>
            </button>
            <div className={`${openSection === 'safety' ? 'block' : 'hidden'} md:block`}>
              <div className="space-y-3 text-sm mb-3 md:text-left">
                <div className="flex items-center justify-center md:justify-start space-x-2 text-muted-foreground">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span>Étudiants 100% vérifiés</span>
                </div>
                <div className="flex items-center justify-center md:justify-start space-x-2 text-muted-foreground">
                  <Leaf className="w-4 h-4 text-green-600" />
                  <span>Impact écologique mesuré</span>
                </div>
                <div className="flex items-center justify-center md:justify-start space-x-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span>support@studymarket.fr</span>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <Link to="/safety" className="block text-muted-foreground hover:text-primary transition-colors">
                  Conseils de sécurité
                </Link>
                <Link to="/verification" className="block text-muted-foreground hover:text-primary transition-colors">
                  Processus de vérification
                </Link>
                <Link to="/community-guidelines" className="block text-muted-foreground hover:text-primary transition-colors">
                  Règles de la communauté
                </Link>
                <Link to="/help" className="block text-muted-foreground hover:text-primary transition-colors">
                  Centre d'aide
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8">
          <p className="text-muted-foreground text-sm text-center mb-6">
            © 2024 StudyMarket. Tous droits réservés. Plateforme dédiée aux étudiants vérifiés.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6 text-sm">
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 sm:gap-x-6 items-center">
              <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                Conditions d'utilisation
              </Link>
              <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                Politique de confidentialité
              </Link>
            </div>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 sm:gap-x-6 items-baseline">
              <Link to="/cookies" className="text-muted-foreground hover:text-primary transition-colors">
                Cookies
              </Link>
              <a 
                href="mailto:support@studymarket.fr" 
                className="text-muted-foreground hover:text-primary transition-colors inline-flex items-baseline gap-1"
              >
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                <span className="leading-snug">Contact</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};