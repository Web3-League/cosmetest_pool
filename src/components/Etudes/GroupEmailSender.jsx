import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const GroupEmailSender = ({ studyId, studyRef, studyTitle, onClose }) => {
  const [volunteers, setVolunteers] = useState([]);
  const [selectedVolunteers, setSelectedVolunteers] = useState(new Set());
  const [emailData, setEmailData] = useState({
    subject: '',
    message: ''
  });
  const [isLoadingVolunteers, setIsLoadingVolunteers] = useState(true);
  const [error, setError] = useState(null);

  // Charger les volontaires de l'étude
  useEffect(() => {
    const fetchVolunteers = async () => {
      try {
        setIsLoadingVolunteers(true);
        setError(null);

        // Récupérer les associations étude-volontaire
        const associationsResponse = await api.get(`/etude-volontaires/etude/${studyId}`);
        const associations = associationsResponse.data.data || [];

        // Récupérer les détails de chaque volontaire
        const volunteersPromises = associations.map(async (assoc) => {
          try {
            const volunteerResponse = await api.get(`/volontaires/${assoc.idVolontaire}`);
            return {
              ...volunteerResponse.data,
              numsujet: assoc.numsujet,
              statut: assoc.statut
            };
          } catch (error) {
            console.error(`Erreur pour volontaire ${assoc.idVolontaire}:`, error);
            return null;
          }
        });

        const volunteersData = await Promise.all(volunteersPromises);
        const validVolunteers = volunteersData
          .filter(volunteer => volunteer && volunteer.email)
          .sort((a, b) => (a.nom || '').localeCompare(b.nom || ''));

        setVolunteers(validVolunteers);
        
        // Sélectionner tous les volontaires par défaut
        setSelectedVolunteers(new Set(validVolunteers.map(v => v.idVolontaire)));

        // Initialiser le sujet avec la référence de l'étude
        setEmailData(prev => ({
          ...prev,
          subject: `Information étude ${studyRef || studyId}${studyTitle ? ` - ${studyTitle}` : ''}`
        }));

      } catch (error) {
        console.error('Erreur lors du chargement des volontaires:', error);
        setError('Impossible de charger la liste des volontaires.');
      } finally {
        setIsLoadingVolunteers(false);
      }
    };

    if (studyId) {
      fetchVolunteers();
    }
  }, [studyId, studyRef, studyTitle]);

  const handleVolunteerToggle = (volunteerId) => {
    setSelectedVolunteers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(volunteerId)) {
        newSet.delete(volunteerId);
      } else {
        newSet.add(volunteerId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedVolunteers.size === volunteers.length) {
      setSelectedVolunteers(new Set());
    } else {
      setSelectedVolunteers(new Set(volunteers.map(v => v.idVolontaire)));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEmailData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateMailtoLink = () => {
    const selectedVolunteerData = volunteers.filter(v => selectedVolunteers.has(v.idVolontaire));
    
    if (selectedVolunteerData.length === 0) {
      setError('Veuillez sélectionner au moins un volontaire.');
      return null;
    }

    if (!emailData.subject.trim()) {
      setError('Veuillez remplir le sujet.');
      return null;
    }

    // Construire la liste des emails
    const emails = selectedVolunteerData.map(volunteer => volunteer.email).join(';');
    
    // Encoder le sujet et le message pour l'URL
    const encodedSubject = encodeURIComponent(emailData.subject);
    const encodedMessage = encodeURIComponent(emailData.message || '');
    
    // Construire le lien mailto
    const mailtoLink = `mailto:${emails}?subject=${encodedSubject}&body=${encodedMessage}`;
    
    return mailtoLink;
  };

  const handleOpenOutlook = () => {
    setError(null);
    
    const mailtoLink = generateMailtoLink();
    if (mailtoLink) {
      // Ouvrir Outlook avec le lien mailto
      window.location.href = mailtoLink;
      
      // Fermer le composant après un court délai
      setTimeout(() => {
        onClose();
      }, 500);
    }
  };

  const getSelectedEmails = () => {
    return volunteers
      .filter(v => selectedVolunteers.has(v.idVolontaire))
      .map(v => v.email)
      .join('; ');
  };

  if (isLoadingVolunteers) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
        <span className="ml-2">Chargement des volontaires...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">
          Composer un email de groupe
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Sujet */}
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
            Sujet *
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={emailData.subject}
            onChange={handleInputChange}
            className="form-input w-full"
            required
            placeholder="Sujet de l'email"
          />
        </div>

        {/* Message */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Message (optionnel)
          </label>
          <textarea
            id="message"
            name="message"
            value={emailData.message}
            onChange={handleInputChange}
            rows={6}
            className="form-textarea w-full"
            placeholder="Rédigez votre message ici..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Le message sera pré-rempli dans Outlook. Vous pourrez le modifier avant l'envoi.
          </p>
        </div>

        {/* Sélection des destinataires */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Destinataires ({volunteers.length} volontaires disponibles)
            </label>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-sm text-primary-600 hover:text-primary-800"
            >
              {selectedVolunteers.size === volunteers.length ? 'Désélectionner tout' : 'Sélectionner tout'}
            </button>
          </div>
          
          <div className="max-h-60 overflow-y-auto border rounded-lg p-3 bg-gray-50">
            {volunteers.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Aucun volontaire avec email trouvé pour cette étude.
              </p>
            ) : (
              <div className="space-y-2">
                {volunteers.map((volunteer) => (
                  <label key={volunteer.idVolontaire} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedVolunteers.has(volunteer.idVolontaire)}
                      onChange={() => handleVolunteerToggle(volunteer.idVolontaire)}
                      className="form-checkbox h-4 w-4 text-primary-600"
                    />
                    <span className="ml-3 text-sm">
                      <span className="font-medium">
                        {volunteer.prenom} {volunteer.nom}
                      </span>
                      <span className="text-gray-500 ml-2">
                        ({volunteer.email})
                      </span>
                      {volunteer.numsujet && (
                        <span className="text-primary-600 ml-2 text-xs">
                          Sujet #{volunteer.numsujet}
                        </span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
          
          {selectedVolunteers.size > 0 && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700 font-medium mb-1">
                {selectedVolunteers.size} volontaire(s) sélectionné(s)
              </p>
              <p className="text-xs text-gray-600 break-all">
                <strong>Emails :</strong> {getSelectedEmails()}
              </p>
            </div>
          )}
        </div>

        {/* Aperçu du lien mailto */}
        {selectedVolunteers.size > 0 && emailData.subject && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-green-800">
                Prêt à ouvrir Outlook avec {selectedVolunteers.size} destinataire(s)
              </span>
            </div>
          </div>
        )}

        {/* Boutons d'action */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleOpenOutlook}
            className="btn btn-primary"
            disabled={selectedVolunteers.size === 0 || !emailData.subject.trim()}
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Ouvrir dans Outlook ({selectedVolunteers.size})
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupEmailSender;