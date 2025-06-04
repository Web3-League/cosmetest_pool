import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import volontaireService from '../../services/volontaireService'
import rdvService from '../../services/rdvService'
import photoService from '../../services/photoService'
import { formatGender, formatSkinType, formatPhototype, formatEthnie } from '../../utils/formatters'
import { ChevronRightIcon } from '../../components/icons'
import { formatDate, calculateAgeFromDate } from '../../utils/dateUtils'
import PhotoViewer from './PhotoViewer.jsx'
import VolontairePhoto from './VolontairePhoto.jsx'

const VolontaireDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  
  // États pour les données principales
  const [volontaire, setVolontaire] = useState(null)
  const [detailsData, setDetailsData] = useState(null)
  const [rdvs, setRdvs] = useState([])
  const [etudes, setEtudes] = useState([])
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
  
  // Fonction pour supprimer une photo
  const handleDeletePhoto = async (photoName) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette photo ? Cette action est irréversible.')) {
      try {
        const result = await photoService.deleteVolontairePhoto(id, photoName);
        if (result.success) {
          // Recharger les photos après la suppression
          await fetchPhotos();
        } else {
          alert(result.message || 'Une erreur est survenue lors de la suppression de la photo');
        }
      } catch (error) {
        console.error('Erreur lors de la suppression de la photo:', error);
        alert('Une erreur est survenue lors de la suppression de la photo');
      }
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
          const rdvsResponse = await rdvService.getByVolontaire(id)
          setRdvs(rdvsResponse.data || [])
        } catch (rdvsError) {
          console.warn('Erreur lors du chargement des rendez-vous:', rdvsError)
          // Continuer même si les rendez-vous ne sont pas disponibles
        }
        
      } catch (error) {
        console.error('Erreur lors du chargement des données du volontaire:', error)
        setError('Impossible de charger les informations du volontaire')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">Coordonnées</h2>
                <dl className="space-y-2">
                  <div className="grid grid-cols-3">
                    <dt className="text-sm font-medium text-gray-500">Nom</dt>
                    <dd className="text-sm text-gray-900 col-span-2">{volontaireDisplayData.nomVol}</dd>
                  </div>
                  <div className="grid grid-cols-3">
                    <dt className="text-sm font-medium text-gray-500">Prénom</dt>
                    <dd className="text-sm text-gray-900 col-span-2">{volontaireDisplayData.prenomVol}</dd>
                  </div>
                  <div className="grid grid-cols-3">
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="text-sm text-gray-900 col-span-2">{volontaireDisplayData.emailVol}</dd>
                  </div>
                  <div className="grid grid-cols-3">
                    <dt className="text-sm font-medium text-gray-500">Téléphone</dt>
                    <dd className="text-sm text-gray-900 col-span-2">{volontaireDisplayData.telPortableVol || volontaireDisplayData.telDomicileVol || '-'}</dd>
                  </div>
                  <div className="grid grid-cols-3">
                    <dt className="text-sm font-medium text-gray-500">Adresse</dt>
                    <dd className="text-sm text-gray-900 col-span-2">
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
              
              <div>
                <h2 className="text-lg font-semibold mb-4">Caractéristiques</h2>
                <dl className="space-y-2">
                  <div className="grid grid-cols-3">
                    <dt className="text-sm font-medium text-gray-500">Date de naissance</dt>
                    <dd className="text-sm text-gray-900 col-span-2">
                      {volontaireDisplayData.dateNaissance ? formatDate(volontaireDisplayData.dateNaissance) : '-'}
                    </dd>
                  </div>
                  <div className="grid grid-cols-3">
                    <dt className="text-sm font-medium text-gray-500">Âge</dt>
                    <dd className="text-sm text-gray-900 col-span-2">
                      {calculateAgeFromDate(volontaireDisplayData.dateNaissance) 
                        ? `${calculateAgeFromDate(volontaireDisplayData.dateNaissance)} ans` 
                        : '-'}
                    </dd>
                  </div>
                  <div className="grid grid-cols-3">
                    <dt className="text-sm font-medium text-gray-500">Sexe</dt>
                    <dd className="text-sm text-gray-900 col-span-2">
                      {formatGender(volontaireDisplayData.sexe)}
                    </dd>
                  </div>
                  <div className="grid grid-cols-3">
                    <dt className="text-sm font-medium text-gray-500">Type de peau</dt>
                    <dd className="text-sm text-gray-900 col-span-2">
                      {formatSkinType(volontaireDisplayData.typePeau) || '-'}
                    </dd>
                  </div>
                  <div className="grid grid-cols-3">
                    <dt className="text-sm font-medium text-gray-500">Phototype</dt>
                    <dd className="text-sm text-gray-900 col-span-2">
                      {formatPhototype(volontaireDisplayData.phototype) || '-'}
                    </dd>
                  </div>
                  <div className="grid grid-cols-3">
                    <dt className="text-sm font-medium text-gray-500">Ethnie</dt>
                    <dd className="text-sm text-gray-900 col-span-2">
                      {formatEthnie(volontaireDisplayData.ethnie) || '-'}
                    </dd>
                  </div>
                  {volontaireDisplayData.dateAjout && (
                    <div className="grid grid-cols-3">
                      <dt className="text-sm font-medium text-gray-500">Date d'ajout</dt>
                      <dd className="text-sm text-gray-900 col-span-2">
                        {formatDate(volontaireDisplayData.dateAjout)}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
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