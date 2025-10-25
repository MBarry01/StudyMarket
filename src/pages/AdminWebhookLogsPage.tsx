import React, { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, limit, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Eye, RefreshCw, Download, Play, AlertCircle } from 'lucide-react';
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

interface WebhookLog {
  id: string;
  event: string;
  type?: string;
  status: 'success' | 'failed' | 'pending';
  orderId?: string;
  paymentIntentId?: string;
  error?: string;
  payload?: any;
  response?: any;
  timestamp?: any;
  retryCount?: number;
  processingTime?: number;
}

const AdminWebhookLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [reprocessing, setReprocessing] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, searchQuery, statusFilter, eventTypeFilter]);

  const fetchLogs = async () => {
    try {
      const q = query(
        collection(db, 'webhook_logs'),
        orderBy('timestamp', 'desc'),
        limit(200)
      );
      const snap = await getDocs(q);
      setLogs(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    } catch (error) {
      console.error('Fetch logs error:', error);
      toast.error('Erreur lors du chargement des logs webhook');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };


  const filterLogs = () => {
    let filtered = [...logs];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(l => l.status === statusFilter);
    }

    if (eventTypeFilter !== 'all') {
      filtered = filtered.filter(l => l.event?.includes(eventTypeFilter) || l.type?.includes(eventTypeFilter));
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(l =>
        l.event?.toLowerCase().includes(q) ||
        l.orderId?.toLowerCase().includes(q) ||
        l.paymentIntentId?.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q)
      );
    }

    setFilteredLogs(filtered);
  };

  const handleReprocess = async (log: WebhookLog) => {
    if (!log.orderId) {
      toast.error('Pas de commande associée');
      return;
    }

    setReprocessing(log.id);

    try {
      const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      const response = await fetch(`${apiBase}/api/admin/webhooks/${log.id}/reprocess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: log.orderId,
          paymentIntentId: log.paymentIntentId,
          event: log.event,
        }),
      });

      if (!response.ok) throw new Error('Erreur lors du reprocess');

      toast.success('Webhook retraité avec succès');
      fetchLogs();
    } catch (error: any) {
      console.error('Reprocess error:', error);
      toast.error(error.message || 'Erreur lors du reprocess');
    } finally {
      setReprocessing(null);
    }
  };

  const exportCSV = () => {
    const csv = [
      ['ID', 'Event', 'Status', 'Order ID', 'Payment Intent', 'Retry Count', 'Processing Time', 'Error', 'Timestamp'],
      ...filteredLogs.map(l => [
        l.id,
        l.event || l.type || '',
        l.status,
        l.orderId || '',
        l.paymentIntentId || '',
        l.retryCount || 0,
        l.processingTime || 0,
        l.error || '',
        l.timestamp?.toDate?.()?.toISOString?.() || '',
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `webhook-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Export CSV téléchargé');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      success: 'bg-green-500 text-white',
      failed: 'bg-red-500 text-white',
      pending: 'bg-yellow-500 text-white',
    };
    return <Badge className={variants[status] || 'bg-gray-500 text-white'}>{status}</Badge>;
  };

  const getEventBadge = (event?: string) => {
    if (!event) return null;
    const color = event.includes('succeeded') || event.includes('charge.succeeded')
      ? 'bg-blue-500 text-white'
      : event.includes('failed')
      ? 'bg-blue-500 text-white'
      : event.includes('refunded')
      ? 'bg-purple-500 text-white'
      : 'bg-gray-500 text-white';
    
    return <Badge className={color}>{event}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Webhook Logs</h2>
          <p className="text-sm text-muted-foreground">
            {filteredLogs.length} log(s) sur {logs.length}
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
          placeholder="Rechercher event, order ID, payment intent..."
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
            <SelectItem value="success">Succès</SelectItem>
            <SelectItem value="failed">Échoué</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
          </SelectContent>
        </Select>
        <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Type d'événement" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous événements</SelectItem>
            <SelectItem value="payment_intent">Payment Intent</SelectItem>
            <SelectItem value="charge">Charge</SelectItem>
            <SelectItem value="refund">Refund</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchLogs}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Rafraîchir
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="text-sm text-muted-foreground">Total</div>
          <div className="text-2xl font-bold">{logs.length}</div>
        </div>
        <div className="p-4 rounded-lg border border-green-500/20 bg-green-500/10">
          <div className="text-sm text-green-700 dark:text-green-300">Succès</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {logs.filter(l => l.status === 'success').length}
          </div>
        </div>
        <div className="p-4 rounded-lg border border-red-500/20 bg-red-500/10">
          <div className="text-sm text-red-700 dark:text-red-300">Échecs</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {logs.filter(l => l.status === 'failed').length}
          </div>
        </div>
        <div className="p-4 rounded-lg border border-yellow-500/20 bg-yellow-500/10">
          <div className="text-sm text-yellow-700 dark:text-yellow-300">En attente</div>
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {logs.filter(l => l.status === 'pending').length}
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-8">Chargement…</div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-12 rounded-md border border-border bg-muted/50">
          <p className="text-muted-foreground">
            Aucun log webhook trouvé.
            {logs.length === 0 && ' La collection webhook_logs est vide.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-3 font-medium">Timestamp</th>
                <th className="text-left px-3 py-3 font-medium">Event</th>
                <th className="text-left px-3 py-3 font-medium">Statut</th>
                <th className="text-left px-3 py-3 font-medium">Order ID</th>
                <th className="text-left px-3 py-3 font-medium">Retry</th>
                <th className="text-left px-3 py-3 font-medium">Temps</th>
                <th className="text-right px-3 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((l) => (
                <tr key={l.id} className="border-t border-border hover:bg-muted/50">
                  <td className="px-3 py-3 text-xs">
                    {l.timestamp?.toDate?.()?.toLocaleString?.('fr-FR') || '—'}
                  </td>
                  <td className="px-3 py-3">{getEventBadge(l.event || l.type)}</td>
                  <td className="px-3 py-3">{getStatusBadge(l.status)}</td>
                  <td className="px-3 py-3 font-mono text-xs">{l.orderId?.slice(0, 12) || '—'}</td>
                  <td className="px-3 py-3">
                    {l.retryCount ? (
                      <span className="flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-blue-500" />
                        {l.retryCount}
                      </span>
                    ) : (
                      '0'
                    )}
                  </td>
                  <td className="px-3 py-3">{l.processingTime ? `${l.processingTime}ms` : '—'}</td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-1">
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
                      {l.status === 'failed' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleReprocess(l)}
                          disabled={reprocessing === l.id}
                          title="Retraiter"
                        >
                          <Play className="w-4 h-4 text-blue-600" />
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

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détail du webhook</DialogTitle>
            <DialogDescription>
              ID: {selectedLog?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Event:</span> {getEventBadge(selectedLog.event || selectedLog.type)}
                </div>
                <div>
                  <span className="font-medium">Statut:</span> {getStatusBadge(selectedLog.status)}
                </div>
                <div>
                  <span className="font-medium">Order ID:</span> {selectedLog.orderId || '—'}
                </div>
                <div>
                  <span className="font-medium">Payment Intent:</span> {selectedLog.paymentIntentId || '—'}
                </div>
                <div>
                  <span className="font-medium">Retry Count:</span> {selectedLog.retryCount || 0}
                </div>
                <div>
                  <span className="font-medium">Processing Time:</span> {selectedLog.processingTime ? `${selectedLog.processingTime}ms` : '—'}
                </div>
                <div className="col-span-2">
                  <span className="font-medium">Timestamp:</span>{' '}
                  {selectedLog.timestamp?.toDate?.()?.toLocaleString?.('fr-FR') || '—'}
                </div>
                {selectedLog.error && (
                  <div className="col-span-2">
                    <span className="font-medium text-red-600">Error:</span>{' '}
                    <span className="text-red-600">{selectedLog.error}</span>
                  </div>
                )}
              </div>

              {selectedLog.payload && (
                <div>
                  <div className="font-medium mb-2">Payload:</div>
                  <pre className="p-3 bg-muted rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.payload, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.response && (
                <div>
                  <div className="font-medium mb-2">Response:</div>
                  <pre className="p-3 bg-muted rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.response, null, 2)}
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

export default AdminWebhookLogsPage;

