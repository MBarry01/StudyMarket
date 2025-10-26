import React, { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, limit, query, updateDoc, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Eye, CheckCircle, XCircle, RefreshCw, Download, AlertTriangle, Ban } from 'lucide-react';
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

interface Report {
  id: string;
  reporterId: string;
  reportedUserId: string;
  conversationId: string;
  reason: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'rejected';
  createdAt: any;
  reviewedAt?: any;
  reviewedBy?: string;
  action?: string;
  reporterName?: string;
  reportedUserName?: string;
}

const AdminReportsPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<'block' | 'warn' | 'dismiss'>('dismiss');
  const [actionNote, setActionNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    filterReports();
  }, [reports, searchQuery, statusFilter]);

  const fetchReports = async () => {
    try {
      const q = query(
        collection(db, 'reports'),
        orderBy('createdAt', 'desc'),
        limit(200)
      );
      const snap = await getDocs(q);
      
      const reportsWithUserInfo = await Promise.all(
        snap.docs.map(async (d) => {
          const data = d.data();
          
          // Récupérer les infos des utilisateurs
          let reporterName = 'Inconnu';
          let reportedUserName = 'Inconnu';
          
          try {
            const reporterDoc = await getDoc(doc(db, 'users', data.reporterId));
            if (reporterDoc.exists()) {
              reporterName = reporterDoc.data().displayName || 'Inconnu';
            }
          } catch (e) {}
          
          try {
            const reportedDoc = await getDoc(doc(db, 'users', data.reportedUserId));
            if (reportedDoc.exists()) {
              reportedUserName = reportedDoc.data().displayName || 'Inconnu';
            }
          } catch (e) {}
          
          return {
            id: d.id,
            reporterId: data.reporterId || '',
            reportedUserId: data.reportedUserId || '',
            conversationId: data.conversationId || '',
            reason: data.reason || '',
            description: data.description || '',
            status: data.status || 'pending',
            createdAt: data.createdAt,
            reviewedAt: data.reviewedAt,
            reviewedBy: data.reviewedBy,
            action: data.action,
            reporterName,
            reportedUserName,
          };
        })
      );
      
      setReports(reportsWithUserInfo);
    } catch (error) {
      console.error('Fetch reports error:', error);
      toast.error('Erreur lors du chargement des signalements');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const filterReports = () => {
    let filtered = [...reports];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.reason?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.reporterName?.toLowerCase().includes(q) ||
        r.reportedUserName?.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      );
    }

    setFilteredReports(filtered);
  };

  const handleProcessReport = async () => {
    if (!selectedReport) return;

    try {
      const updates: any = {
        status: actionType === 'dismiss' ? 'rejected' : 'resolved',
        reviewedAt: new Date(),
        action: actionType,
        actionNote: actionNote || null,
      };

      // Mettre à jour le signalement
      await updateDoc(doc(db, 'reports', selectedReport.id), updates);

      // Si on bloque l'utilisateur
      if (actionType === 'block') {
        await updateDoc(doc(db, 'users', selectedReport.reportedUserId), {
          blocked: true,
          blockedReason: `Signalement: ${selectedReport.reason}`,
          blockedAt: new Date(),
        });
        
        // Bloquer aussi la conversation
        if (selectedReport.conversationId) {
          await updateDoc(doc(db, 'conversations', selectedReport.conversationId), {
            status: 'blocked',
            blockedBy: [selectedReport.reportedUserId],
          });
        }
      }

      toast.success(
        actionType === 'block' ? 'Utilisateur bloqué' :
        actionType === 'warn' ? 'Avertissement enregistré' :
        'Signalement rejeté'
      );
      
      setShowActionDialog(false);
      setActionNote('');
      fetchReports();
    } catch (error) {
      console.error('Process report error:', error);
      toast.error('Erreur lors du traitement');
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Supprimer définitivement ce signalement ?')) return;

    try {
      await deleteDoc(doc(db, 'reports', reportId));
      toast.success('Signalement supprimé');
      fetchReports();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const exportCSV = () => {
    const csv = [
      ['ID', 'Reporter', 'Reported User', 'Reason', 'Description', 'Status', 'Created', 'Action'],
      ...filteredReports.map(r => [
        r.id,
        r.reporterName || '',
        r.reportedUserName || '',
        r.reason,
        r.description,
        r.status,
        r.createdAt?.toDate?.()?.toISOString?.() || '',
        r.action || '',
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reports-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Export CSV téléchargé');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-yellow-500 text-white',
      reviewed: 'bg-blue-500 text-white',
      resolved: 'bg-green-500 text-white',
      rejected: 'bg-gray-500 text-white',
    };
    return <Badge className={variants[status] || 'bg-gray-500 text-white'}>{status}</Badge>;
  };

  const getReasonBadge = (reason: string) => {
    const variants: Record<string, string> = {
      spam: 'bg-blue-500 text-white',
      harassment: 'bg-red-500 text-white',
      inappropriate: 'bg-purple-500 text-white',
      scam: 'bg-red-600 text-white',
      fake: 'bg-yellow-600 text-white',
      other: 'bg-gray-600 text-white',
    };
    return <Badge className={variants[reason.toLowerCase()] || 'bg-gray-600 text-white'}>{reason}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Signalements</h2>
          <p className="text-sm text-muted-foreground">
            {filteredReports.length} signalement(s) sur {reports.length}
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
          <div className="text-sm text-muted-foreground">Total</div>
          <div className="text-2xl font-bold">{reports.length}</div>
        </div>
        <div className="p-4 rounded-lg border border-yellow-500/20 bg-yellow-500/10">
          <div className="text-sm text-yellow-700 dark:text-yellow-300">En attente</div>
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {reports.filter(r => r.status === 'pending').length}
          </div>
        </div>
        <div className="p-4 rounded-lg border border-green-500/20 bg-green-500/10">
          <div className="text-sm text-green-700 dark:text-green-300">Résolus</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {reports.filter(r => r.status === 'resolved').length}
          </div>
        </div>
        <div className="p-4 rounded-lg border border-gray-500/20 bg-gray-500/10">
          <div className="text-sm text-gray-700 dark:text-gray-300">Rejetés</div>
          <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
            {reports.filter(r => r.status === 'rejected').length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Rechercher raison, description, utilisateur..."
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
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="reviewed">Examinés</SelectItem>
            <SelectItem value="resolved">Résolus</SelectItem>
            <SelectItem value="rejected">Rejetés</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchReports}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Rafraîchir
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-left py-">Chargement…</div>
      ) : filteredReports.length === 0 ? (
        <div className="text-left py- rounded-md border border-border bg-muted/50">
          <p className="text-muted-foreground">
            Aucun signalement trouvé.
            {reports.length === 0 && ' La collection reports est vide.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-3 font-medium">Signalé par</th>
                <th className="text-left px-3 py-3 font-medium">Utilisateur signalé</th>
                <th className="text-left px-3 py-3 font-medium">Raison</th>
                <th className="text-left px-3 py-3 font-medium">Statut</th>
                <th className="text-left px-3 py-3 font-medium">Date</th>
                <th className="text-right px-3 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-muted/50">
                  <td className="px-3 py-3">{r.reporterName}</td>
                  <td className="px-3 py-3 font-medium">{r.reportedUserName}</td>
                  <td className="px-3 py-3">{getReasonBadge(r.reason)}</td>
                  <td className="px-3 py-3">{getStatusBadge(r.status)}</td>
                  <td className="px-3 py-3 text-xs">
                    {r.createdAt?.toDate?.()?.toLocaleDateString?.('fr-FR') || '—'}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedReport(r);
                          setShowDetailDialog(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {r.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedReport(r);
                            setShowActionDialog(true);
                          }}
                          title="Traiter"
                        >
                          <CheckCircle className="w-4 h-4 text-blue-600" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteReport(r.id)}
                        title="Supprimer"
                      >
                        <XCircle className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Traiter le signalement</DialogTitle>
            <DialogDescription>
              Signalement contre {selectedReport?.reportedUserName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Action</label>
              <Select value={actionType} onValueChange={(v: any) => setActionType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dismiss">Rejeter (pas de violation)</SelectItem>
                  <SelectItem value="warn">Avertir l'utilisateur</SelectItem>
                  <SelectItem value="block">Bloquer l'utilisateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Note (optionnelle)</label>
              <Input
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                placeholder="Détails de l'action prise..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleProcessReport}>
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails du signalement</DialogTitle>
            <DialogDescription>
              ID: {selectedReport?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Signalé par:</span> {selectedReport.reporterName}
                </div>
                <div>
                  <span className="font-medium">Utilisateur signalé:</span> {selectedReport.reportedUserName}
                </div>
                <div>
                  <span className="font-medium">Raison:</span> {getReasonBadge(selectedReport.reason)}
                </div>
                <div>
                  <span className="font-medium">Statut:</span> {getStatusBadge(selectedReport.status)}
                </div>
                <div className="col-span-2">
                  <span className="font-medium">Description:</span>
                  <p className="mt-1 p-2 bg-muted rounded">{selectedReport.description}</p>
                </div>
                <div>
                  <span className="font-medium">Date:</span>{' '}
                  {selectedReport.createdAt?.toDate?.()?.toLocaleString?.('fr-FR') || '—'}
                </div>
                {selectedReport.reviewedAt && (
                  <div>
                    <span className="font-medium">Traité le:</span>{' '}
                    {selectedReport.reviewedAt?.toDate?.()?.toLocaleString?.('fr-FR') || '—'}
                  </div>
                )}
                {selectedReport.action && (
                  <div className="col-span-2">
                    <span className="font-medium">Action prise:</span>{' '}
                    <Badge>{selectedReport.action}</Badge>
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

export default AdminReportsPage;

