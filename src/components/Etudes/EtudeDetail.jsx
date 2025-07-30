import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from "../../services/api";
import etudeService from '../../services/etudeService'
import rdvService from '../../services/rdvService'
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
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingRdvs, setIsLoadingRdvs] = useState(true)
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

  const chargerInfosVolontaire = async (idVolontaire) => {
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
  };

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
  }

  const handleCloseEmailSender = () => {
    setShowEmailSender(false)
  }


  useEffect(() => {
    if (rdvs && rdvs.length > 0) {
      const idsVolontaires = [...new Set(rdvs
        .map(rdv => rdv.idVolontaire)
        .filter(id => id && !infosVolontaires[id])
      )];

      idsVolontaires.forEach(id => chargerInfosVolontaire(id));
    }
  }, [rdvs, infosVolontaires]);

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

  // ✅ Ne pas faire de return early, gérer dans l'onglet

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
                      // Utiliser la route correcte du router
                      navigate(`/rdvs`)
                    }}
                    onBack={handleBackToRdvList}
                    onRefresh={handleRdvUpdate}
                  />
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Rendez-vous de l'étude</h3>

                    <div className="flex space-x-2">
                      {/* ✅ Nouveau bouton pour l'envoi d'email de groupe */}
                      {getUniqueVolunteerIds().length > 0 && (
                        <button
                          onClick={handleOpenEmailSender}
                          className="btn btn-outline-primary btn-sm"
                          title="Envoyer un email à tous les volontaires de l'étude"
                        >
                          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Email de groupe
                        </button>
                      )}
                      {rdvs.length > 0 && (
                        <>
                          <RdvExcelExport
                            rdvs={rdvs}
                            studyRef={etude.ref}
                            studyId={etude.idEtude}
                            studyTitle={etude.titre}
                            getNomVolontaire={getNomVolontaire}
                          />
                          <VolunteerExcelExport
                            volunteerIds={getUniqueVolunteerIds()}
                            studyId={etude.idEtude}
                            studyRef={etude.ref}
                          />
                        </>
                      )}
                      {/* ✅ Remplacer le lien obsolète par navigation vers gestionnaire RDV */}
                      <Link
                        to="/rdvs"
                        className="btn btn-primary btn-sm"
                      >
                        Gérer les RDV
                      </Link>
                    </div>
                  </div>

                  {rdvs.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-blue-900">Volontaires de l'étude</h4>
                          <p className="text-sm text-blue-700">
                            {getUniqueVolunteerIds().length} volontaire(s) assigné(s) • {rdvs.length} rendez-vous total
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-blue-600">
                            {rdvs.filter(rdv => !rdv.idVolontaire).length} RDV non assignés
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {isLoadingRdvs ? (
                    <div className="flex justify-center items-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
                    </div>
                  ) : rdvs.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">Aucun rendez-vous pour cette étude</p>
                      <Link
                        to="/rdvs"
                        className="mt-2 inline-block text-primary-600 hover:text-primary-800"
                      >
                        Gérer les rendez-vous
                      </Link>
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