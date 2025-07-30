import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDate, formatTime } from '../../utils/dateUtils';

const VolontaireDetailRdv = ({ rdvs = [] }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fonction pour formater le statut du RDV
  const formatStatut = (statut) => {
    const statutMap = {
      'CONFIRME': { label: 'Confirmé', class: 'bg-green-100 text-green-800' },
      'EN_ATTENTE': { label: 'En attente', class: 'bg-yellow-100 text-yellow-800' },
      'ANNULE': { label: 'Annulé', class: 'bg-red-100 text-red-800' },
      'COMPLETE': { label: 'Terminé', class: 'bg-blue-100 text-blue-800' },
      'PLANIFIE': { label: 'Planifié', class: 'bg-indigo-100 text-indigo-800' }
    };
    
    return statutMap[statut] || { label: statut, class: 'bg-gray-100 text-gray-800' };
  };

  // Fonction pour déterminer si un RDV est à venir
  const isUpcoming = (dateRdv) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const rdvDate = new Date(dateRdv);
    rdvDate.setHours(0, 0, 0, 0);
    return rdvDate >= today;
  };

  // Fonction pour déterminer si un RDV est aujourd'hui
  const isToday = (dateRdv) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const rdvDate = new Date(dateRdv);
    rdvDate.setHours(0, 0, 0, 0);
    return rdvDate.getTime() === today.getTime();
  };

  // Filtrer et trier les RDVs à venir (plus récents en premier)
  const upcomingRdvs = rdvs
    .filter(rdv => isUpcoming(rdv.date))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Rendez-vous à venir et du jour */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Rendez-vous à venir ({upcomingRdvs.length})
        </h3>
        
        {upcomingRdvs.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <p className="text-gray-500">Aucun rendez-vous à venir</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingRdvs.map((rdv) => (
              <div 
                key={`${rdv.idEtude}-${rdv.idRdv}`}
                className={`border rounded-lg p-4 hover:shadow-sm transition-shadow ${
                  isToday(rdv.date) ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Link 
                        to={`/etudes/${rdv.idEtude}`}
                        className="font-medium text-primary-600 hover:text-primary-700"
                      >
                        {rdv.etudeRef || `Étude #${rdv.idEtude}`}
                      </Link>
                      {isToday(rdv.date) && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Aujourd'hui
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-500">Date:</span>
                        <p className="text-gray-900">{formatDate(rdv.date)}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Heure:</span>
                        <p className="text-gray-900">{formatTime(rdv.heure)}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Durée:</span>
                        <p className="text-gray-900">{rdv.duree ? `${rdv.duree} min` : '-'}</p>
                      </div>
                    </div>
                    
                    {rdv.commentaire && (
                      <div className="mt-2">
                        <span className="font-medium text-gray-500 text-sm">Commentaire:</span>
                        <p className="text-gray-700 text-sm mt-1">{rdv.commentaire}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      formatStatut(rdv.etat).class
                    }`}>
                      {formatStatut(rdv.etat).label}
                    </span>
                    
                    <Link
                      to={`/rdvs/${rdv.idEtude}/${rdv.idRdv}`}
                      className="text-xs text-primary-600 hover:text-primary-700"
                    >
                      Voir détails
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VolontaireDetailRdv;