import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';

// Import des icônes
import saveSvg from '../../assets/icons/save.svg';
import crossSvg from '../../assets/icons/x.svg';
import arrowLeftSvg from '../../assets/icons/arrow-left.svg';
import userPlusSvg from '../../assets/icons/user-plus.svg';
import userEditSvg from '../../assets/icons/user-edit.svg';
import infoSvg from '../../assets/icons/info.svg';
import alertCircleSvg from '../../assets/icons/alert-circle.svg';

const IconSave = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={saveSvg} width={width} height={height} className={className} alt="Save" {...props} />
);

const IconCross = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={crossSvg} width={width} height={height} className={className} alt="Cross" {...props} />
);

const IconArrowLeft = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={arrowLeftSvg} width={width} height={height} className={className} alt="Arrow Left" {...props} />
);

const IconUserPlus = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={userPlusSvg} width={width} height={height} className={className} alt="User Plus" {...props} />
);

const IconUserEdit = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={userEditSvg} width={width} height={height} className={className} alt="User Edit" {...props} />
);

const IconInfo = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={infoSvg} width={width} height={height} className={className} alt="Info" {...props} />
);

const IconAlertCircle = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={alertCircleSvg} width={width} height={height} className={className} alt="Alert Circle" {...props} />
);

// Options pour les sélections
const sexeOptions = ['Homme', 'Femme'];
const typePeauOptions = ['Normale', 'Sèche', 'Grasse', 'Mixte', 'Sensible'];
const phototypeOptions = ['I', 'II', 'III', 'IV', 'V', 'VI'];
const carnationOptions = ['Très claire', 'Claire', 'Moyenne', 'Mate', 'Foncée'];
const groupeOptions = ['Groupe A', 'Groupe B', 'Groupe C'];
const etudeOptions = ['Étude 1', 'Étude 2', 'Étude 3'];
const intensiteOptions = ['Faible', 'Modéré', 'Fort', 'Très fort', 'Aucun'];
const expositionSolaireOptions = ['Faible', 'Modérée', 'Forte', 'Très forte', 'Aucune'];
const coupsDeSoleilOptions = ['Rarement', 'Occasionnellement', 'Souvent', 'Très souvent', 'Jamais'];
const bronzageOptions = ['Difficilement', 'Progressivement', 'Facilement', 'Très facilement', 'Jamais'];
const sensibiliteCutaneeOptions = ['Faible', 'Modérée', 'Forte', 'Très forte', 'Aucune'];
const yeuxOptions = ['Bleus', 'Verts', 'Marrons', 'Noirs', 'Noisette', 'Gris'];
const levresOptions = ['Fines', 'Moyennes', 'Pulpeuses'];
const ouiNonOptions = ['Oui', 'Non'];
const couleurCheveuxOptions = ['Blonds', 'Châtains', 'Bruns', 'Roux', 'Noirs', 'Gris', 'Blancs'];
const natureCheveuxOptions = ['Lisses', 'Ondulés', 'Bouclés', 'Crépus'];
const longueurCheveuxOptions = ['Courts', 'Mi-longs', 'Longs', 'Très longs'];
const epaisseurCheveuxOptions = ['Fins', 'Moyens', 'Épais'];
const natureCuirCheveluOptions = ['Normal', 'Sec', 'Gras', 'Mixte', 'Sensible'];
const scoreOptions = ['0', '1', '2', '3', '4'];

// Composant FormField réutilisable
const FormField = ({ 
  label, 
  id, 
  type = 'text', 
  value, 
  onChange, 
  required = false, 
  error = null,
  options = null, 
  placeholder = '',
  infoTooltip = null,
  className = ''
}) => {
  const inputClasses = `mt-1 block w-full rounded-md ${
    error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
  } shadow-sm sm:text-sm`;
  
  return (
    <div className={`mb-4 ${className}`}>
      <div className="flex justify-between">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
          {infoTooltip && (
            <span className="ml-1 inline-block">
              <div className="group relative">
                <IconInfo width={16} height={16} className="inline text-gray-400 hover:text-gray-500" />
                <div className="hidden group-hover:block absolute z-10 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg -mt-1 ml-6">
                  {infoTooltip}
                </div>
              </div>
            </span>
          )}
        </label>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
      
      {type === 'select' ? (
        <select
          id={id}
          name={id}
          value={value || ''}
          onChange={onChange}
          className={inputClasses}
          required={required}
        >
          <option value="">Sélectionner...</option>
          {options.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          id={id}
          name={id}
          value={value || ''}
          onChange={onChange}
          rows={3}
          className={inputClasses}
          placeholder={placeholder}
          required={required}
        />
      ) : (
        <input
          type={type}
          id={id}
          name={id}
          value={value || ''}
          onChange={onChange}
          className={inputClasses}
          placeholder={placeholder}
          required={required}
        />
      )}
    </div>
  );
};

// Composant pour les sections pliables
// Composant pour les sections pliables avec style coloré
const CollapsibleSection = ({ title, children, isOpen = false, color = "blue" }) => {
  const [open, setOpen] = useState(isOpen);
  
  // Définir les classes de couleur pour différentes sections
  const colorClasses = {
    blue: "border-blue-500 text-blue-700",
    green: "border-green-500 text-green-700",
    purple: "border-purple-500 text-purple-700",
    red: "border-red-500 text-red-700",
    amber: "border-amber-500 text-amber-700",
    teal: "border-teal-500 text-teal-700",
    indigo: "border-indigo-500 text-indigo-700",
    pink: "border-pink-500 text-pink-700"
  };
  
  const headerColorClass = colorClasses[color] || colorClasses.blue;
  
  return (
    <div className="mb-6">
      <button
        type="button"
        className={`w-full flex justify-between items-center text-left text-lg font-medium ${headerColorClass} border-b-2 pb-2 mb-3 focus:outline-none hover:bg-gray-50 rounded-t-md transition-colors`}
        onClick={() => setOpen(!open)}
      >
        <span>{title}</span>
        <svg className={`h-5 w-5 transform ${open ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      
      <div className={`transition-all duration-200 ${open ? 'block' : 'hidden'} ${open ? `bg-${color}-50 bg-opacity-30 p-4 rounded-b-md` : ''}`}>
        {children}
      </div>
    </div>
  );
};



// Composant principal PanelForm
const PanelForm = () => {
  const { idPanel } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(idPanel);
  
  // État du formulaire avec tous les attributs de l'API
  const [formData, setFormData] = useState({
    // Champs existants
    sexe: '',
    typePeauVisage: '',
    typePeauCorps: '',
    phototype: '',
    carnation: '',
    groupe: '',
    commentaires: '',
    
    // Nouveaux champs selon l'API
    idEtude: '',
    idGroupe: '',
    bronzage: '',
    coupsDeSoleil: '',
    expositionSolaire: '',
    sensibiliteCutanee: '',
    secheresseLevres: '',
    secheresseCou: '',
    secheressePoitrineDecollete: '',
    secheresseVentreTaille: '',
    secheresseFessesHanches: '',
    secheresseBras: '',
    secheresseMains: '',
    secheresseJambes: '',
    secheressePieds: '',
    tachesPigmentairesVisage: '',
    tachesPigmentairesCou: '',
    tachesPigmentairesDecollete: '',
    tachesPigmentairesMains: '',
    perteDeFermeteVisage: '',
    perteDeFermeteCou: '',
    perteDeFermeteDecollete: '',
    pilosite: '',
    cicatrices: '',
    tatouages: '',
    piercings: '',
    vergeturesJambes: '',
    vergeturesFessesHanches: '',
    vergeturesVentreTaille: '',
    vergeturesPoitrineDecollete: '',
    celluliteJambes: '',
    celluliteFessesHanches: '',
    celluliteVentreTaille: '',
    celluliteBras: '',
    couleurCheveux: '',
    natureCheveux: '',
    longueurCheveux: '',
    epaisseurCheveux: '',
    natureCuirChevelu: '',
    cheveuxAbimes: '',
    cheveuxCassants: '',
    cheveuxPlats: '',
    cheveuxTernes: '',
    pointesFourchues: '',
    pellicules: '',
    demangeaisonsDuCuirChevelu: '',
    cuirCheveluSensible: '',
    chuteDeCheveux: '',
    calvitie: '',
    epaisseurCils: '',
    longueurCils: '',
    courbureCils: '',
    cilsAbimes: '',
    cilsBroussailleux: '',
    chuteDeCils: '',
    onglesMous: '',
    onglesCassants: '',
    onglesStries: '',
    onglesDedoubles: '',
    lesionsRetentionnelles: '',
    lesionsInflammatoires: '',
    cernesPigmentaires: '',
    cernesVasculaires: '',
    poches: '',
    poresVisibles: '',
    teintInhomogene: '',
    teintTerne: '',
    menopause: '',
    ths: '',
    contraception: '',
    acne: '',
    couperoseRosacee: '',
    psoriasis: '',
    dermiteSeborrheique: '',
    eczema: '',
    angiome: '',
    pityriasis: '',
    vitiligo: '',
    melanome: '',
    zona: '',
    herpes: '',
    pelade: '',
    reactionAllergique: '',
    desensibilisation: '',
    terrainAtopique: '',
    scorePodMin: '',
    scorePogMin: '',
    scoreFrontMin: '',
    scoreLionMin: '',
    scorePpdMin: '',
    scorePpgMin: '',
    scoreDodMin: '',
    scoreDogMin: '',
    scoreSngdMin: '',
    scoreSnggMin: '',
    scoreLevsupMin: '',
    scoreComlevdMin: '',
    scoreComlevgMin: '',
    scorePtoseMin: '',
    scorePodMax: '',
    scorePogMax: '',
    scoreFrontMax: '',
    scoreLionMax: '',
    scorePpdMax: '',
    scorePpgMax: '',
    scoreDodMax: '',
    scoreDogMax: '',
    scoreSngdMax: '',
    scoreSnggMax: '',
    scoreLevsupMax: '',
    scoreComlevdMax: '',
    scoreComlevgMax: '',
    scorePtoseMax: '',
    originePere: '',
    origineMere: '',
    sousEthnie: '',
    bouffeeChaleurMenaupose: '',
    yeux: '',
    levres: '',
    mapyeux: '',
    maplevres: '',
    mapsourcils: ''
  });
  
  // États pour la gestion des erreurs et du chargement
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isLoading, setIsLoading] = useState(isEditMode);

  // Ajoutez les nouveaux états ici
  const [etudes, setEtudes] = useState([]);
  const [groupes, setGroupes] = useState([]);
  
  // Ajoutez le nouvel effet pour charger les données d'options
  useEffect(() => {
    const fetchOptionsData = async () => {
      try {
        // Charger les études disponibles
        const etudesResponse = await api.get('/etudes');
        setEtudes(etudesResponse.data);
        
        // Charger les groupes disponibles
        const groupesResponse = await api.get('/groupes');
        setGroupes(groupesResponse.data);
      } catch (error) {
        console.error('Erreur lors du chargement des options:', error);
        // Vous pourriez vouloir définir une erreur d'état ici
      }
    };
    
    fetchOptionsData();
  }, []);

  // Charger les données du panel en mode édition
  useEffect(() => {
    console.log('ID reçu:', idPanel);
    if (isEditMode) {
      const fetchPanelData = async () => {
        try {
          setIsLoading(true);
          const response = await api.get(`/panels/${idPanel}`);
          
          // Add type conversion or validation here
          const sanitizedData = Object.keys(response.data).reduce((acc, key) => {
            // Convert specific fields to appropriate types if needed
            if (['scorePodMin', 'scorePogMin', /* other score fields */].includes(key)) {
              acc[key] = response.data[key] ? parseInt(response.data[key], 10) : null;
            } else {
              acc[key] = response.data[key];
            }
            return acc;
          }, {});
  
          setFormData(sanitizedData);
        } catch (error) {
          console.error('Erreur lors du chargement des données du panel:', error);
          setSubmitError('Impossible de charger les données du panel.');
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchPanelData();
    }
  }, [idPanel, isEditMode]);
  
  // Gestion des changements dans le formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Effacer l'erreur pour ce champ
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  
  // Validation du formulaire
  const validateForm = () => {
    const newErrors = {};
    

    if (!formData.phototype) newErrors.phototype = 'Le phototype est obligatoire';
    if (!formData.idEtude) newErrors.idEtude = 'L\'étude est obligatoire';
    if (!formData.idGroupe) newErrors.idGroupe = 'Le groupe est obligatoire';
    
    // Valider l'email
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }
    
    // Valider le téléphone
    if (formData.telephone && !/^[0-9+\s\-()]{8,15}$/.test(formData.telephone)) {
      newErrors.telephone = 'Format de téléphone invalide';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Vérification de la validité du formulaire
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    setLoading(true);
    setSubmitError('');
    
    try {
      if (isEditMode) {
        // Mise à jour
        await api.put(`/panels/${idPanel}`, formData);
        navigate(`/panels/${idPanel}`);
      } else {
        // Création
        const response = await api.post('/panels', formData);
        navigate(`/panels/${response.data.id}`);
      }
    } catch (error) {
      console.error('Erreur lors de la soumission du formulaire:', error);
      setSubmitError(error.response?.data?.message || 'Une erreur est survenue lors de la soumission du formulaire.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };
  
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center">
          <Link to="/panels" className="text-blue-600 hover:text-blue-800 flex items-center mr-4">
            <IconArrowLeft width={16} height={16} className="mr-1" />
            Retour
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            {isEditMode ? (
              <>
                <IconUserEdit width={24} height={24} className="mr-2 text-blue-600" />
                Modifier un panel
              </>
            ) : (
              <>
                <IconUserPlus width={24} height={24} className="mr-2 text-blue-600" />
                Ajouter un panel
              </>
            )}
          </h1>
        </div>
      </div>
      
      {submitError && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex items-center">
            <IconAlertCircle width={20} height={20} className="text-red-500 mr-2" />
            <p className="text-red-700">{submitError}</p>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
        <CollapsibleSection title="Informations administratives" isOpen={true} color="blue">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <FormField
            label="Étude"
            id="idEtude"
            type="select"
            value={formData.idEtude}
            onChange={handleChange}
            options={etudes.map(etude => etude.nom || etude.idEtude)}
            required
            error={errors.idEtude}
          />

          <FormField
            label="Groupe"
            id="idGroupe"
            type="select"
            value={formData.idGroupe}
            onChange={handleChange}
            options={groupes.map(groupe => groupe.nom || groupe.idGroupe)}
            required
            error={errors.idGroupe}
          />
          </div>
        </CollapsibleSection>
        
        <CollapsibleSection title="Informations personnelles" isOpen={true} color="green">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">

            <FormField
              label="Sexe"
              id="sexe"
              type="select"
              value={formData.sexe}
              onChange={handleChange}
              options={sexeOptions}
              required
              error={errors.sexe}
            />
            
            <FormField
              label="Origine du père"
              id="originePere"
              value={formData.originePere}
              onChange={handleChange}
            />
            
            <FormField
              label="Origine de la mère"
              id="origineMere"
              value={formData.origineMere}
              onChange={handleChange}
            />
            
            <FormField
              label="Sous-ethnie"
              id="sousEthnie"
              value={formData.sousEthnie}
              onChange={handleChange}
            />
          </div>
        </CollapsibleSection>
        
        <CollapsibleSection title="Caractéristiques physiques générales" isOpen={true} color="purple">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
            <FormField
              label="Phototype"
              id="phototype"
              type="select"
              value={formData.phototype}
              onChange={handleChange}
              options={phototypeOptions}
              required
              error={errors.phototype}
              infoTooltip="I: Peau très claire, brûle toujours, ne bronze jamais. II: Peau claire, brûle facilement, bronze peu. III: Peau claire à mate, brûle modérément, bronze progressivement. IV: Peau mate, brûle peu, bronze facilement. V: Peau foncée, brûle rarement, bronze facilement. VI: Peau très foncée, ne brûle jamais, bronze toujours."
            />
            
            <FormField
              label="Carnation"
              id="carnation"
              type="select"
              value={formData.carnation}
              onChange={handleChange}
              options={carnationOptions}
            />
            
            <FormField
              label="Bronzage"
              id="bronzage"
              type="select"
              value={formData.bronzage}
              onChange={handleChange}
              options={bronzageOptions}
            />
            
            <FormField
              label="Coups de soleil"
              id="coupsDeSoleil"
              type="select"
              value={formData.coupsDeSoleil}
              onChange={handleChange}
              options={coupsDeSoleilOptions}
            />
            
            <FormField
              label="Exposition solaire"
              id="expositionSolaire"
              type="select"
              value={formData.expositionSolaire}
              onChange={handleChange}
              options={expositionSolaireOptions}
            />
            
            <FormField
              label="Sensibilité cutanée"
              id="sensibiliteCutanee"
              type="select"
              value={formData.sensibiliteCutanee}
              onChange={handleChange}
              options={sensibiliteCutaneeOptions}
            />
            
            <FormField
              label="Couleur des yeux"
              id="yeux"
              type="select"
              value={formData.yeux}
              onChange={handleChange}
              options={yeuxOptions}
            />
            
            <FormField
              label="Lèvres"
              id="levres"
              type="select"
              value={formData.levres}
              onChange={handleChange}
              options={levresOptions}
            />
          </div>
        </CollapsibleSection>
        
        <CollapsibleSection title="Type de peau" color="amber">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <FormField
              label="Type de peau visage"
              id="typePeauVisage"
              type="select"
              value={formData.typePeauVisage}
              onChange={handleChange}
              options={typePeauOptions}
              required
              error={errors.typePeauVisage}
            />
            
            <FormField
              label="Type de peau corps"
              id="typePeauCorps"
              type="select"
              value={formData.typePeauCorps}
              onChange={handleChange}
              options={typePeauOptions}
            />
          </div>
        </CollapsibleSection>
        
        <CollapsibleSection title="Sécheresse par zone" color="teal">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
            <FormField
              label="Sécheresse lèvres"
              id="secheresseLevres"
              type="select"
              value={formData.secheresseLevres}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Sécheresse cou"
              id="secheresseCou"
              type="select"
              value={formData.secheresseCou}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Sécheresse poitrine/décolleté"
              id="secheressePoitrineDecollete"
              type="select"
              value={formData.secheressePoitrineDecollete}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Sécheresse ventre/taille"
              id="secheresseVentreTaille"
              type="select"
              value={formData.secheresseVentreTaille}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Sécheresse fesses/hanches"
              id="secheresseFessesHanches"
              type="select"
              value={formData.secheresseFessesHanches}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Sécheresse bras"
              id="secheresseBras"
              type="select"
              value={formData.secheresseBras}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Sécheresse mains"
              id="secheresseMains"
              type="select"
              value={formData.secheresseMains}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Sécheresse jambes"
              id="secheresseJambes"
              type="select"
              value={formData.secheresseJambes}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Sécheresse pieds"
              id="secheressePieds"
              type="select"
              value={formData.secheressePieds}
              onChange={handleChange}
              options={intensiteOptions}
            />
          </div>
        </CollapsibleSection>
        
        <CollapsibleSection title="Problèmes cutanés" color="red">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
            <FormField
              label="Taches pigmentaires visage"
              id="tachesPigmentairesVisage"
              type="select"
              value={formData.tachesPigmentairesVisage}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Taches pigmentaires cou"
              id="tachesPigmentairesCou"
              type="select"
              value={formData.tachesPigmentairesCou}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Taches pigmentaires décolleté"
              id="tachesPigmentairesDecollete"
              type="select"
              value={formData.tachesPigmentairesDecollete}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Taches pigmentaires mains"
              id="tachesPigmentairesMains"
              type="select"
              value={formData.tachesPigmentairesMains}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Perte de fermeté visage"
              id="perteDeFermeteVisage"
              type="select"
              value={formData.perteDeFermeteVisage}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Perte de fermeté cou"
              id="perteDeFermeteCou"
              type="select"
              value={formData.perteDeFermeteCou}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Perte de fermeté décolleté"
              id="perteDeFermeteDecollete"
              type="select"
              value={formData.perteDeFermeteDecollete}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Pilosité"
              id="pilosite"
              type="select"
              value={formData.pilosite}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Cicatrices"
              id="cicatrices"
              type="select"
              value={formData.cicatrices}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Tatouages"
              id="tatouages"
              type="select"
              value={formData.tatouages}
              onChange={handleChange}
              options={ouiNonOptions}
            />
            
            <FormField
              label="Piercings"
              id="piercings"
              type="select"
              value={formData.piercings}
              onChange={handleChange}
              options={ouiNonOptions}
            />
          </div>
        </CollapsibleSection>
        
        <CollapsibleSection title="Vergetures et cellulite" color="indigo">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
            <FormField
              label="Vergetures jambes"
              id="vergeturesJambes"
              type="select"
              value={formData.vergeturesJambes}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Vergetures fesses/hanches"
              id="vergeturesFessesHanches"
              type="select"
              value={formData.vergeturesFessesHanches}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Vergetures ventre/taille"
              id="vergeturesVentreTaille"
              type="select"
              value={formData.vergeturesVentreTaille}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Vergetures poitrine/décolleté"
              id="vergeturesPoitrineDecollete"
              type="select"
              value={formData.vergeturesPoitrineDecollete}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Cellulite jambes"
              id="celluliteJambes"
              type="select"
              value={formData.celluliteJambes}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Cellulite fesses/hanches"
              id="celluliteFessesHanches"
              type="select"
              value={formData.celluliteFessesHanches}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Cellulite ventre/taille"
              id="celluliteVentreTaille"
              type="select"
              value={formData.celluliteVentreTaille}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Cellulite bras"
              id="celluliteBras"
              type="select"
              value={formData.celluliteBras}
              onChange={handleChange}
              options={intensiteOptions}
            />
          </div>
        </CollapsibleSection>
        
        <CollapsibleSection title="Cheveux" color="pink">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
            <FormField
              label="Couleur des cheveux"
              id="couleurCheveux"
              type="select"
              value={formData.couleurCheveux}
              onChange={handleChange}
              options={couleurCheveuxOptions}
            />
            
            <FormField
              label="Nature des cheveux"
              id="natureCheveux"
              type="select"
              value={formData.natureCheveux}
              onChange={handleChange}
              options={natureCheveuxOptions}
            />
            
            <FormField
              label="Longueur des cheveux"
              id="longueurCheveux"
              type="select"
              value={formData.longueurCheveux}
              onChange={handleChange}
              options={longueurCheveuxOptions}
            />
            
            <FormField
              label="Épaisseur des cheveux"
              id="epaisseurCheveux"
              type="select"
              value={formData.epaisseurCheveux}
              onChange={handleChange}
              options={epaisseurCheveuxOptions}
            />
            
            <FormField
              label="Nature du cuir chevelu"
              id="natureCuirChevelu"
              type="select"
              value={formData.natureCuirChevelu}
              onChange={handleChange}
              options={natureCuirCheveluOptions}
            />
            
            <FormField
              label="Cheveux abîmés"
              id="cheveuxAbimes"
              type="select"
              value={formData.cheveuxAbimes}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Cheveux cassants"
              id="cheveuxCassants"
              type="select"
              value={formData.cheveuxCassants}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Cheveux plats"
              id="cheveuxPlats"
              type="select"
              value={formData.cheveuxPlats}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Cheveux ternes"
              id="cheveuxTernes"
              type="select"
              value={formData.cheveuxTernes}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Pointes fourchues"
              id="pointesFourchues"
              type="select"
              value={formData.pointesFourchues}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Pellicules"
              id="pellicules"
              type="select"
              value={formData.pellicules}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Démangeaisons du cuir chevelu"
              id="demangeaisonsDuCuirChevelu"
              type="select"
              value={formData.demangeaisonsDuCuirChevelu}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Cuir chevelu sensible"
              id="cuirCheveluSensible"
              type="select"
              value={formData.cuirCheveluSensible}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Chute de cheveux"
              id="chuteDeCheveux"
              type="select"
              value={formData.chuteDeCheveux}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Calvitie"
              id="calvitie"
              type="select"
              value={formData.calvitie}
              onChange={handleChange}
              options={intensiteOptions}
            />
          </div>
        </CollapsibleSection>
        
        <CollapsibleSection title="Cils et ongles" color="green">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
            <FormField
              label="Épaisseur des cils"
              id="epaisseurCils"
              type="select"
              value={formData.epaisseurCils}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Longueur des cils"
              id="longueurCils"
              type="select"
              value={formData.longueurCils}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Courbure des cils"
              id="courbureCils"
              type="select"
              value={formData.courbureCils}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Cils abîmés"
              id="cilsAbimes"
              type="select"
              value={formData.cilsAbimes}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Cils broussailleux"
              id="cilsBroussailleux"
              type="select"
              value={formData.cilsBroussailleux}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Chute de cils"
              id="chuteDeCils"
              type="select"
              value={formData.chuteDeCils}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Ongles mous"
              id="onglesMous"
              type="select"
              value={formData.onglesMous}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Ongles cassants"
              id="onglesCassants"
              type="select"
              value={formData.onglesCassants}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Ongles striés"
              id="onglesStries"
              type="select"
              value={formData.onglesStries}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Ongles dédoublés"
              id="onglesDedoubles"
              type="select"
              value={formData.onglesDedoubles}
              onChange={handleChange}
              options={intensiteOptions}
            />
          </div>
        </CollapsibleSection>
        
        <CollapsibleSection title="Problèmes de visage" color="blue">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
            <FormField
              label="Lésions rétentionnelles"
              id="lesionsRetentionnelles"
              type="select"
              value={formData.lesionsRetentionnelles}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Lésions inflammatoires"
              id="lesionsInflammatoires"
              type="select"
              value={formData.lesionsInflammatoires}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Cernes pigmentaires"
              id="cernesPigmentaires"
              type="select"
              value={formData.cernesPigmentaires}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Cernes vasculaires"
              id="cernesVasculaires"
              type="select"
              value={formData.cernesVasculaires}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Poches"
              id="poches"
              type="select"
              value={formData.poches}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Pores visibles"
              id="poresVisibles"
              type="select"
              value={formData.poresVisibles}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Teint inhomogène"
              id="teintInhomogene"
              type="select"
              value={formData.teintInhomogene}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Teint terne"
              id="teintTerne"
              type="select"
              value={formData.teintTerne}
              onChange={handleChange}
              options={intensiteOptions}
            />
          </div>
        </CollapsibleSection>
        
        <CollapsibleSection title="Conditions particulières" color="amber">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
            <FormField
              label="Ménopause"
              id="menopause"
              type="select"
              value={formData.menopause}
              onChange={handleChange}
              options={ouiNonOptions}
            />
            
            <FormField
              label="THS"
              id="ths"
              type="select"
              value={formData.ths}
              onChange={handleChange}
              options={ouiNonOptions}
              infoTooltip="Traitement Hormonal Substitutif"
            />
            
            <FormField
              label="Contraception"
              id="contraception"
              type="select"
              value={formData.contraception}
              onChange={handleChange}
              options={ouiNonOptions}
            />
            
            <FormField
              label="Bouffées de chaleur ménopause"
              id="bouffeeChaleurMenaupose"
              type="select"
              value={formData.bouffeeChaleurMenaupose}
              onChange={handleChange}
              options={intensiteOptions}
            />
          </div>
        </CollapsibleSection>
        
        <CollapsibleSection title="Conditions dermatologiques" color="purple">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
            <FormField
              label="Acné"
              id="acne"
              type="select"
              value={formData.acne}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Couperose/Rosacée"
              id="couperoseRosacee"
              type="select"
              value={formData.couperoseRosacee}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Psoriasis"
              id="psoriasis"
              type="select"
              value={formData.psoriasis}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Dermite séborrhéique"
              id="dermiteSeborrheique"
              type="select"
              value={formData.dermiteSeborrheique}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Eczéma"
              id="eczema"
              type="select"
              value={formData.eczema}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Angiome"
              id="angiome"
              type="select"
              value={formData.angiome}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Pityriasis"
              id="pityriasis"
              type="select"
              value={formData.pityriasis}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Vitiligo"
              id="vitiligo"
              type="select"
              value={formData.vitiligo}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Mélanome"
              id="melanome"
              type="select"
              value={formData.melanome}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Zona"
              id="zona"
              type="select"
              value={formData.zona}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Herpès"
              id="herpes"
              type="select"
              value={formData.herpes}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Pelade"
              id="pelade"
              type="select"
              value={formData.pelade}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Réaction allergique"
              id="reactionAllergique"
              type="select"
              value={formData.reactionAllergique}
              onChange={handleChange}
              options={intensiteOptions}
            />
            
            <FormField
              label="Désensibilisation"
              id="desensibilisation"
              type="select"
              value={formData.desensibilisation}
              onChange={handleChange}
              options={ouiNonOptions}
            />
            
            <FormField
              label="Terrain atopique"
              id="terrainAtopique"
              type="select"
              value={formData.terrainAtopique}
              onChange={handleChange}
              options={ouiNonOptions}
            />
          </div>
        </CollapsibleSection>
        
        <CollapsibleSection title="Scores d'évaluation" color="teal">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-x-4 gap-y-6">
            <div className="col-span-4 border-b border-gray-200 pb-2 mb-2">
              <h3 className="font-medium text-gray-700">Scores minimums</h3>
            </div>
            
            <FormField
              label="Score POD Min"
              id="scorePodMin"
              type="select"
              value={formData.scorePodMin}
              onChange={handleChange}
              options={scoreOptions}
            />
            
            <FormField
              label="Score POG Min"
              id="scorePogMin"
              type="select"
              value={formData.scorePogMin}
              onChange={handleChange}
              options={scoreOptions}
            />
            
            <FormField
              label="Score Front Min"
              id="scoreFrontMin"
              type="select"
              value={formData.scoreFrontMin}
              onChange={handleChange}
              options={scoreOptions}
            />
            
            <FormField
              label="Score Lion Min"
              id="scoreLionMin"
              type="select"
              value={formData.scoreLionMin}
              onChange={handleChange}
              options={scoreOptions}
            />
            
            <FormField
              label="Score PPD Min"
              id="scorePpdMin"
              type="select"
              value={formData.scorePpdMin}
              onChange={handleChange}
              options={scoreOptions}
            />
            
            <FormField
              label="Score PPG Min"
              id="scorePpgMin"
              type="select"
              value={formData.scorePpgMin}
              onChange={handleChange}
              options={scoreOptions}
            />
            
            <FormField
              label="Score DOD Min"
              id="scoreDodMin"
              type="select"
              value={formData.scoreDodMin}
              onChange={handleChange}
              options={scoreOptions}
            />
            
            <FormField
              label="Score DOG Min"
              id="scoreDogMin"
              type="select"
              value={formData.scoreDogMin}
              onChange={handleChange}
              options={scoreOptions}
            />
            
            <FormField
              label="Score SNGD Min"
              id="scoreSngdMin"
              type="select"
              value={formData.scoreSngdMin}
              onChange={handleChange}
              options={scoreOptions}
            />
            
            <FormField
              label="Score SNGG Min"
              id="scoreSnggMin"
              type="select"
              value={formData.scoreSnggMin}
              onChange={handleChange}
              options={scoreOptions}
            />
            
            <FormField
              label="Score LEVSUP Min"
              id="scoreLevsupMin"
              type="select"
              value={formData.scoreLevsupMin}
              onChange={handleChange}
              options={scoreOptions}
            />
            
            <FormField
              label="Score COMLEVD Min"
              id="scoreComlevdMin"
              type="select"
              value={formData.scoreComlevdMin}
              onChange={handleChange}
              options={scoreOptions}
            />
            
            <FormField
              label="Score COMLEVG Min"
              id="scoreComlevgMin"
              type="select"
              value={formData.scoreComlevgMin}
              onChange={handleChange}
              options={scoreOptions}
            />
            
            <FormField
              label="Score Ptose Min"
              id="scorePtoseMin"
              type="select"
              value={formData.scorePtoseMin}
              onChange={handleChange}
              options={scoreOptions}
            />
            
            <div className="col-span-4 border-b border-gray-200 pb-2 mb-2 mt-4">
              <h3 className="font-medium text-gray-700">Scores maximums</h3>
            </div>
            
            <FormField
              label="Score POD Max"
              id="scorePodMax"
              type="select"
              value={formData.scorePodMax}
              onChange={handleChange}
              options={scoreOptions}
            />
            
            <FormField
              label="Score POG Max"
              id="scorePogMax"
              type="select"
              value={formData.scorePogMax}
              onChange={handleChange}
              options={scoreOptions}
            />
            
            <FormField
              label="Score Front Max"
              id="scoreFrontMax"
              type="select"
              value={formData.scoreFrontMax}
              onChange={handleChange}
              options={scoreOptions}
            />
            
            <FormField
              label="Score Lion Max"
              id="scoreLionMax"
              type="select"
              value={formData.scoreLionMax}
              onChange={handleChange}
              options={scoreOptions}
            />
            
            <FormField
              label="Score PPD Max"
              id="scorePpdMax"
              type="select"
              value={formData.scorePpdMax}
              onChange={handleChange}
              options={scoreOptions}
            />
            
            <FormField
              label="Score PPG Max"
              id="scorePpgMax"
              type="select"
              value={formData.scorePpgMax}
              onChange={handleChange}
              options={scoreOptions}
            />
            
            <FormField
              label="Score DOD Max"
              id="scoreDodMax"
              type="select"
              value={formData.scoreDodMax}
              onChange={handleChange}
              options={scoreOptions}
            />
            
            <FormField
              label="Score DOG Max"
              id="scoreDogMax"
              type="select"
              value={formData.scoreDogMax}
              onChange={handleChange}
              options={scoreOptions}
            />
            
            <FormField
              label="Score SNGD Max"
              id="scoreSngdMax"
              type="select"
              value={formData.scoreSngdMax}
              onChange={handleChange}
              options={scoreOptions}
            />
            
            <FormField
              label="Score SNGG Max"
              id="scoreSnggMax"
              type="select"
              value={formData.scoreSnggMax}
              onChange={handleChange}
              options={scoreOptions}
            />
            
            <FormField
              label="Score LEVSUP Max"
              id="scoreLevsupMax"
              type="select"
              value={formData.scoreLevsupMax}
              onChange={handleChange}
              options={scoreOptions}
            />
            
            <FormField
              label="Score COMLEVD Max"
              id="scoreComlevdMax"
              type="select"
              value={formData.scoreComlevdMax}
              onChange={handleChange}
              options={scoreOptions}
            />
            
            <FormField
              label="Score COMLEVG Max"
              id="scoreComlevgMax"
              type="select"
              value={formData.scoreComlevgMax}
              onChange={handleChange}
              options={scoreOptions}
            />
            
            <FormField
              label="Score Ptose Max"
              id="scorePtoseMax"
              type="select"
              value={formData.scorePtoseMax}
              onChange={handleChange}
              options={scoreOptions}
            />
          </div>
        </CollapsibleSection>
        
        <CollapsibleSection title="Mappings" color="indigo">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <FormField
              label="Map yeux"
              id="mapyeux"
              type="textarea"
              value={formData.mapyeux}
              onChange={handleChange}
              placeholder="Description de la mapping des yeux..."
            />
            
            <FormField
              label="Map lèvres"
              id="maplevres"
              type="textarea"
              value={formData.maplevres}
              onChange={handleChange}
              placeholder="Description de la mapping des lèvres..."
            />
            
            <FormField
              label="Map sourcils"
              id="mapsourcils"
              type="textarea"
              value={formData.mapsourcils}
              onChange={handleChange}
              placeholder="Description de la mapping des sourcils..."
            />
            
            <FormField
              label="Commentaires"
              id="commentaires"
              type="textarea"
              value={formData.commentaires}
              onChange={handleChange}
              placeholder="Ajoutez des commentaires ou des notes spécifiques..."
            />
          </div>
        </CollapsibleSection>
        
        <div className="mt-8 flex justify-end space-x-3">
          <Link
            to={isEditMode ? `/panels/${idPanel}` : '/panels'}
            className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Annuler
          </Link>
          
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enregistrement...
              </>
            ) : (
              <>
                <IconSave width={16} height={16} className="mr-2" />
                {isEditMode ? 'Mettre à jour' : 'Enregistrer'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PanelForm;