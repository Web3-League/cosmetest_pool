import { useState, useEffect } from 'react';
import api from '../../services/api';
import rdvService from '../../services/rdvService';

const AppointmentBatchCreator = ({
  studies,
  selectedStudy,
  onStudySelect,
  onBack,
  onSuccess
}) => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [timeBetween, setTimeBetween] = useState(30);
  const [dates, setDates] = useState([{ day: '', month: '', year: '', slots: [] }]);
  const [startTime, setStartTime] = useState('08h00');
  const [endTime, setEndTime] = useState('18h00');
  const [comments, setComments] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateCount, setDateCount] = useState(1);
  const [currentStudyId, setCurrentStudyId] = useState(selectedStudy?.id || '');
  const [loadingGroups, setLoadingGroups] = useState(false);

  // 🆕 Fonction pour pré-remplir la première date avec la date de début de l'étude
  const prefillFirstDateFromStudy = (study) => {
    if (!study || !study.dateDebut) return;

    try {
      // Parser la date de début (format attendu: YYYY-MM-DD ou DD/MM/YYYY)
      let parsedDate;
      const dateStr = study.dateDebut;
      
      if (dateStr.includes('-')) {
        // Format YYYY-MM-DD
        parsedDate = new Date(dateStr);
      } else if (dateStr.includes('/')) {
        // Format DD/MM/YYYY
        const [day, month, year] = dateStr.split('/');
        parsedDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
      } else {
        console.warn("Format de date non reconnu:", dateStr);
        return;
      }

      if (isNaN(parsedDate.getTime())) {
        console.warn("Date invalide:", dateStr);
        return;
      }

      // Pré-remplir la première date
      setDates(prevDates => {
        const newDates = [...prevDates];
        newDates[0] = {
          ...newDates[0],
          day: parsedDate.getDate().toString().padStart(2, '0'),
          month: (parsedDate.getMonth() + 1).toString().padStart(2, '0'),
          year: parsedDate.getFullYear().toString(),
          slots: newDates[0].slots || []
        };
        return newDates;
      });
      
      console.log(`📅 Date 1 pré-remplie avec la date de début de l'étude: ${parsedDate.toLocaleDateString('fr-FR')}`);
      
    } catch (err) {
      console.error("Erreur lors du pré-remplissage de la date:", err);
    }
  };

  // Effet pour maintenir la synchronisation entre props et état local
  useEffect(() => {
    if (selectedStudy?.id && selectedStudy.id !== currentStudyId) {
      setCurrentStudyId(selectedStudy.id);
      loadGroupsForStudy(selectedStudy.id);
      
      // 🆕 Pré-remplir la première date si l'étude est passée en props
      prefillFirstDateFromStudy(selectedStudy);
    }
  }, [selectedStudy, currentStudyId]);

  // Fonction pour charger les groupes d'une étude via l'API
  const loadGroupsForStudy = async (studyId) => {
    if (!studyId) return;
    
    try {
      setLoadingGroups(true);
      setError(null);
      console.log(`Chargement des groupes pour l'étude ID: ${studyId}`);
      
      // Appel à l'API REST pour récupérer les groupes de l'étude
      const response = await api.get(`/groupes/etude/${studyId}`);
      
      // Déterminer si la réponse est un tableau ou contient un sous-objet 'content'
      let groupsData = response.data;
      if (response.data && response.data.content && Array.isArray(response.data.content)) {
        groupsData = response.data.content;
      } else if (!Array.isArray(response.data)) {
        console.warn("Format de réponse inattendu:", response.data);
        groupsData = [];
      }
      
      console.log("Données de groupes extraites:", groupsData);
      
      // Simplement configurer les données brutes - ne pas trop les traiter
      const formattedGroups = groupsData.map(group => {
        return {
          ...group,
          // S'assurer que les propriétés essentielles existent
          id: group.idGroupe,
          intitule: group.intitule || group.nom || `Groupe ${group.id}`,
          nbSujet: group.nbSujet || 0 // 🆕 Récupérer le nombre de sujets
        };
      });
      
      console.log('Groupes formatés:', formattedGroups);
      setGroups(formattedGroups);
      
      // Réinitialiser le groupe sélectionné
      setSelectedGroup('');
    } catch (err) {
      console.error('Erreur lors du chargement des groupes:', err);
      setError(`Erreur lors du chargement des groupes: ${err.message}`);
      setGroups([]);
    } finally {
      setLoadingGroups(false);
    }
  };

  // 🆕 Fonction pour calculer le nombre total de créneaux ouverts
  const calculateTotalSlots = () => {
    return dates.reduce((total, date) => {
      return total + (date.slots || []).reduce((dateTotal, slotVolume) => {
        return dateTotal + (parseInt(slotVolume) || 0);
      }, 0);
    }, 0);
  };

  // 🆕 Fonction pour obtenir le nombre de sujets du groupe sélectionné
  const getSelectedGroupSubjectCount = () => {
    if (!selectedGroup) return 0;
    const group = groups.find(g => g.id.toString() === selectedGroup.toString());
    return group ? (group.nbSujet || 0) : 0;
  };

  // 🆕 Fonction pour déterminer le statut et la couleur de la pastille
  const getSlotStatus = () => {
    const totalSlots = calculateTotalSlots();
    const subjectCount = getSelectedGroupSubjectCount();
    
    if (!selectedGroup) {
      return { status: 'no-group', color: 'gray', message: 'Sélectionnez un groupe' };
    }
    
    if (totalSlots === 0) {
      return { status: 'empty', color: 'gray', message: 'Aucun créneau ouvert' };
    }
    
    if (subjectCount === 0) {
      return { status: 'no-subjects', color: 'yellow', message: 'Aucun sujet inscrit au groupe' };
    }
    
    if (totalSlots === subjectCount) {
      return { status: 'perfect', color: 'green', message: `✅ Parfait : ${subjectCount} sujets pour ${totalSlots} créneaux` };
    }
    
    if (totalSlots > subjectCount) {
      const diff = totalSlots - subjectCount;
      return { 
        status: 'shortage', 
        color: 'red', 
        message: `⚠️ DÉPASSEMENT : ${diff} créneau(x) en trop (${totalSlots} créneaux pour ${subjectCount} sujets)` 
      };
    }
    
    if (totalSlots < subjectCount) {
      const diff = subjectCount - totalSlots;
      return { 
        status: 'excess', 
        color: 'blue', 
        message: `ℹ️ Capacité restante : ${diff} sujet(s) disponible(s) (${subjectCount} sujets pour ${totalSlots} créneaux)` 
      };
    }
  };

  // 🆕 Composant pour afficher la pastille d'état
  const SlotStatusBadge = () => {
    const { status, color, message } = getSlotStatus();
    
    const colorClasses = {
      gray: 'bg-gray-100 text-gray-800 border-gray-300',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      green: 'bg-green-100 text-green-800 border-green-300',
      red: 'bg-red-100 text-red-800 border-red-300',
      blue: 'bg-blue-100 text-blue-800 border-blue-300'
    };

    return (
      <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium border ${colorClasses[color]} transition-all duration-200`}>
        <div className={`w-2 h-2 rounded-full mr-2 ${
          color === 'green' ? 'bg-green-500' : 
          color === 'red' ? 'bg-red-500' : 
          color === 'blue' ? 'bg-blue-500' : 
          color === 'yellow' ? 'bg-yellow-500' : 
          'bg-gray-500'
        }`}></div>
        {message}
      </div>
    );
  };

  // Charger les groupes lorsqu'une étude est sélectionnée
  const handleStudyChange = (studyId) => {
    setCurrentStudyId(studyId);
    const study = studies.find(s => s.id === studyId);
    onStudySelect(study);

    // 🆕 Pré-remplir la première date avec la date de début de l'étude
    if (study) {
      prefillFirstDateFromStudy(study);
    }

    // Charger les groupes via l'API REST
    loadGroupsForStudy(studyId);
  };

  // Mettre à jour le nombre de dates à générer
  const handleDateCountChange = (count) => {
    const countInt = parseInt(count, 10);
    setDateCount(countInt);

    // Ajuster le tableau des dates si nécessaire
    if (countInt > dates.length) {
      // Ajouter des dates
      const newDates = [...dates];
      for (let i = dates.length; i < countInt; i++) {
        newDates.push({ day: '', month: '', year: '', slots: [] });
      }
      setDates(newDates);
    } else if (countInt < dates.length) {
      // Supprimer des dates
      setDates(dates.slice(0, countInt));
    }
  };

  // Mettre à jour les infos d'une date
  const handleDateChange = (index, field, value) => {
    const newDates = [...dates];
    newDates[index] = { ...newDates[index], [field]: value };
    setDates(newDates);
  };

  // Mettre à jour le nombre de volontaires pour un créneau d'une date
  const handleSlotVolumeChange = (dateIndex, slotIndex, volume) => {
    const newDates = [...dates];
    if (!newDates[dateIndex].slots) {
      newDates[dateIndex].slots = [];
    }

    // Assurez-vous que le tableau des slots a assez d'éléments
    while (newDates[dateIndex].slots.length <= slotIndex) {
      newDates[dateIndex].slots.push(0);
    }

    newDates[dateIndex].slots[slotIndex] = parseInt(volume, 10);
    setDates(newDates);
  };

  // Générer les créneaux horaires en fonction des horaires de début et de fin
  const generateTimeSlots = () => {
    const slots = [];
    const [startHour, startMinute] = startTime.split('h').map(p => parseInt(p, 10));
    const [endHour, endMinute] = endTime.split('h').map(p => parseInt(p, 10));

    // Convertir en minutes pour faciliter les calculs
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    // Vérifier que l'heure de fin est postérieure à l'heure de début
    if (endMinutes <= startMinutes) {
      return [];
    }

    // Générer les créneaux
    let currentMinutes = startMinutes;
    while (currentMinutes < endMinutes) {
      const hour = Math.floor(currentMinutes / 60);
      const minute = currentMinutes % 60;
      const formattedHour = hour.toString().padStart(2, '0');
      const formattedMinute = minute.toString().padStart(2, '0');
      slots.push(`${formattedHour}h${formattedMinute}`);

      currentMinutes += timeBetween;
    }

    return slots;
  };

  const timeSlots = generateTimeSlots();

  // 🆕 Fonction pour pré-remplir automatiquement les dates consécutives
  const fillConsecutiveDates = () => {
    if (!dates[0].day || !dates[0].month || !dates[0].year) {
      alert("Veuillez d'abord remplir la Date 1");
      return;
    }

    try {
      const baseDate = new Date(
        parseInt(dates[0].year),
        parseInt(dates[0].month) - 1,
        parseInt(dates[0].day)
      );

      if (isNaN(baseDate.getTime())) {
        alert("Date 1 invalide");
        return;
      }

      const newDates = [...dates];
      for (let i = 1; i < dates.length; i++) {
        const nextDate = new Date(baseDate);
        nextDate.setDate(baseDate.getDate() + i);

        newDates[i] = {
          ...newDates[i],
          day: nextDate.getDate().toString().padStart(2, '0'),
          month: (nextDate.getMonth() + 1).toString().padStart(2, '0'),
          year: nextDate.getFullYear().toString()
        };
      }

      setDates(newDates);
      console.log(`📅 ${dates.length - 1} dates consécutives générées à partir de la Date 1`);
    } catch (err) {
      console.error("Erreur lors de la génération des dates consécutives:", err);
      alert("Erreur lors de la génération des dates consécutives");
    }
  };

  const handleSubmit = async () => {
    // Validation des entrées
    if (!currentStudyId) {
      setError('Veuillez sélectionner une étude');
      return;
    }

    if (!selectedGroup) {
      setError('Veuillez sélectionner un groupe');
      return;
    }

    // Vérifier que toutes les dates sont complètes
    const incompleteDate = dates.find(d => !d.day || !d.month || !d.year);
    if (incompleteDate) {
      setError('Veuillez remplir toutes les dates');
      return;
    }

    // 🆕 Vérification de l'équilibre sujets/créneaux
    const totalSlots = calculateTotalSlots();
    const subjectCount = getSelectedGroupSubjectCount();
    const { status } = getSlotStatus();
    
    if (status === 'shortage') {
      const confirmed = window.confirm(
        `⚠️ ATTENTION : Vous demandez ${totalSlots} créneaux mais le groupe n'a que ${subjectCount} sujets inscrits.\n\n${totalSlots - subjectCount} créneaux resteront sans sujet.\n\nVoulez-vous continuer ?`
      );
      if (!confirmed) return;
    }
    
    if (status === 'no-subjects') {
      const confirmed = window.confirm(
        `⚠️ ATTENTION : Aucun sujet n'est inscrit à ce groupe.\n\nTous les créneaux seront créés sans sujet assigné.\n\nVoulez-vous continuer ?`
      );
      if (!confirmed) return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Récupérer l'étude actuelle à partir de l'ID local
      const currentStudy = studies.find(s => s.id === currentStudyId);
      
      // Trouver le groupe sélectionné
      const selectedGroupObj = groups.find(g => g.id.toString() === selectedGroup.toString());
      console.log("Objet groupe sélectionné:", selectedGroupObj);
      
      // Convertir les IDs en nombres pour le backend
      let studyId, groupId;
      
      try {
        studyId = parseInt(currentStudyId, 10);
        if (isNaN(studyId)) {
          throw new Error(`ID d'étude non numérique: ${currentStudyId}`);
        }
        
        groupId = parseInt(selectedGroup, 10);
        if (isNaN(groupId)) {
          throw new Error(`ID de groupe non numérique: ${selectedGroup}`);
        }
      } catch (convErr) {
        console.error("Erreur de conversion:", convErr);
        throw new Error(`Erreur de conversion: ${convErr.message}. 
          Types: étude=${typeof currentStudyId}, groupe=${typeof selectedGroup}. 
          Valeurs: étude=${currentStudyId}, groupe=${selectedGroup}`);
      }

      console.log("IDs numériques - Étude:", studyId, "Groupe:", groupId);

      // Préparer les données pour l'API
      const batchData = {
        idEtude: studyId,
        idGroupe: groupId,
        dates: dates.map(d => ({
          date: `${d.year}-${d.month.padStart(2, '0')}-${d.day.padStart(2, '0')}`,
          slots: timeSlots.map((time, index) => ({
            time,
            volume: d.slots[index] || 0
          }))
        })),
        commentaires: comments
      };

      console.log("Données à envoyer:", JSON.stringify(batchData, null, 2));

      // Appel avec Promise.all pour créer plusieurs rendez-vous
      const creationPromises = [];

      // Pour chaque date
      for (const dateInfo of batchData.dates) {
        // Pour chaque créneau horaire dans cette date
        for (const slot of dateInfo.slots) {
          // Si volume > 0, créer autant de rendez-vous que nécessaire
          if (slot.volume > 0) {
            for (let i = 0; i < slot.volume; i++) {
              const rdvData = {
                idEtude: batchData.idEtude,
                idGroupe: batchData.idGroupe,
                date: dateInfo.date,
                heure: slot.time,
                commentaires: batchData.commentaires,
                etat: 'PLANIFIE',
                // Le volontaire sera assigné plus tard
              };

              creationPromises.push(
                rdvService.create(rdvData)
                  .then(response => {
                    // Vérifier si la réponse est valide
                    if (!response || (response.error && response.error.message)) {
                      throw new Error(response.error?.message || 'Erreur lors de la création du rendez-vous');
                    }
                    return response.data || response;
                  })
                  .catch(err => {
                    console.error("Erreur lors de la création d'un rendez-vous:", err, rdvData);
                    throw err;
                  })
              );
            }
          }
        }
      }

      // Attendre que tous les rendez-vous soient créés
      await Promise.all(creationPromises);

      if (onSuccess) {
        // S'assurer que l'étude reste sélectionnée avant d'appeler onSuccess
        onStudySelect(currentStudy);
        onSuccess();
      }

    } catch (err) {
      setError('Erreur lors de la création des rendez-vous: ' + err.message);
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Inspéction de la structure des groupes disponibles
  const inspectGroups = () => {
    if (!groups || groups.length === 0) return null;
    
    const sample = groups[0];
    const keys = Object.keys(sample);
    
    return (
      <div className="text-xs mt-2 p-2 bg-gray-100 rounded">
        <p>Structure du premier groupe ({groups.length} groupes au total):</p>
        <ul className="list-disc pl-4">
          {keys.map(key => (
            <li key={key}>
              {key}: {typeof sample[key] === 'object' 
                ? 'objet' 
                : JSON.stringify(sample[key])}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Créer plusieurs rendez-vous</h2>
        <button
          onClick={onBack}
          className="text-blue-600 hover:text-blue-800"
        >
          &lt; Retour
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sélection d'étude */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Étude
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={currentStudyId}
              onChange={(e) => handleStudyChange(e.target.value)}
            >
              <option value="">Sélectionner une étude</option>
              {[...studies].reverse().map(study => (
                <option key={study.id} value={study.id}>
                  {study.ref} - {study.titre}
                  {study.dateDebut && ` (début: ${study.dateDebut})`}
                </option>
              ))}
            </select>
            
            {/* 🆕 Information sur la date de début */}
            {selectedStudy && selectedStudy.dateDebut && (
              <p className="mt-1 text-xs text-green-600">
                ✅ Date de début d'étude : {selectedStudy.dateDebut} (utilisée pour la Date 1)
              </p>
            )}
          </div>

          {/* Sélection de groupe */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Groupe
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              disabled={!currentStudyId || loadingGroups || groups.length === 0}
            >
              <option value="">
                {loadingGroups 
                  ? "Chargement des groupes..." 
                  : groups.length === 0 
                    ? "Aucun groupe disponible" 
                    : "Sélectionner un groupe"}
              </option>
              {groups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.intitule} ({group.nbSujet || 0} sujets)
                </option>
              ))}
            </select>
            
            {/* 🆕 PASTILLE D'ÉTAT */}
            {selectedGroup && (
              <div className="mt-3">
                <SlotStatusBadge />
              </div>
            )}
            
            {/* Informations complémentaires */}
            {selectedGroup && (
              <div className="mt-2 text-xs text-gray-600 space-y-1 bg-gray-50 p-2 rounded">
                <div className="flex justify-between">
                  <span>Sujets inscrits au groupe :</span>
                  <span className="font-medium">{getSelectedGroupSubjectCount()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Créneaux demandés :</span>
                  <span className="font-medium">{calculateTotalSlots()}</span>
                </div>
                {calculateTotalSlots() > 0 && getSelectedGroupSubjectCount() > 0 && (
                  <div className="flex justify-between border-t pt-1">
                    <span>Différence :</span>
                    <span className={`font-medium ${
                      calculateTotalSlots() > getSelectedGroupSubjectCount() ? 'text-red-600' : 
                      calculateTotalSlots() < getSelectedGroupSubjectCount() ? 'text-blue-600' : 
                      'text-green-600'
                    }`}>
                      {calculateTotalSlots() - getSelectedGroupSubjectCount() > 0 ? '+' : ''}
                      {calculateTotalSlots() - getSelectedGroupSubjectCount()}
                    </span>
                  </div>
                )}
              </div>
            )}
            
            {loadingGroups && (
              <p className="mt-1 text-sm text-blue-600">
                Chargement des groupes en cours...
              </p>
            )}
            
            {groups.length === 0 && currentStudyId && !loadingGroups && (
              <div>
                <p className="mt-1 text-sm text-yellow-600">
                  Aucun groupe trouvé pour cette étude.
                </p>
                <button 
                  onClick={() => loadGroupsForStudy(currentStudyId)}
                  className="mt-1 text-xs text-blue-600 underline"
                >
                  Essayer de recharger les groupes
                </button>
              </div>
            )}
            
            {groups.length > 0 && inspectGroups()}
          </div>

          {/* Temps entre chaque RDV */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Temps entre chaque RDV (minutes)
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={timeBetween}
              onChange={(e) => setTimeBetween(parseInt(e.target.value, 10))}
            >
              {[5, 10, 15, 20, 30, 45, 60, 90, 120].map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>

          {/* Nombre de dates */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Nombre de dates
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={dateCount}
              onChange={(e) => handleDateCountChange(e.target.value)}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(count => (
                <option key={count} value={count}>{count}</option>
              ))}
            </select>
          </div>

          {/* Heure de début */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Heure Min
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            >
              {Array.from({ length: 24 }, (_, i) => i).map(hour => (
                ['00', '15', '30', '45'].map(minute => (
                  <option key={`${hour}-${minute}`} value={`${hour.toString().padStart(2, '0')}h${minute}`}>
                    {`${hour.toString().padStart(2, '0')}h${minute}`}
                  </option>
                ))
              ))}
            </select>
          </div>

          {/* Heure de fin */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Heure Max
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            >
              {Array.from({ length: 24 }, (_, i) => i).map(hour => (
                ['00', '15', '30', '45'].map(minute => (
                  <option key={`${hour}-${minute}`} value={`${hour.toString().padStart(2, '0')}h${minute}`}>
                    {`${hour.toString().padStart(2, '0')}h${minute}`}
                  </option>
                ))
              ))}
            </select>
          </div>

          {/* Commentaires */}
          <div className="md:col-span-2">
            <label className="block text-gray-700 font-medium mb-2">
              Commentaires (s'applique à tous les RDV)
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-md px-3 py-2 h-24"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
          </div>
        </div>

        {/* 🆕 Outils de génération automatique de dates */}
        {dateCount > 1 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-blue-800 mb-1">Génération automatique de dates</h4>
                <p className="text-sm text-blue-600">Remplissez automatiquement les dates suivantes en jours consécutifs</p>
              </div>
              <button
                type="button"
                onClick={fillConsecutiveDates}
                disabled={!dates[0].day || !dates[0].month || !dates[0].year}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-md text-sm transition-colors"
              >
                📅 Générer {dateCount - 1} dates consécutives
              </button>
            </div>
          </div>
        )}

        {/* Configuration des dates */}
        {dates.map((date, dateIndex) => (
          <div key={`date-${dateIndex}`} className="border rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Date {dateIndex + 1}</h3>
              <div className="flex items-center space-x-2">
                {dateIndex === 0 && selectedStudy?.dateDebut && date.day && date.month && date.year && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    📅 Pré-remplie avec la date de début d'étude
                  </span>
                )}
                {dateIndex === 0 && selectedStudy?.dateDebut && (
                  <button
                    type="button"
                    onClick={() => prefillFirstDateFromStudy(selectedStudy)}
                    className="text-xs bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded-full transition-colors"
                    title="Restaurer la date de début d'étude"
                  >
                    🔄 Restaurer date début
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Jour (JJ)
                </label>
                <input
                  type="text"
                  maxLength="2"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={date.day}
                  onChange={(e) => handleDateChange(dateIndex, 'day', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Mois (MM)
                </label>
                <input
                  type="text"
                  maxLength="2"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={date.month}
                  onChange={(e) => handleDateChange(dateIndex, 'month', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Année (AAAA)
                </label>
                <input
                  type="text"
                  maxLength="4"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={date.year}
                  onChange={(e) => handleDateChange(dateIndex, 'year', e.target.value)}
                />
              </div>
            </div>

            {/* Créneaux horaires */}
            <div className="mt-4">
              <h4 className="font-medium mb-2">Nombre de volontaires par créneau:</h4>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {timeSlots.map((slot, slotIndex) => (
                  <div key={`${dateIndex}-slot-${slotIndex}`} className="flex items-center">
                    <label className="mr-2 w-16 text-sm">{slot}:</label>
                    <select
                      className="w-full border border-gray-300 rounded-md px-2 py-1"
                      value={date.slots[slotIndex] || 0}
                      onChange={(e) => handleSlotVolumeChange(dateIndex, slotIndex, e.target.value)}
                    >
                      {Array.from({ length: 11 }, (_, i) => i).map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        <div className="flex justify-end mt-6">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedGroup}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Création en cours...' : 'Générer les rendez-vous'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentBatchCreator;