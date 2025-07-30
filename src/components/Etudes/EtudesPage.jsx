import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import etudeService from '../../services/etudeService'
import { usePagination } from '../../hooks/usePagination'
import { formatDate } from '../../utils/dateUtils'

const EtudesPage = () => {
  const [etudes, setEtudes] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const { page, size, updateTotal, goToPage, nextPage, prevPage, pageCount } = usePagination()
  const navigate = useNavigate()
  
  useEffect(() => {
    const fetchEtudes = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Utilisation du service pour récupérer les données paginées
        let response;
        if (searchQuery.trim()) {
          // Si une recherche est en cours, utiliser l'endpoint de recherche
          const searchResults = await etudeService.search(searchQuery);
          // Simuler une pagination côté client pour les résultats de recherche
          response = {
            content: searchResults.slice(page * size, (page + 1) * size),
            totalElements: searchResults.length
          };
        } else {
          // Sinon, utiliser la pagination standard
          response = await etudeService.getPaginated(page, size, 'dateDebut', 'DESC');
        }
        
        setEtudes(response.content)
        updateTotal(response.totalElements)
      } catch (error) {
        console.error('Erreur lors du chargement des études:', error)
        setError('Impossible de charger les études. Veuillez réessayer plus tard.')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchEtudes()
  }, [page, size, searchQuery, updateTotal])
  
  const handleSearch = (e) => {
    e.preventDefault()
    // Réinitialiser la page à 0 lorsqu'une nouvelle recherche est effectuée
    goToPage(0)
  }
  
  const handleRowClick = (etudeId) => {
    navigate(`/etudes/${etudeId}`)
  }
  
  const getStatusBadge = (etude) => {
    const now = new Date()
    const startDate = new Date(etude.dateDebut || etude.debut)
    const endDate = new Date(etude.dateFin || etude.fin)
    
    let status = '';
    
    // Déterminer le statut en fonction des dates
    if (now < startDate) {
      status = 'A_VENIR';
    } else if (now > endDate) {
      status = 'TERMINEE';
    } else {
      status = 'EN_COURS';
    }
    
    switch (status) {
      case 'EN_COURS':
        return <span className="badge badge-green">En cours</span>
      case 'A_VENIR':
        return <span className="badge badge-blue">À venir</span>
      case 'TERMINEE':
        return <span className="badge badge-gray">Terminée</span>
      case 'ANNULEE':
        return <span className="badge badge-red">Annulée</span>
      default:
        return <span className="badge badge-gray">Inconnu</span>
    }
  }
  
  const handleDelete = async (e, id) => {
    e.stopPropagation() // Empêcher la propagation du clic vers la ligne
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette étude ?')) {
      try {
        await etudeService.delete(id)
        // Rafraîchir la liste après suppression
        setEtudes(etudes.filter(etude => etude.idEtude !== id))
      } catch (error) {
        console.error('Erreur lors de la suppression:', error)
        alert('Une erreur est survenue lors de la suppression de l\'étude')
      }
    }
  }
  
  const handleEditClick = (e) => {
    e.stopPropagation() // Empêcher la propagation du clic vers la ligne
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Gestion des Études</h1>
        <Link
          to="/etudes/nouvelle"
          className="btn btn-primary flex items-center"
        >
          <span className="mr-2">+</span> Nouvelle étude
        </Link>
      </div>
      
      <div className="flex justify-between items-center">
        <form onSubmit={handleSearch} className="w-full md:w-1/3">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher une étude..."
              className="form-input pr-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              <svg
                className="w-5 h-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </div>
        </form>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Réf.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Début</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fin</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {etudes.length > 0 ? (
                    etudes.map(etude => (
                      <tr 
                        key={etude.idEtude} 
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleRowClick(etude.idEtude)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap font-medium">{etude.ref}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{etude.titre}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{formatDate(etude.dateDebut || etude.debut)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{formatDate(etude.dateFin || etude.fin)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(etude)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            to={`/etudes/${etude.idEtude}/edit`}
                            className="text-primary-600 hover:text-primary-900 mr-3"
                            onClick={handleEditClick}
                          >
                            Modifier
                          </Link>
                          <button
                            onClick={(e) => handleDelete(e, etude.idEtude)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                        Aucune étude trouvée
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {etudes.length > 0 && (
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-700">
                Affichage de {page * size + 1} à {Math.min((page + 1) * size, page * size + etudes.length)} études
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

export default EtudesPage