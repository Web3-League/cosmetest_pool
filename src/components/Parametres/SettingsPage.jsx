import { useState, useEffect } from "react";
import parametreService from "../../services/parametreService";

const SettingsPage = () => {
    const [parametres, setParametres] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    
    // États pour les modales/sections
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedParametre, setSelectedParametre] = useState(null);
    
    // États pour le formulaire
    const [formData, setFormData] = useState({
        identifiant: '',
        description: '',
        role: '',
        login: '',
        email: '',
        mdp: ''
    });
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => {
        fetchParametres();
    }, []);

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

    const handleDelete = async (id) => {
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

    const handleEdit = async (id) => {
        try {
            const parametre = await parametreService.getParametreById(id);
            setSelectedParametre(parametre);
            setFormData({
                identifiant: parametre.identifiant || '',
                description: parametre.description || '',
                role: parametre.role || '',
                login: parametre.login || '',
                email: parametre.email || '',
                mdp: ''
            });
            setShowEditForm(true);
        } catch (err) {
            setError("Erreur lors de la récupération : " + err.message);
        }
    };

    const handleCreate = () => {
        setFormData({
            identifiant: '',
            description: '',
            role: '',
            login: '',
            email: '',
            mdp: ''
        });
        setSelectedParametre(null);
        setShowCreateForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        
        try {
            if (selectedParametre) {
                // Modification
                await parametreService.updateParametres(selectedParametre.idIdentifiant, formData);
                setSuccess("Paramètre modifié avec succès.");
                setShowEditForm(false);
            } else {
                // Création
                await parametreService.createParametre(formData);
                setSuccess("Paramètre créé avec succès.");
                setShowCreateForm(false);
            }
            
            await fetchParametres();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError("Erreur lors de l'enregistrement : " + err.message);
        } finally {
            setFormLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const closeModals = () => {
        setShowCreateForm(false);
        setShowEditForm(false);
        setShowViewModal(false);
        setSelectedParametre(null);
        setFormData({
            identifiant: '',
            description: '',
            role: '',
            login: '',
            email: '',
            mdp: ''
        });
    };

    // Composant Modal
    const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
        if (!isOpen) return null;

        const sizeClasses = {
            sm: "max-w-md",
            md: "max-w-lg",
            lg: "max-w-2xl",
            xl: "max-w-4xl"
        };

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className={`bg-white rounded-lg shadow-xl ${sizeClasses[size]} w-full max-h-[90vh] overflow-auto`}>
                    <div className="flex justify-between items-center p-6 border-b">
                        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 text-2xl"
                        >
                            ×
                        </button>
                    </div>
                    <div className="p-6">
                        {children}
                    </div>
                </div>
            </div>
        );
    };

    // Composant Formulaire
    const ParametreForm = ({ onSubmit, isLoading }) => (
        <form onSubmit={onSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Identifiant *
                </label>
                <input
                    type="text"
                    name="identifiant"
                    value={formData.identifiant}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                </label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rôle
                </label>
                <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Sélectionner un rôle</option>
                    <option value="admin">Administrateur</option>
                    <option value="user">Utilisateur</option>
                    <option value="moderator">Modérateur</option>
                </select>
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Login
                </label>
                <input
                    type="text"
                    name="login"
                    value={formData.login}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                </label>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {selectedParametre ? "Nouveau mot de passe (optionnel)" : "Mot de passe *"}
                </label>
                <input
                    type="password"
                    name="mdp"
                    value={formData.mdp}
                    onChange={handleInputChange}
                    required={!selectedParametre}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    onClick={closeModals}
                    className="flex-1 py-2 px-4 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                    Annuler
                </button>
            </div>
        </form>
    );

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
                <button
                    onClick={handleCreate}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nouveau paramètre
                </button>
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
                    <button
                        onClick={handleCreate}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Créer un paramètre
                    </button>
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
                                        {parametre.role}
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
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modales */}
            <Modal
                isOpen={showCreateForm}
                onClose={closeModals}
                title="Créer un nouveau paramètre"
                size="md"
            >
                <ParametreForm onSubmit={handleSubmit} isLoading={formLoading} />
            </Modal>

            <Modal
                isOpen={showEditForm}
                onClose={closeModals}
                title="Modifier le paramètre"
                size="md"
            >
                <ParametreForm onSubmit={handleSubmit} isLoading={formLoading} />
            </Modal>

            <Modal
                isOpen={showViewModal}
                onClose={closeModals}
                title="Détails du paramètre"
                size="lg"
            >
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
                                <p className="text-gray-900">{selectedParametre.role || 'Non défini'}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Login</label>
                                <p className="text-gray-900">{selectedParametre.login || 'Non défini'}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <p className="text-gray-900">{selectedParametre.email || 'Non défini'}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date de création</label>
                                <p className="text-gray-900">{selectedParametre.createdAt ? new Date(selectedParametre.createdAt).toLocaleDateString('fr-FR') : 'Non disponible'}</p>
                            </div>
                        </div>
                        <div className="pt-4 border-t">
                            <button
                                onClick={() => {
                                    setShowViewModal(false);
                                    handleEdit(selectedParametre.idIdentifiant);
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mr-2"
                            >
                                Modifier
                            </button>
                            <button
                                onClick={closeModals}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default SettingsPage;