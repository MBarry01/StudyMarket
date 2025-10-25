import React, { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, limit, query, updateDoc, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Eye, Trash2, AlertTriangle, RefreshCw, Download, MessageSquare } from 'lucide-react';
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

interface ConversationRow {
  id: string;
  participants: string[];
  participantDetails: {
    [userId: string]: {
      name: string;
      avatar?: string;
      university: string;
      verified: boolean;
      email?: string;
    };
  };
  listingId: string;
  listingTitle: string;
  listingPrice: number;
  lastMessage?: {
    text: string;
    sentAt: any;
    senderId: string;
    senderName: string;
  };
  unreadCount: { [userId: string]: number };
  status: 'active' | 'archived' | 'blocked';
  blockedBy?: string[];
  createdAt: any;
  updatedAt: any;
  messageCount?: number;
}

const AdminMessagesPage: React.FC = () => {
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<ConversationRow | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [conversationMessages, setConversationMessages] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    filterConversations();
  }, [conversations, searchQuery, statusFilter]);

  const fetchConversations = async () => {
    try {
      const q = query(
        collection(db, 'conversations'),
        orderBy('updatedAt', 'desc'),
        limit(100)
      );
      const snap = await getDocs(q);
      
      const conversationsWithMessages = await Promise.all(
        snap.docs.map(async (d) => {
          const data = d.data();
          
          // Compter les messages
          const messagesSnap = await getDocs(collection(db, 'conversations', d.id, 'messages'));
          
          // S'assurer que participants est un array
          const participants = Array.isArray(data.participants) ? data.participants : [];
          
          return {
            id: d.id,
            participants: participants,
            participantDetails: data.participantDetails || {},
            listingId: data.listingId || '',
            listingTitle: data.listingTitle || '',
            listingPrice: data.listingPrice || 0,
            lastMessage: data.lastMessage,
            unreadCount: data.unreadCount || {},
            status: data.status || 'active',
            blockedBy: Array.isArray(data.blockedBy) ? data.blockedBy : [],
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            messageCount: messagesSnap.size,
          };
        })
      );
      
      setConversations(conversationsWithMessages);
    } catch (error) {
      console.error('Fetch conversations error:', error);
      toast.error('Erreur lors du chargement des conversations');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const filterConversations = () => {
    let filtered = [...conversations];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.listingTitle?.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        Object.values(c.participantDetails).some(p => p.name?.toLowerCase().includes(q))
      );
    }

    setFilteredConversations(filtered);
  };

  const loadConversationMessages = async (conversationId: string) => {
    try {
      const messagesSnap = await getDocs(
        query(
          collection(db, 'conversations', conversationId, 'messages'),
          orderBy('sentAt', 'asc')
        )
      );
      
      const messages = messagesSnap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      
      setConversationMessages(messages);
    } catch (error) {
      console.error('Load messages error:', error);
      toast.error('Erreur lors du chargement des messages');
    }
  };

  const handleViewConversation = async (conversation: ConversationRow) => {
    setSelectedConversation(conversation);
    await loadConversationMessages(conversation.id);
    setShowDetailDialog(true);
  };

  const handleDeleteConversation = async () => {
    if (!selectedConversation) return;

    try {
      // Supprimer tous les messages
      const messagesSnap = await getDocs(collection(db, 'conversations', selectedConversation.id, 'messages'));
      const batch = messagesSnap.docs.map(d => deleteDoc(d.ref));
      await Promise.all(batch);
      
      // Supprimer la conversation
      await deleteDoc(doc(db, 'conversations', selectedConversation.id));
      
      toast.success('Conversation supprimée');
      setShowDeleteDialog(false);
      fetchConversations();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleBlockConversation = async (conversation: ConversationRow) => {
    try {
      await updateDoc(doc(db, 'conversations', conversation.id), {
        status: 'blocked',
        updatedAt: new Date(),
      });
      toast.success('Conversation bloquée');
      fetchConversations();
    } catch (error) {
      console.error('Block error:', error);
      toast.error('Erreur lors du blocage');
    }
  };

  const handleUnblockConversation = async (conversation: ConversationRow) => {
    try {
      await updateDoc(doc(db, 'conversations', conversation.id), {
        status: 'active',
        blockedBy: [],
        updatedAt: new Date(),
      });
      toast.success('Conversation débloquée');
      fetchConversations();
    } catch (error) {
      console.error('Unblock error:', error);
      toast.error('Erreur lors du déblocage');
    }
  };

  const exportCSV = () => {
    const csv = [
      ['ID', 'Listing', 'Participants', 'Messages', 'Status', 'Last Message', 'Created'],
      ...filteredConversations.map(c => [
        c.id,
        c.listingTitle || '',
        c.participants.map(p => c.participantDetails[p]?.name || p).join(' & '),
        c.messageCount || 0,
        c.status,
        c.lastMessage?.text || '',
        c.createdAt?.toDate?.()?.toISOString?.() || '',
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Export CSV téléchargé');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: 'bg-green-500 text-white',
      archived: 'bg-gray-500 text-white',
      blocked: 'bg-red-500 text-white',
    };
    return <Badge className={variants[status] || 'bg-gray-500 text-white'}>{status}</Badge>;
  };

  const getParticipantsNames = (conv: ConversationRow) => {
    if (!conv.participants || !Array.isArray(conv.participants)) {
      return 'Participants inconnus';
    }
    return conv.participants
      .map(p => conv.participantDetails[p]?.name || 'Inconnu')
      .join(' & ');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Messages</h2>
          <p className="text-sm text-muted-foreground">
            {filteredConversations.length} conversation(s) sur {conversations.length}
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
          <div className="text-2xl font-bold">{conversations.length}</div>
        </div>
        <div className="p-4 rounded-lg border border-green-500/20 bg-green-500/10">
          <div className="text-sm text-green-700 dark:text-green-300">Actives</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {conversations.filter(c => c.status === 'active').length}
          </div>
        </div>
        <div className="p-4 rounded-lg border border-red-500/20 bg-red-500/10">
          <div className="text-sm text-red-700 dark:text-red-300">Bloquées</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {conversations.filter(c => c.status === 'blocked').length}
          </div>
        </div>
        <div className="p-4 rounded-lg border border-blue-500/20 bg-blue-500/10">
          <div className="text-sm text-blue-700 dark:text-blue-300">Messages totaux</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {conversations.reduce((sum, c) => sum + (c.messageCount || 0), 0)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Rechercher annonce, participants..."
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
            <SelectItem value="active">Actives</SelectItem>
            <SelectItem value="blocked">Bloquées</SelectItem>
            <SelectItem value="archived">Archivées</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchConversations}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Rafraîchir
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-8">Chargement…</div>
      ) : filteredConversations.length === 0 ? (
        <div className="text-center py-12 rounded-md border border-border bg-muted/50">
          <p className="text-muted-foreground">
            Aucune conversation trouvée.
            {conversations.length === 0 && ' La collection conversations est vide.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-3 font-medium">Annonce</th>
                <th className="text-left px-3 py-3 font-medium">Participants</th>
                <th className="text-left px-3 py-3 font-medium">Messages</th>
                <th className="text-left px-3 py-3 font-medium">Statut</th>
                <th className="text-left px-3 py-3 font-medium">Dernier message</th>
                <th className="text-right px-3 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredConversations.map((c) => (
                <tr key={c.id} className="border-t border-border hover:bg-muted/50">
                  <td className="px-3 py-3">
                    <div>
                      <div className="font-medium">{c.listingTitle}</div>
                      <div className="text-xs text-muted-foreground">{c.listingPrice} €</div>
                    </div>
                  </td>
                  <td className="px-3 py-3">{getParticipantsNames(c)}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      {c.messageCount || 0}
                    </div>
                  </td>
                  <td className="px-3 py-3">{getStatusBadge(c.status)}</td>
                  <td className="px-3 py-3 max-w-xs truncate">
                    {c.lastMessage?.text || '—'}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewConversation(c)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {c.status === 'blocked' ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUnblockConversation(c)}
                          title="Débloquer"
                        >
                          <AlertTriangle className="w-4 h-4 text-green-600" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleBlockConversation(c)}
                          title="Bloquer"
                        >
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedConversation(c);
                          setShowDeleteDialog(true);
                        }}
                        title="Supprimer"
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
            <DialogTitle>Supprimer la conversation</DialogTitle>
            <DialogDescription>
              {selectedConversation?.listingTitle}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Cette action est irréversible. Tous les messages seront définitivement supprimés.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteConversation}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de la conversation</DialogTitle>
            <DialogDescription>
              ID: {selectedConversation?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedConversation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Annonce:</span> {selectedConversation.listingTitle}
                </div>
                <div>
                  <span className="font-medium">Prix:</span> {selectedConversation.listingPrice} €
                </div>
                <div>
                  <span className="font-medium">Statut:</span> {getStatusBadge(selectedConversation.status)}
                </div>
                <div>
                  <span className="font-medium">Messages:</span> {selectedConversation.messageCount || 0}
                </div>
                <div className="col-span-2">
                  <span className="font-medium">Participants:</span>
                  <div className="mt-2 space-y-2">
                    {Array.isArray(selectedConversation.participants) && selectedConversation.participants.map(p => {
                      const details = selectedConversation.participantDetails[p];
                      return (
                        <div key={p} className="flex items-center gap-2 p-2 bg-muted rounded">
                          <div>
                            <div className="font-medium">{details?.name || 'Inconnu'}</div>
                            <div className="text-xs text-muted-foreground">{details?.university}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div>
                <div className="font-medium mb-2">Messages ({conversationMessages.length}):</div>
                <div className="max-h-96 overflow-y-auto space-y-2 p-3 bg-muted rounded">
                  {conversationMessages.map((msg, idx) => (
                    <div key={idx} className="p-2 bg-card rounded text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{msg.senderName}</span>
                        <span className="text-muted-foreground">
                          {msg.sentAt?.toDate?.()?.toLocaleString?.('fr-FR') || '—'}
                        </span>
                      </div>
                      <p className="text-foreground">{msg.text}</p>
                    </div>
                  ))}
                </div>
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

export default AdminMessagesPage;

