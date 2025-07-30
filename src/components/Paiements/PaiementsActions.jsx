import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import paiementService from '../../services/paiementService';
import { PAIEMENT_STATUS } from '../../hooks/usePaiements';

/**
 * Composant pour les actions rapides de paiement
 * Peut être utilisé dans les listes de volontaires, détails d'étude, etc.
 */
const PaiementActions = ({ 
  idEtude, 
  idVolontaire, 
  statutActuel, 
  montant = 0,
  onStatusChange,
  size = 'normal', // 'small', 'normal', 'large'
  variant = 'dropdown' // 'dropdown', 'buttons', 'badge'
}) => {
  const { isAdmin, canAccess } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Vérifier les permissions
  if (!isAdmin()) {
    // Mode lecture seule pour les non-admins
    if (variant === 'badge') {
      const status = PAIEMENT_STATUS[statutActuel] || PAIEMENT_STATUS[0];
      return (
        <span className={`
          inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
          ${status.color === 'green' ? 'bg-green-100 text-green-800' : ''}
          ${status.color === 'red' ? 'bg-red-100 text-red-800' : ''}
          ${status.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' : ''}
          ${status.color === 'gray' ? 'bg-gray-100 text-gray-800' : ''}
        `}>
          <span className="mr-1">{status.icon}</span>
          {status.label}
        </span>
      );
    }
    return null;
  }

  const handleStatusChange = async (nouveauStatut) => {
    if (nouveauStatut === statutActuel) return;

    setIsLoading(true);
    setError('');

    try {
      await paiementService.updateStatutPaiement(idEtude, idVolontaire, nouveauStatut);
      
      // Notifier le composant parent du changement
      if (onStatusChange) {
        onStatusChange(nouveauStatut);
      }

    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      setError('Erreur lors de la mise à jour');
    } finally {
      setIsLoading(false);
    }
  };

  // Rendu selon la variante
  if (variant === 'badge') {
    const status = PAIEMENT_STATUS[statutActuel] || PAIEMENT_STATUS[0];
    return (
      <div className="flex items-center space-x-2">
        <span className={`
          inline-flex items-center px-2 py-1 rounded-full text-xs font-medium cursor-pointer
          ${status.color === 'green' ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}
          ${status.color === 'red' ? 'bg-red-100 text-red-800 hover:bg-red-200' : ''}
          ${status.color === 'yellow' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' : ''}
          ${status.color === 'gray' ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' : ''}
        `}>
          <span className="mr-1">{status.icon}</span>
          {status.label}
        </span>
        {montant > 0 && (
          <span className="text-xs text-gray-600 font-medium">
            {montant.toFixed(0)} €
          </span>
        )}
      </div>
    );
  }

  if (variant === 'buttons') {
    return (
      <div className="flex flex-wrap gap-1">
        {Object.entries(PAIEMENT_STATUS).map(([value, config]) => {
          const isActive = parseInt(value) === statutActuel;
          const buttonSize = size === 'small' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm';
          
          return (
            <button
              key={value}
              onClick={() => handleStatusChange(parseInt(value))}
              disabled={isLoading || isActive}
              className={`
                ${buttonSize} rounded-full font-medium transition-all duration-200
                ${isActive 
                  ? `bg-${config.color}-100 text-${config.color}-800 border-${config.color}-300 border-2`
                  : `bg-gray-100 text-gray-700 hover:bg-${config.color}-50 border border-gray-300`
                }
                ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <span className="mr-1">{config.icon}</span>
              {config.label}
            </button>
          );
        })}
        {error && (
          <span className="text-xs text-red-600">{error}</span>
        )}
      </div>
    );
  }

  // Variante dropdown (par défaut)
  return (
    <div className="relative">
      <select
        value={statutActuel}
        onChange={(e) => handleStatusChange(parseInt(e.target.value))}
        disabled={isLoading}
        className={`
          ${size === 'small' ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1.5'}
          border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {Object.entries(PAIEMENT_STATUS).map(([value, config]) => (
          <option key={value} value={value}>
            {config.icon} {config.label}
          </option>
        ))}
      </select>
      
      {/* Indicateur de chargement */}
      {isLoading && (
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {/* Affichage du montant */}
      {montant > 0 && (
        <div className="mt-1 text-xs text-gray-600 text-center">
          {montant.toFixed(0)} €
        </div>
      )}
      
      {/* Message d'erreur */}
      {error && (
        <div className="mt-1 text-xs text-red-600 text-center">
          {error}
        </div>
      )}
    </div>
  );
};

export default PaiementActions;