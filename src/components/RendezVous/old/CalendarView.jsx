import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format, addMonths, subMonths, getYear, getMonth, parseISO, isToday, isSameMonth, isAfter, isBefore, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';

const CalendarView = ({ rdvs }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [expandedDay, setExpandedDay] = useState(null);
  
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

  // Calculer les jours du calendrier pour le mois actuel
  const calendarDays = useMemo(() => {
    const year = getYear(currentDate);
    const month = getMonth(currentDate);
    
    // Premier jour du mois (0 = Dimanche, 1 = Lundi, etc.)
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    // Adapter pour que la semaine commence le lundi (0 = Lundi, 6 = Dimanche)
    const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    
    // Nombre de jours dans le mois
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Tableau des jours du calendrier
    const days = [];
    
    // Jours du mois précédent
    const daysFromPrevMonth = adjustedFirstDay;
    const prevMonthDays = new Date(year, month, 0).getDate();
    
    for (let i = prevMonthDays - daysFromPrevMonth + 1; i <= prevMonthDays; i++) {
      const date = new Date(year, month - 1, i);
      days.push({
        date,
        day: i,
        isCurrentMonth: false,
        isToday: isToday(date)
      });
    }
    
    // Jours du mois actuel
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        day: i,
        isCurrentMonth: true,
        isToday: isToday(date)
      });
    }
    
    // Jours du mois suivant (pour compléter la grille de 6 semaines = 42 jours)
    const totalDaysNeeded = 42;
    const remainingDays = totalDaysNeeded - days.length;
    
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        day: i,
        isCurrentMonth: false,
        isToday: isToday(date)
      });
    }
    
    return days;
  }, [currentDate]);

  // Organiser les rendez-vous par date
  const rdvsByDate = useMemo(() => {
    const mapped = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (!rdvs || !Array.isArray(rdvs)) return mapped;
    
    rdvs.forEach(rdv => {
      try {
        // Normaliser la date
        const dateKey = formatToISODate(rdv.date);
        
        if (dateKey) {
          if (!mapped[dateKey]) {
            mapped[dateKey] = [];
          }
          
          // Déterminer si le rendez-vous est passé, à venir ou aujourd'hui
          const rdvDate = new Date(dateKey);
          rdvDate.setHours(0, 0, 0, 0);
          
          let timeStatus = "upcoming";
          if (isSameDay(rdvDate, today)) {
            timeStatus = "today";
          } else if (isBefore(rdvDate, today)) {
            timeStatus = "past";
          }
          
          mapped[dateKey].push({
            ...rdv,
            timeStatus
          });
        }
      } catch (error) {
        console.error("Erreur lors du traitement du rendez-vous:", rdv, error);
      }
    });
    
    // Trier les rendez-vous par heure dans chaque journée
    Object.keys(mapped).forEach(date => {
      mapped[date].sort((a, b) => {
        const timeA = a.heure || '';
        const timeB = b.heure || '';
        return timeA.localeCompare(timeB);
      });
    });
    
    return mapped;
  }, [rdvs]);

  // Fonctions de navigation dans le calendrier
  const goToPreviousMonth = () => setCurrentDate(prev => subMonths(prev, 1));
  const goToNextMonth = () => setCurrentDate(prev => addMonths(prev, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Gestion du jour étendu pour voir plus de détails
  const toggleDayExpansion = (day) => {
    const dateStr = format(day.date, 'yyyy-MM-dd');
    setExpandedDay(expandedDay === dateStr ? null : dateStr);
  };

  // Déterminer la classe de couleur en fonction du statut
  const getStatusColor = (status, timeStatus = "upcoming") => {
    let baseColor;
    
    switch (status?.toUpperCase()) {
      case 'CONFIRME':
        baseColor = timeStatus === "past" ? 
          'bg-green-100 text-green-700 border-green-400 border-l-4' : 
          timeStatus === "today" ? 
            'bg-green-200 text-green-900 border-green-500 border-l-4' : 
            'bg-green-100 text-green-800 border-green-500 border-l-4';
        break;
      case 'EN_ATTENTE':
        baseColor = timeStatus === "past" ? 
          'bg-yellow-100 text-yellow-700 border-yellow-400 border-l-4' : 
          timeStatus === "today" ? 
            'bg-yellow-200 text-yellow-900 border-yellow-500 border-l-4' : 
            'bg-yellow-100 text-yellow-800 border-yellow-500 border-l-4';
        break;
      case 'ANNULE':
        baseColor = timeStatus === "past" ? 
          'bg-red-100 text-red-700 border-red-400 border-l-4' : 
          timeStatus === "today" ? 
            'bg-red-200 text-red-900 border-red-500 border-l-4' : 
            'bg-red-100 text-red-800 border-red-500 border-l-4';
        break;
      case 'COMPLETE':
        baseColor = timeStatus === "past" ? 
          'bg-blue-100 text-blue-700 border-blue-400 border-l-4' : 
          timeStatus === "today" ? 
            'bg-blue-200 text-blue-900 border-blue-500 border-l-4' : 
            'bg-blue-100 text-blue-800 border-blue-500 border-l-4';
        break;
      case 'PLANIFIE':
        baseColor = timeStatus === "past" ? 
          'bg-purple-100 text-purple-700 border-purple-400 border-l-4' : 
          timeStatus === "today" ? 
            'bg-purple-200 text-purple-900 border-purple-500 border-l-4' : 
            'bg-purple-100 text-purple-800 border-purple-500 border-l-4';
        break;
      default:
        baseColor = timeStatus === "past" ? 
          'bg-gray-100 text-gray-700 border-gray-400 border-l-4' : 
          timeStatus === "today" ? 
            'bg-gray-200 text-gray-900 border-gray-500 border-l-4' : 
            'bg-gray-100 text-gray-800 border-gray-500 border-l-4';
    }
    
    return baseColor;
  };

  // Helper function pour extraire l'ID de l'étude
  const getStudyId = (rdv) => {
    if (rdv.id && rdv.id.idEtude) return rdv.id.idEtude;
    if (rdv.idEtude) return rdv.idEtude;
    return 0;
  };

  // Fonction pour récupérer la référence de l'étude
  const getStudyRef = (rdv) => {
    if (rdv.etude && rdv.etude.ref) return rdv.etude.ref;
    if (rdv.etudeRef) return rdv.etudeRef;
    return `#${getStudyId(rdv)}`;
  };

  // Obtenir le nom du volontaire s'il existe
  const getVolunteerName = (rdv) => {
    // Vérifier les différentes structures possibles
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
    
    if (rdv.prenomVolontaire && rdv.nomVolontaire) {
      return `${rdv.prenomVolontaire} ${rdv.nomVolontaire}`;
    } else if (rdv.nomCompletVolontaire) {
      return rdv.nomCompletVolontaire;
    }
    
    return 'Volontaire non assigné';
  };

  // Grouper les rendez-vous par étude pour un affichage plus compact
  const groupRdvsByStudy = (dayRdvs) => {
    const grouped = {};
    
    dayRdvs.forEach(rdv => {
      const studyRef = getStudyRef(rdv);
      if (!grouped[studyRef]) {
        grouped[studyRef] = {
          ref: studyRef,
          etudeTitre: rdv.etude?.titre || '',
          idEtude: getStudyId(rdv),
          rdvs: [],
          statuses: new Set(),
          timeStatuses: new Set()
        };
      }
      grouped[studyRef].rdvs.push(rdv);
      grouped[studyRef].statuses.add(rdv.etat);
      grouped[studyRef].timeStatuses.add(rdv.timeStatus);
    });
    
    return Object.values(grouped);
  };

  // Obtenir une couleur représentative pour un groupe d'études avec différents statuts
  const getGroupStatusColor = (group) => {
    const timeStatus = getPredominantTimeStatus(group.timeStatuses);
    
    if (group.statuses.has('ANNULE')) return getStatusColor('ANNULE', timeStatus);
    if (group.statuses.has('EN_ATTENTE')) return getStatusColor('EN_ATTENTE', timeStatus);
    if (group.statuses.has('CONFIRME')) return getStatusColor('CONFIRME', timeStatus);
    if (group.statuses.has('COMPLETE')) return getStatusColor('COMPLETE', timeStatus);
    if (group.statuses.has('PLANIFIE')) return getStatusColor('PLANIFIE', timeStatus);
    return getStatusColor(null, timeStatus);
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
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      case 'today':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-red-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
          </svg>
        );
      case 'upcoming':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Nombre max d'événements à afficher par cellule
  const MAX_EVENTS_PER_DAY = 4;

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* En-tête du calendrier avec navigation */}
      <div className="p-4 bg-gradient-to-r from-blue-100 to-indigo-100 border-b flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button 
            onClick={goToPreviousMonth}
            className="p-2 rounded-full hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            aria-label="Mois précédent"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h2 className="text-xl font-bold text-gray-800">
            {format(currentDate, 'MMMM yyyy', { locale: fr })}
          </h2>
          <button 
            onClick={goToNextMonth}
            className="p-2 rounded-full hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            aria-label="Mois suivant"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
        <button 
          onClick={goToToday}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 transition shadow-sm"
        >
          Aujourd'hui
        </button>
      </div>
      
      {/* Jours de la semaine */}
      <div className="grid grid-cols-7 text-center py-2 bg-gray-100 border-b">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, idx) => (
          <div key={idx} className="text-sm font-bold text-gray-700">
            {day}
          </div>
        ))}
      </div>
      
      {/* Grille du calendrier */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, idx) => {
          const dateString = format(day.date, 'yyyy-MM-dd');
          const dayRdvs = rdvsByDate[dateString] || [];
          const isExpanded = expandedDay === dateString;
          const hasRdvs = dayRdvs.length > 0;
          const groupedRdvs = groupRdvsByStudy(dayRdvs);
          
          return (
            <div 
              key={idx}
              className={`relative min-h-[120px] border p-2 ${
                day.isCurrentMonth 
                  ? day.isToday 
                    ? 'bg-blue-50 border-blue-300' 
                    : 'bg-white' 
                  : 'bg-gray-50 text-gray-400'
              } ${
                hasRdvs && day.isCurrentMonth 
                  ? 'hover:bg-blue-50 cursor-pointer transition-colors' 
                  : ''
              }`}
              onClick={hasRdvs && day.isCurrentMonth ? () => toggleDayExpansion(day) : undefined}
            >
              {/* En-tête du jour */}
              <div className={`flex justify-between items-center mb-2 ${day.isCurrentMonth ? 'text-gray-800' : 'text-gray-400'}`}>
                <span className={`font-semibold ${
                  day.isToday 
                    ? 'bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center' 
                    : ''
                }`}>
                  {day.day}
                </span>
                {hasRdvs && day.isCurrentMonth && (
                  <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1 font-bold">
                    {dayRdvs.length}
                  </span>
                )}
              </div>
              
              {/* Liste des RDVs groupés par étude (affichage normal) */}
              {hasRdvs && day.isCurrentMonth && !isExpanded && (
                <div className="space-y-1.5 overflow-hidden" style={{ maxHeight: '85px' }}>
                  {groupedRdvs.slice(0, MAX_EVENTS_PER_DAY).map((group, groupIdx) => (
                    <div 
                      key={`${group.ref}-${groupIdx}`}
                      className={`text-xs p-1.5 rounded shadow-sm ${getGroupStatusColor(group)} truncate`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium truncate flex items-center gap-1">
                          {getTimeStatusIcon(getPredominantTimeStatus(group.timeStatuses))}
                          {group.ref}
                        </span>
                        <span className="px-1.5 rounded-full bg-white bg-opacity-70 text-xs font-bold">
                          {group.rdvs.length}
                        </span>
                      </div>
                    </div>
                  ))}
                  {groupedRdvs.length > MAX_EVENTS_PER_DAY && (
                    <div className="text-xs text-center text-gray-600 font-medium py-1 bg-gray-100 rounded-md">
                      + {groupedRdvs.length - MAX_EVENTS_PER_DAY} autres
                    </div>
                  )}
                </div>
              )}
              
              {/* Vue détaillée (jour étendu) */}
              {isExpanded && (
                <div className="fixed z-50 inset-0 overflow-y-auto" onClick={() => setExpandedDay(null)}>
                  <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                    <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                      <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                    </div>
                    
                    <div 
                      className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex justify-between items-center mb-4 border-b pb-3">
                          <h3 className="text-lg font-bold text-gray-900">
                            {format(day.date, 'EEEE d MMMM yyyy', { locale: fr })}
                          </h3>
                          <button 
                            onClick={() => setExpandedDay(null)}
                            className="text-gray-500 hover:text-gray-700 focus:outline-none"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                          {groupedRdvs.map((group, groupIdx) => (
                            <div 
                              key={`${group.ref}-detail-${groupIdx}`}
                              className="border rounded-md overflow-hidden shadow-sm"
                            >
                              <div className={`${getGroupStatusColor(group)} p-3`}>
                                <Link 
                                  to={`/rdvs/etude/${group.idEtude}`}
                                  className="font-bold hover:underline"
                                >
                                  {group.ref}
                                </Link>
                                {group.etudeTitre && (
                                  <div className="text-sm mt-1">{group.etudeTitre}</div>
                                )}
                              </div>
                              
                              <div className="divide-y">
                                {group.rdvs.map((rdv, rdvIdx) => (
                                  <div 
                                    key={`rdv-${rdvIdx}`}
                                    className="p-3 hover:bg-gray-50 transition-colors"
                                  >
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="font-medium">{rdv.heure || 'Heure non spécifiée'}</span>
                                      <span className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 font-semibold ${getStatusColor(rdv.etat, rdv.timeStatus).replace('border-l-4', '')}`}>
                                        {getTimeStatusIcon(rdv.timeStatus)}
                                        {rdv.etat || 'Non défini'}
                                      </span>
                                    </div>
                                    <div className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-1">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                      </svg>
                                      {getVolunteerName(rdv)}
                                    </div>
                                    {rdv.commentaires && (
                                      <div className="text-sm italic mt-2 text-gray-600 bg-gray-50 p-2 rounded">
                                        {rdv.commentaires}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Légende du calendrier avec distinction temporelle */}
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
          <div className="text-xs font-bold text-gray-700">Temporalité</div>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-4 h-4 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </span>
              <span className="text-sm text-gray-700">Passé</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-4 h-4 text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                </svg>
              </span>
              <span className="text-sm text-gray-700">Aujourd'hui</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-4 h-4 text-green-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                </svg>
              </span>
              <span className="text-sm text-gray-700">À venir</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;