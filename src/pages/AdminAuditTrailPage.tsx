import React, { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, limit, query, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Eye, RefreshCw, Download, Shield, User } from 'lucide-react';
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

interface AuditLog {
  id: string;
  action: string;
  entity: string; // 'user', 'order', 'listing', 'payout', 'webhook'
  entityId: string;
  adminId: string;
  adminEmail?: string;
  adminName?: string;
  details?: any;
  before?: any;
  after?: any;
  timestamp?: any;
  ipAddress?: string;
  userAgent?: string;
}

const AdminAuditTrailPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, searchQuery, actionFilter, entityFilter]);

  const fetchLogs = async () => {
    try {
      const q = query(
        collection(db, 'audit_logs'),
        orderBy('timestamp', 'desc'),
        limit(200)
      );
      const snap = await getDocs(q);
      setLogs(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    } catch (error) {
      console.error('Fetch audit logs error:', error);
      toast.error('Erreur lors du chargement des logs audit');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };


  const filterLogs = () => {
    let filtered = [...logs];

    if (actionFilter !== 'all') {
      filtered = filtered.filter(l => l.action.includes(actionFilter));
    }

    if (entityFilter !== 'all') {
      filtered = filtered.filter(l => l.entity === entityFilter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(l =>
        l.action?.toLowerCase().includes(q) ||
        l.adminEmail?.toLowerCase().includes(q) ||
        l.adminName?.toLowerCase().includes(q) ||
        l.entityId.toLowerCase().includes(q)
      );
    }

    setFilteredLogs(filtered);
  };

  const exportCSV = () => {
    const csv = [
      ['Timestamp', 'Admin', 'Email', 'Action', 'Entity', 'Entity ID', 'IP Address'],
      ...filteredLogs.map(l => [
        l.timestamp?.toDate?.()?.toISOString?.() || '',
        l.adminName || '',
        l.adminEmail || '',
        l.action,
        l.entity,
        l.entityId,
        l.ipAddress || '',
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-trail-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Export CSV téléchargé');
  };

  const getActionBadge = (action: string) => {
    if (action.includes('block') || action.includes('remove') || action.includes('delete') || action.includes('reject')) {
      return <Badge className="bg-red-500 text-white">{action}</Badge>;
    }
    if (action.includes('approve') || action.includes('verify') || action.includes('unblock')) {
      return <Badge className="bg-green-500 text-white">{action}</Badge>;
    }
    if (action.includes('refund') || action.includes('replay') || action.includes('reprocess')) {
      return <Badge className="bg-blue-500 text-white">{action}</Badge>;
    }
    return <Badge className="bg-gray-500 text-white">{action}</Badge>;
  };

  const getEntityIcon = (entity: string) => {
    const icons: Record<string, JSX.Element> = {
      user: <User className="w-4 h-4" />,
      order: <Shield className="w-4 h-4" />,
      listing: <Shield className="w-4 h-4" />,
      payout: <Shield className="w-4 h-4" />,
      webhook: <Shield className="w-4 h-4" />,
    };
    return icons[entity] || <Shield className="w-4 h-4" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Audit Trail</h2>
          <p className="text-sm text-muted-foreground">
            Historique des actions administratives - {filteredLogs.length} entrée(s)
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
          placeholder="Rechercher action, admin, entity..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-xs"
        />
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes actions</SelectItem>
            <SelectItem value="block">Block/Unblock</SelectItem>
            <SelectItem value="approve">Approve</SelectItem>
            <SelectItem value="refund">Refund</SelectItem>
            <SelectItem value="delete">Delete</SelectItem>
            <SelectItem value="verify">Verify</SelectItem>
          </SelectContent>
        </Select>
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Entity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes entités</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="order">Order</SelectItem>
            <SelectItem value="listing">Listing</SelectItem>
            <SelectItem value="payout">Payout</SelectItem>
            <SelectItem value="webhook">Webhook</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchLogs}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Rafraîchir
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
        {['user', 'order', 'listing', 'payout', 'webhook'].map(entity => (
          <div key={entity} className="p-3 rounded-md border border-border bg-card">
            <div className="text-xs text-muted-foreground capitalize">{entity}s</div>
            <div className="text-xl font-bold">
              {logs.filter(l => l.entity === entity).length}
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-left py-">Chargement…</div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-left py- rounded-md border border-border bg-muted/50">
          <p className="text-muted-foreground">
            Aucun log audit trouvé.
            {logs.length === 0 && ' La collection audit_logs est vide.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-3 font-medium">Timestamp</th>
                <th className="text-left px-3 py-3 font-medium">Admin</th>
                <th className="text-left px-3 py-3 font-medium">Action</th>
                <th className="text-left px-3 py-3 font-medium">Entity</th>
                <th className="text-left px-3 py-3 font-medium">Entity ID</th>
                <th className="text-right px-3 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((l) => (
                <tr key={l.id} className="border-t border-border hover:bg-muted/50">
                  <td className="px-3 py-3 text-xs">
                    {l.timestamp?.toDate?.()?.toLocaleString?.('fr-FR') || '—'}
                  </td>
                  <td className="px-3 py-3">
                    <div>
                      <div className="font-medium">{l.adminName || 'Admin'}</div>
                      <div className="text-xs text-muted-foreground">{l.adminEmail || '—'}</div>
                    </div>
                  </td>
                  <td className="px-3 py-3">{getActionBadge(l.action)}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      {getEntityIcon(l.entity)}
                      <span className="capitalize">{l.entity}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 font-mono text-xs">{l.entityId.slice(0, 12)}...</td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedLog(l);
                          setShowDetailDialog(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détail de l'action</DialogTitle>
            <DialogDescription>
              Audit Log ID: {selectedLog?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Admin:</span> {selectedLog.adminName || '—'}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {selectedLog.adminEmail || '—'}
                </div>
                <div>
                  <span className="font-medium">Action:</span> {getActionBadge(selectedLog.action)}
                </div>
                <div>
                  <span className="font-medium">Entity:</span>{' '}
                  <span className="capitalize">{selectedLog.entity}</span>
                </div>
                <div className="col-span-2">
                  <span className="font-medium">Entity ID:</span> {selectedLog.entityId}
                </div>
                <div>
                  <span className="font-medium">IP Address:</span> {selectedLog.ipAddress || '—'}
                </div>
                <div>
                  <span className="font-medium">Timestamp:</span>{' '}
                  {selectedLog.timestamp?.toDate?.()?.toLocaleString?.('fr-FR') || '—'}
                </div>
              </div>

              {selectedLog.details && (
                <div>
                  <div className="font-medium mb-2">Détails:</div>
                  <pre className="p-3 bg-muted rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.before && (
                <div>
                  <div className="font-medium mb-2">État avant:</div>
                  <pre className="p-3 bg-muted rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.before, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.after && (
                <div>
                  <div className="font-medium mb-2">État après:</div>
                  <pre className="p-3 bg-muted rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.after, null, 2)}
                  </pre>
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

export default AdminAuditTrailPage;

