import { useState, useEffect } from 'react';

export const useIsMobile = () => {
  // בדיקה ראשונית בטוחה (מוודא שאנחנו בדפדפן לפני שניגשים ל-window)
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 768;
    }
    return false; // ברירת מחדל לשרת/SSR
  });

  useEffect(() => {
    // בדיקה ש-window קיים (למניעת שגיאות ב-Build)
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(max-width: 768px)');
    
    // פונקציית עדכון
    const handleUpdate = (e) => setIsMobile(e.matches);

    // האזנה לשינוי ב-Media Query (יעיל יותר מ-resize)
    // הערה: בגרסאות ישנות של ספארי משתמשים ב-addListener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleUpdate);
    } else {
      mediaQuery.addListener(handleUpdate);
    }

    // ניקוי
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleUpdate);
      } else {
        mediaQuery.removeListener(handleUpdate);
      }
    };
  }, []);

  return isMobile;
};