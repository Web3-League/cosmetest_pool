import { useState, useEffect } from 'react';
import api from '../../services/api';
import rdvService from '../../services/rdvService';

const AppointmentCreator = ({
  volunteers,
  studies,
  selectedVolunteer,
  selectedStudy,
  onVolunteerSelect,
  onStudySelect,
  onBack,
  onSuccess
}) => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(30);
  const [status, setStatus] = useState('PLANIFIE');
  const [comments, setComments] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStudyId, setCurrentStudyId] = useState(selectedStudy?.id || '');
  const [loadingGroups, setLoadingGroups] = useState(false);

  // Effet pour maintenir la synchronisation entre props et état local
  useEffect(() => {
    if (selectedStudy?.id && selectedStudy.id !== currentStudyId) {
      setCurrentStudyId(selectedStudy.id);
      loadGroupsForStudy(selectedStudy.id);
    }
  }, [selectedStudy, currentStudyId]);

  // Fonction pour charger les groupes d'une étude via l'API
  const loadGroupsForStudy = async (studyId) => {
    if (!studyId) return;
    
    try {
      setLoadingGroups(true);
      setError(null);
      console.log(`Chargement des groupes pour l'étude ID: ${studyId}`);
      
      // Appel à l'API REST pour récupérer les groupes de l'étude
      const response = await api.get(`/groupes/etude/${studyId}`);
      
      // Déterminer si la réponse est un tableau ou contient un sous-objet 'content'
      let groupsData = response.data;
      if (response.data && response.data.content && Array.isArray(response.data.content)) {
        groupsData = response.data.content;
      } else if (!Array.isArray(response.data)) {
        console.warn("Format de réponse inattendu:", response.data);
        groupsData = [];
      }
      
      console.log("Données de groupes extraites:", groupsData);
      
      // Simplement configurer les données brutes - ne pas trop les traiter
      const formattedGroups = groupsData.map(group => {
        return {
          ...group,
          // S'assurer que les propriétés essentielles existent
          id: group.idGroupe,
          intitule: group.intitule || group.nom || `Groupe ${group.id}`
        };
      });
      
      console.log('Groupes formatés:', formattedGroups);
      setGroups(formattedGroups);
      
      // Réinitialiser le groupe sélectionné seulement lors du changement d'étude
      setSelectedGroup('');
    } catch (err) {
      console.error('Erreur lors du chargement des groupes:', err);
      setError(`Erreur lors du chargement des groupes: ${err.message}`);
      setGroups([]);
    } finally {
      setLoadingGroups(false);
    }
  };

  // Charger les groupes lorsqu'une étude est sélectionnée
  const handleStudyChange = (studyId) => {
    setCurrentStudyId(studyId);
    const study = studies.find(s => s.id === studyId);
    onStudySelect(study);

    // Charger les groupes via l'API REST
    loadGroupsForStudy(studyId);
  };

  const handleSubmit = async () => {
    // Validation des entrées
    if (!currentStudyId) {
      setError('Veuillez sélectionner une étude');
      return;
    }

    if (!date || !time) {
      setError('La date et l\'heure sont obligatoires');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Récupérer l'étude actuelle à partir de l'ID local
      const currentStudy = studies.find(s => s.id === currentStudyId);
      
      // Convertir les IDs en nombres pour le backend
      let studyId, groupId = null;
      
      try {
        studyId = parseInt(currentStudyId, 10);
        if (isNaN(studyId)) {
          throw new Error(`ID d'étude non numérique: ${currentStudyId}`);
        }
        
        if (selectedGroup) {
          groupId = parseInt(selectedGroup, 10);
          if (isNaN(groupId)) {
            throw new Error(`ID de groupe non numérique: ${selectedGroup}`);
          }
        }
      } catch (convErr) {
        console.error("Erreur de conversion:", convErr);
        throw new Error(`Erreur de conversion: ${convErr.message}`);
      }

      console.log("IDs numériques - Étude:", studyId, "Groupe:", groupId);

      // Préparer les données pour l'API
      const appointmentData = {
        idEtude: studyId,
        idGroupe: groupId,
        idVolontaire: selectedVolunteer?.id || null,
        date: date,
        heure: time,
        duree: duration,
        etat: status,
        commentaires: comments
      };

      console.log("Données à envoyer:", JSON.stringify(appointmentData, null, 2));

      // Créer le rendez-vous
      const response = await rdvService.create(appointmentData);
      
      // Vérifier si la réponse est valide
      if (!response || (response.error && response.error.message)) {
        throw new Error(response.error?.message || 'Erreur lors de la création du rendez-vous');
      }
      
      const result = response.data || response;

      // Réinitialiser seulement les champs de base, garder étude et groupe
      setDate('');
      setTime('');
      setDuration(30);
      setComments('');

      if (onSuccess) {
        // S'assurer que l'étude reste sélectionnée avant d'appeler onSuccess
        onStudySelect(currentStudy);
        onSuccess(result);
      }

    } catch (err) {
      setError('Erreur lors de la création du rendez-vous: ' + err.message);
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Générer les options d'heures (de 7h à 23h par paliers de 5 minutes)
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 7; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 5) {
        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMinute = minute.toString().padStart(2, '0');
        options.push(`${formattedHour}h${formattedMinute}`);
      }
    }
    return options;
  };

  // Générer les options de durée (de 5 à 360 minutes par paliers de 5)
  const generateDurationOptions = () => {
    const options = [];
    for (let i = 5; i <= 360; i += 5) {
      options.push(i);
    }
    return options;
  };

  // Inspéction de la structure des groupes disponibles
  const inspectGroups = () => {
    if (!groups || groups.length === 0) return null;
    
    const sample = groups[0];
    const keys = Object.keys(sample);
    
    return (
      <div className="text-xs mt-2 p-2 bg-gray-100 rounded">
        <p>Structure du premier groupe ({groups.length} groupes au total):</p>
        <ul className="list-disc pl-4">
          {keys.map(key => (
            <li key={key}>
              {key}: {typeof sample[key] === 'object' 
                ? 'objet' 
                : JSON.stringify(sample[key])}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const timeOptions = generateTimeOptions();
  const durationOptions = generateDurationOptions();

  return (
    <div className="bg-white shadow-md rounded-lg p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Créer un rendez-vous</h2>
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

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sélection d'étude */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Étude
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={currentStudyId}
              onChange={(e) => handleStudyChange(e.target.value)}
            >
              <option value="">Sélectionner une étude</option>
              {[...studies].reverse().map(study => (
                <option key={study.id} value={study.id}>
                  {study.ref} - {study.titre}
                </option>
              ))}
            </select>
          </div>

          {/* Sélection de groupe */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Groupe (facultatif)
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              disabled={!currentStudyId || loadingGroups}
            >
              <option value="">
                {loadingGroups 
                  ? "Chargement des groupes..." 
                  : groups.length === 0 
                    ? "Aucun groupe disponible" 
                    : "Sélectionner un groupe (optionnel)"}
              </option>
              {groups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.intitule}
                </option>
              ))}
            </select>
            
            {loadingGroups && (
              <p className="mt-1 text-sm text-blue-600">
                Chargement des groupes en cours...
              </p>
            )}
            
            {groups.length === 0 && currentStudyId && !loadingGroups && (
              <div>
                <p className="mt-1 text-sm text-yellow-600">
                  Aucun groupe trouvé pour cette étude.
                </p>
                <button 
                  onClick={() => loadGroupsForStudy(currentStudyId)}
                  className="mt-1 text-xs text-blue-600 underline"
                >
                  Essayer de recharger les groupes
                </button>
              </div>
            )}
            
            {selectedGroup && (
              <p className="mt-1 text-xs text-gray-500">
                ID du groupe: {selectedGroup}
              </p>
            )}
            
            {groups.length > 0 && inspectGroups()}
          </div>

          {/* Sélection de volontaire */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Volontaire (facultatif)
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={selectedVolunteer?.id || ''}
              onChange={(e) => {
                const volunteer = volunteers.find(v => v.id.toString() === e.target.value);
                onVolunteerSelect(volunteer || null);
              }}
            >
              <option value="">Aucun (créer RDV sans volontaire)</option>
              {volunteers.map(volunteer => (
                <option key={volunteer.id} value={volunteer.id}>
                  {volunteer.nom} {volunteer.prenom}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Date
            </label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Heure */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Heure
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            >
              <option value="">Sélectionner une heure</option>
              {timeOptions.map((timeOption, index) => (
                <option key={index} value={timeOption}>{timeOption}</option>
              ))}
            </select>
          </div>

          {/* Durée */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Durée (minutes)
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
            >
              {durationOptions.map((durationOption, index) => (
                <option key={index} value={durationOption}>{durationOption}</option>
              ))}
            </select>
          </div>

          {/* Statut */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              État
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="PLANIFIE">Planifié</option>
              <option value="CONFIRME">Confirmé</option>
              <option value="EN_ATTENTE">En attente</option>
              <option value="ANNULE">Annulé</option>
              <option value="COMPLETE">Complété</option>
            </select>
          </div>
        </div>

        {/* Commentaires */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Commentaires
          </label>
          <textarea
            className="w-full border border-gray-300 rounded-md px-3 py-2 min-h-[100px]"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
          />
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !currentStudyId}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Création en cours...' : 'Créer le rendez-vous'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentCreator;