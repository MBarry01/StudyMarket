import React, { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, limit, query, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, DollarSign, Eye, CheckCircle, XCircle, Clock, Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import toast from 'react-hot-toast';

interface AdminOrderRow {
  id: string;
  userId: string;
  sellerId?: string;
  totalCents?: number;
  total?: number;
  status: string;
  method?: string;
  stripePaymentIntentId?: string;
  paypalOrderId?: string;
  createdAt?: any;
  items?: any[];
}

const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<AdminOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderRow | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  
  // Filtres
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, statusFilter, methodFilter, searchQuery]);

  const fetchOrders = async () => {
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(100));
      const snap = await getDocs(q);
      const rows: AdminOrderRow[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setOrders(rows);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(o => o.status === statusFilter);
    }
    
    if (methodFilter !== 'all') {
      filtered = filtered.filter(o => o.method === methodFilter);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(o => 
        o.id.toLowerCase().includes(query) ||
        o.userId?.toLowerCase().includes(query) ||
        o.stripePaymentIntentId?.toLowerCase().includes(query)
      );
    }
    
    setFilteredOrders(filtered);
  };

  const handleRefund = async () => {
    if (!selectedOrder) return;
    
    try {
      const amount = parseFloat(refundAmount);
      if (isNaN(amount) || amount <= 0) {
        toast.error('Montant invalide');
        return;
      }

      // TODO: Appeler l'API backend pour le refund Stripe
      const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      const response = await fetch(`${apiBase}/api/admin/orders/${selectedOrder.id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_cents: Math.round(amount * 100),
          reason: refundReason || 'Admin refund',
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors du remboursement');
      }

      toast.success('Remboursement initié');
      setShowRefundDialog(false);
      fetchOrders();
    } catch (error: any) {
      console.error('Refund error:', error);
      toast.error(error.message || 'Erreur lors du remboursement');
    }
  };

  const handleReplayWebhook = async (order: AdminOrderRow) => {
    try {
      const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      const response = await fetch(`${apiBase}/api/admin/orders/${order.id}/replay-webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'stripe' }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors du replay webhook');
      }

      toast.success('Webhook rejoué');
      fetchOrders();
    } catch (error: any) {
      console.error('Replay webhook error:', error);
      toast.error(error.message || 'Erreur lors du replay webhook');
    }
  };

  const handleForceStatus = async (order: AdminOrderRow, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', order.id), {
        status: newStatus,
        updatedAt: new Date(),
      });
      toast.success(`Statut changé vers ${newStatus}`);
      fetchOrders();
    } catch (error) {
      console.error('Force status error:', error);
      toast.error('Erreur lors du changement de statut');
    }
  };

  const exportCSV = () => {
    const csv = [
      ['ID', 'User', 'Status', 'Amount', 'Method', 'Payment ID', 'Created'],
      ...filteredOrders.map(o => [
        o.id,
        o.userId || '',
        o.status,
        ((o.totalCents || o.total * 100 || 0) / 100).toFixed(2),
        o.method || '',
        o.stripePaymentIntentId || o.paypalOrderId || '',
        o.createdAt?.toDate?.()?.toISOString?.() || '',
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Export CSV téléchargé');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      paid: 'bg-green-500 text-white',
      pending: 'bg-yellow-500 text-white',
      failed: 'bg-red-500 text-white',
      cancelled: 'bg-gray-500 text-white',
      processing: 'bg-blue-500 text-white',
    };
    return <Badge className={variants[status] || ''}>{status}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion des commandes</h2>
          <p className="text-sm text-muted-foreground">
            {filteredOrders.length} commande(s) sur {orders.length}
          </p>
        </div>
        <Button onClick={exportCSV} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Rechercher ID, user, payment..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Méthode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="stripe">Stripe</SelectItem>
            <SelectItem value="paypal">PayPal</SelectItem>
            <SelectItem value="lydia">Lydia</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchOrders}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Rafraîchir
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-left py-">Chargement…</div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-left py- rounded-md border border-border bg-muted/50">
          <p className="text-muted-foreground">
            Aucune commande trouvée.
            {orders.length === 0 && ' La collection orders est vide.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-3 font-medium">ID</th>
                <th className="text-left px-3 py-3 font-medium">User</th>
                <th className="text-left px-3 py-3 font-medium">Statut</th>
                <th className="text-left px-3 py-3 font-medium">Montant</th>
                <th className="text-left px-3 py-3 font-medium">Méthode</th>
                <th className="text-left px-3 py-3 font-medium">Payment ID</th>
                <th className="text-right px-3 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((o) => (
                <tr key={o.id} className="border-t border-border hover:bg-muted/50">
                  <td className="px-3 py-3 font-mono text-xs">{o.id.slice(0, 8)}...</td>
                  <td className="px-3 py-3">{o.userId?.slice(0, 8) || '—'}</td>
                  <td className="px-3 py-3">{getStatusBadge(o.status)}</td>
                  <td className="px-3 py-3 font-medium">
                    {((o.totalCents || o.total * 100 || 0) / 100).toFixed(2)} €
                  </td>
                  <td className="px-3 py-3 capitalize">{o.method || '—'}</td>
                  <td className="px-3 py-3 font-mono text-xs">
                    {(o.stripePaymentIntentId || o.paypalOrderId || '—').slice(0, 12)}...
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedOrder(o);
                          setShowDetailDialog(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {o.status === 'paid' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedOrder(o);
                            setRefundAmount(((o.totalCents || 0) / 100).toString());
                            setShowRefundDialog(true);
                          }}
                        >
                          <DollarSign className="w-4 h-4" />
                        </Button>
                      )}
                      {(o.status === 'pending' || o.status === 'failed') && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleReplayWebhook(o)}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      )}
                      {o.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleForceStatus(o, 'paid')}
                        >
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Refund Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rembourser la commande</DialogTitle>
            <DialogDescription>
              Ordre {selectedOrder?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Montant (EUR)</label>
              <Input
                type="number"
                step="0.01"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Raison</label>
              <Input
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Raison du remboursement"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRefundDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleRefund}>Rembourser</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détail de la commande</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">ID:</span> {selectedOrder.id}
                </div>
                <div>
                  <span className="font-medium">Statut:</span> {getStatusBadge(selectedOrder.status)}
                </div>
                <div>
                  <span className="font-medium">Acheteur:</span> {selectedOrder.userId}
                </div>
                <div>
                  <span className="font-medium">Vendeur:</span> {selectedOrder.sellerId || '—'}
                </div>
                <div>
                  <span className="font-medium">Montant:</span> {((selectedOrder.totalCents || 0) / 100).toFixed(2)} €
                </div>
                <div>
                  <span className="font-medium">Méthode:</span> {selectedOrder.method || '—'}
                </div>
                <div className="col-span-2">
                  <span className="font-medium">Payment ID:</span>{' '}
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {selectedOrder.stripePaymentIntentId || selectedOrder.paypalOrderId || '—'}
                  </code>
                </div>
              </div>
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Articles</h4>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between text-sm border-b pb-2">
                        <span>{item.title || item.name}</span>
                        <span>{item.price} € x {item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowDetailDialog(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrdersPage;

