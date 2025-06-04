// Modification du GroupedByStudyView.jsx pour améliorer la pagination lors du groupement par étude

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDate } from '../../utils/dateUtils';
import rdvService from '../../services/rdvService';

const GroupedByStudyView = ({ rdvs, pagination }) => {
  const [updateLoading, setUpdateLoading] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [groupedData, setGroupedData] = useState({});
  const [displayedGroups, setDisplayedGroups] = useState([]);
  
  useEffect(() => {
    const grouped = {};
  
    if (rdvs && Array.isArray(rdvs)) {
      rdvs.forEach(rdv => {
        const idEtude = rdv.id?.idEtude || rdv.idEtude || 0;
        const etudeKey = `etude-${idEtude}`;
  
        if (!grouped[etudeKey]) {
          grouped[etudeKey] = {
            id: idEtude,
            title: rdv.etude ? rdv.etude.ref : `Étude ID: ${idEtude}`,
            rdvs: []
          }
        }
  
        grouped[etudeKey].rdvs.push(rdv);
      });
    
      // Mettre à jour l'état local avec les données groupées
      setGroupedData(grouped);
      
      // Extraire les clés des groupes pour l'affichage
      const groupKeys = Object.keys(grouped);
      setDisplayedGroups(groupKeys);
      
      // Si c'est la première page, développer automatiquement le premier groupe
      if (pagination.page === 0 && groupKeys.length > 0) {
        setExpandedGroups({ [groupKeys[0]]: true });
      }
    } else {
      // Assurez-vous de gérer le cas où les données sont vides
      setGroupedData({});
      setDisplayedGroups([]);
    }
  }, [rdvs, pagination.page]);
  
  const toggleGroup = (groupKey) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };
  
  const handleUpdateStatus = async (idEtude, idRdv, newStatus) => {
    try {
      setUpdateLoading(`${idEtude}-${idRdv}`);
      await rdvService.updateStatus(idEtude, idRdv, newStatus);
      
      // Au lieu de recharger toute la page, récupérer les données mises à jour
      const updatedRdv = await rdvService.getById(idEtude, idRdv);
      
      // Mettre à jour les données localement
      setGroupedData(prevGrouped => {
        const etudeKey = `etude-${idEtude}`;
        if (!prevGrouped[etudeKey]) return prevGrouped;
        
        const updatedRdvs = prevGrouped[etudeKey].rdvs.map(rdv => {
          if ((rdv.id?.idRdv || rdv.idRdv) === idRdv) {
            return { ...rdv, etat: newStatus };
          }
          return rdv;
        });
        
        return {
          ...prevGrouped,
          [etudeKey]: {
            ...prevGrouped[etudeKey],
            rdvs: updatedRdvs
          }
        };
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      alert('Une erreur est survenue lors de la mise à jour du statut');
    } finally {
      setUpdateLoading(null);
    }
  };
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRME':
        return <span className="badge badge-green">Confirmé</span>;
      case 'EN_ATTENTE':
        return <span className="badge badge-yellow">En attente</span>;
      case 'ANNULE':
        return <span className="badge badge-red">Annulé</span>;
      case 'COMPLETE':
        return <span className="badge badge-blue">Complété</span>;
      default:
        return <span className="badge badge-gray">{status || 'Non défini'}</span>;
    }
  };
  
  // Helper function to safely get the ID from a rdv object
  const getRdvIdEtude = (rdv) => {
    if (rdv.id && rdv.id.idEtude) {
      return rdv.id.idEtude;
    }
    return rdv.idEtude || 0;
  };
  
  const getRdvIdRdv = (rdv) => {
    if (rdv.id && rdv.id.idRdv) {
      return rdv.id.idRdv;
    }
    return rdv.idRdv || 0;
  };

  // Fonction pour gérer le changement de page spécifique à cette vue
  const handlePageChange = (newPage) => {
    // Réinitialiser les groupes développés
    setExpandedGroups({});
    // Changer la page
    pagination.goToPage(newPage);
  };
  
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden divide-y divide-gray-200">
        {displayedGroups.length > 0 ? (
          displayedGroups.map(groupKey => {
            const group = groupedData[groupKey];
            const isExpanded = expandedGroups[groupKey] || false;
            
            return (
              <div key={groupKey} className="group">
                <div 
                  onClick={() => toggleGroup(groupKey)}
                  className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center justify-center p-1 rounded-full transition-transform ${isExpanded ? "transform rotate-90" : ""}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </span>
                    <Link 
                      to={`/etudes/${group.id}`}
                      className="font-medium text-primary-600 hover:text-primary-900"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {group.title}
                    </Link>
                  </div>
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {group.rdvs.length} rendez-vous
                  </span>
                </div>
                
                {isExpanded && (
                  <div className="overflow-x-auto border-t border-gray-100">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volontaire</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Heure</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {group.rdvs.map((rdv, index) => {
                          const idEtude = getRdvIdEtude(rdv);
                          const idRdv = getRdvIdRdv(rdv);
                          const key = `${idEtude}-${idRdv}-${index}`;
                          
                          return (
                            <tr key={key} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Link 
                                  to={`/volontaires/${rdv.idVolontaire}`}
                                  className="text-primary-600 hover:text-primary-900"
                                >
                                  {rdv.volontaire ? `${rdv.volontaire.prenom} ${rdv.volontaire.nom}` : `ID: ${rdv.idVolontaire}`}
                                </Link>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">{formatDate(rdv.date)}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{rdv.heure}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getStatusBadge(rdv.etat)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end space-x-2">
                                  <button
                                    onClick={() => handleUpdateStatus(idEtude, idRdv, 'CONFIRME')}
                                    className="text-green-600 hover:text-green-900"
                                    disabled={rdv.etat === 'CONFIRME' || updateLoading === `${idEtude}-${idRdv}`}
                                  >
                                    {updateLoading === `${idEtude}-${idRdv}` ? '...' : 'Confirmer'}
                                  </button>
                                  <button
                                    onClick={() => handleUpdateStatus(idEtude, idRdv, 'ANNULE')}
                                    className="text-red-600 hover:text-red-900"
                                    disabled={rdv.etat === 'ANNULE' || updateLoading === `${idEtude}-${idRdv}`}
                                  >
                                    Annuler
                                  </button>
                                  <Link
                                    to={`/rdvs/${idEtude}/${idRdv}/edit`}
                                    className="text-primary-600 hover:text-primary-900"
                                  >
                                    Modifier
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-6 text-center text-gray-500">
            Aucun rendez-vous trouvé
          </div>
        )}
      </div>
      
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-700">
          Affichage de {pagination.page * pagination.size + 1} à {Math.min((pagination.page + 1) * pagination.size, pagination.total)} sur {pagination.total} rendez-vous
        </p>
        <div className="flex space-x-2">
          <button
            onClick={pagination.prevPage}
            disabled={pagination.page === 0}
            className={`px-3 py-1 border border-gray-300 rounded ${
              pagination.page === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50'
            }`}
          >
            Précédent
          </button>
          
          {[...Array(Math.min(5, pagination.pageCount)).keys()]
            .map(i => pagination.page < 2 ? i : pagination.page > pagination.pageCount - 3 ? pagination.pageCount - 5 + i : pagination.page - 2 + i)
            .filter(i => i >= 0 && i < pagination.pageCount)
            .map(i => (
              <button
                key={i}
                onClick={() => handlePageChange(i)}
                className={`px-3 py-1 border border-gray-300 rounded ${
                  pagination.page === i
                    ? 'bg-primary-50 text-primary-700 font-medium border-primary-300'
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
          
          <button
            onClick={pagination.nextPage}
            disabled={pagination.page >= pagination.pageCount - 1}
            className={`px-3 py-1 border border-gray-300 rounded ${
              pagination.page >= pagination.pageCount - 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50'
            }`}
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupedByStudyView;