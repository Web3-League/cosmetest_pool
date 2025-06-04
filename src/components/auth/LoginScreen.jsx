import { useState, useEffect } from 'react';
import { useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  
  const { isAuthenticated, isLoading: authLoading, authError, login: authLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Récupère le chemin d'origine pour redirection après connexion
  const from = location.state?.from?.pathname || '/';
  
  // Utilise l'erreur d'auth du contexte si disponible
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);
  
  // Si l'utilisateur est déjà authentifié, rediriger vers la page d'accueil ou la page d'origine
  if (isAuthenticated && !authLoading) {
    console.log('LoginScreen - Utilisateur authentifié, redirection vers:', from);
    return <Navigate to={from} replace />;
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    
    setError('');
    setLocalLoading(true);
    
    try {
      console.log('LoginScreen - Tentative de connexion avec:', username);
      const result = await authLogin(username, password);
      
      if (result.success) {
        console.log('LoginScreen - Connexion réussie, redirection vers:', from);
        navigate(from, { replace: true });
      } else {
        console.log('LoginScreen - Échec de connexion:', result.message);
        setError(result.message || 'Échec de connexion');
      }
    } catch (error) {
      console.error('LoginScreen - Erreur de connexion:', error);
      setError('Une erreur est survenue lors de la connexion');
    } finally {
      setLocalLoading(false);
    }
  };
  
  // Etat de chargement global (soit du composant local, soit du contexte d'auth)
  const isLoading = localLoading || authLoading;
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary-700">Cosmetest</h1>
          <h2 className="mt-2 text-xl font-semibold text-gray-800">Connexion</h2>
          {from !== '/' && (
            <p className="mt-2 text-sm text-gray-500">
              Vous serez redirigé vers votre page d'origine après connexion
            </p>
          )}
        </div>
        
        {error && (
          <div className="p-3 text-sm text-red-800 bg-red-100 rounded-md">
            {error}
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Identifiant
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div>
            <button
              type="submit"
              className="w-full p-3 font-medium text-white bg-primary-700 rounded-md hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:bg-primary-400 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2 -ml-1 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connexion en cours...
                </span>
              ) : (
                'Se connecter'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;