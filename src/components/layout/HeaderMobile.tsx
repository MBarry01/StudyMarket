import React, { useState, useCallback, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, User, Plus, Menu, Heart, MessageCircle, Home, Bell, Settings, Sun, Moon
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SearchModal } from '@/components/ui/SearchModal';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from 'next-themes';

interface HeaderMobileProps {
  onOpenPublish: () => void;
}

export const HeaderMobile = memo<HeaderMobileProps>(({ onOpenPublish }) => {
  const { currentUser, userProfile, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');

  const toggleMenu = useCallback(() => setMenuOpen(v => !v), []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
      setMenuOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Fermer le menu au clic extérieur
  React.useEffect(() => {
    if (!menuOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.dropdown-menu') && !target.closest('.menu-btn')) {
        setMenuOpen(false);
      }
    };
    
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [menuOpen]);

  const navigateAndClose = (path: string, tab?: string) => {
    setMenuOpen(false);
    if (tab) setActiveTab(tab);
    navigate(path);
  };

  return (
    <>
      {/* ===== HEADER ULTRA-MINIMALISTE ===== */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#0f1535] border-b border-white/5 md:hidden pt-2 pb-2">
        <div className="h-10 px-2 flex items-center gap-1.5">
          {/* Logo avec graduation cap */}
          <Link
            to="/"
            aria-label="Accueil"
            className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-lg flex items-center justify-center touch-manipulation"
            onClick={() => {
              setMenuOpen(false);
              setActiveTab('home');
            }}
          >
            <span className="text-sm">🎓</span>
          </Link>

          {/* Barre de recherche */}
          <button
            onClick={() => setSearchModalOpen(true)}
            className="flex-1 mx-1 h-7 px-2 bg-white/10 rounded-lg flex items-center gap-1.5 text-left transition-all active:scale-[0.98] touch-manipulation hover:bg-white/15"
          >
            <Search className="w-3 h-3 text-white/50 flex-shrink-0" />
            <span className="text-[10px] text-white/50 truncate">Rechercher...</span>
          </button>

          {/* Bouton Publier (si connecté) */}
          {currentUser && (
            <button
              aria-label="Publier"
              onClick={(e) => {
                e.stopPropagation();
                onOpenPublish();
                setMenuOpen(false);
              }}
              className="flex-shrink-0 w-7 h-7 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center transition-all active:scale-95 touch-manipulation"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
            </button>
          )}

          {/* Bouton Menu */}
          <button
            aria-label="Menu"
            onClick={(e) => {
              e.stopPropagation();
              toggleMenu();
            }}
            className="menu-btn flex-shrink-0 w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center transition-all active:scale-95 active:bg-white/20 touch-manipulation"
          >
            <Menu className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </header>

      {/* ===== MENU DÉROULANT ULTRA-MINIMALISTE ===== */}
      {menuOpen && (
        <div
          className="dropdown-menu fixed top-[3.5rem] right-3 z-50 bg-[#1a1f3a] rounded-2xl p-2 min-w-[220px] shadow-2xl border border-white/8 animate-in fade-in-0 slide-in-from-top-2 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {currentUser ? (
            <>
              {/* Info rapide utilisateur */}
              <div className="px-3 py-2.5 mb-1 flex items-center gap-2.5">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={userProfile?.photoURL} />
                  <AvatarFallback className="text-xs bg-gradient-to-br from-purple-400 to-purple-600">
                    {userProfile?.displayName?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-white/90 truncate">
                    {userProfile?.displayName || 'Utilisateur'}
                  </div>
                </div>
              </div>
              <div className="h-px bg-white/6 my-1.5" />
              
              {/* Toggle thème */}
              <button
                onClick={() => {
                  setTheme(theme === 'dark' ? 'light' : 'dark');
                }}
                className="w-full px-3 py-2.5 rounded-[10px] text-sm text-white/90 hover:bg-white/6 transition-colors text-left flex items-center gap-2.5 touch-manipulation active:scale-95"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-[18px] h-[18px] text-white/70 flex-shrink-0" />
                    <span className="flex-1">Mode clair</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-[18px] h-[18px] text-white/70 flex-shrink-0" />
                    <span className="flex-1">Mode sombre</span>
                  </>
                )}
              </button>
              
              <div className="h-px bg-white/6 my-1.5" />
              
              {/* Actions essentielles */}
              <DropdownItem 
                icon={User} 
                label="Mon profil" 
                onClick={() => navigateAndClose('/profile')} 
              />
              <DropdownItem 
                icon={Bell} 
                label="Notifications" 
                onClick={() => navigateAndClose('/notifications')} 
              />
              
              <div className="h-px bg-white/6 my-1.5" />
              
              <button
                onClick={handleLogout}
                className="w-full px-3 py-2.5 rounded-[10px] text-sm text-red-400 hover:bg-white/6 transition-colors text-left flex items-center gap-2.5 touch-manipulation active:scale-95"
              >
                <svg className="w-[18px] h-[18px] opacity-70" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                </svg>
                Déconnexion
              </button>
            </>
          ) : (
            <>
              {/* Toggle thème pour non connecté */}
              <button
                onClick={() => {
                  setTheme(theme === 'dark' ? 'light' : 'dark');
                }}
                className="w-full px-3 py-2.5 rounded-[10px] text-sm text-white/90 hover:bg-white/6 transition-colors text-left flex items-center gap-2.5 touch-manipulation active:scale-95"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-[18px] h-[18px] text-white/70 flex-shrink-0" />
                    <span className="flex-1">Mode clair</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-[18px] h-[18px] text-white/70 flex-shrink-0" />
                    <span className="flex-1">Mode sombre</span>
                  </>
                )}
              </button>
              
              <div className="h-px bg-white/6 my-1.5" />
              
              <button
                onClick={() => navigateAndClose('/auth')}
                className="w-full px-4 py-3 rounded-[10px] text-sm text-white bg-gradient-to-r from-cyan-500 to-blue-500 font-medium text-center active:scale-95 transition-transform touch-manipulation"
              >
                Se connecter
              </button>
            </>
          )}
        </div>
      )}

      {/* ===== BOTTOM NAVIGATION BAR ===== */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f1535] border-t border-white/5 md:hidden safe-area-inset-bottom">
        <div className="h-16 px-2 flex items-center justify-around">
          {/* Accueil */}
          <NavButton
            icon={Home}
            label="Accueil"
            active={activeTab === 'home'}
            onClick={() => navigateAndClose('/', 'home')}
          />

          {/* Recherche */}
          <NavButton
            icon={Search}
            label="Rechercher"
            active={activeTab === 'search'}
            onClick={() => {
              setSearchModalOpen(true);
              setActiveTab('search');
            }}
          />

          {/* Favoris */}
          <NavButton
            icon={Heart}
            label="Favoris"
            active={activeTab === 'favorites'}
            onClick={() => navigateAndClose('/favorites', 'favorites')}
          />

          {/* Messages */}
          <NavButton
            icon={MessageCircle}
            label="Messages"
            active={activeTab === 'messages'}
            onClick={() => navigateAndClose('/messages', 'messages')}
            badge={currentUser ? 3 : undefined}
          />

          {/* Paramètres */}
          <NavButton
            icon={Settings}
            label="Paramètres"
            active={activeTab === 'settings'}
            onClick={() => {
              if (currentUser) {
                navigateAndClose('/settings', 'settings');
              } else {
                navigateAndClose('/auth', 'settings');
              }
            }}
          />
        </div>
      </nav>

      {/* Search Modal */}
      <SearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />

      {/* Spacer pour le contenu (éviter chevauchement avec bottom nav) */}
      <div className="h-16 md:hidden" />
    </>
  );
});

HeaderMobile.displayName = 'HeaderMobile';

// ===== COMPOSANTS RÉUTILISABLES =====

// Composant DropdownItem
interface DropdownItemProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}

const DropdownItem: React.FC<DropdownItemProps> = ({ icon: Icon, label, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full px-3 py-2.5 rounded-[10px] text-sm text-white/90 hover:bg-white/6 transition-colors text-left flex items-center gap-2.5 active:scale-95 touch-manipulation"
    >
      <Icon className="w-[18px] h-[18px] text-white/70 flex-shrink-0" />
      <span className="flex-1">{label}</span>
    </button>
  );
};

// Composant NavButton pour bottom navigation
interface NavButtonProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick: () => void;
  badge?: number;
}

const NavButton: React.FC<NavButtonProps> = ({ icon: Icon, label, active, onClick, badge }) => {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center min-w-[60px] py-1.5 px-2 relative active:scale-95 transition-transform touch-manipulation"
    >
      <div className="relative">
        <Icon 
          className={`w-6 h-6 transition-colors ${
            active ? 'text-cyan-400' : 'text-white/60'
          }`} 
        />
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </div>
      <span 
        className={`text-[10px] mt-0.5 font-medium transition-colors ${
          active ? 'text-cyan-400' : 'text-white/60'
        }`}
      >
        {label}
      </span>
    </button>
  );
};
