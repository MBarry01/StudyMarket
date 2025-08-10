import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, Loader2, GraduationCap, Shield, AlertCircle, School } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '../contexts/AuthContext';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, reload, updateProfile, sendEmailVerification } from 'firebase/auth';
import { auth, db, emailConfig } from "../lib/firebase";
// import { EmailVerificationModal } from "@/components/ui/EmailVerificationModal";

const signInSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

const signUpSchema = z.object({
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  displayName: z.string().optional(),
  email: z.string().email('Email invalide').refine((email) => {
    // Check if email is from a university domain
    const universityDomains = [
      'univ-', 'edu', 'gmail.com', 'ac.', 'student.', 'etudiant.', 'etu.',
      'sorbonne-universite.fr',
      'sorbonne-nouvelle.fr', 'dauphine.psl.eu', 'polytechnique.edu',
      'ens.fr', 'centralesupelec.fr', 'mines-paristech.fr'
    ];
    return universityDomains.some(domain => email.includes(domain));
  }, 'Vous devez utiliser une adresse email universitaire'),
  university: z.string().min(1, 'Veuillez sélectionner votre université'),
  otherUniversity: z.string().optional(),
  fieldOfStudy: z.string().min(1, 'Veuillez indiquer votre filière'),
  otherFieldOfStudy: z.string().optional(),
  graduationYear: z.string().min(1, 'Veuillez indiquer votre année de diplôme'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.university === 'Autre université') {
    return !!data.otherUniversity && data.otherUniversity.trim().length > 1;
  }
  return true;
}, {
  message: 'Veuillez indiquer le nom de votre université',
  path: ['otherUniversity'],
}).refine((data) => {
  if (data.fieldOfStudy === 'Autre') {
    return !!data.otherFieldOfStudy && data.otherFieldOfStudy.trim().length > 1;
  }
  return true;
}, {
  message: 'Veuillez indiquer le nom de votre filière',
  path: ['otherFieldOfStudy'],
});

// Schema pour compléter le profil après connexion Google
const completeProfileSchema = z.object({
  university: z.string().min(1, 'Veuillez sélectionner votre université'),
  otherUniversity: z.string().optional(),
  fieldOfStudy: z.string().min(1, 'Veuillez indiquer votre filière'),
  otherFieldOfStudy: z.string().optional(),
  graduationYear: z.string().min(1, 'Veuillez indiquer votre année de diplôme'),
  displayName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
}).refine((data) => {
  if (data.university === 'Autre université') {
    return !!data.otherUniversity && data.otherUniversity.trim().length > 1;
  }
  return true;
}, {
  message: 'Veuillez indiquer le nom de votre université',
  path: ['otherUniversity'],
}).refine((data) => {
  if (data.fieldOfStudy === 'Autre') {
    return !!data.otherFieldOfStudy && data.otherFieldOfStudy.trim().length > 1;
  }
  return true;
}, {
  message: 'Veuillez indiquer le nom de votre filière',
  path: ['otherFieldOfStudy'],
});

type SignInFormData = z.infer<typeof signInSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;
type CompleteProfileFormData = z.infer<typeof completeProfileSchema>;

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
  'Université Paris 3 Sorbonne',
  'Université Paris Cité',
  'Sciences Po Paris',
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
  'Autre'
];

// Fonction pour vérifier si un email est universitaire
const isUniversityEmail = (email: string) => {
  const universityDomains = [
    'univ-', 'edu', 'ac.', 'student.', 'etudiant.', 'etu.',
    'sorbonne-universite.fr',
    'sorbonne-nouvelle.fr', 'dauphine.psl.eu', 'polytechnique.edu',
    'ens.fr', 'centralesupelec.fr', 'mines-paristech.fr'
  ];
  return universityDomains.some(domain => email.includes(domain));
};

export const AuthPage: React.FC = () => {
  const { currentUser, signIn, signInWithGoogle } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);
  const [googleUserData, setGoogleUserData] = useState<{
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    uid: string;
  } | null>(null);
  // Modal supprimée: on n'utilise plus d'état pour l'affichage de modal de vérification
  const navigate = useNavigate();

  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      displayName: '',
      email: '',
      university: '',
      otherUniversity: '',
      fieldOfStudy: '',
      otherFieldOfStudy: '',
      graduationYear: '',
      password: '',
      confirmPassword: '',
    },
  });

  const completeProfileForm = useForm<CompleteProfileFormData>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: {
      university: '',
      fieldOfStudy: '',
      graduationYear: '',
    },
  });

  // Vérifier le profil utilisateur et gérer les redirections
  useEffect(() => {
    const checkUserProfile = async () => {
      if (!currentUser) {
        setShowCompleteProfile(false);
        setGoogleUserData(null);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        
        if (!userDoc.exists()) {
          // Utilisateur sans profil - vérifier s'il vient de Google
          if (currentUser.providerData.some(provider => provider.providerId === 'google.com')) {
            // Vérifier si l'email Google est universitaire
            if (!isUniversityEmail(currentUser.email || '')) {
              setVerificationError('Vous devez utiliser une adresse email universitaire');
              // Déconnecter l'utilisateur
              auth.signOut();
              return;
            }
            
            // Stocker les données Google et demander de compléter le profil
            setGoogleUserData({
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              uid: currentUser.uid
            });
            setShowCompleteProfile(true);
            return;
          }
          
          // Vérifier s'il y a des données en attente (inscription email)
          const pendingData = localStorage.getItem('pendingUserData');
          const pendingEmail = localStorage.getItem('pendingUserEmail');
          
          if (pendingData && pendingEmail === currentUser.email && currentUser.emailVerified) {
            try {
              const userData = JSON.parse(pendingData);
              const cleanData = Object.fromEntries(Object.entries(userData).filter(([, v]) => v !== undefined));
              
              // Sauvegarder le profil complet
              await setDoc(doc(db, 'users', currentUser.uid), {
                ...cleanData,
                emailVerified: true,
                profileCompleted: true
              });
              
              // Nettoyer le localStorage
              localStorage.removeItem('pendingUserData');
              localStorage.removeItem('pendingUserEmail');
              
              // Rediriger vers le site principal
              window.location.reload();
            } catch (error) {
              console.error('Error saving pending user data:', error);
              setVerificationError('Erreur lors de la sauvegarde du profil');
            }
          } else if (pendingData && pendingEmail === currentUser.email && !currentUser.emailVerified) {
            // Email non vérifié - afficher l'écran de vérification
            setUserEmail(currentUser.email || '');
            setEmailSent(true);
            setShowCompleteProfile(false);
          }
        } else {
          // Utilisateur avec profil existant
          const userData = userDoc.data();

          // Si des données d'inscription sont en attente et que l'email est désormais vérifié,
          // fusionner ces données dans le profil existant (corrige le profil vide après inscription)
          try {
            const pendingData = localStorage.getItem('pendingUserData');
            const pendingEmail = localStorage.getItem('pendingUserEmail');
            if (pendingData && pendingEmail === currentUser.email && currentUser.emailVerified) {
              const raw = JSON.parse(pendingData);
              const cleanData = Object.fromEntries(
                Object.entries(raw).filter(([, v]) => v !== undefined)
              );
              await setDoc(
                doc(db, 'users', currentUser.uid),
                {
                  ...cleanData,
                  emailVerified: true,
                  profileCompleted: true,
                },
                { merge: true }
              );
              localStorage.removeItem('pendingUserData');
              localStorage.removeItem('pendingUserEmail');
              // Recharger pour refléter immédiatement le profil complet dans tout le site
              window.location.reload();
              return;
            }
          } catch (e) {
            console.error('Error merging pending data into existing profile:', e);
          }

          // Vérifier si l'utilisateur a un email vérifié ou vient de Google
          const isEmailVerified = currentUser.emailVerified ||
            currentUser.providerData.some(provider => provider.providerId === 'google.com');
          
          if (!isEmailVerified && !userData.emailVerified) {
            // Email non vérifié - renvoyer vers l'écran de vérification
            setUserEmail(currentUser.email || '');
            setEmailSent(true);
            setShowCompleteProfile(false);
          } else {
            setShowCompleteProfile(false);
          }
        }
      } catch (error) {
        console.error('Error checking user profile:', error);
        
        setShowCompleteProfile(false);
      }
    };

    checkUserProfile();
  }, [currentUser]);

  // Modal supprimée: plus de gestion/polling spécifique à la modale

  // Polling supplémentaire pour l'écran de confirmation d'email
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (emailSent && currentUser && !currentUser.emailVerified) {
      interval = setInterval(async () => {
        try {
          await reload(currentUser);
          if (currentUser.emailVerified) {
            setEmailSent(false);
            setUserEmail('');
            setVerificationError('');
            
            // Rediriger vers le site principal
            window.location.reload();
          }
        } catch (error) {
          console.error('Error checking email verification:', error);
        }
      }, 5000); // Polling toutes les 5 secondes
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [emailSent, currentUser]);

  // Écran pour compléter le profil après connexion Google
  if (showCompleteProfile && googleUserData) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <School className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-green-600">
              Complétez votre profil étudiant
            </CardTitle>
            <CardDescription>
              Dernière étape pour accéder à StudyMarket
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <School className="h-4 w-4" />
              <AlertDescription>
                Connecté avec <strong>{googleUserData.email}</strong>
              </AlertDescription>
            </Alert>

            {verificationError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{verificationError}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={completeProfileForm.handleSubmit(async (data) => {
              setLoading(true);
              setVerificationError('');
              try {
                const universityToSave = data.university === 'Autre université' ? data.otherUniversity : data.university;
                const fieldOfStudyToSave = data.fieldOfStudy === 'Autre' ? data.otherFieldOfStudy : data.fieldOfStudy;
                const cleanData = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
                await setDoc(doc(db, 'users', googleUserData.uid), {
                  email: googleUserData.email,
                  displayName: cleanData.displayName,
                  photoURL: googleUserData.photoURL,
                  university: universityToSave,
                  otherUniversity: data.university === 'Autre université' ? data.otherUniversity : null,
                  fieldOfStudy: fieldOfStudyToSave,
                  otherFieldOfStudy: data.fieldOfStudy === 'Autre' ? data.otherFieldOfStudy : null,
                  graduationYear: parseInt(data.graduationYear),
                  createdAt: new Date().toISOString(),
                  emailVerified: true,
                  isStudent: true,
                  provider: 'google',
                  profileCompleted: true
                });
                if (currentUser && googleUserData.displayName) {
                  try {
                    await updateProfile(currentUser, { displayName: cleanData.displayName });
                  } catch (error) {
                    console.error('Error updating profile:', error);
                  }
                }
                window.location.reload(); // Force le menu à se rafraîchir
              } catch (error) {
                console.error('Error completing profile:', error);
                setVerificationError('Erreur lors de la sauvegarde du profil');
              } finally {
                setLoading(false);
              }
            })} className="space-y-4">
              
              <div className="space-y-2">
                <Label htmlFor="university">Université</Label>
                <Select onValueChange={(value) => completeProfileForm.setValue('university', value)} value={completeProfileForm.watch('university')}>
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
                {completeProfileForm.watch('university') === 'Autre université' && (
                  <Input
                    id="otherUniversity"
                    type="text"
                    placeholder="Nom de votre université"
                    {...completeProfileForm.register('otherUniversity')}
                    className="mt-2"
                  />
                )}
                {completeProfileForm.formState.errors.university && (
                  <p className="text-sm text-destructive">
                    {completeProfileForm.formState.errors.university.message}
                  </p>
                )}
                {completeProfileForm.watch('university') === 'Autre université' && completeProfileForm.formState.errors.otherUniversity && (
                  <p className="text-sm text-destructive">
                    {completeProfileForm.formState.errors.otherUniversity.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fieldOfStudy">Filière</Label>
                  <Select onValueChange={(value) => completeProfileForm.setValue('fieldOfStudy', value)} value={completeProfileForm.watch('fieldOfStudy')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filière" />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldsOfStudy.map((field) => (
                        <SelectItem key={field} value={field}>
                          {field}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {completeProfileForm.watch('fieldOfStudy') === 'Autre' && (
                    <Input
                      id="otherFieldOfStudy"
                      type="text"
                      placeholder="Nom de votre filière"
                      {...completeProfileForm.register('otherFieldOfStudy')}
                      className="mt-2"
                    />
                  )}
                  {completeProfileForm.formState.errors.fieldOfStudy && (
                    <p className="text-sm text-destructive">
                      {completeProfileForm.formState.errors.fieldOfStudy.message}
                    </p>
                  )}
                  {completeProfileForm.watch('fieldOfStudy') === 'Autre' && completeProfileForm.formState.errors.otherFieldOfStudy && (
                    <p className="text-sm text-destructive">
                      {completeProfileForm.formState.errors.otherFieldOfStudy.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="graduationYear">Année de diplôme</Label>
                  <Select onValueChange={(value) => completeProfileForm.setValue('graduationYear', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Année" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 8 }, (_, i) => 2024 + i).map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {completeProfileForm.formState.errors.graduationYear && (
                    <p className="text-sm text-destructive">
                      {completeProfileForm.formState.errors.graduationYear.message}
                    </p>
                  )}
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800" 
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Finaliser mon inscription
              </Button>
            </form>

            <Button
              variant="outline"
              onClick={() => {
                auth.signOut();
                setShowCompleteProfile(false);
                setGoogleUserData(null);
              }}
              className="w-full"
            >
              Se déconnecter et recommencer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Écran de confirmation d'envoi d'email après inscription (vue pleine page)
  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-blue-600">
              Vérifiez votre email
            </CardTitle>
            <CardDescription>
              Un lien d'activation a été envoyé à <strong>{userEmail}</strong>.<br/>
              Cliquez sur le lien pour activer votre compte.<br/>
              <span className="text-xs text-muted-foreground">(Vous pouvez fermer cette page et revenir après avoir validé l'email)</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-2">
              <p><strong>Important :</strong></p>
              <p>• Cliquez sur le lien dans l'email pour activer votre compte</p>
              <p>• Vérifiez votre boîte de réception et vos spams</p>
              <p>• Le lien expire dans 24h</p>
            </div>
            <Button
              onClick={async () => {
                if (!currentUser) return;
                setLoading(true);
                try {
                  await sendEmailVerification(currentUser, emailConfig.actionCodeSettings);
                  setVerificationError('');
                  alert("Email d'activation renvoyé !");
                } catch (error) {
                  setVerificationError("Erreur lors de l'envoi de l'email");
                  console.error('Error resending verification:', error);
                }
                setLoading(false);
              }}
              variant="outline"
              className="w-full"
              disabled={loading || !currentUser}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Mail className="w-4 h-4 mr-2" />
              )}
              Renvoyer l'email d'activation
            </Button>
            <Button
              onClick={async () => {
                if (!currentUser) return;
                setLoading(true);
                try {
                  await reload(currentUser);
                  if (currentUser.emailVerified) {
                    setEmailSent(false);
                    setUserEmail('');
                    setVerificationError('');
                    window.location.reload();
                  } else {
                    setVerificationError("L'email n'est pas encore validé. Pensez à vérifier vos spams.");
                  }
                } catch {
                  setVerificationError("Erreur lors de la vérification de l'état de l'email");
                }
                setLoading(false);
              }}
              variant="secondary"
              className="w-full"
              disabled={loading || !currentUser}
            >
              J'ai déjà validé mon email
            </Button>
            {verificationError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{verificationError}</AlertDescription>
              </Alert>
            )}
            <Button
              variant="link"
              onClick={() => {
                setEmailSent(false);
                setUserEmail('');
                setVerificationError('');
                if (currentUser) {
                  auth.signOut();
                }
              }}
              className="w-full"
            >
              Retour à l'inscription
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSignIn = async (data: SignInFormData) => {
    setLoading(true);
    setVerificationError('');
    try {
      await signIn(data.email, data.password);
      navigate('/');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      const errorCode = (error as { code?: string })?.code;
      
      if (errorCode === 'auth/invalid-credential') {
        setVerificationError('Email ou mot de passe incorrect');
      } else if (errorCode === 'auth/user-not-found') {
        setVerificationError('Aucun compte trouvé avec cet email');
      } else if (errorCode === 'auth/user-disabled') {
        setVerificationError('Ce compte a été désactivé');
      } else if (errorCode === 'auth/too-many-requests') {
        setVerificationError('Trop de tentatives. Réessayez plus tard.');
      } else {
        setVerificationError('Erreur de connexion: ' + errorMessage);
      }
      console.error('Sign in error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (data: SignUpFormData) => {
    setLoading(true);
    setVerificationError('');
    
    try {
      // 1. Création du compte Firebase
      const { firstName, lastName } = data;
      const displayName = `${firstName} ${lastName}`;
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;
      
      // 2. Envoi automatique de l'email de vérification via Firebase
      await sendEmailVerification(user, emailConfig.actionCodeSettings);
      
      // 3. Préparation des données utilisateur
      const universityToSave = data.university === 'Autre université' ? data.otherUniversity : data.university;
      const fieldOfStudyToSave = data.fieldOfStudy === 'Autre' ? data.otherFieldOfStudy : data.fieldOfStudy;
      
      const userDataToSave = {
        firstName, lastName, displayName,
        university: universityToSave,
        otherUniversity: data.university === 'Autre université' ? data.otherUniversity : null,
        fieldOfStudy: fieldOfStudyToSave,
        otherFieldOfStudy: data.fieldOfStudy === 'Autre' ? data.otherFieldOfStudy : null,
        graduationYear: parseInt(data.graduationYear),
        email: data.email,
        createdAt: new Date().toISOString(),
        emailVerified: false, // Changé à false car l'email n'est pas encore vérifié
        isStudent: true,
        provider: 'email'
      };
      
      // 4. Stockage temporaire des données en localStorage
      localStorage.setItem('pendingUserData', JSON.stringify(userDataToSave));
      localStorage.setItem('pendingUserEmail', data.email);
      
      // 5. Mise à jour du profil Firebase
      if (user) {
        await updateProfile(user, { displayName: displayName });
      }
      
      // 6. Affichage de l'écran de vérification (vue pleine page)
      setUserEmail(data.email);
      setEmailSent(true);
      
    } catch (error: unknown) {
      // Gestion des erreurs
      const errorCode = (error as { code?: string })?.code;
      if (errorCode === 'auth/email-already-in-use') {
        setVerificationError('Cette adresse email est déjà utilisée');
      } else if (errorCode === 'auth/weak-password') {
        setVerificationError('Le mot de passe est trop faible');
      } else if (errorCode === 'auth/invalid-email') {
        setVerificationError('Adresse email invalide');
      } else {
        setVerificationError('Erreur lors de la création du compte');
      }
      console.error('Sign up error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setVerificationError('');
    try {
      await signInWithGoogle();
      // La gestion sera faite dans le useEffect
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      const errorCode = (error as { code?: string })?.code;
      
      if (errorCode === 'auth/popup-closed-by-user') {
        setVerificationError('Connexion annulée');
      } else if (errorCode === 'auth/popup-blocked') {
        setVerificationError('Popup bloquée par le navigateur');
      } else if (errorCode === 'auth/account-exists-with-different-credential') {
        setVerificationError('Un compte existe déjà avec cet email');
      } else {
        setVerificationError('Erreur de connexion avec Google: ' + errorMessage);
      }
      console.error('Google sign in error:', error);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex items-center justify-center px-2 sm:px-4 py-4 sm:py-8 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <Card className="w-full max-w-md sm:max-w-lg lg:max-w-xl mx-auto">
        <CardHeader className="text-center space-y-2 sm:space-y-4">
          <div className="flex justify-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
              <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-xl sm:text-2xl lg:text-3xl">
            {isSignUp 
              ? 'Rejoindre StudyMarket'
              : 'Connectez-vous à votre compte étudiant'
            }
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            {isSignUp 
              ? 'Créez votre compte étudiant vérifié et rejoignez la communauté'
              : 'Connectez-vous à votre compte étudiant'
            }
          </CardDescription>
          
          {isSignUp && (
            <div className="flex items-center justify-center gap-2 mt-2 sm:mt-4">
              <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs sm:text-sm">
                <Shield className="w-3 h-3 mr-1" />
                Email universitaire requis
              </Badge>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {/* Affichage des erreurs */}
          {verificationError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{verificationError}</AlertDescription>
            </Alert>
          )}

          {/* Google Sign In */}
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 1c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            <span className="hidden sm:inline">Continuer avec Google Éducation</span>
            <span className="sm:hidden">Google Éducation</span>
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Ou avec votre email universitaire
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={isSignUp ? signUpForm.handleSubmit(handleSignUp) : signInForm.handleSubmit(handleSignIn)} className="space-y-4">
            {isSignUp && (
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <div className="flex-1">
                  <Label htmlFor="firstName" className="text-sm">Prénom</Label>
                  <Input id="firstName" {...signUpForm.register('firstName')} autoComplete="given-name" className="text-sm" />
                  {signUpForm.formState.errors.firstName && (
                    <span className="text-red-500 text-xs">{signUpForm.formState.errors.firstName.message}</span>
                  )}
                </div>
                <div className="flex-1">
                  <Label htmlFor="lastName" className="text-sm">Nom</Label>
                  <Input id="lastName" {...signUpForm.register('lastName')} autoComplete="family-name" className="text-sm" />
                  {signUpForm.formState.errors.lastName && (
                    <span className="text-red-500 text-xs">{signUpForm.formState.errors.lastName.message}</span>
                )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm">Email universitaire</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="prenom.nom@univ-exemple.fr"
                  className="pl-10 text-sm"
                  {...(isSignUp ? signUpForm.register('email') : signInForm.register('email'))}
                />
              </div>
              {(isSignUp ? signUpForm.formState.errors.email : signInForm.formState.errors.email) && (
                <p className="text-sm text-destructive">
                  {(isSignUp ? signUpForm.formState.errors.email : signInForm.formState.errors.email)?.message}
                </p>
              )}
              {isSignUp && (
                <p className="text-xs text-muted-foreground">
                  Un lien d'activation sera envoyé à cette adresse
                </p>
              )}
            </div>

            {isSignUp && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="university" className="text-sm">Université</Label>
                  <Select onValueChange={(value) => signUpForm.setValue('university', value)} value={signUpForm.watch('university')}>
                    <SelectTrigger className="text-sm">
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
                  {signUpForm.watch('university') === 'Autre université' && (
                    <Input
                      id="otherUniversity"
                      type="text"
                      placeholder="Nom de votre université"
                      {...signUpForm.register('otherUniversity')}
                      className="mt-2 text-sm"
                    />
                  )}
                  {signUpForm.formState.errors.university && (
                    <p className="text-sm text-destructive">
                      {signUpForm.formState.errors.university.message}
                    </p>
                  )}
                  {signUpForm.watch('university') === 'Autre université' && signUpForm.formState.errors.otherUniversity && (
                    <p className="text-sm text-destructive">
                      {signUpForm.formState.errors.otherUniversity.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fieldOfStudy" className="text-sm">Filière</Label>
                    <Select onValueChange={(value) => signUpForm.setValue('fieldOfStudy', value)} value={signUpForm.watch('fieldOfStudy')}>
                      <SelectTrigger className="text-sm">
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
                    {signUpForm.watch('fieldOfStudy') === 'Autre' && (
                      <Input
                        id="otherFieldOfStudy"
                        type="text"
                        placeholder="Nom de votre filière"
                        {...signUpForm.register('otherFieldOfStudy')}
                        className="mt-2 text-sm"
                      />
                    )}
                    {signUpForm.formState.errors.fieldOfStudy && (
                      <p className="text-sm text-destructive">
                        {signUpForm.formState.errors.fieldOfStudy.message}
                      </p>
                    )}
                    {signUpForm.watch('fieldOfStudy') === 'Autre' && signUpForm.formState.errors.otherFieldOfStudy && (
                      <p className="text-sm text-destructive">
                        {signUpForm.formState.errors.otherFieldOfStudy.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="graduationYear" className="text-sm">Année de diplôme</Label>
                    <Select onValueChange={(value) => signUpForm.setValue('graduationYear', value)} value={signUpForm.watch('graduationYear')}>
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Sélectionnez votre année" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 8 }, (_, i) => 2024 + i).map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {signUpForm.formState.errors.graduationYear && (
                      <p className="text-sm text-destructive">
                        {signUpForm.formState.errors.graduationYear.message}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-10 text-sm"
                  {...(isSignUp ? signUpForm.register('password') : signInForm.register('password'))}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
              {(isSignUp ? signUpForm.formState.errors.password : signInForm.formState.errors.password) && (
                <p className="text-sm text-destructive">
                  {(isSignUp ? signUpForm.formState.errors.password : signInForm.formState.errors.password)?.message}
                </p>
              )}
            </div>

            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm">Confirmer le mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-10 text-sm"
                    {...signUpForm.register('confirmPassword')}
                  />
                </div>
                {signUpForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {signUpForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
            )}

            <Button type="submit" className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-sm sm:text-base" disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {isSignUp ? 'Créer le compte et envoyer l\'email' : 'Se connecter'}
            </Button>
          </form>

          <div className="w-full">
            <Button
              variant="link"
              onClick={() => setIsSignUp(!isSignUp)}
              disabled={loading}
              className="w-full flex justify-center items-center text-center break-words px-1 text-sm sm:text-base"
            >
              {isSignUp
                ? 'Déjà un compte ? Se connecter'
                : 'Pas encore de compte ? S\'inscrire'
              }
            </Button>
          </div>

          {isSignUp && (
            <div className="text-center text-xs text-muted-foreground">
              En créant un compte, vous acceptez nos conditions d'utilisation. 
              Seules les adresses email universitaires sont acceptées.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};