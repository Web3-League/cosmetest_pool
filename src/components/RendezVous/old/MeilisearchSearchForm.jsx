import { useState, useEffect, useRef } from 'react';
import debounce from 'lodash/debounce';
import searchService from '../../services/searchService';

/**
 * Formulaire de recherche optimisé utilisant Meilisearch
 * Version sans Redux utilisant le state local et les contexts
 */
const MeilisearchSearchForm = ({ onSearch }) => {
  const [searchField, setSearchField] = useState('etude-ref');
  const [searchQuery, setSearchQuery] = useState('');
  const [localQuery, setLocalQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const suggestionRef = useRef(null);

  // Déclenche la recherche avec un debounce pour limiter les requêtes
  const debouncedSearch = useRef(
    debounce((query) => {
      setSearchQuery(query);
      if (onSearch) {
        onSearch({ searchField, query });
      }
    }, 300)
  ).current;

  // Récupération des suggestions optimisée
  const debouncedSuggestions = useRef(
    debounce(async (query) => {
      if (searchField === 'etude-ref' && query.length >= 2) {
        setIsLoadingSuggestions(true);
        try {
          const results = await searchService.getEtudeSuggestions(query);
          if (Array.isArray(results)) {
            setSuggestions(results.filter(r => r.ref !== "")); // Filtrer les entrées vides
          }
        } catch (error) {
          console.error('Erreur lors de la récupération des suggestions:', error);
          setSuggestions([]);
        } finally {
          setIsLoadingSuggestions(false);
        }
      }
    }, 300)
  ).current;

  // Mettre à jour la recherche lors de la modification du champ de texte
  useEffect(() => {
    if (localQuery.trim().length >= 2) {
      debouncedSearch(localQuery);
      if (searchField === 'etude-ref') {
        debouncedSuggestions(localQuery);
      }
    }
  }, [localQuery, searchField, debouncedSearch, debouncedSuggestions]);

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
      debouncedSuggestions.cancel();
    };
  }, [debouncedSearch, debouncedSuggestions]);

  // Fermer les suggestions lorsqu'on clique en dehors du champ
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Gestion du changement de type de recherche
  const handleSearchTypeChange = (e) => {
    setSearchField(e.target.value);
    setLocalQuery('');
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Gestion de la modification de la requête utilisateur
  const handleQueryChange = (e) => {
    setLocalQuery(e.target.value);
    if (searchField === 'etude-ref' && e.target.value.length >= 2) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  // Sélection d'une suggestion Meilisearch
  const handleSelectSuggestion = (suggestion) => {
    setLocalQuery(suggestion.ref);
    setSearchQuery(suggestion.ref);
    setShowSuggestions(false);
    
    if (onSearch) {
      onSearch({ searchField, query: suggestion.ref });
    }
  };

  // Gestion de la soumission du formulaire
  const handleSubmit = (e) => {
    e.preventDefault();
    setSearchQuery(localQuery);
    setShowSuggestions(false);

    if (onSearch) {
      onSearch({ searchField, query: localQuery });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 shadow rounded-md mb-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-3">
          <label htmlFor="search-type" className="block text-sm font-medium text-gray-700 mb-1">
            Type de recherche
          </label>
          <select
            id="search-type"
            value={searchField}
            onChange={handleSearchTypeChange}
            className="form-select w-full px-4 py-2 border rounded-md"
          >
            <option value="etude-ref">Référence d'étude</option>
            <option value="volontaire">Volontaire</option>
            <option value="date">Date</option>
            <option value="etat">Statut</option>
            <option value="keyword">Commentaires</option>
          </select>
        </div>

        <div className="md:col-span-7">
          <label htmlFor="search-query" className="block text-sm font-medium text-gray-700 mb-1">
            Recherche
          </label>
          <div className="relative" ref={suggestionRef}>
            <input
              type="text"
              value={localQuery}
              onChange={handleQueryChange}
              placeholder="Référence d'étude (ex: FORMATION DTM)"
              className="form-input w-full px-4 py-2 border rounded-md"
              autoComplete="off"
            />

            {isLoadingSuggestions && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-5 h-5 border-t-2 border-primary-500 rounded-full animate-spin"></div>
              </div>
            )}

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto">
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleSelectSuggestion(suggestion)}
                  >
                    <div className="font-medium text-blue-600">{suggestion.ref}</div>
                    {suggestion.titre && (
                      <div className="text-sm text-gray-500 truncate">{suggestion.titre}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-2 flex items-end">
          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Rechercher
          </button>
        </div>
      </div>
    </form>
  );
};

export default MeilisearchSearchForm;
