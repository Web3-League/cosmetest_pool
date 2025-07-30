import React, { useContext, useEffect, useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole = null, redirectTo = '/login' }) => {
  const authContext = useContext(AuthContext);
  const [shouldRender, setShouldRender] = useState('loading');

  useEffect(() => {
    if (!authContext) {
      console.error('ProtectedRoute doit être utilisé dans un AuthProvider');
      setShouldRender('error');
      return;
    }

    const { 
      isAuthenticated, 
      isLoading, 
      initAttempted, 
      user,
      hasPermission 
    } = authContext;

    console.log('🔐 ProtectedRoute - État:', {
      isAuthenticated, isLoading, initAttempted, 
      hasUser: !!user, userRole: user?.role, requiredRole
    });

    if (!initAttempted || isLoading) {
      setShouldRender('loading');
      return;
    }

    if (isAuthenticated === false) {
      console.log('🚫 ProtectedRoute - Redirection vers login');
      setShouldRender('redirect-login');
      return;
    }

    if (isAuthenticated === true && requiredRole && !hasPermission(requiredRole)) {
      console.log('🚫 ProtectedRoute - Permissions insuffisantes');
      setShouldRender('redirect-unauthorized');
      return;
    }

    if (isAuthenticated === true) {
      console.log('✅ ProtectedRoute - Accès autorisé');
      setShouldRender('authorized');
    } else {
      setShouldRender('error');
    }

  }, [authContext, requiredRole, redirectTo]);

  // Loading
  if (shouldRender === 'loading') {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        <div>Vérification de l'authentification...</div>
      </div>
    );
  }

  // Redirections
  if (shouldRender === 'redirect-login') {
    return <Navigate to={redirectTo} replace />;
  }

  if (shouldRender === 'redirect-unauthorized') {
    return <Navigate to="/unauthorized" replace />;
  }

  // Erreur
  if (shouldRender === 'error') {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column'
      }}>
        <div>Erreur d'authentification</div>
        <button onClick={() => window.location.reload()}>Recharger</button>
      </div>
    );
  }

  // Accès autorisé - IMPORTANT: Utiliser Outlet pour les routes imbriquées
  if (shouldRender === 'authorized') {
    // Si des children sont passés directement (ancienne méthode)
    if (children) {
      return children;
    }
    // Sinon utiliser Outlet pour les routes imbriquées (nouvelle méthode)
    return <Outlet />;
  }

  return null;
};

export default ProtectedRoute;