import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { VerificationService, VerificationRequest, VerificationDocument } from '@/services/verificationService';
import { CheckCircle2, XCircle, Clock, Eye, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { PDFViewerModal } from '@/components/verification/PDFViewerModal';

export const AdminVerificationsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<VerificationDocument[]>([]);
  const [selectedDocumentIndex, setSelectedDocumentIndex] = useState<number>(0);
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [currentPDFUrl, setCurrentPDFUrl] = useState<string>('');
  const [currentPDFName, setCurrentPDFName] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [revocationReason, setRevocationReason] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Ouvrir automatiquement le PDF quand un PDF est détecté
  useEffect(() => {
    if (showDocumentDialog && selectedDocuments[selectedDocumentIndex]) {
      const doc = selectedDocuments[selectedDocumentIndex];
      const docName = doc.filename || doc.fileName || 'Document';
      const isPDF = !docName.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/);
      
      if (isPDF && !showPDFModal) {
        setCurrentPDFUrl(doc.url);
        setCurrentPDFName(docName);
        setShowPDFModal(true);
        setShowDocumentDialog(false);
      }
    }
  }, [showDocumentDialog, selectedDocumentIndex, selectedDocuments, showPDFModal]);

  useEffect(() => {
    const unsubscribe = VerificationService.subscribeToAllRequests(
      filter === 'all' ? undefined : filter,
      (data) => {
        setRequests(data);
        setLoading(false);
      }
    );

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [filter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await VerificationService.getAllRequests(filter === 'all' ? undefined : filter);
      setRequests(data);
    } catch (error) {
      console.error('Erreur lors de la récupération:', error);
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest || !currentUser) return;

    try {
      await VerificationService.approveVerification(selectedRequest.id!, currentUser.uid);
      toast.success('Demande approuvée avec succès');
      setShowApproveDialog(false);
      setSelectedRequest(null);
      // Le listener Firestore mettra à jour automatiquement
    } catch (error) {
      console.error('Erreur lors de l\'approbation:', error);
      toast.error('Erreur lors de l\'approbation');
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !currentUser || !rejectionReason) return;

    try {
      await VerificationService.rejectVerification(selectedRequest.id!, rejectionReason, currentUser.uid);
      toast.success('Demande rejetée');
      setShowRejectDialog(false);
      setSelectedRequest(null);
      setRejectionReason('');
      // Le listener Firestore mettra à jour automatiquement
    } catch (error) {
      console.error('Erreur lors du rejet:', error);
      toast.error('Erreur lors du rejet');
    }
  };

  const openApproveDialog = async (request: VerificationRequest) => {
    // ✅ Marquer comme "en revue" dès l'ouverture
    if (request.status === 'documents_submitted' || request.status === 'pending') {
      await VerificationService.markAsUnderReview(request.id!, currentUser?.uid);
    }
    
    setSelectedRequest(request);
    setShowApproveDialog(true);
  };

  const openRejectDialog = (request: VerificationRequest) => {
    setSelectedRequest(request);
    setShowRejectDialog(true);
  };

  const openRevokeDialog = (request: VerificationRequest) => {
    setSelectedRequest(request);
    setShowRevokeDialog(true);
  };

  const openDocumentDialog = async (request: VerificationRequest, index?: number) => {
    // ✅ Marquer comme "en revue" quand l'admin ouvre un document
    if (request.status === 'documents_submitted' || request.status === 'pending') {
      await VerificationService.markAsUnderReview(request.id!, currentUser?.uid);
    }
    setSelectedDocuments(request.documents || []);
    setSelectedDocumentIndex(index ?? 0);
    setSelectedRequest(request);
    setShowDocumentDialog(true);
  };

  const handleRevoke = async () => {
    if (!selectedRequest || !currentUser || !revocationReason) return;

    try {
      await VerificationService.revokeVerification(selectedRequest.id!, revocationReason, currentUser.uid);
      toast.success('Certification révoquée');
      setShowRevokeDialog(false);
      setSelectedRequest(null);
      setRevocationReason('');
      // Le listener Firestore mettra à jour automatiquement
    } catch (error) {
      console.error('Erreur lors de la révocation:', error);
      toast.error('Erreur lors de la révocation');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
      case 'documents_submitted':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            En attente
          </Badge>
        );
      case 'approved':
      case 'verified':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Approuvé
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Rejeté
          </Badge>
        );
      case 'under_review':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Eye className="h-3 w-3 mr-1" />
            En revue
          </Badge>
        );
      case 'unverified':
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            Non vérifié
          </Badge>
        );
      case 'suspended':
        return (
          <Badge className="bg-orange-100 text-orange-800 border-orange-200">
            <XCircle className="h-3 w-3 mr-1" />
            Suspendu
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true;
    
    // Mapper les filtres anciens vers les nouveaux statuts
    if (filter === 'pending') {
      return req.status === 'pending' || req.status === 'documents_submitted' || req.status === 'under_review';
    }
    if (filter === 'approved') {
      return req.status === 'approved' || req.status === 'verified';
    }
    if (filter === 'rejected') {
      return req.status === 'rejected';
    }
    
    return req.status === filter;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending' || r.status === 'documents_submitted' || r.status === 'under_review').length,
    approved: requests.filter(r => r.status === 'approved' || r.status === 'verified').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Gestion des Vérifications</h1>
        <p className="text-muted-foreground">
          Approuver ou rejeter les demandes de vérification d'identité étudiante
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approuvées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rejetées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          Tous ({stats.total})
        </Button>
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('pending')}
        >
          En attente ({stats.pending})
        </Button>
        <Button
          variant={filter === 'approved' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('approved')}
        >
          Approuvées ({stats.approved})
        </Button>
        <Button
          variant={filter === 'rejected' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('rejected')}
        >
          Rejetées ({stats.rejected})
        </Button>
      </div>

      {/* Liste des demandes */}
      {loading ? (
        <Card>
          <CardContent className="py-12">
            <RefreshCw className="h-8 w-8 animate-spin mb-2" />
            <p className="text-muted-foreground">Chargement...</p>
          </CardContent>
        </Card>
      ) : filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-muted-foreground">Aucune demande trouvée</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="text-left">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{request.userName}</CardTitle>
                      {getStatusBadge(request.status)}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1 text-left">
                      <p className="text-left">📧 {request.userEmail}</p>
                      {request.university && <p className="text-left">🏫 {request.university}</p>}
                      {request.metadata?.university && <p className="text-left">🏫 {request.metadata.university}</p>}
                      {request.studentId && <p className="text-left">🆔 Numéro étudiant : {request.studentId}</p>}
                      {request.metadata?.studentId && <p className="text-left">🆔 Numéro étudiant : {request.metadata.studentId}</p>}
                      {(request.requestedAt || request.submittedAt) && <p className="text-left">📅 Demande le : {formatDate(request.requestedAt || request.submittedAt)}</p>}
                    </div>
                  </div>
                  {(request.status === 'pending' || request.status === 'documents_submitted' || request.status === 'under_review') && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDocumentDialog(request)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Voir docs
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-600 border-green-600 hover:bg-green-50"
                        onClick={() => openApproveDialog(request)}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Approuver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                        onClick={() => openRejectDialog(request)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Rejeter
                      </Button>
                    </div>
                  )}
                  {(request.status === 'verified' || request.status === 'approved') && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDocumentDialog(request)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Voir docs
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-orange-600 border-orange-600 hover:bg-orange-50"
                        onClick={() => openRevokeDialog(request)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Révoquer
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              {request.documents && request.documents.length > 0 && (
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {request.documents.map((doc, index) => (
                        <div 
                          key={index}
                          className="border rounded-lg p-2 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => openDocumentDialog(request, index)}
                        >
                          {(doc.filename || doc.fileName)?.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/) ? (
                            <img 
                              src={doc.url} 
                              alt={doc.filename || doc.fileName || 'Document'}
                              className="w-full h-32 object-cover rounded"
                            />
                          ) : (
                            <div className="w-full h-32 bg-muted flex items-center justify-center rounded">
                              📄 PDF
                            </div>
                          )}
                          <p className="text-xs mt-1 truncate">{doc.filename || doc.fileName || 'Document'}</p>
                        </div>
                      ))}
                    </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Dialog Approuver */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approuver la demande de vérification</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir approuver la demande de vérification de {selectedRequest?.userName} ?
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
              Approuver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Rejeter */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter la demande de vérification</DialogTitle>
            <DialogDescription>
              Veuillez fournir un motif de rejet pour {selectedRequest?.userName}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Motif de rejet (ex: Documents invalides)"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleReject}
              disabled={!rejectionReason}
              className="bg-red-600 hover:bg-red-700"
            >
              Rejeter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Révoquer */}
      <Dialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Révoquer la certification</DialogTitle>
            <DialogDescription>
              Veuillez fournir un motif de révocation pour {selectedRequest?.userName}
              {selectedRequest?.status === 'verified' && ' (statut actuel: Vérifié)'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Motif de révocation (ex: Documents frauduleux détectés)"
              value={revocationReason}
              onChange={(e) => setRevocationReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRevokeDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleRevoke}
              disabled={!revocationReason}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Révoquer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Document */}
      <Dialog open={showDocumentDialog} onOpenChange={setShowDocumentDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Documents de vérification</DialogTitle>
            <DialogDescription>
              Documents soumis par {selectedRequest?.userName}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedDocuments[selectedDocumentIndex] && (() => {
              const doc = selectedDocuments[selectedDocumentIndex];
              const docName = doc.filename || doc.fileName || 'Document';
              const isImage = docName.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/);
              
              return (
                <div className="space-y-4">
                  {/* Navigation */}
                  {selectedDocuments.length > 1 && (
                    <div className="flex items-center justify-between mb-4">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={selectedDocumentIndex === 0}
                        onClick={() => setSelectedDocumentIndex(selectedDocumentIndex - 1)}
                      >
                        ← Précédent
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {selectedDocumentIndex + 1} / {selectedDocuments.length}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={selectedDocumentIndex === selectedDocuments.length - 1}
                        onClick={() => setSelectedDocumentIndex(selectedDocumentIndex + 1)}
                      >
                        Suivant →
                      </Button>
                    </div>
                  )}
                  
                  {/* Document */}
                  {isImage ? (
                    <img 
                      src={doc.url} 
                      alt={docName} 
                      className="w-full max-h-[600px] object-contain rounded-lg border border-border mx-auto"
                    />
                  ) : (
                    <div className="w-full min-h-[600px] bg-muted rounded-lg flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <p className="text-6xl mb-4">📄</p>
                        <p className="text-lg font-semibold mb-4">{docName}</p>
                        <p className="text-sm text-muted-foreground mb-4">Chargement du PDF en arrière-plan...</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDocumentDialog(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Viewer Modal */}
      <PDFViewerModal
        isOpen={showPDFModal}
        onClose={() => setShowPDFModal(false)}
        documentUrl={currentPDFUrl}
        documentName={currentPDFName}
      />
    </div>
  );
};

