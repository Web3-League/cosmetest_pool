import { useState } from 'react';
import { useAuth } from './useAuth';
import paiementService from '../services/paiementService';

// Configuration des statuts de paiement
export const PAIEMENT_STATUS = {
  0: {
    label: "Non payé",
    icon: "❌",
    color: "red",
    style: "bg-red-100 text-red-800 border-red-300",
    bgColor: "bg-red-50"
  },
  1: {
    label: "Payé",
    icon: "✅",
    color: "green",
    style: "bg-green-100 text-green-800 border-green-300",
    bgColor: "bg-green-50"
  },
};

/**
 * Hook personnalisé pour gérer les actions de paiement
 */
export const usePaiementActions = () => {
  const { user, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Fonction pour vérifier si l'utilisateur est admin
  const isUserAdmin = () => {
    if (!isAuthenticated || !user) return false;
    
    // Vérifier le rôle numérique (2 = Administrateur) ou string
    const userRole = user.role;
    return userRole === 2 || userRole === 'admin' || userRole === 'administrateur';
  };

  const updatePaiementStatus = async (idEtude, idVolontaire, nouveauStatut) => {
    if (!isUserAdmin()) {
      throw new Error('Permissions insuffisantes');
    }

    setIsLoading(true);
    try {
      const result = await paiementService.updateStatutPaiement(idEtude, idVolontaire, nouveauStatut);
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const updateMultiplePaiements = async (paiements) => {
    if (!isUserAdmin()) {
      throw new Error('Permissions insuffisantes');
    }

    setIsLoading(true);
    try {
      const result = await paiementService.updateMultiplePaiements(paiements);
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const marquerTousPayes = async (idEtude) => {
    if (!isUserAdmin()) {
      throw new Error('Permissions insuffisantes');
    }

    setIsLoading(true);
    try {
      const result = await paiementService.marquerTousPayesParEtude(idEtude);
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    updatePaiementStatus,
    updateMultiplePaiements,
    marquerTousPayes,
    isLoading,
    canManagePaiements: isUserAdmin()
  };
};

/**
 * Fonction utilitaire pour calculer les statistiques de paiement
 */
export const calculatePaiementStats = (paiements = []) => {
  const stats = {
    total: paiements.length,
    payes: paiements.filter(p => p.paye === 1).length,
    nonPayes: paiements.filter(p => p.paye === 0).length,
    enAttente: paiements.filter(p => p.paye === 2).length,
    annules: paiements.filter(p => p.paye === 3).length,
    montantTotal: paiements.reduce((sum, p) => sum + (p.iv || 0), 0),
    montantPaye: paiements.filter(p => p.paye === 1).reduce((sum, p) => sum + (p.iv || 0), 0)
  };

  stats.montantRestant = stats.montantTotal - stats.montantPaye;
  
  return stats;
};