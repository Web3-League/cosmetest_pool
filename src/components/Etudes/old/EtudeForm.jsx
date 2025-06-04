import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import etudeService from '../../../services/etudeService'

const EtudeForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id
  
  const [formData, setFormData] = useState({
    ref: '',
    titre: '',
    description: '',
    examen: '',
    type: '',
    dateDebut: '',
    dateFin: '',
    paye: true, // Changé de false à true pour être rémunérée par défaut
    montant: 0,
    capaciteVolontaires: 0
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [refExists, setRefExists] = useState(false)
  
  useEffect(() => {
    const fetchEtude = async () => {
      if (!isEditMode) return
      
      try {
        setIsLoading(true)
        const data = await etudeService.getById(id)
        setFormData({
          idEtude: data.idEtude,
          ref: data.ref || '',
          titre: data.titre || '',
          description: data.commentaires || '',
          type: data.type || '',
          dateDebut: data.dateDebut ? data.dateDebut.substring(0, 10) : '',
          dateFin: data.dateFin ? data.dateFin.substring(0, 10) : '',
          paye: data.paye === 2 || data.paye === true,
          montant: data.iv || 0,
          capaciteVolontaires: data.capaciteVolontaires || 0,
          examen: data.examens || '',
          washout: data.washout || ''
        })
      } catch (error) {
        console.error('Erreur lors du chargement de l\'étude:', error)
        setError('Erreur lors du chargement des données de l\'étude')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchEtude()
  }, [id, isEditMode])
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Vérifier si la référence existe déjà lors de la création d'une nouvelle étude
    if (name === 'ref' && value && !isEditMode) {
      checkRefExists(value)
    }
  }
  
  const checkRefExists = async (ref) => {
    try {
      const exists = await etudeService.checkRefExists(ref)
      setRefExists(exists)
    } catch (error) {
      console.error('Erreur lors de la vérification de la référence:', error)
    }
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Vérifier si la référence existe déjà
    if (!isEditMode && refExists) {
      setError('Cette référence d\'étude existe déjà')
      return
    }
    
    // Préparer les données pour l'API
    const etudeDTO = {
      ...formData,
      // Convertir le boolean en int pour l'API si nécessaire
      paye: formData.paye ? 1 : 0
    }
    
    try {
      setIsSaving(true)
      setError('')
      
      if (isEditMode) {
        await etudeService.update(id, etudeDTO)
      } else {
        await etudeService.create(etudeDTO)
      }
      
      navigate('/etudes')
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'étude:', error)
      setError('Erreur lors de l\'enregistrement de l\'étude')
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleCancel = () => {
    navigate('/etudes')
  }
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            {isEditMode ? 'Modifier l\'étude' : 'Créer une nouvelle étude'}
          </h1>
          
          {/* Badge de statut de paiement */}
          {isEditMode && (
            <span className={`ml-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              formData.paye 
                ? 'bg-green-100 text-green-800 border border-green-500' 
                : 'bg-red-100 text-red-800 border border-red-500'
            }`}>
              {formData.paye ? 'Rémunérée' : 'Non rémunérée'}
            </span>
          )}
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="ref" className="form-label">Référence *</label>
            <input
              type="text"
              id="ref"
              name="ref"
              value={formData.ref}
              onChange={handleChange}
              className={`form-input ${refExists ? 'border-red-500' : ''}`}
              required
              disabled={isEditMode} // Ne pas permettre de modifier la référence en mode édition
            />
            {refExists && (
              <p className="mt-1 text-sm text-red-600">
                Cette référence existe déjà
              </p>
            )}
          </div>
          
          <div>
            <label htmlFor="titre" className="form-label">Titre *</label>
            <input
              type="text"
              id="titre"
              name="titre"
              value={formData.titre}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="description" className="form-label">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-input min-h-[100px]"
              rows={4}
            />
          </div>
          
          <div className="md:col-span-2">
            <label htmlFor="examen" className="form-label">Examens</label>
            <textarea
              id="examen"
              name="examen"
              value={formData.examen}
              onChange={handleChange}
              className="form-input min-h-[100px]"
              rows={4}
            />
          </div>
          
          <div>
            <label htmlFor="type" className="form-label">Type d'étude *</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="form-input"
              required
            >
              <option value="">Sélectionner</option>
              <option value="CLINIQUE">Clinique</option>
              <option value="USAGE">Usage</option>
              <option value="EFFICACITE">Efficacité MAquillage</option>
              <option value="SENSORIELLE">Sensorielle</option>
              <option value="AUTRE">Autre</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="capaciteVolontaires" className="form-label">Capacité (nombre de volontaires) *</label>
            <input
              type="number"
              id="capaciteVolontaires"
              name="capaciteVolontaires"
              value={formData.capaciteVolontaires}
              onChange={handleChange}
              className="form-input"
              min={0}
              required
            />
          </div>
          
          <div>
            <label htmlFor="dateDebut" className="form-label">Date de début *</label>
            <input
              type="date"
              id="dateDebut"
              name="dateDebut"
              value={formData.dateDebut}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
          
          <div>
            <label htmlFor="dateFin" className="form-label">Date de fin *</label>
            <input
              type="date"
              id="dateFin"
              name="dateFin"
              value={formData.dateFin}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="paye"
              name="paye"
              checked={formData.paye}
              onChange={handleChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="paye" className="ml-2 block text-sm text-gray-700">
              Étude rémunérée
            </label>
          </div>
          
          {formData.paye && (
            <div>
              <label htmlFor="montant" className="form-label">Montant (€)</label>
              <input
                type="number"
                id="montant"
                name="montant"
                value={formData.montant}
                onChange={handleChange}
                className="form-input"
                min={0}
                step={0.01}
              />
            </div>
          )}
        </div>
        
        <div className="mt-8 flex justify-end space-x-4">
          <button
            type="button"
            onClick={handleCancel}
            className="btn btn-outline"
            disabled={isSaving}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSaving || (refExists && !isEditMode)}
          >
            {isSaving ? (
              <span className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Enregistrement...
              </span>
            ) : (
              'Enregistrer'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default EtudeForm