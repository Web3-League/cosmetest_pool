// src/services/photoService.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

const photoService = {
  /**
   * Vérifie si une photo existe pour un volontaire donné
   * @param {string} nomVolontaire - Le nom du volontaire
   * @returns {Promise<{exists: boolean, url: string|null}>}
   */
  checkVolontairePhoto: async (nomVolontaire) => {
    try {
      const filename = `f_${nomVolontaire.toLowerCase().replace(/\s+/g, '_')}.jpg`;
      const response = await axios.get(`${API_URL}/api/photos/check`, {
        params: { filename }
      });
      
      return {
        exists: response.data.exists,
        url: response.data.exists ? `${API_URL}/photos/volontaires/${filename}` : null
      };
    } catch (error) {
      console.error('Erreur lors de la vérification de la photo:', error);
      return { exists: false, url: null };
    }
  },
  
  /**
   * Télécharge une photo pour un volontaire
   * @param {string} volontaireId - L'ID du volontaire
   * @param {File} photoFile - Le fichier photo à télécharger
   * @returns {Promise<{success: boolean, message: string}>}
   */
  uploadVolontairePhoto: async (volontaireId, photoFile) => {
    try {
      const formData = new FormData();
      formData.append('photo', photoFile);
      
      const response = await axios.post(`${API_URL}/api/volontaires/${volontaireId}/photo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return {
        success: true,
        message: 'Photo téléchargée avec succès'
      };
    } catch (error) {
      console.error('Erreur lors du téléchargement de la photo:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors du téléchargement de la photo'
      };
    }
  }
};

export default photoService;