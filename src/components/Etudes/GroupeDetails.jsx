import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import groupeService from '../../services/groupeService'
import etudeService from '../../services/etudeService'

const GroupeDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [groupe, setGroupe] = useState(null)
  const [etude, setEtude] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchGroupe = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Vérifier si l'ID est défini
        if (!id || id === 'undefined') {
          throw new Error('Identifiant du groupe non valide')
        }
        
        console.log("Chargement du groupe avec ID:", id) // Débogage
        const groupeData = await groupeService.getById(id)
        console.log("Données du groupe chargées:", groupeData) // Débogage
        setGroupe(groupeData)
        
        // Charger les détails de l'étude associée si le groupe a un idEtude
        if (groupeData.idEtude) {
          console.log("Chargement de l'étude avec ID:", groupeData.idEtude) // Débogage
          const etudeData = await etudeService.getById(groupeData.idEtude)
          console.log("Données de l'étude chargées:", etudeData) // Débogage
          setEtude(etudeData)
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
        setError('Impossible de charger les informations du groupe. ' + error.message)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchGroupe()
  }, [id])
  
  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce groupe ?')) {
      try {
        await groupeService.delete(id)
        navigate('/groupes', { replace: true })
      } catch (error) {
        console.error('Erreur lors de la suppression:', error)
        setError('Une erreur est survenue lors de la suppression du groupe.')
      }
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        {error}
      </div>
    )
  }
  
  if (!groupe) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Groupe non trouvé.</p>
        <Link to="/groupes" className="text-primary-600 hover:underline mt-2 inline-block">
          Retour à la liste des groupes
        </Link>
      </div>
    )
  }
  
  // Récupérer les informations de référence de l'étude
  const etudeReference = etude ? etude.ref : null;
  const etudeTitle = etude ? etude.titre : null;
  const etudeId = groupe.idEtude;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">{groupe.intitule || groupe.nom}</h1>
        <div className="flex space-x-2">
          <Link
            to={`/groupes/${id}/edit`}
            className="btn btn-outline"
          >
            Modifier
          </Link>
          <button
            onClick={handleDelete}
            className="btn btn-danger"
          >
            Supprimer
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">Étude associée</dt>
              <dd className="mt-1 text-gray-900">
                {etude ? (
                  <Link to={`/etudes/${etudeId}`} className="text-primary-600 hover:underline">
                    {etudeReference || etudeTitle || `Étude #${etudeId}`}
                  </Link>
                ) : (
                  <span className="text-gray-500">Non spécifiée</span>
                )}
              </dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-gray-500">Tranche d'âge</dt>
              <dd className="mt-1 text-gray-900">
                {groupe.ageMinimum || groupe.ageMin || groupe.ageMaximum || groupe.ageMax ? (
                  `${groupe.ageMinimum || groupe.ageMin || '0'} - ${groupe.ageMaximum || groupe.ageMax || '∞'} ans`
                ) : (
                  <span className="text-gray-500">Non spécifiée</span>
                )}
              </dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-gray-500">Ethnie</dt>
              <dd className="mt-1 text-gray-900">
                {groupe.ethnie || <span className="text-gray-500">Non spécifiée</span>}
              </dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-gray-500">Nombre de participants</dt>
              <dd className="mt-1 text-gray-900">
                {groupe.nbSujet || groupe.nombreParticipants || 0}
              </dd>
            </div>
            
            <div className="md:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-gray-900 whitespace-pre-line">
                {groupe.description || <span className="text-gray-500">Aucune description</span>}
              </dd>
            </div>
            
            <div className="md:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Critères supplémentaires</dt>
              <dd className="mt-1 text-gray-900 whitespace-pre-line">
                {groupe.criteresSupplémentaires || <span className="text-gray-500">Aucun critère supplémentaire</span>}
              </dd>
            </div>
            
            {groupe.iv !== undefined && (
              <div>
                <dt className="text-sm font-medium text-gray-500">IV</dt>
                <dd className="mt-1 text-gray-900">
                  {groupe.iv}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
      
      <div className="flex justify-between items-center pt-4">
        <Link
          to="/groupes"
          className="text-primary-600 hover:underline flex items-center"
        >
          <svg
            className="w-5 h-5 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Retour à la liste des groupes
        </Link>
      </div>
    </div>
  )
}

export default GroupeDetails