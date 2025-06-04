import React, { useState, useEffect, useRef } from 'react';
import rdvService from '../../services/rdvService';
import volontaireService from '../../services/volontaireService';

const AppointmentViewer = ({
  appointment,
  onEdit,
  onBack,
  onRefresh
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAssignVolunteer, setShowAssignVolunteer] = useState(false);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState('');
  const [volunteers, setVolunteers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentAppointment, setCurrentAppointment] = useState(appointment);
  const [searchVolunteerTerm, setSearchVolunteerTerm] = useState('');
  const [volunteer, setvolunteer] = useState(null);

  const volunteerSelectorRef = useRef(null);

  // Load the full appointment data when component mounts
  useEffect(() => {
    if (!appointment) return;

    // Initialize current appointment with the provided data
    setCurrentAppointment(appointment);

    const loadFullAppointmentData = async () => {
      if (!appointment.idRdv) return;

      try {
        setIsLoading(true);
        const idEtude = appointment.idEtude || appointment.etude?.id;
        const idRdv = appointment.idRdv || appointment.id;

        if (!idEtude || !idRdv) {
          console.error("Missing appointment or study ID");
          return;
        }

        try {
          // Fetch the full appointment data to ensure we have all details
          const response = await rdvService.getById(idEtude, idRdv);
          if (response) {
            // Merge the response with the current appointment to ensure we have all data
            setCurrentAppointment({
              ...appointment,
              ...response,
              etude: response.etude || appointment.etude,
              groupe: response.groupe || appointment.groupe,
              volontaire: response.volontaire || appointment.volontaire,
              // Make sure we don't lose these fields even if they're not in the response
              etudeRef: appointment.etudeRef || response.etudeRef,
              idVolontaire: appointment.idVolontaire || response.idVolontaire
            });
          }
        } catch (err) {
          console.error("Error fetching detailed appointment data:", err);
          // Continue with the data we have
        }
      } catch (err) {
        console.error("Error loading appointment details:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadFullAppointmentData();
  }, [appointment]);

  // Charger les détails du volontaire si on n'a que l'ID
  useEffect(() => {
    const loadvolunteer = async () => {
      // Si on a l'objet volontaire complet ou pas d'ID, on ne fait rien
      if (currentAppointment.volontaire || !currentAppointment.idVolontaire) {
        setvolunteer(null);
        return;
      }

      try {
        setIsLoading(true);
        // Récupérer les détails du volontaire via l'endpoint allstats
        console.log("Chargement des détails du volontaire:", currentAppointment.idVolontaire);
        
        // Charger d'abord tous les volontaires
        const allVolunteersResponse = await volontaireService.getAllWithoutPagination();
        if (Array.isArray(allVolunteersResponse)) {
          // Chercher le volontaire par ID dans la liste
          const foundVolunteer = allVolunteersResponse.find(
            v => (v.id && v.id.toString() === currentAppointment.idVolontaire.toString()) || 
                 (v.volontaireId && v.volontaireId.toString() === currentAppointment.idVolontaire.toString())
          );
          
          if (foundVolunteer) {
            setvolunteer(foundVolunteer);
            console.log("Détails du volontaire trouvés via getAllWithoutPagination:", foundVolunteer);
          } else {
            // Fallback: essayer getById comme avant
            const response = await volontaireService.getById(currentAppointment.idVolontaire);
            console.log("Réponse volontaire (fallback):", response);
            if (response && response.data) {
              setvolunteer(response.data);
            }
          }
        }
      } catch (err) {
        console.error("Erreur lors du chargement des détails du volontaire:", err);
        // Ne pas afficher d'erreur à l'utilisateur car c'est une fonctionnalité secondaire
      } finally {
        setIsLoading(false);
      }
    };

    loadvolunteer();
  }, [currentAppointment]);

  // Gérer le clic en dehors du sélecteur de volontaire
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (volunteerSelectorRef.current && !volunteerSelectorRef.current.contains(event.target)) {
        setShowAssignVolunteer(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Formater la date pour l'affichage
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Ouvrir le sélecteur de volontaire et charger les volontaires
  const handleAssignVolunteerClick = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const volunteersResponse = await volontaireService.getAllWithoutPagination();
      const volunteersData = volunteersResponse || [];
      setVolunteers(Array.isArray(volunteersData) ? volunteersData : []);
      setShowAssignVolunteer(true);
      setSearchVolunteerTerm('');
    } catch (err) {
      setError('Erreur lors du chargement des volontaires: ' + err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrage des volontaires
  const filteredVolunteers = Array.isArray(volunteers)
    ? volunteers.filter(v => {
      const nom = (v.nom || '').toLowerCase();
      const prenom = (v.prenom || '').toLowerCase();
      const term = searchVolunteerTerm.toLowerCase();

      return nom.includes(term) || prenom.includes(term);
    }).slice(0, 50)
    : [];

  // Désassigner un volontaire
  const handleUnassignVolunteer = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const idEtude = currentAppointment.idEtude || currentAppointment.etude?.id;
      const idRdv = currentAppointment.idRdv || currentAppointment.id;

      if (!idEtude || !idRdv) {
        throw new Error("ID d'étude ou de rendez-vous manquant");
      }

      // Préparer les données minimales requises pour la mise à jour
      // On envoie null comme idVolontaire pour désassigner
      const updatedData = {
        idEtude: idEtude,
        idRdv: idRdv,
        idVolontaire: null,
        date: currentAppointment.date,
        heure: currentAppointment.heure,
        etat: currentAppointment.etat || 'PLANIFIE'
      };

      console.log("Données envoyées pour désassigner:", updatedData);

      // Appeler l'API pour mettre à jour le rendez-vous
      const response = await rdvService.update(idEtude, idRdv, updatedData);

      if (!response) {
        throw new Error('Aucune réponse du serveur');
      }

      // Mettre à jour localement l'affichage
      setCurrentAppointment({
        ...currentAppointment,
        idVolontaire: null,
        volontaire: null
      });
      
      setvolunteer(null);
      setShowAssignVolunteer(false);

      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      setError('Erreur lors de la désassignation du volontaire: ' + (err.message || 'Erreur inconnue'));
      console.error("Erreur de désassignation:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Assigner un volontaire au rendez-vous
  const handleAssignVolunteer = async () => {
    if (!selectedVolunteerId) {
      setError('Veuillez sélectionner un volontaire');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const idEtude = currentAppointment.idEtude || currentAppointment.etude?.id;
      const idRdv = currentAppointment.idRdv || currentAppointment.id;

      if (!idEtude || !idRdv) {
        throw new Error("ID d'étude ou de rendez-vous manquant");
      }

      // Préparer les données minimales requises pour la mise à jour
      const updatedData = {
        idEtude: idEtude,
        idRdv: idRdv,
        idVolontaire: selectedVolunteerId,
        date: currentAppointment.date,
        heure: currentAppointment.heure,
        etat: currentAppointment.etat || 'PLANIFIE'
      };

      console.log("Données envoyées pour mettre à jour:", updatedData);

      // Appeler l'API pour mettre à jour le rendez-vous
      const response = await rdvService.update(idEtude, idRdv, updatedData);

      if (!response) {
        throw new Error('Aucune réponse du serveur');
      }

      // Mettre à jour localement l'affichage
      const selectedVolunteer = volunteers.find(v => v.id.toString() === selectedVolunteerId);

      setCurrentAppointment({
        ...currentAppointment,
        idVolontaire: selectedVolunteerId,
        volontaire: selectedVolunteer || null
      });

      // Si on a trouvé les détails du volontaire dans la liste
      if (selectedVolunteer) {
        setvolunteer(selectedVolunteer);
      } else {
        // Sinon, charger via l'endpoint allstats (liste complète)
        try {
          const allVolunteersResponse = await volontaireService.getAllWithoutPagination();
          if (Array.isArray(allVolunteersResponse)) {
            const foundVolunteer = allVolunteersResponse.find(
              v => (v.id && v.id.toString() === selectedVolunteerId) || 
                   (v.volontaireId && v.volontaireId.toString() === selectedVolunteerId)
            );
            
            if (foundVolunteer) {
              setvolunteer(foundVolunteer);
            } else {
              // Fallback à getById
              const volunteerResponse = await volontaireService.getById(selectedVolunteerId);
              if (volunteerResponse && volunteerResponse.data) {
                setvolunteer(volunteerResponse.data);
              }
            }
          }
        } catch (detailErr) {
          console.error("Erreur lors du chargement des détails du volontaire assigné:", detailErr);
        }
      }

      setShowAssignVolunteer(false);

      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      setError('Erreur lors de l\'affectation du volontaire: ' + (err.message || 'Erreur inconnue'));
      console.error("Erreur d'assignation:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Supprimer le rendez-vous
  const handleDelete = async () => {
    try {
      setIsDeleting(true);

      const idEtude = currentAppointment.idEtude || currentAppointment.etude?.id;
      const idRdv = currentAppointment.idRdv || currentAppointment.id;

      if (!idEtude || !idRdv) {
        throw new Error("ID d'étude ou de rendez-vous manquant");
      }

      // Utiliser le service RDV pour supprimer le rendez-vous
      const response = await rdvService.delete(idEtude, idRdv);
      if (!response || (response.error && response.error.message)) {
        throw new Error(response.error?.message || 'Erreur lors de la suppression');
      }
      onBack(); // Retourner à la vue précédente après suppression
    } catch (err) {
      setError('Erreur lors de la suppression: ' + err.message);
      console.error(err);
      setIsDeleting(false);
    }
  };

  // Déterminer le style de la pastille d'état
  const getStatusStyle = () => {
    switch (currentAppointment.etat) {
      case 'CONFIRME':
        return 'bg-green-100 text-green-800 border-green-500';
      case 'EN_ATTENTE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-500';
      case 'ANNULE':
        return 'bg-red-100 text-red-800 border-red-500';
      case 'COMPLETE':
        return 'bg-blue-100 text-blue-800 border-blue-500';
      case 'PLANIFIE':
        return 'bg-purple-100 text-purple-800 border-purple-500';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-500';
    }
  };

  if (isLoading && !currentAppointment) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 max-w-4xl mx-auto flex justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Détails du rendez-vous</h2>
        <button
          onClick={onBack}
          className="text-blue-600 hover:text-blue-800"
        >
          &lt; Retour
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Informations générales</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Étude:</span>
                <span className="font-medium">
                  {currentAppointment.etude ?
                    `${currentAppointment.etude.ref || ''} ${currentAppointment.etude.titre ? '- ' + currentAppointment.etude.titre : ''}` :
                    currentAppointment.etudeRef ?
                      `${currentAppointment.etudeRef}` :
                      'Non spécifiée'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Groupe:</span>
                <span className="font-medium">
                  {currentAppointment.groupe ?
                    (currentAppointment.groupe.nom || currentAppointment.groupe.intitule || `Groupe ${currentAppointment.groupe.id || currentAppointment.groupe.idGroupe}`) :
                    currentAppointment.idGroupe ?
                      `Groupe ${currentAppointment.idGroupe}` :
                      'Non spécifié'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">
                  {formatDate(currentAppointment.date)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Heure:</span>
                <span className="font-medium">
                  {currentAppointment.heure || 'Non spécifiée'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Durée:</span>
                <span className="font-medium">
                  {currentAppointment.duree ? `${currentAppointment.duree} min` : 'Non spécifiée'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">État:</span>
                <span className={`font-medium px-3 py-1 rounded-full text-sm border-l-4 ${getStatusStyle()}`}>
                  {currentAppointment.etat || 'Non spécifié'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">ID du RDV:</span>
                <span className="font-medium">
                  {currentAppointment.idRdv || currentAppointment.id || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {currentAppointment.commentaires && (
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Commentaires</h3>
              <div className="border rounded-md p-3 bg-gray-50 text-gray-700">
                {currentAppointment.commentaires}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Informations du volontaire</h3>

            {currentAppointment.volontaire ? (
              <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Nom:</span>
                  <span className="font-medium">
                    {currentAppointment.volontaire.titre ? `${currentAppointment.volontaire.titre} ` : ''}
                    {`${currentAppointment.volontaire.nom || ''} ${currentAppointment.volontaire.prenom || ''}`}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">ID:</span>
                  <span className="font-medium">
                    {currentAppointment.volontaire.id || currentAppointment.volontaire.volontaireId || currentAppointment.idVolontaire}
                  </span>
                </div>

                {currentAppointment.volontaire.sexe && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Sexe:</span>
                    <span className="font-medium">{currentAppointment.volontaire.sexe}</span>
                  </div>
                )}

                {currentAppointment.volontaire.dateNaissance && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Date de naissance:</span>
                    <span className="font-medium">{formatDate(currentAppointment.volontaire.dateNaissance)}</span>
                  </div>
                )}

                {currentAppointment.volontaire.telPortable && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Téléphone portable:</span>
                    <span className="font-medium">
                      {String(currentAppointment.volontaire.telPortable).replace(/(\d{2})(?=\d)/g, '$1 ')}
                    </span>
                  </div>
                )}

                {currentAppointment.volontaire.telDomicile && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Téléphone domicile:</span>
                    <span className="font-medium">
                      {String(currentAppointment.volontaire.telDomicile).replace(/(\d{2})(?=\d)/g, '$1 ')}
                    </span>
                  </div>
                )}

                {currentAppointment.volontaire.email && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{currentAppointment.volontaire.email}</span>
                  </div>
                )}

                {currentAppointment.volontaire.adresse && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Adresse:</span>
                    <span className="font-medium">
                      {currentAppointment.volontaire.adresse},
                      {currentAppointment.volontaire.cp} {currentAppointment.volontaire.ville}
                    </span>
                  </div>
                )}

                {currentAppointment.volontaire.phototype && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Phototype:</span>
                    <span className="font-medium">{currentAppointment.volontaire.phototype}</span>
                  </div>
                )}

                {currentAppointment.volontaire.ethnie && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Ethnie:</span>
                    <span className="font-medium">{currentAppointment.volontaire.ethnie}</span>
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-blue-200 flex flex-col gap-2">
                  <button
                    onClick={handleAssignVolunteerClick}
                    className="text-blue-600 border border-blue-500 px-4 py-2 rounded-md hover:bg-blue-50 w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Chargement...' : 'Changer de volontaire'}
                  </button>
                  <button
                    onClick={handleUnassignVolunteer}
                    className="text-red-600 border border-red-500 px-4 py-2 rounded-md hover:bg-red-50 w-full"
                    disabled={isLoading}
                  >
                    Désassigner ce volontaire
                  </button>
                </div>
              </div>
            ) : currentAppointment.idVolontaire ? (
              <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Volontaire:</span>
                  <span className="font-medium">
                    {volunteer ?
                      `${volunteer.titre ? volunteer.titre + ' ' : ''}${volunteer.nom || ''} ${volunteer.prenom || ''}` :
                      `ID: ${currentAppointment.idVolontaire}`
                    }
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">ID:</span>
                  <span className="font-medium">
                    {volunteer ? 
                      (volunteer.id || volunteer.volontaireId) : 
                      currentAppointment.idVolontaire}
                  </span>
                </div>

                {volunteer ? (
                  <>
                    {volunteer.sexe && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Sexe:</span>
                        <span className="font-medium">{volunteer.sexe}</span>
                      </div>
                    )}

                    {volunteer.dateNaissance && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Date de naissance:</span>
                        <span className="font-medium">{formatDate(volunteer.dateNaissance)}</span>
                      </div>
                    )}

                    {volunteer.email && volunteer.email !== "" && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">{volunteer.email}</span>
                      </div>
                    )}

                    {volunteer.telPortable && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Téléphone portable:</span>
                        <span className="font-medium">
                          {String(volunteer.telPortable).replace(/(\d{2})(?=\d)/g, '$1 ')}
                        </span>
                      </div>
                    )}

                    {volunteer.telDomicile && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Téléphone domicile:</span>
                        <span className="font-medium">
                          {String(volunteer.telDomicile).replace(/(\d{2})(?=\d)/g, '$1 ')}
                        </span>
                      </div>
                    )}

                    {volunteer.adresse && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Adresse:</span>
                        <span className="font-medium">
                          {volunteer.adresse},
                          {volunteer.cp} {volunteer.ville}
                        </span>
                      </div>
                    )}

                    {volunteer.phototype && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Phototype:</span>
                        <span className="font-medium">{volunteer.phototype}</span>
                      </div>
                    )}

                    {volunteer.ethnie && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Ethnie:</span>
                        <span className="font-medium">{volunteer.ethnie}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-blue-600">
                    {isLoading ? "Chargement des informations du volontaire..." : "Informations détaillées du volontaire non disponibles"}
                  </p>
                )}

                <div className="mt-3 pt-3 border-t border-blue-200 flex flex-col gap-2">
                  <button
                    onClick={handleAssignVolunteerClick}
                    className="text-blue-600 border border-blue-500 px-4 py-2 rounded-md hover:bg-blue-50 w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Chargement...' : 'Changer de volontaire'}
                  </button>
                  <button
                    onClick={handleUnassignVolunteer}
                    className="text-red-600 border border-red-500 px-4 py-2 rounded-md hover:bg-red-50 w-full"
                    disabled={isLoading}
                  >
                    Désassigner ce volontaire
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-500 mb-4">Aucun volontaire n'est assigné à ce rendez-vous.</p>
                <button
                  onClick={handleAssignVolunteerClick}
                  className="text-blue-600 border border-blue-500 px-4 py-2 rounded-md hover:bg-blue-50 w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Chargement...' : 'Assigner un volontaire'}
                </button>
              </div>
            )}

            {/* Interface d'assignation de volontaire */}
            {showAssignVolunteer && (
              <div
                ref={volunteerSelectorRef}
                className="mt-4 p-4 border rounded-md bg-gray-50"
              >
                <h4 className="font-medium mb-2">Sélectionner un volontaire</h4>

                <div className="relative mb-4">
                  <input
                    type="text"
                    placeholder="Rechercher un volontaire..."
                    value={searchVolunteerTerm}
                    onChange={(e) => setSearchVolunteerTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md mb-4">
                  {isLoading ? (
                    <div className="p-3 text-center">
                      <div className="animate-spin inline-block w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                      <p className="mt-2 text-sm text-gray-500">Chargement des volontaires...</p>
                    </div>
                  ) : filteredVolunteers.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {filteredVolunteers.map(volunteer => (
                        <div
                          key={volunteer.id || volunteer.volontaireId}
                          className={`p-3 hover:bg-blue-50 cursor-pointer ${selectedVolunteerId === String(volunteer.id || volunteer.volontaireId) ? 'bg-blue-50' : ''}`}
                          onClick={() => setSelectedVolunteerId(String(volunteer.id || volunteer.volontaireId))}
                        >
                          <div className="font-semibold">
                            {volunteer.titre ? `${volunteer.titre} ` : ''}
                            {volunteer.nom || ''} {volunteer.prenom || ''}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {volunteer.id || volunteer.volontaireId}
                            {volunteer.email && ` | ${volunteer.email}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      {searchVolunteerTerm ?
                        "Aucun volontaire ne correspond à votre recherche" :
                        "Commencez à taper pour rechercher un volontaire"}
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={handleAssignVolunteer}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex-1"
                    disabled={isLoading || !selectedVolunteerId}
                  >
                    Assigner
                  </button>
                  <button
                    onClick={() => setShowAssignVolunteer(false)}
                    className="border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-100 flex-1"
                    disabled={isLoading}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col space-y-3 pt-6">
            <button
              onClick={onEdit}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Modifier le rendez-vous
            </button>

            <button
              onClick={handleDelete}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
              disabled={isDeleting}
            >
              {isDeleting ? 'Suppression...' : 'Supprimer le rendez-vous'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentViewer;