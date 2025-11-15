import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  Users, 
  Shield, 
  MessageCircle, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Heart,
  GraduationCap,
  FileText,
  Flag
} from 'lucide-react';

const rules = [
  {
    category: 'Respect et Courtoisie',
    icon: Heart,
    color: 'text-red-600',
    rules: [
      {
        title: 'Traitement respectueux',
        description: 'Traitez tous les membres avec respect et courtoisie, que ce soit dans les messages ou lors des rencontres.',
        type: 'must'
      },
      {
        title: 'Pas de discrimination',
        description: 'Aucune forme de discrimination, harcèlement ou comportement offensant ne sera toléré.',
        type: 'must'
      },
      {
        title: 'Communication claire',
        description: 'Soyez honnête et transparent dans vos communications. Répondez aux messages dans un délai raisonnable.',
        type: 'must'
      }
    ]
  },
  {
    category: 'Annonces et Transactions',
    icon: FileText,
    color: 'text-blue-600',
    rules: [
      {
        title: 'Descriptions exactes',
        description: 'Les descriptions et photos doivent correspondre exactement à l\'article proposé. Pas de fausses informations.',
        type: 'must'
      },
      {
        title: 'Prix justes',
        description: 'Les prix doivent être raisonnables et conformes à la valeur réelle de l\'article.',
        type: 'must'
      },
      {
        title: 'Disponibilité réelle',
        description: 'Ne créez pas d\'annonces pour des articles que vous n\'avez pas ou qui ne sont plus disponibles.',
        type: 'must'
      },
      {
        title: 'Respect des engagements',
        description: 'Si vous acceptez une transaction, respectez votre engagement. Annulez uniquement en cas de force majeure.',
        type: 'must'
      }
    ]
  },
  {
    category: 'Sécurité et Vérification',
    icon: Shield,
    color: 'text-green-600',
    rules: [
      {
        title: 'Identité vérifiée',
        description: 'Tous les membres doivent être vérifiés avec leur adresse email universitaire et leur carte étudiante.',
        type: 'must'
      },
      {
        title: 'Rencontres sécurisées',
        description: 'Rencontrez-vous dans des lieux publics sur le campus. Ne partagez jamais votre adresse personnelle.',
        type: 'must'
      },
      {
        title: 'Paiements sécurisés',
        description: 'Utilisez le système de paiement intégré StudyMarket. Évitez les transactions en espèces non tracées.',
        type: 'must'
      }
    ]
  },
  {
    category: 'Contenu Interdit',
    icon: XCircle,
    color: 'text-red-600',
    rules: [
      {
        title: 'Articles illégaux',
        description: 'Aucun article illégal, contrefait ou réglementé (armes, drogues, alcool, etc.) ne peut être vendu.',
        type: 'forbidden'
      },
      {
        title: 'Contenu inapproprié',
        description: 'Pas de contenu offensant, pornographique, violent ou discriminatoire dans les annonces ou messages.',
        type: 'forbidden'
      },
      {
        title: 'Spam et publicité',
        description: 'Pas de spam, publicité non autorisée ou liens vers des sites externes non pertinents.',
        type: 'forbidden'
      }
    ]
  }
];

const consequences = [
  {
    level: 'Avertissement',
    description: 'Pour les premières infractions mineures',
    actions: ['Notification', 'Rappel des règles']
  },
  {
    level: 'Suspension temporaire',
    description: 'Pour les infractions répétées ou modérées',
    actions: ['Suspension du compte 7-30 jours', 'Suppression des annonces concernées']
  },
  {
    level: 'Bannissement permanent',
    description: 'Pour les infractions graves ou répétées',
    actions: ['Bannissement définitif', 'Signalement aux autorités si nécessaire']
  }
];

export const CommunityGuidelinesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4" variant="secondary">
            Règles de la communauté
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Règles de la Communauté
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            StudyMarket est une communauté d'étudiants vérifiés. Ces règles garantissent un environnement sûr et respectueux pour tous.
          </p>
        </div>

        {/* Alert */}
        <Alert className="mb-8 border-primary/20 bg-primary/5">
          <GraduationCap className="h-4 w-4" />
          <AlertDescription>
            En utilisant StudyMarket, vous acceptez de respecter ces règles. Les violations peuvent entraîner des sanctions, jusqu'au bannissement permanent.
          </AlertDescription>
        </Alert>

        {/* Rules by Category */}
        <div className="mb-16 space-y-8">
          {rules.map((category, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <category.icon className={`w-6 h-6 ${category.color}`} />
                  <CardTitle className="text-2xl">{category.category}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {category.rules.map((rule, ruleIndex) => (
                    <div key={ruleIndex} className="flex gap-4 p-4 rounded-lg border bg-card">
                      <div className="flex-shrink-0 mt-1">
                        {rule.type === 'must' ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{rule.title}</h4>
                        <p className="text-sm text-muted-foreground">{rule.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Consequences */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">Sanctions en cas de violation</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {consequences.map((consequence, index) => (
              <Card key={index} className={index === 2 ? 'border-red-500/50' : ''}>
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className={`w-5 h-5 ${index === 2 ? 'text-red-600' : 'text-orange-600'}`} />
                    <CardTitle className="text-lg">{consequence.level}</CardTitle>
                  </div>
                  <CardDescription>{consequence.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {consequence.actions.map((action, actionIndex) => (
                      <li key={actionIndex} className="flex items-start gap-2 text-sm">
                        <span className="text-muted-foreground">•</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Reporting */}
        <Card className="bg-muted/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Flag className="w-6 h-6 text-primary" />
              <CardTitle>Signaler une violation</CardTitle>
            </div>
            <CardDescription>
              Si vous constatez une violation de ces règles, signalez-la immédiatement.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Vous pouvez signaler :
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Une annonce inappropriée ou frauduleuse</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Un comportement inapproprié dans les messages</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Un utilisateur non vérifié ou suspect</span>
                </li>
              </ul>
              <div className="pt-4">
                <p className="text-sm font-semibold mb-2">Comment signaler :</p>
                <p className="text-sm text-muted-foreground">
                  Utilisez le bouton "Signaler" sur chaque annonce ou profil, ou contactez directement{' '}
                  <a href="mailto:support@studymarket.fr" className="text-primary hover:underline">
                    support@studymarket.fr
                  </a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

