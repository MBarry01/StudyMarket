import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';

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

interface CartStore {
  cart: CartItem[];
  cartTotal: number;
  
  // Actions
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getCartItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cart: [],
      cartTotal: 0,
      
      addToCart: (item) => {
        const { cart } = get();
        const existingItem = cart.find(cartItem => cartItem.id === item.id);
        
        if (existingItem) {
          // Update quantity if item already exists
          set({
            cart: cart.map(cartItem => 
              cartItem.id === item.id 
                ? { ...cartItem, quantity: cartItem.quantity + 1 }
                : cartItem
            ),
            cartTotal: get().cartTotal + item.price
          });
        } else {
          // Add new item
          set({
            cart: [...cart, { ...item, quantity: 1 }],
            cartTotal: get().cartTotal + item.price
          });
        }
        
        toast.success('Article ajouté au panier');
      },
      
      removeFromCart: (itemId) => {
        const { cart } = get();
        const itemToRemove = cart.find(item => item.id === itemId);
        
        if (itemToRemove) {
          set({
            cart: cart.filter(item => item.id !== itemId),
            cartTotal: get().cartTotal - (itemToRemove.price * itemToRemove.quantity)
          });
        }
      },
      
      updateQuantity: (itemId, quantity) => {
        const { cart } = get();
        const item = cart.find(item => item.id === itemId);
        
        if (item) {
          const quantityDiff = quantity - item.quantity;
          set({
            cart: cart.map(cartItem => 
              cartItem.id === itemId 
                ? { ...cartItem, quantity }
                : cartItem
            ),
            cartTotal: get().cartTotal + (item.price * quantityDiff)
          });
        }
      },
      
      clearCart: () => {
        set({
          cart: [],
          cartTotal: 0
        });
      },
      
      getCartItemCount: () => {
        return get().cart.reduce((total, item) => total + item.quantity, 0);
      }
    }),
    {
      name: 'cart-storage',
      // Skip persisting functions
      partialize: (state) => ({
        cart: state.cart,
        cartTotal: state.cartTotal
      })
    }
  )
);