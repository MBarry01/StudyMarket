# Audit Animations - StudyMarket

## 📋 Composants identifiés nécessitant des animations

### ✅ Déjà animés
- ChatbotWidget (slideUp/slideDown, fade)
- DropdownMenu (Radix UI avec animations built-in)
- Dialog (Radix UI avec animations)
- DomeGallery (animations 3D complexes)

### 🔄 À améliorer

#### 1. Navigation
- **Header mobile**: Transition douce entre les états
- **Bottom navigation**: Animation de sélection active
- **Links**: Hover states avec transitions

#### 2. Cards & Listings
- **ListingCard**: Hover effects, loading states
- **Product cards**: Fade in sur scroll
- **Category filters**: Transitions douces

#### 3. Forms
- **Input fields**: Focus transitions
- **Buttons**: Press states, loading animations
- **Validation**: Error messages avec slide-in

#### 4. Modals & Overlays
- **SearchModal**: Déjà bien animé mais peut être amélioré
- **Favorites**: Transition lors de l'ajout/suppression

#### 5. Pages
- **Page transitions**: Route change animations
- **Loading states**: Skeletons avec animations
- **Empty states**: Micro animations

## 🎨 Animations à implémenter

### Transitions douces (200-300ms)
- **Fade**: Opacity 0 → 1
- **Slide**: Transform translate
- **Scale**: Transform scale (prudence, uniquement pour hover)
- **Color**: Background/text color

### Timing
- **Fast**: 150ms (micro-interactions)
- **Normal**: 200-300ms (standard)
- **Slow**: 400-500ms (transitions importantes)

### Easing
- **ease-out**: Entrée rapide, sortie douce
- **ease-in-out**: Début et fin douce
- **ease-in**: Entrée lente

## 🔧 Implémentation

### CSS Classes globales
```css
.transition-smooth { transition: all 0.3s ease-out; }
.transition-fast { transition: all 0.15s ease-out; }
.transition-color { transition: color 0.2s ease, background-color 0.2s ease; }
```

### Animations clés identifiées
1. **Page load**: Fade in global
2. **Card hover**: Scale 1.02 + shadow
3. **Button press**: Scale 0.98
4. **Input focus**: Ring expansion
5. **Loading**: Pulse ou shimmer
6. **Success**: Checkmark animation
7. **Error**: Shake animation

## 📝 Checklist d'implémentation

### Phase 1: Navigation
- [ ] Header transitions
- [ ] Bottom nav active states
- [ ] Link hover effects

### Phase 2: Content
- [ ] Listing cards
- [ ] Category filters
- [ ] Search results

### Phase 3: Interactions
- [ ] Button states
- [ ] Form inputs
- [ ] Modals

### Phase 4: Advanced
- [ ] Page transitions
- [ ] Loading states
- [ ] Empty states

