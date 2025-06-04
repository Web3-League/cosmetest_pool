import React, { useState } from 'react';
import EtudeMatchingSystem from './EtudeMatchingSystem';

// Import de vos icônes SVG depuis vos assets (selon votre structure)
import dashboardSvg from '../../assets/icons/dashboard.svg';
import usersSvg from '../../assets/icons/volunteers.svg';
import chartSvg from '../../assets/icons/studies.svg'; // Ou une autre icône adaptée
import calendarSvg from '../../assets/icons/calendar.svg';

// Composants d'icônes dans le style de votre application
const DashboardIcon = ({ className = "" }) => (
  <img src={dashboardSvg} className={className} alt="Dashboard" />
);

const UsersIcon = ({ className = "" }) => (
  <img src={usersSvg} className={className} alt="Users" />
);

const ChartIcon = ({ className = "" }) => (
  <img src={chartSvg} className={className} alt="Chart" />
);

const CalendarIcon = ({ className = "" }) => (
  <img src={calendarSvg} className={className} alt="Calendar" />
);

const RapportsPage = () => {
  const [activeTab, setActiveTab] = useState('matching');

  // Définition des types de rapports disponibles
  const rapportTypes = [
    {
      id: 'matching',
      title: 'Matching d\'Études',
      icon: <UsersIcon className="w-5 h-5" />,
      description: 'Trouvez les volontaires les plus adaptés à vos études en fonction de critères personnalisables.'
    },
    {
      id: 'stats',
      title: 'Statistiques Volontaires',
      icon: <ChartIcon className="w-5 h-5" />,
      description: 'Analyse démographique des volontaires (répartition par âge, sexe, phototype, etc.).'
    },
    {
      id: 'activity',
      title: 'Activité des Études',
      icon: <DashboardIcon className="w-5 h-5" />,
      description: 'Suivi de l\'activité des études en cours et terminées (participation, résultats, etc.).'
    },
    {
      id: 'slots',
      title: 'Occupation des Créneaux',
      icon: <CalendarIcon className="w-5 h-5" />,
      description: 'Analyse de l\'occupation des créneaux de rendez-vous et des disponibilités.'
    }
  ];

  // Rendu du contenu en fonction de l'onglet actif
  const renderContent = () => {
    switch (activeTab) {
      case 'matching':
        return <EtudeMatchingSystem />;
      case 'stats':
      case 'activity':
      case 'slots':
        return (
          <div className="p-10 text-center">
            <h2 className="text-xl font-semibold mb-2">{rapportTypes.find(r => r.id === activeTab)?.title}</h2>
            <p className="text-gray-500">
              Ce module est en cours de développement et sera disponible prochainement.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center">
            <ChartIcon className="w-5 h-5 text-blue-600 mr-2" />
            <h1 className="text-xl font-semibold text-gray-800">Centre de Rapports</h1>
          </div>
        </div>
        
        <div className="p-4">
          <p className="mb-6 text-gray-600">
            Bienvenue dans le centre de rapports de CosmeTest. Cette section vous permet d'accéder à différents outils d'analyse
            pour optimiser la gestion de vos volontaires et de vos études.
          </p>

          {/* Navigation par onglets */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="flex -mb-px">
              {rapportTypes.map(type => (
                <button
                  key={type.id}
                  className={`mr-1 py-2 px-4 font-medium text-sm ${
                    activeTab === type.id
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab(type.id)}
                >
                  <div className="flex items-center">
                    <span className="mr-2">{type.icon}</span>
                    <span>{type.title}</span>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* Contenu du rapport actif */}
          <div className="mt-4">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RapportsPage;