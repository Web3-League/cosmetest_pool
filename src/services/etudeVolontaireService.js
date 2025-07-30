import api from "./api";

// Service corrigé pour correspondre exactement à l'API Spring Boot
const etudeVolontaireService = {
  // Fonction utilitaire pour vérifier si un ID est valide
  isValidId(id) {
    return (
      id !== undefined &&
      id !== null &&
      id !== "undefined" &&
      id !== "null" &&
      id !== ""
    );
  },

  // Fonction pour valider les données d'une association étude-volontaire
  validateEtudeVolontaireData(data) {
    const errors = [];

    if (!this.isValidId(data.idEtude)) {
      errors.push("L'identifiant de l'étude est requis");
    }

    if (!this.isValidId(data.idVolontaire)) {
      errors.push("L'identifiant du volontaire est requis");
    }

    if (data.idGroupe < 0) {
      errors.push("L'identifiant du groupe doit être positif");
    }

    if (data.iv < 0) {
      errors.push("L'indemnité volontaire doit être positive");
    }

    if (data.paye !== 0 && data.paye !== 1) {
      errors.push("L'indicateur de paiement doit être 0 ou 1");
    }

    const statutsValides = [
      "INSCRIT",
      "CONFIRME",
      "ANNULE",
      "TERMINE",
      "RESERVE",
    ];
    if (!data.statut || !statutsValides.includes(data.statut.toUpperCase())) {
      errors.push(
        `Le statut doit être l'un des suivants: ${statutsValides.join(", ")}`
      );
    }

    return errors;
  },

  // Fonction pour transformer les données
  transformEtudeVolontaireData(data) {
    if (!data) return null;

    return {
      idEtude: parseInt(data.idEtude),
      idVolontaire: parseInt(data.idVolontaire),
      idGroupe: parseInt(data.idGroupe) || 0,
      iv: parseInt(data.iv) || 0, // Convertir en entier pour l'API
      numsujet: parseInt(data.numsujet) || 0,
      paye: parseInt(data.paye) || 0,
      statut: String(data.statut) || "INSCRIT",
    };
  },

  // Récupérer toutes les associations
  async getAll() {
    try {
      const response = await api.get("/etude-volontaires");
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération des associations:", error);
      throw error;
    }
  },

  // Récupérer avec pagination
  async getPaginated(page = 0, size = 10) {
    try {
      const response = await api.get("/etude-volontaires/paginated", {
        params: { page, size },
      });
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération paginée:", error);
      throw error;
    }
  },

  // Récupérer les volontaires par étude
  async getVolontairesByEtude(idEtude) {
    try {
      if (!this.isValidId(idEtude)) {
        throw new Error("L'identifiant de l'étude est requis");
      }
      const response = await api.get(`/etude-volontaires/etude/${idEtude}`);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération des volontaires:", error);
      throw error;
    }
  },

  // Récupérer les études par volontaire
  async getEtudesByVolontaire(idVolontaire) {
    try {
      if (!this.isValidId(idVolontaire)) {
        throw new Error("L'identifiant du volontaire est requis");
      }
      const response = await api.get(
        `/etude-volontaires/volontaire/${idVolontaire}`
      );
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération des études:", error);
      throw error;
    }
  },

  // Récupérer par groupe
  async getByGroupe(idGroupe) {
    try {
      if (!this.isValidId(idGroupe)) {
        throw new Error("L'identifiant du groupe est requis");
      }
      const response = await api.get(`/etude-volontaires/groupe/${idGroupe}`);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération par groupe:", error);
      throw error;
    }
  },

  // Récupérer par statut
  async getByStatut(statut) {
    try {
      if (!statut) {
        throw new Error("Le statut est requis");
      }
      const response = await api.get(`/etude-volontaires/statut/${statut}`);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération par statut:", error);
      throw error;
    }
  },

  // Récupérer par indicateur de paiement
  async getByPaye(paye) {
    try {
      if (paye !== 0 && paye !== 1) {
        throw new Error("L'indicateur de paiement doit être 0 ou 1");
      }
      const response = await api.get(`/etude-volontaires/paye/${paye}`);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération par paiement:", error);
      throw error;
    }
  },

  // Créer une nouvelle association
  async create(etudeVolontaireData) {
    try {
      const transformedData =
        this.transformEtudeVolontaireData(etudeVolontaireData);

      // Validation des données
      const errors = this.validateEtudeVolontaireData(transformedData);
      if (errors.length > 0) {
        throw new Error(`Erreurs de validation: ${errors.join(", ")}`);
      }

      const response = await api.post("/etude-volontaires", transformedData);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la création de l'association:", error);
      throw error;
    }
  },

  // Vérifier si une association existe
  async checkAssociationFromData(idEtude, idVolontaire) {
    try {
      const associations = await this.getVolontairesByEtude(idEtude);
      return associations.some(
        (assoc) => assoc.idVolontaire === parseInt(idVolontaire)
      );
    } catch (err) {
      console.warn("Impossible de vérifier l'association:", err);
      return false; // Assume pas d'association en cas d'erreur
    }
  },

  // Compter les volontaires par étude
  async countVolontairesByEtude(idEtude) {
    try {
      if (!this.isValidId(idEtude)) {
        throw new Error("L'identifiant de l'étude est requis");
      }
      const response = await api.get(
        `/etude-volontaires/count/volontaires/${idEtude}`
      );
      return response.data;
    } catch (error) {
      console.error("Erreur lors du comptage des volontaires:", error);
      throw error;
    }
  },

  // Compter les études par volontaire
  async countEtudesByVolontaire(idVolontaire) {
    try {
      if (!this.isValidId(idVolontaire)) {
        throw new Error("L'identifiant du volontaire est requis");
      }
      const response = await api.get(
        `/etude-volontaires/count/etudes/${idVolontaire}`
      );
      return response.data;
    } catch (error) {
      console.error("Erreur lors du comptage des études:", error);
      throw error;
    }
  },

  // Mettre à jour le statut (corrigé pour correspondre à l'API Spring Boot)
  async updateStatut(associationId, nouveauStatut) {
    try {
      if (!nouveauStatut) {
        throw new Error("Le nouveau statut est requis");
      }

      const params = {
        idEtude: parseInt(associationId.idEtude),
        idGroupe: parseInt(associationId.idGroupe) || 0,
        idVolontaire: parseInt(associationId.idVolontaire),
        iv: parseInt(associationId.iv) || 0,
        numsujet: parseInt(associationId.numsujet) || 0,
        paye: parseInt(associationId.paye) || 0,
        statut: String(associationId.statut) || "INSCRIT",
        nouveauStatut: String(nouveauStatut),
      };

      const response = await api.patch(
        "/etude-volontaires/update-statut",
        null,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      throw error;
    }
  },

  // Mettre à jour l'indicateur de paiement (corrigé pour correspondre à l'API Spring Boot)
  async updatePaye(associationId, nouveauPaye) {
    try {
      if (nouveauPaye !== 0 && nouveauPaye !== 1) {
        throw new Error("L'indicateur de paiement doit être 0 ou 1");
      }

      const params = {
        idEtude: parseInt(associationId.idEtude),
        idGroupe: parseInt(associationId.idGroupe) || 0,
        idVolontaire: parseInt(associationId.idVolontaire),
        iv: parseInt(associationId.iv) || 0,
        numsujet: parseInt(associationId.numsujet) || 0,
        paye: parseInt(associationId.paye) || 0,
        statut: String(associationId.statut) || "INSCRIT",
        nouveauPaye: parseInt(nouveauPaye),
      };

      const response = await api.patch("/etude-volontaires/update-paye", null, {
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la mise à jour du paiement:", error);
      throw error;
    }
  },

  // Mettre à jour l'indemnité volontaire (IV) - CORRIGÉ
  async updateIV(associationId, nouvelIV) {
    try {
      if (nouvelIV < 0) {
        throw new Error("L'indemnité volontaire doit être positive");
      }

      console.log("=== updateIV Service ===");
      console.log("associationId:", associationId);
      console.log("nouvelIV:", nouvelIV);

      // Construire les paramètres exactement comme attendu par l'API Spring Boot
      const params = {
        idEtude: parseInt(associationId.idEtude),
        idGroupe: parseInt(associationId.idGroupe) || 0,
        idVolontaire: parseInt(associationId.idVolontaire),
        iv: parseInt(associationId.iv) || 0, // IV actuelle
        numsujet: parseInt(associationId.numsujet) || 0,
        paye: parseInt(associationId.paye) || 0,
        statut: String(associationId.statut) || "INSCRIT",
        nouvelIV: parseInt(nouvelIV), // Nouvelle IV
      };

      console.log("Paramètres:", params);

      const response = await api.patch("/etude-volontaires/update-iv", null, {
        params,
      });

      console.log("Réponse updateIV:", response.data);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'IV:", error);
      throw error;
    }
  },

  // Mettre à jour le paiement et l'IV simultanément (corrigé)
  async updatePayeAndIV(associationId, nouveauPaye, nouvelIV) {
    try {
      if (nouveauPaye !== 0 && nouveauPaye !== 1) {
        throw new Error("L'indicateur de paiement doit être 0 ou 1");
      }
      if (nouvelIV < 0) {
        throw new Error("L'indemnité volontaire doit être positive");
      }

      const params = {
        idEtude: parseInt(associationId.idEtude),
        idGroupe: parseInt(associationId.idGroupe) || 0,
        idVolontaire: parseInt(associationId.idVolontaire),
        iv: parseInt(associationId.iv) || 0,
        numsujet: parseInt(associationId.numsujet) || 0,
        paye: parseInt(associationId.paye) || 0,
        statut: String(associationId.statut) || "INSCRIT",
        nouveauPaye: parseInt(nouveauPaye),
        nouvelIV: parseInt(nouvelIV),
      };

      const response = await api.patch(
        "/etude-volontaires/update-paye-iv",
        null,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la mise à jour du paiement et IV:", error);
      throw error;
    }
  },

  // Récupérer la valeur de l'IV (corrigé)
  async getIV(associationId) {
    try {
      const params = {
        idEtude: parseInt(associationId.idEtude),
        idGroupe: parseInt(associationId.idGroupe) || 0,
        idVolontaire: parseInt(associationId.idVolontaire),
        iv: parseInt(associationId.iv) || 0,
        numsujet: parseInt(associationId.numsujet) || 0,
        paye: parseInt(associationId.paye) || 0,
        statut: String(associationId.statut) || "INSCRIT",
      };

      const response = await api.get("/etude-volontaires/get-iv", { params });
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération de l'IV:", error);
      throw error;
    }
  },

  // Supprimer une association (corrigé)
  async delete(associationId) {
    try {
      const params = {
        idEtude: parseInt(associationId.idEtude),
        idGroupe: parseInt(associationId.idGroupe) || 0,
        idVolontaire: parseInt(associationId.idVolontaire),
        iv: parseInt(associationId.iv) || 0,
        numsujet: parseInt(associationId.numsujet) || 0,
        paye: parseInt(associationId.paye) || 0,
        statut: String(associationId.statut) || "INSCRIT",
      };

      await api.delete("/etude-volontaires/delete", { params });
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      throw error;
    }
  },

  // Fonction utilitaire pour créer un ID d'association
  createAssociationId(
    idEtude,
    idGroupe,
    idVolontaire,
    iv,
    numsujet,
    paye,
    statut
  ) {
    return {
      idEtude: parseInt(idEtude),
      idGroupe: parseInt(idGroupe) || 0,
      idVolontaire: parseInt(idVolontaire),
      iv: parseInt(iv) || 0,
      numsujet: parseInt(numsujet) || 0,
      paye: parseInt(paye) || 0,
      statut: String(statut) || "INSCRIT",
    };
  },

  // Fonction pour assigner un volontaire à une étude avec indemnité
  async assignerVolontaireAEtude(
    idEtude,
    idVolontaire,
    iv = 0,
    idGroupe = 0,
    statut = "INSCRIT"
  ) {
    try {
      // Vérifier si l'association existe déjà
      const exists = await this.existsByEtudeAndVolontaire(
        idEtude,
        idVolontaire
      );
      if (exists) {
        throw new Error("Ce volontaire est déjà assigné à cette étude");
      }

      // Créer l'association
      const associationData = {
        idEtude: parseInt(idEtude),
        idVolontaire: parseInt(idVolontaire),
        idGroupe: parseInt(idGroupe),
        iv: parseInt(iv), // Convertir en entier
        numsujet: 0,
        paye: parseInt(iv) > 0 ? 1 : 0, // Si IV > 0, alors payé
        statut: String(statut),
      };

      return await this.create(associationData);
    } catch (error) {
      console.error("Erreur lors de l'assignation du volontaire:", error);
      throw error;
    }
  },

  // Fonction pour désassigner un volontaire d'une étude
  async desassignerVolontaireDEtude(idEtude, idVolontaire) {
    try {
      // Récupérer les associations existantes
      const response = await this.getVolontairesByEtude(idEtude);
      // ✅ SÉCURITÉ : S'assurer que 'associations' est toujours un tableau
      const associations = Array.isArray(response) ? response : (response?.data || []);

      const association = associations.find(
        (a) => a.idVolontaire === parseInt(idVolontaire)
      );

      if (!association) {
        throw new Error("Association non trouvée");
      }

      // Créer l'ID de l'association pour la suppression
      const associationId = this.createAssociationId(
        association.idEtude,
        association.idGroupe,
        association.idVolontaire,
        association.iv,
        association.numsujet,
        association.paye,
        association.statut
      );

      await this.delete(associationId);
    } catch (error) {
      console.error("Erreur lors de la désassignation du volontaire:", error);
      throw error;
    }
  },

  /**
   * 🎯 Créer plusieurs associations d'un coup avec toutes les valeurs
   */
  async createBatch(associations) {
    try {
      // Valider et transformer chaque association
      const validAssociations = associations.map((assoc) => {
        const transformedData = this.transformEtudeVolontaireData(assoc);

        // Validation
        const errors = this.validateEtudeVolontaireData(transformedData);
        if (errors.length > 0) {
          throw new Error(
            `Erreurs pour volontaire ${transformedData.idVolontaire
            }: ${errors.join(", ")}`
          );
        }

        return transformedData;
      });

      console.log(
        "🎯 Création en lot:",
        validAssociations.length,
        "associations"
      );

      const response = await api.post("/etude-volontaires/create-batch", {
        associations: validAssociations,
      });

      console.log("✅ Création en lot réussie:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Erreur création en lot:", error);
      throw error;
    }
  },

  // Mettre à jour l'idVolontaire (peut être null pour désassigner)
  async updateVolontaire(associationId, nouveauVolontaireId) {
    try {
      console.log("=== updateVolontaire Service ===");
      console.log("associationId:", associationId);
      console.log("nouveauVolontaireId:", nouveauVolontaireId);

      const params = {
        idEtude: parseInt(associationId.idEtude),
        idGroupe: parseInt(associationId.idGroupe) || 0,
        idVolontaire: parseInt(associationId.idVolontaire),
        iv: parseInt(associationId.iv) || 0,
        numsujet: parseInt(associationId.numsujet) || 0,
        paye: parseInt(associationId.paye) || 0,
        statut: String(associationId.statut) || "INSCRIT",
        nouveauVolontaireId: nouveauVolontaireId // null pour désassigner
      };

      console.log("Paramètres updateVolontaire:", params);

      const response = await api.patch("/etude-volontaires/update-volontaire", null, {
        params
      });

      console.log("Réponse updateVolontaire:", response.data);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la mise à jour du volontaire:", error);
      throw error;
    }
  },
};

export default etudeVolontaireService;
