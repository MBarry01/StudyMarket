import React, { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, limit, query, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Eye, CheckCircle, XCircle, RefreshCw, Download, DollarSign } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import toast from 'react-hot-toast';

interface Payout {
  id: string;
  sellerId: string;
  sellerName?: string;
  sellerEmail?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  orderId?: string;
  orderIds?: string[];
  stripePayoutId?: string;
  stripeAccountId?: string;
  requestedAt?: any;
  processedAt?: any;
  failureReason?: string;
  bankInfo?: {
    last4?: string;
    bankName?: string;
  };
}

const AdminPayoutsPage: React.FC = () => {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [filteredPayouts, setFilteredPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchPayouts();
  }, []);

  useEffect(() => {
    filterPayouts();
  }, [payouts, searchQuery, statusFilter]);

  const fetchPayouts = async () => {
    try {
      const q = query(
        collection(db, 'payouts'),
        orderBy('requestedAt', 'desc'),
        limit(100)
      );
      const snap = await getDocs(q);
      setPayouts(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    } catch (error) {
      console.error('Fetch payouts error:', error);
      toast.error('Erreur lors du chargement des payouts');
      setPayouts([]);
    } finally {
      setLoading(false);
    }
  };


  const filterPayouts = () => {
    let filtered = [...payouts];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.sellerName?.toLowerCase().includes(q) ||
        p.sellerEmail?.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.sellerId.toLowerCase().includes(q)
      );
    }

    setFilteredPayouts(filtered);
  };

  const handleApprovePayout = async () => {
    if (!selectedPayout) return;

    setProcessing(selectedPayout.id);

    try {
      const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      const response = await fetch(`${apiBase}/api/admin/payouts/${selectedPayout.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Erreur lors de l\'approbation');

      toast.success('Payout approuvé et en cours de traitement');
      setShowApproveDialog(false);
      fetchPayouts();
    } catch (error: any) {
      console.error('Approve payout error:', error);
      toast.error(error.message || 'Erreur lors de l\'approbation');
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectPayout = async (payout: Payout) => {
    const reason = prompt('Raison du rejet:');
    if (!reason) return;

    setProcessing(payout.id);

    try {
      await updateDoc(doc(db, 'payouts', payout.id), {
        status: 'failed',
        failureReason: reason,
        processedAt: new Date(),
      });

      toast.success('Payout rejeté');
      fetchPayouts();
    } catch (error) {
      console.error('Reject payout error:', error);
      toast.error('Erreur lors du rejet');
    } finally {
      setProcessing(null);
    }
  };

  const exportCSV = () => {
    const csv = [
      ['ID', 'Seller', 'Email', 'Amount', 'Currency', 'Status', 'Order ID', 'Requested', 'Processed', 'Bank'],
      ...filteredPayouts.map(p => [
        p.id,
        p.sellerName || '',
        p.sellerEmail || '',
        p.amount,
        p.currency,
        p.status,
        p.orderId || p.orderIds?.join(';') || '',
        p.requestedAt?.toDate?.()?.toISOString?.() || p.requestedAt?.toISOString?.() || '',
        p.processedAt?.toDate?.()?.toISOString?.() || p.processedAt?.toISOString?.() || '',
        p.bankInfo?.bankName || '',
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payouts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Export CSV téléchargé');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-yellow-500 text-white',
      processing: 'bg-blue-500 text-white',
      completed: 'bg-green-500 text-white',
      failed: 'bg-red-500 text-white',
    };
    return <Badge className={variants[status] || 'bg-gray-500 text-white'}>{status}</Badge>;
  };

  const totalPending = payouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
  const totalProcessing = payouts.filter(p => p.status === 'processing').reduce((sum, p) => sum + p.amount, 0);
  const totalCompleted = payouts.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion des payouts vendeurs</h2>
          <p className="text-sm text-muted-foreground">
            {filteredPayouts.length} payout(s) sur {payouts.length}
          </p>
        </div>
        <Button onClick={exportCSV} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="text-sm text-muted-foreground">Total payouts</div>
          <div className="text-2xl font-bold">{payouts.length}</div>
        </div>
        <div className="p-4 rounded-lg border border-yellow-500/20 bg-yellow-500/10">
          <div className="text-sm text-yellow-700 dark:text-yellow-300">En attente</div>
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {totalPending.toFixed(2)} €
          </div>
          <div className="text-xs text-muted-foreground">
            {payouts.filter(p => p.status === 'pending').length} payout(s)
          </div>
        </div>
        <div className="p-4 rounded-lg border border-blue-500/20 bg-blue-500/10">
          <div className="text-sm text-blue-700 dark:text-blue-300">En traitement</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {totalProcessing.toFixed(2)} €
          </div>
          <div className="text-xs text-muted-foreground">
            {payouts.filter(p => p.status === 'processing').length} payout(s)
          </div>
        </div>
        <div className="p-4 rounded-lg border border-green-500/20 bg-green-500/10">
          <div className="text-sm text-green-700 dark:text-green-300">Complétés</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {totalCompleted.toFixed(2)} €
          </div>
          <div className="text-xs text-muted-foreground">
            {payouts.filter(p => p.status === 'completed').length} payout(s)
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Rechercher vendeur, email, ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="processing">En traitement</SelectItem>
            <SelectItem value="completed">Complété</SelectItem>
            <SelectItem value="failed">Échoué</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchPayouts}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Rafraîchir
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-8">Chargement…</div>
      ) : filteredPayouts.length === 0 ? (
        <div className="text-center py-12 rounded-md border border-border bg-muted/50">
          <p className="text-muted-foreground">
            Aucun payout trouvé.
            {payouts.length === 0 && ' La collection payouts est vide.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-3 font-medium">Vendeur</th>
                <th className="text-left px-3 py-3 font-medium">Email</th>
                <th className="text-right px-3 py-3 font-medium">Montant</th>
                <th className="text-left px-3 py-3 font-medium">Statut</th>
                <th className="text-left px-3 py-3 font-medium">Demandé le</th>
                <th className="text-right px-3 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayouts.map((p) => (
                <tr key={p.id} className="border-t border-border hover:bg-muted/50">
                  <td className="px-3 py-3">{p.sellerName || '—'}</td>
                  <td className="px-3 py-3 text-xs">{p.sellerEmail || '—'}</td>
                  <td className="px-3 py-3 text-right font-medium">
                    {p.amount.toFixed(2)} {p.currency}
                  </td>
                  <td className="px-3 py-3">{getStatusBadge(p.status)}</td>
                  <td className="px-3 py-3 text-xs">
                    {p.requestedAt?.toDate?.()?.toLocaleDateString?.('fr-FR') || 
                     p.requestedAt?.toLocaleDateString?.('fr-FR') || '—'}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedPayout(p);
                          setShowDetailDialog(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {p.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedPayout(p);
                              setShowApproveDialog(true);
                            }}
                            disabled={processing === p.id}
                            title="Approuver"
                          >
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRejectPayout(p)}
                            disabled={processing === p.id}
                            title="Rejeter"
                          >
                            <XCircle className="w-4 h-4 text-red-600" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approuver le payout</DialogTitle>
            <DialogDescription>
              Vendeur: {selectedPayout?.sellerName} ({selectedPayout?.sellerEmail})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-md">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Montant:</span>
                <span className="text-2xl font-bold">
                  {selectedPayout?.amount.toFixed(2)} {selectedPayout?.currency}
                </span>
              </div>
              {selectedPayout?.bankInfo && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Banque: {selectedPayout.bankInfo.bankName} (••••{selectedPayout.bankInfo.last4})
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Le payout sera traité via Stripe Connect et versé sur le compte bancaire du vendeur.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleApprovePayout} disabled={processing === selectedPayout?.id}>
              <DollarSign className="w-4 h-4 mr-2" />
              Approuver le payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détail du payout</DialogTitle>
            <DialogDescription>
              ID: {selectedPayout?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedPayout && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Vendeur:</span> {selectedPayout.sellerName || '—'}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {selectedPayout.sellerEmail || '—'}
                </div>
                <div>
                  <span className="font-medium">Statut:</span> {getStatusBadge(selectedPayout.status)}
                </div>
                <div>
                  <span className="font-medium">Montant:</span>{' '}
                  {selectedPayout.amount.toFixed(2)} {selectedPayout.currency}
                </div>
                <div>
                  <span className="font-medium">Seller ID:</span> {selectedPayout.sellerId}
                </div>
                <div>
                  <span className="font-medium">Order ID:</span> {selectedPayout.orderId || '—'}
                </div>
                {selectedPayout.stripeAccountId && (
                  <div className="col-span-2">
                    <span className="font-medium">Stripe Account:</span> {selectedPayout.stripeAccountId}
                  </div>
                )}
                {selectedPayout.stripePayoutId && (
                  <div className="col-span-2">
                    <span className="font-medium">Stripe Payout ID:</span> {selectedPayout.stripePayoutId}
                  </div>
                )}
                {selectedPayout.bankInfo && (
                  <div className="col-span-2">
                    <span className="font-medium">Compte bancaire:</span>{' '}
                    {selectedPayout.bankInfo.bankName} (••••{selectedPayout.bankInfo.last4})
                  </div>
                )}
                <div>
                  <span className="font-medium">Demandé le:</span>{' '}
                  {selectedPayout.requestedAt?.toDate?.()?.toLocaleString?.('fr-FR') ||
                   selectedPayout.requestedAt?.toLocaleString?.('fr-FR') || '—'}
                </div>
                {selectedPayout.processedAt && (
                  <div>
                    <span className="font-medium">Traité le:</span>{' '}
                    {selectedPayout.processedAt?.toDate?.()?.toLocaleString?.('fr-FR') ||
                     selectedPayout.processedAt?.toLocaleString?.('fr-FR') || '—'}
                  </div>
                )}
                {selectedPayout.failureReason && (
                  <div className="col-span-2">
                    <span className="font-medium text-red-600">Raison d'échec:</span>{' '}
                    <span className="text-red-600">{selectedPayout.failureReason}</span>
                  </div>
                )}
              </div>
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

export default AdminPayoutsPage;

