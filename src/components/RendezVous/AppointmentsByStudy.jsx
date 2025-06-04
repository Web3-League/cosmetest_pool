import { useState, useEffect, useRef } from 'react';
import rdvService from '../../services/rdvService';
import etudeService from '../../services/etudeService';
import volontaireService from '../../services/volontaireService';

// SVG pour les icônes
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const FolderIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
  </svg>
);

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const FilterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
  </svg>
);

const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 4v6h-6"></path>
    <path d="M1 20v-6h6"></path>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"></path>
    <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"></path>
  </svg>
);

const AppointmentsByStudy = ({ onAppointmentClick, onBack }) => {
  const [selectedStudyId, setSelectedStudyId] = useState('');
  const [selectedStudy, setSelectedStudy] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [etudes, setEtudes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // États pour la recherche d'études
  const [searchEtudeTerm, setSearchEtudeTerm] = useState('');
  const [showEtudeSelector, setShowEtudeSelector] = useState(false);
  
  // États pour l'assignation de volontaires
  const [volunteers, setVolunteers] = useState([]);
  const [volunteersLoading, setVolunteersLoading] = useState(false);
  const [searchVolunteerTerm, setSearchVolunteerTerm] = useState('');
  const [assigningRdvId, setAssigningRdvId] = useState(null);
  const [assignmentStatus, setAssignmentStatus] = useState({});
  const [filterByStatus, setFilterByStatus] = useState('');
  const [showOnlyUnassigned, setShowOnlyUnassigned] = useState(false);
  const [sortOrder, setSortOrder] = useState('dateAsc'); // 'dateAsc', 'dateDesc', 'hourAsc', 'hourDesc'
  
  // Ref pour les dropdowns
  const etudeSelectorRef = useRef(null);
  const volunteerSelectorRef = useRef(null);

  // Charger les études
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const etudesResponse = await etudeService.getAll();
        
        const etudesArray = etudesResponse?.data || etudesResponse || [];
        setEtudes(Array.isArray(etudesArray) ? etudesArray : []);
        
        setError(null);
      } catch (err) {
        console.error("Erreur lors du chargement des études:", err);
        setError(`Erreur lors du chargement des études: ${err.message}`);
        setEtudes([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Charger les volontaires
  useEffect(() => {
    const loadVolunteers = async () => {
      try {
        setVolunteersLoading(true);
        const response = await volontaireService.getAllWithoutPagination();
        const data = response || [];
        setVolunteers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Erreur lors du chargement des volontaires:", err);
      } finally {
        setVolunteersLoading(false);
      }
    };
    
    loadVolunteers();
  }, []);

  // Charger les rendez-vous lorsqu'une étude est sélectionnée
  useEffect(() => {
    const loadAppointmentsByStudy = async () => {
      if (!selectedStudyId) {
        setAppointments([]);
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Utilisez getByEtudeId 
        const rdvs = await rdvService.getByEtudeId(selectedStudyId);
        
        setAppointments(Array.isArray(rdvs) ? rdvs : []);
        setError(null);
      } catch (err) {
        console.error("Erreur lors du chargement des rendez-vous:", err);
        setError(`Erreur lors du chargement des rendez-vous: ${err.message}`);
        setAppointments([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAppointmentsByStudy();
  }, [selectedStudyId]);

  // Gérer le clic en dehors des dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (etudeSelectorRef.current && !etudeSelectorRef.current.contains(event.target)) {
        setShowEtudeSelector(false);
      }
      if (volunteerSelectorRef.current && !volunteerSelectorRef.current.contains(event.target) && !event.target.closest('.exclude-click-outside')) {
        setAssigningRdvId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filtrage des études
  const filteredEtudes = Array.isArray(etudes)
    ? etudes.filter(e => {
        const ref = (e.ref || '').toLowerCase();
        const titre = (e.titre || '').toLowerCase();
        const term = searchEtudeTerm.toLowerCase();
        
        return ref.includes(term) || titre.includes(term);
      }).slice(0, 50)
    : [];
    
  // Filtrage des volontaires
  const filteredVolunteers = Array.isArray(volunteers)
    ? volunteers.filter(v => {
        const nom = (v.nom || '').toLowerCase();
        const prenom = (v.prenom || '').toLowerCase();
        const term = searchVolunteerTerm.toLowerCase();
        
        return nom.includes(term) || prenom.includes(term);
      }).slice(0, 50)
    : [];

  // Sélection d'une étude
  const selectEtude = (etude) => {
    setSelectedStudy(etude);
    setSelectedStudyId(etude.idEtude ? etude.idEtude.toString() : etude.id.toString());
    setShowEtudeSelector(false);
    
    // Réinitialiser les filtres
    setFilterByStatus('');
    setShowOnlyUnassigned(false);
    setSortOrder('dateAsc');
  };
  
  // Assigner un volontaire à un rendez-vous
  const assignVolunteer = async (rdvId, volontaireId) => {
    try {
      setAssignmentStatus(prev => ({ ...prev, [rdvId]: 'loading' }));
      
      // Trouver le rendez-vous
      const rdv = appointments.find(a => (a.idRdv || a.id) === rdvId);
      if (!rdv) throw new Error("Rendez-vous non trouvé");
      
      const idEtude = rdv.idEtude || rdv.etude?.id;
      if (!idEtude) throw new Error("ID d'étude manquant");
      
      // Créer les données pour la mise à jour
      const updatedData = {
        idEtude: idEtude,
        idRdv: rdvId,
        idVolontaire: volontaireId,
        date: rdv.date,
        heure: rdv.heure,
        etat: rdv.etat,
        commentaires: rdv.commentaires
      };
      
      // Appeler le service pour mettre à jour
      await rdvService.update(idEtude, rdvId, updatedData);
      
      // Mettre à jour localement les données des rendez-vous
      setAppointments(prevAppointments => 
        prevAppointments.map(a => {
          if ((a.idRdv || a.id) === rdvId) {
            const volontaire = volunteers.find(v => v.id.toString() === volontaireId);
            return { 
              ...a, 
              volontaire,
              idVolontaire: volontaireId
            };
          }
          return a;
        })
      );
      
      setAssignmentStatus(prev => ({ ...prev, [rdvId]: 'success' }));
      
      // Masquer après quelques secondes
      setTimeout(() => {
        setAssignmentStatus(prev => {
          const newState = { ...prev };
          delete newState[rdvId];
          return newState;
        });
      }, 2000);
      
      // Fermer le sélecteur
      setAssigningRdvId(null);
      
    } catch (err) {
      console.error("Erreur lors de l'assignation du volontaire:", err);
      setAssignmentStatus(prev => ({ ...prev, [rdvId]: 'error' }));
      
      // Masquer après quelques secondes
      setTimeout(() => {
        setAssignmentStatus(prev => {
          const newState = { ...prev };
          delete newState[rdvId];
          return newState;
        });
      }, 3000);
    }
  };

  // Changer l'état d'un rendez-vous
  const changeAppointmentStatus = async (rdvId, newStatus) => {
    try {
      setAssignmentStatus(prev => ({ ...prev, [rdvId]: 'loading' }));
      
      // Trouver le rendez-vous
      const rdv = appointments.find(a => (a.idRdv || a.id) === rdvId);
      if (!rdv) throw new Error("Rendez-vous non trouvé");
      
      const idEtude = rdv.idEtude || rdv.etude?.id;
      if (!idEtude) throw new Error("ID d'étude manquant");
      
      // Créer les données pour la mise à jour
      const updatedData = {
        idEtude: idEtude,
        idRdv: rdvId,
        idVolontaire: rdv.volontaire?.id || rdv.idVolontaire,
        date: rdv.date,
        heure: rdv.heure,
        etat: newStatus,
        commentaires: rdv.commentaires
      };
      
      // Appeler le service pour mettre à jour
      await rdvService.update(idEtude, rdvId, updatedData);
      
      // Mettre à jour localement les données des rendez-vous
      setAppointments(prevAppointments => 
        prevAppointments.map(a => {
          if ((a.idRdv || a.id) === rdvId) {
            return { 
              ...a, 
              etat: newStatus
            };
          }
          return a;
        })
      );
      
      setAssignmentStatus(prev => ({ ...prev, [rdvId]: 'success' }));
      
      // Masquer après quelques secondes
      setTimeout(() => {
        setAssignmentStatus(prev => {
          const newState = { ...prev };
          delete newState[rdvId];
          return newState;
        });
      }, 2000);
      
    } catch (err) {
      console.error("Erreur lors du changement d'état:", err);
      setAssignmentStatus(prev => ({ ...prev, [rdvId]: 'error' }));
      
      // Masquer après quelques secondes
      setTimeout(() => {
        setAssignmentStatus(prev => {
          const newState = { ...prev };
          delete newState[rdvId];
          return newState;
        });
      }, 3000);
    }
  };

  // Formater la date pour l'affichage
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

  // Déterminer la classe CSS en fonction du statut
  const getStatusClass = (status) => {
    switch (status) {
      case 'CONFIRME':
        return 'bg-green-100 text-green-800 border-l-4 border-green-500';
      case 'EN_ATTENTE':
        return 'bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500';
      case 'ANNULE':
        return 'bg-red-100 text-red-800 border-l-4 border-red-500';
      case 'COMPLETE':
        return 'bg-blue-100 text-blue-800 border-l-4 border-blue-500';
      case 'PLANIFIE':
        return 'bg-purple-100 text-purple-800 border-l-4 border-purple-500';
      default:
        return 'bg-gray-100 text-gray-800 border-l-4 border-gray-500';
    }
  };
  
  // Trier et filtrer les rendez-vous
  const getSortedAndFilteredAppointments = () => {
    return appointments
      .filter(rdv => {
        // Filtrer par statut
        if (filterByStatus && rdv.etat !== filterByStatus) {
          return false;
        }
        
        // Filtrer uniquement les non assignés
        if (showOnlyUnassigned && (rdv.volontaire || rdv.idVolontaire)) {
          return false;
        }
        
        return true;
      })
      .sort((a, b) => {
        // Trier par date/heure
        switch (sortOrder) {
          case 'dateAsc':
            return new Date(a.date) - new Date(b.date);
          case 'dateDesc':
            return new Date(b.date) - new Date(a.date);
          case 'hourAsc':
            return (a.heure || '').localeCompare(b.heure || '');
          case 'hourDesc':
            return (b.heure || '').localeCompare(a.heure || '');
          default:
            return 0;
        }
      });
  };
  
  // Rafraîchir les rendez-vous
  const refreshAppointments = async () => {
    if (!selectedStudyId) return;
    
    try {
      setIsLoading(true);
      const rdvs = await rdvService.getByEtudeId(selectedStudyId);
      setAppointments(Array.isArray(rdvs) ? rdvs : []);
      setError(null);
    } catch (err) {
      console.error("Erreur lors du rafraîchissement des rendez-vous:", err);
      setError(`Erreur lors du rafraîchissement des rendez-vous: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Rendez-vous par étude</h2>
        <button 
          onClick={onBack}
          className="text-blue-600 hover:text-blue-800"
        >
          &lt; Retour
        </button>
      </div>
      
      {/* Section Étude avec style amélioré */}
      <div className="bg-green-50 rounded-xl p-6 border border-green-200 shadow-sm mb-6">
        <div className="flex items-center mb-4">
          <FolderIcon />
          <h2 className="ml-2 text-lg font-semibold text-green-800">Rechercher une étude</h2>
        </div>
        
        <div ref={etudeSelectorRef} className="relative">
          <div 
            onClick={() => setShowEtudeSelector(!showEtudeSelector)}
            className="flex cursor-pointer items-center p-3 border border-green-300 rounded-lg bg-white hover:border-green-500 focus:outline-none"
          >
            {selectedStudy ? (
              <div>
                <div className="font-medium text-gray-800">{selectedStudy.ref}</div>
                <div className="text-sm text-gray-500">{selectedStudy.titre}</div>
              </div>
            ) : (
              <div className="text-gray-500">Sélectionner une étude</div>
            )}
            <div className="ml-auto">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>
          
          {/* Dropdown de sélection d'études */}
          {showEtudeSelector && (
            <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-green-300 overflow-hidden">
              <div className="sticky top-0 p-2 border-b border-green-200 bg-green-50">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Rechercher une étude par référence ou titre..."
                    value={searchEtudeTerm}
                    onChange={(e) => setSearchEtudeTerm(e.target.value)}
                    className="w-full py-2 pl-10 pr-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    autoFocus
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <SearchIcon />
                  </div>
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {filteredEtudes.length > 0 ? (
                  filteredEtudes.map(etude => (
                    <div 
                      key={etude.idEtude || etude.id} 
                      className="p-3 hover:bg-green-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      onClick={() => selectEtude(etude)}
                    >
                      <div className="font-medium text-gray-800">{etude.ref}</div>
                      <div className="text-sm text-gray-500 truncate">{etude.titre}</div>
                    </div>
                  ))
                ) : searchEtudeTerm ? (
                  <div className="p-4 text-center text-gray-500">
                    Aucune étude ne correspond à votre recherche
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    Commencez à taper pour rechercher une étude
                  </div>
                )}
                {searchEtudeTerm.length > 0 && filteredEtudes.length >= 50 && (
                  <div className="px-3 py-2 text-xs text-center text-gray-500 bg-gray-50 border-t border-gray-100">
                    Affichage limité à 50 résultats. Précisez votre recherche pour affiner les résultats.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* État de chargement */}
      {isLoading && (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Liste des rendez-vous */}
      {!isLoading && !error && selectedStudyId && (
        <div className="bg-purple-50 rounded-xl p-6 border border-purple-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <CalendarIcon />
              <h2 className="ml-2 text-lg font-semibold text-purple-800">
                Rendez-vous {selectedStudy && `pour ${selectedStudy.ref}`}
              </h2>
            </div>
            <button 
              onClick={refreshAppointments}
              className="p-2 text-blue-600 hover:text-blue-800 focus:outline-none rounded-full hover:bg-blue-50"
              title="Rafraîchir les rendez-vous"
            >
              <RefreshIcon />
            </button>
          </div>
          
          {/* Filtres et stats */}
          <div className="bg-white p-4 rounded-lg border border-purple-200 mb-4">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                {getSortedAndFilteredAppointments().length} rendez-vous trouvés
              </h3>
              
              <div className="flex flex-wrap gap-3">
                {/* Filtre par statut */}
                <div className="relative">
                  <select
                    value={filterByStatus}
                    onChange={(e) => setFilterByStatus(e.target.value)}
                    className="pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">Tous les statuts</option>
                    <option value="PLANIFIE">Planifié</option>
                    <option value="CONFIRME">Confirmé</option>
                    <option value="EN_ATTENTE">En attente</option>
                    <option value="ANNULE">Annulé</option>
                    <option value="COMPLETE">Complété</option>
                  </select>
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <FilterIcon />
                  </div>
                </div>
                
                {/* Tri */}
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="dateAsc">Date ↑</option>
                  <option value="dateDesc">Date ↓</option>
                  <option value="hourAsc">Heure ↑</option>
                  <option value="hourDesc">Heure ↓</option>
                </select>
                
                {/* Afficher uniquement non assignés */}
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showOnlyUnassigned}
                    onChange={(e) => setShowOnlyUnassigned(e.target.checked)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 rounded"
                  />
                  <span className="text-sm text-gray-700">Sans volontaire uniquement</span>
                </label>
              </div>
            </div>
          </div>
          
          {getSortedAndFilteredAppointments().length === 0 ? (
            <div className="text-center py-8 bg-white rounded-md border border-gray-200">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
              <p className="mt-2 text-gray-500">Aucun rendez-vous trouvé avec les filtres actuels.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {getSortedAndFilteredAppointments().map((appointment) => {
                const rdvId = appointment.idRdv || appointment.id;
                const isAssigning = assigningRdvId === rdvId;
                const statusIndicator = assignmentStatus[rdvId];
                
                return (
                  <div 
                    key={`${appointment.idEtude}-${rdvId}`} 
                    className={`p-4 rounded-md transition-colors hover:bg-gray-50 ${getStatusClass(appointment.etat)} bg-white shadow-sm relative`}
                  >
                    {/* Indicateur de statut d'opération */}
                    {statusIndicator && (
                      <div className="absolute top-2 right-2">
                        {statusIndicator === 'loading' && (
                          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                        )}
                        {statusIndicator === 'success' && (
                          <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                          </svg>
                        )}
                        {statusIndicator === 'error' && (
                          <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                        )}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-[3fr,2fr] gap-4">
                      {/* Détails du rendez-vous */}
                      <div>
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-bold">
                              {formatDate(appointment.date)} à {appointment.heure || 'Heure non spécifiée'}
                            </div>
                            <div className="flex items-center text-sm mt-1">
                              <UserIcon />
                              <span className="ml-1">
                                {appointment.volontaire ? (
                                  <span className="text-gray-700">
                                    {appointment.volontaire.nom} {appointment.volontaire.prenom}
                                  </span>
                                ) : appointment.idVolontaire ? (
                                  <span className="text-gray-700">
                                    Volontaire ID: {appointment.idVolontaire}
                                    {volunteers.length > 0 && volunteers.find(v => v.id === parseInt(appointment.idVolontaire) || v.volontaireId === parseInt(appointment.idVolontaire)) ? 
                                      ` (${volunteers.find(v => v.id === parseInt(appointment.idVolontaire) || v.volontaireId === parseInt(appointment.idVolontaire)).nom || ''} ${volunteers.find(v => v.id === parseInt(appointment.idVolontaire) || v.volontaireId === parseInt(appointment.idVolontaire)).prenom || ''})` : 
                                      ''}
                                  </span>
                                ) : (
                                  <span className="text-gray-500 italic">Aucun volontaire assigné</span>
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="text-sm bg-white px-3 py-1 rounded-full shadow-sm border">
                            {appointment.etat || 'Non spécifié'}
                          </div>
                        </div>
                        
                        {appointment.commentaires && (
                          <div className="text-sm italic mt-2 text-gray-600 bg-gray-50 p-2 rounded">
                            {appointment.commentaires.length > 100 
                              ? `${appointment.commentaires.substring(0, 100)}...` 
                              : appointment.commentaires
                            }
                          </div>
                        )}
                      </div>
                      
                      {/* Actions */}
                      <div className="flex flex-col md:flex-row items-center gap-2 justify-end">
                        {/* Sélecteur de volontaire */}
                        <div className="relative w-full md:w-auto">
                          {isAssigning ? (
                            <div 
                              ref={volunteerSelectorRef}
                              className="absolute z-10 right-0 mt-1 bg-white rounded-lg shadow-lg border border-blue-300 w-full md:w-72"
                            >
                              <div className="sticky top-0 p-2 border-b border-blue-200 bg-blue-50">
                                <div className="relative">
                                  <input
                                    type="text"
                                    placeholder="Rechercher un volontaire..."
                                    value={searchVolunteerTerm}
                                    onChange={(e) => setSearchVolunteerTerm(e.target.value)}
                                    className="w-full py-2 pl-8 pr-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    autoFocus
                                  />
                                  <div className="absolute inset-y-0 left-0 flex items-center pl-2">
                                    <SearchIcon />
                                  </div>
                                </div>
                              </div>
                              
                              <div className="max-h-60 overflow-y-auto">
                                {volunteersLoading ? (
                                  <div className="p-4 text-center">
                                    <div className="animate-spin inline-block w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                                  </div>
                                ) : filteredVolunteers.length > 0 ? (
                                  filteredVolunteers.map(volunteer => (
                                    <div 
                                      key={volunteer.id} 
                                      className="p-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                      onClick={() => assignVolunteer(rdvId, volunteer.id)}
                                    >
                                      <div className="font-medium text-gray-800">{volunteer.nom} {volunteer.prenom}</div>
                                      {volunteer.email && (
                                        <div className="text-xs text-gray-500">{volunteer.email}</div>
                                      )}
                                    </div>
                                  ))
                                ) : (
                                  <div className="p-4 text-center text-gray-500">
                                    Aucun volontaire ne correspond à votre recherche
                                  </div>
                                )}
                              </div>
                              
                              <div className="border-t border-gray-200 p-2 bg-gray-50 flex justify-between">
                                <button 
                                  className="text-gray-600 text-sm hover:text-gray-800"
                                  onClick={() => setAssigningRdvId(null)}
                                >
                                  Annuler
                                </button>
                                
                                {(appointment.volontaire || appointment.idVolontaire) && (
                                  <button 
                                    className="text-red-600 text-sm hover:text-red-800"
                                    onClick={() => assignVolunteer(rdvId, null)}
                                  >
                                    Désassigner
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <button
                              className="py-2 px-3 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm w-full md:w-auto exclude-click-outside"
                              onClick={() => setAssigningRdvId(rdvId)}
                            >
                              {appointment.volontaire || appointment.idVolontaire ? "Changer" : "Assigner"} volontaire
                            </button>
                          )}
                        </div>
                        
                        {/* Changer le statut */}
                        <select
                          value={appointment.etat || ''}
                          onChange={(e) => changeAppointmentStatus(rdvId, e.target.value)}
                          className="py-2 px-3 border border-gray-300 rounded text-sm w-full md:w-auto"
                        >
                          <option value="" disabled>Statut</option>
                          <option value="PLANIFIE">Planifié</option>
                          <option value="CONFIRME">Confirmé</option>
                          <option value="EN_ATTENTE">En attente</option>
                          <option value="ANNULE">Annulé</option>
                          <option value="COMPLETE">Complété</option>
                        </select>
                        
                        {/* Voir détails */}
                        <button
                          className="py-2 px-3 border border-gray-300 hover:bg-gray-100 rounded text-sm w-full md:w-auto"
                          onClick={() => onAppointmentClick(appointment)}
                        >
                          Détails
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AppointmentsByStudy;