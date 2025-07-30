import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="text-6xl mb-6">🔒</div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
            Accès refusé
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </p>
          
          {user && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
              <div className="text-sm text-blue-800">
                <p><strong>Utilisateur connecté :</strong> {user.login}</p>
                <p><strong>Rôle :</strong> {user.role}</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => navigate(-1)}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Page précédente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;