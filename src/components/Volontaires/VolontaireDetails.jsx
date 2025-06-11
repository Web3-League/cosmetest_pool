import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import volontaireService from '../../services/volontaireService'
import rdvService from '../../services/rdvService'
import etudeVolontaireService from '../../services/etudeVolontaireService'
import photoService from '../../services/photoService'
import { formatGender, formatSkinType, formatPhototype, formatEthnie } from '../../utils/formatters'
import { ChevronRightIcon } from '../../components/icons'
import { formatDate, calculateAgeFromDate } from '../../utils/dateUtils'
import PhotoViewer from './PhotoViewer.jsx'
import VolontairePhoto from './VolontairePhoto.jsx'
import VolontaireDetailRdv from './VolontaireDetailRdv.jsx'
import VolontaireDetailEtude from './VolontaireDetailEtude.jsx'

const VolontaireDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  
  // États pour les données principales
  const [volontaire, setVolontaire] = useState(null)
  const [detailsData, setDetailsData] = useState(null)
  const [rdvs, setRdvs] = useState([])
  const [etudesCount, setEtudesCount] = useState(0) // Nouveau state pour le compteur
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
        await fetchPhotos(); // Recharger les photos après téléchargement
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
          // Continuer même si les détails ne sont pas disponibles
        }
        
        // Charger les rendez-vous du volontaire
        try {
          const rdvsData = await rdvService.getByVolontaire(id)
          setRdvs(Array.isArray(rdvsData) ? rdvsData : [])
        } catch (rdvsError) {
          console.error('=== ERREUR CHARGEMENT RDVs ===')
          console.error('Erreur complète:', rdvsError)
          console.error('Message:', rdvsError.message)
          console.error('Stack:', rdvsError.stack)
          setRdvs([]) // S'assurer que rdvs est un tableau vide en cas d'erreur
        }
        
        // Charger le nombre d'études pour l'onglet
        try {
          const etudesResponse = await etudeVolontaireService.getEtudesByVolontaire(id);
          setEtudesCount((etudesResponse.data || []).length);
        } catch (etudesError) {
          console.warn('Erreur lors du comptage des études:', etudesError);
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
          <Link to="/volontaires" className="text-gray-500 hover:text-primary-600">
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
          <nav className="flex">
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'info'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('info')}
            >
              Informations personnelles
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'rdvs'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('rdvs')}
            >
              Rendez-vous
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'etudes'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('etudes')}
            >
              Études
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'photos'
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
                      <dt className="text-sm font-medium text-gray-500">Nom</dt>
                      <dd className="text-sm text-gray-900 mt-1">{volontaireDisplayData.nomVol}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Prénom</dt>
                      <dd className="text-sm text-gray-900 mt-1">{volontaireDisplayData.prenomVol}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="text-sm text-gray-900 mt-1">{volontaireDisplayData.emailVol}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Téléphone</dt>
                      <dd className="text-sm text-gray-900 mt-1">{volontaireDisplayData.telPortableVol || volontaireDisplayData.telDomicileVol || '-'}</dd>
                    </div>
                    <div className="md:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">Adresse</dt>
                      <dd className="text-sm text-gray-900 mt-1">
                        {volontaireDisplayData.adresseVol ? (
                          <>
                            {volontaireDisplayData.adresseVol}<br />
                            {volontaireDisplayData.cpVol} {volontaireDisplayData.villeVol}<br />
                          </>
                        ) : (
                          '-'
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>
                
                {/* Caractéristiques */}
                <div>
                  <h2 className="text-lg font-semibold mb-4">Caractéristiques</h2>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Date de naissance</dt>
                      <dd className="text-sm text-gray-900 mt-1">
                        {volontaireDisplayData.dateNaissance ? formatDate(volontaireDisplayData.dateNaissance) : '-'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Âge</dt>
                      <dd className="text-sm text-gray-900 mt-1">
                        {calculateAgeFromDate(volontaireDisplayData.dateNaissance) 
                          ? `${calculateAgeFromDate(volontaireDisplayData.dateNaissance)} ans` 
                          : '-'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Sexe</dt>
                      <dd className="text-sm text-gray-900 mt-1">
                        {formatGender(volontaireDisplayData.sexe)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Type de peau</dt>
                      <dd className="text-sm text-gray-900 mt-1">
                        {formatSkinType(volontaireDisplayData.typePeau) || '-'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Phototype</dt>
                      <dd className="text-sm text-gray-900 mt-1">
                        {formatPhototype(volontaireDisplayData.phototype) || '-'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Ethnie</dt>
                      <dd className="text-sm text-gray-900 mt-1">
                        {formatEthnie(volontaireDisplayData.ethnie) || '-'}
                      </dd>
                    </div>
                    {volontaireDisplayData.dateAjout && (
                      <div className="md:col-span-2">
                        <dt className="text-sm font-medium text-gray-500">Date d'ajout</dt>
                        <dd className="text-sm text-gray-900 mt-1">
                          {formatDate(volontaireDisplayData.dateAjout)}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Caractéristiques physiques supplémentaires */}
                {(volontaireDisplayData.taille || volontaireDisplayData.poids) && (
                  <div>
                    <h2 className="text-lg font-semibold mb-4">Caractéristiques physiques</h2>
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {volontaireDisplayData.taille && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Taille</dt>
                          <dd className="text-sm text-gray-900 mt-1">{volontaireDisplayData.taille} cm</dd>
                        </div>
                      )}
                      {volontaireDisplayData.poids && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Poids</dt>
                          <dd className="text-sm text-gray-900 mt-1">{volontaireDisplayData.poids} kg</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'rdvs' && (
            <VolontaireDetailRdv volontaireId={id} rdvs={rdvs} />
          )}
          
          {activeTab === 'etudes' && (
            <VolontaireDetailEtude volontaireId={id} />
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
              <p className="text-sm text-gray-500 mb-4">
                Photos disponibles pour ce volontaire
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Photo de face */}
                <div className="border rounded-lg overflow-hidden shadow-sm">
                  <div className="p-2 bg-gray-50 border-b">
                    <h3 className="text-sm font-medium">Photo de face</h3>
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
                    <h3 className="text-sm font-medium">Photo de profil droit</h3>
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
                    <h3 className="text-sm font-medium">Photo de profil gauche</h3>
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