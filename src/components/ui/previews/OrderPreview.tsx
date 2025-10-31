/**
 * Preview component pour afficher des commandes inline dans le chatbot
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Package, CheckCircle, Clock, Truck, AlertCircle, Ban } from 'lucide-react';
import { formatDate } from '@/lib/chatbot/utils';

interface OrderPreview {
  id: string;
  orderNumber: string;
  total: number;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Date;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
}

interface OrderPreviewProps {
  orders: OrderPreview[];
  onOrderClick?: (orderId: string) => void;
}

const getStatusIcon = (status: OrderPreview['status']) => {
  switch (status) {
    case 'pending':
      return <Clock className="w-4 h-4 text-amber-500" />;
    case 'paid':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'processing':
      return <Package className="w-4 h-4 text-blue-500" />;
    case 'shipped':
      return <Truck className="w-4 h-4 text-blue-600" />;
    case 'delivered':
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case 'cancelled':
      return <Ban className="w-4 h-4 text-red-500" />;
  }
};

const getStatusColor = (status: OrderPreview['status']): string => {
  switch (status) {
    case 'pending':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
    case 'paid':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'processing':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case 'shipped':
      return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200';
    case 'delivered':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  }
};

const getStatusLabel = (status: OrderPreview['status']): string => {
  switch (status) {
    case 'pending': return 'En attente';
    case 'paid': return 'Payée';
    case 'processing': return 'En traitement';
    case 'shipped': return 'Expédiée';
    case 'delivered': return 'Livrée';
    case 'cancelled': return 'Annulée';
  }
};

export const OrderPreview: React.FC<OrderPreviewProps> = ({ 
  orders, 
  onOrderClick 
}) => {
  if (!orders || orders.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mt-3">
      {orders.slice(0, 5).map((order) => (
        <div
          key={order.id}
          className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          onClick={() => {
            if (onOrderClick) {
              onOrderClick(order.id);
            } else {
              window.location.href = `/order/${order.id}`;
            }
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {getStatusIcon(order.status)}
              <h4 className="font-semibold text-sm">
                Commande #{order.orderNumber}
              </h4>
            </div>
            <Badge className={`text-xs ${getStatusColor(order.status)}`}>
              {getStatusLabel(order.status)}
            </Badge>
          </div>
          
          {/* Items */}
          <div className="space-y-1 mb-2">
            {order.items.slice(0, 2).map((item, idx) => (
              <div key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                {item.quantity}x {item.name}
              </div>
            ))}
            {order.items.length > 2 && (
              <div className="text-xs text-gray-500">
                + {order.items.length - 2} autre(s) article(s)
              </div>
            )}
          </div>
          
          {/* Total */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
            <span className="text-xs text-gray-500">
              {formatDate(order.createdAt)}
            </span>
            <span className="font-bold text-base">
              {order.total}€
            </span>
          </div>
        </div>
      ))}
      
      {orders.length > 5 && (
        <p className="text-xs text-center text-gray-500">
          + {orders.length - 5} autre(s) commande(s)
        </p>
      )}
    </div>
  );
};

