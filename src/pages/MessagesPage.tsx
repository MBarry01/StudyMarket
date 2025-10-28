// src/pages/MessagesPage.tsx
import React, {
  useState,
  useEffect,
  useRef,
  KeyboardEvent,
  ChangeEvent,
} from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Send, MoreVertical, Phone, Video, Info, Archive, Trash2, Flag, Shield,
  Image as ImageIcon, ArrowLeft, CheckCheck, Check, MessageCircle,
  ExternalLink, X, AlertTriangle, User, Star,
  Settings, Bell, Blocks
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Mail } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '../contexts/AuthContext';
import {
  useMessageStore,
  type Conversation,
  type Message,
} from '../stores/useMessageStore';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// -------------------------- Helpers --------------------------
// formatMessageTime helper
const formatMessageTime = (date: string | Date) => {
  const now = new Date();
  const msgDate = new Date(date);
  if (msgDate.toDateString() === now.toDateString()) {
    return msgDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  return msgDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

// ---------------------- ConversationList Component ----------------------
interface ConversationListProps {
  conversations: Conversation[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currentConversation: Conversation | null;
  setCurrentConversation: (conv: Conversation | null) => void;
  currentUser: any;
  onSelectConversation: (conv: Conversation) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  loading,
  searchQuery,
  setSearchQuery,
  currentConversation,
  currentUser,
  onSelectConversation,
}) => {
  const filteredConversations = conversations.filter((conv) => {
    const otherParticipant = conv.participants.find(p => p !== currentUser?.uid);
    const otherUser = otherParticipant ? conv.participantDetails[otherParticipant] : null;
    
    return (
      (otherUser?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (conv.listingTitle || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const getOtherUser = (conv: Conversation) => {
    const otherParticipant = conv.participants.find(p => p !== currentUser?.uid);
    return otherParticipant ? conv.participantDetails[otherParticipant] : null;
  };

  const totalUnread = conversations.reduce((acc, conv) => {
    return acc + (conv.unreadCount?.[currentUser?.uid] || 0);
  }, 0);

  return (
    <div className="w-full lg:w-80 xl:w-96 border-r border-border flex flex-col h-full">
      {/* Header simplifié */}
      <div className="p-3 border-b border-border bg-background">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">Messages</h1>
            {totalUnread > 0 && (
              <Badge className="bg-red-500 text-white">{totalUnread}</Badge>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10">
              <Settings className="w-4 h-4" />
            </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Archive className="w-4 h-4 mr-2" />
                Messages archivés
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Shield className="w-4 h-4 mr-2" />
                Confidentialité
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchQuery('')}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Liste des conversations */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-3 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/30">
                  <div className="w-12 h-12 bg-muted rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-muted rounded-full w-3/4" />
                    <div className="h-2 bg-muted rounded-full w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Aucune conversation</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? `Aucun résultat pour "${searchQuery}"` : 'Vos conversations apparaîtront ici'}
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredConversations.map((conversation) => {
              const otherUser = getOtherUser(conversation);
              const unreadCount = conversation.unreadCount?.[currentUser?.uid] || 0;
              const isSelected = currentConversation?.id === conversation.id;

              return (
                <div
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation)}
                  className={clsx('p-3 cursor-pointer border-b border-border transition-colors', {
                    'bg-muted/50': isSelected,
                    'hover:bg-muted/30': !isSelected,
                  })}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={otherUser?.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-sm">
                        {otherUser?.name?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <h3 className="font-medium text-sm truncate">
                          {otherUser?.name || 'Utilisateur'}
                        </h3>
                            {otherUser?.verified && (
                              <Shield className="w-3 h-3 text-blue-500 flex-shrink-0" />
                            )}
                          </div>
                          {conversation.lastMessage && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {conversation.lastMessage.text}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 ml-2">
                          {conversation.lastMessage && (
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDistanceToNow(conversation.lastMessage.sentAt, { addSuffix: false, locale: fr })}
                            </span>
                          )}
                          {unreadCount > 0 && (
                            <Badge className="bg-blue-500 text-white text-xs h-5 px-1.5">
                              {unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

// ---------------------- ChatArea Component ----------------------
interface ChatAreaProps {
  conversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  currentUser: any;
  onBack: () => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({
  conversation,
  messages,
  loading,
  currentUser,
  onBack,
}) => {
  const {
    sendMessage,
    markMessagesAsSeen,
    blockUser,
    reportUser,
    deleteConversation,
  } = useMessageStore();

  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleMessageChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setNewMessage(value);

    if (value.length > 0 && !isTyping) setIsTyping(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 1000);
  };

  const handleSendMessage = async () => {
    if (!conversation || !currentUser) return;

    const content = newMessage.trim();
    const hasText = content.length > 0;
    const hasImages = selectedFiles.length > 0;
    
    if (!hasText && !hasImages) return;

    // Envoyer d'abord les images si présentes
    if (hasImages) {
      await uploadAndSendImages(selectedFiles);
    }

    // Envoyer le texte si présent
    if (hasText) {
      setNewMessage('');
      await sendMessage(conversation.id, content, currentUser.uid, currentUser.displayName || 'Utilisateur', currentUser.photoURL);
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const canSend = () => {
    return newMessage.trim().length > 0 || selectedFiles.length > 0;
  };

  const handleImageSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files).filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} n'est pas une image`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} est trop volumineux (max 5MB)`);
        return false;
      }
      // Vérifier si le fichier n'est pas déjà sélectionné
      const alreadySelected = selectedFiles.some(f => f.name === file.name && f.size === file.size);
      if (alreadySelected) {
        toast.error(`${file.name} est déjà sélectionné`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      // Ajouter les nouveaux fichiers à la liste existante
      setSelectedFiles(prev => {
        const newTotal = prev.length + validFiles.length;
        toast.success(`${validFiles.length} image(s) ajoutée(s). Total: ${newTotal}`);
        return [...prev, ...validFiles];
      });
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  const uploadAndSendImages = async (files: File[]) => {
    if (!conversation || !currentUser) return;

    setUploadingImage(true);
    try {
      // Uploader toutes les images en parallèle
      const uploadPromises = files.map(async (file) => {
        const imageRef = ref(storage, `messages/${conversation.id}/${Date.now()}_${file.name}`);
        await uploadBytes(imageRef, file);
        return await getDownloadURL(imageRef);
      });

      const imageUrls = await Promise.all(uploadPromises);

      // Envoyer chaque image comme message séparé
      for (const imageUrl of imageUrls) {
        await sendMessage(conversation.id, imageUrl, currentUser.uid, currentUser.displayName || 'Utilisateur', currentUser.photoURL);
      }

      setSelectedFiles([]);
      toast.success(`${imageUrls.length} image(s) envoyée(s)`);
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Erreur lors de l\'envoi des images');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleBlock = async () => {
    if (!conversation || !currentUser) return;
    await blockUser(conversation.id, currentUser.uid);
    toast.success('Utilisateur bloqué');
  };

  const handleReport = async () => {
    if (!conversation || !currentUser || !reportReason.trim()) return;
    const otherParticipant = conversation.participants.find(p => p !== currentUser.uid);
    if (!otherParticipant) return;

    await reportUser(conversation.id, currentUser.uid, otherParticipant, reportReason, reportDescription);
    toast.success('Signalement envoyé');
    setShowReportDialog(false);
    setReportReason('');
    setReportDescription('');
  };

  const handleDelete = async () => {
    if (!conversation || !currentUser) return;
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette conversation ?')) return;
    await deleteConversation(conversation.id, currentUser.uid);
    toast.success('Conversation supprimée');
    onBack();
  };

  useEffect(() => {
    if (conversation && currentUser) markMessagesAsSeen(conversation.id, currentUser.uid);
  }, [conversation, currentUser, markMessagesAsSeen]);

  useEffect(scrollToBottom, [messages]);

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-secondary/5">
        <div className="text-center max-w-md px-8">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-3xl rotate-6 blur-xl opacity-30 animate-pulse" />
            <div className="relative w-full h-full bg-gradient-to-br from-primary to-secondary rounded-3xl flex items-center justify-center shadow-2xl">
              <MessageCircle className="w-12 h-12 text-white" />
          </div>
          </div>
          <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent text-center">
            Choisissez une conversation
          </h3>
          <p className="text-muted-foreground text-center">
            Sélectionnez une conversation dans la liste pour commencer à discuter
          </p>
        </div>
      </div>
    );
  }

  const otherParticipant = conversation.participants.find(p => p !== currentUser?.uid);
  const otherUser = otherParticipant ? conversation.participantDetails[otherParticipant] : null;

  return (
    <div className="flex-1 flex flex-col bg-background h-full">
      {/* Header simplified */}
      <div className="shrink-0 p-3 border-b border-border bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <Button variant="ghost" size="icon" onClick={onBack} className="lg:hidden h-10 w-10 rounded-xl hover:bg-primary/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <Avatar className="w-9 h-9">
              <AvatarImage src={otherUser?.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-sm">
                {otherUser?.name?.[0]?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <h2 className="font-semibold text-sm truncate">{otherUser?.name || 'Utilisateur'}</h2>
                {otherUser?.verified && (<Shield className="w-3.5 h-3.5 text-blue-500" />)}
              </div>
              <p className="text-xs text-muted-foreground truncate">{otherUser?.university}</p>
            </div>
          </div>

          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Appel"><Phone className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Vidéo"><Video className="w-4 h-4" /></Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to={`/listing/${conversation.listingId}`} className="flex items-center">
                    <ExternalLink className="w-4 h-4 mr-2" /> Voir l'annonce
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem><Star className="w-4 h-4 mr-2" /> Marquer comme favori</DropdownMenuItem>
                <DropdownMenuItem><Archive className="w-4 h-4 mr-2" /> Archiver</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowReportDialog(true)}><Flag className="w-4 h-4 mr-2" /> Signaler</DropdownMenuItem>
                <DropdownMenuItem onClick={handleBlock}><Blocks className="w-4 h-4 mr-2" /> Bloquer</DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-destructive"><Trash2 className="w-4 h-4 mr-2" /> Supprimer</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Listing info */}
        <div className="mt-2 p-2 border border-border rounded-lg bg-muted/30">
            <div className="flex items-center gap-2">
              {conversation.listingImage ? (
              <img src={conversation.listingImage} alt="" className="w-10 h-10 rounded object-cover" />
            ) : (
              <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-muted-foreground" />
                </div>
              )}

              <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm truncate">{conversation.listingTitle}</h3>
              <p className="text-xs text-muted-foreground">
                {conversation.listingPrice === 0 ? 'Gratuit' : `${conversation.listingPrice}€`}
                </p>
              </div>

            <Button variant="ghost" size="sm" asChild className="h-7 px-2">
              <Link to={`/listing/${conversation.listingId}`}><ExternalLink className="w-3.5 h-3.5" /></Link>
              </Button>
            </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 max-w-4xl mx-auto">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                      <div className="max-w-xs space-y-2">
                        <div className="h-16 bg-muted rounded-3xl" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-3xl rotate-6 blur-2xl opacity-20 animate-pulse" />
                  <div className="relative w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 rounded-3xl flex items-center justify-center">
                    <MessageCircle className="w-10 h-10 text-primary" />
                </div>
                </div>
                <h3 className="font-semibold text-lg mb-2">Commencez la conversation</h3>
                <p className="text-sm text-muted-foreground">Envoyez votre premier message</p>
              </div>
            ) : (
              <>
                {messages.map((message, idx) => {
                  // Déterminer si c'est un message de l'utilisateur actuel
                  const isMyMessage = message.senderId === currentUser?.uid;
                  const isLeft = !isMyMessage;

                  // Show time if last of group or gap > 5min
                  const showTime = idx === messages.length - 1 ||
                    messages[idx + 1].senderId !== message.senderId ||
                    (new Date(messages[idx + 1].sentAt).getTime() - new Date(message.sentAt).getTime()) > 300000;

                  const bubbleClass = isMyMessage ? 'bg-blue-400 text-white rounded-2xl rounded-br-sm' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-2xl rounded-bl-sm';

                  // Show read ticks for messages sent by current user (keeps UX expected)
                  const showTicks = message.senderId === currentUser?.uid;
                  
                  // Get sender name
                  const senderInfo = conversation.participantDetails[message.senderId];
                  const senderName = senderInfo?.name || 'Utilisateur';
                  
                  // Show sender name if first message from this sender or gap > 5min
                  const showSenderName = idx === 0 ||
                    messages[idx - 1].senderId !== message.senderId ||
                    (new Date(message.sentAt).getTime() - new Date(messages[idx - 1].sentAt).getTime()) > 300000;
                
                return (
                    <div key={message.id} className={`w-full flex ${isLeft ? 'justify-start' : 'justify-end'} px-2 mb-2`}>
                      <div className={`flex flex-col max-w-[75%] ${isLeft ? 'items-start' : 'items-end'}`}>
                        {showSenderName && (
                          <div className={`text-xs font-medium mb-1 px-1 ${isLeft ? 'text-left' : 'text-right'} text-muted-foreground`}>
                            {senderName}
                          </div>
                        )}
                        <div className={`px-3 py-2 ${bubbleClass}`}>
                          {message.type === 'image' ? (
                            <img 
                              src={message.text} 
                              alt="Message image" 
                              className="max-w-[250px] sm:max-w-[300px] md:max-w-[400px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => setViewingImage(message.text)}
                              onError={(e) => {
                                e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Image+non+disponible';
                              }}
                            />
                          ) : (
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.text}</p>
                          )}
                        </div>
                      
                        {showTime && (
                          <div className={`flex items-center gap-1 mt-0.5 text-xs text-gray-500 dark:text-gray-400 ${isLeft ? 'justify-start' : 'justify-end'}`}>
                            {formatMessageTime(message.sentAt)}
                            {showTicks && (message.seen ? (<CheckCheck className="w-3 h-3 text-blue-500" />) : (<Check className="w-3 h-3" />))}
                      </div>
                        )}
                    </div>
                  </div>
                );
                })}

                {/* Typing indicator */}
                {isTyping && (
                  <div className="w-full flex justify-start px-2 mb-2">
                    <div className="flex flex-col max-w-[75%] items-start">
                      <div className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-2xl rounded-bl-sm">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-gray-600 dark:bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1.4s' }} />
                          <div className="w-2 h-2 bg-gray-600 dark:bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '1.4s' }} />
                          <div className="w-2 h-2 bg-gray-600 dark:bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '1.4s' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input area */}
        <div className="shrink-0 p-4 pb-20 lg:pb-4 border-t border-border bg-background/80 backdrop-blur-sm">
          {uploadingImage && (
            <div className="mb-2 text-center text-sm text-muted-foreground">
              Upload de l'image en cours...
            </div>
          )}
          {selectedFiles.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2 max-w-2xl mx-auto">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded-lg text-xs">
                  <ImageIcon className="w-4 h-4 text-muted-foreground" />
                  <span className="truncate max-w-[150px] text-foreground">{file.name}</span>
                  <button
                    onClick={() => {
                      const newFiles = selectedFiles.filter((_, i) => i !== idx);
                      setSelectedFiles(newFiles);
                    }}
                    className="hover:text-red-500 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2 max-w-2xl mx-auto">
            {/* Container fusionné pour input + boutons */}
            <div className="flex-1 flex items-center gap-0 bg-muted/50 rounded-2xl border border-border focus-within:bg-background transition-all duration-200 overflow-hidden">
              {/* Zone de texte */}
              <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={newMessage}
              placeholder="Tapez votre message..."
              onChange={handleMessageChange}
              onKeyDown={handleKeyPress}
              rows={1}
                  className="w-full min-h-[44px] max-h-[120px] resize-none text-sm border-0 bg-transparent focus:ring-0 focus-visible:ring-0 pr-2"
                />
              </div>
              
              {/* Boutons intégrés */}
              <div className="flex items-center gap-0 p-0">
                {/* Input file caché */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelection}
                  className="hidden"
                />
                
                <button
                  onClick={handleImageButtonClick}
                  disabled={uploadingImage}
                  className="h-8 w-8 rounded-lg bg-transparent hover:bg-transparent p-0 opacity-60 hover:opacity-100 flex items-center justify-center flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
                >
                  <ImageIcon className="h-5 w-5" />
                </button>
            <button
              onClick={handleSendMessage}
                  disabled={!canSend()}
                  className="h-8 w-8 rounded-lg bg-transparent hover:bg-transparent p-0 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0 touch-manipulation"
                >
                  <Send className="h-5 w-5 text-blue-500 hover:text-blue-600" />
            </button>
          </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
              <Flag className="w-5 h-5 text-red-500" />
              </div>
              Signaler cet utilisateur
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="report-reason" className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                Motif du signalement
              </Label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Sélectionnez un motif" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spam">
                    <div className="flex items-center gap-2 py-1">
                      <Mail className="w-4 h-4 text-orange-500" />
                      <div>
                        <div className="font-medium">Spam</div>
                        <div className="text-xs text-muted-foreground">Messages non sollicités</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="harassment">
                    <div className="flex items-center gap-2 py-1">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <div>
                        <div className="font-medium">Harcèlement</div>
                        <div className="text-xs text-muted-foreground">Comportement abusif</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="inappropriate">
                    <div className="flex items-center gap-2 py-1">
                      <Flag className="w-4 h-4 text-purple-500" />
                      <div>
                        <div className="font-medium">Contenu inapproprié</div>
                        <div className="text-xs text-muted-foreground">Contenu offensant</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="scam">
                    <div className="flex items-center gap-2 py-1">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      <div>
                        <div className="font-medium">Arnaque</div>
                        <div className="text-xs text-muted-foreground">Tentative de fraude</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="other">
                    <div className="flex items-center gap-2 py-1">
                      <Info className="w-4 h-4 text-blue-500" />
                      <div>
                        <div className="font-medium">Autre</div>
                        <div className="text-xs text-muted-foreground">Autre motif</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="report-description" className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-4 h-4" />
                Description détaillée (optionnel)
              </Label>
              <Textarea
                id="report-description"
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Donnez plus de détails sur le problème..."
                rows={4}
                className="rounded-xl resize-none"
              />
            </div>
            
            <div className="flex items-start gap-2 p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl">
              <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                Votre signalement sera examiné par notre équipe. Les informations resteront confidentielles.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowReportDialog(false)} className="rounded-xl">Annuler</Button>
              <Button onClick={handleReport} disabled={!reportReason} className="rounded-xl bg-red-500 hover:bg-red-600">
                <Flag className="w-4 h-4 mr-2" /> Envoyer le signalement
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Viewer Modal */}
      {viewingImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
          onClick={() => setViewingImage(null)}
        >
          <div className="relative max-w-[95vw] max-h-[95vh] p-4">
            <button
              onClick={() => setViewingImage(null)}
              className="absolute -top-2 -right-2 z-10 w-8 h-8 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={viewingImage} 
              alt="Full size" 
              className="max-w-full max-h-[95vh] rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------- Main MessagesPage ----------------------
export const MessagesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    conversations,
    currentConversation,
    messages,
    loading,
    fetchConversations,
    fetchMessages,
    setCurrentConversation,
    cleanup,
  } = useMessageStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);

  useEffect(() => {
    if (currentUser) fetchConversations(currentUser.uid);
    return () => { cleanup(); };
  }, [currentUser, fetchConversations, cleanup]);

  useEffect(() => {
    if (currentConversation) fetchMessages(currentConversation.id);
  }, [currentConversation, fetchMessages]);

  const handleSelectConversation = (conversation: Conversation) => {
    setCurrentConversation(conversation);
    setShowMobileChat(true);
  };

  const handleBackToList = () => {
    setShowMobileChat(false);
    setCurrentConversation(null);
  };

  if (!currentUser) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-secondary/5">
        <div className="text-center max-w-md px-8">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-3xl rotate-6 blur-2xl opacity-30 animate-pulse" />
            <div className="relative w-full h-full bg-gradient-to-br from-primary to-secondary rounded-3xl flex items-center justify-center shadow-2xl">
              <MessageCircle className="w-12 h-12 text-white" />
        </div>
          </div>
          <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Accédez à vos messages
        </h1>
          <p className="text-muted-foreground mb-8">
            Connectez-vous pour voir et envoyer des messages à la communauté StudyMarket.
          </p>
          <Button asChild size="lg" className="rounded-2xl bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/30 transition-all duration-200 hover:scale-105">
            <Link to="/auth" className="flex items-center gap-2"><User className="w-5 h-5" /> Se connecter</Link>
        </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 top-16 md:top-20 flex overflow-hidden bg-background">
      {/* Mobile */}
      <div className="lg:hidden w-full h-full">
        {!showMobileChat ? (
          <ConversationList
            conversations={conversations}
            loading={loading}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            currentConversation={currentConversation}
            setCurrentConversation={setCurrentConversation}
            currentUser={currentUser}
            onSelectConversation={handleSelectConversation}
          />
        ) : (
          <ChatArea conversation={currentConversation} messages={messages} loading={loading} currentUser={currentUser} onBack={handleBackToList} />
        )}
      </div>

      {/* Desktop */}
      <div className="hidden lg:flex w-full h-full">
        <ConversationList
          conversations={conversations}
          loading={loading}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          currentConversation={currentConversation}
          setCurrentConversation={setCurrentConversation}
          currentUser={currentUser}
          onSelectConversation={handleSelectConversation}
        />
        
        <ChatArea conversation={currentConversation} messages={messages} loading={loading} currentUser={currentUser} onBack={handleBackToList} />
      </div>
    </div>
  );
};

export default MessagesPage;
