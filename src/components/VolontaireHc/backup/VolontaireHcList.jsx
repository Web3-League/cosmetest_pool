import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../../../services/api';

// Import des icônes
import clipboardSvg from '../../assets/icons/clipboard.svg';
import filterSvg from '../../assets/icons/filter.svg';
import searchSvg from '../../assets/icons/search.svg';
import editSvg from '../../assets/icons/edit.svg';
import trashSvg from '../../assets/icons/trash.svg';
import userSvg from '../../assets/icons/user.svg';
import shoppingBagSvg from '../../assets/icons/shopping-bag.svg';
import leafSvg from '../../assets/icons/leaf.svg';
import scissorsSvg from '../../assets/icons/scissors.svg';
import brushSvg from '../../assets/icons/brush.svg';

// Composants d'icônes
const IconClipboard = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={clipboardSvg} width={width} height={height} className={className} alt="Clipboard" {...props} />
);

const IconFilter = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={filterSvg} width={width} height={height} className={className} alt="Filter" {...props} />
);

const IconSearch = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={searchSvg} width={width} height={height} className={className} alt="Search" {...props} />
);

const IconEdit = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={editSvg} width={width} height={height} className={className} alt="Edit" {...props} />
);

const IconTrash = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={trashSvg} width={width} height={height} className={className} alt="Trash" {...props} />
);

const IconUser = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={userSvg} width={width} height={height} className={className} alt="User" {...props} />
);

const IconShoppingBag = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={shoppingBagSvg} width={width} height={height} className={className} alt="Shopping Bag" {...props} />
);

const IconLeaf = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={leafSvg} width={width} height={height} className={className} alt="Leaf" {...props} />
);

const IconScissors = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={scissorsSvg} width={width} height={height} className={className} alt="Scissors" {...props} />
);

const IconBrush = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={brushSvg} width={width} height={height} className={className} alt="Brush" {...props} />
);

// Composant de filtres pour volontaires HC
const FilterVolontaireHc = ({
  lieuAchatFilter, setLieuAchatFilter,
  produitsBioFilter, setProduitsBioFilter,
  methodeEpilationFilter, setMethodeEpilationFilter,
  onApplyFilters
}) => {
  const lieuAchatOptions = ['Tous', 'Pharmacie', 'Parapharmacie', 'Grande surface', 'Magasin bio', 'Internet', 'Autre'];
  const produitsBioOptions = ['Tous', 'Oui', 'Non', 'Parfois'];
  const epilationOptions = ['Tous', 'Rasoir', 'Épilateur électrique', 'Cire chaude', 'Cire froide', 'Crème dépilatoire', 'Laser', 'Autre'];

  const [localLieuAchat, setLocalLieuAchat] = useState(lieuAchatFilter);
  const [localProduitsBio, setLocalProduitsBio] = useState(produitsBioFilter);
  const [localMethodeEpilation, setLocalMethodeEpilation] = useState(methodeEpilationFilter);

  const handleApplyFilters = () => {
    setLieuAchatFilter(localLieuAchat);
    setProduitsBioFilter(localProduitsBio);
    setMethodeEpilationFilter(localMethodeEpilation);
    onApplyFilters();
  };

  const handleResetFilters = () => {
    setLocalLieuAchat('Tous');
    setLocalProduitsBio('Tous');
    setLocalMethodeEpilation('Tous');
    setLieuAchatFilter('Tous');
    setProduitsBioFilter('Tous');
    setMethodeEpilationFilter('Tous');
    onApplyFilters();
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <h3 className="font-medium text-gray-700 mb-4 flex items-center">
        <IconFilter width={18} height={18} className="mr-2" />
        Filtres avancés
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Lieu d'achat</label>
          <select
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={localLieuAchat}
            onChange={(e) => setLocalLieuAchat(e.target.value)}
          >
            {lieuAchatOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Utilisation produits bio</label>
          <select
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={localProduitsBio}
            onChange={(e) => setLocalProduitsBio(e.target.value)}
          >
            {produitsBioOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Méthode d'épilation</label>
          <select
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={localMethodeEpilation}
            onChange={(e) => setLocalMethodeEpilation(e.target.value)}
          >
            {epilationOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 flex justify-end space-x-3">
        <button
          onClick={handleResetFilters}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
        >
          Réinitialiser
        </button>
        <button
          onClick={handleApplyFilters}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Appliquer
        </button>
      </div>
    </div>
  );
};

// Composant principal VolontaireHcList
const VolontaireHcList = () => {
  const location = useLocation();
  
  // États principaux
  const [volontairesHc, setVolontairesHc] = useState([]); // Toutes les données à afficher
  const [volontairesInfo, setVolontairesInfo] = useState({}); // Informations sur les volontaires
  
  // États UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // États de filtrage
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [lieuAchatFilter, setLieuAchatFilter] = useState('Tous');
  const [produitsBioFilter, setProduitsBioFilter] = useState('Tous');
  const [methodeEpilationFilter, setMethodeEpilationFilter] = useState('Tous');

  // Charger les informations de tous les volontaires
  const fetchAllVolontairesInfo = useCallback(async () => {
    try {
      console.log("Chargement de tous les volontaires...");
      const response = await api.get('/volontaires');
      if (response.data) {
        console.log("Reçu", response.data.length, "volontaires");
        // Transformer le tableau en objet indexé par ID
        const volontairesData = {};
        response.data.forEach(volontaire => {
          volontairesData[volontaire.id] = volontaire;
        });
        setVolontairesInfo(volontairesData);
        return volontairesData;
      }
      return {};
    } catch (error) {
      console.error('Erreur lors du chargement de tous les volontaires:', error);
      return {};
    }
  }, []);

  // Charger les informations pour un ensemble spécifique de volontaires
  const fetchVolontairesInfo = useCallback(async (volontaireIds) => {
    try {
      const volontairesData = {};

      // Récupérer les données des volontaires en parallèle pour plus d'efficacité
      await Promise.all(volontaireIds.map(async (id) => {
        if (id) {
          try {
            const response = await api.get(`/volontaires/${id}`);
            if (response.data) {
              volontairesData[id] = response.data;
            }
          } catch (err) {
            console.error(`Erreur lors de la récupération du volontaire ${id}:`, err);
          }
        }
      }));

      setVolontairesInfo(prevState => ({
        ...prevState,
        ...volontairesData
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des infos volontaires:', error);
    }
  }, []);

  // IMPORTANT: Cette fonction doit être définie AVANT d'être utilisée dans useEffect ou par d'autres fonctions
  const fetchAllVolontairesHc = useCallback(async () => {
    setLoading(true);
    
    try {
      console.log("Chargement de tous les volontaires HC...");
      const response = await api.get('/volontaires-hc');
      const allData = response.data.filter(item => item !== null);
      console.log("Reçu", allData.length, "volontaires HC");
      
      setVolontairesHc(allData);
      
      // Charger les infos des volontaires pour tous les résultats
      const volontaireIds = allData.map(item => item.idVol);
      await fetchVolontairesInfo(volontaireIds);
      
      setError(null);
    } catch (error) {
      console.error("Erreur lors du chargement de tous les volontaires HC:", error);
      setError("Impossible de charger les habitudes cosmétiques.");
    } finally {
      setLoading(false);
    }
  }, [fetchVolontairesInfo]);

  // Fonction pour rechercher les IDs des volontaires par nom/prénom
  const findVolontaireIdsByName = useCallback((searchName) => {
    if (!searchName || searchName.trim() === '') return [];
    
    console.log("Recherche de:", searchName, "dans", Object.keys(volontairesInfo).length, "volontaires");
    
    const searchTermLower = searchName.toLowerCase().trim();
    
    // Rechercher les volontaires qui correspondent au critère
    const matchingIds = Object.entries(volontairesInfo)
      .filter(([ volontaire]) => {
        if (!volontaire) return false;
        
        // Normaliser les noms pour la recherche
        const nom = (volontaire.nom || '').toLowerCase();
        const prenom = (volontaire.prenom || '').toLowerCase();
        const fullName = `${nom} ${prenom}`;
        const reverseName = `${prenom} ${nom}`;
        
        // Vérifier si le terme de recherche est présent dans l'un des champs
        return nom.includes(searchTermLower) || 
               prenom.includes(searchTermLower) || 
               fullName.includes(searchTermLower) ||
               reverseName.includes(searchTermLower);
      })
      .map(([id]) => id);
    
    console.log("IDs trouvés:", matchingIds);
    return matchingIds;
  }, [volontairesInfo]);

  // Fonction pour le chargement avec filtres
  const fetchVolontairesHcWithFilters = useCallback(async () => {
    setLoading(true);
    setSearchLoading(true);
    
    try {
      console.log("Chargement avec filtres...");
      let url = '/volontaires-hc';
      const params = new URLSearchParams();
      
      if (lieuAchatFilter !== 'Tous') {
        url = '/volontaires-hc/by-lieu-achat';
        params.append('lieuAchat', lieuAchatFilter);
        params.append('valeur', 'Oui');
        console.log("Filtre par lieu d'achat:", lieuAchatFilter);
      } else if (produitsBioFilter !== 'Tous') {
        url = '/volontaires-hc/by-produit';
        params.append('produit', 'produitsBio');
        params.append('valeur', produitsBioFilter);
        console.log("Filtre par produits bio:", produitsBioFilter);
      } else if (methodeEpilationFilter !== 'Tous') {
        url = '/volontaires-hc/by-produit';
        params.append('produit', methodeEpilationFilter.toLowerCase().replace(' ', ''));
        params.append('valeur', 'Oui');
        console.log("Filtre par méthode d'épilation:", methodeEpilationFilter);
      }
      
      const response = await api.get(url, { params });
      console.log("Réponse API avec filtres:", response.data.length, "résultats");
      
      const filteredResults = response.data.filter(item => item !== null);
      setVolontairesHc(filteredResults);
      
      // Charger les infos des volontaires
      const volontaireIds = filteredResults.map(item => item.idVol);
      await fetchVolontairesInfo(volontaireIds);
      
      setError(null);
    } catch (error) {
      console.error("Erreur lors du chargement avec filtres:", error);
      setError("Erreur lors de l'application des filtres.");
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  }, [lieuAchatFilter, produitsBioFilter, methodeEpilationFilter, fetchVolontairesInfo]);
  
  // Fonction pour la recherche par nom/prénom
  const handleSearch = useCallback(async () => {
    console.log("Recherche lancée avec:", searchQuery);
    
    if (!searchQuery.trim()) {
      // Si la recherche est vide, charger tous les volontaires HC
      fetchAllVolontairesHc();
      return;
    }
    
    setSearchLoading(true);
    setLoading(true);
    
    try {
      // 1. S'assurer d'abord que nous avons chargé TOUS les volontaires
      if (Object.keys(volontairesInfo).length === 0) {
        console.log("Chargement de tous les volontaires d'abord");
        await fetchAllVolontairesInfo();
      }
      
      // 2. Rechercher les IDs correspondant au terme de recherche
      const matchingIds = findVolontaireIdsByName(searchQuery);
      console.log("IDs correspondants trouvés:", matchingIds);
      
      if (!matchingIds || matchingIds.length === 0) {
        console.log("Aucun ID correspondant trouvé");
        setVolontairesHc([]);
        setError(null);
        return;
      }
      
      // 3. Utiliser ces IDs pour obtenir les habitudes cosmétiques
      console.log("Appel API avec IDs:", matchingIds);
      const response = await api.get('/volontaires-hc/by-volontaire', {
        params: { ids: matchingIds.join(',') }
      });
      
      console.log("Réponse API:", response.data);
      
      // 4. Traiter les résultats
      const filteredResults = response.data.filter(item => item !== null);
      setVolontairesHc(filteredResults);
      
      setError(null);
    } catch (error) {
      console.error("Erreur lors de la recherche:", error);
      setError("Erreur lors de la recherche. Veuillez réessayer.");
      setVolontairesHc([]);
    } finally {
      setSearchLoading(false);
      setLoading(false);
    }
  }, [searchQuery, volontairesInfo, findVolontaireIdsByName, fetchAllVolontairesInfo, fetchAllVolontairesHc]);

  // Gestion de la suppression d'un volontaire HC
  const handleDeleteVolontaireHc = async (idVol) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ces habitudes cosmétiques ? Cette action est irréversible.')) {
      return;
    }

    try {
      await api.delete(`/api/volontaires-hc/volontaire/${idVol}`);

      // Rafraîchir la liste
      await fetchAllVolontairesHc();

      // Afficher une notification de succès
      alert('Habitudes cosmétiques supprimées avec succès');
    } catch (err) {
      console.error('Erreur lors de la suppression des habitudes cosmétiques:', err);
      alert('Erreur lors de la suppression des habitudes cosmétiques');
    }
  };

  // Effet debounce pour la recherche
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchQuery !== debouncedSearchQuery) {
        setDebouncedSearchQuery(searchQuery);
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery, debouncedSearchQuery]);

  // Effet pour le debouncedSearchQuery (recherche automatique)
  useEffect(() => {
    if (!debouncedSearchQuery || isInitialLoad) return;
    
    handleSearch();
  }, [debouncedSearchQuery, handleSearch, isInitialLoad]);

  // Effet initial - ne s'exécute qu'une fois au montage
  useEffect(() => {
    const initialLoad = async () => {
      try {
        await fetchAllVolontairesInfo();
        await fetchAllVolontairesHc();
      } finally {
        setIsInitialLoad(false);
      }
    };

    if (isInitialLoad) {
      initialLoad();
    }
  }, [fetchAllVolontairesInfo, fetchAllVolontairesHc, isInitialLoad]);

  // Composant de formulaire de recherche
  const renderSearchForm = () => {
    return (
      <form onSubmit={(e) => {
        e.preventDefault();
        console.log("Formulaire de recherche soumis");
        handleSearch();
      }} className="flex-grow">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <IconSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Rechercher par nom, prénom ou email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              // Si le champ est vidé, mettre à jour immédiatement
              if (e.target.value.trim() === '') {
                // Ne pas déclencher recherche ici, laisser l'effet le faire
                setDebouncedSearchQuery('');
              }
            }}
            className="block w-full pl-10 pr-16 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          {searchLoading && (
            <div className="absolute inset-y-0 right-16 flex items-center">
              <div className="h-5 w-5 border-t-2 border-blue-500 rounded-full animate-spin"></div>
            </div>
          )}
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setDebouncedSearchQuery('');
                fetchAllVolontairesHc();
              }}
              className="absolute inset-y-0 right-10 flex items-center pr-3 text-gray-400 hover:text-gray-500"
              aria-label="Effacer la recherche"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          <button
            type="submit"
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-600 hover:text-blue-800"
            aria-label="Rechercher"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Afficher les IDs correspondant à la recherche */}
        {searchQuery && findVolontaireIdsByName(searchQuery).length > 0 && !searchLoading && (
          <div className="mt-1 text-xs text-gray-500">
            IDs trouvés: {findVolontaireIdsByName(searchQuery).join(', ')}
          </div>
        )}
      </form>
    );
  };

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Volontaires</h1>

          {/* Switch pour basculer entre Volontaires et Volontaires HC */}
          <div className="mt-2 inline-flex bg-gray-100 rounded-lg p-1">
            <Link
              to="/volontaires"
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                location.pathname === '/volontaires'
                  ? 'bg-white shadow-sm text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Volontaires
            </Link>
            <Link
              to="/volontaires-hc"
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                location.pathname === '/volontaires-hc'
                  ? 'bg-white shadow-sm text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Habitudes Cosmétiques
            </Link>
          </div>

          <h2 className="text-sm text-gray-600 mt-1">Informations sur les habitudes cosmétiques des volontaires</h2>
        </div>

        <Link
          to="/volontaires-hc/nouveau"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Ajouter des habitudes cosmétiques
        </Link>
      </div>

      {/* Formulaire de recherche et bouton de filtre */}
      <div className="flex items-center space-x-4">
        {renderSearchForm()}

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
        >
          <IconFilter className="h-5 w-5 text-gray-400 mr-2" />
          <span>Filtres</span>
        </button>
      </div>

      {/* Filtres avancés */}
      {showFilters && (
        <FilterVolontaireHc
          lieuAchatFilter={lieuAchatFilter}
          setLieuAchatFilter={setLieuAchatFilter}
          produitsBioFilter={produitsBioFilter}
          setProduitsBioFilter={setProduitsBioFilter}
          methodeEpilationFilter={methodeEpilationFilter}
          setMethodeEpilationFilter={setMethodeEpilationFilter}
          onApplyFilters={fetchVolontairesHcWithFilters}
        />
      )}

      {/* État de chargement */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 p-4 rounded-md text-red-700">
          {error}
        </div>
      ) : volontairesHc.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <IconClipboard className="h-12 w-12 mx-auto text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Aucune habitude cosmétique trouvée</h3>

          {searchQuery ? (
            <>
              <p className="mt-1 text-gray-500">
                Aucun résultat pour <span className="font-medium">"{searchQuery}"</span>
              </p>
              <div className="mt-4">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setDebouncedSearchQuery('');
                    fetchAllVolontairesHc();
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Effacer la recherche
                </button>
              </div>
            </>
          ) : (
            <p className="mt-1 text-gray-500">
              Aucune habitude cosmétique ne correspond à vos critères de recherche.
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Indicateur de résultats */}
          <div className="flex justify-between items-center mb-4 px-4 py-2 bg-gray-50 border border-gray-200 rounded-md">
            <div className="text-sm text-gray-700">
              {searchQuery ? (
                <span>
                  <span className="font-medium">{volontairesHc.length}</span> résultat(s) pour "<span className="font-medium">{searchQuery}</span>"
                  {lieuAchatFilter !== 'Tous' || produitsBioFilter !== 'Tous' || methodeEpilationFilter !== 'Tous' ? ' avec filtres appliqués' : ''}
                </span>
              ) : (
                <span>
                  Affichage de <span className="font-medium">{volontairesHc.length}</span> habitudes cosmétiques
                  {lieuAchatFilter !== 'Tous' || produitsBioFilter !== 'Tous' || methodeEpilationFilter !== 'Tous' ? ' (filtres appliqués)' : ''}
                </span>
              )}
            </div>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setDebouncedSearchQuery('');
                  fetchAllVolontairesHc();
                }}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Effacer la recherche
              </button>
            )}
          </div>

          {/* Tableau de résultats */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Volontaire
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Habitudes d'achat
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Soins
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Habitudes d'épilation
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {volontairesHc.map((volontaireHc) => (
                    <tr key={volontaireHc.idVol} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                            <IconUser className="h-6 w-6" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {volontairesInfo[volontaireHc.idVol]
                                ? `${volontairesInfo[volontaireHc.idVol].nom} ${volontairesInfo[volontaireHc.idVol].prenom}`
                                : `Volontaire #${volontaireHc.idVol}`}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {volontaireHc.idVol}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 mr-2">
                            <IconShoppingBag className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-sm text-gray-900">
                              {(volontaireHc.achatPharmacieParapharmacie === 'Oui' ? 'Pharmacie/Parapharmacie' : '') ||
                                (volontaireHc.achatGrandesSurfaces === 'Oui' ? 'Grandes surfaces' : '') ||
                                (volontaireHc.achatInstitutParfumerie === 'Oui' ? 'Institut/Parfumerie' : '') ||
                                (volontaireHc.achatInternet === 'Oui' ? 'Internet' : '') ||
                                'Non spécifié'}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <IconLeaf className="h-4 w-4 mr-1 text-green-500" />
                              Produits bio: {volontaireHc.produitsBio || 'Non spécifié'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center mb-1">
                            <IconBrush className="h-4 w-4 mr-1 text-blue-500" />
                            Maquillage: {(volontaireHc.fondDeTeint === 'Oui' || volontaireHc.mascara === 'Oui') ? 'Oui' : 'Non spécifié'}
                          </div>
                          <div className="text-sm text-gray-500">
                            Visage: {(volontaireHc.soinHydratantVisage === 'Oui') ? 'Hydratant' :
                              (volontaireHc.soinAntiAgeVisage === 'Oui') ? 'Anti-âge' : 'Non spécifié'}
                          </div>
                          <div className="text-sm text-gray-500">
                            Corps: {(volontaireHc.soinHydratantCorps === 'Oui') ? 'Hydratant' :
                              (volontaireHc.soinAntiCellulite === 'Oui') ? 'Anti-cellulite' : 'Non spécifié'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mr-2">
                            <IconScissors className="h-4 w-4" />
                          </div>
                          <div className="text-sm text-gray-900">
                            {(volontaireHc.rasoir === 'Oui') ? 'Rasoir' :
                              (volontaireHc.rasoirElectrique === 'Oui') ? 'Rasoir électrique' :
                                (volontaireHc.rasoirMecanique === 'Oui') ? 'Rasoir mécanique' :
                                  (volontaireHc.epilateurElectrique === 'Oui') ? 'Épilateur électrique' :
                                    (volontaireHc.cire === 'Oui') ? 'Cire' :
                                      (volontaireHc.cremeDepilatoire === 'Oui') ? 'Crème dépilatoire' :
                                        (volontaireHc.institut === 'Oui') ? 'Institut' :
                                          (volontaireHc.epilationDefinitive === 'Oui') ? 'Épilation définitive' : 'Non spécifié'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-3">
                          <Link
                            to={`/volontaires-hc/${volontaireHc.idVol}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Voir
                          </Link>
                          <Link
                            to={`/volontaires-hc/${volontaireHc.idVol}/edit`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <IconEdit className="h-5 w-5" />
                          </Link>
                          <button
                            onClick={() => handleDeleteVolontaireHc(volontaireHc.idVol)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <IconTrash className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default VolontaireHcList;