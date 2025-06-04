import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import volontaireService from '../../services/volontaireService';

const StudyView = ({ 
  studies: propStudies = [], // Utiliser les études passées en props
  pagination, 
  searchQuery = '', 
  searchField = 'keyword', 
  useMeilisearch = false 
}) => {
  const [expandedStudy, setExpandedStudy] = useState(null);
  const [rdvsByStudy, setRdvsByStudy] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [totalStudiesWithRdv, setTotalStudiesWithRdv] = useState(0);
  const [volontaires, setVolontaires] = useState([]);
  const [rdvsPaginationByStudy, setRdvsPaginationByStudy] = useState({});
  
  // Charger les volontaires au chargement du composant
  useEffect(() => {
    const fetchVolontaires = async () => {
      try {
        const response = await volontaireService.getAll();
        const volontairesArray = response?.data || response || [];
        setVolontaires(Array.isArray(volontairesArray) ? volontairesArray : []);
      } catch (error) {
        console.error('Erreur lors du chargement des volontaires:', error);
        setVolontaires([]);
      }
    };
    
    fetchVolontaires();
  }, []);
  
  // Debug logging
  useEffect(() => {
    console.log('StudyView Props:', {
      studiesCount: propStudies.length,
      searchQuery, 
      searchField, 
      useMeilisearch,
      page: pagination.page,
      size: pagination.size
    });
  }, [propStudies, searchQuery, searchField, useMeilisearch, pagination.page, pagination.size]);

  // Mettre à jour totalStudiesWithRdv en fonction des props
  useEffect(() => {
    setTotalStudiesWithRdv(propStudies.length);
    if (typeof pagination.updateTotal === 'function') {
      pagination.updateTotal(propStudies.length);
    }
    
    // Si une seule étude, l'ouvrir automatiquement
    if (propStudies.length === 1) {
      setExpandedStudy(propStudies[0].id);
      loadRdvsForStudy(propStudies[0].id);
      
      // Initialiser la pagination pour cette étude
      setRdvsPaginationByStudy(prev => ({
        ...prev,
        [propStudies[0].id]: {
          page: 0,
          size: 10
        }
      }));
    }
  }, [propStudies, pagination]);
  
  // Fonction pour récupérer le nom du volontaire par son ID
  const getVolontaireNameById = (idVolontaire) => {
    if (!idVolontaire) return 'Non assigné';
    const volontaire = volontaires.find(v => v.id === idVolontaire);
    return volontaire ? `${volontaire.prenom} ${volontaire.nom}` : `ID: ${idVolontaire}`;
  };
  
  // Fonction pour gérer le changement de page des rendez-vous d'une étude
  const handleRdvPageChange = (studyId, newPage) => {
    setRdvsPaginationByStudy(prev => ({
      ...prev,
      [studyId]: {
        ...prev[studyId],
        page: newPage
      }
    }));
  };
  
  // Fonction pour charger les rendez-vous d'une étude
  const loadRdvsForStudy = async (studyId) => {
    const studyRdvs = propStudies.find(study => study.id === studyId)?.rdvs || [];
    
    setRdvsByStudy(prev => ({
      ...prev,
      [studyId]: studyRdvs
    }));
  };
  
  // Gère le clic sur une étude pour l'ouvrir/fermer
  const toggleStudy = async (studyId) => {
    if (expandedStudy === studyId) {
      setExpandedStudy(null);
    } else {
      setExpandedStudy(studyId);
      loadRdvsForStudy(studyId);
      
      // Initialiser ou réinitialiser la pagination pour cette étude
      setRdvsPaginationByStudy(prev => ({
        ...prev,
        [studyId]: {
          page: 0,
          size: 10 // 10 rendez-vous par page
        }
      }));
    }
  };
  
  // Formatage de la date pour l'affichage
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Si aucune étude n'est trouvée */}
      {propStudies.length === 0 ? (
        <div className="bg-white p-6 text-center text-gray-500 rounded-lg shadow-sm">
          {searchQuery 
            ? "Aucune étude ne correspond à votre recherche" 
            : "Aucune étude avec des rendez-vous n'a été trouvée"}
        </div>
      ) : (
        <>
          {/* Liste des études */}
          {propStudies.map((study) => (
            <div key={study.id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <div 
                className="bg-white p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                onClick={() => toggleStudy(study.id)}
              >
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center justify-center p-1 transition-transform ${expandedStudy === study.id ? "transform rotate-90" : ""}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </span>
                  <span className="font-medium">
                    {study.ref || `Étude ID: ${study.id}`}
                  </span>
                </div>
                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                  {study.rdvCount || study.rdvs?.length || 0} rendez-vous
                </span>
              </div>
              
              {/* Contenu déplié pour l'étude sélectionnée */}
              {expandedStudy === study.id && (
                <div className="border-t border-gray-200">
                  {rdvsByStudy[study.id] ? (
                    rdvsByStudy[study.id].length > 0 ? (
                      <div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  ID RDV
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Volontaire
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Heure
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Commentaires
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {(() => {
                                const studyPagination = rdvsPaginationByStudy[study.id] || { page: 0, size: 10 };
                                const start = studyPagination.page * studyPagination.size;
                                const end = Math.min(start + studyPagination.size, rdvsByStudy[study.id].length);
                                const paginatedRdvs = rdvsByStudy[study.id].slice(start, end);
                                
                                return paginatedRdvs.map((rdv) => {
                                  const idRdv = rdv.idRdv || (rdv.id && rdv.id.idRdv);
                                  return (
                                    <tr key={idRdv} className="hover:bg-gray-50">
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {idRdv}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <Link 
                                          to={`/volontaires/${rdv.idVolontaire}`}
                                          className="text-primary-600 hover:text-primary-900"
                                        >
                                          {rdv.volontaire 
                                            ? `${rdv.volontaire.prenom} ${rdv.volontaire.nom}` 
                                            : getVolontaireNameById(rdv.idVolontaire)}
                                        </Link>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(rdv.date)}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {rdv.heure}
                                      </td>
                                      <td className="px-6 py-4 text-sm text-gray-500">
                                        {rdv.commentaires || ''}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link 
                                          to={`/rdvs/${study.id}/${idRdv}/edit`}
                                          className="text-primary-600 hover:text-primary-900"
                                        >
                                          Modifier
                                        </Link>
                                      </td>
                                    </tr>
                                  );
                                });
                              })()}
                            </tbody>
                          </table>
                        </div>
                        
                        {/* Contrôles de pagination interne pour les rendez-vous */}
                        <div className="flex justify-between items-center p-4 border-t border-gray-200">
                          <p className="text-sm text-gray-500">
                            {(() => {
                              const total = rdvsByStudy[study.id].length;
                              const page = rdvsPaginationByStudy[study.id]?.page || 0;
                              const size = rdvsPaginationByStudy[study.id]?.size || 10;
                              const start = total === 0 ? 0 : page * size + 1;
                              const end = Math.min((page + 1) * size, total);
                              return `Affichage de ${start} à ${end} sur ${total} rendez-vous`;
                            })()}
                          </p>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleRdvPageChange(study.id, Math.max(0, (rdvsPaginationByStudy[study.id]?.page || 0) - 1))}
                              disabled={(rdvsPaginationByStudy[study.id]?.page || 0) === 0}
                              className="px-3 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                            >
                              Précédent
                            </button>
                            
                            {/* Boutons de pagination numérotés */}
                            {(() => {
                              const currentPage = rdvsPaginationByStudy[study.id]?.page || 0;
                              const pageSize = rdvsPaginationByStudy[study.id]?.size || 10;
                              const totalRdvs = rdvsByStudy[study.id].length;
                              const totalPages = Math.ceil(totalRdvs / pageSize);
                              
                              // Calcul des pages à afficher (5 max)
                              let startPage = Math.max(0, currentPage - 2);
                              let endPage = Math.min(totalPages - 1, startPage + 4);
                              
                              // Ajustement si on est proche de la fin
                              if (endPage - startPage < 4 && startPage > 0) {
                                startPage = Math.max(0, endPage - 4);
                              }
                              
                              const pageNumbers = [];
                              for (let i = startPage; i <= endPage; i++) {
                                pageNumbers.push(i);
                              }
                              
                              return pageNumbers.map(pageNumber => (
                                <button
                                  key={pageNumber}
                                  onClick={() => handleRdvPageChange(study.id, pageNumber)}
                                  className={`px-3 py-1 border rounded ${
                                    currentPage === pageNumber
                                      ? 'bg-primary-50 text-primary-700 border-primary-300'
                                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                  }`}
                                >
                                  {pageNumber + 1}
                                </button>
                              ));
                            })()}
                            
                            <button
                              onClick={() => {
                                const currentPage = rdvsPaginationByStudy[study.id]?.page || 0;
                                const pageSize = rdvsPaginationByStudy[study.id]?.size || 10;
                                const totalRdvs = rdvsByStudy[study.id].length;
                                const totalPages = Math.ceil(totalRdvs / pageSize);
                                handleRdvPageChange(study.id, Math.min(currentPage + 1, totalPages - 1));
                              }}
                              disabled={(() => {
                                const currentPage = rdvsPaginationByStudy[study.id]?.page || 0;
                                const pageSize = rdvsPaginationByStudy[study.id]?.size || 10;
                                const totalRdvs = rdvsByStudy[study.id].length;
                                const totalPages = Math.ceil(totalRdvs / pageSize);
                                return currentPage >= totalPages - 1;
                              })()}
                              className="px-3 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                            >
                              Suivant
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        Aucun rendez-vous pour cette étude
                      </div>
                    )
                  ) : (
                    <div className="p-4 text-center">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-600"></div>
                      <span className="ml-2 text-gray-500">Chargement des rendez-vous...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          
          {/* Pagination pour les études */}
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-gray-700">
              {totalStudiesWithRdv > 0 ? (
                `Affichage de ${Math.min(pagination.page * pagination.size + 1, totalStudiesWithRdv)} à ${Math.min((pagination.page + 1) * pagination.size, totalStudiesWithRdv)} sur ${totalStudiesWithRdv} études`
              ) : (
                "Aucune étude trouvée"
              )}
            </p>
            
            {totalStudiesWithRdv > pagination.size && (
              <div className="flex space-x-2">
                <button
                  onClick={pagination.prevPage}
                  disabled={pagination.page === 0}
                  className={`px-3 py-1 border border-gray-300 rounded ${
                    pagination.page === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  Précédent
                </button>
                
                {[...Array(Math.min(5, Math.ceil(totalStudiesWithRdv / pagination.size))).keys()]
                  .map(i => pagination.page < 2 ? i : pagination.page > Math.ceil(totalStudiesWithRdv / pagination.size) - 3 ? Math.ceil(totalStudiesWithRdv / pagination.size) - 5 + i : pagination.page - 2 + i)
                  .filter(i => i >= 0 && i < Math.ceil(totalStudiesWithRdv / pagination.size))
                  .map(i => (
                    <button
                      key={i}
                      onClick={() => pagination.goToPage(i)}
                      className={`px-3 py-1 border border-gray-300 rounded ${
                        pagination.page === i
                          ? 'bg-primary-50 text-primary-700 font-medium border-primary-300'
                          : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                
                <button
                  onClick={pagination.nextPage}
                  disabled={pagination.page >= Math.ceil(totalStudiesWithRdv / pagination.size) - 1}
                  className={`px-3 py-1 border border-gray-300 rounded ${
                    pagination.page >= Math.ceil(totalStudiesWithRdv / pagination.size) - 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  Suivant
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default StudyView;