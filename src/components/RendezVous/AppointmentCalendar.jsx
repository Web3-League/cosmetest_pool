import { useState, useEffect, useMemo } from 'react';
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek, addDays, isToday, isSameDay, getWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import rdvService from '../../services/rdvService';
import etudeService from '../../services/etudeService';

const AppointmentCalendar = ({ onAppointmentClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  // Charger TOUS les rendez-vous (pas seulement la semaine) pour le tri temporel
  const [allAppointments, setAllAppointments] = useState([]);
  const [studies, setStudies] = useState([]);
  const [expandedStudy, setExpandedStudy] = useState(null); // Format: "date-studyId-timeSlot"
  const [selectedStudyRdvs, setSelectedStudyRdvs] = useState(null); // Pour afficher les RDV d'une étude
  const [isLoadingStudyRdvs, setIsLoadingStudyRdvs] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studiesLoading, setStudiesLoading] = useState(true);
  const [studyMap, setStudyMap] = useState({});

  // Charger les études - méthode améliorée
  useEffect(() => {
    const loadStudies = async () => {
      try {
        setStudiesLoading(true);

        // Première approche: Essayer de charger toutes les études
        const etudesResponse = await etudeService.getAll();
        let etudesArray = etudesResponse?.data || etudesResponse || [];

        // Vérifier si nous avons reçu une réponse paginée
        if (etudesResponse && etudesResponse.data && etudesResponse.data.pageable) {
          // Si c'est paginé, essayer de récupérer toutes les pages
          const totalPages = etudesResponse.data.totalPages || 1;
          let allStudies = [...(etudesResponse.data.content || [])];

          // Charger les pages restantes si nécessaire
          if (totalPages > 1) {
            const pagePromises = [];
            for (let page = 1; page < totalPages; page++) {
              pagePromises.push(etudeService.getAll(page));
            }

            const pageResults = await Promise.all(pagePromises);

            for (const pageResult of pageResults) {
              const pageContent = pageResult?.data?.content || pageResult.content || [];
              allStudies = [...allStudies, ...pageContent];
            }
          }

          etudesArray = allStudies;
        }

        // Deuxième approche: Si aucune étude n'est trouvée, extraire les études des rendez-vous
        if (!Array.isArray(etudesArray) || etudesArray.length === 0) {
          // Récupérer les études à partir des rendez-vous existants
          try {
            const studiesFromRdv = await rdvService.getStudiesWithRdvCount();
            const extractedStudies = studiesFromRdv?.content || studiesFromRdv || [];

            if (Array.isArray(extractedStudies) && extractedStudies.length > 0) {
              etudesArray = extractedStudies.map(study => ({
                id: study.id,
                idEtude: study.id,
                ref: study.ref,
                titre: study.titre
              }));
            }
          } catch (error) {
            console.error("Erreur lors de l'extraction des études depuis les rendez-vous:", error);
          }
        }

        // Créer un Map pour un accès rapide aux études par ID
        const newStudyMap = {};
        if (Array.isArray(etudesArray)) {
          etudesArray.forEach(study => {
            const studyId = study.idEtude || study.id;
            if (studyId) {
              newStudyMap[studyId] = study;
            }
          });
        }
        setStudies(Array.isArray(etudesArray) ? etudesArray : []);
        setStudyMap(newStudyMap);
      } catch (err) {
        console.error("Erreur lors du chargement des études:", err);
        setStudies([]);
      } finally {
        setStudiesLoading(false);
      }
    };

    loadStudies();
  }, []);

  // Fonction pour enrichir les rendez-vous avec les données d'études complètes
  const enrichAppointmentsWithStudies = (appointments) => {
    if (!appointments || !Array.isArray(appointments) || appointments.length === 0) {
      return [];
    }

    // Créer un ensemble des IDs d'études déjà présentes dans les rendez-vous
    const existingStudyIds = new Set();
    appointments.forEach(appointment => {
      if (appointment.etude && appointment.etude.id) {
        existingStudyIds.add(appointment.etude.id);
      }
      if (appointment.idEtude) {
        existingStudyIds.add(appointment.idEtude);
      }
    });
    // Créer une map des études manquantes qui doivent être extraites manuellement
    const extractedStudies = {};

    // Enrichir chaque rendez-vous avec les données d'études du studyMap
    return appointments.map(appointment => {
      // Identifier l'ID de l'étude associée à ce rendez-vous
      const idEtude = appointment.idEtude || (appointment.etude && appointment.etude.id);

      if (!idEtude) {
        return appointment; // Pas d'ID d'étude, retourner tel quel
      }

      // Chercher l'étude dans notre map d'études
      const study = studyMap[idEtude];

      if (study) {
        // Si nous avons trouvé l'étude, l'utiliser pour enrichir le rendez-vous
        let enrichedAppointment;

        if (appointment.etude) {
          // Si le rendez-vous a déjà un objet étude, le compléter
          enrichedAppointment = {
            ...appointment,
            etude: {
              ...appointment.etude,
              ...study,
              // Garantir que l'ID est toujours disponible pour les deux formats
              id: idEtude,
              idEtude: idEtude
            }
          };
        } else {
          // Si le rendez-vous n'a pas d'objet étude, en créer un
          enrichedAppointment = {
            ...appointment,
            etude: {
              ...study,
              // Garantir que l'ID est toujours disponible pour les deux formats
              id: idEtude,
              idEtude: idEtude
            }
          };
        }

        return enrichedAppointment;
      } else {
        // Si l'étude n'est pas dans notre map, extraire ce qu'on peut du rendez-vous
        if (!extractedStudies[idEtude] && appointment.etude) {
          // Mémoriser cette étude partiellement connue pour une utilisation ultérieure
          extractedStudies[idEtude] = appointment.etude;
        }

        // Si le rendez-vous a déjà un objet étude, le conserver
        if (appointment.etude) {
          return appointment;
        }

        // Si nous avons extrait une étude précédemment, l'utiliser
        if (extractedStudies[idEtude]) {
          return {
            ...appointment,
            etude: extractedStudies[idEtude]
          };
        }

        // Dernier recours: créer un objet étude minimal
        return {
          ...appointment,
          etude: {
            id: idEtude,
            idEtude: idEtude,
            ref: `#${idEtude}`,
            titre: "Étude inconnue"
          }
        };
      }
    });
  };

  // Calculer la semaine actuelle
  const weekStart = useMemo(() => {
    return startOfWeek(currentDate, { weekStartsOn: 1 }); // 1 = Lundi
  }, [currentDate]);

  const weekEnd = useMemo(() => {
    return endOfWeek(currentDate, { weekStartsOn: 1 });
  }, [currentDate]);

  // Charger les rendez-vous pour la semaine ET tous les rendez-vous pour le tri temporel
  useEffect(() => {
    const loadWeekAppointments = async () => {
      try {
        setIsLoading(true);

        // Formatage des dates au format YYYY-MM-DD attendu par l'API
        const startDate = format(weekStart, 'yyyy-MM-dd');
        const endDate = format(weekEnd, 'yyyy-MM-dd');

        // Récupérer les RDV de cette semaine
        let weekAppointments = [];
        let currentPage = 0;
        let hasMorePages = true;

        while (hasMorePages) {
          try {
            const response = await rdvService.getRdvsByPeriod(startDate, endDate, currentPage);

            let pageData = [];
            if (response?.data?.content) {
              pageData = response.data.content;
              hasMorePages = currentPage < (response.data.totalPages - 1);
            } else if (Array.isArray(response?.data)) {
              pageData = response.data;
              hasMorePages = false;
            } else if (Array.isArray(response)) {
              pageData = response;
              hasMorePages = false;
            } else {
              hasMorePages = false;
            }

            weekAppointments = [...weekAppointments, ...pageData];
            currentPage++;

            if (currentPage > 100) break;

          } catch (pageError) {
            console.error(`Erreur lors du chargement de la page ${currentPage}:`, pageError);
            hasMorePages = false;
          }
        }

        // Charger TOUS les rendez-vous pour le tri temporel (sur une plage plus large)
        if (allAppointments.length === 0) {
          try {
            // Charger les RDV sur 6 mois autour de la semaine courante
            const startDateLarge = format(addDays(weekStart, -90), 'yyyy-MM-dd'); // 3 mois avant
            const endDateLarge = format(addDays(weekEnd, 90), 'yyyy-MM-dd'); // 3 mois après

            let allRdv = [];
            let pageAll = 0;
            let hasMoreAllPages = true;

            while (hasMoreAllPages && pageAll < 50) { // Limiter à 50 pages pour éviter la surcharge
              try {
                const responseAll = await rdvService.getRdvsByPeriod(startDateLarge, endDateLarge, pageAll);

                let pageAllData = [];
                if (responseAll?.data?.content) {
                  pageAllData = responseAll.data.content;
                  hasMoreAllPages = pageAll < (responseAll.data.totalPages - 1);
                } else if (Array.isArray(responseAll?.data)) {
                  pageAllData = responseAll.data;
                  hasMoreAllPages = false;
                } else if (Array.isArray(responseAll)) {
                  pageAllData = responseAll;
                  hasMoreAllPages = false;
                } else {
                  hasMoreAllPages = false;
                }

                allRdv = [...allRdv, ...pageAllData];
                pageAll++;

              } catch (pageError) {
                console.error(`Erreur lors du chargement page all ${pageAll}:`, pageError);
                hasMoreAllPages = false;
              }
            }

            // Normaliser le format des heures
            const normalizedAllRdv = allRdv.map(appointment => ({
              ...appointment,
              heure: appointment.heure ? appointment.heure.replace('h', ':') : appointment.heure
            }));

            setAllAppointments(normalizedAllRdv);
          } catch (err) {
            console.error("Erreur lors du chargement de tous les RDV:", err);
          }
        }

        // Normaliser le format des heures pour la semaine
        const normalizedWeekAppointments = weekAppointments.map(appointment => ({
          ...appointment,
          heure: appointment.heure ? appointment.heure.replace('h', ':') : appointment.heure
        }));

        // Enrichir les rendez-vous avec les données d'études
        const enrichedAppointments = enrichAppointmentsWithStudies(normalizedWeekAppointments);

        setAppointments(enrichedAppointments);
        setError(null);
      } catch (err) {
        setError('Erreur lors du chargement des rendez-vous: ' + err.message);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    // Attendre que les études soient chargées avant de charger les rendez-vous
    if (!studiesLoading) {
      loadWeekAppointments();
    }
  }, [weekStart, weekEnd, studiesLoading]);

  // Fonction utilitaire pour formater les dates de manière cohérente
  const formatToISODate = (date) => {
    if (!date) return null;

    // Si c'est déjà une chaîne, essayer de la parser
    if (typeof date === 'string') {
      try {
        // Gestion de différents formats possibles
        if (date.includes('T')) {
          // Format ISO avec heure
          return date.split('T')[0];
        } else if (date.includes('/')) {
          // Format DD/MM/YYYY
          const [day, month, year] = date.split('/');
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        } else if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // Déjà au format YYYY-MM-DD
          return date;
        }
      } catch (e) {
        console.error("Erreur lors du formatage de la date:", date, e);
        return null;
      }
    } else if (date instanceof Date) {
      // Si c'est un objet Date
      return format(date, 'yyyy-MM-dd');
    }

    return null;
  };

  // Calculer les jours de la semaine
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i);
      days.push({
        date,
        day: format(date, 'd'),
        dayName: format(date, 'EEEE', { locale: fr }),
        isToday: isToday(date)
      });
    }
    return days;
  }, [weekStart]);

  // Organiser les rendez-vous par date et par créneaux horaires et études
  const appointmentsByDate = useMemo(() => {
    const mapped = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!appointments || !Array.isArray(appointments)) return mapped;

    appointments.forEach(appointment => {
      try {
        // Normaliser la date
        const dateKey = formatToISODate(appointment.date);

        if (dateKey) {
          if (!mapped[dateKey]) {
            mapped[dateKey] = {};
          }

          // Déterminer si le rendez-vous est passé, à venir ou aujourd'hui
          const appointmentDate = new Date(dateKey);
          appointmentDate.setHours(0, 0, 0, 0);

          let timeStatus = "upcoming";
          if (isSameDay(appointmentDate, today)) {
            timeStatus = "today";
          } else if (appointmentDate < today) {
            timeStatus = "past";
          }

          // Créer un créneau horaire (arrondir à l'heure la plus proche)
          const heure = appointment.heure || '00:00';
          const timeSlot = heure.split(':')[0] + ':00'; // Ex: "14:30" devient "14:00"

          if (!mapped[dateKey][timeSlot]) {
            mapped[dateKey][timeSlot] = {};
          }

          // Grouper par étude dans ce créneau
          const idEtude = appointment.idEtude || (appointment.etude && appointment.etude.id) || 'unknown';
          const studyKey = `study-${idEtude}`;

          if (!mapped[dateKey][timeSlot][studyKey]) {
            mapped[dateKey][timeSlot][studyKey] = {
              etude: appointment.etude || {
                id: idEtude,
                ref: `#${idEtude}`,
                titre: 'Étude inconnue'
              },
              appointments: [],
              statuses: new Set(),
              timeStatuses: new Set()
            };
          }

          // Ajouter le rendez-vous au groupe d'étude
          mapped[dateKey][timeSlot][studyKey].appointments.push({
            ...appointment,
            timeStatus
          });
          mapped[dateKey][timeSlot][studyKey].statuses.add(appointment.etat);
          mapped[dateKey][timeSlot][studyKey].timeStatuses.add(timeStatus);
        }
      } catch (error) {
        console.error("Erreur lors du traitement du rendez-vous:", appointment, error);
      }
    });

    // Trier les rendez-vous par heure dans chaque groupe d'étude
    Object.keys(mapped).forEach(date => {
      Object.keys(mapped[date]).forEach(timeSlot => {
        Object.keys(mapped[date][timeSlot]).forEach(studyKey => {
          mapped[date][timeSlot][studyKey].appointments.sort((a, b) => {
            const timeA = a.heure || '';
            const timeB = b.heure || '';
            return timeA.localeCompare(timeB);
          });
        });
      });
    });

    return mapped;
  }, [appointments]);

  // Fonctions de navigation dans le calendrier
  const goToPreviousWeek = () => setCurrentDate(prev => subWeeks(prev, 1));
  const goToNextWeek = () => setCurrentDate(prev => addWeeks(prev, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Gestion de l'expansion des études
  const toggleStudyExpansion = (date, timeSlot, studyKey) => {
    const expandKey = `${date}-${studyKey}-${timeSlot}`;
    setExpandedStudy(expandedStudy === expandKey ? null : expandKey);
  };

  // Charger tous les RDV d'une étude spécifique
  const loadStudyRdvs = async (study) => {
    try {
      setIsLoadingStudyRdvs(true);
      const studyId = study.id || study.idEtude;

      // Récupérer UNIQUEMENT les RDV de cette étude spécifique
      let allStudyRdvs = [];
      let currentPage = 0;
      let hasMorePages = true;

      while (hasMorePages) {
        try {
          // Utiliser searchByEtude qui filtre par idEtude uniquement
          const response = await rdvService.searchByEtude(studyId, currentPage, 50);

          const pageData = response?.content || [];

          // Double vérification : s'assurer que tous les RDV appartiennent bien à cette étude
          const filteredData = pageData.filter(rdv => {
            const rdvStudyId = rdv.idEtude || (rdv.etude && rdv.etude.id);
            return rdvStudyId == studyId;
          });

          allStudyRdvs = [...allStudyRdvs, ...filteredData];

          // Vérifier s'il y a plus de pages
          hasMorePages = response?.totalPages && currentPage < (response.totalPages - 1);
          currentPage++;

          // Sécurité pour éviter les boucles infinies
          if (currentPage > 20) break;

        } catch (pageError) {
          console.error(`Erreur lors du chargement de la page ${currentPage}:`, pageError);
          hasMorePages = false;
        }
      }

      // Normaliser le format des heures et enrichir avec les données temporelles
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const enrichedRdvs = allStudyRdvs.map(rdv => {
        const normalizedRdv = {
          ...rdv,
          heure: rdv.heure ? rdv.heure.replace('h', ':') : rdv.heure
        };

        // Déterminer le statut temporel
        try {
          const rdvDate = new Date(formatToISODate(rdv.date));
          rdvDate.setHours(0, 0, 0, 0);

          let timeStatus = "upcoming";
          if (isSameDay(rdvDate, today)) {
            timeStatus = "today";
          } else if (rdvDate < today) {
            timeStatus = "past";
          }

          return { ...normalizedRdv, timeStatus };
        } catch (e) {
          return { ...normalizedRdv, timeStatus: "unknown" };
        }
      });

      // Organiser les RDV par catégories temporelles
      const categorizedRdvs = {
        past: enrichedRdvs.filter(rdv => rdv.timeStatus === 'past').sort((a, b) => new Date(b.date) - new Date(a.date)),
        today: enrichedRdvs.filter(rdv => rdv.timeStatus === 'today').sort((a, b) => (a.heure || '').localeCompare(b.heure || '')),
        upcoming: enrichedRdvs.filter(rdv => rdv.timeStatus === 'upcoming').sort((a, b) => new Date(a.date) - new Date(b.date))
      };

      setSelectedStudyRdvs({
        study,
        rdvs: categorizedRdvs,
        total: allStudyRdvs.length
      });

    } catch (error) {
      console.error('Erreur lors du chargement des RDV de l\'étude:', error);
      setError('Erreur lors du chargement des rendez-vous de l\'étude');
    } finally {
      setIsLoadingStudyRdvs(false);
    }
  };

  // Fermer la vue des RDV d'une étude
  const closeStudyRdvs = () => {
    setSelectedStudyRdvs(null);
  };

  // Déterminer la classe de couleur en fonction du statut
  const getStatusColor = (statuses, timeStatuses, isExpanded = false) => {
    const timeStatus = getPredominantTimeStatus(timeStatuses);
    let baseColor;

    // Déterminer le statut principal
    let mainStatus = null;
    if (statuses.has('ANNULE')) mainStatus = 'ANNULE';
    else if (statuses.has('EN_ATTENTE')) mainStatus = 'EN_ATTENTE';
    else if (statuses.has('CONFIRME')) mainStatus = 'CONFIRME';
    else if (statuses.has('COMPLETE')) mainStatus = 'COMPLETE';
    else if (statuses.has('PLANIFIE')) mainStatus = 'PLANIFIE';

    switch (mainStatus) {
      case 'CONFIRME':
        baseColor = timeStatus === "past" ?
          'bg-green-100 text-green-700 border-green-400' :
          timeStatus === "today" ?
            'bg-green-200 text-green-900 border-green-500' :
            'bg-green-100 text-green-800 border-green-500';
        break;
      case 'EN_ATTENTE':
        baseColor = timeStatus === "past" ?
          'bg-yellow-100 text-yellow-700 border-yellow-400' :
          timeStatus === "today" ?
            'bg-yellow-200 text-yellow-900 border-yellow-500' :
            'bg-yellow-100 text-yellow-800 border-yellow-500';
        break;
      case 'ANNULE':
        baseColor = timeStatus === "past" ?
          'bg-red-100 text-red-700 border-red-400' :
          timeStatus === "today" ?
            'bg-red-200 text-red-900 border-red-500' :
            'bg-red-100 text-red-800 border-red-500';
        break;
      case 'COMPLETE':
        baseColor = timeStatus === "past" ?
          'bg-blue-100 text-blue-700 border-blue-400' :
          timeStatus === "today" ?
            'bg-blue-200 text-blue-900 border-blue-500' :
            'bg-blue-100 text-blue-800 border-blue-500';
        break;
      case 'PLANIFIE':
        baseColor = timeStatus === "past" ?
          'bg-purple-100 text-purple-700 border-purple-400' :
          timeStatus === "today" ?
            'bg-purple-200 text-purple-900 border-purple-500' :
            'bg-purple-100 text-purple-800 border-purple-500';
        break;
      default:
        baseColor = timeStatus === "past" ?
          'bg-gray-100 text-gray-700 border-gray-400' :
          timeStatus === "today" ?
            'bg-gray-200 text-gray-900 border-gray-500' :
            'bg-gray-100 text-gray-800 border-gray-500';
    }

    const shadowClass = isExpanded ? 'shadow-md' : 'shadow-sm';
    return `${baseColor} ${shadowClass}`;
  };

  // Déterminer le statut temporel prédominant (passé, présent ou futur)
  const getPredominantTimeStatus = (timeStatuses) => {
    if (timeStatuses.has('today')) return 'today';
    if (timeStatuses.has('upcoming')) return 'upcoming';
    return 'past';
  };

  // Obtenir l'icône pour le statut temporel
  const getTimeStatusIcon = (timeStatus) => {
    switch (timeStatus) {
      case 'past':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      case 'today':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
          </svg>
        );
      case 'upcoming':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Afficher une indication du chargement des études
  if (studiesLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
        <p>Chargement des études et du calendrier...</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
        <p>Chargement du calendrier...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center text-red-600">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* En-tête du calendrier avec navigation et stats */}
      <div className="p-6 bg-gradient-to-r from-blue-100 to-indigo-100 border-b">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={goToPreviousWeek}
              className="p-2 rounded-full hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              aria-label="Semaine précédente"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-1">
                <h2 className="text-2xl font-bold text-gray-800">
                  Semaine du {format(weekStart, 'd MMMM', { locale: fr })} au {format(weekEnd, 'd MMMM yyyy', { locale: fr })}
                </h2>
                <span className="bg-white px-3 py-1 rounded-full shadow-sm border border-blue-300 text-sm font-bold text-blue-700">
                  S{getWeek(weekStart, { weekStartsOn: 1 })}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {format(weekStart, 'MMMM yyyy', { locale: fr })}
              </p>
            </div>
            <button
              onClick={goToNextWeek}
              className="p-2 rounded-full hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              aria-label="Semaine suivante"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
          <button
            onClick={goToToday}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 transition shadow-sm font-medium"
          >
            Aujourd'hui
          </button>
        </div>
      </div>

      {/* Vue hebdomadaire */}
      <div className="grid grid-cols-7 divide-x divide-gray-200 min-h-[600px] max-h-[800px]">
        {weekDays.map((day, idx) => {
          const dateString = format(day.date, 'yyyy-MM-dd');
          const dayData = appointmentsByDate[dateString] || {};
          const timeSlots = Object.keys(dayData).sort();
          const hasAppointments = timeSlots.length > 0;

          return (
            <div
              key={idx}
              className={`flex flex-col ${day.isToday
                ? 'bg-blue-50'
                : 'bg-white'
                } ${idx === 0 ? '' : 'border-l'} ${idx === 6 ? '' : 'border-r'}`}
            >
              {/* En-tête du jour */}
              <div className={`p-4 border-b ${day.isToday ? 'bg-blue-100' : 'bg-gray-50'}`}>
                <div className="text-center">
                  <div className="text-sm font-semibold text-gray-600 uppercase">
                    {format(day.date, 'EEE', { locale: fr })}
                  </div>
                  <div className={`text-2xl font-bold mt-1 ${day.isToday
                    ? 'bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center mx-auto'
                    : 'text-gray-800'
                    }`}>
                    {day.day}
                  </div>
                  {hasAppointments && (
                    <div className="mt-2">
                      <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1 font-bold">
                        {timeSlots.length} créneaux
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Liste des créneaux horaires et études */}
              <div className="flex-1 p-3 overflow-y-auto max-h-[calc(800px-120px)]">
                <div className="space-y-4">
                  {timeSlots.map((timeSlot) => {
                    const studies = dayData[timeSlot];
                    const studyKeys = Object.keys(studies);

                    return (
                      <div key={timeSlot} className="space-y-3">
                        {/* Créneau horaire */}
                        <div className="text-sm font-bold text-gray-700 bg-gray-100 px-3 py-2 rounded-md text-center shadow-sm">
                          {timeSlot}
                        </div>

                        {/* Études dans ce créneau */}
                        <div className="space-y-3 ml-2">
                          {studyKeys.map((studyKey) => {
                            const studyGroup = studies[studyKey];
                            const expandKey = `${dateString}-${studyKey}-${timeSlot}`;
                            const isExpanded = expandedStudy === expandKey;

                            return (
                              <div key={studyKey} className="space-y-2">
                                {/* Carte de l'étude (cliquable) */}
                                <div
                                  className={`p-4 rounded-lg border-l-4 cursor-pointer hover:shadow-lg transition-all ${getStatusColor(studyGroup.statuses, studyGroup.timeStatuses, isExpanded)}`}
                                  onClick={() => toggleStudyExpansion(dateString, timeSlot, studyKey)}
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                      <div className="font-bold text-base">
                                        {studyGroup.etude.ref || `#${studyGroup.etude.id}`}
                                      </div>
                                      {studyGroup.etude.titre && (
                                        <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                                          {studyGroup.etude.titre}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 ml-3">
                                      {getTimeStatusIcon(getPredominantTimeStatus(studyGroup.timeStatuses))}
                                      <span className="bg-white bg-opacity-80 text-sm rounded-full px-3 py-1 font-bold border">
                                        {studyGroup.appointments.length}
                                      </span>
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                      </svg>
                                    </div>
                                  </div>
                                </div>

                                {/* Rendez-vous détaillés (si étendu) */}
                                {isExpanded && (
                                  <div className="ml-6 space-y-3 border-l-2 border-gray-300 pl-4">
                                    {studyGroup.appointments.map((appointment, appointmentIdx) => (
                                      <div
                                        key={`appointment-${appointmentIdx}`}
                                        className="p-3 bg-white rounded-lg border shadow-sm hover:shadow-md cursor-pointer transition-all"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onAppointmentClick(appointment);
                                        }}
                                      >
                                        <div className="flex justify-between items-start mb-2">
                                          <span className="font-medium text-base">
                                            {appointment.heure || 'Heure non spécifiée'}
                                          </span>
                                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(new Set([appointment.etat]), new Set([appointment.timeStatus])).replace('border-l-4', '')}`}>
                                            {appointment.etat || 'Non défini'}
                                          </span>
                                        </div>

                                        <div className="text-sm flex items-center gap-2 mb-2">
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                          </svg>
                                          {appointment.volontaire ?
                                            `${appointment.volontaire.prenom} ${appointment.volontaire.nom}` :
                                            'Volontaire non assigné'}
                                        </div>

                                        {appointment.commentaires && (
                                          <div className="text-sm italic mt-2 p-2 bg-gray-50 rounded-md">
                                            {appointment.commentaires}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* Section: Toutes les études selon leurs dates (passées, présentes, futures) */}
                  {(() => {
                    // Pour ce jour spécifique, trouver TOUTES les études qui se déroulent ce jour-là
                    const currentDayString = format(day.date, 'yyyy-MM-dd');
                    const studiesForThisDay = Object.values(studyMap).filter(study => {
                      // Vérifier si l'étude se déroule ce jour selon ses dates début/fin
                      const dateDebut = study.dateDebut;
                      const dateFin = study.dateFin;

                      if (!dateDebut) return false; // Pas de date de début

                      try {
                        // Normaliser les dates au format YYYY-MM-DD
                        const debutFormatted = formatToISODate(dateDebut);
                        const finFormatted = dateFin ? formatToISODate(dateFin) : debutFormatted;

                        if (!debutFormatted) return false;

                        // Vérifier si le jour actuel est dans la plage de l'étude
                        return currentDayString >= debutFormatted && currentDayString <= (finFormatted || debutFormatted);
                      } catch (e) {
                        console.error('Erreur lors du traitement des dates d\'étude:', study, e);
                        return false;
                      }
                    });

                    // Séparer les études selon qu'elles aient des RDV cette semaine ou non
                    const studiesWithRdvThisWeek = studiesForThisDay.filter(study => {
                      const hasRdvThisWeek = appointments.some(apt => {
                        const idEtude = apt.idEtude || (apt.etude && apt.etude.id);
                        return idEtude == study.id || idEtude == study.idEtude;
                      });
                      return hasRdvThisWeek;
                    });

                    const studiesWithoutRdvThisWeek = studiesForThisDay.filter(study => {
                      const hasRdvThisWeek = appointments.some(apt => {
                        const idEtude = apt.idEtude || (apt.etude && apt.etude.id);
                        return idEtude == study.id || idEtude == study.idEtude;
                      });
                      return !hasRdvThisWeek;
                    });

                    // Si aucune étude pour ce jour, ne rien afficher
                    if (studiesForThisDay.length === 0) return null;

                    // Trier par date de début puis par référence
                    const sortedStudiesWithoutRdv = studiesWithoutRdvThisWeek.sort((a, b) => {
                      const dateA = a.dateDebut || '';
                      const dateB = b.dateDebut || '';
                      if (dateA !== dateB) {
                        return dateB.localeCompare(dateA); // Plus récent en premier
                      }
                      const refA = a.ref || `#${a.id || a.idEtude}`;
                      const refB = b.ref || `#${b.id || b.idEtude}`;
                      return refA.localeCompare(refB);
                    });

                    // Limiter à 10 études par jour pour la performance
                    const displayStudies = sortedStudiesWithoutRdv.slice(0, 10);

                    return (
                      <div className="mt-4 pt-3 border-t border-gray-200">
                        <div className="text-xs font-bold text-gray-600 bg-gray-100 px-3 py-2 rounded-md text-center shadow-sm mb-3">
                          🔬 Études ce jour ({displayStudies.length}
                          {studiesWithRdvThisWeek.length > 0 && ` + ${studiesWithRdvThisWeek.length} avec RDV`})
                        </div>
                        <div className="space-y-2">
                          {displayStudies.map((study, studyIdx) => {
                            // Calculer le statut temporel pour ce jour
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const dayDate = new Date(day.date);
                            dayDate.setHours(0, 0, 0, 0);

                            let dayStatus = "future";
                            if (isSameDay(dayDate, today)) {
                              dayStatus = "today";
                            } else if (dayDate < today) {
                              dayStatus = "past";
                            }

                            // Informations sur la période de l'étude
                            const dateDebut = study.dateDebut;
                            const dateFin = study.dateFin;
                            let periodInfo = "";

                            if (dateDebut && dateFin && dateDebut !== dateFin) {
                              // Étude sur plusieurs jours
                              const debut = new Date(dateDebut);
                              const fin = new Date(dateFin);
                              const dureeJours = Math.ceil((fin - debut) / (1000 * 60 * 60 * 24)) + 1;
                              periodInfo = `Étude ${dureeJours} jours (${format(debut, 'dd/MM', { locale: fr })} - ${format(fin, 'dd/MM', { locale: fr })})`;
                            } else if (dateDebut) {
                              // Étude d'un jour
                              const debut = new Date(dateDebut);
                              periodInfo = `Étude 1 jour (${format(debut, 'dd/MM/yyyy', { locale: fr })})`;
                            } else {
                              periodInfo = "Période non définie";
                            }


                            return (
                              <div
                                key={`study-day-${study.id || study.idEtude}-${studyIdx}`}
                                className={`p-2 rounded border border-gray-200 hover:bg-gray-100 cursor-pointer transition-colors ${dayStatus === 'today' ? 'bg-blue-50 border-blue-300' :
                                  dayStatus === 'past' ? 'bg-gray-50' :
                                    'bg-green-50 border-green-300'
                                  }`}
                                onClick={() => {
                                  loadStudyRdvs(study);
                                }}
                              >
                                <div className="flex justify-between items-start mb-1">
                                  <div className="text-sm font-medium text-gray-700">
                                    {study.ref || `#${study.id || study.idEtude}`}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {study.type || 'Type non défini'}
                                  </div>
                                </div>

                                {study.titre && (
                                  <div className="text-xs text-gray-600 mt-1 line-clamp-2 font-medium">
                                    {study.titre}
                                  </div>
                                )}

                                <div className="text-xs text-gray-400 mt-1 italic">
                                  {periodInfo}
                                </div>

                                {study.nbSujets && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    👥 {study.nbSujets} sujets
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {/* Indicateur s'il y a plus d'études pour ce jour */}
                          {studiesWithoutRdvThisWeek.length > 10 && (
                            <div className="text-xs text-center text-gray-500 p-2 bg-gray-100 rounded">
                              + {studiesWithoutRdvThisWeek.length - 10} autres études ce jour
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Légende du calendrier */}
      <div className="flex flex-wrap gap-6 p-4 bg-gray-50 border-t">
        <div className="space-y-2">
          <div className="text-xs font-bold text-gray-700">Statut</div>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border-l-4 border-green-500 rounded"></div>
              <span className="text-sm text-gray-700">Confirmé</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100 border-l-4 border-yellow-500 rounded"></div>
              <span className="text-sm text-gray-700">En attente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border-l-4 border-red-500 rounded"></div>
              <span className="text-sm text-gray-700">Annulé</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border-l-4 border-blue-500 rounded"></div>
              <span className="text-sm text-gray-700">Complété</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-100 border-l-4 border-purple-500 rounded"></div>
              <span className="text-sm text-gray-700">Planifié</span>
            </div>
          </div>
        </div>

        <div className="border-l pl-6 space-y-2">
          <div className="text-xs font-bold text-gray-700">Interaction</div>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-blue-600 font-bold text-sm">📚</span>
              <span className="text-sm text-gray-700">Cliquer sur une étude pour voir ses RDV</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600 font-bold text-sm">📅</span>
              <span className="text-sm text-gray-700">Cliquer sur un RDV pour plus de détails</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 font-bold text-sm">📂</span>
              <span className="text-sm text-gray-700">Études placées selon leurs dates de début/fin</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal des RDV d'une étude */}
      {selectedStudyRdvs && (
        <div className="fixed inset-0 z-50 overflow-y-auto" onClick={closeStudyRdvs}>
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div
              className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full"
              onClick={e => e.stopPropagation()}
            >
              {/* En-tête de la modal */}
              <div className="bg-gradient-to-r from-blue-100 to-indigo-100 px-6 py-4 border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {selectedStudyRdvs.study.ref || `#${selectedStudyRdvs.study.id}`}
                    </h3>
                    {selectedStudyRdvs.study.titre && (
                      <p className="text-sm text-gray-600 mt-1">{selectedStudyRdvs.study.titre}</p>
                    )}
                    <div className="flex flex-wrap gap-4 mt-2 text-sm">
                      <span className="bg-white px-3 py-1 rounded-full shadow-sm border border-blue-200">
                        <span className="font-medium">{selectedStudyRdvs.total}</span> RDV au total
                      </span>
                      {selectedStudyRdvs.study.type && (
                        <span className="bg-white px-3 py-1 rounded-full shadow-sm border border-blue-200">
                          {selectedStudyRdvs.study.type}
                        </span>
                      )}
                      {selectedStudyRdvs.study.nbSujets && (
                        <span className="bg-white px-3 py-1 rounded-full shadow-sm border border-blue-200">
                          👥 {selectedStudyRdvs.study.nbSujets} sujets
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={closeStudyRdvs}
                    className="text-gray-500 hover:text-gray-700 focus:outline-none p-2 rounded-full hover:bg-white transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Contenu de la modal */}
              <div className="bg-white px-6 py-4 max-h-[70vh] overflow-y-auto">
                {isLoadingStudyRdvs ? (
                  <div className="text-center py-8">
                    <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
                    <p>Chargement des rendez-vous...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* RDV d'aujourd'hui */}
                    {selectedStudyRdvs.rdvs.today.length > 0 && (
                      <div>
                        <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                          🔴 Aujourd'hui ({selectedStudyRdvs.rdvs.today.length})
                        </h4>
                        <div className="space-y-2">
                          {selectedStudyRdvs.rdvs.today.map((rdv, idx) => (
                            <div
                              key={`today-${idx}`}
                              className="p-3 rounded-lg border-l-4 border-red-500 bg-red-50 hover:bg-red-100 cursor-pointer transition-colors"
                              onClick={() => onAppointmentClick(rdv)}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-medium text-gray-800">
                                    {rdv.heure || 'Heure non spécifiée'} - {format(new Date(rdv.date), 'EEEE d MMMM yyyy', { locale: fr })}
                                  </div>
                                  <div className="text-sm text-gray-600 mt-1">
                                    {rdv.volontaire ? `👤 ${rdv.volontaire.prenom} ${rdv.volontaire.nom}` : '👤 Volontaire non assigné'}
                                  </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(new Set([rdv.etat]), new Set(['today'])).replace('border-l-4', '')}`}>
                                  {rdv.etat || 'Non défini'}
                                </span>
                              </div>
                              {rdv.commentaires && (
                                <div className="text-sm italic mt-2 p-2 bg-white rounded">
                                  {rdv.commentaires}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* RDV futurs */}
                    {selectedStudyRdvs.rdvs.upcoming.length > 0 && (
                      <div>
                        <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                          🟢 À venir ({selectedStudyRdvs.rdvs.upcoming.length})
                        </h4>
                        <div className="space-y-2">
                          {selectedStudyRdvs.rdvs.upcoming.map((rdv, idx) => (
                            <div
                              key={`upcoming-${idx}`}
                              className="p-3 rounded-lg border-l-4 border-green-500 bg-green-50 hover:bg-green-100 cursor-pointer transition-colors"
                              onClick={() => onAppointmentClick(rdv)}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-medium text-gray-800">
                                    {rdv.heure || 'Heure non spécifiée'} - {format(new Date(rdv.date), 'EEEE d MMMM yyyy', { locale: fr })}
                                  </div>
                                  <div className="text-sm text-gray-600 mt-1">
                                    {rdv.volontaire ? `👤 ${rdv.volontaire.prenom} ${rdv.volontaire.nom}` : '👤 Volontaire non assigné'}
                                  </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(new Set([rdv.etat]), new Set(['upcoming'])).replace('border-l-4', '')}`}>
                                  {rdv.etat || 'Non défini'}
                                </span>
                              </div>
                              {rdv.commentaires && (
                                <div className="text-sm italic mt-2 p-2 bg-white rounded">
                                  {rdv.commentaires}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* RDV passés */}
                    {selectedStudyRdvs.rdvs.past.length > 0 && (
                      <div>
                        <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                          ⚪ Passés ({selectedStudyRdvs.rdvs.past.length})
                        </h4>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                          {selectedStudyRdvs.rdvs.past.map((rdv, idx) => (
                            <div
                              key={`past-${idx}`}
                              className="p-3 rounded-lg border-l-4 border-gray-400 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                              onClick={() => onAppointmentClick(rdv)}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-medium text-gray-700">
                                    {rdv.heure || 'Heure non spécifiée'} - {format(new Date(rdv.date), 'EEEE d MMMM yyyy', { locale: fr })}
                                  </div>
                                  <div className="text-sm text-gray-500 mt-1">
                                    {rdv.volontaire ? `👤 ${rdv.volontaire.prenom} ${rdv.volontaire.nom}` : '👤 Volontaire non assigné'}
                                  </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(new Set([rdv.etat]), new Set(['past'])).replace('border-l-4', '')}`}>
                                  {rdv.etat || 'Non défini'}
                                </span>
                              </div>
                              {rdv.commentaires && (
                                <div className="text-sm italic mt-2 p-2 bg-white rounded">
                                  {rdv.commentaires}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Message si aucun RDV */}
                    {selectedStudyRdvs.total === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p>Aucun rendez-vous trouvé pour cette étude</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Pied de la modal */}
              <div className="bg-gray-50 px-6 py-3 border-t">
                <button
                  onClick={closeStudyRdvs}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 transition"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentCalendar;