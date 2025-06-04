/**
 * Utilitaires pour la gestion des erreurs dans l'application
 */

/**
 * Traite une erreur provenant d'une requête API
 * @param {Error} error - L'erreur à traiter
 * @param {string} defaultMessage - Message par défaut si aucun message d'erreur n'est disponible
 * @returns {Promise<never>} - Rejette toujours avec un message d'erreur formaté
 */
export const handleError = (error, defaultMessage = 'Une erreur est survenue') => {
    console.error('Erreur API:', error);
    
    // Si l'erreur vient d'Axios
    if (error.response) {
      // Le serveur a répondu avec un code d'erreur
      const serverError = error.response.data;
      
      // Si le serveur a renvoyé un message d'erreur spécifique
      if (serverError && serverError.message) {
        return Promise.reject(serverError.message);
      }
      
      // Sinon, on utilise un message basé sur le code de statut
      const statusMessage = getStatusMessage(error.response.status);
      return Promise.reject(statusMessage);
    } else if (error.request) {
      // La requête a été faite mais aucune réponse n'a été reçue
      return Promise.reject('Aucune réponse du serveur. Vérifiez votre connexion Internet.');
    } else {
      // Une erreur s'est produite lors de la configuration de la requête
      return Promise.reject(error.message || defaultMessage);
    }
  };
  
  /**
   * Obtient un message d'erreur en fonction du code de statut HTTP
   * @param {number} status - Le code de statut HTTP
   * @returns {string} - Un message d'erreur approprié
   */
  const getStatusMessage = (status) => {
    switch (status) {
      case 400:
        return 'Requête incorrecte. Veuillez vérifier les données saisies.';
      case 401:
        return 'Non autorisé. Veuillez vous reconnecter.';
      case 403:
        return 'Accès refusé. Vous n\'avez pas les droits nécessaires.';
      case 404:
        return 'Ressource non trouvée.';
      case 500:
        return 'Erreur serveur. Veuillez réessayer plus tard.';
      default:
        return `Erreur (${status}). Veuillez réessayer ou contacter l'administrateur.`;
    }
  };
  
  /**
   * Vérifie si une erreur est due à une expiration de session ou d'authentification
   * @param {Error} error - L'erreur à vérifier
   * @returns {boolean} - True si l'erreur est liée à l'authentification
   */
  export const isAuthError = (error) => {
    return error.response && (error.response.status === 401 || error.response.status === 403);
  };
  
  export default {
    handleError,
    isAuthError
  };