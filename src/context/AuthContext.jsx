// ============================================================
// AuthContext.js - Contexte d'authentification
// ============================================================
import { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [initAttempted, setInitAttempted] = useState(false);
  const [authCheckRetries, setAuthCheckRetries] = useState(0);

  useEffect(() => {
    let isMounted = true;
    let retryTimeout = null;
    
    const initAuth = async () => {
      try {
        setIsLoading(true);
        console.log("Initialisation de l'authentification...");
        
        // Vérifier l'authentification
        const authenticated = await authService.isAuthenticated();
        
        if (!isMounted) return;
        
        console.log('État d\'authentification:', authenticated);
        setIsAuthenticated(authenticated);
        
        // Si authentifié, récupérer les infos utilisateur
        if (authenticated) {
          try {
            const userData = await authService.getCurrentUser();
            if (!isMounted) return;
            console.log('Données utilisateur récupérées:', userData);
            setUser(userData);
          } catch (userError) {
            console.error('Erreur récupération utilisateur:', userError);
            if (isMounted) {
              // Si on ne peut pas récupérer l'utilisateur, on réinitialise l'auth
              setIsAuthenticated(false);
              setUser(null);
            }
          }
        } else {
          setUser(null);
        }
        
        setAuthError(null);
      } catch (error) {
        console.error(`Erreur lors de l'initialisation de l'authentification (tentative ${authCheckRetries + 1}/3):`, error);
        
        if (!isMounted) return;
        
        // Gérer les erreurs réseau avec des tentatives
        if (authCheckRetries < 2) {
          console.log(`Nouvelle tentative dans 2 secondes (${authCheckRetries + 1}/3)...`);
          setAuthCheckRetries(prev => prev + 1);
          
          // Planifier une nouvelle tentative
          retryTimeout = setTimeout(() => {
            initAuth();
          }, 2000);
          
          return; // Ne pas terminer l'initialisation maintenant
        }
        
        // Après 3 tentatives, supposer non authentifié
        setIsAuthenticated(false);
        setUser(null);
        setAuthError('Impossible de vérifier l\'authentification. Veuillez réessayer.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setInitAttempted(true);
          console.log('Initialisation de l\'authentification terminée');
        }
      }
    };

    initAuth();
    
    // Nettoyage en cas de démontage du composant
    return () => {
      isMounted = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [authCheckRetries]);

  const login = async (login, password) => {
    try {
      setIsLoading(true);
      setAuthError(null);
      console.log('Tentative de connexion...');
      
      const result = await authService.login(login, password);
      if (result.success) {
        console.log('Connexion réussie');
        setUser(result.user);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        console.log('Échec de connexion:', result.message);
        setAuthError(result.message || 'Échec de connexion');
        return { success: false, message: result.message };
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Échec de connexion';
      console.error('Erreur de connexion:', errorMsg, error);
      setAuthError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      console.log('Tentative de déconnexion...');
      await authService.logout();
      console.log('Déconnexion réussie');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      
      // Rediriger vers la page de connexion après déconnexion
      window.location.href = '/cosmetest/login';
    }
  };

  const refreshAuth = async () => {
    try {
      console.log('Rafraîchissement de l\'état d\'authentification...');
      const authenticated = await authService.isAuthenticated();
      
      if (authenticated && !isAuthenticated) {
        // Était déconnecté, maintenant connecté
        const userData = await authService.getCurrentUser();
        setUser(userData);
        setIsAuthenticated(true);
        console.log('Authentification restaurée');
      } else if (!authenticated && isAuthenticated) {
        // Était connecté, maintenant déconnecté
        setUser(null);
        setIsAuthenticated(false);
        console.log('Session expirée');
      }
      
      return authenticated;
    } catch (error) {
      console.error('Erreur lors du rafraîchissement de l\'authentification:', error);
      return isAuthenticated; // Conserver l'état actuel en cas d'erreur
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    authError,
    initAttempted,
    login,
    logout,
    refreshAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;