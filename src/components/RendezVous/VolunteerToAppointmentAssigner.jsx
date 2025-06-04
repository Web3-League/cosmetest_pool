import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import rdvService from '../../services/rdvService';
import etudeService from '../../services/etudeService';
import volontaireService from '../../services/volontaireService';

/**
 * Composant pour assigner/désassigner des volontaires aux rendez-vous en masse
 * Permet de sélectionner une étude, voir les RDV, 
 * et assigner/désassigner rapidement des volontaires éligibles
 */
const VolunteerToAppointmentAssigner = () => {
  const navigate = useNavigate();
  const { id: etudeIdFromUrl } = useParams();

  // États de base
  const [etudes, setEtudes] = useState([]);
  const [selectedEtudeId, setSelectedEtudeId] = useState(etudeIdFromUrl || null);
  const [etudeDetails, setEtudeDetails] = useState({});
  
  // États pour les rendez-vous
  const [appointments, setAppointments] = useState([]);
  const [unassignedAppointments, setUnassignedAppointments] = useState([]);
  const [assignedAppointments, setAssignedAppointments] = useState([]);
  const [selectedAppointments, setSelectedAppointments] = useState([]);
  
  // États pour les volontaires
  const [volunteers, setVolunteers] = useState([]);
  const [availableVolunteers, setAvailableVolunteers] = useState([]);
  const [selectedVolunteers, setSelectedVolunteers] = useState([]);
  const [volunteerScheduleConflicts, setVolunteerScheduleConflicts] = useState(new Map());
  
  // États de filtrage et recherche
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOption, setFilterOption] = useState('unassigned'); // 'all', 'unassigned', 'assigned'
  const [volunteerFilterOption, setVolunteerFilterOption] = useState('all'); // 'all', 'hasAppointments', 'noAppointments'
  const [sortOption, setSortOption] = useState('date'); // 'date', 'time', 'status'
  
  // États utilitaires
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [assignmentMode, setAssignmentMode] = useState('auto'); // 'auto', 'manual'
  const [actionMode, setActionMode] = useState('assign'); // 'assign', 'unassign'

  // Chargement initial
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        
        // Charger études et volontaires en parallèle
        const [etudesData, volunteersData] = await Promise.all([
          etudeService.getAll(),
          volontaireService.getAllWithoutPagination()
        ]);
        
        setEtudes(Array.isArray(etudesData) ? etudesData : []);
        setVolunteers(Array.isArray(volunteersData) ? volunteersData : []);
        
        // Si une étude est passée en URL, la sélectionner
        if (etudeIdFromUrl) {
          const etudeId = parseInt(etudeIdFromUrl, 10);
          setSelectedEtudeId(etudeId);
          await loadEtudeData(etudeId);
        }
      } catch (err) {
        console.error("Erreur lors du chargement initial:", err);
        setError("Impossible de charger les données");
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, [etudeIdFromUrl]);

  // Chargement des données d'étude
  const loadEtudeData = async (etudeId) => {
    if (!etudeId) return;
    
    try {
      setLoading(true);
      
      // Charger l'étude et ses rendez-vous
      const [etude, rdvs] = await Promise.all([
        etudeService.getById(etudeId),
        rdvService.getByEtudeId(etudeId)
      ]);
      
      setEtudeDetails(etude || {});
      setAppointments(Array.isArray(rdvs) ? rdvs : []);
      
      // Filtrer les rendez-vous par assignation
      const unassigned = (Array.isArray(rdvs) ? rdvs : []).filter(rdv => 
        !rdv.volontaire && !rdv.idVolontaire
      );
      const assigned = (Array.isArray(rdvs) ? rdvs : []).filter(rdv => 
        rdv.volontaire || rdv.idVolontaire
      );
      
      setUnassignedAppointments(unassigned);
      setAssignedAppointments(assigned);
      
      // Créer un mapping des conflits d'horaires pour chaque volontaire
      const volunteerScheduleConflicts = new Map();
      (Array.isArray(rdvs) ? rdvs : []).forEach(rdv => {
        if (rdv.volontaire?.id || rdv.idVolontaire) {
          const volId = rdv.volontaire?.id || parseInt(rdv.idVolontaire);
          if (!volunteerScheduleConflicts.has(volId)) {
            volunteerScheduleConflicts.set(volId, []);
          }
          volunteerScheduleConflicts.get(volId).push({
            date: rdv.date,
            heure: rdv.heure,
            rdvId: rdv.idRdv || rdv.id
          });
        }
      });
      
      // Tous les volontaires sont "disponibles" - on gérera les conflits lors de l'assignation
      setAvailableVolunteers(volunteers);
      
      // Stocker les conflits pour utilisation ultérieure
      setVolunteerScheduleConflicts(volunteerScheduleConflicts);
      
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
      setUnassignedAppointments([]);
      setAssignedAppointments([]);
      setAvailableVolunteers([]);
      setVolunteerScheduleConflicts(new Map());
      setSelectedAppointments([]);
      setSelectedVolunteers([]);
    }
  }, [selectedEtudeId, volunteers]);

  // Réinitialiser les sélections quand on change de mode
  useEffect(() => {
    setSelectedAppointments([]);
    setSelectedVolunteers([]);
  }, [actionMode, filterOption]);

  // Helpers
  const getAppointmentId = (rdv) => rdv.idRdv || rdv.id;
  const getVolunteerId = (vol) => vol.id || vol.volontaireId;
  
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

  // Vérifier si un volontaire a un conflit d'horaire avec un RDV donné
  const hasScheduleConflict = (volunteerId, appointmentDate, appointmentTime) => {
    const volId = parseInt(volunteerId);
    const conflicts = volunteerScheduleConflicts.get(volId) || [];
    
    return conflicts.some(conflict => 
      conflict.date === appointmentDate && conflict.heure === appointmentTime
    );
  };

  // Obtenir le nombre de RDV existants pour un volontaire
  const getVolunteerAppointmentCount = (volunteerId) => {
    const volId = parseInt(volunteerId);
    const conflicts = volunteerScheduleConflicts.get(volId) || [];
    return conflicts.length;
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

  // Filtrage des rendez-vous
  const filteredAppointments = appointments
    .filter(rdv => {
      switch (filterOption) {
        case 'unassigned': 
          return !rdv.volontaire && !rdv.idVolontaire;
        case 'assigned': 
          return rdv.volontaire || rdv.idVolontaire;
        default: 
          return true;
      }
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

  // Filtrage des volontaires
  const filteredVolunteers = volunteers
    .filter(vol => {
      // Filtrer par recherche
      const searchMatch = searchQuery.trim() === '' || 
        (vol.nom && vol.nom.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (vol.prenom && vol.prenom.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (vol.email && vol.email.toLowerCase().includes(searchQuery.toLowerCase()));
      
      if (!searchMatch) return false;
      
      // Filtrer par nombre de RDV existants
      const appointmentCount = getVolunteerAppointmentCount(getVolunteerId(vol));
      
      switch (volunteerFilterOption) {
        case 'hasAppointments': 
          return appointmentCount > 0;
        case 'noAppointments': 
          return appointmentCount === 0;
        default: 
          return true;
      }
    });

  // Handlers
  const handleEtudeChange = (e) => {
    const value = e.target.value;
    setSelectedEtudeId(value ? parseInt(value, 10) : null);
  };

  const handleSelectAppointment = (rdv) => {
    const id = getAppointmentId(rdv);
    const isSelected = selectedAppointments.some(selected => getAppointmentId(selected) === id);
    
    if (isSelected) {
      setSelectedAppointments(prev => prev.filter(selected => getAppointmentId(selected) !== id));
    } else {
      // Pour l'assignation, seulement les RDV sans volontaire peuvent être sélectionnés
      // Pour la désassignation, seulement les RDV avec volontaire peuvent être sélectionnés
      const hasVolunteer = rdv.volontaire || rdv.idVolontaire;
      const canSelect = (actionMode === 'assign' && !hasVolunteer) || (actionMode === 'unassign' && hasVolunteer);
      
      if (canSelect) {
        setSelectedAppointments(prev => [...prev, rdv]);
      }
    }
  };

  const handleSelectVolunteer = (vol) => {
    const id = getVolunteerId(vol);
    const isSelected = selectedVolunteers.some(selected => getVolunteerId(selected) === id);
    
    if (isSelected) {
      setSelectedVolunteers(prev => prev.filter(selected => getVolunteerId(selected) !== id));
    } else {
      setSelectedVolunteers(prev => [...prev, vol]);
    }
  };

  const handleSelectAllAppointments = () => {
    const hasVolunteer = (rdv) => rdv.volontaire || rdv.idVolontaire;
    const eligibleAppointments = filteredAppointments.filter(rdv => 
      (actionMode === 'assign' && !hasVolunteer(rdv)) || (actionMode === 'unassign' && hasVolunteer(rdv))
    );
    
    const allSelected = eligibleAppointments.every(rdv => 
      selectedAppointments.some(selected => getAppointmentId(selected) === getAppointmentId(rdv))
    );
    
    if (allSelected) {
      // Désélectionner tous
      setSelectedAppointments(prev => 
        prev.filter(selected => !eligibleAppointments.some(rdv => getAppointmentId(rdv) === getAppointmentId(selected)))
      );
    } else {
      // Sélectionner tous les éligibles
      setSelectedAppointments(prev => [
        ...prev.filter(selected => !eligibleAppointments.includes(selected)),
        ...eligibleAppointments
      ]);
    }
  };

  const handleSelectAllVolunteers = () => {
    const allSelected = filteredVolunteers.every(vol => 
      selectedVolunteers.some(selected => getVolunteerId(selected) === getVolunteerId(vol))
    );
    
    if (allSelected) {
      // Désélectionner tous
      setSelectedVolunteers(prev => 
        prev.filter(selected => !filteredVolunteers.some(vol => getVolunteerId(vol) === getVolunteerId(selected)))
      );
    } else {
      // Sélectionner tous les volontaires filtrés
      setSelectedVolunteers(prev => [
        ...prev.filter(selected => !filteredVolunteers.includes(selected)),
        ...filteredVolunteers
      ]);
    }
  };

  // Assignation en masse
  const handleMassAssignment = async () => {
    if (!selectedEtudeId || selectedAppointments.length === 0) {
      alert("Veuillez sélectionner au moins un rendez-vous.");
      return;
    }

    if (actionMode === 'assign' && selectedVolunteers.length === 0) {
      alert("Veuillez sélectionner au moins un volontaire pour l'assignation.");
      return;
    }

    try {
      setLoading(true);

      if (actionMode === 'unassign') {
        // Mode désassignation
        const unassignments = selectedAppointments.map(rdv => ({
          rdv: rdv,
          currentVolunteer: rdv.volontaire || { id: rdv.idVolontaire }
        }));

        if (!window.confirm(`Voulez-vous vraiment désassigner ${unassignments.length} volontaire(s) de leurs rendez-vous ?`)) {
          setLoading(false);
          return;
        }

        // Effectuer les désassignations
        const promises = unassignments.map(async ({ rdv }) => {
          const updatedData = {
            idEtude: selectedEtudeId,
            idRdv: getAppointmentId(rdv),
            idVolontaire: null, // Désassigner
            date: rdv.date,
            heure: rdv.heure,
            etat: rdv.etat || 'PLANIFIE',
            commentaires: rdv.commentaires
          };

          return rdvService.update(selectedEtudeId, getAppointmentId(rdv), updatedData);
        });

        await Promise.all(promises);
        alert(`${unassignments.length} désassignation(s) effectuée(s) avec succès.`);

      } else {
        // Mode assignation (code existant)
        let assignments = [];
        let conflicts = [];

        if (assignmentMode === 'auto') {
          // Mode automatique : assigner 1 volontaire par RDV dans l'ordre
          const minLength = Math.min(selectedAppointments.length, selectedVolunteers.length);
          
          for (let i = 0; i < minLength; i++) {
            const rdv = selectedAppointments[i];
            const volunteer = selectedVolunteers[i];
            
            // Vérifier les conflits d'horaires
            const hasConflict = hasScheduleConflict(
              getVolunteerId(volunteer), 
              rdv.date, 
              rdv.heure
            );
            
            if (hasConflict) {
              conflicts.push({
                volunteer: `${volunteer.prenom} ${volunteer.nom}`,
                date: formatDate(rdv.date),
                time: formatTime(rdv.heure)
              });
            } else {
              assignments.push({
                rdv: rdv,
                volunteer: volunteer
              });
            }
          }

          // Alerter sur les conflits
          if (conflicts.length > 0) {
            const conflictMessage = conflicts.map(c => 
              `• ${c.volunteer} - ${c.date} à ${c.time}`
            ).join('\n');
            
            const proceed = window.confirm(
              `ATTENTION: ${conflicts.length} conflit(s) d'horaire détecté(s):\n\n${conflictMessage}\n\nVoulez-vous continuer avec les ${assignments.length} assignations sans conflit?`
            );
            
            if (!proceed) {
              setLoading(false);
              return;
            }
          }

          // Alerter sur la différence de nombre
          if (selectedAppointments.length !== selectedVolunteers.length && assignments.length > 0) {
            const diff = Math.abs(selectedAppointments.length - selectedVolunteers.length);
            const more = selectedAppointments.length > selectedVolunteers.length ? 'rendez-vous' : 'volontaires';
            
            if (!window.confirm(`Il y a ${diff} ${more} en plus. Continuer avec ${assignments.length} assignations?`)) {
              setLoading(false);
              return;
            }
          }

        } else {
          // Mode manuel : permettre à l'utilisateur de choisir les paires
          alert("Mode manuel à implémenter. Utilisation du mode automatique.");
          setLoading(false);
          return;
        }

        if (assignments.length === 0) {
          alert("Aucune assignation possible sans conflit d'horaire.");
          setLoading(false);
          return;
        }

        // Effectuer les assignations
        const promises = assignments.map(async ({ rdv, volunteer }) => {
          const updatedData = {
            idEtude: selectedEtudeId,
            idRdv: getAppointmentId(rdv),
            idVolontaire: getVolunteerId(volunteer),
            date: rdv.date,
            heure: rdv.heure,
            etat: rdv.etat || 'PLANIFIE',
            commentaires: rdv.commentaires
          };

          return rdvService.update(selectedEtudeId, getAppointmentId(rdv), updatedData);
        });

        await Promise.all(promises);

        let successMessage = `${assignments.length} assignation(s) effectuée(s) avec succès.`;
        if (conflicts.length > 0) {
          successMessage += `\n\n${conflicts.length} assignation(s) ignorée(s) à cause de conflits d'horaires.`;
        }
        
        alert(successMessage);
      }

      // Rafraîchir les données
      await loadEtudeData(selectedEtudeId);
      
      // Réinitialiser les sélections
      setSelectedAppointments([]);
      setSelectedVolunteers([]);

    } catch (err) {
      console.error(`Erreur lors de l'${actionMode === 'assign' ? 'assignation' : 'désassignation'} en masse:`, err);
      alert(`Une erreur est survenue lors de l'${actionMode === 'assign' ? 'assignation' : 'désassignation'}.`);
    } finally {
      setLoading(false);
    }
  };

  // Désassigner un volontaire spécifique d'un RDV
  const handleUnassignSingle = async (rdv) => {
    if (!window.confirm('Voulez-vous vraiment désassigner ce volontaire ?')) {
      return;
    }

    try {
      setLoading(true);

      const updatedData = {
        idEtude: selectedEtudeId,
        idRdv: getAppointmentId(rdv),
        idVolontaire: null,
        date: rdv.date,
        heure: rdv.heure,
        etat: rdv.etat || 'PLANIFIE',
        commentaires: rdv.commentaires
      };

      await rdvService.update(selectedEtudeId, getAppointmentId(rdv), updatedData);
      
      // Rafraîchir les données
      await loadEtudeData(selectedEtudeId);
      
      alert('Volontaire désassigné avec succès.');

    } catch (err) {
      console.error('Erreur lors de la désassignation:', err);
      alert('Une erreur est survenue lors de la désassignation.');
    } finally {
      setLoading(false);
    }
  };

  // Affichage de chargement
  if (loading && !etudes.length) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Affichage d'erreur
  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
        <p>{error}</p>
        <button onClick={() => navigate('/rdv')} className="mt-4 px-4 py-2 bg-red-600 text-white rounded">
          Retour aux rendez-vous
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* En-tête */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Assignation / Désassignation en masse</h1>
          <p className="text-gray-600">Assigner ou désassigner rapidement des volontaires aux rendez-vous</p>
          {selectedEtudeId && etudeDetails && (
            <p className="text-gray-600 mt-1">
              Étude: <span className="font-medium">{etudeDetails.ref || 'N/A'} - {etudeDetails.titre || 'Sans titre'}</span>
            </p>
          )}
        </div>
        <button 
          onClick={() => navigate('/rdv')}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
        >
          Retour aux RDV
        </button>
      </div>

      {/* Sélection d'étude et mode d'action */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sélectionner une étude</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedEtudeId || ''}
              onChange={handleEtudeChange}
              disabled={loading}
            >
              <option value="">-- Choisir une étude --</option>
              {etudes.map(etude => (
                <option key={etude.id || etude.idEtude} value={etude.id || etude.idEtude}>
                  {etude.ref || 'N/A'} - {etude.titre || 'Sans titre'}
                </option>
              ))}
            </select>
          </div>

          {selectedEtudeId && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Action à effectuer</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={actionMode}
                  onChange={(e) => setActionMode(e.target.value)}
                >
                  <option value="assign">Assigner des volontaires</option>
                  <option value="unassign">Désassigner des volontaires</option>
                </select>
              </div>

              {actionMode === 'assign' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mode d'assignation</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={assignmentMode}
                    onChange={(e) => setAssignmentMode(e.target.value)}
                  >
                    <option value="auto">Automatique (1 volontaire par RDV)</option>
                    <option value="manual" disabled>Manuel (à implémenter)</option>
                  </select>
                </div>
              )}
            </>
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
              <span className="block text-sm text-gray-500">RDV sans volontaire</span>
              <span className="text-xl font-semibold text-orange-600">{unassignedAppointments.length}</span>
            </div>
            <div className="text-center">
              <span className="block text-sm text-gray-500">RDV avec volontaire</span>
              <span className="text-xl font-semibold text-green-600">{assignedAppointments.length}</span>
            </div>
            <div className="text-center">
              <span className="block text-sm text-gray-500">Volontaires totaux</span>
              <span className="text-xl font-semibold text-blue-600">{volunteers.length}</span>
            </div>
          </div>
        )}
      </div>

      {/* Interface d'assignation/désassignation */}
      {selectedEtudeId && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Section Rendez-vous */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  Rendez-vous ({filteredAppointments.length})
                  <span className={`ml-2 text-sm px-2 py-1 rounded-full ${
                    actionMode === 'assign' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {actionMode === 'assign' ? 'Mode assignation' : 'Mode désassignation'}
                  </span>
                </h2>
                <div className="flex items-center space-x-2">
                  <select
                    className="text-sm px-2 py-1 border border-gray-300 rounded"
                    value={filterOption}
                    onChange={(e) => setFilterOption(e.target.value)}
                  >
                    <option value="all">Tous</option>
                    <option value="unassigned">Sans volontaire</option>
                    <option value="assigned">Avec volontaire</option>
                  </select>
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
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  {selectedAppointments.length} sélectionnés
                </span>
                <button
                  onClick={handleSelectAllAppointments}
                  className="text-sm px-3 py-1 border border-gray-300 rounded hover:bg-gray-100"
                  disabled={filteredAppointments.filter(rdv => 
                    (actionMode === 'assign' && !rdv.volontaire && !rdv.idVolontaire) ||
                    (actionMode === 'unassign' && (rdv.volontaire || rdv.idVolontaire))
                  ).length === 0}
                >
                  {actionMode === 'assign' ? 'Sélectionner tous (sans volontaire)' : 'Sélectionner tous (avec volontaire)'}
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {filteredAppointments.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  Aucun rendez-vous trouvé
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredAppointments.map(rdv => {
                    const id = getAppointmentId(rdv);
                    const isSelected = selectedAppointments.some(selected => getAppointmentId(selected) === id);
                    const hasVolunteer = rdv.volontaire || rdv.idVolontaire;
                    const canSelect = (actionMode === 'assign' && !hasVolunteer) || (actionMode === 'unassign' && hasVolunteer);

                    return (
                      <div 
                        key={id}
                        className={`p-3 hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''} ${!canSelect ? 'opacity-60' : 'cursor-pointer'}`}
                        onClick={() => canSelect && handleSelectAppointment(rdv)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <input 
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => canSelect && handleSelectAppointment(rdv)}
                              onClick={e => e.stopPropagation()}
                              disabled={!canSelect}
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {formatDate(rdv.date)} à {formatTime(rdv.heure)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {hasVolunteer ? (
                                  <span className="text-green-600">
                                    {rdv.volontaire ? 
                                      `${rdv.volontaire.prenom} ${rdv.volontaire.nom}` : 
                                      `Volontaire ID: ${rdv.idVolontaire}`
                                    }
                                  </span>
                                ) : (
                                  <span className="text-orange-600">Sans volontaire</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(rdv.etat)}`}>
                              {rdv.etat || 'N/A'}
                            </span>
                            {/* Bouton de désassignation individuelle */}
                            {hasVolunteer && actionMode === 'unassign' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUnassignSingle(rdv);
                                }}
                                className="text-red-600 hover:text-red-800 text-xs px-2 py-1 border border-red-300 rounded hover:bg-red-50"
                                disabled={loading}
                              >
                                Désassigner
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Section Volontaires - Affichée seulement en mode assignation */}
          {actionMode === 'assign' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Volontaires ({filteredVolunteers.length})
                  </h2>
                  <select
                    className="text-sm px-2 py-1 border border-gray-300 rounded"
                    value={volunteerFilterOption}
                    onChange={(e) => setVolunteerFilterOption(e.target.value)}
                  >
                    <option value="all">Tous</option>
                    <option value="noAppointments">Sans RDV</option>
                    <option value="hasAppointments">Avec RDV déjà</option>
                  </select>
                </div>
                
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Rechercher un volontaire..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    {selectedVolunteers.length} sélectionnés
                  </span>
                  <button
                    onClick={handleSelectAllVolunteers}
                    className="text-sm px-3 py-1 border border-gray-300 rounded hover:bg-gray-100"
                    disabled={filteredVolunteers.length === 0}
                  >
                    Sélectionner tous
                  </button>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {filteredVolunteers.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    Aucun volontaire trouvé
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredVolunteers.map(vol => {
                      const id = getVolunteerId(vol);
                      const isSelected = selectedVolunteers.some(selected => getVolunteerId(selected) === id);
                      const appointmentCount = getVolunteerAppointmentCount(id);

                      return (
                        <div 
                          key={id}
                          className={`p-3 hover:bg-gray-50 cursor-pointer ${isSelected ? 'bg-blue-50' : ''}`}
                          onClick={() => handleSelectVolunteer(vol)}
                        >
                          <div className="flex items-center space-x-3">
                            <input 
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectVolunteer(vol)}
                              onClick={e => e.stopPropagation()}
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                {vol.prenom} {vol.nom}
                              </div>
                              <div className="text-xs text-gray-500">
                                {vol.email || 'Pas d\'email'}
                                {appointmentCount > 0 ? (
                                  <span className="ml-2 text-blue-600">• {appointmentCount} RDV</span>
                                ) : (
                                  <span className="ml-2 text-gray-400">• Aucun RDV</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Panneau d'action */}
      {selectedEtudeId && (selectedAppointments.length > 0 && (actionMode === 'unassign' || selectedVolunteers.length > 0)) && (
        <div className={`mt-6 border rounded-lg p-4 ${
          actionMode === 'assign' ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex justify-between items-center">
            <div>
              <h3 className={`text-lg font-semibold ${
                actionMode === 'assign' ? 'text-blue-800' : 'text-red-800'
              }`}>
                {actionMode === 'assign' ? 'Assignation en cours' : 'Désassignation en cours'}
              </h3>
              <p className={`text-sm ${
                actionMode === 'assign' ? 'text-blue-600' : 'text-red-600'
              }`}>
                {selectedAppointments.length} rendez-vous
                {actionMode === 'assign' && ` • ${selectedVolunteers.length} volontaires`}
              </p>
              {actionMode === 'assign' && assignmentMode === 'auto' && selectedAppointments.length > 0 && selectedVolunteers.length > 0 && (
                <p className={`text-xs mt-1 ${
                  actionMode === 'assign' ? 'text-blue-500' : 'text-red-500'
                }`}>
                  {Math.min(selectedAppointments.length, selectedVolunteers.length)} assignation(s) seront effectuée(s)
                </p>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setSelectedAppointments([]);
                  setSelectedVolunteers([]);
                }}
                className={`px-4 py-2 border rounded-md ${
                  actionMode === 'assign' 
                    ? 'border-blue-300 text-blue-700 hover:bg-blue-100'
                    : 'border-red-300 text-red-700 hover:bg-red-100'
                }`}
              >
                Réinitialiser
              </button>
              <button
                onClick={handleMassAssignment}
                disabled={loading || selectedAppointments.length === 0 || (actionMode === 'assign' && selectedVolunteers.length === 0)}
                className={`px-4 py-2 rounded-md text-white ${
                  loading || selectedAppointments.length === 0 || (actionMode === 'assign' && selectedVolunteers.length === 0)
                    ? 'bg-gray-300 cursor-not-allowed'
                    : actionMode === 'assign'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {loading 
                  ? (actionMode === 'assign' ? 'Assignation...' : 'Désassignation...')
                  : (actionMode === 'assign' ? 'Assigner' : 'Désassigner')
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerToAppointmentAssigner;