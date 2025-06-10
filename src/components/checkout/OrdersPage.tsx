import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Package, 
  Search, 
  Filter, 
  Download, 
  ShoppingBag, 
  Clock, 
  CheckCircle, 
  Truck, 
  XCircle,
  Calendar,
  CreditCard,
  ExternalLink,
  ChevronRight,
  ArrowUpDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '../../contexts/AuthContext';
import { useOrderStore } from '../../stores/useOrderStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const OrdersPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { orders, fetchUserOrders, loading } = useOrderStore();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [timeFilter, setTimeFilter] = useState('all');

  useEffect(() => {
    if (currentUser) {
      fetchUserOrders(currentUser.uid);
    }
  }, [currentUser, fetchUserOrders]);

  const getFilteredOrders = () => {
    return orders.filter(order => {
      // Search filter
      const matchesSearch = !searchQuery || 
        order.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      
      // Time filter
      let matchesTime = true;
      if (timeFilter !== 'all') {
        const orderDate = new Date(order.createdAt);
        const now = new Date();
        
        if (timeFilter === 'last-30-days') {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(now.getDate() - 30);
          matchesTime = orderDate >= thirtyDaysAgo;
        } else if (timeFilter === 'last-6-months') {
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(now.getMonth() - 6);
          matchesTime = orderDate >= sixMonthsAgo;
        }
      }
      
      return matchesSearch && matchesStatus && matchesTime;
    }).sort((a, b) => {
      // Sort orders
      if (sortBy === 'date-desc') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === 'date-asc') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === 'total-desc') {
        return b.total - a.total;
      } else if (sortBy === 'total-asc') {
        return a.total - b.total;
      }
      return 0;
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            En attente
          </Badge>
        );
      case 'processing':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Package className="w-3 h-3 mr-1" />
            En traitement
          </Badge>
        );
      case 'shipped':
        return (
          <Badge className="bg-purple-100 text-purple-800 border-purple-200">
            <Truck className="w-3 h-3 mr-1" />
            Expédiée
          </Badge>
        );
      case 'delivered':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Livrée
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Annulée
          </Badge>
        );
      default:
        return (
          <Badge>
            {status}
          </Badge>
        );
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const exportOrders = () => {
    const exportData = {
      user: currentUser?.displayName || currentUser?.email,
      date: new Date().toISOString(),
      orders: orders.map(order => ({
        id: order.id,
        date: order.createdAt,
        status: order.status,
        total: order.total,
        items: order.items.length
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commandes-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Card>
          <CardContent className="pt-6">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Connectez-vous pour voir vos commandes</h2>
            <p className="text-muted-foreground mb-4">
              Vous devez être connecté pour accéder à l'historique de vos commandes
            </p>
            <Button onClick={() => navigate('/auth')}>
              Se connecter
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="w-8 h-8" />
            Mes Commandes
          </h1>
          <p className="text-muted-foreground mt-1">
            Suivez et gérez toutes vos commandes
          </p>
        </div>
        
        <Button variant="outline" onClick={exportOrders} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Exporter
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par numéro de commande..."
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
                <SelectItem value="processing">En traitement</SelectItem>
                <SelectItem value="shipped">Expédiée</SelectItem>
                <SelectItem value="delivered">Livrée</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les périodes</SelectItem>
                <SelectItem value="last-30-days">30 derniers jours</SelectItem>
                <SelectItem value="last-6-months">6 derniers mois</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Date (récent → ancien)</SelectItem>
                <SelectItem value="date-asc">Date (ancien → récent)</SelectItem>
                <SelectItem value="total-desc">Prix (élevé → bas)</SelectItem>
                <SelectItem value="total-asc">Prix (bas → élevé)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Toutes</TabsTrigger>
          <TabsTrigger value="active">En cours</TabsTrigger>
          <TabsTrigger value="completed">Terminées</TabsTrigger>
          <TabsTrigger value="cancelled">Annulées</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex justify-between mb-4">
                      <div className="h-6 bg-muted rounded w-1/4" />
                      <div className="h-6 bg-muted rounded w-1/6" />
                    </div>
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : getFilteredOrders().length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucune commande trouvée</h3>
              <p className="text-muted-foreground mb-6">
                {orders.length === 0 
                  ? "Vous n'avez pas encore passé de commande." 
                  : "Aucune commande ne correspond à vos critères de recherche."
                }
              </p>
              <Button asChild>
                <Link to="/listings">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Parcourir les produits
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {getFilteredOrders().map((order) => (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">Commande #{order.id.slice(0, 8)}</h3>
                          {getStatusBadge(order.status)}
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(order.createdAt), 'dd MMMM yyyy', { locale: fr })}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold">{formatPrice(order.total)}</p>
                          <p className="text-xs text-muted-foreground">
                            {order.items.length} article{order.items.length > 1 ? 's' : ''}
                          </p>
                        </div>
                        
                        <Button asChild>
                          <Link to={`/order/${order.id}`}>
                            Détails
                            <ChevronRight className="ml-1 w-4 h-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 overflow-x-auto pb-2">
                      {order.items.slice(0, 4).map((item, index) => (
                        <div key={index} className="flex-shrink-0">
                          {item.image ? (
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              className="w-16 h-16 object-cover rounded"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                              <Package className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      ))}
                      {order.items.length > 4 && (
                        <div className="flex-shrink-0 w-16 h-16 bg-muted rounded flex items-center justify-center">
                          <span className="text-sm font-medium">+{order.items.length - 4}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="active" className="space-y-4">
          {/* Active orders (pending, processing, shipped) */}
          {getFilteredOrders().filter(order => 
            ['pending', 'processing', 'shipped'].includes(order.status)
          ).length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucune commande en cours</h3>
              <p className="text-muted-foreground mb-6">
                Vous n'avez pas de commandes en cours de traitement.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {getFilteredOrders()
                .filter(order => ['pending', 'processing', 'shipped'].includes(order.status))
                .map((order) => (
                  <Card key={order.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      {/* Same card content as above */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">Commande #{order.id.slice(0, 8)}</h3>
                            {getStatusBadge(order.status)}
                          </div>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(order.createdAt), 'dd MMMM yyyy', { locale: fr })}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-semibold">{formatPrice(order.total)}</p>
                            <p className="text-xs text-muted-foreground">
                              {order.items.length} article{order.items.length > 1 ? 's' : ''}
                            </p>
                          </div>
                          
                          <Button asChild>
                            <Link to={`/order/${order.id}`}>
                              Détails
                              <ChevronRight className="ml-1 w-4 h-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 overflow-x-auto pb-2">
                        {order.items.slice(0, 4).map((item, index) => (
                          <div key={index} className="flex-shrink-0">
                            {item.image ? (
                              <img 
                                src={item.image} 
                                alt={item.name} 
                                className="w-16 h-16 object-cover rounded"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                                <Package className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        ))}
                        {order.items.length > 4 && (
                          <div className="flex-shrink-0 w-16 h-16 bg-muted rounded flex items-center justify-center">
                            <span className="text-sm font-medium">+{order.items.length - 4}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="space-y-4">
          {/* Completed orders */}
          {getFilteredOrders().filter(order => order.status === 'delivered').length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucune commande terminée</h3>
              <p className="text-muted-foreground mb-6">
                Vous n'avez pas encore de commandes livrées.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {getFilteredOrders()
                .filter(order => order.status === 'delivered')
                .map((order) => (
                  <Card key={order.id} className="hover:shadow-md transition-shadow">
                    {/* Same card content as above */}
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">Commande #{order.id.slice(0, 8)}</h3>
                            {getStatusBadge(order.status)}
                          </div>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(order.createdAt), 'dd MMMM yyyy', { locale: fr })}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-semibold">{formatPrice(order.total)}</p>
                            <p className="text-xs text-muted-foreground">
                              {order.items.length} article{order.items.length > 1 ? 's' : ''}
                            </p>
                          </div>
                          
                          <Button asChild>
                            <Link to={`/order/${order.id}`}>
                              Détails
                              <ChevronRight className="ml-1 w-4 h-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 overflow-x-auto pb-2">
                        {order.items.slice(0, 4).map((item, index) => (
                          <div key={index} className="flex-shrink-0">
                            {item.image ? (
                              <img 
                                src={item.image} 
                                alt={item.name} 
                                className="w-16 h-16 object-cover rounded"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                                <Package className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        ))}
                        {order.items.length > 4 && (
                          <div className="flex-shrink-0 w-16 h-16 bg-muted rounded flex items-center justify-center">
                            <span className="text-sm font-medium">+{order.items.length - 4}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="cancelled" className="space-y-4">
          {/* Cancelled orders */}
          {getFilteredOrders().filter(order => order.status === 'cancelled').length === 0 ? (
            <div className="text-center py-12">
              <XCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucune commande annulée</h3>
              <p className="text-muted-foreground mb-6">
                Vous n'avez pas de commandes annulées.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {getFilteredOrders()
                .filter(order => order.status === 'cancelled')
                .map((order) => (
                  <Card key={order.id} className="hover:shadow-md transition-shadow">
                    {/* Same card content as above */}
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">Commande #{order.id.slice(0, 8)}</h3>
                            {getStatusBadge(order.status)}
                          </div>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(order.createdAt), 'dd MMMM yyyy', { locale: fr })}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-semibold">{formatPrice(order.total)}</p>
                            <p className="text-xs text-muted-foreground">
                              {order.items.length} article{order.items.length > 1 ? 's' : ''}
                            </p>
                          </div>
                          
                          <Button asChild>
                            <Link to={`/order/${order.id}`}>
                              Détails
                              <ChevronRight className="ml-1 w-4 h-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 overflow-x-auto pb-2">
                        {order.items.slice(0, 4).map((item, index) => (
                          <div key={index} className="flex-shrink-0">
                            {item.image ? (
                              <img 
                                src={item.image} 
                                alt={item.name} 
                                className="w-16 h-16 object-cover rounded"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                                <Package className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        ))}
                        {order.items.length > 4 && (
                          <div className="flex-shrink-0 w-16 h-16 bg-muted rounded flex items-center justify-center">
                            <span className="text-sm font-medium">+{order.items.length - 4}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};