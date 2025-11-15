import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Cookie, Settings, Shield, Info, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const cookieTypes = [
  {
    category: 'Cookies essentiels',
    icon: Shield,
    color: 'text-green-600',
    description: 'Nécessaires au fonctionnement de la plateforme',
    required: true,
    cookies: [
      {
        name: 'session_id',
        purpose: 'Maintien de votre session utilisateur',
        duration: 'Session'
      },
      {
        name: 'auth_token',
        purpose: 'Authentification sécurisée',
        duration: '30 jours'
      }
    ]
  },
  {
    category: 'Cookies de préférences',
    icon: Settings,
    color: 'text-blue-600',
    description: 'Mémorisent vos choix et préférences',
    required: false,
    cookies: [
      {
        name: 'theme_preference',
        purpose: 'Mémorise votre thème (clair/sombre)',
        duration: '1 an'
      },
      {
        name: 'language',
        purpose: 'Mémorise votre langue préférée',
        duration: '1 an'
      },
      {
        name: 'filters',
        purpose: 'Sauvegarde vos filtres de recherche',
        duration: '30 jours'
      }
    ]
  },
  {
    category: 'Cookies analytiques',
    icon: Info,
    color: 'text-purple-600',
    description: 'Nous aident à comprendre comment vous utilisez la plateforme',
    required: false,
    cookies: [
      {
        name: 'analytics_id',
        purpose: 'Analyse du trafic et de l\'utilisation',
        duration: '2 ans'
      },
      {
        name: 'performance',
        purpose: 'Mesure des performances du site',
        duration: '1 an'
      }
    ]
  }
];

export const CookiesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4" variant="secondary">
            Politique des cookies
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Politique des Cookies
          </h1>
          <p className="text-muted-foreground">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Alert */}
        <Alert className="mb-8 border-primary/20 bg-primary/5">
          <Cookie className="h-4 w-4" />
          <AlertDescription>
            StudyMarket utilise des cookies pour améliorer votre expérience. Cette page explique quels cookies nous utilisons et comment vous pouvez les gérer.
          </AlertDescription>
        </Alert>

        {/* What are cookies */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              Qu'est-ce qu'un cookie ?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Un cookie est un petit fichier texte stocké sur votre appareil lorsque vous visitez un site web. 
              Il permet au site de mémoriser vos actions et préférences pendant une période donnée, 
              afin que vous n'ayez pas à les ressaisir à chaque visite.
            </p>
          </CardContent>
        </Card>

        {/* Cookie Types */}
        <div className="space-y-6 mb-12">
          {cookieTypes.map((type, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <type.icon className={`w-6 h-6 ${type.color}`} />
                    <CardTitle>{type.category}</CardTitle>
                  </div>
                  {type.required ? (
                    <Badge variant="secondary">Requis</Badge>
                  ) : (
                    <Badge variant="outline">Optionnel</Badge>
                  )}
                </div>
                <CardDescription>{type.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {type.cookies.map((cookie, cookieIndex) => (
                    <div key={cookieIndex} className="p-4 rounded-lg border bg-muted/50">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-sm">{cookie.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {cookie.duration}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{cookie.purpose}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Manage Cookies */}
        <Card className="bg-muted/50 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Gérer vos préférences de cookies
            </CardTitle>
            <CardDescription>
              Vous pouvez contrôler et gérer les cookies de plusieurs façons.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Via les paramètres du navigateur</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  La plupart des navigateurs vous permettent de :
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                  <li>Voir quels cookies sont stockés et les supprimer</li>
                  <li>Bloquer les cookies de sites tiers</li>
                  <li>Bloquer tous les cookies</li>
                  <li>Supprimer tous les cookies lors de la fermeture du navigateur</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Via les paramètres StudyMarket</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Vous pouvez modifier vos préférences de cookies directement depuis votre compte.
                </p>
                <Button variant="outline" size="sm">
                  Ouvrir les paramètres
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Note */}
        <Alert className="border-orange-500/20 bg-orange-500/5">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription>
            <strong className="text-foreground">Note importante :</strong> La désactivation de certains cookies 
            peut affecter le fonctionnement de la plateforme. Les cookies essentiels ne peuvent pas être désactivés 
            car ils sont nécessaires au fonctionnement de base du site.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

