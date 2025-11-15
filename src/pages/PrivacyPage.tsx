import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Shield, Lock, Eye, FileText, AlertCircle, Database, Users, Mail } from 'lucide-react';

const sections = [
  {
    title: '1. Données collectées',
    icon: Database,
    content: `Nous collectons les données suivantes :
    - Informations d'identification : nom, email universitaire, photo de profil
    - Données de vérification : carte étudiante, documents d'identité
    - Données de transaction : historique d'achats/ventes, paiements
    - Données de navigation : adresse IP, cookies, pages visitées
    - Contenu généré : annonces, messages, avis`
  },
  {
    title: '2. Utilisation des données',
    icon: Eye,
    content: `Vos données sont utilisées pour :
    - Fournir et améliorer nos services
    - Vérifier votre identité d'étudiant
    - Faciliter les transactions entre utilisateurs
    - Assurer la sécurité de la plateforme
    - Vous envoyer des notifications importantes
    - Analyser l'utilisation de la plateforme`
  },
  {
    title: '3. Partage des données',
    icon: Users,
    content: `Nous partageons vos données uniquement avec :
    - Stripe (paiements) : données de transaction nécessaires
    - Firebase (hébergement) : données stockées de manière sécurisée
    - Autres utilisateurs : informations de profil publiques uniquement
    - Autorités légales : si requis par la loi`
  },
  {
    title: '4. Sécurité des données',
    icon: Lock,
    content: `Nous mettons en œuvre des mesures de sécurité strictes :
    - Chiffrement SSL/TLS pour toutes les transmissions
    - Authentification à deux facteurs disponible
    - Accès restreint aux données personnelles
    - Sauvegardes régulières et sécurisées
    - Conformité RGPD`
  },
  {
    title: '5. Vos droits',
    icon: Shield,
    content: `Conformément au RGPD, vous avez le droit de :
    - Accéder à vos données personnelles
    - Rectifier des données inexactes
    - Demander la suppression de vos données
    - S'opposer au traitement de vos données
    - Demander la portabilité de vos données
    - Retirer votre consentement à tout moment`
  },
  {
    title: '6. Cookies',
    icon: FileText,
    content: `Nous utilisons des cookies pour :
    - Mémoriser vos préférences
    - Améliorer l'expérience utilisateur
    - Analyser le trafic du site
    - Personnaliser le contenu
    
    Vous pouvez gérer vos préférences de cookies dans les paramètres de votre navigateur.`
  },
  {
    title: '7. Conservation des données',
    icon: Database,
    content: `Nous conservons vos données :
    - Pendant la durée de votre compte actif
    - Jusqu'à 3 ans après la fermeture de votre compte (obligations légales)
    - Les données de transaction sont conservées selon les exigences fiscales`
  },
  {
    title: '8. Modifications de la politique',
    icon: AlertCircle,
    content: `Nous pouvons modifier cette politique de confidentialité. Les modifications importantes vous seront notifiées par email. La date de dernière mise à jour est indiquée en haut de cette page.`
  }
];

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4" variant="secondary">
            Confidentialité
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Politique de Confidentialité
          </h1>
          <p className="text-muted-foreground">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Alert */}
        <Alert className="mb-8 border-primary/20 bg-primary/5">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            StudyMarket s'engage à protéger votre vie privée. Cette politique explique comment nous collectons, utilisons et protégeons vos données personnelles conformément au RGPD.
          </AlertDescription>
        </Alert>

        {/* Sections */}
        <div className="space-y-6 mb-12">
          {sections.map((section, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <section.icon className="w-5 h-5 text-primary" />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-line">{section.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Exercer vos droits
            </CardTitle>
            <CardDescription>
              Pour exercer vos droits concernant vos données personnelles, contactez notre délégué à la protection des données.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                Email :{' '}
                <a href="mailto:privacy@studymarket.fr" className="text-primary hover:underline">
                  privacy@studymarket.fr
                </a>
              </p>
              <p className="text-muted-foreground">
                Support général :{' '}
                <a href="mailto:support@studymarket.fr" className="text-primary hover:underline">
                  support@studymarket.fr
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

