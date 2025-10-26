import React, { useState, useEffect } from 'react';
import { Search, X, TrendingUp, History, Sparkles } from 'lucide-react';
import { Input } from './input';
import { Button } from './button';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Charger les recherches récentes
  useEffect(() => {
    const stored = localStorage.getItem('recentSearches');
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    }
  }, []);

  // Sauvegarder les recherches récentes
  const saveSearch = (query: string) => {
    if (!query.trim()) return;
    
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleSearch = (query: string) => {
    saveSearch(query);
    window.location.href = `/listings?q=${encodeURIComponent(query)}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      handleSearch(searchQuery.trim());
    }
  };

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        const input = document.querySelector('[data-search-input]') as HTMLInputElement;
        input?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Trending searches (placeholder data)
  const trendingSearches = [
    'Livre de cours',
    'MacBook Pro',
    'Colocation',
    'Stage de vacances'
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm animate-in fade-in-0"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[101] md:hidden animate-in slide-in-from-top-4">
        <div className="bg-background h-full flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border flex items-center gap-3 h-14">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <form onSubmit={handleSubmit}>
                <Input
                  data-search-input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 pr-11 h-10 text-base bg-muted/50"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </form>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-9 px-3 text-sm"
            >
              Annuler
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {/* Suggestions de recherche */}
            {searchQuery && (
              <div className="space-y-2 mb-6">
                <div className="px-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Suggestions
                </div>
                <button
                  onClick={() => handleSearch(searchQuery)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted text-left transition-colors"
                >
                  <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="font-medium">{searchQuery}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Rechercher</span>
                </button>
              </div>
            )}

            {/* Recherches récentes */}
            {!searchQuery && recentSearches.length > 0 && (
              <div className="space-y-2 mb-6">
                <div className="flex items-center justify-between px-2 mb-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <History className="w-4 h-4" />
                    Récents
                  </div>
                  <button
                    onClick={() => {
                      setRecentSearches([]);
                      localStorage.removeItem('recentSearches');
                    }}
                    className="text-xs text-primary hover:text-primary/80"
                  >
                    Effacer
                  </button>
                </div>
                {recentSearches.map((search, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSearch(search)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted text-left transition-colors group"
                  >
                    <History className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                    <span className="flex-1 truncate">{search}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Tendances */}
            {!searchQuery && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  <TrendingUp className="w-4 h-4" />
                  Tendances
                </div>
                {trendingSearches.map((trend, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSearch(trend)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted text-left transition-colors group"
                  >
                    <Sparkles className="w-4 h-4 text-primary/60 group-hover:text-primary transition-colors flex-shrink-0" />
                    <span className="flex-1 truncate">{trend}</span>
                    <TrendingUp className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

