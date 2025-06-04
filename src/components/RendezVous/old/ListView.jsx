// ListView.jsx - Version finale avec gestion améliorée des volontaires

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDate } from '../../utils/dateUtils';
import rdvService from '../../services/rdvService';
import axios from 'axios';

// Composant RdvRow avec chargement amélioré des informations de volontaire
const RdvRow = ({ 
  rdv, 
  studyId, 
  onStatusUpdate, 
  renderStatusBadge,
  getVolontaireInfo,
  loadVolontaireDetails
}) => {
  const [volontaireInfo, setVolontaireInfo] = useState('');
  const [isLoadingVolontaire, setIsLoadingVolontaire] = useState(false);
  
  // Récupération de l'ID du RDV de manière robuste
  const rdvId = rdv.id?.idRdv || rdv.idRdv || rdv.id;
  
  // Récupérer les informations du volontaire lors du montage du composant
  useEffect(() => {
    const fetchVolontaireInfo = async () => {
      // Récupérer les informations initiales
      const initialInfo = getVolontaireInfo(rdv);
      
      // Si les informations sont disponibles directement (pas un LOAD:xxx)
      if (!initialInfo.startsWith('LOAD:')) {
        setVolontaireInfo(initialInfo);
        return;
      }
      
      // Marquer le début du chargement
      setIsLoadingVolontaire(true);
      
      try {
        // Extraire l'ID du volontaire
        const volontaireId = initialInfo.split(':')[1];
        
        // Afficher l'ID en attendant le chargement complet
        setVolontaireInfo(`Chargement ID: ${volontaireId}...`);
        
        // Charger les détails complets
        const detailedInfo = await loadVolontaireDetails(volontaireId);
        
        // Mettre à jour les informations une fois chargées
        setVolontaireInfo(detailedInfo || `ID: ${volontaireId}`);
      } catch (error) {
        console.error('Erreur lors du chargement des détails du volontaire:', error);
        setVolontaireInfo(`Erreur: ${error.message}`);
      } finally {
        setIsLoadingVolontaire(false);
      }
    };
    
    fetchVolontaireInfo();
  }, [rdv, getVolontaireInfo, loadVolontaireDetails]);
  
  return (
    <tr className="hover:bg-gray-100">
      <td className="p-2 text-gray-500 text-sm">#{rdvId}</td>
      <td className="p-2">{formatDate(rdv.date)}</td>
      <td className="p-2">{rdv.heure}</td>
      <td className="p-2">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
          {isLoadingVolontaire ? (
            <span className="flex items-center">
              <svg className="animate-spin h-3 w-3 mr-1 text-blue-500" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {volontaireInfo}
            </span>
          ) : (
            volontaireInfo
          )}
        </div>
      </td>
      <td className="p-2">{renderStatusBadge(rdv.etat || 'PLANIFIE')}</td>
      <td className="p-2 text-right">
        <div className="flex justify-end space-x-2">
          <Link to={`/rdvs/etude/${studyId}`} className="text-blue-600 hover:text-blue-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
          </Link>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onStatusUpdate(studyId, rdvId, 0, 'CONFIRME');
            }}
            className="text-green-600 hover:text-green-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onStatusUpdate(studyId, rdvId, 0, 'ANNULE');
            }}
            className="text-red-600 hover:text-red-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
};

const ListView = ({ 
  pagination,
  searchQuery = '', 
  searchField = 'keyword', 
  useMeilisearch = false ,
  onStudiesReceived // Nouvelle prop pour exposer les études au parent

}) => {
  // États principaux
  const [allStudies, setAllStudies] = useState([]);
  const [displayedStudies, setDisplayedStudies] = useState([]);
  const [expandedStudies, setExpandedStudies] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // État de pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(pagination.size || 10);
  const [totalItems, setTotalItems] = useState(pagination.total || 0);
  const [totalPages, setTotalPages] = useState(0);
  
  // État de tri
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' = plus récent d'abord

  // Chargement de toutes les études
  useEffect(() => {
    const fetchAllStudies = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        if (!rdvService.getStudiesWithRdvCount) {
          throw new Error("API de service non disponible");
        }
        
        // 1. Récupérer la première page pour connaître le total
        const initialResponse = await rdvService.getStudiesWithRdvCount(0, 1, searchQuery, useMeilisearch);
        
        if (!initialResponse || typeof initialResponse.totalElements !== 'number') {
          throw new Error("Format de réponse inattendu");
        }
        
        const total = initialResponse.totalElements;
        setTotalItems(total);
        
        // 2. Calculer le nombre de pages
        const pagesNeeded = Math.ceil(total / 50); // 50 est la taille maximale
        setTotalPages(pagesNeeded);
        
        // 3. Charger toutes les pages
        const allStudiesData = [];
        
        for (let i = 0; i < pagesNeeded; i++) {
          const pageResponse = await rdvService.getStudiesWithRdvCount(i, 50, searchQuery, useMeilisearch);
          
          if (pageResponse && pageResponse.content && Array.isArray(pageResponse.content)) {
            allStudiesData.push(...pageResponse.content);
          }
        }
        
        // 4. Trier toutes les études
        const sortedStudies = sortStudiesByLatestRdvDate(allStudiesData, sortOrder);
        
        // 5. Mettre à jour les états
        setAllStudies(sortedStudies);
        updateDisplayedStudies(sortedStudies, currentPage, pageSize);
        
        // 6. Exposer les études au parent via la prop onStudiesReceived
        if (onStudiesReceived && typeof onStudiesReceived === 'function') {
          onStudiesReceived(sortedStudies);
        }
        
      } catch (error) {
        console.error('Erreur:', error);
        setError(`Erreur lors du chargement des études: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllStudies();
  }, [searchQuery, useMeilisearch, sortOrder, currentPage, pageSize, onStudiesReceived]); // Uniquement lors des recherches

  // Effet pour mettre à jour les études affichées lors du changement d'ordre de tri
  useEffect(() => {
    if (allStudies.length > 0) {
      const sortedStudies = sortStudiesByLatestRdvDate([...allStudies], sortOrder);
      setAllStudies(sortedStudies);
      updateDisplayedStudies(sortedStudies, currentPage, pageSize);
    }
  }, [sortOrder]);
  
  // Effet pour mettre à jour les études affichées lors du changement de page
  useEffect(() => {
    if (allStudies.length > 0) {
      updateDisplayedStudies(allStudies, currentPage, pageSize);
    }
  }, [currentPage, pageSize]);
  
  // Fonction pour mettre à jour les études affichées
  const updateDisplayedStudies = (studies, page, size) => {
    const start = page * size;
    const end = Math.min(start + size, studies.length);
    setDisplayedStudies(studies.slice(start, end));
  };

  // Fonction de tri par date la plus récente
  const sortStudiesByLatestRdvDate = (studiesArray, order) => {
    // Créer un tableau d'objets contenant l'étude et sa date la plus récente
    const studiesWithDates = studiesArray.map(study => {
      let latestDate = new Date(0);
      let latestDateString = "";
      let year = 0;
      
      if (study.rdvs && study.rdvs.length > 0) {
        // Parcourir tous les RDVs pour trouver la date la plus récente
        study.rdvs.forEach(rdv => {
          if (rdv.date) {
            try {
              const rdvDate = new Date(rdv.date);
              if (!isNaN(rdvDate.getTime()) && rdvDate > latestDate) {
                latestDate = rdvDate;
                latestDateString = rdv.date;
                year = rdvDate.getFullYear();
              }
            } catch (e) {
              console.error(`Erreur avec la date ${rdv.date}:`, e);
            }
          }
        });
      }
      
      return {
        study,
        latestDate,
        latestDateString,
        year,
        timestamp: latestDate.getTime()
      };
    });

    // Trier les études
    studiesWithDates.sort((a, b) => {
      // Tri par année d'abord pour garantir que 2025 passe avant 2023
      if (a.year !== b.year) {
        return order === 'desc' ? b.year - a.year : a.year - b.year;
      }
      
      // Puis par timestamp complet pour le tri précis dans la même année
      return order === 'desc' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp;
    });

    // Retourner juste les études, dans l'ordre trié
    return studiesWithDates.map(item => item.study);
  };

  // Fonction pour changer l'ordre de tri
  const toggleSortOrder = () => {
    setSortOrder(prevOrder => prevOrder === 'desc' ? 'asc' : 'desc');
  };

  // Gestionnaires de pagination
  const handleNextPage = () => {
    if (currentPage < Math.ceil(totalItems / pageSize) - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Gestion de l'expansion des études
  const toggleStudyExpansion = (studyId) => {
    setExpandedStudies(prev => ({
      ...prev,
      [studyId]: !prev[studyId]
    }));
  };

  // Rendu du badge de statut
  const renderStatusBadge = (status) => {
    const statusStyles = {
      'CONFIRME': 'bg-green-100 text-green-800',
      'EN_ATTENTE': 'bg-yellow-100 text-yellow-800',
      'ANNULE': 'bg-red-100 text-red-800',
      'COMPLETE': 'bg-blue-100 text-blue-800',
      'PLANIFIE': 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  // Fonction améliorée pour récupérer les informations du volontaire
  const getVolontaireInfo = (rdv) => {
    // Cas 1: Valeur directement dans volontaire (objet)
    if (rdv.volontaire) {
      if (typeof rdv.volontaire === 'object') {
        const prenom = rdv.volontaire.prenom || rdv.volontaire.prenomVolontaire || '';
        const nom = rdv.volontaire.nom || rdv.volontaire.nomVolontaire || '';
        
        if (prenom || nom) {
          return `${prenom} ${nom}`.trim();
        } else if (rdv.volontaire.nomComplet) {
          return rdv.volontaire.nomComplet;
        }
      } else if (typeof rdv.volontaire === 'string') {
        // Cas 2: Valeur directement dans volontaire (chaîne)
        return rdv.volontaire;
      }
    }
    
    // Cas 3: Valeurs directement dans les propriétés du RDV
    if (rdv.prenomVolontaire && rdv.nomVolontaire) {
      return `${rdv.prenomVolontaire} ${rdv.nomVolontaire}`;
    } else if (rdv.nomCompletVolontaire) {
      return rdv.nomCompletVolontaire;
    }
    
    // Cas 4: ID du volontaire disponible, doit être chargé
    if (rdv.idVolontaire) {
      return `LOAD:${rdv.idVolontaire}`;
    }
    
    // Cas 5: Analyse des autres propriétés qui pourraient contenir l'ID
    const idProperties = ['volontaireId', 'id_volontaire'];
    for (const prop of idProperties) {
      if (rdv[prop]) {
        return `LOAD:${rdv[prop]}`;
      }
    }
    
    // Cas 6: Si LOAD:xxx est directement dans une propriété
    if (typeof rdv.volontaire === 'string' && rdv.volontaire.startsWith('LOAD:')) {
      return rdv.volontaire;
    }
    
    // Aucune information trouvée
    return 'Non assigné';
  };

  // Fonction améliorée pour charger les détails d'un volontaire
  const loadVolontaireDetails = async (volontaireId) => {
    try {
      console.log(`Chargement des détails du volontaire ID: ${volontaireId}`);
      
      // Si l'ID est numérique, convertissez-le en nombre
      const parsedId = isNaN(volontaireId) ? volontaireId : parseInt(volontaireId, 10);
      
      // Appel à l'API pour récupérer les informations
      const response = await axios.get(`/api/volontaires/${parsedId}`);
      
      // Log de débogage pour voir la structure de la réponse
      console.log('Réponse API volontaire:', response.data);
      
      if (!response.data) {
        throw new Error('Aucune donnée reçue');
      }
      
      // Extraction des informations du volontaire
      const volontaireData = response.data;
      
      // Vérifier si nous avons un prénom et un nom
      const prenom = volontaireData.prenom || volontaireData.prenomVolontaire || '';
      const nom = volontaireData.nom || volontaireData.nomVolontaire || '';
      
      // Si prénom et nom sont disponibles, les utiliser
      if (prenom || nom) {
        return `${prenom} ${nom}`.trim();
      }
      
      // Sinon, essayer d'utiliser le nom complet
      if (volontaireData.nomComplet) {
        return volontaireData.nomComplet;
      }
      
      // En dernier recours, afficher l'ID
      return `ID: ${volontaireId}`;
    } catch (error) {
      console.error(`Erreur lors de la récupération des infos du volontaire ${volontaireId}:`, error);
      
      // Retourner un message d'erreur utile
      return `Volontaire #${volontaireId}`;
    }
  };

  // Fonction pour trier les rendez-vous par date
  const sortRdvsByDate = (rdvs, order = 'desc') => {
    return [...rdvs].sort((a, b) => {
      const dateA = new Date(a.date || 0);
      const dateB = new Date(b.date || 0);
      
      if (isNaN(dateA.getTime())) return order === 'desc' ? -1 : 1;
      if (isNaN(dateB.getTime())) return order === 'desc' ? 1 : -1;
      
      return order === 'desc' ? dateB - dateA : dateA - dateB;
    });
  };

  // Gestion de la mise à jour du statut
  const handleStatusUpdate = async (studyId, rdvId, sequence, newStatus) => {
    try {
      await rdvService.updateStatus(studyId, rdvId, sequence, newStatus);
      
      // Mise à jour locale des données
      const updatedAllStudies = allStudies.map(study => {
        if (study.id === studyId && study.rdvs) {
          const updatedRdvs = study.rdvs.map(rdv => {
            const rdvIdentifier = rdv.id?.idRdv || rdv.idRdv || rdv.id;
            if (rdvIdentifier === rdvId) {
              return { ...rdv, etat: newStatus };
            }
            return rdv;
          });
          
          return { ...study, rdvs: updatedRdvs };
        }
        return study;
      });
      
      setAllStudies(updatedAllStudies);
      updateDisplayedStudies(updatedAllStudies, currentPage, pageSize);
      
    } catch (error) {
      console.error('Erreur de mise à jour:', error);
      alert('Impossible de mettre à jour le statut');
    }
  };

  // Trouver la date la plus récente pour une étude
  const getLatestDate = (study) => {
    if (!study.rdvs || study.rdvs.length === 0) return null;
    
    let latestDate = null;
    let latestDateObj = new Date(0);
    
    study.rdvs.forEach(rdv => {
      if (rdv.date) {
        const rdvDate = new Date(rdv.date);
        if (!isNaN(rdvDate.getTime()) && rdvDate > latestDateObj) {
          latestDateObj = rdvDate;
          latestDate = rdv.date;
        }
      }
    });
    
    return latestDate;
  };

  // Calcul de l'année à partir d'une date
  const getYearFromDate = (dateString) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).getFullYear();
    } catch (e) {
      return null;
    }
  };

  // Rendu principal
  if (isLoading && allStudies.length === 0) {
    return (
      <div className="flex flex-col items-center py-12">
        <svg className="animate-spin h-8 w-8 text-primary-600 mb-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-gray-600">Chargement de toutes les études...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <p className="inline">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Contrôles de tri et indicateur de chargement */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <button 
            onClick={toggleSortOrder}
            className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white border border-blue-700 rounded text-sm font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            Tri par date
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
              {sortOrder === 'desc' ? (
                <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
              ) : (
                <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              )}
            </svg>
          </button>
          {isLoading && (
            <span className="ml-3 text-sm text-gray-600 flex items-center">
              <svg className="animate-spin h-4 w-4 mr-1" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Mise à jour...
            </span>
          )}
        </div>
        <div className="text-sm text-gray-600">
          {displayedStudies.length} / {totalItems} études {sortOrder === 'desc' ? '(plus récentes d\'abord)' : '(plus anciennes d\'abord)'}
        </div>
      </div>

      {displayedStudies.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Aucune étude trouvée
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {displayedStudies.map(study => {
            const latestDate = getLatestDate(study);
            const year = getYearFromDate(latestDate);
            
            return (
              <div key={study.id} className="border-b last:border-b-0">
                <div 
                  onClick={() => toggleStudyExpansion(study.id)}
                  className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                >
                  <div>
                    <h3 className="font-semibold text-gray-800">{study.ref}</h3>
                    <p className="text-sm text-gray-500">{study.titre}</p>
                    {latestDate && (
                      <p className="text-xs text-blue-600 mt-1 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        RDV le {formatDate(latestDate)} {year && `(${year})`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-gray-200 text-gray-800 rounded-full px-3 py-1 text-sm">
                      {study.rdvCount} RDV{study.rdvCount !== 1 ? 's' : ''}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${expandedStudies[study.id] ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>

                {expandedStudies[study.id] && (
                  <div className="bg-gray-50 p-4">
                    {study.rdvs && study.rdvs.length > 0 ? (
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="p-2 text-left">ID RDV</th>
                            <th className="p-2 text-left">Date</th>
                            <th className="p-2 text-left">Heure</th>
                            <th className="p-2 text-left">Volontaire</th>
                            <th className="p-2 text-left">Statut</th>
                            <th className="p-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortRdvsByDate(study.rdvs).map(rdv => (
                            <RdvRow 
                              key={rdv.id?.idRdv || rdv.idRdv || rdv.id} 
                              rdv={rdv} 
                              studyId={study.id}
                              onStatusUpdate={handleStatusUpdate}
                              renderStatusBadge={renderStatusBadge}
                              getVolontaireInfo={getVolontaireInfo}
                              loadVolontaireDetails={loadVolontaireDetails}
                            />
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        Aucun rendez-vous pour cette étude
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Contrôles de pagination */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-700">
          Affichage de {totalItems > 0 ? currentPage * pageSize + 1 : 0} à{' '}
          {Math.min((currentPage + 1) * pageSize, totalItems)} sur{' '}
          {totalItems} études
        </p>
        <div className="flex space-x-2">
          <button
            disabled={currentPage === 0}
            onClick={handlePrevPage}
            className="px-3 py-1 border rounded-md disabled:opacity-50 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Précédent
          </button>
          <button
            disabled={(currentPage + 1) * pageSize >= totalItems}
            onClick={handleNextPage}
            className="px-3 py-1 border rounded-md disabled:opacity-50 flex items-center"
          >
            Suivant
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ListView;
