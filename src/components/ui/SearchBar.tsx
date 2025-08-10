import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from './input';
import { Button } from './button';
import { useNavigate } from 'react-router-dom';

export const SearchBar: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/listings?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto">
      <div className="relative flex items-center">
        <Search className="absolute left-3 text-muted-foreground w-4 h-4" />
        <Input
          type="text"
          placeholder="Rechercher des annonces, services, logements..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-24 h-12 text-base"
        />
        <Button 
          type="submit" 
          className="absolute right-1 h-10 px-4 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
        >
          Rechercher
        </Button>
      </div>
    </form>
  );
};
