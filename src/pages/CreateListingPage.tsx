import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Upload, 
  X, 
  MapPin, 
  Euro, 
  Gift, 
  RefreshCw, 
  Camera, 
  AlertCircle,
  Sparkles,
  Leaf,
  Shield,
  Clock,
  Tag,
  Plus,
  Minus,
  CreditCard,
  Smartphone,
  Banknote,
  Phone,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { useAuth } from '../contexts/AuthContext';
import { useListingStore } from '../stores/useListingStore';
import { Listing } from '../types';
import { storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Schémas de validation dynamiques selon le type
const baseSchema = z.object({
  title: z.string().min(5, 'Le titre doit contenir au moins 5 caractères').max(80, 'Le titre ne peut pas dépasser 80 caractères'),
  description: z.string().min(20, 'La description doit contenir au moins 20 caractères').max(1000, 'La description ne peut pas dépasser 1000 caractères'),
  tags: z.array(z.string()).min(1, 'Ajoutez au moins un tag').max(5, 'Maximum 5 tags'),
  meetingLocation: z.string().min(1, 'Veuillez spécifier un lieu de rencontre'),
});

const sellSchema = baseSchema.extend({
  price: z.string().min(1, 'Le prix est obligatoire').transform((val) => {
    const numVal = parseFloat(val.replace(',', '.'));
    if (isNaN(numVal) || numVal < 1) throw new Error('Le prix doit être d\'au moins 1€');
    if (numVal > 10000) throw new Error('Le prix ne peut pas dépasser 10 000€');
    return numVal;
  }),
  condition: z.enum(['new', 'like-new', 'good', 'fair']),
  paymentMethods: z.array(z.string()).min(1, 'Sélectionnez au moins un mode de paiement'),
});

const giftSchema = baseSchema.extend({
  donationReason: z.string().min(10, 'Expliquez pourquoi vous donnez cet objet').max(140, 'Maximum 140 caractères'),
});

const swapSchema = baseSchema.extend({
  desiredItems: z.array(z.string()).min(1, 'Ajoutez au moins un objet recherché'),
  estimatedValue: z.string().min(1, 'La valeur estimée est obligatoire').transform((val) => {
    const numVal = parseFloat(val.replace(',', '.'));
    if (isNaN(numVal) || numVal < 1) throw new Error('La valeur estimée doit être d\'au moins 1€');
    return numVal;
  }),
});

const serviceSchema = baseSchema.extend({
  hourlyRate: z.string().min(1, 'Le tarif horaire est obligatoire').transform((val) => {
    const numVal = parseFloat(val.replace(',', '.'));
    if (isNaN(numVal) || numVal < 5) throw new Error('Le tarif horaire doit être d\'au moins 5€/h');
    if (numVal > 200) throw new Error('Le tarif ne peut pas dépasser 200€/h');
    return numVal;
  }),
  duration: z.number().min(1, 'La durée doit être d\'au moins 1 heure').max(720, 'Maximum 720 heures'),
  skills: z.string().min(20, 'Décrivez vos compétences en détail').max(500, 'Maximum 500 caractères'),
  availability: z.string().optional(),
});

type TransactionType = 'sell' | 'gift' | 'swap' | 'service';

const conditions = [
  { value: 'new', label: 'Neuf', description: 'Jamais utilisé, dans son emballage' },
  { value: 'like-new', label: 'Très bon', description: 'Utilisé très peu, aucun défaut visible' },
  { value: 'good', label: 'Bon', description: 'Utilisé mais bien entretenu' },
  { value: 'fair', label: 'Correct', description: 'Signes d\'usure mais fonctionnel' },
];

const paymentMethods = [
  { value: 'cash', label: 'Espèces', icon: Banknote },
  { value: 'transfer', label: 'Virement bancaire', icon: CreditCard },
  { value: 'lydia', label: 'Lydia', icon: Smartphone },
  { value: 'paypal', label: 'PayPal', icon: CreditCard },
];

const campuses = [
  'Campus Pierre et Marie Curie (Sorbonne)',
  'Campus Dauphine',
  'Campus de Palaiseau (Polytechnique)',
  'Campus ENS Ulm',
  'Campus CentraleSupélec',
  'Campus MINES ParisTech',
  'Campus HEC Jouy-en-Josas',
  'Campus ESSEC Cergy',
  'Campus Sciences Po',
  'Autre campus'
];

export const CreateListingPage: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const { createListing } = useListingStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [transactionType, setTransactionType] = useState<TransactionType>(() => {
    const typeParam = searchParams.get('type');
    return (typeParam as TransactionType) || 'sell';
  });
  
  const [images, setImages] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [currentTag, setCurrentTag] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [desiredItems, setDesiredItems] = useState<string[]>(['']);
  const [currentDesiredItem, setCurrentDesiredItem] = useState('');
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([]);
  const [duration, setDuration] = useState([1]);

  // Schéma dynamique selon le type de transaction
  const getSchema = () => {
    switch (transactionType) {
      case 'sell': return sellSchema;
      case 'gift': return giftSchema;
      case 'swap': return swapSchema;
      case 'service': return serviceSchema;
      default: return baseSchema;
    }
  };

  const form = useForm({
    resolver: zodResolver(getSchema()),
    defaultValues: {
      title: '',
      description: '',
      price: '',
      condition: 'good',
      paymentMethods: [],
      donationReason: '',
      desiredItems: [],
      estimatedValue: '',
      hourlyRate: '',
      duration: 1,
      skills: '',
      availability: '',
      tags: [],
      meetingLocation: '',
    },
    mode: 'onChange'
  });

  // Réinitialiser le formulaire quand le type change
  useEffect(() => {
    form.reset({
      title: '',
      description: '',
      price: '',
      condition: 'good',
      paymentMethods: [],
      donationReason: '',
      desiredItems: [],
      estimatedValue: '',
      hourlyRate: '',
      duration: 1,
      skills: '',
      availability: '',
      tags: [],
      meetingLocation: '',
    });
    setTags([]);
    setDesiredItems(['']);
    setSelectedPaymentMethods([]);
    setDuration([1]);
    setImages([]);
  }, [transactionType, form]);

  const uploadImageToStorage = async (file: File): Promise<string> => {
    if (!currentUser) throw new Error('User not authenticated');
    
    const timestamp = Date.now();
    const fileName = `listings/${currentUser.uid}/${timestamp}_${file.name}`;
    const storageRef = ref(storage, fileName);
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImages(true);
    
    try {
      const validFiles = Array.from(files)
        .slice(0, 10 - images.length)
        .filter(file => file.size <= 15 * 1024 * 1024); // 15MB max

      const uploadPromises = validFiles.map(file => uploadImageToStorage(file));
      const uploadedUrls = await Promise.all(uploadPromises);
      
      setImages(prev => [...prev, ...uploadedUrls]);
    } catch (error) {
      console.error('Error uploading images:', error);
      // You might want to show a toast notification here
    } finally {
      setIsUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim()) && tags.length < 5) {
      const newTags = [...tags, currentTag.trim()];
      setTags(newTags);
      form.setValue('tags', newTags);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    form.setValue('tags', newTags);
  };

  const addDesiredItem = () => {
    if (currentDesiredItem.trim()) {
      const newItems = [...desiredItems.filter(item => item.trim()), currentDesiredItem.trim()];
      setDesiredItems(newItems);
      form.setValue('desiredItems', newItems);
      setCurrentDesiredItem('');
    }
  };

  const removeDesiredItem = (index: number) => {
    const newItems = desiredItems.filter((_, i) => i !== index);
    setDesiredItems(newItems);
    form.setValue('desiredItems', newItems);
  };

  const handlePaymentMethodChange = (method: string, checked: boolean) => {
    const newMethods = checked 
      ? [...selectedPaymentMethods, method]
      : selectedPaymentMethods.filter(m => m !== method);
    
    setSelectedPaymentMethods(newMethods);
    form.setValue('paymentMethods', newMethods);
  };

  const onSubmit = async (data: any) => {
    if (!currentUser || !userProfile) return;

    setIsSubmitting(true);
    
    try {
      const baseListingData = {
        title: data.title,
        description: data.description,
        currency: 'EUR',
        category: 'electronics' as any, // Sera déterminé par l'IA plus tard
        images: images,
        tags: data.tags,
        location: {
          city: 'Paris',
          state: 'Île-de-France',
          country: 'France',
          campus: userProfile.campus || null,
          university: userProfile.university || null,
          coordinates: null,
        },
        sellerId: currentUser.uid,
        sellerName: userProfile.displayName,
        sellerAvatar: userProfile.photoURL,
        sellerUniversity: userProfile.university,
        sellerVerified: userProfile.isVerified,
        status: 'active' as const,
        views: 0,
        likes: 0,
        saves: 0,
        reportCount: 0,
        moderationStatus: 'approved' as const,
      };

      let listingData: Omit<Listing, 'id' | 'createdAt' | 'updatedAt'>;

      switch (transactionType) {
        case 'sell':
          listingData = {
            ...baseListingData,
            price: data.price,
            condition: data.condition as any,
            transactionType: 'sale',
            // Stocker les modes de paiement dans les tags ou description
            description: `${data.description}\n\nModes de paiement acceptés: ${selectedPaymentMethods.map(m => paymentMethods.find(pm => pm.value === m)?.label).join(', ')}`,
          };
          break;

        case 'gift':
          listingData = {
            ...baseListingData,
            price: 0,
            condition: 'good' as any,
            transactionType: 'donation',
            description: `${data.description}\n\nRaison du don: ${data.donationReason}`,
          };
          break;

        case 'swap':
          listingData = {
            ...baseListingData,
            price: data.estimatedValue,
            condition: 'good' as any,
            transactionType: 'exchange',
            exchangeFor: desiredItems.filter(item => item.trim()).join(', '),
            description: `${data.description}\n\nRecherche en échange: ${desiredItems.filter(item => item.trim()).join(', ')}\nValeur estimée: ${data.estimatedValue}€`,
          };
          break;

        case 'service':
          listingData = {
            ...baseListingData,
            price: data.hourlyRate,
            condition: 'new' as any,
            transactionType: 'service',
            description: `${data.description}\n\nCompétences: ${data.skills}\nTarif: ${data.hourlyRate}€/h\nDurée prévue: ${duration[0]}h${data.availability ? `\nDisponibilités: ${data.availability}` : ''}`,
          };
          break;

        default:
          throw new Error('Type de transaction non supporté');
      }

      console.log('Submitting listing data:', listingData);

      const listingId = await createListing(listingData);
      navigate(`/listing/${listingId}`);
    } catch (error) {
      console.error('Error creating listing:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    const errors = form.formState.errors;
    const hasRequiredFields = form.watch('title') && form.watch('description') && form.watch('meetingLocation') && tags.length > 0;
    
    switch (transactionType) {
      case 'sell':
        return hasRequiredFields && form.watch('price') && selectedPaymentMethods.length > 0 && !errors.title && !errors.description && !errors.price;
      case 'gift':
        return hasRequiredFields && form.watch('donationReason') && !errors.title && !errors.description && !errors.donationReason;
      case 'swap':
        return hasRequiredFields && desiredItems.some(item => item.trim()) && form.watch('estimatedValue') && !errors.title && !errors.description && !errors.estimatedValue;
      case 'service':
        return hasRequiredFields && form.watch('hourlyRate') && form.watch('skills') && !errors.title && !errors.description && !errors.hourlyRate && !errors.skills;
      default:
        return false;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-foreground">Créer une annonce</h1>
        <p className="text-muted-foreground">
          Partagez vos objets, services ou recherches avec la communauté étudiante vérifiée
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Transaction Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Sparkles className="w-5 h-5" />
              Type d'annonce
            </CardTitle>
            <CardDescription>
              Le formulaire s'adapte automatiquement selon votre choix
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card 
                className={`cursor-pointer transition-all ${transactionType === 'sell' ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-md'}`}
                onClick={() => setTransactionType('sell')}
              >
                <CardContent className="p-4 text-center">
                  <Euro className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <h3 className="font-semibold text-foreground">Vendre</h3>
                  <p className="text-xs text-muted-foreground">Vendre un objet</p>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all ${transactionType === 'gift' ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-md'}`}
                onClick={() => setTransactionType('gift')}
              >
                <CardContent className="p-4 text-center">
                  <Gift className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <h3 className="font-semibold text-foreground">Donner</h3>
                  <p className="text-xs text-muted-foreground">Don gratuit</p>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all ${transactionType === 'swap' ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-md'}`}
                onClick={() => setTransactionType('swap')}
              >
                <CardContent className="p-4 text-center">
                  <RefreshCw className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <h3 className="font-semibold text-foreground">Troc</h3>
                  <p className="text-xs text-muted-foreground">Échanger des objets</p>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all ${transactionType === 'service' ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-md'}`}
                onClick={() => setTransactionType('service')}
              >
                <CardContent className="p-4 text-center">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                  <h3 className="font-semibold text-foreground">Service</h3>
                  <p className="text-xs text-muted-foreground">Proposer un service</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informations communes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Informations principales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-foreground">Titre * (max 80 caractères)</Label>
                  <Input
                    id="title"
                    placeholder={
                      transactionType === 'sell' ? "Ex: MacBook Pro 13' M1 - Parfait état" :
                      transactionType === 'gift' ? "Ex: Vélo de ville - Don gratuit" :
                      transactionType === 'swap' ? "Ex: Livre de maths contre livre de physique" :
                      "Ex: Cours particuliers de mathématiques"
                    }
                    {...form.register('title')}
                    className="mt-1"
                    maxLength={80}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span className="text-destructive">{form.formState.errors.title?.message}</span>
                    <span>{form.watch('title')?.length || 0}/80</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description" className="text-foreground">Description détaillée * (max 1000 caractères)</Label>
                  <Textarea
                    id="description"
                    placeholder={
                      transactionType === 'sell' ? "Décrivez l'état, l'utilisation, la raison de la vente..." :
                      transactionType === 'gift' ? "Décrivez l'objet et pourquoi vous le donnez..." :
                      transactionType === 'swap' ? "Décrivez ce que vous proposez et ce que vous recherchez..." :
                      "Décrivez vos compétences, votre expérience, votre méthode..."
                    }
                    rows={6}
                    {...form.register('description')}
                    className="mt-1"
                    maxLength={1000}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span className="text-destructive">{form.formState.errors.description?.message}</span>
                    <span>{form.watch('description')?.length || 0}/1000</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Champs spécifiques selon le type */}
            {transactionType === 'sell' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Euro className="w-5 h-5 text-blue-600" />
                    Informations de vente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price" className="text-foreground">Prix (€) *</Label>
                      <Input
                        id="price"
                        type="text"
                        placeholder="0,00"
                        {...form.register('price')}
                        className="mt-1"
                      />
                      {form.formState.errors.price && (
                        <p className="text-sm text-destructive mt-1">
                          {form.formState.errors.price.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="condition" className="text-foreground">État du produit *</Label>
                      <Select onValueChange={(value) => form.setValue('condition', value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Sélectionnez un état" />
                        </SelectTrigger>
                        <SelectContent>
                          {conditions.map((condition) => (
                            <SelectItem key={condition.value} value={condition.value}>
                              <div>
                                <div className="font-medium text-foreground">{condition.label}</div>
                                <div className="text-xs text-muted-foreground">{condition.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.condition && (
                        <p className="text-sm text-destructive mt-1">
                          {form.formState.errors.condition.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="text-foreground">Modes de paiement acceptés *</Label>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      {paymentMethods.map((method) => (
                        <div key={method.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={method.value}
                            checked={selectedPaymentMethods.includes(method.value)}
                            onCheckedChange={(checked) => handlePaymentMethodChange(method.value, checked as boolean)}
                          />
                          <Label htmlFor={method.value} className="flex items-center gap-2 cursor-pointer text-foreground">
                            <method.icon className="w-4 h-4" />
                            {method.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {selectedPaymentMethods.length === 0 && (
                      <p className="text-sm text-destructive mt-1">
                        Sélectionnez au moins un mode de paiement
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {transactionType === 'gift' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Gift className="w-5 h-5 text-green-600" />
                    Informations du don
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="donationReason" className="text-foreground">Motif du don * (max 140 caractères)</Label>
                    <Textarea
                      id="donationReason"
                      placeholder="Ex: Je déménage, plus besoin, fin d'études..."
                      rows={3}
                      {...form.register('donationReason')}
                      className="mt-1"
                      maxLength={140}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span className="text-destructive">{form.formState.errors.donationReason?.message}</span>
                      <span>{form.watch('donationReason')?.length || 0}/140</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {transactionType === 'swap' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <RefreshCw className="w-5 h-5 text-purple-600" />
                    Informations d'échange
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-foreground">Objets recherchés * (minimum 1)</Label>
                    <div className="space-y-2 mt-2">
                      {desiredItems.filter(item => item.trim()).map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input value={item} readOnly className="flex-1" />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeDesiredItem(index)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <Input
                          placeholder="Ex: Livre de physique L2"
                          value={currentDesiredItem}
                          onChange={(e) => setCurrentDesiredItem(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDesiredItem())}
                          className="flex-1"
                        />
                        <Button type="button" onClick={addDesiredItem} disabled={!currentDesiredItem.trim()}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="estimatedValue" className="text-foreground">Valeur estimée (€) *</Label>
                    <Input
                      id="estimatedValue"
                      type="text"
                      placeholder="0,00"
                      {...form.register('estimatedValue')}
                      className="mt-1"
                    />
                    {form.formState.errors.estimatedValue && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.estimatedValue.message}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {transactionType === 'service' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Clock className="w-5 h-5 text-orange-600" />
                    Informations du service
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="skills" className="text-foreground">Description des compétences *</Label>
                    <Textarea
                      id="skills"
                      placeholder="Décrivez vos compétences, votre expérience, votre méthode d'enseignement..."
                      rows={4}
                      {...form.register('skills')}
                      className="mt-1"
                      maxLength={500}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span className="text-destructive">{form.formState.errors.skills?.message}</span>
                      <span>{form.watch('skills')?.length || 0}/500</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="hourlyRate" className="text-foreground">Tarif horaire (€/h) *</Label>
                      <Input
                        id="hourlyRate"
                        type="text"
                        placeholder="15,00"
                        {...form.register('hourlyRate')}
                        className="mt-1"
                      />
                      {form.formState.errors.hourlyRate && (
                        <p className="text-sm text-destructive mt-1">
                          {form.formState.errors.hourlyRate.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-foreground">Durée prévue: {duration[0]}h</Label>
                      <Slider
                        value={duration}
                        onValueChange={(value) => {
                          setDuration(value);
                          form.setValue('duration', value[0]);
                        }}
                        max={720}
                        min={1}
                        step={1}
                        className="mt-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>1h</span>
                        <span>720h</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="availability" className="text-foreground">Disponibilités (optionnel)</Label>
                    <Input
                      id="availability"
                      placeholder="Ex: Lundi-Vendredi 18h-20h, Week-ends"
                      {...form.register('availability')}
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Photos - optionnelles pour don, obligatoires pour vente */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Camera className="w-5 h-5" />
                  Photos {transactionType === 'gift' ? '(optionnelles)' : '(1-10 photos)'}
                </CardTitle>
                <CardDescription>
                  {transactionType === 'gift' 
                    ? 'Ajoutez des photos pour donner envie (optionnel)'
                    : 'Première photo = photo principale. Max 15MB par image.'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-20 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                      {index === 0 && (
                        <Badge className="absolute bottom-1 left-1 text-xs bg-primary text-primary-foreground">
                          Principale
                        </Badge>
                      )}
                    </div>
                  ))}
                  
                  {images.length < 10 && (
                    <label className="border-2 border-dashed border-muted-foreground/25 rounded-lg h-20 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                      <div className="text-center">
                        {isUploadingImages ? (
                          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-1" />
                        ) : (
                          <Upload className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {isUploadingImages ? 'Upload...' : 'Ajouter'}
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={isUploadingImages}
                      />
                    </label>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tags et localisation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Tag className="w-5 h-5" />
                  Tags et localisation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-foreground">Tags * (max 5)</Label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="w-4 h-4 p-0 hover:bg-transparent"
                          onClick={() => removeTag(tag)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ajouter un tag..."
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      className="flex-1"
                    />
                    <Button type="button" onClick={addTag} disabled={!currentTag.trim() || tags.length >= 5}>
                      Ajouter
                    </Button>
                  </div>
                  
                  {tags.length === 0 && (
                    <p className="text-sm text-destructive mt-1">
                      Ajoutez au moins un tag
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="meetingLocation" className="text-foreground">Point de rencontre *</Label>
                  <Input
                    id="meetingLocation"
                    placeholder="Ex: Bibliothèque universitaire, Hall principal..."
                    {...form.register('meetingLocation')}
                    className="mt-1"
                  />
                  {form.formState.errors.meetingLocation && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.meetingLocation.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Privilégiez les lieux publics et fréquentés
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Validation en temps réel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm text-foreground">
                  <AlertCircle className="w-4 h-4" />
                  Validation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-xs">
                  <div className={`flex items-center gap-2 ${form.watch('title') && form.watch('title').length >= 5 ? 'text-green-600' : 'text-muted-foreground'}`}>
                    <div className={`w-2 h-2 rounded-full ${form.watch('title') && form.watch('title').length >= 5 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span>Titre (5-80 caractères)</span>
                  </div>
                  <div className={`flex items-center gap-2 ${form.watch('description') && form.watch('description').length >= 20 ? 'text-green-600' : 'text-muted-foreground'}`}>
                    <div className={`w-2 h-2 rounded-full ${form.watch('description') && form.watch('description').length >= 20 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span>Description (20-1000 caractères)</span>
                  </div>
                  <div className={`flex items-center gap-2 ${tags.length > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                    <div className={`w-2 h-2 rounded-full ${tags.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span>Tags (1-5)</span>
                  </div>
                  <div className={`flex items-center gap-2 ${form.watch('meetingLocation') ? 'text-green-600' : 'text-muted-foreground'}`}>
                    <div className={`w-2 h-2 rounded-full ${form.watch('meetingLocation') ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span>Point de rencontre</span>
                  </div>
                  
                  {transactionType === 'sell' && (
                    <>
                      <div className={`flex items-center gap-2 ${form.watch('price') ? 'text-green-600' : 'text-muted-foreground'}`}>
                        <div className={`w-2 h-2 rounded-full ${form.watch('price') ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span>Prix (≥ 1€)</span>
                      </div>
                      <div className={`flex items-center gap-2 ${selectedPaymentMethods.length > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                        <div className={`w-2 h-2 rounded-full ${selectedPaymentMethods.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span>Modes de paiement</span>
                      </div>
                    </>
                  )}
                  
                  {transactionType === 'gift' && (
                    <div className={`flex items-center gap-2 ${form.watch('donationReason') && form.watch('donationReason').length >= 10 ? 'text-green-600' : 'text-muted-foreground'}`}>
                      <div className={`w-2 h-2 rounded-full ${form.watch('donationReason') && form.watch('donationReason').length >= 10 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span>Motif du don</span>
                    </div>
                  )}
                  
                  {transactionType === 'swap' && (
                    <>
                      <div className={`flex items-center gap-2 ${desiredItems.some(item => item.trim()) ? 'text-green-600' : 'text-muted-foreground'}`}>
                        <div className={`w-2 h-2 rounded-full ${desiredItems.some(item => item.trim()) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span>Objets recherchés</span>
                      </div>
                      <div className={`flex items-center gap-2 ${form.watch('estimatedValue') ? 'text-green-600' : 'text-muted-foreground'}`}>
                        <div className={`w-2 h-2 rounded-full ${form.watch('estimatedValue') ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span>Valeur estimée</span>
                      </div>
                    </>
                  )}
                  
                  {transactionType === 'service' && (
                    <>
                      <div className={`flex items-center gap-2 ${form.watch('hourlyRate') ? 'text-green-600' : 'text-muted-foreground'}`}>
                        <div className={`w-2 h-2 rounded-full ${form.watch('hourlyRate') ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span>Tarif (≥ 5€/h)</span>
                      </div>
                      <div className={`flex items-center gap-2 ${form.watch('skills') && form.watch('skills').length >= 20 ? 'text-green-600' : 'text-muted-foreground'}`}>
                        <div className={`w-2 h-2 rounded-full ${form.watch('skills') && form.watch('skills').length >= 20 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span>Compétences</span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Safety Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm text-foreground">
                  <Shield className="w-4 h-4" />
                  Conseils de sécurité
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-muted-foreground">Rencontrez-vous dans un lieu public</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-muted-foreground">Vérifiez l'identité de l'autre personne</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-muted-foreground">Testez l'objet avant la transaction</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-muted-foreground">Privilégiez les paiements sécurisés</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Card>
              <CardContent className="pt-6">
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white"
                  disabled={isSubmitting || !isFormValid() || isUploadingImages}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Publication...
                    </>
                  ) : isUploadingImages ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Upload des images...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Publier l'annonce
                    </>
                  )}
                </Button>
                
                <p className="text-xs text-muted-foreground text-center mt-2">
                  {isFormValid() 
                    ? "Votre annonce sera visible immédiatement" 
                    : "Complétez tous les champs obligatoires"
                  }
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};