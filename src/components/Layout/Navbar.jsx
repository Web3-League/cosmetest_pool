import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
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
  const [searchQuery, setSearchQuery] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  
  const handleSearch = (e) => {
    e.preventDefault()
    // Implémentation de la recherche globale
    console.log('Recherche:', searchQuery)
  }
  
  const handleLogout = async () => {
    await logout()
    navigate('/cosmetest/login')
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
        {/* Search form */}
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            placeholder="Rechercher..."
            className="bg-gray-100 text-gray-800 px-4 py-2 pl-10 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all duration-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <SearchIcon className="w-5 h-5" />
          </div>
        </form>
        
        {/* Notifications */}
        <div className="relative">
          <button className="p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300">
            <BellIcon className="w-6 h-6" />
          </button>
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none transform translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 text-white">3</span>
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
              <p className="text-xs text-gray-500">Admin</p>
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