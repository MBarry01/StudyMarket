import { useEffect, useState } from 'react';
// import DomeGallery from './DomeGallery'; // Temporairement désactivé
// import Shuffle from './Shuffle'; // Temporairement désactivé

interface SouvenirImage {
  src: string;
  alt: string;
  displayName?: string;
  caption?: string;
}

export default function SouvenirBanner() {
  const [images, setImages] = useState<SouvenirImage[]>([]);
  
  // Charger les souvenirs avec images de test
  useEffect(() => {
    const testImages: SouvenirImage[] = [
      { src: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop', alt: 'Marie - Graduation day 📚', displayName: 'Marie', caption: 'Graduation day 📚' },
      { src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop', alt: 'Pierre - Premier jour sur le campus 🎓', displayName: 'Pierre', caption: 'Premier jour sur le campus 🎓' },
      { src: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop', alt: 'Sophie - StudyMarket rocks! 🚀', displayName: 'Sophie', caption: 'StudyMarket rocks! 🚀' },
      { src: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop', alt: 'Alex - Troc réussi! 💪', displayName: 'Alex', caption: 'Troc réussi! 💪' },
      { src: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop', alt: 'Emma - Nouveau bureau trouvé 🎉', displayName: 'Emma', caption: 'Nouveau bureau trouvé 🎉' },
      { src: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop', alt: 'Lucas - Étudiant satisfait 😊', displayName: 'Lucas', caption: 'Étudiant satisfait 😊' },
      { src: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=400&fit=crop', alt: 'Clara - Réussite avec StudyMarket ✨', displayName: 'Clara', caption: 'Réussite avec StudyMarket ✨' },
      { src: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop', alt: 'Thomas - Super expérience! 🎓', displayName: 'Thomas', caption: 'Super expérience! 🎓' },
      { src: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop', alt: 'Léa - Meilleure plateforme étudiante 🌟', displayName: 'Léa', caption: 'Meilleure plateforme étudiante 🌟' },
      { src: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=400&fit=crop', alt: 'Hugo - Communauté au top! 💯', displayName: 'Hugo', caption: 'Communauté au top! 💯' },
      { src: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop', alt: 'Maxime - Super expérience! 😊', displayName: 'Maxime', caption: 'Super expérience! 😊' },
      { src: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop', alt: 'Camille - Recommandé! ✨', displayName: 'Camille', caption: 'Recommandé! ✨' },
    ];
    setImages(testImages);
  }, []);
  
  if (images.length === 0) return null;
  
  // Composant temporairement désactivé
  return null;
  
  /* Commentez le return null ci-dessus et décommentez ce code pour activer à nouveau
  return (
    <div className="hidden md:block" style={{
      width: '100%',
      backgroundColor: '#0a0612',
      overflow: 'hidden',
      marginTop: '-1rem'
    }}>
      <div style={{ height: '400px' }}>
        <DomeGallery 
          images={images}
          fit={0.7}
          fitBasis="width"
          minRadius={900}
          maxRadius={2200}
          padFactor={0.2}
          overlayBlurColor="#0a0612"
          maxVerticalRotationDeg={5}
          dragSensitivity={20}
          enlargeTransitionMs={350}
          openedImageWidth="450px"
          openedImageHeight="550px"
          imageBorderRadius="20px"
          openedImageBorderRadius="28px"
          grayscale={true}
          segments={45}
          dragDampening={2}
        />
      </div>
    </div>
  );
  */
}