// ============================================================
// AuthContext.js - Contexte d'authentification CORRIGÉ
// ============================================================
import { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // IMPORTANT: Initialiser avec des valeurs par défaut explicites
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Toujours booléen
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [initAttempted, setInitAttempted] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let initializationDone = false;
    
    const initAuth = async (attempt = 1, maxAttempts = 3) => {
      // Éviter les appels multiples
      if (initializationDone) return;
      
      try {
        console.log(`🔄 Initialisation de l'authentification (tentative ${attempt}/${maxAttempts})...`);
        
        // Vérifier l'authentification
        const authenticated = await authService.isAuthenticated();
        
        if (!isMounted) return;
        
        console.log('🔐 État d\'authentification:', authenticated);
        
        if (authenticated === true) {
          try {
            const userData = await authService.getCurrentUser();
            
            if (!isMounted) return;
            
            if (userData && userData.login) {
              console.log('👤 Données utilisateur récupérées:', userData);
              console.log('🔍 Analyse des données utilisateur:', {
                hasLogin: !!userData.login,
                hasNom: !!userData.nom,
                hasRole: !!userData.role,
                roleType: typeof userData.role,
                roleValue: userData.role,
                hasAuthorities: !!userData.authorities,
                authoritiesValue: userData.authorities,
                allKeys: Object.keys(userData)
              });
              
              // S'assurer que le rôle est un nombre
              let userRole = userData.role;
              if (typeof userRole === 'string') {
                userRole = parseInt(userRole, 10);
              }
              if (isNaN(userRole) || userRole === null || userRole === undefined) {
                console.log('⚠️ Rôle non défini, utilisation du rôle par défaut (1)');
                userRole = 1;
              }
              
              // Créer un objet utilisateur normalisé
              const normalizedUser = {
                ...userData,
                role: userRole
              };
              
              console.log('👤 Utilisateur normalisé:', normalizedUser);
              console.log('🔍 Vérification finale:', {
                hasLogin: !!normalizedUser.login,
                hasRole: normalizedUser.role !== undefined,
                roleValue: normalizedUser.role,
                willSetAuthenticated: true
              });
              
              setUser(normalizedUser);
              setIsAuthenticated(true);
              console.log('✅ État mis à jour: authenticated=true, user set');
            } else {
              console.log('⚠️ Données utilisateur invalides');
              setUser(null);
              setIsAuthenticated(false);
            }
          } catch (userError) {
            console.error('❌ Erreur récupération utilisateur:', userError);
            if (isMounted) {
              setIsAuthenticated(false);
              setUser(null);
            }
          }
        } else {
          // Authentification échouée
          console.log('❌ Non authentifié');
          setUser(null);
          setIsAuthenticated(false);
        }
        
        // Succès - terminer l'initialisation
        setAuthError(null);
        initializationDone = true;
        
      } catch (error) {
        console.error(`❌ Erreur lors de l'initialisation (tentative ${attempt}/${maxAttempts}):`, error);
        
        if (!isMounted) return;
        
        // Gérer les erreurs réseau avec des tentatives
        if (attempt < maxAttempts) {
          console.log(`🔄 Nouvelle tentative dans 2 secondes...`);
          
          // Programmer une nouvelle tentative
          setTimeout(() => {
            if (isMounted && !initializationDone) {
              initAuth(attempt + 1, maxAttempts);
            }
          }, 2000);
          
          return; // Ne pas terminer l'initialisation maintenant
        }
        
        // Après toutes les tentatives, supposer non authentifié
        console.log('❌ Toutes les tentatives ont échoué - considéré comme non authentifié');
        setIsAuthenticated(false);
        setUser(null);
        setAuthError('Impossible de vérifier l\'authentification. Veuillez réessayer.');
        initializationDone = true;
      } finally {
        if (isMounted && initializationDone) {
          setIsLoading(false);
          setInitAttempted(true);
          console.log('🏁 Initialisation de l\'authentification terminée');
          
          // Utiliser un setTimeout pour accéder aux valeurs d'état mises à jour
          setTimeout(() => {
            console.log('📊 État final vérifié:', { 
              isAuthenticated: isAuthenticated, 
              hasUser: !!user,
              userLogin: user?.login 
            });
          }, 100);
        }
      }
    };

    // Démarrer l'initialisation
    initAuth();
    
    // Nettoyage en cas de démontage du composant
    return () => {
      isMounted = false;
    };
  }, []); // Dépendances vides pour éviter les re-exécutions

  const login = async (loginData, password) => {
    try {
      setIsLoading(true);
      setAuthError(null);
      console.log('🔑 Tentative de connexion...');
      
      const result = await authService.login(loginData, password);
      
      if (result.success && result.user) {
        console.log('✅ Connexion réussie');
        setUser(result.user);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        console.log('❌ Échec de connexion:', result.message);
        setAuthError(result.message || 'Échec de connexion');
        setIsAuthenticated(false);
        setUser(null);
        return { success: false, message: result.message };
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Échec de connexion';
      console.error('❌ Erreur de connexion:', errorMsg, error);
      setAuthError(errorMsg);
      setIsAuthenticated(false);
      setUser(null);
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      console.log('🚪 Tentative de déconnexion...');
      
      await authService.logout();
      console.log('✅ Déconnexion réussie');
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error);
    } finally {
      // TOUJOURS réinitialiser l'état même en cas d'erreur
      setUser(null);
      setIsAuthenticated(false);
      setAuthError(null);
      setIsLoading(false);
      
      // Rediriger vers la page de connexion après déconnexion
      window.location.href = '/cosmetest/login';
    }
  };

  const refreshAuth = async () => {
    try {
      console.log('🔄 Rafraîchissement de l\'état d\'authentification...');
      const authenticated = await authService.isAuthenticated();
      
      if (authenticated === true && !isAuthenticated) {
        // Était déconnecté, maintenant connecté
        const userData = await authService.getCurrentUser();
        if (userData && userData.login) {
          setUser(userData);
          setIsAuthenticated(true);
          console.log('✅ Authentification restaurée');
        }
      } else if (authenticated === false && isAuthenticated) {
        // Était connecté, maintenant déconnecté
        setUser(null);
        setIsAuthenticated(false);
        console.log('❌ Session expirée');
      }
      
      return authenticated;
    } catch (error) {
      console.error('❌ Erreur lors du rafraîchissement de l\'authentification:', error);
      return isAuthenticated; // Conserver l'état actuel en cas d'erreur
    }
  };

  // Fonctions utilitaires pour les rôles
  const isAdmin = () => {
    const result = user?.role === 2;
    console.log('🔍 isAdmin():', result, 'Rôle utilisateur:', user?.role);
    return result;
  };
  
  const isUser = () => {
    const result = user?.role === 1;
    console.log('🔍 isUser():', result, 'Rôle utilisateur:', user?.role);
    return result;
  };
  
  const hasPermission = (requiredRole) => {
    if (!user?.role) {
      console.log('🔍 hasPermission(): false (pas de rôle utilisateur)');
      return false;
    }
    
    let result = false;
    if (Array.isArray(requiredRole)) {
      result = requiredRole.includes(user.role);
    } else {
      if (requiredRole === 1 && user.role >= 1) result = true;
      if (requiredRole === 2 && user.role === 2) result = true;
    }
    
    console.log('🔍 hasPermission(' + JSON.stringify(requiredRole) + '):', result, 'Rôle utilisateur:', user.role);
    return result;
  };

  const value = {
    user,
    isAuthenticated, // Sera TOUJOURS true ou false, jamais undefined
    isLoading,
    authError,
    initAttempted,
    login,
    logout,
    refreshAuth,
    isAdmin,
    isUser,
    hasPermission
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;