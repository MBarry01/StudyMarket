import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  KeyboardEvent,
  ChangeEvent,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Send, MoreVertical, Phone, Video, Info, Archive, Trash2, Flag, Shield, Image as ImageIcon, ArrowLeft, CheckCheck, Check, MessageCircle, Filter, SortDesc, ExternalLink, Blocks as Block, AlertTriangle, User, Clock, MapPin, Star, Heart, Bookmark, Settings, Bell, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
  DialogTrigger,
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

// -----------------------------------------------------------------------------
// ConversationList Component - Optimisé pour prendre moins d'espace
// -----------------------------------------------------------------------------
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
      otherUser?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.listingTitle.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const formatPrice = (price: number) => {
    if (price === 0) return 'Gratuit';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const getOtherUser = (conv: Conversation) => {
    const otherParticipant = conv.participants.find(p => p !== currentUser?.uid);
    return otherParticipant ? conv.participantDetails[otherParticipant] : null;
  };

  return (
    <div className="w-full lg:w-72 xl:w-80 border-r border-border bg-muted/20 flex flex-col h-full">
      {/* Header - Plus compact */}
      <div className="p-3 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold">Messages</h1>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Filtrer">
              <Filter className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Trier">
              <SortDesc className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Paramètres">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Search - Plus compact */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {/* Conversations List - Optimisé */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-2 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center gap-2 p-2">
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-muted rounded w-3/4" />
                    <div className="h-2 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-6 text-center">
            <MessageCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium mb-1 text-sm">Aucune conversation</h3>
            <p className="text-xs text-muted-foreground">
              {searchQuery ? (
                <>
                  <Search className="w-3 h-3 inline mr-1" />
                  Aucun résultat pour "{searchQuery}"
                </>
              ) : (
                <>
                  <Mail className="w-3 h-3 inline mr-1" />
                  Vos conversations apparaîtront ici
                </>
              )}
            </p>
          </div>
        ) : (
          <div className="p-1">
            {filteredConversations.map((conversation) => {
              const otherUser = getOtherUser(conversation);
              const unreadCount = conversation.unreadCount[currentUser?.uid] || 0;
              const isSelected = currentConversation?.id === conversation.id;

              return (
                <div
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation)}
                  className={`p-2 rounded-md cursor-pointer transition-colors hover:bg-accent/50 ${
                    isSelected ? 'bg-accent' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {/* Avatar - Plus petit */}
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={otherUser?.avatar} />
                        <AvatarFallback className="text-xs bg-gradient-to-br from-primary to-secondary text-white">
                          {otherUser?.name?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
                        </AvatarFallback>
                      </Avatar>
                      {otherUser?.verified && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                          <Shield className="w-1.5 h-1.5 text-white" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* User info - Plus compact */}
                      <div className="flex items-center justify-between mb-0.5">
                        <h3 className="font-medium text-xs truncate flex items-center gap-1">
                          <User className="w-3 h-3 text-muted-foreground" />
                          {otherUser?.name || 'Utilisateur'}
                        </h3>
                        <div className="flex items-center gap-1">
                          {conversation.lastMessage && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDistanceToNow(conversation.lastMessage.sentAt, {
                                addSuffix: true,
                                locale: fr,
                              })}
                            </span>
                          )}
                          {unreadCount > 0 && (
                            <Badge 
                              className="bg-red-500 text-white text-xs min-w-[16px] h-4 flex items-center justify-center px-1"
                            >
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Listing info - Plus compact */}
                      <div className="flex items-center gap-1 mb-0.5">
                        {conversation.listingImage ? (
                          <img
                            src={conversation.listingImage}
                            alt=""
                            className="w-3 h-3 rounded object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-3 h-3 text-muted-foreground" />
                        )}
                        <span className="text-xs text-muted-foreground truncate flex-1">
                          {conversation.listingTitle}
                        </span>
                        <span className="text-xs font-medium text-primary flex items-center gap-1">
                          {conversation.listingPrice === 0 ? (
                            <Heart className="w-3 h-3 text-green-600" />
                          ) : (
                            <span>€</span>
                          )}
                          {formatPrice(conversation.listingPrice)}
                        </span>
                      </div>

                      {/* Last message - Plus compact */}
                      {conversation.lastMessage && (
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                          {conversation.lastMessage.senderId === currentUser?.uid ? (
                            <Send className="w-3 h-3" />
                          ) : (
                            <MessageCircle className="w-3 h-3" />
                          )}
                          {conversation.lastMessage.senderId === currentUser?.uid && 'Vous: '}
                          {conversation.lastMessage.text}
                        </p>
                      )}
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

// -----------------------------------------------------------------------------
// ChatArea Component - Optimisé pour 95% de l'espace
// -----------------------------------------------------------------------------
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
  const [textareaHeight, setTextareaHeight] = useState(40);
  const [isTyping, setIsTyping] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const adjustTextareaHeight = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const h = Math.max(40, Math.min(ta.scrollHeight, 120));
    setTextareaHeight(h);
  }, []);

  const handleMessageChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setNewMessage(value);
      setIsTyping(Boolean(value.trim()));
      setTimeout(adjustTextareaHeight, 0);
    },
    [adjustTextareaHeight],
  );

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversation || !currentUser) return;

    const content = newMessage.trim();
    setNewMessage('');
    setIsTyping(false);
    setTextareaHeight(40);

    await sendMessage(
      conversation.id,
      content,
      currentUser.uid,
      currentUser.displayName || 'Utilisateur',
      currentUser.photoURL,
    );
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleBlock = async () => {
    if (!conversation || !currentUser) return;
    await blockUser(conversation.id, currentUser.uid);
  };

  const handleReport = async () => {
    if (!conversation || !currentUser || !reportReason.trim()) return;
    
    const otherParticipant = conversation.participants.find(p => p !== currentUser.uid);
    if (!otherParticipant) return;

    await reportUser(
      conversation.id,
      currentUser.uid,
      otherParticipant,
      reportReason,
      reportDescription
    );
    
    setShowReportDialog(false);
    setReportReason('');
    setReportDescription('');
  };

  const handleDelete = async () => {
    if (!conversation || !currentUser) return;
    await deleteConversation(conversation.id, currentUser.uid);
    onBack();
  };

  useEffect(() => {
    if (conversation && currentUser) {
      markMessagesAsSeen(conversation.id, currentUser.uid);
    }
  }, [conversation, currentUser, markMessagesAsSeen]);

  useEffect(scrollToBottom, [messages]);

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-medium mb-2">Sélectionnez une conversation</h3>
          <p className="text-muted-foreground flex items-center justify-center gap-2">
            <Search className="w-4 h-4" />
            Choisissez une conversation pour commencer à discuter
          </p>
        </div>
      </div>
    );
  }

  const otherParticipant = conversation.participants.find(p => p !== currentUser?.uid);
  const otherUser = otherParticipant ? conversation.participantDetails[otherParticipant] : null;

  const formatMessageTime = (date: Date) => {
    const now = new Date();
    const msgDate = new Date(date);
    
    if (msgDate.toDateString() === now.toDateString()) {
      return msgDate.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    
    const diffDays = Math.floor((now.getTime() - msgDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      return msgDate.toLocaleDateString('fr-FR', {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    
    return msgDate.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMessageStatus = (message: Message) => {
    if (message.senderId !== currentUser?.uid) return null;
    
    return message.seen ? (
      <CheckCheck className="w-3 h-3 text-blue-500" />
    ) : (
      <Check className="w-3 h-3 text-muted-foreground" />
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-background h-full">
      {/* Header - Plus compact */}
      <div className="p-3 border-b border-border bg-background/95 backdrop-blur shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="lg:hidden h-8 w-8"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            
            <Avatar className="w-8 h-8">
              <AvatarImage src={otherUser?.avatar} />
              <AvatarFallback className="text-xs bg-gradient-to-br from-primary to-secondary text-white">
                {otherUser?.name?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold truncate text-sm flex items-center gap-1">
                  <User className="w-3 h-3 text-muted-foreground" />
                  {otherUser?.name || 'Utilisateur'}
                </h2>
                {otherUser?.verified && (
                  <Shield className="w-3 h-3 text-green-600" />
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {otherUser?.university}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Appeler">
              <Phone className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Vidéo">
              <Video className="w-4 h-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to={`/listing/${conversation.listingId}`} className="flex items-center">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Voir l'annonce
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Star className="w-4 h-4 mr-2" />
                  Marquer comme favori
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Archive className="w-4 h-4 mr-2" />
                  Archiver
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowReportDialog(true)}>
                  <Flag className="w-4 h-4 mr-2" />
                  Signaler
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleBlock}>
                  <Block className="w-4 h-4 mr-2" />
                  Bloquer
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Listing info - Plus compact */}
        <Card className="mt-2">
          <CardContent className="p-2">
            <div className="flex items-center gap-2">
              {conversation.listingImage ? (
                <img
                  src={conversation.listingImage}
                  alt=""
                  className="w-8 h-8 rounded object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                  <ImageIcon className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-xs truncate flex items-center gap-1">
                  <Bookmark className="w-3 h-3 text-muted-foreground" />
                  {conversation.listingTitle}
                </h3>
                <p className="text-sm font-semibold text-primary flex items-center gap-1">
                  {conversation.listingPrice === 0 ? (
                    <>
                      <Heart className="w-3 h-3 text-green-600" />
                      Gratuit
                    </>
                  ) : (
                    <>
                      <span className="text-xs">€</span>
                      {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'EUR',
                      }).format(conversation.listingPrice)}
                    </>
                  )}
                </p>
              </div>
              <Button variant="outline" size="sm" asChild className="h-7 text-xs px-2">
                <Link to={`/listing/${conversation.listingId}`} className="flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" />
                  Voir
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Messages - Zone principale optimisée pour 95% */}
      <div className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1 p-3">
          <div className="space-y-3">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                      <div className="max-w-xs">
                        <div className="h-3 bg-muted rounded w-3/4 mb-1" />
                        <div className="h-8 bg-muted rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-medium mb-2">Aucun message</h3>
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" />
                  Commencez la conversation en envoyant un message
                </p>
              </div>
            ) : (
              messages.map((message) => {
                const isOwn = message.senderId === currentUser?.uid;
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[75%] lg:max-w-[60%] ${isOwn ? 'order-2' : 'order-1'}`}>
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          isOwn
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : 'bg-muted text-foreground rounded-bl-md'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>
                      </div>
                      
                      <div className={`flex items-center gap-1 mt-1 text-xs text-muted-foreground ${
                        isOwn ? 'justify-end' : 'justify-start'
                      }`}>
                        <Clock className="w-3 h-3" />
                        <span>{formatMessageTime(message.sentAt)}</span>
                        {getMessageStatus(message)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input - Optimisé et compact */}
        <div className="p-3 border-t border-border bg-background/95 backdrop-blur shrink-0">
          <div className="flex items-end gap-2 bg-muted/30 rounded-2xl border relative">
            <Textarea
              ref={textareaRef}
              value={newMessage}
              placeholder="Tapez votre message..."
              onChange={handleMessageChange}
              onKeyDown={handleKeyPress}
              rows={1}
              style={{
                height: textareaHeight,
                transition: 'height 0.15s ease-out',
                overflow: 'hidden',
              }}
              className="min-h-[40px] max-h-[120px] resize-none border-0 bg-transparent focus:ring-0 focus:outline-none placeholder:text-muted-foreground/60 text-sm leading-relaxed py-2.5 px-4 pr-12 rounded-2xl"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              size="sm"
              className="absolute right-1.5 bottom-1.5 h-7 w-7 p-0 rounded-full bg-gradient-to-r from-primary to-secondary"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
          
          {isTyping && (
            <div className="text-xs text-muted-foreground mt-1 px-2 flex items-center gap-1">
              <MessageCircle className="w-3 h-3 animate-pulse" />
              En cours de frappe...
            </div>
          )}
        </div>
      </div>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="w-5 h-5 text-red-500" />
              Signaler cet utilisateur
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="report-reason" className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Motif du signalement
              </Label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un motif" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spam">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Spam
                    </div>
                  </SelectItem>
                  <SelectItem value="harassment">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Harcèlement
                    </div>
                  </SelectItem>
                  <SelectItem value="inappropriate">
                    <div className="flex items-center gap-2">
                      <Flag className="w-4 h-4" />
                      Contenu inapproprié
                    </div>
                  </SelectItem>
                  <SelectItem value="scam">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Arnaque
                    </div>
                  </SelectItem>
                  <SelectItem value="other">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      Autre
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="report-description" className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Description (optionnel)
              </Label>
              <Textarea
                id="report-description"
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Décrivez le problème..."
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowReportDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleReport} disabled={!reportReason} className="bg-red-500 hover:bg-red-600">
                <Flag className="w-4 h-4 mr-2" />
                Signaler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Main MessagesPage Component
// -----------------------------------------------------------------------------
export const MessagesPage: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
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
    if (currentUser) {
      fetchConversations(currentUser.uid);
    }
    
    return () => {
      cleanup();
    };
  }, [currentUser, fetchConversations, cleanup]);

  useEffect(() => {
    if (currentConversation) {
      fetchMessages(currentConversation.id);
    }
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
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageCircle className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold mb-2">
          Connectez-vous pour accéder à vos messages
        </h1>
        <p className="text-muted-foreground mb-6 flex items-center justify-center gap-2">
          <User className="w-4 h-4" />
          Vous devez être connecté pour voir et envoyer des messages.
        </p>
        <Button asChild className="bg-gradient-to-r from-primary to-secondary">
          <Link to="/auth" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Se connecter
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex overflow-hidden">
      {/* Mobile Layout */}
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
          <ChatArea
            conversation={currentConversation}
            messages={messages}
            loading={loading}
            currentUser={currentUser}
            onBack={handleBackToList}
          />
        )}
      </div>

      {/* Desktop Layout - Optimisé pour 95% de chat */}
      <div className="hidden lg:flex w-full h-full">
        {/* Liste des conversations - Plus petite */}
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
        
        {/* Zone de chat - 95% de l'espace restant */}
        <ChatArea
          conversation={currentConversation}
          messages={messages}
          loading={loading}
          currentUser={currentUser}
          onBack={handleBackToList}
        />
      </div>
    </div>
  );
};

export default MessagesPage;