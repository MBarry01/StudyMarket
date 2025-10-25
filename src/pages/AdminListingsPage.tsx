import React, { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, limit, query, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Eye, Trash2, CheckCircle, XCircle, RefreshCw, Download } from 'lucide-react';
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

interface AdminListingRow {
  id: string;
  title?: string;
  price?: number;
  currency?: string;
  status?: string;
  sellerId?: string;
  sellerName?: string;
  category?: string;
  views?: number;
  images?: string[];
  createdAt?: any;
}

const AdminListingsPage: React.FC = () => {
  const [listings, setListings] = useState<AdminListingRow[]>([]);
  const [filteredListings, setFilteredListings] = useState<AdminListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<AdminListingRow | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchListings();
  }, []);

  useEffect(() => {
    filterListings();
  }, [listings, searchQuery, statusFilter]);

  const fetchListings = async () => {
    try {
      const q = query(collection(db, 'listings'), orderBy('createdAt', 'desc'), limit(100));
      const snap = await getDocs(q);
      setListings(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    } finally {
      setLoading(false);
    }
  };

  const filterListings = () => {
    let filtered = [...listings];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(l => l.status === statusFilter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(l =>
        l.title?.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q) ||
        l.sellerId?.toLowerCase().includes(q)
      );
    }

    setFilteredListings(filtered);
  };

  const handleChangeStatus = async (listing: AdminListingRow, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'listings', listing.id), {
        status: newStatus,
        updatedAt: new Date(),
      });
      toast.success(`Statut changé vers ${newStatus}`);
      fetchListings();
    } catch (error) {
      console.error('Change status error:', error);
      toast.error('Erreur lors du changement de statut');
    }
  };

  const handleDeleteListing = async () => {
    if (!selectedListing) return;

    try {
      await deleteDoc(doc(db, 'listings', selectedListing.id));
      toast.success('Annonce supprimée');
      setShowDeleteDialog(false);
      fetchListings();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const exportCSV = () => {
    const csv = [
      ['ID', 'Title', 'Price', 'Currency', 'Status', 'Seller', 'Category', 'Views', 'Created'],
      ...filteredListings.map(l => [
        l.id,
        l.title || '',
        l.price || 0,
        l.currency || 'EUR',
        l.status || '',
        l.sellerId || '',
        l.category || '',
        l.views || 0,
        l.createdAt?.toDate?.()?.toISOString?.() || '',
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `listings-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Export CSV téléchargé');
  };

  const getStatusBadge = (status?: string) => {
    const variants: Record<string, string> = {
      active: 'bg-green-500 text-white',
      sold: 'bg-blue-500 text-white',
      pending: 'bg-yellow-500 text-white',
      removed: 'bg-red-500 text-white',
      draft: 'bg-gray-500 text-white',
    };
    return <Badge className={variants[status || ''] || ''}>{status || 'unknown'}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion des annonces</h2>
          <p className="text-sm text-muted-foreground">
            {filteredListings.length} annonce(s) sur {listings.length}
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
          placeholder="Rechercher titre, ID, vendeur..."
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
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="sold">Vendue</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="removed">Supprimée</SelectItem>
            <SelectItem value="draft">Brouillon</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchListings}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Rafraîchir
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-8">Chargement…</div>
      ) : filteredListings.length === 0 ? (
        <div className="text-center py-12 rounded-md border border-border bg-muted/50">
          <p className="text-muted-foreground">
            Aucune annonce trouvée.
            {listings.length === 0 && ' La collection listings est vide.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-3 font-medium">ID</th>
                <th className="text-left px-3 py-3 font-medium">Titre</th>
                <th className="text-left px-3 py-3 font-medium">Prix</th>
                <th className="text-left px-3 py-3 font-medium">Statut</th>
                <th className="text-left px-3 py-3 font-medium">Vues</th>
                <th className="text-right px-3 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredListings.map((l) => (
                <tr key={l.id} className="border-t border-border hover:bg-muted/50">
                  <td className="px-3 py-3 font-mono text-xs">{l.id.slice(0, 8)}...</td>
                  <td className="px-3 py-3">{l.title || '—'}</td>
                  <td className="px-3 py-3 font-medium">
                    {typeof l.price === 'number' ? `${l.price.toFixed(2)} ${l.currency || 'EUR'}` : '—'}
                  </td>
                  <td className="px-3 py-3">{getStatusBadge(l.status)}</td>
                  <td className="px-3 py-3">{l.views || 0}</td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedListing(l);
                          setShowDetailDialog(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {l.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleChangeStatus(l, 'active')}
                          title="Approuver"
                        >
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </Button>
                      )}
                      {l.status === 'active' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleChangeStatus(l, 'removed')}
                          title="Retirer"
                        >
                          <XCircle className="w-4 h-4 text-red-600" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedListing(l);
                          setShowDeleteDialog(true);
                        }}
                        title="Supprimer définitivement"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer l'annonce</DialogTitle>
            <DialogDescription>
              {selectedListing?.title}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Cette action est irréversible. L'annonce sera définitivement supprimée.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteListing}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détail de l'annonce</DialogTitle>
          </DialogHeader>
          {selectedListing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">ID:</span> {selectedListing.id}
                </div>
                <div>
                  <span className="font-medium">Statut:</span> {getStatusBadge(selectedListing.status)}
                </div>
                <div className="col-span-2">
                  <span className="font-medium">Titre:</span> {selectedListing.title || '—'}
                </div>
                <div>
                  <span className="font-medium">Prix:</span> {selectedListing.price} {selectedListing.currency || 'EUR'}
                </div>
                <div>
                  <span className="font-medium">Catégorie:</span> {selectedListing.category || '—'}
                </div>
                <div>
                  <span className="font-medium">Vendeur:</span> {selectedListing.sellerName || selectedListing.sellerId || '—'}
                </div>
                <div>
                  <span className="font-medium">Vues:</span> {selectedListing.views || 0}
                </div>
                {selectedListing.images && selectedListing.images.length > 0 && (
                  <div className="col-span-2">
                    <span className="font-medium">Images:</span> {selectedListing.images.length} image(s)
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

export default AdminListingsPage;

