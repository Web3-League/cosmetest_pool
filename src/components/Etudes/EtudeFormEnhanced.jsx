import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import etudeService from '../../services/etudeService'
import etudeVolontaireService from '../../services/etudeVolontaireService'
import groupeService from '../../services/groupeService'
import volontaireService from '../../services/volontaireService'
import api from '../../services/api'

const EtudeFormEnhanced = () => {
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
    paye: false,
    montant: 0,
    capaciteVolontaires: 0,
    indemniteParDefaut: 0,
    groupesIndemnites: []
  })

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [refExists, setRefExists] = useState(false)
  const [volontairesAssignes, setVolontairesAssignes] = useState([])
  const [groupesInfo, setGroupesInfo] = useState({})
  const [volontairesInfo, setVolontairesInfo] = useState({})
  const [activeTab, setActiveTab] = useState('details')
  const [updateStatus, setUpdateStatus] = useState({})
  const [debugInfo, setDebugInfo] = useState('')

  // Fonction pour charger les informations des groupes
  const loadGroupesInfo = async (groupeIds) => {
    if (!groupeIds || groupeIds.length === 0) return

    try {
      const groupesData = {}
      
      const groupePromises = groupeIds.map(async (groupeId) => {
        if (!groupeId || groupesData[groupeId]) return null
        
        try {
          const groupe = await groupeService.getById(groupeId)
          return { id: groupeId, data: groupe }
        } catch (error) {
          console.error(`Erreur lors du chargement du groupe ${groupeId}:`, error)
          return { id: groupeId, data: null }
        }
      })

      const results = await Promise.all(groupePromises)
      
      results.forEach(result => {
        if (result && result.data) {
          groupesData[result.id] = result.data
        }
      })

      setGroupesInfo(prev => ({ ...prev, ...groupesData }))
    } catch (error) {
      console.error('Erreur lors du chargement des groupes:', error)
    }
  }

  // Fonction pour charger les informations des volontaires
  const loadVolontairesInfo = async (volontaireIds) => {
    if (!volontaireIds || volontaireIds.length === 0) return

    try {
      const volontairesData = {}
      
      const volontairePromises = volontaireIds.map(async (volontaireId) => {
        if (!volontaireId || volontairesData[volontaireId]) return null
        
        try {
          const response = await volontaireService.getDetails(volontaireId)
          console.log(`Données brutes du volontaire ${volontaireId}:`, response.data) // Debug
          return { id: volontaireId, data: response.data }
        } catch (error) {
          console.error(`Erreur lors du chargement du volontaire ${volontaireId}:`, error)
          return { id: volontaireId, data: null }
        }
      })

      const results = await Promise.all(volontairePromises)
      
      results.forEach(result => {
        if (result && result.data) {
          volontairesData[result.id] = result.data
          console.log(`Volontaire ${result.id} chargé:`, result.data) // Debug
        }
      })

      setVolontairesInfo(prev => ({ ...prev, ...volontairesData }))
      console.log('Volontaires info mis à jour:', volontairesData) // Debug
    } catch (error) {
      console.error('Erreur lors du chargement des volontaires:', error)
    }
  }

  // Fonction pour obtenir le nom du groupe
  const getGroupeName = (idGroupe) => {
    if (!idGroupe || idGroupe === 0) return 'Aucun groupe'
    
    const groupe = groupesInfo[idGroupe]
    if (!groupe) return `Groupe #${idGroupe}`
    
    return groupe.intitule || groupe.nom || `Groupe #${idGroupe}`
  }

  // Fonction pour obtenir les détails du groupe
  const getGroupeDetails = (idGroupe) => {
    if (!idGroupe || idGroupe === 0) return null
    
    const groupe = groupesInfo[idGroupe]
    if (!groupe) return null
    
    return {
      nom: groupe.intitule || groupe.nom,
      ageMin: groupe.ageMinimum || groupe.ageMin,
      ageMax: groupe.ageMaximum || groupe.ageMax,
      ethnie: groupe.ethnie,
      iv: groupe.iv
    }
  }

  // Fonction pour obtenir le nom complet du volontaire
  const getVolontaireName = (idVolontaire) => {
    if (!idVolontaire) return 'Volontaire non assigné'
    
    const volontaire = volontairesInfo[idVolontaire]
    console.log(`getVolontaireName pour ${idVolontaire}:`, volontaire) // Debug
    
    if (!volontaire) return `Volontaire #${idVolontaire}`
    
    // Essayer différentes propriétés possibles
    const prenom = volontaire.prenom || volontaire.prenomVol || volontaire.prenomVolontaire || ''
    const nom = volontaire.nom || volontaire.nomVol || volontaire.nomVolontaire || ''
    
    console.log(`Prenom: "${prenom}", Nom: "${nom}"`) // Debug
    
    if (prenom && nom) {
      return `${prenom} ${nom}`
    } else if (prenom) {
      return prenom
    } else if (nom) {
      return nom
    }
    
    // Si aucun nom n'est trouvé, essayer d'autres propriétés
    if (volontaire.nomComplet) {
      return volontaire.nomComplet
    }
    
    return `Volontaire #${idVolontaire}`
  }

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
          washout: data.washout || '',
          indemniteParDefaut: data.iv || 0,
          groupesIndemnites: []
        })

        if (data.idEtude) {
          console.log('Chargement des volontaires pour étude:', data.idEtude)
          const assignes = await etudeVolontaireService.getVolontairesByEtude(data.idEtude)
          console.log('Volontaires chargés:', assignes)
          setVolontairesAssignes(assignes)
          setDebugInfo(`${assignes.length} volontaires trouvés`)

          // Charger les informations des groupes
          const uniqueGroupeIds = [...new Set(
            assignes
              .map(v => v.idGroupe)
              .filter(id => id && id !== 0)
          )]
          
          if (uniqueGroupeIds.length > 0) {
            console.log('Chargement des groupes:', uniqueGroupeIds)
            await loadGroupesInfo(uniqueGroupeIds)
          }

          // Charger les informations des volontaires
          const uniqueVolontaireIds = [...new Set(
            assignes
              .map(v => v.idVolontaire)
              .filter(id => id)
          )]
          
          if (uniqueVolontaireIds.length > 0) {
            console.log('Chargement des informations des volontaires:', uniqueVolontaireIds)
            await loadVolontairesInfo(uniqueVolontaireIds)
          }
        }
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

  const handleAddGroupeIndemnite = () => {
    setFormData(prev => ({
      ...prev,
      groupesIndemnites: [
        ...prev.groupesIndemnites,
        { id: Date.now(), nom: '', indemnite: 0, description: '' }
      ]
    }))
  }

  const handleRemoveGroupeIndemnite = (groupeId) => {
    setFormData(prev => ({
      ...prev,
      groupesIndemnites: prev.groupesIndemnites.filter(g => g.id !== groupeId)
    }))
  }

  const handleGroupeIndemniteChange = (groupeId, field, value) => {
    setFormData(prev => ({
      ...prev,
      groupesIndemnites: prev.groupesIndemnites.map(g =>
        g.id === groupeId ? { ...g, [field]: value } : g
      )
    }))
  }

  const handleUpdateVolontaireIV = async (volontaire, nouvelleIV) => {
    const volontaireId = volontaire.idVolontaire

    try {
      setUpdateStatus(prev => ({ ...prev, [volontaireId]: 'loading' }))

      console.log('=== MISE À JOUR IV ===')
      console.log('Volontaire ID:', volontaireId)
      console.log('IV actuelle:', volontaire.iv)
      console.log('Nouvelle IV demandée:', nouvelleIV)

      const nouvelIVInt = Math.round(parseFloat(nouvelleIV))

      if (nouvelIVInt === (volontaire.iv || 0)) {
        console.log('IV identique, aucune mise à jour nécessaire')
        setUpdateStatus(prev => ({ ...prev, [volontaireId]: 'success' }))
        setTimeout(() => {
          setUpdateStatus(prev => {
            const newStatus = { ...prev }
            delete newStatus[volontaireId]
            return newStatus
          })
        }, 1000)
        return
      }

      const params = {
        idEtude: parseInt(id),
        idGroupe: volontaire.idGroupe || 0,
        idVolontaire: volontaire.idVolontaire,
        iv: volontaire.iv || 0,
        numsujet: volontaire.numsujet || 0,
        paye: volontaire.paye || 0,
        statut: volontaire.statut || 'INSCRIT',
        nouvelIV: nouvelIVInt
      }

      console.log('Paramètres pour update-iv:', params)

      const response = await api.patch('/etude-volontaires/update-iv', null, { params })

      console.log('Mise à jour IV réussie:', response.data)

      // Recharger les données pour voir le changement
      const assignes = await etudeVolontaireService.getVolontairesByEtude(id)
      setVolontairesAssignes(assignes)

      // Recharger les informations des volontaires si nécessaire
      const nouveauxVolontaireIds = assignes
        .map(v => v.idVolontaire)
        .filter(vId => vId && !volontairesInfo[vId])
      
      if (nouveauxVolontaireIds.length > 0) {
        await loadVolontairesInfo(nouveauxVolontaireIds)
      }

      setUpdateStatus(prev => ({ ...prev, [volontaireId]: 'success' }))
      setDebugInfo(`IV mise à jour avec succès: ${volontaire.iv}€ → ${nouvelIVInt}€`)

      setTimeout(() => {
        setUpdateStatus(prev => {
          const newStatus = { ...prev }
          delete newStatus[volontaireId]
          return newStatus
        })
      }, 2000)

    } catch (error) {
      console.error('=== ERREUR MISE À JOUR IV ===')
      console.error('Erreur complète:', error)

      setUpdateStatus(prev => ({ ...prev, [volontaireId]: 'error' }))

      let errorMessage = 'Erreur inconnue'

      if (error.response?.data) {
        const errorData = error.response.data

        switch (errorData.error) {
          case 'CONFLICT':
            errorMessage = `Conflit: Une association avec l'IV ${nouvelleIV}€ existe déjà pour ce volontaire`
            break
          case 'NOT_FOUND':
            errorMessage = 'Association volontaire-étude non trouvée'
            break
          case 'VALIDATION_ERROR':
            errorMessage = `Validation: ${errorData.message}`
            break
          case 'INTERNAL_ERROR':
            errorMessage = `Erreur interne: ${errorData.message}`
            break
          default:
            errorMessage = errorData.message || JSON.stringify(errorData)
        }
      } else if (error.message) {
        errorMessage = error.message
      }

      setError(`Erreur mise à jour IV (Volontaire ${volontaireId}): ${errorMessage}`)
      setDebugInfo(`Erreur: ${errorMessage}`)

      setTimeout(() => {
        setUpdateStatus(prev => {
          const newStatus = { ...prev }
          delete newStatus[volontaireId]
          return newStatus
        })
      }, 3000)
    }
  }

  const appliquerIndemniteGroupeExistant = async (idGroupe) => {
    const groupeDetails = getGroupeDetails(idGroupe)
    if (!groupeDetails || !groupeDetails.iv) {
      alert('Ce groupe n\'a pas d\'indemnité définie')
      return
    }

    const volontairesDuGroupe = volontairesAssignes.filter(v => v.idGroupe === idGroupe)
    
    if (volontairesDuGroupe.length === 0) {
      alert('Aucun volontaire trouvé dans ce groupe')
      return
    }

    if (!window.confirm(`Appliquer l'indemnité de ${groupeDetails.iv}€ à tous les ${volontairesDuGroupe.length} volontaires du groupe "${groupeDetails.nom}" ?`)) {
      return
    }

    try {
      setIsSaving(true)
      let successCount = 0
      let errorCount = 0

      for (const volontaire of volontairesDuGroupe) {
        try {
          await handleUpdateVolontaireIV(volontaire, groupeDetails.iv)
          successCount++
          await new Promise(resolve => setTimeout(resolve, 100))
        } catch (error) {
          errorCount++
          console.error(`Erreur pour le volontaire ${volontaire.idVolontaire}:`, error)
        }
      }

      if (errorCount === 0) {
        alert(`Indemnité appliquée avec succès à ${successCount} volontaire(s) du groupe "${groupeDetails.nom}"`)
      } else {
        alert(`${successCount} mise(s) à jour réussie(s), ${errorCount} erreur(s)`)
      }

    } catch (error) {
      console.error('Erreur lors de l\'application de l\'indemnité de groupe:', error)
      setError('Erreur lors de l\'application de l\'indemnité de groupe')
    } finally {
      setIsSaving(false)
    }
  }

  const appliquerIndemniteGroupe = async (indemnite) => {
    if (!window.confirm(`Appliquer l'indemnité de ${indemnite}€ à tous les volontaires ?`)) {
      return
    }

    try {
      setIsSaving(true)
      let successCount = 0
      let errorCount = 0

      for (const volontaire of volontairesAssignes) {
        try {
          await handleUpdateVolontaireIV(volontaire, indemnite)
          successCount++
          await new Promise(resolve => setTimeout(resolve, 100))
        } catch (error) {
          errorCount++
          console.error(`Erreur pour le volontaire ${volontaire.idVolontaire}:`, error)
        }
      }

      if (errorCount === 0) {
        alert(`Indemnité appliquée avec succès à ${successCount} volontaire(s)`)
      } else {
        alert(`${successCount} mise(s) à jour réussie(s), ${errorCount} erreur(s)`)
      }

    } catch (error) {
      console.error('Erreur lors de l\'application de l\'indemnité de groupe:', error)
      setError('Erreur lors de l\'application de l\'indemnité de groupe')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!isEditMode && refExists) {
      setError('Cette référence d\'étude existe déjà')
      return
    }

    const etudeDTO = {
      ...formData,
      paye: formData.paye ? 1 : 0
    }

    try {
      setIsSaving(true)
      setError('')

      if (isEditMode) {
        await etudeService.update(id, etudeDTO)
      } else {
        const nouvelleEtude = await etudeService.create(etudeDTO)
        navigate(`/etudes/${nouvelleEtude.idEtude}/edit`)
        return
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

  const calculerTotalIndemnites = () => {
    return volontairesAssignes.reduce((total, volontaire) => total + (volontaire.iv || 0), 0)
  }

  const calculerMoyenneIndemnite = () => {
    if (volontairesAssignes.length === 0) return 0
    return calculerTotalIndemnites() / volontairesAssignes.length
  }

  const getGroupesWithVolontaires = () => {
    const groupes = new Map()
    
    volontairesAssignes.forEach(volontaire => {
      const idGroupe = volontaire.idGroupe || 0
      const groupeKey = idGroupe === 0 ? 'aucun' : idGroupe
      
      if (!groupes.has(groupeKey)) {
        groupes.set(groupeKey, {
          id: idGroupe,
          nom: getGroupeName(idGroupe),
          details: getGroupeDetails(idGroupe),
          volontaires: []
        })
      }
      
      groupes.get(groupeKey).volontaires.push(volontaire)
    })
    
    return Array.from(groupes.values())
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'loading':
        return <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
      case 'success':
        return <span className="text-green-500 text-lg">✓</span>
      case 'error':
        return <span className="text-red-500 text-lg">✗</span>
      default:
        return null
    }
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

          {isEditMode && (
            <span className={`ml-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${formData.paye
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
          <button
            onClick={() => setError('')}
            className="absolute top-0 right-0 mt-2 mr-2 text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {debugInfo && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative">
          <strong>Debug:</strong> {debugInfo}
          <button
            onClick={() => setDebugInfo('')}
            className="absolute top-0 right-0 mt-2 mr-2 text-blue-500 hover:text-blue-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Onglets */}
      {isEditMode && (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                className={`py-4 px-6 border-b-2 font-medium text-sm ${activeTab === 'details'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                onClick={() => setActiveTab('details')}
              >
                Détails de l'étude
              </button>
              <button
                className={`py-4 px-6 border-b-2 font-medium text-sm ${activeTab === 'indemnites'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                onClick={() => setActiveTab('indemnites')}
              >
                Gestion des indemnités ({volontairesAssignes.length})
              </button>
            </nav>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
        {(!isEditMode || activeTab === 'details') && (
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
                disabled={isEditMode}
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
                <option value="EFFICACITE">Efficacité Maquillage</option>
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
                <label htmlFor="indemniteParDefaut" className="form-label">Indemnité par défaut (€)</label>
                <input
                  type="number"
                  id="indemniteParDefaut"
                  name="indemniteParDefaut"
                  value={formData.indemniteParDefaut}
                  onChange={handleChange}
                  className="form-input"
                  min={0}
                  step={1}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Cette indemnité sera appliquée par défaut aux nouveaux volontaires (en euros, entier)
                </p>
              </div>
            )}
          </div>
        )}

        {isEditMode && activeTab === 'indemnites' && (
          <div className="space-y-6">
            {/* Statistiques des indemnités */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800">Total des indemnités</h3>
                <p className="text-2xl font-bold text-blue-900">{calculerTotalIndemnites().toFixed(0)} €</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-green-800">Moyenne par volontaire</h3>
                <p className="text-2xl font-bold text-green-900">{calculerMoyenneIndemnite().toFixed(0)} €</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-purple-800">Volontaires assignés</h3>
                <p className="text-2xl font-bold text-purple-900">{volontairesAssignes.length}</p>
              </div>
            </div>

            {/* Gestion par groupes existants */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-4">Actions par groupe</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getGroupesWithVolontaires().map(groupe => (
                  <div key={groupe.id || 'aucun'} className="bg-white p-4 rounded border">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">{groupe.nom}</h4>
                        <p className="text-sm text-gray-600">{groupe.volontaires.length} volontaire(s)</p>
                        <div className="text-xs text-gray-500 mt-1">
                          {groupe.volontaires.slice(0, 3).map(v => getVolontaireName(v.idVolontaire)).join(', ')}
                          {groupe.volontaires.length > 3 && '...'}
                        </div>
                      </div>
                      {groupe.details?.iv && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                          {groupe.details.iv}€
                        </span>
                      )}
                    </div>
                    
                    {groupe.details && (
                      <div className="text-xs text-gray-500 mb-3 space-y-1">
                        {groupe.details.ageMin && groupe.details.ageMax && (
                          <div>Âge: {groupe.details.ageMin}-{groupe.details.ageMax} ans</div>
                        )}
                        {groupe.details.ethnie && (
                          <div>Ethnie: {groupe.details.ethnie}</div>
                        )}
                      </div>
                    )}
                    
                    {groupe.details?.iv ? (
                      <button
                        type="button"
                        onClick={() => appliquerIndemniteGroupeExistant(groupe.id)}
                        className="btn btn-primary btn-sm w-full"
                        disabled={isSaving}
                      >
                        Appliquer {groupe.details.iv}€
                      </button>
                    ) : (
                      <p className="text-xs text-gray-400 italic">
                        Aucune indemnité définie pour ce groupe
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Gestion des groupes d'indemnités personnalisés */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Groupes d'indemnités personnalisés</h3>
                <button
                  type="button"
                  onClick={handleAddGroupeIndemnite}
                  className="btn btn-outline-primary btn-sm"
                >
                  + Ajouter un groupe
                </button>
              </div>

              {formData.groupesIndemnites.map(groupe => (
                <div key={groupe.id} className="bg-white p-4 rounded border mb-3">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                    <div>
                      <label className="form-label">Nom du groupe</label>
                      <input
                        type="text"
                        value={groupe.nom}
                        onChange={(e) => handleGroupeIndemniteChange(groupe.id, 'nom', e.target.value)}
                        className="form-input"
                        placeholder="Ex: Groupe A"
                      />
                    </div>
                    <div>
                      <label className="form-label">Indemnité (€)</label>
                      <input
                        type="number"
                        value={groupe.indemnite}
                        onChange={(e) => handleGroupeIndemniteChange(groupe.id, 'indemnite', e.target.value)}
                        className="form-input"
                        min="0"
                        step="1"
                      />
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => appliquerIndemniteGroupe(groupe.indemnite)}
                        className="btn btn-primary btn-sm w-full"
                        disabled={isSaving || !groupe.indemnite}
                      >
                        {isSaving ? 'Application...' : 'Appliquer à tous'}
                      </button>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => handleRemoveGroupeIndemnite(groupe.id)}
                        className="btn btn-outline-danger btn-sm w-full"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Liste des volontaires avec gestion individuelle des indemnités */}
            <div>
              <h3 className="text-lg font-medium mb-4">Indemnités individuelles</h3>
              {volontairesAssignes.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">
                    Aucun volontaire assigné à cette étude
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Utilisez la gestion des rendez-vous pour assigner des volontaires
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Volontaire
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Groupe
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Indemnité actuelle (€)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Modifier (€)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Statut paiement
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {volontairesAssignes.map((volontaire, index) => (
                        <tr key={`${volontaire.idVolontaire}-${index}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>
                              <div className="font-medium">{getVolontaireName(volontaire.idVolontaire)}</div>
                              <div className="text-xs text-gray-500">ID: {volontaire.idVolontaire}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>
                              <div className="font-medium">{getGroupeName(volontaire.idGroupe)}</div>
                              {volontaire.idGroupe && volontaire.idGroupe !== 0 && (
                                <div className="text-xs text-gray-500">
                                  ID: {volontaire.idGroupe}
                                  {getGroupeDetails(volontaire.idGroupe)?.iv && (
                                    <span className="ml-2 text-green-600">
                                      IV: {getGroupeDetails(volontaire.idGroupe).iv}€
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="font-semibold">{volontaire.iv || 0} €</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                defaultValue={volontaire.iv || 0}
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                min="0"
                                step="1"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleUpdateVolontaireIV(volontaire, e.target.value)
                                  }
                                }}
                                onBlur={(e) => {
                                  if (parseInt(e.target.value) !== (volontaire.iv || 0)) {
                                    handleUpdateVolontaireIV(volontaire, e.target.value)
                                  }
                                }}
                              />
                              <div className="w-6 h-6 flex items-center justify-center">
                                {getStatusIcon(updateStatus[volontaire.idVolontaire])}
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Entrée ou clic ailleurs pour sauvegarder (entier)
                            </p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${volontaire.paye === 1
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                              }`}>
                              {volontaire.paye === 1 ? 'Payé' : 'Non payé'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm space-y-1">
                            <button
                              type="button"
                              onClick={() => handleUpdateVolontaireIV(volontaire, formData.indemniteParDefaut)}
                              className="text-blue-600 hover:text-blue-800 text-xs block"
                              disabled={updateStatus[volontaire.idVolontaire] === 'loading'}
                            >
                              Appliquer défaut ({formData.indemniteParDefaut}€)
                            </button>
                            {getGroupeDetails(volontaire.idGroupe)?.iv && (
                              <button
                                type="button"
                                onClick={() => handleUpdateVolontaireIV(volontaire, getGroupeDetails(volontaire.idGroupe).iv)}
                                className="text-green-600 hover:text-green-800 text-xs block"
                                disabled={updateStatus[volontaire.idVolontaire] === 'loading'}
                              >
                                Appliquer groupe ({getGroupeDetails(volontaire.idGroupe).iv}€)
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

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

export default EtudeFormEnhanced