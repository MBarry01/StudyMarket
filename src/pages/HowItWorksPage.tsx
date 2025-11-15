import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ShoppingCart, 
  Search, 
  MessageCircle, 
  Shield, 
  CheckCircle,
  ArrowRight,
  GraduationCap,
  Heart,
  Leaf,
  Star,
  CreditCard,
  MapPin,
  Users,
  FileText,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';

const steps = [
  {
    number: 1,
    title: 'Créez votre compte',
    description: 'Inscrivez-vous avec votre adresse email universitaire et vérifiez votre identité d\'étudiant.',
    icon: GraduationCap,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    details: [
      'Vérification de votre adresse email universitaire',
      'Upload de votre carte étudiante',
      'Badge "Étudiant certifié" sur votre profil'
    ]
  },
  {
    number: 2,
    title: 'Publiez ou recherchez',
    description: 'Créez une annonce pour vendre, donner ou échanger, ou parcourez les milliers d\'annonces disponibles.',
    icon: FileText,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950',
    details: [
      'Photos et description détaillée',
      'Prix ou type d\'échange',
      'Localisation sur le campus'
    ]
  },
  {
    number: 3,
    title: 'Échangez en sécurité',
    description: 'Communiquez via notre messagerie sécurisée et organisez votre rendez-vous sur le campus.',
    icon: MessageCircle,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950',
    details: [
      'Chat intégré et sécurisé',
      'Points de rencontre recommandés',
      'Historique des conversations'
    ]
  },
  {
    number: 4,
    title: 'Finalisez la transaction',
    description: 'Rencontrez-vous sur le campus, vérifiez l\'article et finalisez le paiement ou l\'échange.',
    icon: CheckCircle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950',
    details: [
      'Paiement sécurisé via Stripe',
      'Vérification de l\'article en personne',
      'Confirmation de réception'
    ]
  }
];

const features = [
  {
    icon: Shield,
    title: '100% Étudiants vérifiés',
    description: 'Tous les membres sont vérifiés avec leur adresse universitaire. Aucun compte anonyme.'
  },
  {
    icon: Leaf,
    title: 'Impact écologique',
    description: 'Chaque transaction contribue à réduire votre empreinte carbone. Suivez votre impact en temps réel.'
  },
  {
    icon: Star,
    title: 'Système de notation',
    description: 'Notez et consultez les avis pour échanger en toute confiance avec la communauté.'
  },
  {
    icon: CreditCard,
    title: 'Paiements sécurisés',
    description: 'Transactions protégées via Stripe. Remboursement possible en cas de problème.'
  }
];

const transactionTypes = [
  {
    type: 'Vente',
    icon: ShoppingCart,
    color: 'text-green-600',
    description: 'Vendez vos livres, matériel électronique, mobilier et bien plus encore.'
  },
  {
    type: 'Don',
    icon: Heart,
    color: 'text-red-600',
    description: 'Offrez ce dont vous n\'avez plus besoin à d\'autres étudiants.'
  },
  {
    type: 'Troc',
    icon: Zap,
    color: 'text-blue-600',
    description: 'Échangez services et objets sans argent, directement entre étudiants.'
  }
];

export const HowItWorksPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4" variant="secondary">
            Guide complet
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Comment ça marche ?
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Découvrez comment utiliser StudyMarket pour acheter, vendre, donner et échanger en toute sécurité au sein de votre communauté universitaire.
          </p>
        </div>

        {/* Steps */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">En 4 étapes simples</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {steps.map((step, index) => (
              <Card key={index} className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className={`${step.bgColor} p-3 rounded-lg`}>
                      <step.icon className={`w-6 h-6 ${step.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          Étape {step.number}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl">{step.title}</CardTitle>
                      <CardDescription className="mt-2">{step.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {step.details.map((detail, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Transaction Types */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">Types de transactions</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {transactionTypes.map((item, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className={`w-12 h-12 ${item.color} mb-4`}>
                    <item.icon className="w-12 h-12" />
                  </div>
                  <CardTitle>{item.type}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">Pourquoi StudyMarket ?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <feature.icon className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                      <CardDescription className="mt-2">{feature.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-4">Prêt à commencer ?</h3>
              <p className="text-muted-foreground mb-6">
                Rejoignez la communauté StudyMarket et commencez à échanger dès aujourd'hui.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link to="/create">
                    Publier une annonce
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/listings">
                    Parcourir les annonces
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

