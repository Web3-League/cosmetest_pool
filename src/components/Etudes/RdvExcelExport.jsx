import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import api from '../../services/api';
import { formatDate } from '../../utils/dateUtils';

const RdvExcelExport = ({ rdvs = [], studyRef = '', studyId = null, studyTitle = '', getNomVolontaire = () => '' }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const exportRdvsToExcel = async () => {
    try {
      setIsExporting(true);
      setExportProgress(0);
      console.log('Préparation de l\'export pivot RDV avec numsujet et statut...');
      console.log('Debug studyRef:', studyRef);
      console.log('Debug studyTitle:', studyTitle);
      console.log('Debug studyId:', studyId);

      if (rdvs.length === 0) {
        throw new Error('Aucun rendez-vous à exporter');
      }

      // 1. Récupérer tous les IDs de volontaires uniques des RDV
      const volunteerIds = [...new Set(
        rdvs
          .map(rdv => rdv.idVolontaire)
          .filter(id => id)
      )];

      setExportProgress(10);

      // 2. Récupérer les infos complètes des volontaires
      const volunteersData = {};

      if (volunteerIds.length > 0) {
        const volunteerPromises = volunteerIds.map(async (id) => {
          try {
            const response = await api.get(`/volontaires/${id}`);
            return { id, data: response.data };
          } catch (error) {
            console.error(`Erreur pour volontaire ${id}:`, error);
            return { id, data: null };
          }
        });

        const volunteerResults = await Promise.all(volunteerPromises);

        volunteerResults.forEach(result => {
          if (result.data) {
            volunteersData[result.id] = result.data;
          }
        });
      }

      setExportProgress(20);

      // 3. Récupérer les associations étude-volontaire pour obtenir numsujet et statut
      const associationsData = {};

      if (volunteerIds.length > 0 && studyId) {
        try {
          // Récupérer toutes les associations pour cette étude
          const associationsResponse = await api.get(`/etude-volontaires/etude/${studyId}`);
          const associations = associationsResponse.data.data || [];

          // Indexer par idVolontaire pour un accès rapide
          associations.forEach(assoc => {
            if (assoc.idVolontaire) {
              associationsData[assoc.idVolontaire] = assoc;
            }
          });

          console.log(`Récupéré ${associations.length} associations étude-volontaire`);
        } catch (error) {
          console.error('Erreur lors de la récupération des associations:', error);
          // Continuer sans les associations en cas d'erreur
        }
      }

      setExportProgress(30);

      // 4. Grouper les RDV par volontaire et calculer le nombre max de passages
      const rdvsByVolunteer = {};
      let maxPassages = 0;

      rdvs.forEach(rdv => {
        if (rdv.idVolontaire) {
          if (!rdvsByVolunteer[rdv.idVolontaire]) {
            rdvsByVolunteer[rdv.idVolontaire] = [];
          }
          rdvsByVolunteer[rdv.idVolontaire].push(rdv);
        }
      });

      // Trier les RDV de chaque volontaire par date/heure
      Object.keys(rdvsByVolunteer).forEach(volunteerId => {
        rdvsByVolunteer[volunteerId].sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);

          if (dateA.getTime() !== dateB.getTime()) {
            return dateA - dateB;
          }

          const heureA = a.heure || '00h00';
          const heureB = b.heure || '00h00';
          return heureA.localeCompare(heureB);
        });

        // Calculer le nombre max de passages
        maxPassages = Math.max(maxPassages, rdvsByVolunteer[volunteerId].length);
      });

      setExportProgress(50);

      // 5. Fonction helper pour récupérer les infos du volontaire
      const getVolunteerInfo = (volunteerId, field) => {
        if (volunteersData[volunteerId]) {
          return volunteersData[volunteerId][field] || '';
        }
        return '';
      };

      // 6. Fonction helper pour récupérer les infos de l'association
      const getAssociationInfo = (volunteerId, field) => {
        if (associationsData[volunteerId]) {
          return associationsData[volunteerId][field] || '';
        }
        return '';
      };

      // 7. Créer les en-têtes dynamiques
      const headers = [
        'ID Volontaire',
        'Volontaire',
        'Téléphone',
        'Email',
        'Phototype',
        'Num Sujet',
        'Statut'
      ];

      // Ajouter T0, T1, T2... en fonction du nombre max de passages
      for (let i = 0; i < maxPassages; i++) {
        headers.push(`T${i} Date`);
        headers.push(`T${i} Heure`);
        headers.push(`T${i} Etat`);
      }

      // 8. Créer les lignes de données
      const dataRows = [];

      Object.entries(rdvsByVolunteer).forEach(([volunteerId, volunteerRdvs]) => {
        const row = [];

        // Informations du volontaire
        row.push(volunteerId);
        row.push(getNomVolontaire(volunteerRdvs[0])); // Utiliser le premier RDV pour récupérer le nom
        row.push(getVolunteerInfo(volunteerId, 'telPortable')); // Téléphone
        row.push(getVolunteerInfo(volunteerId, 'email')); // Email  
        row.push(getVolunteerInfo(volunteerId, 'phototype')); // Phototype
        row.push(getAssociationInfo(volunteerId, 'numsujet')); // Num Sujet
        row.push(getAssociationInfo(volunteerId, 'statut')); // Statut

        // Ajouter les données de chaque passage T0, T1, T2...
        for (let i = 0; i < maxPassages; i++) {
          if (i < volunteerRdvs.length) {
            const rdv = volunteerRdvs[i];
            row.push(formatDate(rdv.date));
            row.push(rdv.heure || '');
            row.push(rdv.etat || 'PLANIFIE');
          } else {
            // Pas de RDV pour ce passage
            row.push('');
            row.push('');
            row.push('');
          }
        }

        dataRows.push(row);
      });

      setExportProgress(70);

      // 9. Ajouter les RDV non assignés (chacun sur une ligne séparée)
      const unassignedRdvs = rdvs.filter(rdv => !rdv.idVolontaire);

      unassignedRdvs.forEach(rdv => {
        const row = [];

        // Informations du volontaire (vides pour non assigné)
        row.push('');
        row.push('Non assigné');
        row.push('');
        row.push('');
        row.push('');
        row.push(''); // Num Sujet
        row.push(''); // Statut

        // Ajouter les données du RDV dans T0
        row.push(formatDate(rdv.date));
        row.push(rdv.heure || '');
        row.push(rdv.etat || 'PLANIFIE');

        // Remplir les autres passages avec des cellules vides
        for (let i = 1; i < maxPassages; i++) {
          row.push('');
          row.push('');
          row.push('');
        }

        dataRows.push(row);
      });

      setExportProgress(80);

      // 10. Créer le livre Excel
      const wb = XLSX.utils.book_new();

      // 11. Créer la ligne d'en-tête avec les infos de l'étude
      const studyInfoRow = [];
      let studyInfo = 'Export des rendez-vous';
      
      if (studyRef && studyTitle) {
        studyInfo = `Étude: ${studyRef} - ${studyTitle}`;
      } else if (studyRef) {
        studyInfo = `Étude: ${studyRef}`;
      }
      
      console.log('StudyInfo final:', studyInfo);
      
      studyInfoRow.push(studyInfo);
      // Remplir le reste de la ligne avec des cellules vides
      for (let i = 1; i < headers.length; i++) {
        studyInfoRow.push('');
      }

      // 12. Créer les données pour Excel : ligne étude + en-têtes + données
      const wsData = [
        studyInfoRow,                                    // Ligne 1: Info étude
        headers,                                         // Ligne 2: En-têtes
        ...dataRows                                      // Lignes 3+: Données
      ];

      // 13. Créer une feuille de calcul
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // 13.1. Fusionner les cellules de la première ligne pour le titre de l'étude
      const mergeRange = {
        s: { r: 0, c: 0 }, // Start: ligne 0, colonne 0
        e: { r: 0, c: Math.min(6, headers.length - 1) } // End: ligne 0, jusqu'à la colonne 6 ou la dernière colonne des headers
      };
      
      if (!ws['!merges']) ws['!merges'] = [];
      ws['!merges'].push(mergeRange);

      // 14. Style pour la ligne d'information de l'étude (première ligne)
      const studyInfoRowNum = 0; // Première ligne (info étude)
      const headerRowNum = 1;     // Deuxième ligne (en-têtes)

      for (let col = 0; col < headers.length; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: studyInfoRowNum, c: col });

        if (col === 0) {
          // Cellule avec le texte de l'étude
          if (!ws[cellRef]) ws[cellRef] = { t: 's', v: studyInfo };
          
          ws[cellRef].s = {
            fill: {
              fgColor: { rgb: "2F75B5" } // Bleu plus foncé
            },
            font: {
              color: { rgb: "FFFFFF" }, // Texte blanc
              bold: true,
              size: 14
            },
            alignment: {
              horizontal: "left",
              vertical: "center"
            },
            border: {
              top: { style: "thin", color: { rgb: "000000" } },
              bottom: { style: "thin", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } }
            }
          };
        } else {
          // Cellules vides avec le même style de fond
          if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };
          
          ws[cellRef].s = {
            fill: {
              fgColor: { rgb: "2F75B5" }
            },
            border: {
              top: { style: "thin", color: { rgb: "000000" } },
              bottom: { style: "thin", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } }
            }
          };
        }
      }

      // 15. Style pour les en-têtes de colonnes (deuxième ligne)
      for (let col = 0; col < headers.length; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: headerRowNum, c: col });

        if (!ws[cellRef]) ws[cellRef] = { t: 's', v: headers[col] };

        ws[cellRef].s = {
          fill: {
            fgColor: { rgb: "4F81BD" } // Bleu standard
          },
          font: {
            color: { rgb: "FFFFFF" }, // Texte blanc
            bold: true
          },
          alignment: {
            horizontal: "center",
            vertical: "center"
          },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        };
      }

      // 16. Définir la largeur des colonnes
      const colWidths = [
        { width: 25 }, // ID Volontaire (largeur augmentée pour la ligne d'étude)
        { width: 30 }, // Volontaire
        { width: 15 }, // Téléphone
        { width: 25 }, // Email
        { width: 15 }, // Phototype
        { width: 12 }, // Num Sujet
        { width: 12 }  // Statut
      ];

      // Ajouter les largeurs pour T0, T1, T2...
      for (let i = 0; i < maxPassages; i++) {
        colWidths.push({ width: 12 }); // Date
        colWidths.push({ width: 8 });  // Heure
        colWidths.push({ width: 12 }); // Etat
      }

      ws['!cols'] = colWidths;

      setExportProgress(90);

      // 17. Ajouter la feuille au livre
      XLSX.utils.book_append_sheet(wb, ws, 'Rendez-vous Pivot');

      // 18. Générer le fichier Excel et le télécharger
      const fileName = studyRef ? 
        `rdvs-pivot-etude-${studyRef}.xlsx` :
        `rdvs-pivot-${new Date().toISOString().split('T')[0]}.xlsx`;
      
      XLSX.writeFile(wb, fileName);

      setExportProgress(100);

      console.log(`Export Excel RDV réussi avec format pivot, numsujet et statut - ${maxPassages} passages max`);

      // Debug
      console.log('Statistiques de l\'export RDV:');
      console.log(`- Volontaires avec RDV: ${Object.keys(rdvsByVolunteer).length}`);
      console.log(`- Associations récupérées: ${Object.keys(associationsData).length}`);
      console.log(`- RDV non assignés: ${unassignedRdvs.length}`);
      console.log(`- Passages maximum: ${maxPassages}`);
      console.log(`- Total RDV: ${rdvs.length}`);

    } catch (error) {
      console.error('Erreur lors de l\'export Excel RDV:', error);
      alert(`Une erreur est survenue lors de l'export Excel RDV: ${error.message}`);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  return (
    <div className="inline-block">
      <button
        onClick={exportRdvsToExcel}
        disabled={isExporting || rdvs.length === 0}
        className={`btn btn-outline-success btn-sm ${
          isExporting ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {isExporting ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-green-600 mr-2"></div>
            Export... {Math.round(exportProgress)}%
          </div>
        ) : (
          <div className="flex items-center">
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export RDV
          </div>
        )}
      </button>
      
      {rdvs.length === 0 && (
        <p className="text-sm text-gray-500 mt-1">
          Aucun RDV à exporter
        </p>
      )}
    </div>
  );
};

export default RdvExcelExport;