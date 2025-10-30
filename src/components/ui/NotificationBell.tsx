import React, { useEffect, useState } from 'react';
import { Bell, MessageCircle, Package, CreditCard, Shield, AlertCircle } from 'lucide-react';
import { Badge } from './badge';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { ScrollArea } from './scroll-area';
import { getUserNotifications, getUnreadNotificationCount, markNotificationAsRead } from '../../services/pushNotificationService';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
}

export const NotificationBell: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Charger les notifications
  const loadNotifications = async () => {
    if (!currentUser?.uid) return;
    
    setIsLoading(true);
    try {
      const notifs = await getUserNotifications(currentUser.uid, 10);
      setNotifications(notifs as Notification[]);
      
      const count = await getUnreadNotificationCount(currentUser.uid);
      setUnreadCount(count);
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    
    // Recharger toutes les 30 secondes
    const interval = setInterval(loadNotifications, 30000);
    
    return () => clearInterval(interval);
  }, [currentUser]);

  // Marquer comme lu et rediriger
  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Marquer comme lu
      await markNotificationAsRead(notification.id);
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Fermer le dropdown
      setIsOpen(false);
      
      // Rediriger selon le type et les données
      const redirectUrl = notification.data?.url || getDefaultUrl(notification.type, notification.data);
      
      if (redirectUrl) {
        console.log('Redirection vers:', redirectUrl);
        navigate(redirectUrl);
      }
    } catch (error) {
      console.error('Erreur lors du clic sur la notification:', error);
    }
  };

  // Obtenir l'URL par défaut selon le type
  const getDefaultUrl = (type: string, data?: any) => {
    switch (type) {
      case 'message':
        return data?.conversationId ? `/messages?conversation=${data.conversationId}` : '/messages';
      case 'listing':
        return data?.listingId ? `/listing/${data.listingId}` : '/listings';
      case 'order':
        return data?.orderId ? `/orders/${data.orderId}` : '/orders';
      case 'verification':
        return '/verification';
      case 'system':
        return data?.url || '/';
      default:
        return '/';
    }
  };

  // Format de la date
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true, 
        locale: fr 
      });
    } catch {
      return 'il y a quelques instants';
    }
  };

  // Obtenir l'icône selon le type
  const getNotificationIcon = (type: string) => {
    const iconClass = "w-5 h-5 flex-shrink-0";
    switch (type) {
      case 'message':
        return <MessageCircle className={iconClass} />;
      case 'listing':
        return <Package className={iconClass} />;
      case 'order':
        return <CreditCard className={iconClass} />;
      case 'verification':
        return <Shield className={iconClass} />;
      case 'system':
        return <AlertCircle className={iconClass} />;
      default:
        return <Bell className={iconClass} />;
    }
  };

  // Obtenir les couleurs selon le type
  const getNotificationColors = (type: string) => {
    switch (type) {
      case 'message':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20';
      case 'listing':
        return 'border-l-green-500 bg-green-50 dark:bg-green-950/20';
      case 'order':
        return 'border-l-purple-500 bg-purple-50 dark:bg-purple-950/20';
      case 'verification':
        return 'border-l-amber-500 bg-amber-50 dark:bg-amber-950/20';
      case 'system':
        return 'border-l-gray-500 bg-gray-50 dark:bg-gray-950/20';
      default:
        return 'border-l-gray-500 bg-gray-50 dark:bg-gray-950/20';
    }
  };

  if (!currentUser) return null;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <span
          role="button"
          tabIndex={0}
          aria-label="Notifications"
          className="relative inline-flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 cursor-pointer select-none outline-none focus:outline-none nav-icon"
        >
          <span className="relative inline-block align-middle leading-none">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge
                aria-label={`Notifications: ${unreadCount}`}
                className="pointer-events-none absolute -top-3 -right-2 z-10 h-5 w-5 p-0 flex items-center justify-center text-[10px] font-semibold bg-red-600 text-white rounded-full shadow-sm ring-2 ring-background badge-pop"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </span>
        </span>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {unreadCount} non{unreadCount > 1 ? ' lus' : ' lue'}
            </Badge>
          )}
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Chargement...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Aucune notification
            </div>
          ) : (
            <div className="p-1">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    "border-l-4 transition-all duration-200 rounded-lg p-3 mb-1 cursor-pointer hover:bg-muted",
                    getNotificationColors(notification.type),
                    !notification.read && "border-l-opacity-100",
                    notification.read && "opacity-60"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-sm leading-tight text-foreground">
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 animate-pulse" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <span className="w-1 h-1 bg-current rounded-full" />
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={() => {
                // Rediriger vers les paramètres > notifications (page existante)
                navigate('/settings?tab=notifications');
              }}
            >
              Voir toutes les notifications
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

