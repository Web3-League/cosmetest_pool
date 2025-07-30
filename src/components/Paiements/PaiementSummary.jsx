import { calculatePaiementStats } from '../../hooks/usePaiements';

/**
 * Composant pour afficher un résumé rapide des paiements
 */
const PaiementSummary = ({ paiements = [], showDetails = false }) => {
  const stats = calculatePaiementStats(paiements);

  if (!showDetails) {
    return (
      <div className="flex items-center space-x-4 text-sm">
        <span className="text-green-600 font-medium">
          {stats.payes} payés
        </span>
        <span className="text-red-600 font-medium">
          {stats.nonPayes} non payés
        </span>
        {stats.enAttente > 0 && (
          <span className="text-yellow-600 font-medium">
            {stats.enAttente} en attente
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="text-center p-2 bg-green-50 rounded">
        <div className="text-lg font-bold text-green-800">{stats.payes}</div>
        <div className="text-xs text-green-600">Payés</div>
        <div className="text-xs text-green-700">{stats.montantPaye.toFixed(0)}€</div>
      </div>
      <div className="text-center p-2 bg-red-50 rounded">
        <div className="text-lg font-bold text-red-800">{stats.nonPayes}</div>
        <div className="text-xs text-red-600">Non payés</div>
        <div className="text-xs text-red-700">{stats.montantRestant.toFixed(0)}€</div>
      </div>
      <div className="text-center p-2 bg-yellow-50 rounded">
        <div className="text-lg font-bold text-yellow-800">{stats.enAttente}</div>
        <div className="text-xs text-yellow-600">En attente</div>
      </div>
      <div className="text-center p-2 bg-gray-50 rounded">
        <div className="text-lg font-bold text-gray-800">{stats.total}</div>
        <div className="text-xs text-gray-600">Total</div>
        <div className="text-xs text-gray-700">{stats.montantTotal.toFixed(0)}€</div>
      </div>
    </div>
  );
};

export default PaiementSummary;