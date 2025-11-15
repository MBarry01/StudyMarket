import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { FileText, Calendar, Shield, AlertCircle } from 'lucide-react';

const sections = [
  {
    title: '1. Acceptation des conditions',
    content: `En accédant et en utilisant StudyMarket, vous acceptez d'être lié par ces Conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre plateforme.`
  },
  {
    title: '2. Description du service',
    content: `StudyMarket est une plateforme de marketplace en ligne permettant aux étudiants vérifiés d'acheter, vendre, donner et échanger des articles et services au sein de leur communauté universitaire.`
  },
  {
    title: '3. Éligibilité',
    content: `Pour utiliser StudyMarket, vous devez :
    - Être étudiant dans un établissement d'enseignement supérieur
    - Avoir une adresse email universitaire valide
    - Être âgé d'au moins 18 ans
    - Compléter le processus de vérification d'identité`
  },
  {
    title: '4. Compte utilisateur',
    content: `Vous êtes responsable de :
    - Maintenir la confidentialité de vos identifiants
    - Toutes les activités effectuées sous votre compte
    - Fournir des informations exactes et à jour
    - Notifier immédiatement toute utilisation non autorisée`
  },
  {
    title: '5. Transactions entre utilisateurs',
    content: `StudyMarket agit uniquement comme intermédiaire. Nous ne sommes pas partie aux transactions entre utilisateurs et ne garantissons pas :
    - La qualité, sécurité ou légalité des articles
    - L'exactitude des descriptions
    - La capacité des utilisateurs à effectuer les transactions`
  },
  {
    title: '6. Paiements',
    content: `Les paiements sont traités via Stripe. StudyMarket peut percevoir des frais de transaction. Tous les prix sont en euros (EUR) et incluent la TVA si applicable.`
  },
  {
    title: '7. Contenu utilisateur',
    content: `Vous conservez tous les droits sur le contenu que vous publiez. En publiant, vous accordez à StudyMarket une licence pour utiliser, afficher et distribuer ce contenu sur la plateforme.`
  },
  {
    title: '8. Restrictions d\'utilisation',
    content: `Il est interdit de :
    - Publier du contenu illégal, frauduleux ou trompeur
    - Violer les droits de propriété intellectuelle
    - Utiliser la plateforme à des fins commerciales non autorisées
    - Tenter d'accéder à des zones restreintes du système`
  },
  {
    title: '9. Résiliation',
    content: `StudyMarket se réserve le droit de suspendre ou résilier votre compte en cas de violation de ces conditions, sans préavis ni remboursement.`
  },
  {
    title: '10. Limitation de responsabilité',
    content: `StudyMarket ne peut être tenu responsable des dommages directs, indirects, accessoires ou consécutifs résultant de l'utilisation de la plateforme.`
  },
  {
    title: '11. Modifications des conditions',
    content: `Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications entrent en vigueur dès leur publication. Votre utilisation continue de la plateforme constitue votre acceptation des modifications.`
  },
  {
    title: '12. Droit applicable',
    content: `Ces conditions sont régies par le droit français. Tout litige sera soumis à la compétence exclusive des tribunaux français.`
  }
];

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4" variant="secondary">
            Conditions légales
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Conditions d'Utilisation
          </h1>
          <p className="text-muted-foreground">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Alert */}
        <Alert className="mb-8 border-primary/20 bg-primary/5">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Veuillez lire attentivement ces conditions avant d'utiliser StudyMarket. En utilisant notre plateforme, vous acceptez ces conditions dans leur intégralité.
          </AlertDescription>
        </Alert>

        {/* Sections */}
        <div className="space-y-6 mb-12">
          {sections.map((section, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
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
              <Shield className="w-5 h-5 text-primary" />
              Questions ?
            </CardTitle>
            <CardDescription>
              Si vous avez des questions concernant ces conditions d'utilisation, contactez-nous.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Email :{' '}
              <a href="mailto:support@studymarket.fr" className="text-primary hover:underline">
                support@studymarket.fr
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

