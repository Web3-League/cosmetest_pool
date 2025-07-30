import { useState, useEffect, useMemo, useCallback, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import etudeService from '../../services/etudeService';
import etudeVolontaireService from '../../services/etudeVolontaireService';
import volontaireService from '../../services/volontaireService';
import groupeService from '../../services/groupeService';
import api from '../../services/api';
import { PAIEMENT_STATUS } from '../../hooks/usePaiements';
import ExcelExport from './ExcelExport';

const PaiementsPage = () => {
  const authContext = useContext(AuthContext);

  // États - TOUJOURS déclarer les hooks en premier
  const [etudes, setEtudes] = useState([]);
  const [paiements, setPaiements] = useState([]);
  const [volontairesInfo, setVolontairesInfo] = useState({});
  const [groupesInfo, setGroupesInfo] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [updateStatus, setUpdateStatus] = useState({});
  const [allPaiements, setAllPaiements] = useState([]); // Pour stocker tous les paiements
  const [allPaiementsLoaded, setAllPaiementsLoaded] = useState(false); // Flag pour éviter les rechargements
  const [isMassUpdating, setIsMassUpdating] = useState(false); // ✅ NOUVEAU : État pour la mise à jour en masse

  // Filtres
  const [selectedEtude, setSelectedEtude] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [statutPaiement, setStatutPaiement] = useState('');
  const [showOnlyUnpaid, setShowOnlyUnpaid] = useState(false);

  // Chargement des études
  useEffect(() => {
    const loadEtudes = async () => {
      try {
        const etudesData = await etudeService.getAll();
        setEtudes(Array.isArray(etudesData) ? etudesData : []);
      } catch (error) {
        console.error('Erreur lors du chargement des études:', error);
        setError('Erreur lors du chargement des études');
      }
    };
    loadEtudes();
  }, []);

  // Chargement de tous les paiements seulement si nécessaire et pas déjà fait
  useEffect(() => {
    const loadAllPaiements = async () => {
      if (!statutPaiement || allPaiementsLoaded) {
        return;
      }

      try {
        console.log('🔄 Chargement initial de tous les paiements pour filtrage par statut...');

        const allPaiementsData = [];

        const results = await Promise.allSettled(
          etudes.map(async (etude) => {
            try {
              const response = await etudeVolontaireService.getVolontairesByEtude(etude.idEtude);
              const paiementsData = Array.isArray(response) ? response : response?.data || [];
              return { etudeId: etude.idEtude, paiements: normalizePaiementsData(paiementsData) };
            } catch (error) {
              console.error(`Erreur paiements étude ${etude.idEtude}:`, error);
              return { etudeId: etude.idEtude, paiements: [] };
            }
          })
        );

        results.forEach((result) => {
          if (result.status === 'fulfilled' && result.value?.paiements) {
            allPaiementsData.push(...result.value.paiements);
          }
        });

        setAllPaiements(allPaiementsData);
        setAllPaiementsLoaded(true);
        console.log('✅ Tous les paiements chargés une seule fois:', allPaiementsData.length);

      } catch (error) {
        console.error('❌ Erreur lors du chargement de tous les paiements:', error);
      }
    };

    if (statutPaiement && etudes.length > 0 && !allPaiementsLoaded) {
      loadAllPaiements();
    }
  }, [statutPaiement, etudes, allPaiementsLoaded]);

  // Reset du flag si on enlève le filtre par statut
  useEffect(() => {
    if (!statutPaiement) {
      setAllPaiements([]);
      setAllPaiementsLoaded(false);
    }
  }, [statutPaiement]);

  // Filtrage et tri des études avec gestion du cache
  const etudesFiltrees = useMemo(() => {
    let filtered = [...etudes];

    // Filtrage par dates si des dates sont sélectionnées
    if (dateDebut || dateFin) {
      filtered = filtered.filter(etude => {
        if (!etude.dateDebut) return false;

        const dateEtude = new Date(etude.dateDebut);

        // dateDebut < dateEtude <= dateFin
        if (dateDebut && dateEtude <= new Date(dateDebut)) return false;
        if (dateFin && dateEtude > new Date(dateFin)) return false;

        return true;
      });
    }

    // Filtrage par statut de paiement avec gestion spéciale pour "Non payé"
    if (statutPaiement !== '') {
      const statutRecherche = parseInt(statutPaiement);

      if (statutRecherche === 0) {
        // ✅ SIMPLE : "Non payé" = garder seulement les études avec PAYE = 0
        filtered = filtered.filter(etude => etude.paye === 0);
        console.log(`📊 "Non payé" - Études avec PAYE = 0:`, filtered.length);

      } else if (statutRecherche === 2) {
        // ✅ SIMPLE : "Payé" = garder seulement les études avec PAYE = 2
        filtered = filtered.filter(etude => etude.paye === 2);
        console.log(`📊 "Payé" - Études avec PAYE = 2:`, filtered.length);

      } else {
        // Pour statut = 1 (En attente) : utiliser la logique des paiements individuels
        if (allPaiements.length > 0) {
          const etudesAvecStatut = new Set();

          allPaiements.forEach(paiement => {
            if (paiement.paye === statutRecherche) {
              etudesAvecStatut.add(paiement.idEtude);
            }
          });

          filtered = filtered.filter(etude => etudesAvecStatut.has(etude.idEtude));
          console.log(`📊 Filtrage - Études avec statut paiement ${statutRecherche}:`, etudesAvecStatut.size);
        } else {
          console.log('⏳ Filtre par statut demandé, chargement en cours...');
        }
      }
    }
    
    // Tri en ordre descendant par date de début
    filtered.sort((a, b) => {
      const dateA = new Date(a.dateDebut);
      const dateB = new Date(b.dateDebut);
      return dateB - dateA; // Ordre descendant
    });

    return filtered;
  }, [etudes, dateDebut, dateFin, statutPaiement, allPaiements, allPaiementsLoaded]);

  // Reset de l'étude sélectionnée SEULEMENT si des filtres sont actifs ET l'étude n'est plus dans la liste filtrée
  useEffect(() => {
    if ((dateDebut || dateFin || statutPaiement) && selectedEtude && !etudesFiltrees.some(e => e.idEtude == selectedEtude)) {
      setSelectedEtude('');
    }
  }, [etudesFiltrees, selectedEtude, dateDebut, dateFin, statutPaiement]);

  // Fonction pour charger les informations des groupes
  const loadGroupesInfo = async (etudeIds) => {
    try {
      console.log('🔄 Chargement des groupes pour', etudeIds.length, 'études...');
      const groupesData = {};

      const results = await Promise.allSettled(
        etudeIds.map(async (etudeId) => {
          try {
            const groupes = await groupeService.getGroupesByIdEtude(etudeId);
            return { etudeId, groupes: Array.isArray(groupes) ? groupes : [] };
          } catch (error) {
            console.error(`Erreur groupes étude ${etudeId}:`, error);
            return { etudeId, groupes: [] };
          }
        })
      );

      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value?.groupes) {
          const { etudeId, groupes } = result.value;

          groupes.forEach(groupe => {
            groupesData[groupe.id || groupe.idGroupe] = groupe;
          });

          groupesData[`etude_${etudeId}`] = groupes;
        }
      });

      setGroupesInfo(groupesData);
      console.log('✅ Groupes chargés:', Object.keys(groupesData).length);

    } catch (error) {
      console.error('❌ Erreur lors du chargement des groupes:', error);
    }
  };

  // Fonction pour normaliser les données de paiements
  const normalizePaiementsData = (paiementsData) => {
    return paiementsData.map(paiement => ({
      ...paiement,
      idGroupe: paiement.idGroupe ?? 0,
      iv: paiement.iv ?? 0,
      numsujet: paiement.numsujet ?? 0,
      paye: paiement.paye ?? 0,
      statut: paiement.statut || 'actif',
      key: `${paiement.idEtude}_${paiement.idVolontaire}`,
      isComplete: !!(paiement.idEtude && paiement.idVolontaire)
    }));
  };

  // Chargement des informations des volontaires
  const loadVolontairesInfo = useCallback(async (volontaireIds) => {
    try {
      console.log('🔄 Chargement de', volontaireIds.length, 'volontaires...');
      const volontairesData = {};
      const results = await Promise.allSettled(
        volontaireIds.map(async (volontaireId) => {
          const response = await volontaireService.getDetails(volontaireId);
          return { id: volontaireId, data: response.data };
        })
      );

      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value?.data) {
          volontairesData[result.value.id] = result.value.data;
        }
      });

      setVolontairesInfo(volontairesData);
      console.log('✅ Volontaires chargés:', Object.keys(volontairesData).length);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des volontaires:', error);
    }
  }, []);

  // Chargement conditionnel des paiements
  const loadPaiements = async () => {
    try {
      setIsLoading(true);
      setError('');

      if (!selectedEtude) {
        console.log('ℹ️ Aucune étude sélectionnée - nettoyage des données');
        setPaiements([]);
        setVolontairesInfo({});
        setGroupesInfo({});
        setIsLoading(false);
        return;
      }

      console.log('🔄 Chargement des données pour l\'étude:', selectedEtude);

      // 1. Charger les paiements de cette étude UNIQUEMENT
      const response = await etudeVolontaireService.getVolontairesByEtude(selectedEtude);
      const paiementsData = Array.isArray(response) ? response : response?.data || [];

      if (paiementsData.length === 0) {
        console.log('ℹ️ Aucun paiement pour cette étude');
        setPaiements([]);
        setVolontairesInfo({});
        setGroupesInfo({});
        setIsLoading(false);
        return;
      }

      // 2. Normaliser les données
      const normalizedPaiements = normalizePaiementsData(paiementsData);
      setPaiements(normalizedPaiements);

      console.log('✅ Paiements chargés:', normalizedPaiements.length);

      // 3. Charger les volontaires de cette étude UNIQUEMENT
      const uniqueVolontaireIds = [...new Set(normalizedPaiements.map(p => p.idVolontaire).filter(id => id))];
      if (uniqueVolontaireIds.length > 0) {
        await loadVolontairesInfo(uniqueVolontaireIds);
      }

      // 4. Charger les groupes de cette étude UNIQUEMENT
      await loadGroupesInfo([selectedEtude]);

      console.log('✅ Toutes les données chargées pour l\'étude', selectedEtude);

    } catch (error) {
      console.error('❌ Erreur lors du chargement:', error);
      console.error('Détails:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        details: error.response?.data?.details
      });
      setError('Erreur lors du chargement des données de l\'étude');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPaiements();
  }, [selectedEtude]);

  // ✅ NOUVEAU : Marquer tous les paiements de l'étude comme payés
  const markAllAsPaid = async () => {
    if (!selectedEtudeData || !paiements || paiements.length === 0) {
      return;
    }

    // Filtrer seulement les paiements non payés
    const unpaidPaiements = paiements.filter(p => p.paye !== 1);

    if (unpaidPaiements.length === 0) {
      setError('Tous les paiements de cette étude sont déjà payés');
      return;
    }

    // Demander confirmation
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir marquer ${unpaidPaiements.length} paiement${unpaidPaiements.length !== 1 ? 's' : ''} comme payé${unpaidPaiements.length !== 1 ? 's' : ''} pour l'étude "${selectedEtudeData.ref}" ?\n\nCette action ne peut pas être annulée.`
    );

    if (!confirmed) {
      return;
    }

    setIsMassUpdating(true);
    setError('');

    try {
      console.log('🔄 Mise à jour en masse - Marquage comme payés:', unpaidPaiements.length);

      // Mettre à jour chaque paiement en parallèle
      const updatePromises = unpaidPaiements.map(async (paiement) => {
        try {
          await api.patch('/etude-volontaires/update-paye', null, {
            params: {
              idEtude: paiement.idEtude,
              idGroupe: paiement.idGroupe,
              idVolontaire: paiement.idVolontaire,
              iv: paiement.iv,
              numsujet: paiement.numsujet,
              paye: paiement.paye,
              statut: paiement.statut,
              nouveauPaye: 1 // Marquer comme payé
            }
          });
          return { success: true, paiement };
        } catch (error) {
          console.error(`❌ Erreur mise à jour paiement ${paiement.idVolontaire}:`, error);
          return { success: false, paiement, error };
        }
      });

      const results = await Promise.allSettled(updatePromises);

      // Analyser les résultats
      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          const { success, paiement, error } = result.value;
          if (success) {
            successCount++;
          } else {
            errorCount++;
            errors.push(`Volontaire ${paiement.idVolontaire}: ${error.message}`);
          }
        } else {
          errorCount++;
          errors.push(`Erreur système: ${result.reason}`);
        }
      });

      // Mettre à jour les données locales pour les succès
      let updatedPaiements = null;
      if (successCount > 0) {
        updatedPaiements = paiements.map(p => {
          const wasUpdated = unpaidPaiements.some(up =>
            up.idEtude === p.idEtude && up.idVolontaire === p.idVolontaire
          );
          return wasUpdated ? { ...p, paye: 1 } : p;
        });
        setPaiements(updatedPaiements);

        // Mise à jour du cache allPaiements si chargé
        if (allPaiementsLoaded) {
          setAllPaiements(prev => prev.map(p => {
            const wasUpdated = unpaidPaiements.some(up =>
              up.idEtude === p.idEtude && up.idVolontaire === p.idVolontaire
            );
            return wasUpdated ? { ...p, paye: 1 } : p;
          }));
        }

        // ✅ NOUVEAU : Mettre à jour le statut PAYE de l'étude (devrait être 2 car tout est payé)
        try {
          const newEtudePayeStatus = await etudeService.checkAndUpdatePayeStatus(
            selectedEtudeData.idEtude,
            updatedPaiements
          );

          // Mettre à jour la liste des études localement
          setEtudes(prev => prev.map(e =>
            e.idEtude === selectedEtudeData.idEtude
              ? { ...e, paye: newEtudePayeStatus }
              : e
          ));

          console.log(`✅ Étude ${selectedEtudeData.idEtude} - Statut PAYE mis à jour: ${newEtudePayeStatus}`);
        } catch (etudeError) {
          console.error('❌ Erreur mise à jour statut étude:', etudeError);
          // Ne pas faire échouer la mise à jour pour cette erreur
        }
      }

      // Afficher le résultat
      if (errorCount === 0) {
        console.log('✅ Mise à jour en masse réussie:', successCount);
        // Pas de message d'erreur, juste le succès visible dans l'interface
      } else {
        const errorMessage = `${successCount} paiement${successCount !== 1 ? 's' : ''} mis à jour avec succès, ${errorCount} erreur${errorCount !== 1 ? 's' : ''}:\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? '\n...' : ''}`;
        setError(errorMessage);
      }

    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour en masse:', error);
      setError('Erreur lors de la mise à jour en masse des paiements');
    } finally {
      setIsMassUpdating(false);
    }
  };

  // Mise à jour du statut de paiement (fonction existante inchangée)
  const updatePaiementStatus = async (paiement, nouveauStatut) => {
    const key = `${paiement.idEtude}_${paiement.idVolontaire}`;

    try {
      setUpdateStatus(prev => ({ ...prev, [key]: 'loading' }));

      await api.patch('/etude-volontaires/update-paye', null, {
        params: {
          idEtude: paiement.idEtude,
          idGroupe: paiement.idGroupe,
          idVolontaire: paiement.idVolontaire,
          iv: paiement.iv,
          numsujet: paiement.numsujet,
          paye: paiement.paye,
          statut: paiement.statut,
          nouveauPaye: nouveauStatut
        }
      });

      // Mise à jour locale
      const updatedPaiements = paiements.map(p =>
        p.idEtude === paiement.idEtude && p.idVolontaire === paiement.idVolontaire
          ? { ...p, paye: nouveauStatut }
          : p
      );
      setPaiements(updatedPaiements);

      // Mise à jour des allPaiements si ils sont chargés
      if (allPaiementsLoaded) {
        setAllPaiements(prev => prev.map(p =>
          p.idEtude === paiement.idEtude && p.idVolontaire === paiement.idVolontaire
            ? { ...p, paye: nouveauStatut }
            : p
        ));
      }

      // ✅ NOUVEAU : Vérifier et mettre à jour le statut PAYE de l'étude
      try {
        const newEtudePayeStatus = await etudeService.checkAndUpdatePayeStatus(
          paiement.idEtude,
          updatedPaiements
        );

        // Mettre à jour la liste des études localement
        setEtudes(prev => prev.map(e =>
          e.idEtude === paiement.idEtude
            ? { ...e, paye: newEtudePayeStatus }
            : e
        ));

        console.log(`✅ Étude ${paiement.idEtude} - Statut PAYE mis à jour: ${newEtudePayeStatus}`);
      } catch (etudeError) {
        console.error('❌ Erreur mise à jour statut étude:', etudeError);
        // Ne pas faire échouer la mise à jour du paiement pour cette erreur
      }

      setUpdateStatus(prev => ({ ...prev, [key]: 'success' }));

      setTimeout(() => {
        setUpdateStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[key];
          return newStatus;
        });
      }, 2000);

    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour:', error);
      setUpdateStatus(prev => ({ ...prev, [key]: 'error' }));

      const errorMessage = error.response?.data?.details ||
        error.response?.data?.message ||
        error.message ||
        'Erreur lors de la mise à jour du statut de paiement';
      setError(errorMessage);

      setTimeout(() => {
        setUpdateStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[key];
          return newStatus;
        });
      }, 3000);
    }
  };

  // Filtrage des paiements
  const paiementsFiltres = useMemo(() => {
    let filtered = paiements;

    if (showOnlyUnpaid) {
      filtered = filtered.filter(p => p.paye === 0);
    }

    return filtered;
  }, [paiements, showOnlyUnpaid]);

  // Statistiques
  const statistics = useMemo(() => {
    const total = paiementsFiltres.length;
    const payes = paiementsFiltres.filter(p => p.paye === 1).length;
    const nonPayes = paiementsFiltres.filter(p => p.paye === 0).length;
    const enAttente = paiementsFiltres.filter(p => p.paye === 2).length;
    const totalMontant = paiementsFiltres.reduce((sum, p) => sum + (p.iv || 0), 0);
    const montantPaye = paiementsFiltres.filter(p => p.paye === 1).reduce((sum, p) => sum + (p.iv || 0), 0);

    return {
      total,
      payes,
      nonPayes,
      enAttente,
      totalMontant,
      montantPaye,
      montantRestant: totalMontant - montantPaye
    };
  }, [paiementsFiltres]);

  // Fonctions utilitaires
  const getVolontaireName = (idVolontaire) => {
    const volontaire = volontairesInfo[idVolontaire];
    if (!volontaire) return `Volontaire #${idVolontaire}`;

    const prenom = volontaire.prenom || volontaire.prenomVol || '';
    const nom = volontaire.nom || volontaire.nomVol || '';

    if (prenom && nom) return `${prenom} ${nom}`;
    return volontaire.nomComplet || `Volontaire #${idVolontaire}`;
  };

  const getEtudeName = (idEtude) => {
    const etude = etudes.find(e => e.idEtude == idEtude);
    return etude ? etude.ref : `Étude #${idEtude}`;
  };

  const getGroupeName = (idGroupe, idEtude) => {
    const groupe = groupesInfo[idGroupe];
    if (groupe) {
      return groupe.nom || groupe.libelle || `Groupe ${idGroupe}`;
    }

    const groupesEtude = groupesInfo[`etude_${idEtude}`] || [];
    const groupeInEtude = groupesEtude.find(g => g.id === idGroupe || g.idGroupe === idGroupe);

    if (groupeInEtude) {
      return groupeInEtude.nom || groupeInEtude.libelle || `Groupe ${idGroupe}`;
    }

    return `Groupe #${idGroupe}`;
  };

  // ✅ NOUVEAU : Composant pour les actions en masse
  const MassActions = () => {
    if (!selectedEtudeData || !paiements || paiements.length === 0) {
      return null;
    }

    const unpaidCount = paiements.filter(p => p.paye !== 1).length;
    const allPaidCount = paiements.filter(p => p.paye === 1).length;

    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              Actions en masse
            </h3>
            <p className="text-sm text-gray-600">
              Étude: <span className="font-medium">{selectedEtudeData.ref}</span>
              <span className="ml-2">• {unpaidCount} non payé{unpaidCount !== 1 ? 's' : ''}</span>
              <span className="ml-2">• {allPaidCount} payé{allPaidCount !== 1 ? 's' : ''}</span>
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {unpaidCount === 0 && (
              <div className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded">
                ✅ Tous les paiements sont déjà payés
              </div>
            )}

            <button
              onClick={markAllAsPaid}
              disabled={isMassUpdating || unpaidCount === 0}
              className={`
                inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md
                ${isMassUpdating || unpaidCount === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }
                transition-colors duration-200
              `}
            >
              {isMassUpdating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Mise à jour...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Marquer tout comme payé
                  {unpaidCount > 0 && (
                    <span className="ml-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {unpaidCount}
                    </span>
                  )}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Informations sur l'action */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-500 space-y-1">
            <p>💡 <strong>Cette action va :</strong> Marquer tous les paiements non payés de cette étude comme "Payé"</p>
            {unpaidCount > 0 && (
              <p>📊 <strong>Impact :</strong> {unpaidCount} paiement{unpaidCount !== 1 ? 's' : ''} sera marqué{unpaidCount !== 1 ? 's' : ''} comme payé{unpaidCount !== 1 ? 's' : ''}</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ✅ NOUVEAU : Récupération de l'étude sélectionnée pour l'export
  const selectedEtudeData = useMemo(() => {
    return etudes.find(e => e.idEtude == selectedEtude) || null;
  }, [etudes, selectedEtude]);

  // Composant StatusIcon
  const StatusIcon = ({ status }) => {
    switch (status) {
      case 'loading':
        return <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>;
      case 'success':
        return <span className="text-green-500 text-lg">✓</span>;
      case 'error':
        return <span className="text-red-500 text-lg">✗</span>;
      default:
        return null;
    }
  };

  // Vérification des permissions
  const canManagePaiements = useMemo(() => {
    if (!authContext) {
      return false;
    }

    const { isAuthenticated, user, isAdmin, hasPermission } = authContext;

    if (!isAuthenticated || !user) {
      return false;
    }

    let canAccess = false;

    if (typeof isAdmin === 'function') {
      canAccess = isAdmin();
    }

    if (!canAccess && typeof hasPermission === 'function') {
      canAccess = hasPermission(2);
    }

    if (!canAccess && (user.role === 1 || user.role === 2)) {
      canAccess = true;
    }

    return canAccess;
  }, [authContext]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!canManagePaiements) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Accès refusé</h1>
          <p className="text-gray-600">Cette page est réservée aux administrateurs.</p>
          <div className="mt-4 space-x-3">
            <button
              onClick={() => window.history.back()}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              Retour
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Tableau de bord
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec indicateur de mode */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Gestion des paiements
          </h1>
          {selectedEtude && (
            <div className="mt-1">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                📋 {getEtudeName(selectedEtude)}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {statistics.total} paiement{statistics.total !== 1 ? 's' : ''}
          </span>
          {(dateDebut || dateFin || statutPaiement) && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              📅 {etudesFiltrees.length} étude{etudesFiltrees.length !== 1 ? 's' : ''} filtrée{etudesFiltrees.length !== 1 ? 's' : ''}
              {statutPaiement && !allPaiementsLoaded && (
                <span className="ml-1 animate-spin">⏳</span>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Messages d'erreur */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
          <button
            onClick={() => setError('')}
            className="absolute top-0 right-0 mt-2 mr-2 text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800">Total paiements</h3>
          <p className="text-2xl font-bold text-blue-900">{statistics.total}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-800">Payés</h3>
          <p className="text-2xl font-bold text-green-900">{statistics.payes}</p>
          <p className="text-sm text-green-700">{statistics.montantPaye.toFixed(0)} €</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-red-800">Non payés</h3>
          <p className="text-2xl font-bold text-red-900">{statistics.nonPayes}</p>
          <p className="text-sm text-red-700">{statistics.montantRestant.toFixed(0)} €</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-yellow-800">En attente</h3>
          <p className="text-2xl font-bold text-yellow-900">{statistics.enAttente}</p>
        </div>
      </div>

      {/* ✅ NOUVEAU : Composant d'export Excel */}
      {selectedEtudeData && paiements.length > 0 && (
        <ExcelExport
          etude={selectedEtudeData}
          paiements={paiementsFiltres}
          volontairesInfo={volontairesInfo}
          groupesInfo={groupesInfo}
          getVolontaireName={getVolontaireName}
          getGroupeName={getGroupeName}
        />
      )}

      {/* ✅ NOUVEAU : Composant d'actions en masse */}
      <MassActions />

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Filtres</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Filtre par statut de paiement pour les études avec indicateur de chargement */}
          <div>
            <label htmlFor="statut-select" className="block text-sm font-medium text-gray-700 mb-1">
              Statut de paiement
              <span className="text-xs text-gray-500 ml-1">(filtre les études)</span>
              {statutPaiement && !allPaiementsLoaded && (
                <span className="text-xs text-blue-600 ml-1">⏳</span>
              )}
            </label>
            <select
              id="statut-select"
              value={statutPaiement}
              onChange={(e) => setStatutPaiement(e.target.value)}
              className="form-input"
              disabled={statutPaiement && !allPaiementsLoaded}
            >
              <option value="">Tous les statuts</option>
              {Object.entries(PAIEMENT_STATUS).map(([value, config]) => (
                <option key={value} value={value}>
                  {config.label}
                </option>
              ))}
            </select>
            {statutPaiement && !allPaiementsLoaded && (
              <div className="text-xs text-blue-600 mt-1">
                Chargement des données pour le filtrage...
              </div>
            )}
          </div>

          {/* Selecteur d'études utilisant etudesFiltrees */}
          <div>
            <label htmlFor="etude-select" className="block text-sm font-medium text-gray-700 mb-1">
              Étude <span className="text-red-500">*</span>
              {(dateDebut || dateFin || statutPaiement) && (
                <span className="text-xs text-blue-600 ml-1">
                  ({etudesFiltrees.length} disponible{etudesFiltrees.length !== 1 ? 's' : ''})
                </span>
              )}
            </label>
            <select
              id="etude-select"
              value={selectedEtude}
              onChange={(e) => setSelectedEtude(e.target.value)}
              className="form-input"
            >
              <option value="">
                {etudesFiltrees.length === 0 && (dateDebut || dateFin || statutPaiement)
                  ? "-- Aucune étude correspondante --"
                  : "-- Sélectionnez une étude --"}
              </option>
              {etudesFiltrees.map(etude => (
                <option key={etude.idEtude} value={etude.idEtude}>
                  {etude.ref}
                  {etude.dateDebut && (
                    <> ({new Date(etude.dateDebut).toLocaleDateString('fr-FR')})</>
                  )}
                </option>
              ))}
            </select>
          </div>

          {/* Section des dates pour filtrer les études */}
          <div>
            <label htmlFor="date-debut" className="block text-sm font-medium text-gray-700 mb-1">
              Date de début
              <span className="text-xs text-gray-500 ml-1">(filtre les études)</span>
            </label>
            <input
              type="date"
              id="date-debut"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="form-input"
            />
          </div>

          <div>
            <label htmlFor="date-fin" className="block text-sm font-medium text-gray-700 mb-1">
              Date de fin
              <span className="text-xs text-gray-500 ml-1">(filtre les études)</span>
            </label>
            <input
              type="date"
              id="date-fin"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="form-input"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center">
          <input
            type="checkbox"
            id="only-unpaid"
            checked={showOnlyUnpaid}
            onChange={(e) => setShowOnlyUnpaid(e.target.checked)}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            disabled={!selectedEtude}
          />
          <label htmlFor="only-unpaid" className="ml-2 block text-sm text-gray-700">
            Afficher seulement les paiements non effectués
          </label>
        </div>
      </div>

      {/* Tableau avec gestion des messages selon les filtres */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {etudesFiltrees.length === 0 && (dateDebut || dateFin || statutPaiement) ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune étude correspondante
            </h3>
            <p className="text-gray-500">
              Aucune étude ne correspond aux filtres sélectionnés.
              <br />
              Modifiez les filtres ou supprimez-les pour voir plus d'études.
            </p>
          </div>
        ) : !selectedEtude ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Sélectionnez une étude
            </h3>
            <p className="text-gray-500">
              Choisissez une étude dans le filtre ci-dessus pour voir les paiements correspondants.
            </p>
          </div>
        ) : paiementsFiltres.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">
              Aucun paiement trouvé pour cette étude avec ces critères
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Étude
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Volontaire
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Groupe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Numéro sujet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant (€)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut paiement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paiementsFiltres.map((paiement, index) => {
                  const statutConfig = PAIEMENT_STATUS[paiement.paye] || PAIEMENT_STATUS[0];
                  const key = `${paiement.idEtude}_${paiement.idVolontaire}`;

                  return (
                    <tr
                      key={`${paiement.idEtude}-${paiement.idVolontaire}-${index}`}
                      className={statutConfig.bgColor}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="font-medium">
                          {getEtudeName(paiement.idEtude)}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">
                            {getVolontaireName(paiement.idVolontaire)}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {paiement.idVolontaire}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getGroupeName(paiement.idGroupe, paiement.idEtude)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {paiement.numsujet || 'Non défini'}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="font-semibold">
                          {(paiement.iv || 0).toFixed(0)} €
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex items-center text-xs font-semibold rounded-full border ${statutConfig.style}`}
                        >
                          <span className="mr-1">{statutConfig.icon}</span>
                          {statutConfig.label}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center space-x-2">
                          <select
                            value={paiement.paye}
                            onChange={(e) => updatePaiementStatus(paiement, parseInt(e.target.value))}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                            disabled={updateStatus[key] === 'loading'}
                          >
                            {Object.entries(PAIEMENT_STATUS).map(([value, config]) => (
                              <option key={value} value={value}>
                                {config.icon} {config.label}
                              </option>
                            ))}
                          </select>
                          <StatusIcon status={updateStatus[key]} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaiementsPage;