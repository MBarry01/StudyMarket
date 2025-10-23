import { z } from 'zod';

// Validation schema for listings
export const listingSchema = z.object({
  title: z.string()
    .min(3, 'Le titre doit contenir au moins 3 caractères')
    .max(100, 'Le titre ne peut pas dépasser 100 caractères'),
  description: z.string()
    .min(10, 'La description doit contenir au moins 10 caractères')
    .max(2000, 'La description ne peut pas dépasser 2000 caractères'),
  price: z.number()
    .min(0, 'Le prix ne peut pas être négatif')
    .max(10000, 'Le prix ne peut pas dépasser 10 000€'),
  currency: z.string().default('EUR'),
  category: z.enum(['electronics', 'furniture', 'books', 'clothing', 'services', 'housing', 'jobs', 'events', 'lost-found', 'donations', 'exchange']),
  condition: z.enum(['new', 'like-new', 'good', 'fair', 'poor']),
  images: z.array(z.string().url('URL d\'image invalide')).max(10, 'Maximum 10 images'),
  tags: z.array(z.string()).max(20, 'Maximum 20 tags'),
  location: z.object({
    city: z.string().min(1, 'Ville requise'),
    state: z.string().min(1, 'Région requise'),
    country: z.string().min(1, 'Pays requis'),
    campus: z.string().optional(),
    university: z.string().optional(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
  }),
  transactionType: z.enum(['sale', 'donation', 'exchange', 'service']),
  exchangeFor: z.string().optional(),
});

// Validation schema for user profile
export const userProfileSchema = z.object({
  displayName: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères'),
  bio: z.string()
    .max(500, 'La bio ne peut pas dépasser 500 caractères')
    .optional(),
  university: z.string().min(1, 'Université requise'),
  fieldOfStudy: z.string().min(1, 'Domaine d\'étude requis'),
  graduationYear: z.number()
    .min(2020, 'Année de graduation invalide')
    .max(2030, 'Année de graduation invalide'),
  campus: z.string().min(1, 'Campus requis'),
  phone: z.string()
    .regex(/^(\+33|0)[1-9](\d{8})$/, 'Numéro de téléphone invalide')
    .optional(),
});

// Validation schema for contact messages
export const contactMessageSchema = z.object({
  name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères'),
  email: z.string()
    .email('Adresse email invalide'),
  subject: z.string()
    .min(5, 'Le sujet doit contenir au moins 5 caractères')
    .max(100, 'Le sujet ne peut pas dépasser 100 caractères'),
  message: z.string()
    .min(10, 'Le message doit contenir au moins 10 caractères')
    .max(1000, 'Le message ne peut pas dépasser 1000 caractères'),
});

// Validation schema for reviews
export const reviewSchema = z.object({
  rating: z.number()
    .min(1, 'Note minimale: 1')
    .max(5, 'Note maximale: 5'),
  comment: z.string()
    .min(10, 'Le commentaire doit contenir au moins 10 caractères')
    .max(500, 'Le commentaire ne peut pas dépasser 500 caractères'),
  reviewType: z.enum(['buyer', 'seller']),
  isPublic: z.boolean().default(true),
});

// Validation schema for search filters
export const searchFiltersSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  transactionType: z.enum(['sale', 'donation', 'exchange', 'service']).optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  condition: z.array(z.string()).optional(),
  university: z.string().optional(),
  campus: z.string().optional(),
  location: z.string().optional(),
  radius: z.number().min(1).max(100).optional(),
  verifiedOnly: z.boolean().optional(),
  sortBy: z.enum(['relevance', 'date', 'price-asc', 'price-desc', 'distance', 'rating']).optional(),
});

// Helper function to validate data
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return { success: false, errors: ['Erreur de validation inconnue'] };
  }
}

// Helper function to get first validation error
export function getFirstValidationError<T>(schema: z.ZodSchema<T>, data: unknown): string | null {
  const result = validateData(schema, data);
  return result.success ? null : result.errors[0] || null;
}

