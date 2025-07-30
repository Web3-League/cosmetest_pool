import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import etudeService from "../../services/etudeService";
import etudeVolontaireService from "../../services/etudeVolontaireService";
import groupeService from "../../services/groupeService";
import volontaireService from "../../services/volontaireService";
import api from "../../services/api";

// ===============================
// HOOKS PERSONNALISÉS
// ===============================

/**
 * Hook pour gérer les mises à jour de volontaires
 */
const useVolontaireUpdates = (
  id,
  setVolontairesAssignes,
  setError,
  setDebugInfo
) => {
  const [updateStatus, setUpdateStatus] = useState({});

  // Fonction générique de mise à jour
  const updateVolontaire = useCallback(
    async (volontaire, field, newValue, endpoint) => {
      const volontaireId = volontaire.idVolontaire;
      const statusKey = `${volontaireId}_${field}`;

      try {
        setUpdateStatus((prev) => ({ ...prev, [statusKey]: "loading" }));

        // Vérifier si la valeur a changé
        const currentValue =
          field === "numsujet"
            ? volontaire.numsujet || 0
            : field === "iv"
            ? volontaire.iv || 0
            : volontaire.statut || "inscrit";

        if (newValue === currentValue) {
          setUpdateStatus((prev) => ({ ...prev, [statusKey]: "success" }));
          setTimeout(() => {
            setUpdateStatus((prev) => {
              const newStatus = { ...prev };
              delete newStatus[statusKey];
              return newStatus;
            });
          }, 1000);
          return;
        }

        // Paramètres pour l'API
        const baseParams = {
          idEtude: parseInt(id),
          idGroupe: volontaire.idGroupe || 0,
          idVolontaire: volontaire.idVolontaire,
          iv: volontaire.iv || 0,
          numsujet: volontaire.numsujet || 0,
          paye: volontaire.paye || 0,
          statut: volontaire.statut || "-",
        };

        let params = { ...baseParams };

        if (field === "statut") {
          params.nouveauStatut = newValue;
        } else if (field === "numsujet") {
          params.nouveauNumSujet = parseInt(newValue) || 0;
        } else if (field === "iv") {
          params.nouvelIV = parseInt(newValue) || 0;
        }

        await api.patch(endpoint, null, { params });

        // Mise à jour locale CORRIGÉE
        setVolontairesAssignes((prev) => {
          // S'assurer que prev est un tableau
          const currentArray = Array.isArray(prev) ? prev : [];

          return currentArray.map((v) =>
            v.idVolontaire === volontaireId
              ? {
                  ...v,
                  [field]:
                    field === "statut" 
                      ? newValue 
                      : parseInt(newValue) || 0,
                }
              : v
          );
        });

        setUpdateStatus((prev) => ({ ...prev, [statusKey]: "success" }));
        setDebugInfo(`${field} mis à jour: ${currentValue} → ${newValue}`);

        setTimeout(() => {
          setUpdateStatus((prev) => {
            const newStatus = { ...prev };
            delete newStatus[statusKey];
            return newStatus;
          });
        }, 2000);
      } catch (error) {
        setUpdateStatus((prev) => ({ ...prev, [statusKey]: "error" }));
        setError(
          `Erreur ${field}: ${error.response?.data?.message || error.message}`
        );

        setTimeout(() => {
          setUpdateStatus((prev) => {
            const newStatus = { ...prev };
            delete newStatus[statusKey];
            return newStatus;
          });
        }, 3000);
      }
    },
    [id, setVolontairesAssignes, setError, setDebugInfo]
  );

  // Fonctions spécialisées
  const updateStatut = useCallback(
    (volontaire, nouveauStatut) => {
      return updateVolontaire(
        volontaire,
        "statut",
        nouveauStatut,
        "/etude-volontaires/update-statut"
      );
    },
    [updateVolontaire]
  );

  const updateNumSujet = useCallback(
    (volontaire, nouveauNumSujet) => {
      return updateVolontaire(
        volontaire,
        "numsujet",
        nouveauNumSujet,
        "/etude-volontaires/update-numsujet"
      );
    },
    [updateVolontaire]
  );

  const updateIV = useCallback(
    (volontaire, nouvelleIV) => {
      return updateVolontaire(
        volontaire,
        "iv",
        nouvelleIV,
        "/etude-volontaires/update-iv"
      );
    },
    [updateVolontaire]
  );

  return {
    updateStatus,
    updateStatut,
    updateNumSujet,
    updateIV,
  };
};

/**
 * Hook pour gérer les informations des groupes et volontaires
 */
const useEntitiesInfo = () => {
  const [groupesInfo, setGroupesInfo] = useState({});
  const [volontairesInfo, setVolontairesInfo] = useState({});

  const loadGroupesInfo = useCallback(async (groupeIds) => {
    if (!groupeIds || groupeIds.length === 0) return;

    try {
      const groupesData = {};
      const results = await Promise.allSettled(
        groupeIds.map(async (groupeId) => {
          if (!groupeId || groupesData[groupeId]) return null;
          const groupe = await groupeService.getById(groupeId);
          return { id: groupeId, data: groupe };
        })
      );

      results.forEach((result) => {
        if (result.status === "fulfilled" && result.value?.data) {
          groupesData[result.value.id] = result.value.data;
        }
      });

      setGroupesInfo((prev) => ({ ...prev, ...groupesData }));
    } catch (error) {
      console.error("Erreur lors du chargement des groupes:", error);
    }
  }, []);

  const loadVolontairesInfo = useCallback(async (volontaireIds) => {
    if (!volontaireIds || volontaireIds.length === 0) return;

    try {
      const volontairesData = {};
      const results = await Promise.allSettled(
        volontaireIds.map(async (volontaireId) => {
          if (!volontaireId || volontairesData[volontaireId]) return null;
          const response = await volontaireService.getDetails(volontaireId);
          return { id: volontaireId, data: response.data };
        })
      );

      results.forEach((result) => {
        if (result.status === "fulfilled" && result.value?.data) {
          volontairesData[result.value.id] = result.value.data;
        }
      });

      setVolontairesInfo((prev) => ({ ...prev, ...volontairesData }));
    } catch (error) {
      console.error("Erreur lors du chargement des volontaires:", error);
    }
  }, []);

  return {
    groupesInfo,
    volontairesInfo,
    loadGroupesInfo,
    loadVolontairesInfo,
  };
};

// ===============================
// UTILITAIRES DE STATUT
// ===============================

const STATUT_CONFIG = {
  inscrit: {
    label: "Inscrit",
    icon: "📝",
    style: "bg-blue-100 text-blue-800 border-blue-300",
  },
  surbook: {
    label: "Surbook",
    icon: "📈",
    style: "bg-orange-100 text-orange-800 border-orange-300",
  },
  penalite: {
    label: "Pénalité",
    icon: "⚠️",
    style: "bg-red-100 text-red-800 border-red-300",
  },
  parrainage: {
    label: "Parrainage",
    icon: "🤝",
    style: "bg-purple-100 text-purple-800 border-purple-300",
  },
  annule: {
    label: "Annulé",
    icon: "❌",
    style: "bg-gray-100 text-gray-800 border-gray-300",
  },
};

const normalizeStatut = (statut) => {
  if (
    !statut ||
    statut === "" ||
    statut === "-" ||
    statut === null ||
    statut === undefined
  ) {
    return "inscrit";
  }

  return statut
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_\s]/g, "")
    .replace(/\s+/g, "_");
};

const getStatutConfig = (statut) => {
  const normalized = normalizeStatut(statut);
  return (
    STATUT_CONFIG[normalized] || {
      label: `${statut} (non reconnu)`,
      icon: "❓",
      style: "bg-gray-100 text-gray-800 border-gray-300",
    }
  );
};

// ===============================
// COMPOSANT PRINCIPAL
// ===============================

const EtudeFormEnhanced = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  // États principaux
  const [formData, setFormData] = useState({
    ref: "",
    titre: "",
    description: "",
    examens: "",
    type: "",
    dateDebut: "",
    dateFin: "",
    paye: false,
    montant: 0,
    capaciteVolontaires: 0,
    indemniteParDefaut: 0,
    groupesIndemnites: [],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [refExists, setRefExists] = useState(false);
  const [volontairesAssignes, setVolontairesAssignes] = useState([]);
  const [activeTab, setActiveTab] = useState("details");
  const [debugInfo, setDebugInfo] = useState("");

  // Hooks personnalisés
  const { groupesInfo, volontairesInfo, loadGroupesInfo, loadVolontairesInfo } =
    useEntitiesInfo();

  const { updateStatus, updateStatut, updateNumSujet, updateIV } =
    useVolontaireUpdates(id, setVolontairesAssignes, setError, setDebugInfo);

  // Fonctions utilitaires memoizées
  const getGroupeName = useMemo(
    () => (idGroupe) => {
      if (!idGroupe || idGroupe === 0) return "Aucun groupe";
      const groupe = groupesInfo[idGroupe];
      if (!groupe) return `Groupe #${idGroupe}`;
      return groupe.intitule || groupe.nom || `Groupe #${idGroupe}`;
    },
    [groupesInfo]
  );

  const getVolontaireName = useMemo(
    () => (idVolontaire) => {
      if (!idVolontaire) return "Volontaire non assigné";
      const volontaire = volontairesInfo[idVolontaire];
      if (!volontaire) return `Volontaire #${idVolontaire}`;

      const prenom =
        volontaire.prenom ||
        volontaire.prenomVol ||
        volontaire.prenomVolontaire ||
        "";
      const nom =
        volontaire.nom || volontaire.nomVol || volontaire.nomVolontaire || "";

      if (prenom && nom) return `${prenom} ${nom}`;
      if (prenom) return prenom;
      if (nom) return nom;
      if (volontaire.nomComplet) return volontaire.nomComplet;

      return `Volontaire #${idVolontaire}`;
    },
    [volontairesInfo]
  );

  // 🆕 Fonction pour obtenir le statut de base et la raison (si elle existe)
  const parseStatut = useCallback((statutComplet) => {
    if (!statutComplet) return { statutBase: "inscrit", raison: "" };
    
    const statut = statutComplet.toString().trim();
    
    // Chercher si le statut contient " : " pour séparer statut et raison
    if (statut.includes(" : ")) {
      const [statutBase, ...raisonParts] = statut.split(" : ");
      return {
        statutBase: normalizeStatut(statutBase.trim()),
        raison: raisonParts.join(" : ").trim()
      };
    }
    
    return {
      statutBase: normalizeStatut(statut),
      raison: ""
    };
  }, []);

  // 🆕 Fonction pour afficher le statut avec éventuelle raison
  const getStatutDisplay = useCallback((statutComplet) => {
    const { statutBase, raison } = parseStatut(statutComplet);
    const config = getStatutConfig(statutBase);
    
    return {
      ...config,
      label: raison ? `${config.label} : ${raison}` : config.label,
      statutBase,
      raison
    };
  }, [parseStatut]);

  // Statistiques calculées
  const statistics = useMemo(
    () => ({
      totalIndemnites: volontairesAssignes.reduce(
        (total, v) => total + (v.iv || 0),
        0
      ),
      moyenneIndemnite:
        volontairesAssignes.length > 0
          ? volontairesAssignes.reduce((total, v) => total + (v.iv || 0), 0) /
            volontairesAssignes.length
          : 0,
      nombreVolontaires: volontairesAssignes.length,
    }),
    [volontairesAssignes]
  );

  // Groupes avec volontaires
  const groupesWithVolontaires = useMemo(() => {
    const groupes = new Map();

    volontairesAssignes.forEach((volontaire) => {
      const idGroupe = volontaire.idGroupe || 0;
      const groupeKey = idGroupe === 0 ? "aucun" : idGroupe;

      if (!groupes.has(groupeKey)) {
        const groupe = groupesInfo[idGroupe];
        groupes.set(groupeKey, {
          id: idGroupe,
          nom: getGroupeName(idGroupe),
          details: groupe
            ? {
                nom: groupe.intitule || groupe.nom,
                ageMin: groupe.ageMinimum || groupe.ageMin,
                ageMax: groupe.ageMaximum || groupe.ageMax,
                ethnie: groupe.ethnie,
                iv: groupe.iv,
              }
            : null,
          volontaires: [],
        });
      }

      groupes.get(groupeKey).volontaires.push(volontaire);
    });

    return Array.from(groupes.values());
  }, [volontairesAssignes, groupesInfo, getGroupeName]);

  // Chargement initial des données
  useEffect(() => {
    const fetchEtude = async () => {
      if (!isEditMode) return;

      try {
        setIsLoading(true);
        const data = await etudeService.getById(id);

        setFormData({
          idEtude: data.idEtude,
          ref: data.ref || "",
          titre: data.titre || "",
          description: data.commentaires || "",
          type: data.type || "",
          dateDebut: data.dateDebut ? data.dateDebut.substring(0, 10) : "",
          dateFin: data.dateFin ? data.dateFin.substring(0, 10) : "",
          paye: data.paye === 2 || data.paye === true,
          montant: data.iv || 0,
          capaciteVolontaires: data.capaciteVolontaires || 0,
          examens: data.examens || "",
          washout: data.washout || "",
          indemniteParDefaut: data.iv || 0,
          groupesIndemnites: [],
        });

        if (data.idEtude) {
          try {
            const response = await etudeVolontaireService.getVolontairesByEtude(
              data.idEtude
            );
            // Gérer différents formats de réponse
            let assignes = [];

            if (Array.isArray(response)) {
              // Si la réponse est directement un tableau
              assignes = response;
            } else if (
              response &&
              response.success &&
              Array.isArray(response.data)
            ) {
              // Si la réponse a une structure { success: true, data: [...] }
              assignes = response.data;
            } else if (response && Array.isArray(response.data)) {
              // Si la réponse a une propriété .data qui est un tableau (sans success)
              assignes = response.data;
            } else {
              console.warn("⚠️ Format de réponse inattendu:", response);
              assignes = [];
            }
            setVolontairesAssignes(assignes);
            setDebugInfo(`${assignes.length} volontaires trouvés`);

            // Charger les informations des entités liées seulement si on a des volontaires
            if (assignes.length > 0) {
              const uniqueGroupeIds = [
                ...new Set(
                  assignes.map((v) => v.idGroupe).filter((id) => id && id !== 0)
                ),
              ];
              const uniqueVolontaireIds = [
                ...new Set(
                  assignes.map((v) => v.idVolontaire).filter((id) => id)
                ),
              ];

              await Promise.all([
                loadGroupesInfo(uniqueGroupeIds),
                loadVolontairesInfo(uniqueVolontaireIds),
              ]);
            }
          } catch (volontaireError) {
            console.error(
              "Erreur lors du chargement des volontaires:",
              volontaireError
            );
            setVolontairesAssignes([]); // S'assurer que c'est un tableau vide
            setDebugInfo("Erreur lors du chargement des volontaires");
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement de l'étude:", error);
        setError("Erreur lors du chargement des données de l'étude");
        setVolontairesAssignes([]); // S'assurer que c'est un tableau vide en cas d'erreur
      } finally {
        setIsLoading(false);
      }
    };

    fetchEtude();
  }, [id, isEditMode, loadGroupesInfo, loadVolontairesInfo]);

  // Gestionnaires d'événements
  const handleChange = useCallback(
    (e) => {
      const { name, value, type, checked } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));

      if (name === "ref" && value && !isEditMode) {
        etudeService
          .checkRefExists(value)
          .then(setRefExists)
          .catch(console.error);
      }
    },
    [isEditMode]
  );

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!isEditMode && refExists) {
        setError("Cette référence d'étude existe déjà");
        return;
      }

      const etudeDTO = {
        ...formData,
        paye: formData.paye ? 1 : 0,
      };

      try {
        setIsSaving(true);
        setError("");

        if (isEditMode) {
          // ✅ Sauvegarder SEULEMENT les données de l'étude, pas les associations volontaires
          await etudeService.update(id, etudeDTO);
          setDebugInfo("Étude mise à jour avec succès (volontaires préservés)");
          // Rester sur la page pour continuer à travailler
        } else {
          const nouvelleEtude = await etudeService.create(etudeDTO);
          navigate(`/etudes/${nouvelleEtude.idEtude}/edit`);
        }
      } catch (error) {
        console.error("Erreur lors de l'enregistrement de l'étude:", error);
        setError("Erreur lors de l'enregistrement de l'étude");
      } finally {
        setIsSaving(false);
      }
    },
    [formData, isEditMode, refExists, id, navigate]
  );

  // Composant pour l'indicateur de statut
  const StatusIcon = ({ status }) => {
    switch (status) {
      case "loading":
        return (
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
        );
      case "success":
        return <span className="text-green-500 text-lg">✓</span>;
      case "error":
        return <span className="text-red-500 text-lg">✗</span>;
      default:
        return null;
    }
  };

  // 🆕 Composant pour afficher et éditer le statut avec saisie libre
  const StatutDisplay = ({ volontaire }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempStatut, setTempStatut] = useState(volontaire.statut || "inscrit");
    
    const statutDisplay = getStatutDisplay(volontaire.statut);

    const handleSaveStatut = async () => {
      if (tempStatut !== volontaire.statut) {
        await updateStatut(volontaire, tempStatut);
      }
      setIsEditing(false);
    };

    const handleCancelEdit = () => {
      setTempStatut(volontaire.statut || "inscrit");
      setIsEditing(false);
    };

    return (
      <div className="space-y-2">
        {/* Pastille de statut */}
        <div className={`px-3 py-1 inline-flex items-center text-xs font-semibold rounded-full border ${statutDisplay.style}`}>
          <span className="mr-1">{statutDisplay.icon}</span>
          {statutDisplay.label}
        </div>

        {/* Champ d'édition du statut */}
        {isEditing ? (
          <div className="space-y-2">
            <input
              type="text"
              value={tempStatut}
              onChange={(e) => setTempStatut(e.target.value)}
              placeholder="Ex: annule : volontaire malade"
              className="w-full text-xs border border-gray-300 rounded px-2 py-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSaveStatut();
                }
                if (e.key === "Escape") {
                  handleCancelEdit();
                }
              }}
              autoFocus
            />
            
            {/* Suggestions rapides */}
            <div className="flex flex-wrap gap-1">
              {Object.entries(STATUT_CONFIG).map(([key, config]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTempStatut(key)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded border"
                  title={`Utiliser: ${config.label}`}
                >
                  {config.icon}
                </button>
              ))}
            </div>
            
            <div className="flex space-x-1">
              <button
                type="button"
                onClick={handleSaveStatut}
                className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
              >
                ✓ Sauver
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
              >
                ✗ Annuler
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-xs text-blue-500 hover:text-blue-700 w-full text-left"
          >
            ✏️ Modifier statut
          </button>
        )}

        {/* Indicateur de statut */}
        <div className="flex items-center justify-end">
          <StatusIcon status={updateStatus[`${volontaire.idVolontaire}_statut`]} />
        </div>
      </div>
    );
  };

  // Affichage du loading
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            {isEditMode ? "Modifier l'étude" : "Créer une nouvelle étude"}
          </h1>
          {isEditMode && (
            <span
              className={`ml-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                formData.paye
                  ? "bg-green-100 text-green-800 border border-green-500"
                  : "bg-red-100 text-red-800 border border-red-500"
              }`}
            >
              {formData.paye ? "Rémunérée" : "Non rémunérée"}
            </span>
          )}
        </div>
      </div>

      {/* Messages d'erreur et debug */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
          <button
            onClick={() => setError("")}
            className="absolute top-0 right-0 mt-2 mr-2 text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {debugInfo && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative">
          <strong>Debug:</strong> {debugInfo}
          <button
            onClick={() => setDebugInfo("")}
            className="absolute top-0 right-0 mt-2 mr-2 text-blue-500 hover:text-blue-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Onglets pour le mode édition */}
      {isEditMode && (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === "details"
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setActiveTab("details")}
              >
                Détails de l'étude
              </button>
              <button
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === "indemnites"
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setActiveTab("indemnites")}
              >
                Gestion des indemnités ({statistics.nombreVolontaires})
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Formulaire principal */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-sm p-6"
      >
        {/* Onglet détails */}
        {(!isEditMode || activeTab === "details") && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Champs du formulaire - conservés identiques */}
            <div>
              <label htmlFor="ref" className="form-label">
                Référence *
              </label>
              <input
                type="text"
                id="ref"
                name="ref"
                value={formData.ref}
                onChange={handleChange}
                className={`form-input ${refExists ? "border-red-500" : ""}`}
                required
                disabled={isEditMode}
              />
              {refExists && (
                <p className="mt-1 text-sm text-red-600">
                  Cette référence existe déjà
                </p>
              )}
            </div>

            <div>
              <label htmlFor="titre" className="form-label">
                Titre *
              </label>
              <input
                type="text"
                id="titre"
                name="titre"
                value={formData.titre}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="form-label">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="form-input min-h-[100px]"
                rows={4}
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="examens" className="form-label">
                Examens
              </label>
              <textarea
                id="examens"
                name="examens"
                value={formData.examens}
                onChange={handleChange}
                className="form-input min-h-[100px]"
                rows={4}
              />
            </div>

            <div>
              <label htmlFor="type" className="form-label">
                Type d'étude *
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="form-input"
                required
              >
                <option value="">Sélectionner</option>
                <option value="USAGE">Usage</option>
                <option value="EFFICACITE MAQUILLAGE">Efficacité Maquillage</option>
                <option value="EFFICACITE SOIN">Efficacité Soin</option>
                <option value="DTM">DTM</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>

            <div>
              <label htmlFor="capaciteVolontaires" className="form-label">
                Capacité (nombre de volontaires) *
              </label>
              <input
                type="number"
                id="capaciteVolontaires"
                name="capaciteVolontaires"
                value={formData.capaciteVolontaires}
                onChange={handleChange}
                className="form-input"
                min={0}
                required
              />
            </div>

            <div>
              <label htmlFor="dateDebut" className="form-label">
                Date de début *
              </label>
              <input
                type="date"
                id="dateDebut"
                name="dateDebut"
                value={formData.dateDebut}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div>
              <label htmlFor="dateFin" className="form-label">
                Date de fin *
              </label>
              <input
                type="date"
                id="dateFin"
                name="dateFin"
                value={formData.dateFin}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="paye"
                name="paye"
                checked={formData.paye}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label
                htmlFor="paye"
                className="ml-2 block text-sm text-gray-700"
              >
                Étude rémunérée
              </label>
            </div>

            {formData.paye && (
              <div>
                <label htmlFor="montant" className="form-label">
                  Montant (€)
                </label>
                <input
                  type="number"
                  id="montant"
                  name="montant"
                  value={formData.montant}
                  onChange={handleChange}
                  className="form-input"
                  min={0}
                  step={0.01}
                />
              </div>
            )}
          </div>
        )}

        {/* Onglet indemnités */}
        {isEditMode && activeTab === "indemnites" && (
          <div className="space-y-6">
            {/* Info importante */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <strong>💾 Sauvegarde automatique :</strong> Toutes les modifications (statut, indemnité, numéro sujet) sont sauvegardées automatiquement dès que vous les validez.
                  </p>
                </div>
              </div>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800">
                  Total des indemnités
                </h3>
                <p className="text-2xl font-bold text-blue-900">
                  {statistics.totalIndemnites.toFixed(0)} €
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-green-800">
                  Moyenne par volontaire
                </h3>
                <p className="text-2xl font-bold text-green-900">
                  {statistics.moyenneIndemnite.toFixed(0)} €
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-purple-800">
                  Volontaires assignés
                </h3>
                <p className="text-2xl font-bold text-purple-900">
                  {statistics.nombreVolontaires}
                </p>
              </div>
            </div>

            {/* Tableau des volontaires */}
            {statistics.nombreVolontaires === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">
                  Aucun volontaire assigné à cette étude
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Volontaire
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Numéro sujet
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Indemnité (€)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(Array.isArray(volontairesAssignes)
                      ? volontairesAssignes
                      : []
                    ).map((volontaire, index) => {
                      return (
                        <tr key={`${volontaire.idVolontaire}-${index}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>
                              <div className="font-medium">
                                {getVolontaireName(volontaire.idVolontaire)}
                              </div>
                              <div className="text-xs text-gray-500">
                                ID: {volontaire.idVolontaire}
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                defaultValue={volontaire.numsujet || ""}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                min="1"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    updateNumSujet(volontaire, e.target.value);
                                  }
                                }}
                                onBlur={(e) => {
                                  updateNumSujet(volontaire, e.target.value);
                                }}
                              />
                              <StatusIcon
                                status={
                                  updateStatus[
                                    `${volontaire.idVolontaire}_numsujet`
                                  ]
                                }
                              />
                            </div>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                defaultValue={volontaire.iv || 0}
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                                min="0"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    updateIV(volontaire, e.target.value);
                                  }
                                }}
                                onBlur={(e) => {
                                  updateIV(volontaire, e.target.value);
                                }}
                              />
                              <StatusIcon
                                status={
                                  updateStatus[`${volontaire.idVolontaire}_iv`]
                                }
                              />
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <StatutDisplay volontaire={volontaire} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Boutons d'action - Affichage conditionnel selon l'onglet */}
        {(!isEditMode || activeTab === "details") && (
          <div className="mt-8 flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate("/etudes")}
              className="btn btn-outline"
              disabled={isSaving}
            >
              {isEditMode ? "Retour aux études" : "Annuler"}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSaving || (refExists && !isEditMode)}
            >
              {isSaving ? (
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Enregistrement...
                </span>
              ) : (
                isEditMode ? "Enregistrer l'étude" : "Créer l'étude"
              )}
            </button>
          </div>
        )}

        {/* Boutons pour l'onglet indemnités - Pas de sauvegarde globale */}
        {isEditMode && activeTab === "indemnites" && (
          <div className="mt-8 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <span className="font-medium">💡 Info :</span> Les modifications des volontaires sont sauvegardées automatiquement.
            </div>
            <button
              type="button"
              onClick={() => navigate("/etudes")}
              className="btn btn-outline"
            >
              Retour aux études
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default EtudeFormEnhanced;