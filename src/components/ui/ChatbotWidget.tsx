import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, Home, Mail, User, ArrowLeft, Check, ArrowRight, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

type ViewMode = 'menu' | 'chat' | 'contact' | 'home';

const ChatbotWidget: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('menu');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [contactForm, setContactForm] = useState<ContactForm>({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && viewMode === 'chat' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, viewMode]);

  // Charger les messages au démarrage
  useEffect(() => {
    const initMessages = async () => {
      const loadedMessages = await loadMessagesFromFirestore();
      setMessages(loadedMessages);
    };
    
    initMessages();
  }, [currentUser]);

  // Pré-remplir le formulaire de contact si l'utilisateur est connecté
  useEffect(() => {
    if (currentUser && userProfile) {
      setContactForm(prev => ({
        ...prev,
        name: prev.name || userProfile.displayName || currentUser.displayName || '',
        email: prev.email || userProfile.email || currentUser.email || ''
      }));
    }
  }, [currentUser, userProfile]);

  const generateBotResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('bonjour') || input.includes('salut') || input.includes('hello')) {
      const userName = userProfile?.displayName || currentUser?.displayName || 'étudiant';
      return currentUser 
        ? `Salut ${userName} ! 😊 Comment ça va ? Je peux t'aider avec tes annonces ou répondre à tes questions sur StudyMarket.`
        : 'Salut ! 😊 Bienvenue sur StudyMarket ! Je peux t\'aider à naviguer sur la plateforme. Que cherches-tu ?';
    }
    
    if (input.includes('annonce') || input.includes('publier') || input.includes('vendre')) {
      return 'Pour publier une annonce, va sur "Créer une annonce" ! 📝 Tu peux vendre des livres, de l\'électronique, proposer des services ou même faire du troc. Besoin d\'aide pour une catégorie spécifique ?';
    }
    
    if (input.includes('acheter') || input.includes('trouver') || input.includes('rechercher')) {
      return 'Pour trouver des articles, utilise la barre de recherche ou parcours les catégories ! 🔍 Tu peux filtrer par prix et université. Que cherches-tu exactement ?';
    }
    
    if (input.includes('sécurité') || input.includes('sûr') || input.includes('confiance')) {
      return 'StudyMarket est sécurisé ! 🛡️ Tous les étudiants sont vérifiés avec leur email universitaire. Utilise notre chat intégré et rencontrez-vous dans des lieux publics du campus.';
    }
    
    if (input.includes('prix') || input.includes('coût') || input.includes('gratuit')) {
      return 'StudyMarket est 100% gratuit pour les étudiants ! 🎓 Pas de frais cachés pour publier ou contacter des vendeurs. On veut juste faciliter les échanges !';
    }
    
    if (input.includes('logement') || input.includes('chambre') || input.includes('colocation')) {
      return '🏠 Section Logement ! Tu peux chercher des colocations, studios ou chambres près de ton campus. Utilise les filtres par prix et distance. Visite toujours avant de t\'engager !';
    }
    
    if (input.includes('job') || input.includes('stage') || input.includes('travail')) {
      return '💼 Jobs & Stages ! Parfait pour ton budget étudiant. Tu trouveras des petits boulots, cours particuliers, stages... Postule directement via la plateforme !';
    }
    
    if (input.includes('problème') || input.includes('bug') || input.includes('erreur')) {
      return 'Oh non ! 😅 Peux-tu me dire quel problème ? Essaie de rafraîchir la page. Si ça persiste, contacte notre support !';
    }
    
    if (input.includes('merci') || input.includes('thanks')) {
      return 'De rien ! 😊 C\'est un plaisir d\'aider la communauté étudiante. N\'hésite pas si tu as d\'autres questions !';
    }
    
    return 'Hmm, je ne suis pas sûr de comprendre ! 🤔 Je peux t\'aider avec :\n\n• Créer/gérer des annonces\n• Questions de sécurité\n• Navigation sur le site\n• Infos sur les catégories\n\nPose-moi une question plus spécifique ! 😊';
  };

  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsTyping(true);

    // Sauvegarder le message utilisateur
    saveMessagesToCache(newMessages);
    if (currentUser) {
      saveMessagesToFirestore(newMessages);
    }

    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateBotResponse(inputValue),
        sender: 'bot',
        timestamp: new Date(),
      };

      const finalMessages = [...newMessages, botResponse];
      setMessages(finalMessages);
      setIsTyping(false);

      // Sauvegarder aussi la réponse du bot
      saveMessagesToCache(finalMessages);
      if (currentUser) {
        saveMessagesToFirestore(finalMessages);
      }
    }, 1000 + Math.random() * 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactLoading(true);
    
    try {
      // Appeler la Edge Function Supabase pour envoyer l'email et sauvegarder
      const { data, error } = await supabase.functions.invoke('contact-email', {
        body: {
          name: contactForm.name,
          email: contactForm.email,
          subject: contactForm.subject,
          message: contactForm.message,
          user_id: currentUser?.uid || null,
        }
      });

      if (error) {
        throw error;
      }

      if (data && !data.success) {
        throw new Error(data.error || 'Erreur lors de l\'envoi');
      }

      setContactSuccess(true);
      toast.success('Message envoyé avec succès ! Nous vous répondrons rapidement.');
      
      // Reset après 3 secondes
      setTimeout(() => {
        setContactSuccess(false);
        setContactForm({ name: '', email: '', subject: '', message: '' });
        setViewMode('menu');
      }, 3000);

    } catch (error: any) {
      console.error('Erreur envoi message:', error);
      toast.error('Erreur lors de l\'envoi du message: ' + (error.message || 'Erreur inconnue'));
    } finally {
      setContactLoading(false);
    }
  };

  const handleContactFormChange = (field: keyof ContactForm, value: string) => {
    setContactForm(prev => ({ ...prev, [field]: value }));
  };

  const openWidget = () => {
    setIsOpen(true);
    setIsMinimized(false);
    setViewMode('menu');
  };

  const closeWidget = () => {
    setIsOpen(false);
    setIsMinimized(false);
    setViewMode('menu');
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const goToHome = () => {
    window.location.href = '/';
  };

  // Fonctions de persistance des messages
  const saveMessagesToCache = (messages: Message[]) => {
    try {
      localStorage.setItem('chatbot_messages', JSON.stringify(messages));
    } catch (error) {
      console.warn('Erreur sauvegarde cache:', error);
    }
  };

  const loadMessagesFromCache = (): Message[] => {
    try {
      const cached = localStorage.getItem('chatbot_messages');
      if (cached) {
        const parsedMessages = JSON.parse(cached);
        // Convertir les timestamps string en Date
        return parsedMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      }
    } catch (error) {
      console.warn('Erreur chargement cache:', error);
    }
    return [
      {
        id: '1',
        text: 'Salut ! 👋 Je suis l\'assistant StudyMarket. Comment puis-je t\'aider aujourd\'hui ?',
        sender: 'bot',
        timestamp: new Date()
      }
    ];
  };

  const saveMessagesToFirestore = async (messages: Message[]) => {
    if (!currentUser) return;
    
    try {
      const chatRef = doc(db, 'chatHistory', currentUser.uid);
      await setDoc(chatRef, {
        messages: messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp.toISOString()
        })),
        lastUpdated: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.warn('Erreur sauvegarde Firestore:', error);
    }
  };

  const loadMessagesFromFirestore = async (): Promise<Message[]> => {
    if (!currentUser) return loadMessagesFromCache();
    
    try {
      const chatRef = doc(db, 'chatHistory', currentUser.uid);
      const chatSnap = await getDoc(chatRef);
      
      if (chatSnap.exists()) {
        const data = chatSnap.data();
        const firestoreMessages = data.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        
        // Sauvegarder aussi en cache
        saveMessagesToCache(firestoreMessages);
        return firestoreMessages;
      }
    } catch (error) {
      console.warn('Erreur chargement Firestore:', error);
    }
    
    return loadMessagesFromCache();
  };

  // Menu principal
  const renderMenu = () => (
    <div className="p-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl font-bold text-white">T</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Salut {userProfile?.displayName || currentUser?.displayName || 'Étudiant'} ! 👋
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Comment peut-on t'aider ?
        </p>
      </div>

      {/* Recent message preview */}
      <div 
        className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-lg"
        onClick={() => setViewMode('chat')}
      >
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Message récent
        </h3>
        {messages.length > 0 && messages.some(msg => msg.sender === 'user') ? (
          <div className="flex items-start space-x-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-xs">
                {messages[messages.length - 1].sender === 'bot' ? 'T' : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {messages[messages.length - 1].text.length > 50 
                  ? `${messages[messages.length - 1].text.substring(0, 50)}...`
                  : messages[messages.length - 1].text
                }
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {messages[messages.length - 1].sender === 'bot' ? 'Assistant' : 'Vous'} • {
                  new Date(messages[messages.length - 1].timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })
                }
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </div>
        ) : (
          <div className="flex items-center justify-between py-4">
            <p className="text-sm text-gray-500 italic">Aucun message récent</p>
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </div>
        )}
      </div>
    </div>
  );

  // Barre de navigation en bas
  const renderBottomNav = () => (
    <div className="flex items-center justify-around p-4 bg-white dark:bg-gray-900">
      <Button
        variant="ghost"
        size="sm"
        onClick={goToHome}
        className={`p-2 ${viewMode === 'home' ? 'text-primary' : 'text-gray-500'}`}
      >
        <Home className="w-5 h-5" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setViewMode('chat')}
        className={`p-2 ${viewMode === 'chat' ? 'text-primary' : 'text-gray-500'}`}
      >
        <Bot className="w-5 h-5" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setViewMode('contact')}
        className={`p-2 ${viewMode === 'contact' ? 'text-primary' : 'text-gray-500'}`}
      >
        <Mail className="w-5 h-5" />
      </Button>
    </div>
  );

  // Interface de chat
  const renderChat = () => (
    <div className="flex flex-col h-full">
            {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('menu')}
            className="p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
                <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-xs">
              SM
                  </AvatarFallback>
                </Avatar>
                <div>
            <h3 className="font-semibold text-sm">Assistant StudyMarket</h3>
            <p className="text-xs text-green-600">En ligne</p>
              </div>
        </div>
        <Badge className="bg-green-100 text-green-800 text-xs">Actif</Badge>
            </div>

            {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message, index) => {
          const isUser = message.sender === 'user';
          const showAvatar = index === 0 || messages[index - 1].sender !== message.sender;
          
          return (
                <div
                  key={message.id}
              className={`flex items-end space-x-2 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              {/* Avatar */}
              <div className="flex-shrink-0">
                {showAvatar ? (
                  <Avatar className="w-8 h-8">
                    {isUser ? (
                      userProfile?.photoURL ? (
                        <img 
                          src={userProfile.photoURL} 
                          alt="User Avatar" 
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-sm font-semibold">
                          {userProfile?.displayName?.charAt(0) || currentUser?.displayName?.charAt(0) || 'U'}
                        </AvatarFallback>
                      )
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-sm font-semibold">
                        T
                      </AvatarFallback>
                    )}
                    </Avatar>
                ) : (
                  <div className="w-8 h-8" />
                )}
              </div>

              {/* Message Bubble */}
              <div className="flex flex-col max-w-[75%]">
                <div
                  className={`px-4 py-2 ${
                    isUser
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl rounded-br-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-2xl rounded-bl-md'
                  }`}
                >
                  <p className="text-sm whitespace-pre-line leading-relaxed text-left">{message.text}</p>
                </div>
                
                {/* Timestamp */}
                <p className={`text-xs text-gray-500 mt-1 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
          );
        })}
              
              {isTyping && (
          <div className="flex items-end space-x-2">
            {/* Avatar du bot */}
            <div className="flex-shrink-0">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-sm font-semibold">
                  T
                      </AvatarFallback>
                    </Avatar>
            </div>

            {/* Bulle de frappe */}
            <div className="max-w-[75%]">
              <div className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-bl-md">
                      <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
      <div className="p-4">
              <div className="flex space-x-2">
                <Input
            ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
            placeholder="Tape ton message..."
            className="flex-1 border-none focus:ring-0 focus:ring-offset-0 bg-gray-50 dark:bg-gray-700"
                  disabled={isTyping}
                />
                <Button
            onClick={sendMessage}
                  disabled={!inputValue.trim() || isTyping}
                  size="icon"
            className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Send className="w-6 h-6 text-white" />
          </Button>
        </div>
      </div>
    </div>
  );

  // Formulaire de contact
  const renderContact = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-primary/5 to-secondary/5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setViewMode('menu')}
          className="p-2"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Mail className="w-6 h-6 text-primary" />
        <h3 className="font-semibold">Nous contacter</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {contactSuccess ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="text-lg font-semibold text-green-600 mb-2">
              Message envoyé !
            </h4>
            <p className="text-gray-600">
              Nous te répondrons rapidement.
            </p>
          </div>
        ) : (
          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nom complet *
              </label>
              <Input
                type="text"
                value={contactForm.name}
                onChange={(e) => handleContactFormChange('name', e.target.value)}
                required
                placeholder="Ton nom complet"
                className="w-full border-none focus:ring-0 focus:ring-offset-0 bg-gray-50 dark:bg-gray-700"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email *
              </label>
              <Input
                type="email"
                value={contactForm.email}
                onChange={(e) => handleContactFormChange('email', e.target.value)}
                required
                placeholder="ton.email@univ.fr"
                className="w-full border-none focus:ring-0 focus:ring-offset-0 bg-gray-50 dark:bg-gray-700"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sujet *
              </label>
              <Input
                type="text"
                value={contactForm.subject}
                onChange={(e) => handleContactFormChange('subject', e.target.value)}
                required
                placeholder="Sujet de ton message"
                className="w-full border-none focus:ring-0 focus:ring-offset-0 bg-gray-50 dark:bg-gray-700"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Message *
              </label>
              <textarea
                value={contactForm.message}
                onChange={(e) => handleContactFormChange('message', e.target.value)}
                required
                rows={4}
                placeholder="Décris ta demande..."
                className="w-full px-3 py-2 border-none focus:ring-0 focus:ring-offset-0 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
              />
            </div>
            
            <Button
              type="submit"
              disabled={contactLoading}
              className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white"
            >
              {contactLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Envoi en cours...
                </>
              ) : (
                'Envoyer le message'
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Bouton flottant - toujours visible */}
      <Button
        onClick={isOpen ? closeWidget : openWidget}
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
      >
        {isOpen ? (
          <img 
            src={`${import.meta.env.BASE_URL}assets/arrow.svg`} 
            alt="Arrow" 
            className="w-5 h-5 md:w-6 md:h-6" 
          />
        ) : (
          <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-white" />
        )}
      </Button>

      {/* Widget principal - bulle au-dessus */}
      {isOpen && (
                  <Card className={`fixed z-40 shadow-2xl border-0 bg-white dark:bg-gray-900 overflow-hidden transition-all duration-300 ease-in-out
            ${isMinimized 
              ? 'bottom-24 right-4 w-80 max-w-[calc(100vw-2rem)] h-10' 
              : 'bottom-24 right-4 w-80 max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-8rem)]'
            }
            md:${isMinimized ? 'bottom-20 md:right-6 md:w-80' : 'bottom-20 md:right-6 md:w-96 md:h-[550px] md:max-h-[calc(100vh-8rem)]'}
            md:max-w-none
          `}>
          <CardContent className="p-0 h-full flex flex-col">
            {/* Header avec boutons */}
            <div 
              className="flex items-center justify-between p-4 bg-gradient-to-r from-primary to-secondary text-white cursor-pointer"
              onClick={toggleMinimize}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  {isMinimized ? (
                    <ArrowDown className="w-4 h-4 text-white transform rotate-180" />
                  ) : (
                    <MessageCircle className="w-4 h-4 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="font-semibold text-sm">StudyMarket</h2>
                  {!isMinimized && (
                    <p className="text-xs text-white/80">Assistant en ligne</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeWidget();
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 p-1"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Contenu dynamique - masqué quand minimisé */}
            {!isMinimized && (
              <>
                <div className="flex-1 overflow-hidden">
                  {viewMode === 'menu' && renderMenu()}
                  {viewMode === 'chat' && renderChat()}
                  {viewMode === 'contact' && renderContact()}
                </div>
                {renderBottomNav()}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default ChatbotWidget;