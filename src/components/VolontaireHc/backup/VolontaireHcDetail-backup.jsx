import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';

// Import des icônes
import userSvg from '../../assets/icons/user.svg';
import editSvg from '../../assets/icons/edit.svg';
import trashSvg from '../../assets/icons/trash.svg';
import arrowLeftSvg from '../../assets/icons/arrow-left.svg';
import shoppingBagSvg from '../../assets/icons/shopping-bag.svg';
import brushSvg from '../../assets/icons/brush.svg';
import dropletSvg from '../../assets/icons/droplet.svg';
import scissorsSvg from '../../assets/icons/scissors.svg';
import mapPinSvg from '../../assets/icons/map-pin.svg';
import mailSvg from '../../assets/icons/mail.svg';
import phoneSvg from '../../assets/icons/phone.svg';
import userCircleSvg from '../../assets/icons/user-circle.svg';
import tagSvg from '../../assets/icons/tag.svg';
import leafSvg from '../../assets/icons/leaf.svg';

// Composants d'icônes
const IconUser = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={userSvg} width={width} height={height} className={className} alt="User" {...props} />
);

const IconEdit = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={editSvg} width={width} height={height} className={className} alt="Edit" {...props} />
);

const IconTrash = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={trashSvg} width={width} height={height} className={className} alt="Trash" {...props} />
);

const IconArrowLeft = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={arrowLeftSvg} width={width} height={height} className={className} alt="Arrow Left" {...props} />
);

const IconShoppingBag = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={shoppingBagSvg} width={width} height={height} className={className} alt="Shopping Bag" {...props} />
);

const IconBrush = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={brushSvg} width={width} height={height} className={className} alt="Brush" {...props} />
);

const IconDroplet = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={dropletSvg} width={width} height={height} className={className} alt="Droplet" {...props} />
);

const IconScissors = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={scissorsSvg} width={width} height={height} className={className} alt="Scissors" {...props} />
);

const IconMapPin = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={mapPinSvg} width={width} height={height} className={className} alt="Map Pin" {...props} />
);

const IconMail = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={mailSvg} width={width} height={height} className={className} alt="Mail" {...props} />
);

const IconPhone = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={phoneSvg} width={width} height={height} className={className} alt="Phone" {...props} />
);

const IconUserCircle = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={userCircleSvg} width={width} height={height} className={className} alt="User Circle" {...props} />
);

const IconTag = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={tagSvg} width={width} height={height} className={className} alt="Tag" {...props} />
);

const IconLeaf = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={leafSvg} width={width} height={height} className={className} alt="Leaf" {...props} />
);

// Composant DetailItem qui affiche une paire clé-valeur avec une icône
const DetailItem = ({ icon, label, value, className = "" }) => {
  return (
    <div className={`flex items-start mb-4 ${className}`}>
      <div className="w-10 h-10 flex-shrink-0 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-3">
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-medium text-gray-500">{label}</h4>
        <div className="text-gray-800 mt-1">{value || "-"}</div>
      </div>
    </div>
  );
};

// Composant pour afficher les valeurs checkbox (Oui/Non)
const CheckboxValue = ({ value }) => {
  const isChecked = value === 'oui';
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${isChecked ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
      {isChecked ? 'oui' : 'non'}
    </span>
  );
};

// Composant pour afficher une section de catégorie pour les habitudes cosmétiques
const CategorySection = ({ title, icon, items }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
      <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
        {icon && <span className="mr-2">{icon}</span>}
        {title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-gray-700">{item.label}</span>
            {item.isCheckbox ? (
              <CheckboxValue value={item.value} />
            ) : (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                {item.value || "-"}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Composant principal d'affichage des détails d'un volontaire HC
const VolontaireHcDetail = () => {
  const { idVol: idVolStr } = useParams();
  const idVol = idVolStr ? parseInt(idVolStr, 10) : undefined;
  const navigate = useNavigate();
  const location = useLocation();
  const [volontaireHc, setvolontaireHc] = useState(null);
  const [volontaire, setvolontaire] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchvolontaireHcDetails = async () => {
      try {
        setLoading(true);

        // D'abord, récupérer les données du volontaire standard
        let volontaireData = null;
        try {
          // Nous utilisons l'ID du volontaire directement, car il correspond à idVol dans le contexte actuel
          const responseVolontaire = await api.get(`/volontaires/${idVol}`);
          if (responseVolontaire.data) {
            volontaireData = responseVolontaire.data;
            setvolontaire(responseVolontaire.data);
          }
        } catch (volErr) {
          console.error('Erreur lors du chargement des informations du volontaire:', volErr);
          setError('Impossible de charger les informations du volontaire.');
          setLoading(false);
          return;
        }

        // Si nous avons pu charger le volontaire, essayons maintenant les habitudes cosmétiques
        if (volontaireData) {
          try {
            const responseHc = await api.get(`/volontaires-hc/volontaire/${idVol}`);
            setvolontaireHc(responseHc.data);
            setError(null);
          } catch (hcErr) {
            console.error('Erreur lors du chargement des détails du volontaire HC:', hcErr);

            // Vérifier si l'erreur est une 404 ou contient le message "non trouvées"
            if (
              (hcErr.response?.status === 404) ||
              (hcErr.response?.data?.details && hcErr.response.data.details.includes("non trouvées"))
            ) {
              // Il s'agit d'une absence de données HC, pas d'une vraie erreur
              setError('no_hc_data');
            } else {
              // C'est une autre erreur, affichons un message générique
              setError('Une erreur est survenue lors du chargement des habitudes cosmétiques.');
            }

            setvolontaireHc(null);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchvolontaireHcDetails();
  }, [idVol]);

  const handleDeletevolontaireHc = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ces habitudes cosmétiques ? Cette action est irréversible.')) {
      return;
    }

    try {
      await api.delete(`/volontaire-hc/${idVol}`);
      // Rediriger vers la liste des volontaires HC après suppression
      navigate('/volontaires-hc');
      // Afficher une notification de succès
      alert('Habitudes cosmétiques supprimées avec succès');
    } catch (err) {
      console.error('Erreur lors de la suppression du volontaire HC:', err);
      alert('Erreur lors de la suppression du volontaire HC');
    }
  };

  // Fonction pour renvoyer la classe CSS correspondant au phototype
  const getPhototypeColorClass = (phototype) => {
    switch (phototype) {
      case 'I': return 'bg-rose-50 text-rose-700';
      case 'II': return 'bg-orange-50 text-orange-700';
      case 'III': return 'bg-amber-50 text-amber-700';
      case 'IV': return 'bg-yellow-50 text-yellow-700';
      case 'V': return 'bg-lime-50 text-lime-700';
      case 'VI': return 'bg-emerald-50 text-emerald-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  // Génération des initiales pour l'avatar
  const getInitials = (nom, prenom) => {
    if (!nom || !prenom) return '';
    return `${nom[0]}${prenom[0]}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!volontaire) {
    return (
      <div className="bg-red-100 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-red-800 mb-2">Erreur</h2>
        <p className="text-red-700">{error || "Volontaire non trouvé"}</p>
        <button
          onClick={() => navigate('/volontaires-hc')}
          className="mt-4 flex items-center text-blue-600 hover:text-blue-800"
        >
          <IconArrowLeft width={16} height={16} className="mr-1" />
          Retour à la liste
        </button>
      </div>
    );
  }

  if (error === 'no_hc_data') {
    return (
      <div className="space-y-6">
        {/* Switch pour basculer entre volontaires et volontaires HC */}
        <div className="mb-6">
          <div className="inline-flex bg-gray-100 rounded-lg p-1">
            <Link
              to="/volontaires"
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${location.pathname.includes('/volontaires') && !location.pathname.includes('/volontaires-hc')
                  ? 'bg-white shadow-sm text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              Volontaires
            </Link>
            <Link
              to="/volontaires-hc"
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${location.pathname.includes('/volontaires-hc')
                  ? 'bg-white shadow-sm text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              Habitudes Cosmétiques
            </Link>
          </div>
        </div>

        {/* En-tête avec informations principales et actions */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => navigate('/volontaires-hc')}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <IconArrowLeft width={16} height={16} className="mr-1" />
            Retour à la liste
          </button>
        </div>

        {/* Section profil du volontaire associé */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center">
              <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xl font-bold mr-4">
                {getInitials(volontaire.nom, volontaire.prenom)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {volontaire.nom} {volontaire.prenom}
                </h1>
                <p className="mt-1 text-gray-600">
                  ID: {volontaire.idVol} • {volontaire.sexe}, {volontaire.age} ans
                </p>
                <div className="mt-2 flex space-x-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPhototypeColorClass(volontaire.phototype)}`}>
                    Phototype {volontaire.phototype}
                  </span>
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                    {volontaire.typePeauVisage}
                  </span>
                  {volontaire.carnation && (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                      {volontaire.carnation}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Message et bouton pour ajouter des habitudes cosmétiques */}
        <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-lg shadow-md">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h2 className="text-lg font-medium text-amber-800 mb-2">Aucune habitude cosmétique enregistrée</h2>
              <p className="text-amber-700 mb-4">
                Ce volontaire n'a pas encore d'habitudes cosmétiques enregistrées. Vous pouvez les ajouter en cliquant sur le bouton ci-dessous.
              </p>
              <Link
                to={`/volontaires-hc/${idVol}/edit`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <IconEdit width={16} height={16} className="mr-2" />
                Ajouter des habitudes cosmétiques
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !volontaireHc) {
    return (
      <div className="bg-red-100 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-red-800 mb-2">Erreur</h2>
        <p className="text-red-700">{error || "Habitudes cosmétiques non trouvées"}</p>
        <button
          onClick={() => navigate('/volontaires-hc')}
          className="mt-4 flex items-center text-blue-600 hover:text-blue-800"
        >
          <IconArrowLeft width={16} height={16} className="mr-1" />
          Retour à la liste
        </button>
      </div>
    );
  }

  // Organiser les données par catégories
  const habitudesAchat = [
    { label: "Pharmacie/Parapharmacie", value: volontaireHc.achatPharmacieParapharmacie, isCheckbox: true },
    { label: "Grandes surfaces", value: volontaireHc.achatGrandesSurfaces, isCheckbox: true },
    { label: "Institut/Parfumerie", value: volontaireHc.achatInstitutParfumerie, isCheckbox: true },
    { label: "Internet", value: volontaireHc.achatInternet, isCheckbox: true },
    { label: "Produits bio", value: volontaireHc.produitsBio, isCheckbox: false }
  ];

  const methodesEpilation = [
    { label: "Rasoir", value: volontaireHc.rasoir },
    { label: "Épilateur électrique", value: volontaireHc.epilateurElectrique },
    { label: "Cire", value: volontaireHc.cire },
    { label: "Crème dépilatoire", value: volontaireHc.cremeDepilatoire },
    { label: "Institut", value: volontaireHc.institut },
    { label: "Épilation définitive", value: volontaireHc.epilationDefinitive }
  ];

  const soinsVisage = [
    { label: "Soin hydratant", value: volontaireHc.soinHydratantVisage },
    { label: "Soin nourrissant", value: volontaireHc.soinNourissantVisage },
    { label: "Soin matifiant", value: volontaireHc.soinMatifiantVisage },
    { label: "Soin anti-âge", value: volontaireHc.soinAntiAgeVisage },
    { label: "Soin anti-rides", value: volontaireHc.soinAntiRidesVisage },
    { label: "Soin anti-taches", value: volontaireHc.soinAntiTachesVisage },
    { label: "Soin anti-rougeurs", value: volontaireHc.soinAntiRougeursVisage },
    { label: "Soin éclat du teint", value: volontaireHc.soinEclatDuTeint },
    { label: "Soin raffermissant", value: volontaireHc.soinRaffermissantVisage },
    { label: "Contour des yeux", value: volontaireHc.soinContourDesYeux },
    { label: "Contour des lèvres", value: volontaireHc.soinContourDesLevres },
    { label: "Masque", value: volontaireHc.masqueVisage },
    { label: "Gommage", value: volontaireHc.gommageVisage }
  ];

  const demaquillage = [
    { label: "Démaquillant visage", value: volontaireHc.demaquillantVisage },
    { label: "Démaquillant yeux", value: volontaireHc.demaquillantYeux },
    { label: "Démaquillant waterproof", value: volontaireHc.demaquillantWaterproof },
    { label: "Gel nettoyant", value: volontaireHc.gelNettoyant },
    { label: "Lotion micellaire", value: volontaireHc.lotionMicellaire },
    { label: "Tonique", value: volontaireHc.tonique }
  ];

  const soinsCorps = [
    { label: "Soin hydratant", value: volontaireHc.soinHydratantCorps },
    { label: "Soin nourrissant", value: volontaireHc.soinNourrissantCorps },
    { label: "Soin raffermissant", value: volontaireHc.soinRaffermissantCorps },
    { label: "Soin amincissant", value: volontaireHc.soinAmincissant },
    { label: "Anti-cellulite", value: volontaireHc.soinAntiCellulite },
    { label: "Anti-vergetures", value: volontaireHc.soinAntiVergetures },
    { label: "Soin anti-âge corps", value: volontaireHc.soinAntiAgeCorps },
    { label: "Gommage", value: volontaireHc.gommageCorps },
    { label: "Masque", value: volontaireHc.masqueCorps }
  ];

  const soinsSpecifiques = [
    { label: "Soin des mains hydratant", value: volontaireHc.soinHydratantMains },
    { label: "Soin des mains nourrissant", value: volontaireHc.soinNourrissantMains },
    { label: "Soin des mains anti-âge", value: volontaireHc.soinAntiAgeMains },
    { label: "Soin des mains anti-taches", value: volontaireHc.soinAntiTachesMains },
    { label: "Soin des pieds", value: volontaireHc.soinPieds },
    { label: "Soin des ongles", value: volontaireHc.soinOngles }
  ];

  const produitsHygiene = [
    { label: "Gel douche", value: volontaireHc.gelDouche },
    { label: "Lait douche", value: volontaireHc.laitDouche },
    { label: "Savon", value: volontaireHc.savon },
    { label: "Produits pour le bain", value: volontaireHc.produitsBain },
    { label: "Nettoyant intime", value: volontaireHc.nettoyantIntime },
    { label: "Déodorant", value: volontaireHc.deodorant },
    { label: "Anti-transpirant", value: volontaireHc.antiTranspirant }
  ];

  const soinsCapillaires = [
    { label: "Shampooing", value: volontaireHc.shampoing },
    { label: "Après-shampooing", value: volontaireHc.apresShampoing },
    { label: "Masque capillaire", value: volontaireHc.masqueCapillaire },
    { label: "Produit coiffant/fixant", value: volontaireHc.produitCoiffantFixant },
    { label: "Coloration/Mèches", value: volontaireHc.colorationMeches },
    { label: "Permanente", value: volontaireHc.permanente },
    { label: "Lissage/Défrisage", value: volontaireHc.lissageDefrisage },
    { label: "Extensions capillaires", value: volontaireHc.extensionsCapillaires }
  ];

  const maquillageVisage = [
    { label: "Fond de teint", value: volontaireHc.fondDeTeint },
    { label: "Poudre libre", value: volontaireHc.poudreLibre },
    { label: "Blush/Fard à joues", value: volontaireHc.blushFardAJoues },
    { label: "Correcteur de teint", value: volontaireHc.correcteurTeint },
    { label: "Anti-cerne", value: volontaireHc.anticerne },
    { label: "Base de maquillage", value: volontaireHc.baseMaquillage },
    { label: "Crème teintée", value: volontaireHc.cremeTeintee }
  ];

  const maquillageYeux = [
    { label: "Mascara", value: volontaireHc.mascara },
    { label: "Mascara waterproof", value: volontaireHc.mascaraWaterproof },
    { label: "Crayons à yeux", value: volontaireHc.crayonsYeux },
    { label: "Eyeliner", value: volontaireHc.eyeliner },
    { label: "Fard à paupières", value: volontaireHc.fardAPaupieres },
    { label: "Maquillage des sourcils", value: volontaireHc.maquillageDesSourcils },
    { label: "Faux cils", value: volontaireHc.fauxCils }
  ];

  const maquillageLevresOngles = [
    { label: "Rouge à lèvres", value: volontaireHc.rougeALevres },
    { label: "Gloss", value: volontaireHc.gloss },
    { label: "Crayon à lèvres", value: volontaireHc.crayonLevres },
    { label: "Vernis à ongles", value: volontaireHc.vernisAOngles },
    { label: "Dissolvant", value: volontaireHc.dissolvantOngles },
    { label: "Faux ongles", value: volontaireHc.fauxOngles },
    { label: "Manucures", value: volontaireHc.manucures }
  ];

  const maquillagePermanent = [
    { label: "Maquillage permanent des yeux", value: volontaireHc.maquillagePermanentYeux },
    { label: "Maquillage permanent des lèvres", value: volontaireHc.maquillagePermanentLevres },
    { label: "Maquillage permanent des sourcils", value: volontaireHc.maquillagePermanentSourcils }
  ];

  const produitsSolaires = [
    { label: "Protecteur solaire visage", value: volontaireHc.protecteurSolaireVisage },
    { label: "Protecteur solaire corps", value: volontaireHc.protecteurSolaireCorps },
    { label: "Protecteur solaire lèvres", value: volontaireHc.protecteurSolaireLevres },
    { label: "Soin après-soleil", value: volontaireHc.soinApresSoleil },
    { label: "Autobronzant", value: volontaireHc.autobronzant }
  ];

  const parfums = [
    { label: "Parfum", value: volontaireHc.parfum },
    { label: "Eau de toilette", value: volontaireHc.eauDeToilette }
  ];

  return (
    <div className="space-y-6">
      {/* Switch pour basculer entre volontaires et volontaires HC */}
      <div className="mb-6">
        <div className="inline-flex bg-gray-100 rounded-lg p-1">
          <Link
            to="/volontaires"
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${location.pathname.includes('/volontaires') && !location.pathname.includes('/volontaires-hc')
              ? 'bg-white shadow-sm text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
              }`}
          >
            volontaires
          </Link>
          <Link
            to="/volontaires-hc"
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${location.pathname.includes('/volontaires-hc')
              ? 'bg-white shadow-sm text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
              }`}
          >
            Habitudes Cosmétiques
          </Link>
        </div>
      </div>

      {/* En-tête avec informations principales et actions */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => navigate('/volontaires-hc')}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <IconArrowLeft width={16} height={16} className="mr-1" />
          Retour à la liste
        </button>

        <div className="flex space-x-3">
          <Link
            to={`/volontaires-hc/${idVol}/edit`}
            className="flex items-center px-4 py-2 border border-gray-300 bg-white rounded-md hover:bg-gray-50 text-gray-700"
          >
            <IconEdit width={16} height={16} className="mr-2" />
            Modifier
          </Link>
          <button
            onClick={handleDeletevolontaireHc}
            className="flex items-center px-4 py-2 border border-red-300 bg-white rounded-md hover:bg-red-50 text-red-700"
          >
            <IconTrash width={16} height={16} className="mr-2" />
            Supprimer
          </button>
        </div>
      </div>

      {/* Section profil du volontaire associé */}
      {volontaire && (
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center">
              <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xl font-bold mr-4">
                {getInitials(volontaire.nom, volontaire.prenom)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {volontaire.nom} {volontaire.prenom}
                </h1>
                <p className="mt-1 text-gray-600">
                  ID: {volontaire.idVol} • {volontaire.sexe}, {volontaire.age} ans
                </p>
                <div className="mt-2 flex space-x-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPhototypeColorClass(volontaire.phototype)}`}>
                    Phototype {volontaire.phototype}
                  </span>
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                    {volontaire.typePeauVisage}
                  </span>
                  {volontaire.carnation && (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                      {volontaire.carnation}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sections d'habitudes cosmétiques */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6 pb-2 border-b border-gray-200">
          Habitudes Cosmétiques
        </h2>

        <CategorySection
          title="Habitudes d'achat"
          icon={<IconShoppingBag className="text-blue-600" width={20} height={20} />}
          items={habitudesAchat}
        />

        <CategorySection
          title="Méthodes d'épilation"
          icon={<IconScissors className="text-purple-600" width={20} height={20} />}
          items={methodesEpilation}
        />

        <CategorySection
          title="Soins du visage"
          icon={<IconDroplet className="text-blue-600" width={20} height={20} />}
          items={soinsVisage}
        />

        <CategorySection
          title="Démaquillage et nettoyage"
          icon={<IconDroplet className="text-blue-600" width={20} height={20} />}
          items={demaquillage}
        />

        <CategorySection
          title="Soins du corps"
          icon={<IconDroplet className="text-green-600" width={20} height={20} />}
          items={soinsCorps}
        />

        <CategorySection
          title="Soins spécifiques (mains, pieds, ongles)"
          icon={<IconDroplet className="text-teal-600" width={20} height={20} />}
          items={soinsSpecifiques}
        />

        <CategorySection
          title="Produits d'hygiène"
          icon={<IconDroplet className="text-indigo-600" width={20} height={20} />}
          items={produitsHygiene}
        />

        <CategorySection
          title="Soins capillaires"
          icon={<IconDroplet className="text-amber-600" width={20} height={20} />}
          items={soinsCapillaires}
        />

        <CategorySection
          title="Maquillage du visage"
          icon={<IconBrush className="text-rose-600" width={20} height={20} />}
          items={maquillageVisage}
        />

        <CategorySection
          title="Maquillage des yeux"
          icon={<IconBrush className="text-violet-600" width={20} height={20} />}
          items={maquillageYeux}
        />

        <CategorySection
          title="Maquillage des lèvres et ongles"
          icon={<IconBrush className="text-pink-600" width={20} height={20} />}
          items={maquillageLevresOngles}
        />

        <CategorySection
          title="Maquillage permanent"
          icon={<IconBrush className="text-red-600" width={20} height={20} />}
          items={maquillagePermanent}
        />

        <CategorySection
          title="Produits solaires"
          icon={<IconDroplet className="text-yellow-600" width={20} height={20} />}
          items={produitsSolaires}
        />

        <CategorySection
          title="Parfums"
          icon={<IconDroplet className="text-purple-600" width={20} height={20} />}
          items={parfums}
        />

        {/* Commentaires */}
        {volontaireHc.commentaires && (
          <div className="bg-white p-4 rounded-lg mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-3">Commentaires</h3>
            <div className="p-4 bg-gray-50 rounded-md text-gray-700 whitespace-pre-line">
              {volontaireHc.commentaires}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VolontaireHcDetail;