// hooks/useVolunteerNotifications.js
import { useNotifications } from './useNotifications';

export const useVolunteerNotifications = () => {
  const { addNotification } = useNotifications();

  const notifyVolunteerAdded = (volunteerName = 'Anonyme') => {
    addNotification({
      type: 'volunteer_added',
      title: 'Nouveau volontaire',
      message: `${volunteerName} s'est inscrit comme volontaire`,
      icon: 'user-plus',
      priority: 'normal'
    });
  };

  const notifyAppointmentScheduled = (details) => {
    addNotification({
      type: 'appointment_scheduled',
      title: 'Rendez-vous planifié',
      message: `Nouveau RDV planifié pour ${details.date}`,
      icon: 'calendar-plus',
      priority: 'high'
    });
  };

  const notifyStudyCreated = (studyName) => {
    addNotification({
      type: 'study_created',
      title: 'Nouvelle étude',
      message: `L'étude "${studyName}" a été créée`,
      icon: 'file-text',
      priority: 'normal'
    });
  };

  return {
    notifyVolunteerAdded,
    notifyAppointmentScheduled,
    notifyStudyCreated
  };
};