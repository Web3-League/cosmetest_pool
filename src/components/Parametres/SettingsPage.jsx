import { useState, useEffect, useContext, memo } from "react";
import parametreService from "../../services/parametreService";
import { AuthContext } from "../../context/AuthContext";

// ===============================
// FORMULAIRE COMPLÈTEMENT ISOLÉ
// ===============================
const IsolatedParametreForm = memo(({ onSubmit, isLoading, initialData, selectedParametre, onClose }) => {
    // STATE INTERNE - complètement isolé
    const [localData, setLocalData] = useState({
        identifiant: '',
        description: '',
        role: '',
        login: '',
        mailIdentifiant: '',
        mdpIdentifiant: ''
    });

    // Initialiser SEULEMENT au premier rendu
    useEffect(() => {
        if (initialData) {
            const dataWithSyncedLogin = {
                ...initialData,
                login: initialData.identifiant || initialData.login || '' // Login = identifiant
            };
            setLocalData(dataWithSyncedLogin);
            console.log('🔄 Initialisation avec login synchronisé:', dataWithSyncedLogin);
        }
    }, [initialData]);

    // Fonction de changement LOCALE
    const handleLocalChange = (e) => {
        const { name, value } = e.target;
        console.log(`🔄 LOCAL: ${name} = "${value}"`);
        
        setLocalData(prev => {
            const newData = {
                ...prev,
                [name]: value
            };
            
            // Synchroniser login avec identifiant
            if (name === 'identifiant') {
                newData.login = value;
                console.log(`🔗 AUTO-SYNC: login = "${value}"`);
            }
            
            return newData;
        });
    };

    // Soumission avec données locales
    const handleLocalSubmit = (e) => {
        e.preventDefault();
        onSubmit(localData);
    };

    console.log('🎯 IsolatedParametreForm render - LOCAL DATA:', localData);

    return (
        <form onSubmit={handleLocalSubmit} className="space-y-4" autoComplete="off">
            <input type="text" name="fakeusernameremembered" style={{display: 'none'}} />
            <input type="password" name="fakepasswordremembered" style={{display: 'none'}} />
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Identifiant *
                </label>
                <input
                    type="text"
                    name="identifiant"
                    value={localData.identifiant}
                    onChange={handleLocalChange}
                    required
                    disabled={isLoading}
                    autoComplete="off"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Le login sera automatiquement identique à cet identifiant</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                </label>
                <textarea
                    name="description"
                    value={localData.description}
                    onChange={handleLocalChange}
                    rows={3}
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rôle
                </label>
                <select
                    name="role"
                    value={localData.role}
                    onChange={handleLocalChange}
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                    <option value="">Sélectionner un rôle</option>
                    <option value="2">Administrateur</option>
                    <option value="1">Utilisateur</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Login (automatique)
                </label>
                <input
                    type="text"
                    name="login"
                    value={localData.login}
                    readOnly
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                    placeholder="Sera identique à l'identifiant"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                </label>
                <input
                    type="email"
                    name="mailIdentifiant"
                    value={localData.mailIdentifiant}
                    onChange={handleLocalChange}
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {selectedParametre ? "Nouveau mot de passe (optionnel)" : "Mot de passe *"}
                </label>
                <input
                    type="password"
                    name="mdpIdentifiant"
                    value={localData.mdpIdentifiant}
                    onChange={handleLocalChange}
                    required={!selectedParametre}
                    disabled={isLoading}
                    autoComplete="new-password"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    data-lpignore="true"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
            </div>

            <div className="flex gap-3 pt-4">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? "Enregistrement..." : (selectedParametre ? "Modifier" : "Créer")}
                </button>
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isLoading}
                    className="flex-1 py-2 px-4 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Annuler
                </button>
            </div>
        </form>
    );
});

IsolatedParametreForm.displayName = 'IsolatedParametreForm';

// ===============================
// COMPOSANT PRINCIPAL SIMPLIFIÉ  
// ===============================
const SettingsPage = () => {
    const [parametres, setParametres] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // États pour les modales
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedParametre, setSelectedParametre] = useState(null);
    const [formLoading, setFormLoading] = useState(false);

    // Données initiales pour le formulaire
    const [initialFormData, setInitialFormData] = useState({
        identifiant: '',
        description: '',
        role: '',
        login: '',
        mailIdentifiant: '',
        mdpIdentifiant: ''
    });

    const auth = useContext(AuthContext);

    const fetchParametres = async () => {
        try {
            setLoading(true);
            const data = await parametreService.getParametres();
            setParametres(data || []);
            setError(null);
        } catch (err) {
            setError('Erreur lors du chargement des données: ' + err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchParametres();
    }, []);

    // Soumission - reçoit les données du formulaire isolé
    const handleSubmit = async (formData) => {
        console.log('📤 Soumission avec:', formData);
        
        if (!auth.hasPermission(2)) {
            setError("Vous n'avez pas la permission de créer ou modifier des paramètres.");
            return;
        }

        // Validation côté client
        if (!formData.identifiant.trim()) {
            setError("L'identifiant est obligatoire.");
            return;
        }

        if (!selectedParametre && !formData.mdpIdentifiant.trim()) {
            setError("Le mot de passe est obligatoire pour un nouveau paramètre.");
            return;
        }

        setFormLoading(true);

        try {
            if (selectedParametre) {
                console.log('🔄 Modification paramètre:', selectedParametre.idIdentifiant);
                await parametreService.updateParametres(selectedParametre.idIdentifiant, formData);
                setSuccess("Paramètre modifié avec succès.");
                setShowEditForm(false);
            } else {
                console.log('🆕 Création nouveau paramètre avec données:', formData);
                await parametreService.createParametre(formData);
                setSuccess("Paramètre créé avec succès.");
                setShowCreateForm(false);
            }

            await fetchParametres();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('❌ Erreur lors de la soumission:', err);
            
            // Affichage d'erreur plus détaillé
            if (err.response?.status === 500) {
                setError(`Erreur serveur (500): ${err.response?.data?.message || 'Erreur interne du serveur. Vérifiez les logs côté serveur.'}`);
            } else if (err.response?.status === 400) {
                setError(`Données invalides (400): ${err.response?.data?.message || 'Vérifiez les données saisies.'}`);
            } else {
                setError(`Erreur lors de l'enregistrement: ${err.message}`);
            }
        } finally {
            setFormLoading(false);
        }
    };

    const closeModals = () => {
        console.log('🔒 Fermeture modales');
        setShowCreateForm(false);
        setShowEditForm(false);
        setShowViewModal(false);
        setSelectedParametre(null);
        setFormLoading(false);
        setInitialFormData({
            identifiant: '',
            description: '',
            role: '',
            login: '', // Login sera automatiquement synchronisé
            mailIdentifiant: '',
            mdpIdentifiant: ''
        });
    };

    const handleCreate = () => {
        console.log('🆕 Nouveau paramètre');
        if (!auth.hasPermission(2)) {
            setError("Vous n'avez pas la permission de créer des paramètres.");
            return;
        }

        setSelectedParametre(null);
        setInitialFormData({
            identifiant: '',
            description: '',
            role: '',
            login: '', // Sera automatiquement rempli quand identifiant sera saisi
            mailIdentifiant: '',
            mdpIdentifiant: ''
        });
        setShowCreateForm(true);
    };

    const handleEdit = async (id) => {
        console.log('✏️ Edition:', id);
        if (!auth.hasPermission(2)) {
            setError("Vous n'avez pas la permission de modifier des paramètres.");
            return;
        }

        try {
            const parametre = await parametreService.getParametreById(id);
            setSelectedParametre(parametre);
            setInitialFormData({
                identifiant: parametre.identifiant || '',
                description: parametre.description || '',
                role: parametre.role || '',
                login: parametre.identifiant || '', // Login = identifiant
                mailIdentifiant: parametre.mailIdentifiant || '',
                mdpIdentifiant: ''
            });
            setShowEditForm(true);
        } catch (err) {
            setError("Erreur lors de la récupération : " + err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!auth.hasPermission(2)) {
            setError("Vous n'avez pas la permission de supprimer des paramètres.");
            return;
        }
        if (!window.confirm("Voulez-vous vraiment supprimer ce paramètre ?")) return;

        try {
            await parametreService.deleteParametre(id);
            setParametres(prev => prev.filter(p => p.idIdentifiant !== id));
            setSuccess("Paramètre supprimé avec succès.");
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError("Erreur lors de la suppression : " + err.message);
        }
    };

    const handleView = async (id) => {
        try {
            const parametre = await parametreService.getParametreById(id);
            setSelectedParametre(parametre);
            setShowViewModal(true);
        } catch (err) {
            setError("Erreur lors de la récupération : " + err.message);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div
                    className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"
                    role="status"
                    aria-label="Chargement en cours"
                ></div>
                <p className="ml-3 text-gray-600">Chargement...</p>
            </div>
        );
    }

    return (
        <div className="content max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Paramètres</h1>

                {auth.hasPermission(2) && (
                    <button
                        onClick={handleCreate}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Nouveau paramètre
                    </button>
                )}
            </div>

            {/* Messages de succès/erreur */}
            {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {success}
                </div>
            )}

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {error}
                    <button
                        onClick={() => setError(null)}
                        className="ml-auto text-red-500 hover:text-red-700"
                        type="button"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Liste des paramètres */}
            {parametres.length === 0 ? (
                <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun paramètre trouvé</h3>
                    <p className="text-gray-500 mb-4">Commencez par créer votre premier paramètre.</p>
                    {auth.hasPermission(2) && (
                        <button
                            onClick={handleCreate}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Créer un paramètre
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {parametres.map((parametre) => (
                        <div
                            key={parametre.idIdentifiant}
                            className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <h2 className="text-lg font-semibold text-gray-800 line-clamp-2">
                                    {parametre.identifiant}
                                </h2>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    ID: {parametre.idIdentifiant}
                                </span>
                            </div>

                            {parametre.description && (
                                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                                    {parametre.description}
                                </p>
                            )}

                            {parametre.role && (
                                <div className="mb-4">
                                    <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                        {parametre.role === "2" ? "Administrateur" : 
                                         parametre.role === "1" ? "Utilisateur" : 
                                         parametre.role}
                                    </span>
                                </div>
                            )}

                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={() => handleView(parametre.idIdentifiant)}
                                    className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                                    title="Voir les détails"
                                >
                                    Voir
                                </button>
                                {auth.hasPermission(2) && (
                                    <>
                                        <button
                                            onClick={() => handleEdit(parametre.idIdentifiant)}
                                            className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                            title="Modifier le paramètre"
                                        >
                                            Modifier
                                        </button>
                                        <button
                                            onClick={() => handleDelete(parametre.idIdentifiant)}
                                            className="px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                            title="Supprimer le paramètre"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODALES AVEC FORMULAIRE ISOLÉ */}
            {showCreateForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h2 className="text-xl font-semibold text-gray-800">Créer un nouveau paramètre</h2>
                            <button
                                onClick={closeModals}
                                className="text-gray-400 hover:text-gray-600 text-2xl"
                                type="button"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-6">
                            <IsolatedParametreForm 
                                key="create-isolated"
                                onSubmit={handleSubmit} 
                                isLoading={formLoading}
                                initialData={initialFormData}
                                selectedParametre={null}
                                onClose={closeModals}
                            />
                        </div>
                    </div>
                </div>
            )}

            {showEditForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h2 className="text-xl font-semibold text-gray-800">Modifier le paramètre</h2>
                            <button
                                onClick={closeModals}
                                className="text-gray-400 hover:text-gray-600 text-2xl"
                                type="button"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-6">
                            <IsolatedParametreForm 
                                key={`edit-isolated-${selectedParametre?.idIdentifiant}`}
                                onSubmit={handleSubmit} 
                                isLoading={formLoading}
                                initialData={initialFormData}
                                selectedParametre={selectedParametre}
                                onClose={closeModals}
                            />
                        </div>
                    </div>
                </div>
            )}
            
            {showViewModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h2 className="text-xl font-semibold text-gray-800">Détails du paramètre</h2>
                            <button
                                onClick={closeModals}
                                className="text-gray-400 hover:text-gray-600 text-2xl"
                                type="button"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-6">
                            {selectedParametre && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                                            <p className="text-gray-900">{selectedParametre.idIdentifiant}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Identifiant</label>
                                            <p className="text-gray-900">{selectedParametre.identifiant}</p>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                            <p className="text-gray-900">{selectedParametre.description || 'Aucune description'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                                            <p className="text-gray-900">
                                                {selectedParametre.role === "2" ? "Administrateur" : 
                                                 selectedParametre.role === "1" ? "Utilisateur" : 
                                                 selectedParametre.role || 'Non défini'}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Login</label>
                                            <p className="text-gray-900">{selectedParametre.login || 'Non défini'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                            <p className="text-gray-900">{selectedParametre.mailIdentifiant || 'Non défini'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Date de création</label>
                                            <p className="text-gray-900">{selectedParametre.createdAt ? new Date(selectedParametre.createdAt).toLocaleDateString('fr-FR') : 'Non disponible'}</p>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t">
                                        {auth.hasPermission(2) && (
                                            <button
                                                onClick={() => {
                                                    setShowViewModal(false);
                                                    handleEdit(selectedParametre.idIdentifiant);
                                                }}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mr-2"
                                            >
                                                Modifier
                                            </button>
                                        )}
                                        <button
                                            onClick={closeModals}
                                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                                        >
                                            Fermer
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsPage;