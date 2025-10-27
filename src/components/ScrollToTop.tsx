import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll vers le haut de la page à chaque changement de route
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

