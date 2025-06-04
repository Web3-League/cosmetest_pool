// ============================================================
// authService.js - Service d'authentification
// ============================================================

import api from './api';

const authService = {
  /**
   * Envoie les identifiants (login + motDePasse) au backend.
   * Le backend renvoie un cookie HttpOnly (Set-Cookie: jwt=...).
   */
  async login(login, motDePasse) {
    try {
      console.log('Tentative de connexion avec:', { login });

      // Format JSON attendu par le backend
      const loginData = { login, motDePasse };

      // Requête d'authentification
      const response = await api.post('/auth/login', loginData);
      console.log('Réponse d\'authentification:', response.data);

      // Si le backend répond 200 => connexion réussie
      if (response.status === 200) {
        // Facultatif : le backend peut renvoyer l'objet user
        return { success: true, user: response.data.user };
      } else {
        return { success: false, message: 'Authentification échouée' };
      }
    } catch (error) {
      console.error('Erreur d\'authentification:', error.response || error);
      return {
        success: false,
        message: error.response?.data?.message || 'Échec de connexion'
      };
    }
  },

  /**
   * Informe le backend qu'on se déconnecte.
   * Le backend doit expirer le cookie JWT (Set-Cookie: jwt=; Max-Age=0).
   */
  async logout() {
    try {
      await api.post('/auth/logout');
      return true;
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      return false;
    }
  },

  /**
   * Récupère l'utilisateur actuel.
   * Comme on ne stocke plus rien dans localStorage,
   * on fait un appel API pour obtenir les informations utilisateur.
   */
  async getCurrentUser() {
    try {
      const response = await api.get('/users/me');
      return response.data;
    } catch (error) {
      console.error('Impossible de récupérer l\'utilisateur:', error);
      return null;
    }
  },

  /**
   * Vérifie si on est authentifié, en interrogeant /auth/validate.
   */
  async isAuthenticated() {
    try {
      const response = await api.get('/auth/validate');
      // Si nous recevons une réponse positive et pas "Non authentifié"
      return response.status === 200 && response.data !== "Non authentifié";
    } catch (error) {
      console.error('Erreur de validation d\'authentification:', error);
      return false;
    }
  }
};

export default authService;