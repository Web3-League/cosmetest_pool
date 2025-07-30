import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Composants pour les études
import EtudesPage from './components/etudes/EtudesPage';
import EtudeMain from './components/etudes/EtudeMain';
import EtudeToRDVConnector from './components/etudes/EtudeToRDVConnector';
import EtudeForm from './components/etudes/EtudeForm';

// Composant RDV
import RDVCreation from '../components/rdv/RDVCreation';

/**
 * Composant de routage pour toutes les routes liées aux études
 * Intègre les chemins pour la liste des études, les détails d'une étude,
 * l'ajout/édition d'études et la planification des RDV
 */
const EtudeRoutes = () => {
  return (
    <Routes>
      {/* Liste des études */}
      <Route path="/" element={<EtudesPage />} />
      
      {/* Création d'une nouvelle étude */}
      <Route path="/nouvelle" element={<EtudeForm />} />
      
      {/* Détails d'une étude et gestion des volontaires */}
      <Route path="/:idEtude" element={<EtudeMain />} />
      
      {/* Édition d'une étude existante */}
      <Route path="/:idEtude/edit" element={<EtudeForm />} />
      
      {/* Connecteur pour la planification des RDV */}
      <Route path="/:idEtude/rdv" element={<EtudeToRDVConnector />} />
      
      {/* Redirection vers la liste si le chemin ne correspond à aucune route */}
      <Route path="*" element={<Navigate to="/etudes" replace />} />
    </Routes>
  );
};

export default EtudeRoutes;