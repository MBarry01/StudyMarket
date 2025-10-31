/**
 * Preview component pour afficher des messages inline dans le chatbot
 */

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Check, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ConversationPreview {
  id: string;
  participantName: string;
  participantAvatar?: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount?: number;
  listingTitle?: string;
}

interface MessagePreviewProps {
  conversations: ConversationPreview[];
  onConversationClick?: (conversationId: string) => void;
}

export const MessagePreview: React.FC<MessagePreviewProps> = ({ 
  conversations, 
  onConversationClick 
}) => {
  if (!conversations || conversations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mt-3">
      {conversations.slice(0, 5).map((conv) => (
        <div
          key={conv.id}
          className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          onClick={() => {
            if (onConversationClick) {
              onConversationClick(conv.id);
            } else {
              window.location.href = `/messages?conversation=${conv.id}`;
            }
          }}
        >
          {/* Avatar */}
          <Avatar className="w-10 h-10">
            {conv.participantAvatar ? (
              <AvatarImage src={conv.participantAvatar} alt={conv.participantName} />
            ) : (
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                {conv.participantName.charAt(0).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold text-sm truncate">
                {conv.participantName}
              </h4>
              <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                {formatDistanceToNow(conv.lastMessageTime, { 
                  addSuffix: true, 
                  locale: fr 
                })}
              </span>
            </div>
            
            {/* Listing title if exists */}
            {conv.listingTitle && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 truncate">
                {conv.listingTitle}
              </p>
            )}
            
            {/* Message preview */}
            <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
              {conv.lastMessage}
            </p>
            
            {/* Unread badge */}
            {conv.unreadCount && conv.unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs mt-1">
                {conv.unreadCount} nouveau{conv.unreadCount > 1 ? 'x' : ''}
              </Badge>
            )}
          </div>
        </div>
      ))}
      
      {conversations.length > 5 && (
        <p className="text-xs text-center text-gray-500">
          + {conversations.length - 5} autres conversations
        </p>
      )}
    </div>
  );
};

