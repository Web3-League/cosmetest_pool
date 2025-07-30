// src/services/searchService.js
import axios from 'axios';

/**
 * Service optimisé pour la recherche utilisant le backend Meilisearch
 */
const searchService = {
  /**
   * Recherche des études par référence (utilise Meilisearch en backend)
   * @param {string} reference - Référence d'étude recherchée
   * @param {number} page - Numéro de page (à partir de 0)
   * @param {number} size - Taille de la page
   * @returns {Promise<Object>} Résultats paginés
   */
  searchByEtudeRef: async (reference, page = 0, size = 50) => {
    try {
      const response = await axios.get('/api/rdvs/search', {
        params: {
          etudeRef: reference,
          page,
          size: Math.min(size, 50),
          sort: 'date,desc'
        },
        timeout: 10000 // 10 secondes
      });
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la recherche par référence:', error);
      throw error;
    }
  },
  
  /**
   * Récupère les suggestions d'études pour l'autocomplétion
   * @param {string} query - Texte de recherche
   * @returns {Promise<Array>} Liste de suggestions
   */

  async getEtudeSuggestions(query) {
    try {
      console.log('Recherche de suggestions:', query);
      const response = await axios.get(`/api/etudes/suggest`, {
        params: { 
          q: query,
          limit: 10 
        }
      });
      
      console.log('Suggestions reçues:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur de suggestion:', error);
      return [];
    }
  }
};

export default searchService;