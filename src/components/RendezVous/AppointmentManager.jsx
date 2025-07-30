import { useState, useEffect } from 'react';
import AppointmentCreator from './AppointmentCreator';
import AppointmentBatchCreator from './AppointmentBatchCreator';
import AppointmentViewer from './AppointmentViewer';
import AppointmentEditor from './AppointmentEditor';
import AppointmentCalendar from './AppointmentCalendar';
import AppointmentsByStudy from './AppointmentsByStudy';
import volontaireService from '../../services/volontaireService';
import etudeService from '../../services/etudeService';

const AppointmentManager = () => {
  const [view, setView] = useState('calendar'); // 'calendar', 'create', 'createBatch', 'view', 'edit', 'byStudy'
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedStudy, setSelectedStudy] = useState(null);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [volunteers, setVolunteers] = useState([]);
  const [studies, setStudies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [needsRefresh, setNeedsRefresh] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);

        // Charger les volontaires
        try {
          const volunteersResponse = await volontaireService.getAllWithoutPagination();
          // S'assurer que volunteers est toujours un tableau
          const volunteersData = volunteersResponse || [];
          setVolunteers(Array.isArray(volunteersData) ? volunteersData : []);

          console.log("Volontaires chargés:", volunteersData);
          setVolunteers(volunteersData);
        } catch (volError) {
          console.error("Erreur lors du chargement des volontaires:", volError);
          setVolunteers([]);
        }

        // Charger les études
        try {
          const studiesResponse = await etudeService.getAll();
          const studiesData = studiesResponse?.data || studiesResponse || [];

          // Transformer en format attendu par le composant
          const formattedStudies = Array.isArray(studiesData)
            ? studiesData.map(study => ({
              id: study.idEtude || study.id,
              ref: study.ref,
              titre: study.titre,
              dateDebut: study.dateDebut,
              dateFin: study.dateFin,
              groups: study.groups || [], // Les groupes doivent être chargés séparément
            }))
            : [];

          setStudies(formattedStudies);
        } catch (studyError) {
          console.error("Erreur lors du chargement des études:", studyError);
          setStudies([]);
        }
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des données: ' + err.message);
      console.error("Erreur globale:", err);
    } finally {
      setIsLoading(false);
    }
  };

  loadInitialData();
}, [needsRefresh]);

const handleAppointmentClick = (appointment) => {
  // Si l'objet rendez-vous n'a pas d'idEtude et idRdv, essayer de les récupérer
  if (!appointment.idEtude || !appointment.idRdv) {
    // Adaptation des propriétés si le format est différent
    appointment.idEtude = appointment.idEtude || appointment.etude?.id;
    appointment.idRdv = appointment.idRdv || appointment.id;
  }

  setSelectedAppointment(appointment);
  setView('view');
};

const handleStudySelect = (study) => {
  setSelectedStudy(study);
};

const handleVolunteerSelect = (volunteer) => {
  setSelectedVolunteer(volunteer);
};

const handleCreateClick = () => {
  setSelectedAppointment(null);
  setView('create');
};

const handleCreateBatchClick = () => {
  setSelectedAppointment(null);
  setView('createBatch');
};

const handleByStudyClick = () => {
  setSelectedAppointment(null);
  setView('byStudy');
};

const handleEditClick = (appointment) => {
  setSelectedAppointment(appointment);
  setView('edit');
};

const handleBackClick = () => {
  setView('calendar');
  setSelectedAppointment(null);
};

const handleOperationSuccess = () => {
  setNeedsRefresh(!needsRefresh); // Toggle to trigger a refresh
  setView('calendar');
  setSelectedAppointment(null);
};

if (isLoading) {
  return (
    <div className="p-4 text-center">
      <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
      <p>Chargement des données...</p>
    </div>
  );
}

if (error) {
  return (
    <div className="p-4 text-center text-red-600">
      <div className="mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <p className="text-lg font-medium">{error}</p>
      <button 
        onClick={() => setNeedsRefresh(!needsRefresh)}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Réessayer
      </button>
    </div>
  );
}

return (
  <div className="container mx-auto p-4">
    <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
      <h1 className="text-2xl font-bold text-gray-800">Gestion des Rendez-vous</h1>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setView('calendar')}
          className={`px-4 py-2 rounded ${view === 'calendar' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Calendrier
        </button>
        <button
          onClick={handleByStudyClick}
          className={`px-4 py-2 rounded ${view === 'byStudy' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Par étude
        </button>
        <button
          onClick={handleCreateClick}
          className={`px-4 py-2 rounded ${view === 'create' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Créer un RDV
        </button>
        <button
          onClick={handleCreateBatchClick}
          className={`px-4 py-2 rounded ${view === 'createBatch' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Créer plusieurs RDV
        </button>
      </div>
    </div>

    {view === 'calendar' && (
      <AppointmentCalendar 
        onAppointmentClick={handleAppointmentClick} 
      />
    )}

    {view === 'byStudy' && (
      <AppointmentsByStudy
        studies={studies}
        onAppointmentClick={handleAppointmentClick}
        onBack={handleBackClick}
      />
    )}

    {view === 'create' && (
      <AppointmentCreator
        volunteers={volunteers}
        studies={studies}
        selectedVolunteer={selectedVolunteer}
        selectedStudy={selectedStudy}
        onVolunteerSelect={handleVolunteerSelect}
        onStudySelect={handleStudySelect}
        onBack={handleBackClick}
        onSuccess={handleOperationSuccess}
      />
    )}

    {view === 'createBatch' && (
      <AppointmentBatchCreator
        studies={studies}
        selectedStudy={selectedStudy}
        onStudySelect={handleStudySelect}
        onBack={handleBackClick}
        onSuccess={handleOperationSuccess}
      />
    )}

    {view === 'view' && selectedAppointment && (
      <AppointmentViewer
        appointment={selectedAppointment}
        onEdit={() => handleEditClick(selectedAppointment)}
        onBack={handleBackClick}
        onRefresh={() => setNeedsRefresh(!needsRefresh)}
      />
    )}

    {view === 'edit' && selectedAppointment && (
      <AppointmentEditor
        appointment={selectedAppointment}
        volunteers={volunteers}
        onBack={handleBackClick}
        onSuccess={handleOperationSuccess}
      />
    )}
  </div>
);
};

export default AppointmentManager;