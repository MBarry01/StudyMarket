import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
      await updateListing(id, {
        ...form,
        price: parseFloat(form.price),
        images: allImages,
        category: category as CategoryType,
        tags,
      });
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
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto mt-10">
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <h2 className="text-2xl font-bold mb-8 text-center">Modifier mon annonce</h2>
        
        {/* Titre */}
        <div className="mb-5">
          <Label htmlFor="title" className="block mb-1 text-gray-700">Titre</Label>
          <Input
            id="title"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Titre"
            className="w-full"
          />
        </div>
        
        {/* Description */}
        <div className="mb-5">
          <Label htmlFor="description" className="block mb-1 text-gray-700">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Description"
            className="w-full"
            rows={4}
          />
        </div>
        
        {/* Prix */}
        <div className="mb-5">
          <Label htmlFor="price" className="block mb-1 text-gray-700">Prix (€)</Label>
          <Input
            id="price"
            name="price"
            value={form.price}
            onChange={handleChange}
            placeholder="Prix"
            type="number"
            min={0}
            className="w-full"
          />
        </div>
        
        {/* Catégorie */}
        <div className="mb-5">
          <Label htmlFor="category" className="block mb-1 text-gray-700">Catégorie</Label>
          <select
            id="category"
            name="category"
            value={category}
            onChange={e => setCategory(e.target.value as CategoryType | "")}
            className="w-full border rounded px-3 py-2 bg-gray-50"
            required
          >
            <option value="">Sélectionnez une catégorie</option>
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>
        
        {/* Tags */}
        <div className="mb-5">
          <Label className="block mb-1 text-gray-700">Tags (max 5)</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <span key={tag} className="bg-gray-100 rounded px-2 py-1 flex items-center gap-1 text-sm">
                {tag}
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="w-4 h-4 p-0"
                  onClick={() => removeTag(tag)}
                >×</Button>
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
        
        {/* Photos */}
        <div className="mb-8">
          <Label className="block mb-1 text-gray-700">Photos</Label>
          <div className="flex flex-wrap gap-4 mt-2">
            {form.images.map((img, idx) => (
              <div key={idx} className="relative group">
                <img src={img} alt={`photo-${idx}`} className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition"
                  onClick={() => handleRemoveImage(idx)}
                >×</Button>
              </div>
            ))}
            {newImages.map((file, idx) => (
              <div key={idx} className="relative group">
                <img src={URL.createObjectURL(file)} alt={`new-photo-${idx}`} className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition"
                  onClick={() => handleRemoveNewImage(idx)}
                >×</Button>
              </div>
            ))}
            <label className="w-20 h-20 flex items-center justify-center border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
              <span className="text-2xl text-gray-400">+</span>
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
        
        <Button type="submit" className="w-full" disabled={isUploading}>
          {isUploading ? "Enregistrement..." : "Enregistrer les modifications"}
        </Button>
        {error && <div className="text-red-500 text-center mt-2">{error}</div>}
      </div>
    </form>
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
