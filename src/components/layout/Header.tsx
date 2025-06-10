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
  Award,
  MapPin,
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
  const { cart, getCartItemCount } = useCartStore();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

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
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <span className="font-bold text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              StudyMarket
            </span>
            <div className="text-xs text-muted-foreground -mt-1">
              Étudiants certifiés
            </div>
          </div>
        </Link>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-lg mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher entre étudiants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </form>

        {/* Navigation */}
        <div className="flex items-center space-x-2">
          {/* Theme Toggle */}
          <div
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="relative cursor-pointer text-foreground hover:text-primary transition-colors"
            aria-label="Changer le thème"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute top-0 left-0 h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </div>

          {currentUser ? (
            <>
              {/* Create Listing Button */}
              <Button asChild className="hidden sm:flex bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90">
                <Link to="/create">
                  <Plus className="w-4 h-4 mr-2" />
                  Publier
                </Link>
              </Button>

              {/* Cart */}
              <div className="relative hidden sm:block">
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/cart">
                    <ShoppingCart className="w-4 h-4" />
                  </Link>
                </Button>
                {cartItemCount > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full border-2 border-background"
                  >
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </Badge>
                )}
              </div>

              {/* Notifications */}
              <Button variant="ghost" size="icon" asChild>
                <Link to="/saved-searches">
                  <Bell className="w-4 h-4" />
                </Link>
              </Button>

              {/* Messages avec badge de notification */}
              <div className="relative hidden sm:block">
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/messages">
                    <MessageCircle className="w-4 h-4" />
                  </Link>
                </Button>
                {totalUnreadMessages > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full border-2 border-background"
                  >
                    {totalUnreadMessages > 99 ? '99+' : totalUnreadMessages}
                  </Badge>
                )}
              </div>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={userProfile?.photoURL} />
                      <AvatarFallback>
                        {userProfile?.displayName?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    {userProfile?.isVerified && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <Shield className="w-2 h-2 text-white" />
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
              <Button size="icon" asChild className="sm:hidden bg-gradient-to-r from-primary to-secondary">
                <Link to="/create">
                  <Plus className="w-4 h-4" />
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/auth">Se connecter</Link>
              </Button>
              <Button asChild className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90">
                <Link to="/auth">Rejoindre</Link>
              </Button>
            </>
          )}

          {/* Mobile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="sm:hidden">
              <Button className="p-2 text-foreground hover:text-primary transition-colors"
      aria-label="Menu">
        <Menu className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
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
                <Link to="/listings?category=housing" className="cursor-pointer">
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
                      <ShoppingCart className="w-4 h-4 mr-2 " />
                      Panier
                      {cartItemCount > 0 && (
                        <Badge className="ml-auto bg-red-500 text-white text-xs min-w-[16px] h-4 flex items-center justify-center px-1 ">
                          {cartItemCount}
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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};