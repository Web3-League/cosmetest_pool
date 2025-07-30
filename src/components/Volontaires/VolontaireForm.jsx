import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import volontaireService from "../../services/volontaireService";
import infoBancaireService from "../../services/infoBancaireService";
import { toISODateString } from "../../utils/dateUtils";
import { ChevronRightIcon } from "../../components/icons";

// Composant pour gérer les onglets du formulaire
const FormTabs = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: "infos-personnelles", label: "Informations personnelles" },
    { id: "caracteristiques", label: "Caractéristiques physiques" },
    { id: "peau", label: "Peau" },
    { id: "marques-cutanees", label: "Marques cutanées" }, // Nouvel onglet
    { id: "cheveux", label: "Cheveux & ongles" },
    { id: "cils", label: "Cils & sourcils" }, // Nouvel onglet
    { id: "problemes", label: "Problèmes spécifiques" },
    { id: "medical", label: "Informations médicales" },
    { id: "mesures", label: "Mesures" }, // Nouvel onglet
    { id: "notes", label: "Notes" },
    { id: "RIB", label: "RIB" }, // Nouvel onglet
    { id: "evaluation", label: "Évaluation" }, // Nouvel onglet
  ];

  return (
    <div className="mb-6 border-b border-gray-200">
      <nav className="flex -mb-px overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`py-3 px-4 text-sm font-medium whitespace-nowrap ${activeTab === tab.id
              ? "border-b-2 border-primary-600 text-primary-600"
              : "text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300"
              }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

// Composant principal du formulaire
const VolontaireForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  // Gestion des onglets
  const [activeTab, setActiveTab] = useState("infos-personnelles");

  // État initial du formulaire avec tous les champs possibles
  const initialFormState = {
    // Informations personnelles
    titre: "",
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    telephoneDomicile: "",
    sexe: "",
    dateNaissance: "",

    // Adresse
    adresse: "",
    codePostal: "",
    ville: "",
    pays: "France",

    // Caractéristiques physiques
    taille: "",
    poids: "",
    phototype: "",
    ethnie: "",
    sousEthnie: "",
    yeux: "",
    pilosite: "",
    originePere: "",
    origineMere: "",

    // Peau
    typePeauVisage: "",
    carnation: "",
    sensibiliteCutanee: "",
    teintInhomogene: "Non",
    teintTerne: "Non",
    poresVisibles: "Non",
    expositionSolaire: "",
    bronzage: "",
    coupsDeSoleil: "",
    celluliteBras: "Non",
    celluliteFessesHanches: "Non",
    celluliteJambes: "Non",
    celluliteVentreTaille: "Non",

    // Cheveux et ongles
    couleurCheveux: "",
    longueurCheveux: "",
    natureCheveux: "",
    epaisseurCheveux: "",
    natureCuirChevelu: "",
    cuirCheveluSensible: "Non",
    chuteDeCheveux: "Non",
    cheveuxCassants: "Non",
    onglesCassants: "Non",
    onglesDedoubles: "Non",

    // Problèmes spécifiques
    acne: "Non",
    couperoseRosacee: "Non",
    dermiteSeborrheique: "Non",
    eczema: "Non",
    psoriasis: "Non",

    // Informations médicales
    traitement: "",
    anamnese: "",
    contraception: "",
    menopause: "Non",
    allergiesCommentaires: "",
    santeCompatible: "Oui",

    // Notes
    notes: "",

    // Caractéristiques supplémentaires
    cicatrices: "Non",
    tatouages: "Non",
    piercings: "Non",

    // Vergetures
    vergeturesJambes: "Non",
    vergeturesFessesHanches: "Non",
    vergeturesVentreTaille: "Non",
    vergeturesPoitrineDecollete: "Non",

    // Sécheresse de la peau
    secheresseLevres: "Non",
    secheresseCou: "Non",
    secheressePoitrineDecollete: "Non",
    secheresseVentreTaille: "Non",
    secheresseFessesHanches: "Non",
    secheresseBras: "Non",
    secheresseMains: "Non",
    secheresseJambes: "Non",
    secheressePieds: "Non",

    // Taches pigmentaires
    tachesPigmentairesVisage: "Non",
    tachesPigmentairesCou: "Non",
    tachesPigmentairesDecollete: "Non",
    tachesPigmentairesMains: "Non",

    // Perte de fermeté
    perteDeFermeteVisage: "Non",
    perteDeFermeteCou: "Non",
    perteDeFermeteDecollete: "Non",

    // Cils
    epaisseurCils: "",
    longueurCils: "",
    courbureCils: "",
    cilsAbimes: "Non",
    cilsBroussailleux: "Non",
    chuteDeCils: "Non",

    // Problèmes médicaux supplémentaires
    angiome: "Non",
    pityriasis: "Non",
    vitiligo: "Non",
    melanome: "Non",
    zona: "Non",
    herpes: "Non",
    pelade: "Non",
    reactionAllergique: "Non",
    desensibilisation: "Non",
    terrainAtopique: "Non",

    // Valeurs mesurées
    ihBrasDroit: "",
    ihBrasGauche: "",

    // Scores
    scorePod: "",
    scorePog: "",
    scoreFront: "",
    scoreLion: "",
    scorePpd: "",
    scorePpg: "",
    scoreDod: "",
    scoreDog: "",
    scoreSngd: "",
    scoreSngg: "",
    scoreLevsup: "",
    scoreComlevd: "",
    scoreComlevg: "",
    scorePtose: "",
    ita: "",

    // Autres attributs manquants
    levres: "",
    bouffeeChaleurMenaupose: "Non",
    cernesVasculaires: "Non",
    cernesPigmentaires: "Non",
    poches: "Non",
    nbCigarettesJour: "",
    caracteristiqueSourcils: "",
    mapyeux: "",
    maplevres: "",
    mapsourcils: "",
    ths: "Non",

    // Informations Bancaires
    iban: "",
    bic: "",

    // Champs pour les évaluations
    evaluation: 0,

  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

  // Chargement des données du volontaire si en mode édition
  useEffect(() => {
    const fetchVolontaire = async () => {
      if (!isEditMode) return;

      try {
        setIsLoading(true);

        // Charger d'abord les détails qui contiennent toutes les informations
        let detailsData = {};
        try {
          const detailsResponse = await volontaireService.getDetails(id);
          detailsData = detailsResponse.data || {};
        } catch (detailsError) {
          console.warn(
            "Erreur lors du chargement des détails du volontaire:",
            detailsError
          );
        }

        // Charger les informations bancaires avec le service dédié
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
        } catch (infoBankError) {
          console.warn("Erreur lors du chargement de l'InfoBank du volontaire:", infoBankError);
        }

        // À partir des données détaillées, préremplir le formulaire
        const formattedData = {
          ...initialFormState,
          titre: detailsData.titreVol || "",
          nom: detailsData.nomVol || "",
          prenom: detailsData.prenomVol || "",
          email: detailsData.emailVol || "",
          telephone: detailsData.telPortableVol || "",
          telephoneDomicile: detailsData.telDomicileVol || "",
          sexe: detailsData.sexe || "",
          dateNaissance: detailsData.dateNaissance
            ? toISODateString(detailsData.dateNaissance)
            : "",

          // Adresse
          adresse: detailsData.adresseVol || "",
          codePostal: detailsData.cpVol || "",
          ville: detailsData.villeVol || "",
          pays: detailsData.pays || "France",

          // Caractéristiques physiques
          taille: detailsData.taille || "",
          poids: detailsData.poids || "",
          phototype: detailsData.phototype || "",
          ethnie: detailsData.ethnie || "",
          sousEthnie: detailsData.sousEthnie || "",
          yeux: detailsData.yeux || "",
          pilosite: detailsData.pilosite || "",
          originePere: detailsData.originePere || "",
          origineMere: detailsData.origineMere || "",

          // Peau
          typePeauVisage: detailsData.typePeauVisage || "",
          carnation: detailsData.carnation || "",
          sensibiliteCutanee: detailsData.sensibiliteCutanee || "",
          teintInhomogene: detailsData.teintInhomogene || "Non",
          teintTerne: detailsData.teintTerne || "Non",
          poresVisibles: detailsData.poresVisibles || "Non",
          expositionSolaire: detailsData.expositionSolaire || "",
          bronzage: detailsData.bronzage || "",
          coupsDeSoleil: detailsData.coupsDeSoleil || "",
          celluliteBras: detailsData.celluliteBras || "Non",
          celluliteFessesHanches: detailsData.celluliteFessesHanches || "Non",
          celluliteJambes: detailsData.celluliteJambes || "Non",
          celluliteVentreTaille: detailsData.celluliteVentreTaille || "Non",

          // Cheveux et ongles
          couleurCheveux: detailsData.couleurCheveux || "",
          longueurCheveux: detailsData.longueurCheveux || "",
          natureCheveux: detailsData.natureCheveux || "",
          epaisseurCheveux: detailsData.epaisseurCheveux || "",
          natureCuirChevelu: detailsData.natureCuirChevelu || "",
          cuirCheveluSensible: detailsData.cuirCheveluSensible || "Non",
          chuteDeCheveux: detailsData.chuteDeCheveux || "Non",
          cheveuxCassants: detailsData.cheveuxCassants || "Non",
          onglesCassants: detailsData.onglesCassants || "Non",
          onglesDedoubles: detailsData.onglesDedoubles || "Non",

          // Problèmes spécifiques
          acne: detailsData.acne || "Non",
          couperoseRosacee: detailsData.couperoseRosacee || "Non",
          dermiteSeborrheique: detailsData.dermiteSeborrheique || "Non",
          eczema: detailsData.eczema || "Non",
          psoriasis: detailsData.psoriasis || "Non",

          // Informations médicales
          traitement: detailsData.traitement || "",
          anamnese: detailsData.anamnese || "",
          contraception: detailsData.contraception || "",
          menopause: detailsData.menopause || "Non",
          allergiesCommentaires: detailsData.allergiesCommentaires || "",
          santeCompatible: detailsData.santeCompatible || "Oui",

          // Notes
          notes: detailsData.commentairesVol || "",
          evaluation: detailsData.notes || 0,
          // Caractéristiques supplémentaires
          cicatrices: detailsData.cicatrices || "Non",
          tatouages: detailsData.tatouages || "Non",
          piercings: detailsData.piercings || "Non",

          // Vergetures
          vergeturesJambes: detailsData.vergeturesJambes || "Non",
          vergeturesFessesHanches: detailsData.vergeturesFessesHanches || "Non",
          vergeturesVentreTaille: detailsData.vergeturesVentreTaille || "Non",
          vergeturesPoitrineDecollete:
            detailsData.vergeturesPoitrineDecollete || "Non",

          // Sécheresse de la peau
          secheresseLevres: detailsData.secheresseLevres || "Non",
          secheresseCou: detailsData.secheresseCou || "Non",
          secheressePoitrineDecollete:
            detailsData.secheressePoitrineDecollete || "Non",
          secheresseVentreTaille: detailsData.secheresseVentreTaille || "Non",
          secheresseFessesHanches: detailsData.secheresseFessesHanches || "Non",
          secheresseBras: detailsData.secheresseBras || "Non",
          secheresseMains: detailsData.secheresseMains || "Non",
          secheresseJambes: detailsData.secheresseJambes || "Non",
          secheressePieds: detailsData.secheressePieds || "Non",

          // Taches pigmentaires
          tachesPigmentairesVisage:
            detailsData.tachesPigmentairesVisage || "Non",
          tachesPigmentairesCou: detailsData.tachesPigmentairesCou || "Non",
          tachesPigmentairesDecollete:
            detailsData.tachesPigmentairesDecollete || "Non",
          tachesPigmentairesMains: detailsData.tachesPigmentairesMains || "Non",

          // Perte de fermeté
          perteDeFermeteVisage: detailsData.perteDeFermeteVisage || "Non",
          perteDeFermeteCou: detailsData.perteDeFermeteCou || "Non",
          perteDeFermeteDecollete: detailsData.perteDeFermeteDecollete || "Non",

          // Cils
          epaisseurCils: detailsData.epaisseurCils || "",
          longueurCils: detailsData.longueurCils || "",
          courbureCils: detailsData.courbureCils || "",
          cilsAbimes: detailsData.cilsAbimes || "Non",
          cilsBroussailleux: detailsData.cilsBroussailleux || "Non",
          chuteDeCils: detailsData.chuteDeCils || "Non",

          // Problèmes médicaux supplémentaires
          angiome: detailsData.angiome || "Non",
          pityriasis: detailsData.pityriasis || "Non",
          vitiligo: detailsData.vitiligo || "Non",
          melanome: detailsData.melanome || "Non",
          zona: detailsData.zona || "Non",
          herpes: detailsData.herpes || "Non",
          pelade: detailsData.pelade || "Non",
          reactionAllergique: detailsData.reactionAllergique || "Non",
          desensibilisation: detailsData.desensibilisation || "Non",
          terrainAtopique: detailsData.terrainAtopique || "Non",

          // Valeurs mesurées
          ihBrasDroit: detailsData.ihBrasDroit || "",
          ihBrasGauche: detailsData.ihBrasGauche || "",

          // Scores
          scorePod: detailsData.scorePod || "",
          scorePog: detailsData.scorePog || "",
          scoreFront: detailsData.scoreFront || "",
          scoreLion: detailsData.scoreLion || "",
          scorePpd: detailsData.scorePpd || "",
          scorePpg: detailsData.scorePpg || "",
          scoreDod: detailsData.scoreDod || "",
          scoreDog: detailsData.scoreDog || "",
          scoreSngd: detailsData.scoreSngd || "",
          scoreSngg: detailsData.scoreSngg || "",
          scoreLevsup: detailsData.scoreLevsup || "",
          scoreComlevd: detailsData.scoreComlevd || "",
          scoreComlevg: detailsData.scoreComlevg || "",
          scorePtose: detailsData.scorePtose || "",
          ita: detailsData.ita || "",

          // Autres attributs manquants
          levres: detailsData.levres || "",
          bouffeeChaleurMenaupose: detailsData.bouffeeChaleurMenaupose || "Non",
          cernesVasculaires: detailsData.cernesVasculaires || "Non",
          cernesPigmentaires: detailsData.cernesPigmentaires || "Non",
          poches: detailsData.poches || "Non",
          nbCigarettesJour: detailsData.nbCigarettesJour || "",
          caracteristiqueSourcils: detailsData.caracteristiqueSourcils || "",
          mapyeux: detailsData.mapyeux || "",
          maplevres: detailsData.maplevres || "",
          mapsourcils: detailsData.mapsourcils || "",
          ths: detailsData.ths || "Non",

          // Informations Bancaires
          iban: infoBankData.iban || "",
          bic: infoBankData.bic || "",
        };

        console.log("Données formatées pour le formulaire:", formattedData);

        // Mise à jour du formulaire
        setFormData(formattedData);
      } catch (error) {
        // Gestion des erreurs Axios
        const errorMessage =
          error.response?.data?.message ||
          "Impossible de charger les données du volontaire";
        console.error(
          "Erreur lors du chargement des données du volontaire:",
          error
        );
        setFormError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVolontaire();
  }, [id, isEditMode]);

  const validateBankInfo = () => {
    const bankErrors = {};

    // Validation IBAN si fourni
    if (formData.iban && formData.iban.trim()) {
      if (!infoBancaireService.validation.validateIban(formData.iban)) {
        bankErrors.iban = 'Format IBAN invalide (format français attendu: FR + 25 caractères)';
      }
    }

    // Validation BIC si fourni
    if (formData.bic && formData.bic.trim()) {
      if (!infoBancaireService.validation.validateBic(formData.bic)) {
        bankErrors.bic = 'Format BIC invalide (8 ou 11 caractères alphanumériques)';
      }
    }

    return bankErrors;
  };


  // Gestion des changements de champs
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Pour les checkbox, utilisez la valeur "Oui" ou "Non"
    const newValue = type === "checkbox" ? (checked ? "Oui" : "Non") : value;

    setFormData((prev) => ({ ...prev, [name]: newValue }));

    // Effacer l'erreur lorsque l'utilisateur modifie un champ
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Validation du formulaire
  // Modifier la fonction validateForm pour inclure la validation bancaire
  const validateForm = () => {
    const newErrors = {};

    // Validation des champs obligatoires existants
    if (!formData.nom.trim()) {
      newErrors.nom = "Le nom est obligatoire";
    }

    if (!formData.prenom.trim()) {
      newErrors.prenom = "Le prénom est obligatoire";
    }

    if (!formData.email.trim()) {
      newErrors.email = "L'email est obligatoire";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Format d'email invalide";
    }

    if (!formData.sexe) {
      newErrors.sexe = "Le sexe est obligatoire";
    }

    if (!formData.typePeauVisage) {
      newErrors.typePeauVisage = "Le type de peau est obligatoire";
    }

    // Code postal français (5 chiffres)
    if (formData.codePostal && !/^\d{5}$/.test(formData.codePostal)) {
      newErrors.codePostal = "Le code postal doit contenir 5 chiffres";
    }

    // Validation des informations bancaires
    const bankErrors = validateBankInfo();
    Object.assign(newErrors, bankErrors);

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Ajouter une fonction spécifique pour sauvegarder les informations bancaires
  const saveBankInfo = async (volontaireId) => {
    // Ne sauvegarder que si IBAN ou BIC sont fournis
    if (!formData.iban?.trim() && !formData.bic?.trim()) {
      return; // Pas d'informations bancaires à sauvegarder
    }

    const bankData = {
      iban: infoBancaireService.validation.cleanIban(formData.iban),
      bic: infoBancaireService.validation.cleanBic(formData.bic),
      idVol: volontaireId
    };

    try {
      await infoBancaireService.saveForVolontaire(volontaireId, bankData);
      console.log("Informations bancaires sauvegardées avec succès");
    } catch (error) {
      console.warn("Erreur lors de la sauvegarde des informations bancaires:", error);
      // Ne pas faire échouer toute la sauvegarde pour les infos bancaires
    }
  };

  // Soumission du formulaire
  // Modification de la fonction handleSubmit pour s'assurer que tous les champs obligatoires ont des valeurs

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!validateForm()) {
      window.scrollTo(0, 0);
      return;
    }

    try {
      setIsSaving(true);
      setFormError(null);
      setFormSuccess(null);

      // Préparation des données pour l'API
      console.log("Données du formulaire à envoyer:", formData);

      // Fonction helper améliorée pour s'assurer qu'aucune valeur n'est null
      const defaultIfNull = (value, defaultValue) => {
        // Si la valeur est null, undefined ou une chaîne vide, utiliser la valeur par défaut
        if (value === null || value === undefined || value === "") {
          return defaultValue;
        }
        return value;
      };

      // Combiner toutes les données en un seul objet avec des valeurs par défaut pour éviter les nulls
      const volontaireCompleteData = {
        // Données de base du volontaire
        titreVol: defaultIfNull(formData.titre, ""),
        nomVol: defaultIfNull(formData.nom, ""),
        prenomVol: defaultIfNull(formData.prenom, ""),
        emailVol: defaultIfNull(formData.email, ""),
        telPortableVol: defaultIfNull(formData.telephone, ""),
        telDomicileVol: defaultIfNull(formData.telephoneDomicile, ""),
        sexe: defaultIfNull(formData.sexe, ""),
        dateNaissance: defaultIfNull(formData.dateNaissance, ""),
        typePeauVisage: defaultIfNull(formData.typePeauVisage, ""),
        phototype: defaultIfNull(formData.phototype, ""),
        ethnie: defaultIfNull(formData.ethnie, ""),
        santeCompatible: defaultIfNull(formData.santeCompatible, "Oui"),

        // Adresse
        adresseVol: defaultIfNull(formData.adresse, ""),
        cpVol: defaultIfNull(formData.codePostal, ""),
        villeVol: defaultIfNull(formData.ville, ""),
        pays: defaultIfNull(formData.pays, "France"),

        // Caractéristiques physiques
        taille: formData.taille ? parseFloat(formData.taille) : 0,
        poids: formData.poids ? parseFloat(formData.poids) : 0,
        sousEthnie: defaultIfNull(formData.sousEthnie, ""),
        yeux: defaultIfNull(formData.yeux, ""),
        pilosite: defaultIfNull(formData.pilosite, ""),
        originePere: defaultIfNull(formData.originePere, ""),
        origineMere: defaultIfNull(formData.origineMere, ""),

        // Peau
        carnation: defaultIfNull(formData.carnation, ""),
        sensibiliteCutanee: defaultIfNull(formData.sensibiliteCutanee, ""),
        teintInhomogene: defaultIfNull(formData.teintInhomogene, "Non"),
        teintTerne: defaultIfNull(formData.teintTerne, "Non"),
        poresVisibles: defaultIfNull(formData.poresVisibles, "Non"),
        expositionSolaire: defaultIfNull(formData.expositionSolaire, ""),
        bronzage: defaultIfNull(formData.bronzage, ""),
        coupsDeSoleil: defaultIfNull(formData.coupsDeSoleil, ""),
        celluliteBras: defaultIfNull(formData.celluliteBras, "Non"),
        celluliteFessesHanches: defaultIfNull(formData.celluliteFessesHanches, "Non"),
        celluliteJambes: defaultIfNull(formData.celluliteJambes, "Non"),
        celluliteVentreTaille: defaultIfNull(formData.celluliteVentreTaille, "Non"),

        // Cheveux et ongles
        couleurCheveux: defaultIfNull(formData.couleurCheveux, ""),
        longueurCheveux: defaultIfNull(formData.longueurCheveux, ""),
        natureCheveux: defaultIfNull(formData.natureCheveux, ""),
        epaisseurCheveux: defaultIfNull(formData.epaisseurCheveux, ""),
        natureCuirChevelu: defaultIfNull(formData.natureCuirChevelu, ""),
        cuirCheveluSensible: defaultIfNull(formData.cuirCheveluSensible, "Non"),
        chuteDeCheveux: defaultIfNull(formData.chuteDeCheveux, "Non"),
        cheveuxCassants: defaultIfNull(formData.cheveuxCassants, "Non"),
        onglesCassants: defaultIfNull(formData.onglesCassants, "Non"),
        onglesDedoubles: defaultIfNull(formData.onglesDedoubles, "Non"),

        // CHAMPS OBLIGATOIRES MANQUANTS
        // Ces champs doivent avoir des valeurs par défaut non-null
        cheveuxAbimes: defaultIfNull(formData.cheveuxAbimes, "Non"),
        cheveuxPlats: defaultIfNull(formData.cheveuxPlats, "Non"),
        cheveuxTernes: defaultIfNull(formData.cheveuxTernes, "Non"),
        onglesMous: defaultIfNull(formData.onglesMous, "Non"),
        onglesStries: defaultIfNull(formData.onglesStries, "Non"),
        pellicules: defaultIfNull(formData.pellicules, "Non"),
        demangeaisonsDuCuirChevelu: defaultIfNull(formData.demangeaisonsDuCuirChevelu, "Non"),
        pointesFourchues: defaultIfNull(formData.pointesFourchues, "Non"),
        calvitie: defaultIfNull(formData.calvitie, "Non"),
        caracteristiqueSourcils: defaultIfNull(formData.caracteristiqueSourcils, "Non spécifié"),
        cils: defaultIfNull(formData.cils, "Non spécifié"),
        mapyeux: defaultIfNull(formData.mapyeux, "Non spécifié"),
        maplevres: defaultIfNull(formData.maplevres, "Non spécifié"),
        mapsourcils: defaultIfNull(formData.mapsourcils, "Non spécifié"),

        // Problèmes spécifiques
        acne: defaultIfNull(formData.acne, "Non"),
        couperoseRosacee: defaultIfNull(formData.couperoseRosacee, "Non"),
        dermiteSeborrheique: defaultIfNull(formData.dermiteSeborrheique, "Non"),
        eczema: defaultIfNull(formData.eczema, "Non"),
        psoriasis: defaultIfNull(formData.psoriasis, "Non"),
        lesionsInflammatoires: defaultIfNull(formData.lesionsInflammatoires, "Non"),
        lesionsRetentionnelles: defaultIfNull(formData.lesionsRetentionnelles, "Non"),

        // Informations médicales
        traitement: defaultIfNull(formData.traitement, ""),
        anamnese: defaultIfNull(formData.anamnese, ""),
        contraception: defaultIfNull(formData.contraception, ""),
        menopause: defaultIfNull(formData.menopause, "Non"),
        allergiesCommentaires: defaultIfNull(formData.allergiesCommentaires, ""),

        // Notes
        commentairesVol: defaultIfNull(formData.notes, ""),

        //Evaluations
        notes: defaultIfNull(formData.evaluation, ""),

        //Caractéristiques supplémentaires
        cicatrices: defaultIfNull(formData.cicatrices, "Non"),
        tatouages: defaultIfNull(formData.tatouages, "Non"),
        piercings: defaultIfNull(formData.piercings, "Non"),

        // Vergetures
        vergeturesJambes: defaultIfNull(formData.vergeturesJambes, "Non"),
        vergeturesFessesHanches: defaultIfNull(formData.vergeturesFessesHanches, "Non"),
        vergeturesVentreTaille: defaultIfNull(formData.vergeturesVentreTaille, "Non"),
        vergeturesPoitrineDecollete: defaultIfNull(formData.vergeturesPoitrineDecollete, "Non"),

        // Sécheresse de la peau
        secheresseLevres: defaultIfNull(formData.secheresseLevres, "Non"),
        secheresseCou: defaultIfNull(formData.secheresseCou, "Non"),
        secheressePoitrineDecollete: defaultIfNull(formData.secheressePoitrineDecollete, "Non"),
        secheresseVentreTaille: defaultIfNull(formData.secheresseVentreTaille, "Non"),
        secheresseFessesHanches: defaultIfNull(formData.secheresseFessesHanches, "Non"),
        secheresseBras: defaultIfNull(formData.secheresseBras, "Non"),
        secheresseMains: defaultIfNull(formData.secheresseMains, "Non"),
        secheresseJambes: defaultIfNull(formData.secheresseJambes, "Non"),
        secheressePieds: defaultIfNull(formData.secheressePieds, "Non"),

        //Taches pigmentaires
        tachesPigmentairesVisage: defaultIfNull(formData.tachesPigmentairesVisage, "Non"),
        tachesPigmentairesCou: defaultIfNull(formData.tachesPigmentairesCou, "Non"),
        tachesPigmentairesDecollete: defaultIfNull(formData.tachesPigmentairesDecollete, "Non"),
        tachesPigmentairesMains: defaultIfNull(formData.tachesPigmentairesMains, "Non"),

        // Perte de fermeté
        perteDeFermeteVisage: defaultIfNull(formData.perteDeFermeteVisage, "Non"),
        perteDeFermeteCou: defaultIfNull(formData.perteDeFermeteCou, "Non"),
        perteDeFermeteDecollete: defaultIfNull(formData.perteDeFermeteDecollete, "Non"),

        // Cils
        epaisseurCils: defaultIfNull(formData.epaisseurCils, ""),
        longueurCils: defaultIfNull(formData.longueurCils, ""),
        courbureCils: defaultIfNull(formData.courbureCils, ""),
        cilsAbimes: defaultIfNull(formData.cilsAbimes, "Non"),
        cilsBroussailleux: defaultIfNull(formData.cilsBroussailleux, "Non"),
        chuteDeCils: defaultIfNull(formData.chuteDeCils, "Non"),

        //Problèmes médicaux supplémentaires
        angiome: defaultIfNull(formData.angiome, "Non"),
        pityriasis: defaultIfNull(formData.pityriasis, "Non"),
        vitiligo: defaultIfNull(formData.vitiligo, "Non"),
        melanome: defaultIfNull(formData.melanome, "Non"),
        zona: defaultIfNull(formData.zona, "Non"),
        herpes: defaultIfNull(formData.herpes, "Non"),
        pelade: defaultIfNull(formData.pelade, "Non"),
        reactionAllergique: defaultIfNull(formData.reactionAllergique, "Non"),
        desensibilisation: defaultIfNull(formData.desensibilisation, "Non"),
        terrainAtopique: defaultIfNull(formData.terrainAtopique, "Non"),

        // Valeurs mesurées
        ihBrasDroit: formData.ihBrasDroit ? parseFloat(formData.ihBrasDroit) : 0,
        ihBrasGauche: formData.ihBrasGauche ? parseFloat(formData.ihBrasGauche) : 0,

        // Scores
        scoreComlevd: formData.scoreComlevd ? parseFloat(formData.scoreComlevd) : 0,
        scoreComlevg: formData.scoreComlevg ? parseFloat(formData.scoreComlevg) : 0,
        scoreDod: formData.scoreDod ? parseFloat(formData.scoreDod) : 0,
        scoreDog: formData.scoreDog ? parseFloat(formData.scoreDog) : 0,
        scoreFront: formData.scoreFront ? parseFloat(formData.scoreFront) : 0,
        scoreLevsup: formData.scoreLevsup ? parseFloat(formData.scoreLevsup) : 0,
        scoreLion: formData.scoreLion ? parseFloat(formData.scoreLion) : 0,
        scorePod: formData.scorePod ? parseFloat(formData.scorePod) : 0,
        scorePog: formData.scorePog ? parseFloat(formData.scorePog) : 0,
        scorePpd: formData.scorePpd ? parseFloat(formData.scorePpd) : 0,
        scorePpg: formData.scorePpg ? parseFloat(formData.scorePpg) : 0,
        scorePtose: formData.scorePtose ? parseFloat(formData.scorePtose) : 0,
        scoreSngd: formData.scoreSngd ? parseFloat(formData.scoreSngd) : 0,
        scoreSngg: formData.scoreSngg ? parseFloat(formData.scoreSngg) : 0,
        ita: formData.ita ? parseFloat(formData.ita) : 0,

        //Autres attributs
        levres: defaultIfNull(formData.levres, ""),
        bouffeeChaleurMenaupose: defaultIfNull(formData.bouffeeChaleurMenaupose, "Non"),
        cernesVasculaires: defaultIfNull(formData.cernesVasculaires, "Non"),
        cernesPigmentaires: defaultIfNull(formData.cernesPigmentaires, "Non"),
        poches: defaultIfNull(formData.poches, "Non"),
        nbCigarettesJour: defaultIfNull(formData.nbCigarettesJour, ""),
        ths: defaultIfNull(formData.ths, "Non"),

        // Champs supplémentaires identifiés dans la requête SQL
        archive: false, // Valeur par défaut pour un nouveau volontaire
        hauteurSiege: defaultIfNull(formData.hauteurSiege, ""),
        dateI: new Date().toISOString().split('T')[0], // Date d'inscription/création, aujourd'hui par défaut
      };

      console.log("Données complètes préparées pour l'API:", volontaireCompleteData);

      let volontaireId;

      // Création ou mise à jour du volontaire
      if (isEditMode) {
        await volontaireService.updateDetails(id, volontaireCompleteData);
        volontaireId = id; // ✅ Assigner l'ID existant
        setFormSuccess("Volontaire mis à jour avec succès");
      } else {
        // Création d'un nouveau volontaire
        const response = await volontaireService.create(volontaireCompleteData);

        // ✅ Extraire et assigner correctement l'ID
        volontaireId = response.data.id || response.data.idVol || response.data.volontaireId;

        // ✅ Vérifier que l'ID a bien été récupéré
        if (!volontaireId) {
          throw new Error("Impossible de récupérer l'ID du volontaire créé");
        }

        setFormSuccess("Volontaire créé avec succès");
      }

      // ✅ Sauvegarder les informations bancaires avec l'ID correct
      await saveBankInfo(volontaireId);

      // ✅ Une seule redirection, après un délai
      if (!isEditMode) {
        setTimeout(() => {
          navigate(`/volontaires/${volontaireId}`);
        }, 1500);
      }

    } catch (error) {
      // Gestion des erreurs Axios
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Une erreur est survenue lors de l'enregistrement du volontaire";
      console.error("Erreur lors de l'enregistrement du volontaire:", error);
      setFormError(errorMessage);
      window.scrollTo(0, 0);
    } finally {
      setIsSaving(false);
    }
  };
  // Rendu des sections de formulaire en fonction de l'onglet actif
  const renderFormSection = () => {
    switch (activeTab) {
      case "infos-personnelles":
        return (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Informations personnelles {id}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="titre"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Titre
                </label>
                <select
                  id="titre"
                  name="titre"
                  value={formData.titre}
                  onChange={handleChange}
                  className="form-select block w-full"
                >
                  <option value="">Sélectionner</option>
                  <option value="Madame">Madame</option>
                  <option value="Monsieur">Monsieur</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="nom"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="nom"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  className={`form-input block w-full ${errors.nom ? "border-red-500" : ""
                    }`}
                  required
                />
                {errors.nom && (
                  <p className="mt-1 text-sm text-red-500">{errors.nom}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="prenom"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Prénom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="prenom"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  className={`form-input block w-full ${errors.prenom ? "border-red-500" : ""
                    }`}
                  required
                />
                {errors.prenom && (
                  <p className="mt-1 text-sm text-red-500">{errors.prenom}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`form-input block w-full ${errors.email ? "border-red-500" : ""
                    }`}
                  required
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="telephone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Téléphone portable
                </label>
                <input
                  type="tel"
                  id="telephone"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  className="form-input block w-full"
                />
              </div>

              <div>
                <label
                  htmlFor="telephoneDomicile"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Téléphone fixe
                </label>
                <input
                  type="tel"
                  id="telephoneDomicile"
                  name="telephoneDomicile"
                  value={formData.telephoneDomicile}
                  onChange={handleChange}
                  className="form-input block w-full"
                />
              </div>

              <div>
                <label
                  htmlFor="dateNaissance"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Date de naissance
                </label>
                <input
                  type="date"
                  id="dateNaissance"
                  name="dateNaissance"
                  value={formData.dateNaissance}
                  onChange={handleChange}
                  className="form-input block w-full"
                />
              </div>

              <div>
                <label
                  htmlFor="sexe"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Sexe <span className="text-red-500">*</span>
                </label>
                <select
                  id="sexe"
                  name="sexe"
                  value={formData.sexe}
                  onChange={handleChange}
                  className={`form-select block w-full ${errors.sexe ? "border-red-500" : ""
                    }`}
                  required
                >
                  <option value="">Sélectionner</option>
                  <option value="Masculin">Masculin</option>
                  <option value="Féminin">Féminin</option>
                  <option value="O">Autre</option>
                </select>
                {errors.sexe && (
                  <p className="mt-1 text-sm text-red-500">{errors.sexe}</p>
                )}
              </div>
            </div>

            {/* Section Adresse */}
            <h2 className="text-lg font-semibold text-gray-800 mt-8 mb-4">
              Adresse
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label
                  htmlFor="adresse"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Adresse
                </label>
                <input
                  type="text"
                  id="adresse"
                  name="adresse"
                  value={formData.adresse}
                  onChange={handleChange}
                  className="form-input block w-full"
                />
              </div>

              <div>
                <label
                  htmlFor="codePostal"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Code postal
                </label>
                <input
                  type="text"
                  id="codePostal"
                  name="codePostal"
                  value={formData.codePostal}
                  onChange={handleChange}
                  className={`form-input block w-full ${errors.codePostal ? "border-red-500" : ""
                    }`}
                />
                {errors.codePostal && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.codePostal}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="ville"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Ville
                </label>
                <input
                  type="text"
                  id="ville"
                  name="ville"
                  value={formData.ville}
                  onChange={handleChange}
                  className="form-input block w-full"
                />
              </div>

              <div>
                <label
                  htmlFor="pays"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Pays
                </label>
                <input
                  type="text"
                  id="pays"
                  name="pays"
                  value={formData.pays}
                  onChange={handleChange}
                  className="form-input block w-full"
                />
              </div>
            </div>
          </div>
        );

      case "caracteristiques":
        return (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Caractéristiques physiques
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="taille"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Taille (cm)
                </label>
                <input
                  type="number"
                  id="taille"
                  name="taille"
                  value={formData.taille}
                  onChange={handleChange}
                  className="form-input block w-full"
                />
              </div>

              <div>
                <label
                  htmlFor="poids"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Poids (kg)
                </label>
                <input
                  type="number"
                  id="poids"
                  name="poids"
                  value={formData.poids}
                  onChange={handleChange}
                  className="form-input block w-full"
                />
              </div>

              <div>
                <label
                  htmlFor="phototype"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Phototype
                </label>
                <select
                  id="phototype"
                  name="phototype"
                  value={formData.phototype}
                  onChange={handleChange}
                  className="form-select block w-full"
                >
                  <option value="">Sélectionner</option>
                  <option value="I">I - Peau très claire</option>
                  <option value="II">II - Peau claire</option>
                  <option value="III">III - Peau claire à mate</option>
                  <option value="IV">IV - Peau mate</option>
                  <option value="V">V - Peau foncée</option>
                  <option value="VI">VI - Peau noire</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="ethnie"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Ethnie
                </label>
                <select
                  id="ethnie"
                  name="ethnie"
                  value={formData.ethnie}
                  onChange={handleChange}
                  className="form-select block w-full"
                >
                  <option value="">Sélectionner</option>
                  <option value="CAUCASIEN">Caucasien(ne)</option>
                  <option value="Caucasienne">Caucasienne</option>
                  <option value="AFRICAIN">Africain(e)</option>
                  <option value="Africaine">Africaine</option>
                  <option value="ASIATIQUE">Asiatique</option>
                  <option value="HISPANIQUE">Hispanique</option>
                  <option value="MOYEN_ORIENT">Moyen-Orient</option>
                  <option value="AUTRE">Autre</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="sousEthnie"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Sous-ethnie
                </label>
                <input
                  type="text"
                  id="sousEthnie"
                  name="sousEthnie"
                  value={formData.sousEthnie}
                  onChange={handleChange}
                  className="form-input block w-full"
                />
              </div>

              <div>
                <label
                  htmlFor="yeux"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Couleur des yeux
                </label>
                <select
                  id="yeux"
                  name="yeux"
                  value={formData.yeux}
                  onChange={handleChange}
                  className="form-select block w-full"
                >
                  <option value="">Sélectionner</option>
                  <option value="Bleus">Bleus</option>
                  <option value="Verts">Verts</option>
                  <option value="Marrons">Marrons</option>
                  <option value="Noisette">Noisette</option>
                  <option value="Gris">Gris</option>
                  <option value="Noirs">Noirs</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="pilosite"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Pilosité
                </label>
                <select
                  id="pilosite"
                  name="pilosite"
                  value={formData.pilosite}
                  onChange={handleChange}
                  className="form-select block w-full"
                >
                  <option value="">Sélectionner</option>
                  <option value="Faible_pilosite">Faible pilosité</option>
                  <option value="Moyenne_pilosite">Pilosité moyenne</option>
                  <option value="Forte_pilosite">Forte pilosité</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="originePere"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Origine du père
                </label>
                <input
                  type="text"
                  id="originePere"
                  name="originePere"
                  value={formData.originePere}
                  onChange={handleChange}
                  className="form-input block w-full"
                />
              </div>

              <div>
                <label
                  htmlFor="origineMere"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Origine de la mère
                </label>
                <input
                  type="text"
                  id="origineMere"
                  name="origineMere"
                  value={formData.origineMere}
                  onChange={handleChange}
                  className="form-input block w-full"
                />
              </div>
            </div>
          </div>
        );

      case "peau":
        return (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Caractéristiques de la peau
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="typePeau"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Type de peau <span className="text-red-500">*</span>
                </label>
                <select
                  id="typePeau"
                  name="typePeauVisage"
                  value={formData.typePeauVisage || ""}
                  onChange={handleChange}
                  className={`form-select block w-full ${errors.typePeauVisage ? "border-red-500" : ""}`}
                  required
                >
                  <option value="">Sélectionner</option>
                  <option value="Normale">Normale</option>
                  <option value="Sèche">Sèche</option>
                  <option value="Grasse">Grasse</option>
                  <option value="Mixte">Mixte</option>
                  <option value="Sensible">Sensible</option>
                </select>
                {errors.typePeauVisage && (
                  <p className="mt-1 text-sm text-red-500">{errors.typePeauVisage}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="carnation"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Carnation
                </label>
                <select
                  id="carnation"
                  name="carnation"
                  value={formData.carnation}
                  onChange={handleChange}
                  className="form-select block w-full"
                >
                  <option value="">Sélectionner</option>
                  <option value="Très claire">Très claire</option>
                  <option value="Claire">Claire</option>
                  <option value="Moyenne">Moyenne</option>
                  <option value="Mate">Mate</option>
                  <option value="Foncée">Foncée</option>
                  <option value="Très foncée">Très foncée</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="sensibiliteCutanee"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Sensibilité cutanée
                </label>
                <select
                  id="sensibiliteCutanee"
                  name="sensibiliteCutanee"
                  value={formData.sensibiliteCutanee}
                  onChange={handleChange}
                  className="form-select block w-full"
                >
                  <option value="">Sélectionner</option>
                  <option value="Peau sensible">Peau sensible</option>
                  <option value="Peau peu sensible">Peau peu sensible</option>
                  <option value="Peau non sensible">Peau non sensible</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="teintInhomogene"
                  name="teintInhomogene"
                  checked={formData.teintInhomogene === "Oui"}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-primary-600"
                />
                <label
                  htmlFor="teintInhomogene"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Teint inhomogène
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="teintTerne"
                  name="teintTerne"
                  checked={formData.teintTerne === "Oui"}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-primary-600"
                />
                <label
                  htmlFor="teintTerne"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Teint terne
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="poresVisibles"
                  name="poresVisibles"
                  checked={formData.poresVisibles === "Oui"}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-primary-600"
                />
                <label
                  htmlFor="poresVisibles"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Pores visibles
                </label>
              </div>
            </div>
            <h3 className="text-md font-medium text-gray-800 mt-6 mb-3">
              Exposition au soleil
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="expositionSolaire"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Exposition solaire
                </label>
                <select
                  id="expositionSolaire"
                  name="expositionSolaire"
                  value={formData.expositionSolaire}
                  onChange={handleChange}
                  className="form-select block w-full"
                >
                  <option value="">Sélectionner</option>
                  <option value="Faiblement">Faiblement</option>
                  <option value="Moyennement">Moyennement</option>
                  <option value="Fortement">Fortement</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="bronzage"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Bronzage
                </label>
                <select
                  id="bronzage"
                  name="bronzage"
                  value={formData.bronzage}
                  onChange={handleChange}
                  className="form-select block w-full"
                >
                  <option value="">Sélectionner</option>
                  <option value="Progressif">Progressif</option>
                  <option value="Rapide">Rapide</option>
                  <option value="Difficile">Difficile</option>
                  <option value="Inexistant">Inexistant</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="coupsDeSoleil"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Coups de soleil
                </label>
                <select
                  id="coupsDeSoleil"
                  name="coupsDeSoleil"
                  value={formData.coupsDeSoleil}
                  onChange={handleChange}
                  className="form-select block w-full"
                >
                  <option value="">Sélectionner</option>
                  <option value="Jamais">Jamais</option>
                  <option value="Rarement">Rarement</option>
                  <option value="Parfois">Parfois</option>
                  <option value="Souvent">Souvent</option>
                  <option value="Toujours">Toujours</option>
                </select>
              </div>
            </div>
            <h3 className="text-md font-medium text-gray-800 mt-6 mb-3">
              Cellulite
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="celluliteBras"
                  name="celluliteBras"
                  checked={formData.celluliteBras === "Oui"}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-primary-600"
                />
                <label
                  htmlFor="celluliteBras"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Cellulite bras
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="celluliteFessesHanches"
                  name="celluliteFessesHanches"
                  checked={formData.celluliteFessesHanches === "Oui"}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-primary-600"
                />
                <label
                  htmlFor="celluliteFessesHanches"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Cellulite fesses/hanches
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="celluliteJambes"
                  name="celluliteJambes"
                  checked={formData.celluliteJambes === "Oui"}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-primary-600"
                />
                <label
                  htmlFor="celluliteJambes"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Cellulite jambes
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="celluliteVentreTaille"
                  name="celluliteVentreTaille"
                  checked={formData.celluliteVentreTaille === "Oui"}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-primary-600"
                />
                <label
                  htmlFor="celluliteVentreTaille"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Cellulite ventre/taille
                </label>
              </div>
            </div>
            <h3 className="text-md font-medium text-gray-800 mt-6 mb-3">
              Sécheresse cutanée
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="secheresseLevres"
                  name="secheresseLevres"
                  checked={formData.secheresseLevres === "Oui"}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-primary-600"
                />
                <label
                  htmlFor="secheresseLevres"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Lèvres
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="secheresseCou"
                  name="secheresseCou"
                  checked={formData.secheresseCou === "Oui"}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-primary-600"
                />
                <label
                  htmlFor="secheresseCou"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Cou
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="secheressePoitrineDecollete"
                  name="secheressePoitrineDecollete"
                  checked={formData.secheressePoitrineDecollete === "Oui"}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-primary-600"
                />
                <label
                  htmlFor="secheressePoitrineDecollete"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Poitrine/Décolleté
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="secheresseVentreTaille"
                  name="secheresseVentreTaille"
                  checked={formData.secheresseVentreTaille === "Oui"}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-primary-600"
                />
                <label
                  htmlFor="secheresseVentreTaille"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Ventre/Taille
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="secheresseFessesHanches"
                  name="secheresseFessesHanches"
                  checked={formData.secheresseFessesHanches === "Oui"}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-primary-600"
                />
                <label
                  htmlFor="secheresseFessesHanches"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Fesses/Hanches
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="secheresseBras"
                  name="secheresseBras"
                  checked={formData.secheresseBras === "Oui"}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-primary-600"
                />
                <label
                  htmlFor="secheresseBras"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Bras
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="secheresseMains"
                  name="secheresseMains"
                  checked={formData.secheresseMains === "Oui"}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-primary-600"
                />
                <label
                  htmlFor="secheresseMains"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Mains
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="secheresseJambes"
                  name="secheresseJambes"
                  checked={formData.secheresseJambes === "Oui"}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-primary-600"
                />
                <label
                  htmlFor="secheresseJambes"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Jambes
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="secheressePieds"
                  name="secheressePieds"
                  checked={formData.secheressePieds === "Oui"}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-primary-600"
                />
                <label
                  htmlFor="secheressePieds"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Pieds
                </label>
              </div>
            </div>
            <h3 className="text-md font-medium text-gray-800 mt-6 mb-3">
              Problèmes autour des yeux
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="cernesPigmentaires"
                  name="cernesPigmentaires"
                  checked={formData.cernesPigmentaires === "Oui"}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-primary-600"
                />
                <label
                  htmlFor="cernesPigmentaires"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Cernes pigmentaires
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="cernesVasculaires"
                  name="cernesVasculaires"
                  checked={formData.cernesVasculaires === "Oui"}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-primary-600"
                />
                <label
                  htmlFor="cernesVasculaires"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Cernes vasculaires
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="poches"
                  name="poches"
                  checked={formData.poches === "Oui"}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-primary-600"
                />
                <label
                  htmlFor="poches"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Poches
                </label>
              </div>
            </div>
            <h3 className="text-md font-medium text-gray-800 mt-6 mb-3">
              Perte de fermeté
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="perteDeFermeteVisage"
                  name="perteDeFermeteVisage"
                  checked={formData.perteDeFermeteVisage === "Oui"}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-primary-600"
                />
                <label
                  htmlFor="perteDeFermeteVisage"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Visage
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="perteDeFermeteCou"
                  name="perteDeFermeteCou"
                  checked={formData.perteDeFermeteCou === "Oui"}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-primary-600"
                />
                <label
                  htmlFor="perteDeFermeteCou"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Cou
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="perteDeFermeteDecollete"
                  name="perteDeFermeteDecollete"
                  checked={formData.perteDeFermeteDecollete === "Oui"}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-primary-600"
                />
                <label
                  htmlFor="perteDeFermeteDecollete"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Décolleté
                </label>
              </div>
            </div>
          </div>
        );

      case "cheveux":
        return (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Caractéristiques des cheveux
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="couleurCheveux"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Couleur des cheveux
                </label>
                <select
                  id="couleurCheveux"
                  name="couleurCheveux"
                  value={formData.couleurCheveux}
                  onChange={handleChange}
                  className="form-select block w-full"
                >
                  <option value="">Sélectionner</option>
                  <option value="Blonds">Blonds</option>
                  <option value="Bruns">Bruns</option>
                  <option value="Chatains">Châtains</option>
                  <option value="Noirs">Noirs</option>
                  <option value="Roux">Roux</option>
                  <option value="Gris">Gris</option>
                  <option value="Blancs">Blancs</option>
                  <option value="Colorés">Colorés</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="longueurCheveux"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Longueur des cheveux
                </label>
                <select
                  id="longueurCheveux"
                  name="longueurCheveux"
                  value={formData.longueurCheveux}
                  onChange={handleChange}
                  className="form-select block w-full"
                >
                  <option value="">Sélectionner</option>
                  <option value="Courts">Courts</option>
                  <option value="Mi-longs">Mi-longs</option>
                  <option value="Longs">Longs</option>
                  <option value="Très longs">Très longs</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="natureCheveux"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nature des cheveux
                </label>
                <select
                  id="natureCheveux"
                  name="natureCheveux"
                  value={formData.natureCheveux}
                  onChange={handleChange}
                  className="form-select block w-full"
                >
                  <option value="">Sélectionner</option>
                  <option value="Lisses">Lisses</option>
                  <option value="Ondulés">Ondulés</option>
                  <option value="Bouclés">Bouclés</option>
                  <option value="Crépus">Crépus</option>
                  <option value="Frisés">Frisés</option>
                  <option value="Normaux">Normaux</option>
                  <option value="Secs">Secs</option>
                  <option value="Gras">Gras</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="epaisseurCheveux"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Épaisseur des cheveux
                </label>
                <select
                  id="epaisseurCheveux"
                  name="epaisseurCheveux"
                  value={formData.epaisseurCheveux}
                  onChange={handleChange}
                  className="form-select block w-full"
                >
                  <option value="">Sélectionner</option>
                  <option value="Fins">Fins</option>
                  <option value="Moyens">Moyens</option>
                  <option value="Épais">Épais</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="natureCuirChevelu"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nature du cuir chevelu
                </label>
                <select
                  id="natureCuirChevelu"
                  name="natureCuirChevelu"
                  value={formData.natureCuirChevelu}
                  onChange={handleChange}
                  className="form-select block w-full"
                >
                  <option value="">Sélectionner</option>
                  <option value="Normal">Normal</option>
                  <option value="Sec">Sec</option>
                  <option value="Gras">Gras</option>
                  <option value="Mixte">Mixte</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="cuirCheveluSensible"
                  name="cuirCheveluSensible"
                  checked={formData.cuirCheveluSensible === "Oui"}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-primary-600"
                />
                <label
                  htmlFor="cuirCheveluSensible"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Cuir chevelu sensible
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="chuteDeCheveux"
                  name="chuteDeCheveux"
                  checked={formData.chuteDeCheveux === "Oui"}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-primary-600"
                />
                <label
                  htmlFor="chuteDeCheveux"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Chute de cheveux
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="cheveuxCassants"
                  name="cheveuxCassants"
                  checked={formData.cheveuxCassants === "Oui"}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-primary-600"
                />
                <label
                  htmlFor="cheveuxCassants"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Cheveux cassants
                </label>
              </div>
            </div>

            <h3 className="text-md font-medium text-gray-800 mt-6 mb-3">
              Ongles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="onglesCassants"
                  name="onglesCassants"
                  checked={formData.onglesCassants === "Oui"}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-primary-600"
                />
                <label
                  htmlFor="onglesCassants"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Ongles cassants
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="onglesDedoubles"
                  name="onglesDedoubles"
                  checked={formData.onglesDedoubles === "Oui"}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-primary-600"
                />
                <label
                  htmlFor="onglesDedoubles"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Ongles dédoublés
                </label>
              </div>
            </div>
          </div>
        );

      case "problemes":
        return (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Problèmes spécifiques
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="acne"
                  name="acne"
                  checked={formData.acne === "Oui"}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-primary-600"
                />
                <label
                  htmlFor="acne"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Acné
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="couperoseRosacee"
                  name="couperoseRosacee"
                  checked={formData.couperoseRosacee === "Oui"}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-primary-600"
                />
                <label
                  htmlFor="couperoseRosacee"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Couperose / Rosacée
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="dermiteSeborrheique"
                  name="dermiteSeborrheique"
                  checked={formData.dermiteSeborrheique === "Oui"}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-primary-600"
                />
                <label
                  htmlFor="dermiteSeborrheique"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Dermite séborrhéique
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="eczema"
                  name="eczema"
                  checked={formData.eczema === "Oui"}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-primary-600"
                />
                <label
                  htmlFor="eczema"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Eczéma
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="psoriasis"
                  name="psoriasis"
                  checked={formData.psoriasis === "Oui"}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-primary-600"
                />
                <label
                  htmlFor="psoriasis"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Psoriasis
                </label>
              </div>
            </div>
          </div>
        );

      case "medical":
        return (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Informations médicales
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="traitement"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Traitement en cours
                </label>
                <textarea
                  id="traitement"
                  name="traitement"
                  rows={2}
                  value={formData.traitement}
                  onChange={handleChange}
                  className="form-textarea block w-full"
                  placeholder="Traitements médicaux en cours"
                />
              </div>

              <div>
                <label
                  htmlFor="anamnese"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Anamnèse
                </label>
                <textarea
                  id="anamnese"
                  name="anamnese"
                  rows={2}
                  value={formData.anamnese}
                  onChange={handleChange}
                  className="form-textarea block w-full"
                  placeholder="Antécédents médicaux"
                />
              </div>

              <div>
                <label
                  htmlFor="contraception"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Contraception
                </label>
                <select
                  id="contraception"
                  name="contraception"
                  value={formData.contraception}
                  onChange={handleChange}
                  className="form-select block w-full"
                >
                  <option value="">Sélectionner</option>
                  <option value="Pilule">Pilule</option>
                  <option value="Stérilet">Stérilet</option>
                  <option value="Implant">Implant</option>
                  <option value="Patch">Patch</option>
                  <option value="Anneau vaginal">Anneau vaginal</option>
                  <option value="Préservatif">Préservatif</option>
                  <option value="Autre">Autre</option>
                  <option value="Aucune">Aucune</option>
                  <option value="Abstinence">Abstinence</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="menopause"
                  name="menopause"
                  checked={formData.menopause === "Oui"}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-primary-600"
                />
                <label
                  htmlFor="menopause"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Ménopause
                </label>
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="allergiesCommentaires"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Allergies connues
                </label>
                <textarea
                  id="allergiesCommentaires"
                  name="allergiesCommentaires"
                  rows={2}
                  value={formData.allergiesCommentaires}
                  onChange={handleChange}
                  className="form-textarea block w-full"
                  placeholder="Allergies connues (médicaments, aliments, autres substances)"
                />
              </div>

              <div>
                <label
                  htmlFor="santeCompatible"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Santé compatible
                </label>
                <select
                  id="santeCompatible"
                  name="santeCompatible"
                  value={formData.santeCompatible}
                  onChange={handleChange}
                  className="form-select block w-full"
                >
                  <option value="Oui">Oui</option>
                  <option value="Non">Non</option>
                </select>
              </div>
            </div>
          </div>
        );

      case "notes":
        return (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Notes et commentaires
            </h2>
            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={6}
                value={formData.notes}
                onChange={handleChange}
                className="form-textarea block w-full"
                placeholder="Commentaires, observations, études précédentes, etc."
              />
            </div>
          </div>
        );

      // 4. Ajouter un nouveau cas pour l'onglet "Cils & sourcils"
      case "cils":
        return (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Cils & sourcils
            </h2>

            <h3 className="text-md font-medium text-gray-800 mt-2 mb-3">
              Caractéristiques des cils
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="epaisseurCils"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Épaisseur des cils
                </label>
                <select
                  id="epaisseurCils"
                  name="epaisseurCils"
                  value={formData.epaisseurCils}
                  onChange={handleChange}
                  className="form-select block w-full"
                >
                  <option value="">Sélectionner</option>
                  <option value="Fins">Fins</option>
                  <option value="Moyens">Moyens</option>
                  <option value="Épais">Épais</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="longueurCils"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Longueur des cils
                </label>
                <select
                  id="longueurCils"
                  name="longueurCils"
                  value={formData.longueurCils}
                  onChange={handleChange}
                  className="form-select block w-full"
                >
                  <option value="">Sélectionner</option>
                  <option value="Courts">Courts</option>
                  <option value="Moyens">Moyens</option>
                  <option value="Longs">Longs</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="courbureCils"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Courbure des cils
                </label>
                <select
                  id="courbureCils"
                  name="courbureCils"
                  value={formData.courbureCils}
                  onChange={handleChange}
                  className="form-select block w-full"
                >
                  <option value="">Sélectionner</option>
                  <option value="Droits">Droits</option>
                  <option value="Légèrement courbés">Légèrement courbés</option>
                  <option value="Très courbés">Très courbés</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="cilsAbimes"
                  name="cilsAbimes"
                  checked={formData.cilsAbimes === "Oui"}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-primary-600"
                />
                <label
                  htmlFor="cilsAbimes"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Cils abîmés
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="cilsBroussailleux"
                  name="cilsBroussailleux"
                  checked={formData.cilsBroussailleux === "Oui"}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-primary-600"
                />
                <label
                  htmlFor="cilsBroussailleux"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Cils broussailleux
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="chuteDeCils"
                  name="chuteDeCils"
                  checked={formData.chuteDeCils === "Oui"}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-primary-600"
                />
                <label
                  htmlFor="chuteDeCils"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Chute de cils
                </label>
              </div>
            </div>

            <h3 className="text-md font-medium text-gray-800 mt-6 mb-3">
              Sourcils
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="caracteristiqueSourcils"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Caractéristiques des sourcils
                </label>
                <select
                  id="caracteristiqueSourcils"
                  name="caracteristiqueSourcils"
                  value={formData.caracteristiqueSourcils}
                  onChange={handleChange}
                  className="form-select block w-full"
                >
                  <option value="">Sélectionner</option>
                  <option value="Fins">Fins</option>
                  <option value="Moyens">Moyens</option>
                  <option value="Épais">Épais</option>
                  <option value="Clairsemés">Clairsemés</option>
                  <option value="Fournis">Fournis</option>
                </select>
              </div>
            </div>

            <h3 className="text-md font-medium text-gray-800 mt-6 mb-3">
              Lèvres
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="levres"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Type de lèvres
                </label>
                <select
                  id="levres"
                  name="levres"
                  value={formData.levres}
                  onChange={handleChange}
                  className="form-select block w-full"
                >
                  <option value="">Sélectionner</option>
                  <option value="Fines">Fines</option>
                  <option value="Moyennes">Moyennes</option>
                  <option value="Pulpeuses">Pulpeuses</option>
                  <option value="Asymétriques">Asymétriques</option>
                </select>
              </div>
            </div>
          </div>
        );

      // 5. Ajouter un nouveau cas pour l'onglet "Mesures"
      case "mesures":
        return (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Mesures et valeurs
            </h2>

            <h3 className="text-md font-medium text-gray-800 mt-2 mb-3">
              Index d'hydratation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="ihBrasDroit"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  IH Bras droit
                </label>
                <input
                  type="number"
                  step="0.01"
                  id="ihBrasDroit"
                  name="ihBrasDroit"
                  value={formData.ihBrasDroit}
                  onChange={handleChange}
                  className="form-input block w-full"
                />
              </div>

              <div>
                <label
                  htmlFor="ihBrasGauche"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  IH Bras gauche
                </label>
                <input
                  type="number"
                  step="0.01"
                  id="ihBrasGauche"
                  name="ihBrasGauche"
                  value={formData.ihBrasGauche}
                  onChange={handleChange}
                  className="form-input block w-full"
                />
              </div>
            </div>

            <h3 className="text-md font-medium text-gray-800 mt-6 mb-3">
              Scores d'évaluation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label
                  htmlFor="scorePod"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Score POD
                </label>
                <input
                  type="number"
                  step="0.1"
                  id="scorePod"
                  name="scorePod"
                  value={formData.scorePod}
                  onChange={handleChange}
                  className="form-input block w-full"
                />
              </div>

              <div>
                <label
                  htmlFor="scorePog"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Score POG
                </label>
                <input
                  type="number"
                  step="0.1"
                  id="scorePog"
                  name="scorePog"
                  value={formData.scorePog}
                  onChange={handleChange}
                  className="form-input block w-full"
                />
              </div>

              <div>
                <label
                  htmlFor="scoreFront"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Score Front
                </label>
                <input
                  type="number"
                  step="0.1"
                  id="scoreFront"
                  name="scoreFront"
                  value={formData.scoreFront}
                  onChange={handleChange}
                  className="form-input block w-full"
                />
              </div>

              <div>
                <label
                  htmlFor="scoreLion"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Score Lion
                </label>
                <input
                  type="number"
                  step="0.1"
                  id="scoreLion"
                  name="scoreLion"
                  value={formData.scoreLion}
                  onChange={handleChange}
                  className="form-input block w-full"
                />
              </div>

              <div>
                <label
                  htmlFor="scorePpd"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Score PPD
                </label>
                <input
                  type="number"
                  step="0.1"
                  id="scorePpd"
                  name="scorePpd"
                  value={formData.scorePpd}
                  onChange={handleChange}
                  className="form-input block w-full"
                />
              </div>

              <div>
                <label
                  htmlFor="scorePpg"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Score PPG
                </label>
                <input
                  type="number"
                  step="0.1"
                  id="scorePpg"
                  name="scorePpg"
                  value={formData.scorePpg}
                  onChange={handleChange}
                  className="form-input block w-full"
                />
              </div>

              <div>
                <label
                  htmlFor="scoreDod"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Score DOD
                </label>
                <input
                  type="number"
                  step="0.1"
                  id="scoreDod"
                  name="scoreDod"
                  value={formData.scoreDod}
                  onChange={handleChange}
                  className="form-input block w-full"
                />
              </div>

              <div>
                <label
                  htmlFor="scoreDog"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Score DOG
                </label>
                <input
                  type="number"
                  step="0.1"
                  id="scoreDog"
                  name="scoreDog"
                  value={formData.scoreDog}
                  onChange={handleChange}
                  className="form-input block w-full"
                />
              </div>

              <div>
                <label
                  htmlFor="scoreSngd"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Score SNGD
                </label>
                <input
                  type="number"
                  step="0.1"
                  id="scoreSngd"
                  name="scoreSngd"
                  value={formData.scoreSngd}
                  onChange={handleChange}
                  className="form-input block w-full"
                />
              </div>

              <div>
                <label
                  htmlFor="scoreSngg"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Score SNGG
                </label>
                <input
                  type="number"
                  step="0.1"
                  id="scoreSngg"
                  name="scoreSngg"
                  value={formData.scoreSngg}
                  onChange={handleChange}
                  className="form-input block w-full"
                />
              </div>

              <div>
                <label
                  htmlFor="scoreLevsup"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Score LEVSUP
                </label>
                <input
                  type="number"
                  step="0.1"
                  id="scoreLevsup"
                  name="scoreLevsup"
                  value={formData.scoreLevsup}
                  onChange={handleChange}
                  className="form-input block w-full"
                />
              </div>

              <div>
                <label
                  htmlFor="scoreComlevd"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Score COMLEVD
                </label>
                <input
                  type="number"
                  step="0.1"
                  id="scoreComlevd"
                  name="scoreComlevd"
                  value={formData.scoreComlevd}
                  onChange={handleChange}
                  className="form-input block w-full"
                />
              </div>

              <div>
                <label
                  htmlFor="scoreComlevg"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Score COMLEVG
                </label>
                <input
                  type="number"
                  step="0.1"
                  id="scoreComlevg"
                  name="scoreComlevg"
                  value={formData.scoreComlevg}
                  onChange={handleChange}
                  className="form-input block w-full"
                />
              </div>

              <div>
                <label
                  htmlFor="scorePtose"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Score PTOSE
                </label>
                <input
                  type="number"
                  step="0.1"
                  id="scorePtose"
                  name="scorePtose"
                  value={formData.scorePtose}
                  onChange={handleChange}
                  className="form-input block w-full"
                />
              </div>

              <div>
                <label
                  htmlFor="ita"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Score ITA
                </label>
                <input
                  type="number"
                  step="0.1"
                  id="ita"
                  name="ita"
                  value={formData.ita}
                  onChange={handleChange}
                  className="form-input block w-full"
                />
              </div>
            </div>

            <h3 className="text-md font-medium text-gray-800 mt-6 mb-3">
              Autres
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="nbCigarettesJour"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nombre de cigarettes par jour
                </label>
                <input
                  type="text"
                  id="nbCigarettesJour"
                  name="nbCigarettesJour"
                  value={formData.nbCigarettesJour}
                  onChange={handleChange}
                  className="form-input block w-full"
                />
              </div>
            </div>
          </div>
        );

      // 3. Ajouter un nouveau cas pour l'onglet "Marques cutanées"
      case "marques-cutanees":
        return (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Marques cutanées
            </h2>

            <h3 className="text-md font-medium text-gray-800 mt-6 mb-3">
              Caractéristiques
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="cicatrices"
                  name="cicatrices"
                  checked={formData.cicatrices === "Oui"}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-primary-600"
                />
                <label
                  htmlFor="cicatrices"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Cicatrices
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="tatouages"
                  name="tatouages"
                  checked={formData.tatouages === "Oui"}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-primary-600"
                />
                <label
                  htmlFor="tatouages"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Tatouages
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="piercings"
                  name="piercings"
                  checked={formData.piercings === "Oui"}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-primary-600"
                />
                <label
                  htmlFor="piercings"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Piercings
                </label>
              </div>
            </div>

            <h3 className="text-md font-medium text-gray-800 mt-6 mb-3">
              Taches pigmentaires
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="tachesPigmentairesVisage"
                  name="tachesPigmentairesVisage"
                  checked={formData.tachesPigmentairesVisage === "Oui"}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-primary-600"
                />
                <label
                  htmlFor="tachesPigmentairesVisage"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Visage
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="tachesPigmentairesCou"
                  name="tachesPigmentairesCou"
                  checked={formData.tachesPigmentairesCou === "Oui"}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-primary-600"
                />
                <label
                  htmlFor="tachesPigmentairesCou"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Cou
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="tachesPigmentairesDecollete"
                  name="tachesPigmentairesDecollete"
                  checked={formData.tachesPigmentairesDecollete === "Oui"}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-primary-600"
                />
                <label
                  htmlFor="tachesPigmentairesDecollete"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Décolleté
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="tachesPigmentairesMains"
                  name="tachesPigmentairesMains"
                  checked={formData.tachesPigmentairesMains === "Oui"}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-primary-600"
                />
                <label
                  htmlFor="tachesPigmentairesMains"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Mains
                </label>
              </div>
            </div>

            <h3 className="text-md font-medium text-gray-800 mt-6 mb-3">
              Vergetures
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="vergeturesJambes"
                  name="vergeturesJambes"
                  checked={formData.vergeturesJambes === "Oui"}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-primary-600"
                />
                <label
                  htmlFor="vergeturesJambes"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Jambes
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="vergeturesFessesHanches"
                  name="vergeturesFessesHanches"
                  checked={formData.vergeturesFessesHanches === "Oui"}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-primary-600"
                />
                <label
                  htmlFor="vergeturesFessesHanches"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Fesses/Hanches
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="vergeturesVentreTaille"
                  name="vergeturesVentreTaille"
                  checked={formData.vergeturesVentreTaille === "Oui"}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-primary-600"
                />
                <label
                  htmlFor="vergeturesVentreTaille"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Ventre/Taille
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="vergeturesPoitrineDecollete"
                  name="vergeturesPoitrineDecollete"
                  checked={formData.vergeturesPoitrineDecollete === "Oui"}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-primary-600"
                />
                <label
                  htmlFor="vergeturesPoitrineDecollete"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Poitrine/Décolleté
                </label>
              </div>
            </div>
          </div>
        );

      // Améliorer l'onglet RIB avec validation en temps réel
      case "RIB":
        return (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Informations bancaires (RIB)
            </h2>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <strong>Informations optionnelles</strong> - Ces informations ne sont pas obligatoires.
                    Elles peuvent être utiles pour les remboursements ou paiements éventuels.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="iban"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  IBAN
                </label>
                <input
                  type="text"
                  id="iban"
                  name="iban"
                  value={formData.iban}
                  onChange={(e) => {
                    // Formatage automatique de l'IBAN pendant la saisie
                    const formatted = infoBancaireService.validation.formatIban(e.target.value);
                    handleChange({
                      target: {
                        name: 'iban',
                        value: formatted
                      }
                    });
                  }}
                  className={`form-input block w-full ${errors.iban ? "border-red-500" : ""}`}
                  placeholder="FR76 1234 5678 9012 3456 7890 123"
                  maxLength="34"
                />
                {errors.iban && (
                  <p className="mt-1 text-sm text-red-500">{errors.iban}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Format français : FR + 2 chiffres de contrôle + 23 caractères
                </p>
              </div>

              <div>
                <label
                  htmlFor="bic"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  BIC / Code SWIFT
                </label>
                <input
                  type="text"
                  id="bic"
                  name="bic"
                  value={formData.bic}
                  onChange={(e) => {
                    // Formatage automatique du BIC
                    const formatted = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                    handleChange({
                      target: {
                        name: 'bic',
                        value: formatted
                      }
                    });
                  }}
                  className={`form-input block w-full ${errors.bic ? "border-red-500" : ""}`}
                  placeholder="BREDFRPPXXX"
                  maxLength="11"
                />
                {errors.bic && (
                  <p className="mt-1 text-sm text-red-500">{errors.bic}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  8 ou 11 caractères alphanumériques
                </p>
              </div>
            </div>

            {/* Section d'aide avec les codes BIC courants */}
            <div className="mt-6">
              <h3 className="text-md font-medium text-gray-800 mb-3">
                Codes BIC des principales banques françaises
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                {infoBancaireService.getCommonFrenchBicCodes().map((bank, index) => (
                  <div key={index} className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="font-medium">{bank.name}</span>
                    <span className="text-gray-600">{bank.code}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Messages d'aide */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">À propos de l'IBAN</h4>
                <p className="text-sm text-gray-600">
                  {infoBancaireService.getHelpMessages().iban.help}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {infoBancaireService.getHelpMessages().iban.where}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">À propos du BIC</h4>
                <p className="text-sm text-gray-600">
                  {infoBancaireService.getHelpMessages().bic.help}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {infoBancaireService.getHelpMessages().bic.where}
                </p>
              </div>
            </div>
          </div>
        )

      case "evaluation":
        return (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Évaluation du volontaire
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Évaluation par étoiles
                </label>

                {/* Système d'étoiles */}
                <div className="flex items-center space-x-1 mb-2">
                  {[1, 2, 3].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleChange({
                        target: {
                          name: 'evaluation',
                          value: star === parseInt(formData.evaluation) ? 0 : star
                        }
                      })}
                      className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-sm transition-all duration-150 hover:scale-110"
                      aria-label={`${star} étoile${star > 1 ? 's' : ''}`}
                    >
                      <svg
                        className={`w-8 h-8 transition-colors duration-200 ${star <= parseInt(formData.evaluation || 0)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300 hover:text-yellow-200'
                          }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}

                  <span className="ml-3 text-sm text-gray-600">
                    {parseInt(formData.evaluation || 0)}/3
                  </span>
                </div>

                {/* Bouton pour réinitialiser */}
                <button
                  type="button"
                  onClick={() => handleChange({
                    target: {
                      name: 'evaluation',
                      value: 0
                    }
                  })}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Réinitialiser l'évaluation
                </button>

                {errors.evaluation && (
                  <p className="mt-1 text-sm text-red-500">{errors.evaluation}</p>
                )}

                {/* Affichage pour debug */}
                <div className="mt-4 p-3 bg-gray-50 rounded border">
                  <p className="text-sm text-gray-600">
                    <strong>Valeur actuelle :</strong> {parseInt(formData.evaluation || 0)} étoile{parseInt(formData.evaluation || 0) > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Link
          to="/volontaires"
          className="text-gray-500 hover:text-primary-600"
        >
          Volontaires
        </Link>
        <ChevronRightIcon
          className="mx-2 text-gray-400"
          width={16}
          height={16}
        />
        <span className="font-medium">
          {isEditMode
            ? `Modifier ${formData.prenom} ${formData.nom}`
            : "Nouveau volontaire"}
        </span>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            {isEditMode ? "Modifier le volontaire" : "Ajouter un volontaire"}
          </h1>

          {formError && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <p className="text-red-700">{formError}</p>
            </div>
          )}

          {formSuccess && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
              <p className="text-green-700">{formSuccess}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Onglets pour la navigation */}
            <FormTabs activeTab={activeTab} setActiveTab={setActiveTab} />

            {/* Contenu de l'onglet actif */}
            {renderFormSection()}

            {/* Boutons de formulaire */}
            <div className="flex justify-end space-x-3">
              <Link
                to={isEditMode ? `/volontaires/${id}` : "/volontaires"}
                className="btn btn-outline"
              >
                Annuler
              </Link>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <span className="animate-spin inline-block h-4 w-4 border-t-2 border-b-2 border-white rounded-full mr-2"></span>
                    Enregistrement...
                  </>
                ) : (
                  "Enregistrer"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VolontaireForm;
