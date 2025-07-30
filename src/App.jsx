import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import LoginScreen from './components/Auth/LoginScreen'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import AppLayout from './components/Layout/AppLayout'
import Dashboard from './components/Dashboard/Dashboard'
import VolontairesPage from './components/Volontaires/VolontairesPage'
import VolontaireDetails from './components/Volontaires/VolontaireDetails'
import VolontaireForm from './components/Volontaires/VolontaireForm'
import EtudesPage from './components/Etudes/EtudesPage'
//import EtudeForm from './components/Etudes/EtudeForm'
import EtudeDetail from './components/Etudes/EtudeDetail'
//import PanelList from './components/Panel/PanelList';
//import PanelDetail from './components/Panel/PanelDetail';
//import PanelForm from './components/Panel/PanelForm';
import PanelHcList from './components/Panel/PanelHcList';
import PanelHcForm from './components/Panel/PanelHcForm';
import PanelHcDetail from './components/Panel/PanelHcDetail';
//import VolontairesImport from './components/Etudes/VolontairesImport';

// Import pour le gestionnaire de rendez-vous
import AppointmentManager from './components/RendezVous/AppointmentManager';
import VolunteerToAppointmentAssigner from './components/RendezVous/VolunteerToAppointmentAssigner';

// Nouveaux imports pour VolontaireHc
import VolontairesHcPage from './components/VolontaireHc/VolontairesHcPage';
import VolontaireHcDetail from './components/VolontaireHc/VolontaireHcDetail';
import VolontaireHcForm from './components/VolontaireHc/VolontaireHcForm';

// Import pour les rapports
import RapportsPage from './components/Rapports/RapportsPage';

// Imports pour les Groupes
import GroupesPage from './components/Etudes/GroupesPage';
import GroupeDetails from './components/Etudes/GroupeDetails';
import GroupeForm from './components/Etudes/GroupeForm';
import EtudeFormEnhanced from './components/Etudes/EtudeFormEnhanced'

// Import pour les paramètres
import SettingsPage from './components/Parametres/SettingSPage';
import ProfilePage from './components/Parametres/ProfilePage';

// Import pour les paiements (admin uniquement)
import PaiementsPage from './components/Paiements/PaiementsPage';

// Import pour la page non autorisé
import UnauthorizedPage from './components/Auth/UnauthorizedPage';

function App() {
  const { isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/volontaires" element={<VolontairesPage />} />
          <Route path="/volontaires/nouveau" element={<VolontaireForm />} />
          <Route path="/volontaires/:id" element={<VolontaireDetails />} />
          <Route path="/volontaires/:id/edit" element={<VolontaireForm />} />

          {/* Nouvelles routes pour VolontaireHc */}
          <Route path="/volontaires-hc" element={<VolontairesHcPage />} />
          <Route path="/volontaires-hc/nouveau" element={<VolontaireHcForm />} />
          <Route path="/volontaires-hc/:idVol" element={<VolontaireHcDetail />} />
          <Route path="/volontaires-hc/:idVol/edit" element={<VolontaireHcForm />} />

          {/* Routes pour les Etudes */}
          <Route path="/etudes" element={<EtudesPage />} />
          <Route path="/etudes/nouvelle" element={<EtudeFormEnhanced />} />
          <Route path="/etudes/:id" element={<EtudeDetail />} />
          <Route path="/etudes/:id/edit" element={<EtudeFormEnhanced />} />

          {/* Routes pour les Groupes */}
          <Route path="/groupes" element={<GroupesPage />} />
          <Route path="/groupes/nouveau" element={<GroupeForm />} />
          <Route path="/groupes/:id" element={<GroupeDetails />} />
          <Route path="/groupes/:id/edit" element={<GroupeForm />} />

          <Route path="/rdvs" element={<AppointmentManager />} />
          <Route path="/rdvs/assigner" element={<VolunteerToAppointmentAssigner />} />

          {/* Panels */}
          {/*<Route path="/panels" element={<PanelList />} />
          <Route path="/panels/:idPanel" element={<PanelDetail />} />
          <Route path="/panels/nouveau" element={<PanelForm />} />
          <Route path="/panels/:idPanel/edit" element={<PanelForm />} />
          */}

          {/* Panel HC (Habitudes Cosmétiques) */}
          <Route path="/panels-hc" element={<PanelHcList />} />
          <Route path="/panels-hc/nouveau" element={<PanelHcForm />} />
          <Route path="/panels-hc/:idPanel" element={<PanelHcDetail />} />
          <Route path="/panels-hc/:idPanel/edit" element={<PanelHcForm />} />

          {/* Volontaires Import */}
          {/*<Route path="/import-volontaires" element={<VolontairesImport />} />*/}
          {/*<Route path="/etudes/:idEtude/import-volontaires" element={<VolontairesImport />} /> */}

          {/* Rapports */}
          <Route path="/rapports" element={<RapportsPage />} />

          {/* Routes pour les paramètres */}
          <Route path="/parametres" element={<SettingsPage />} />
          <Route path="/profil" element={<ProfilePage />} />

          {/* Route pour les paiements (admin uniquement) */}
          <Route path="/paiements" element={<PaiementsPage />} />

        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App