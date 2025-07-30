import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import volontaireService from '../../services/volontaireService'
import { usePagination } from '../../hooks/usePagination'
import { SearchIcon } from '../../components/icons'
import VolontairesTable from './VolontairesTable'

const VolontairesPage = () => {
  const [volontaires, setVolontaires] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [includeArchived, setIncludeArchived] = useState(false)
  const { page, size, updateTotal, goToPage, nextPage, prevPage, pageCount, total } = usePagination()
  
  useEffect(() => {
    const fetchVolontaires = async () => {
      try {
        setIsLoading(true);
        setError(null);
  
        console.log(`Fetching page ${page}, size ${size}, search: "${searchQuery}", includeArchived: ${includeArchived}`);
  
        // ✅ Envoyer `includeArchived` pour que le serveur gère le filtrage
        const response = await volontaireService.getAll({ 
          page, 
          size, 
          search: searchQuery.trim() || null, 
          includeArchived 
        });
  
        console.log("Réponse API:", response.data);
  
        // ✅ Met à jour la liste directement depuis l'API
        setVolontaires(response.data?.content || []);
        updateTotal(response.data?.totalElements || 0);
  
      } catch (error) {
        console.error('Erreur lors du chargement des volontaires:', error);
        setError('Impossible de charger les volontaires. Veuillez réessayer plus tard.');
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchVolontaires();
  }, [page, size, searchQuery, includeArchived]); // ✅ Met à jour si ces valeurs changent
  
  
  const handleSearch = (e) => {
    e.preventDefault()
    // Reset à la première page lors d'une nouvelle recherche
    goToPage(0)
  }
  
  const handleDeleteVolontaire = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir archiver ce volontaire ?")) {
      try {
        await volontaireService.archive(id);
  
        // ✅ Rafraîchir la liste après suppression, en conservant les filtres et la pagination actuelle
        const response = await volontaireService.getAll({ 
          page, 
          size, 
          search: searchQuery, 
          includeArchived 
        });
  
        setVolontaires(response.data?.content || []);
        updateTotal(response.data?.totalElements || 0);
  
      } catch (error) {
        console.error("Erreur lors de l'archivage du volontaire:", error);
        alert("Erreur lors de l'archivage du volontaire.");
      }
    }
  };
  
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Gestion des Volontaires</h1>
        <Link
          to="/volontaires/nouveau"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-sm flex items-center transition-colors duration-150"
        >
          <span className="mr-2">+</span> Ajouter
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4">
        <form onSubmit={handleSearch} className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 sm:items-end">
          <div className="flex-grow">
            <label htmlFor="searchQuery" className="block text-sm font-medium text-gray-700 mb-1">
              Rechercher
            </label>
            <div className="relative">
              <input
                id="searchQuery"
                type="text"
                placeholder="Nom, prénom, email..."
                className="w-full border border-gray-300 rounded-md pl-3 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <SearchIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
          
          <div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="includeArchived"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={includeArchived}
                onChange={(e) => setIncludeArchived(e.target.checked)}
              />
              <label htmlFor="includeArchived" className="text-sm font-medium text-gray-700">
                Inclure les archivés
              </label>
            </div>
          </div>
          
          <div>
            <button
              type="submit"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-sm transition-colors duration-150"
            >
              Rechercher
            </button>
          </div>
        </form>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <VolontairesTable 
            volontaires={volontaires} 
            onArchive={handleDeleteVolontaire} 
          />
          
          {volontaires.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4 flex flex-col sm:flex-row justify-between items-center">
              <p className="text-sm text-gray-700 mb-4 sm:mb-0">
                Affichage de <span className="font-semibold">{page * size + 1}</span> 
                à <span className="font-semibold">{Math.min((page + 1) * size, total)}</span> 
                sur <span className="font-semibold">{total}</span> volontaires
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={prevPage}
                  disabled={page === 0}
                  className={`px-3 py-1 border rounded-md ${
                    page === 0 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' 
                      : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                  }`}
                >
                  &laquo; Précédent
                </button>
                
                <div className="hidden sm:flex space-x-1">
                  {[...Array(Math.min(5, pageCount)).keys()]
                    .map(i => page < 2 ? i : page > pageCount - 3 ? pageCount - 5 + i : page - 2 + i)
                    .filter(i => i >= 0 && i < pageCount)
                    .map(i => (
                      <button
                        key={i}
                        onClick={() => goToPage(i)}
                        className={`w-8 h-8 flex items-center justify-center rounded-md ${
                          page === i
                            ? 'bg-blue-600 text-white font-medium border border-blue-600'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                </div>
                
                <button
                  onClick={nextPage}
                  disabled={page >= pageCount - 1}
                  className={`px-3 py-1 border rounded-md ${
                    page >= pageCount - 1 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' 
                      : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                  }`}
                >
                  Suivant &raquo;
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default VolontairesPage