import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Progress } from '@/components/ui/progress';
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
  Share2,
  Download,
  Smartphone,
  BookOpen,
  Home,
  Shirt,
  HelpCircle
} from 'lucide-react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Listing } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
    wasteAvoided: number;
  }[];
  badges: string[];
  rank: string;
  levelProgress: number; // Pourcentage vers le prochain niveau
}

interface CategoryImpact {
  category: string;
  icon: React.ComponentType<any>;
  color: string;
  darkColor: string;
  bgColor: string;
  darkBgColor: string;
  co2PerItem: number;
  waterPerItem: number;
  energyPerItem: number;
  wastePerItem: number;
  description: string;
}

// Données d'impact par catégorie (basées sur des études réelles + catégorie 'other' conservatrice)
const CATEGORY_IMPACTS: Record<string, CategoryImpact> = {
  electronics: {
    category: 'Électronique',
    icon: Smartphone,
    color: 'text-blue-600',
    darkColor: 'text-blue-400',
    bgColor: 'bg-blue-100',
    darkBgColor: 'bg-blue-900/30',
    co2PerItem: 85,
    waterPerItem: 1200,
    energyPerItem: 450,
    wastePerItem: 2.5,
    description: 'Smartphones, ordinateurs, accessoires tech'
  },
  books: {
    category: 'Livres & Cours',
    icon: BookOpen,
    color: 'text-green-600',
    darkColor: 'text-green-400',
    bgColor: 'bg-green-100',
    darkBgColor: 'bg-green-900/30',
    co2PerItem: 8.5,
    waterPerItem: 85,
    energyPerItem: 12,
    wastePerItem: 0.8,
    description: 'Manuels, livres, notes de cours'
  },
  furniture: {
    category: 'Mobilier',
    icon: Home,
    color: 'text-purple-600',
    darkColor: 'text-purple-400',
    bgColor: 'bg-purple-100',
    darkBgColor: 'bg-purple-900/30',
    co2PerItem: 45,
    waterPerItem: 350,
    energyPerItem: 180,
    wastePerItem: 15,
    description: 'Meubles, déco, électroménager'
  },
  clothing: {
    category: 'Vêtements',
    icon: Shirt,
    color: 'text-pink-600',
    darkColor: 'text-pink-400',
    bgColor: 'bg-pink-100',
    darkBgColor: 'bg-pink-900/30',
    co2PerItem: 22,
    waterPerItem: 2700,
    energyPerItem: 35,
    wastePerItem: 0.5,
    description: 'Vêtements, chaussures, accessoires'
  },
  other: {
    category: 'Autre',
    icon: HelpCircle,
    color: 'text-gray-600',
    darkColor: 'text-gray-400',
    bgColor: 'bg-gray-100',
    darkBgColor: 'bg-gray-800',
    co2PerItem: 5, // Valeur conservatrice
    waterPerItem: 50,
    energyPerItem: 5,
    wastePerItem: 0.2,
    description: 'Objets divers'
  }
};

// Helper function to safely convert dates
const safeToDate = (date: any): Date => {
  if (!date) return new Date();
  if (date instanceof Date) return date;
  if (date && typeof date.toDate === 'function') {
    try { return date.toDate(); } catch { return new Date(); }
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
    levelProgress: 0
  });
  const [userTransactions, setUserTransactions] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'year' | 'all'>('all');
  const [selectedMetric, setSelectedMetric] = useState<'co2' | 'water' | 'energy' | 'waste'>('co2');

  const METRICS = {
    co2: { label: 'CO₂ Économisé', key: 'co2Saved', color: '#16a34a', unit: 'kg', icon: Leaf },
    water: { label: 'Eau Préservée', key: 'waterSaved', color: '#2563eb', unit: 'L', icon: Droplets },
    energy: { label: 'Énergie Économisée', key: 'energySaved', color: '#ca8a04', unit: 'kWh', icon: Zap },
    waste: { label: 'Déchets Évités', key: 'wasteAvoided', color: '#9333ea', unit: 'kg', icon: Recycle }
  };

  useEffect(() => {
    if (currentUser) {
      loadEnvironmentalData();
    }
  }, [currentUser, selectedPeriod]);

  const loadEnvironmentalData = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
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
      const impact = calculateEnvironmentalImpact(transactions, selectedPeriod);
      setEnvironmentalData(impact);
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

    if (period === 'month') {
      const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      filteredTransactions = transactions.filter(t => safeToDate(t.createdAt) >= oneMonthAgo);
    } else if (period === 'year') {
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      filteredTransactions = transactions.filter(t => safeToDate(t.createdAt) >= oneYearAgo);
    }

    let totalCo2Saved = 0;
    let totalWaterSaved = 0;
    let totalEnergySaved = 0;
    let totalWasteAvoided = 0;
    const transactionsByCategory: Record<string, number> = {};

    filteredTransactions.forEach(transaction => {
      // Utilisation de 'other' comme fallback plus sûr
      const categoryImpact = CATEGORY_IMPACTS[transaction.category] || CATEGORY_IMPACTS.other;

      const quantity = 1;
      let impactFactor = 1;
      if (transaction.transactionType === 'donation') {
        impactFactor = 1.2;
      } else if (transaction.transactionType === 'exchange') {
        impactFactor = 0.8;
      }

      totalCo2Saved += categoryImpact.co2PerItem * quantity * impactFactor;
      totalWaterSaved += categoryImpact.waterPerItem * quantity * impactFactor;
      totalEnergySaved += categoryImpact.energyPerItem * quantity * impactFactor;
      totalWasteAvoided += categoryImpact.wastePerItem * quantity * impactFactor;

      transactionsByCategory[transaction.category] = (transactionsByCategory[transaction.category] || 0) + 1;
    });

    const monthlyImpact = calculateMonthlyImpact(transactions);
    const badges = calculateBadges(transactions, totalCo2Saved, totalWaterSaved);
    const { rank, levelProgress } = calculateRankAndProgress(totalCo2Saved);

    return {
      totalCo2Saved: Math.round(totalCo2Saved * 10) / 10,
      totalWaterSaved: Math.round(totalWaterSaved),
      totalEnergySaved: Math.round(totalEnergySaved * 10) / 10,
      totalWasteAvoided: Math.round(totalWasteAvoided * 10) / 10,
      transactionsByCategory,
      monthlyImpact,
      badges,
      rank,
      levelProgress
    };
  };

  const calculateMonthlyImpact = (transactions: Listing[]) => {
    const monthlyData: Record<string, { co2Saved: number; transactions: number; waterSaved: number; energySaved: number; wasteAvoided: number }> = {};

    for (let i = 5; i >= 0; i--) { // 6 derniers mois pour le graphique
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().slice(0, 7);
      monthlyData[monthKey] = { co2Saved: 0, transactions: 0, waterSaved: 0, energySaved: 0, wasteAvoided: 0 };
    }

    transactions.forEach(transaction => {
      const transactionDate = safeToDate(transaction.createdAt);
      const monthKey = transactionDate.toISOString().slice(0, 7);
      if (monthlyData[monthKey]) {
        const categoryImpact = CATEGORY_IMPACTS[transaction.category] || CATEGORY_IMPACTS.other;

        let impactFactor = 1;
        if (transaction.transactionType === 'donation') impactFactor = 1.2;
        else if (transaction.transactionType === 'exchange') impactFactor = 0.8;

        monthlyData[monthKey].co2Saved += categoryImpact.co2PerItem * impactFactor;
        monthlyData[monthKey].waterSaved += categoryImpact.waterPerItem * impactFactor;
        monthlyData[monthKey].energySaved += categoryImpact.energyPerItem * impactFactor;
        monthlyData[monthKey].wasteAvoided += categoryImpact.wastePerItem * impactFactor;
        monthlyData[monthKey].transactions += 1;
      }
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      displayMonth: new Date(month + '-01').toLocaleDateString('fr-FR', { month: 'short' }),
      co2Saved: Math.round(data.co2Saved * 10) / 10,
      transactions: data.transactions,
      waterSaved: Math.round(data.waterSaved),
      energySaved: Math.round(data.energySaved * 10) / 10,
      wasteAvoided: Math.round(data.wasteAvoided * 10) / 10
    }));
  };

  const calculateBadges = (transactions: Listing[], totalCo2: number, totalWater: number): string[] => {
    const badges: string[] = [];
    if (transactions.length >= 1) badges.push('first_transaction');
    if (totalCo2 >= 10) badges.push('co2_saver_10');
    if (totalCo2 >= 50) badges.push('co2_saver_50');
    if (totalCo2 >= 100) badges.push('co2_saver_100');
    if (totalWater >= 1000) badges.push('water_saver');
    if (transactions.length >= 20) badges.push('recycling_master');
    const donations = transactions.filter(t => t.transactionType === 'donation');
    if (donations.length >= 5) badges.push('donation_hero');
    return badges;
  };

  const calculateRankAndProgress = (totalCo2: number) => {
    const levels = [
      { name: 'Débutant', threshold: 0 },
      { name: 'Apprenti Vert', threshold: 5 },
      { name: 'Protecteur', threshold: 10 },
      { name: 'Éco-Warrior', threshold: 25 },
      { name: 'Expert Vert', threshold: 50 },
      { name: 'Maître Environnemental', threshold: 100 },
      { name: 'Légende Écologique', threshold: 200 }
    ];

    let currentLevel = levels[0];
    let nextLevel = levels[1];

    for (let i = 0; i < levels.length; i++) {
      if (totalCo2 >= levels[i].threshold) {
        currentLevel = levels[i];
        nextLevel = levels[i + 1] || { name: 'Max', threshold: totalCo2 * 1.5 };
      }
    }

    const progress = Math.min(100, Math.max(0,
      ((totalCo2 - currentLevel.threshold) / (nextLevel.threshold - currentLevel.threshold)) * 100
    ));

    return { rank: currentLevel.name, levelProgress: progress };
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
      console.error('Erreur maj données env:', error);
    }
  };

  const shareImpact = async () => {
    const shareText = `🌍 Mon impact sur StudyMarket : ${environmentalData.totalCo2Saved} kg CO₂ économisés ! Rejoignez le mouvement !`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Mon Impact', text: shareText, url: window.location.origin }); }
      catch { navigator.clipboard.writeText(shareText); }
    } else {
      navigator.clipboard.writeText(shareText);
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify({
      user: userProfile?.displayName,
      date: new Date().toISOString(),
      impact: environmentalData
    }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `impact-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <Card className="w-full max-w-md text-center shadow-lg border-none bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-gray-900">
          <CardContent className="pt-10 pb-10">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Leaf className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-green-800 dark:text-green-400">Connectez-vous</h2>
            <p className="text-green-700 dark:text-green-500 mb-6">
              Découvrez l'impact positif de vos échanges sur la planète.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const MetricIcon = METRICS[selectedMetric].icon;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-card p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-900 dark:text-gray-100">
            <span className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl"><Leaf className="w-8 h-8 text-green-600 dark:text-green-400" /></span>
            Mon Impact Écologique
          </h1>
          <p className="text-muted-foreground mt-2 ml-1">
            Visualisez votre contribution concrète à un avenir durable.
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button variant="outline" onClick={shareImpact} className="flex-1 md:flex-none gap-2 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-400 border-green-200 dark:border-green-900">
            <Share2 className="w-4 h-4" /> Partager
          </Button>
          <Button variant="outline" onClick={exportData} className="flex-1 md:flex-none gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-400 border-blue-200 dark:border-blue-900">
            <Download className="w-4 h-4" /> Exporter
          </Button>
        </div>
      </div>

      {/* Période */}
      <div className="flex justify-end">
        <div className="inline-flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          {[
            { key: 'month', label: 'Ce mois' },
            { key: 'year', label: 'Cette année' },
            { key: 'all', label: 'Tout' }
          ].map(period => (
            <button
              key={period.key}
              onClick={() => setSelectedPeriod(period.key as any)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${selectedPeriod === period.key
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card
              onClick={() => setSelectedMetric('co2')}
              className={`border-none shadow-md bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-gray-800 overflow-hidden relative group hover:shadow-lg transition-all cursor-pointer ${selectedMetric === 'co2' ? 'ring-2 ring-green-500 ring-offset-2 dark:ring-offset-gray-900' : 'opacity-80 hover:opacity-100'}`}
            >
              <div className="absolute right-0 top-0 w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform" />
              <CardContent className="pt-6 relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400"><Leaf className="w-6 h-6" /></div>
                  <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50">CO₂</Badge>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">{environmentalData.totalCo2Saved} <span className="text-lg font-normal text-gray-500 dark:text-gray-400">kg</span></div>
                <p className="text-sm text-green-700 dark:text-green-400 font-medium">Émissions évitées</p>
                <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Car className="w-3 h-3" /> ≈ {Math.round(environmentalData.totalCo2Saved / 0.12)} km en voiture
                </div>
              </CardContent>
            </Card>

            <Card
              onClick={() => setSelectedMetric('water')}
              className={`border-none shadow-md bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800 overflow-hidden relative group hover:shadow-lg transition-all cursor-pointer ${selectedMetric === 'water' ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900' : 'opacity-80 hover:opacity-100'}`}
            >
              <div className="absolute right-0 top-0 w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform" />
              <CardContent className="pt-6 relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400"><Droplets className="w-6 h-6" /></div>
                  <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50">Eau</Badge>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">{environmentalData.totalWaterSaved.toLocaleString()} <span className="text-lg font-normal text-gray-500 dark:text-gray-400">L</span></div>
                <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">Eau préservée</p>
                <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Droplets className="w-3 h-3" /> ≈ {Math.round(environmentalData.totalWaterSaved / 150)} douches
                </div>
              </CardContent>
            </Card>

            <Card
              onClick={() => setSelectedMetric('energy')}
              className={`border-none shadow-md bg-gradient-to-br from-yellow-50 to-white dark:from-yellow-900/20 dark:to-gray-800 overflow-hidden relative group hover:shadow-lg transition-all cursor-pointer ${selectedMetric === 'energy' ? 'ring-2 ring-yellow-500 ring-offset-2 dark:ring-offset-gray-900' : 'opacity-80 hover:opacity-100'}`}
            >
              <div className="absolute right-0 top-0 w-24 h-24 bg-yellow-100 dark:bg-yellow-900/30 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform" />
              <CardContent className="pt-6 relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-yellow-600 dark:text-yellow-400"><Zap className="w-6 h-6" /></div>
                  <Badge variant="secondary" className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50">Énergie</Badge>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">{environmentalData.totalEnergySaved} <span className="text-lg font-normal text-gray-500 dark:text-gray-400">kWh</span></div>
                <p className="text-sm text-yellow-700 dark:text-yellow-400 font-medium">Énergie économisée</p>
                <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Smartphone className="w-3 h-3" /> ≈ {Math.round(environmentalData.totalEnergySaved / 0.012)} charges
                </div>
              </CardContent>
            </Card>

            <Card
              onClick={() => setSelectedMetric('waste')}
              className={`border-none shadow-md bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-800 overflow-hidden relative group hover:shadow-lg transition-all cursor-pointer ${selectedMetric === 'waste' ? 'ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-gray-900' : 'opacity-80 hover:opacity-100'}`}
            >
              <div className="absolute right-0 top-0 w-24 h-24 bg-purple-100 dark:bg-purple-900/30 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform" />
              <CardContent className="pt-6 relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400"><Recycle className="w-6 h-6" /></div>
                  <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50">Déchets</Badge>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">{environmentalData.totalWasteAvoided} <span className="text-lg font-normal text-gray-500 dark:text-gray-400">kg</span></div>
                <p className="text-sm text-purple-700 dark:text-purple-400 font-medium">Déchets évités</p>
                <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Factory className="w-3 h-3" /> ≈ {Math.round(environmentalData.totalWasteAvoided / 0.5)} sacs poubelle
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Graphique */}
            <Card className="lg:col-span-2 border-none shadow-md bg-white dark:bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-gray-900 dark:text-gray-100">
                  <MetricIcon className="w-5 h-5" style={{ color: METRICS[selectedMetric].color }} />
                  {METRICS[selectedMetric].label}
                </CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-400">
                  Évolution sur les 6 derniers mois
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={environmentalData.monthlyImpact}>
                      <defs>
                        <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={METRICS[selectedMetric].color} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={METRICS[selectedMetric].color} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" strokeOpacity={0.2} />
                      <XAxis dataKey="displayMonth" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
                        formatter={(value: number) => [`${value} ${METRICS[selectedMetric].unit}`, METRICS[selectedMetric].label]}
                      />
                      <Area
                        type="monotone"
                        dataKey={METRICS[selectedMetric].key}
                        stroke={METRICS[selectedMetric].color}
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorMetric)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Rang & Progression */}
            <Card className="border-none shadow-md bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-gray-900 dark:text-gray-100">
                  <Award className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  Votre Niveau
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center pt-2">
                <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-green-100 to-emerald-200 dark:from-green-900/40 dark:to-emerald-800/40 flex items-center justify-center mb-6 shadow-inner relative">
                  <div className="absolute inset-0 rounded-full border-4 border-white dark:border-gray-700 opacity-50"></div>
                  <Leaf className="w-14 h-14 text-green-700 dark:text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">{environmentalData.rank}</h3>
                <p className="text-sm text-muted-foreground mb-6 text-center px-4">
                  Continuez vos efforts pour atteindre le prochain niveau !
                </p>

                <div className="w-full space-y-2">
                  <div className="flex justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
                    <span>Progression</span>
                    <span>{Math.round(environmentalData.levelProgress)}%</span>
                  </div>
                  <Progress value={environmentalData.levelProgress} className="h-3 bg-gray-200 dark:bg-gray-700" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Détail par catégorie */}
          <Card className="border-none shadow-md bg-white dark:bg-card">
            <CardHeader>
              <CardTitle className="text-xl text-gray-900 dark:text-gray-100">Détail par catégorie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(environmentalData.transactionsByCategory).map(([category, count]) => {
                  const data = CATEGORY_IMPACTS[category] || CATEGORY_IMPACTS.other;
                  const Icon = data.icon;
                  return (
                    <div key={category} className="flex items-center p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-green-100 dark:hover:border-green-900 hover:bg-green-50/30 dark:hover:bg-green-900/20 transition-colors">
                      <div className={`p-3 rounded-lg ${data.bgColor} dark:${data.darkBgColor} ${data.color} dark:${data.darkColor} mr-4`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">{data.category}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{count} transaction{count > 1 ? 's' : ''}</p>
                      </div>
                      <div className="ml-auto text-right">
                        <span className="block font-bold text-green-600 dark:text-green-400">
                          {Math.round(count * data.co2PerItem * 10) / 10} kg
                        </span>
                        <span className="text-xs text-gray-400">CO₂</span>
                      </div>
                    </div>
                  );
                })}
                {Object.keys(environmentalData.transactionsByCategory).length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                    Aucune donnée disponible pour cette période.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};