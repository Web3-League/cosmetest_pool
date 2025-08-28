// ============================================================
// IndemniteManager.jsx - Composant réutilisable pour la gestion des indemnités
// ============================================================

import { useState, useEffect, useCallback, useMemo } from "react";
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
  etudeId,
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
          idEtude: parseInt(etudeId),
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

        // Mise à jour locale
        setVolontairesAssignes((prev) => {
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
        setDebugInfo && setDebugInfo(`${field} mis à jour: ${currentValue} → ${newValue}`);

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
    [etudeId, setVolontairesAssignes, setError, setDebugInfo]
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
 * Hook pour gérer les informations des entités
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

const IndemniteManager = ({ 
  etudeId, 
  etudeTitre, 
  etudeRef,
  onError = () => {},
  showDebugInfo = false 
}) => {
  // États
  const [volontairesAssignes, setVolontairesAssignes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState("");

  // Hooks personnalisés
  const { volontairesInfo, loadGroupesInfo, loadVolontairesInfo } =
    useEntitiesInfo();

  const { updateStatus, updateStatut, updateNumSujet, updateIV } =
    useVolontaireUpdates(etudeId, setVolontairesAssignes, setError, setDebugInfo);

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

  // Fonction pour obtenir le statut de base et la raison
  const parseStatut = useCallback((statutComplet) => {
    if (!statutComplet) return { statutBase: "inscrit", raison: "" };
    
    const statut = statutComplet.toString().trim();
    
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

  // Fonction pour afficher le statut avec raison
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

  // Chargement des données
  useEffect(() => {
    const fetchVolontaires = async () => {
      if (!etudeId) return;

      try {
        setIsLoading(true);
        const response = await etudeVolontaireService.getVolontairesByEtude(etudeId);
        
        let assignes = [];
        if (Array.isArray(response)) {
          assignes = response;
        } else if (response?.success && Array.isArray(response.data)) {
          assignes = response.data;
        } else if (response && Array.isArray(response.data)) {
          assignes = response.data;
        } else {
          console.warn("Format de réponse inattendu:", response);
          assignes = [];
        }
        
        setVolontairesAssignes(assignes);
        setDebugInfo(`${assignes.length} volontaires trouvés`);

        // Charger les informations des entités liées
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
      } catch (error) {
        console.error("Erreur lors du chargement des volontaires:", error);
        setVolontairesAssignes([]);
        setError("Erreur lors du chargement des volontaires");
      } finally {
        setIsLoading(false);
      }
    };

    fetchVolontaires();
  }, [etudeId, loadGroupesInfo, loadVolontairesInfo]);

  // Propager l'erreur au parent
  useEffect(() => {
    if (error) {
      onError(error);
    }
  }, [error, onError]);

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

  // Composant pour afficher et éditer le statut
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

    if (isEditing) {
      return (
        <div className="space-y-2">
          <div className={`px-3 py-1 inline-flex items-center text-xs font-semibold rounded-full border ${statutDisplay.style}`}>
            <span className="mr-1">{statutDisplay.icon}</span>
            {statutDisplay.label}
          </div>

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

          <div className="flex items-center justify-end">
            <StatusIcon status={updateStatus[`${volontaire.idVolontaire}_statut`]} />
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className={`px-3 py-1 inline-flex items-center text-xs font-semibold rounded-full border ${statutDisplay.style}`}>
          <span className="mr-1">{statutDisplay.icon}</span>
          {statutDisplay.label}
        </div>

        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="text-xs text-blue-500 hover:text-blue-700 w-full text-left"
        >
          ✏️ Modifier statut
        </button>

        <div className="flex items-center justify-end">
          <StatusIcon status={updateStatus[`${volontaire.idVolontaire}_statut`]} />
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Gestion des Indemnités</h3>
          <p className="text-sm text-gray-600 mt-1">
            {etudeTitre} {etudeRef && `(${etudeRef})`}
          </p>
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

      {showDebugInfo && debugInfo && (
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
              {volontairesAssignes.map((volontaire, index) => (
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
                        status={updateStatus[`${volontaire.idVolontaire}_numsujet`]}
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
                        status={updateStatus[`${volontaire.idVolontaire}_iv`]}
                      />
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <StatutDisplay volontaire={volontaire} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default IndemniteManager;