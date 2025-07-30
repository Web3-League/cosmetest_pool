import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import styles from './SidebarIcons.module.css';

// Import du logo
import logo from '../../assets/icons/logo.png'; // Adjust the path to where your logo file is located

// Import des icônes SVG
import dashboardSvg from '../../assets/icons/dashboard.svg';
import volunteersSvg from '../../assets/icons/volunteers.svg';
import studiesSvg from '../../assets/icons/studies.svg';
import appointmentsSvg from '../../assets/icons/appointments.svg';
//import panelsSvg from '../../assets/icons/panels.svg';
import preregisteredSvg from '../../assets/icons/preregistered.svg';
import reportsSvg from '../../assets/icons/reports.svg';
import chevronLeftSvg from '../../assets/icons/chevron-left.svg';
import chevronRightSvg from '../../assets/icons/chevron-right.svg';
import plusSvg from '../../assets/icons/add.svg';
import calendarSvg from '../../assets/icons/calendar.svg';
import ShoppingBag from '../../assets/icons/shopping-bag.svg';

// Création des composants d'icônes
const DashboardIcon = ({ className = "", isActive = false, ...props }) => (
  <img
    src={dashboardSvg}
    className={`${styles.menuIcon} ${isActive ? styles.activeIcon : ''} ${className}`}
    alt="Dashboard"
    {...props}
  />
);

const VolunteersIcon = ({ className = "", isActive = false, ...props }) => (
  <img
    src={volunteersSvg}
    className={`${styles.menuIcon} ${isActive ? styles.activeIcon : ''} ${className}`}
    alt="Volunteers"
    {...props}
  />
);

const StudiesIcon = ({ className = "", isActive = false, ...props }) => (
  <img
    src={studiesSvg}
    className={`${styles.menuIcon} ${isActive ? styles.activeIcon : ''} ${className}`}
    alt="Studies"
    {...props}
  />
);

const AppointmentsIcon = ({ className = "", isActive = false, ...props }) => (
  <img
    src={appointmentsSvg}
    className={`${styles.menuIcon} ${isActive ? styles.activeIcon : ''} ${className}`}
    alt="Appointments"
    {...props}
  />
);

/*const PanelsIcon = ({ className = "", isActive = false, ...props }) => (
  <img
    src={panelsSvg}
    className={`${styles.menuIcon} ${isActive ? styles.activeIcon : ''} ${className}`}
    alt="Panels"
    {...props}
  />
);
*/
const PreregisteredIcon = ({ className = "", isActive = false, ...props }) => (
  <img
    src={preregisteredSvg}
    className={`${styles.menuIcon} ${isActive ? styles.activeIcon : ''} ${className}`}
    alt="Preregistered"
    {...props}
  />
);

const ReportsIcon = ({ className = "", isActive = false, ...props }) => (
  <img
    src={reportsSvg}
    className={`${styles.menuIcon} ${isActive ? styles.activeIcon : ''} ${className}`}
    alt="Reports"
    {...props}
  />
);

const ChevronLeftIcon = ({ className = "", ...props }) => (
  <img
    src={chevronLeftSvg}
    className={`${styles.collapseIcon} ${className}`}
    alt="Collapse Left"
    {...props}
  />
);

const ChevronRightIcon = ({ className = "", ...props }) => (
  <img
    src={chevronRightSvg}
    className={`${styles.collapseIcon} ${className}`}
    alt="Collapse Right"
    {...props}
  />
);

const PlusIcon = ({ className = "", ...props }) => (
  <img
    src={plusSvg}
    className={`${styles.actionIcon} ${className}`}
    alt="Add"
    {...props}
  />
);

const CalendarIcon = ({ className = "", ...props }) => (
  <img
    src={calendarSvg}
    className={`${styles.actionIcon} ${className}`}
    alt="Calendar"
    {...props}
  />
);

const ShoppingBagIcon = ({ className = "", ...props }) => (
  <img
    src={ShoppingBag}
    className={`${styles.menuIcon} ${className}`}
    alt="Shopping Bag"
    {...props}
  />
);

// Logo CosmeTest en SVG inline avec adaptation en fonction de l'état de la sidebar
// Logo CosmeTest en SVG inline
const CosmeTestLogo = ({ isCollapsed }) => {
  if (isCollapsed) {
    // Version réduite du logo - affiche juste la partie circulaire avec le T
    return (
      <img src={logo} alt="CosmeTest Logo" className="w-10 h-10" />
    );
  }

  // Version complète du logo
  return (
    <img src={logo} alt="CosmeTest Logo" className="w-10 h-10" />
  );
};

const Sidebar = ({ onToggle }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Notifier le parent quand l'état change
  const toggleSidebar = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);

    // Notifier le parent
    if (onToggle) {
      onToggle(newCollapsedState);
    }
  };

  // Configuration des éléments de menu avec gestion des permissions
  const getMenuItems = () => {
    const baseMenuItems = [
      {
        label: 'Tableau de bord',
        icon: (isActive) => <DashboardIcon className="w-5 h-5" isActive={isActive} />,
        path: '/dashboard'
      },
      {
        label: 'Volontaires',
        icon: (isActive) => <VolunteersIcon className="w-5 h-5" isActive={isActive} />,
        path: '/volontaires',
        subItems: [
          {
            label: 'Liste générale',
            path: '/volontaires'
          },
          {
            label: 'Habitudes cosmétiques',
            path: '/volontaires-hc'
          }
        ]
      },
      {
        label: 'Études',
        icon: (isActive) => <StudiesIcon className="w-5 h-5" isActive={isActive} />,
        path: '/etudes',
        subItems: [
          {
            label: 'Groupes',
            path: '/groupes'
          },
        ]
      },
      {
        label: 'Rendez-vous',
        icon: (isActive) => <AppointmentsIcon className="w-5 h-5" isActive={isActive} />,
        path: '/rdvs',
        subItems: [
          {
            label: 'Assigner un volontaire',
            path: '/rdvs/assigner'
          },
        ]
      },
      /*
      {
        label: 'Panels',
        icon: (isActive) => <PanelsIcon className="w-5 h-5" isActive={isActive} />,
        path: '/panels'
      },
      */
      {
        label: 'Rapports',
        icon: (isActive) => <ReportsIcon className="w-5 h-5" isActive={isActive} />,
        path: '/rapports'
      },


      // Ajouter l'élément Paiements seulement pour les administrateurs
      {
        label: 'Paiements',
        icon: (isActive) => <ShoppingBagIcon className="w-5 h-5" isActive={isActive} />,
        path: '/paiements'
      }
    ];
    return baseMenuItems;
  };

  const menuItems = getMenuItems();

  return (
    <aside
      className={`bg-white shadow-md h-full sticky top-0 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-16' : 'w-64'
        }`}
    >
      {/* Logo area */}
      <div className="h-16 flex items-center justify-center border-b border-gray-200 py-2">
        <Link to="/dashboard" className="flex justify-center items-center">
          <CosmeTestLogo collapsed={isCollapsed} />
        </Link>
      </div>

      {/* Collapse button */}
      <div className="flex justify-end p-2">
        <button
          onClick={toggleSidebar}
          className="p-1 rounded-md hover:bg-gray-100 text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200"
          aria-label={isCollapsed ? "Déplier le menu" : "Replier le menu"}
        >
          {isCollapsed ? (
            <ChevronRightIcon className="w-5 h-5" />
          ) : (
            <ChevronLeftIcon className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="mt-2 px-2">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <div key={item.path}>
              <NavLink
                to={item.path}
                end={item.subItems ? true : false}
                className={({ isActive }) => `
                  flex items-center px-3 py-2.5 rounded-lg font-medium transition-all duration-200
                  ${isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                  ${isCollapsed ? 'justify-center' : ''}
                `}
                title={item.adminOnly && isCollapsed ? `${item.label} (Admin uniquement)` : item.label}
              >
                {({ isActive }) => (
                  <>
                    <span className={`${isCollapsed ? '' : 'mr-3'}`}>
                      {item.icon(isActive)}
                    </span>
                    {!isCollapsed && (
                      <>
                        <span>{item.label}</span>
                        {item.adminOnly && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-orange-100 text-orange-800 rounded-full font-bold">
                            ADMIN
                          </span>
                        )}

                        {/* Add badge/counter for some items */}
                        {(item.label === 'Volontaires' || item.label === 'Études' || item.label === 'Préinscrits') && (
                          <span className={`ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none rounded-full 
                            ${item.label === 'Volontaires'},
                            ${item.label === 'Études'}`}>
                            {item.label === 'Volontaires'}
                            {item.label === 'Études'}
                          </span>
                        )}
                      </>
                    )}
                  </>
                )}
              </NavLink>

              {/* Sous-menu */}
              {!isCollapsed && item.subItems && (
                <div className="pl-8 mt-1 space-y-1">
                  {item.subItems.map(subItem => (
                    <NavLink
                      key={subItem.path}
                      to={subItem.path}
                      className={({ isActive }) => `
                        block px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200
                        ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}
                      `}
                    >
                      {subItem.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* Bottom actions - Rendered as Link components now */}
      <div className="absolute bottom-0 w-full border-t border-gray-200 bg-gray-50 py-4 px-4">
        <div className="flex items-center space-x-3">
          {!isCollapsed && (
            <>
              <Link
                to="/etudes/nouvelle"
                className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
              >
                <PlusIcon className="w-5 h-5 mr-1" />
                Créer une étude
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                to="/rdvs"
                className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
              >
                <CalendarIcon className="w-5 h-5 mr-1" />
                Planifier un RDV
              </Link>
            </>
          )}
          {isCollapsed && (
            <div className="flex flex-col items-center w-full space-y-4">
              <Link
                to="/etudes/nouveau"
                className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100"
              >
                <PlusIcon className="w-5 h-5" />
              </Link>
              <Link
                to="/rdvs"
                className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100"
              >
                <CalendarIcon className="w-5 h-5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;