import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { X, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { MapLocationPicker } from "@/components/ui/MapLocationPicker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListingStore } from "../stores/useListingStore";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "../contexts/AuthContext";

type CategoryType = 'electronics' | 'books' | 'furniture' | 'clothing' | 'services' | 'housing' | 'jobs' | 'donations' | 'exchange' | 'events' | 'lost-found';

type FormState = {
  title: string;
  description: string;
  price: string;
  images: string[];
};

interface LocationData {
  address: string;
  latitude: number;
  longitude: number;
}

const categories = [
  { value: 'electronics', label: 'Électronique' },
  { value: 'books', label: 'Livres & Cours' },
  { value: 'furniture', label: 'Mobilier' },
  { value: 'clothing', label: 'Vêtements' },
  { value: 'services', label: 'Services' },
  { value: 'housing', label: 'Logement' },
  { value: 'jobs', label: 'Jobs & Stages' },
  { value: 'donations', label: 'Dons' },
  { value: 'exchange', label: 'Troc' },
];

const EditListingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const {
    fetchListingById,
    updateListing,
    currentListing,
    loading,
  } = useListingStore();

  const [form, setForm] = useState<FormState>({
    title: "",
    description: "",
    price: "",
    images: [],
  });
  const [newImages, setNewImages] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<CategoryType | "">('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [meetingLocation, setMeetingLocation] = useState<LocationData | undefined>(undefined);

  useEffect(() => {
    if (id) fetchListingById(id);
  }, [id, fetchListingById]);

  useEffect(() => {
    if (currentListing) {
      setForm({
        title: currentListing.title || "",
        description: currentListing.description || "",
        price: currentListing.price?.toString() || "",
        images: currentListing.images || [],
      });
      setCategory(currentListing.category || '');
      setTags(currentListing.tags || []);
      
      // Charger les coordonnées existantes si disponibles et valides
      if (currentListing.location?.coordinates && 
          !isNaN(currentListing.location.coordinates.lat) && 
          !isNaN(currentListing.location.coordinates.lng) &&
          currentListing.location.coordinates.lat !== 0 && 
          currentListing.location.coordinates.lng !== 0) {
        setMeetingLocation({
          address: `${currentListing.location.city}, ${currentListing.location.state}`,
          latitude: currentListing.location.coordinates.lat,
          longitude: currentListing.location.coordinates.lng,
        });
      }
    }
  }, [currentListing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Gestion des images
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files) as File[];
    setNewImages(prev => [...prev, ...files]);
  };

  const handleRemoveImage = (index: number) => {
    setForm({
      ...form,
      images: form.images.filter((_, i) => i !== index),
    });
  };

  const handleRemoveNewImage = (index: number) => {
    setNewImages(newImages.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim()) && tags.length < 5) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !currentUser) return;
    setIsUploading(true);
    try {
      // Upload new images to Firebase Storage
      let uploadedUrls: string[] = [];
      if (newImages.length > 0) {
        uploadedUrls = await Promise.all(
          newImages.map((file) => uploadImageToStorage(file, currentUser.uid))
        );
      }
      const allImages = [...form.images, ...uploadedUrls];
      
      // Préparer les données de mise à jour
      const updateData: any = {
        ...form,
        price: parseFloat(form.price),
        images: allImages,
        category: category as CategoryType,
        tags,
      };
      
      // Mettre à jour les coordonnées si elles ont été modifiées
      if (meetingLocation) {
        updateData.location = {
          ...currentListing?.location,
          city: meetingLocation.address.split(',')[0] || currentListing?.location.city,
          coordinates: {
            lat: meetingLocation.latitude,
            lng: meetingLocation.longitude,
          },
        };
        updateData.meetingPoint = meetingLocation.address;
      }
      
      await updateListing(id, updateData);
      navigate(`/listing/${id}`);
    } catch (err) {
      setError("Erreur lors de la mise à jour de l'annonce");
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) return <div>Chargement...</div>;
  if (!currentListing) return <div className="text-red-500">Annonce introuvable</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-4xl">
      <form onSubmit={handleSubmit}>
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Modifier mon annonce</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            {/* Titre */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-foreground">Titre *</Label>
              <Input
                id="title"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Ex: MacBook Pro 13' M1"
                className="w-full"
              />
            </div>
            
            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-foreground">Description *</Label>
              <Textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Décrivez l'objet en détail..."
                className="w-full"
                rows={6}
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Prix */}
              <div className="space-y-2">
                <Label htmlFor="price" className="text-foreground">Prix (€) *</Label>
                <Input
                  id="price"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="0,00"
                  type="text"
                  className="w-full"
                />
              </div>
        
              {/* Catégorie */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-foreground">Catégorie *</Label>
                <Select value={category} onValueChange={(value) => setCategory(value as CategoryType)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionnez une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Tags */}
            <div className="space-y-2">
              <Label className="text-foreground">Tags (max 5)</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <span key={tag} className="bg-primary/10 text-primary rounded-full px-3 py-1 flex items-center gap-1 text-sm border border-primary/20">
                    {tag}
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="w-4 h-4 p-0 hover:bg-primary/20"
                      onClick={() => removeTag(tag)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Ajouter un tag..."
                  value={currentTag}
                  onChange={e => setCurrentTag(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1"
                />
                <Button type="button" onClick={addTag} disabled={!currentTag.trim() || tags.length >= 5}>
                  Ajouter
                </Button>
              </div>
            </div>
            
            {/* Lieu de rencontre */}
            <div className="space-y-2">
              <Label className="text-foreground">Lieu de rencontre</Label>
              <MapLocationPicker
                onLocationSelect={setMeetingLocation}
                initialLocation={meetingLocation}
                placeholder="Sélectionnez un nouveau point de rencontre"
              />
            </div>
            {/* Photos */}
            <div className="space-y-3">
              <Label className="text-foreground">Photos</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {form.images.map((img, idx) => (
                  <div key={idx} className="relative group aspect-square">
                    <img src={img} alt={`photo-${idx}`} className="w-full h-full object-cover rounded-lg border-2 border-border" />
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute top-1 right-1 w-7 h-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      onClick={() => handleRemoveImage(idx)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {newImages.map((file, idx) => (
                  <div key={idx} className="relative group aspect-square">
                    <img src={URL.createObjectURL(file)} alt={`new-photo-${idx}`} className="w-full h-full object-cover rounded-lg border-2 border-primary" />
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute top-1 right-1 w-7 h-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      onClick={() => handleRemoveNewImage(idx)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <label className="aspect-square flex items-center justify-center border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition border-primary/50 hover:border-primary">
                  <span className="text-3xl text-primary">+</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageChange}
                    disabled={isUploading}
                  />
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Button
            type="submit"
            className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
            disabled={isUploading}
            size="lg"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Enregistrer les modifications
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/listing/${id}`)}
            size="lg"
          >
            Annuler
          </Button>
        </div>
        {error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg text-red-600 dark:text-red-400 text-center">
            {error}
          </div>
        )}
      </form>
    </div>
  );
};

export default EditListingPage;

// Fonction d'upload image
async function uploadImageToStorage(file: File, userId: string): Promise<string> {
  const timestamp = Date.now();
  const fileName = `listings/${userId}/${timestamp}_${file.name}`;
  const storageRef = ref(storage, fileName);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
}
