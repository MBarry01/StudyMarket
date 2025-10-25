import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { applyActionCode, checkActionCode, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const EmailVerificationHandler: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const mode = searchParams.get('mode');
      const oobCode = searchParams.get('oobCode');

      // Vérifier si c'est bien une vérification d'email
      if (mode !== 'verifyEmail' || !oobCode) {
        setStatus('error');
        setErrorMessage('Lien de vérification invalide');
        return;
      }

      try {
        // 1. Vérifier le code d'action et récupérer l'email
        const info = await checkActionCode(auth, oobCode);
        const email = info.data.email || '';
        setUserEmail(email);

        console.log('📧 Email à vérifier:', email);

        // 2. Appliquer le code (marque l'email comme vérifié dans Firebase Auth)
        await applyActionCode(auth, oobCode);
        console.log('✅ Code de vérification appliqué');

        // 3. Vérifier si l'utilisateur est déjà connecté
        if (auth.currentUser && auth.currentUser.email === email) {
          console.log('✅ Utilisateur déjà connecté');
          // Rafraîchir le statut de l'utilisateur
          await auth.currentUser.reload();
          
          // Mettre à jour Firestore
          const userRef = doc(db, 'users', auth.currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            console.log('📊 Données utilisateur existantes:', {
              firstName: userData.firstName,
              lastName: userData.lastName,
              university: userData.university,
              otherUniversity: userData.otherUniversity,
              fieldOfStudy: userData.fieldOfStudy,
              otherFieldOfStudy: userData.otherFieldOfStudy,
              graduationYear: userData.graduationYear
            });

            // Mettre à jour seulement les champs nécessaires
            await updateDoc(userRef, {
              emailVerified: true,
              profileCompleted: true,
              updatedAt: new Date().toISOString()
            });

            console.log('✅ Profil mis à jour dans Firestore');
          }

          // Rediriger vers la home page (connecté)
          setStatus('success');
          setTimeout(() => {
            navigate('/', { replace: true });
            // Forcer le rechargement pour s'assurer que toutes les données sont chargées
            window.location.reload();
          }, 2000);
        } else {
          // Si pas connecté, il faut se connecter pour pouvoir mettre à jour Firestore
          console.log('⚠️ Utilisateur non connecté, connexion nécessaire');
          setNeedsPassword(true);
          setStatus('loading');
        }

      } catch (error: any) {
        console.error('❌ Erreur lors de la vérification:', error);
        
        let message = 'Une erreur est survenue';
        if (error.code === 'auth/invalid-action-code') {
          message = 'Le lien de vérification a expiré ou a déjà été utilisé';
        } else if (error.code === 'auth/expired-action-code') {
          message = 'Le lien de vérification a expiré. Demandez un nouveau lien.';
        }
        
        setErrorMessage(message);
        setStatus('error');
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  // Fonction pour se connecter avec le mot de passe
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !userEmail) {
      setErrorMessage('Veuillez entrer votre mot de passe');
      return;
    }

    setStatus('loading');
    
    try {
      // Se connecter avec l'email et le mot de passe
      const userCredential = await signInWithEmailAndPassword(auth, userEmail, password);
      console.log('✅ Connexion réussie pour:', userCredential.user.uid);

      // Rafraîchir le statut
      await userCredential.user.reload();

      // Mettre à jour Firestore
      const userRef = doc(db, 'users', userCredential.user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        console.log('📊 Données utilisateur:', {
          firstName: userData.firstName,
          lastName: userData.lastName,
          university: userData.university,
          otherUniversity: userData.otherUniversity,
          fieldOfStudy: userData.fieldOfStudy,
          otherFieldOfStudy: userData.otherFieldOfStudy,
          graduationYear: userData.graduationYear
        });

        await updateDoc(userRef, {
          emailVerified: true,
          profileCompleted: true,
          updatedAt: new Date().toISOString()
        });

        console.log('✅ Profil mis à jour dans Firestore');
      }

      setStatus('success');
      setTimeout(() => {
        navigate('/', { replace: true });
        // Forcer le rechargement pour s'assurer que toutes les données sont chargées
        window.location.reload();
      }, 2000);

    } catch (error: any) {
      console.error('❌ Erreur de connexion:', error);
      
      let message = 'Erreur de connexion';
      if (error.code === 'auth/wrong-password') {
        message = 'Mot de passe incorrect';
      } else if (error.code === 'auth/user-not-found') {
        message = 'Utilisateur non trouvé';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Trop de tentatives. Veuillez réessayer plus tard.';
      }
      
      setErrorMessage(message);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            {status === 'loading' && !needsPassword && (
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
              </div>
            )}
            {status === 'success' && (
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            )}
            {status === 'error' && (
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
            )}
            {needsPassword && (
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            )}
          </div>

          {status === 'loading' && !needsPassword && (
            <>
              <CardTitle className="text-2xl">Vérification en cours...</CardTitle>
              <CardDescription>
                Veuillez patienter pendant que nous vérifions votre email
              </CardDescription>
            </>
          )}

          {needsPassword && (
            <>
              <CardTitle className="text-2xl">Email vérifié ✅</CardTitle>
              <CardDescription>
                {userEmail && (
                  <span className="block mb-2">
                    <strong>{userEmail}</strong> est maintenant vérifié
                  </span>
                )}
                <span>Entrez votre mot de passe pour vous connecter</span>
              </CardDescription>
            </>
          )}

          {status === 'success' && (
            <>
              <CardTitle className="text-2xl text-green-600 dark:text-green-400">
                ✅ Email vérifié avec succès !
              </CardTitle>
              <CardDescription>
                {userEmail && (
                  <span className="block mb-2">
                    <strong>{userEmail}</strong> est maintenant vérifié
                  </span>
                )}
                <span>Redirection vers votre compte...</span>
              </CardDescription>
            </>
          )}

          {status === 'error' && (
            <>
              <CardTitle className="text-2xl text-red-600 dark:text-red-400">
                Erreur de vérification
              </CardTitle>
              <CardDescription>
                {errorMessage}
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {needsPassword && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Mot de passe
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Entrez votre mot de passe"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Se connecter
              </Button>
            </form>
          )}

          {status === 'success' && (
            <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <Mail className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-300">
                Votre compte est maintenant activé et vous pouvez profiter de toutes les fonctionnalités de StudyMarket !
              </AlertDescription>
            </Alert>
          )}

          {status === 'error' && (
            <div className="space-y-2">
              <Alert className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <AlertDescription className="text-red-800 dark:text-red-300">
                  {errorMessage}
                </AlertDescription>
              </Alert>
              <Button
                onClick={() => navigate('/auth', { replace: true })}
                className="w-full"
              >
                Retour à la connexion
              </Button>
            </div>
          )}

          {status === 'loading' && !needsPassword && (
            <div className="flex justify-center">
              <div className="text-sm text-muted-foreground">
                Cette opération peut prendre quelques secondes...
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailVerificationHandler;

