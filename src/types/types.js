
// types.js - à créer dans votre dossier /src/types ou ajuster selon votre structure
// Puisque votre projet utilise JavaScript, vous n'avez pas besoin des annotations TypeScript
// Mais nous les incluons en commentaires pour référence

/**
 * @typedef {Object} FormItem
 * @property {string} id - Identifiant du champ
 * @property {string} label - Libellé du champ
 */

/**
 * @typedef {Object} FormGroup
 * @property {string} [title] - Titre du groupe
 * @property {FormItem[]} items - Liste des champs du groupe
 */

/**
 * @typedef {Object} FormSection
 * @property {string} title - Titre de la section
 * @property {string} icon - Nom de l'icône de la section
 * @property {FormGroup[]} groups - Groupes de champs dans la section
 */

/**
 * @typedef {Object} FormData
 * @property {string|number} [idVol] - ID du volontaire
 * @property {Object.<string, any>} - Valeurs des champs indexées par leur ID
 */
