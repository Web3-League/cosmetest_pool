import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import etudeService from '../../services/etudeService'
import rdvService from '../../services/rdvService'
import { formatDate } from '../../utils/dateUtils'
import * as XLSX from 'xlsx';

const EtudeDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [etude, setEtude] = useState(null)
  const [rdvs, setRdvs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingRdvs, setIsLoadingRdvs] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('details')
  const [infosVolontaires, setInfosVolontaires] = useState({})

  // États pour la gestion du tri
  const [sortField, setSortField] = useState('date')
  const [sortDirection, setSortDirection] = useState('asc')

  useEffect(() => {
    const fetchEtude = async () => {
      try {
        setIsLoading(true)
        const data = await etudeService.getById(id)
        setEtude(data)
      } catch (error) {
        console.error('Erreur lors du chargement de l\'étude:', error)
        setError('Impossible de charger les détails de l\'étude')
      } finally {
        setIsLoading(false)
      }
    }

    fetchEtude()
  }, [id])

  // Récupération des rendez-vous de l'étude
  useEffect(() => {
    const fetchRdvs = async () => {
      if (!id) return

      try {
        setIsLoadingRdvs(true)
        // Utiliser le service approprié pour récupérer les RDVs par étude
        const data = await rdvService.getByEtudeId(id)
        setRdvs(data)
      } catch (error) {
        console.error('Erreur lors du chargement des rendez-vous:', error)
        // Ne pas définir d'erreur globale pour ne pas bloquer l'affichage de l'étude
      } finally {
        setIsLoadingRdvs(false)
      }
    }

    if (activeTab === 'rdvs') {
      fetchRdvs()
    }
  }, [id, activeTab])

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette étude ?')) {
      try {
        await etudeService.delete(id)
        navigate('/etudes')
      } catch (error) {
        console.error('Erreur lors de la suppression:', error)
        alert('Une erreur est survenue lors de la suppression de l\'étude')
      }
    }
  }

  const getStatusBadge = (etude) => {
    const now = new Date()
    const startDate = new Date(etude.dateDebut)
    const endDate = new Date(etude.dateFin)

    let status = '';

    // Déterminer le statut en fonction des dates
    if (now < startDate) {
      status = 'A_VENIR';
    } else if (now > endDate) {
      status = 'TERMINEE';
    } else {
      status = 'EN_COURS';
    }

    switch (status) {
      case 'EN_COURS':
        return <span className="badge badge-green">En cours</span>
      case 'A_VENIR':
        return <span className="badge badge-blue">À venir</span>
      case 'TERMINEE':
        return <span className="badge badge-gray">Terminée</span>
      case 'ANNULEE':
        return <span className="badge badge-red">Annulée</span>
      default:
        return <span className="badge badge-gray">Inconnu</span>
    }
  }

  // Fonction pour changer le tri
  const handleSort = (field) => {
    if (sortField === field) {
      // Si on clique sur le même champ, on inverse le sens du tri
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // Sinon on trie par le nouveau champ en ordre ascendant
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getNomVolontaire = (rdv) => {
    // Vérifier si nous avons déjà les infos de ce volontaire dans notre état
    if (rdv.idVolontaire && infosVolontaires[rdv.idVolontaire]) {
      return infosVolontaires[rdv.idVolontaire];
    }

    // Vérifier si les données du volontaire sont disponibles dans l'objet rdv
    if (rdv.volontaire) {
      if (typeof rdv.volontaire === 'object') {
        const prenom = rdv.volontaire.prenom || rdv.volontaire.prenomVolontaire || '';
        const nom = rdv.volontaire.nom || rdv.volontaire.nomVolontaire || '';

        if (prenom || nom) {
          return `${prenom} ${nom}`.trim();
        } else if (rdv.volontaire.nomComplet) {
          return rdv.volontaire.nomComplet;
        }
      } else if (typeof rdv.volontaire === 'string') {
        return rdv.volontaire;
      }
    }

    // Vérifier si les noms des volontaires sont directement sur l'objet rdv
    if (rdv.prenomVolontaire && rdv.nomVolontaire) {
      return `${rdv.prenomVolontaire} ${rdv.nomVolontaire}`;
    } else if (rdv.nomCompletVolontaire) {
      return rdv.nomCompletVolontaire;
    }

    // Si nous n'avons que l'ID, charger les infos du volontaire
    if (rdv.idVolontaire) {
      // Définir une tâche de chargement pour récupérer les données du volontaire
      chargerInfosVolontaire(rdv.idVolontaire);
      return `Volontaire #${rdv.idVolontaire}`;
    }

    return 'Non assigné';
  };

  // Fonction pour charger les informations du volontaire
  const chargerInfosVolontaire = async (idVolontaire) => {
    // Ignorer si nous avons déjà les infos de ce volontaire
    if (infosVolontaires[idVolontaire]) return;

    try {
      // Appeler votre API pour obtenir les informations du volontaire
      const response = await axios.get(`/api/volontaires/${idVolontaire}`);
      if (response.data) {
        const volontaire = response.data;
        const nomAffiche = volontaire.prenom && volontaire.nom
          ? `${volontaire.prenom} ${volontaire.nom}`.trim()
          : volontaire.nomComplet || `Volontaire #${idVolontaire}`;

        // Mettre à jour l'état avec les nouvelles infos du volontaire
        setInfosVolontaires(prev => ({
          ...prev,
          [idVolontaire]: nomAffiche
        }));
      }
    } catch (error) {
      console.error(`Erreur lors de la récupération des infos du volontaire ${idVolontaire}:`, error);
    }
  };

  // Fonction pour trier les rendez-vous
  const sortedRdvs = () => {
    if (!rdvs || rdvs.length === 0) return []

    return [...rdvs].sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case 'date':
          comparison = new Date(a.date) - new Date(b.date)
          break
        case 'heure':
          comparison = a.heure.localeCompare(b.heure)
          break
        case 'volontaire': {
          const volontaireA = getNomVolontaire(a)
          const volontaireB = getNomVolontaire(b)
          comparison = volontaireA.localeCompare(volontaireB)
          break
        }
        case 'etat':
          comparison = (a.etat || '').localeCompare(b.etat || '')
          break
        default:
          comparison = 0
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })
  }

  // Ajoutez cet effet pour déclencher le chargement des infos des volontaires lorsque les RDVs changent
  useEffect(() => {
    // Extraire les IDs de volontaires uniques des rdvs
    if (rdvs && rdvs.length > 0) {
      const idsVolontaires = [...new Set(rdvs
        .map(rdv => rdv.idVolontaire)
        .filter(id => id && !infosVolontaires[id])
      )];

      // Charger les infos des volontaires pour chaque ID
      idsVolontaires.forEach(id => chargerInfosVolontaire(id));
    }
  }, [rdvs, infosVolontaires]);

  // Version pivot : une ligne par volontaire avec T0, T1, T2... en colonnes

  // Version pivot avec alternance de couleurs par heure

  const exportToExcel = async () => {
    try {
      console.log('Préparation de l\'export pivot avec couleurs...');

      // 1. Récupérer tous les IDs de volontaires uniques des RDV
      const volunteerIds = [...new Set(
        rdvs
          .map(rdv => rdv.idVolontaire)
          .filter(id => id)
      )];

      // 2. Récupérer les infos complètes des volontaires
      const volunteersData = {};

      if (volunteerIds.length > 0) {
        const volunteerPromises = volunteerIds.map(async (id) => {
          try {
            const response = await axios.get(`/api/volontaires/${id}`);
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

      // 3. Grouper les RDV par volontaire et calculer le nombre max de passages
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

      // 4. Fonction helper pour récupérer les infos du volontaire
      const getVolunteerInfo = (volunteerId, field) => {
        if (volunteersData[volunteerId]) {
          return volunteersData[volunteerId][field] || '';
        }
        return '';
      };

      // 5. Créer les en-têtes dynamiques
      const headers = [
        'ID Volontaire',
        'Volontaire',
        'Téléphone',
        'Email',
        'Phototype'
      ];

      // Ajouter T0, T1, T2... en fonction du nombre max de passages
      for (let i = 0; i < maxPassages; i++) {
        headers.push(`T${i} Date`);
        headers.push(`T${i} Heure`);
        headers.push(`T${i} Statut`);
      }

      // 6. Créer les lignes de données avec info sur l'heure pour le groupement
      const dataRowsWithHourInfo = [];

      Object.entries(rdvsByVolunteer).forEach(([volunteerId, volunteerRdvs]) => {
        const row = [];

        // Informations du volontaire
        row.push(volunteerId);
        row.push(getNomVolontaire(volunteerRdvs[0])); // Utiliser le premier RDV pour récupérer le nom
        row.push(getVolunteerInfo(volunteerId, 'email')); // Ajouter l'email
        row.push(getVolunteerInfo(volunteerId, 'telPortable'));
        row.push(getVolunteerInfo(volunteerId, 'phototype'));


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

        // Ajouter l'heure du premier RDV pour le groupement
        const firstHour = volunteerRdvs[0]?.heure || '';
        dataRowsWithHourInfo.push({ row, hour: firstHour });
      });

      // 7. Ajouter les RDV non assignés (chacun sur une ligne séparée)
      const unassignedRdvs = rdvs.filter(rdv => !rdv.idVolontaire);

      unassignedRdvs.forEach(rdv => {
        const row = [];

        // Informations du volontaire (vides pour non assigné)
        row.push('');
        row.push('Non assigné');
        row.push('');
        row.push('');

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

        dataRowsWithHourInfo.push({ row, hour: rdv.heure || '' });
      });

      // 8. Trier par heure pour grouper les créneaux identiques
      dataRowsWithHourInfo.sort((a, b) => (a.hour || '').localeCompare(b.hour || ''));

      // 9. Déterminer les couleurs par groupe d'heure
      const rowsWithColors = [];
      let currentHour = null;
      let isAlternateColor = false;

      dataRowsWithHourInfo.forEach(({ row, hour }) => {
        if (currentHour !== hour) {
          currentHour = hour;
          isAlternateColor = !isAlternateColor; // Alterner à chaque changement d'heure
        }

        rowsWithColors.push({
          row,
          needsColor: isAlternateColor
        });
      });

      // 10. Créer le livre Excel
      const wb = XLSX.utils.book_new();

      // 11. Créer les données pour Excel
      const wsData = [headers, ...rowsWithColors.map(item => item.row)];

      // 12. Créer une feuille de calcul
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // 13. Appliquer les couleurs de fond
      const headerRowNum = 1;

      rowsWithColors.forEach((item, index) => {
        const rowNum = headerRowNum + index + 1; // +1 pour commencer après les en-têtes

        if (item.needsColor) {
          // Appliquer une couleur de fond claire (gris très clair)
          for (let col = 0; col < headers.length; col++) {
            const cellRef = XLSX.utils.encode_cell({ r: rowNum, c: col });

            if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };

            ws[cellRef].s = {
              fill: {
                fgColor: { rgb: "F8F9FA" } // Gris très clair
              }
            };
          }
        }
      });

      // 14. Style pour les en-têtes
      for (let col = 0; col < headers.length; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });

        if (!ws[cellRef]) ws[cellRef] = { t: 's', v: headers[col] };

        ws[cellRef].s = {
          fill: {
            fgColor: { rgb: "4F81BD" } // Bleu foncé
          },
          font: {
            color: { rgb: "FFFFFF" }, // Texte blanc
            bold: true
          },
          alignment: {
            horizontal: "center",
            vertical: "center"
          }
        };
      }

      // 15. Définir la largeur des colonnes
      const colWidths = [
        { width: 12 }, // ID Volontaire
        { width: 30 }, // Volontaire
        { width: 15 }, // Téléphone
        { width: 15 }  // Phototype
      ];

      // Ajouter les largeurs pour T0, T1, T2...
      for (let i = 0; i < maxPassages; i++) {
        colWidths.push({ width: 12 }); // Date
        colWidths.push({ width: 8 });  // Heure
        colWidths.push({ width: 12 }); // Statut
      }

      ws['!cols'] = colWidths;

      // 16. Ajouter la feuille au livre
      XLSX.utils.book_append_sheet(wb, ws, 'Rendez-vous Pivot');

      // 17. Générer le fichier Excel et le télécharger
      XLSX.writeFile(wb, `rdvs-pivot-etude-${etude.ref}.xlsx`);

      console.log(`Export Excel réussi avec format pivot et couleurs - ${maxPassages} passages max`);

      // Debug
      console.log(`Volontaires avec RDV: ${Object.keys(rdvsByVolunteer).length}`);
      console.log(`RDV non assignés: ${unassignedRdvs.length}`);
      console.log(`Passages maximum: ${maxPassages}`);

      // Compter les groupes d'heures
      const hourGroups = [...new Set(dataRowsWithHourInfo.map(item => item.hour))];
      console.log(`Créneaux horaires distincts: ${hourGroups.length}`, hourGroups);

    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
      alert('Une erreur est survenue lors de l\'export Excel');
    }
  };
  // Affichage de l'icône de tri avec SVG
  const renderSortIcon = (field) => {
    if (sortField !== field) return null

    return sortDirection === 'asc' ? (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        {error}
      </div>
    )
  }

  if (!etude) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative">
        Étude non trouvée
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          Détails de l'étude: {etude.titre}
        </h1>
        <div className="flex space-x-2">
          <Link
            to={`/etudes/${etude.idEtude}/edit`}
            className="btn btn-outline-primary"
          >
            Modifier
          </Link>
          <button
            onClick={handleDelete}
            className="btn btn-outline-danger"
          >
            Supprimer
          </button>
        </div>
      </div>

      {/* Onglets */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              className={`py-4 px-6 border-b-2 font-medium text-sm ${activeTab === 'details'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              onClick={() => setActiveTab('details')}
            >
              Détails
            </button>
            <button
              className={`py-4 px-6 border-b-2 font-medium text-sm ${activeTab === 'rdvs'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              onClick={() => setActiveTab('rdvs')}
            >
              Rendez-vous
            </button>
          </nav>
        </div>

        {/* Contenu des onglets */}
        <div className="p-6">
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2 flex justify-between items-center">
                <div>
                  <span className="text-xs uppercase text-gray-500">Référence</span>
                  <h2 className="text-xl font-semibold">{etude.ref}</h2>
                </div>
                <div>
                  {getStatusBadge(etude)}
                </div>
              </div>

              <div className="md:col-span-2">
                <span className="text-xs uppercase text-gray-500">Titre</span>
                <p className="text-lg">{etude.titre}</p>
              </div>

              <div className="md:col-span-2">
                <span className="text-xs uppercase text-gray-500">Description</span>
                <p className="mt-1 whitespace-pre-line">{etude.description || 'Aucune description'}</p>
              </div>

              <div className="md:col-span-2">
                <span className="text-xs uppercase text-gray-500">Examen</span>
                <p className="mt-1">{etude.examens || 'Aucun examen spécifié'}</p>
              </div>

              <div>
                <span className="text-xs uppercase text-gray-500">Type</span>
                <p className="mt-1">{etude.type}</p>
              </div>

              <div>
                <span className="text-xs uppercase text-gray-500">Capacité</span>
                <p className="mt-1">{etude.capaciteVolontaires} volontaires</p>
              </div>

              <div>
                <span className="text-xs uppercase text-gray-500">Date de début</span>
                <p className="mt-1">{formatDate(etude.dateDebut)}</p>
              </div>

              <div>
                <span className="text-xs uppercase text-gray-500">Date de fin</span>
                <p className="mt-1">{formatDate(etude.dateFin)}</p>
              </div>

              <div>
                <span className="text-xs uppercase text-gray-500">Rémunération</span>
                <p className="mt-1">
                  {etude.iv ? `Oui - ${etude.iv} €` : 'Non'}
                </p>
              </div>

              <div>
                <span className="text-xs uppercase text-gray-500">Payer</span>
                <p className="mt-1">
                  {etude.paye ? `Oui - ${etude.paye}` : 'Non'}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'rdvs' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Rendez-vous de l'étude</h3>

                <div className="flex space-x-2">
                  {rdvs.length > 0 && (
                    <button
                      onClick={exportToExcel}
                      className="btn btn-outline-success btn-sm"
                    >
                      Exporter Excel
                    </button>
                  )}
                  <Link
                    to={`/rdvs/assigner`}
                    className="btn btn-primary btn-sm"
                  >
                    Ajouter un RDV
                  </Link>
                </div>
              </div>

              {isLoadingRdvs ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
                </div>
              ) : rdvs.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Aucun rendez-vous pour cette étude</p>
                  <Link
                    to={`/rdvs/nouveau?etudeId=${etude.idEtude}`}
                    className="mt-2 inline-block text-primary-600 hover:text-primary-800"
                  >
                    Planifier un rendez-vous
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort('date')}
                        >
                          <span className="flex items-center">
                            Date
                            {renderSortIcon('date')}
                          </span>
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort('heure')}
                        >
                          <span className="flex items-center">
                            Heure
                            {renderSortIcon('heure')}
                          </span>
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort('volontaire')}
                        >
                          <span className="flex items-center">
                            Volontaire
                            {renderSortIcon('volontaire')}
                          </span>
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort('etat')}
                        >
                          <span className="flex items-center">
                            Statut
                            {renderSortIcon('etat')}
                          </span>
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sortedRdvs().map((rdv) => (
                        <tr key={rdv.id || `${rdv.idEtude}-${rdv.idRdv}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(rdv.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {rdv.heure}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {getNomVolontaire(rdv)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${rdv.etat === 'CONFIRME' ? 'bg-green-100 text-green-800' :
                              rdv.etat === 'EN_ATTENTE' ? 'bg-yellow-100 text-yellow-800' :
                                rdv.etat === 'ANNULE' ? 'bg-red-100 text-red-800' :
                                  rdv.etat === 'COMPLETE' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'
                              }`}>
                              {rdv.etat || 'PLANIFIE'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link
                              to={`/rdvs/${rdv.idEtude || etude.idEtude}/${rdv.idRdv || rdv.id}/edit`}
                              className="text-primary-600 hover:text-primary-900 mr-3"
                            >
                              Modifier
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4">
        <Link
          to="/etudes"
          className="text-primary-600 hover:text-primary-800"
        >
          &larr; Retour à la liste des études
        </Link>
      </div>
    </div>
  )
}

export default EtudeDetail