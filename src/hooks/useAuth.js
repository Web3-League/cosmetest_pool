// ============================================================
// useAuth.js - Hook pour accéder au contexte d'authentification
// ============================================================

// hooks/useAuth.js
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  const [authCheckTimeout, setAuthCheckTimeout] = useState(false);
  
  // Vérifier si nous sommes dans le contexte AuthProvider
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  
  // Ajouter un mécanisme de timeout pour éviter que l'application ne reste bloquée
  // en état de chargement indéfiniment
  useEffect(() => {
    if (context.isLoading && !context.initAttempted) {
      const timer = setTimeout(() => {
        console.warn('La vérification d\'authentification prend trop de temps - force l\'état non authentifié');
        setAuthCheckTimeout(true);
      }, 8000); // 8 secondes de timeout
      
      return () => clearTimeout(timer);
    }
  }, [context.isLoading, context.initAttempted]);
  
  // Si timeout atteint, forcer un état non authentifié
  const isAuthenticated = authCheckTimeout ? false : context.isAuthenticated;
  const isLoading = authCheckTimeout ? false : context.isLoading;
  
  return {
    ...context,
    isAuthenticated,
    isLoading
  };
};

export default useAuth;