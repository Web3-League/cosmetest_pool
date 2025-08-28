import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import groupeService from '../../services/groupeService'
import etudeService from '../../services/etudeService'

const GroupeForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [groupe, setGroupe] = useState({
    intitule: '',
    description: '',
    idEtude: '',
    ageMinimum: '',
    ageMaximum: '',
    ethnie: [],
    criteresSupplémentaires: '',
    nbSujet: '',
    iv: ''
  })

  const [etudes, setEtudes] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // Charger les études pour le select
  useEffect(() => {
    const fetchEtudes = async () => {
      try {
        const response = await etudeService.getAll()
        setEtudes(response)
      } catch (error) {
        console.error('Erreur lors du chargement des études:', error)
        setError('Impossible de charger la liste des études.')
      }
    }

    fetchEtudes()
  }, [])

  // 1. Fonctions utilitaires pour la conversion
  const ethniesArrayToString = (ethniesArray) => {
    return Array.isArray(ethniesArray) ? ethniesArray.join(';') : ''
  }

  const ethniesStringToArray = (ethniesString) => {
    if (!ethniesString || ethniesString === '') return []

    // Supporte à la fois la virgule et le point-virgule
    const separator = ethniesString.includes(';') ? ';' : ','
    return ethniesString.split(separator).filter(e => e.trim() !== '')
  }

  // Charger le groupe si on est en mode édition
  useEffect(() => {
    if (isEditMode) {
      const fetchGroupe = async () => {
        try {
          setIsLoading(true)

          if (!id || id === 'undefined') {
            throw new Error('Identifiant du groupe non valide')
          }

          const data = await groupeService.getById(id)

          // Convertir la chaîne ethnie en tableau pour l'interface
          if (data.ethnie) {
            data.ethnie = ethniesStringToArray(data.ethnie)
          } else {
            data.ethnie = []
          }

          if (!data.idGroupe && data.id) {
            data.idGroupe = data.id
          }

          setGroupe(data)
        } catch (error) {
          console.error('Erreur lors du chargement du groupe:', error)
          setError('Impossible de charger les informations du groupe: ' + error.message)
        } finally {
          setIsLoading(false)
        }
      }

      fetchGroupe()
    }
  }, [id, isEditMode])

  const handleChange = (e) => {
    const { name, value } = e.target

    // Conversion des valeurs numériques
    if (['ageMin', 'ageMax', 'idEtude'].includes(name)) {
      setGroupe({
        ...groupe,
        [name]: value === '' ? '' : Number(value)
      })
    } else {
      setGroupe({
        ...groupe,
        [name]: value
      })
    }
  }

  const ethniesDisponibles = [
    'CAUCASIENNE',
    'AFRICAINE',
    'ASIATIQUE',
    'INDIENNE',
    'ANTILLAISE'
  ]

  const handleEthnieChange = (ethnieValue) => {
    setGroupe(prevGroupe => {
      const currentEthnies = Array.isArray(prevGroupe.ethnie) ? prevGroupe.ethnie : []

      if (currentEthnies.includes(ethnieValue)) {
        return {
          ...prevGroupe,
          ethnie: currentEthnies.filter(e => e !== ethnieValue)
        }
      } else {
        return {
          ...prevGroupe,
          ethnie: [...currentEthnies, ethnieValue]
        }
      }
    })
  }

  const validateForm = () => {
    const errors = {}

    if (!groupe.intitule) errors.intitule = 'L\'intitule du groupe est requis'
    if (!groupe.idEtude) errors.idEtude = 'L\'étude est requise'
    if (groupe.ageMinimum && groupe.ageMaximum && parseInt(groupe.ageMinimum) > parseInt(groupe.ageMaximum)) {
      errors.ageRange = 'L\'âge minimum doit être inférieur à l\'âge maximum'
    }

    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const formErrors = validateForm()
    if (Object.keys(formErrors).length > 0) {
      setError('Veuillez corriger les erreurs suivantes: ' + Object.values(formErrors).join(', '))
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Préparer les données avec ethnie convertie en chaîne
      const dataToSend = {
        ...groupe,
        ethnie: ethniesArrayToString(groupe.ethnie) // Convertir le tableau en chaîne
      }

      console.log('Données envoyées:', dataToSend) // Pour déboguer

      if (isEditMode) {
        await groupeService.update(id, dataToSend)
      } else {
        await groupeService.create(dataToSend)
      }

      setSuccess(true)

      setTimeout(() => {
        navigate('/groupes')
      }, 1500)
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error)
      setError('Une erreur est survenue lors de l\'enregistrement du groupe.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading && isEditMode) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {isEditMode ? 'Modifier le groupe' : 'Créer un nouveau groupe'}
      </h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
          Groupe {isEditMode ? 'modifié' : 'créé'} avec succès! Redirection en cours...
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <div>
          <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-1">
            Intitule du groupe *
          </label>
          <input
            type="text"
            name="intitule"
            id="intitule"
            value={groupe.intitule}
            onChange={handleChange}
            className="form-input w-full"
            required
          />
        </div>

        <div>
          <label htmlFor="idEtude" className="block text-sm font-medium text-gray-700 mb-1">
            Étude *
          </label>
          <select
            name="idEtude"
            id="idEtude"
            value={groupe.idEtude}
            onChange={handleChange}
            className="form-select w-full"
            required
          >
            <option value="">-- Sélectionner une étude --</option>
            {etudes.map((etude) => (
              <option key={etude.idEtude} value={etude.idEtude}>
                {etude.ref || `Étude #${etude.idEtude}`}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="ageMinimum" className="block text-sm font-medium text-gray-700 mb-1">
              Âge minimum
            </label>
            <input
              type="number"
              name="ageMinimum"
              id="ageMinimum"
              value={groupe.ageMinimum}
              onChange={handleChange}
              min="0"
              className="form-input w-full"
            />
          </div>

          <div>
            <label htmlFor="ageMax" className="block text-sm font-medium text-gray-700 mb-1">
              Âge maximum
            </label>
            <input
              type="number"
              name="ageMaximum"
              id="ageMaximum"
              value={groupe.ageMaximum}
              onChange={handleChange}
              min="0"
              className="form-input w-full"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ethnies
          </label>
          <div className="space-y-2">
            {ethniesDisponibles.map((ethnieOption) => (
              <label key={ethnieOption} className="flex items-center">
                <input
                  type="checkbox"
                  checked={Array.isArray(groupe.ethnie) &&
                    groupe.ethnie.some(e => e.toLowerCase() === ethnieOption.toLowerCase())}
                  onChange={() => handleEthnieChange(ethnieOption)}
                  className="form-checkbox h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 capitalize">
                  {ethnieOption.toLowerCase()}
                </span>
              </label>
            ))}
          </div>
          {Array.isArray(groupe.ethnie) && groupe.ethnie.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {groupe.ethnie.length} ethnie(s) sélectionnée(s)
            </p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            id="description"
            value={groupe.description}
            onChange={handleChange}
            rows="3"
            className="form-textarea w-full"
          ></textarea>
        </div>

        <div>
          <label htmlFor='nbSujet' className='block text-sm font-medium text-gray-700 mb-1'>
            Nombre de sujets
          </label>
          <input
            type='number'
            name='nbSujet'
            id='nbSujet'
            value={groupe.nbSujet}
            onChange={handleChange}
            min='0'
            className='form-input w-full'
          />
        </div>

        <div>
          <label htmlFor='iv' className='block text-sm font-medium text-gray-700 mb-1'>
            Indemnité Volontaire
          </label>
          <input
            type='number'
            name='iv'
            id='iv'
            value={groupe.iv}
            onChange={handleChange}
            min='0'
            className='form-input w-full'
          />
        </div>

        <div className="flex justify-end pt-4 space-x-3">
          <button
            type="button"
            onClick={() => navigate('/groupes')}
            className="btn btn-secondary"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="animate-spin inline-block h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></span>
                {isEditMode ? 'Modification...' : 'Création...'}
              </>
            ) : (
              isEditMode ? 'Modifier' : 'Créer'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default GroupeForm