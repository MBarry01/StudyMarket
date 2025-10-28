import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, Home, ChevronLeft } from 'lucide-react';
import { Button } from './button';

interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  maxItems?: number;
  showHome?: boolean;
  showBackButton?: boolean; // iOS/Android convention
}

const defaultBreadcrumbs: Record<string, BreadcrumbItem[]> = {
  '/listings': [
    { label: 'Accueil', to: '/' },
    { label: 'Annonces' }
  ],
  '/listing/:id': [
    { label: 'Accueil', to: '/' },
    { label: 'Annonces', to: '/listings' },
    { label: 'Détail' }
  ],
  '/create': [
    { label: 'Accueil', to: '/' },
    { label: 'Créer une annonce' }
  ],
  '/messages': [
    { label: 'Accueil', to: '/' },
    { label: 'Messages' }
  ],
  '/favorites': [
    { label: 'Accueil', to: '/' },
    { label: 'Favoris' }
  ],
  '/profile': [
    { label: 'Accueil', to: '/' },
    { label: 'Profil' }
  ],
  '/admin': [
    { label: 'Accueil', to: '/' },
    { label: 'Admin' }
  ],
  '/checkout': [
    { label: 'Accueil', to: '/' },
    { label: 'Panier', to: '/cart' },
    { label: 'Paiement' }
  ],
  '/cart': [
    { label: 'Accueil', to: '/' },
    { label: 'Panier' }
  ],
};

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  maxItems = 4,
  showHome = true,
  showBackButton = true,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Get breadcrumb items based on location or custom items
  const getBreadcrumbItems = (): BreadcrumbItem[] => {
    if (items) return items;
    
    // Try to match route pattern
    const matchedPattern = Object.keys(defaultBreadcrumbs).find(pattern => {
      if (pattern === location.pathname) return true;
      
      // Handle dynamic routes (e.g., /listing/:id)
      const patternParts = pattern.split('/');
      const pathParts = location.pathname.split('/');
      
      if (patternParts.length !== pathParts.length) return false;
      
      return patternParts.every((part, i) => 
        part === pathParts[i] || part.startsWith(':')
      );
    });
    
    return matchedPattern ? defaultBreadcrumbs[matchedPattern] : [];
  };

  const breadcrumbItems = getBreadcrumbItems();
  
  // iOS/Android convention: On mobile, show only last 2 items if too many
  // On desktop, show up to maxItems
  const shouldTruncate = breadcrumbItems.length > maxItems;
  const visibleItems = shouldTruncate && isMobile
    ? [
        breadcrumbItems[0], // Always show first (Home)
        { label: '...', to: undefined },
        ...breadcrumbItems.slice(-2) // Last 2 items
      ]
    : shouldTruncate
    ? breadcrumbItems.slice(0, maxItems - 1).concat([
        { label: '...', to: undefined },
        ...breadcrumbItems.slice(-1)
      ])
    : breadcrumbItems;

  const handleBack = () => {
    if (breadcrumbItems.length > 1 && breadcrumbItems[breadcrumbItems.length - 2]?.to) {
      navigate(breadcrumbItems[breadcrumbItems.length - 2].to!);
    } else {
      navigate(-1);
    }
  };

  return (
    <nav 
      className="border-b border-border bg-muted/30 mt-6"
      aria-label="Breadcrumb"
    >
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center gap-2 sm:gap-4 py-2 sm:py-3">
          {/* iOS/Android Back Button */}
          {showBackButton && isMobile && breadcrumbItems.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="flex-shrink-0 h-8 w-8 sm:h-9 sm:w-9 -ml-1 sm:ml-0"
              aria-label="Retour"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}

          {/* Breadcrumb Links */}
          <ol className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-hide flex-1">
            {showHome && visibleItems[0]?.to !== '/' && (
              <>
                <li>
                  <Link
                    to="/"
                    className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md px-1.5 py-1 hover:bg-muted/50"
                  >
                    <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </Link>
                </li>
                {visibleItems.length > 0 && (
                  <li className="flex items-center text-muted-foreground flex-shrink-0">
                    <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                  </li>
                )}
              </>
            )}
            
            {visibleItems.map((item, index) => {
              const isLast = index === visibleItems.length - 1;
              const isEllipsis = item.label === '...';
              
              return (
                <React.Fragment key={index}>
                  <li>
                    {item.to && !isLast && !isEllipsis ? (
                      <Link
                        to={item.to}
                        className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors hover:underline rounded-md px-1.5 py-1 hover:bg-muted/50 truncate max-w-[150px] sm:max-w-[200px]"
                        aria-current={isLast ? 'page' : undefined}
                      >
                        {item.label}
                      </Link>
                    ) : isEllipsis ? (
                      <span className="text-xs sm:text-sm text-muted-foreground px-1">
                        ...
                      </span>
                    ) : (
                      <span 
                        className="text-xs sm:text-sm text-foreground font-medium truncate max-w-[150px] sm:max-w-none px-1.5"
                        aria-current="page"
                      >
                        {item.label}
                      </span>
                    )}
                  </li>
                  {!isLast && (
                    <li className="flex items-center text-muted-foreground flex-shrink-0">
                      <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                    </li>
                  )}
                </React.Fragment>
              );
            })}
          </ol>
        </div>
      </div>
      
      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </nav>
  );
};
