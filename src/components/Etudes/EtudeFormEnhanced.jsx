import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import etudeService from "../../services/etudeService";
import IndemniteManager from "./IndemniteManager.jsx"; // Import du nouveau composant

const EtudeFormEnhanced = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  // États principaux
  const [formData, setFormData] = useState({
    ref: "",
    titre: "",
    description: "",
    examens: "",
    type: "",
    dateDebut: "",
    dateFin: "",
    paye: false,
    montant: 0,
    capaciteVolontaires: 0,
    indemniteParDefaut: 0,
    groupesIndemnites: [],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [refExists, setRefExists] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  // Chargement initial des données
  useEffect(() => {
    const fetchEtude = async () => {
      if (!isEditMode) return;

      try {
        setIsLoading(true);
        const data = await etudeService.getById(id);

        setFormData({
          idEtude: data.idEtude,
          ref: data.ref || "",
          titre: data.titre || "",
          description: data.commentaires || "",
          type: data.type || "",
          dateDebut: data.dateDebut ? data.dateDebut.substring(0, 10) : "",
          dateFin: data.dateFin ? data.dateFin.substring(0, 10) : "",
          paye: data.paye === 2 || data.paye === true,
          montant: data.iv || 0,
          capaciteVolontaires: data.capaciteVolontaires || 0,
          examens: data.examens || "",
          washout: data.washout || "",
          indemniteParDefaut: data.iv || 0,
          groupesIndemnites: [],
        });
      } catch (error) {
        console.error("Erreur lors du chargement de l'étude:", error);
        setError("Erreur lors du chargement des données de l'étude");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEtude();
  }, [id, isEditMode]);

  // Gestionnaires d'événements
  const handleChange = useCallback(
    (e) => {
      const { name, value, type, checked } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));

      if (name === "ref" && value && !isEditMode) {
        etudeService
          .checkRefExists(value)
          .then(setRefExists)
          .catch(console.error);
      }
    },
    [isEditMode]
  );

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!isEditMode && refExists) {
        setError("Cette référence d'étude existe déjà");
        return;
      }

      const etudeDTO = {
        ...formData,
        paye: formData.paye ? 1 : 0,
      };

      try {
        setIsSaving(true);
        setError("");

        if (isEditMode) {
          await etudeService.update(id, etudeDTO);
        } else {
          const nouvelleEtude = await etudeService.create(etudeDTO);
          navigate(`/etudes/${nouvelleEtude.idEtude}/edit`);
        }
      } catch (error) {
        console.error("Erreur lors de l'enregistrement de l'étude:", error);
        setError("Erreur lors de l'enregistrement de l'étude");
      } finally {
        setIsSaving(false);
      }
    },
    [formData, isEditMode, refExists, id, navigate]
  );

  // Gestionnaire d'erreur pour le composant IndemniteManager
  const handleIndemniteError = useCallback((errorMessage) => {
    setError(errorMessage);
  }, []);

  // Affichage du loading
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            {isEditMode ? "Modifier l'étude" : "Créer une nouvelle étude"}
          </h1>
          {isEditMode && (
            <span
              className={`ml-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                formData.paye
                  ? "bg-green-100 text-green-800 border border-green-500"
                  : "bg-red-100 text-red-800 border border-red-500"
              }`}
            >
              {formData.paye ? "Rémunérée" : "Non rémunérée"}
            </span>
          )}
        </div>
      </div>

      {/* Messages d'erreur */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
          <button
            onClick={() => setError("")}
            className="absolute top-0 right-0 mt-2 mr-2 text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Onglets pour le mode édition */}
      {isEditMode && (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === "details"
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setActiveTab("details")}
              >
                Détails de l'étude
              </button>
              <button
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === "indemnites"
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setActiveTab("indemnites")}
              >
                Gestion des indemnités
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Contenu des onglets */}
      {(!isEditMode || activeTab === "details") && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Référence */}
            <div>
              <label htmlFor="ref" className="form-label">
                Référence *
              </label>
              <input
                type="text"
                id="ref"
                name="ref"
                value={formData.ref}
                onChange={handleChange}
                className={`form-input ${refExists ? "border-red-500" : ""}`}
                required
                disabled={isEditMode}
              />
              {refExists && (
                <p className="mt-1 text-sm text-red-600">
                  Cette référence existe déjà
                </p>
              )}
            </div>

            {/* Titre */}
            <div>
              <label htmlFor="titre" className="form-label">
                Titre *
              </label>
              <input
                type="text"
                id="titre"
                name="titre"
                value={formData.titre}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label htmlFor="description" className="form-label">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="form-input min-h-[100px]"
                rows={4}
              />
            </div>

            {/* Examens */}
            <div className="md:col-span-2">
              <label htmlFor="examens" className="form-label">
                Examens
              </label>
              <textarea
                id="examens"
                name="examens"
                value={formData.examens}
                onChange={handleChange}
                className="form-input min-h-[100px]"
                rows={4}
              />
            </div>

            {/* Type d'étude */}
            <div>
              <label htmlFor="type" className="form-label">
                Type d'étude *
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="form-input"
                required
              >
                <option value="">Sélectionner</option>
                <option value="USAGE">Usage</option>
                <option value="EFFICACITE MAQUILLAGE">Efficacité Maquillage</option>
                <option value="EFFICACITE SOIN">Efficacité Soin</option>
                <option value="DTM">DTM</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>

            {/* Capacité */}
            <div>
              <label htmlFor="capaciteVolontaires" className="form-label">
                Capacité (nombre de volontaires) *
              </label>
              <input
                type="number"
                id="capaciteVolontaires"
                name="capaciteVolontaires"
                value={formData.capaciteVolontaires}
                onChange={handleChange}
                className="form-input"
                min={0}
                required
              />
            </div>

            {/* Date de début */}
            <div>
              <label htmlFor="dateDebut" className="form-label">
                Date de début *
              </label>
              <input
                type="date"
                id="dateDebut"
                name="dateDebut"
                value={formData.dateDebut}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            {/* Date de fin */}
            <div>
              <label htmlFor="dateFin" className="form-label">
                Date de fin *
              </label>
              <input
                type="date"
                id="dateFin"
                name="dateFin"
                value={formData.dateFin}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            {/* Étude rémunérée */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="paye"
                name="paye"
                checked={formData.paye}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label
                htmlFor="paye"
                className="ml-2 block text-sm text-gray-700"
              >
                Étude rémunérée
              </label>
            </div>

            {/* Montant */}
            {formData.paye && (
              <div>
                <label htmlFor="montant" className="form-label">
                  Montant (€)
                </label>
                <input
                  type="number"
                  id="montant"
                  name="montant"
                  value={formData.montant}
                  onChange={handleChange}
                  className="form-input"
                  min={0}
                  step={0.01}
                />
              </div>
            )}
          </div>

          {/* Boutons d'action */}
          <div className="mt-8 flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate("/etudes")}
              className="btn btn-outline"
              disabled={isSaving}
            >
              {isEditMode ? "Retour aux études" : "Annuler"}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSaving || (refExists && !isEditMode)}
            >
              {isSaving ? (
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Enregistrement...
                </span>
              ) : (
                isEditMode ? "Enregistrer l'étude" : "Créer l'étude"
              )}
            </button>
          </div>
        </form>
      )}

      {/* Onglet indemnités - Utilise le nouveau composant */}
      {isEditMode && activeTab === "indemnites" && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <IndemniteManager
            etudeId={id}
            etudeTitre={formData.titre}
            etudeRef={formData.ref}
            onError={handleIndemniteError}
            showDebugInfo={true}
          />

          {/* Bouton pour retourner aux études */}
          <div className="mt-8 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <span className="font-medium">💡 Info :</span> Les modifications des volontaires sont sauvegardées automatiquement.
            </div>
            <button
              type="button"
              onClick={() => navigate("/etudes")}
              className="btn btn-outline"
            >
              Retour aux études
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EtudeFormEnhanced;