import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import infoBancaireService from '../../services/infoBancaireService';
import { PAIEMENT_STATUS } from '../../hooks/usePaiements';

/**
 * Composant pour exporter les fiches de paiement en Excel
 * @param {Object} props - Les propriétés du composant
 * @param {Object} props.etude - Les données de l'étude sélectionnée
 * @param {Array} props.paiements - Liste des paiements de l'étude
 * @param {Object} props.volontairesInfo - Informations des volontaires
 * @param {Object} props.groupesInfo - Informations des groupes
 * @param {Function} props.getVolontaireName - Fonction pour obtenir le nom du volontaire
 * @param {Function} props.getGroupeName - Fonction pour obtenir le nom du groupe
 */
const ExcelExport = ({ 
  etude, 
  paiements, 
  volontairesInfo,  
  getGroupeName 
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  /**
   * Récupère les informations bancaires pour tous les volontaires
   */
  const loadBankingInfo = async (volontaireIds) => {
    try {
      console.log('🔄 Chargement des informations bancaires pour', volontaireIds.length, 'volontaires...');
      
      const bankingData = {};
      const results = await Promise.allSettled(
        volontaireIds.map(async (volontaireId) => {
          try {
            const response = await infoBancaireService.getByVolontaireId(volontaireId);
            const bankInfo = response.data && response.data.length > 0 ? response.data[0] : null;
            return { id: volontaireId, bankInfo };
          } catch (error) {
            console.warn(`Info bancaire non trouvée pour volontaire ${volontaireId}:`, error);
            return { id: volontaireId, bankInfo: null };
          }
        })
      );

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          bankingData[result.value.id] = result.value.bankInfo;
        }
      });

      console.log('✅ Informations bancaires chargées:', Object.keys(bankingData).length);
      return bankingData;
    } catch (error) {
      console.error('❌ Erreur lors du chargement des informations bancaires:', error);
      throw error;
    }
  };

  /**
   * Formate les données pour l'export Excel
   */
  const formatDataForExcel = (paiements, bankingData) => {
    return paiements.map((paiement, index) => {
      const volontaire = volontairesInfo[paiement.idVolontaire];
      const bankInfo = bankingData[paiement.idVolontaire];
      const statutConfig = PAIEMENT_STATUS[paiement.paye] || PAIEMENT_STATUS[0];

      // Extraction des noms/prénoms avec plusieurs possibilités
      const prenom = volontaire?.prenom || volontaire?.prenomVol || '';
      const nom = volontaire?.nom || volontaire?.nomVol || '';

      return {
        'N°': index + 1,
        'Nom': nom || 'Non renseigné',
        'Prénom': prenom || 'Non renseigné',
        'IBAN': bankInfo?.iban ? infoBancaireService.validation.formatIban(bankInfo.iban) : 'Non renseigné',
        'BIC': bankInfo?.bic || 'Non renseigné',
        'Groupe': getGroupeName(paiement.idGroupe, paiement.idEtude),
        'Numéro Sujet': paiement.numsujet || 'Non défini',
        'Montant (€)': paiement.iv || 0,
        'Statut Paiement': statutConfig.label,
        'ID Volontaire': paiement.idVolontaire,
        'Remarques': bankInfo ? '' : '⚠️ Info bancaire manquante'
      };
    });
  };

  /**
   * Génère et télécharge le fichier Excel
   */
  const handleExport = async () => {
    if (!etude || !paiements || paiements.length === 0) {
      setExportError('Aucune donnée à exporter');
      return;
    }

    setIsExporting(true);
    setExportError('');

    try {
      // 1. Récupérer les IDs uniques des volontaires
      const volontaireIds = [...new Set(paiements.map(p => p.idVolontaire).filter(id => id))];
      
      if (volontaireIds.length === 0) {
        throw new Error('Aucun volontaire trouvé dans les paiements');
      }

      // 2. Charger les informations bancaires
      const bankingData = await loadBankingInfo(volontaireIds);

      // 3. Formater les données
      const excelData = formatDataForExcel(paiements, bankingData);

      // 4. Créer le workbook Excel
      const wb = XLSX.utils.book_new();

      // Feuille principale avec les données
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Définir la largeur des colonnes
      const columnWidths = [
        { wch: 5 },   // N°
        { wch: 20 },  // Nom
        { wch: 20 },  // Prénom
        { wch: 35 },  // IBAN
        { wch: 15 },  // BIC
        { wch: 15 },  // Groupe
        { wch: 12 },  // Numéro Sujet
        { wch: 12 },  // Montant
        { wch: 15 },  // Statut Paiement
        { wch: 12 },  // ID Volontaire
        { wch: 25 }   // Remarques
      ];
      ws['!cols'] = columnWidths;

      // Ajouter la feuille au workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Fiches de Paiement');

      // 5. Créer une feuille de résumé
      const summaryData = [
        ['FICHE DE PAIEMENT - ÉTUDE'],
        [''],
        ['Référence Étude:', etude.ref || 'Non définie'],
        ['Titre:', etude.titre || 'Non défini'],
        ['Date d\'export:', new Date().toLocaleDateString('fr-FR')],
        ['Heure d\'export:', new Date().toLocaleTimeString('fr-FR')],
        [''],
        ['STATISTIQUES'],
        [''],
        ['Nombre total de paiements:', paiements.length],
        ['Nombre de paiements payés:', paiements.filter(p => p.paye === 1).length],
        ['Nombre de paiements non payés:', paiements.filter(p => p.paye === 0).length],
        ['Nombre de paiements en attente:', paiements.filter(p => p.paye === 2).length],
        [''],
        ['Montant total:', `${paiements.reduce((sum, p) => sum + (p.iv || 0), 0).toFixed(2)} €`],
        ['Montant payé:', `${paiements.filter(p => p.paye === 1).reduce((sum, p) => sum + (p.iv || 0), 0).toFixed(2)} €`],
        ['Montant restant:', `${paiements.filter(p => p.paye !== 1).reduce((sum, p) => sum + (p.iv || 0), 0).toFixed(2)} €`],
        [''],
        ['INFORMATIONS BANCAIRES'],
        [''],
        ['Volontaires avec RIB complet:', Object.values(bankingData).filter(b => b && b.iban && b.bic).length],
        ['Volontaires sans RIB:', Object.values(bankingData).filter(b => !b).length],
      ];

      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      wsSummary['!cols'] = [{ wch: 25 }, { wch: 40 }];
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Résumé');

      // 6. Générer le nom de fichier
      const fileName = `Fiches_Paiement_${etude.ref || 'Etude'}_${new Date().toISOString().split('T')[0]}.xlsx`;

      // 7. Télécharger le fichier
      XLSX.writeFile(wb, fileName);

      console.log('✅ Export Excel réussi:', fileName);

    } catch (error) {
      console.error('❌ Erreur lors de l\'export Excel:', error);
      setExportError(`Erreur lors de l'export: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Statistiques pour l'affichage
  const stats = {
    total: paiements?.length || 0,
    withBankInfo: 0, // Sera calculé après chargement
    withoutBankInfo: 0
  };

  if (!etude) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            Export Excel - Fiches de Paiement
          </h3>
          <p className="text-sm text-gray-600">
            Étude: <span className="font-medium">{etude.ref}</span>
            {stats.total > 0 && (
              <span className="ml-2">• {stats.total} paiement{stats.total !== 1 ? 's' : ''}</span>
            )}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {exportError && (
            <div className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded">
              {exportError}
            </div>
          )}
          
          <button
            onClick={handleExport}
            disabled={isExporting || !paiements || paiements.length === 0}
            className={`
              inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md
              ${isExporting || !paiements || paiements.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
              }
              transition-colors duration-200
            `}
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Export en cours...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exporter Excel
              </>
            )}
          </button>
        </div>
      </div>

      {/* Informations sur l'export */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-500 space-y-1">
          <p>📋 <strong>Le fichier contiendra :</strong> Nom, Prénom, IBAN, BIC, Groupe, N° Sujet, Montant, Statut</p>
          <p>⚠️ <strong>Note :</strong> Les volontaires sans RIB seront signalés dans la colonne "Remarques"</p>
        </div>
      </div>
    </div>
  );
};

export default ExcelExport;