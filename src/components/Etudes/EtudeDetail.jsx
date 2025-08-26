import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from "../../services/api";
import etudeService from '../../services/etudeService'
import rdvService from '../../services/rdvService'
import groupeService from '../../services/groupeService'
import { formatDate } from '../../utils/dateUtils'
import VolunteerExcelExport from './VolunteerExcelExport'
import RdvExcelExport from './RdvExcelExport'
import AppointmentViewer from '../RendezVous/AppointmentViewer'
import GroupEmailSender from './GroupEmailSender'


const EtudeDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [etude, setEtude] = useState(null)
  const [rdvs, setRdvs] = useState([])
  const [groupes, setGroupes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingRdvs, setIsLoadingRdvs] = useState(true)
  const [isLoadingGroupes, setIsLoadingGroupes] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('details')
  const [infosVolontaires, setInfosVolontaires] = useState({})

  // ✅ États pour l'affichage du RDV
  const [selectedRdv, setSelectedRdv] = useState(null)
  const [showRdvViewer, setShowRdvViewer] = useState(false)

  // États pour la gestion du tri
  const [sortField, setSortField] = useState('date')
  const [sortDirection, setSortDirection] = useState('asc')

  // ✅États pour l'affichage du sendEmail
  const [showEmailSender, setShowEmailSender] = useState(false)

  // État pour le menu dropdown des actions
  const [showActionsMenu, setShowActionsMenu] = useState(false)

  // ✅ États pour la gestion des groupes
  const [showGroupeForm, setShowGroupeForm] = useState(false)
  const [newGroupe, setNewGroupe] = useState({
    intitule: '',
    description: '',
    idEtude: id,
    ageMinimum: '',
    ageMaximum: '',
    ethnie: [],
    criteresSupplémentaires: '',
    nbSujet: '',
    iv: ''
  })

  useEffect(() => {
    const fetchEtude = async () => {
      try {
        setIsLoading(true)
        const data = await etudeService.getById(id)
        setEtude(data)
      } catch (error) {
        console.error('Erreur lors du chargement de l\'étude:', error)
        setError('Impossible de charger les détails de l\'étude')
      } finally {
        setIsLoading(false)
      }
    }
    fetchEtude()
  }, [id])

  useEffect(() => {
    const fetchRdvs = async () => {
      if (!id) return

      try {
        setIsLoadingRdvs(true)
        const data = await rdvService.getByEtudeId(id)
        setRdvs(data)
      } catch (error) {
        console.error('Erreur lors du chargement des rendez-vous:', error)
      } finally {
        setIsLoadingRdvs(false)
      }
    }

    if (activeTab === 'rdvs') {
      fetchRdvs()
    }
  }, [id, activeTab])

  // Charger les groupes de l'étude
  useEffect(() => {
    const fetchGroupes = async () => {
      if (!id) return

      try {
        setIsLoadingGroupes(true)
        const data = await groupeService.getGroupesByIdEtude(id)
        setGroupes(data)
      } catch (error) {
        console.error('Erreur lors du chargement des groupes:', error)
      } finally {
        setIsLoadingGroupes(false)
      }
    }

    if (activeTab === 'groupes') {
      fetchGroupes()
    }
  }, [id, activeTab])

  // ✅ Gestionnaire de clic sur un RDV
  const handleRdvClick = (rdv) => {
    // Normaliser les données du RDV pour AppointmentViewer
    const normalizedRdv = {
      ...rdv,
      idEtude: rdv.idEtude || id,
      idRdv: rdv.idRdv || rdv.id,
      etude: etude ? {
        id: etude.idEtude,
        ref: etude.ref,
        titre: etude.titre
      } : null
    }

    setSelectedRdv(normalizedRdv)
    setShowRdvViewer(true)
  }

  // ✅ Retour à la liste des RDVs
  const handleBackToRdvList = () => {
    setShowRdvViewer(false)
    setSelectedRdv(null)
  }

  // ✅ Rafraîchir les données après modification
  const handleRdvUpdate = () => {
    // Recharger les RDVs
    const fetchRdvs = async () => {
      try {
        const data = await rdvService.getByEtudeId(id)
        setRdvs(data)
      } catch (error) {
        console.error('Erreur lors du rechargement des rendez-vous:', error)
      }
    }
    fetchRdvs()

    // Retourner à la liste
    setShowRdvViewer(false)
    setSelectedRdv(null)
  }

  const getUniqueVolunteerIds = () => {
    return [...new Set(
      rdvs
        .map(rdv => rdv.idVolontaire)
        .filter(id => id)
    )]
  }

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette étude ?')) {
      try {
        await etudeService.delete(id)
        navigate('/etudes')
      } catch (error) {
        console.error('Erreur lors de la suppression:', error)
        alert('Une erreur est survenue lors de la suppression de l\'étude')
      }
    }
  }

  const getStatusBadge = (etude) => {
    const now = new Date()
    const startDate = new Date(etude.dateDebut)
    const endDate = new Date(etude.dateFin)

    let status = '';

    if (now < startDate) {
      status = 'A_VENIR';
    } else if (now > endDate) {
      status = 'TERMINEE';
    } else {
      status = 'EN_COURS';
    }

    switch (status) {
      case 'EN_COURS':
        return <span className="badge badge-green">En cours</span>
      case 'A_VENIR':
        return <span className="badge badge-blue">À venir</span>
      case 'TERMINEE':
        return <span className="badge badge-gray">Terminée</span>
      case 'ANNULEE':
        return <span className="badge badge-red">Annulée</span>
      default:
        return <span className="badge badge-gray">Inconnu</span>
    }
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getNomVolontaire = (rdv) => {
    if (rdv.idVolontaire && infosVolontaires[rdv.idVolontaire]) {
      return infosVolontaires[rdv.idVolontaire];
    }

    if (rdv.volontaire) {
      if (typeof rdv.volontaire === 'object') {
        const prenom = rdv.volontaire.prenom || rdv.volontaire.prenomVolontaire || '';
        const nom = rdv.volontaire.nom || rdv.volontaire.nomVolontaire || '';

        if (prenom || nom) {
          return `${prenom} ${nom}`.trim();
        } else if (rdv.volontaire.nomComplet) {
          return rdv.volontaire.nomComplet;
        }
      } else if (typeof rdv.volontaire === 'string') {
        return rdv.volontaire;
      }
    }

    if (rdv.prenomVolontaire && rdv.nomVolontaire) {
      return `${rdv.prenomVolontaire} ${rdv.nomVolontaire}`;
    } else if (rdv.nomCompletVolontaire) {
      return rdv.nomCompletVolontaire;
    }

    if (rdv.idVolontaire) {
      chargerInfosVolontaire(rdv.idVolontaire);
      return `Volontaire #${rdv.idVolontaire}`;
    }

    return 'Non assigné';
  };

  const chargerInfosVolontaire = useCallback(async (idVolontaire) => {
    if (infosVolontaires[idVolontaire]) return;

    try {
      const response = await api.get(`/volontaires/${idVolontaire}`);
      if (response.data) {
        const volontaire = response.data;
        const nomAffiche = volontaire.prenom && volontaire.nom
          ? `${volontaire.prenom} ${volontaire.nom}`.trim()
          : volontaire.nomComplet || `Volontaire #${idVolontaire}`;

        setInfosVolontaires(prev => ({
          ...prev,
          [idVolontaire]: nomAffiche
        }));
      }
    } catch (error) {
      console.error(`Erreur lors de la récupération des infos du volontaire ${idVolontaire}:`, error);
    }
  }, [infosVolontaires]);

  const sortedRdvs = () => {
    if (!rdvs || rdvs.length === 0) return []

    return [...rdvs].sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case 'date':
          comparison = new Date(a.date) - new Date(b.date)
          break
        case 'heure':
          comparison = a.heure.localeCompare(b.heure)
          break
        case 'volontaire': {
          const volontaireA = getNomVolontaire(a)
          const volontaireB = getNomVolontaire(b)
          comparison = volontaireA.localeCompare(volontaireB)
          break
        }
        case 'etat':
          comparison = (a.etat || '').localeCompare(b.etat || '')
          break
        default:
          comparison = 0
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })
  }

  const handleOpenEmailSender = () => {
    setShowEmailSender(true)
    setShowActionsMenu(false)
  }

  const handleCloseEmailSender = () => {
    setShowEmailSender(false)
  }

  // Fonctions pour la gestion des groupes
  const ethniesDisponibles = [
    'CAUCASIENNE',
    'AFRICAINE', 
    'ASIATIQUE',
    'INDIENNE',
    'ANTILLAISE'
  ]

  const ethniesArrayToString = (ethniesArray) => {
    return Array.isArray(ethniesArray) ? ethniesArray.join(',') : ''
  }

  const handleGroupeChange = (e) => {
    const { name, value } = e.target
    
    if (['ageMinimum', 'ageMaximum', 'nbSujet', 'iv'].includes(name)) {
      setNewGroupe({
        ...newGroupe,
        [name]: value === '' ? '' : Number(value)
      })
    } else {
      setNewGroupe({
        ...newGroupe,
        [name]: value
      })
    }
  }

  const handleEthnieChange = (ethnieValue) => {
    setNewGroupe(prevGroupe => {
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

  const handleCreateGroupe = async (e) => {
    e.preventDefault()
    
    if (!newGroupe.intitule) {
      setError('L\'intitulé du groupe est requis')
      return
    }

    try {
      const dataToSend = {
        ...newGroupe,
        idEtude: id,
        ethnie: ethniesArrayToString(newGroupe.ethnie)
      }

      await groupeService.create(dataToSend)
      
      // Recharger les groupes
      const data = await groupeService.getGroupesByIdEtude(id)
      setGroupes(data)
      
      // Reset form
      setNewGroupe({
        intitule: '',
        description: '',
        idEtude: id,
        ageMinimum: '',
        ageMaximum: '',
        ethnie: [],
        criteresSupplémentaires: '',
        nbSujet: '',
        iv: ''
      })
      
      setShowGroupeForm(false)
      
    } catch (error) {
      console.error('Erreur lors de la création du groupe:', error)
      setError('Erreur lors de la création du groupe')
    }
  }

  useEffect(() => {
    if (rdvs && rdvs.length > 0) {
      const idsVolontaires = [...new Set(rdvs
        .map(rdv => rdv.idVolontaire)
        .filter(id => id && !infosVolontaires[id])
      )];

      idsVolontaires.forEach(id => chargerInfosVolontaire(id));
    }
  }, [rdvs, infosVolontaires, chargerInfosVolontaire]);

  const renderSortIcon = (field) => {
    if (sortField !== field) return null

    return sortDirection === 'asc' ? (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    )
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

  if (!etude) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative">
        Étude non trouvée
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          Détails de l'étude: {etude.titre}
        </h1>
        <div className="flex space-x-2">
          <Link
            to={`/etudes/${etude.idEtude}/edit`}
            className="btn btn-outline-primary"
          >
            Modifier
          </Link>
          <button
            onClick={handleDelete}
            className="btn btn-outline-danger"
          >
            Supprimer
          </button>
        </div>
      </div>

      {/* Onglets */}
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
              Détails
            </button>
            <button
              className={`py-4 px-6 border-b-2 font-medium text-sm ${activeTab === 'rdvs'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              onClick={() => setActiveTab('rdvs')}
            >
              Rendez-vous
            </button>
            <button
              className={`py-4 px-6 border-b-2 font-medium text-sm ${activeTab === 'groupes'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              onClick={() => setActiveTab('groupes')}
            >
              Groupes
            </button>
          </nav>
        </div>

        {/* Contenu des onglets */}
        <div className="p-6">
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2 flex justify-between items-center">
                <div>
                  <span className="text-xs uppercase text-gray-500">Référence</span>
                  <h2 className="text-xl font-semibold">{etude.ref}</h2>
                </div>
                <div>
                  {getStatusBadge(etude)}
                </div>
              </div>

              <div className="md:col-span-2">
                <span className="text-xs uppercase text-gray-500">Titre</span>
                <p className="text-lg">{etude.titre}</p>
              </div>

              <div className="md:col-span-2">
                <span className="text-xs uppercase text-gray-500">Description</span>
                <p className="mt-1 whitespace-pre-line">{etude.description || 'Aucune description'}</p>
              </div>

              <div className="md:col-span-2">
                <span className="text-xs uppercase text-gray-500">Examen</span>
                <p className="mt-1">{etude.examens || 'Aucun examen spécifié'}</p>
              </div>

              <div>
                <span className="text-xs uppercase text-gray-500">Type</span>
                <p className="mt-1">{etude.type}</p>
              </div>

              <div>
                <span className="text-xs uppercase text-gray-500">Capacité</span>
                <p className="mt-1">{etude.capaciteVolontaires} volontaires</p>
              </div>

              <div>
                <span className="text-xs uppercase text-gray-500">Date de début</span>
                <p className="mt-1">{formatDate(etude.dateDebut)}</p>
              </div>

              <div>
                <span className="text-xs uppercase text-gray-500">Date de fin</span>
                <p className="mt-1">{formatDate(etude.dateFin)}</p>
              </div>

              <div>
                <span className="text-xs uppercase text-gray-500">Rémunération</span>
                <p className="mt-1">
                  {etude.iv ? `Oui - ${etude.iv} €` : 'Non'}
                </p>
              </div>

              <div>
                <span className="text-xs uppercase text-gray-500">Payer</span>
                <p className="mt-1">
                  {etude.paye ? `Oui - ${etude.paye}` : 'Non'}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'groupes' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Groupes</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Gestion des groupes pour l'étude {etude.ref}
                  </p>
                </div>

                <button
                  onClick={() => setShowGroupeForm(!showGroupeForm)}
                  className="btn btn-primary inline-flex items-center"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Nouveau Groupe
                </button>
              </div>

              {/* Formulaire de création de groupe */}
              {showGroupeForm && (
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-medium text-gray-900">Créer un nouveau groupe</h4>
                    <button
                      onClick={() => setShowGroupeForm(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <form onSubmit={handleCreateGroupe} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="intitule" className="block text-sm font-medium text-gray-700 mb-1">
                          Intitulé du groupe *
                        </label>
                        <input
                          type="text"
                          name="intitule"
                          id="intitule"
                          value={newGroupe.intitule}
                          onChange={handleGroupeChange}
                          className="form-input w-full"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="nbSujet" className="block text-sm font-medium text-gray-700 mb-1">
                          Nombre de sujets
                        </label>
                        <input
                          type="number"
                          name="nbSujet"
                          id="nbSujet"
                          value={newGroupe.nbSujet}
                          onChange={handleGroupeChange}
                          min="0"
                          className="form-input w-full"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        name="description"
                        id="description"
                        value={newGroupe.description}
                        onChange={handleGroupeChange}
                        rows="2"
                        className="form-textarea w-full"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="ageMinimum" className="block text-sm font-medium text-gray-700 mb-1">
                          Âge minimum
                        </label>
                        <input
                          type="number"
                          name="ageMinimum"
                          id="ageMinimum"
                          value={newGroupe.ageMinimum}
                          onChange={handleGroupeChange}
                          min="0"
                          className="form-input w-full"
                        />
                      </div>

                      <div>
                        <label htmlFor="ageMaximum" className="block text-sm font-medium text-gray-700 mb-1">
                          Âge maximum
                        </label>
                        <input
                          type="number"
                          name="ageMaximum"
                          id="ageMaximum"
                          value={newGroupe.ageMaximum}
                          onChange={handleGroupeChange}
                          min="0"
                          className="form-input w-full"
                        />
                      </div>

                      <div>
                        <label htmlFor="iv" className="block text-sm font-medium text-gray-700 mb-1">
                          Indemnité Volontaire
                        </label>
                        <input
                          type="number"
                          name="iv"
                          id="iv"
                          value={newGroupe.iv}
                          onChange={handleGroupeChange}
                          min="0"
                          className="form-input w-full"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ethnies
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        {ethniesDisponibles.map((ethnieOption) => (
                          <label key={ethnieOption} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={Array.isArray(newGroupe.ethnie) && newGroupe.ethnie.includes(ethnieOption)}
                              onChange={() => handleEthnieChange(ethnieOption)}
                              className="form-checkbox h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700 capitalize">
                              {ethnieOption.toLowerCase()}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowGroupeForm(false)}
                        className="btn btn-secondary"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                      >
                        Créer le groupe
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Liste des groupes */}
              {isLoadingGroupes ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
                </div>
              ) : groupes.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun groupe</h3>
                  <p className="mt-1 text-sm text-gray-500">Commencez par créer votre premier groupe pour cette étude.</p>
                  <div className="mt-6">
                    <button
                      onClick={() => setShowGroupeForm(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                    >
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Créer un groupe
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4">
                  {groupes.map((groupe) => (
                    <div key={groupe.idGroupe} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">{groupe.intitule}</h4>
                            <div className="flex items-center space-x-2">
                              {groupe.nbSujet && (
                                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                  {groupe.nbSujet} sujets
                                </span>
                              )}
                              {groupe.iv && (
                                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                  {groupe.iv}€ IV
                                </span>
                              )}
                            </div>
                          </div>

                          {groupe.description && (
                            <p className="text-gray-600 mb-3">{groupe.description}</p>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Âge:</span>
                              <span className="ml-2 text-gray-600">
                                {groupe.ageMinimum || groupe.ageMaximum ? 
                                  `${groupe.ageMinimum || '?'} - ${groupe.ageMaximum || '?'} ans` : 
                                  'Non spécifié'
                                }
                              </span>
                            </div>

                            {groupe.ethnie && (
                              <div className="md:col-span-2">
                                <span className="font-medium text-gray-700">Ethnies:</span>
                                <span className="ml-2 text-gray-600">
                                  {typeof groupe.ethnie === 'string' ? 
                                    groupe.ethnie.split(',').join(', ').toLowerCase() : 
                                    'Non spécifié'
                                  }
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="ml-4 flex items-center space-x-2">
                          <Link
                            to={`/groupes/${groupe.idGroupe}/edit`}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Modifier le groupe"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'rdvs' && (
            <div>
              {/* ✅ Afficher le composant d'envoi d'email si activé */}
              {showEmailSender ? (
                <GroupEmailSender
                  studyId={etude.idEtude}
                  studyRef={etude.ref}
                  studyTitle={etude.titre}
                  onClose={handleCloseEmailSender}
                />

              ) : showRdvViewer && selectedRdv ? (

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Détails du rendez-vous</h3>
                    <button
                      onClick={handleBackToRdvList}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      ← Retour à la liste
                    </button>
                  </div>
                  <AppointmentViewer
                    appointment={selectedRdv}
                    onEdit={() => {
                      navigate(`/rdvs`)
                    }}
                    onBack={handleBackToRdvList}
                    onRefresh={handleRdvUpdate}
                  />
                </div>
              ) : (
                <div>
                  {/* 🎨 En-tête amélioré avec actions regroupées */}
                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 space-y-4 lg:space-y-0">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">Rendez-vous</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Gestion des rendez-vous pour l'étude {etude.ref}
                      </p>
                    </div>

                    {/* Actions principales */}
                    <div className="flex items-center space-x-3">
                      {/* Bouton principal - Gérer les RDV */}
                      <Link
                        to="/rdvs"
                        className="btn btn-outline-primary inline-flex items-center"
                      >
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Nouveau RDV
                      </Link>

                      {/* Actions directes pour les fonctions principales */}
                      {rdvs.length > 0 && (
                        <>
                          {/* Email de groupe - Action directe */}
                          {getUniqueVolunteerIds().length > 0 && (
                            <button
                              onClick={handleOpenEmailSender}
                              className="btn btn-outline-blue inline-flex items-center"
                              title={`Envoyer un email aux ${getUniqueVolunteerIds().length} volontaires`}
                            >
                              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <span className="hidden sm:inline">Email de groupe</span>
                              <span className="sm:hidden">Email</span>
                              <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                                {getUniqueVolunteerIds().length}
                              </span>
                            </button>
                          )}

                          {/* Menu des exports */}
                          <div className="relative">
                            <button
                              onClick={() => setShowActionsMenu(!showActionsMenu)}
                              className="btn btn-outline-gray inline-flex items-center"
                              title="Exporter les données"
                            >
                              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="hidden sm:inline">Exporter</span>
                              <span className="sm:hidden">Export</span>
                              <svg className="h-4 w-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>

                            {showActionsMenu && (
                              <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-20 overflow-hidden">
                                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                  <h4 className="text-sm font-medium text-gray-900">Exporter les données</h4>
                                  <p className="text-xs text-gray-600 mt-1">Téléchargez les données au format Excel</p>
                                </div>
                                
                                <div className="py-2">
                                  {/* Export RDV */}
                                  <div className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100">
                                    <RdvExcelExport
                                      rdvs={rdvs}
                                      studyRef={etude.ref}
                                      studyId={etude.idEtude}
                                      studyTitle={etude.titre}
                                      getNomVolontaire={getNomVolontaire}
                                      className="w-full"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                      Liste complète des {rdvs.length} rendez-vous avec détails
                                    </p>
                                  </div>

                                  {/* Export Volontaires */}
                                  <div className="px-4 py-3 hover:bg-gray-50">
                                    <VolunteerExcelExport
                                      volunteerIds={getUniqueVolunteerIds()}
                                      studyId={etude.idEtude}
                                      studyRef={etude.ref}
                                      className="w-full"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                      Informations détaillées des {getUniqueVolunteerIds().length} volontaires
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Statistiques rapides */}
                  {rdvs.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center">
                          <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-blue-900">Volontaires</p>
                            <p className="text-lg font-semibold text-blue-600">
                              {getUniqueVolunteerIds().length}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center">
                          <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-green-900">Rendez-vous</p>
                            <p className="text-lg font-semibold text-green-600">
                              {rdvs.length}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center">
                          <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L4.18 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-yellow-900">Non assignés</p>
                            <p className="text-lg font-semibold text-yellow-600">
                              {rdvs.filter(rdv => !rdv.idVolontaire).length}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {isLoadingRdvs ? (
                    <div className="flex justify-center items-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
                    </div>
                  ) : rdvs.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun rendez-vous</h3>
                      <p className="mt-1 text-sm text-gray-500">Commencez par créer votre premier rendez-vous pour cette étude.</p>
                      <div className="mt-6">
                        <Link
                          to="/rdvs"
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                        >
                          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Créer un rendez-vous
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          💡 <strong>Astuce :</strong> Cliquez sur n'importe quelle ligne pour voir les détails du rendez-vous et le modifier.
                        </p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                onClick={() => handleSort('date')}
                              >
                                <span className="flex items-center">
                                  Date
                                  {renderSortIcon('date')}
                                </span>
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                onClick={() => handleSort('heure')}
                              >
                                <span className="flex items-center">
                                  Heure
                                  {renderSortIcon('heure')}
                                </span>
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                onClick={() => handleSort('volontaire')}
                              >
                                <span className="flex items-center">
                                  Volontaire
                                  {renderSortIcon('volontaire')}
                                </span>
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                onClick={() => handleSort('etat')}
                              >
                                <span className="flex items-center">
                                  Statut
                                  {renderSortIcon('etat')}
                                </span>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {sortedRdvs().map((rdv) => (
                              <tr
                                key={rdv.id || `${rdv.idEtude}-${rdv.idRdv}`}
                                className="hover:bg-gray-50 cursor-pointer"
                                onClick={() => handleRdvClick(rdv)}
                                title="Cliquer pour voir les détails"
                              >
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {formatDate(rdv.date)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {rdv.heure}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {getNomVolontaire(rdv)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${rdv.etat === 'CONFIRME' ? 'bg-green-100 text-green-800' :
                                    rdv.etat === 'EN_ATTENTE' ? 'bg-yellow-100 text-yellow-800' :
                                      rdv.etat === 'ANNULE' ? 'bg-red-100 text-red-800' :
                                        rdv.etat === 'COMPLETE' ? 'bg-blue-100 text-blue-800' :
                                          'bg-gray-100 text-gray-800'
                                    }`}>
                                    {rdv.etat || 'PLANIFIE'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Clic extérieur pour fermer le menu */}
      {showActionsMenu && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowActionsMenu(false)}
        ></div>
      )}

      <div className="mt-4">
        <Link
          to="/etudes"
          className="text-primary-600 hover:text-primary-800"
        >
          &larr; Retour à la liste des études
        </Link>
      </div>
    </div>
  )
}

export default EtudeDetail