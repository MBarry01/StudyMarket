import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { MessageCircle, X, Send, Bot, Home, Mail, ArrowLeft, Check, ArrowRight, ArrowDown, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { supabase, supabaseStatus } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  suggestions?: string[];
  action?: {
    type: string;
    payload: any;
  };
  feedback?: 'positive' | 'negative';
}

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

type ViewMode = 'menu' | 'chat' | 'contact' | 'home';

// Configuration
const MAX_MESSAGES = 100;
const SAVE_DEBOUNCE_MS = 2000;
const BOT_TYPING_DELAY = 800;

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
const generateBotResponse = (userInput: string, userName?: string): {
  text: string;
  suggestions?: string[];
  action?: { type: string; payload: any };
} => {
  const input = userInput.toLowerCase().trim();
  
  if (/créer|publier|poster|vendre|nouvelle annonce/i.test(input)) {
    return {
      text: userName
        ? `Salut ${userName} ! 🎉 Je vais t'aider à créer ton annonce.\n\nPour commencer, dis-moi quel article tu veux vendre ou clique sur une catégorie.`
        : 'Super ! Je vais t\'aider à créer ton annonce. 🎉\n\nQuel article veux-tu vendre ?',
      suggestions: [
        '📚 Créer annonce Livres',
        '💻 Créer annonce Électronique',
        '👕 Créer annonce Vêtements',
        '📋 Voir formulaire création'
      ],
      action: { type: 'navigate', payload: '/create' }
    };
  }
  
  if (/chercher|trouver|recherche|acheter|besoin|voir/i.test(input)) {
    let category = '';
    if (/livre|bouquin|manuel/i.test(input)) category = 'books';
    if (/téléphone|iphone|samsung|smartphone/i.test(input)) category = 'electronics';
    if (/ordinateur|laptop|macbook/i.test(input)) category = 'electronics';
    if (/vêtement|pull|chemise|pantalon/i.test(input)) category = 'clothing';
    
    return {
      text: category
        ? `Parfait ! Je lance la recherche de ${category} pour toi ! 🔍`
        : 'Bien sûr ! Que cherches-tu exactement ? 🔍\n\nChoisis une catégorie ou dis-moi ce que tu recherches.',
      suggestions: [
        '📚 Chercher des livres',
        '💻 Chercher électronique',
        '👕 Chercher vêtements',
        '🎮 Chercher jeux'
      ],
      action: category ? { type: 'navigate', payload: `/listings?category=${category}` } : undefined
    };
  }
  
  if (/mes annonces|mes articles|mes ventes|voir mes annonces/i.test(input)) {
    return {
      text: 'Bien sûr ! Je vais t\'afficher tes annonces. 📋',
      suggestions: ['➕ Créer une annonce', '📊 Statistiques', '✏️ Modifier annonce'],
      action: { type: 'navigate', payload: '/profile#listings' }
    };
  }
  
  if (/message|conversation|discussion|chat/i.test(input)) {
    return {
      text: 'Voici tes conversations ! 💬',
      suggestions: ['💬 Voir conversations', '✉️ Nouveau message'],
      action: { type: 'navigate', payload: '/messages' }
    };
  }
  
  if (/favori|sauvegardé|j'aime|like/i.test(input)) {
    return {
      text: 'Tes favoris ! ⭐',
      suggestions: ['🔍 Continuer recherche', '➕ Créer annonce'],
      action: { type: 'navigate', payload: '/favorites' }
    };
  }
  
  if (/aide|help|comment|tutoriel|guide|que peux-tu/i.test(input)) {
    return {
      text: `Je peux t'aider avec : 📚

• Créer et gérer tes annonces 📝
• Rechercher des articles 🔍
• Gérer tes messages 💬
• Voir tes favoris ⭐
• Suivre tes commandes 📦

Que veux-tu faire ?`,
      suggestions: ['🔍 Rechercher', '➕ Créer annonce', '💬 Messages', '📋 Mes annonces']
    };
  }
  
  if (/bonjour|salut|hello|hey|coucou/i.test(input)) {
    return {
      text: userName
        ? `Salut ${userName} ! 👋 Ravi de te revoir ! Que puis-je faire pour toi aujourd'hui ?`
        : 'Salut ! 👋 Bienvenue sur StudyMarket ! Je suis ton assistant personnel. Comment puis-je t\'aider ?',
      suggestions: ['🔍 Rechercher', '➕ Créer annonce', '💬 Messages', '📋 Mes annonces']
    };
  }
  
  if (/merci|thanks|super|cool|génial|parfait/i.test(input)) {
    return {
      text: 'De rien ! 😊 Content d\'avoir pu t\'aider. Autre chose ?',
      suggestions: ['🔍 Rechercher', '➕ Créer annonce', '💬 Messages']
    };
  }
  
  if (/prix|coût|gratuit|tarif|commission|frais/i.test(input)) {
    return {
      text: 'StudyMarket est 100% gratuit ! 🎓\n\n✓ Pas de frais pour publier\n✓ Pas de commission sur ventes\n✓ Gratuit pour tous les étudiants\n\nOn veut juste faciliter les échanges ! 💙',
      suggestions: ['➕ Créer annonce', '🔍 Rechercher', '❓ Questions sécurité']
    };
  }
  
  if (/sécurité|sûr|fiable|confiance|protégé|safe/i.test(input)) {
    return {
      text: 'StudyMarket est sécurisé ! 🛡️\n\n✓ Étudiants vérifiés par email universitaire\n✓ Badge de confiance sur les profils\n✓ Rencontres dans lieux publics recommandées\n✓ Système de signalement rapide\n\nRestons prudents et solidaires ! 💪',
      suggestions: ['🛡️ En savoir plus', '➕ Créer annonce', '❓ Questions']
    };
  }
  
  if (/logement|chambre|colocation|studio|appartement|location/i.test(input)) {
    return {
      text: '🏠 Section Logement ! Tu peux chercher des colocations, studios ou chambres près de ton campus. Visite toujours avant de t\'engager !',
      suggestions: ['🔍 Chercher logement', '➕ Publier logement', '📋 Voir annonces'],
      action: { type: 'navigate', payload: '/housing' }
    };
  }
  
  if (/job|stage|travail|emploi|mission|emploi/i.test(input)) {
    return {
      text: '💼 Jobs & Stages ! Parfait pour ton budget étudiant. Stages, petits boulots, missions... Postule directement !',
      suggestions: ['🔍 Chercher job', '➕ Publier offre', '📋 Voir offres'],
      action: { type: 'navigate', payload: '/jobs' }
    };
  }
  
  return {
    text: 'Hmm, je ne suis pas sûr de bien comprendre ! 🤔\n\nJe peux t\'aider avec :\n• Créer/gérer des annonces\n• Rechercher des articles\n• Voir tes messages\n• Questions de sécurité\n\nRéessaie avec une question plus spécifique ! 😊',
    suggestions: ['🔍 Rechercher', '➕ Créer annonce', '💬 Messages', '❓ Aide']
  };
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
      
      const cleanedMessages = messages.map(msg => {
        const cleanMsg: any = {
          id: msg.id,
          text: msg.text,
          sender: msg.sender,
          timestamp: msg.timestamp.toISOString()
        };
        
        if (msg.suggestions !== undefined && msg.suggestions !== null) {
          cleanMsg.suggestions = msg.suggestions;
        }
        
        if (msg.action !== undefined && msg.action !== null) {
          cleanMsg.action = msg.action;
        }
        
        return cleanMsg;
      });
      
      await setDoc(chatRef, {
        messages: cleanedMessages,
        lastUpdated: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.warn('Erreur sauvegarde Firestore:', error);
    }
  }, [currentUser]);

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
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  const isMessagesPage = location.pathname.includes('/messages');
  const shouldHideOnMobile = isMessagesPage;
  const [isClosing, setIsClosing] = useState(false);
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
  const touchStartY = useRef<number>(0);
  const [swipeProgress, setSwipeProgress] = useState(0);

  const { saveToCache, loadFromFirestore, saveToFirestore } = useMessagePersistence(currentUser);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current && viewMode === 'chat') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [viewMode]);

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

  useEffect(() => {
    if (currentUser && userProfile && viewMode === 'contact') {
      setContactForm(prev => ({
        ...prev,
        name: prev.name || userProfile.displayName || currentUser.displayName || '',
        email: prev.email || userProfile.email || currentUser.email || ''
      }));
    }
  }, [currentUser, userProfile, viewMode]);

  useEffect(() => {
    if (isOpen && viewMode === 'chat' && inputRef.current && !isTyping) {
      inputRef.current.focus();
    }
  }, [isOpen, viewMode, isTyping]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const userName = useMemo(() => {
    return userProfile?.displayName || currentUser?.displayName || 'Étudiant';
  }, [userProfile, currentUser]);

  const lastMessage = useMemo(() => {
    return messages.length > 0 ? messages[messages.length - 1] : null;
  }, [messages]);

  const handleBotAction = useCallback((action: { type: string; payload: any }) => {
    if (action.type === 'navigate') {
      setTimeout(() => {
        window.location.href = action.payload;
      }, 500);
    }
  }, []);

  const sendMessage = useCallback(async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage].slice(-MAX_MESSAGES);
    setMessages(newMessages);
    setInputValue('');
    setIsTyping(true);

    saveToCache(newMessages);
    saveToFirestore(newMessages);

    typingTimeoutRef.current = setTimeout(() => {
      const botResponseData = generateBotResponse(userMessage.text, currentUser ? userName : undefined);
      
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponseData.text,
        suggestions: botResponseData.suggestions,
        action: botResponseData.action,
        sender: 'bot',
        timestamp: new Date(),
      };

      const finalMessages = [...newMessages, botResponse].slice(-MAX_MESSAGES);
      setMessages(finalMessages);
      setIsTyping(false);

      saveToCache(finalMessages);
      saveToFirestore(finalMessages);
      
      if (botResponseData.action) {
        handleBotAction(botResponseData.action);
      }
    }, BOT_TYPING_DELAY);
  }, [inputValue, isTyping, messages, saveToCache, saveToFirestore, currentUser, userName, handleBotAction]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleFeedback = useCallback((messageId: string, feedback: 'positive' | 'negative') => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, feedback }
        : msg
    ));
    
    console.log(`Feedback ${feedback} pour message ${messageId}`);
    
    toast.success(feedback === 'positive' ? 'Merci pour ton retour ! 😊' : 'Merci, je vais m\'améliorer ! 💙');
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
    setIsClosing(false);
    setIsOpen(true);
    setIsMinimized(false);
    setViewMode('menu');
  }, []);

  const closeWidget = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      setIsMinimized(false);
      setViewMode('menu');
    }, 300);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    setSwipeProgress(0);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isMinimized && touchStartY.current > 0) {
      const currentY = e.touches[0].clientY;
      const diffY = currentY - touchStartY.current;
      
      if (diffY > 0) {
        if (diffY > 30) {
          e.preventDefault();
        }
        
        const progress = Math.max(0, Math.min(1, diffY / 300));
        setSwipeProgress(progress);
      }
    }
  }, [isMinimized]);

  const handleTouchEnd = useCallback(() => {
    if (swipeProgress > 0.5) {
      setIsOpen(false);
      setIsClosing(false);
      setIsMinimized(false);
      setViewMode('menu');
      setSwipeProgress(0);
    } else {
      setSwipeProgress(0);
      touchStartY.current = 0;
    }
  }, [swipeProgress]);

  const toggleMinimize = useCallback(() => {
    setIsMinimized(prev => !prev);
  }, []);

  const goToHome = useCallback(() => {
    setViewMode('menu');
    setIsMinimized(false);
  }, []);

  const renderMenu = () => (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="text-center mb-4 md:mb-6 animate-fade-in">
        <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4 rounded-lg transition-transform duration-300 hover:scale-105">
          <span className="text-2xl font-bold text-white">SM</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 text-center">
          Salut {userName} ! 👋
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-center">
          Comment peut-on t'aider ?
        </p>
      </div>

      <div 
        className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 rounded-lg touch-manipulation active:scale-[0.99]"
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

  const renderBottomNav = () => (
    <div className="flex items-center justify-around p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <Button
        variant="ghost"
        size="sm"
        onClick={goToHome}
        className={`w-12 h-12 p-0 transition-all duration-200 ${viewMode === 'home' ? 'text-primary' : 'text-gray-500'} touch-manipulation active:scale-95 hover:scale-105`}
      >
        <Home className="w-6 h-6" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setViewMode('chat')}
        className={`w-12 h-12 p-0 transition-all duration-200 ${viewMode === 'chat' ? 'text-primary' : 'text-gray-500'} touch-manipulation active:scale-95 hover:scale-105`}
      >
        <Bot className="w-6 h-6" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setViewMode('contact')}
        className={`w-12 h-12 p-0 transition-all duration-200 ${viewMode === 'contact' ? 'text-primary' : 'text-gray-500'} touch-manipulation active:scale-95 hover:scale-105`}
      >
        <Mail className="w-6 h-6" />
      </Button>
    </div>
  );

  const renderChat = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('menu')}
            className="p-1.5 w-9 h-9 touch-manipulation active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Avatar className="w-7 h-7">
            <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-xs">
              SM
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-sm">Assistant</h3>
            <p className="text-xs text-green-600">En ligne</p>
          </div>
        </div>
        <Badge className="bg-green-100 text-green-800 text-xs px-2 py-0.5">Actif</Badge>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain p-3 space-y-2 min-h-0" style={{ WebkitOverflowScrolling: 'touch' }}>
        {messages.map((message, index) => {
          const isUser = message.sender === 'user';
          const showAvatar = index === 0 || messages[index - 1].sender !== message.sender;
          
          return (
            <div
              key={message.id}
              className={`flex items-end space-x-2 transition-all duration-200 hover:opacity-90 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
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
                
                {!isUser && message.suggestions && message.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 px-1">
                    {message.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          const cleanSuggestion = suggestion.replace(/[^\w\s]/g, '').trim();
                          setInputValue(cleanSuggestion);
                          setTimeout(() => sendMessage(), 100);
                        }}
                        className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-full text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:border-blue-300 dark:hover:border-blue-700 transition-all hover:scale-105 active:scale-95"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
                
                {!isUser && (
                  <div className="flex items-center gap-0 mt-2 px-1 -space-x-2">
                    <button
                      onClick={() => handleFeedback(message.id, 'positive')}
                      className="nav-icon bg-transparent border-0 p-1.5 m-0 shadow-none cursor-pointer rounded-full focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                      title="Utile"
                    >
                      <ThumbsUp 
                        className={`w-4 h-4 transition-colors duration-200 ${
                          message.feedback === 'positive'
                            ? 'fill-black text-black dark:fill-white dark:text-white'
                            : 'fill-none stroke-gray-400 dark:stroke-gray-500 hover:stroke-gray-700 dark:hover:stroke-gray-300'
                        }`}
                        strokeWidth={2}
                      />
                    </button>
                    <button
                      onClick={() => handleFeedback(message.id, 'negative')}
                      className="nav-icon bg-transparent border-0 p-1.5 m-0 shadow-none cursor-pointer rounded-full focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                      title="Pas utile"
                    >
                      <ThumbsDown 
                        className={`w-4 h-4 transition-colors duration-200 ${
                          message.feedback === 'negative'
                            ? 'fill-black text-black dark:fill-white dark:text-white'
                            : 'fill-none stroke-gray-400 dark:stroke-gray-500 hover:stroke-gray-700 dark:hover:stroke-gray-300'
                        }`}
                        strokeWidth={2}
                      />
                    </button>
                  </div>
                )}
                
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

      <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex-shrink-0">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Tape ton message..."
            className="flex-1 h-11 px-3 rounded-lg border-none focus:ring-0 focus:ring-offset-0 bg-gray-50 dark:bg-gray-700 text-base"
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

  const renderContact = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setViewMode('menu')}
          className="p-2 w-10 h-10 touch-manipulation active:scale-95"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <Mail className="w-6 h-6 text-primary" />
        <h3 className="font-semibold">Nous contacter</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-6 min-h-0">
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none text-base"
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
          className={`fixed bottom-20 right-4 z-[35] w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 touch-manipulation active:scale-95 flex items-center justify-center md:bottom-6 md:right-6 ${shouldHideOnMobile ? 'hidden md:flex' : ''}`}
        >
          <MessageCircle className="w-7 h-7 md:w-8 md:h-8 text-white" />
        </button>
      )}

      {isOpen && (
        <>
          <div 
            className={`fixed inset-0 z-[40] bg-black/50 backdrop-blur-sm transition-all duration-300 md:duration-200 ${isClosing ? 'animate-[fadeOut_0.3s_ease-out]' : 'animate-[fadeIn_0.3s_ease-out]'}`}
            style={{
              opacity: isClosing ? undefined : (0.5 * (1 - swipeProgress))
            }}
            onClick={closeWidget}
          />
          
          <Card 
            className={`fixed z-[50] shadow-2xl border-0 bg-white dark:bg-gray-900 overflow-hidden
            ${isClosing && !isMinimized ? 'animate-[slideDown_0.4s_ease-out]' : !isClosing && !isMinimized ? 'animate-[slideUp_0.4s_ease-out]' : ''}
            ${isMinimized 
              ? 'bottom-[5.75rem] left-3 right-3 w-[calc(100vw-1.5rem)] h-14 md:bottom-6 md:right-6 md:left-auto md:w-[380px]' 
              : 'inset-0 md:bottom-6 md:right-6 md:left-auto md:w-[480px] md:h-[680px] md:rounded-2xl md:top-auto'
            }`}
            style={{
              transform: swipeProgress > 0 ? `translateY(${swipeProgress * 100}%)` : undefined,
              opacity: isMinimized && swipeProgress === 0 ? undefined : (1 - swipeProgress * 0.5),
              transition: swipeProgress === 0 ? 'transform 0.3s ease-out, opacity 0.3s ease-out' : 'none'
            }}
          >
            <CardContent className="p-0 h-full flex flex-col">
              {!isMinimized && (
                <div className="flex justify-center pt-2 pb-1 md:hidden">
                  <div className="w-10 h-1 bg-gray-400 dark:bg-gray-600 rounded-full animate-pulse"></div>
                </div>
              )}
              
              <div 
                className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary to-secondary text-white touch-manipulation md:hidden"
                style={{ touchAction: 'none' }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div 
                  className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer"
                  onClick={toggleMinimize}
                >
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    {isMinimized ? (
                      <ArrowDown className="w-6 h-6 text-white transform rotate-180" />
                    ) : (
                      <MessageCircle className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-semibold text-base">StudyMarket</h2>
                    {!isMinimized && (
                      <p className="text-xs text-white/80">Assistant en ligne</p>
                    )}
                  </div>
                </div>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeWidget();
                  }}
                  variant="ghost"
                  className="text-white hover:bg-white/20 p-0 w-10 h-10 flex-shrink-0 touch-manipulation active:scale-95 flex items-center justify-center"
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>

              {!isMinimized && (
                <>
                  <div className="hidden md:flex items-center justify-between px-6 py-4 bg-gradient-to-r from-primary to-secondary border-b border-white/20 animate-fade-in">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                        <MessageCircle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-base text-white">StudyMarket</h2>
                        <p className="text-xs text-white/80">Assistant en ligne</p>
                      </div>
                    </div>
                    <Button
                      onClick={closeWidget}
                      variant="ghost"
                      className="text-white hover:bg-white/20 p-0 w-10 h-10 flex-shrink-0 transition-all duration-200 hover:scale-105"
                    >
                      <X className="w-6 h-6" />
                    </Button>
                  </div>

                  <div className="flex-1 overflow-hidden min-h-0 animate-fade-in">
                    {viewMode === 'menu' && renderMenu()}
                    {viewMode === 'chat' && renderChat()}
                    {viewMode === 'contact' && renderContact()}
                  </div>
                  {renderBottomNav()}
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
};

export default ChatbotWidget;