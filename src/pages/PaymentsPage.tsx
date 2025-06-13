import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  Search,
  Filter,
  Download,
  BarChart3,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Shield,
  AlertTriangle,
  Info
} from 'lucide-react';
import { PaymentStatusCard } from '../components/payment/PaymentStatusCard';
import { usePaymentStore, PaymentRequest } from '../stores/usePaymentStore';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';

interface PaymentStats {
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  totalAmount: number;
  averageAmount: number;
  byMethod: Record<string, number>;
  byStatus: Record<string, number>;
}

export const PaymentsPage: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const { 
    paymentRequests, 
    loading, 
    fetchUserPaymentRequests, 
    initializePaymentMethods 
  } = usePaymentStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [stats, setStats] = useState<PaymentStats>({
    totalRequests: 0,
    pendingRequests: 0,
    completedRequests: 0,
    totalAmount: 0,
    averageAmount: 0,
    byMethod: {},
    byStatus: {}
  });

  useEffect(() => {
    initializePaymentMethods();
  }, [initializePaymentMethods]);

  useEffect(() => {
    if (currentUser) {
      fetchUserPaymentRequests(currentUser.uid);
    }
  }, [currentUser, fetchUserPaymentRequests]);

  useEffect(() => {
    calculateStats();
  }, [paymentRequests]);

  const calculateStats = () => {
    const byMethod: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let totalAmount = 0;

    paymentRequests.forEach(request => {
      byMethod[request.paymentMethod] = (byMethod[request.paymentMethod] || 0) + 1;
      byStatus[request.status] = (byStatus[request.status] || 0) + 1;
      totalAmount += request.amount;
    });

    setStats({
      totalRequests: paymentRequests.length,
      pendingRequests: byStatus.pending || 0,
      completedRequests: byStatus.completed || 0,
      totalAmount,
      averageAmount: paymentRequests.length > 0 ? totalAmount / paymentRequests.length : 0,
      byMethod,
      byStatus
    });
  };

  const getFilteredRequests = () => {
    return paymentRequests.filter(request => {
      const matchesSearch = !searchQuery || 
        request.listingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      const matchesMethod = methodFilter === 'all' || request.paymentMethod === methodFilter;

      return matchesSearch && matchesStatus && matchesMethod;
    });
  };

  const getBuyerRequests = () => {
    return getFilteredRequests().filter(request => request.buyerId === currentUser?.uid);
  };

  const getSellerRequests = () => {
    return getFilteredRequests().filter(request => request.sellerId === currentUser?.uid);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getMethodName = (method: string) => {
    const methods: Record<string, string> = {
      cash: 'Espèces',
      transfer: 'Virement',
      paypal: 'PayPal',
      lydia: 'Lydia'
    };
    return methods[method] || method;
  };

  const exportPayments = () => {
    const exportData = {
      user: userProfile?.displayName,
      exportDate: new Date().toISOString(),
      stats,
      payments: paymentRequests.map(request => ({
        id: request.id,
        amount: request.amount,
        currency: request.currency,
        method: request.paymentMethod,
        status: request.status,
        role: request.buyerId === currentUser?.uid ? 'buyer' : 'seller',
        createdAt: request.createdAt.toISOString(),
        updatedAt: request.updatedAt.toISOString()
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paiements-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Connectez-vous pour voir vos paiements</h2>
            <p className="text-muted-foreground">
              Gérez vos demandes de paiement et suivez vos transactions
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
            <Wallet className="w-8 h-8 text-primary" />
            Mes Paiements
            {stats.totalRequests > 0 && (
              <Badge variant="secondary\" className="ml-1">
                {stats.totalRequests}
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos demandes de paiement et suivez vos transactions
          </p>
        </div>
        
        <Button variant="outline" onClick={exportPayments} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Exporter
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.totalRequests}</p>
                <p className="text-sm text-muted-foreground">Demandes totales</p>
              </div>
              <CreditCard className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.pendingRequests}</p>
                <p className="text-sm text-muted-foreground">En attente</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.completedRequests}</p>
                <p className="text-sm text-muted-foreground">Terminées</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{formatAmount(stats.totalAmount)}</p>
                <p className="text-sm text-muted-foreground">Montant total</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par ID de transaction..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="confirmed">Confirmé</SelectItem>
                <SelectItem value="completed">Terminé</SelectItem>
                <SelectItem value="cancelled">Annulé</SelectItem>
                <SelectItem value="disputed">Litige</SelectItem>
              </SelectContent>
            </Select>

            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Méthode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les méthodes</SelectItem>
                <SelectItem value="cash">Espèces</SelectItem>
                <SelectItem value="transfer">Virement</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="lydia">Lydia</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contenu principal */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Toutes
            {stats.totalRequests > 0 && (
              <Badge variant="secondary\" className="ml-1">
                {stats.totalRequests}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="purchases" className="flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4" />
            Mes achats
            {getBuyerRequests().length > 0 && (
              <Badge variant="secondary\" className="ml-1">
                {getBuyerRequests().length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <ArrowDownLeft className="w-4 h-4" />
            Mes ventes
            {getSellerRequests().length > 0 && (
              <Badge variant="secondary\" className="ml-1">
                {getSellerRequests().length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Toutes les Demandes de Paiement
              </CardTitle>
              <CardDescription>
                Historique complet de vos transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
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
              ) : getFilteredRequests().length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Aucune demande de paiement</h3>
                  <p className="text-muted-foreground">
                    {paymentRequests.length === 0 
                      ? "Vous n'avez pas encore de demandes de paiement."
                      : "Aucune demande ne correspond à vos critères de recherche."
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getFilteredRequests().map((request) => (
                    <PaymentStatusCard
                      key={request.id}
                      request={request}
                      userRole={request.buyerId === currentUser.uid ? 'buyer' : 'seller'}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchases" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5" />
                Mes Achats
              </CardTitle>
              <CardDescription>
                Demandes de paiement que vous avez initiées
              </CardDescription>
            </CardHeader>
            <CardContent>
              {getBuyerRequests().length === 0 ? (
                <div className="text-center py-12">
                  <ArrowUpRight className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Aucun achat</h3>
                  <p className="text-muted-foreground">
                    Vous n'avez pas encore initié de demandes de paiement pour vos achats.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getBuyerRequests().map((request) => (
                    <PaymentStatusCard
                      key={request.id}
                      request={request}
                      userRole="buyer"
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5" />
                Mes Ventes
              </CardTitle>
              <CardDescription>
                Demandes de paiement reçues pour vos annonces
              </CardDescription>
            </CardHeader>
            <CardContent>
              {getSellerRequests().length === 0 ? (
                <div className="text-center py-12">
                  <ArrowDownLeft className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Aucune vente</h3>
                  <p className="text-muted-foreground">
                    Vous n'avez pas encore reçu de demandes de paiement pour vos annonces.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getSellerRequests().map((request) => (
                    <PaymentStatusCard
                      key={request.id}
                      request={request}
                      userRole="seller"
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Conseils de sécurité */}
      <Alert className="border-blue-200 bg-blue-50">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Conseils de sécurité :</strong> Ne communiquez jamais vos informations bancaires par message privé. 
          Utilisez uniquement les canaux sécurisés de StudyMarket pour vos transactions.
        </AlertDescription>
      </Alert>
    </div>
  );
};