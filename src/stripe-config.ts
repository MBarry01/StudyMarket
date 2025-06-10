// Stripe product configuration
export const stripeProducts = [
  {
    id: 'prod_ST3q24zsLbS28p',
    name: 'Bicyclette',
    description: 'Vélo',
    priceId: 'price_1RY7iN2XLhzYQhT9ErigqaGg',
    price: 10.00,
    currency: 'EUR',
    mode: 'payment',
    image: 'https://images.pexels.com/photos/100582/pexels-photo-100582.jpeg?auto=compress&cs=tinysrgb&w=800'
  }
];

// Get product by ID
export const getProductById = (productId: string) => {
  return stripeProducts.find(product => product.id === productId);
};

// Get product by price ID
export const getProductByPriceId = (priceId: string) => {
  return stripeProducts.find(product => product.priceId === priceId);
};