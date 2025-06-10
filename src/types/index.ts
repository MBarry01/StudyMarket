import { PaymentMethod } from '../stores/usePaymentStore';

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phone?: string;
  
  // Student verification
  isVerified: boolean;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  university: string;
  studentId?: string;
  graduationYear?: number;
  fieldOfStudy?: string;
  campus?: string;
  
  // Profile
  bio?: string;
  rating: number;
  reviewCount: number;
  trustScore: number;
  
  // Environmental impact
  co2Saved: number;
  transactionsCount: number;
  donationsCount: number;
  
  // Settings
  location?: string;
  notificationPreferences: {
    email: boolean;
    push: boolean;
    sms: boolean;
    alerts: boolean;
  };
  
  createdAt: Date;
  lastSeen: Date;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  
  // Student-specific categories
  category: 'electronics' | 'furniture' | 'books' | 'clothing' | 'services' | 'housing' | 'jobs' | 'events' | 'lost-found' | 'donations' | 'exchange';
  subcategory?: string;
  
  condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor';
  images: string[];
  tags: string[];
  
  // Location and campus
  location: {
    city: string;
    state: string;
    country: string;
    campus?: string;
    university?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  
  // Transaction type
  transactionType: 'sale' | 'donation' | 'exchange' | 'service';
  exchangeFor?: string; // What they want in exchange
  
  // Seller info
  sellerId: string;
  sellerName: string;
  sellerAvatar?: string;
  sellerUniversity: string;
  sellerVerified: boolean;
  sellerEmail?: string;
  
  // Status and metrics
  status: 'draft' | 'active' | 'reserved' | 'sold' | 'completed' | 'paused';
  views: number;
  likes: number;
  saves: number;
  
  // AI features
  aiPriceEstimate?: {
    min: number;
    max: number;
    confidence: number;
  };
  environmentalImpact?: {
    co2Saved: number;
    category: string;
  };
  
  // Safety and moderation
  reportCount: number;
  moderationStatus: 'approved' | 'pending' | 'flagged' | 'removed';
  
  // Dates
  createdAt: Date;
  updatedAt: Date;
  featuredUntil?: Date;
  expiresAt?: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  attachments?: string[];
  messageType: 'text' | 'image' | 'meeting-proposal' | 'location' | 'system';
  
  // Meeting proposal data
  meetingProposal?: {
    datetime: Date;
    location: string;
    coordinates?: { lat: number; lng: number };
    status: 'proposed' | 'accepted' | 'declined' | 'completed';
  };
  
  read: boolean;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  lastMessage?: Message;
  lastActivity: Date;
  status: 'active' | 'completed' | 'archived';
  
  // Safety features
  safetyRating: number;
  reportCount: number;
  
  createdAt: Date;
}

export interface Review {
  id: string;
  reviewerId: string;
  revieweeId: string;
  listingId: string;
  rating: number;
  comment: string;
  reviewType: 'buyer' | 'seller';
  
  // Public visibility
  isPublic: boolean;
  helpfulCount: number;
  
  createdAt: Date;
}

export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  filters: SearchFilters;
  alertsEnabled: boolean;
  lastNotified?: Date;
  createdAt: Date;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  subcategories: {
    id: string;
    name: string;
    filters?: string[];
  }[];
}

export interface SearchFilters {
  query?: string;
  category?: string;
  subcategory?: string;
  transactionType?: 'sale' | 'donation' | 'exchange' | 'service';
  minPrice?: number;
  maxPrice?: number;
  condition?: string[];
  university?: string;
  campus?: string;
  location?: string;
  radius?: number;
  verifiedOnly?: boolean;
  sortBy?: 'relevance' | 'date' | 'price-asc' | 'price-desc' | 'distance' | 'rating';
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export interface University {
  id: string;
  name: string;
  domain: string;
  city: string;
  country: string;
  campuses: string[];
}

export interface EnvironmentalImpact {
  userId: string;
  totalCo2Saved: number;
  transactionsByCategory: Record<string, number>;
  monthlyImpact: {
    month: string;
    co2Saved: number;
    transactions: number;
  }[];
  badges: string[];
}

export interface SafetyReport {
  id: string;
  reporterId: string;
  reportedId?: string;
  listingId?: string;
  conversationId?: string;
  reason: string;
  description: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'message' | 'listing-match' | 'price-drop' | 'review' | 'safety' | 'system';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: Date;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  seller: string;
  sellerId: string;
  listingId: string;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  shipping: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    university?: string;
  };
  payment: {
    method: string;
    details: any;
    transactionId?: string;
  };
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentInfo {
  id: string;
  type: PaymentMethod['type'];
  details: any;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  amount: number;
  currency: string;
  orderId: string;
  userId: string;
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}