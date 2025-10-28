import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Leaf, 
  TrendingUp, 
  Award, 
  Recycle,
  TreePine,
  Droplets,
  Zap,
  Car,
  Factory,
  Globe,
  Calendar,
  BarChart3,
  Target,
  Share2,
  Download,
  Info,
  Sparkles,
  Heart,
  Users,
  Gift,
  RefreshCw,
  Package,
  Smartphone,
  BookOpen,
  Home,
  Shirt
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc,
  addDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Listing } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

// Types pour l'impact environnemental
interface EnvironmentalData {
  totalCo2Saved: number;
  totalWaterSaved: number;
  totalEnergySaved: number;
  totalWasteAvoided: number;
  transactionsByCategory: Record<string, number>;
  monthlyImpact: {
    month: string;
    co2Saved: number;
    transactions: number;
    waterSaved: number;
    energySaved: number;
  }[];
  badges: string[];
  rank: string;
  percentile: number;
}

interface CategoryImpact {
  category: string;
  icon: React.ComponentType<any>;
  color: string;
  co2PerItem: number;
  waterPerItem: number;
  energyPerItem: number;
  wastePerItem: number;
  description: string;
}

// Données d'impact par catégorie (basées sur des études réelles)
const CATEGORY_IMPACTS: Record<string, CategoryImpact> = {
  electronics: {
    category: 'Électronique',
    icon: Smartphone,
    color: 'text-blue-600',
    co2PerItem: 85, // kg CO2 par appareil électronique
    waterPerItem: 1200, // litres d'eau
    energyPerItem: 450, // kWh
    wastePerItem: 2.5, // kg de déchets évités
    description: 'Smartphones, ordinateurs, accessoires tech'
  },
  books: {
    category: 'Livres & Cours',
    icon: BookOpen,
    color: 'text-green-600',
    co2PerItem: 8.5, // kg CO2 par livre
    waterPerItem: 85, // litres d'eau
    energyPerItem: 12, // kWh
    wastePerItem: 0.8, // kg de déchets évités
    description: 'Manuels, livres, notes de cours'
  },
  furniture: {
    category: 'Mobilier',
    icon: Home,
    color: 'text-purple-600',
    co2PerItem: 45, // kg CO2 par meuble
    waterPerItem: 350, // litres d'eau
    energyPerItem: 180, // kWh
    wastePerItem: 15, // kg de déchets évités
    description: 'Meubles, déco, électroménager'
  },
  clothing: {
    category: 'Vêtements',
    icon: Shirt,
    color: 'text-pink-600',
    co2PerItem: 22, // kg CO2 par vêtement
    waterPerItem: 2700, // litres d'eau (très élevé pour le textile)
    energyPerItem: 35, // kWh
    wastePerItem: 0.5, // kg de déchets évités
    description: 'Vêtements, chaussures, accessoires'
  }
};

// Badges écologiques
const ECO_BADGES = [
  { id: 'first_transaction', name: 'Premier Pas', icon: '🌱', threshold: 1, description: 'Première transaction écologique' },
  { id: 'co2_saver_10', name: 'Éco-Warrior', icon: '🌍', threshold: 10, description: '10 kg CO₂ économisés' },
  { id: 'co2_saver_50', name: 'Planète Protecteur', icon: '🛡️', threshold: 50, description: '50 kg CO₂ économisés' },
  { id: 'co2_saver_100', name: 'Héros Climatique', icon: '🦸', threshold: 100, description: '100 kg CO₂ économisés' },
  { id: 'water_saver', name: 'Gardien de l\'Eau', icon: '💧', threshold: 1000, description: '1000L d\'eau économisés' },
  { id: 'recycling_master', name: 'Maître du Recyclage', icon: '♻️', threshold: 20, description: '20 transactions de seconde main' },
  { id: 'donation_hero', name: 'Ange du Don', icon: '😇', threshold: 5, description: '5 dons gratuits' },
  { id: 'monthly_champion', name: 'Champion Mensuel', icon: '🏆', threshold: 10, description: '10 transactions en un mois' }
];

// Helper function to safely convert dates
const safeToDate = (date: any): Date => {
  if (!date) return new Date();
  
  if (date instanceof Date) return date;
  
  if (date && typeof date.toDate === 'function') {
    try {
      return date.toDate();
    } catch (error) {
      return new Date();
    }
  }
  
  if (typeof date === 'string' || typeof date === 'number') {
    const parsedDate = new Date(date);
    return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  }
  
  if (date && typeof date === 'object' && date.seconds) {
    return new Date(date.seconds * 1000);
  }
  
  return new Date();
};

export const EnvironmentalImpactPage: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [environmentalData, setEnvironmentalData] = useState<EnvironmentalData>({
    totalCo2Saved: 0,
    totalWaterSaved: 0,
    totalEnergySaved: 0,
    totalWasteAvoided: 0,
    transactionsByCategory: {},
    monthlyImpact: [],
    badges: [],
    rank: 'Débutant',
    percentile: 0
  });
  const [userTransactions, setUserTransactions] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'year' | 'all'>('all');

  useEffect(() => {
    if (currentUser) {
      loadEnvironmentalData();
    }
  }, [currentUser, selectedPeriod]);

  const loadEnvironmentalData = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      // Charger toutes les transactions de l'utilisateur
      const transactionsQuery = query(
        collection(db, 'listings'),
        where('sellerId', '==', currentUser.uid)
      );
      
      const transactionsSnapshot = await getDocs(transactionsQuery);
      const transactions: Listing[] = [];
      
      transactionsSnapshot.forEach((doc) => {
        const data = doc.data();
        transactions.push({
          id: doc.id,
          ...data,
          createdAt: safeToDate(data.createdAt),
          updatedAt: safeToDate(data.updatedAt)
        } as Listing);
      });

      setUserTransactions(transactions);

      // Calculer l'impact environnemental
      const impact = calculateEnvironmentalImpact(transactions, selectedPeriod);
      setEnvironmentalData(impact);

      // Mettre à jour le profil utilisateur avec les nouvelles données
      await updateUserEnvironmentalData(impact);

    } catch (error) {
      console.error('Erreur lors du chargement des données environnementales:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateEnvironmentalImpact = (transactions: Listing[], period: 'month' | 'year' | 'all'): EnvironmentalData => {
    const now = new Date();
    let filteredTransactions = transactions;

    // Filtrer par période
    if (period === 'month') {
      const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      filteredTransactions = transactions.filter(t => safeToDate(t.createdAt) >= oneMonthAgo);
    } else if (period === 'year') {
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      filteredTransactions = transactions.filter(t => safeToDate(t.createdAt) >= oneYearAgo);
    }

    // Calculer l'impact total
    let totalCo2Saved = 0;
    let totalWaterSaved = 0;
    let totalEnergySaved = 0;
    let totalWasteAvoided = 0;
    const transactionsByCategory: Record<string, number> = {};

    filteredTransactions.forEach(transaction => {
      const categoryImpact = CATEGORY_IMPACTS[transaction.category] || CATEGORY_IMPACTS.electronics;
      
      // Multiplier par la quantité (par défaut 1)
      const quantity = 1;
      
      // Facteur de réduction selon le type de transaction
      let impactFactor = 1;
      if (transaction.transactionType === 'donation') {
        impactFactor = 1.2; // Les dons ont un impact plus important
      } else if (transaction.transactionType === 'exchange') {
        impactFactor = 0.8; // Les échanges ont un impact moindre
      }

      totalCo2Saved += categoryImpact.co2PerItem * quantity * impactFactor;
      totalWaterSaved += categoryImpact.waterPerItem * quantity * impactFactor;
      totalEnergySaved += categoryImpact.energyPerItem * quantity * impactFactor;
      totalWasteAvoided += categoryImpact.wastePerItem * quantity * impactFactor;

      transactionsByCategory[transaction.category] = (transactionsByCategory[transaction.category] || 0) + 1;
    });

    // Calculer l'impact mensuel (derniers 12 mois)
    const monthlyImpact = calculateMonthlyImpact(transactions);

    // Calculer les badges
    const badges = calculateBadges(transactions, totalCo2Saved, totalWaterSaved);

    // Calculer le rang et percentile
    const { rank, percentile } = calculateRankAndPercentile(totalCo2Saved, transactions.length);

    return {
      totalCo2Saved: Math.round(totalCo2Saved * 10) / 10,
      totalWaterSaved: Math.round(totalWaterSaved),
      totalEnergySaved: Math.round(totalEnergySaved * 10) / 10,
      totalWasteAvoided: Math.round(totalWasteAvoided * 10) / 10,
      transactionsByCategory,
      monthlyImpact,
      badges,
      rank,
      percentile
    };
  };

  const calculateMonthlyImpact = (transactions: Listing[]) => {
    const monthlyData: Record<string, { co2Saved: number; transactions: number; waterSaved: number; energySaved: number }> = {};
    
    // Initialiser les 12 derniers mois
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM
      monthlyData[monthKey] = { co2Saved: 0, transactions: 0, waterSaved: 0, energySaved: 0 };
    }

    // Calculer l'impact pour chaque transaction
    transactions.forEach(transaction => {
      const transactionDate = safeToDate(transaction.createdAt);
      const monthKey = transactionDate.toISOString().slice(0, 7);
      if (monthlyData[monthKey]) {
        const categoryImpact = CATEGORY_IMPACTS[transaction.category] || CATEGORY_IMPACTS.electronics;
        
        let impactFactor = 1;
        if (transaction.transactionType === 'donation') impactFactor = 1.2;
        else if (transaction.transactionType === 'exchange') impactFactor = 0.8;

        monthlyData[monthKey].co2Saved += categoryImpact.co2PerItem * impactFactor;
        monthlyData[monthKey].waterSaved += categoryImpact.waterPerItem * impactFactor;
        monthlyData[monthKey].energySaved += categoryImpact.energyPerItem * impactFactor;
        monthlyData[monthKey].transactions += 1;
      }
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      co2Saved: Math.round(data.co2Saved * 10) / 10,
      transactions: data.transactions,
      waterSaved: Math.round(data.waterSaved),
      energySaved: Math.round(data.energySaved * 10) / 10
    }));
  };

  const calculateBadges = (transactions: Listing[], totalCo2: number, totalWater: number): string[] => {
    const badges: string[] = [];
    
    // Badge première transaction
    if (transactions.length >= 1) badges.push('first_transaction');
    
    // Badges CO2
    if (totalCo2 >= 10) badges.push('co2_saver_10');
    if (totalCo2 >= 50) badges.push('co2_saver_50');
    if (totalCo2 >= 100) badges.push('co2_saver_100');
    
    // Badge eau
    if (totalWater >= 1000) badges.push('water_saver');
    
    // Badge recyclage
    if (transactions.length >= 20) badges.push('recycling_master');
    
    // Badge dons
    const donations = transactions.filter(t => t.transactionType === 'donation');
    if (donations.length >= 5) badges.push('donation_hero');
    
    // Badge champion mensuel
    const thisMonth = new Date().toISOString().slice(0, 7);
    const thisMonthTransactions = transactions.filter(t => 
      safeToDate(t.createdAt).toISOString().slice(0, 7) === thisMonth
    );
    if (thisMonthTransactions.length >= 10) badges.push('monthly_champion');
    
    return badges;
  };

  const calculateRankAndPercentile = (totalCo2: number, transactionCount: number) => {
    // Système de rang basé sur le CO2 économisé
    let rank = 'Débutant';
    let percentile = 0;

    if (totalCo2 >= 200) {
      rank = 'Légende Écologique';
      percentile = 95;
    } else if (totalCo2 >= 100) {
      rank = 'Maître Environnemental';
      percentile = 85;
    } else if (totalCo2 >= 50) {
      rank = 'Expert Vert';
      percentile = 70;
    } else if (totalCo2 >= 25) {
      rank = 'Éco-Warrior';
      percentile = 50;
    } else if (totalCo2 >= 10) {
      rank = 'Protecteur';
      percentile = 30;
    } else if (totalCo2 >= 5) {
      rank = 'Apprenti Vert';
      percentile = 15;
    }

    return { rank, percentile };
  };

  const updateUserEnvironmentalData = async (impact: EnvironmentalData) => {
    if (!currentUser) return;

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        co2Saved: impact.totalCo2Saved,
        environmentalRank: impact.rank,
        environmentalBadges: impact.badges,
        lastEnvironmentalUpdate: new Date()
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour des données environnementales:', error);
    }
  };

  const shareImpact = async () => {
    const shareText = `🌍 Mon impact écologique sur StudyMarket :\n\n` +
      `🌱 ${environmentalData.totalCo2Saved} kg CO₂ économisés\n` +
      `💧 ${environmentalData.totalWaterSaved} L d'eau préservés\n` +
      `⚡ ${environmentalData.totalEnergySaved} kWh d'énergie économisés\n` +
      `🏆 Rang : ${environmentalData.rank}\n\n` +
      `Rejoignez la communauté étudiante éco-responsable ! 🎓`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mon Impact Écologique - StudyMarket',
          text: shareText,
          url: window.location.origin
        });
      } catch (error) {
        navigator.clipboard.writeText(shareText);
      }
    } else {
      navigator.clipboard.writeText(shareText);
    }
  };

  const exportData = () => {
    const exportData = {
      user: userProfile?.displayName,
      date: new Date().toISOString(),
      impact: environmentalData,
      transactions: userTransactions.length,
      period: selectedPeriod
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `impact-ecologique-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <Leaf className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Connectez-vous pour voir votre impact</h2>
            <p className="text-muted-foreground">
              Découvrez combien vous contribuez à la protection de l'environnement
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* En-tête avec titre et actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Leaf className="w-8 h-8 text-green-600" />
            Mon Impact Écologique
          </h1>
          <p className="text-muted-foreground mt-1">
            Découvrez votre contribution à la protection de l'environnement
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={shareImpact} className="flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Partager
          </Button>
          <Button variant="outline" onClick={exportData} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Sélecteur de période */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">Période d'analyse :</span>
            </div>
            <div className="flex gap-2">
              {[
                { key: 'month', label: 'Ce mois' },
                { key: 'year', label: 'Cette année' },
                { key: 'all', label: 'Tout' }
              ].map(period => (
                <Button
                  key={period.key}
                  variant={selectedPeriod === period.key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPeriod(period.key as any)}
                >
                  {period.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Cartes de statistiques principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-green-700">
                      {environmentalData.totalCo2Saved}
                    </p>
                    <p className="text-sm text-green-600">kg CO₂ économisés</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Leaf className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-2 text-xs text-green-600">
                  ≈ {Math.round(environmentalData.totalCo2Saved / 2.3)} km en voiture évités
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-blue-700">
                      {environmentalData.totalWaterSaved.toLocaleString()}
                    </p>
                    <p className="text-sm text-blue-600">L d'eau préservés</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Droplets className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-2 text-xs text-blue-600">
                  ≈ {Math.round(environmentalData.totalWaterSaved / 150)} douches économisées
                </div>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 bg-yellow-50/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-yellow-700">
                      {environmentalData.totalEnergySaved}
                    </p>
                    <p className="text-sm text-yellow-600">kWh économisés</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Zap className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
                <div className="mt-2 text-xs text-yellow-600">
                  ≈ {Math.round(environmentalData.totalEnergySaved / 3.5)} jours d'électricité
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-purple-700">
                      {environmentalData.totalWasteAvoided}
                    </p>
                    <p className="text-sm text-purple-600">kg déchets évités</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Recycle className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-2 text-xs text-purple-600">
                  ≈ {Math.round(environmentalData.totalWasteAvoided / 0.5)} sacs poubelle évités
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rang et progression */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-600" />
                Votre Rang Écologique
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-primary">{environmentalData.rank}</h3>
                  <p className="text-muted-foreground">
                    Vous êtes dans le top {100 - environmentalData.percentile}% des utilisateurs
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl">🏆</div>
                  <p className="text-sm text-muted-foreground">Rang actuel</p>
                </div>
              </div>
              <Progress value={environmentalData.percentile} className="h-3" />
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>Débutant</span>
                <span>Légende Écologique</span>
              </div>
            </CardContent>
          </Card>

          {/* Onglets détaillés */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 p-0 gap-0 items-center h-10">
              <TabsTrigger value="overview" className="flex items-center gap-1 text-xs sm:text-sm rounded-l-lg rounded-r-none h-10">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="categories" className="flex items-center gap-1 text-xs sm:text-sm rounded-none h-10">Par catégorie</TabsTrigger>
              <TabsTrigger value="badges" className="flex items-center gap-1 text-xs sm:text-sm rounded-none h-10">Badges</TabsTrigger>
              <TabsTrigger value="methodology" className="flex items-center gap-1 text-xs sm:text-sm rounded-r-lg rounded-l-none h-10">Méthodologie</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Graphique mensuel */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Évolution Mensuelle
                  </CardTitle>
                  <CardDescription>
                    Votre impact environnemental au cours des 12 derniers mois
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {environmentalData.monthlyImpact.slice(-6).map((month, index) => (
                      <div key={month.month} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-green-500 rounded-full" />
                          <span className="font-medium">
                            {new Date(month.month + '-01').toLocaleDateString('fr-FR', { 
                              month: 'long', 
                              year: 'numeric' 
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <div className="font-semibold text-green-600">{month.co2Saved} kg</div>
                            <div className="text-muted-foreground">CO₂</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-blue-600">{month.waterSaved} L</div>
                            <div className="text-muted-foreground">Eau</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-primary">{month.transactions}</div>
                            <div className="text-muted-foreground">Transactions</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Comparaisons équivalentes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Équivalences Concrètes
                  </CardTitle>
                  <CardDescription>
                    Votre impact traduit en équivalences du quotidien
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                      <Car className="w-8 h-8 text-green-600" />
                      <div>
                        <div className="font-semibold">
                          {Math.round(environmentalData.totalCo2Saved / 2.3)} km
                        </div>
                        <div className="text-sm text-muted-foreground">
                          de trajet en voiture évités
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                      <TreePine className="w-8 h-8 text-blue-600" />
                      <div>
                        <div className="font-semibold">
                          {Math.round(environmentalData.totalCo2Saved / 22)} arbres
                        </div>
                        <div className="text-sm text-muted-foreground">
                          plantés (équivalent CO₂)
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg">
                      <Factory className="w-8 h-8 text-yellow-600" />
                      <div>
                        <div className="font-semibold">
                          {Math.round(environmentalData.totalEnergySaved / 24)} jours
                        </div>
                        <div className="text-sm text-muted-foreground">
                          de consommation électrique
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                      <Droplets className="w-8 h-8 text-purple-600" />
                      <div>
                        <div className="font-semibold">
                          {Math.round(environmentalData.totalWaterSaved / 150)} douches
                        </div>
                        <div className="text-sm text-muted-foreground">
                          de 10 minutes économisées
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="categories" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Impact par Catégorie
                  </CardTitle>
                  <CardDescription>
                    Détail de votre impact selon les types d'objets échangés
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(environmentalData.transactionsByCategory).map(([category, count]) => {
                      const categoryData = CATEGORY_IMPACTS[category] || CATEGORY_IMPACTS.electronics;
                      const CategoryIcon = categoryData.icon;
                      const totalCo2 = count * categoryData.co2PerItem;
                      
                      return (
                        <div key={category} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full bg-muted flex items-center justify-center`}>
                              <CategoryIcon className={`w-5 h-5 ${categoryData.color}`} />
                            </div>
                            <div>
                              <h3 className="font-semibold">{categoryData.category}</h3>
                              <p className="text-sm text-muted-foreground">
                                {count} transaction{count > 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-green-600">
                              {Math.round(totalCo2 * 10) / 10} kg CO₂
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {Math.round(count * categoryData.waterPerItem)} L eau
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="badges" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Badges Écologiques
                  </CardTitle>
                  <CardDescription>
                    Vos récompenses pour votre engagement environnemental
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ECO_BADGES.map(badge => {
                      const isEarned = environmentalData.badges.includes(badge.id);
                      return (
                        <div
                          key={badge.id}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            isEarned 
                              ? 'border-green-200 bg-green-50' 
                              : 'border-gray-200 bg-gray-50 opacity-60'
                          }`}
                        >
                          <div className="text-center">
                            <div className="text-3xl mb-2">{badge.icon}</div>
                            <h3 className={`font-semibold ${isEarned ? 'text-green-800' : 'text-gray-600'}`}>
                              {badge.name}
                            </h3>
                            <p className={`text-sm ${isEarned ? 'text-green-600' : 'text-gray-500'}`}>
                              {badge.description}
                            </p>
                            {isEarned && (
                              <Badge className="mt-2 bg-green-100 text-green-800">
                                Obtenu !
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="methodology" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    Méthodologie de Calcul
                  </CardTitle>
                  <CardDescription>
                    Comment nous calculons votre impact environnemental
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Nos calculs sont basés sur des études scientifiques et des données de l'ADEME (Agence de l'Environnement et de la Maîtrise de l'Énergie).
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Principe de Base</h3>
                    <p className="text-muted-foreground">
                      Chaque objet acheté d'occasion évite la production d'un objet neuf. Nous calculons l'impact 
                      environnemental évité en nous basant sur l'empreinte carbone, hydrique et énergétique de la 
                      production de chaque catégorie d'objets.
                    </p>

                    <h3 className="text-lg font-semibold">Facteurs de Calcul par Catégorie</h3>
                    <div className="space-y-3">
                      {Object.entries(CATEGORY_IMPACTS).map(([key, category]) => {
                        const CategoryIcon = category.icon;
                        return (
                          <div key={key} className="p-3 border rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <CategoryIcon className={`w-4 h-4 ${category.color}`} />
                              <span className="font-medium">{category.category}</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">CO₂:</span>
                                <span className="ml-1 font-medium">{category.co2PerItem} kg</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Eau:</span>
                                <span className="ml-1 font-medium">{category.waterPerItem} L</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Énergie:</span>
                                <span className="ml-1 font-medium">{category.energyPerItem} kWh</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Déchets:</span>
                                <span className="ml-1 font-medium">{category.wastePerItem} kg</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <h3 className="text-lg font-semibold">Facteurs de Pondération</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Gift className="w-4 h-4 text-green-600" />
                        <span><strong>Dons gratuits :</strong> +20% d'impact (encourage le partage)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-purple-600" />
                        <span><strong>Échanges/Troc :</strong> -20% d'impact (pas de transaction monétaire)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-blue-600" />
                        <span><strong>Ventes :</strong> Impact standard (100%)</span>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold">Sources et Références</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• ADEME - Base Carbone® pour les facteurs d'émission</li>
                      <li>• Water Footprint Network pour l'empreinte hydrique</li>
                      <li>• IEA (International Energy Agency) pour l'énergie</li>
                      <li>• Ellen MacArthur Foundation pour l'économie circulaire</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};