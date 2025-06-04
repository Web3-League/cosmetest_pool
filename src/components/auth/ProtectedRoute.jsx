// ============================================================
// ProtectedRoute.js - Composant pour protéger les routes
// ============================================================

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading, initAttempted } = useAuth();
  const [timeout, setTimeout] = useState(false);
  const location = useLocation();
  
  console.log('ProtectedRoute - État de l\'authentification:', { 
    isAuthenticated, 
    isLoading, 
    initAttempted,
    path: location.pathname 
  });
  
  // Si le chargement prend plus de 5 secondes, supposons qu'il y a un problème
  useEffect(() => {
    // Ne déclencher le timer que si l'initialisation est en cours
    if (isLoading && !timeout) {
      console.log('ProtectedRoute - Démarrage du timer de sécurité...');
      const timer = window.setTimeout(() => {
        console.error('Délai d\'attente dépassé - Forçage de la redirection vers login');
        setTimeout(true);
      }, 5000);
      
      return () => {
        console.log('ProtectedRoute - Annulation du timer de sécurité');
        window.clearTimeout(timer);
      };
    }
  }, [isLoading, timeout]);
  
  // Afficher un indicateur de chargement pendant l'initialisation
  if ((isLoading || !initAttempted) && !timeout) {
    console.log('ProtectedRoute - Affichage du spinner de chargement');
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        <p className="ml-2 text-primary-600">Vérification de l'authentification...</p>
      </div>
    );
  }
  
  // Stocker l'emplacement actuel pour rediriger après connexion
  if (!isAuthenticated || timeout) {
    console.log('ProtectedRoute - Redirection vers login avec chemin retour:', location.pathname);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  console.log('ProtectedRoute - Affichage du contenu protégé');
  return <Outlet />;
};

export default ProtectedRoute;
