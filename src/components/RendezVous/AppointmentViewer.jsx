import React, { useState, useEffect, useRef } from 'react';
import rdvService from '../../services/rdvService';
import volontaireService from '../../services/volontaireService';
import groupeService from '../../services/groupeService';
import etudeVolontaireService from '../../services/etudeVolontaireService'; // Import ajouté

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
  const [groupe, setGroupe] = useState(null);

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

  // Charger les détails du groupe si on n'a que l'ID
  useEffect(() => {
    const loadGroupe = async () => {
      // Si on a l'objet groupe complet ou pas d'ID de groupe, on ne fait rien
      if (currentAppointment.groupe || !currentAppointment.idGroupe) {
        setGroupe(null);
        return;
      }

      try {
        setIsLoading(true);
        console.log("Chargement des détails du groupe:", currentAppointment.idGroupe);

        const response = await groupeService.getById(currentAppointment.idGroupe);
        console.log("Détails du groupe récupérés:", response);

        if (response) {
          setGroupe(response);
        }
      } catch (err) {
        console.error("Erreur lors du chargement des détails du groupe:", err);
        // Ne pas afficher d'erreur à l'utilisateur car c'est une fonctionnalité secondaire
      } finally {
        setIsLoading(false);
      }
    };

    loadGroupe();
  }, [currentAppointment.idGroupe]);

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

  // Fonction pour récupérer le nom du groupe
  const getGroupeName = () => {
    if (currentAppointment.groupe) {
      return currentAppointment.groupe.nom ||
        currentAppointment.groupe.intitule ||
        currentAppointment.groupe.nomGroupe ||
        `Groupe ${currentAppointment.groupe.id || currentAppointment.groupe.idGroupe}`;
    } else if (groupe) {
      return groupe.nom ||
        groupe.intitule ||
        groupe.nomGroupe ||
        `Groupe ${groupe.id || groupe.idGroupe}`;
    } else if (currentAppointment.idGroupe) {
      return `Groupe ${currentAppointment.idGroupe}`;
    }
    return 'Non spécifié';
  };

  // 🎯 FONCTION AMÉLIORÉE - Créer ou mettre à jour une association EtudeVolontaire
  const createEtudeVolontaireAssociation = async (etudeId, volontaireId, groupeId) => {
    try {
      console.log("🎯 Création/Mise à jour association EtudeVolontaire:", { etudeId, volontaireId, groupeId });

      // Récupérer l'IV du groupe si disponible
      let ivGroupe = 0;
      try {
        if (groupeId && groupeId > 0) {
          const groupeDetails = await groupeService.getById(groupeId);
          if (groupeDetails && groupeDetails.iv !== undefined) {
            ivGroupe = parseInt(groupeDetails.iv) || 0;
            console.log("💰 IV du groupe récupéré:", ivGroupe);
          }
        }
      } catch (err) {
        console.warn("⚠️ Impossible de récupérer l'IV du groupe:", err);
      }

      // Vérifier si l'association existe déjà
      const existingAssociationsResponse = await etudeVolontaireService.getVolontairesByEtude(etudeId);
      console.log("📋 Réponse getVolontairesByEtude:", existingAssociationsResponse);

      // Gérer différents formats de réponse
      let existingAssociations = [];
      if (Array.isArray(existingAssociationsResponse)) {
        existingAssociations = existingAssociationsResponse;
      } else if (existingAssociationsResponse && Array.isArray(existingAssociationsResponse.data)) {
        existingAssociations = existingAssociationsResponse.data;
      } else if (existingAssociationsResponse && existingAssociationsResponse.data) {
        existingAssociations = [existingAssociationsResponse.data];
      }

      console.log("📋 Associations existantes (normalisées):", existingAssociations);

      const existingAssoc = existingAssociations.find ?
        existingAssociations.find(assoc => parseInt(assoc.idVolontaire) === parseInt(volontaireId)) :
        null;

      if (existingAssoc) {
        console.log("🔄 Association existante trouvée:", existingAssoc);

        // Vérifier si des mises à jour sont nécessaires
        const needsUpdate =
          parseInt(existingAssoc.idGroupe || 0) !== parseInt(groupeId || 0) ||
          parseInt(existingAssoc.iv || 0) !== ivGroupe ||
          (existingAssoc.paye || 0) !== (ivGroupe > 0 ? 1 : 0);

        if (needsUpdate) {
          console.log("🔄 Mise à jour nécessaire de l'association EtudeVolontaire");

          // Créer l'ID de l'association pour la mise à jour
          const associationId = etudeVolontaireService.createAssociationId(
            existingAssoc.idEtude,
            existingAssoc.idGroupe,
            existingAssoc.idVolontaire,
            existingAssoc.iv,
            existingAssoc.numsujet,
            existingAssoc.paye,
            existingAssoc.statut
          );

          // Mettre à jour l'IV
          if (parseInt(existingAssoc.iv || 0) !== ivGroupe) {
            await etudeVolontaireService.updateIV(associationId, ivGroupe);
            console.log(`💰 IV mise à jour: ${existingAssoc.iv}€ -> ${ivGroupe}€`);
          }

          // Mettre à jour le statut de paiement si nécessaire
          const nouveauPaye = ivGroupe > 0 ? 1 : 0;
          if ((existingAssoc.paye || 0) !== nouveauPaye) {
            await etudeVolontaireService.updatePaye(associationId, nouveauPaye);
            console.log(`💳 Statut paiement mis à jour: ${existingAssoc.paye} -> ${nouveauPaye}`);
          }

          console.log("✅ Association EtudeVolontaire mise à jour avec succès");
        } else {
          console.log("ℹ️ Association EtudeVolontaire déjà à jour");
        }

        return existingAssoc;
      } else {
        // Créer une nouvelle association
        const associationData = {
          idEtude: parseInt(etudeId),
          idVolontaire: parseInt(volontaireId),
          idGroupe: parseInt(groupeId) || 0,
          iv: ivGroupe, // Utiliser l'IV du groupe
          numsujet: 0, // Numéro de sujet par défaut
          paye: ivGroupe > 0 ? 1 : 0, // Si IV > 0, alors payé
          statut: 'INSCRIT' // Statut par défaut
        };

        console.log("📋 Nouvelle association à créer:", associationData);

        const result = await etudeVolontaireService.create(associationData);
        console.log(`✅ Nouvelle association EtudeVolontaire créée: Étude ${etudeId}, Volontaire ${volontaireId}, Groupe ${groupeId}, IV: ${ivGroupe}€`);
        return result;
      }
    } catch (error) {
      console.error('❌ Erreur lors de la création/mise à jour de l\'association EtudeVolontaire:', error);
      // Ne pas faire échouer l'assignation du RDV si l'association échoue
      throw error;
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


  // 🆕 FONCTION SIMPLIFIÉE - Supprimer complètement l'association EtudeVolontaire
  const handleEtudeVolontaireOnUnassign = async (etudeId, volontaireId) => {
    try {
      console.log("🗑️ Suppression association EtudeVolontaire:", { etudeId, volontaireId });

      // Utiliser la méthode qui existe déjà dans votre service
      await etudeVolontaireService.desassignerVolontaireDEtude(etudeId, volontaireId);
      console.log("✅ Association EtudeVolontaire supprimée avec succès");

    } catch (error) {
      console.error('❌ Erreur lors de la suppression EtudeVolontaire:', error);
      // Ne pas faire échouer la désassignation du RDV si l'association échoue
    }
  };

  // Désassigner un volontaire
  const handleUnassignVolunteer = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const idEtude = currentAppointment.idEtude || currentAppointment.etude?.id;
      const idRdv = currentAppointment.idRdv || currentAppointment.id;
      const idGroupe = currentAppointment.idGroupe || currentAppointment.groupe?.id || currentAppointment.groupe?.idGroupe;
      const idVolontaire = currentAppointment.idVolontaire; // 🆕 Récupérer l'ID avant désassignation

      if (!idEtude || !idRdv) {
        throw new Error("ID d'étude ou de rendez-vous manquant");
      }

      // 1. 🆕 NOUVEAU - Gérer l'association EtudeVolontaire AVANT la désassignation du RDV
      if (idVolontaire && idEtude) {
        try {
          await handleEtudeVolontaireOnUnassign(idEtude, idVolontaire);
          console.log("✅ Association EtudeVolontaire gérée avec succès");
        } catch (assocError) {
          console.warn("⚠️ Erreur lors de la gestion de l'association EtudeVolontaire:", assocError);
          // On continue même si ça échoue
        }
      }

      // 2. Désassigner le volontaire du RDV (comme avant)
      const updatedData = {
        idEtude: idEtude,
        idRdv: idRdv,
        idVolontaire: null, // ❌ Désassigner le volontaire
        idGroupe: idGroupe, // ✅ GARDER le groupe
        date: currentAppointment.date,
        heure: currentAppointment.heure,
        duree: currentAppointment.duree,
        etat: currentAppointment.etat || 'PLANIFIE',
        commentaires: currentAppointment.commentaires
      };

      console.log("📋 Données envoyées pour désassigner (groupe conservé):", updatedData);

      const response = await rdvService.update(idEtude, idRdv, updatedData);

      if (response === false || (response?.error)) {
        throw new Error(response?.error?.message || 'Erreur lors de la désassignation');
      }

      // 3. Mettre à jour l'état local
      setCurrentAppointment(prev => ({
        ...prev,
        idVolontaire: null,
        volontaire: null
      }));

      setvolunteer(null);
      setShowAssignVolunteer(false);

      await refreshAppointmentData();
      console.log("✅ Volontaire désassigné avec succès");

      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      setError('Erreur lors de la désassignation du volontaire: ' + (err.message || 'Erreur inconnue'));
      console.error("❌ Erreur de désassignation:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 🎯 FONCTION MODIFIÉE - Assigner un volontaire au rendez-vous avec création EtudeVolontaire
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
      const idGroupe = currentAppointment.idGroupe || currentAppointment.groupe?.id || currentAppointment.groupe?.idGroupe;

      if (!idEtude || !idRdv) {
        throw new Error("ID d'étude ou de rendez-vous manquant");
      }

      console.log("🎯 Début assignation volontaire:", { idEtude, idRdv, selectedVolunteerId, idGroupe });

      // 1. 🆕 Créer l'association EtudeVolontaire AVANT la mise à jour du RDV
      if (idGroupe) {
        try {
          await createEtudeVolontaireAssociation(idEtude, selectedVolunteerId, idGroupe);
          console.log("✅ Association EtudeVolontaire créée avec succès");
        } catch (assocError) {
          console.warn("⚠️ Erreur lors de la création de l'association EtudeVolontaire:", assocError);
          // On continue même si l'association échoue
        }
      } else {
        console.warn("⚠️ Pas d'ID de groupe pour créer l'association EtudeVolontaire");
      }

      // 2. Mettre à jour le RDV avec le volontaire et le groupe
      const updatedData = {
        idEtude: idEtude,
        idRdv: idRdv,
        idVolontaire: selectedVolunteerId,
        idGroupe: idGroupe, // Inclure l'ID du groupe
        date: currentAppointment.date,
        heure: currentAppointment.heure,
        duree: currentAppointment.duree,
        etat: currentAppointment.etat || 'PLANIFIE',
        commentaires: currentAppointment.commentaires
      };

      console.log("📋 Données envoyées pour mettre à jour le RDV:", updatedData);

      // Appeler l'API pour mettre à jour le rendez-vous
      const response = await rdvService.update(idEtude, idRdv, updatedData);

      if (response === false || (response?.error)) {
        throw new Error(response?.error?.message || 'Erreur lors de l\'assignation');
      }

      console.log("✅ RDV mis à jour avec succès");

      // Mettre à jour localement l'affichage
      const selectedVolunteer = volunteers.find(v => v.id.toString() === selectedVolunteerId);

      setCurrentAppointment(prev => ({
        ...prev,
        idVolontaire: selectedVolunteerId,
        volontaire: selectedVolunteer || null
      }));


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

      await refreshAppointmentData();


      if (onRefresh) {
        onRefresh();
      }

      console.log("🎉 Assignation terminée avec succès!");

    } catch (err) {
      setError('Erreur lors de l\'affectation du volontaire: ' + (err.message || 'Erreur inconnue'));
      console.error("❌ Erreur d'assignation:", err);
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
      const idGroupe = currentAppointment.idGroupe || currentAppointment.groupe?.id || currentAppointment.groupe?.idGroupe;

      if (!idEtude || !idRdv) {
        throw new Error("ID d'étude ou de rendez-vous manquant");
      }

      console.log("Suppression du rendez-vous:", {
        idEtude,
        idRdv,
        idGroupe,
        volontaire: currentAppointment.idVolontaire
      });

      // Utiliser le service RDV pour supprimer le rendez-vous
      const response = await rdvService.delete(idEtude, idRdv);
      if (response === false || (response?.error)) {
        throw new Error(response?.error?.message || 'Erreur lors de la suppression');
      }
      onBack(); // Retourner à la vue précédente après suppression
    } catch (err) {
      setError('Erreur lors de la suppression: ' + err.message);
      console.error(err);
      setIsDeleting(false);
    }
  };

  // Nouvelle fonction pour recharger complètement les données
  const refreshAppointmentData = async () => {
    if (!currentAppointment?.idRdv) return;

    try {
      const idEtude = currentAppointment.idEtude || currentAppointment.etude?.id;
      const idRdv = currentAppointment.idRdv || currentAppointment.id;

      if (!idEtude || !idRdv) return;

      console.log("🔄 Rechargement des données du RDV...");
      const response = await rdvService.getById(idEtude, idRdv);

      if (response) {
        setCurrentAppointment(prev => ({
          ...prev,
          ...response,
          etude: response.etude || prev.etude,
          groupe: response.groupe || prev.groupe,
          volontaire: response.volontaire,
          idVolontaire: response.idVolontaire
        }));

        // Réinitialiser l'état du volontaire séparé
        setvolunteer(null);
        console.log("✅ Données rechargées avec succès");
      }
    } catch (err) {
      console.error("⚠️ Erreur lors du rechargement (non critique):", err);
      // Ne pas afficher d'erreur à l'utilisateur car c'est secondaire
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
                  {getGroupeName()}
                </span>
              </div>

              {/* Afficher les détails du groupe si disponibles */}
              {(groupe || currentAppointment.groupe) && (
                <div className="ml-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  {(groupe?.description || currentAppointment.groupe?.description) && (
                    <div className="text-sm text-gray-600 mb-2">
                      <strong>Description:</strong> {groupe?.description || currentAppointment.groupe?.description}
                    </div>
                  )}
                  {(groupe?.ageMin || currentAppointment.groupe?.ageMin) && (
                    <div className="text-sm text-gray-600 mb-2">
                      <strong>Âge:</strong> {groupe?.ageMin || currentAppointment.groupe?.ageMin} - {groupe?.ageMax || currentAppointment.groupe?.ageMax} ans
                    </div>
                  )}
                  {(groupe?.ethnie || currentAppointment.groupe?.ethnie) && (
                    <div className="text-sm text-gray-600 mb-2">
                      <strong>Ethnie:</strong> {groupe?.ethnie || currentAppointment.groupe?.ethnie}
                    </div>
                  )}
                  {(groupe?.iv !== undefined || currentAppointment.groupe?.iv !== undefined) && (
                    <div className="text-sm text-gray-600">
                      <strong>IV:</strong> {groupe?.iv || currentAppointment.groupe?.iv}€
                    </div>
                  )}
                </div>
              )}

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
                      {filteredVolunteers.map((volunteer, index) => (
                        <div
                          key={`volunteer-select-${volunteer.id || volunteer.volontaireId}-${index}`}
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