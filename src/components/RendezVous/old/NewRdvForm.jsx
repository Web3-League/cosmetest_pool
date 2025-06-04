import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import rdvService from '../../services/rdvService';
import volontaireService from '../../services/volontaireService';
import etudeService from '../../services/etudeService';

// SVG pour les icônes
const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const FolderIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
  </svg>
);

const GroupIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const StatusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

const CounterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"></line>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
  </svg>
);

const NewRdvForm = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [volontaires, setVolontaires] = useState([]);
  const [etudes, setEtudes] = useState([]);
  
  // Refs pour les dropdowns
  const volontaireSelectorRef = useRef(null);
  const etudeSelectorRef = useRef(null);
  
  // États pour les sélecteurs
  const [showVolontaireSelector, setShowVolontaireSelector] = useState(false);
  const [showEtudeSelector, setShowEtudeSelector] = useState(false);
  
  // États pour la recherche
  const [searchVolontaireTerm, setSearchVolontaireTerm] = useState('');
  const [searchEtudeTerm, setSearchEtudeTerm] = useState('');
  
  // États pour les sélections
  const [selectedVolontaires, setSelectedVolontaires] = useState([]);
  const [selectedEtude, setSelectedEtude] = useState(null);
  
  // Nouvel état pour l'incrément de volontaires
  const [volontaireIncrement, setVolontaireIncrement] = useState(0);
  
  // État du formulaire
  const [formData, setFormData] = useState({
    idEtude: '',
    idGroupe: null,
    dates: [{ date: '', time: '', volontaireCount: 10 }],
    heure: '',
    etat: 'PLANIFIE',
    commentaires: ''
  });
  
  const [errors, setErrors] = useState({});
  
  // Effet pour fermer les dropdowns en cliquant ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (volontaireSelectorRef.current && !volontaireSelectorRef.current.contains(event.target)) {
        setShowVolontaireSelector(false);
      }
      if (etudeSelectorRef.current && !etudeSelectorRef.current.contains(event.target)) {
        setShowEtudeSelector(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Chargement des données
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [volontairesResponse, etudesResponse] = await Promise.all([
          volontaireService.getAllWithoutPagination(),
          etudeService.getAll()
        ]);
        
        const volontairesArray = volontairesResponse || [];
        const etudesArray = etudesResponse?.data || etudesResponse || [];
        
        setVolontaires(Array.isArray(volontairesArray) ? volontairesArray : []);
        setEtudes(Array.isArray(etudesArray) ? etudesArray : []);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setVolontaires([]);
        setEtudes([]);
      }
    };
    
    fetchData();
  }, []);
  
  // Filtrage des volontaires
  const filteredVolontaires = Array.isArray(volontaires) 
    ? volontaires.filter(v => {
        const nom = (v.nom || '').toLowerCase();
        const prenom = (v.prenom || '').toLowerCase();
        const fullName = `${prenom} ${nom}`.toLowerCase();
        const term = searchVolontaireTerm.toLowerCase();
        
        return nom.includes(term) || prenom.includes(term) || fullName.includes(term);
      })
    : [];
    
  // Filtrage des études
  const filteredEtudes = Array.isArray(etudes)
    ? etudes.filter(e => {
        const ref = (e.ref || '').toLowerCase();
        const titre = (e.titre || '').toLowerCase();
        const term = searchEtudeTerm.toLowerCase();
        
        return ref.includes(term) || titre.includes(term);
      }).slice(0, 50)
    : [];

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };
  
  // Gestion des volontaires pour la sélection manuelle (conservée pour compatibilité)
  const addVolontaire = async (volontaire) => {
    if (selectedVolontaires.find(v => v.id === volontaire.id)) {
      removeVolontaire(volontaire.id);
      return;
    }
  
    // Si aucun conflit, ajouter le volontaire
    setSelectedVolontaires([...selectedVolontaires, volontaire]);
    setErrors({ ...errors, volontaires: null });
  };
  
  // Suppression d'un volontaire
  const removeVolontaire = (id) => {
    setSelectedVolontaires(selectedVolontaires.filter(v => v.id !== id));
  };
  
  // Sélection d'une étude
  const selectEtude = (etude) => {
    setSelectedEtude(etude);
    setFormData({
      ...formData,
      idEtude: etude.idEtude.toString()
    });
    setShowEtudeSelector(false);
    
    if (errors.idEtude) {
      setErrors({
        ...errors,
        idEtude: null
      });
    }
  };
  
  // Gestion des changements de formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };
  
  // Gérer le changement de l'incrément des volontaires
  const handleIncrementChange = (e) => {
    const value = parseInt(e.target.value, 10) || 0;
    // Limiter entre 0 et 150
    setVolontaireIncrement(Math.min(Math.max(value, 0), 150));
    
    if (errors.volontaires) {
      setErrors({
        ...errors,
        volontaires: null
      });
    }
  };
  
  // Validation du formulaire
  const validateForm = () => {
    const newErrors = {};
    let hasDateErrors = false;
  
    const dateErrors = formData.dates.map((dateObj) => {
      const errors = {};
      
      // Validation de la date
      if (!dateObj.date) {
        errors.date = 'Date requise';
        hasDateErrors = true;
      }
      
      // Vérification des périodes
      if (selectedEtude && dateObj.date) {
        const studyStart = selectedEtude.dateDebut.split('T')[0];
        const studyEnd = selectedEtude.dateFin.split('T')[0];
        
        if (dateObj.date < studyStart || dateObj.date > studyEnd) {
          errors.date = `La date doit être entre ${formatDate(studyStart)} et ${formatDate(studyEnd)}`;
          hasDateErrors = true;
        }
      }
  
      if (!dateObj.time) {
        errors.time = 'Heure requise';
        hasDateErrors = true;
      }
      
      // Validation du nombre de volontaires
      if (dateObj.volontaireCount <= 0) {
        errors.volontaireCount = 'Nombre invalide';
        hasDateErrors = true;
      }
      
      return errors;
    });
  
    if (hasDateErrors) newErrors.dates = dateErrors;
    
    // Vérification que nous avons au moins des volontaires (soit sélectionnés, soit par incrément)
    const totalVolontaires = selectedVolontaires.length + volontaireIncrement;
    if (totalVolontaires === 0) {
      newErrors.volontaires = 'Veuillez sélectionner au moins un volontaire ou spécifier un incrément';
    }
    
    if (!formData.idEtude) newErrors.idEtude = 'Veuillez sélectionner une étude';
  
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Gestion des dates/heures avec compte de volontaires
  const addDateTime = () => {
    setFormData({
      ...formData,
      dates: [...formData.dates, { date: '', time: '', volontaireCount: 10 }]
    });
  };

  const removeDateTime = (index) => {
    if (formData.dates.length === 1) return;
    const newDates = formData.dates.filter((_, i) => i !== index);
    setFormData({ ...formData, dates: newDates });
  };

  const handleDateTimeChange = (index, field, value) => {
    const newDates = formData.dates.map((dateObj, i) => 
      i === index ? { ...dateObj, [field]: value } : dateObj
    );
    setFormData({ ...formData, dates: newDates });
  };
  
  // Gestion du nombre de volontaires par créneau
  const handleVolontaireCountChange = (index, value) => {
    const count = parseInt(value, 10) || 0;
    const newDates = formData.dates.map((dateObj, i) => 
      i === index ? { ...dateObj, volontaireCount: count } : dateObj
    );
    setFormData({ ...formData, dates: newDates });
  };

  // Soumission modifiée pour gérer les incréments
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
  
    try {
      setIsLoading(true);
      const idEtude = parseInt(formData.idEtude);
      
      // Créer des volontaires factices basés sur l'incrément si nécessaire
      let allVolontaires = [...selectedVolontaires];
      
      // Si nous avons un incrément de volontaires, créer des volontaires fictifs
      if (volontaireIncrement > 0) {
        // Ajouter des volontaires fictifs avec l'option isAutoGenerated à true
        for (let i = 1; i <= volontaireIncrement; i++) {
          allVolontaires.push({
            id: null, // ID null pour les volontaires auto-générés
            nom: `Auto-généré ${i}`,
            prenom: '',
            isAutoGenerated: true
          });
        }
      }
      
      // Répartir les volontaires sur les différents créneaux
      let volontaireIndex = 0;
      let rdvPromises = [];
      
      // Pour chaque créneau date/heure
      for (const dateObj of formData.dates) {
        // Pour le nombre de volontaires spécifié pour ce créneau
        for (let i = 0; i < dateObj.volontaireCount; i++) {
          // Si nous avons atteint la fin de la liste de volontaires, arrêter
          if (volontaireIndex >= allVolontaires.length) break;
          
          const volontaire = allVolontaires[volontaireIndex];
          volontaireIndex++;
          
          // Ne pas créer de RDV pour des volontaires fictifs - les traiter différemment
          // Dans un cas réel, vous pouvez les ajouter à la BD ou les traiter différemment
          if (volontaire.isAutoGenerated) {
            // Créer un RDV avec un ID de volontaire NULL
            const rdvData = {
              idVolontaire: null, // Utiliser NULL pour le ID_VOLONTAIRE
              idEtude,
              idGroupe: formData.idGroupe,
              date: dateObj.date,
              heure: dateObj.time,
              etat: formData.etat,
              commentaires: formData.commentaires || 'TEST RDV\'S sans volontaires'
            };
            
            rdvPromises.push(rdvService.create(rdvData));
          } else {
            // Créer un vrai RDV pour un volontaire réel
            const rdvData = {
              idVolontaire: volontaire.id,
              idEtude,
              idGroupe: formData.idGroupe,
              date: dateObj.date,
              heure: dateObj.time,
              etat: formData.etat,
              commentaires: formData.commentaires
            };
            
            rdvPromises.push(rdvService.create(rdvData));
          }
        }
      }
      
      // Exécution de toutes les promesses
      const results = await Promise.allSettled(rdvPromises);
      
      // Calcul des résultats
      const successCount = results.filter(result => result.status === 'fulfilled' && result.value).length;
      const autoGeneratedCount = results.filter(result => 
        result.status === 'fulfilled' && result.value && result.value.data && result.value.data.isAutoGenerated
      ).length;
      const realCount = successCount - autoGeneratedCount;
      const failedCount = results.length - successCount;
  
      // Feedback utilisateur
      if (failedCount === 0) {
        alert(
          `${successCount} RDV créés avec succès !\n` +
          `- ${realCount} RDV pour des volontaires réels\n` +
          `- ${autoGeneratedCount} RDV pour des volontaires auto-générés`
        );
      } else {
        alert(
          `Création partiellement réussie :\n` +
          `${successCount} RDV créés (${realCount} réels, ${autoGeneratedCount} auto-générés)\n` +
          `${failedCount} échecs\n\n` +
          `Vérifiez les logs pour plus de détails.`
        );
      }
  
      navigate('/rdvs');
    } catch (error) {
      console.error('Erreur globale lors de la création :', error);
      setErrors({
        global: error.message || 'Une erreur inattendue est survenue'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Calculer le total des volontaires potentiels à répartir
  const totalVolontaires = selectedVolontaires.length + volontaireIncrement;
  
  // Calculer le total des volontaires assignés par créneau
  const totalAssignedVolontaires = formData.dates.reduce((sum, dateObj) => sum + dateObj.volontaireCount, 0);
  
  return (
    <div className="w-full px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Nouveau Rendez-vous</h1>
      </div>
      
      {errors.global && (
        <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{errors.global}</p>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Section Volontaires - Modifiée avec l'incrément */}
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200 shadow-sm">
            <div className="flex items-center mb-4">
              <CounterIcon />
              <h2 className="ml-2 text-lg font-semibold text-blue-800">Nombre de RDV's *</h2>
            </div>
            
            <div className="mb-6">
              <input
                type="number"
                min="0"
                max="150"
                value={volontaireIncrement}
                onChange={handleIncrementChange}
                className="w-full py-2 px-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nombre de volontaires automatiques"
              />
              <p className="mt-2 text-sm text-blue-600">
                {volontaireIncrement > 0 
                  ? `${volontaireIncrement} volontaires auto-générés seront créés`
                  : "Aucun volontaire auto-généré ne sera créé"}
              </p>
            </div>
            
            <div className="flex items-center mb-4">
              <UserIcon />
              <h2 className="ml-2 text-lg font-semibold text-blue-800">Volontaires sélectionnés (optionnel)</h2>
            </div>
            
            <div ref={volontaireSelectorRef} className="relative">
              <div className="flex items-center mb-3">
                <div className="relative flex-grow">
                  <input
                    type="text"
                    placeholder="Rechercher un volontaire..."
                    value={searchVolontaireTerm}
                    onChange={(e) => setSearchVolontaireTerm(e.target.value)}
                    onFocus={() => setShowVolontaireSelector(true)}
                    className="w-full py-2 pl-10 pr-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <SearchIcon />
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowVolontaireSelector(!showVolontaireSelector)}
                  className="ml-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    {showVolontaireSelector 
                      ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path>
                      : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    }
                  </svg>
                </button>
              </div>
              
              {/* Liste des volontaires sélectionnés */}
              <div className="flex flex-wrap gap-2 mb-3 min-h-[50px]">
                {selectedVolontaires.length > 0 ? (
                  selectedVolontaires.map(v => (
                    <div key={v.id} className="bg-white border border-blue-300 px-3 py-1 rounded-full flex items-center text-blue-800 shadow-sm">
                      <span>{v.prenom} {v.nom}</span>
                      <button 
                        type="button" 
                        className="ml-2 text-blue-500 hover:text-blue-700 focus:outline-none"
                        onClick={() => removeVolontaire(v.id)}
                        aria-label="Supprimer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-blue-700 text-sm italic p-2">Aucun volontaire spécifique sélectionné</div>
                )}
              </div>
              
              {/* Résumé des volontaires */}
              <div className="mt-4 p-3 bg-blue-100 border border-blue-200 rounded-lg">
                <p className="font-medium text-blue-800">
                  Total des volontaires: {totalVolontaires}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  {selectedVolontaires.length} volontaires spécifiques + {volontaireIncrement} auto-générés
                </p>
              </div>
              
              {errors.volontaires && (
                <div className="mt-2 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div className="whitespace-pre-line">{errors.volontaires}</div>
                  </div>
                </div>
              )}
              
              {/* Dropdown de sélection de volontaires */}
              {showVolontaireSelector && (
                <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-blue-300 max-h-60 overflow-y-auto">
                  <div className="sticky top-0 p-2 bg-blue-50 border-b border-blue-200">
                    <span className="text-sm font-medium text-blue-700">Sélectionnez un ou plusieurs volontaires</span>
                  </div>
                  {filteredVolontaires.length > 0 ? (
                    filteredVolontaires.map(v => (
                      <div 
                        key={v.id} 
                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex items-center border-b border-gray-100 last:border-b-0"
                        onClick={() => addVolontaire(v)}
                      >
                        <div className="flex-shrink-0 mr-2">
                          <input 
                            type="checkbox" 
                            checked={selectedVolontaires.some(sv => sv.id === v.id)}
                            onChange={() => {}}
                            className="h-4 w-4 text-blue-600 border-blue-300 rounded focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <span className="font-medium">{v.prenom} {v.nom}</span>
                        </div>
                      </div>
                    ))
                  ) : searchVolontaireTerm ? (
                    <div className="p-4 text-center text-gray-500">
                      Aucun volontaire ne correspond à votre recherche
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      Commencez à taper pour rechercher un volontaire
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Section Étude - Inchangée */}
          <div className="bg-green-50 rounded-xl p-6 border border-green-200 shadow-sm">
            <div className="flex items-center mb-4">
              <FolderIcon />
              <h2 className="ml-2 text-lg font-semibold text-green-800">Étude *</h2>
            </div>
            
            <div ref={etudeSelectorRef} className="relative">
              <div 
                onClick={() => setShowEtudeSelector(!showEtudeSelector)}
                className="flex cursor-pointer items-center p-3 border border-green-300 rounded-lg bg-white hover:border-green-500 focus:outline-none"
              >
                {selectedEtude ? (
                  <div>
                    <div className="font-medium text-gray-800">{selectedEtude.ref}</div>
                    <div className="text-sm text-gray-500">{selectedEtude.titre}</div>
                  </div>
                ) : (
                  <div className="text-gray-500">Sélectionner une étude</div>
                )}
                <div className="ml-auto">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
              
              {errors.idEtude && (
                <p className="mt-1 text-sm text-red-600 bg-red-50 p-2 rounded">{errors.idEtude}</p>
              )}
              
              {/* Dropdown de sélection d'études */}
              {showEtudeSelector && (
                <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-green-300 overflow-hidden">
                  <div className="sticky top-0 p-2 border-b border-green-200 bg-green-50">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Rechercher une étude par référence ou titre..."
                        value={searchEtudeTerm}
                        onChange={(e) => setSearchEtudeTerm(e.target.value)}
                        className="w-full py-2 pl-10 pr-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        autoFocus
                      />
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <SearchIcon />
                      </div>
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {filteredEtudes.length > 0 ? (
                      filteredEtudes.map(etude => (
                        <div 
                          key={etude.idEtude || etude.id} 
                          className="p-3 hover:bg-green-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          onClick={() => selectEtude(etude)}
                        >
                          <div className="font-medium text-gray-800">{etude.ref}</div>
                          <div className="text-sm text-gray-500 truncate">{etude.titre}</div>
                        </div>
                      ))
                    ) : searchEtudeTerm ? (
                      <div className="p-4 text-center text-gray-500">
                        Aucune étude ne correspond à votre recherche
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        Commencez à taper pour rechercher une étude
                      </div>
                    )}
                    {searchEtudeTerm.length > 0 && filteredEtudes.length >= 50 && (
                      <div className="px-3 py-2 text-xs text-center text-gray-500 bg-gray-50 border-t border-gray-100">
                        Affichage limité à 50 résultats. Précisez votre recherche pour affiner les résultats.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Section Dates et Heures - Modifiée avec le nombre de volontaires par créneau */}
          <div className="bg-purple-50 rounded-xl p-6 border border-purple-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <CalendarIcon />
                <h2 className="ml-2 text-lg font-semibold text-purple-800">Dates et Heures *</h2>
              </div>
              <button
                type="button"
                onClick={addDateTime}
                className="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
              >
                Ajouter un créneau
              </button>
            </div>
            
            {/* Résumé de la répartition */}
            <div className="p-3 mb-4 bg-white border border-purple-200 rounded-lg shadow-sm">
              <p className="font-medium text-purple-800">
                Répartition des volontaires: {totalAssignedVolontaires} / {totalVolontaires}
              </p>
              <div className="flex items-center mt-2">
                {totalAssignedVolontaires > totalVolontaires ? (
                  <>
                    <svg className="w-5 h-5 text-amber-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-purple-600">Attention: Plus de volontaires assignés que disponibles</span>
                  </>
                ) : totalAssignedVolontaires < totalVolontaires ? (
                  <>
                    <svg className="w-5 h-5 text-amber-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-purple-600">Attention: Tous les volontaires ne sont pas assignés</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-green-600">Tous les volontaires sont assignés</span>
                  </>
                )}
              </div>
            </div>

            {formData.dates.map((dateObj, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 last:mb-0 bg-white p-3 rounded-lg border border-purple-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date {index + 1}
                  </label>
                  <input
                    type="date"
                    value={dateObj.date}
                    onChange={(e) => handleDateTimeChange(index, 'date', e.target.value)}
                    min={selectedEtude ? selectedEtude.dateDebut.split('T')[0] : undefined}
                    max={selectedEtude ? selectedEtude.dateFin.split('T')[0] : undefined}
                    className={`w-full py-2 px-3 border rounded-lg ${
                      errors.dates?.[index]?.date ? 'border-red-500' : 'border-purple-300'
                    } focus:ring-2 focus:ring-purple-500`}
                  />
                  {errors.dates?.[index]?.date && (
                    <p className="mt-1 text-sm text-red-600">{errors.dates[index].date}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Heure {index + 1}
                  </label>
                  <input
                    type="time"
                    value={dateObj.time}
                    onChange={(e) => handleDateTimeChange(index, 'time', e.target.value)}
                    className={`w-full py-2 px-3 border rounded-lg ${
                      errors.dates?.[index]?.time ? 'border-red-500' : 'border-purple-300'
                    } focus:ring-2 focus:ring-purple-500`}
                    step="300" // Pas de 5 minutes
                  />
                  {errors.dates?.[index]?.time && (
                    <p className="mt-1 text-sm text-red-600">{errors.dates[index].time}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de RDV
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={dateObj.volontaireCount}
                    onChange={(e) => handleVolontaireCountChange(index, e.target.value)}
                    className={`w-full py-2 px-3 border rounded-lg ${
                      errors.dates?.[index]?.volontaireCount ? 'border-red-500' : 'border-purple-300'
                    } focus:ring-2 focus:ring-purple-500`}
                  />
                  {errors.dates?.[index]?.volontaireCount && (
                    <p className="mt-1 text-sm text-red-600">{errors.dates[index].volontaireCount}</p>
                  )}
                </div>

                <div className="flex items-end">
                  {formData.dates.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDateTime(index)}
                      className="w-full py-2 px-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Section Groupe et État */}
          <div className="bg-amber-50 rounded-xl p-6 border border-amber-200 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center mb-4">
                  <GroupIcon />
                  <h2 className="ml-2 text-lg font-semibold text-amber-800">Groupe</h2>
                </div>
                <input
                  type="number"
                  id="idGroupe"
                  name="idGroupe"
                  value={formData.idGroupe || ''}
                  onChange={handleChange}
                  className="w-full py-2 px-3 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  min="1"
                  placeholder="Optionnel"
                />
              </div>
              
              <div>
                <div className="flex items-center mb-4">
                  <StatusIcon />
                  <h2 className="ml-2 text-lg font-semibold text-amber-800">État</h2>
                </div>
                <select
                  id="etat"
                  name="etat"
                  value={formData.etat}
                  onChange={handleChange}
                  className="w-full py-2 px-3 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                >
                  <option value="PLANIFIE">Planifié</option>
                  <option value="CONFIRME">Confirmé</option>
                  <option value="ANNULE">Annulé</option>
                  <option value="TERMINE">Terminé</option>
                  <option value="REPORTE">Reporté</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        {/* Section Commentaires */}
        <div className="mt-6 bg-gray-50 rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <h2 className="ml-2 text-lg font-semibold text-gray-800">Commentaires</h2>
          </div>
          <textarea
            id="commentaires"
            name="commentaires"
            value={formData.commentaires}
            onChange={handleChange}
            rows="3"
            className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
            placeholder="Informations complémentaires..."
          ></textarea>
        </div>
        
        {/* Boutons d'action */}
        <div className="flex justify-end space-x-4 mt-6">
          <button
            type="button"
            onClick={() => navigate('/rdvs')}
            className="px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-8 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors duration-150"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
  );
};

export default NewRdvForm;