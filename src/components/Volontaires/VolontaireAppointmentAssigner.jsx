import React, { useState, useEffect } from 'react';
import rdvService from '../../services/rdvService';
import etudeService from '../../services/etudeService';
import groupeService from '../../services/groupeService';
import etudeVolontaireService from '../../services/etudeVolontaireService';

/**
 * Composant pour assigner un volontaire spécifique à des rendez-vous
 * Utilisé dans la page de détail du volontaire
 */
const VolontaireAppointmentAssigner = ({ volontaireId, volontaire, onAssignmentComplete }) => {
  // États de base
  const [etudes, setEtudes] = useState([]);
  const [selectedEtudeId, setSelectedEtudeId] = useState(null);
  const [etudeDetails, setEtudeDetails] = useState({});

  // États pour les groupes
  const [groupes, setGroupes] = useState([]);
  const [selectedGroupeId, setSelectedGroupeId] = useState(null);
  const [selectedGroupeDetails, setSelectedGroupeDetails] = useState(null);

  // États pour les rendez-vous
  const [appointments, setAppointments] = useState([]);
  const [availableAppointments, setAvailableAppointments] = useState([]);
  const [selectedAppointments, setSelectedAppointments] = useState([]);
  const [volunteerCurrentAppointments, setVolunteerCurrentAppointments] = useState([]);

  // États de filtrage et recherche
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('date'); // 'date', 'time', 'status'

  // États utilitaires
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Chargement initial des études
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const etudesData = await etudeService.getAll();
        setEtudes(Array.isArray(etudesData) ? etudesData : []);
      } catch (err) {
        console.error("Erreur lors du chargement des études:", err);
        setError("Impossible de charger les études");
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Charger les détails du groupe sélectionné
  useEffect(() => {
    const loadGroupeDetails = async () => {
      if (!selectedGroupeId) {
        setSelectedGroupeDetails(null);
        return;
      }

      try {
        console.log("🔍 Chargement détails groupe:", selectedGroupeId);
        const groupeDetails = await groupeService.getById(selectedGroupeId);
        console.log("📋 Détails groupe récupérés:", groupeDetails);
        setSelectedGroupeDetails(groupeDetails);
      } catch (err) {
        console.error("❌ Erreur chargement détails groupe:", err);
        setSelectedGroupeDetails(null);
      }
    };

    loadGroupeDetails();
  }, [selectedGroupeId]);

  // Chargement des données d'étude
  const loadEtudeData = async (etudeId) => {
    if (!etudeId) return;

    try {
      setLoading(true);

      // Charger l'étude, ses rendez-vous et ses groupes
      const [etude, rdvs, groupesData] = await Promise.all([
        etudeService.getById(etudeId),
        rdvService.getByEtudeId(etudeId),
        groupeService.getGroupesByIdEtude(etudeId)
      ]);

      setEtudeDetails(etude || {});
      setAppointments(Array.isArray(rdvs) ? rdvs : []);
      setGroupes(Array.isArray(groupesData) ? groupesData : []);

      // Sélectionner automatiquement le premier groupe s'il y en a un
      if (Array.isArray(groupesData) && groupesData.length > 0) {
        const firstGroupeId = groupesData[0].id || groupesData[0].idGroupe;
        setSelectedGroupeId(firstGroupeId);
      }

      // Séparer les RDV disponibles des RDV déjà assignés au volontaire
      const rdvList = Array.isArray(rdvs) ? rdvs : [];
      const available = rdvList.filter(rdv => {
        const hasVolunteer = rdv.volontaire || rdv.idVolontaire;
        if (!hasVolunteer) return true; // RDV libre
        // RDV occupé par un autre volontaire
        const assignedVolId = rdv.volontaire?.id || rdv.idVolontaire;
        return parseInt(assignedVolId) !== parseInt(volontaireId);
      });

      const currentVolunteerRdvs = rdvList.filter(rdv => {
        const assignedVolId = rdv.volontaire?.id || rdv.idVolontaire;
        return parseInt(assignedVolId) === parseInt(volontaireId);
      });

      setAvailableAppointments(available);
      setVolunteerCurrentAppointments(currentVolunteerRdvs);

    } catch (err) {
      console.error("Erreur lors du chargement des données d'étude:", err);
      setError("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  // Recharger quand l'étude change
  useEffect(() => {
    if (selectedEtudeId) {
      loadEtudeData(selectedEtudeId);
    } else {
      // Réinitialiser
      setEtudeDetails({});
      setAppointments([]);
      setAvailableAppointments([]);
      setVolunteerCurrentAppointments([]);
      setSelectedAppointments([]);
      setGroupes([]);
      setSelectedGroupeId(null);
      setSelectedGroupeDetails(null);
    }
  }, [selectedEtudeId, volontaireId]);

  // Réinitialiser les sélections quand on change d'étude
  useEffect(() => {
    setSelectedAppointments([]);
  }, [selectedEtudeId]);

  // Helpers
  const getAppointmentId = (rdv) => rdv.idRdv || rdv.id;
  const getGroupeId = (groupe) => groupe.id || groupe.idGroupe;

  // 1. 🔥 FONCTION DE SUPPRESSION AGRESSIVE (version complète)
  const handleEtudeVolontaireOnUnassign = async (etudeId, volontaireId) => {
    try {
      console.log("🔥 SUPPRESSION AGRESSIVE VolontaireAssigner:", { etudeId, volontaireId });

      // Récupérer l'association existante
      const existingAssociationsResponse = await etudeVolontaireService.getVolontairesByEtude(etudeId);

      let existingAssociations = [];
      if (Array.isArray(existingAssociationsResponse)) {
        existingAssociations = existingAssociationsResponse;
      } else if (existingAssociationsResponse?.data) {
        existingAssociations = Array.isArray(existingAssociationsResponse.data) ?
          existingAssociationsResponse.data : [existingAssociationsResponse.data];
      }

      const existingAssoc = existingAssociations.find(assoc =>
        parseInt(assoc.idVolontaire) === parseInt(volontaireId)
      );

      if (!existingAssoc) {
        console.log("ℹ️ Aucune association trouvée pour ce volontaire");
        return;
      }

      console.log("🔍 Association trouvée:", existingAssoc);

      if (existingAssoc.numsujet && existingAssoc.numsujet > 0) {
        console.log(`🚨 Association avec numsujet = ${existingAssoc.numsujet} - SUPPRESSION FORCÉE !`);
      }

      // Stratégies de suppression multiples
      const strategies = [];

      // Stratégie 1: updateVolontaire avec null
      strategies.push(async () => {
        console.log("👤 Stratégie 1: updateVolontaire(null)");
        const associationId = etudeVolontaireService.createAssociationId(
          existingAssoc.idEtude,
          existingAssoc.idGroupe,
          existingAssoc.idVolontaire,
          existingAssoc.iv,
          existingAssoc.numsujet,
          existingAssoc.paye,
          existingAssoc.statut
        );

        await etudeVolontaireService.updateVolontaire(associationId, null);
        console.log("✅ updateVolontaire(null) réussi");
        return "updateVolontaire(null)";
      });

      // Stratégie 2: Reset numsujet puis suppression (si numsujet > 0)
      if (existingAssoc.numsujet && existingAssoc.numsujet > 0) {
        strategies.push(async () => {
          console.log("🔢 Stratégie 2: Reset numsujet puis suppression");
          const associationId = etudeVolontaireService.createAssociationId(
            existingAssoc.idEtude,
            existingAssoc.idGroupe,
            existingAssoc.idVolontaire,
            existingAssoc.iv,
            existingAssoc.numsujet,
            existingAssoc.paye,
            existingAssoc.statut
          );

          // Reset numsujet à 0
          await etudeVolontaireService.updateNumSujet(associationId, 0);
          await new Promise(resolve => setTimeout(resolve, 300));

          // Supprimer avec numsujet = 0
          const newAssociationId = etudeVolontaireService.createAssociationId(
            existingAssoc.idEtude,
            existingAssoc.idGroupe,
            existingAssoc.idVolontaire,
            existingAssoc.iv,
            0, // numsujet = 0
            existingAssoc.paye,
            existingAssoc.statut
          );

          await etudeVolontaireService.delete(newAssociationId);
          console.log("✅ Reset numsujet + suppression réussi");
          return "reset numsujet + delete";
        });
      }

      // Stratégie 3: Statut ANNULE puis suppression
      strategies.push(async () => {
        console.log("🏷️ Stratégie 3: Statut ANNULE puis suppression");
        const associationId = etudeVolontaireService.createAssociationId(
          existingAssoc.idEtude,
          existingAssoc.idGroupe,
          existingAssoc.idVolontaire,
          existingAssoc.iv,
          existingAssoc.numsujet,
          existingAssoc.paye,
          existingAssoc.statut
        );

        await etudeVolontaireService.updateStatut(associationId, 'ANNULE');

        const newAssociationId = etudeVolontaireService.createAssociationId(
          existingAssoc.idEtude,
          existingAssoc.idGroupe,
          existingAssoc.idVolontaire,
          existingAssoc.iv,
          existingAssoc.numsujet,
          existingAssoc.paye,
          'ANNULE'
        );

        await etudeVolontaireService.delete(newAssociationId);
        console.log("✅ Statut ANNULE + suppression réussi");
        return "statut ANNULE + delete";
      });

      // Stratégie 4: Suppression directe
      strategies.push(async () => {
        console.log("🗑️ Stratégie 4: Suppression directe");
        await etudeVolontaireService.desassignerVolontaireDEtude(etudeId, volontaireId);
        console.log("✅ desassignerVolontaireDEtude réussi");
        return "desassignerVolontaireDEtude";
      });

      // Essayer chaque stratégie
      let suppressionReussie = false;
      let methodUsed = null;

      for (const [index, strategy] of strategies.entries()) {
        try {
          console.log(`🔄 Tentative stratégie ${index + 1}/${strategies.length}...`);
          methodUsed = await strategy();
          console.log(`✅ Stratégie ${index + 1} RÉUSSIE: ${methodUsed}`);
          suppressionReussie = true;
          break;
        } catch (error) {
          console.warn(`⚠️ Stratégie ${index + 1} ÉCHOUÉE:`, error.message);
        }
      }

      // Vérification finale
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const verificationResponse = await etudeVolontaireService.getVolontairesByEtude(etudeId);
        let associations = [];

        if (Array.isArray(verificationResponse)) {
          associations = verificationResponse;
        } else if (verificationResponse?.data) {
          associations = Array.isArray(verificationResponse.data) ?
            verificationResponse.data : [verificationResponse.data];
        }

        const stillExists = associations.some(assoc =>
          parseInt(assoc.idVolontaire) === parseInt(volontaireId)
        );

        if (stillExists) {
          console.error("🚨 PROBLÈME: L'association EXISTE ENCORE !");
          throw new Error(`L'association persiste malgré toutes les tentatives`);
        } else {
          console.log("🎉 SUCCÈS: Association complètement supprimée !");
        }
      } catch (verificationError) {
        if (verificationError.message && verificationError.message.includes('persiste')) {
          throw verificationError;
        }
        console.warn("⚠️ Impossible de vérifier la suppression:", verificationError);
      }

      console.log(`✅ Suppression terminée avec succès via: ${methodUsed}`);

    } catch (error) {
      console.error('🔥 ERREUR lors de la suppression agressive:', error);
      // Dans ce composant, on peut continuer même si ça échoue
    }
  };

  // 2. 🔄 FONCTION DE CRÉATION/REMPLACEMENT (version complète)
  const createOrUpdateEtudeVolontaireAssociation = async (etudeId, volontaireId, groupeId) => {
    try {
      console.log("🔄 Création/Remplacement association VolontaireAssigner:", { etudeId, volontaireId, groupeId });

      // Récupérer l'IV du groupe sélectionné ou depuis les détails du groupe
      let ivGroupe = 0;
      try {
        if (selectedGroupeDetails && selectedGroupeDetails.iv !== undefined) {
          // Utiliser les détails du groupe déjà chargés
          ivGroupe = parseInt(selectedGroupeDetails.iv) || 0;
          console.log("💰 IV du groupe (depuis cache):", ivGroupe);
        } else if (groupeId && groupeId > 0) {
          // Fallback: charger les détails du groupe
          const groupeDetails = await groupeService.getById(groupeId);
          if (groupeDetails && groupeDetails.iv !== undefined) {
            ivGroupe = parseInt(groupeDetails.iv) || 0;
            console.log("💰 IV du groupe (depuis API):", ivGroupe);
          }
        }
      } catch (err) {
        console.warn("⚠️ Impossible de récupérer l'IV du groupe:", err);
      }

      // 1. 🗑️ SUPPRESSION AGRESSIVE de toute association existante
      console.log("🔥 Suppression agressive de toute association existante...");
      try {
        await handleEtudeVolontaireOnUnassign(etudeId, volontaireId);
        console.log("✅ Suppression agressive terminée");
      } catch (deleteError) {
        console.warn("⚠️ Erreur lors de la suppression agressive (on continue):", deleteError.message);
      }

      // 2. ⏱️ Pause de sécurité
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 3. ✨ Création de la nouvelle association fraîche
      console.log("✨ Création de la nouvelle association fraîche...");

      const associationData = {
        idEtude: parseInt(etudeId),
        idVolontaire: parseInt(volontaireId),
        idGroupe: parseInt(groupeId) || 0,
        iv: ivGroupe,
        numsujet: 0, // 🎯 Toujours 0 pour un nouveau départ
        paye: ivGroupe > 0 ? 1 : 0,
        statut: 'INSCRIT'
      };

      console.log("📋 Données de la nouvelle association:", associationData);

      const result = await etudeVolontaireService.create(associationData);
      console.log(`🎉 Nouvelle association créée avec succès: Étude ${etudeId}, Volontaire ${volontaireId}, Groupe ${groupeId}, IV: ${ivGroupe}€`);

      return result;

    } catch (error) {
      console.error('❌ Erreur lors de la création/remplacement agressif:', error);
      throw error; // Dans ce composant, on peut faire échouer car c'est une assignation depuis la page du volontaire
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  const formatTime = (timeString) => {
    return timeString || 'Non spécifiée';
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'CONFIRME':
        return 'bg-green-100 text-green-800';
      case 'EN_ATTENTE':
        return 'bg-yellow-100 text-yellow-800';
      case 'ANNULE':
        return 'bg-red-100 text-red-800';
      case 'COMPLETE':
        return 'bg-blue-100 text-blue-800';
      case 'PLANIFIE':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filtrage et tri des rendez-vous disponibles
  const filteredAvailableAppointments = availableAppointments
    .filter(rdv => {
      if (searchQuery.trim() === '') return true;
      const searchLower = searchQuery.toLowerCase();
      return (
        formatDate(rdv.date).toLowerCase().includes(searchLower) ||
        formatTime(rdv.heure).toLowerCase().includes(searchLower) ||
        (rdv.etat || '').toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      switch (sortOption) {
        case 'date':
          return new Date(a.date) - new Date(b.date);
        case 'time':
          return (a.heure || '').localeCompare(b.heure || '');
        case 'status':
          return (a.etat || '').localeCompare(b.etat || '');
        default:
          return 0;
      }
    });

  // Handlers
  const handleEtudeChange = (e) => {
    const value = e.target.value;
    setSelectedEtudeId(value ? parseInt(value, 10) : null);
  };

  const handleGroupeChange = (e) => {
    const value = e.target.value;
    setSelectedGroupeId(value ? parseInt(value, 10) : null);
  };

  const handleSelectAppointment = (rdv) => {
    const id = getAppointmentId(rdv);
    const isSelected = selectedAppointments.some(selected => getAppointmentId(selected) === id);

    if (isSelected) {
      setSelectedAppointments(prev => prev.filter(selected => getAppointmentId(selected) !== id));
    } else {
      setSelectedAppointments(prev => [...prev, rdv]);
    }
  };

  const handleSelectAllAppointments = () => {
    const allSelected = filteredAvailableAppointments.every(rdv =>
      selectedAppointments.some(selected => getAppointmentId(selected) === getAppointmentId(rdv))
    );

    if (allSelected) {
      // Désélectionner tous
      setSelectedAppointments(prev =>
        prev.filter(selected => !filteredAvailableAppointments.some(rdv => getAppointmentId(rdv) === getAppointmentId(selected)))
      );
    } else {
      // Sélectionner tous les disponibles
      setSelectedAppointments(prev => [
        ...prev.filter(selected => !filteredAvailableAppointments.includes(selected)),
        ...filteredAvailableAppointments
      ]);
    }
  };

  // Assignation des rendez-vous sélectionnés au volontaire
  const handleAssignAppointments = async () => {
    if (!selectedEtudeId || selectedAppointments.length === 0 || !selectedGroupeId) {
      alert("Veuillez sélectionner une étude, un groupe et au moins un rendez-vous.");
      return;
    }

    if (!window.confirm(`Voulez-vous vraiment assigner ${volontaire?.prenom} ${volontaire?.nom} à ${selectedAppointments.length} rendez-vous ?`)) {
      return;
    }

    try {
      setLoading(true);

      // Effectuer les assignations
      const promises = selectedAppointments.map(async (rdv) => {
        console.log(`🎯 Assignation: RDV ${getAppointmentId(rdv)} -> Volontaire ${volontaireId}`);

        // 1. 🆕 Créer/Mettre à jour l'association EtudeVolontaire AVEC IV du groupe
        try {
          await createOrUpdateEtudeVolontaireAssociation(selectedEtudeId, volontaireId, selectedGroupeId);
          console.log("✅ Association EtudeVolontaire créée/mise à jour avec succès");
        } catch (assocError) {
          console.warn("⚠️ Erreur association EtudeVolontaire:", assocError);
          // On continue même si l'association échoue
        }

        // 2. Mettre à jour le RDV avec le volontaire et le groupe
        const updatedData = {
          idEtude: selectedEtudeId,
          idRdv: getAppointmentId(rdv),
          idVolontaire: parseInt(volontaireId),
          idGroupe: selectedGroupeId, // Inclure l'ID du groupe
          date: rdv.date,
          heure: rdv.heure,
          etat: rdv.etat || 'PLANIFIE',
          commentaires: rdv.commentaires
        };

        console.log("📋 Mise à jour RDV:", updatedData);
        return rdvService.update(selectedEtudeId, getAppointmentId(rdv), updatedData);
      });

      await Promise.all(promises);

      let successMessage = `${selectedAppointments.length} assignation(s) effectuée(s) avec succès.`;
      if (selectedGroupeDetails && selectedGroupeDetails.iv > 0) {
        successMessage += `\n\nIV du groupe appliqué: ${selectedGroupeDetails.iv}€.`;
      }

      alert(successMessage);

      // Rafraîchir les données
      await loadEtudeData(selectedEtudeId);

      // Réinitialiser les sélections
      setSelectedAppointments([]);

      // Callback pour notifier le parent
      if (onAssignmentComplete) {
        onAssignmentComplete();
      }

    } catch (err) {
      console.error("Erreur lors de l'assignation:", err);
      alert("Une erreur est survenue lors de l'assignation.");
    } finally {
      setLoading(false);
    }
  };

  // Désassigner le volontaire d'un RDV spécifique
  const handleUnassignAppointment = async (rdv) => {
    if (!window.confirm('Voulez-vous vraiment désassigner ce volontaire de ce rendez-vous ?')) {
      return;
    }

    try {
      setLoading(true);

      // 1. Supprimer l'association EtudeVolontaire si nécessaire
      if (selectedEtudeId) {
        try {
          await handleEtudeVolontaireOnUnassign(selectedEtudeId, volontaireId);
          console.log("✅ Association EtudeVolontaire supprimée");
        } catch (assocError) {
          console.warn("⚠️ Erreur suppression association EtudeVolontaire:", assocError);
        }
      }

      // 2. Désassigner le volontaire du RDV
      const updatedData = {
        idEtude: selectedEtudeId,
        idRdv: getAppointmentId(rdv),
        idVolontaire: null,
        idGroupe: rdv.idGroupe || rdv.groupe?.id || rdv.groupe?.idGroupe,
        date: rdv.date,
        heure: rdv.heure,
        etat: rdv.etat || 'PLANIFIE',
        commentaires: rdv.commentaires
      };

      console.log("📋 Désassignation (groupe conservé):", updatedData);
      await rdvService.update(selectedEtudeId, getAppointmentId(rdv), updatedData);

      // Rafraîchir les données
      await loadEtudeData(selectedEtudeId);

      alert('Volontaire désassigné avec succès.');

      // Callback pour notifier le parent
      if (onAssignmentComplete) {
        onAssignmentComplete();
      }

    } catch (err) {
      console.error('Erreur lors de la désassignation:', err);
      alert('Une erreur est survenue lors de la désassignation.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !etudes.length) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800">Assigner à des rendez-vous</h2>
        <p className="text-gray-600">
          Assigner <span className="font-medium">{volontaire?.prenom} {volontaire?.nom}</span> à des rendez-vous d'études
        </p>
      </div>

      {/* Sélection d'étude et de groupe */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sélectionner une étude</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedEtudeId || ''}
              onChange={handleEtudeChange}
              disabled={loading}
            >
              <option value="">-- Choisir une étude --</option>
              {[...etudes].reverse().map(etude => (
                <option key={`etude-${etude.id || etude.idEtude}`} value={etude.id || etude.idEtude}>
                  {etude.ref || 'N/A'} - {etude.titre || 'Sans titre'}
                </option>
              ))}
            </select>
          </div>

          {selectedEtudeId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Groupe à assigner
                {selectedGroupeDetails && selectedGroupeDetails.iv > 0 && (
                  <span className="ml-2 text-sm text-green-600 font-medium">
                    IV: {selectedGroupeDetails.iv}€
                  </span>
                )}
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedGroupeId || ''}
                onChange={handleGroupeChange}
                required
              >
                <option value="">-- Choisir un groupe --</option>
                {groupes.map((groupe, index) => (
                  <option key={`groupe-${getGroupeId(groupe)}-${index}`} value={getGroupeId(groupe)}>
                    {groupe.nom || `Groupe ${getGroupeId(groupe)}`}
                    {groupe.iv !== undefined && ` (IV: ${groupe.iv}€)`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Statistiques */}
        {selectedEtudeId && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <span className="block text-sm text-gray-500">Total RDV</span>
              <span className="text-xl font-semibold text-gray-900">{appointments.length}</span>
            </div>
            <div className="text-center">
              <span className="block text-sm text-gray-500">RDV disponibles</span>
              <span className="text-xl font-semibold text-green-600">{availableAppointments.length}</span>
            </div>
            <div className="text-center">
              <span className="block text-sm text-gray-500">RDV du volontaire</span>
              <span className="text-xl font-semibold text-blue-600">{volunteerCurrentAppointments.length}</span>
            </div>
            <div className="text-center">
              <span className="block text-sm text-gray-500">Groupes disponibles</span>
              <span className="text-xl font-semibold text-purple-600">{groupes.length}</span>
            </div>
          </div>
        )}
      </div>

      {/* Interface d'assignation */}
      {selectedEtudeId && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Section Rendez-vous disponibles */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Rendez-vous disponibles ({filteredAvailableAppointments.length})
                </h3>
                <select
                  className="text-sm px-2 py-1 border border-gray-300 rounded"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                >
                  <option value="date">Trier par date</option>
                  <option value="time">Trier par heure</option>
                  <option value="status">Trier par statut</option>
                </select>
              </div>

              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Rechercher par date, heure ou statut..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  {selectedAppointments.length} sélectionnés
                </span>
                <button
                  onClick={handleSelectAllAppointments}
                  className="text-sm px-3 py-1 border border-gray-300 rounded hover:bg-gray-100"
                  disabled={filteredAvailableAppointments.length === 0}
                >
                  Sélectionner tous
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {filteredAvailableAppointments.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  Aucun rendez-vous disponible
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredAvailableAppointments.map((rdv, index) => {
                    const id = getAppointmentId(rdv);
                    const isSelected = selectedAppointments.some(selected => getAppointmentId(selected) === id);

                    return (
                      <div
                        key={`rdv-${id}-${index}`}
                        className={`p-3 hover:bg-gray-50 cursor-pointer ${isSelected ? 'bg-blue-50' : ''}`}
                        onClick={() => handleSelectAppointment(rdv)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectAppointment(rdv)}
                              onClick={e => e.stopPropagation()}
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {formatDate(rdv.date)} à {formatTime(rdv.heure)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {rdv.volontaire || rdv.idVolontaire ? (
                                  <span className="text-orange-600">Occupé par un autre volontaire</span>
                                ) : (
                                  <span className="text-green-600">Disponible</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(rdv.etat)}`}>
                            {rdv.etat || 'N/A'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Section Rendez-vous actuels du volontaire */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                Rendez-vous actuels ({volunteerCurrentAppointments.length})
              </h3>
              <p className="text-sm text-gray-600">Rendez-vous déjà assignés à ce volontaire dans cette étude</p>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {volunteerCurrentAppointments.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  Aucun rendez-vous assigné dans cette étude
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {volunteerCurrentAppointments.map((rdv, index) => {
                    const id = getAppointmentId(rdv);

                    return (
                      <div key={`current-rdv-${id}-${index}`} className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {formatDate(rdv.date)} à {formatTime(rdv.heure)}
                            </div>
                            <div className="text-xs text-green-600">
                              Assigné à ce volontaire
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(rdv.etat)}`}>
                              {rdv.etat || 'N/A'}
                            </span>
                            <button
                              onClick={() => handleUnassignAppointment(rdv)}
                              className="text-red-600 hover:text-red-800 text-xs px-2 py-1 border border-red-300 rounded hover:bg-red-50"
                              disabled={loading}
                            >
                              Désassigner
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Panneau d'action */}
      {selectedEtudeId && selectedAppointments.length > 0 && selectedGroupeId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-blue-800">
                Assignation en cours
              </h3>
              <p className="text-sm text-blue-600">
                {selectedAppointments.length} rendez-vous • Groupe: {groupes.find(g => getGroupeId(g) === selectedGroupeId)?.nom || selectedGroupeId}
                {selectedGroupeDetails && selectedGroupeDetails.iv > 0 && (
                  <span className="text-green-600 font-medium"> (IV: {selectedGroupeDetails.iv}€)</span>
                )}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setSelectedAppointments([])}
                className="px-4 py-2 border border-blue-300 text-blue-700 rounded-md hover:bg-blue-100"
              >
                Réinitialiser
              </button>
              <button
                onClick={handleAssignAppointments}
                disabled={loading}
                className={`px-4 py-2 rounded-md text-white ${
                  loading
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? 'Assignation...' : 'Assigner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolontaireAppointmentAssigner;