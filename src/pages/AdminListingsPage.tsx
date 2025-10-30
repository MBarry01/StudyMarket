import React, { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, limit, query, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Eye, Trash2, CheckCircle, XCircle, RefreshCw, Download, LayoutList, LayoutGrid, MapPin } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import toast from 'react-hot-toast';
import { NotificationService } from '../services/notificationService';

interface AdminListingRow {
  id: string;
  title?: string;
  price?: number;
  currency?: string;
  status?: string;
  moderationStatus?: string;
  sellerId?: string;
  sellerName?: string;
  category?: string;
  views?: number;
  images?: string[];
  rejectionReason?: string;
  createdAt?: any;
}

const AdminListingsPage: React.FC = () => {
  const [listings, setListings] = useState<AdminListingRow[]>([]);
  const [filteredListings, setFilteredListings] = useState<AdminListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<AdminListingRow | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

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

  const handleApproveListing = async (listing: AdminListingRow) => {
    try {
      await updateDoc(doc(db, 'listings', listing.id), {
        status: 'active',
        moderationStatus: 'approved',
        updatedAt: new Date(),
      });

      // Send notification to seller
      if (listing.sellerId && listing.title) {
        await NotificationService.notifyListingApproved(
          listing.sellerId,
          listing.id,
          listing.title
        );
      }

      toast.success('Annonce approuvée et visible publiquement !');
      fetchListings();
    } catch (error) {
      console.error('Approve error:', error);
      toast.error('Erreur lors de l\'approbation');
    }
  };

  const handleRejectListing = async () => {
    if (!selectedListing || !rejectionReason.trim()) {
      toast.error('Veuillez indiquer le motif du refus');
      return;
    }

    try {
      await updateDoc(doc(db, 'listings', selectedListing.id), {
        status: 'removed',
        moderationStatus: 'removed',
        rejectionReason: rejectionReason.trim(),
        updatedAt: new Date(),
      });

      // Send notification to seller
      if (selectedListing.sellerId && selectedListing.title) {
        await NotificationService.notifyListingRejected(
          selectedListing.sellerId,
          selectedListing.id,
          selectedListing.title,
          rejectionReason.trim()
        );
      }

      toast.success('Annonce refusée avec notification envoyée');
      setShowRejectDialog(false);
      setRejectionReason('');
      fetchListings();
    } catch (error) {
      console.error('Reject error:', error);
      toast.error('Erreur lors du refus');
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
        <div className="flex items-center gap-2">
        <Button onClick={exportCSV} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
          <Button variant={viewMode === 'list' ? 'default' : 'outline'} onClick={() => setViewMode('list')} title="Vue liste">
            <LayoutList className="w-4 h-4" />
          </Button>
          <Button variant={viewMode === 'grid' ? 'default' : 'outline'} onClick={() => setViewMode('grid')} title="Vue cartes">
            <LayoutGrid className="w-4 h-4" />
          </Button>
        </div>
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

      {/* Table / Grid */}
      {loading ? (
        <div className="text-left py-">Chargement…</div>
      ) : filteredListings.length === 0 ? (
        <div className="text-left py- rounded-md border border-border bg-muted/50">
          <p className="text-muted-foreground">
            Aucune annonce trouvée.
            {listings.length === 0 && ' La collection listings est vide.'}
          </p>
        </div>
      ) : viewMode === 'list' ? (
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
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleApproveListing(l)}
                            title="Approuver"
                          >
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedListing(l);
                              setShowRejectDialog(true);
                            }}
                            title="Refuser"
                          >
                            <XCircle className="w-4 h-4 text-red-600" />
                          </Button>
                        </>
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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredListings.map((l) => (
            <div key={l.id} className="rounded-xl border border-border bg-card text-card-foreground overflow-hidden">
              <div className="relative aspect-[4/3] bg-muted">
                <img src={l.images?.[0] || '/images/placeholder.jpg'} alt={l.title} className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3">{getStatusBadge(l.status)}</div>
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-semibold text-foreground line-clamp-2">{l.title || '—'}</h3>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold">{typeof l.price === 'number' ? `${l.price.toFixed(2)} ${l.currency || 'EUR'}` : '—'}</span>
                  <span className="text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{l.category || '—'}</span>
                </div>
                <div className="flex items-center justify-end gap-1 pt-2">
                  <Button size="sm" variant="ghost" onClick={() => { setSelectedListing(l); setShowDetailDialog(true); }}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  {l.status === 'pending' && (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => handleApproveListing(l)} title="Approuver">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setSelectedListing(l); setShowRejectDialog(true); }} title="Refuser">
                        <XCircle className="w-4 h-4 text-red-600" />
                      </Button>
                    </>
                  )}
                  {l.status === 'active' && (
                    <Button size="sm" variant="ghost" onClick={() => handleChangeStatus(l, 'removed')} title="Retirer">
                      <XCircle className="w-4 h-4 text-red-600" />
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => { setSelectedListing(l); setShowDeleteDialog(true); }} title="Supprimer">
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser l'annonce</DialogTitle>
            <DialogDescription>
              {selectedListing?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Motif du refus *</label>
              <Textarea
                placeholder="Ex: Contenu inapproprié, fausses informations..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-2"
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Le vendeur recevra ce motif par notification
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowRejectDialog(false);
              setRejectionReason('');
            }}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRejectListing}
              disabled={!rejectionReason.trim()}
            >
              Refuser l'annonce
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <DialogDescription>
              {selectedListing?.title || 'Aucun titre'}
            </DialogDescription>
          </DialogHeader>
          {selectedListing && (
            <div className="space-y-6">
              {/* Images Preview */}
              {selectedListing.images && selectedListing.images.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Images ({selectedListing.images.length})</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedListing.images.slice(0, 3).map((img, idx) => (
                      <img key={idx} src={img} alt={`Image ${idx + 1}`} className="rounded-lg object-cover h-24 w-full" />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Key Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">ID:</span>
                  <p className="font-mono text-xs break-all">{selectedListing.id}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Statut:</span>
                  <div className="mt-1">{getStatusBadge(selectedListing.status)}</div>
                </div>
                <div className="col-span-2">
                  <span className="font-medium text-muted-foreground">Prix:</span>
                  <p className="text-lg font-bold">{selectedListing.price} {selectedListing.currency || 'EUR'}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Catégorie:</span>
                  <p>{selectedListing.category || '—'}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Vues:</span>
                  <p>{selectedListing.views || 0}</p>
                </div>
                <div className="col-span-2">
                  <span className="font-medium text-muted-foreground">Vendeur:</span>
                  <p>{selectedListing.sellerName || selectedListing.sellerId || '—'}</p>
                </div>
              </div>

              {/* Action Buttons for Pending Listings */}
              {selectedListing.status === 'pending' && (
                <div className="border-t pt-4 space-y-3">
                  <p className="text-sm font-medium">Actions de validation</p>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        handleApproveListing(selectedListing);
                        setShowDetailDialog(false);
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approuver l'annonce
                    </Button>
                    <Button
                      variant="default"
                      className="flex-1 bg-red-600 hover:bg-red-700"
                      onClick={() => {
                        setShowDetailDialog(false);
                        setSelectedListing(selectedListing);
                        setShowRejectDialog(true);
                      }}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Refuser l'annonce
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminListingsPage;

