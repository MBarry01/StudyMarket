import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Database, Loader2 } from 'lucide-react';
import { populateDatabase } from '../../utils/populateData';

export const PopulateDataButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handlePopulate = async () => {
    if (window.confirm('Voulez-vous ajouter des données d\'exemple à la base de données ? Cela ajoutera des utilisateurs et des annonces de test.')) {
      setIsLoading(true);
      try {
        await populateDatabase();
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Button
      onClick={handlePopulate}
      disabled={isLoading}
      variant="outline"
      className="fixed bottom-4 right-4 z-50 bg-background border-2 border-primary/20 hover:border-primary/40 shadow-lg"
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Database className="w-4 h-4 mr-2" />
      )}
      {isLoading ? 'Ajout en cours...' : 'Ajouter données test'}
    </Button>
  );
};