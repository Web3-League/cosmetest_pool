import api from './api';

/**
 * Service pour gérer les opérations de paiement
 */
class PaiementService {
  
  /**
   * Récupérer tous les paiements avec filtres optionnels
   * @param {Object} filters - Filtres à appliquer
   * @param {number} filters.idEtude - ID de l'étude
   * @param {string} filters.dateDebut - Date de début au format YYYY-MM-DD
   * @param {string} filters.dateFin - Date de fin au format YYYY-MM-DD
   * @param {number} filters.statutPaiement - Statut du paiement (0, 1, 2, 3)
   * @returns {Promise<Array>} Liste des paiements
   */
  async getAllPaiements(filters = {}) {
    try {
      const params = {};
      
      if (filters.idEtude) params.idEtude = filters.idEtude;
      if (filters.dateDebut) params.dateDebut = filters.dateDebut;
      if (filters.dateFin) params.dateFin = filters.dateFin;
      if (filters.statutPaiement !== undefined) params.statutPaiement = filters.statutPaiement;
      
      const response = await api.get('/etude-volontaires/paiements', { params });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des paiements:', error);
      throw error;
    }
  }

  /**
   * Récupérer les paiements pour une étude spécifique
   * @param {number} idEtude - ID de l'étude
   * @returns {Promise<Array>} Liste des paiements de l'étude
   */
  async getPaiementsByEtude(idEtude) {
    try {
      const response = await api.get(`/etude-volontaires/etude/${idEtude}/paiements`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des paiements pour l'étude ${idEtude}:`, error);
      throw error;
    }
  }

  /**
   * Mettre à jour le statut de paiement d'un volontaire dans une étude
   * @param {number} idEtude - ID de l'étude
   * @param {number} idVolontaire - ID du volontaire
   * @param {number} nouveauStatut - Nouveau statut (0: non payé, 1: payé, 2: en attente, 3: annulé)
   * @returns {Promise<Object>} Résultat de la mise à jour
   */
  async updateStatutPaiement(idEtude, idVolontaire, nouveauStatut) {
    try {
      const response = await api.patch('/etude-volontaires/update-paiement', null, {
        params: {
          idEtude,
          idVolontaire,
          nouveauStatutPaiement: nouveauStatut
        }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut de paiement:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour plusieurs paiements en lot
   * @param {Array} paiements - Liste des paiements à mettre à jour
   * @param {number} paiements[].idEtude - ID de l'étude
   * @param {number} paiements[].idVolontaire - ID du volontaire
   * @param {number} paiements[].nouveauStatut - Nouveau statut
   * @returns {Promise<Object>} Résultat des mises à jour
   */
  async updateMultiplePaiements(paiements) {
    try {
      const response = await api.patch('/etude-volontaires/update-paiements-batch', {
        paiements
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour en lot des paiements:', error);
      throw error;
    }
  }

  /**
   * Marquer tous les paiements d'une étude comme payés
   * @param {number} idEtude - ID de l'étude
   * @returns {Promise<Object>} Résultat de la mise à jour
   */
  async marquerTousPayesParEtude(idEtude) {
    try {
      const response = await api.patch(`/etude-volontaires/etude/${idEtude}/marquer-tous-payes`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors du marquage de tous les paiements comme payés pour l'étude ${idEtude}:`, error);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques de paiement
   * @param {Object} filters - Filtres optionnels
   * @returns {Promise<Object>} Statistiques des paiements
   */
  async getStatistiquesPaiements(filters = {}) {
    try {
      const params = {};
      
      if (filters.idEtude) params.idEtude = filters.idEtude;
      if (filters.dateDebut) params.dateDebut = filters.dateDebut;
      if (filters.dateFin) params.dateFin = filters.dateFin;
      
      const response = await api.get('/etude-volontaires/paiements/statistiques', { params });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques de paiement:', error);
      throw error;
    }
  }

  /**
   * Générer un rapport de paiements
   * @param {Object} filters - Filtres pour le rapport
   * @param {string} format - Format du rapport ('pdf', 'excel', 'csv')
   * @returns {Promise<Blob>} Fichier du rapport
   */
  async genererRapportPaiements(filters = {}, format = 'excel') {
    try {
      const params = { ...filters, format };
      
      const response = await api.get('/etude-volontaires/paiements/rapport', {
        params,
        responseType: 'blob'
      });
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la génération du rapport de paiements:', error);
      throw error;
    }
  }

  /**
   * Obtenir l'historique des paiements d'un volontaire
   * @param {number} idVolontaire - ID du volontaire
   * @returns {Promise<Array>} Historique des paiements
   */
  async getHistoriquePaiementsVolontaire(idVolontaire) {
    try {
      const response = await api.get(`/volontaires/${idVolontaire}/paiements`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'historique des paiements pour le volontaire ${idVolontaire}:`, error);
      throw error;
    }
  }

  /**
   * Calculer le montant total des paiements avec filtres
   * @param {Object} filters - Filtres à appliquer
   * @returns {Promise<Object>} Montants calculés
   */
  async calculerMontantsPaiements(filters = {}) {
    try {
      const params = {};
      
      if (filters.idEtude) params.idEtude = filters.idEtude;
      if (filters.dateDebut) params.dateDebut = filters.dateDebut;
      if (filters.dateFin) params.dateFin = filters.dateFin;
      if (filters.statutPaiement !== undefined) params.statutPaiement = filters.statutPaiement;
      
      const response = await api.get('/etude-volontaires/paiements/montants', { params });
      return response.data;
    } catch (error) {
      console.error('Erreur lors du calcul des montants de paiement:', error);
      throw error;
    }
  }

  /**
   * Vérifier si un utilisateur a les permissions pour gérer les paiements
   * @returns {Promise<boolean>} True si l'utilisateur peut gérer les paiements
   */
  async checkPermissionsPaiements() {
    try {
      const response = await api.get('/auth/check-permissions/paiements');
      return response.data.hasPermission;
    } catch (error) {
      console.error('Erreur lors de la vérification des permissions:', error);
      return false;
    }
  }

}

// Export d'une instance unique du service
const paiementService = new PaiementService();
export default paiementService;