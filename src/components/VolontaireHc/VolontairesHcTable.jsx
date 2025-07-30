import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const VolontairesHcTable = ({ volontaires, onArchive }) => {
  const navigate = useNavigate()
  
  // État pour le tri
  const [sortConfig, setSortConfig] = useState({
    key: 'nomVol',
    direction: 'ascending'
  })

  // Fonction pour gérer le tri des colonnes
  const requestSort = (key) => {
    let direction = 'ascending'
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending'
    }
    setSortConfig({ key, direction })
  }

  // Fonction pour gérer le clic sur une ligne
  const handleRowClick = (volontaireId) => {
    navigate(`/volontaires-hc/${volontaireId}`)
  }

  // Tri des volontaires selon la configuration
  const sortedVolontaires = [...volontaires].sort((a, b) => {
    if (!a[sortConfig.key] || !b[sortConfig.key]) return 0
    
    let comparison = 0
    if (a[sortConfig.key].toLowerCase() > b[sortConfig.key].toLowerCase()) {
      comparison = 1
    } else if (a[sortConfig.key].toLowerCase() < b[sortConfig.key].toLowerCase()) {
      comparison = -1
    }
    return sortConfig.direction === 'descending' ? comparison * -1 : comparison
  })

  // Fonction pour obtenir la classe de l'en-tête selon le tri
  const getSortClass = (key) => {
    if (sortConfig.key !== key) return 'cursor-pointer hover:bg-gray-100'
    return sortConfig.direction === 'ascending' 
      ? 'cursor-pointer hover:bg-gray-100 bg-blue-50 text-blue-700' 
      : 'cursor-pointer hover:bg-gray-100 bg-blue-50 text-blue-700'
  }

  // Fonction pour obtenir l'icône de tri
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕️'
    return sortConfig.direction === 'ascending' ? '↑' : '↓'
  }

  // Fonctions pour empêcher la propagation des clics sur les actions
  const handleEditClick = (e) => {
    e.stopPropagation()
  }

  const handleArchiveClick = (e, volontaireId) => {
    e.stopPropagation()
    onArchive(volontaireId)
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th 
                className={`${getSortClass('nomVol')} px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider`}
                onClick={() => requestSort('nomVol')}
              >
                <div className="flex items-center">
                  <span>Nom</span>
                  <span className="ml-1 text-gray-400">{getSortIcon('nomVol')}</span>
                </div>
              </th>
              <th 
                className={`${getSortClass('prenomVol')} px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider`}
                onClick={() => requestSort('prenomVol')}
              >
                <div className="flex items-center">
                  <span>Prénom</span>
                  <span className="ml-1 text-gray-400">{getSortIcon('prenomVol')}</span>
                </div>
              </th>
              <th 
                className={`${getSortClass('sexe')} px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider`}
                onClick={() => requestSort('sexe')}
              >
                <div className="flex items-center">
                  <span>Sexe</span>
                  <span className="ml-1 text-gray-400">{getSortIcon('sexe')}</span>
                </div>
              </th>
              <th 
                className={`${getSortClass('emailVol')} px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider`}
                onClick={() => requestSort('emailVol')}
              >
                <div className="flex items-center">
                  <span>Email</span>
                  <span className="ml-1 text-gray-400">{getSortIcon('emailVol')}</span>
                </div>
              </th>
              <th 
                className={`${getSortClass('typePeauVisage')} px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider`}
                onClick={() => requestSort('typePeauVisage')}
              >
                <div className="flex items-center">
                  <span>Type peau</span>
                  <span className="ml-1 text-gray-400">{getSortIcon('typePeauVisage')}</span>
                </div>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedVolontaires.length > 0 ? (
              sortedVolontaires.map((volontaire, index) => (
                <tr 
                  key={volontaire.id || volontaire.volontaireId || index} 
                  className={`hover:bg-gray-100 cursor-pointer transition-colors duration-150 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  onClick={() => handleRowClick(volontaire.id || volontaire.volontaireId)}
                >
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{volontaire.nomVol || volontaire.nom}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{volontaire.prenomVol || volontaire.prenom}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${volontaire.sexe === 'Féminin' ? 'bg-pink-100 text-pink-800' : 'bg-blue-100 text-blue-800'}`}>
                      {volontaire.sexe}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <a 
                      href={`mailto:${volontaire.emailVol || volontaire.email}`} 
                      className="text-blue-600 hover:text-blue-900"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {volontaire.emailVol || volontaire.email}
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${volontaire.typePeauVisage === 'Normale' || volontaire.typePeau === 'Normale'
                        ? 'bg-green-100 text-green-800'
                        : volontaire.typePeauVisage === 'Mixte' || volontaire.typePeau === 'Mixte'
                        ? 'bg-yellow-100 text-yellow-800'
                        : volontaire.typePeauVisage === 'Sèche' || volontaire.typePeau === 'Sèche'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {volontaire.typePeauVisage || volontaire.typePeau}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Link
                        to={`/volontaires-hc/${volontaire.id || volontaire.volontaireId}/edit`}
                        className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 py-1 px-3 rounded-md transition-colors duration-150"
                        onClick={handleEditClick}
                      >
                        Modifier
                      </Link>
                      {!volontaire.archive ? (
                        <button
                          onClick={(e) => handleArchiveClick(e, volontaire.id || volontaire.volontaireId)}
                          className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 py-1 px-3 rounded-md transition-colors duration-150"
                        >
                          Archiver
                        </button>
                      ) : (
                        <span className="text-gray-500 bg-gray-100 py-1 px-3 rounded-md inline-block">
                          Archivé
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  Aucun volontaire trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default VolontairesHcTable