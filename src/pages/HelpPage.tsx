import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  HelpCircle, 
  Search, 
  MessageCircle, 
  Mail, 
  Phone,
  Book,
  Shield,
  Heart,
  Zap,
  Users,
  Settings,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Send,
  Clock,
  Star,
  Lightbulb,
  FileText,
  Video,
  Download,
  Globe,
  Smartphone,
  Laptop,
  Headphones
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

// FAQ Data
const faqData = [
  {
    category: 'Compte et Inscription',
    icon: Users,
    questions: [
      {
        question: 'Comment créer un compte étudiant vérifié ?',
        answer: 'Pour créer votre compte, utilisez votre adresse email universitaire (ex: prenom.nom@univ-exemple.fr). Notre système vérifie automatiquement votre statut étudiant. Vous recevrez un badge "Étudiant certifié" une fois la vérification terminée.'
      },
      {
        question: 'Pourquoi mon université n\'est pas reconnue ?',
        answer: 'Nous ajoutons régulièrement de nouvelles universités. Si la vôtre n\'apparaît pas, contactez-nous avec votre carte étudiante et nous l\'ajouterons rapidement à notre base de données.'
      },
      {
        question: 'Comment modifier mes informations de profil ?',
        answer: 'Rendez-vous dans "Mon profil" depuis le menu utilisateur. Vous pouvez modifier votre photo, bio, université, et préférences de notification. Certaines informations nécessitent une re-vérification.'
      },
      {
        question: 'Puis-je avoir plusieurs comptes ?',
        answer: 'Non, un seul compte par personne est autorisé. Cela garantit la confiance et la sécurité de notre communauté étudiante.'
      }
    ]
  },
  {
    category: 'Achats et Ventes',
    icon: CreditCard,
    questions: [
      {
        question: 'Comment publier une annonce ?',
        answer: 'Cliquez sur "Publier" dans le menu principal. Remplissez le formulaire avec photos, description détaillée, prix et lieu de rencontre. Votre annonce sera visible immédiatement après publication.'
      },
      {
        question: 'Quels modes de paiement sont acceptés ?',
        answer: 'Nous recommandons les paiements sécurisés : espèces lors de la remise en main propre, virements bancaires, Lydia, ou PayPal. Évitez les paiements à distance sans garantie.'
      },
      {
        question: 'Comment fixer le bon prix ?',
        answer: 'Notre IA vous suggère une fourchette de prix basée sur l\'état et la catégorie. Consultez les annonces similaires et considérez l\'état réel de votre objet. Les prix justes se vendent plus rapidement.'
      },
      {
        question: 'Que faire si un acheteur ne se présente pas ?',
        answer: 'Contactez-le via notre messagerie. Si pas de réponse sous 24h, vous pouvez signaler le comportement et remettre votre annonce en ligne. Nous prenons ces situations au sérieux.'
      }
    ]
  },
  {
    category: 'Sécurité et Confiance',
    icon: Shield,
    questions: [
      {
        question: 'Comment éviter les arnaques ?',
        answer: 'Rencontrez-vous toujours en personne dans un lieu public (campus, bibliothèque). Vérifiez l\'identité avec la carte étudiante. Ne payez jamais à l\'avance sans avoir vu l\'objet. Utilisez notre système de signalement en cas de doute.'
      },
      {
        question: 'Où se rencontrer en sécurité ?',
        answer: 'Privilégiez les lieux publics de votre campus : bibliothèques, halls d\'entrée, cafétérias. Évitez les parkings isolés ou les domiciles privés. Certaines universités ont des "zones d\'échange sécurisées".'
      },
      {
        question: 'Comment signaler un utilisateur suspect ?',
        answer: 'Utilisez le bouton "Signaler" sur le profil ou dans la conversation. Décrivez précisément le problème. Notre équipe examine tous les signalements sous 24h et prend les mesures appropriées.'
      },
      {
        question: 'Que faire en cas de litige ?',
        answer: 'Contactez d\'abord l\'autre partie via notre messagerie. Si pas de résolution, utilisez notre service de médiation gratuit. En dernier recours, contactez le support avec toutes les preuves (captures, messages).'
      }
    ]
  },
  {
    category: 'Messagerie et Communication',
    icon: MessageCircle,
    questions: [
      {
        question: 'Comment contacter un vendeur ?',
        answer: 'Cliquez sur "Contacter le vendeur" sur l\'annonce. Rédigez un message poli et précis. Le vendeur recevra une notification email et pourra vous répondre via notre messagerie sécurisée.'
      },
      {
        question: 'Pourquoi mes messages ne sont pas lus ?',
        answer: 'Les utilisateurs reçoivent des notifications email mais peuvent avoir des délais de réponse. Soyez patient (24-48h). Si pas de réponse, l\'annonce est peut-être déjà vendue ou l\'utilisateur inactif.'
      },
      {
        question: 'Puis-je partager mes coordonnées ?',
        answer: 'Oui, mais seulement après les premiers échanges via notre messagerie. Cela nous permet de garder une trace en cas de problème et de vous protéger contre le spam.'
      },
      {
        question: 'Comment bloquer un utilisateur ?',
        answer: 'Dans la conversation, cliquez sur les trois points puis "Bloquer". L\'utilisateur ne pourra plus vous contacter. Vous pouvez débloquer depuis vos paramètres si nécessaire.'
      }
    ]
  },
  {
    category: 'Impact Écologique',
    icon: Heart,
    questions: [
      {
        question: 'Comment est calculé mon impact CO₂ ?',
        answer: 'Chaque objet acheté d\'occasion évite la production d\'un neuf. Nous calculons le CO₂ économisé selon des données ADEME : 85kg pour un smartphone, 8.5kg pour un livre, etc. Votre total s\'affiche dans votre profil.'
      },
      {
        question: 'Qu\'est-ce que les badges écologiques ?',
        answer: 'Vous gagnez des badges selon vos actions : "Premier Pas" (1ère transaction), "Éco-Warrior" (10kg CO₂), "Héros Climatique" (100kg CO₂). Ils apparaissent sur votre profil et motivent la communauté.'
      },
      {
        question: 'Comment améliorer mon rang écologique ?',
        answer: 'Multipliez les transactions d\'occasion, privilégiez les dons (bonus +20%), participez aux échanges. Plus vous économisez de CO₂, plus votre rang augmente : Débutant → Éco-Warrior → Maître Environnemental → Légende Écologique.'
      }
    ]
  },
  {
    category: 'Technique et Bugs',
    icon: Settings,
    questions: [
      {
        question: 'L\'application ne fonctionne pas correctement',
        answer: 'Essayez de vider le cache de votre navigateur (Ctrl+F5) ou utilisez un autre navigateur. Vérifiez votre connexion internet. Si le problème persiste, contactez-nous avec votre navigateur et système d\'exploitation.'
      },
      {
        question: 'Je ne reçois pas les notifications email',
        answer: 'Vérifiez vos spams/courriers indésirables. Ajoutez notifications@studymarket.fr à vos contacts. Vérifiez vos préférences de notification dans "Paramètres". Certains emails universitaires bloquent les notifications externes.'
      },
      {
        question: 'Mes photos ne s\'uploadent pas',
        answer: 'Vérifiez que vos images font moins de 15MB et sont au format JPG/PNG. Essayez de les redimensionner. Si vous êtes sur mobile, autorisez l\'accès à la galerie dans les paramètres de votre navigateur.'
      },
      {
        question: 'Comment supprimer mon compte ?',
        answer: 'Rendez-vous dans "Paramètres" > "Compte" > "Supprimer mon compte". Cette action est irréversible et supprime toutes vos données. Vos annonces actives seront automatiquement retirées.'
      }
    ]
  }
];

// Contact options
const contactOptions = [
  {
    title: 'Chat en direct',
    description: 'Réponse immédiate pendant les heures ouvrables',
    icon: MessageCircle,
    action: 'Démarrer le chat',
    available: true,
    hours: 'Lun-Ven 9h-18h'
  },
  {
    title: 'Email Support',
    description: 'Réponse sous 24h maximum',
    icon: Mail,
    action: 'support@studymarket.fr',
    available: true,
    hours: '24h/7j'
  },
  {
    title: 'Téléphone',
    description: 'Pour les urgences uniquement',
    icon: Phone,
    action: '01 23 45 67 89',
    available: false,
    hours: 'Bientôt disponible'
  },
  {
    title: 'Centre de ressources',
    description: 'Guides détaillés et tutoriels',
    icon: Book,
    action: 'Consulter les guides',
    available: true,
    hours: 'Toujours accessible'
  }
];

// Guides and tutorials
const guides = [
  {
    title: 'Guide du vendeur débutant',
    description: 'Tout savoir pour vendre efficacement',
    icon: Star,
    duration: '5 min',
    type: 'Article'
  },
  {
    title: 'Sécurité : éviter les arnaques',
    description: 'Reconnaître et éviter les situations dangereuses',
    icon: Shield,
    duration: '3 min',
    type: 'Vidéo'
  },
  {
    title: 'Optimiser ses annonces',
    description: 'Photos, descriptions et prix pour vendre vite',
    icon: Zap,
    duration: '7 min',
    type: 'Article'
  },
  {
    title: 'Impact écologique expliqué',
    description: 'Comment nous calculons votre empreinte carbone',
    icon: Heart,
    duration: '4 min',
    type: 'Infographie'
  }
];

export const HelpPage: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('faq');
  const [contactForm, setContactForm] = useState({
    subject: '',
    category: '',
    message: '',
    priority: 'normal'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check URL params for tab selection (from chatbot)
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'contact') {
      setActiveTab('contact');
    }
  }, [searchParams]);

  // Filter FAQ based on search and category
  const filteredFAQ = faqData.filter(category => {
    if (selectedCategory !== 'all' && category.category !== selectedCategory) {
      return false;
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return category.questions.some(q => 
        q.question.toLowerCase().includes(query) || 
        q.answer.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contactForm.subject || !contactForm.message) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Votre message a été envoyé ! Nous vous répondrons sous 24h.');
      setContactForm({
        subject: '',
        category: '',
        message: '',
        priority: 'normal'
      });
    } catch (error) {
      toast.error('Erreur lors de l\'envoi. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
            <HelpCircle className="w-6 h-6 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold">Centre d'Aide StudyMarket</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Trouvez rapidement les réponses à vos questions ou contactez notre équipe support
        </p>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher dans l'aide... (ex: comment vendre, sécurité, notifications)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-lg"
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Contact Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {contactOptions.map((option, index) => (
          <Card key={index} className={`transition-all hover:shadow-lg ${!option.available ? 'opacity-60' : 'hover:-translate-y-1'}`}>
            <CardContent className="pt-6 text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                option.available ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
                <option.icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">{option.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{option.description}</p>
              <div className="text-xs text-muted-foreground mb-3">{option.hours}</div>
              <Button 
                variant={option.available ? "default" : "secondary"} 
                size="sm" 
                disabled={!option.available}
                className="w-full"
              >
                {option.action}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 p-0 gap-0 items-center h-10">
          <TabsTrigger value="faq" className="flex items-center gap-1 text-xs sm:text-sm rounded-l-lg rounded-r-none h-10">
            <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4" />
            FAQ
          </TabsTrigger>
          <TabsTrigger value="guides" className="flex items-center gap-1 text-xs sm:text-sm rounded-none h-10">
            <Book className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Guides</span>
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center gap-1 text-xs sm:text-sm rounded-r-lg rounded-l-none h-10">
            <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Contact</span>
          </TabsTrigger>
        </TabsList>

        {/* FAQ Tab */}
        <TabsContent value="faq" className="space-y-6">
          {/* Category Filter */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('all')}
                >
                  Toutes les catégories
                </Button>
                {faqData.map((category) => (
                  <Button
                    key={category.category}
                    variant={selectedCategory === category.category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category.category)}
                    className="flex items-center gap-2"
                  >
                    <category.icon className="w-4 h-4" />
                    {category.category}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* FAQ Content */}
          {filteredFAQ.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Aucun résultat trouvé</h3>
                <p className="text-muted-foreground mb-4">
                  Essayez avec d'autres mots-clés ou contactez notre support
                </p>
                <Button variant="outline" onClick={() => setSearchQuery('')}>
                  Effacer la recherche
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {filteredFAQ.map((category, categoryIndex) => (
                <Card key={categoryIndex}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <category.icon className="w-5 h-5" />
                      {category.category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {category.questions.map((qa, qaIndex) => (
                        <AccordionItem key={qaIndex} value={`${categoryIndex}-${qaIndex}`}>
                          <AccordionTrigger className="text-left">
                            {qa.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground leading-relaxed">
                            {qa.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Guides Tab */}
        <TabsContent value="guides" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Guides et Tutoriels
              </CardTitle>
              <CardDescription>
                Apprenez à utiliser StudyMarket comme un pro avec nos guides détaillés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {guides.map((guide, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <guide.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{guide.title}</h3>
                          <Badge variant="outline" className="text-xs">
                            {guide.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {guide.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {guide.duration}
                          </span>
                          <Button size="sm" variant="outline">
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Lire
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Additional Resources */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <Video className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Tutoriels Vidéo</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Apprenez visuellement avec nos vidéos courtes
                </p>
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Voir les vidéos
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <Download className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Ressources PDF</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Téléchargez nos guides au format PDF
                </p>
                <Button variant="outline" size="sm">
                  <Download className="w-3 h-3 mr-1" />
                  Télécharger
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <Users className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Communauté</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Échangez avec d'autres étudiants
                </p>
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Rejoindre
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Contact Tab */}
        <TabsContent value="contact" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Contactez notre équipe
                </CardTitle>
                <CardDescription>
                  Décrivez votre problème en détail pour une réponse rapide et précise
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="subject">Sujet *</Label>
                    <Input
                      id="subject"
                      value={contactForm.subject}
                      onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Résumez votre problème en quelques mots"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Catégorie</Label>
                    <Select 
                      value={contactForm.category} 
                      onValueChange={(value) => setContactForm(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Sélectionnez une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="account">Compte et profil</SelectItem>
                        <SelectItem value="listing">Annonces</SelectItem>
                        <SelectItem value="payment">Paiements</SelectItem>
                        <SelectItem value="security">Sécurité</SelectItem>
                        <SelectItem value="technical">Problème technique</SelectItem>
                        <SelectItem value="other">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="priority">Priorité</Label>
                    <Select 
                      value={contactForm.priority} 
                      onValueChange={(value) => setContactForm(prev => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Basse - Question générale</SelectItem>
                        <SelectItem value="normal">Normale - Besoin d'aide</SelectItem>
                        <SelectItem value="high">Haute - Problème bloquant</SelectItem>
                        <SelectItem value="urgent">Urgente - Sécurité/Arnaque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      value={contactForm.message}
                      onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Décrivez votre problème en détail. Plus vous donnez d'informations, plus nous pourrons vous aider efficacement."
                      rows={6}
                      className="mt-1"
                    />
                  </div>

                  {currentUser && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Nous vous répondrons à l'adresse <strong>{currentUser.email}</strong>
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting || !contactForm.subject || !contactForm.message}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Envoyer le message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Info & Status */}
            <div className="space-y-6">
              {/* Response Times */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Temps de réponse
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Questions générales</span>
                    <Badge variant="secondary">24h</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Problèmes techniques</span>
                    <Badge variant="secondary">12h</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Urgences sécurité</span>
                    <Badge className="bg-red-500">2h</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Alternative Contact */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Autres moyens de contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Email direct</div>
                      <div className="text-sm text-muted-foreground">support@studymarket.fr</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Chat en direct</div>
                      <div className="text-sm text-muted-foreground">Lun-Ven 9h-18h</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Application mobile</div>
                      <div className="text-sm text-muted-foreground">Bientôt disponible</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* System Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    État du système
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Plateforme web</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-600">Opérationnel</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Messagerie</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-600">Opérationnel</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Notifications email</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm text-yellow-600">Maintenance</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-3">
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Page de statut complète
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};