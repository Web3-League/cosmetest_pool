import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { formatDate } from '../../utils/dateUtils';
import axios from 'axios';

const EtudeRdvDetails = () => {
  const { idEtude } = useParams();
  const [loading, setLoading] = useState(true);
  const [etude, setEtude] = useState(null);
  const [rdvs, setRdvs] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEtudeDetails = async () => {
      try {
        setLoading(true);
        
        // Récupérer les détails de l'étude
        const etudeResponse = await axios.get(`/api/etudes/${idEtude}`);
        setEtude(etudeResponse.data);
        
        // Récupérer tous les RDVs associés à cette étude
        const rdvsResponse = await axios.get(`/api/rdvs/search?idEtude=${idEtude}`);
        console.log("Structure de la réponse API:", rdvsResponse.data);
        
        // Obtenir le tableau de rendez-vous de la réponse
        let rdvsArray = [];
        if (Array.isArray(rdvsResponse.data)) {
          // Si la réponse est déjà un tableau
          rdvsArray = rdvsResponse.data;
        } else if (rdvsResponse.data.content && Array.isArray(rdvsResponse.data.content)) {
          // Si la réponse est un objet avec une propriété "content" qui est un tableau
          rdvsArray = rdvsResponse.data.content;
        } else if (rdvsResponse.data.rdvs && Array.isArray(rdvsResponse.data.rdvs)) {
          // Si la réponse est un objet avec une propriété "rdvs" qui est un tableau
          rdvsArray = rdvsResponse.data.rdvs;
        } else {
          // Si la structure est différente, parcourez toutes les propriétés pour trouver un tableau
          Object.keys(rdvsResponse.data).forEach(key => {
            if (Array.isArray(rdvsResponse.data[key])) {
              rdvsArray = rdvsResponse.data[key];
            }
          });
        }
        
        // Filtrer les rendez-vous pour s'assurer qu'ils appartiennent à cette étude
        const filteredRdvs = rdvsArray.filter(rdv => {
          const rdvIdEtude = rdv.idEtude || (rdv.id && rdv.id.idEtude);
          return rdvIdEtude == idEtude; // == pour permettre comparaison string/number
        });
        
        // Triez les RDVs par date et heure
        if (filteredRdvs.length > 0) {
          filteredRdvs.sort((a, b) => {
            // D'abord, comparez les dates
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            
            if (isNaN(dateA) || isNaN(dateB)) {
              // Si les dates ne sont pas valides, comparez les chaînes
              return String(a.date).localeCompare(String(b.date));
            }
            
            const dateComparison = dateA - dateB;
            if (dateComparison !== 0) return dateComparison;
            
            // Si les dates sont identiques, comparez les heures
            return (a.heure || '').localeCompare(b.heure || '');
          });
        }
        
        // Récupérer les informations des volontaires
        const rdvsWithVolontaires = await Promise.all(filteredRdvs.map(async (rdv) => {
          // Si le RDV n'a pas déjà les informations du volontaire
          if (rdv.idVolontaire && (!rdv.volontaire || typeof rdv.volontaire !== 'object')) {
            try {
              // Appeler l'API pour obtenir les détails du volontaire
              const volontaireResponse = await axios.get(`/api/volontaires/${rdv.idVolontaire}`);
              return {
                ...rdv,
                volontaire: volontaireResponse.data
              };
            } catch (error) {
              console.error(`Erreur lors de la récupération du volontaire ${rdv.idVolontaire}:`, error);
              return rdv; // Retourner le RDV tel quel en cas d'erreur
            }
          }
          return rdv; // Retourner le RDV s'il a déjà les informations du volontaire
        }));
        
        setRdvs(rdvsWithVolontaires);
        setLoading(false);
      } catch (err) {
        console.error("Erreur lors de la récupération des détails:", err);
        setError("Impossible de charger les données. Veuillez réessayer.");
        setLoading(false);
      }
    };

    if (idEtude) {
      fetchEtudeDetails();
    }
  }, [idEtude]);

  // Fonction pour récupérer les informations du volontaire de façon robuste
  const getVolontaireInfo = (rdv) => {
    if (rdv.volontaire) {
      if (typeof rdv.volontaire === 'object') {
        // Si volontaire est un objet
        const prenom = rdv.volontaire.prenom || rdv.volontaire.prenomVolontaire || '';
        const nom = rdv.volontaire.nom || rdv.volontaire.nomVolontaire || '';
        
        if (prenom || nom) {
          return `${prenom} ${nom}`.trim();
        } else if (rdv.volontaire.nomComplet) {
          return rdv.volontaire.nomComplet;
        }
      } else if (typeof rdv.volontaire === 'string') {
        // Si volontaire est déjà une chaîne formatée
        return rdv.volontaire;
      }
    }
    
    // Vérifier si les informations sont directement sur l'objet rdv
    if (rdv.prenomVolontaire && rdv.nomVolontaire) {
      return `${rdv.prenomVolontaire} ${rdv.nomVolontaire}`;
    } else if (rdv.nomCompletVolontaire) {
      return rdv.nomCompletVolontaire;
    }
    
    // Si aucun nom n'est trouvé, afficher l'ID
    return `ID: ${rdv.idVolontaire || 'N/A'}`;
  };

  if (loading) {
    return <div className="p-4 text-center">Chargement des détails...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <Link to="/rdvs" className="text-blue-600 hover:text-blue-800">
          &larr; Retour au calendrier
        </Link>
      </div>
      
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">
          Ref : {etude?.ref || `#${idEtude}`}
        </h2>
        {etude?.titre && (
          <p className="text-gray-600">{etude.titre}</p>
        )}
      </div>
      
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Rendez-vous ({rdvs.length})</h3>
        
        {rdvs.length === 0 ? (
          <p className="text-gray-500">Aucun rendez-vous trouvé pour cette étude.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Heure
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Volontaire
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rdvs.map((rdv, index) => {
                  const idRdv = rdv.id?.idRdv || rdv.idRdv;
                  return (
                    <tr key={`${idEtude}-${idRdv}-${index}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatDate(rdv.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {rdv.heure}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getVolontaireInfo(rdv)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${rdv.etat === 'CONFIRME' ? 'bg-green-100 text-green-800' : 
                          rdv.etat === 'EN_ATTENTE' ? 'bg-yellow-100 text-yellow-800' : 
                          rdv.etat === 'ANNULE' ? 'bg-red-100 text-red-800' : 
                          rdv.etat === 'COMPLETE' ? 'bg-blue-100 text-blue-800' : 
                          'bg-gray-100 text-gray-800'}`}
                        >
                          {rdv.etat || 'PLANIFIE'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Link 
                          to={`/rdvs/${idEtude}/${idRdv}/edit`}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Modifier
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EtudeRdvDetails;