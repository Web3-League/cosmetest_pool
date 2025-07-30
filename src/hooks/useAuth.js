import { useContext, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Hook personnalisé pour utiliser le contexte d'authentification
 * @returns {Object} Objet avec toutes les propriétés et méthodes d'authentification
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }

  // Ajouter des vérifications de sécurité
  const {
    user,
    isAuthenticated,
    isLoading,
    authError,
    initAttempted,
    login,
    logout,
    refreshAuth,
    hasPermission
  } = context;

  // S'assurer que isAuthenticated est toujours un booléen
  const safeIsAuthenticated = Boolean(isAuthenticated);

  // Fonctions utilitaires memoizées pour les rôles
  const roleHelpers = useMemo(() => {
    const userRole = user?.role;
    
    return {
      isAdmin: () => {
        if (!safeIsAuthenticated || !user) return false;
        
        // Vérifications multiples pour la robustesse
        // userRole peut être un nombre (2) ou une string
        const isAdminByRole = userRole === 2 || userRole === 'admin' || userRole === 'administrateur';
        const isAdminByPermission = hasPermission && hasPermission('admin');
        
        console.log('🔍 useAuth.isAdmin - Vérification:', {
          userRole,
          typeOfRole: typeof userRole,
          isAdminByRole,
          isAdminByPermission,
          hasPermissionFunc: !!hasPermission
        });
        
        return isAdminByRole || isAdminByPermission;
      },
      
      isUser: () => {
        if (!safeIsAuthenticated || !user) return false;
        return userRole === 1 || userRole === 'user' || userRole === 'utilisateur';
      },
      
      canAccess: (requiredRole = null) => {
        if (!safeIsAuthenticated) return false;
        if (!requiredRole) return true;
        
        // Normaliser le rôle requis
        const normalizedRequired = requiredRole.toLowerCase();
        
        // Vérifier par rôle direct
        if (normalizedRequired === 'admin' || normalizedRequired === 'administrateur') {
          return roleHelpers.isAdmin();
        }
        
        if (normalizedRequired === 'user' || normalizedRequired === 'utilisateur') {
          return roleHelpers.isUser();
        }
        
        // Utiliser hasPermission si disponible
        return hasPermission ? hasPermission(requiredRole) : false;
      }
    };
  }, [safeIsAuthenticated, user, hasPermission]);

  return {
    // États
    user,
    isAuthenticated: safeIsAuthenticated,
    isLoading: Boolean(isLoading),
    authError,
    initAttempted: Boolean(initAttempted),
    
    // Actions
    login,
    logout,
    refreshAuth,
    
    // Fonctions utilitaires pour les permissions
    isAdmin: roleHelpers.isAdmin,
    isUser: roleHelpers.isUser,
    hasPermission: hasPermission || (() => false),
    canAccess: roleHelpers.canAccess,
    
    // États dérivés
    isReady: Boolean(initAttempted && !isLoading),
    hasUser: Boolean(user && user.login),
    userRole: user?.role || null,
    username: user?.login || null,
    
    // Informations de débogage
    debugInfo: {
      userRole: user?.role,
      isAuthenticated: safeIsAuthenticated,
      hasPermissionFunc: !!hasPermission,
      contextAvailable: !!context
    }
  };
};

export default useAuth;