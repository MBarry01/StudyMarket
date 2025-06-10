import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin, GraduationCap, Shield, Leaf, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-muted/50 border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
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
            <div className="flex space-x-4">
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
          <div className="space-y-4">
            <h3 className="font-semibold">Navigation</h3>
            <ul className="space-y-2 text-sm">
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
          <div className="space-y-4">
            <h3 className="font-semibold">Catégories populaires</h3>
            <ul className="space-y-2 text-sm">
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
                <Link to="/listings?category=housing" className="text-muted-foreground hover:text-primary transition-colors">
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
          <div className="space-y-4">
            <h3 className="font-semibold">Sécurité & Confiance</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Shield className="w-4 h-4 text-green-600" />
                <span>Étudiants 100% vérifiés</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Leaf className="w-4 h-4 text-green-600" />
                <span>Impact écologique mesuré</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>support@studymarket.fr</span>
              </div>
            </div>
            <div className="space-y-2">
              <Link to="/safety" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                Conseils de sécurité
              </Link>
              <Link to="/verification" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                Processus de vérification
              </Link>
              <Link to="/community-guidelines" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                Règles de la communauté
              </Link>
              <Link to="/help" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                Centre d'aide
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-muted-foreground text-sm">
            © 2024 StudyMarket. Tous droits réservés. Plateforme dédiée aux étudiants vérifiés.
          </p>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors text-sm">
              Conditions d'utilisation
            </Link>
            <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors text-sm">
              Politique de confidentialité
            </Link>
            <Link to="/cookies" className="text-muted-foreground hover:text-primary transition-colors text-sm">
              Cookies
            </Link>
            <a 
              href="mailto:support@studymarket.fr" 
              className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};