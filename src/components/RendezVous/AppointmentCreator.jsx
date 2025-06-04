import { useState } from 'react';
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
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(30);
  const [comments, setComments] = useState('');
  const [group, setGroup] = useState('');
  const [status, setStatus] = useState('PLANIFIE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [groups, setGroups] = useState([]);

  // Charger les groupes lorsqu'une étude est sélectionnée
  const handleStudyChange = (studyId) => {
    const study = studies.find(s => s.id === studyId);
    onStudySelect(study);
    loadGroupsForStudy(studyId);
    setGroup('');
  };

  const handleSubmit = async () => {
    if (!date || !time) {
      setError('La date et l\'heure sont obligatoires');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const appointmentData = {
        date,
        heure: time,
        duree: duration,
        commentaires: comments,
        etat: status,
        idEtude: selectedStudy?.id || null,
        idGroupe: group || null,
        idVolontaire: selectedVolunteer?.id || null,
      };

      // Utiliser le service RDV pour créer le rendez-vous
      const response = await rdvService.create(appointmentData);
      const result = response.data || response;

      // Réinitialiser le formulaire
      setDate('');
      setTime('');
      setDuration(30);
      setComments('');

      if (onSuccess) {
        onSuccess(result);
      }

    } catch (err) {
      setError('Erreur lors de la création du rendez-vous: ' + err.message);
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadGroupsForStudy = async (studyId) => {
    try {
      // Dans une vraie application, vous feriez un appel API ici
      // Ex: const groupsResponse = await groupService.getByStudyId(studyId);
      // const groups = groupsResponse.data || groupsResponse;

      // Pour l'instant, nous utilisons les groupes stockés localement dans l'objet study
      const study = studies.find(s => s.id === studyId);

      if (study && study.groups) {
        setGroups(study.groups);
      } else {
        setGroups([]);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des groupes:", err);
      setGroups([]);
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
              value={selectedStudy?.id || ''}
              onChange={(e) => handleStudyChange(e.target.value)}
            >
              <option value="">Sélectionner une étude</option>
              {studies.map(study => (
                <option key={study.id} value={study.id}>
                  {study.ref} - {study.titre}
                </option>
              ))}
            </select>
          </div>

          {/* Sélection de groupe (si une étude est sélectionnée) */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Groupe
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              disabled={!selectedStudy || groups.length === 0}
            >
              <option value="">Sélectionner un groupe</option>
              {groups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.intitule}
                </option>
              ))}
            </select>
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
              Date (JJ-MM-AAAA)
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
              {timeOptions.map((time, index) => (
                <option key={index} value={time}>{time}</option>
              ))}
            </select>
          </div>

          {/* Durée */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Durée (min)
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
            >
              {durationOptions.map((duration, index) => (
                <option key={index} value={duration}>{duration}</option>
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
            disabled={isSubmitting}
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