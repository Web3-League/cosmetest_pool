// src/hooks/usePagination.js
import { useState, useCallback } from 'react'

/**
 * Hook personnalisé pour gérer la pagination
 * @param {number} initialPage - Page initiale (par défaut 0)
 * @param {number} initialPageSize - Taille de page initiale (par défaut 10)
 * @param {number} initialTotal - Nombre total d'éléments initial (par défaut 0)
 * @returns {Object} - Fonctions et états pour gérer la pagination
 */
export const usePagination = (initialPage = 0, initialPageSize = 10, initialTotal = 0) => {
  const [page, setPage] = useState(initialPage)
  const [size, setSize] = useState(initialPageSize)
  const [total, setTotal] = useState(initialTotal)
  
  // Calculer le nombre total de pages
  const pageCount = Math.ceil(total / size)
  
  // Mettre à jour le nombre total d'éléments
  const updateTotal = useCallback((newTotal) => {
    // Ne réinitialisez pas la page à 0 systématiquement
    // Réinitialisez seulement si le total a diminué et que la page actuelle n'est plus valide
    setTotal((prevTotal) => {
      const newValue = newTotal;
      // Si le nouveau total est plus petit que l'ancien et que la page actuelle
      // n'est plus valide avec le nouveau total, ajuster la page
      if (newValue < prevTotal) {
        const newPageCount = Math.ceil(newValue / size);
        if (page >= newPageCount && newPageCount > 0) {
          setPage(newPageCount - 1);
        }
      }
      return newValue;
    });
  }, [page, size]);
  
  // Aller à une page spécifique
  const goToPage = useCallback((pageNumber) => {
    // S'assurer que pageNumber est dans la plage valide
    if (pageNumber >= 0 && pageNumber < pageCount) {
      setPage(pageNumber)
    }
  }, [pageCount])
  
  // Aller à la page suivante
  const nextPage = useCallback(() => {
    setPage(prev => Math.min(prev + 1, pageCount - 1));
  }, [pageCount]);
  
  // Aller à la page précédente
  const prevPage = useCallback(() => {
    setPage(prev => Math.max(prev - 1, 0));
  }, []);
  
  // Aller à la première page
  const firstPage = useCallback(() => {
    setPage(0)
  }, [])
  
  // Aller à la dernière page
  const lastPage = useCallback(() => {
    setPage(pageCount - 1)
  }, [pageCount])
  
  // Changer la taille de la page
  const changePageSize = useCallback((newSize) => {
    setSize(newSize)
    // Réinitialiser à la première page pour éviter les problèmes de plage
    setPage(0)
  }, [])
  
  return {
    page,
    size,
    total,
    pageCount,
    updateTotal,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    changePageSize
  }
}

export default usePagination