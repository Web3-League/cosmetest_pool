import { useState, useEffect } from 'react';
import { Link, Routes, Route, useNavigate } from 'react-router-dom';
import RdvList from './RdvList';
import CreateRdv from './CreateRdv';
import CreateMultipleRdv from './CreateMultipleRdv';
import ViewRdv from './ViewRdv';
import EditRdv from './EditRdv';
import CalendarView from './CalendarView';

const RdvDashboard = () => {
  const [activeStudy, setActiveStudy] = useState(null);
  const [studies, setStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // En production, remplacer par un appel API
    const fetchStudies = async () => {
      setLoading(true);
      try {
        // Simuler un appel API
        const mockStudies = [
          { id: 1, ref: "AC123", title: "Étude cosmétique visage", dateStart: "2025-06-01", dateEnd: "2025-07-15", subjectCount: 24, currentSubjects: 15 },
          { id: 2, ref: "DM456", title: "Test dermatologique", dateStart: "2025-05-15", dateEnd: "2025-08-10", subjectCount: 30, currentSubjects: 18 },
          { id: 3, ref: "PL789", title: "Recherche antioxydants", dateStart: "2025-07-01", dateEnd: "2025-09-15", subjectCount: 15, currentSubjects: 8 }
        ];
        setStudies(mockStudies);
      } catch (error) {
        console.error("Erreur lors du chargement des études:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudies();
  }, []);

  const handleStudySelect = (study) => {
    setActiveStudy(study);
    navigate(`/rdvs/etude/${study.id}`);
  };

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <h1 className="text-2xl font-bold text-gray-800">Gestion des Rendez-vous</h1>
        <p className="text-gray-600 mt-2">Planifiez, visualisez et gérez les rendez-vous des études cliniques</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-0">
        {/* Panneau latéral avec la liste des études */}
        <div className="lg:col-span-1 border-r p-4 bg-gray-50">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Études actives</h2>
            
            {loading ? (
              <div className="flex items-center justify-center h-20">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="space-y-2">
                {studies.map(study => (
                  <div 
                    key={study.id}
                    onClick={() => handleStudySelect(study)}
                    className={`p-3 rounded-md transition-colors cursor-pointer ${
                      activeStudy?.id === study.id 
                        ? 'bg-blue-100 border border-blue-300' 
                        : 'bg-white border border-gray-200 hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-blue-600">{study.ref}</span>
                      <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                        {study.currentSubjects}/{study.subjectCount}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 mt-1 line-clamp-1">{study.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(study.dateStart).toLocaleDateString()} - {new Date(study.dateEnd).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Link 
              to="/rdvs/calendrier" 
              className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-md hover:bg-blue-50 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Vue Calendrier</span>
            </Link>
            
            <Link 
              to="/rdvs/creer" 
              className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-md hover:bg-blue-50 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Créer un RDV</span>
            </Link>
            
            <Link 
              to="/rdvs/creer-multiple" 
              className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-md hover:bg-blue-50 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
              </svg>
              <span className="font-medium">Série de RDVs</span>
            </Link>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="lg:col-span-3 p-6">
          <Routes>
            <Route path="/" element={
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Système de Gestion des Rendez-vous</h2>
                <p className="text-gray-600 mb-6">Sélectionnez une étude dans le panneau latéral ou utilisez les options ci-dessous</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg">
                  <Link to="/rdvs/calendrier" className="bg-blue-50 border border-blue-200 rounded-lg p-4 hover:bg-blue-100 transition-colors">
                    <div className="font-semibold text-blue-700">Vue Calendrier</div>
                    <p className="text-sm text-blue-600">Visualiser tous les rendez-vous</p>
                  </Link>
                  <Link to="/rdvs/creer" className="bg-green-50 border border-green-200 rounded-lg p-4 hover:bg-green-100 transition-colors">
                    <div className="font-semibold text-green-700">Créer un RDV</div>
                    <p className="text-sm text-green-600">Ajouter un nouveau rendez-vous</p>
                  </Link>
                </div>
              </div>
            } />
            <Route path="/etude/:id" element={<RdvList />} />
            <Route path="/creer" element={<CreateRdv />} />
            <Route path="/creer-multiple" element={<CreateMultipleRdv />} />
            <Route path="/voir/:id" element={<ViewRdv />} />
            <Route path="/modifier/:id" element={<EditRdv />} />
            <Route path="/calendrier" element={<CalendarView />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default RdvDashboard;