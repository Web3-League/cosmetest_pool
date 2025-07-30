import { useState, useEffect } from "react";
import authService from "../../services/authService";
import parametreService from "../../services/parametreService";

const ProfilePage = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    
    const [formData, setFormData] = useState({
        identifiant: '',
        description: '',
        mdpIdentifiant: '',
        confirmMdp: ''
    });

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            setLoading(true);
            const userData = await authService.getCurrentUser();
            console.log('Données utilisateur récupérées:', userData); // Debug
            
            if (userData) {
                // Extraire le rôle depuis le tableau roles
                const userRole = userData.roles?.[0]?.authority;
                const roleMapping = {
                    'ROLE_1': 'Recruteur',
                    'ROLE_2': 'Admin'
                };
                
                // Essayer de récupérer les données complètes via l'API identifiants
                let fullUserData = null;
                try {
                    fullUserData = await parametreService.getParametreByLogin(userData.login);
                    console.log('Données complètes récupérées:', fullUserData);
                } catch (err) {
                    console.log('Impossible de récupérer les données complètes:', err.message);
                }
                
                // Enrichir les données utilisateur
                const enrichedUser = {
                    login: userData.login,
                    role: roleMapping[userRole] || userRole,
                    roles: userData.roles,
                    // Données du profil complet si disponibles
                    ...(fullUserData && {
                        identifiant: fullUserData.identifiant,
                        description: fullUserData.description,
                        mailIdentifiant: fullUserData.mailIdentifiant,
                        idIdentifiant: fullUserData.idIdentifiant
                    })
                };
                
                setUser(enrichedUser);
                setFormData({
                    identifiant: enrichedUser.identifiant || enrichedUser.login || '',
                    description: enrichedUser.description || '',
                    mdpIdentifiant: '',
                    confirmMdp: ''
                });
            }
            setError(null);
        } catch (err) {
            setError('Erreur lors du chargement du profil: ' + err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleEdit = () => {
        setEditing(true);
        setError(null);
        setSuccess(null);
    };

    const handleCancel = () => {
        setEditing(false);
        if (user) {
            setFormData({
                identifiant: user.identifiant || user.login || '',
                description: user.description || '',
                mdpIdentifiant: '',
                confirmMdp: ''
            });
        }
        setError(null);
        setSuccess(null);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            // Vérifier si l'utilisateur a un profil modifiable
            if (!user.idIdentifiant) {
                throw new Error('Profil non modifiable - Aucun ID utilisateur trouvé dans la base des paramètres');
            }

            // Validation du mot de passe si modifié
            if (formData.mdpIdentifiant && formData.mdpIdentifiant !== formData.confirmMdp) {
                throw new Error('Les mots de passe ne correspondent pas');
            }

            if (formData.mdpIdentifiant && formData.mdpIdentifiant.length < 6) {
                throw new Error('Le mot de passe doit contenir au moins 6 caractères');
            }

            // Préparer les données à envoyer
            const updateData = {
                identifiant: formData.identifiant,
                description: formData.description
            };

            // Ajouter le mot de passe seulement s'il a été modifié
            if (formData.mdpIdentifiant) {
                updateData.mdpIdentifiant = formData.mdpIdentifiant;
            }

            // Mettre à jour le profil
            await parametreService.updateParametres(user.idIdentifiant, updateData);
            
            // Rafraîchir les données utilisateur
            await fetchUserProfile();
            
            setEditing(false);
            setSuccess('Profil mis à jour avec succès');
            setTimeout(() => setSuccess(null), 3000);
            
        } catch (err) {
            setError('Erreur lors de la mise à jour: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="content flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div 
                        className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"
                        role="status"
                        aria-label="Chargement en cours"
                    ></div>
                    <p className="mt-3 text-gray-600">Chargement du profil...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="content max-w-2xl mx-auto p-6">
                <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Profil non disponible</h3>
                    <p className="text-gray-500">Impossible de charger les informations du profil.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="content max-w-2xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* En-tête */}
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold text-gray-800">Mon Profil</h1>
                                <div className="flex items-center gap-2">
                                    {user.role && (
                                        <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                            {user.role}
                                        </span>
                                    )}
                                    {!user.idIdentifiant && (
                                        <span className="inline-block px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded">
                                            Lecture seule
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        {!editing && (
                            <button
                                onClick={handleEdit}
                                disabled={!user.idIdentifiant}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                title={!user.idIdentifiant ? "Profil non modifiable - Aucune donnée dans la base des paramètres" : "Modifier le profil"}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Modifier
                            </button>
                        )}
                    </div>
                </div>

                {/* Messages de succès/erreur */}
                {success && (
                    <div className="mx-6 mt-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {success}
                    </div>
                )}
                
                {error && (
                    <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
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

                {/* Contenu */}
                <div className="p-6">
                    {!editing ? (
                        // Mode visualisation
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Identifiant
                                </label>
                                <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                                    {user.identifiant || user.login || 'Non défini'}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md min-h-[80px]">
                                    {user.description || 'Aucune description'}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Login <span className="text-xs text-gray-500">(non modifiable)</span>
                                    </label>
                                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                                        {user.login || 'Non défini'}
                                    </p>
                                </div>
                                
                                {user.idIdentifiant && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            ID
                                        </label>
                                        <p className="text-gray-500 bg-gray-50 px-3 py-2 rounded-md">
                                            {user.idIdentifiant}
                                        </p>
                                    </div>
                                )}
                                
                                {!user.idIdentifiant && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Statut
                                        </label>
                                        <p className="text-amber-600 bg-amber-50 px-3 py-2 rounded-md text-sm">
                                            Profil non enregistré dans la base des paramètres
                                        </p>
                                    </div>
                                )}
                                
                                {user.mailIdentifiant && (
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Email
                                        </label>
                                        <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                                            {user.mailIdentifiant}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        // Mode édition
                        <form onSubmit={handleSave} className="space-y-6">
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
                                        placeholder={user.login || "Entrez votre identifiant"}
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
                                    placeholder="Ajoutez une description..."
                                />
                            </div>

                            <div className="pt-4 border-t border-gray-200">
                                <h3 className="text-sm font-medium text-gray-700 mb-4">Changer le mot de passe (optionnel)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nouveau mot de passe
                                        </label>
                                        <input
                                            type="password"
                                            name="mdpIdentifiant"
                                            value={formData.mdpIdentifiant}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Laisser vide pour ne pas changer"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Confirmer le mot de passe
                                        </label>
                                        <input
                                            type="password"
                                            name="confirmMdp"
                                            value={formData.confirmMdp}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Confirmer le nouveau mot de passe"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-6">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {saving ? "Enregistrement..." : "Enregistrer"}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    disabled={saving}
                                    className="flex-1 py-2 px-4 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50 transition-colors"
                                >
                                    Annuler
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;