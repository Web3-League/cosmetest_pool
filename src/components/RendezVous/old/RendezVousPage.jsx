import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import rdvService from '../../services/rdvService';
import searchService from '../../services/searchService';
import { usePagination } from '../../hooks/usePagination';
import CalendarView from './CalendarView';
import ListView from './ListView';
import MeilisearchSearchForm from './MeilisearchSearchForm.jsx';

const RendezVousPage = () => {
  const [rdvs, setRdvs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState('keyword'); // 'keyword', 'etude', 'etude-ref', 'volontaire', 'date', 'etat'
  const [viewMode, setViewMode] = useState('liste');
  const [isLoading, setIsLoading] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [useMeilisearch, setUseMeilisearch] = useState(false);
  const [error, setError] = useState(null);
  const [allStudies, setAllStudies] = useState([]); // État pour stocker toutes les études
  
  // Utiliser le hook de pagination
  const pagination = usePagination();
  
  // Transformation des études en rendez-vous pour le calendrier
  const rdvsForCalendar = useMemo(() => {
    // Extraire tous les rendez-vous de toutes les études
    return allStudies.flatMap(study => {
      if (!study.rdvs || !Array.isArray(study.rdvs)) return [];
      
      // Transformer chaque rendez-vous pour inclure l'information de l'étude
      return study.rdvs.map(rdv => ({
        ...rdv,
        etude: {
          ref: study.ref,
          titre: study.titre,
          idEtude: study.id
        },
        etudeRef: study.ref
      }));
    });
  }, [allStudies]);
  
  // Fonction pour recevoir les études du ListView
  const handleStudiesReceived = useCallback((studies) => {
    setAllStudies(studies);
  }, []);
  
  // Fonction pour charger les rendez-vous (seulement pour la vue calendrier si allStudies est vide)
  const fetchRdvs = useCallback(async () => {
    // N'exécuter cette fonction que si nous n'avons pas encore d'études depuis ListView
    if (allStudies.length > 0) return;
    
    console.log('Chargement des RDVs pour le calendrier...');
    try {
      setIsLoading(true);
      setNoResults(false);
      setError(null);
      
      let response;
      
      // Limit search query length to prevent potential performance issues
      const sanitizedSearchQuery = searchQuery.trim().slice(0, 100);
      
      // Si un terme de recherche est présent
      if (sanitizedSearchQuery) {
        console.log(`Recherche par ${searchField}: ${sanitizedSearchQuery}`);
        
        // Cas spécial: recherche par référence d'étude avec Meilisearch
        if (searchField === 'etude-ref' && useMeilisearch) {
          try {
            response = await searchService.searchByEtudeRef(sanitizedSearchQuery, pagination.page, pagination.size);
          } catch (meilisearchError) {
            console.error('Erreur Meilisearch, repli sur recherche standard:', meilisearchError);
            // Repli sur la recherche standard en cas d'erreur
            response = await rdvService.getPaginated(pagination.page, pagination.size);
          }
        } else {
          // Recherche standard pour les autres champs
          const criteria = {};
          
          switch (searchField) {
            case 'etude-ref': {
              // Utiliser directement comme référence d'étude
              criteria.etudeRef = sanitizedSearchQuery;
              break;
            }
            case 'etude': {
              const idEtude = parseInt(sanitizedSearchQuery, 10);
              if (!isNaN(idEtude) && idEtude > 0) {
                criteria.idEtude = idEtude;
              }
              break;
            }
            case 'volontaire': {
              const idVolontaire = parseInt(sanitizedSearchQuery, 10);
              if (!isNaN(idVolontaire) && idVolontaire > 0) {
                criteria.idVolontaire = idVolontaire;
              }
              break;
            }
            case 'date': {
              // Validate date format
              const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
              if (dateRegex.test(sanitizedSearchQuery)) {
                criteria.date = sanitizedSearchQuery;
              }
              break;
            }
            case 'etat': {
              const validStatuses = ['CONFIRME', 'EN_ATTENTE', 'ANNULE', 'COMPLETE', 'PLANIFIE'];
              const normalizedStatus = sanitizedSearchQuery.toUpperCase();
              if (validStatuses.includes(normalizedStatus)) {
                criteria.etat = normalizedStatus;
              }
              break;
            }
            default: // 'keyword'
              criteria.keyword = sanitizedSearchQuery;
          }
          
          // Prevent empty search
          if (Object.keys(criteria).length > 0) {
            response = await rdvService.search(criteria, pagination.page, pagination.size);
          } else {
            response = await rdvService.getPaginated(pagination.page, pagination.size);
          }
        }
      } else {
        // Pas de recherche, charger tous les rendez-vous paginés
        response = await rdvService.getPaginated(pagination.page, pagination.size);
      }
      
      console.log('Réponse RDVs pour le calendrier:', response);
      
      // Traiter la réponse de manière plus robuste
      // Modifier la gestion de la réponse :
      if (response && (response.content || Array.isArray(response))) {
        const processedRdvs = response.content || response;

        // Ajouter une validation des données
        const isValidResponse = Array.isArray(processedRdvs) && 
                              typeof response.totalElements === 'number' &&
                              typeof response.totalPages === 'number';

        if (!isValidResponse) {
          throw new Error("Réponse API invalide");
        }
              
        // Gérer correctement le nombre total d'éléments
        let totalElements;
        if (response.totalElements !== undefined) {
          totalElements = response.totalElements;
        } else if (Array.isArray(processedRdvs)) {
          totalElements = processedRdvs.length;
        } else {
          totalElements = 0;
        }
        
        pagination.updateTotal(totalElements);
        
        if (Array.isArray(processedRdvs) && processedRdvs.length > 0) {
          // Filtrer et nettoyer les données
          const cleanedRdvs = processedRdvs.map(rdv => ({
            ...rdv,
            idVolontaire: rdv.idVolontaire || null,
            etat: rdv.etat || '',
            commentaires: rdv.commentaires || ''
          }));
          
          setRdvs(cleanedRdvs);
          setNoResults(false);
        } else {
          setRdvs([]);
          setNoResults(!searchQuery.trim() ? false : true);
        }
      } else {
        console.error('Format de réponse inattendu pour les RDVs:', response);
        setRdvs([]);
        pagination.updateTotal(0);
        setNoResults(true);
        setError('Format de réponse inattendu pour les rendez-vous');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des rendez-vous:', error);
      
      // Gestion des erreurs spécifiques
      if (error.response) {
        if (error.response.status === 429) {
          setError('Trop de requêtes. Veuillez réessayer plus tard.');
        } else if (error.response.status >= 500) {
          setError('Erreur serveur. Veuillez réessayer ultérieurement.');
        } else {
          setError(`Erreur HTTP ${error.response.status}: ${error.response.data?.message || error.message || 'Erreur inconnue'}`);
        }
      } else if (error.request) {
        setError('Pas de réponse du serveur. Vérifiez votre connexion.');
      } else {
        setError(`Erreur: ${error.message || 'Une erreur inconnue est survenue'}`);
      }
      
      setRdvs([]);
      pagination.updateTotal(0);
      setNoResults(true);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.size, pagination.updateTotal, searchQuery, searchField, useMeilisearch, allStudies.length]);
  
  // Fonction pour gérer le changement de mode de vue
  const handleViewModeChange = useCallback((newMode) => {
    if (newMode !== viewMode) {
      setViewMode(newMode);
      pagination.goToPage(0); // Réinitialiser la pagination lors du changement de vue
      
      // Réinitialiser l'état d'erreur lors du changement de vue
      setError(null);
    }
  }, [viewMode, pagination]);
  
  // Charger les données uniquement pour la vue calendrier et si on n'a pas encore de données
  useEffect(() => {
    if (viewMode === 'calendrier' && allStudies.length === 0) {
      fetchRdvs();
    }
  }, [viewMode, fetchRdvs, pagination.page, pagination.size, searchQuery, searchField, allStudies.length]);
  
  // Gérer la recherche avec Meilisearch
  const handleMeilisearchSearch = useCallback(({ searchField: newSearchField, query }) => {
    setSearchField(newSearchField);
    setSearchQuery(query);
    setUseMeilisearch(newSearchField === 'etude-ref');
    pagination.goToPage(0);
    // Réinitialiser allStudies pour forcer un rechargement des données
    setAllStudies([]);
  }, [pagination]);
  
  // Déterminer le message "aucun résultat" approprié
  const getNoResultsMessage = () => {
    if (error) {
      return error;
    }
    
    if (searchQuery) {
      return `Aucun rendez-vous ne correspond à votre recherche "${searchQuery}"`;
    }
    
    return "Aucun rendez-vous disponible";
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Gestion des Rendez-vous</h1>
        <Link
          to="/rdvs/nouveau"
          className="btn btn-primary flex items-center"
        >
          <span className="mr-2">+</span> Nouveau rendez-vous
        </Link>
      </div>
      
      {/* Formulaire de recherche Meilisearch */}
      <div>
        <MeilisearchSearchForm onSearch={handleMeilisearchSearch} />
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <button 
            className={`px-4 py-2 rounded ${viewMode === 'liste' ? 'bg-primary-700 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
            onClick={() => handleViewModeChange('liste')}
          >
            Liste
          </button>
          <button 
            className={`px-4 py-2 rounded ${viewMode === 'calendrier' ? 'bg-primary-700 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
            onClick={() => handleViewModeChange('calendrier')}
          >
            Calendrier
          </button>
        </div>
      </div>
      
      {viewMode === 'calendrier' && isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          <p className="ml-3 text-gray-600">Chargement en cours...</p>
        </div>
      ) : viewMode === 'calendrier' && (noResults || error) && rdvsForCalendar.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500">
          {getNoResultsMessage()}
          {error && (
            <button 
              className="mt-3 bg-blue-100 hover:bg-blue-200 text-blue-800 py-2 px-4 rounded"
              onClick={() => {
                setError(null);
                fetchRdvs();
              }}
            >
              Réessayer
            </button>
          )}
        </div>
      ) : (
        <>
          {viewMode === 'liste' && (
            <ListView 
              pagination={pagination}
              searchQuery={searchQuery}
              searchField={searchField}
              useMeilisearch={useMeilisearch}
              onStudiesReceived={handleStudiesReceived}
            />
          )}
          
          {viewMode === 'calendrier' && (
            <CalendarView rdvs={rdvsForCalendar.length > 0 ? rdvsForCalendar : rdvs} />
          )}
        </>
      )}
    </div>
  );
};

export default RendezVousPage;