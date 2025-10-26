import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { MessageCircle, X, Send, Bot, Home, Mail, ArrowLeft, Check, ArrowRight, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { supabase, supabaseStatus } from '@/lib/supabase';
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

// Configuration
const MAX_MESSAGES = 100; // Limite pour éviter surcharge mémoire
const SAVE_DEBOUNCE_MS = 2000; // Attendre 2s avant de sauvegarder
const BOT_TYPING_DELAY = 800; // Délai de frappe du bot

// Utilitaire de debounce
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Logique métier externalisée
const generateBotResponse = (userInput: string, userName?: string): string => {
  const input = userInput.toLowerCase();
  
  const responses: Record<string, string> = {
    greeting: userName 
      ? `Salut ${userName} ! 😊 Comment ça va ? Je peux t'aider avec tes annonces ou répondre à tes questions sur StudyMarket.`
      : 'Salut ! 😊 Bienvenue sur StudyMarket ! Je peux t\'aider à naviguer sur la plateforme. Que cherches-tu ?',
    annonce: 'Pour publier une annonce, va sur "Créer une annonce" ! 📝 Tu peux vendre des livres, de l\'électronique, proposer des services ou même faire du troc. Besoin d\'aide pour une catégorie spécifique ?',
    acheter: 'Pour trouver des articles, utilise la barre de recherche ou parcours les catégories ! 🔍 Tu peux filtrer par prix et université. Que cherches-tu exactement ?',
    securite: 'StudyMarket est sécurisé ! 🛡️ Tous les étudiants sont vérifiés avec leur email universitaire. Utilise notre chat intégré et rencontrez-vous dans des lieux publics du campus.',
    prix: 'StudyMarket est 100% gratuit pour les étudiants ! 🎓 Pas de frais cachés pour publier ou contacter des vendeurs. On veut juste faciliter les échanges !',
    logement: '🏠 Section Logement ! Tu peux chercher des colocations, studios ou chambres près de ton campus. Utilise les filtres par prix et distance. Visite toujours avant de t\'engager !',
    job: '💼 Jobs & Stages ! Parfait pour ton budget étudiant. Tu trouveras des petits boulots, cours particuliers, stages... Postule directement via la plateforme !',
    probleme: 'Oh non ! 😅 Peux-tu me dire quel problème ? Essaie de rafraîchir la page. Si ça persiste, contacte notre support !',
    merci: 'De rien ! 😊 C\'est un plaisir d\'aider la communauté étudiante. N\'hésite pas si tu as d\'autres questions !',
  };

  // Détection par mots-clés
  if (/bonjour|salut|hello|hey/i.test(input)) return responses.greeting;
  if (/annonce|publier|vendre/i.test(input)) return responses.annonce;
  if (/acheter|trouver|rechercher/i.test(input)) return responses.acheter;
  if (/sécurité|sûr|confiance/i.test(input)) return responses.securite;
  if (/prix|coût|gratuit/i.test(input)) return responses.prix;
  if (/logement|chambre|colocation/i.test(input)) return responses.logement;
  if (/job|stage|travail/i.test(input)) return responses.job;
  if (/problème|bug|erreur/i.test(input)) return responses.probleme;
  if (/merci|thanks/i.test(input)) return responses.merci;
  
  return 'Hmm, je ne suis pas sûr de comprendre ! 🤔 Je peux t\'aider avec :\n\n• Créer/gérer des annonces\n• Questions de sécurité\n• Navigation sur le site\n• Infos sur les catégories\n\nPose-moi une question plus spécifique ! 😊';
};

// Hooks personnalisés pour la persistance
const useMessagePersistence = (currentUser: any) => {
  const saveToCache = useCallback((messages: Message[]) => {
    try {
      localStorage.setItem('chatbot_messages', JSON.stringify(messages));
    } catch (error) {
      console.warn('Erreur sauvegarde cache:', error);
    }
  }, []);

  const loadFromCache = useCallback((): Message[] => {
    try {
      const cached = localStorage.getItem('chatbot_messages');
      if (cached) {
        const parsedMessages = JSON.parse(cached);
        return parsedMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      }
    } catch (error) {
      console.warn('Erreur chargement cache:', error);
    }
    return [{
      id: '1',
      text: 'Salut ! 👋 Je suis l\'assistant StudyMarket. Comment puis-je t\'aider aujourd\'hui ?',
      sender: 'bot',
      timestamp: new Date()
    }];
  }, []);

  const saveToFirestore = useCallback(async (messages: Message[]) => {
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
  }, [currentUser]);

  // Debounced save
  const debouncedFirestoreSave = useMemo(
    () => debounce(saveToFirestore, SAVE_DEBOUNCE_MS),
    [saveToFirestore]
  );

  const loadFromFirestore = useCallback(async (): Promise<Message[]> => {
    if (!currentUser) return loadFromCache();
    
    try {
      const chatRef = doc(db, 'chatHistory', currentUser.uid);
      const chatSnap = await getDoc(chatRef);
      
      if (chatSnap.exists()) {
        const data = chatSnap.data();
        const firestoreMessages = data.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        
        saveToCache(firestoreMessages);
        return firestoreMessages;
      }
    } catch (error) {
      console.warn('Erreur chargement Firestore:', error);
    }
    
    return loadFromCache();
  }, [currentUser, loadFromCache, saveToCache]);

  return {
    saveToCache,
    loadFromCache,
    saveToFirestore: debouncedFirestoreSave,
    loadFromFirestore
  };
};

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
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const { saveToCache, loadFromFirestore, saveToFirestore } = useMessagePersistence(currentUser);

  // Scroll optimisé - seulement quand nécessaire
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current && viewMode === 'chat') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [viewMode]);

  // Charger les messages au démarrage
  useEffect(() => {
    let isMounted = true;
    
    const initMessages = async () => {
      const loadedMessages = await loadFromFirestore();
      if (isMounted) {
      setMessages(loadedMessages);
      }
    };
    
    initMessages();
    
    return () => { isMounted = false; };
  }, [loadFromFirestore]);

  // Pré-remplir formulaire contact
  useEffect(() => {
    if (currentUser && userProfile && viewMode === 'contact') {
      setContactForm(prev => ({
        ...prev,
        name: prev.name || userProfile.displayName || currentUser.displayName || '',
        email: prev.email || userProfile.email || currentUser.email || ''
      }));
    }
  }, [currentUser, userProfile, viewMode]);

  // Focus input quand on ouvre le chat
  useEffect(() => {
    if (isOpen && viewMode === 'chat' && inputRef.current && !isTyping) {
      inputRef.current.focus();
    }
  }, [isOpen, viewMode, isTyping]);

  // Scroll quand nouveaux messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Nom utilisateur mémorisé
  const userName = useMemo(() => {
    return userProfile?.displayName || currentUser?.displayName || 'Étudiant';
  }, [userProfile, currentUser]);

  // Dernier message pour preview
  const lastMessage = useMemo(() => {
    return messages.length > 0 ? messages[messages.length - 1] : null;
  }, [messages]);

  // Envoyer message optimisé
  const sendMessage = useCallback(async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    // Limiter le nombre de messages
    const newMessages = [...messages, userMessage].slice(-MAX_MESSAGES);
    setMessages(newMessages);
    setInputValue('');
    setIsTyping(true);

    // Sauvegarder
    saveToCache(newMessages);
    saveToFirestore(newMessages);

    // Simuler réponse bot avec délai
    typingTimeoutRef.current = setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateBotResponse(userMessage.text, currentUser ? userName : undefined),
        sender: 'bot',
        timestamp: new Date(),
      };

      const finalMessages = [...newMessages, botResponse].slice(-MAX_MESSAGES);
      setMessages(finalMessages);
      setIsTyping(false);

      saveToCache(finalMessages);
      saveToFirestore(finalMessages);
    }, BOT_TYPING_DELAY);
  }, [inputValue, isTyping, messages, saveToCache, saveToFirestore, currentUser, userName]);

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  const handleContactSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setContactLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('contact-email', {
        body: {
          name: contactForm.name,
          email: contactForm.email,
          subject: contactForm.subject,
          message: contactForm.message,
          user_id: currentUser?.uid || null,
        }
      });

      if (error) throw error;
      if (!data || !data.success) throw new Error(data?.error || 'Erreur lors de l\'envoi');

      setContactSuccess(true);
      toast.success('Message envoyé avec succès ! Nous vous répondrons rapidement.');
      
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
  }, [contactForm, currentUser]);

  const handleContactFormChange = useCallback((field: keyof ContactForm, value: string) => {
    setContactForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const openWidget = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);
    setViewMode('menu');
  }, []);

  const closeWidget = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(false);
    setViewMode('menu');
  }, []);

  const toggleMinimize = useCallback(() => {
    setIsMinimized(prev => !prev);
  }, []);

  const goToHome = useCallback(() => {
    setViewMode('menu');
    setIsMinimized(false);
  }, []);

  // Menu principal
  const renderMenu = () => (
    <div className="p-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4 rounded-lg">
          <span className="text-2xl font-bold text-white">SM</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Salut {userName} ! 👋
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Comment peut-on t'aider ?
        </p>
      </div>

      <div 
        className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-lg touch-manipulation active:scale-[0.99]"
        onClick={() => setViewMode('chat')}
      >
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Message récent
        </h3>
        {lastMessage ? (
          <div className="flex items-start space-x-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-xs">
                {lastMessage.sender === 'bot' ? 'SM' : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {lastMessage.text.length > 50 
                  ? `${lastMessage.text.substring(0, 50)}...`
                  : lastMessage.text
                }
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {lastMessage.sender === 'bot' ? 'Assistant' : 'Vous'} • {
                  new Date(lastMessage.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })
                }
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </div>
        ) : (
          <div className="flex items-center justify-between py-4">
            <p className="text-sm text-gray-500 italic">Aucun message récent</p>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </div>
        )}
      </div>
    </div>
  );

  // Navigation bottom
  const renderBottomNav = () => (
    <div className="flex items-center justify-around p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <Button
        variant="ghost"
        size="sm"
        onClick={goToHome}
        className={`w-12 h-12 p-0 ${viewMode === 'home' ? 'text-primary' : 'text-gray-500'} touch-manipulation active:scale-95`}
      >
        <Home className="w-6 h-6" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setViewMode('chat')}
        className={`w-12 h-12 p-0 ${viewMode === 'chat' ? 'text-primary' : 'text-gray-500'} touch-manipulation active:scale-95`}
      >
        <Bot className="w-6 h-6" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setViewMode('contact')}
        className={`w-12 h-12 p-0 ${viewMode === 'contact' ? 'text-primary' : 'text-gray-500'} touch-manipulation active:scale-95`}
      >
        <Mail className="w-6 h-6" />
      </Button>
    </div>
  );

  // Interface chat
  const renderChat = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-gray-200 dark:border-gray-800">
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

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message, index) => {
          const isUser = message.sender === 'user';
          const showAvatar = index === 0 || messages[index - 1].sender !== message.sender;
          
          return (
                <div
                  key={message.id}
              className={`flex items-end space-x-2 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
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
                          {userName.charAt(0)}
                        </AvatarFallback>
                      )
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-sm font-semibold">
                        SM
                      </AvatarFallback>
                    )}
                    </Avatar>
                ) : (
                  <div className="w-8 h-8" />
                )}
              </div>

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
                
                <p className={`text-xs text-gray-500 mt-1 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
          );
        })}
              
              {isTyping && (
          <div className="flex items-end space-x-2">
            <div className="flex-shrink-0">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-sm font-semibold">
                  SM
                      </AvatarFallback>
                    </Avatar>
            </div>

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

      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
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
            className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center touch-manipulation active:scale-95"
          >
            <Send className="w-5 h-5 text-white" />
          </Button>
        </div>
      </div>
    </div>
  );

  // Formulaire contact
  const renderContact = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-gray-200 dark:border-gray-800">
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
        {!supabaseStatus.isConfigured && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Mode hors ligne : votre message sera sauvegardé localement
              </p>
            </div>
          </div>
        )}
        
        {contactSuccess ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
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
          <form onSubmit={handleContactSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-left">
                Nom complet *
              </label>
              <Input
                type="text"
                value={contactForm.name}
                onChange={(e) => handleContactFormChange('name', e.target.value)}
                required
                placeholder="Ton nom complet"
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-left">
                Email *
              </label>
              <Input
                type="email"
                value={contactForm.email}
                onChange={(e) => handleContactFormChange('email', e.target.value)}
                required
                placeholder="ton.email@univ.fr"
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-left">
                Sujet *
              </label>
              <Input
                type="text"
                value={contactForm.subject}
                onChange={(e) => handleContactFormChange('subject', e.target.value)}
                required
                placeholder="Sujet de ton message"
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-left">
                Message *
              </label>
              <textarea
                value={contactForm.message}
                onChange={(e) => handleContactFormChange('message', e.target.value)}
                required
                rows={4}
                placeholder="Décris ta demande..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none"
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
      {!isOpen && (
        <button
          onClick={openWidget}
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-[35] w-14 h-14 rounded-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 touch-manipulation active:scale-95 flex items-center justify-center"
        >
          <MessageCircle className="w-7 h-7 text-white" />
        </button>
      )}

      {isOpen && (
        <Card className={`fixed z-[35] shadow-2xl border-0 bg-white dark:bg-gray-900 overflow-hidden transition-all duration-300 ease-in-out
            ${isMinimized 
              ? 'bottom-[5.75rem] left-2 right-2 w-[calc(100vw-1rem)] h-10' 
            : 'bottom-[5.75rem] left-2 right-2 w-[calc(100vw-1rem)] h-[calc(100vh-10rem)]'
            }
          md:${isMinimized ? 'bottom-24 md:right-6 md:left-auto md:w-80' : 'bottom-24 md:right-6 md:left-auto md:w-96 md:h-[550px] md:max-h-[calc(100vh-8rem)]'}
            md:max-w-none
          `}>
          <CardContent className="p-0 h-full flex flex-col">
            <div 
              className="flex items-center justify-between p-4 bg-gradient-to-r from-primary to-secondary text-white cursor-pointer touch-manipulation active:bg-opacity-90"
              onClick={toggleMinimize}
            >
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  {isMinimized ? (
                    <ArrowDown className="w-5 h-5 text-white transform rotate-180" />
                  ) : (
                    <MessageCircle className="w-5 h-5 text-white" />
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
                  className="text-white hover:bg-white/20 p-2 w-9 h-9 touch-manipulation active:scale-95"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

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