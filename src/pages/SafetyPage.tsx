import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  MapPin,
  Eye,
  MessageCircle,
  CreditCard,
  Phone,
  Camera,
  Users,
  Clock,
  Flag,
  Lock,
  UserCheck,
  Lightbulb,
  ExternalLink,
  Download,
  Heart,
  Star,
  Zap,
  FileText,
  HelpCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Safety tips data
const safetyTips = [
  {
    category: 'Rencontres et Échanges',
    icon: MapPin,
    color: 'text-blue-600',
    tips: [
      {
        title: 'Choisissez des lieux publics',
        description: 'Rencontrez-vous toujours dans des endroits fréquentés : bibliothèques universitaires, halls d\'entrée, cafétérias du campus.',
        type: 'do',
        icon: CheckCircle
      },
      {
        title: 'Évitez les lieux isolés',
        description: 'Ne vous donnez jamais rendez-vous dans des parkings souterrains, domiciles privés ou endroits déserts.',
        type: 'dont',
        icon: XCircle
      },
      {
        title: 'Prévenez un proche',
        description: 'Informez toujours quelqu\'un de votre rendez-vous : lieu, heure, personne rencontrée.',
        type: 'do',
        icon: CheckCircle
      },
      {
        title: 'Rencontrez en journée',
        description: 'Privilégiez les rendez-vous en journée, évitez les rencontres tardives ou nocturnes.',
        type: 'do',
        icon: CheckCircle
      }
    ]
  },
  {
    category: 'Vérification d\'Identité',
    icon: UserCheck,
    color: 'text-green-600',
    tips: [
      {
        title: 'Demandez la carte étudiante',
        description: 'Vérifiez toujours l\'identité avec la carte étudiante. C\'est votre garantie de sécurité.',
        type: 'do',
        icon: CheckCircle
      },
      {
        title: 'Vérifiez le profil StudyMarket',
        description: 'Consultez le profil : badge vérifié, avis, nombre de transactions, ancienneté du compte.',
        type: 'do',
        icon: CheckCircle
      },
      {
        title: 'Méfiez-vous des profils récents',
        description: 'Soyez prudent avec les comptes créés récemment sans historique de transactions.',
        type: 'dont',
        icon: AlertTriangle
      },
      {
        title: 'Utilisez la messagerie StudyMarket',
        description: 'Gardez une trace de vos échanges via notre messagerie sécurisée.',
        type: 'do',
        icon: CheckCircle
      }
    ]
  },
  {
    category: 'Paiements Sécurisés',
    icon: CreditCard,
    color: 'text-purple-600',
    tips: [
      {
        title: 'Payez à la remise',
        description: 'Ne payez qu\'après avoir inspecté l\'objet et lors de la remise en main propre.',
        type: 'do',
        icon: CheckCircle
      },
      {
        title: 'Évitez les paiements à l\'avance',
        description: 'Ne versez jamais d\'acompte ou de paiement intégral avant d\'avoir vu l\'objet.',
        type: 'dont',
        icon: XCircle
      },
      {
        title: 'Utilisez des moyens traçables',
        description: 'Privilégiez Lydia, PayPal, virements ou espèces. Évitez les cryptomonnaies.',
        type: 'do',
        icon: CheckCircle
      },
      {
        title: 'Méfiez-vous des prix trop bas',
        description: 'Un iPhone à 50€ ou un MacBook à 200€ sont probablement des arnaques.',
        type: 'dont',
        icon: AlertTriangle
      }
    ]
  },
  {
    category: 'Communication',
    icon: MessageCircle,
    color: 'text-blue-600',
    tips: [
      {
        title: 'Restez poli et respectueux',
        description: 'Maintenez un ton courtois dans tous vos échanges, même en cas de désaccord.',
        type: 'do',
        icon: CheckCircle
      },
      {
        title: 'Posez des questions précises',
        description: 'Demandez des détails sur l\'état, l\'âge, la raison de la vente, les défauts éventuels.',
        type: 'do',
        icon: CheckCircle
      },
      {
        title: 'Méfiez-vous de l\'urgence',
        description: 'Les vendeurs qui pressent ("achetez maintenant", "dernière chance") sont suspects.',
        type: 'dont',
        icon: AlertTriangle
      },
      {
        title: 'Gardez les preuves',
        description: 'Conservez les captures d\'écran des conversations en cas de litige.',
        type: 'do',
        icon: CheckCircle
      }
    ]
  }
];

// Red flags to watch out for
const redFlags = [
  {
    title: 'Prix anormalement bas',
    description: 'Un objet vendu bien en-dessous de sa valeur marchande',
    severity: 'high',
    icon: AlertTriangle
  },
  {
    title: 'Paiement demandé à l\'avance',
    description: 'Demande d\'acompte ou paiement avant la rencontre',
    severity: 'high',
    icon: CreditCard
  },
  {
    title: 'Refus de se rencontrer',
    description: 'Propose uniquement l\'envoi postal ou la livraison',
    severity: 'high',
    icon: MapPin
  },
  {
    title: 'Photos de mauvaise qualité',
    description: 'Images floues, prises sur internet ou très peu nombreuses',
    severity: 'medium',
    icon: Camera
  },
  {
    title: 'Profil incomplet',
    description: 'Pas de photo de profil, peu d\'informations, compte récent',
    severity: 'medium',
    icon: Users
  },
  {
    title: 'Communication étrange',
    description: 'Français approximatif, réponses évasives, pression temporelle',
    severity: 'medium',
    icon: MessageCircle
  },
  {
    title: 'Changement de lieu',
    description: 'Modifie le lieu de rendez-vous au dernier moment',
    severity: 'medium',
    icon: Clock
  },
  {
    title: 'Demande d\'informations personnelles',
    description: 'Veut votre adresse, RIB, ou autres données sensibles',
    severity: 'high',
    icon: Lock
  }
];

// Emergency contacts and reporting
const emergencyInfo = [
  {
    title: 'Urgence immédiate',
    description: 'Danger physique, menaces, agression',
    contact: '17 (Police)',
    icon: Phone,
    color: 'text-red-600'
  },
  {
    title: 'Signalement StudyMarket',
    description: 'Comportement suspect, arnaque, violation des règles',
    contact: 'Bouton "Signaler" dans l\'app',
    icon: Flag,
    color: 'text-blue-600'
  },
  {
    title: 'Support StudyMarket',
    description: 'Questions, aide, médiation de conflit',
    contact: 'support@studymarket.fr',
    icon: MessageCircle,
    color: 'text-blue-600'
  },
  {
    title: 'Sécurité Campus',
    description: 'Incidents sur le campus universitaire',
    contact: 'Service sécurité de votre université',
    icon: Shield,
    color: 'text-green-600'
  }
];

export const SafetyPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold">Sécurité & Conseils</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Votre sécurité est notre priorité. Suivez ces conseils pour des échanges sereins et sécurisés entre étudiants.
        </p>
      </div>

      {/* Quick Safety Alert */}
      <Alert className="border-green-200 bg-green-50">
        <Shield className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <div className="flex items-center justify-between">
            <div>
              <strong>Rappel important :</strong> Rencontrez-vous toujours dans un lieu public du campus et vérifiez l'identité avec la carte étudiante.
            </div>
            <Button variant="outline" size="sm" className="ml-4 border-green-300 text-green-700 hover:bg-green-100">
              <Download className="w-3 h-3 mr-1" />
              Guide PDF
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      {/* Safety Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">99.8%</div>
            <div className="text-sm text-muted-foreground">Transactions sécurisées</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <UserCheck className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">100%</div>
            <div className="text-sm text-muted-foreground">Étudiants vérifiés</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-600">&lt; 2h</div>
            <div className="text-sm text-muted-foreground">Réponse aux signalements</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Star className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">4.9/5</div>
            <div className="text-sm text-muted-foreground">Satisfaction sécurité</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Safety Tips */}
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Guide de Sécurité Complet</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Suivez ces conseils essentiels pour des échanges en toute sécurité
          </p>
        </div>

        {safetyTips.map((category, categoryIndex) => (
          <Card key={categoryIndex}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <category.icon className={`w-6 h-6 ${category.color}`} />
                {category.category}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {category.tips.map((tip, tipIndex) => (
                  <div 
                    key={tipIndex} 
                    className={`p-4 rounded-lg border-2 ${
                      tip.type === 'do' 
                        ? 'border-green-200 bg-green-50' 
                        : tip.type === 'dont'
                        ? 'border-red-200 bg-red-50'
                        : 'border-blue-200 bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <tip.icon className={`w-5 h-5 mt-0.5 ${
                        tip.type === 'do' 
                          ? 'text-green-600' 
                          : tip.type === 'dont'
                          ? 'text-red-600'
                          : 'text-blue-600'
                      }`} />
                      <div>
                        <h4 className={`font-semibold mb-2 ${
                          tip.type === 'do' 
                            ? 'text-green-800' 
                            : tip.type === 'dont'
                            ? 'text-red-800'
                            : 'text-blue-800'
                        }`}>
                          {tip.title}
                        </h4>
                        <p className={`text-sm ${
                          tip.type === 'do' 
                            ? 'text-green-700' 
                            : tip.type === 'dont'
                            ? 'text-red-700'
                            : 'text-blue-700'
                        }`}>
                          {tip.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Red Flags Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            Signaux d'Alarme à Reconnaître
          </CardTitle>
          <CardDescription>
            Ces comportements doivent vous alerter et vous inciter à la prudence
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {redFlags.map((flag, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-lg border-2 ${
                  flag.severity === 'high' 
                    ? 'border-red-200 bg-red-50' 
                    : 'border-blue-200 bg-blue-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <flag.icon className={`w-5 h-5 mt-0.5 ${
                    flag.severity === 'high' ? 'text-red-600' : 'text-blue-600'
                  }`} />
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className={`font-semibold ${
                        flag.severity === 'high' ? 'text-red-800' : 'text-blue-800'
                      }`}>
                        {flag.title}
                      </h4>
                      <Badge 
                        variant={flag.severity === 'high' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {flag.severity === 'high' ? 'Danger' : 'Attention'}
                      </Badge>
                    </div>
                    <p className={`text-sm ${
                      flag.severity === 'high' ? 'text-red-700' : 'text-blue-700'
                    }`}>
                      {flag.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-6 h-6 text-blue-600" />
            Contacts d'Urgence et Signalement
          </CardTitle>
          <CardDescription>
            En cas de problème, voici qui contacter selon la situation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {emergencyInfo.map((info, index) => (
              <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  info.color === 'text-red-600' ? 'bg-red-100' :
                  info.color === 'text-blue-600' ? 'bg-blue-100' :
                  info.color === 'text-blue-600' ? 'bg-blue-100' :
                  'bg-green-100'
                }`}>
                  <info.icon className={`w-6 h-6 ${info.color}`} />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">{info.title}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{info.description}</p>
                  <div className={`font-medium ${info.color}`}>{info.contact}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional Resources */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <FileText className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Guide Complet PDF</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Téléchargez notre guide de sécurité complet
            </p>
            <Button variant="outline" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Télécharger
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <HelpCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Centre d'Aide</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Questions fréquentes sur la sécurité
            </p>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/help">
                <ExternalLink className="w-4 h-4 mr-2" />
                Consulter l'aide
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <MessageCircle className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Signaler un Problème</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Contactez notre équipe de sécurité
            </p>
            <Button variant="outline" className="w-full">
              <Flag className="w-4 h-4 mr-2" />
              Faire un signalement
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Final Safety Reminder */}
      <Alert className="border-blue-200 bg-blue-50">
        <Lightbulb className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Rappel :</strong> En cas de doute, n'hésitez pas à annuler la transaction. Votre sécurité vaut plus que n'importe quel objet. 
          L'équipe StudyMarket est là pour vous aider 24h/7j.
        </AlertDescription>
      </Alert>
    </div>
  );
};