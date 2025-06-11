import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import etudeVolontaireService from '../../services/etudeVolontaireService';
import api from '../../services/api'; // Pour appeler /etudes/{id}
import { formatDate } from '../../utils/dateUtils';

const VolontaireDetailEtude = ({ volontaireId }) => {
  const [associations, setAssociations] = useState([]); // Données associations étude-volontaire
  const [etudesEnrichies, setEtudesEnrichies] = useState([]); // Données fusionnées
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // État pour l'accordéon des études terminées
  const [showTerminatedStudies, setShowTerminatedStudies] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('=== CHARGEMENT ETUDES VOLONTAIRE ===');
        console.log('Volontaire ID:', volontaireId);
        
        // 1. Récupérer les associations étude-volontaire (vous avez déjà ça)
        const associationsData = await etudeVolontaireService.getEtudesByVolontaire(volontaireId);
        console.log('Associations reçues:', associationsData); // Directement associationsData, pas .data
        
        setAssociations(associationsData || []);
        
        if (!associationsData || associationsData.length === 0) {
          setEtudesEnrichies([]);
          return;
        }
        
        console.log('=== ENRICHISSEMENT DES ETUDES ===');
        
        // 2. Pour chaque association, récupérer les détails de l'étude
        const etudesDetaillees = [];
        
        for (const association of associationsData) {
          const idEtude = association.idEtude;
          console.log(`Récupération détails étude ID: ${idEtude}`);
          
          try {
            // Appel API pour récupérer les détails de l'étude
            const etudeResponse = await api.get(`/etudes/${idEtude}`);
            const detailsEtude = etudeResponse.data;
            
            console.log(`Détails reçus pour étude ${idEtude}:`, detailsEtude);
            
            // 3. Fusionner association + détails étude
            const etudeFusionnee = {
              // Garder toutes les données d'association
              idEtude: association.idEtude,
              idGroupe: association.idGroupe, 
              idVolontaire: association.idVolontaire,
              iv: association.iv,
              numsujet: association.numsujet,
              paye: association.paye,
              statut: association.statut,
              
              // Ajouter les détails de l'étude
              ref: detailsEtude.ref || `Étude #${idEtude}`,
              titre: detailsEtude.titre || 'Titre non disponible',
              description: detailsEtude.description,
              dateDebut: detailsEtude.dateDebut,
              dateFin: detailsEtude.dateFin,
              type: detailsEtude.type,
              // Ajouter d'autres champs selon votre API
            };
            
            etudesDetaillees.push(etudeFusionnee);
            
          } catch (etudeError) {
            console.warn(`Erreur lors de la récupération de l'étude ${idEtude}:`, etudeError);
            console.warn('Status:', etudeError.response?.status);
            console.warn('Message:', etudeError.message);
            
            // En cas d'erreur, garder au moins les données d'association
            etudesDetaillees.push({
              ...association,
              ref: `Étude #${idEtude}`,
              titre: 'Titre non disponible',
              description: null
            });
          }
        }
        
        console.log('Études finales fusionnées:', etudesDetaillees);
        setEtudesEnrichies(etudesDetaillees);
        
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
        setError('Impossible de charger les études du volontaire');
        setEtudesEnrichies([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (volontaireId) {
      fetchData();
    }
  }, [volontaireId]);

  // Fonction pour vérifier si une étude appartient à l'année courante
  const isCurrentYearStudy = (etude) => {
    const currentYear = new Date().getFullYear();
    
    // Si l'étude a une date de fin, vérifier si elle est dans l'année courante
    if (etude.dateFin) {
      const dateFin = new Date(etude.dateFin);
      if (dateFin.getFullYear() === currentYear) {
        return true;
      }
    }
    
    // Si l'étude a une date de début, vérifier si elle est dans l'année courante
    if (etude.dateDebut) {
      const dateDebut = new Date(etude.dateDebut);
      if (dateDebut.getFullYear() === currentYear) {
        return true;
      }
    }
    
    // Si l'étude n'a pas de dates mais est en cours, la considérer comme de l'année courante
    if (!etude.dateFin && !etude.dateDebut) {
      return true;
    }
    
    return false;
  };

  // Calculer les indemnités de l'année courante
  const indemniteAnneeCourante = etudesEnrichies
    .filter(etude => isCurrentYearStudy(etude))
    .reduce((total, etude) => total + (etude.iv || 0), 0);

  // Fonction pour formater l'indemnité
  const formatIndemnite = (iv) => {
    if (!iv || iv === 0) return 'Non rémunéré';
    return `${iv} €`;
  };

  // Fonction pour formater le statut de paiement
  const formatPaiement = (paye, iv) => {
    if (!iv || iv === 0) return null;
    return paye === 1 ? 'Payé' : 'Non payé';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
        <span className="ml-2 text-gray-600">Chargement des études...</span>
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

  if (etudesEnrichies.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-500">Aucune étude trouvée pour ce volontaire</p>
      </div>
    );
  }

  // Filtrage simple : toutes les études sont considérées comme actives par défaut
  const etudesActives = etudesEnrichies.filter(etude => {
    // Si l'étude a une date de fin et qu'elle est passée, elle est terminée
    if (etude.dateFin) {
      const dateFin = new Date(etude.dateFin);
      const today = new Date();
      return dateFin >= today;
    }
    // Par défaut, considérer comme active
    return true;
  });
  
  const etudesTerminees = etudesEnrichies.filter(etude => {
    if (etude.dateFin) {
      const dateFin = new Date(etude.dateFin);
      const today = new Date();
      return dateFin < today;
    }
    return false;
  });

  console.log('Résultats finaux:', {
    total: etudesEnrichies.length,
    actives: etudesActives.length,
    terminees: etudesTerminees.length,
    indemniteAnneeCourante: indemniteAnneeCourante
  });

  return (
    <div className="space-y-6">
      {/* Résumé statistique en haut */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <h4 className="font-medium text-gray-900 mb-4 flex items-center">
          <span className="text-lg">📊</span>
          <span className="ml-2">Résumé des études</span>
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-primary-600">{etudesEnrichies.length}</p>
            <p className="text-gray-600 text-sm">Études total</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{etudesActives.length}</p>
            <p className="text-gray-600 text-sm">En cours</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-600">{etudesTerminees.length}</p>
            <p className="text-gray-600 text-sm">Terminées</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-orange-600">
              {etudesEnrichies.reduce((total, etude) => total + (etude.iv || 0), 0)} €
            </p>
            <p className="text-gray-600 text-sm">Indemnités total</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">
              {indemniteAnneeCourante} €
            </p>
            <p className="text-gray-600 text-sm">Indemnités {new Date().getFullYear()}</p>
          </div>
        </div>
        
        {/* Statistiques de paiement */}
        <div className="mt-4 pt-3 border-t border-blue-200">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-xl font-bold text-green-600">
                {etudesEnrichies.filter(e => e.paye === 1).length}
              </p>
              <p className="text-gray-600 text-sm">Études payées</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-orange-600">
                {etudesEnrichies.filter(e => e.paye === 0 && e.iv > 0).length}
              </p>
              <p className="text-gray-600 text-sm">En attente paiement</p>
            </div>
          </div>
        </div>
      </div>

      {/* Études en cours */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Études en cours ({etudesActives.length})
        </h3>
        
        {etudesActives.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <p className="text-gray-500">Aucune étude en cours</p>
          </div>
        ) : (
          <div className="space-y-3">
            {etudesActives.map((etude, index) => (
              <div 
                key={`active-${etude.idEtude}-${index}`}
                className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Link 
                        to={`/etudes/${etude.idEtude}`}
                        className="font-medium text-primary-600 hover:text-primary-700"
                      >
                        {etude.ref || `Étude #${etude.idEtude}`}
                      </Link>
                      <span className="text-sm text-gray-500">
                        Groupe: {etude.idGroupe}
                      </span>
                    </div>
                    
                    {etude.titre && (
                      <p className="text-gray-700 text-sm mb-3">{etude.titre}</p>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-500">N° Sujet:</span>
                        <p className="text-gray-900">{etude.numsujet || '-'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Indemnité:</span>
                        <p className="text-gray-900">{formatIndemnite(etude.iv)}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Paiement:</span>
                        <p className={`text-sm ${etude.paye === 1 ? 'text-green-600' : 'text-orange-600'}`}>
                          {formatPaiement(etude.paye, etude.iv)}
                        </p>
                      </div>
                    </div>
                    
                    {(etude.dateDebut || etude.dateFin) && (
                      <div className="mt-3">
                        <span className="font-medium text-gray-500 text-sm">Période:</span>
                        <p className="text-gray-700 text-sm mt-1">
                          {etude.dateDebut && formatDate(etude.dateDebut)}
                          {etude.dateDebut && etude.dateFin && ' - '}
                          {etude.dateFin && formatDate(etude.dateFin)}
                        </p>
                      </div>
                    )}
                    
                    {etude.description && (
                      <div className="mt-3">
                        <span className="font-medium text-gray-500 text-sm">Description:</span>
                        <p className="text-gray-700 text-sm mt-1 line-clamp-2">{etude.description}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      En cours
                    </span>
                    
                    <Link
                      to={`/etudes/${etude.idEtude}`}
                      className="text-xs text-primary-600 hover:text-primary-700"
                    >
                      Voir étude
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Accordéon pour les études terminées */}
      {etudesTerminees.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setShowTerminatedStudies(!showTerminatedStudies)}
            className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between text-left"
          >
            <h3 className="text-lg font-medium text-gray-900">
              Historique des études ({etudesTerminees.length})
            </h3>
            <span className={`transform transition-transform duration-200 ${showTerminatedStudies ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>
          
          {showTerminatedStudies && (
            <div className="p-6 bg-white">
              <div className="space-y-3">
                {etudesTerminees.map((etude, index) => (
                  <div 
                    key={`terminated-${etude.idEtude}-${index}`}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Link 
                            to={`/etudes/${etude.idEtude}`}
                            className="font-medium text-primary-600 hover:text-primary-700"
                          >
                            {etude.ref || `Étude #${etude.idEtude}`}
                          </Link>
                          <span className="text-sm text-gray-500">
                            Groupe: {etude.idGroupe}
                          </span>
                        </div>
                        
                        {etude.titre && (
                          <p className="text-gray-700 text-sm mb-3">{etude.titre}</p>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-500">N° Sujet:</span>
                            <p className="text-gray-900">{etude.numsujet || '-'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-500">Indemnité:</span>
                            <p className="text-gray-900">{formatIndemnite(etude.iv)}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-500">Paiement:</span>
                            <p className={`text-sm ${etude.paye === 1 ? 'text-green-600' : 'text-orange-600'}`}>
                              {formatPaiement(etude.paye, etude.iv)}
                            </p>
                          </div>
                        </div>
                        
                        {(etude.dateDebut || etude.dateFin) && (
                          <div className="mt-3">
                            <span className="font-medium text-gray-500 text-sm">Période:</span>
                            <p className="text-gray-700 text-sm mt-1">
                              {etude.dateDebut && formatDate(etude.dateDebut)}
                              {etude.dateDebut && etude.dateFin && ' - '}
                              {etude.dateFin && formatDate(etude.dateFin)}
                            </p>
                          </div>
                        )}
                        
                        {etude.description && (
                          <div className="mt-3">
                            <span className="font-medium text-gray-500 text-sm">Description:</span>
                            <p className="text-gray-700 text-sm mt-1 line-clamp-2">{etude.description}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Terminé
                        </span>
                        
                        <Link
                          to={`/etudes/${etude.idEtude}`}
                          className="text-xs text-primary-600 hover:text-primary-700"
                        >
                          Voir étude
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VolontaireDetailEtude;