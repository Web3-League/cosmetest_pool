
// Le reste de votre code service
import api from './api';
import rdvService from './rdvService';

// Correction du préfixe API - suppression du /api pour éviter le doublon
const ETUDES_ENDPOINT = '/etudes';

const etudeService = {
  // Récupérer toutes les études
  getAll: async (params = {}) => {
    const response = await api.get(ETUDES_ENDPOINT, { params });
    return response.data;
  },

  // Récupérer une étude par son ID
  getById: async (id) => {
    const response = await api.get(`${ETUDES_ENDPOINT}/${id}`);
    return response.data;
  },

  // Récupérer une étude par sa référence
  getByRef: async (ref) => {
    const response = await api.get(`${ETUDES_ENDPOINT}/ref/${ref}`);
    return response.data;
  },

  // Rechercher des études
  search: async (searchTerm) => {
    const response = await api.get(`${ETUDES_ENDPOINT}/search`, {
      params: { searchTerm }
    });
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

  // Créer une nouvelle étude
  create: async (etudeData) => {
    const response = await api.post(ETUDES_ENDPOINT, etudeData);
    return response.data;
  },

  // Mettre à jour une étude existante
  update: async (id, etudeData) => {
    const response = await api.put(`${ETUDES_ENDPOINT}/${id}`, etudeData);
    return response.data;
  },

  // Supprimer une étude
  delete: async (id) => {
    return api.delete(`${ETUDES_ENDPOINT}/${id}`);
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

  // Récupérer les études avec pagination
  getPaginated: async (page = 0, size = 10, sortBy = 'dateDebut', direction = 'DESC') => {
    try {
      console.log(`Appel pagination avec page=${page}, size=${size}`);
      // Utilisez l'objet api importé comme pour les autres méthodes
      const response = await api.get(`${ETUDES_ENDPOINT}/paginated`, {
        params: {
          page,
          size,
          sortBy,
          direction
        }
      });
      console.log('Réponse pagination type:', typeof response.data);
      console.log('Réponse pagination:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur pagination:', error);
      throw error;
    }
  },
};

export default etudeService;