// src/utils/formatters.js

/**
 * Formate le genre du volontaire pour l'affichage
 * @param {string} gender - Code du genre ('M', 'F', etc.)
 * @returns {string} - Genre formaté
 */
export const formatGender = (gender) => {
  if (!gender) return 'Non spécifié';
  
  const genderMap = {
    'M': 'Homme',
    'F': 'Femme',
    'O': 'Autre',
    'Homme': 'Homme',
    'HOMME': 'Homme',
    'FEMME': 'Femme',
    'AUTRE': 'Autre'
  };
  
  return genderMap[gender.toUpperCase()] || gender;
};

/**
 * Formate le type de peau pour l'affichage
 * @param {string} skinType - Code du type de peau
 * @returns {string} - Type de peau formaté
 */
export const formatSkinType = (skinType) => {
  if (!skinType) return 'Non spécifié';
  
  const skinTypeMap = {
    'NORMALE': 'Normale',
    'SECHE': 'Sèche',
    'GRASSE': 'Grasse',
    'MIXTE': 'Mixte',
    'SENSIBLE': 'Sensible',
    'N': 'Normale',
    'S': 'Sèche',
    'G': 'Grasse',
    'M': 'Mixte',
    'SE': 'Sensible'
  };
  
  return skinTypeMap[skinType?.toUpperCase()] || skinType;
};

/**
 * Formate une date au format français (JJ/MM/AAAA)
 * @param {string} dateString - Chaîne de date (format ISO ou autre)
 * @returns {string} - Date formatée
 */
export const formatDateToFrench = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    
    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Erreur lors du formatage de la date:', error);
    return dateString;
  }
};

/**
 * Formate un phototype pour l'affichage
 * @param {string|number} phototype - Code ou numéro du phototype
 * @returns {string} - Description du phototype
 */
export const formatPhototype = (phototype) => {
  if (!phototype) return 'Non spécifié';
  
  const phototypes = {
    '1': 'I - Peau très claire, cheveux blonds ou roux, yeux clairs, taches de rousseur',
    '2': 'II - Peau claire, cheveux blonds à châtains, yeux clairs à noisette',
    '3': 'III - Peau claire à mate, cheveux châtains, yeux de toutes couleurs',
    '4': 'IV - Peau mate, cheveux châtains foncés à bruns, yeux foncés',
    '5': 'V - Peau foncée, cheveux foncés, yeux foncés',
    '6': 'VI - Peau noire, cheveux noirs, yeux foncés',
    'I': 'I - Peau très claire, cheveux blonds ou roux, yeux clairs, taches de rousseur',
    'II': 'II - Peau claire, cheveux blonds à châtains, yeux clairs à noisette',
    'III': 'III - Peau claire à mate, cheveux châtains, yeux de toutes couleurs',
    'IV': 'IV - Peau mate, cheveux châtains foncés à bruns, yeux foncés',
    'V': 'V - Peau foncée, cheveux foncés, yeux foncés',
    'VI': 'VI - Peau noire, cheveux noirs, yeux foncés'
  };
  
  // Si c'est un nombre ou une chaîne numérique
  const photoKey = String(phototype).trim();
  return phototypes[photoKey] || phototype;
};

/**
 * Formate une ethnie pour l'affichage
 * @param {string} ethnicity - Code de l'ethnie
 * @returns {string} - Ethnie formatée
 */
export const formatEthnie = (ethnicity) => {
  if (!ethnicity) return 'Non spécifiée';
  
  const ethnicityMap = {
    'CAUCASIEN': 'Caucasien(ne)',
    'AFRICAIN': 'Africain(e)',
    'ASIATIQUE': 'Asiatique',
    'HISPANIQUE': 'Hispanique',
    'MOYEN_ORIENT': 'Moyen-Orient',
    'AUTRE': 'Autre',
    'INCONNU': 'Non spécifiée'
  };
  
  return ethnicityMap[ethnicity?.toUpperCase()] || ethnicity;
};

/**
 * Formate le statut d'un rendez-vous
 * @param {string} status - Code du statut
 * @returns {string} - Statut formaté
 */
export const formatRdvStatus = (status) => {
  if (!status) return 'Non spécifié';
  
  const statusMap = {
    'CONFIRME': 'Confirmé',
    'EN_ATTENTE': 'En attente',
    'ANNULE': 'Annulé',
    'COMPLETE': 'Complété',
    'ABSENT': 'Absent'
  };
  
  return statusMap[status?.toUpperCase()] || status;
};

/**
 * Formate le statut d'une étude
 * @param {string} status - Code du statut
 * @returns {string} - Statut formaté
 */
export const formatEtudeStatus = (status) => {
  if (!status) return 'Non spécifié';
  
  const statusMap = {
    'EN_COURS': 'En cours',
    'PLANIFIEE': 'Planifiée',
    'TERMINEE': 'Terminée',
    'ANNULEE': 'Annulée',
    'EN_PAUSE': 'En pause'
  };
  
  return statusMap[status?.toUpperCase()] || status;
};

/**
 * Retourne la classe CSS pour un statut de rendez-vous
 * @param {string} status - Code du statut
 * @returns {string} - Classes CSS
 */
export const getRdvStatusClass = (status) => {
  if (!status) return 'bg-gray-100 text-gray-800';
  
  const statusClassMap = {
    'CONFIRME': 'bg-green-100 text-green-800',
    'EN_ATTENTE': 'bg-yellow-100 text-yellow-800',
    'ANNULE': 'bg-red-100 text-red-800',
    'COMPLETE': 'bg-blue-100 text-blue-800',
    'ABSENT': 'bg-gray-100 text-gray-800'
  };
  
  return statusClassMap[status?.toUpperCase()] || 'bg-gray-100 text-gray-800';
};

export default {
  formatGender,
  formatSkinType,
  formatDateToFrench,
  formatPhototype,
  formatEthnie,
  formatRdvStatus,
  formatEtudeStatus,
  getRdvStatusClass
};