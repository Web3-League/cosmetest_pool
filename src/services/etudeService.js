
// Le reste de votre code service
import api from './api';
import rdvService from './rdvService';

// Correction du préfixe API - suppression du /api pour éviter le doublon
const ETUDES_ENDPOINT = '/etudes';

const etudeService = {

  getById: async (id) => {
    try {
      const response = await api.get(`/etudes/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'étude ${id}:`, error);
      throw error;
    }
  },

  // Récupérer toutes les études
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/etudes', { params });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des études:', error);
      throw error;
    }
  },

  // Récupérer avec pagination
  getPaginated: async (page = 0, size = 10, sortBy = 'dateDebut', direction = 'DESC') => {
    try {
      const response = await api.get('/etudes/paginated', {
        params: { page, size, sortBy, direction }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération paginée des études:', error);
      throw error;
    }
  },

  // Rechercher des études
  search: async (searchTerm) => {
    try {
      const response = await api.get('/etudes/search', {
        params: { searchTerm }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la recherche d\'études:', error);
      throw error;
    }
  },

  // Créer une nouvelle étude
  create: async (etudeData) => {
    try {
      const response = await api.post('/etudes', etudeData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de l\'étude:', error);
      throw error;
    }
  },

  // Mettre à jour une étude
  update: async (id, etudeData) => {
    try {
      const response = await api.put(`/etudes/${id}`, etudeData);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de l'étude ${id}:`, error);
      throw error;
    }
  },

  // Supprimer une étude
  delete: async (id) => {
    try {
      await api.delete(`/etudes/${id}`);
    } catch (error) {
      console.error(`Erreur lors de la suppression de l'étude ${id}:`, error);
      throw error;
    }
  },

  // Récupérer une étude par sa référence
  getByRef: async (ref) => {
    const response = await api.get(`${ETUDES_ENDPOINT}/ref/${ref}`);
    return response.data;
  },


  // Récupérer les études par type
  getByType: async (type) => {
    const response = await api.get(`${ETUDES_ENDPOINT}/type/${type}`);
    return response.data;
  },

  // Récupérer les études par statut de paiement
  getByPaymentStatus: async (paye) => {
    const response = await api.get(`${ETUDES_ENDPOINT}/paye/${paye}`);
    return response.data;
  },

  // Récupérer les études actives
  getActive: async (date = null) => {
    const response = await api.get(`${ETUDES_ENDPOINT}/actives`, {
      params: date ? { date } : {}
    });
    return response.data;
  },

  // Récupérer les études à venir
  getUpcoming: async () => {
    const response = await api.get(`${ETUDES_ENDPOINT}/upcoming`);
    return response.data;
  },

  // Récupérer les études en cours
  getCurrent: async () => {
    const response = await api.get(`${ETUDES_ENDPOINT}/current`);
    return response.data;
  },

  // Récupérer les études terminées
  getCompleted: async () => {
    const response = await api.get(`${ETUDES_ENDPOINT}/completed`);
    return response.data;
  },

  // Récupérer les études entre deux dates
  getByDateRange: async (startDate, endDate) => {
    const response = await api.get(`${ETUDES_ENDPOINT}/date-range`, {
      params: { debut: startDate, fin: endDate }
    });
    return response.data;
  },

  // Vérifier si une référence est déjà utilisée
  checkRefExists: async (ref) => {
    const response = await api.get(`${ETUDES_ENDPOINT}/check-ref/${ref}`);
    return response.data;
  },

  // Compter le nombre d'études par type
  countByType: async (type) => {
    const response = await api.get(`${ETUDES_ENDPOINT}/count/type/${type}`);
    return response.data;
  },



  // Suggestions d'études (utilisant Meilisearch)
  suggest: async (query, limit = 10) => {
    const response = await api.get(`${ETUDES_ENDPOINT}/suggest`, {
      params: { q: query, limit }
    });
    return response.data;
  },

  // Récupérer toutes les études avec le nombre de rendez-vous
  getAllWithRdvCount: async () => {
    try {
      const response = await api.get(ETUDES_ENDPOINT);
      const etudes = response.data;

      const promises = etudes.map(async etude => {
        const idEtude = etude.idEtude || etude.id;
        if (typeof idEtude !== 'number' || idEtude <= 0) {
          console.warn('Étude sans ID valide détectée :', etude);
          return { ...etude, rdvCount: 0 };
        }

        try {
          const rdvs = await rdvService.searchByEtude(idEtude);
          return { ...etude, rdvCount: rdvs.length };
        } catch (error) {
          console.error(`Erreur pour l'étude ${idEtude}:`, error);
          return { ...etude, rdvCount: 0 };
        }
      });

      return await Promise.all(promises);
    } catch (error) {
      console.error('Erreur lors du chargement des études avec RDV count:', error);
      throw error;
    }
  },
};

export default etudeService;