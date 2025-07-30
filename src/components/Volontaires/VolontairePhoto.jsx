import { useState, useEffect } from 'react';
import api from '../../services/api';

const VolontairePhoto = ({ 
  volontaireId, 
  photoType = 'face', 
  className = "",
  thumbnail = false,
  onPhotoLoad = () => {},
  onPhotoError = () => {},
  onPhotoClick = null // Prop pour gérer le clic sur la photo
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [photoExists, setPhotoExists] = useState(false);
  const [imageData, setImageData] = useState(null);

  // Vérifier si la photo existe et la télécharger
  useEffect(() => {
    const fetchPhoto = async () => {
      if (!volontaireId) {
        console.error('ID du volontaire non fourni:', volontaireId);
        setLoading(false);
        setError('ID du volontaire non fourni');
        return;
      }

      try {
        console.log(`Tentative de récupération de la photo ${photoType} pour le volontaire ${volontaireId}`);
        setLoading(true);
        setError(null);
        
        // Vérifier si la photo existe
        const checkResponse = await api.get(`/volontaires/${volontaireId}/photos/${photoType}`);        
        // La réponse contient des infos sur la photo
        if (checkResponse.data && checkResponse.data.exists) {
          setPhotoExists(true);
          
          // Si la photo existe, la télécharger comme blob
          const imageEndpoint = thumbnail
            ? `/volontaires/${volontaireId}/photos/${photoType}/thumbnail`
            : `/volontaires/${volontaireId}/photos/${photoType}/image`;
          
          console.log('Téléchargement de l\'image depuis:', imageEndpoint);  
          const imageResponse = await api.get(imageEndpoint, {
            responseType: 'blob' // Important: demander la réponse comme blob
          });
          
          // Créer une URL pour le blob
          const imageUrl = URL.createObjectURL(imageResponse.data);
          setImageData(imageUrl);
          
          onPhotoLoad({ url: imageUrl, photoType });
        } else {
          setError(checkResponse.data?.message || 'Photo non disponible');
          onPhotoError('Photo non disponible');
        }
      } catch (err) {
        console.error('Erreur complète lors du chargement de la photo:', err);
        const errorMessage = err.response?.data?.message || 'Erreur lors du chargement de la photo';
        setError(errorMessage);
        onPhotoError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchPhoto();
  }, [volontaireId, photoType, thumbnail, onPhotoLoad, onPhotoError]);

  // Nettoyer l'URL de l'objet lorsque le composant est démonté
  useEffect(() => {
    return () => {
      if (imageData) {
        URL.revokeObjectURL(imageData);
      }
    };
  }, [imageData]);

  // Gestionnaire de clic sur l'image
  const handleImageClick = () => {
    if (onPhotoClick && imageData) {
      onPhotoClick({
        url: imageData,
        type: photoType
      });
    }
  };

  if (loading) {
    return (
      <div className={`bg-gray-100 rounded-lg ${className} flex items-center justify-center`}>
        <div className="animate-pulse h-8 w-8 rounded-full bg-gray-300"></div>
      </div>
    );
  }

  if (error || !photoExists || !imageData) {
    return (
      <div className={`bg-gray-100 rounded-lg ${className} flex items-center justify-center`}>
        <div className="text-gray-400 text-sm">{error || 'Photo non disponible'}</div>
      </div>
    );
  }

  return (
    <img 
      src={imageData} 
      alt={`Photo ${photoType} du volontaire #${volontaireId}`} 
      className={`object-cover rounded-lg ${className} ${onPhotoClick ? 'cursor-pointer hover:opacity-90' : ''}`}
      onClick={handleImageClick}
      onError={(e) => {
        console.error('Erreur de chargement de l\'image:', e);
        setError('Erreur de chargement');
        onPhotoError('Erreur de chargement de l\'image');
        e.target.style.display = 'none';
        const errorDiv = document.createElement('div');
        errorDiv.className = `bg-gray-100 rounded-lg ${className} flex items-center justify-center`;
        errorDiv.innerHTML = '<div class="text-gray-400 text-sm">Erreur de chargement</div>';
        e.target.parentNode.appendChild(errorDiv);
      }}
      onLoad={() => onPhotoLoad({ photoType, url: imageData })}
    />
  );
};

export default VolontairePhoto;