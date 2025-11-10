import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Bell, 
  Plus, 
  Trash2, 
  Edit, 
  Eye,
  AlertCircle,
  Clock,
  Filter,
  Mail,
  Smartphone,
  MessageSquare,
  Settings,
  Target,
  TrendingUp,
  Heart,
  Bookmark,
  ExternalLink,
  Calendar,
  MapPin,
  Euro,
  Tag,
  Users,
  Zap,
  Star,
  CheckCircle,
  XCircle,
  Pause,
  Play
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SearchFilters } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { UNIVERSITY_FILTER_OPTIONS } from '@/constants/universities';

// Types pour les recherches sauvegardées
interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  filters: SearchFilters;
  alertsEnabled: boolean;
  notificationFrequency: 'instant' | 'daily' | 'weekly';
  notificationMethods: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  lastNotified?: Date;
  matchCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface AlertMatch {
  id: string;
  userId: string;
  savedSearchId: string;
  listingId: string;
  listingTitle: string;
  listingPrice: number;
  listingImage?: string;
  matchedAt: Date;
  seen: boolean;
  notified: boolean;
}

interface SavedSearchStats {
  totalSearches: number;
  activeAlerts: number;
  totalMatches: number;
  newMatches: number;
}

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

// Helper function to clean data for Firestore (remove undefined values)
const cleanDataForFirestore = (data: any): any => {
  if (data === null || data === undefined) {
    return null;
  }
  
  if (Array.isArray(data)) {
    return data.map(cleanDataForFirestore).filter(item => item !== undefined);
  }
  
  if (typeof data === 'object' && data !== null) {
    const cleaned: any = {};
    Object.keys(data).forEach(key => {
      const value = cleanDataForFirestore(data[key]);
      if (value !== undefined) {
        cleaned[key] = value;
      }
    });
    return cleaned;
  }
  
  return data;
};

// Catégories disponibles
const categories = [
  { value: 'all', label: 'Toutes catégories' },
  { value: 'electronics', label: 'Électronique' },
  { value: 'books', label: 'Livres & Cours' },
  { value: 'furniture', label: 'Mobilier' },
  { value: 'clothing', label: 'Vêtements' },
  { value: 'services', label: 'Services' },
  { value: 'housing', label: 'Logement' },
  { value: 'jobs', label: 'Jobs & Stages' }
];

// Types de transaction
const transactionTypes = [
  { value: 'all', label: 'Tous types' },
  { value: 'sale', label: 'Vente' },
  { value: 'donation', label: 'Don' },
  { value: 'exchange', label: 'Échange' },
  { value: 'service', label: 'Service' }
];

export const SavedSearchesPage: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [alertMatches, setAlertMatches] = useState<AlertMatch[]>([]);
  const [stats, setStats] = useState<SavedSearchStats>({
    totalSearches: 0,
    activeAlerts: 0,
    totalMatches: 0,
    newMatches: 0
  });
  const [loading, setLoading] = useState({
    searches: true,
    matches: true,
    creating: false,
    updating: false
  });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingSearch, setEditingSearch] = useState<SavedSearch | null>(null);
  const [newSearchForm, setNewSearchForm] = useState({
    name: '',
    query: '',
    category: 'all',
    transactionType: 'all',
    university: 'all',
    minPrice: '',
    maxPrice: '',
    alertsEnabled: true,
    notificationFrequency: 'daily' as 'instant' | 'daily' | 'weekly',
    notificationMethods: {
      email: true,
      push: true,
      sms: false
    }
  });

  useEffect(() => {
    if (currentUser) {
      loadSavedSearches();
      loadAlertMatches();
    }
  }, [currentUser]);

  const loadSavedSearches = async () => {
    if (!currentUser) return;

    try {
      setLoading(prev => ({ ...prev, searches: true }));
      
      // Simple query without orderBy to avoid index requirements
      const searchesQuery = query(
        collection(db, 'savedSearches'),
        where('userId', '==', currentUser.uid),
        limit(50)
      );
      
      const querySnapshot = await getDocs(searchesQuery);
      const searches: SavedSearch[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        searches.push({
          id: doc.id,
          ...data,
          createdAt: safeToDate(data.createdAt),
          updatedAt: safeToDate(data.updatedAt),
          lastNotified: data.lastNotified ? safeToDate(data.lastNotified) : undefined
        } as SavedSearch);
      });
      
      // Sort client-side by creation date
      searches.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      setSavedSearches(searches);
      
      // Calculate stats
      const activeAlerts = searches.filter(s => s.alertsEnabled).length;
      setStats(prev => ({
        ...prev,
        totalSearches: searches.length,
        activeAlerts
      }));
      
    } catch (error: any) {
      console.error('Erreur lors du chargement des recherches sauvegardées:', error);
      toast.error('Erreur lors du chargement des recherches sauvegardées');
    } finally {
      setLoading(prev => ({ ...prev, searches: false }));
    }
  };

  const loadAlertMatches = async () => {
    if (!currentUser) return;

    try {
      setLoading(prev => ({ ...prev, matches: true }));
      
      // Simple query without orderBy to avoid index requirements
      const matchesQuery = query(
        collection(db, 'alertMatches'),
        where('userId', '==', currentUser.uid),
        limit(100)
      );
      
      const querySnapshot = await getDocs(matchesQuery);
      const matches: AlertMatch[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        matches.push({
          id: doc.id,
          ...data,
          matchedAt: safeToDate(data.matchedAt)
        } as AlertMatch);
      });
      
      // Sort client-side by match date
      matches.sort((a, b) => b.matchedAt.getTime() - a.matchedAt.getTime());
      
      setAlertMatches(matches);
      
      // Calculate match stats
      const newMatches = matches.filter(m => !m.seen).length;
      setStats(prev => ({
        ...prev,
        totalMatches: matches.length,
        newMatches
      }));
      
    } catch (error: any) {
      console.error('Erreur lors du chargement des correspondances:', error);
      toast.error('Erreur lors du chargement des correspondances');
    } finally {
      setLoading(prev => ({ ...prev, matches: false }));
    }
  };

  const createSavedSearch = async () => {
    if (!currentUser || !newSearchForm.name.trim()) {
      toast.error('Veuillez remplir le nom de la recherche');
      return;
    }

    setLoading(prev => ({ ...prev, creating: true }));

    try {
      // Clean the filters object to remove undefined values
      const cleanFilters: SearchFilters = {};
      
      if (newSearchForm.query && newSearchForm.query.trim()) {
        cleanFilters.query = newSearchForm.query.trim();
      }
      
      if (newSearchForm.category && newSearchForm.category !== 'all') {
        cleanFilters.category = newSearchForm.category;
      }
      
      if (newSearchForm.transactionType && newSearchForm.transactionType !== 'all') {
        cleanFilters.transactionType = newSearchForm.transactionType as any;
      }
      
      if (newSearchForm.university && newSearchForm.university !== 'all') {
        cleanFilters.university = newSearchForm.university;
      }
      
      if (newSearchForm.minPrice && newSearchForm.minPrice.trim()) {
        const minPrice = parseFloat(newSearchForm.minPrice);
        if (!isNaN(minPrice) && minPrice >= 0) {
          cleanFilters.minPrice = minPrice;
        }
      }
      
      if (newSearchForm.maxPrice && newSearchForm.maxPrice.trim()) {
        const maxPrice = parseFloat(newSearchForm.maxPrice);
        if (!isNaN(maxPrice) && maxPrice >= 0) {
          cleanFilters.maxPrice = maxPrice;
        }
      }

      const searchData = {
        userId: currentUser.uid,
        name: newSearchForm.name.trim(),
        filters: cleanFilters,
        alertsEnabled: newSearchForm.alertsEnabled,
        notificationFrequency: newSearchForm.notificationFrequency,
        notificationMethods: {
          email: newSearchForm.notificationMethods.email,
          push: newSearchForm.notificationMethods.push,
          sms: newSearchForm.notificationMethods.sms
        },
        matchCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Clean the data to ensure no undefined values
      const cleanedData = cleanDataForFirestore(searchData);

      await addDoc(collection(db, 'savedSearches'), cleanedData);

      toast.success('Alerte créée avec succès !');
      setShowCreateDialog(false);
      resetForm();
      loadSavedSearches();

    } catch (error: any) {
      console.error('Erreur lors de la création de l\'alerte:', error);
      toast.error('Erreur lors de la création de l\'alerte');
    } finally {
      setLoading(prev => ({ ...prev, creating: false }));
    }
  };

  const updateSavedSearch = async (searchId: string, updates: Partial<SavedSearch>) => {
    try {
      setLoading(prev => ({ ...prev, updating: true }));
      
      const cleanedUpdates = cleanDataForFirestore({
        ...updates,
        updatedAt: new Date()
      });

      await updateDoc(doc(db, 'savedSearches', searchId), cleanedUpdates);

      toast.success('Recherche mise à jour !');
      loadSavedSearches();

    } catch (error: any) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setLoading(prev => ({ ...prev, updating: false }));
    }
  };

  const deleteSavedSearch = async (searchId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette recherche sauvegardée ?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'savedSearches', searchId));
      toast.success('Recherche supprimée !');
      loadSavedSearches();
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const toggleAlerts = async (searchId: string, enabled: boolean) => {
    await updateSavedSearch(searchId, { alertsEnabled: enabled });
  };

  const markMatchAsSeen = async (matchId: string) => {
    try {
      await updateDoc(doc(db, 'alertMatches', matchId), {
        seen: true,
        seenAt: new Date()
      });
      loadAlertMatches();
    } catch (error) {
      console.error('Erreur lors du marquage comme vu:', error);
    }
  };

  const resetForm = () => {
    setNewSearchForm({
      name: '',
      query: '',
      category: 'all',
      transactionType: 'all',
      university: 'all',
      minPrice: '',
      maxPrice: '',
      alertsEnabled: true,
      notificationFrequency: 'daily',
      notificationMethods: {
        email: true,
        push: true,
        sms: false
      }
    });
    setEditingSearch(null);
  };

  const formatDate = (date: Date) => {
    try {
      return formatDistanceToNow(date, { 
        addSuffix: true, 
        locale: fr 
      });
    } catch (error) {
      return 'Date inconnue';
    }
  };

  const formatFilters = (filters: SearchFilters) => {
    const parts: string[] = [];
    
    if (filters.query) parts.push(`"${filters.query}"`);
    if (filters.category && filters.category !== 'all') {
      const cat = categories.find(c => c.value === filters.category);
      if (cat) parts.push(cat.label);
    }
    if (filters.transactionType && filters.transactionType !== 'all') {
      const type = transactionTypes.find(t => t.value === filters.transactionType);
      if (type) parts.push(type.label);
    }
    if (filters.minPrice !== undefined) parts.push(`≥ ${filters.minPrice}€`);
    if (filters.maxPrice !== undefined) parts.push(`≤ ${filters.maxPrice}€`);
    
    return parts.length > 0 ? parts.join(' • ') : 'Tous les critères';
  };

  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Connectez-vous pour gérer vos alertes</h2>
            <p className="text-muted-foreground">
              Créez des alertes personnalisées pour être notifié des nouvelles annonces
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="w-8 h-8 text-primary" />
            Mes Alertes
            {stats.totalSearches > 0 && (
              <Badge variant="secondary\" className="ml-1">
                {stats.totalSearches}
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos recherches sauvegardées et recevez des notifications
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-secondary">
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Alerte
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Créer une Alerte Personnalisée
              </DialogTitle>
              <DialogDescription>
                Définissez vos critères de recherche et recevez des notifications pour les nouvelles annonces correspondantes
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Nom de l'alerte */}
              <div>
                <Label htmlFor="alert-name">Nom de l'alerte *</Label>
                <Input
                  id="alert-name"
                  value={newSearchForm.name}
                  onChange={(e) => setNewSearchForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: MacBook Pro pas cher"
                  className="mt-1"
                />
              </div>

              {/* Critères de recherche */}
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Critères de Recherche
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="search-query">Mots-clés</Label>
                    <Input
                      id="search-query"
                      value={newSearchForm.query}
                      onChange={(e) => setNewSearchForm(prev => ({ ...prev, query: e.target.value }))}
                      placeholder="Ex: MacBook, iPhone, livre..."
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="search-category">Catégorie</Label>
                    <Select 
                      value={newSearchForm.category} 
                      onValueChange={(value) => setNewSearchForm(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="transaction-type">Type de transaction</Label>
                    <Select 
                      value={newSearchForm.transactionType} 
                      onValueChange={(value) => setNewSearchForm(prev => ({ ...prev, transactionType: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {transactionTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="search-university">Université</Label>
                    <Select 
                      value={newSearchForm.university} 
                      onValueChange={(value) => setNewSearchForm(prev => ({ ...prev, university: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIVERSITY_FILTER_OPTIONS.map((university) => (
                          <SelectItem key={university.value} value={university.value}>
                            {university.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="min-price">Prix minimum (€)</Label>
                    <Input
                      id="min-price"
                      type="number"
                      value={newSearchForm.minPrice}
                      onChange={(e) => setNewSearchForm(prev => ({ ...prev, minPrice: e.target.value }))}
                      placeholder="0"
                      className="mt-1"
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="max-price">Prix maximum (€)</Label>
                    <Input
                      id="max-price"
                      type="number"
                      value={newSearchForm.maxPrice}
                      onChange={(e) => setNewSearchForm(prev => ({ ...prev, maxPrice: e.target.value }))}
                      placeholder="1000"
                      className="mt-1"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Notifications
                </h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="alerts-enabled">Activer les notifications</Label>
                    <p className="text-sm text-muted-foreground">Recevoir des alertes pour cette recherche</p>
                  </div>
                  <Switch
                    id="alerts-enabled"
                    checked={newSearchForm.alertsEnabled}
                    onCheckedChange={(checked) => setNewSearchForm(prev => ({ ...prev, alertsEnabled: checked }))}
                  />
                </div>

                {newSearchForm.alertsEnabled && (
                  <>
                    <div>
                      <Label>Fréquence des notifications</Label>
                      <div className="mt-2 space-y-2">
                        {[
                          { value: 'instant', label: 'Instantané', description: 'Dès qu\'une nouvelle annonce correspond' },
                          { value: 'daily', label: 'Quotidien', description: 'Un résumé par jour' },
                          { value: 'weekly', label: 'Hebdomadaire', description: 'Un résumé par semaine' }
                        ].map((freq) => (
                          <div key={freq.value} className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id={freq.value}
                              name="frequency"
                              value={freq.value}
                              checked={newSearchForm.notificationFrequency === freq.value}
                              onChange={(e) => setNewSearchForm(prev => ({ 
                                ...prev, 
                                notificationFrequency: e.target.value as any 
                              }))}
                              className="rounded border-border"
                            />
                            <Label htmlFor={freq.value} className="cursor-pointer">
                              <div>
                                <div className="font-medium">{freq.label}</div>
                                <div className="text-sm text-muted-foreground">{freq.description}</div>
                              </div>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Méthodes de notification</Label>
                      <div className="mt-2 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-blue-600" />
                            <Label htmlFor="email-notifications">Email</Label>
                          </div>
                          <Switch
                            id="email-notifications"
                            checked={newSearchForm.notificationMethods.email}
                            onCheckedChange={(checked) => setNewSearchForm(prev => ({ 
                              ...prev, 
                              notificationMethods: { ...prev.notificationMethods, email: checked }
                            }))}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Bell className="w-4 h-4 text-green-600" />
                            <Label htmlFor="push-notifications">Notifications push</Label>
                          </div>
                          <Switch
                            id="push-notifications"
                            checked={newSearchForm.notificationMethods.push}
                            onCheckedChange={(checked) => setNewSearchForm(prev => ({ 
                              ...prev, 
                              notificationMethods: { ...prev.notificationMethods, push: checked }
                            }))}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-purple-600" />
                            <Label htmlFor="sms-notifications">SMS</Label>
                            <Badge variant="outline" className="text-xs">Bientôt</Badge>
                          </div>
                          <Switch
                            id="sms-notifications"
                            checked={newSearchForm.notificationMethods.sms}
                            onCheckedChange={(checked) => setNewSearchForm(prev => ({ 
                              ...prev, 
                              notificationMethods: { ...prev.notificationMethods, sms: checked }
                            }))}
                            disabled
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={createSavedSearch}
                  disabled={loading.creating || !newSearchForm.name.trim()}
                >
                  {loading.creating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Création...
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4 mr-2" />
                      Créer l'alerte
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.totalSearches}</p>
                <p className="text-sm text-muted-foreground">Recherches sauvées</p>
              </div>
              <Search className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.activeAlerts}</p>
                <p className="text-sm text-muted-foreground">Alertes actives</p>
              </div>
              <Bell className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.totalMatches}</p>
                <p className="text-sm text-muted-foreground">Correspondances</p>
              </div>
              <Target className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.newMatches}</p>
                <p className="text-sm text-muted-foreground">Nouvelles</p>
              </div>
              <Zap className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contenu principal */}
      <Tabs defaultValue="searches" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 p-0 gap-0 items-center h-10">
          <TabsTrigger value="searches" className="flex items-center gap-1 text-xs sm:text-sm rounded-l-lg rounded-r-none h-10">
            <Search className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Mes Recherches</span>
            <span className="sm:hidden">Recherches</span>
            {stats.totalSearches > 0 && (
              <Badge className="ml-1 h-5 min-w-[18px] px-1.5 rounded-full bg-gradient-to-r from-primary to-secondary text-white text-[10px] leading-none flex items-center justify-center">
                {stats.totalSearches}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="matches" className="flex items-center gap-1 text-xs sm:text-sm rounded-r-lg rounded-l-none h-10">
            <Target className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Correspondances</span>
            <span className="sm:hidden">Matches</span>
            {stats.newMatches > 0 && (
              <Badge className="ml-1 h-5 min-w-[18px] px-1.5 rounded-full bg-gradient-to-r from-primary to-secondary text-white text-[10px] leading-none flex items-center justify-center">
                {stats.newMatches}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="searches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bookmark className="w-5 h-5" />
                Recherches Sauvegardées
              </CardTitle>
              <CardDescription>
                Gérez vos alertes et critères de recherche personnalisés
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading.searches ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="border rounded-lg p-4 animate-pulse">
                      <div className="flex items-center justify-between mb-2">
                        <div className="h-5 bg-muted rounded w-1/3" />
                        <div className="h-6 bg-muted rounded w-16" />
                      </div>
                      <div className="h-4 bg-muted rounded w-2/3 mb-2" />
                      <div className="h-4 bg-muted rounded w-1/4" />
                    </div>
                  ))}
                </div>
              ) : savedSearches.length === 0 ? (
                <div className="flex flex-col items-center py-12">
                  <Search className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2 text-center">Aucune recherche sauvegardée</h3>
                  <p className="text-muted-foreground mb-4 text-center">
                    Créez votre première alerte pour être notifié des nouvelles annonces
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Créer ma première alerte
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {savedSearches.map((search) => (
                    <div key={search.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{search.name}</h3>
                            {search.alertsEnabled ? (
                              <Badge className="bg-green-100 text-green-800">
                                <Bell className="w-3 h-3 mr-1" />
                                Actif
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <Pause className="w-3 h-3 mr-1" />
                                Pausé
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {formatFilters(search.filters)}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Créé {formatDate(search.createdAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Target className="w-3 h-3" />
                              {search.matchCount} correspondance{search.matchCount !== 1 ? 's' : ''}
                            </span>
                            {search.lastNotified && (
                              <span className="flex items-center gap-1">
                                <Bell className="w-3 h-3" />
                                Dernière alerte {formatDate(search.lastNotified)}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleAlerts(search.id, !search.alertsEnabled)}
                            title={search.alertsEnabled ? 'Désactiver les alertes' : 'Activer les alertes'}
                          >
                            {search.alertsEnabled ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingSearch(search);
                              setNewSearchForm({
                                name: search.name,
                                query: search.filters.query || '',
                                category: search.filters.category || 'all',
                                transactionType: search.filters.transactionType || 'all',
                                university: search.filters.university || 'all',
                                minPrice: search.filters.minPrice?.toString() || '',
                                maxPrice: search.filters.maxPrice?.toString() || '',
                                alertsEnabled: search.alertsEnabled,
                                notificationFrequency: search.notificationFrequency,
                                notificationMethods: search.notificationMethods
                              });
                              setShowCreateDialog(true);
                            }}
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteSavedSearch(search.id)}
                            title="Supprimer"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {search.alertsEnabled && (
                        <div className="flex items-center gap-4 text-xs bg-muted/50 rounded p-2">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Fréquence: {
                              search.notificationFrequency === 'instant' ? 'Instantané' :
                              search.notificationFrequency === 'daily' ? 'Quotidien' : 'Hebdomadaire'
                            }</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {search.notificationMethods.email && (
                              <Mail className="w-3 h-3 text-blue-600\" title="Email activé" />
                            )}
                            {search.notificationMethods.push && (
                              <Bell className="w-3 h-3 text-green-600\" title="Push activé" />
                            )}
                            {search.notificationMethods.sms && (
                              <MessageSquare className="w-3 h-3 text-purple-600\" title="SMS activé" />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Correspondances Trouvées
              </CardTitle>
              <CardDescription>
                Les annonces qui correspondent à vos critères de recherche
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading.matches ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="border rounded-lg p-4 animate-pulse">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-muted rounded" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-3/4" />
                          <div className="h-4 bg-muted rounded w-1/2" />
                          <div className="h-4 bg-muted rounded w-1/4" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : alertMatches.length === 0 ? (
                <div className="flex flex-col items-center py-12">
                  <Target className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2 text-center">Aucune correspondance</h3>
                  <p className="text-muted-foreground text-center">
                    Aucune annonce ne correspond encore à vos critères. Les nouvelles correspondances apparaîtront ici.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {alertMatches.map((match) => (
                    <div 
                      key={match.id} 
                      className={`border rounded-lg p-4 transition-colors ${
                        !match.seen ? 'bg-blue-50 border-blue-200' : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {match.listingImage ? (
                          <img
                            src={match.listingImage}
                            alt={match.listingTitle}
                            className="w-16 h-16 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                            <Package className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold">{match.listingTitle}</h3>
                            <div className="flex items-center gap-2">
                              {!match.seen && (
                                <Badge className="bg-blue-500">
                                  Nouveau
                                </Badge>
                              )}
                              <span className="font-semibold text-primary">
                                {match.listingPrice === 0 ? 'Gratuit' : `${match.listingPrice}€`}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Trouvé {formatDate(match.matchedAt)}
                            </span>
                            
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => markMatchAsSeen(match.id)}
                                disabled={match.seen}
                              >
                                {match.seen ? (
                                  <>
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Vu
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-3 h-3 mr-1" />
                                    Marquer comme vu
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => window.open(`/listing/${match.listingId}`, '_blank')}
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                Voir l'annonce
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};