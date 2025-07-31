import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import volontaireService from '../../services/volontaireService'
import rdvService from '../../services/rdvService'
import etudeVolontaireService from '../../services/etudeVolontaireService'
import photoService from '../../services/photoService'
import infoBancaireService from '../../services/infoBancaireService'
import { formatGender, formatSkinType, formatPhototype, formatEthnie } from '../../utils/formatters'
import { ChevronRightIcon } from '../../components/icons'
import { formatDate, calculateAgeFromDate } from '../../utils/dateUtils'
import PhotoViewer from './PhotoViewer.jsx'
import VolontairePhoto from './VolontairePhoto.jsx'
import VolontaireDetailRdv from './VolontaireDetailRdv.jsx'
import VolontaireDetailEtude from './VolontaireDetailEtude.jsx'
import VolontaireAppointmentAssigner from './VolontaireAppointmentAssigner.jsx'

const VolontaireDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  // États pour les données principales
  const [volontaire, setVolontaire] = useState(null)
  const [detailsData, setDetailsData] = useState(null)
  const [infoBankData, setInfoBankData] = useState({ iban: '', bic: '' })
  const [rdvs, setRdvs] = useState([])
  const [etudesCount, setEtudesCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('info')

  // États pour les photos
  const [photos, setPhotos] = useState([])
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [photoUploadError, setPhotoUploadError] = useState(null)
  const [selectedPhoto, setSelectedPhoto] = useState(null)

  // Fonction pour charger les photos du volontaire
  const fetchPhotos = async () => {
    if (volontaire && volontaire.nomVol) {
      try {
        const result = await photoService.checkVolontairePhoto(volontaire.nomVol)
        if (result.exists) {
          setPhotos([{ url: result.url, nom: `f_${volontaire.nomVol.toLowerCase().replace(/\s+/g, '_')}.jpg` }])
        } else {
          setPhotos([])
        }
      } catch (error) {
        console.error('Erreur lors du chargement des photos:', error)
      }
    }
  }

  // Fonction pour télécharger une photo
  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    setPhotoUploadError(null);

    try {
      const result = await photoService.uploadVolontairePhoto(id, file);
      if (result.success) {
        await fetchPhotos();
      } else {
        setPhotoUploadError(result.message);
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement de la photo:', error);
      setPhotoUploadError('Une erreur est survenue lors du téléchargement');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Fonction pour recharger les données après assignation
  const handleAssignmentComplete = async () => {
    try {
      // Recharger les rendez-vous du volontaire
      const rdvsData = await rdvService.getByVolontaire(id)
      setRdvs(Array.isArray(rdvsData) ? rdvsData : [])

      // Recharger le nombre d'études
      const etudesResponse = await etudeVolontaireService.getEtudesByVolontaire(id);
      setEtudesCount((etudesResponse.data || []).length);
    } catch (error) {
      console.warn('Erreur lors du rechargement des données:', error);
    }
  }

  // Effet pour charger les photos quand le volontaire est disponible
  useEffect(() => {
    if (volontaire && volontaire.nomVol) {
      fetchPhotos();
    }
  }, [volontaire]);

  // Effet principal pour charger les données du volontaire
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Charger les informations de base du volontaire
        const volontaireResponse = await volontaireService.getById(id)
        setVolontaire(volontaireResponse.data)

        // Charger les détails complémentaires du volontaire
        try {
          const detailsResponse = await volontaireService.getDetails(id)
          setDetailsData(detailsResponse.data)
        } catch (detailsError) {
          console.warn('Erreur lors du chargement des détails du volontaire:', detailsError)
        }

        // Charger les rendez-vous du volontaire
        try {
          const rdvsData = await rdvService.getByVolontaire(id)
          setRdvs(Array.isArray(rdvsData) ? rdvsData : [])
        } catch (rdvsError) {
          console.warn('Erreur lors du chargement des rendez-vous du volontaire:', rdvsError)
          setRdvs([])
        }

        // Charger le nombre d'études pour l'onglet
        try {
          const etudesResponse = await etudeVolontaireService.getEtudesByVolontaire(id);
          setEtudesCount((etudesResponse.data || []).length);
        } catch (etudesError) {
          console.warn('Erreur lors du comptage des études:', etudesError);
        }

        // Charger les informations bancaires du volontaire
        let infoBankData = { iban: '', bic: '' };
        try {
          const infoBankResponse = await infoBancaireService.getByVolontaireId(id);
          if (infoBankResponse.data && infoBankResponse.data.length > 0) {
            // Prendre la première information bancaire
            const bankInfo = infoBankResponse.data[0];
            infoBankData = {
              iban: bankInfo.iban || '',
              bic: bankInfo.bic || ''
            };
          }
          setInfoBankData(infoBankData);
        } catch (infoBankError) {
          console.warn("Erreur lors du chargement de l'InfoBank du volontaire:", infoBankError);
        }

      } catch (error) {
        console.error('Erreur lors du chargement des données du volontaire:', error)
        setError('Impossible de charger les informations du volontaire')
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchData()
    } else {
      console.error('Aucun ID fourni pour le volontaire')
    }
  }, [id])

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce volontaire ? Cette action est irréversible.')) {
      try {
        await volontaireService.delete(id)
        navigate('/volontaires')
      } catch (error) {
        console.error('Erreur lors de la suppression du volontaire:', error)
        alert('Une erreur est survenue lors de la suppression du volontaire')
      }
    }
  }

  const handleArchive = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir archiver ce volontaire ?')) {
      try {
        await volontaireService.archive(id)
        // Recharger les détails du volontaire
        const updatedVolontaire = await volontaireService.getById(id)
        setVolontaire(updatedVolontaire.data)
      } catch (error) {
        console.error('Erreur lors de l\'archivage du volontaire:', error)
        alert('Une erreur est survenue lors de l\'archivage du volontaire')
      }
    }
  }

  const handleUnarchive = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir désarchiver ce volontaire ?')) {
      try {
        await volontaireService.unarchive(id)
        // Recharger les détails du volontaire
        const updatedVolontaire = await volontaireService.getById(id)
        setVolontaire(updatedVolontaire.data)
      } catch (error) {
        console.error('Erreur lors du désarchivage du volontaire:', error)
        alert('Une erreur est survenue lors du désarchivage du volontaire')
      }
    }
  }

  // Fonction utilitaire pour afficher une valeur ou un tiret si vide
  const displayValue = (value) => value || '-'

  // Fonction pour afficher Oui/Non
  const displayYesNo = (value) => value === 'Oui' ? 'Oui' : value === 'Non' ? 'Non' : '-'

  // Fonction pour afficher les étoiles d'évaluation
  const renderStars = (evaluation) => {
    const numStars = parseInt(evaluation || 0)
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3].map((star) => (
          <svg
            key={star}
            className={`w-5 h-5 ${star <= numStars ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-2 text-md text-gray-600">({numStars}/3)</span>
      </div>
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
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <p className="text-red-700">{error}</p>
        <Link to="/volontaires" className="mt-2 inline-block text-primary-600 hover:underline">
          Retour à la liste des volontaires
        </Link>
      </div>
    )
  }

  if (!volontaire) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <p className="text-yellow-700">
          Volontaire non trouvé. Il est possible qu'il ait été supprimé ou que l'identifiant soit incorrect.
        </p>
        <Link to="/volontaires" className="mt-2 inline-block text-primary-600 hover:underline">
          Retour à la liste des volontaires
        </Link>
      </div>
    )
  }

  // Fusionner les données du volontaire et les détails pour l'affichage
  const volontaireDisplayData = { ...volontaire, ...(detailsData || {}) }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center">
          <Link to="/volontaires" className="text-brand-cyan hover:text-primary-600">
            Volontaires
          </Link>
          <ChevronRightIcon className="mx-2 text-gray-400" width={16} height={16} />
          <span className="font-medium">
            {volontaire.prenom} {volontaire.nom}
          </span>
        </div>

        <div className="flex space-x-2">
          <Link
            to={`/volontaires/${id}/edit`}
            className="btn btn-outline"
          >
            Modifier
          </Link>

          {volontaire.archive ? (
            <button
              onClick={handleUnarchive}
              className="btn btn-outline"
            >
              Désarchiver
            </button>
          ) : (
            <button
              onClick={handleArchive}
              className="btn btn-outline"
            >
              Archiver
            </button>
          )}

          <button
            onClick={handleDelete}
            className="btn bg-red-600 text-white hover:bg-red-700"
          >
            Supprimer
          </button>
        </div>
      </div>

      {volontaire.archive && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p className="text-yellow-700">
            Ce volontaire est archivé et n'apparaîtra pas dans les recherches par défaut.
          </p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex flex-wrap">
            <button
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'info'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
                }`}
              onClick={() => setActiveTab('info')}
            >
              Informations personnelles
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'caracteristiques'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
                }`}
              onClick={() => setActiveTab('caracteristiques')}
            >
              Caractéristiques
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'peau'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
                }`}
              onClick={() => setActiveTab('peau')}
            >
              Peau
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'cheveux'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
                }`}
              onClick={() => setActiveTab('cheveux')}
            >
              Cheveux
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'cils'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
                }`}
              onClick={() => setActiveTab('cils')}
            >
              Cils & Sourcils
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'marques'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
                }`}
              onClick={() => setActiveTab('marques')}
            >
              Marques cutanées
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'problemes'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
                }`}
              onClick={() => setActiveTab('problemes')}
            >
              Problèmes
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'medical'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
                }`}
              onClick={() => setActiveTab('medical')}
            >
              Médical
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'mesures'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
                }`}
              onClick={() => setActiveTab('mesures')}
            >
              Mesures
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'rib'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
                }`}
              onClick={() => setActiveTab('rib')}
            >
              RIB
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'evaluation'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
                }`}
              onClick={() => setActiveTab('evaluation')}
            >
              Évaluation
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'notes'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
                }`}
              onClick={() => setActiveTab('notes')}
            >
              Notes
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'rdvs'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
                }`}
              onClick={() => setActiveTab('rdvs')}
            >
              Rendez-vous ({rdvs.length})
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'etudes'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
                }`}
              onClick={() => setActiveTab('etudes')}
            >
              Études ({etudesCount})
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'assignation'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
                }`}
              onClick={() => setActiveTab('assignation')}
            >
              Assignation RDV
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'photos'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
                }`}
              onClick={() => setActiveTab('photos')}
            >
              Photos
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Photo de face - petite taille */}
              <div className="lg:col-span-1">
                <h2 className="text-lg font-semibold mb-4">Photo</h2>
                <div className="w-48 h-48 mx-auto lg:mx-0 border rounded-lg overflow-hidden shadow-sm bg-gray-50">
                  <VolontairePhoto
                    volontaireId={volontaire.id}
                    photoType="face"
                    className="w-full h-full"
                    onPhotoLoad={() => console.log("Photo de face chargée")}
                    onPhotoError={(err) => console.log("Erreur photo face:", err)}
                    onPhotoClick={(photo) => setSelectedPhoto({
                      url: photo.url,
                      alt: `Photo de face de ${volontaire.nomVol} ${volontaire.prenomVol}`
                    })}
                  />
                </div>
              </div>

              {/* Informations détaillées */}
              <div className="lg:col-span-2 space-y-6">
                {/* Coordonnées */}
                <div>
                  <h2 className="text-lg font-semibold mb-4">Coordonnées</h2>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-md font-semibold text-brand-cyan">Nom</dt>
                      <dd className="text-md text-gray-900 mt-1">{displayValue(volontaireDisplayData.nomVol)}</dd>
                    </div>
                    <div>
                      <dt className="text-md font-semibold text-brand-cyan">Prénom</dt>
                      <dd className="text-md text-gray-900 mt-1">{displayValue(volontaireDisplayData.prenomVol)}</dd>
                    </div>
                    <div>
                      <dt className="text-md font-semibold text-brand-cyan">Email</dt>
                      <dd className="text-md text-gray-900 mt-1">{displayValue(volontaireDisplayData.emailVol)}</dd>
                    </div>
                    <div>
                      <dt className="text-md font-semibold text-brand-cyan">Téléphone portable</dt>
                      <dd className="text-md text-gray-900 mt-1">{displayValue(volontaireDisplayData.telPortableVol)}</dd>
                    </div>
                    <div>
                      <dt className="text-md font-semibold text-brand-cyan">Téléphone fixe</dt>
                      <dd className="text-md text-gray-900 mt-1">{displayValue(volontaireDisplayData.telDomicileVol)}</dd>
                    </div>
                    <div>
                      <dt className="text-md font-semibold text-brand-cyan">Date de naissance</dt>
                      <dd className="text-md text-gray-900 mt-1">
                        {volontaireDisplayData.dateNaissance ? formatDate(volontaireDisplayData.dateNaissance) : '-'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-md font-semibold text-brand-cyan">Âge</dt>
                      <dd className="text-md text-gray-900 mt-1">
                        {calculateAgeFromDate(volontaireDisplayData.dateNaissance)
                          ? `${calculateAgeFromDate(volontaireDisplayData.dateNaissance)} ans`
                          : '-'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-md font-semibold text-brand-cyan">Sexe</dt>
                      <dd className="text-md text-gray-900 mt-1">
                        {formatGender(volontaireDisplayData.sexe)}
                      </dd>
                    </div>
                    <div className="md:col-span-2">
                      <dt className="text-md font-semibold text-brand-cyan">Adresse</dt>
                      <dd className="text-md text-gray-900 mt-1">
                        {volontaireDisplayData.adresseVol ? (
                          <>
                            {volontaireDisplayData.adresseVol}<br />
                            {volontaireDisplayData.cpVol} {volontaireDisplayData.villeVol}<br />
                            {volontaireDisplayData.pays && `${volontaireDisplayData.pays}`}
                          </>
                        ) : (
                          '-'
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h2 className="text-lg font-semibold mb-4">commentaires</h2>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Notes</dt>
                    <dd className="text-md text-gray-900 mt-1 whitespace-pre-line">
                      {displayValue(volontaireDisplayData.commentairesVol)}
                    </dd>
                  </div>
                </div>

                {volontaireDisplayData.dateAjout && (
                  <div>
                    <h2 className="text-lg font-semibold mb-4">Informations système</h2>
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <dt className="text-md font-semibold text-brand-cyan">Date d'ajout</dt>
                        <dd className="text-md text-gray-900 mt-1">
                          {formatDate(volontaireDisplayData.dateAjout)}
                        </dd>
                      </div>
                    </dl>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'caracteristiques' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold mb-4">Caractéristiques physiques</h2>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-md font-semibold text-brand-cyan">Taille</dt>
                  <dd className="text-md text-gray-900 mt-1">
                    {volontaireDisplayData.taille ? `${volontaireDisplayData.taille} cm` : '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-md font-semibold text-brand-cyan">Poids</dt>
                  <dd className="text-md text-gray-900 mt-1">
                    {volontaireDisplayData.poids ? `${volontaireDisplayData.poids} kg` : '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-md font-semibold text-brand-cyan">Phototype</dt>
                  <dd className="text-md text-gray-900 mt-1">
                    {formatPhototype(volontaireDisplayData.phototype) || '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-md font-semibold text-brand-cyan">Ethnie</dt>
                  <dd className="text-md text-gray-900 mt-1">
                    {formatEthnie(volontaireDisplayData.ethnie) || '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-md font-semibold text-brand-cyan">Sous-ethnie</dt>
                  <dd className="text-md text-gray-900 mt-1">{displayValue(volontaireDisplayData.sousEthnie)}</dd>
                </div>
                <div>
                  <dt className="text-md font-semibold text-brand-cyan">Couleur des yeux</dt>
                  <dd className="text-md text-gray-900 mt-1">{displayValue(volontaireDisplayData.yeux)}</dd>
                </div>
                <div>
                  <dt className="text-md font-semibold text-brand-cyan">Pilosité</dt>
                  <dd className="text-md text-gray-900 mt-1">{displayValue(volontaireDisplayData.pilosite)}</dd>
                </div>
                <div>
                  <dt className="text-md font-semibold text-brand-cyan">Origine du père</dt>
                  <dd className="text-md text-gray-900 mt-1">{displayValue(volontaireDisplayData.originePere)}</dd>
                </div>
                <div>
                  <dt className="text-md font-semibold text-brand-cyan">Origine de la mère</dt>
                  <dd className="text-md text-gray-900 mt-1">{displayValue(volontaireDisplayData.origineMere)}</dd>
                </div>
              </dl>
            </div>
          )}

          {activeTab === 'peau' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">Caractéristiques de la peau</h2>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Type de peau</dt>
                    <dd className="text-md text-gray-900 mt-1">
                      {formatSkinType(volontaireDisplayData.typePeauVisage) || '-'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Carnation</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayValue(volontaireDisplayData.carnation)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Sensibilité cutanée</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayValue(volontaireDisplayData.sensibiliteCutanee)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Teint inhomogène</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayYesNo(volontaireDisplayData.teintInhomogene)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Teint terne</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayYesNo(volontaireDisplayData.teintTerne)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Pores visibles</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayYesNo(volontaireDisplayData.poresVisibles)}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="text-md font-medium text-gray-800 mb-3">Exposition au soleil</h3>
                <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Exposition solaire</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayValue(volontaireDisplayData.expositionSolaire)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Bronzage</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayValue(volontaireDisplayData.bronzage)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Coups de soleil</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayValue(volontaireDisplayData.coupsDeSoleil)}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="text-md font-medium text-gray-800 mb-3">Cellulite</h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Cellulite bras</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayYesNo(volontaireDisplayData.celluliteBras)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Cellulite fesses/hanches</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayYesNo(volontaireDisplayData.celluliteFessesHanches)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Cellulite jambes</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayYesNo(volontaireDisplayData.celluliteJambes)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Cellulite ventre/taille</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayYesNo(volontaireDisplayData.celluliteVentreTaille)}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="text-md font-medium text-gray-800 mb-3">Sécheresse cutanée</h3>
                <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Lèvres</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayYesNo(volontaireDisplayData.secheresseLevres)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Cou</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayYesNo(volontaireDisplayData.secheresseCou)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Poitrine/Décolleté</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayYesNo(volontaireDisplayData.secheressePoitrineDecollete)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Ventre/Taille</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayYesNo(volontaireDisplayData.secheresseVentreTaille)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Fesses/Hanches</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayYesNo(volontaireDisplayData.secheresseFessesHanches)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Bras</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayYesNo(volontaireDisplayData.secheresseBras)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Mains</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayYesNo(volontaireDisplayData.secheresseMains)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Jambes</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayYesNo(volontaireDisplayData.secheresseJambes)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Pieds</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayYesNo(volontaireDisplayData.secheressePieds)}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="text-md font-medium text-gray-800 mb-3">Problèmes autour des yeux</h3>
                <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Cernes pigmentaires</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayYesNo(volontaireDisplayData.cernesPigmentaires)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Cernes vasculaires</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayYesNo(volontaireDisplayData.cernesVasculaires)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Poches</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayYesNo(volontaireDisplayData.poches)}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="text-md font-medium text-gray-800 mb-3">Perte de fermeté</h3>
                <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Visage</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayYesNo(volontaireDisplayData.perteDeFermeteVisage)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Cou</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayYesNo(volontaireDisplayData.perteDeFermeteCou)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Décolleté</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayYesNo(volontaireDisplayData.perteDeFermeteDecollete)}</dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {activeTab === 'cheveux' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">Caractéristiques des cheveux</h2>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Couleur des cheveux</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayValue(volontaireDisplayData.couleurCheveux)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Longueur des cheveux</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayValue(volontaireDisplayData.longueurCheveux)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Nature des cheveux</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayValue(volontaireDisplayData.natureCheveux)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Épaisseur des cheveux</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayValue(volontaireDisplayData.epaisseurCheveux)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Nature du cuir chevelu</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayValue(volontaireDisplayData.natureCuirChevelu)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Cuir chevelu sensible</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayYesNo(volontaireDisplayData.cuirCheveluSensible)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Chute de cheveux</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayYesNo(volontaireDisplayData.chuteDeCheveux)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Cheveux cassants</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayYesNo(volontaireDisplayData.cheveuxCassants)}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="text-md font-medium text-gray-800 mb-3">Ongles</h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Ongles cassants</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayYesNo(volontaireDisplayData.onglesCassants)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Ongles dédoublés</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayYesNo(volontaireDisplayData.onglesDedoubles)}</dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {activeTab === 'cils' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">Caractéristiques des cils</h2>
                <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Épaisseur des cils</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayValue(volontaireDisplayData.epaisseurCils)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Longueur des cils</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayValue(volontaireDisplayData.longueurCils)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Courbure des cils</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayValue(volontaireDisplayData.courbureCils)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Cils abîmés</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayYesNo(volontaireDisplayData.cilsAbimes)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Cils broussailleux</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayYesNo(volontaireDisplayData.cilsBroussailleux)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Chute de cils</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayYesNo(volontaireDisplayData.chuteDeCils)}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="text-md font-medium text-gray-800 mb-3">Sourcils</h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Caractéristiques des sourcils</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayValue(volontaireDisplayData.caracteristiqueSourcils)}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="text-md font-medium text-gray-800 mb-3">Lèvres</h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Type de lèvres</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayValue(volontaireDisplayData.levres)}</dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {activeTab === 'marques' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">Marques cutanées</h2>
                <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Cicatrices</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayYesNo(volontaireDisplayData.cicatrices)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Tatouages</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayYesNo(volontaireDisplayData.tatouages)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Piercings</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayYesNo(volontaireDisplayData.piercings)}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="text-md font-medium text-gray-800 mb-3">Taches pigmentaires</h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Visage</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayYesNo(volontaireDisplayData.tachesPigmentairesVisage)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Cou</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayYesNo(volontaireDisplayData.tachesPigmentairesCou)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Décolleté</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayYesNo(volontaireDisplayData.tachesPigmentairesDecollete)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Mains</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayYesNo(volontaireDisplayData.tachesPigmentairesMains)}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="text-md font-medium text-gray-800 mb-3">Vergetures</h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Jambes</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayYesNo(volontaireDisplayData.vergeturesJambes)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Fesses/Hanches</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayYesNo(volontaireDisplayData.vergeturesFessesHanches)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Ventre/Taille</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayYesNo(volontaireDisplayData.vergeturesVentreTaille)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Poitrine/Décolleté</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayYesNo(volontaireDisplayData.vergeturesPoitrineDecollete)}</dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {activeTab === 'problemes' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Problèmes spécifiques</h2>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-md font-semibold text-brand-cyan">Acné</dt>
                  <dd className="text-md text-gray-900 mt-1">{displayYesNo(volontaireDisplayData.acne)}</dd>
                </div>
                <div>
                  <dt className="text-md font-semibold text-brand-cyan">Couperose / Rosacée</dt>
                  <dd className="text-md text-gray-900 mt-1">{displayYesNo(volontaireDisplayData.couperoseRosacee)}</dd>
                </div>
                <div>
                  <dt className="text-md font-semibold text-brand-cyan">Dermite séborrhéique</dt>
                  <dd className="text-md text-gray-900 mt-1">{displayYesNo(volontaireDisplayData.dermiteSeborrheique)}</dd>
                </div>
                <div>
                  <dt className="text-md font-semibold text-brand-cyan">Eczéma</dt>
                  <dd className="text-md text-gray-900 mt-1">{displayYesNo(volontaireDisplayData.eczema)}</dd>
                </div>
                <div>
                  <dt className="text-md font-semibold text-brand-cyan">Psoriasis</dt>
                  <dd className="text-md text-gray-900 mt-1">{displayYesNo(volontaireDisplayData.psoriasis)}</dd>
                </div>
              </dl>
            </div>
          )}

          {activeTab === 'medical' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold mb-4">Informations médicales</h2>
              <dl className="grid grid-cols-1 gap-4">
                <div>
                  <dt className="text-md font-semibold text-brand-cyan">Traitement en cours</dt>
                  <dd className="text-md text-gray-900 mt-1 whitespace-pre-line">
                    {displayValue(volontaireDisplayData.traitement)}
                  </dd>
                </div>
                <div>
                  <dt className="text-md font-semibold text-brand-cyan">Anamnèse</dt>
                  <dd className="text-md text-gray-900 mt-1 whitespace-pre-line">
                    {displayValue(volontaireDisplayData.anamnese)}
                  </dd>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Contraception</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayValue(volontaireDisplayData.contraception)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Ménopause</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayYesNo(volontaireDisplayData.menopause)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Santé compatible</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayYesNo(volontaireDisplayData.santeCompatible)}</dd>
                  </div>
                </div>
                <div>
                  <dt className="text-md font-semibold text-brand-cyan">Allergies connues</dt>
                  <dd className="text-md text-gray-900 mt-1 whitespace-pre-line">
                    {displayValue(volontaireDisplayData.allergiesCommentaires)}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          {activeTab === 'mesures' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">Index d'hydratation</h2>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">IH Bras droit</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayValue(volontaireDisplayData.ihBrasDroit)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">IH Bras gauche</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayValue(volontaireDisplayData.ihBrasGauche)}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="text-md font-medium text-gray-800 mb-3">Scores d'évaluation</h3>
                <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Score POD</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayValue(volontaireDisplayData.scorePod)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Score POG</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayValue(volontaireDisplayData.scorePog)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Score Front</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayValue(volontaireDisplayData.scoreFront)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Score Lion</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayValue(volontaireDisplayData.scoreLion)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Score PPD</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayValue(volontaireDisplayData.scorePpd)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Score PPG</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayValue(volontaireDisplayData.scorePpg)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Score DOD</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayValue(volontaireDisplayData.scoreDod)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Score DOG</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayValue(volontaireDisplayData.scoreDog)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Score SNGD</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayValue(volontaireDisplayData.scoreSngd)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Score SNGG</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayValue(volontaireDisplayData.scoreSngg)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Score LEVSUP</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayValue(volontaireDisplayData.scoreLevsup)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Score COMLEVD</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayValue(volontaireDisplayData.scoreComlevd)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Score COMLEVG</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayValue(volontaireDisplayData.scoreComlevg)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Score PTOSE</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayValue(volontaireDisplayData.scorePtose)}</dd>
                  </div>
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Score ITA</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayValue(volontaireDisplayData.ita)}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="text-md font-medium text-gray-800 mb-3">Autres</h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-md font-semibold text-brand-cyan">Nombre de cigarettes par jour</dt>
                    <dd className="text-md text-gray-900 mt-1">{displayValue(volontaireDisplayData.nbCigarettesJour)}</dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {activeTab === 'rib' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold mb-4">Informations bancaires (RIB)</h2>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-md font-semibold text-brand-cyan">IBAN</dt>
                  <dd className="text-md text-gray-900 mt-1 font-mono">{displayValue(infoBankData.iban)}</dd>
                </div>
                <div>
                  <dt className="text-md font-semibold text-brand-cyan">BIC / Code SWIFT</dt>
                  <dd className="text-md text-gray-900 mt-1 font-mono">{displayValue(infoBankData.bic)}</dd>
                </div>
              </dl>
            </div>
          )}

          {activeTab === 'evaluation' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold mb-4">Évaluation du volontaire</h2>
              <div>
                <dt className="text-md font-semibold text-brand-cyan mb-2">Évaluation par étoiles</dt>
                <dd className="text-md text-gray-900 mt-1">
                  {renderStars(volontaireDisplayData.notes)}
                </dd>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Notes et commentaires</h2>
              <div>
                <dt className="text-md font-semibold text-brand-cyan">Notes</dt>
                <dd className="text-md text-gray-900 mt-1 whitespace-pre-line">
                  {displayValue(volontaireDisplayData.commentairesVol)}
                </dd>
              </div>
            </div>
          )}

          {activeTab === 'rdvs' && (
            <VolontaireDetailRdv volontaireId={id} rdvs={rdvs} />
          )}

          {activeTab === 'etudes' && (
            <VolontaireDetailEtude volontaireId={id} />
          )}

          {activeTab === 'assignation' && (
            <VolontaireAppointmentAssigner
              volontaireId={id}
              volontaire={volontaire}
              onAssignmentComplete={handleAssignmentComplete}
            />
          )}

          {activeTab === 'photos' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Photos du volontaire</h2>
                <div>
                  <label htmlFor="photo-upload" className="btn btn-primary cursor-pointer">
                    {isUploadingPhoto ? 'Envoi en cours...' : 'Ajouter une photo'}
                  </label>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/jpeg,image/jpg"
                    className="hidden"
                    onChange={handlePhotoUpload}
                    disabled={isUploadingPhoto}
                  />
                </div>
              </div>

              {photoUploadError && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                  <p className="text-red-700">{photoUploadError}</p>
                </div>
              )}

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <p className="text-md text-brand-cyan mb-4">
                  Photos disponibles pour ce volontaire
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Photo de face */}
                  <div className="border rounded-lg overflow-hidden shadow-sm">
                    <div className="p-2 bg-gray-50 border-b">
                      <h3 className="text-md font-medium">Photo de face</h3>
                    </div>
                    <div className="aspect-square">
                      <VolontairePhoto
                        volontaireId={volontaire.id}
                        photoType="face"
                        className="w-full h-full"
                        onPhotoLoad={() => console.log("Photo de face chargée")}
                        onPhotoError={(err) => console.log("Erreur photo face:", err)}
                        onPhotoClick={(photo) => setSelectedPhoto({
                          url: photo.url,
                          alt: `Photo de face de ${volontaire.nomVol}`
                        })}
                      />
                    </div>
                  </div>

                  {/* Photo de profil droit */}
                  <div className="border rounded-lg overflow-hidden shadow-sm">
                    <div className="p-2 bg-gray-50 border-b">
                      <h3 className="text-md font-medium">Photo de profil droit</h3>
                    </div>
                    <div className="aspect-square">
                      <VolontairePhoto
                        volontaireId={volontaire.id}
                        photoType="droite"
                        className="w-full h-full"
                        onPhotoLoad={() => console.log("Photo de profil droit chargée")}
                        onPhotoError={(err) => console.log("Erreur photo profil droit:", err)}
                        onPhotoClick={(photo) => setSelectedPhoto({
                          url: photo.url,
                          alt: `Photo de profil droit de ${volontaire.nomVol}`
                        })}
                      />
                    </div>
                  </div>

                  {/* Photo de profil gauche */}
                  <div className="border rounded-lg overflow-hidden shadow-sm">
                    <div className="p-2 bg-gray-50 border-b">
                      <h3 className="text-md font-medium">Photo de profil gauche</h3>
                    </div>
                    <div className="aspect-square">
                      <VolontairePhoto
                        volontaireId={volontaire.id}
                        photoType="gauche"
                        className="w-full h-full"
                        onPhotoLoad={() => console.log("Photo de profil gauche chargée")}
                        onPhotoError={(err) => console.log("Erreur photo profil gauche:", err)}
                        onPhotoClick={(photo) => setSelectedPhoto({
                          url: photo.url,
                          alt: `Photo de profil gauche de ${volontaire.nomVol}`
                        })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Visionneuse de photos */}
        {selectedPhoto && (
          <PhotoViewer
            photoUrl={selectedPhoto.url}
            alt={selectedPhoto.alt}
            onClose={() => setSelectedPhoto(null)}
          />
        )}
      </div>
    </div>
  )
}

export default VolontaireDetails