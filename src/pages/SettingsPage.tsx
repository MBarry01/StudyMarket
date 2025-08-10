import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  Bell,
  Shield,
  Eye,
  Trash2,
  Save,
  AlertTriangle,
  Mail,
  Smartphone,
  MapPin,
  GraduationCap,
  Lock,
  Key,
  Download,
  Upload,
  Settings as SettingsIcon,
  Palette,
  Globe,
  MessageCircle,
  Heart,
  Star,
  Package,
  HelpCircle,
  ExternalLink,
  CheckCircle,
  Loader2,
  Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '../contexts/AuthContext';
import { updatePassword, updateEmail, EmailAuthProvider, reauthenticateWithCredential, deleteUser } from 'firebase/auth';
import { doc, updateDoc, deleteDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ProfilePhotoUpload } from '../components/profile/ProfilePhotoUpload';
import toast from 'react-hot-toast';

// Schémas de validation
const profileSchema = z.object({
  displayName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  bio: z.string().max(500, 'La bio ne peut pas dépasser 500 caractères').optional(),
  phone: z.string().optional(),
  university: z.string().min(1, 'Veuillez sélectionner votre université'),
  fieldOfStudy: z.string().min(1, 'Veuillez indiquer votre filière'),
  graduationYear: z.number().min(2020).max(2035),
  campus: z.string().optional(),
  location: z.string().optional(),
});

const securitySchema = z.object({
  currentPassword: z.string().min(6, 'Le mot de passe actuel est requis'),
  newPassword: z.string().min(6, 'Le nouveau mot de passe doit contenir au moins 6 caractères'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

const emailSchema = z.object({
  newEmail: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe requis pour changer l\'email'),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type SecurityFormData = z.infer<typeof securitySchema>;
type EmailFormData = z.infer<typeof emailSchema>;

const universities = [
  'Sorbonne Université',
  'Université Paris-Dauphine',
  'École Polytechnique',
  'ENS Paris',
  'CentraleSupélec',
  'MINES ParisTech',
  'HEC Paris',
  'ESSEC',
  'ESCP',
  'Université Paris 1 Panthéon-Sorbonne',
  'Université Paris Cité',
  'Sciences Po Paris',
  'Université de Lyon',
  'Université de Marseille',
  'Université de Toulouse',
  'Université de Bordeaux',
  'Université de Lille',
  'Université de Strasbourg',
  'Université de Nantes',
  'Université de Montpellier',
  'Autre université'
];

const fieldsOfStudy = [
  'Informatique',
  'Ingénierie',
  'Commerce/Management',
  'Droit',
  'Médecine',
  'Sciences',
  'Lettres/Langues',
  'Sciences Humaines',
  'Arts',
  'Architecture',
  'Économie',
  'Psychologie',
  'Communication',
  'Design',
  'Autre'
];

export const SettingsPage: React.FC = () => {
  const { currentUser, userProfile, updateUserProfile, logout } = useAuth();
  const navigate = useNavigate();
  
  // États pour les différentes sections
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  // États pour les notifications
  const [notifications, setNotifications] = useState({
    email: userProfile?.notificationPreferences?.email ?? true,
    push: userProfile?.notificationPreferences?.push ?? true,
    sms: userProfile?.notificationPreferences?.sms ?? false,
    alerts: userProfile?.notificationPreferences?.alerts ?? true,
    messages: true,
    listings: true,
    reviews: true,
    marketing: false,
  });

  // États pour la confidentialité
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public',
    showEmail: false,
    showPhone: false,
    showUniversity: true,
    allowMessages: true,
    showOnlineStatus: true,
  });

  // Formulaires
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: userProfile?.displayName || '',
      bio: userProfile?.bio || '',
      phone: userProfile?.phone || '',
      university: userProfile?.university || '',
      fieldOfStudy: userProfile?.fieldOfStudy || '',
      graduationYear: userProfile?.graduationYear || new Date().getFullYear() + 2,
      campus: userProfile?.campus || '',
      location: userProfile?.location || '',
    },
  });

  const securityForm = useForm<SecurityFormData>({
    resolver: zodResolver(securitySchema),
  });

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  // Charger les préférences utilisateur
  useEffect(() => {
    if (userProfile) {
      profileForm.reset({
        displayName: userProfile.displayName || '',
        bio: userProfile.bio || '',
        phone: userProfile.phone || '',
        university: userProfile.university || '',
        fieldOfStudy: userProfile.fieldOfStudy || '',
        graduationYear: userProfile.graduationYear || new Date().getFullYear() + 2,
        campus: userProfile.campus || '',
        location: userProfile.location || '',
      });

      setNotifications({
        email: userProfile.notificationPreferences?.email ?? true,
        push: userProfile.notificationPreferences?.push ?? true,
        sms: userProfile.notificationPreferences?.sms ?? false,
        alerts: userProfile.notificationPreferences?.alerts ?? true,
        messages: true,
        listings: true,
        reviews: true,
        marketing: false,
      });
    }
  }, [userProfile, profileForm]);

  // Sauvegarder le profil
  const handleSaveProfile = async (data: ProfileFormData) => {
    setIsLoading(true);
    try {
      await updateUserProfile({
        displayName: data.displayName,
        bio: data.bio || undefined,
        phone: data.phone || undefined,
        university: data.university,
        fieldOfStudy: data.fieldOfStudy,
        graduationYear: data.graduationYear,
        campus: data.campus || undefined,
        location: data.location || undefined,
      });
      toast.success('Profil mis à jour avec succès !');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      toast.error('Erreur lors de la mise à jour du profil');
    } finally {
      setIsLoading(false);
    }
  };

  // Sauvegarder les notifications
  const handleSaveNotifications = async () => {
    setIsLoading(true);
    try {
      await updateUserProfile({
        notificationPreferences: {
          email: notifications.email,
          push: notifications.push,
          sms: notifications.sms,
          alerts: notifications.alerts,
        },
      });
      toast.success('Préférences de notification mises à jour !');
    } catch (error) {
      console.error('Erreur lors de la mise à jour des notifications:', error);
      toast.error('Erreur lors de la mise à jour des notifications');
    } finally {
      setIsLoading(false);
    }
  };

  // Changer le mot de passe
  const handleChangePassword = async (data: SecurityFormData) => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      // Ré-authentifier l'utilisateur
      const credential = EmailAuthProvider.credential(currentUser.email!, data.currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      
      // Changer le mot de passe
      await updatePassword(currentUser, data.newPassword);
      
      toast.success('Mot de passe mis à jour avec succès !');
      setShowPasswordDialog(false);
      securityForm.reset();
    } catch (error: any) {
      console.error('Erreur lors du changement de mot de passe:', error);
      if (error.code === 'auth/wrong-password') {
        toast.error('Mot de passe actuel incorrect');
      } else {
        toast.error('Erreur lors du changement de mot de passe');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Changer l'email
  const handleChangeEmail = async (data: EmailFormData) => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      // Ré-authentifier l'utilisateur
      const credential = EmailAuthProvider.credential(currentUser.email!, data.password);
      await reauthenticateWithCredential(currentUser, credential);
      
      // Changer l'email
      await updateEmail(currentUser, data.newEmail);
      
      // Mettre à jour dans Firestore
      await updateUserProfile({ email: data.newEmail });
      
      toast.success('Email mis à jour avec succès !');
      setShowEmailDialog(false);
      emailForm.reset();
    } catch (error: any) {
      console.error('Erreur lors du changement d\'email:', error);
      if (error.code === 'auth/wrong-password') {
        toast.error('Mot de passe incorrect');
      } else if (error.code === 'auth/email-already-in-use') {
        toast.error('Cet email est déjà utilisé');
      } else {
        toast.error('Erreur lors du changement d\'email');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Supprimer le compte
  const handleDeleteAccount = async () => {
    if (!currentUser || deleteConfirmText !== 'SUPPRIMER') return;
    
    setIsLoading(true);
    try {
      const batch = writeBatch(db);
      
      // Supprimer toutes les données utilisateur
      const collections = ['listings', 'conversations', 'reviews', 'favorites', 'reports'];
      
      for (const collectionName of collections) {
        const q = query(collection(db, collectionName), where('userId', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          batch.delete(doc.ref);
        });
      }
      
      // Supprimer le profil utilisateur
      batch.delete(doc(db, 'users', currentUser.uid));
      
      // Exécuter toutes les suppressions
      await batch.commit();
      
      // Supprimer le compte Firebase Auth
      await deleteUser(currentUser);
      
      toast.success('Compte supprimé avec succès');
      navigate('/');
    } catch (error) {
      console.error('Erreur lors de la suppression du compte:', error);
      toast.error('Erreur lors de la suppression du compte');
    } finally {
      setIsLoading(false);
    }
  };

  // Exporter les données
  const handleExportData = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      // Récupérer toutes les données utilisateur
      const userData = {
        profile: userProfile,
        listings: [],
        conversations: [],
        reviews: [],
        favorites: [],
      };
      
      // Récupérer les annonces
      const listingsQuery = query(collection(db, 'listings'), where('sellerId', '==', currentUser.uid));
      const listingsSnapshot = await getDocs(listingsQuery);
      userData.listings = listingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Récupérer les conversations
      const conversationsQuery = query(collection(db, 'conversations'), where('participants', 'array-contains', currentUser.uid));
      const conversationsSnapshot = await getDocs(conversationsQuery);
      userData.conversations = conversationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Récupérer les avis
      const reviewsQuery = query(collection(db, 'reviews'), where('revieweeId', '==', currentUser.uid));
      const reviewsSnapshot = await getDocs(reviewsQuery);
      userData.reviews = reviewsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Récupérer les favoris
      const favoritesQuery = query(collection(db, 'favorites'), where('userId', '==', currentUser.uid));
      const favoritesSnapshot = await getDocs(favoritesQuery);
      userData.favorites = favoritesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Créer et télécharger le fichier JSON
      const dataStr = JSON.stringify(userData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `studymarket-data-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success('Données exportées avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'export des données:', error);
      toast.error('Erreur lors de l\'export des données');
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Vous devez être connecté pour accéder aux paramètres.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <SettingsIcon className="w-8 h-8" />
          Paramètres
        </h1>
        <p className="text-muted-foreground">
          Gérez votre profil, vos préférences et votre sécurité
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Profil</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Confidentialité</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Sécurité</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Données</span>
          </TabsTrigger>
        </TabsList>

        {/* Onglet Profil */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Informations personnelles
              </CardTitle>
              <CardDescription>
                Mettez à jour vos informations de profil et vos préférences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Photo de profil */}
              <div className="flex items-center gap-4">
                <ProfilePhotoUpload
                  currentPhotoURL={userProfile?.photoURL || ''}
                  displayName={userProfile?.displayName || currentUser.email || 'Utilisateur'}
                />
                <div>
                  <h3 className="font-medium">Photo de profil</h3>
                  <p className="text-sm text-muted-foreground">
                    Cliquez sur votre avatar pour changer votre photo
                  </p>
                </div>
              </div>

              <Separator />

              {/* Formulaire de profil */}
              <form onSubmit={profileForm.handleSubmit(handleSaveProfile)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="displayName">Nom complet *</Label>
                    <Input
                      id="displayName"
                      {...profileForm.register('displayName')}
                      placeholder="Votre nom complet"
                    />
                    {profileForm.formState.errors.displayName && (
                      <p className="text-sm text-destructive mt-1">
                        {profileForm.formState.errors.displayName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      {...profileForm.register('phone')}
                      placeholder="+33 6 12 34 56 78"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio">Biographie</Label>
                  <Textarea
                    id="bio"
                    {...profileForm.register('bio')}
                    placeholder="Parlez-nous de vous..."
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {profileForm.watch('bio')?.length || 0}/500 caractères
                  </p>
                </div>

                <Separator />

                <h3 className="font-medium flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  Informations académiques
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="university">Université *</Label>
                    <Select
                      value={profileForm.watch('university')}
                      onValueChange={(value) => profileForm.setValue('university', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez votre université" />
                      </SelectTrigger>
                      <SelectContent>
                        {universities.map((uni) => (
                          <SelectItem key={uni} value={uni}>
                            {uni}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {profileForm.formState.errors.university && (
                      <p className="text-sm text-destructive mt-1">
                        {profileForm.formState.errors.university.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="fieldOfStudy">Filière d'études *</Label>
                    <Select
                      value={profileForm.watch('fieldOfStudy')}
                      onValueChange={(value) => profileForm.setValue('fieldOfStudy', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez votre filière" />
                      </SelectTrigger>
                      <SelectContent>
                        {fieldsOfStudy.map((field) => (
                          <SelectItem key={field} value={field}>
                            {field}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {profileForm.formState.errors.fieldOfStudy && (
                      <p className="text-sm text-destructive mt-1">
                        {profileForm.formState.errors.fieldOfStudy.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="graduationYear">Année de diplôme *</Label>
                    <Select
                      value={profileForm.watch('graduationYear')?.toString()}
                      onValueChange={(value) => profileForm.setValue('graduationYear', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Année de diplôme" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 16 }, (_, i) => 2020 + i).map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {profileForm.formState.errors.graduationYear && (
                      <p className="text-sm text-destructive mt-1">
                        {profileForm.formState.errors.graduationYear.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="campus">Campus</Label>
                    <Input
                      id="campus"
                      {...profileForm.register('campus')}
                      placeholder="Campus principal"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="location">Localisation</Label>
                  <Input
                    id="location"
                    {...profileForm.register('location')}
                    placeholder="Paris, France"
                  />
                </div>

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Sauvegarder les modifications
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Préférences de notification
              </CardTitle>
              <CardDescription>
                Choisissez comment vous souhaitez être notifié
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Canaux de notification</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">
                          Recevez des notifications par email
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.email}
                      onCheckedChange={(checked) => 
                        setNotifications(prev => ({ ...prev, email: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-4 h-4 text-green-600" />
                      <div>
                        <p className="font-medium">Notifications push</p>
                        <p className="text-sm text-muted-foreground">
                          Notifications dans le navigateur
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.push}
                      onCheckedChange={(checked) => 
                        setNotifications(prev => ({ ...prev, push: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-purple-600" />
                      <div>
                        <p className="font-medium">SMS</p>
                        <p className="text-sm text-muted-foreground">
                          Notifications par SMS (bientôt disponible)
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.sms}
                      onCheckedChange={(checked) => 
                        setNotifications(prev => ({ ...prev, sms: checked }))
                      }
                      disabled
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Types de notifications</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MessageCircle className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="font-medium">Messages</p>
                        <p className="text-sm text-muted-foreground">
                          Nouveaux messages et conversations
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.messages}
                      onCheckedChange={(checked) => 
                        setNotifications(prev => ({ ...prev, messages: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Package className="w-4 h-4 text-orange-600" />
                      <div>
                        <p className="font-medium">Annonces</p>
                        <p className="text-sm text-muted-foreground">
                          Nouvelles annonces correspondant à vos recherches
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.listings}
                      onCheckedChange={(checked) => 
                        setNotifications(prev => ({ ...prev, listings: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Star className="w-4 h-4 text-yellow-600" />
                      <div>
                        <p className="font-medium">Avis et évaluations</p>
                        <p className="text-sm text-muted-foreground">
                          Nouveaux avis sur vos transactions
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.reviews}
                      onCheckedChange={(checked) => 
                        setNotifications(prev => ({ ...prev, reviews: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell className="w-4 h-4 text-red-600" />
                      <div>
                        <p className="font-medium">Alertes de sécurité</p>
                        <p className="text-sm text-muted-foreground">
                          Alertes importantes et mises à jour de sécurité
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.alerts}
                      onCheckedChange={(checked) => 
                        setNotifications(prev => ({ ...prev, alerts: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Palette className="w-4 h-4 text-pink-600" />
                      <div>
                        <p className="font-medium">Marketing</p>
                        <p className="text-sm text-muted-foreground">
                          Nouvelles fonctionnalités et promotions
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.marketing}
                      onCheckedChange={(checked) => 
                        setNotifications(prev => ({ ...prev, marketing: checked }))
                      }
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveNotifications} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Sauvegarder les préférences
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Confidentialité */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Confidentialité et visibilité
              </CardTitle>
              <CardDescription>
                Contrôlez qui peut voir vos informations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Visibilité du profil</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Profil public</p>
                      <p className="text-sm text-muted-foreground">
                        Votre profil est visible par tous les étudiants vérifiés
                      </p>
                    </div>
                    <Switch
                      checked={privacy.profileVisibility === 'public'}
                      onCheckedChange={(checked) => 
                        setPrivacy(prev => ({ 
                          ...prev, 
                          profileVisibility: checked ? 'public' : 'private' 
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Afficher l'email</p>
                      <p className="text-sm text-muted-foreground">
                        Votre email est visible sur votre profil public
                      </p>
                    </div>
                    <Switch
                      checked={privacy.showEmail}
                      onCheckedChange={(checked) => 
                        setPrivacy(prev => ({ ...prev, showEmail: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Afficher le téléphone</p>
                      <p className="text-sm text-muted-foreground">
                        Votre numéro de téléphone est visible sur votre profil
                      </p>
                    </div>
                    <Switch
                      checked={privacy.showPhone}
                      onCheckedChange={(checked) => 
                        setPrivacy(prev => ({ ...prev, showPhone: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Afficher l'université</p>
                      <p className="text-sm text-muted-foreground">
                        Votre université est visible sur votre profil
                      </p>
                    </div>
                    <Switch
                      checked={privacy.showUniversity}
                      onCheckedChange={(checked) => 
                        setPrivacy(prev => ({ ...prev, showUniversity: checked }))
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Interactions</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Autoriser les messages</p>
                      <p className="text-sm text-muted-foreground">
                        Les autres étudiants peuvent vous envoyer des messages
                      </p>
                    </div>
                    <Switch
                      checked={privacy.allowMessages}
                      onCheckedChange={(checked) => 
                        setPrivacy(prev => ({ ...prev, allowMessages: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Statut en ligne</p>
                      <p className="text-sm text-muted-foreground">
                        Afficher quand vous êtes en ligne
                      </p>
                    </div>
                    <Switch
                      checked={privacy.showOnlineStatus}
                      onCheckedChange={(checked) => 
                        setPrivacy(prev => ({ ...prev, showOnlineStatus: checked }))
                      }
                    />
                  </div>
                </div>
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Vos informations personnelles sont toujours protégées et ne sont jamais partagées avec des tiers sans votre consentement.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Sécurité */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Sécurité du compte
              </CardTitle>
              <CardDescription>
                Gérez la sécurité de votre compte StudyMarket
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Informations du compte */}
              <div className="space-y-4">
                <h3 className="font-medium">Informations du compte</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">Email</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {currentUser.email}
                    </p>
                    <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          Changer l'email
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Changer l'adresse email</DialogTitle>
                          <DialogDescription>
                            Entrez votre nouveau email et votre mot de passe actuel
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={emailForm.handleSubmit(handleChangeEmail)} className="space-y-4">
                          <div>
                            <Label htmlFor="newEmail">Nouvel email</Label>
                            <Input
                              id="newEmail"
                              type="email"
                              {...emailForm.register('newEmail')}
                              placeholder="nouveau@email.com"
                            />
                            {emailForm.formState.errors.newEmail && (
                              <p className="text-sm text-destructive mt-1">
                                {emailForm.formState.errors.newEmail.message}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="emailPassword">Mot de passe actuel</Label>
                            <Input
                              id="emailPassword"
                              type="password"
                              {...emailForm.register('password')}
                              placeholder="••••••••"
                            />
                            {emailForm.formState.errors.password && (
                              <p className="text-sm text-destructive mt-1">
                                {emailForm.formState.errors.password.message}
                              </p>
                            )}
                          </div>
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowEmailDialog(false)}>
                              Annuler
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                              {isLoading ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4 mr-2" />
                              )}
                              Changer l'email
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Lock className="w-4 h-4 text-green-600" />
                      <span className="font-medium">Mot de passe</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Dernière modification : il y a 30 jours
                    </p>
                    <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          Changer le mot de passe
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Changer le mot de passe</DialogTitle>
                          <DialogDescription>
                            Entrez votre mot de passe actuel et votre nouveau mot de passe
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={securityForm.handleSubmit(handleChangePassword)} className="space-y-4">
                          <div>
                            <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                            <Input
                              id="currentPassword"
                              type="password"
                              {...securityForm.register('currentPassword')}
                              placeholder="••••••••"
                            />
                            {securityForm.formState.errors.currentPassword && (
                              <p className="text-sm text-destructive mt-1">
                                {securityForm.formState.errors.currentPassword.message}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                            <Input
                              id="newPassword"
                              type="password"
                              {...securityForm.register('newPassword')}
                              placeholder="••••••••"
                            />
                            {securityForm.formState.errors.newPassword && (
                              <p className="text-sm text-destructive mt-1">
                                {securityForm.formState.errors.newPassword.message}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                            <Input
                              id="confirmPassword"
                              type="password"
                              {...securityForm.register('confirmPassword')}
                              placeholder="••••••••"
                            />
                            {securityForm.formState.errors.confirmPassword && (
                              <p className="text-sm text-destructive mt-1">
                                {securityForm.formState.errors.confirmPassword.message}
                              </p>
                            )}
                          </div>
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowPasswordDialog(false)}>
                              Annuler
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                              {isLoading ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Key className="w-4 h-4 mr-2" />
                              )}
                              Changer le mot de passe
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Statut de vérification */}
              <div className="space-y-4">
                <h3 className="font-medium">Vérification du compte</h3>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${userProfile?.isVerified ? 'bg-green-500' : 'bg-yellow-500'}`} />
                      <div>
                        <p className="font-medium">
                          {userProfile?.isVerified ? 'Compte vérifié' : 'Vérification en attente'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {userProfile?.isVerified 
                            ? 'Votre statut étudiant a été vérifié'
                            : 'Votre statut étudiant est en cours de vérification'
                          }
                        </p>
                      </div>
                    </div>
                    {userProfile?.isVerified ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Vérifié
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        En attente
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Pour votre sécurité, nous vous recommandons d'utiliser un mot de passe fort et de le changer régulièrement.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Données */}
        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Gestion des données
              </CardTitle>
              <CardDescription>
                Exportez ou supprimez vos données personnelles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Export des données */}
              <div className="space-y-4">
                <h3 className="font-medium">Exporter mes données</h3>
                <p className="text-sm text-muted-foreground">
                  Téléchargez une copie de toutes vos données StudyMarket au format JSON.
                </p>
                <Button onClick={handleExportData} disabled={isLoading} variant="outline">
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Exporter mes données
                </Button>
              </div>

              <Separator />

              {/* Suppression du compte */}
              <div className="space-y-4">
                <h3 className="font-medium text-destructive">Zone de danger</h3>
                <Alert className="border-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    La suppression de votre compte est irréversible. Toutes vos données seront définitivement supprimées.
                  </AlertDescription>
                </Alert>
                
                <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                  <DialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer mon compte
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="text-destructive">
                        Supprimer définitivement le compte
                      </DialogTitle>
                      <DialogDescription>
                        Cette action est irréversible. Toutes vos données seront supprimées :
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>Profil utilisateur</li>
                          <li>Toutes vos annonces</li>
                          <li>Conversations et messages</li>
                          <li>Avis et évaluations</li>
                          <li>Favoris et recherches sauvegardées</li>
                        </ul>
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="deleteConfirm">
                          Tapez "SUPPRIMER" pour confirmer
                        </Label>
                        <Input
                          id="deleteConfirm"
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          placeholder="SUPPRIMER"
                        />
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                        Annuler
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmText !== 'SUPPRIMER' || isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 mr-2" />
                        )}
                        Supprimer définitivement
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Informations légales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                Informations légales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" asChild>
                  <a href="/terms" target="_blank" className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Conditions d'utilisation
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="/privacy" target="_blank" className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Politique de confidentialité
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="/cookies" target="_blank" className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Politique des cookies
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="/support" target="_blank" className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Centre d'aide
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};