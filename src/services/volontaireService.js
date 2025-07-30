import api from './api';
import infoBancaireService from './infoBancaireService'; // Import ajouté


// Fonction utilitaire pour vérifier si un ID est valide
const isValidId = (id) => {
  return id !== undefined && id !== null && id !== 'undefined' && id !== 'null';
};

// Fonction pour transformer les données du volontaire dans un format normalisé
const transformVolontaireData = (data) => {
  if (!data) return null;

  return {
    id: data.idVol || data.volontaireId,
    nom: data.nomVol,
    prenom: data.prenomVol,
    email: data.emailVol,
    sexe: data.sexe,
    adresseVol: data.adresseVol,
    codePostal: data.cpVol,
    ville: data.villeVol,
    dateNaissance: data.dateNaissance,
    archive: data.archive,
    phototype: data.phototype,
    ethnie: data.ethnie,

    // Informations personnelles
    titre: data.titreVol,
    telephone: data.telPortableVol,
    telephoneDomicile: data.telDomicileVol,

    // Adresse
    pays: data.paysVol,

    // Caractéristiques physiques
    taille: data.taille,
    poids: data.poids,
    sousEthnie: data.sousEthnie,
    yeux: data.yeux,
    pilosite: data.pilosite,
    originePere: data.originePere,
    origineMere: data.origineMere,

    // Peau
    typePeauVisage: data.typePeauVisage,
    carnation: data.carnation,
    sensibiliteCutanee: data.sensibiliteCutanee,
    teintInhomogene: data.teintInhomogene,
    teintTerne: data.teintTerne,
    poresVisibles: data.poresVisibles,
    expositionSolaire: data.expositionSolaire,
    bronzage: data.bronzage,
    coupsDeSoleil: data.coupsDeSoleil,
    celluliteBras: data.celluliteBras,
    celluliteFessesHanches: data.celluliteFessesHanches,
    celluliteJambes: data.celluliteJambes,
    celluliteVentreTaille: data.celluliteVentreTaille,

    // Cheveux et ongles
    couleurCheveux: data.couleurCheveux,
    longueurCheveux: data.longueurCheveux,
    natureCheveux: data.natureCheveux,
    epaisseurCheveux: data.epaisseurCheveux,
    natureCuirChevelu: data.natureCuirChevelu,
    cuirCheveluSensible: data.cuirCheveluSensible,
    chuteDeCheveux: data.chuteDeCheveux,
    cheveuxCassants: data.cheveuxCassants,
    onglesCassants: data.onglesCassants,
    onglesDedoubles: data.onglesDedoubles,

    // Problèmes spécifiques
    acne: data.acne,
    couperoseRosacee: data.couperoseRosacee,
    dermiteSeborrheique: data.dermiteSeborrheique,
    eczema: data.eczema,
    psoriasis: data.psoriasis,

    // Informations médicales
    traitement: data.traitement,
    anamnese: data.anamnese,
    contraception: data.contraception,
    menopause: data.menopause,
    allergiesCommentaires: data.allergiesCommentaires,
    santeCompatible: data.santeCompatible,

    // Notes
    notes: data.notes,

    // Caractéristiques supplémentaires
    cicatrices: data.cicatrices,
    tatouages: data.tatouages,
    piercings: data.piercings,

    // Vergetures
    vergeturesJambes: data.vergeturesJambes,
    vergeturesFessesHanches: data.vergeturesFessesHanches,
    vergeturesVentreTaille: data.vergeturesVentreTaille,
    vergeturesPoitrineDecollete: data.vergeturesPoitrineDecollete,

    // Sécheresse de la peau
    secheresseLevres: data.secheresseLevres,
    secheresseCou: data.secheresseCou,
    secheressePoitrineDecollete: data.secheressePoitrineDecollete,
    secheresseVentreTaille: data.secheresseVentreTaille,
    secheresseFessesHanches: data.secheresseFessesHanches,
    secheresseBras: data.secheresseBras,
    secheresseMains: data.secheresseMains,
    secheresseJambes: data.secheresseJambes,
    secheressePieds: data.secheressePieds,

    // Taches pigmentaires
    tachesPigmentairesVisage: data.tachesPigmentairesVisage,
    tachesPigmentairesCou: data.tachesPigmentairesCou,
    tachesPigmentairesDecollete: data.tachesPigmentairesDecollete,
    tachesPigmentairesMains: data.tachesPigmentairesMains,

    // Perte de fermeté
    perteDeFermeteVisage: data.perteDeFermeteVisage,
    perteDeFermeteCou: data.perteDeFermeteCou,
    perteDeFermeteDecollete: data.perteDeFermeteDecollete,

    // Cils
    epaisseurCils: data.epaisseurCils,
    longueurCils: data.longueurCils,
    courbureCils: data.courbureCils,
    cilsAbimes: data.cilsAbimes,
    cilsBroussailleux: data.cilsBroussailleux,
    chuteDeCils: data.chuteDeCils,

    // Problèmes médicaux supplémentaires
    angiome: data.angiome,
    pityriasis: data.pityriasis,
    vitiligo: data.vitiligo,
    melanome: data.melanome,
    zona: data.zona,
    herpes: data.herpes,
    pelade: data.pelade,
    reactionAllergique: data.reactionAllergique,
    desensibilisation: data.desensibilisation,
    terrainAtopique: data.terrainAtopique,

    // Valeurs mesurées
    ihBrasDroit: data.ihBrasDroit,
    ihBrasGauche: data.ihBrasGauche,

    // Scores
    scorePod: data.scorePod,
    scorePog: data.scorePog,
    scoreFront: data.scoreFront,
    scoreLion: data.scoreLion,
    scorePpd: data.scorePpd,
    scorePpg: data.scorePpg,
    scoreDod: data.scoreDod,
    scoreDog: data.scoreDog,
    scoreSngd: data.scoreSngd,
    scoreSngg: data.scoreSngg,
    scoreLevsup: data.scoreLevsup,
    scoreComlevd: data.scoreComlevd,
    scoreComlevg: data.scoreComlevg,
    scorePtose: data.scorePtose,
    ita: data.ita,

    // Autres attributs manquants
    levres: data.levres,
    bouffeeChaleurMenaupose: data.bouffeeChaleurMenaupose,
    cernesVasculaires: data.cernesVasculaires,
    cernesPigmentaires: data.cernesPigmentaires,
    poches: data.poches,
    nbCigarettesJour: data.nbCigarettesJour,
    caracteristiqueSourcils: data.caracteristiqueSourcils,
    mapyeux: data.mapyeux,
    maplevres: data.maplevres,
    mapsourcils: data.mapsourcils,
    ths: data.ths,
  };
};

const volontaireService = {
  // ==================== MÉTHODES PRINCIPALES ====================

  /**
   * Récupère tous les volontaires avec pagination et filtres
   */
  getAll: async (params = {}) => {
    try {
      // Si un terme de recherche est fourni, utiliser l'endpoint de recherche
      if (params.search && params.search.trim()) {
        return volontaireService.searchFullText(params.search, params.page, params.size);
      }

      const response = await api.get('/volontaires', { params });

      // Transformer les données
      if (Array.isArray(response.data)) {
        response.data = response.data.map(transformVolontaireData);
      } else if (response.data && response.data.content) {
        response.data.content = response.data.content.map(transformVolontaireData);
      }

      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération des volontaires:', error);
      throw error;
    }
  },

  /**
   * Récupère un volontaire par son ID
   */
  getById: async (id) => {
    if (!isValidId(id)) {
      return Promise.reject(new Error('ID de volontaire invalide'));
    }
    try {
      const response = await api.get(`/volontaires/${id}`);
      response.data = transformVolontaireData(response.data);
      return response;
    } catch (error) {
      console.error(`Erreur lors de la récupération du volontaire (ID: ${id}):`, error);
      throw error;
    }
  },

  /**
   * Récupère les détails complets d'un volontaire
   */
  getDetails: async (id) => {
    if (!isValidId(id)) {
      return Promise.reject(new Error('ID de volontaire invalide'));
    }
    try {
      const response = await api.get(`/volontaires/details/${id}`);
      return response;
    } catch (error) {
      console.error(`Erreur lors de la récupération des détails du volontaire (ID: ${id}):`, error);
      throw error;
    }
  },

  /**
   * Crée un nouveau volontaire
   */
  create: (volontaireData) => {
    return api.post('/volontaires/details', volontaireData);
  },

  /**
   * Met à jour un volontaire
   */
  update: (id, volontaireData) => {
    if (!isValidId(id)) {
      return Promise.reject(new Error('ID de volontaire invalide'));
    }
    return api.put(`/volontaires/${id}`, volontaireData);
  },

  /**
   * Met à jour les détails d'un volontaire
   */
  updateDetails: (id, detailsData) => {
    if (!isValidId(id)) {
      return Promise.reject(new Error('ID de volontaire invalide'));
    }
    return api.put(`/volontaires/details/${id}`, detailsData);
  },

  /**
   * Supprime un volontaire
   */
  delete: (id) => {
    if (!isValidId(id)) {
      return Promise.reject(new Error('ID de volontaire invalide'));
    }
    return api.delete(`/volontaires/${id}`);
  },

  /**
   * Archive un volontaire
   */
  archive: (id) => {
    if (!isValidId(id)) {
      return Promise.reject(new Error('ID de volontaire invalide'));
    }
    return api.put(`/volontaires/${id}/archive`);
  },

  /**
   * Désarchive un volontaire
   */
  unarchive: (id) => {
    if (!isValidId(id)) {
      return Promise.reject(new Error('ID de volontaire invalide'));
    }
    return api.put(`/volontaires/${id}/unarchive`);
  },

  // ==================== MÉTHODES DE RECHERCHE ====================

  /**
   * Recherche fulltext
   */
  searchFullText: async (keyword, page = 0, size = 10) => {
    try {
      const response = await api.get('/volontaires/search', {
        params: { keyword, page, size }
      });

      if (Array.isArray(response.data)) {
        response.data = response.data.map(transformVolontaireData);
      } else if (response.data && response.data.content) {
        response.data.content = response.data.content.map(transformVolontaireData);
      } else {
        const content = Array.isArray(response.data) ? response.data : [];
        response.data = {
          content: content.map(transformVolontaireData),
          totalElements: content.length,
          totalPages: Math.ceil(content.length / size),
          number: page,
          size: size
        };
      }

      return response;
    } catch (error) {
      console.error('Erreur lors de la recherche fulltext des volontaires:', error);
      throw error;
    }
  },

  /**
   * Recherche avancée
   */
  search: (searchParams) => {
    return api.get('/volontaires/search', { params: searchParams });
  },

  /**
   * Recherche par nom et prénom
   */
  searchByNameAndFirstName: (searchParams) => {
    return api.get('/volontaires/search/nomprenom', { params: searchParams });
  },

  /**
   * Recherche avec critères multiples
   */
  searchByCriteria: (criteria) => {
    return api.get('/volontaires/search/criteria', { params: criteria });
  },

  // ==================== MÉTHODES DE FILTRAGE ====================

  /**
   * Obtient les volontaires par type de peau
   */
  getByTypePeau: (typePeau, params = {}) => {
    return api.get(`/volontaires/typepeau/${typePeau}`, { params });
  },

  /**
   * Obtient les volontaires par phototype
   */
  getByPhototype: (phototype, params = {}) => {
    return api.get(`/volontaires/phototype/${phototype}`, { params });
  },

  /**
   * Obtient les volontaires par ethnie
   */
  getByEthnie: (ethnie, params = {}) => {
    return api.get(`/volontaires/ethnie/${ethnie}`, { params });
  },

  /**
   * Obtient les volontaires par sexe
   */
  getBySexe: (sexe, params = {}) => {
    return api.get(`/volontaires/sexe/${sexe}`, { params });
  },

  /**
   * Obtient les volontaires actifs
   */
  getActifs: (params = {}) => {
    return api.get('/volontaires/actifs', { params });
  },

  /**
   * Obtient les volontaires par âge
   */
  getByAge: (params = {}) => {
    return api.get('/volontaires/age', { params });
  },

  /**
   * Obtient l'âge d'un volontaire
   */
  getVolontaireAge: (id) => {
    if (!isValidId(id)) {
      return Promise.reject(new Error('ID de volontaire invalide'));
    }
    return api.get(`/volontaires/${id}/age`);
  },

  /**
   * Obtient les volontaires compatibles par âge
   */
  getCompatibleAge: (id, params = {}) => {
    if (!isValidId(id)) {
      return Promise.reject(new Error('ID de volontaire invalide'));
    }
    return api.get(`/volontaires/${id}/compatible-age`, { params });
  },

  /**
   * Obtient les volontaires par date d'ajout
   */
  getByDateAjout: (params = {}) => {
    return api.get('/volontaires/date-ajout', { params });
  },

  // ==================== MÉTHODES STATISTIQUES ====================

  /**
   * Obtient les statistiques des volontaires
   */
  getStatistiques: () => {
    return api.get('/volontaires/statistiques');
  },

  /**
   * Obtient tous les volontaires sans pagination (pour les stats)
   */
  getAllWithoutPagination: async () => {
    try {
      const response = await api.get('/volontaires/allstats');
      if (Array.isArray(response.data)) {
        return response.data.map(transformVolontaireData);
      }
      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération des volontaires:', error);
      throw error;
    }
  },

  /**
   * Obtient plusieurs volontaires par leurs IDs
   */
  getVolontairesByIds: async (ids) => {
    try {
      const promises = ids.map(id => api.get(`/volontaires/${id}`));
      const responses = await Promise.all(promises);
      return responses.map(response => response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des volontaires:', error);
      throw error;
    }
  },

  // ==================== MÉTHODES INFORMATIONS BANCAIRES ====================
  // Délégation vers infoBancaireService pour une meilleure séparation des responsabilités

  /**
   * Récupère les informations bancaires d'un volontaire
   * @param {number} idVol - L'ID du volontaire
   * @returns {Promise} Promesse contenant les informations bancaires
   */
  getInfoBank: async (idVol) => {
    if (!isValidId(idVol)) {
      return Promise.reject(new Error('ID de volontaire invalide'));
    }

    try {
      // Déléguer au service spécialisé
      const response = await infoBancaireService.getByVolontaireId(idVol);

      // Transformer pour maintenir la compatibilité avec l'ancienne structure si nécessaire
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        const infoBankData = response.data[0];
        return {
          ...response,
          data: {
            rib: {
              iban: infoBankData.iban || '',
              bic: infoBankData.bic || ''
            },
            // Conserver aussi la structure directe pour la flexibilité
            iban: infoBankData.iban || '',
            bic: infoBankData.bic || ''
          }
        };
      }

      // Structure vide si aucune donnée
      return {
        ...response,
        data: {
          rib: { iban: '', bic: '' },
          iban: '',
          bic: ''
        }
      };
    } catch (error) {
      if (error.response && error.response.status === 404) {
        // Retourner structure vide pour volontaires sans info bancaire
        return {
          data: {
            rib: { iban: '', bic: '' },
            iban: '',
            bic: ''
          }
        };
      }
      console.error(`Erreur lors de la récupération des informations bancaires (ID: ${idVol}):`, error);
      throw error;
    }
  },

  /**
   * Crée ou met à jour les informations bancaires d'un volontaire
   * @param {number} idVol - L'ID du volontaire  
   * @param {Object} infoBankData - Les données bancaires (peut contenir rib.iban/rib.bic ou directement iban/bic)
   * @returns {Promise} Promesse de sauvegarde
   */
  saveInfoBank: async (idVol, infoBankData) => {
    if (!isValidId(idVol)) {
      return Promise.reject(new Error('ID de volontaire invalide'));
    }

    try {
      // Normaliser les données d'entrée (supporter les deux structures)
      let bankData = {};

      if (infoBankData.rib) {
        // Structure avec rib
        bankData = {
          iban: infoBankData.rib.iban || '',
          bic: infoBankData.rib.bic || ''
        };
      } else {
        // Structure directe
        bankData = {
          iban: infoBankData.iban || '',
          bic: infoBankData.bic || ''
        };
      }

      // Déléguer au service spécialisé
      return await infoBancaireService.saveForVolontaire(idVol, bankData);

    } catch (error) {
      console.error(`Erreur lors de la sauvegarde des informations bancaires (ID: ${idVol}):`, error);
      throw error;
    }
  },

  /**
   * Supprime les informations bancaires d'un volontaire
   * @param {number} idVol - L'ID du volontaire
   * @returns {Promise} Promesse de suppression
   */
  deleteInfoBank: async (idVol) => {
    if (!isValidId(idVol)) {
      return Promise.reject(new Error('ID de volontaire invalide'));
    }

    try {
      // Déléguer au service spécialisé
      return await infoBancaireService.deleteAllForVolontaire(idVol);
    } catch (error) {
      console.error(`Erreur lors de la suppression des informations bancaires (ID: ${idVol}):`, error);
      throw error;
    }
  },

  /**
   * Vérifie si un volontaire a des informations bancaires
   * @param {number} idVol - L'ID du volontaire
   * @returns {Promise<boolean>} True si le volontaire a des infos bancaires
   */
  hasInfoBank: async (idVol) => {
    if (!isValidId(idVol)) {
      return Promise.reject(new Error('ID de volontaire invalide'));
    }

    try {
      const response = await infoBancaireService.getByVolontaireId(idVol);
      return response.data && response.data.length > 0;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return false;
      }
      throw error;
    }
  },

  /**
   * Valide les informations bancaires avant sauvegarde
   * @param {Object} bankData - Les données bancaires à valider
   * @returns {Object} Résultat de validation
   */
  validateBankInfo: (bankData) => {
    // Normaliser les données
    let normalizedData = {};

    if (bankData.rib) {
      normalizedData = {
        iban: bankData.rib.iban || '',
        bic: bankData.rib.bic || '',
        idVol: bankData.idVol
      };
    } else {
      normalizedData = {
        iban: bankData.iban || '',
        bic: bankData.bic || '',
        idVol: bankData.idVol
      };
    }

    // Déléguer la validation au service spécialisé
    return infoBancaireService.validation.validateInfoBancaire(normalizedData);
  },

  // ==================== MÉTHODES UTILITAIRES ====================

  /**
   * Crée les détails d'un volontaire (utilisé en interne)
   */
  createDetails: (detailsData) => {
    if (!isValidId(detailsData.volontaireId)) {
      return Promise.reject(new Error('ID de volontaire invalide dans les données détaillées'));
    }
    return api.post('/volontaires/details', detailsData);
  },

  /**
   * Obtient les volontaires actifs (alias pour getActifs)
   */
  getActive: (params = {}) => {
    return volontaireService.getActifs(params);
  },

  // ==================== MÉTHODES DE VALIDATION ====================

  /**
   * Valide les données d'un volontaire avant sauvegarde
   */
  validateVolontaireData: (data) => {
    const errors = {};

    // Champs obligatoires
    if (!data.nomVol || !data.nomVol.trim()) {
      errors.nom = 'Le nom est obligatoire';
    }

    if (!data.prenomVol || !data.prenomVol.trim()) {
      errors.prenom = 'Le prénom est obligatoire';
    }

    if (!data.emailVol || !data.emailVol.trim()) {
      errors.email = 'L\'email est obligatoire';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.emailVol)) {
      errors.email = 'Format d\'email invalide';
    }

    if (!data.sexe) {
      errors.sexe = 'Le sexe est obligatoire';
    }

    if (!data.typePeauVisage) {
      errors.typePeau = 'Le type de peau est obligatoire';
    }

    // Validation du code postal français
    if (data.cpVol && !/^\d{5}$/.test(data.cpVol)) {
      errors.codePostal = 'Le code postal doit contenir 5 chiffres';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
};

export default volontaireService;