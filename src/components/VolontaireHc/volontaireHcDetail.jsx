import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';

// Import des icônes
import arrowLeftSvg from '../../assets/icons/arrow-left.svg';
import userSvg from '../../assets/icons/user.svg';
import editSvg from '../../assets/icons/edit.svg';
import trashSvg from '../../assets/icons/trash.svg';
import shoppingBagSvg from '../../assets/icons/shopping-bag.svg';
import brushSvg from '../../assets/icons/brush.svg';
import dropletSvg from '../../assets/icons/droplet.svg';
import scissorsSvg from '../../assets/icons/scissors.svg';
import alertCircleSvg from '../../assets/icons/alert-circle.svg';
import printSvg from '../../assets/icons/printer.svg';
import plusSvg from '../../assets/icons/plus.svg';

// Import de la configuration du formulaire pour réutiliser les sections
import { FORM_SECTIONS } from './formConfig';
import { initializeFormDataWithNon, normalizeFormData } from './initializers';

// Composants d'icônes
const IconArrowLeft = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={arrowLeftSvg} width={width} height={height} className={className} alt="Arrow Left" {...props} />
);

const IconUser = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={userSvg} width={width} height={height} className={className} alt="User" {...props} />
);

const IconEdit = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={editSvg} width={width} height={height} className={className} alt="Edit" {...props} />
);

const IconTrash = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={trashSvg} width={width} height={height} className={className} alt="Trash" {...props} />
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

const IconAlertCircle = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={alertCircleSvg} width={width} height={height} className={className} alt="Alert Circle" {...props} />
);

const IconPrint = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={printSvg} width={width} height={height} className={className} alt="Print" {...props} />
);

const IconPlus = ({ className = "", width = 24, height = 24, ...props }) => (
  <img src={plusSvg} width={width} height={height} className={className} alt="Plus" {...props} />
);

// Composant pour afficher une section d'informations
const DetailSection = ({ title, icon, children }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="mb-6 bg-white rounded-lg shadow overflow-hidden">
      <button
        type="button"
        className="w-full flex justify-between items-center text-left text-lg font-medium text-gray-800 bg-gray-50 px-6 py-3 focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center">
          {icon}
          <span className="ml-2">{title}</span>
        </div>
        <svg className={`h-5 w-5 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {isOpen && (
        <div className="p-6">
          {children}
        </div>
      )}
    </div>
  );
};

// Composant pour afficher un groupe d'éléments
const DetailGroup = ({ title, items }) => (
  <div className="mb-4">
    {title && <h3 className="text-sm font-medium text-gray-700 mb-2">{title}</h3>}
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2">
      {items.map((item) => (
        <div key={item.id} className="flex items-center">
          <div className={`h-3 w-3 rounded-full mr-2 ${item.value === 'oui' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
          <span className="text-sm">{item.label}</span>
        </div>
      ))}
    </div>
  </div>
);

// Fonction utilitaire pour obtenir l'icône correcte
const getIconComponent = (iconName) => {
  switch (iconName) {
    case 'shopping-bag':
      return <IconShoppingBag width={20} height={20} className="text-blue-600" />;
    case 'scissors':
      return <IconScissors width={20} height={20} className="text-blue-600" />;
    case 'droplet':
      return <IconDroplet width={20} height={20} className="text-blue-600" />;
    case 'brush':
      return <IconBrush width={20} height={20} className="text-blue-600" />;
    case 'user':
      return <IconUser width={20} height={20} className="text-blue-600" />;
    default:
      return <IconDroplet width={20} height={20} className="text-blue-600" />;
  }
};

// Composant principal VolontaireHcDetail
const VolontaireHcDetail = () => {
  const { idVol } = useParams();
  const navigate = useNavigate();
  const [volontaireHc, setVolontaireHc] = useState(null);
  const [volontaireInfo, setVolontaireInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [dataFetchError, setDataFetchError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setDataFetchError(false);

        // Convertir idVol en nombre pour s'assurer que l'API reçoit le bon type
        const numericId = parseInt(idVol, 10);

        if (isNaN(numericId)) {
          throw new Error("ID du volontaire invalide");
        }

        // Récupérer les informations du volontaire d'abord
        let volInfo = null;
        try {
          const volResponse = await api.get(`/volontaires/${numericId}`);
          if (volResponse.data) {
            volInfo = volResponse.data;
            setVolontaireInfo(volResponse.data);
          }
        } catch (volErr) {
          console.error('Erreur lors de la récupération des informations du volontaire:', volErr);
          throw new Error("Impossible de trouver le volontaire");
        }

        // Si on a réussi à récupérer les infos du volontaire, créer une entrée vide si elle n'existe pas
        if (volInfo) {
          try {
            // Tentative de récupération des données existantes
            const hcResponse = await api.get(`/volontaires-hc/volontaire/${numericId}`);

            if (hcResponse.data) {
              const hcData = hcResponse.data;

              // Vérifier si idVol est null, si oui, l'assigner explicitement
              if (hcData.idVol === null) {
                hcData.idVol = numericId;
              }

              // Initialiser avec les valeurs par défaut pour s'assurer qu'aucune propriété ne manque
              const initialData = initializeFormDataWithNon(numericId);

              // Fusionner les données de l'API avec nos valeurs par défaut
              const mergedData = { ...initialData, ...hcData };
              
              // Normaliser les données pour garantir la cohérence d'affichage
              const normalizedData = normalizeFormData(mergedData);

              setVolontaireHc(normalizedData);
              setNotFound(false);
            }
          } catch (hcErr) {
            console.error('Erreur lors du chargement des habitudes cosmétiques:', hcErr);
            
            // Si l'erreur est 404, on indique que les habitudes cosmétiques n'existent pas
            if (hcErr.response && hcErr.response.status === 404) {
              setNotFound(true);
              console.log("Aucune habitude cosmétique trouvée, initialisation avec données par défaut");
              
              // Créer un objet de données initial vide (toutes les valeurs à "non")
              const initialData = initializeFormDataWithNon(numericId);
              setVolontaireHc(initialData);

              // Option: créer automatiquement une entrée vide pour ce volontaire
              try {
                // Pour éviter l'erreur 404 à l'avenir, on pourrait créer une entrée vide
                // Mais cette approche n'est pas mise en œuvre ici pour éviter de modifier la DB sans action explicite
                // await api.post('/volontaires-hc', initialData);
                // console.log("Entrée vide créée automatiquement");
              } catch (createErr) {
                console.error("Erreur lors de la création d'une entrée vide:", createErr);
              }
            } else {
              // Pour d'autres erreurs, on note simplement l'erreur mais on continue
              setDataFetchError(true);
              setError("Erreur lors du chargement des habitudes cosmétiques.");
              
              // Créer un objet de données initial vide comme fallback
              const initialData = initializeFormDataWithNon(numericId);
              setVolontaireHc(initialData);
            }
          }
        }
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
        setError("Impossible de charger les données. Veuillez réessayer.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [idVol]);

  const handlePrint = () => {
    window.print();
  };

  // Fonction pour créer une entrée vide si elle n'existe pas
  const handleCreateEmptyEntry = async () => {
    try {
      setLoading(true);
      const numericId = parseInt(idVol, 10);
      
      if (isNaN(numericId)) {
        throw new Error("ID du volontaire invalide");
      }
      
      // Créer l'objet avec des données initiales (tout à "non")
      const initialData = initializeFormDataWithNon(numericId);
      
      // Envoyer la requête de création
      await api.post('/volontaires-hc', initialData);
      
      // Recharger la page
      navigate(0);
    } catch (err) {
      console.error('Erreur lors de la création d\'une entrée vide:', err);
      setError("Erreur lors de la création des habitudes cosmétiques.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const numericId = parseInt(idVol, 10);
      if (isNaN(numericId)) {
        throw new Error("ID du volontaire invalide");
      }

      await api.delete(`/volontaires-hc/volontaire/${numericId}`);
      navigate('/volontaires-hc');
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setError("Erreur lors de la suppression des habitudes cosmétiques.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !volontaireHc) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex items-center">
            <IconAlertCircle width={20} height={20} className="text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
        <div className="mt-4">
          <Link to="/volontaires-hc" className="text-blue-600 hover:text-blue-800 flex items-center">
            <IconArrowLeft width={16} height={16} className="mr-1" />
            Retour à la liste
          </Link>
        </div>
      </div>
    );
  }

  // Si les habitudes cosmétiques n'ont pas été trouvées mais que le volontaire existe
  if (notFound && volontaireInfo) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <div className="flex items-center mb-4 sm:mb-0">
            <Link to="/volontaires-hc" className="text-blue-600 hover:text-blue-800 flex items-center mr-4">
              <IconArrowLeft width={16} height={16} className="mr-1" />
              Retour
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">Habitudes cosmétiques</h1>
          </div>
        </div>

        <DetailSection
          title="Informations du volontaire"
          icon={<IconUser width={20} height={20} className="text-blue-600" />}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0 h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-4">
              <IconUser width={24} height={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{volontaireInfo.nom} {volontaireInfo.prenom}</h2>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <p><span className="font-medium">ID:</span> {idVol}</p>
                <p><span className="font-medium">Sexe:</span> {volontaireInfo.sexe}</p>
                <p><span className="font-medium">Âge:</span> {volontaireInfo.age} ans</p>
                {volontaireInfo.phototype && (
                  <p><span className="font-medium">Phototype:</span> {volontaireInfo.phototype}</p>
                )}
                {volontaireInfo.email && (
                  <p><span className="font-medium">Email:</span> {volontaireInfo.email}</p>
                )}
                {volontaireInfo.telephone && (
                  <p><span className="font-medium">Téléphone:</span> {volontaireInfo.telephone}</p>
                )}
              </div>
            </div>
          </div>
        </DetailSection>

        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-lg my-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <IconAlertCircle width={24} height={24} className="text-yellow-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-yellow-800">Aucune habitude cosmétique trouvée</h3>
              <p className="mt-2 text-yellow-700">
                Ce volontaire n'a pas encore d'habitudes cosmétiques enregistrées. Vous pouvez en créer en cliquant sur l'un des boutons ci-dessous.
              </p>
              <div className="mt-4 flex flex-wrap gap-4">
                <Link
                  to={`/volontaires-hc/nouveau?idVol=${idVol}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <IconPlus width={20} height={20} className="mr-2" />
                  Créer et définir les habitudes cosmétiques
                </Link>
                
                <button
                  onClick={handleCreateEmptyEntry}
                  className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <IconPlus width={20} height={20} className="mr-2" />
                  Initialiser une entrée vide
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!volontaireHc) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-md">
          <p className="text-yellow-700">Aucune habitude cosmétique trouvée pour ce volontaire.</p>
        </div>
        <div className="mt-4">
          <Link to="/volontaires-hc" className="text-blue-600 hover:text-blue-800 flex items-center">
            <IconArrowLeft width={16} height={16} className="mr-1" />
            Retour à la liste
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* En-tête avec actions */}
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center">
        <div className="flex items-center mb-4 sm:mb-0">
          <Link to="/volontaires-hc" className="text-blue-600 hover:text-blue-800 flex items-center mr-4">
            <IconArrowLeft width={16} height={16} className="mr-1" />
            Retour
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Habitudes cosmétiques</h1>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handlePrint}
            className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            <IconPrint width={16} height={16} className="mr-2" />
            Imprimer
          </button>
          <Link
            to={`/volontaires-hc/${idVol}/edit`}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <IconEdit width={16} height={16} className="mr-2" />
            Modifier
          </Link>
          <button
            onClick={() => setDeleteConfirmOpen(true)}
            className="flex items-center px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
          >
            <IconTrash width={16} height={16} className="mr-2" />
            Supprimer
          </button>
        </div>
      </div>

      {/* Affichage de message d'erreur s'il y en a un */}
      {dataFetchError && (
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-md">
          <div className="flex items-center">
            <IconAlertCircle width={20} height={20} className="text-yellow-500 mr-2" />
            <p className="text-yellow-700">
              Des erreurs ont été rencontrées lors du chargement des données. Certaines informations peuvent ne pas être à jour.
            </p>
          </div>
        </div>
      )}

      {/* Informations du volontaire */}
      <DetailSection
        title="Informations du volontaire"
        icon={<IconUser width={20} height={20} className="text-blue-600" />}
      >
        {volontaireInfo ? (
          <div className="flex items-start">
            <div className="flex-shrink-0 h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-4">
              <IconUser width={24} height={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{volontaireInfo.nom} {volontaireInfo.prenom}</h2>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <p><span className="font-medium">ID:</span> {idVol}</p>
                <p><span className="font-medium">Sexe:</span> {volontaireInfo.sexe}</p>
                <p><span className="font-medium">Âge:</span> {volontaireInfo.age} ans</p>
                {volontaireInfo.phototype && (
                  <p><span className="font-medium">Phototype:</span> {volontaireInfo.phototype}</p>
                )}
                {volontaireInfo.email && (
                  <p><span className="font-medium">Email:</span> {volontaireInfo.email}</p>
                )}
                {volontaireInfo.telephone && (
                  <p><span className="font-medium">Téléphone:</span> {volontaireInfo.telephone}</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">Informations du volontaire non disponibles</p>
        )}
      </DetailSection>

      {/* Affichage dynamique des sections d'habitudes cosmétiques */}
      {FORM_SECTIONS.map((section) => (
        <DetailSection
          key={section.title}
          title={section.title}
          icon={getIconComponent(section.icon)}
        >
          {section.groups.map((group, groupIndex) => (
            <DetailGroup
              key={`${section.title}-group-${groupIndex}`}
              title={group.title}
              items={group.items.map(item => ({
                id: item.id,
                label: item.label,
                value: volontaireHc[item.id] || 'non'
              }))}
            />
          ))}
        </DetailSection>
      ))}

      {/* Section commentaires */}
      {volontaireHc.commentaires && (
        <DetailSection
          title="Commentaires"
          icon={<IconDroplet width={20} height={20} className="text-blue-600" />}
        >
          <div className="p-4 bg-gray-50 rounded-md">
            <p className="text-sm whitespace-pre-line">{volontaireHc.commentaires}</p>
          </div>
        </DetailSection>
      )}

      {/* Boîte de dialogue de confirmation de suppression */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirmation de suppression</h3>
            <p className="text-gray-700 mb-6">
              Êtes-vous sûr de vouloir supprimer les habitudes cosmétiques de ce volontaire ? Cette action est irréversible.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styles spécifiques pour l'impression */}
      <style>{`
        @media print {
          button, a, .no-print {
            display: none !important;
          }
          .shadow, .rounded-lg {
            box-shadow: none !important;
            border: 1px solid #eee;
          }
          body {
            font-size: 12pt;
          }
          h1 {
            font-size: 18pt;
            margin-bottom: 20px;
          }
          h2 {
            font-size: 16pt;
          }
          h3 {
            font-size: 14pt;
          }
        }
      `}</style>
    </div>
  );
};

export default VolontaireHcDetail;