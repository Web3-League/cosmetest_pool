import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import groupeService from '../../services/groupeService'
import etudeService from '../../services/etudeService'
import { usePagination } from '../../hooks/usePagination'

const GroupesPage = () => {
  const [groupes, setGroupes] = useState([])
  const [etudes, setEtudes] = useState({}) // Cache pour stocker les informations des études
  const [allEtudes, setAllEtudes] = useState([]) // Toutes les études pour la recherche par référence
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [etudeFilter, setEtudeFilter] = useState('')
  const [etudeRefFilter, setEtudeRefFilter] = useState('') // Filtre par référence d'étude
  const [ageMinFilter, setAgeMinFilter] = useState('')
  const [ageMaxFilter, setAgeMaxFilter] = useState('')
  const [ethnieFilter, setEthnieFilter] = useState('')
  const { page, size, updateTotal, goToPage, nextPage, prevPage, pageCount } = usePagination()
  
  // Chargement initial de toutes les études pour le filtre par référence
  useEffect(() => {
    const loadAllEtudes = async () => {
      try {
        const etudesData = await etudeService.getAll();
        setAllEtudes(etudesData);
        
        // Pré-remplir le cache d'études
        const etudesCache = {};
        etudesData.forEach(etude => {
          etudesCache[etude.idEtude] = etude;
        });
        setEtudes(etudesCache);
      } catch (error) {
        console.error('Erreur lors du chargement des études:', error);
      }
    };
    
    loadAllEtudes();
  }, []);
  
  // Fonction pour charger les détails d'une étude
  const fetchEtudeInfo = async (idEtude) => {
    // Si nous avons déjà les informations de cette étude, pas besoin de les recharger
    if (etudes[idEtude]) return etudes[idEtude];
    
    try {
      const etudeData = await etudeService.getById(idEtude);
      
      // Mettre à jour le cache d'études
      setEtudes(prev => ({
        ...prev,
        [idEtude]: etudeData
      }));
      
      return etudeData;
    } catch (error) {
      console.error(`Erreur lors du chargement de l'étude ${idEtude}:`, error);
      return null;
    }
  };
  
  // Fonction pour obtenir la référence d'une étude
  const getEtudeReference = (idEtude) => {
    if (!idEtude) return 'Non spécifiée';
    
    const etude = etudes[idEtude];
    if (!etude) return `Étude #${idEtude}`;
    
    return etude.ref || etude.titre || `Étude #${idEtude}`;
  };
  
  // Fonction pour rechercher l'ID d'une étude à partir de sa référence
  const findEtudeIdByRef = (reference) => {
    if (!reference.trim()) return null;
    
    const foundEtude = allEtudes.find(etude => 
      (etude.ref && etude.ref.toLowerCase().includes(reference.toLowerCase())) ||
      (etude.titre && etude.titre.toLowerCase().includes(reference.toLowerCase()))
    );
    
    return foundEtude ? foundEtude.idEtude : null;
  };
  
  // Gestionnaire pour la recherche par référence d'étude
  const handleEtudeRefSearch = (e) => {
    e.preventDefault();
    
    const etudeId = findEtudeIdByRef(etudeRefFilter);
    if (etudeId) {
      handleFilterByEtude(etudeId);
    } else if (etudeRefFilter.trim()) {
      // Notification à l'utilisateur si aucune étude n'est trouvée
      alert(`Aucune étude trouvée avec la référence "${etudeRefFilter}"`);
    }
  };
  
  useEffect(() => {
    const fetchGroupes = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        let response;
        
        // Applique les différents filtres selon les paramètres définis
        if (etudeFilter) {
          // Filtre par étude
          response = await groupeService.getGroupesByIdEtude(etudeFilter);
        } else if (ageMinFilter || ageMaxFilter) {
          // Filtre par tranche d'âge
          response = await groupeService.getGroupesByAgeRange(ageMinFilter || null, ageMaxFilter || null);
        } else if (ethnieFilter) {
          // Filtre par ethnie
          response = await groupeService.getGroupesByEthnie(ethnieFilter);
        } else {
          // Sans filtre - pagination standard
          response = await groupeService.getPaginated(page, size, 'nom', 'DESC');
        }
        
        // Préparer les données pour l'affichage
        let groupesToDisplay;
        let totalElements;
        
        if (!response.content && Array.isArray(response)) {
          // Création manuelle d'une structure paginée pour l'affichage côté client
          groupesToDisplay = response.slice(page * size, (page + 1) * size);
          totalElements = response.length;
        } else {
          // Si la réponse est déjà au format paginé
          groupesToDisplay = response.content || response;
          totalElements = response.totalElements || response.length;
        }
        
        // Extraire tous les IDs d'études uniques
        const uniqueEtudeIds = [...new Set(groupesToDisplay
          .map(g => g.idEtude)
          .filter(id => id !== undefined && id !== null))];
        
        // Charger les informations de toutes les études nécessaires en parallèle
        if (uniqueEtudeIds.length > 0) {
          console.log("Chargement des informations pour les études:", uniqueEtudeIds);
          await Promise.all(uniqueEtudeIds.map(fetchEtudeInfo));
        }
        
        setGroupes(groupesToDisplay);
        updateTotal(totalElements);
      } catch (error) {
        console.error('Erreur lors du chargement des groupes:', error)
        setError('Impossible de charger les groupes. Veuillez réessayer plus tard.')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchGroupes()
  }, [page, size, etudeFilter, ageMinFilter, ageMaxFilter, ethnieFilter, updateTotal])
  
  const handleFilterByAge = (e) => {
    e.preventDefault()
    // Réinitialiser la page et les autres filtres non liés à l'âge
    goToPage(0)
    setEtudeFilter('')
    setEtudeRefFilter('')
    setEthnieFilter('')
  }
  
  const handleFilterByEtude = (idEtude) => {
    // Réinitialiser la page et les autres filtres
    goToPage(0)
    setEtudeFilter(idEtude)
    
    // Mettre à jour le filtre de référence d'étude si on a l'étude
    const etude = etudes[idEtude];
    setEtudeRefFilter(etude?.ref || '');
    
    setAgeMinFilter('')
    setAgeMaxFilter('')
    setEthnieFilter('')
  }
  
  const handleFilterByEthnie = (ethnie) => {
    // Réinitialiser la page et les autres filtres
    goToPage(0)
    setEthnieFilter(ethnie)
    setEtudeFilter('')
    setEtudeRefFilter('')
    setAgeMinFilter('')
    setAgeMaxFilter('')
  }
  
  const resetFilters = () => {
    setEtudeFilter('')
    setEtudeRefFilter('')
    setAgeMinFilter('')
    setAgeMaxFilter('')
    setEthnieFilter('')
    goToPage(0)
  }
  
  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce groupe ?')) {
      try {
        await groupeService.delete(id)
        // Rafraîchir la liste après suppression
        setGroupes(groupes.filter(groupe => (groupe.idGroupe || groupe.id) !== id))
      } catch (error) {
        console.error('Erreur lors de la suppression:', error)
        alert('Une erreur est survenue lors de la suppression du groupe')
      }
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Gestion des Groupes</h1>
        <Link
          to="/groupes/nouveau"
          className="btn btn-primary flex items-center"
        >
          <span className="mr-2">+</span> Nouveau groupe
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col lg:flex-row space-y-3 lg:space-y-0 lg:space-x-3">
          {/* Recherche par référence d'étude */}
          <form onSubmit={handleEtudeRefSearch} className="flex-1">
            <div className="relative flex">
              <input
                type="text"
                placeholder="Référence d'étude..."
                className="form-input pr-10 w-full"
                value={etudeRefFilter}
                onChange={(e) => setEtudeRefFilter(e.target.value)}
                list="etudes-refs"
              />
              <datalist id="etudes-refs">
                {allEtudes.map(etude => (
                  <option key={etude.idEtude} value={etude.ref || etude.titre} />
                ))}
              </datalist>
              <button
                type="submit"
                className="btn btn-outline ml-2"
              >
                Filtrer par étude
              </button>
            </div>
          </form>
          
          {/* Filtre par âge */}
          <form onSubmit={handleFilterByAge} className="flex flex-1 space-x-2">
            <input
              type="number"
              placeholder="Âge min"
              className="form-input w-1/2"
              min="0"
              value={ageMinFilter}
              onChange={(e) => setAgeMinFilter(e.target.value)}
            />
            <input
              type="number"
              placeholder="Âge max"
              className="form-input w-1/2"
              min="0"
              value={ageMaxFilter}
              onChange={(e) => setAgeMaxFilter(e.target.value)}
            />
            <button
              type="submit"
              className="btn btn-outline"
            >
              Filtrer par âge
            </button>
          </form>
          
          {/* Bouton pour réinitialiser les filtres */}
          <button
            onClick={resetFilters}
            className="btn btn-secondary"
            disabled={!etudeFilter && !etudeRefFilter && !ageMinFilter && !ageMaxFilter && !ethnieFilter}
          >
            Réinitialiser
          </button>
        </div>
        
        {/* Affichage des filtres actifs */}
        {(etudeFilter || etudeRefFilter || ageMinFilter || ageMaxFilter || ethnieFilter) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {etudeFilter && (
              <span className="badge badge-blue">
                Étude: {getEtudeReference(etudeFilter)}
                <button onClick={() => {setEtudeFilter(''); setEtudeRefFilter('');}} className="ml-2 text-xs">×</button>
              </span>
            )}
            {(ageMinFilter || ageMaxFilter) && (
              <span className="badge badge-blue">
                Âge: {ageMinFilter || '0'} - {ageMaxFilter || '∞'}
                <button 
                  onClick={() => {
                    setAgeMinFilter('');
                    setAgeMaxFilter('');
                  }} 
                  className="ml-2 text-xs"
                >×</button>
              </span>
            )}
            {ethnieFilter && (
              <span className="badge badge-blue">
                Ethnie: {ethnieFilter}
                <button onClick={() => setEthnieFilter('')} className="ml-2 text-xs">×</button>
              </span>
            )}
          </div>
        )}
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Étude</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Âge min</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Âge max</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ethnie</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participants</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {groupes.length > 0 ? (
                    groupes.map(groupe => (
                      <tr key={groupe.idGroupe || groupe.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium">{groupe.intitule || groupe.nom}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button 
                            onClick={() => handleFilterByEtude(groupe.idEtude)}
                            className="text-primary-600 hover:underline"
                          >
                            {getEtudeReference(groupe.idEtude)}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{groupe.ageMinimum || groupe.ageMin}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{groupe.ageMaximum || groupe.ageMax}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button 
                            onClick={() => handleFilterByEthnie(groupe.ethnie)}
                            className="text-primary-600 hover:underline"
                          >
                            {groupe.ethnie}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {groupe.nbSujet || groupe.nombreParticipants || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {/* Utiliser idGroupe comme identifiant principal */}
                          <Link
                            to={`/groupes/${groupe.idGroupe || groupe.id}`}
                            className="text-primary-600 hover:text-primary-900 mr-3"
                          >
                            Détails
                          </Link>
                          <Link
                            to={`/groupes/${groupe.idGroupe || groupe.id}/edit`}
                            className="text-primary-600 hover:text-primary-900 mr-3"
                          >
                            Modifier
                          </Link>
                          <button
                            onClick={() => handleDelete(groupe.idGroupe || groupe.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                        Aucun groupe trouvé
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {groupes.length > 0 && (
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-700">
                Affichage de {page * size + 1} à {Math.min((page + 1) * size, page * size + groupes.length)} groupes
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={prevPage}
                  disabled={page === 0}
                  className={`px-3 py-1 border border-gray-300 rounded ${
                    page === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  Précédent
                </button>
                
                {[...Array(Math.min(5, pageCount)).keys()]
                  .map(i => page < 2 ? i : page > pageCount - 3 ? pageCount - 5 + i : page - 2 + i)
                  .filter(i => i >= 0 && i < pageCount)
                  .map(i => (
                    <button
                      key={i}
                      onClick={() => goToPage(i)}
                      className={`px-3 py-1 border border-gray-300 rounded ${
                        page === i
                          ? 'bg-primary-50 text-primary-700 font-medium border-primary-300'
                          : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                
                <button
                  onClick={nextPage}
                  disabled={page >= pageCount - 1}
                  className={`px-3 py-1 border border-gray-300 rounded ${
                    page >= pageCount - 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default GroupesPage