// contexts/NotificationContext.jsx
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../services/api';

export const NotificationContext = createContext();

// Configuration de l'URL de base de l'API (comme dans Dashboard)
const API_URL = 
  import.meta.env?.VITE_API_URL || 
  import.meta.env?.VITE_REACT_APP_API_URL || 
  '';

const notificationReducer = (state, action) => {
  switch (action.type) {
    case 'LOAD_STATS_FROM_API': {
      const statsJour = action.payload;
      const volontairesAjoutes = statsJour.volontairesAjoutes || 0;
      
      console.log('🔄 LOAD_STATS_FROM_API triggered'); // DEBUG
      console.log('📈 volontairesAjoutes:', volontairesAjoutes); // DEBUG
      
      // Vérifier si ces volontaires ont déjà été consultés
      const lastConsulted = localStorage.getItem('volunteers_last_consulted');
      const lastConsultedCount = lastConsulted ? parseInt(lastConsulted) : 0;
      
      console.log('💾 lastConsultedCount:', lastConsultedCount); // DEBUG
      
      // Calculer le nombre de nouveaux volontaires non consultés
      const unreadVolunteersCount = Math.max(0, volontairesAjoutes - lastConsultedCount);
      
      console.log('🔔 unreadVolunteersCount calculated:', unreadVolunteersCount); // DEBUG
      
      return {
        ...state,
        totalVolunteersToday: volontairesAjoutes,
        unreadVolunteersCount,
        lastConsultedCount
      };
    }

    case 'MARK_VOLUNTEERS_AS_CONSULTED': {
      const newConsultedCount = state.totalVolunteersToday;
      localStorage.setItem('volunteers_last_consulted', newConsultedCount.toString());
      
      return {
        ...state,
        unreadVolunteersCount: 0,
        lastConsultedCount: newConsultedCount
      };
    }

    case 'ADD_LOCAL_NOTIFICATION': {
      // Pour les notifications de test locales
      const newNotification = {
        id: 'local_' + Date.now() + Math.random(),
        ...action.payload,
        isRead: false,
        timestamp: new Date().toISOString(),
        isLocal: true
      };
      
      const localNotifications = JSON.parse(localStorage.getItem('local_notifications') || '[]');
      const updatedLocalNotifications = [newNotification, ...localNotifications];
      localStorage.setItem('local_notifications', JSON.stringify(updatedLocalNotifications));
      
      return {
        ...state,
        notifications: [newNotification, ...state.notifications]
      };
    }

    default:
      return state;
  }
};

export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, {
    totalVolunteersToday: 0,
    unreadVolunteersCount: 0,
    lastConsultedCount: 0,
    notifications: []
  });

  // Charger les stats du jour depuis l'API (même route que Dashboard)
  useEffect(() => {
    const fetchVolunteerStats = async () => {
      try {
        console.log('🔍 Fetching volunteer stats...'); // DEBUG
        const axiosConfig = { timeout: 10000 };
        const statsJourResponse = await api.get(`${API_URL}/api/dashboard/stats-jour`, axiosConfig);
        
        console.log('📊 Stats received:', statsJourResponse.data); // DEBUG
        console.log('👥 Volontaires ajoutés:', statsJourResponse.data.volontairesAjoutes); // DEBUG
        
        dispatch({
          type: 'LOAD_STATS_FROM_API',
          payload: statsJourResponse.data
        });
        
      } catch (error) {
        console.error('❌ Erreur lors du chargement des stats du jour pour notifications:', error);
        // En cas d'erreur, garder les valeurs par défaut
      }
    };
    
    fetchVolunteerStats();
  }, []);

  const markVolunteersAsConsulted = () => {
    dispatch({
      type: 'MARK_VOLUNTEERS_AS_CONSULTED'
    });
  };

  const addNotification = (notification) => {
    dispatch({
      type: 'ADD_LOCAL_NOTIFICATION',
      payload: notification
    });
  };

  const value = {
    totalVolunteersToday: state.totalVolunteersToday,
    unreadVolunteersCount: state.unreadVolunteersCount,
    notifications: state.notifications,
    markVolunteersAsConsulted,
    addNotification,
    // Compatibilité avec l'ancien système
    unreadCount: state.unreadVolunteersCount,
    markAsRead: () => {},
    markAllAsRead: markVolunteersAsConsulted
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications doit être utilisé dans un NotificationProvider');
  }
  return context;
};