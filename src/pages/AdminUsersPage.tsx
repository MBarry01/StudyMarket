import React, { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, limit, query, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, Unlock, Eye, RefreshCw, Download, UserCog } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toast from 'react-hot-toast';

interface AdminUserRow {
  id: string;
  email?: string;
  displayName?: string;
  university?: string;
  isVerified?: boolean;
  blocked?: boolean;
  blockedReason?: string;
  role?: string;
  co2Saved?: number;
  transactionsCount?: number;
  createdAt?: any;
  lastSeen?: any;
}

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, statusFilter]);

  const fetchUsers = async () => {
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(100));
      const snap = await getDocs(q);
      setUsers(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    if (statusFilter !== 'all') {
      if (statusFilter === 'verified') filtered = filtered.filter(u => u.isVerified);
      if (statusFilter === 'blocked') filtered = filtered.filter(u => u.blocked);
      if (statusFilter === 'unverified') filtered = filtered.filter(u => !u.isVerified);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(u =>
        u.email?.toLowerCase().includes(q) ||
        u.displayName?.toLowerCase().includes(q) ||
        u.university?.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q)
      );
    }

    setFilteredUsers(filtered);
  };

  const handleBlockUser = async (block: boolean) => {
    if (!selectedUser) return;

    try {
      const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      const response = await fetch(`${apiBase}/api/admin/users/${selectedUser.id}/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blocked: block,
          reason: blockReason
        }),
      });

      if (!response.ok) throw new Error('Erreur lors du blocage');

      toast.success(block ? 'Utilisateur bloqué' : 'Utilisateur débloqué');
      setShowBlockDialog(false);
      setBlockReason('');
      fetchUsers();
    } catch (error: any) {
      console.error('Block user error:', error);
      toast.error(error.message || 'Erreur lors du blocage');
    }
  };

  const handleVerifyUser = async (user: AdminUserRow) => {
    try {
      await updateDoc(doc(db, 'users', user.id), {
        isVerified: true,
        verificationStatus: 'verified',
        updatedAt: new Date(),
      });
      toast.success('Utilisateur vérifié');
      fetchUsers();
    } catch (error) {
      console.error('Verify error:', error);
      toast.error('Erreur lors de la vérification');
    }
  };

  const handleChangeRole = async (user: AdminUserRow, newRole: string) => {
    try {
      await updateDoc(doc(db, 'users', user.id), {
        role: newRole,
        updatedAt: new Date(),
      });
      toast.success(`Rôle changé vers ${newRole}`);
      fetchUsers();
    } catch (error) {
      console.error('Change role error:', error);
      toast.error('Erreur lors du changement de rôle');
    }
  };

  const exportCSV = () => {
    const csv = [
      ['ID', 'Name', 'Email', 'University', 'Verified', 'Blocked', 'CO2 Saved', 'Transactions', 'Created'],
      ...filteredUsers.map(u => [
        u.id,
        u.displayName || '',
        u.email || '',
        u.university || '',
        u.isVerified ? 'Yes' : 'No',
        u.blocked ? 'Yes' : 'No',
        u.co2Saved || 0,
        u.transactionsCount || 0,
        u.createdAt?.toDate?.()?.toISOString?.() || '',
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Export CSV téléchargé');
  };

  const getStatusBadge = (user: AdminUserRow) => {
    if (user.blocked) return <Badge className="bg-red-500 text-white">Bloqué</Badge>;
    if (user.isVerified) return <Badge className="bg-green-500 text-white">Vérifié</Badge>;
    return <Badge className="bg-yellow-500 text-white">Non vérifié</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion des utilisateurs</h2>
          <p className="text-sm text-muted-foreground">
            {filteredUsers.length} utilisateur(s) sur {users.length}
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
          placeholder="Rechercher nom, email, université..."
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
            <SelectItem value="verified">Vérifiés</SelectItem>
            <SelectItem value="unverified">Non vérifiés</SelectItem>
            <SelectItem value="blocked">Bloqués</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchUsers}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Rafraîchir
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-left py-">Chargement…</div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-left py- rounded-md border border-border bg-muted/50">
          <p className="text-muted-foreground">
            Aucun utilisateur trouvé.
            {users.length === 0 && ' La collection users est vide.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-3 font-medium">ID</th>
                <th className="text-left px-3 py-3 font-medium">Nom</th>
                <th className="text-left px-3 py-3 font-medium">Email</th>
                <th className="text-left px-3 py-3 font-medium">Université</th>
                <th className="text-left px-3 py-3 font-medium">Statut</th>
                <th className="text-left px-3 py-3 font-medium">CO₂</th>
                <th className="text-right px-3 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id} className="border-t border-border hover:bg-muted/50">
                  <td className="px-3 py-3 font-mono text-xs">{u.id.slice(0, 8)}...</td>
                  <td className="px-3 py-3">{u.displayName || '—'}</td>
                  <td className="px-3 py-3">{u.email || '—'}</td>
                  <td className="px-3 py-3">{u.university || '—'}</td>
                  <td className="px-3 py-3">{getStatusBadge(u)}</td>
                  <td className="px-3 py-3">{u.co2Saved || 0} kg</td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedUser(u);
                          setShowDetailDialog(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {!u.isVerified && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleVerifyUser(u)}
                          title="Vérifier"
                        >
                          <Shield className="w-4 h-4 text-green-600" />
                        </Button>
                      )}
                      {u.blocked ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedUser(u);
                            handleBlockUser(false);
                          }}
                          title="Débloquer"
                        >
                          <Unlock className="w-4 h-4 text-green-600" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedUser(u);
                            setShowBlockDialog(true);
                          }}
                          title="Bloquer"
                        >
                          <Lock className="w-4 h-4 text-red-600" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Changer rôle"
                        onClick={() => {
                          const newRole = prompt('Nouveau rôle (user/admin/moderator):', u.role || 'user');
                          if (newRole) handleChangeRole(u, newRole);
                        }}
                      >
                        <UserCog className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Block Dialog */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bloquer l'utilisateur</DialogTitle>
            <DialogDescription>
              {selectedUser?.displayName} ({selectedUser?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Raison du blocage</label>
              <Input
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Violation des conditions, spam, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBlockDialog(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={() => handleBlockUser(true)}>
              Bloquer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détail utilisateur</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">ID:</span> {selectedUser.id}
                </div>
                <div>
                  <span className="font-medium">Statut:</span> {getStatusBadge(selectedUser)}
                </div>
                <div>
                  <span className="font-medium">Nom:</span> {selectedUser.displayName || '—'}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {selectedUser.email || '—'}
                </div>
                <div>
                  <span className="font-medium">Université:</span> {selectedUser.university || '—'}
                </div>
                <div>
                  <span className="font-medium">Rôle:</span> {selectedUser.role || 'user'}
                </div>
                <div>
                  <span className="font-medium">CO₂ économisé:</span> {selectedUser.co2Saved || 0} kg
                </div>
                <div>
                  <span className="font-medium">Transactions:</span> {selectedUser.transactionsCount || 0}
                </div>
                {selectedUser.blocked && (
                  <div className="col-span-2">
                    <span className="font-medium text-red-600">Raison blocage:</span>{' '}
                    {selectedUser.blockedReason || 'Non spécifiée'}
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

export default AdminUsersPage;

