// src/services/rdvService.js
import api from './api';

const API_URL = '/rdvs';
const ETUDES_URL = '/etudes';

const rdvService = {
  // Récupérer les rendez-vous avec pagination
  getPaginated: async (page = 0, size = 10, sort = 'date,desc') => {
    const response = await api.get(`${API_URL}/paginated`, {
      params: {
        page,
        size: Math.min(size, 50), // Limit max page size
        sort
      }
    });
    return response.data;
  },

  // Récupérer un rendez-vous spécifique
  getById: async (idEtude, idRdv) => {
    const response = await api.get(`${API_URL}/${idEtude}/${idRdv}`);
    return response.data;
  },

  // Créer un nouveau rendez-vous
  create: async (rdvData) => {
    const response = await api.post(API_URL, rdvData);
    return response.data;
  },

  // Mettre à jour un rendez-vous
  update: async (idEtude, idRdv, rdvData) => {
    // Ensure IDs in the path match those in the DTO as expected by the backend
    rdvData.idEtude = idEtude;
    rdvData.idRdv = idRdv;
    
    const response = await api.put(`${API_URL}/${idEtude}/${idRdv}`, rdvData);
    return response.data;
  },

  // Mettre à jour uniquement le statut d'un rendez-vous
  updateStatus: async (idEtude, idRdv, nouvelEtat) => {
    try {
      // Modified to match the Spring controller endpoint
      const response = await api.patch(`${API_URL}/${idEtude}/${idRdv}/etat`, null, {
        params: { nouvelEtat }
      });
      
      // Log successful response for debugging
      console.log('Status update successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('Status update error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url
      });
      throw error;
    }
  },

  // Supprimer un rendez-vous
  delete: async (idEtude, idRdv) => {
    const response = await api.delete(`${API_URL}/${idEtude}/${idRdv}`);
    return response.data;
  },

  // Récupérer les rendez-vous par volontaire
  getByVolontaire: async (idVolontaire) => {
    const response = await api.get(`${API_URL}/by-volontaire/${idVolontaire}`);
    return response.data;
  },

  // Recherche optimisée avec filtres multiples
  search: async (criteria, page = 0, size = 10, sort = 'date,desc') => {
    try {
      // Validate and sanitize input criteria
      const sanitizedCriteria = Object.entries(criteria)
        .reduce((acc, [key, value]) => {
          // Remove undefined or null values
          if (value !== undefined && value !== null && value !== '') {
            // Additional validation based on key type
            switch (key) {
              case 'idEtude':
              case 'idVolontaire': {
                // Ensure it's a positive integer
                const numValue = Number(value);
                if (Number.isInteger(numValue) && numValue > 0) {
                  acc[key] = numValue;
                }
                break;
              }
              case 'date':
                // Basic date format validation
                if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                  acc[key] = value;
                }
                break;
              case 'etat': {
                // Validate against known statuses
                const validStatuses = ['CONFIRME', 'EN_ATTENTE', 'ANNULE', 'COMPLETE', 'PLANIFIE'];
                const normalizedStatus = String(value).toUpperCase();
                if (validStatuses.includes(normalizedStatus)) {
                  acc[key] = normalizedStatus;
                }
                break;
              }
              default:
                // For other keys, add as-is
                acc[key] = value;
            }
          }
          return acc;
        }, {});
  
      const params = {
        page: Math.max(0, page),
        size: Math.min(size, 50),
        sort,
        ...sanitizedCriteria
      };
  
      const response = await api.get(`${API_URL}/search`, { 
        params,
        timeout: 10000, // 10-second timeout
        validateStatus: (status) => status >= 200 && status < 300 
      });
  
      return response.data;
    } catch (error) {
      // Detailed error logging
      console.error('Detailed Search Error:', {
        message: error.message,
        name: error.name,
        code: error.code,
        config: error.config ? {
          url: error.config.url,
          method: error.config.method,
          params: error.config.params
        } : null,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data
        } : null
      });
  
      // Specific error handling
      if (error.code === 'ERR_NETWORK') {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
  
      if (error.response) {
        // Handle specific HTTP error statuses
        switch (error.response.status) {
          case 400:
            throw new Error('Paramètres de recherche invalides');
          case 404:
            throw new Error('Aucun résultat trouvé');
          case 429:
            throw new Error('Trop de requêtes. Veuillez patienter.');
          case 500:
            throw new Error('Erreur serveur. Veuillez réessayer plus tard.');
          default:
            throw new Error(`Erreur ${error.response.status}: ${error.response.data.message || 'Une erreur est survenue'}`);
        }
      }
  
      // Generic fallback error
      throw new Error('Une erreur est survenue lors de la recherche. Veuillez réessayer.');
    }
  },
  
  // Méthodes simplifiées pour différents types de recherche
  searchByEtude: async (idEtude, page = 0, size = 10) => {
    // Ensure idEtude is a positive integer
    const sanitizedIdEtude = Number.isInteger(Number(idEtude)) && Number(idEtude) > 0 
      ? Number(idEtude) 
      : null;
  
    if (!sanitizedIdEtude) {
      throw new Error('ID de l\'étude invalide');
    }
  
    return rdvService.search({ idEtude: sanitizedIdEtude }, page, size);
  },
  
  searchByVolontaire: async (idVolontaire, page = 0, size = 10) => {
    // Ensure idVolontaire is a positive integer
    const sanitizedIdVolontaire = Number.isInteger(Number(idVolontaire)) && Number(idVolontaire) > 0 
      ? Number(idVolontaire) 
      : null;
  
    if (!sanitizedIdVolontaire) {
      throw new Error('ID du volontaire invalide');
    }
  
    return rdvService.search({ idVolontaire: sanitizedIdVolontaire }, page, size);
  },
  
  searchByDate: async (date, page = 0, size = 10) => {
    return rdvService.search({ date }, page, size);
  },
  
  searchByEtat: async (etat, page = 0, size = 10) => {
    return rdvService.search({ etat }, page, size);
  },
  
  searchByKeyword: async (keyword, page = 0, size = 10) => {
    return rdvService.search({ keyword }, page, size);
  },

  searchByEtudeRef: async (etudeRef, page = 0, size = 10) => {
    return rdvService.search({ etudeRef }, page, size);
  },
  
  // Récupérer les études avec leur nombre de rendez-vous (pagination)
  getStudiesWithRdvCount: async (page = 0, size = 10, query = '', sort = 'ref,asc', useMeilisearch = false, sortByLatestRdvDate = false) => {
    try {
      const response = await api.get(`${API_URL}/studies-with-count`, {
        params: {
          page,
          size,
          query,
          sort,
          useMeilisearch,
          sortByLatestRdvDate
        },
        timeout: 15000 // Augmenter le timeout car ce calcul peut prendre du temps
      });
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors du chargement des études avec comptage de RDV:', error);
      
      // En cas d'erreur, implémenter une stratégie de repli
      console.log('Tentative de repli sur la méthode alternative...');
      
      try {
        // Récupérer les études paginées
        let etudesResponse;
        if (query && query.trim() !== '') {
          // Recherche avec terme
          etudesResponse = await api.get(`${ETUDES_URL}/search`, {
            params: {
              query: query.trim(),
              page,
              size,
              sort
            }
          });
        } else {
          // Sans recherche
          etudesResponse = await api.get(`${ETUDES_URL}/paginated`, {
            params: {
              page,
              size,
              sort
            }
          });
        }

        // Extraire les études et les informations de pagination
        const etudes = etudesResponse.data.content || etudesResponse.data || [];
        const totalElements = etudesResponse.data.totalElements || etudes.length;
        const totalPages = etudesResponse.data.totalPages || Math.ceil(totalElements / size);

        // Pour chaque étude, récupérer le nombre de rendez-vous
        const studiesWithRdvCount = await Promise.all(etudes.map(async etude => {
          try {
            const idEtude = etude.idEtude || etude.id;
            const response = await rdvService.searchByEtude(idEtude, 0, 1);
            
            // Extraire le nombre total de rendez-vous
            const totalRdvs = response.totalElements || 0;
            
            return { 
              ...etude,
              id: idEtude,
              ref: etude.ref || `Étude ID: ${idEtude}`,
              titre: etude.titre,
              rdvCount: totalRdvs
            };
          } catch (error) {
            console.error(`Erreur pour l'étude ${etude.idEtude || etude.id}:`, error);
            return { 
              ...etude,
              id: etude.idEtude || etude.id,
              ref: etude.ref || `Étude ID: ${etude.idEtude || etude.id}`,
              titre: etude.titre,
              rdvCount: 0
            };
          }
        }));

        return {
          content: studiesWithRdvCount,
          page,
          size,
          totalElements,
          totalPages
        };
      } catch (fallbackError) {
        console.error('Échec du mécanisme de repli:', fallbackError);
        throw error; // Renvoyer l'erreur originale
      }
    }
  },

  // Récupérer les rendez-vous par étude
  getByEtudeId: async (idEtude) => {
    // Simplification - utiliser la méthode searchByEtude existante
    const result = await rdvService.searchByEtude(idEtude, 0, 100);
    return result.content || [];
  },

  // Vérification de la santé de l'index de recherche
  checkSearchHealth: async () => {
    try {
      const response = await api.get(`${API_URL}/admin/search-health`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'état de recherche:', error);
      return { status: 'error', message: error.message };
    }
  },

  // Réindexation des études (admin)
  reindexEtudes: async () => {
    try {
      const response = await api.post(`${API_URL}/admin/reindex-etudes`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la réindexation des études:', error);
      throw error;
    }
  },

  // Récupérer les rendez-vous par période
  getRdvsByPeriod: async (startDate, endDate) => {
    try {
      // Format des dates: YYYY-MM-DD
      const response = await api.get(`${API_URL}/search`, {
        params: {
          startDate,
          endDate
        }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des RDVs par période:', error);
      throw error;
    }
  },

  // Récupérer les études avec le nombre de rendez-vous
  getEtudesWithRdvCount: async () => {
    try {
      const response = await api.get(`${API_URL}/etudes/with-rdv-count`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des études avec compte de RDV:', error);
      throw error;
    }
  }
};

export default rdvService;