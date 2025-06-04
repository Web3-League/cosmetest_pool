import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../services/api';
import etudeService from '../../../services/etudeService';
import volontaireService from '../../../services/volontaireService';

/**
 * Composant pour importer des volontaires dans une étude
 * Version ultra-simplifiée avec les fonctionnalités essentielles uniquement
 */
const VolontairesImport = () => {
  const navigate = useNavigate();
  const { id: etudeIdFromUrl } = useParams();

  // États de base
  const [etudes, setEtudes] = useState([]);
  const [selectedEtudeId, setSelectedEtudeId] = useState(etudeIdFromUrl || null);
  const [volontaires, setVolontaires] = useState([]);
  const [etudeVolontaires, setEtudeVolontaires] = useState([]);
  const [selectedVolontaires, setSelectedVolontaires] = useState([]);
  const [etudeGroupes, setEtudeGroupes] = useState([]);
  const [selectedGroupe, setSelectedGroupe] = useState(null);
  const [etudeDetails, setEtudeDetails] = useState({});
  
  // États utilitaires
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOption, setFilterOption] = useState('notInEtude');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Chargement initial
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Charger les études et volontaires en parallèle
        const [etudesData, volontairesData] = await Promise.all([
          etudeService.getAll(),
          volontaireService.getAllWithoutPagination()
        ]);
        
        setEtudes(etudesData);
        setVolontaires(volontairesData);
        
        // Charger les détails de l'étude depuis l'URL si disponible
        if (etudeIdFromUrl) {
          const etudeId = parseInt(etudeIdFromUrl, 10);
          setSelectedEtudeId(etudeId);
          await loadEtudeDetails(etudeId);
        }
      } catch (err) {
        console.error("Erreur:", err);
        setError("Impossible de charger les données");
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [etudeIdFromUrl]);

  // Chargement des détails de l'étude
  const loadEtudeDetails = async (etudeId) => {
    if (!etudeId) return;
    
    try {
      setLoading(true);
      
      // Charger l'étude, ses groupes et ses volontaires en parallèle
      const [etude, groupesRes, volontairesRes] = await Promise.all([
        etudeService.getById(etudeId),
        api.get(`/groupes/etude/${etudeId}`),
        api.get(`/etude-volontaires/etude/${etudeId}`)
      ]);
      
      setEtudeDetails(etude || {});
      setEtudeGroupes(groupesRes.data || []);
      setEtudeVolontaires(volontairesRes.data || []);
      
      // Sélectionner le premier groupe par défaut
      if (groupesRes.data?.length > 0) {
        setSelectedGroupe(groupesRes.data[0]);
      }
    } catch (err) {
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  // Chargement des détails quand l'étude change
  useEffect(() => {
    if (selectedEtudeId) {
      loadEtudeDetails(selectedEtudeId);
    } else {
      // Réinitialiser les données si aucune étude n'est sélectionnée
      setEtudeDetails({});
      setEtudeGroupes([]);
      setEtudeVolontaires([]);
      setSelectedGroupe(null);
      setSelectedVolontaires([]);
    }
  }, [selectedEtudeId]);

  // Helpers
  const getVolontaireId = v => v.id || v.idVolontaire;
  
  const isInEtude = volontaire => {
    const id = getVolontaireId(volontaire);
    return etudeVolontaires.some(ev => getVolontaireId(ev) === id || ev.idVolontaire === id);
  };
  
  const calculateAge = dateNaissance => {
    if (!dateNaissance) return null;
    const today = new Date();
    const birthDate = new Date(dateNaissance);
    let age = today.getFullYear() - birthDate.getFullYear();
    if (today.getMonth() < birthDate.getMonth() || 
        (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };
  
  const isEligible = (volontaire, groupe) => {
    if (!groupe || !volontaire) return false;
    
    // Vérifier l'âge
    const age = volontaire.age || calculateAge(volontaire.dateNaissance);
    if (age !== null && (age < groupe.ageMinimum || age > groupe.ageMaximum)) {
      return false;
    }
    
    // Vérifier l'ethnie
    if (groupe.ethnie && groupe.ethnie.trim() !== '') {
      const ethnies = groupe.ethnie.split(';').map(e => e.trim()).filter(Boolean);
      if (ethnies.length > 0 && volontaire.ethnie && !ethnies.includes(volontaire.ethnie)) {
        return false;
      }
    }
    
    return true;
  };
  
  const getRemainingPlaces = () => {
    if (!selectedGroupe || !selectedGroupe.nbSujet) return "Illimité";
    
    const currentCount = etudeVolontaires.filter(v => v.idGroupe === selectedGroupe.idGroupe).length;
    return Math.max(0, selectedGroupe.nbSujet - currentCount);
  };
  
  const hasRemainingCapacity = () => {
    if (!selectedGroupe || !selectedGroupe.nbSujet) return true;
    
    const currentCount = etudeVolontaires.filter(v => v.idGroupe === selectedGroupe.idGroupe).length;
    return currentCount < selectedGroupe.nbSujet;
  };

  // Filtrage des volontaires
  const filteredVolontaires = volontaires.filter(v => {
    // Filtrer par recherche
    const searchMatch = searchQuery.trim() === '' || 
      (v.nom && v.nom.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (v.prenom && v.prenom.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (v.email && v.email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!searchMatch) return false;
    
    // Filtrer par option
    switch (filterOption) {
      case 'notInEtude': return !isInEtude(v);
      case 'inEtude': return isInEtude(v);
      case 'eligibles': return !isInEtude(v) && selectedGroupe && isEligible(v, selectedGroupe);
      default: return true;
    }
  });

  // Handlers
  const handleEtudeChange = e => {
    const value = e.target.value;
    setSelectedEtudeId(value ? parseInt(value, 10) : null);
  };
  
  const handleGroupeChange = e => {
    const groupeId = parseInt(e.target.value, 10);
    const groupe = etudeGroupes.find(g => g.idGroupe === groupeId);
    setSelectedGroupe(groupe || null);
    setSelectedVolontaires([]);
  };
  
  const handleSelectVolontaire = volontaire => {
    const id = getVolontaireId(volontaire);
    const isSelected = selectedVolontaires.some(v => getVolontaireId(v) === id);
    
    if (isSelected) {
      // Désélectionner
      setSelectedVolontaires(prev => prev.filter(v => getVolontaireId(v) !== id));
    } else {
      // Vérifier éligibilité et capacité avant de sélectionner
      if (!isInEtude(volontaire) && selectedGroupe) {
        if (!isEligible(volontaire, selectedGroupe)) {
          alert("Ce volontaire ne correspond pas aux critères du groupe.");
          return;
        }
        
        if (!hasRemainingCapacity()) {
          alert("Le groupe a atteint sa capacité maximale.");
          return;
        }
      }
      
      // Sélectionner
      setSelectedVolontaires(prev => [...prev, volontaire]);
    }
  };
  
  const handleSelectAll = () => {
    const allSelected = filteredVolontaires.every(v => 
      selectedVolontaires.some(sv => getVolontaireId(sv) === getVolontaireId(v))
    );
    
    if (allSelected) {
      // Désélectionner tous les volontaires filtrés
      setSelectedVolontaires(prev => 
        prev.filter(v => !filteredVolontaires.some(fv => getVolontaireId(fv) === getVolontaireId(v)))
      );
    } else {
      // Sélectionner tous les volontaires éligibles
      const eligibles = filteredVolontaires.filter(v => 
        isInEtude(v) || (selectedGroupe && isEligible(v, selectedGroupe))
      );
      
      // Vérifier la capacité du groupe
      if (selectedGroupe?.nbSujet) {
        const currentCount = etudeVolontaires.filter(v => v.idGroupe === selectedGroupe.idGroupe).length;
        const remainingPlaces = Math.max(0, selectedGroupe.nbSujet - currentCount);
        
        const newVolontaires = eligibles.filter(v => !isInEtude(v));
        
        if (newVolontaires.length > remainingPlaces && remainingPlaces > 0) {
          if (window.confirm(`Il ne reste que ${remainingPlaces} places. Ajouter seulement les ${remainingPlaces} premiers?`)) {
            setSelectedVolontaires([
              ...selectedVolontaires.filter(v => !filteredVolontaires.includes(v)),
              ...newVolontaires.slice(0, remainingPlaces)
            ]);
          }
          return;
        }
      }
      
      setSelectedVolontaires([
        ...selectedVolontaires.filter(v => !filteredVolontaires.includes(v)),
        ...eligibles
      ]);
    }
  };
  
  const handleImport = async () => {
    if (!selectedEtudeId || !selectedGroupe || selectedVolontaires.length === 0) {
      alert("Veuillez sélectionner une étude, un groupe et au moins un volontaire.");
      return;
    }
    
    try {
      setLoading(true);
      
      // Filtrer les volontaires à importer (nouveaux et éligibles)
      const toImport = selectedVolontaires.filter(v => 
        !isInEtude(v) && isEligible(v, selectedGroupe)
      );
      
      if (toImport.length === 0) {
        alert("Aucun nouveau volontaire éligible à importer.");
        setLoading(false);
        return;
      }
      
      // Vérifier la capacité
      let finalList = toImport;
      if (selectedGroupe.nbSujet) {
        const currentCount = etudeVolontaires.filter(v => v.idGroupe === selectedGroupe.idGroupe).length;
        const remainingPlaces = Math.max(0, selectedGroupe.nbSujet - currentCount);
        
        if (toImport.length > remainingPlaces) {
          if (remainingPlaces <= 0) {
            alert("Le groupe a atteint sa capacité maximale.");
            setLoading(false);
            return;
          }
          
          if (window.confirm(`Il ne reste que ${remainingPlaces} places. Ajouter seulement les ${remainingPlaces} premiers?`)) {
            finalList = toImport.slice(0, remainingPlaces);
          } else {
            setLoading(false);
            return;
          }
        }
      }
      
      // Créer les promesses d'importation
      const promises = finalList.map(v => {
        return api.post('/etude-volontaires', {
          idEtude: Number(selectedEtudeId),
          idVolontaire: getVolontaireId(v),
          idGroupe: selectedGroupe.idGroupe,
          iv: selectedGroupe.iv || 0,
          numsujet: 0,
          paye: 0,
          statut: 'INSCRIT' 
        });
      });
      
      // Exécuter les importations
      await Promise.all(promises);
      
      // Rafraîchir les données
      const result = await api.get(`/etude-volontaires/etude/${selectedEtudeId}`);
      setEtudeVolontaires(result.data);
      setSelectedVolontaires([]);
      
      alert(`${finalList.length} volontaire(s) importé(s) avec succès.`);
    } catch (err) {
      console.error("Erreur d'importation:", err);
      alert("Une erreur est survenue lors de l'importation.");
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
        <button onClick={() => navigate('/etudes')} className="mt-4 px-4 py-2 bg-red-600 text-white rounded">
          Retour aux études
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4">
      {/* En-tête */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Importer des volontaires</h1>
          {selectedEtudeId && etudeDetails && (
            <p className="text-gray-600">
              Étude: <span className="font-medium">{etudeDetails.ref || 'N/A'} - {etudeDetails.titre || 'Sans titre'}</span>
            </p>
          )}
        </div>
        {selectedEtudeId && (
          <button 
            onClick={() => navigate(`/etudes/${selectedEtudeId}`)}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100"
          >
            Retour à l'étude
          </button>
        )}
      </div>
      
      {/* Sélection d'étude et groupe */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Sélection d'étude */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Étude</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={selectedEtudeId || ''}
            onChange={handleEtudeChange}
            disabled={loading}
          >
            <option value="">-- Sélectionner une étude --</option>
            {etudes.map(etude => (
              <option key={etude.id || etude.idEtude} value={etude.id || etude.idEtude}>
                {etude.ref || 'N/A'} - {etude.titre || 'Sans titre'}
              </option>
            ))}
          </select>
        </div>
        
        {/* Sélection de groupe */}
        {selectedEtudeId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Groupe</label>
            {etudeGroupes.length === 0 ? (
              <div className="p-3 bg-yellow-50 text-yellow-700 border rounded">
                Aucun groupe disponible pour cette étude
              </div>
            ) : (
              <>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={selectedGroupe?.idGroupe || ''}
                  onChange={handleGroupeChange}
                  disabled={loading}
                >
                  <option value="">-- Sélectionner un groupe --</option>
                  {etudeGroupes.map(g => (
                    <option key={g.idGroupe} value={g.idGroupe}>
                      {g.intitule} - Âge: {g.ageMinimum}-{g.ageMaximum} ans
                    </option>
                  ))}
                </select>
                
                {selectedGroupe && selectedGroupe.nbSujet && (
                  <p className={`mt-1 text-sm ${getRemainingPlaces() === 0 ? 'text-red-600' : 'text-gray-700'}`}>
                    Places disponibles: {getRemainingPlaces()} / {selectedGroupe.nbSujet}
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Contrôles de recherche et importation */}
      {selectedEtudeId && selectedGroupe && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Recherche */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rechercher</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Nom, prénom, email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Filtre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filtre</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={filterOption}
                onChange={e => setFilterOption(e.target.value)}
              >
                <option value="all">Tous les volontaires</option>
                <option value="notInEtude">Non assignés à l'étude</option>
                <option value="inEtude">Déjà dans l'étude</option>
                <option value="eligibles">Éligibles uniquement</option>
              </select>
            </div>
            
            {/* Importation */}
            <div className="flex items-end">
              <button
                onClick={handleImport}
                disabled={loading || selectedVolontaires.length === 0}
                className={`w-full px-3 py-2 text-white rounded-md ${
                  loading || selectedVolontaires.length === 0
                    ? 'bg-blue-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? 'Importation...' : `Importer (${selectedVolontaires.length})`}
              </button>
            </div>
          </div>
          
          {/* Statistiques */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <span className="text-sm text-gray-500">Dans l'étude</span>
              <p className="text-xl font-semibold">{etudeVolontaires.length}</p>
            </div>
            <div className="text-center">
              <span className="text-sm text-gray-500">Éligibles</span>
              <p className="text-xl font-semibold">
                {volontaires.filter(v => !isInEtude(v) && isEligible(v, selectedGroupe)).length}
              </p>
            </div>
            <div className="text-center">
              <span className="text-sm text-gray-500">Sélectionnés</span>
              <p className="text-xl font-semibold">{selectedVolontaires.length}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Liste des volontaires */}
      {selectedEtudeId && selectedGroupe && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
          <div className="p-3 border-b border-gray-200 flex justify-between items-center">
            <h2 className="font-semibold text-gray-800">Volontaires ({filteredVolontaires.length})</h2>
            <button
              onClick={handleSelectAll}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
            >
              {filteredVolontaires.every(v => selectedVolontaires.some(sv => getVolontaireId(sv) === getVolontaireId(v)))
                ? 'Désélectionner tout'
                : 'Sélectionner tout'
              }
            </button>
          </div>
          
          {filteredVolontaires.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              Aucun volontaire ne correspond aux critères
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase"></th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Prénom</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Âge</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredVolontaires.map(v => {
                    const id = getVolontaireId(v);
                    const isSelected = selectedVolontaires.some(sv => getVolontaireId(sv) === id);
                    const estDansEtude = isInEtude(v);
                    const estEligible = isEligible(v, selectedGroupe);
                    const age = v.age || calculateAge(v.dateNaissance);
                    
                    return (
                      <tr 
                        key={id}
                        className={`hover:bg-gray-50 cursor-pointer ${isSelected ? 'bg-blue-50' : ''}`}
                        onClick={() => handleSelectVolontaire(v)}
                      >
                        <td className="px-3 py-2">
                          <input 
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectVolontaire(v)}
                            onClick={e => e.stopPropagation()}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">{v.nom}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{v.prenom}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{v.email}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{age || 'N/A'}</td>
                        <td className="px-3 py-2 text-sm">
                          {estDansEtude ? (
                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                              Dans l'étude
                            </span>
                          ) : !estEligible ? (
                            <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                              Non éligible
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                              Éligible
                            </span>
                          )}
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
      
      {/* Sélection actuelle */}
      {selectedVolontaires.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">
            Sélection ({selectedVolontaires.length} volontaires)
          </h3>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedVolontaires.slice(0, 5).map(v => (
              <div
                key={getVolontaireId(v)}
                className="flex items-center bg-white px-2 py-1 rounded-full border border-blue-200"
              >
                <span className="text-sm">{v.prenom} {v.nom}</span>
                <button
                  onClick={() => handleSelectVolontaire(v)}
                  className="ml-1 text-gray-400 hover:text-red-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            {selectedVolontaires.length > 5 && (
              <div className="bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-500">
                +{selectedVolontaires.length - 5} autres
              </div>
            )}
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleImport}
              disabled={loading}
              className={`px-3 py-1 text-white rounded ${
                loading ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Importation...' : `Importer (${selectedVolontaires.length})`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolontairesImport;