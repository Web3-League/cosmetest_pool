import api from './api';
import { handleError } from '../utils/errorUtils';

const API_URL = '/groupes';

/**
 * Service pour gérer les opérations liées aux groupes
 */
const groupeService = {
  /**
   * Récupère tous les groupes
   * @returns {Promise<Array>} Liste des groupes
   */
  getAll: async () => {
    try {
      const response = await api.get(API_URL);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Récupère un groupe par son ID
   * @param {number} id - L'ID du groupe
   * @returns {Promise<Object>} Le groupe correspondant
   */
  getById: async (id) => {
    try {
      // Vérifier si l'ID est valide avant d'envoyer la requête
      if (!id || id === 'undefined') {
        return Promise.reject(new Error('ID de groupe non valide'));
      }
      
      console.log(`Requête API vers: ${API_URL}/${id}`); // Débogage
      const response = await api.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      return handleError(error, `Erreur lors de la récupération du groupe avec l'ID: ${id}`);
    }
  },

  /**
   * Récupère les groupes d'une étude spécifique
   * @param {number} idEtude - L'ID de l'étude
   * @returns {Promise<Array>} Liste des groupes de l'étude
   */
  getGroupesByIdEtude: async (idEtude) => {
    try {
      const response = await api.get(`${API_URL}/etude/${idEtude}`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Récupère les groupes par tranche d'âge
   * @param {number|null} ageMin - L'âge minimum (optionnel)
   * @param {number|null} ageMax - L'âge maximum (optionnel)
   * @returns {Promise<Array>} Liste des groupes correspondants
   */
  getGroupesByAgeRange: async (ageMin, ageMax) => {
    try {
      let url = `${API_URL}/filtrerParAge`;
      const params = new URLSearchParams();
      
      if (ageMin !== null) params.append('ageMin', ageMin);
      if (ageMax !== null) params.append('ageMax', ageMax);
      
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Récupère les groupes par ethnie
   * @param {string} ethnie - L'ethnie recherchée
   * @returns {Promise<Array>} Liste des groupes correspondants
   */
  getGroupesByEthnie: async (ethnie) => {
    try {
      const response = await api.get(`${API_URL}/ethnie/${ethnie}`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Recherche des groupes selon un critère
   * @param {string} query - Le critère de recherche
   * @returns {Promise<Array>} Liste des groupes correspondants
   */
  search: async (query) => {
    try {
      // Supposons qu'il y a un endpoint de recherche, sinon on fait une recherche côté client
      // sur tous les groupes
      const response = await api.get(`${API_URL}?search=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      // Si l'endpoint de recherche n'existe pas, on récupère tous les groupes
      // et on filtre côté client
      console.warn("Endpoint de recherche non disponible, filtrage côté client");
      
      const allGroupes = await groupeService.getAll();
      const searchLower = query.toLowerCase();
      
      return allGroupes.filter(groupe => 
        (groupe.nom && groupe.nom.toLowerCase().includes(searchLower)) || 
        (groupe.ethnie && groupe.ethnie.toLowerCase().includes(searchLower)) ||
        (groupe.description && groupe.description.toLowerCase().includes(searchLower))
      );
    }
  },

  /**
   * Récupère les groupes avec pagination
   * @param {number} page - Numéro de page
   * @param {number} size - Nombre d'éléments par page
   * @param {string} sortBy - Champ de tri
   * @param {string} direction - Direction du tri ('ASC' ou 'DESC')
   * @returns {Promise<Object>} Page de groupes
   */
  getPaginated: async (page, size, sortBy = 'id', direction = 'ASC') => {
    try {
      const response = await api.get(
        `${API_URL}?page=${page}&size=${size}&sort=${sortBy},${direction}`
      );
      return response.data;
    } catch (error) {
      // Si la pagination n'est pas disponible sur le backend, on simule côté client
      console.warn("Pagination non disponible, simulation côté client");
      
      const allGroupes = await groupeService.getAll();
      
      // Tri
      allGroupes.sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        
        if (direction === 'ASC') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
      
      // Pagination
      const start = page * size;
      const end = start + size;
      const paginatedGroupes = allGroupes.slice(start, end);
      
      return {
        content: paginatedGroupes,
        totalElements: allGroupes.length,
        totalPages: Math.ceil(allGroupes.length / size),
        size: size,
        number: page,
        first: page === 0,
        last: (page + 1) * size >= allGroupes.length
      };
    }
  },

  /**
   * Crée un nouveau groupe
   * @param {Object} groupe - Données du groupe à créer
   * @returns {Promise<Object>} Le groupe créé
   */
  create: async (groupe) => {
    try {
      const response = await api.post(API_URL, groupe);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Met à jour un groupe existant
   * @param {number} id - L'ID du groupe à mettre à jour
   * @param {Object} groupe - Nouvelles données du groupe
   * @returns {Promise<Object>} Le groupe mis à jour
   */
  update: async (id, groupe) => {
    try {
      const response = await api.put(`${API_URL}/${id}`, groupe);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Supprime un groupe
   * @param {number} id - L'ID du groupe à supprimer
   * @returns {Promise<boolean>} Statut de la suppression
   */
  delete: async (id) => {
    try {
      await api.delete(`${API_URL}/${id}`);
      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  }
};

export default groupeService;