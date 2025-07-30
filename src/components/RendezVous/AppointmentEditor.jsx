import { useState, useEffect } from 'react';
import rdvService from '../../services/rdvService';

const AppointmentEditor = ({
  appointment,
  volunteers,
  onBack,
  onSuccess
}) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [status, setStatus] = useState('PLANIFIE');
  const [comments, setComments] = useState('');
  const [selectedVolunteerId, setSelectedVolunteerId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Initialiser les valeurs du formulaire avec celles du rendez-vous
  useEffect(() => {
    if (appointment) {
      // Formater la date pour l'input type="date"
      if (appointment.date) {
        const dateObj = new Date(appointment.date);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        setDate(`${year}-${month}-${day}`);
      }

      if (appointment.heure) {
        setTime(appointment.heure);
      }

      if (appointment.etat) {
        setStatus(appointment.etat);
      }

      if (appointment.commentaires) {
        setComments(appointment.commentaires);
      }

      if (appointment.volontaire && appointment.volontaire.id) {
        setSelectedVolunteerId(appointment.volontaire.id.toString());
      }
    }
  }, [appointment]);

  // Mettre à jour le rendez-vous
  const handleSubmit = async () => {
    if (!date) {
      setError('La date est obligatoire');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const updatedData = {
        idEtude: appointment.idEtude,
        idRdv: appointment.idRdv,
        date,
        heure: time,
        etat: status,
        commentaires: comments,
        idVolontaire: selectedVolunteerId || null
      };

      // Utiliser le service RDV pour mettre à jour le rendez-vous
      const response = await rdvService.update(appointment.idEtude, appointment.idRdv, updatedData);
      if (!response || (response.error && response.error.message)) {
        throw new Error(response.error?.message || 'Erreur lors de la mise à jour');
      }
      if (onSuccess) {
        onSuccess();
      } else {
        onBack();
      }

    } catch (err) {
      setError('Erreur lors de la mise à jour du rendez-vous: ' + err.message);
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

  const timeOptions = generateTimeOptions();

  return (
    <div className="bg-white shadow-md rounded-lg p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Modifier le rendez-vous</h2>
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
          {/* Étude et groupe (en lecture seule) */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Étude
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100"
              value={appointment.etude ? `${appointment.etude.ref} - ${appointment.etude.titre}` : 'Non spécifiée'}
              disabled
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Groupe
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100"
              value={appointment.groupe ? appointment.groupe.nom : 'Non spécifié'}
              disabled
            />
          </div>

          {/* Sélection de volontaire */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Volontaire
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={selectedVolunteerId}
              onChange={(e) => setSelectedVolunteerId(e.target.value)}
            >
              <option value="">Aucun (RDV sans volontaire)</option>
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
            {isSubmitting ? 'Sauvegarde en cours...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentEditor;