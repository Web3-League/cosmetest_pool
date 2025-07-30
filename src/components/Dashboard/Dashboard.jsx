import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDate } from '../../utils/dateUtils';

// Import des icônes
import calendarSvg from '../../assets/icons/calendar.svg';
import usersSvg from '../../assets/icons/users.svg';
import clipboardSvg from '../../assets/icons/clipboard.svg';
import studySvg from '../../assets/icons/study.svg';
import chartSvg from '../../assets/icons/chart.svg';
import chevronRightSvg from '../../assets/icons/chevron-right.svg';
import plusSvg from '../../assets/icons/add.svg';
import userPlusSvg from '../../assets/icons/user-plus.svg';
import fileTextSvg from '../../assets/icons/file-text.svg';
import calendarPlusSvg from '../../assets/icons/calendar-plus.svg';
import graphSvg from '../../assets/icons/graph.svg';
import calendarEventSvg from '../../assets/icons/calendar-event.svg';

import api from '../../services/api'; // Importez votre service API


// Configuration de l'URL de base de l'API
// Utilisons une solution compatible avec différents environnements
const API_URL = 
  import.meta.env?.VITE_API_URL || 
  import.meta.env?.VITE_REACT_APP_API_URL || 
  '';

console.log('API URL:', API_URL); // Pour déboguer

// Définir les composants d'icônes
const CalendarIcon = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={calendarSvg} width={width} height={height} className={className} alt="Calendar" {...props} />
);

const UsersIcon = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={usersSvg} width={width} height={height} className={className} alt="Users" {...props} />
);

const ClipboardIcon = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={clipboardSvg} width={width} height={height} className={className} alt="Clipboard" {...props} />
);

const StudyIcon = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={studySvg} width={width} height={height} className={className} alt="Study" {...props} />
);

const ChartIcon = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={chartSvg} width={width} height={height} className={className} alt="Chart" {...props} />
);

const ChevronRightIcon = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={chevronRightSvg} width={width} height={height} className={className} alt="Chevron Right" {...props} />
);

const PlusIcon = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={plusSvg} width={width} height={height} className={className} alt="Plus" {...props} />
);

const UserPlusIcon = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={userPlusSvg} width={width} height={height} className={className} alt="User Plus" {...props} />
);

const FileTextIcon = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={fileTextSvg} width={width} height={height} className={className} alt="File Text" {...props} />
);

const CalendarPlusIcon = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={calendarPlusSvg} width={width} height={height} className={className} alt="Calendar Plus" {...props} />
);

const GraphIcon = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={graphSvg} width={width} height={height} className={className} alt="Graph" {...props} />
);

const CalendarEventIcon = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={calendarEventSvg} width={width} height={height} className={className} alt="Calendar Event" {...props} />
);

// Composant StatCard
const StatCard = ({ title, value, color, icon }) => {
  const getColorClasses = () => {
    switch (color) {
      case 'blue':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-800',
          iconBg: 'bg-blue-200',
          hover: 'hover:bg-blue-50',
          shadow: 'shadow-blue-100'
        };
      case 'green':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          iconBg: 'bg-green-200',
          hover: 'hover:bg-green-50',
          shadow: 'shadow-green-100'
        };
      case 'yellow':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          iconBg: 'bg-yellow-200',
          hover: 'hover:bg-yellow-50',
          shadow: 'shadow-yellow-100'
        };
      case 'purple':
        return {
          bg: 'bg-purple-100',
          text: 'text-purple-800',
          iconBg: 'bg-purple-200',
          hover: 'hover:bg-purple-50',
          shadow: 'shadow-purple-100'
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          iconBg: 'bg-gray-200',
          hover: 'hover:bg-gray-50',
          shadow: 'shadow-gray-100'
        };
    }
  };

  const colors = getColorClasses();

  return (
    <div className={`${colors.bg} ${colors.text} ${colors.hover} p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200`}>
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm font-medium opacity-90">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className={`w-14 h-14 ${colors.iconBg} rounded-full flex items-center justify-center ${colors.text}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// Composant ActivityList
const ActivityList = ({ title, items, renderItem, viewAllLink, viewAllLabel = "Voir tous" }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-800">{title}</h2>
        {viewAllLink && (
          <Link 
            to={viewAllLink} 
            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center group"
          >
            {viewAllLabel}
            <ChevronRightIcon 
              width={16} 
              height={16} 
              className="ml-1 group-hover:translate-x-1 transition-transform duration-200" 
            />
          </Link>
        )}
      </div>
      <ul className="divide-y divide-gray-100">
        {items.length > 0 ? (
          items.map((item, index) => (
            <li key={item.id || index} className="py-3 hover:bg-gray-50 transition-colors rounded">
              {renderItem(item)}
            </li>
          ))
        ) : (
          <li className="py-8 text-center text-gray-500">
            Aucune donnée disponible
          </li>
        )}
      </ul>
    </div>
  );
};

// Composant ActionCard
const ActionCard = ({ title, icon, link, color }) => {
  const getColorClasses = () => {
    switch (color) {
      case 'blue':
        return {
          bg: 'bg-blue-50',
          hover: 'hover:bg-blue-100',
          text: 'text-blue-700',
          iconBg: 'bg-blue-100',
          iconHover: 'group-hover:bg-blue-200',
          iconText: 'text-blue-600'
        };
      case 'green':
        return {
          bg: 'bg-green-50',
          hover: 'hover:bg-green-100',
          text: 'text-green-700',
          iconBg: 'bg-green-100',
          iconHover: 'group-hover:bg-green-200',
          iconText: 'text-green-600'
        };
      case 'yellow':
        return {
          bg: 'bg-yellow-50',
          hover: 'hover:bg-yellow-100',
          text: 'text-yellow-700',
          iconBg: 'bg-yellow-100',
          iconHover: 'group-hover:bg-yellow-200',
          iconText: 'text-yellow-600'
        };
      case 'purple':
        return {
          bg: 'bg-purple-50',
          hover: 'hover:bg-purple-100',
          text: 'text-purple-700',
          iconBg: 'bg-purple-100',
          iconHover: 'group-hover:bg-purple-200',
          iconText: 'text-purple-600'
        };
      default:
        return {
          bg: 'bg-gray-50',
          hover: 'hover:bg-gray-100',
          text: 'text-gray-700',
          iconBg: 'bg-gray-100',
          iconHover: 'group-hover:bg-gray-200',
          iconText: 'text-gray-600'
        };
    }
  };

  const colors = getColorClasses();

  return (
    <Link
      to={link}
      className={`flex items-center w-full py-3 px-4 ${colors.bg} ${colors.text} rounded-lg ${colors.hover} transition-colors group`}
    >
      <div className={`w-8 h-8 ${colors.iconBg} ${colors.iconText} rounded-full flex items-center justify-center mr-3 ${colors.iconHover} transition-colors`}>
        {icon}
      </div>
      <span>{title}</span>
    </Link>
  );
};

// Données par défaut pour le cas où les API ne répondent pas
const defaultStats = {
  volontairesActifs: 0,
  etudesEnCours: 0,
  rdvToday: 0,
};

const defaultProchainRdvs = [];
const defaultEtudesRecentes = [];
const defaultActiviteRecente = [];
const defaultStatsJour = {
  volontairesAjoutes: 0,
  rdvEffectues: 0,
  nouvellesPreinscriptions: 0
};

// Composant Dashboard principal
const Dashboard = () => {
  const [stats, setStats] = useState(defaultStats);
  const [prochainRdvs, setProchainRdvs] = useState(defaultProchainRdvs);
  const [etudesRecentes, setEtudesRecentes] = useState(defaultEtudesRecentes);
  const [activiteRecente, setActiviteRecente] = useState(defaultActiviteRecente);
  const [statsJour, setStatsJour] = useState(defaultStatsJour);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiErrors, setApiErrors] = useState({});
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setApiErrors({});
        
        const errors = {};
        
        // Configurer Axios avec un timeout
        const axiosConfig = {
          timeout: 10000 // 10 secondes
        };
        
        // Stats générales
        try {
          const statsResponse = await api.get(`${API_URL}/api/dashboard/stats`, axiosConfig);
          setStats(statsResponse.data);
        } catch (err) {
          console.error('Erreur lors du chargement des stats:', err);
          errors.stats = err.message;
          // Garder les valeurs par défaut
        }
        
        // Rendez-vous
        try {
          const rdvsResponse = await api.get(`${API_URL}/api/dashboard/rdv/prochains`, axiosConfig);
          setProchainRdvs(rdvsResponse.data);
        } catch (err) {
          console.error('Erreur lors du chargement des rendez-vous:', err);
          errors.rdvs = err.message;
          // Garder les valeurs par défaut
        }
        
        // Études
        try {
          const etudesResponse = await api.get(`${API_URL}/api/dashboard/etude/recentes`, axiosConfig);
          setEtudesRecentes(etudesResponse.data);
        } catch (err) {
          console.error('Erreur lors du chargement des études:', err);
          errors.etudes = err.message;
          // Garder les valeurs par défaut
        }
        
        // Activité
        try {
          const activiteResponse = await api.get(`${API_URL}/api/dashboard/activite/recente`, axiosConfig);
          setActiviteRecente(activiteResponse.data);
        } catch (err) {
          console.error('Erreur lors du chargement de l\'activité:', err);
          errors.activite = err.message;
          // Garder les valeurs par défaut
        }
        
        // Stats du jour
        try {
          const statsJourResponse = await api.get(`${API_URL}/api/dashboard/stats-jour`, axiosConfig);
          setStatsJour(statsJourResponse.data);
        } catch (err) {
          console.error('Erreur lors du chargement des stats du jour:', err);
          errors.statsJour = err.message;
          // Garder les valeurs par défaut
        }
        
        // Si toutes les requêtes ont échoué, afficher une erreur générale
        if (Object.keys(errors).length === 5) {
          setError('Impossible de charger les données du tableau de bord. Vérifiez votre connexion Internet et l\'URL de l\'API.');
        } else if (Object.keys(errors).length > 0) {
          // Sinon juste stocker les erreurs spécifiques
          setApiErrors(errors);
        }
        
      } catch (error) {
        console.error('Erreur générale lors du chargement des données:', error);
        setError('Erreur inattendue lors du chargement des données');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'En cours':
        return 'px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium';
      case 'À venir':
        return 'px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium';
      case 'Terminée':
        return 'px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium';
      default:
        return 'px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium';
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'volontaire_ajout':
        return <UserPlusIcon className="text-blue-600" />;
      case 'rdv_planification':
        return <CalendarPlusIcon className="text-yellow-600" />;
      case 'etude_creation':
        return <FileTextIcon className="text-green-600" />;
      case 'volontaire_inscription':
        return <ClipboardIcon className="text-purple-600" />;
      case 'etude_cloture':
        return <StudyIcon className="text-gray-600" />;
      default:
        return <ChartIcon className="text-gray-400" />;
    }
  };
  
  const getActivityBg = (type) => {
    switch (type) {
      case 'volontaire_ajout':
        return 'bg-blue-100';
      case 'rdv_planification':
        return 'bg-yellow-100';
      case 'etude_creation':
        return 'bg-green-100';
      case 'volontaire_inscription':
        return 'bg-purple-100';
      case 'etude_cloture':
        return 'bg-gray-100';
      default:
        return 'bg-gray-100';
    }
  };
  
  // Générer les initiales pour les avatars
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-14 w-14 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <p className="text-red-700">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 text-sm text-blue-600 hover:underline"
        >
          Réessayer
        </button>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-800">Tableau de bord</h1>
        <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-md shadow">
          Dernière mise à jour: {formatDate(new Date().toISOString(), 'dd/MM/yyyy, HH:mm')}
        </div>
      </div>
      
      {/* Affichage des erreurs partielles s'il y en a */}
      {Object.keys(apiErrors).length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <p className="text-yellow-800 font-medium">Certaines données n'ont pas pu être chargées</p>
          <ul className="mt-2 text-sm text-yellow-700">
            {apiErrors.stats && <li>• Statistiques générales</li>}
            {apiErrors.rdvs && <li>• Prochains rendez-vous</li>}
            {apiErrors.etudes && <li>• Études récentes</li>}
            {apiErrors.activite && <li>• Activité récente</li>}
            {apiErrors.statsJour && <li>• Statistiques du jour</li>}
          </ul>
        </div>
      )}
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Volontaires actifs"
          value={stats.volontairesActifs}
          color="blue"
          icon={<UsersIcon width={28} height={28} />}
        />
        <StatCard
          title="Études en cours"
          value={stats.etudesEnCours}
          color="green"
          icon={<StudyIcon width={28} height={28} />}
        />
        <StatCard
          title="RDV aujourd'hui"
          value={stats.rdvToday}
          color="yellow"
          icon={<CalendarIcon width={28} height={28} />}
        />
      </div>
      
      {/* Activity Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ActivityList
        title="Prochains rendez-vous"
        items={prochainRdvs}
        viewAllLink="/rdvs"
        renderItem={(rdv) => (
          <div className="flex justify-between items-center px-2">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <CalendarEventIcon className="text-blue-600" width={16} height={16} />
              </div>
              <div>
                <p className="font-medium text-gray-900">Étude {rdv.etudeRef}</p>{/* Ajout de la ref de l'étude */}
                <p className="text-sm text-gray-500">{rdv.commentaires}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{rdv.date}</p>
              <p className="text-xs text-blue-600 font-medium">{rdv.heure}</p>
            </div>
          </div>
        )}
      />
    
        <ActivityList
          title="Études récentes"
          items={etudesRecentes}
          viewAllLink="/etudes"
          renderItem={(etude) => (
            <div className="flex justify-between items-center px-2">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center mr-3">
                  <StudyIcon width={20} height={20} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{etude.ref}: {etude.titre}</p>
                  <p className="text-sm text-gray-500">{etude.volontaires} volontaires</p>
                </div>
              </div>
              <span className={getStatusBadgeClass(etude.status)}>
                {etude.status}
              </span>
            </div>
          )}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activité récente */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
          <h2 className="text-lg font-bold mb-6 text-gray-800 flex items-center">
            <ChartIcon width={20} height={20} className="mr-2 text-blue-600" />
            Activité récente
          </h2>
          
          <div className="flow-root">
            {activiteRecente.length > 0 ? (
              <ul className="-mb-8">
                {activiteRecente.map((activite, index) => (
                  <li key={activite.id}>
                    <div className="relative pb-8">
                      {index !== activiteRecente.length - 1 ? (
                        <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                      ) : null}
                      <div className="relative flex items-start space-x-3">
                        <div className={`relative px-1 ${getActivityBg(activite.type)} rounded-full flex h-10 w-10 items-center justify-center`}>
                          {getActivityIcon(activite.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm text-gray-500">
                            <span className="font-medium text-gray-900">{activite.user}</span> {activite.description}
                            <span className="whitespace-nowrap text-xs text-gray-400 ml-2">
                              {formatDate(activite.date, 'dd/MM/yyyy, HH:mm')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Aucune activité récente disponible
              </div>
            )}
          </div>
        </div>
        
        {/* Actions rapides */}
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
          <h2 className="text-lg font-bold mb-4 text-gray-800 flex items-center">
            <PlusIcon width={20} height={20} className="mr-2 text-blue-600" />
            Actions rapides
          </h2>
          <div className="space-y-4">
            <ActionCard
              title="Ajouter un volontaire"
              link="/volontaires/nouveau"
              color="blue"
              icon={<UserPlusIcon width={16} height={16} />}
            />
            <ActionCard
              title="Créer une étude"
              link="/etudes/nouvelle"
              color="green"
              icon={<FileTextIcon width={16} height={16} />}
            />
            <ActionCard
              title="Planifier un rendez-vous"
              link="/rdvs"
              color="yellow"
              icon={<CalendarPlusIcon width={16} height={16} />}
            />
            
            {/* Statistiques du jour */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-medium text-gray-600 mb-3">Aujourd'hui</h3>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Volontaires ajoutés</span>
                <span className="font-medium text-gray-900">{statsJour.volontairesAjoutes}</span>
              </div>
              <div className="flex justify-between items-center text-sm mt-2">
                <span className="text-gray-600">RDV effectués</span>
                <span className="font-medium text-gray-900">{statsJour.rdvEffectues}</span>
              </div>
              <div className="flex justify-between items-center text-sm mt-2">
                <span className="text-gray-600">Nouvelles préinscriptions</span>
                <span className="font-medium text-gray-900">{statsJour.nouvellesPreinscriptions}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;