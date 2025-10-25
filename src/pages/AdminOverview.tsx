import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Users, Package, ShoppingCart, TrendingUp, AlertTriangle, DollarSign, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Stats {
  totalUsers: number;
  newUsers24h: number;
  totalListings: number;
  activeListings: number;
  pendingListings: number;
  totalOrders: number;
  pendingOrders: number;
  paidOrders: number;
  failedOrders: number;
  revenue24h: number;
  revenueTotal: number;
  conversionRate: number;
}

const AdminOverview: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    newUsers24h: 0,
    totalListings: 0,
    activeListings: 0,
    pendingListings: 0,
    totalOrders: 0,
    pendingOrders: 0,
    paidOrders: 0,
    failedOrders: 0,
    revenue24h: 0,
    revenueTotal: 0,
    conversionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<string[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Users
        const usersSnap = await getDocs(collection(db, 'users'));
        const totalUsers = usersSnap.size;
        const newUsers24h = usersSnap.docs.filter((doc) => {
          const createdAt = doc.data().createdAt?.toDate?.() || new Date(0);
          return createdAt >= yesterday;
        }).length;

        // Listings
        const listingsSnap = await getDocs(collection(db, 'listings'));
        const totalListings = listingsSnap.size;
        const activeListings = listingsSnap.docs.filter(d => d.data().status === 'active').length;
        const pendingListings = listingsSnap.docs.filter(d => d.data().status === 'pending').length;

        // Orders
        const ordersSnap = await getDocs(collection(db, 'orders'));
        const totalOrders = ordersSnap.size;
        const pendingOrders = ordersSnap.docs.filter(d => d.data().status === 'pending').length;
        const paidOrders = ordersSnap.docs.filter(d => d.data().status === 'paid').length;
        const failedOrders = ordersSnap.docs.filter(d => d.data().status === 'failed').length;

        // Revenue
        let revenueTotal = 0;
        let revenue24h = 0;
        ordersSnap.docs.forEach((doc) => {
          const data = doc.data();
          if (data.status === 'paid') {
            const amount = (data.totalCents || data.total * 100 || 0) / 100;
            revenueTotal += amount;
            const createdAt = data.createdAt?.toDate?.() || new Date(0);
            if (createdAt >= yesterday) {
              revenue24h += amount;
            }
          }
        });

        // Conversion rate (paid / total)
        const conversionRate = totalOrders > 0 ? (paidOrders / totalOrders) * 100 : 0;

        // Alerts
        const newAlerts: string[] = [];
        if (pendingOrders > 10) newAlerts.push(`${pendingOrders} commandes en attente`);
        if (failedOrders > 5) newAlerts.push(`${failedOrders} paiements échoués`);
        if (pendingListings > 20) newAlerts.push(`${pendingListings} annonces en modération`);

        setStats({
          totalUsers,
          newUsers24h,
          totalListings,
          activeListings,
          pendingListings,
          totalOrders,
          pendingOrders,
          paidOrders,
          failedOrders,
          revenue24h,
          revenueTotal,
          conversionRate,
        });
        setAlerts(newAlerts);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Tableau de bord</h2>
        <p className="text-sm text-muted-foreground">Vue d'ensemble de la plateforme</p>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Alertes :</strong>
            <ul className="mt-2 space-y-1">
              {alerts.map((alert, i) => (
                <li key={i}>• {alert}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Users */}
        <Link to="/admin/users" className="block group">
          <Card className="transition-all hover:shadow-lg hover:border-primary/50 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.newUsers24h} dernières 24h
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Listings */}
        <Link to="/admin/listings" className="block group">
          <Card className="transition-all hover:shadow-lg hover:border-primary/50 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Annonces</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.activeListings}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingListings} en attente
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Orders */}
        <Link to="/admin/orders" className="block group">
          <Card className="transition-all hover:shadow-lg hover:border-primary/50 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commandes</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.paidOrders}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingOrders} en attente, {stats.failedOrders} échouées
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Revenue */}
        <Link to="/admin/orders" className="block group">
          <Card className="transition-all hover:shadow-lg hover:border-primary/50 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenus</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : `${stats.revenueTotal.toFixed(2)} €`}
              </div>
              <p className="text-xs text-muted-foreground">
                +{stats.revenue24h.toFixed(2)} € (24h)
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Conversion Rate */}
        <Link to="/admin/orders" className="block group">
          <Card className="transition-all hover:shadow-lg hover:border-primary/50 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux conversion</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : `${stats.conversionRate.toFixed(1)}%`}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.paidOrders}/{stats.totalOrders} commandes payées
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/admin/orders" className="p-4 text-center border rounded-lg hover:bg-muted hover:border-primary/50 transition-all group">
            <ShoppingCart className="h-6 w-6 mx-auto mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
            <div className="text-sm font-medium">Commandes</div>
          </Link>
          <Link to="/admin/listings" className="p-4 text-center border rounded-lg hover:bg-muted hover:border-primary/50 transition-all group">
            <Package className="h-6 w-6 mx-auto mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
            <div className="text-sm font-medium">Annonces</div>
          </Link>
          <Link to="/admin/users" className="p-4 text-center border rounded-lg hover:bg-muted hover:border-primary/50 transition-all group">
            <Users className="h-6 w-6 mx-auto mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
            <div className="text-sm font-medium">Utilisateurs</div>
          </Link>
          <Link to="/admin/reports" className="p-4 text-center border rounded-lg hover:bg-muted hover:border-primary/50 transition-all group">
            <BarChart3 className="h-6 w-6 mx-auto mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
            <div className="text-sm font-medium">Rapports</div>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOverview;

