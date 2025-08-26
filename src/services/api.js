// ============================================================
// api.js - Service de base pour les requêtes API
// ============================================================

import axios from 'axios';

// Créer une instance d'axios avec la configuration de base
const api = axios.create({
  baseURL: 'http://localhost:8888/api',// || 'http://localhost:8888/api', // Ajustez selon l'URL de votre API
  withCredentials: true,               // Indispensable pour envoyer/recevoir les cookies cross-site
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur de requête : log pour debug
api.interceptors.request.use(
  (config) => {
    console.log('Requête API:', {
      url: config.url,
      method: config.method,
      data: config.data
    });
    
    return config;
  },
  (error) => {
    console.error('Erreur de requête API:', error);
    return Promise.reject(error);
  }
);

// Intercepteur de réponse : log pour debug et gestion des erreurs d'authentification
api.interceptors.response.use(
  (response) => {
    console.log('Réponse API:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('Erreur de réponse API:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data
    });
    
    // Gérer à la fois 401 (Unauthorized) et 403 (Forbidden)
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Ne pas rediriger si on est déjà sur la page de connexion ou en train de tenter une connexion
      const isAuthPath = window.location.pathname.includes('/cosmetest/login') || 
                         error.config.url.includes('/auth/login') ||
                         error.config.url.includes('/auth/validate');
      
      if (!isAuthPath) {
        console.log('Redirection vers la page de connexion suite à une erreur d\'authentification');
        window.location.href = '/cosmetest/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;