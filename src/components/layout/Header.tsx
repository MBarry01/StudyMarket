import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { 
  Search, 
  Plus, 
  MessageCircle, 
  User, 
  Menu, 
  Sun, 
  Moon, 
  LogOut,
  Heart,
  Settings,
  Bell,
  Shield,
  GraduationCap,
  Leaf,
  Bookmark,
  AlertTriangle,
  TrendingUp,
  ShoppingCart,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { useMessageStore } from '../../stores/useMessageStore';
import { useCartStore } from '../../stores/useCartStore';

export const Header: React.FC = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const { conversations, fetchConversations } = useMessageStore();
  const { getCartItemCount } = useCartStore();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Vérifier si l'utilisateur est admin
  const isAdmin = React.useMemo(() => {
    if (!currentUser) return false;
    const envEmails = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map((e: string) => e.trim()).filter(Boolean);
    const envUids = (import.meta.env.VITE_ADMIN_UIDS || '').split(',').map((u: string) => u.trim()).filter(Boolean);
    // Admins configurés (GitHub Secrets + fallback)
    const hardcodedEmails = ['barrymohamadou98@gmail.com', 'mb3186802@gmail.com'];
    const hardcodedUids = ['q8R6wG9lNAOKJnCuUgMFpZFRHKg1'];
    const allowedEmails = [...envEmails, ...hardcodedEmails];
    const allowedUids = [...envUids, ...hardcodedUids];
    return (currentUser.email && allowedEmails.includes(currentUser.email)) || allowedUids.includes(currentUser.uid);
  }, [currentUser]);

  // Calculer le nombre total de messages non lus
  const totalUnreadMessages = React.useMemo(() => {
    if (!currentUser || !conversations.length) return 0;
    
    return conversations.reduce((total, conversation) => {
      const unreadCount = conversation.unreadCount[currentUser.uid] || 0;
      return total + unreadCount;
    }, 0);
  }, [conversations, currentUser]);

  // Charger les conversations au montage du composant
  useEffect(() => {
    if (currentUser) {
      fetchConversations(currentUser.uid);
    }
  }, [currentUser, fetchConversations]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/listings?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const cartItemCount = getCartItemCount();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex h-14 sm:h-16 items-center justify-between gap-2 sm:gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-lg sm:text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                StudyMarket
              </span>
              <div className="text-xs text-muted-foreground -mt-1">
                Étudiants certifiés
              </div>
            </div>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-sm sm:max-w-md lg:max-w-lg mx-2 sm:mx-4">
            <div className="relative">
              <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 sm:pl-10 pr-3 h-9 sm:h-10 text-sm w-full"
              />
            </div>
          </form>

          {/* Navigation */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Theme Toggle - VOTRE VERSION EXACTE */}
            <div
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="relative cursor-pointer text-foreground hover:text-primary transition-colors p-2"
              aria-label="Changer le thème"
            >
              <Sun className="h-4 w-4 sm:h-5 sm:w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute top-2 left-2 h-4 w-4 sm:h-5 sm:w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </div>

            {currentUser ? (
              <>
                {/* Create Listing Button */}
                <Button asChild className="hidden md:flex bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 h-8 sm:h-9 text-xs sm:text-sm">
                  <Link to="/create">
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden lg:inline">Publier</span>
                  </Link>
                </Button>

                {/* Cart */}
                <div className="relative hidden sm:block">
                  <Button variant="ghost" size="icon" asChild className="h-8 w-8 sm:h-9 sm:w-9">
                    <Link to="/cart">
                      <ShoppingCart className="w-4 h-4" />
                    </Link>
                  </Button>
                  {cartItemCount > 0 && (
                    <Badge 
                      className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-[16px] h-4 flex items-center justify-center px-1 rounded-full border-2 border-background"
                    >
                      {cartItemCount > 99 ? '99+' : cartItemCount}
                    </Badge>
                  )}
                </div>

                {/* Notifications */}
                <Button variant="ghost" size="icon" asChild className="hidden sm:flex h-8 w-8 sm:h-9 sm:w-9">
                  <Link to="/saved-searches">
                    <Bell className="w-4 h-4" />
                  </Link>
                </Button>

                {/* Messages avec badge de notification */}
                <div className="relative hidden sm:block">
                  <Button variant="ghost" size="icon" asChild className="h-8 w-8 sm:h-9 sm:w-9">
                    <Link to="/messages">
                      <MessageCircle className="w-4 h-4" />
                    </Link>
                  </Button>
                  {totalUnreadMessages > 0 && (
                    <Badge 
                      className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-[16px] h-4 flex items-center justify-center px-1 rounded-full border-2 border-background"
                    >
                      {totalUnreadMessages > 99 ? '99+' : totalUnreadMessages}
                    </Badge>
                  )}
                </div>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full p-0">
                      <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                        <AvatarImage src={userProfile?.photoURL} />
                        <AvatarFallback className="text-xs sm:text-sm">
                          {userProfile?.displayName?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      {userProfile?.isVerified && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <Shield className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-white" />
                        </div>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64" align="end">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{userProfile?.displayName}</p>
                          {userProfile?.isVerified && (
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                              <Shield className="w-3 h-3 mr-1" />
                              Vérifié
                            </Badge>
                          )}
                        </div>
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {userProfile?.university}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Leaf className="w-3 h-3 text-green-600" />
                          <span>{userProfile?.co2Saved || 0} kg CO₂ économisés</span>
                        </div>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    
                    {/* Admin Dashboard (si admin) */}
                    {isAdmin && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/admin" className="cursor-pointer bg-gradient-to-r from-primary/10 to-secondary/10">
                            <Shield className="w-4 h-4 mr-2 text-primary" />
                            <span className="font-semibold text-primary">Administration</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    
                    {/* Profil et compte */}
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer">
                        <User className="w-4 h-4 mr-2" />
                        Mon profil
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="cursor-pointer">
                        <Settings className="w-4 h-4 mr-2" />
                        Paramètres
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    {/* Commandes et achats */}
                    <DropdownMenuItem asChild>
                      <Link to="/orders" className="cursor-pointer">
                        <Package className="w-4 h-4 mr-2" />
                        Mes commandes
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                      <Link to="/sales" className="cursor-pointer">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Mes ventes
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                      <Link to="/payments" className="cursor-pointer">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Paiements
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    {/* Favoris et recherches */}
                    <DropdownMenuItem asChild>
                      <Link to="/favorites" className="cursor-pointer">
                        <Heart className="w-4 h-4 mr-2" />
                        Mes favoris
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                      <Link to="/saved-searches" className="cursor-pointer">
                        <Bookmark className="w-4 h-4 mr-2" />
                        Alertes sauvegardées
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    {/* Messages et notifications */}
                    <DropdownMenuItem asChild>
                      <Link to="/messages" className="cursor-pointer relative">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Messages
                        {totalUnreadMessages > 0 && (
                          <Badge className="ml-auto bg-red-500 text-white text-xs min-w-[16px] h-4 flex items-center justify-center px-1">
                            {totalUnreadMessages > 99 ? '99+' : totalUnreadMessages}
                          </Badge>
                        )}
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    {/* Impact et statistiques */}
                    <DropdownMenuItem asChild>
                      <Link to="/impact" className="cursor-pointer">
                        <Leaf className="w-4 h-4 mr-2" />
                        Mon impact écologique
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    {/* Aide et support */}
                    <DropdownMenuItem asChild>
                      <Link to="/help" className="cursor-pointer">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Aide & Support
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                      <Link to="/safety" className="cursor-pointer">
                        <Shield className="w-4 h-4 mr-2" />
                        Conseils de sécurité
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      className="cursor-pointer text-destructive"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Se déconnecter
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Mobile Create Button */}
                <Button size="icon" asChild className="md:hidden bg-gradient-to-r from-primary to-secondary h-8 w-8">
                  <Link to="/create">
                    <Plus className="w-4 h-4" />
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild className="hidden sm:flex h-8 sm:h-9 text-xs sm:text-sm">
                  <Link to="/auth">Se connecter</Link>
                </Button>
                <Button asChild className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-4">
                  <Link to="/auth">
                    <span className="hidden sm:inline">Rejoindre</span>
                    <span className="sm:hidden">Connexion</span>
                  </Link>
                </Button>
              </>
            )}

                         {/* Mobile Menu */}
             <DropdownMenu>
               <DropdownMenuTrigger asChild className="sm:hidden">
               <Button 
  className="p-2 text-foreground hover:text-primary transition-colors sm:hidden"
  aria-label="Menu mobile"
>
  <Menu className="w-4 h-4" />
</Button>
               </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                {/* Theme Toggle dans le menu mobile */}
                <DropdownMenuItem 
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="cursor-pointer"
                >
                  <div className="relative mr-2">
                    <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute top-0 left-0 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  </div>
                  Changer le thème
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem asChild>
                  <Link to="/listings" className="cursor-pointer">
                    Toutes les annonces
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/listings?transactionType=donation" className="cursor-pointer">
                    Dons entre étudiants
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/listings?transactionType=exchange" className="cursor-pointer">
                    Troc & Échanges
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/listings?category=services" className="cursor-pointer">
                    Services étudiants
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/housing" className="cursor-pointer">
                    Logement & Colocation
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/products" className="cursor-pointer">
                    Boutique
                  </Link>
                </DropdownMenuItem>
                {currentUser && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/create" className="cursor-pointer">
                        <Plus className="w-4 h-4 mr-2" />
                        Publier une annonce
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/cart" className="cursor-pointer relative">
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Panier
                        {cartItemCount > 0 && (
                          <Badge className="ml-auto bg-red-500 text-white text-xs min-w-[16px] h-4 flex items-center justify-center px-1">
                            {cartItemCount > 99 ? '99+' : cartItemCount}
                          </Badge>
                        )}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/messages" className="cursor-pointer relative">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Messages
                        {totalUnreadMessages > 0 && (
                          <Badge className="ml-auto bg-red-500 text-white text-xs min-w-[16px] h-4 flex items-center justify-center px-1">
                            {totalUnreadMessages > 99 ? '99+' : totalUnreadMessages}
                          </Badge>
                        )}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/favorites" className="cursor-pointer">
                        <Heart className="w-4 h-4 mr-2" />
                        Mes favoris
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                {!currentUser && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/auth" className="cursor-pointer">
                        <User className="w-4 h-4 mr-2" />
                        Se connecter
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};