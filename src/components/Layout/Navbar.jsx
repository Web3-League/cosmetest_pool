import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useNotifications } from '../../context/NotificationContext'
import styles from './IconStyles.module.css';

// Import des icônes SVG
import searchSvg from '../../assets/icons/search.svg';
import bellSvg from '../../assets/icons/bell.svg';
import chevronDownSvg from '../../assets/icons/chevron-down.svg';
import userSvg from '../../assets/icons/user.svg';
import settingsSvg from '../../assets/icons/setting.svg';
import logoutSvg from '../../assets/icons/logout.svg';

// Création des composants d'icônes avec styles
const SearchIcon = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={searchSvg} width={width} height={height} className={`${styles.searchIcon} ${className}`} alt="Search" {...props} />
);

const BellIcon = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={bellSvg} width={width} height={height} className={`${styles.bellIcon} ${className}`} alt="Notifications" {...props} />
);

const ChevronDownIcon = ({ className = "", width = 24, height = 24, ...props }) => (
  <img
    src={chevronDownSvg}
    width={width}
    height={height}
    className={`${styles.chevronIcon} ${className}`}
    alt="Chevron Down"
    {...props}
  />
);

const UserIcon = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={userSvg} width={width} height={height} className={`${styles.userIcon} ${className}`} alt="User" {...props} />
);

const SettingsIcon = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={settingsSvg} width={width} height={height} className={`${styles.settingsIcon} ${className}`} alt="Settings" {...props} />
);

const LogoutIcon = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={logoutSvg} width={width} height={height} className={`${styles.logoutIcon} ${className}`} alt="Logout" {...props} />
);

const Navbar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const { user, logout } = useAuth()
  const { unreadVolunteersCount, markVolunteersAsConsulted } = useNotifications() // MODIFIÉ
  const navigate = useNavigate()


  const handleLogout = async () => {
    await logout()
    navigate('/cosmetest/login')
  }

  // AJOUT - Compteur de volontaires du jour
  const handleNotificationClick = () => {
    // Marquer les volontaires du jour comme consultés
    markVolunteersAsConsulted();
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const getRoleLabel = () => {
    if (!user?.role) return 'Invité';

    switch (user.role) {
      case 2:
        return 'Administrateur';
      case 1:
        return 'Utilisateur';
      default:
        return 'Invité';
    }
  };
  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.login) return 'U'

    const nameParts = user.login.split(' ')
    if (nameParts.length > 1) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
    }
    return user.login.substring(0, 2).toUpperCase()
  }

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center px-6 justify-between shadow-sm">
      {/* Left side - will be empty because we have the logo in sidebar */}
      <div className="flex items-center">
        {/* Any additional left-side elements can go here if needed */}
      </div>

      {/* Right side - search and user controls */}
      <div className="flex items-center space-x-6">


        {/* Notifications - Volontaires du jour */}
        <div className="relative">
          <button 
            onClick={handleNotificationClick}
            className="p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 relative"
          >
            <BellIcon className="w-6 h-6" />
            {unreadVolunteersCount > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none transform translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 text-white min-w-[18px] h-[18px]">
                {unreadVolunteersCount > 99 ? '99+' : unreadVolunteersCount}
              </span>
            )}
          </button>
        </div>

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-3 focus:outline-none"
          >
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
              {getUserInitials()}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-800">{user?.login || 'Utilisateur'}</p>
              <p className="text-xs text-gray-500">{getRoleLabel()}</p>
            </div>
            <ChevronDownIcon
              className={dropdownOpen ? styles.chevronIconOpen : ''}
              width={20}
              height={20}
            />
          </button>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
              <a href="/cosmetest/profil" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                <div className="flex items-center">
                  <UserIcon className="w-5 h-5 mr-2" />
                  Mon profil
                </div>
              </a>
              <a href="/cosmetest/parametres" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                <div className="flex items-center">
                  <SettingsIcon className="w-5 h-5 mr-2" />
                  Paramètres
                </div>
              </a>
              <div className="border-t border-gray-100 my-1"></div>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                <div className="flex items-center">
                  <LogoutIcon className="w-5 h-5 mr-2" />
                  Déconnexion
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar