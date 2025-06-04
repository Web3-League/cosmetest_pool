import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import rdvService from '../../services/rdvService';
import volontaireService from '../../services/volontaireService';
import etudeService from '../../services/etudeService';
import etudeVolontaireService from '../../services/etudeVolontaireService';
import './EditRdvForm.css';

const EditRdvForm = () => {
  const { idEtude, idRdv } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [volontaires, setVolontaires] = useState([]);
  const [etudes, setEtudes] = useState([]);
  const [searchVolontaireTerm, setSearchVolontaireTerm] = useState('');
  const [showVolontaireDropdown, setShowVolontaireDropdown] = useState(false);
  const [selectedVolontaireName, setSelectedVolontaireName] = useState('');
  const [formData, setFormData] = useState({
    idVolontaire: '',
    idEtude: '',
    idGroupe: null,
    date: '',
    heure: '',
    etat: '',
    commentaires: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Ensure the parameters are properly parsed as integers
        const etudeid = parseInt(idEtude);
        const rdvid = parseInt(idRdv);
        
        // Fetch data in parallel with Promise.all
        const [rdvResponse, etudeVolontairesResponse, etudesResponse] = await Promise.all([
          rdvService.getById(etudeid, rdvid, 0), // Ajouter le paramètre sequence
          etudeVolontaireService.getVolontairesByEtude(etudeid),
          etudeService.getAll()
        ]);
                  
        // Log responses for debugging
        console.log('RDV Response:', rdvResponse);
        console.log('Etude Volontaires Response:', etudeVolontairesResponse);
        console.log('Etudes Response:', etudesResponse);
        
        // Ensure etude volontaires data is an array
        const etudeVolontairesArray = Array.isArray(etudeVolontairesResponse) 
          ? etudeVolontairesResponse 
          : (etudeVolontairesResponse.data || []);
        
        // Ensure etudes is an array
        const etudesArray = Array.isArray(etudesResponse) 
          ? etudesResponse 
          : (etudesResponse.data || []);
        
        // Extract all volontaire IDs
        const volontaireIds = etudeVolontairesArray.map(ev => ev.idVolontaire);
        
        // Fetch details for all volontaires
        const volontairesDetailsResponse = await volontaireService.getVolontairesByIds(volontaireIds);
        
        // Log volontaires details for debugging
        console.log('Volontaires Details Response:', volontairesDetailsResponse);
        
        // Ensure volontaires details is an array
        const volontairesDetailsArray = Array.isArray(volontairesDetailsResponse) 
          ? volontairesDetailsResponse 
          : (volontairesDetailsResponse.data || []);
        
        // Combine volontaire details with etude-volontaire information
        const volontairesWithDetails = etudeVolontairesArray.map(ev => {
          const volontaireDetails = volontairesDetailsArray.find(
            v => v.id === ev.idVolontaire || v.idVolontaire === ev.idVolontaire
          );
          
          if (!volontaireDetails) {
            return {
              ...ev,
              id: ev.idVolontaire,
              prenom: 'Inconnu',
              nom: `(ID: ${ev.idVolontaire})`
            };
          }
          
          return {
            ...ev,
            ...volontaireDetails,
            id: ev.idVolontaire || volontaireDetails.id
          };
        });
        
        // Update the states
        setVolontaires(volontairesWithDetails);
        setEtudes(etudesArray);
        
        if (rdvResponse) {
          // Handle nested ID structure if present
          const rdvIdEtude = rdvResponse.id ? rdvResponse.id.idEtude : etudeid;
  
          let formattedHeure = rdvResponse.heure;
          if (formattedHeure && formattedHeure.includes('h')) {
            formattedHeure = formattedHeure.replace('h', ':');
          }
          
          // Safely update form data with response data
          const volontaireId = rdvResponse.idVolontaire ? rdvResponse.idVolontaire.toString() : '';
          
          setFormData({
            idVolontaire: volontaireId,
            idEtude: rdvIdEtude.toString(),
            idGroupe: rdvResponse.idGroupe || null,
            date: rdvResponse.date || '',
            heure: formattedHeure || '',
            etat: rdvResponse.etat || 'EN_ATTENTE',
            commentaires: rdvResponse.commentaires || ''
          });
          
          // Set the selected volontaire name if there is one
          if (volontaireId) {
            const selectedVolontaire = volontairesWithDetails.find(v => 
              v.id.toString() === volontaireId
            );
            if (selectedVolontaire) {
              setSelectedVolontaireName(`${selectedVolontaire.prenom} ${selectedVolontaire.nom}`);
            }
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setErrors({
          global: 'Erreur lors du chargement du rendez-vous: ' + (error.message || 'Erreur inconnue')
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [idEtude, idRdv]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Effacer l'erreur pour ce champ si elle existe
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };
  
  const handleSearchVolontaire = (e) => {
    setSearchVolontaireTerm(e.target.value);
    setShowVolontaireDropdown(true);
  };
  
  const handleSelectVolontaire = (volontaire) => {
    setFormData({
      ...formData,
      idVolontaire: volontaire.id.toString()
    });
    setSelectedVolontaireName(`${volontaire.prenom} ${volontaire.nom}`);
    setSearchVolontaireTerm('');
    setShowVolontaireDropdown(false);
    
    // Effacer l'erreur pour ce champ si elle existe
    if (errors.idVolontaire) {
      setErrors({
        ...errors,
        idVolontaire: null
      });
    }
  };
  
  const filteredVolontaires = Array.isArray(volontaires) 
    ? volontaires.filter(volontaire => {
        const fullName = `${volontaire.prenom} ${volontaire.nom}`.toLowerCase();
        return fullName.includes(searchVolontaireTerm.toLowerCase());
      })
    : [];
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.idVolontaire) {
      newErrors.idVolontaire = 'Veuillez sélectionner un volontaire';
    }
    
    if (!formData.date) {
      newErrors.date = 'Veuillez sélectionner une date';
    }
    
    if (!formData.heure) {
      newErrors.heure = 'Veuillez sélectionner une heure';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Préparer les données pour l'API
      const rdvData = {
        id: {
          idEtude: parseInt(idEtude),
          idRdv: parseInt(idRdv)
        },
        idVolontaire: parseInt(formData.idVolontaire),
        idGroupe: formData.idGroupe ? parseInt(formData.idGroupe) : null,
        date: formData.date,
        heure: formData.heure.replace(':', 'h'),
        etat: formData.etat,
        commentaires: formData.commentaires
      };
      
      // Appeler l'API pour mettre à jour le rendez-vous
      await rdvService.update(parseInt(idEtude), parseInt(idRdv), rdvData);
      
      // Rediriger vers la liste des rendez-vous
      navigate('/rdvs');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du rendez-vous:', error);
      
      // Gérer les erreurs de validation du backend
      if (error.response && error.response.data && error.response.data.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({
          global: 'Une erreur est survenue lors de la mise à jour du rendez-vous'
        });
      }
      setIsSaving(false);
    }
  };
  
  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous ?')) {
      try {
        setIsLoading(true);
        
        // Appeler l'API pour supprimer le rendez-vous
        await rdvService.delete(parseInt(idEtude), parseInt(idRdv));
        
        // Rediriger vers la liste des rendez-vous
        navigate('/rdvs');
      } catch (error) {
        console.error('Erreur lors de la suppression du rendez-vous:', error);
        setErrors({
          global: 'Une erreur est survenue lors de la suppression du rendez-vous'
        });
        setIsLoading(false);
      }
    }
  };
  
  const handleStatusChange = async (newStatus) => {
    try {
      setIsLoading(true);
      
      // Call the updateStatus method
      await rdvService.updateStatus(parseInt(idEtude), parseInt(idRdv), newStatus);
      
      // Update the local state
      setFormData({
        ...formData,
        etat: newStatus
      });
      
      // Show success message
      setErrors({
        global: null,
        success: `Statut mis à jour avec succès: ${newStatus}`
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      setErrors({
        global: 'Erreur lors de la mise à jour du statut: ' + (error.message || 'Erreur inconnue')
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Gérer le clic en dehors de la liste déroulante
  useEffect(() => {
    const handleClickOutside = (event) => {
      const volontaireContainer = document.getElementById('volontaire-search-container');
      if (volontaireContainer && !volontaireContainer.contains(event.target)) {
        setShowVolontaireDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Modifier le Rendez-vous</h1>
        <button
          type="button"
          onClick={handleDelete}
          className="px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
        >
          Supprimer
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        {errors.success && (
          <div className="bg-green-50 border border-green-200 text-green-600 p-4 rounded mb-4">
            {errors.success}
          </div>
        )}
        
        {errors.global && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded mb-4">
            {errors.global}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div id="volontaire-search-container" className="relative">
              <label htmlFor="searchVolontaire" className="block text-sm font-medium text-gray-700 mb-1">
                Volontaire *
              </label>
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    id="searchVolontaire"
                    placeholder={selectedVolontaireName || "Rechercher un volontaire..."}
                    value={searchVolontaireTerm}
                    onChange={handleSearchVolontaire}
                    onFocus={() => setShowVolontaireDropdown(true)}
                    className="form-input w-full pr-10 text-gray-900 font-medium"
                  />
                  {(searchVolontaireTerm || selectedVolontaireName) && (
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => {
                        setSearchVolontaireTerm('');
                        if (selectedVolontaireName) {
                          setSelectedVolontaireName('');
                          setFormData({
                            ...formData,
                            idVolontaire: ''
                          });
                        }
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
                
                {/* Liste déroulante des volontaires */}
                {showVolontaireDropdown && (
                  <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredVolontaires.length > 0 ? (
                      <ul className="py-1">
                        {filteredVolontaires.map(volontaire => (
                          <li 
                            key={volontaire.id} 
                            className="px-3 py-2 hover:bg-primary-50 cursor-pointer text-gray-800 hover:text-primary-800"
                            onClick={() => handleSelectVolontaire(volontaire)}
                          >
                            {volontaire.prenom} {volontaire.nom}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="px-3 py-2 text-gray-500">
                        {searchVolontaireTerm 
                          ? "Aucun volontaire ne correspond à votre recherche" 
                          : "Commencez à taper pour rechercher"}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Champ caché pour stocker l'ID du volontaire */}
                <input 
                  type="hidden" 
                  name="idVolontaire" 
                  value={formData.idVolontaire} 
                />
              </div>
              {errors.idVolontaire && (
                <p className="mt-1 text-sm text-red-600">{errors.idVolontaire}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="idEtude" className="block text-sm font-medium text-gray-700 mb-1">
                Étude (non modifiable)
              </label>
              <input
                type="text"
                id="idEtude"
                value={
                  Array.isArray(etudes) && etudes.find(e => e.id?.toString() === formData.idEtude)?.ref || 
                  formData.idEtude
                }
                className="form-input w-full bg-gray-100"
                disabled
              />
            </div>
            
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className={`form-input w-full ${errors.date ? 'border-red-500' : ''}`}
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="heure" className="block text-sm font-medium text-gray-700 mb-1">
                Heure *
              </label>
              <input
                type="time"
                id="heure"
                name="heure"
                value={formData.heure}
                onChange={handleChange}
                className={`form-input w-full ${errors.heure ? 'border-red-500' : ''}`}
              />
              {errors.heure && (
                <p className="mt-1 text-sm text-red-600">{errors.heure}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="idGroupe" className="block text-sm font-medium text-gray-700 mb-1">
                Groupe (optionnel)
              </label>
              <input
                type="number"
                id="idGroupe"
                name="idGroupe"
                value={formData.idGroupe || ''}
                onChange={handleChange}
                className="form-input w-full"
                min="1"
              />
            </div>
            
            <div>
              <label htmlFor="etat" className="block text-sm font-medium text-gray-700 mb-1">
                État
              </label>
              <div className="flex flex-col space-y-2">
                <select
                  id="etat"
                  name="etat"
                  value={formData.etat}
                  onChange={handleChange}
                  className="form-select w-full"
                >
                  <option value="EN_ATTENTE">En attente</option>
                  <option value="CONFIRME">Confirmé</option>
                  <option value="ANNULE">Annulé</option>
                  <option value="COMPLETE">Complété</option>
                </select>
                
                <div className="flex space-x-2 mt-2">
                  <button
                    type="button"
                    onClick={() => handleStatusChange('CONFIRME')}
                    className="px-2 py-1 text-xs border border-green-300 rounded-md shadow-sm font-medium text-green-700 bg-white hover:bg-green-50"
                  >
                    Confirmer
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange('ANNULE')}
                    className="px-2 py-1 text-xs border border-red-300 rounded-md shadow-sm font-medium text-red-700 bg-white hover:bg-red-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange('COMPLETE')}
                    className="px-2 py-1 text-xs border border-blue-300 rounded-md shadow-sm font-medium text-blue-700 bg-white hover:bg-blue-50"
                  >
                    Marquer complété
                  </button>
                </div>
              </div>
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="commentaires" className="block text-sm font-medium text-gray-700 mb-1">
                Commentaires
              </label>
              <textarea
                id="commentaires"
                name="commentaires"
                value={formData.commentaires}
                onChange={handleChange}
                rows="3"
                className="form-textarea w-full"
                placeholder="Informations complémentaires..."
              ></textarea>
            </div>
          </div>
          
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/rdvs')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300"
            >
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRdvForm;