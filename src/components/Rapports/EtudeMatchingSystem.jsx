import React, { useState, useEffect } from 'react';
import api from '../../services/api';

// Import de vos icônes SVG selon votre structure
import filterSvg from '../../assets/icons/filter.svg'; // Ajustez le chemin si nécessaire
import userSvg from '../../assets/icons/volunteers.svg';
import searchSvg from '../../assets/icons/search.svg'; // Ajustez le chemin si nécessaire
import saveSvg from '../../assets/icons/save.svg'; // Ajustez le chemin si nécessaire

// Composants d'icônes dans le style de votre application
const FilterIcon = ({ className = "" }) => (
  <img src={filterSvg || searchSvg} className={className} alt="Filter" />
);

const UserIcon = ({ className = "" }) => (
  <img src={userSvg} className={className} alt="User" />
);

const SearchIcon = ({ className = "" }) => (
  <img src={searchSvg} className={className} alt="Search" />
);

const SaveIcon = ({ className = "" }) => (
  <img src={saveSvg || searchSvg} className={className} alt="Save" />
);

const EtudeMatchingSystem = () => {
  // État des données
  const [volontaires, setVolontaires] = useState([]);
  const [volontairesHc, setVolontairesHc] = useState([]);
  const [loading, setLoading] = useState(false);
  const [matchingResults, setMatchingResults] = useState([]);
  const [etudes, setEtudes] = useState([]);
  const [selectedEtude, setSelectedEtude] = useState(null);
  const [activeTab, setActiveTab] = useState('criteres'); // 'criteres', 'resultats', 'stats'

  // Critères d'étude avec leurs pondérations
  const [criteres, setCriteres] = useState({
    // Critères démographiques
    demographiques: {
      sexe: { value: '', poids: 5 },
      ageMin: { value: 18, poids: 3 },
      ageMax: { value: 65, poids: 3 },
      phototypes: { value: [], poids: 5 },
      typePeauVisage: { value: [], poids: 4 }
    },
    // Critères habitudes cosmétiques
    habitudesAchat: { value: [], poids: 2 },
    methodesEpilation: { value: [], poids: 2 },
    soinsVisage: { value: [], poids: 3 },
    demaquillage: { value: [], poids: 2 },
    soinsCorps: { value: [], poids: 2 },
    soinsSpecifiques: { value: [], poids: 2 },
    produitsHygiene: { value: [], poids: 2 },
    soinsCapillaires: { value: [], poids: 2 },
    maquillageVisage: { value: [], poids: 3 },
    maquillageYeux: { value: [], poids: 3 },
    maquillageLevresOngles: { value: [], poids: 2 },
    maquillagePermanent: { value: [], poids: 2 },
    produitsSolaires: { value: [], poids: 4 },
    parfums: { value: [], poids: 2 }
  });

  // Informations de l'étude
  const [etudeInfo, setEtudeInfo] = useState({
    titre: '',
    description: '',
    nombreVolontairesRequis: 15,
    dateDebut: null,
    dateFin: null
  });

  // Charges les données initiales
// Dans useEffect ou après executeMatching
useEffect(() => {
  if (matchingResults.length > 0) {
    setDisplayedResults(matchingResults);
  }
    fetchData();
    fetchEtudes();
  }, [matchingResults]);

  // Récupère les données des volontaires et habitudes cosmétiques
  // Modification du chargement des volontaires et HC
  const fetchData = async () => {
    setLoading(true);
    try {
      // Récupération des volontaires
      let volontairesData = [];
      try {
        const responseVolontaires = await api.get('/volontaires/allstats');
        if (Array.isArray(responseVolontaires.data)) {
          volontairesData = responseVolontaires.data.filter(vol => vol !== null);
        } else if (responseVolontaires.data && Array.isArray(responseVolontaires.data.content)) {
          volontairesData = responseVolontaires.data.content.filter(vol => vol !== null);
        }
      } catch (error) {
        console.error('Erreur avec /volontaires/allstats:', error);
        
        try {
          const responseActifs = await api.get('/volontaires/actifs');
          if (Array.isArray(responseActifs.data)) {
            volontairesData = responseActifs.data.filter(vol => vol !== null);
          } else if (responseActifs.data && Array.isArray(responseActifs.data.content)) {
            volontairesData = responseActifs.data.content.filter(vol => vol !== null);
          }
        } catch (errActifs) {
          console.error('Erreur avec /volontaires/actifs:', errActifs);
        }
      }
      
      console.log(`${volontairesData.length} volontaires récupérés`);
      setVolontaires(volontairesData);

      // Récupération des habitudes cosmétiques
      let hcData = [];
      try {
        const responseHc = await api.get('/volontaires-hc');
        
        if (Array.isArray(responseHc.data)) {
          hcData = responseHc.data.filter(hc => hc !== null);
        } else if (responseHc.data && Array.isArray(responseHc.data.content)) {
          hcData = responseHc.data.content.filter(hc => hc !== null);
        } else {
          console.warn('Format inattendu pour les habitudes cosmétiques:', responseHc.data);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des habitudes cosmétiques:', error);
      }
      
      console.log(`${hcData.length} habitudes cosmétiques récupérées`);
      setVolontairesHc(hcData);
    } catch (error) {
      console.error('Erreur générale lors de la récupération des données:', error);
    } finally {
      setLoading(false);
    }
  };
  // Récupère les études existantes
  const fetchEtudes = async () => {
    try {
      const response = await api.get('/etudes');
      setEtudes(response.data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des études:', error);
    }
  };

  // Mise à jour d'un critère
  const updateCritere = (categorie, field, value) => {
    setCriteres(prev => ({
      ...prev,
      [categorie]: {
        ...prev[categorie],
        [field]: value
      }
    }));
  };

  // Sauvegarde d'une étude
  const handleSaveEtude = async () => {
    const etudeData = {
      titre: etudeInfo.titre,
      description: etudeInfo.description,
      nombreVolontairesRequis: etudeInfo.nombreVolontairesRequis,
      dateDebut: etudeInfo.dateDebut,
      dateFin: etudeInfo.dateFin,
      criteres
    };

    try {
      if (selectedEtude) {
        // Mise à jour d'une étude existante
        await api.put(`/etudes/${selectedEtude.id}`, etudeData);
      } else {
        // Création d'une nouvelle étude
        await api.post('/etudes', etudeData);
      }
      
      fetchEtudes();
      alert('Étude sauvegardée avec succès');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'étude:', error);
      alert('Erreur lors de la sauvegarde de l\'étude');
    }
  };

  // Chargement d'une étude existante
  const handleLoadEtude = (etudeId) => {
    const etude = etudes.find(e => e.id === etudeId);
    if (etude) {
      setSelectedEtude(etude);
      setEtudeInfo({
        titre: etude.titre,
        description: etude.description,
        nombreVolontairesRequis: etude.nombreVolontairesRequis,
        dateDebut: etude.dateDebut,
        dateFin: etude.dateFin
      });
      setCriteres(etude.criteres);
    }
  };

  // Fonction de calcul du score d'habitudes cosmétiques
  const calculerScoreHabitudesCosmetiques = (volontaire, hcData) => {
    // Protection contre les nulls
    if (!volontaire || !hcData) {
      console.warn("Volontaire ou données HC manquantes:", volontaire?.idVol);
      return 0;
    }
  
    let scoreTotalHC = 0;
    let maxScoreTotalHC = 0;
    
    // Vérification des habitudes d'achat
    if (criteres.habitudesAchat.value.length > 0) {
      const poids = criteres.habitudesAchat.poids;
      maxScoreTotalHC += poids;
      
      let scoreHabitudesAchat = 0;
      let totalItems = criteres.habitudesAchat.value.length;
      
      criteres.habitudesAchat.value.forEach(habitude => {
        // Vérification selon le type d'habitude d'achat avec protection contre les nulls
        if (habitude === "Pharmacie/Parapharmacie" && hcData.achatPharmacieParapharmacie === "Oui") {
          scoreHabitudesAchat++;
        }
        if (habitude === "Grandes surfaces" && hcData.achatGrandesSurfaces === "Oui") {
          scoreHabitudesAchat++;
        }
        if (habitude === "Institut/Parfumerie" && hcData.achatInstitutParfumerie === "Oui") {
          scoreHabitudesAchat++;
        }
        if (habitude === "Internet" && hcData.achatInternet === "Oui") {
          scoreHabitudesAchat++;
        }
        if (habitude === "Produits bio" && hcData.produitsBio === "Oui") {
          scoreHabitudesAchat++;
        }
      });
      
      // Score pondéré pour cette catégorie
      if (totalItems > 0) {
        scoreTotalHC += (scoreHabitudesAchat / totalItems) * poids;
      }
    }
    // Vérification des soins visage
    if (criteres.soinsVisage.value.length > 0) {
      const poids = criteres.soinsVisage.poids;
      maxScoreTotalHC += poids;
      
      let scoreSoinsVisage = 0;
      let totalItems = criteres.soinsVisage.value.length;
      
      criteres.soinsVisage.value.forEach(soin => {
        // Mappage entre les libellés et les champs
        const mapSoinsVisage = {
          "Soin hydratant": hcData.soinHydratantVisage,
          "Soin nourrissant": hcData.soinNourissantVisage,
          "Soin matifiant": hcData.soinMatifiantVisage,
          "Soin anti-âge": hcData.soinAntiAgeVisage,
          "Soin anti-rides": hcData.soinAntiRidesVisage,
          "Soin anti-taches": hcData.soinAntiTachesVisage,
          "Soin anti-rougeurs": hcData.soinAntiRougeursVisage,
          "Soin éclat du teint": hcData.soinEclatDuTeint,
          "Soin raffermissant": hcData.soinRaffermissantVisage,
          "Contour des yeux": hcData.soinContourDesYeux,
          "Contour des lèvres": hcData.soinContourDesLevres
        };
        
        if (mapSoinsVisage[soin] === "Oui") {
          scoreSoinsVisage++;
        }
      });
      
      // Score pondéré pour cette catégorie
      if (totalItems > 0) {
        scoreTotalHC += (scoreSoinsVisage / totalItems) * poids;
      }
    }
    
    // Vérification du maquillage visage
    if (criteres.maquillageVisage.value.length > 0) {
      const poids = criteres.maquillageVisage.poids;
      maxScoreTotalHC += poids;
      
      let scoreMaquillageVisage = 0;
      let totalItems = criteres.maquillageVisage.value.length;
      
      criteres.maquillageVisage.value.forEach(maquillage => {
        // Mappage entre les libellés et les champs
        const mapMaquillageVisage = {
          "Fond de teint": hcData.fondDeTeint,
          "Poudre libre": hcData.poudreLibre,
          "Blush/Fard à joues": hcData.blushFardAJoues,
          "Correcteur de teint": hcData.correcteurTeint,
          "Anti-cerne": hcData.anticerne,
          "Base de maquillage": hcData.baseMaquillage,
          "Crème teintée": hcData.cremeTeintee
        };
        
        if (mapMaquillageVisage[maquillage] === "Oui") {
          scoreMaquillageVisage++;
        }
      });
      
      // Score pondéré pour cette catégorie
      if (totalItems > 0) {
        scoreTotalHC += (scoreMaquillageVisage / totalItems) * poids;
      }
    }
    
    // Vérification des produits solaires
    if (criteres.produitsSolaires.value.length > 0) {
      const poids = criteres.produitsSolaires.poids;
      maxScoreTotalHC += poids;
      
      let scoreProduitsSolaires = 0;
      let totalItems = criteres.produitsSolaires.value.length;
      
      criteres.produitsSolaires.value.forEach(produit => {
        // Mappage entre les libellés et les champs
        const mapProduitsSolaires = {
          "Protecteur solaire visage": hcData.protecteurSolaireVisage,
          "Protecteur solaire corps": hcData.protecteurSolaireCorps,
          "Protecteur solaire lèvres": hcData.protecteurSolaireLevres,
          "Soin après-soleil": hcData.soinApresSoleil,
          "Autobronzant": hcData.autobronzant
        };
        
        if (mapProduitsSolaires[produit] === "Oui") {
          scoreProduitsSolaires++;
        }
      });
      
      // Score pondéré pour cette catégorie
      if (totalItems > 0) {
        scoreTotalHC += (scoreProduitsSolaires / totalItems) * poids;
      }
    }

        // Vérification des méthodes d'épilation
    if (criteres.methodesEpilation.value.length > 0) {
      const poids = criteres.methodesEpilation.poids;
      maxScoreTotalHC += poids;
      
      let scoreMethodesEpilation = 0;
      let totalItems = criteres.methodesEpilation.value.length;
      
      criteres.methodesEpilation.value.forEach(methode => {
        const mapMethodesEpilation = {
          "Rasoir": hcData.rasoir,
          "Épilateur électrique": hcData.epilateurElectrique,
          "Cire": hcData.cire,
          "Crème dépilatoire": hcData.cremeDepilatoire,
          "Institut": hcData.institut,
          "Épilation définitive": hcData.epilationDefinitive
        };
        
        if (mapMethodesEpilation[methode] === "Oui") {
          scoreMethodesEpilation++;
        }
      });
      
      if (totalItems > 0) {
        scoreTotalHC += (scoreMethodesEpilation / totalItems) * poids;
      }
    }

    // Vérification du démaquillage
    if (criteres.demaquillage.value.length > 0) {
      const poids = criteres.demaquillage.poids;
      maxScoreTotalHC += poids;
      
      let scoreDemaquillage = 0;
      let totalItems = criteres.demaquillage.value.length;
      
      criteres.demaquillage.value.forEach(produit => {
        const mapDemaquillage = {
          "Démaquillant visage": hcData.demaquillantVisage,
          "Démaquillant yeux": hcData.demaquillantYeux,
          "Démaquillant waterproof": hcData.demaquillantWaterproof,
          "Gel nettoyant": hcData.gelNettoyant,
          "Lotion micellaire": hcData.lotionMicellaire,
          "Tonique": hcData.tonique
        };
        
        if (mapDemaquillage[produit] === "Oui") {
          scoreDemaquillage++;
        }
      });
      
      if (totalItems > 0) {
        scoreTotalHC += (scoreDemaquillage / totalItems) * poids;
      }
    }

    // Vérification des soins corps
    if (criteres.soinsCorps.value.length > 0) {
      const poids = criteres.soinsCorps.poids;
      maxScoreTotalHC += poids;
      
      let scoreSoinsCorps = 0;
      let totalItems = criteres.soinsCorps.value.length;
      
      criteres.soinsCorps.value.forEach(soin => {
        const mapSoinsCorps = {
          "Soin hydratant": hcData.soinHydratantCorps,
          "Soin nourrissant": hcData.soinNourrissantCorps,
          "Soin raffermissant": hcData.soinRaffermissantCorps,
          "Soin amincissant": hcData.soinAmincissant,
          "Anti-cellulite": hcData.soinAntiCellulite,
          "Anti-vergetures": hcData.soinAntiVergetures,
          "Soin anti-âge corps": hcData.soinAntiAgeCorps,
          "Gommage": hcData.gommageCorps,
          "Masque": hcData.masqueCorps
        };
        
        if (mapSoinsCorps[soin] === "Oui") {
          scoreSoinsCorps++;
        }
      });
      
      if (totalItems > 0) {
        scoreTotalHC += (scoreSoinsCorps / totalItems) * poids;
      }
    }

    // Vérification des soins spécifiques
    if (criteres.soinsSpecifiques.value.length > 0) {
      const poids = criteres.soinsSpecifiques.poids;
      maxScoreTotalHC += poids;
      
      let scoreSoinsSpecifiques = 0;
      let totalItems = criteres.soinsSpecifiques.value.length;
      
      criteres.soinsSpecifiques.value.forEach(soin => {
        const mapSoinsSpecifiques = {
          "Soin des mains hydratant": hcData.soinHydratantMains,
          "Soin des mains nourrissant": hcData.soinNourrissantMains,
          "Soin des mains anti-âge": hcData.soinAntiAgeMains,
          "Soin des mains anti-taches": hcData.soinAntiTachesMains,
          "Soin des pieds": hcData.soinPieds,
          "Soin des ongles": hcData.soinOngles
        };
        
        if (mapSoinsSpecifiques[soin] === "Oui") {
          scoreSoinsSpecifiques++;
        }
      });
      
      if (totalItems > 0) {
        scoreTotalHC += (scoreSoinsSpecifiques / totalItems) * poids;
      }
    }

    // Vérification des produits d'hygiène
    if (criteres.produitsHygiene.value.length > 0) {
      const poids = criteres.produitsHygiene.poids;
      maxScoreTotalHC += poids;
      
      let scoreProduitsHygiene = 0;
      let totalItems = criteres.produitsHygiene.value.length;
      
      criteres.produitsHygiene.value.forEach(produit => {
        const mapProduitsHygiene = {
          "Gel douche": hcData.gelDouche,
          "Lait douche": hcData.laitDouche,
          "Savon": hcData.savon,
          "Produits pour le bain": hcData.produitsBain,
          "Nettoyant intime": hcData.nettoyantIntime,
          "Déodorant": hcData.deodorant,
          "Anti-transpirant": hcData.antiTranspirant
        };
        
        if (mapProduitsHygiene[produit] === "Oui") {
          scoreProduitsHygiene++;
        }
      });
      
      if (totalItems > 0) {
        scoreTotalHC += (scoreProduitsHygiene / totalItems) * poids;
      }
    }

    // Vérification des soins capillaires
    if (criteres.soinsCapillaires.value.length > 0) {
      const poids = criteres.soinsCapillaires.poids;
      maxScoreTotalHC += poids;
      
      let scoreSoinsCapillaires = 0;
      let totalItems = criteres.soinsCapillaires.value.length;
      
      criteres.soinsCapillaires.value.forEach(soin => {
        const mapSoinsCapillaires = {
          "Shampooing": hcData.shampoing,
          "Après-shampooing": hcData.apresShampoing,
          "Masque capillaire": hcData.masqueCapillaire,
          "Produit coiffant/fixant": hcData.produitCoiffantFixant,
          "Coloration/Mèches": hcData.colorationMeches,
          "Permanente": hcData.permanente,
          "Lissage/Défrisage": hcData.lissageDefrisage,
          "Extensions capillaires": hcData.extensionsCapillaires
        };
        
        if (mapSoinsCapillaires[soin] === "Oui") {
          scoreSoinsCapillaires++;
        }
      });
      
      if (totalItems > 0) {
        scoreTotalHC += (scoreSoinsCapillaires / totalItems) * poids;
      }
    }

    // Vérification du maquillage des yeux
    if (criteres.maquillageYeux.value.length > 0) {
      const poids = criteres.maquillageYeux.poids;
      maxScoreTotalHC += poids;
      
      let scoreMaquillageYeux = 0;
      let totalItems = criteres.maquillageYeux.value.length;
      
      criteres.maquillageYeux.value.forEach(maquillage => {
        const mapMaquillageYeux = {
          "Mascara": hcData.mascara,
          "Mascara waterproof": hcData.mascaraWaterproof,
          "Crayons à yeux": hcData.crayonsYeux,
          "Eyeliner": hcData.eyeliner,
          "Fard à paupières": hcData.fardAPaupieres,
          "Maquillage des sourcils": hcData.maquillageDesSourcils,
          "Faux cils": hcData.fauxCils
        };
        
        if (mapMaquillageYeux[maquillage] === "Oui") {
          scoreMaquillageYeux++;
        }
      });
      
      if (totalItems > 0) {
        scoreTotalHC += (scoreMaquillageYeux / totalItems) * poids;
      }
    }

    // Vérification du maquillage des lèvres et ongles
    if (criteres.maquillageLevresOngles.value.length > 0) {
      const poids = criteres.maquillageLevresOngles.poids;
      maxScoreTotalHC += poids;
      
      let scoreMaquillageLevresOngles = 0;
      let totalItems = criteres.maquillageLevresOngles.value.length;
      
      criteres.maquillageLevresOngles.value.forEach(maquillage => {
        const mapMaquillageLevresOngles = {
          "Rouge à lèvres": hcData.rougeALevres,
          "Gloss": hcData.gloss,
          "Crayon à lèvres": hcData.crayonLevres,
          "Vernis à ongles": hcData.vernisAOngles,
          "Dissolvant": hcData.dissolvantOngles,
          "Faux ongles": hcData.fauxOngles,
          "Manucures": hcData.manucures
        };
        
        if (mapMaquillageLevresOngles[maquillage] === "Oui") {
          scoreMaquillageLevresOngles++;
        }
      });
      
      if (totalItems > 0) {
        scoreTotalHC += (scoreMaquillageLevresOngles / totalItems) * poids;
      }
    }

    // Vérification du maquillage permanent
    if (criteres.maquillagePermanent.value.length > 0) {
      const poids = criteres.maquillagePermanent.poids;
      maxScoreTotalHC += poids;
      
      let scoreMaquillagePermanent = 0;
      let totalItems = criteres.maquillagePermanent.value.length;
      
      criteres.maquillagePermanent.value.forEach(maquillage => {
        const mapMaquillagePermanent = {
          "Maquillage permanent des yeux": hcData.maquillagePermanentYeux,
          "Maquillage permanent des lèvres": hcData.maquillagePermanentLevres,
          "Maquillage permanent des sourcils": hcData.maquillagePermanentSourcils
        };
        
        if (mapMaquillagePermanent[maquillage] === "Oui") {
          scoreMaquillagePermanent++;
        }
      });
      
      if (totalItems > 0) {
        scoreTotalHC += (scoreMaquillagePermanent / totalItems) * poids;
      }
    }

    // Vérification des parfums
    if (criteres.parfums.value.length > 0) {
      const poids = criteres.parfums.poids;
      maxScoreTotalHC += poids;
      
      let scoreParfums = 0;
      let totalItems = criteres.parfums.value.length;
      
      criteres.parfums.value.forEach(parfum => {
        const mapParfums = {
          "Parfum": hcData.parfum,
          "Eau de toilette": hcData.eauDeToilette
        };
        
        if (mapParfums[parfum] === "Oui") {
          scoreParfums++;
        }
      });
      
      if (totalItems > 0) {
        scoreTotalHC += (scoreParfums / totalItems) * poids;
      }
    }
    
    // Retourner le score normalisé des habitudes cosmétiques
    return maxScoreTotalHC > 0 ? scoreTotalHC / maxScoreTotalHC : 0;
  };

  // Exécute l'algorithme de matching
  // Ajoutez du code de diagnostic pour comprendre les valeurs réelles des phototypes
  const executeMatching = () => {
    setLoading(true);
    
    try {
      // Diagnostic des données des volontaires
      console.log("Volontaires avec leurs propriétés principales:", volontaires.map(vol => ({
        id: vol.idVol || vol.volontaireId,
        nom: vol.nomVol || vol.nom,
        prenom: vol.prenomVol || vol.prenom,
        sexe: vol.sexe,
        dateNaissance: vol.dateNaissance,
        phototype: vol.phototype, // Vérifier les valeurs réelles
        typePeauVisage: vol.typePeauVisage
      })));
      
      // S'assurer que les critères de matching sont bien définis
      console.log("Critères démographiques:", criteres.demographiques);
      
      // S'assurer que volontaires et volontairesHc sont bien des tableaux
      const volontairesArray = Array.isArray(volontaires) ? volontaires.filter(vol => vol !== null) : [];
      const volontairesHcArray = Array.isArray(volontairesHc) ? volontairesHc.filter(hc => hc !== null) : [];
      
      console.log('Volontaires disponibles:', volontairesArray.length);
      console.log('Habitudes cosmétiques disponibles:', volontairesHcArray.length);
      
      if (volontairesArray.length === 0) {
        console.warn('Aucun volontaire disponible pour le matching');
        alert('Aucun volontaire disponible pour le matching. Vérifiez la connexion à l\'API.');
        setMatchingResults([]);
        setActiveTab('resultats');
        setLoading(false);
        return;
      }
      
      // Combinaison des données des volontaires et de leurs habitudes cosmétiques
      const volontairesComplets = volontairesArray.map(vol => {
        const volId = vol.idVol || vol.volontaireId;
        
        if (!volId) {
          console.log('Volontaire sans identifiant valide:', vol);
          return { ...vol, habitudesCosmetiques: {} };
        }
        
        // Chercher dans la liste des HC en utilisant les différentes possibilités d'ID
        const hcData = volontairesHcArray.find(hc => {
          if (!hc) return false;
          
          return (hc.idVol && hc.idVol === volId) || 
                (hc.volontaireId && hc.volontaireId === volId) ||
                (hc.id && hc.id === volId);
        });
        
        // Log pour comprendre l'association volontaire-HC
        if (hcData) {
          console.log(`Volontaire ID=${volId} a des habitudes cosmétiques associées`);
        } else {
          console.log(`Volontaire ID=${volId} n'a PAS de habitudes cosmétiques associées`);
        }
        
        return { ...vol, habitudesCosmetiques: hcData || {} };
      });
      
      // Calculer l'âge à partir de dateNaissance si disponible
      const calculateAge = birthDate => {
        if (!birthDate) return 0;
        
        const birth = new Date(birthDate);
        const now = new Date();
        let age = now.getFullYear() - birth.getFullYear();
        const monthDiff = now.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
          age--;
        }
        
        return age;
      };
      
      const results = volontairesComplets
        .map(vol => {
          // Score démographique
          let scoreDemographique = 0;
          let maxScoreDemographique = 0;
          
          // Adapter la vérification du sexe à la structure réelle
          if (criteres.demographiques.sexe.value && vol.sexe) {
            maxScoreDemographique += criteres.demographiques.sexe.poids;
            
            // Convertir la valeur des critères et celle du volontaire en format comparable
            const sexeCritere = criteres.demographiques.sexe.value.toUpperCase();
            const sexeVolontaire = vol.sexe.toUpperCase();
            
            // Mapping des sexes pour comparaison
            const match = 
              (sexeCritere === "FEMME" && (sexeVolontaire === "FÉMININ" || sexeVolontaire === "FEMININ")) || 
              (sexeCritere === "HOMME" && sexeVolontaire === "MASCULIN") ||
              (sexeCritere === sexeVolontaire);
            
            if (match) {
              scoreDemographique += criteres.demographiques.sexe.poids;
            }
            
            // Log pour comprendre la comparaison
            console.log(`Volontaire ${vol.nomVol || vol.nom}: Sexe critère=${sexeCritere}, Sexe volontaire=${sexeVolontaire}, Match=${match}`);
          }
          
          // Vérification de l'âge - calculer à partir de dateNaissance
          const age = calculateAge(vol.dateNaissance);
          
          if ((criteres.demographiques.ageMin.value || criteres.demographiques.ageMax.value) && age > 0) {
            maxScoreDemographique += Math.max(criteres.demographiques.ageMin.poids, criteres.demographiques.ageMax.poids);
            
            const ageMin = criteres.demographiques.ageMin.value || 0;
            const ageMax = criteres.demographiques.ageMax.value || 999;
            
            const ageMatch = age >= ageMin && age <= ageMax;
            
            if (ageMatch) {
              scoreDemographique += Math.max(criteres.demographiques.ageMin.poids, criteres.demographiques.ageMax.poids);
            }
            
            // Log pour comprendre la comparaison
            console.log(`Volontaire ${vol.nomVol || vol.nom}: Age=${age}, Critère min=${ageMin}, max=${ageMax}, Match=${ageMatch}`);
          }
          
          // Vérification du phototype
          if (criteres.demographiques.phototypes.value.length > 0) {
            maxScoreDemographique += criteres.demographiques.phototypes.poids;
            
            // Même si le phototype est null ou undefined, on peut tout de même vérifier
            const phototype = vol.phototype || '?';
            const phototypesMatch = criteres.demographiques.phototypes.value.includes(phototype);
            
            if (phototypesMatch) {
              scoreDemographique += criteres.demographiques.phototypes.poids;
            }
            
            // Log pour comprendre la comparaison
            console.log(`Volontaire ${vol.nomVol || vol.nom}: Phototype=${phototype}, Critères=[${criteres.demographiques.phototypes.value.join(',')}], Match=${phototypesMatch}`);
          }
          
          // Calcul du score démographique normalisé avec un log détaillé
          const scoreDemographiqueNormalise = maxScoreDemographique > 0 ? scoreDemographique / maxScoreDemographique : 0;
          console.log(`Volontaire ${vol.nomVol || vol.nom}: Score démographique=${scoreDemographique}/${maxScoreDemographique} = ${scoreDemographiqueNormalise}`);
          
          // Calcul du score d'habitudes cosmétiques
          let scoreHC = 0;
          if (vol.habitudesCosmetiques && Object.keys(vol.habitudesCosmetiques).length > 0) {
            scoreHC = calculerScoreHabitudesCosmetiques(vol, vol.habitudesCosmetiques);
          }
          console.log(`Volontaire ${vol.nomVol || vol.nom}: Score HC=${scoreHC}`);
          
          // Calcul du score total
          const scoreTotal = (scoreDemographiqueNormalise * 0.7) + (scoreHC * 0.3);
          const scorePercentage = Math.round(scoreTotal * 100);
          
          console.log(`Volontaire ${vol.nomVol || vol.nom}: Score total=${scorePercentage}% (Démo: ${Math.round(scoreDemographiqueNormalise * 100)}%, HC: ${Math.round(scoreHC * 100)}%)`);
          
          return {
            id: vol.idVol || vol.volontaireId || 'ID inconnu',
            nom: vol.nomVol || vol.nom || 'Nom inconnu',
            prenom: vol.prenomVol || vol.prenom || 'Prénom inconnu',
            sexe: vol.sexe || '?',
            age: age || 0,
            phototype: vol.phototype || '?',
            typePeauVisage: vol.typePeauVisage || '?',
            scoreDemographique: Math.round(scoreDemographiqueNormalise * 100),
            scoreHC: Math.round(scoreHC * 100),
            scoreTotal,
            scorePercentage
          };
        })
        .sort((a, b) => b.scoreTotal - a.scoreTotal);

      console.log(`Matching terminé: ${results.length} volontaires compatibles trouvés`);
      setMatchingResults(results);
      setActiveTab('resultats');
    } catch (error) {
      console.error('Erreur lors du matching:', error);
      alert('Une erreur est survenue lors du matching: ' + error.message);
      setMatchingResults([]);
    } finally {
      setLoading(false);
    }
  };
  // Rendu du contenu en fonction de l'onglet actif
  const renderContent = () => {
    switch (activeTab) {
      case 'criteres':
        return renderCriteresTab();
      case 'resultats':
        return renderResultatsTab();
      case 'stats':
        return renderStatsTab();
      default:
        return null;
    }
  };

  // Onglet de définition des critères
  const renderCriteresTab = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
        <div className="flex items-start">
          <div className="text-blue-500 mt-1 mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-blue-800 font-medium">Configuration de l'étude</h3>
            <p className="text-blue-700 text-sm mt-1">
              Définissez les critères de sélection des volontaires pour votre étude.
              Plus vous ajoutez de critères précis, meilleur sera le matching.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Titre de l'étude
          </label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ex: Évaluation d'un soin anti-âge"
            value={etudeInfo.titre}
            onChange={(e) => setEtudeInfo({...etudeInfo, titre: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre de volontaires requis
          </label>
          <input
            type="number"
            min="1"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={etudeInfo.nombreVolontairesRequis}
            onChange={(e) => setEtudeInfo({...etudeInfo, nombreVolontairesRequis: parseInt(e.target.value)})}
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description de l'étude
        </label>
        <textarea
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          rows="3"
          placeholder="Description des objectifs et du protocole de l'étude"
          value={etudeInfo.description}
          onChange={(e) => setEtudeInfo({...etudeInfo, description: e.target.value})}
        ></textarea>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-800 py-2 border-b border-gray-200">
          Critères démographiques
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sexe
            </label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={criteres.demographiques.sexe.value}
              onChange={(e) => updateCritere('demographiques', 'sexe', { ...criteres.demographiques.sexe, value: e.target.value })}
            >
              <option value="">Tous</option>
              <option value="HOMME">Homme</option>
              <option value="FEMME">Femme</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Âge minimum
            </label>
            <input
              type="number"
              min="18"
              max="100"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={criteres.demographiques.ageMin.value}
              onChange={(e) => updateCritere('demographiques', 'ageMin', { ...criteres.demographiques.ageMin, value: parseInt(e.target.value) })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Âge maximum
            </label>
            <input
              type="number"
              min="18"
              max="100"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={criteres.demographiques.ageMax.value}
              onChange={(e) => updateCritere('demographiques', 'ageMax', { ...criteres.demographiques.ageMax, value: parseInt(e.target.value) })}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phototypes
          </label>
          <div className="flex flex-wrap gap-2">
            {['I', 'II', 'III', 'IV', 'V', 'VI'].map(type => (
              <label key={type} className="inline-flex items-center">
                <input
                  type="checkbox"
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  checked={criteres.demographiques.phototypes.value.includes(type)}
                  onChange={(e) => {
                    const currentValues = [...criteres.demographiques.phototypes.value];
                    if (e.target.checked) {
                      currentValues.push(type);
                    } else {
                      const index = currentValues.indexOf(type);
                      if (index > -1) {
                        currentValues.splice(index, 1);
                      }
                    }
                    updateCritere('demographiques', 'phototypes', { ...criteres.demographiques.phototypes, value: currentValues });
                  }}
                />
                <span className="ml-2 text-sm text-gray-700">Type {type}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-800 py-2 border-b border-gray-200">
          Habitudes cosmétiques
        </h3>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Soins du visage
          </label>
          <div className="flex flex-wrap gap-2">
            {['Soin hydratant', 'Soin anti-âge', 'Soin anti-rides', 'Soin anti-taches', 'Contour des yeux'].map(soin => (
              <label key={soin} className="inline-flex items-center">
                <input
                  type="checkbox"
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  checked={criteres.soinsVisage.value.includes(soin)}
                  onChange={(e) => {
                    const currentValues = [...criteres.soinsVisage.value];
                    if (e.target.checked) {
                      currentValues.push(soin);
                    } else {
                      const index = currentValues.indexOf(soin);
                      if (index > -1) {
                        currentValues.splice(index, 1);
                      }
                    }
                    updateCritere('soinsVisage', 'value', currentValues);
                  }}
                />
                <span className="ml-2 text-sm text-gray-700">{soin}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Produits solaires
          </label>
          <div className="flex flex-wrap gap-2">
            {['Protecteur solaire visage', 'Protecteur solaire corps', 'Soin après-soleil', 'Autobronzant'].map(produit => (
              <label key={produit} className="inline-flex items-center">
                <input
                  type="checkbox"
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  checked={criteres.produitsSolaires.value.includes(produit)}
                  onChange={(e) => {
                    const currentValues = [...criteres.produitsSolaires.value];
                    if (e.target.checked) {
                      currentValues.push(produit);
                    } else {
                      const index = currentValues.indexOf(produit);
                      if (index > -1) {
                        currentValues.splice(index, 1);
                      }
                    }
                    updateCritere('produitsSolaires', 'value', currentValues);
                  }}
                />
                <span className="ml-2 text-sm text-gray-700">{produit}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Méthodes d'épilation
          </label>
          <div className="flex flex-wrap gap-2">
            {['Rasoir', 'Épilateur électrique', 'Cire', 'Crème dépilatoire', 'Institut', 'Épilation définitive'].map(methode => (
              <label key={methode} className="inline-flex items-center">
                <input
                  type="checkbox"
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  checked={criteres.methodesEpilation.value.includes(methode)}
                  onChange={(e) => {
                    const currentValues = [...criteres.methodesEpilation.value];
                    if (e.target.checked) {
                      currentValues.push(methode);
                    } else {
                      const index = currentValues.indexOf(methode);
                      if (index > -1) {
                        currentValues.splice(index, 1);
                      }
                    }
                    updateCritere('methodesEpilation', 'value', currentValues);
                  }}
                />
                <span className="ml-2 text-sm text-gray-700">{methode}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Démaquillage et nettoyage
          </label>
          <div className="flex flex-wrap gap-2">
            {['Démaquillant visage', 'Démaquillant yeux', 'Démaquillant waterproof', 'Gel nettoyant', 'Lotion micellaire', 'Tonique'].map(produit => (
              <label key={produit} className="inline-flex items-center">
                <input
                  type="checkbox"
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  checked={criteres.demaquillage.value.includes(produit)}
                  onChange={(e) => {
                    const currentValues = [...criteres.demaquillage.value];
                    if (e.target.checked) {
                      currentValues.push(produit);
                    } else {
                      const index = currentValues.indexOf(produit);
                      if (index > -1) {
                        currentValues.splice(index, 1);
                      }
                    }
                    updateCritere('demaquillage', 'value', currentValues);
                  }}
                />
                <span className="ml-2 text-sm text-gray-700">{produit}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Soins du corps
          </label>
          <div className="flex flex-wrap gap-2">
            {['Soin hydratant', 'Soin nourrissant', 'Soin raffermissant', 'Soin amincissant', 'Anti-cellulite', 'Anti-vergetures', 'Gommage'].map(soin => (
              <label key={soin} className="inline-flex items-center">
                <input
                  type="checkbox"
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  checked={criteres.soinsCorps.value.includes(soin)}
                  onChange={(e) => {
                    const currentValues = [...criteres.soinsCorps.value];
                    if (e.target.checked) {
                      currentValues.push(soin);
                    } else {
                      const index = currentValues.indexOf(soin);
                      if (index > -1) {
                        currentValues.splice(index, 1);
                      }
                    }
                    updateCritere('soinsCorps', 'value', currentValues);
                  }}
                />
                <span className="ml-2 text-sm text-gray-700">{soin}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Maquillage des yeux
          </label>
          <div className="flex flex-wrap gap-2">
            {['Mascara', 'Mascara waterproof', 'Crayons à yeux', 'Eyeliner', 'Fard à paupières', 'Maquillage des sourcils'].map(maquillage => (
              <label key={maquillage} className="inline-flex items-center">
                <input
                  type="checkbox"
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  checked={criteres.maquillageYeux.value.includes(maquillage)}
                  onChange={(e) => {
                    const currentValues = [...criteres.maquillageYeux.value];
                    if (e.target.checked) {
                      currentValues.push(maquillage);
                    } else {
                      const index = currentValues.indexOf(maquillage);
                      if (index > -1) {
                        currentValues.splice(index, 1);
                      }
                    }
                    updateCritere('maquillageYeux', 'value', currentValues);
                  }}
                />
                <span className="ml-2 text-sm text-gray-700">{maquillage}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Maquillage des lèvres et ongles
          </label>
          <div className="flex flex-wrap gap-2">
            {['Rouge à lèvres', 'Gloss', 'Crayon à lèvres', 'Vernis à ongles', 'Dissolvant', 'Faux ongles', 'Manucures'].map(maquillage => (
              <label key={maquillage} className="inline-flex items-center">
                <input
                  type="checkbox"
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  checked={criteres.maquillageLevresOngles.value.includes(maquillage)}
                  onChange={(e) => {
                    const currentValues = [...criteres.maquillageLevresOngles.value];
                    if (e.target.checked) {
                      currentValues.push(maquillage);
                    } else {
                      const index = currentValues.indexOf(maquillage);
                      if (index > -1) {
                        currentValues.splice(index, 1);
                      }
                    }
                    updateCritere('maquillageLevresOngles', 'value', currentValues);
                  }}
                />
                <span className="ml-2 text-sm text-gray-700">{maquillage}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Soins capillaires
          </label>
          <div className="flex flex-wrap gap-2">
            {['Shampooing', 'Après-shampooing', 'Masque capillaire', 'Produit coiffant/fixant', 'Coloration/Mèches'].map(soin => (
              <label key={soin} className="inline-flex items-center">
                <input
                  type="checkbox"
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  checked={criteres.soinsCapillaires.value.includes(soin)}
                  onChange={(e) => {
                    const currentValues = [...criteres.soinsCapillaires.value];
                    if (e.target.checked) {
                      currentValues.push(soin);
                    } else {
                      const index = currentValues.indexOf(soin);
                      if (index > -1) {
                        currentValues.splice(index, 1);
                      }
                    }
                    updateCritere('soinsCapillaires', 'value', currentValues);
                  }}
                />
                <span className="ml-2 text-sm text-gray-700">{soin}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Parfums
          </label>
          <div className="flex flex-wrap gap-2">
            {['Parfum', 'Eau de toilette'].map(produit => (
              <label key={produit} className="inline-flex items-center">
                <input
                  type="checkbox"
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  checked={criteres.parfums.value.includes(produit)}
                  onChange={(e) => {
                    const currentValues = [...criteres.parfums.value];
                    if (e.target.checked) {
                      currentValues.push(produit);
                    } else {
                      const index = currentValues.indexOf(produit);
                      if (index > -1) {
                        currentValues.splice(index, 1);
                      }
                    }
                    updateCritere('parfums', 'value', currentValues);
                  }}
                />
                <span className="ml-2 text-sm text-gray-700">{produit}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        <div className="flex space-x-4">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={executeMatching}
          >
            <div className="flex items-center">
              <SearchIcon className="w-4 h-4 mr-2" />
              <span>Lancer le matching</span>
            </div>
          </button>
          
          <button
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={handleSaveEtude}
          >
            <div className="flex items-center">
              <SaveIcon className="w-4 h-4 mr-2" />
              <span>Sauvegarder l'étude</span>
            </div>
          </button>
        </div>

        <select
          className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          onChange={(e) => handleLoadEtude(e.target.value)}
        >
          <option value="">Charger une étude existante</option>
          {etudes.map(etude => (
            <option key={etude.id} value={etude.id}>{etude.titre}</option>
          ))}
        </select>
      </div>
    </div>
  );

  // Onglet des résultats de matching
  const renderResultatsTab = () => (
    <div>
      {matchingResults.length > 0 ? (
        <>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-6">
            <div className="flex items-start">
              <div className="text-green-500 mt-1 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-green-800 font-medium">
                  {matchingResults.length} volontaires analysés pour l'étude "{etudeInfo.titre || 'Non définie'}"
                </h3>
                <p className="text-green-700 text-sm mt-1">
                  Nombre de volontaires requis: {etudeInfo.nombreVolontairesRequis}. 
                  Les volontaires sont classés par probabilité de correspondance décroissante.
                </p>
              </div>
            </div>
          </div>
  
          {/* Résumé des correspondances */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <div className="text-center">
                <span className="text-lg font-medium text-green-600">Correspondance forte</span>
                <div className="text-3xl font-bold mt-2">
                  {matchingResults.filter(r => r.scorePercentage >= 80).length}
                </div>
                <div className="text-sm text-gray-500 mt-1">80% ou plus</div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <div className="text-center">
                <span className="text-lg font-medium text-blue-600">Correspondance moyenne</span>
                <div className="text-3xl font-bold mt-2">
                  {matchingResults.filter(r => r.scorePercentage >= 60 && r.scorePercentage < 80).length}
                </div>
                <div className="text-sm text-gray-500 mt-1">60% à 79%</div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <div className="text-center">
                <span className="text-lg font-medium text-yellow-600">Correspondance faible</span>
                <div className="text-3xl font-bold mt-2">
                  {matchingResults.filter(r => r.scorePercentage >= 40 && r.scorePercentage < 60).length}
                </div>
                <div className="text-sm text-gray-500 mt-1">40% à 59%</div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <div className="text-center">
                <span className="text-lg font-medium text-red-600">Non compatibles</span>
                <div className="text-3xl font-bold mt-2">
                  {matchingResults.filter(r => r.scorePercentage < 40).length}
                </div>
                <div className="text-sm text-gray-500 mt-1">Moins de 40%</div>
              </div>
            </div>
          </div>
  
          {/* Options de filtrage */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex space-x-2">
              <select 
                className="border border-gray-300 rounded px-3 py-1 text-sm"
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === 'all') {
                    setDisplayedResults(matchingResults);
                  } else {
                    const threshold = parseInt(value);
                    setDisplayedResults(matchingResults.filter(r => r.scorePercentage >= threshold));
                  }
                }}
              >
                <option value="all">Tous les volontaires</option>
                <option value="80">Correspondance forte (≥ 80%)</option>
                <option value="60">Correspondance moyenne (≥ 60%)</option>
                <option value="40">Correspondance minimale (≥ 40%)</option>
              </select>
              
              <input 
                type="number" 
                className="border border-gray-300 rounded px-3 py-1 text-sm w-24"
                placeholder="Limite"
                defaultValue={50}
                onChange={(e) => {
                  const limit = parseInt(e.target.value);
                  if (!isNaN(limit) && limit > 0) {
                    setDisplayLimit(limit);
                  }
                }}
              />
            </div>
            
            <button 
              className="bg-blue-600 text-white px-4 py-1 text-sm rounded hover:bg-blue-700"
              onClick={() => {
                // Exportation des résultats (ajoutez votre logique d'export ici)
                alert('Export des ' + etudeInfo.nombreVolontairesRequis + ' meilleurs volontaires');
              }}
            >
              Exporter les {etudeInfo.nombreVolontairesRequis} meilleurs
            </button>
          </div>
  
          {/* Tableau des résultats */}
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sexe
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Âge
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phototype
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Probabilité de correspondance
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayedResults.slice(0, displayLimit).map((result) => (
                  <tr key={result.id} className={
                    result.scorePercentage >= 80 ? 'bg-green-50' : 
                    result.scorePercentage >= 60 ? 'bg-blue-50' : 
                    result.scorePercentage >= 40 ? 'bg-yellow-50' : 'bg-red-50'
                  }>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {result.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {result.nom} {result.prenom}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {result.sexe}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {result.age}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${result.phototype === 'I' ? 'bg-pink-100 text-pink-800' : 
                          result.phototype === 'II' ? 'bg-orange-100 text-orange-800' : 
                          result.phototype === 'III' ? 'bg-amber-100 text-amber-800' : 
                          result.phototype === 'IV' ? 'bg-yellow-100 text-yellow-800' : 
                          result.phototype === 'V' ? 'bg-lime-100 text-lime-800' : 
                          'bg-gray-100 text-gray-800'}`
                      }>
                        {result.phototype || 'Non spécifié'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                          <div 
                            className={`h-2.5 rounded-full ${
                              result.scorePercentage >= 80 ? 'bg-green-600' : 
                              result.scorePercentage >= 60 ? 'bg-blue-600' : 
                              result.scorePercentage >= 40 ? 'bg-yellow-600' : 
                              'bg-red-600'
                            }`} 
                            style={{ width: `${result.scorePercentage}%` }}
                          ></div>
                        </div>
                        <span className={`text-sm font-medium ${
                          result.scorePercentage >= 80 ? 'text-green-600' : 
                          result.scorePercentage >= 60 ? 'text-blue-600' : 
                          result.scorePercentage >= 40 ? 'text-yellow-600' : 
                          'text-red-600'
                        }`}>
                          {result.scorePercentage}%
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Profil: {result.scoreDemographique}% | Habitudes: {result.scoreHC}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <a 
                        href={`/volontaires/${result.id}`} 
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Voir
                      </a>
                      <button 
                        className="text-green-600 hover:text-green-900"
                        onClick={() => {
                          // Ajouter à la sélection (implémentez cette fonction)
                          alert(`Volontaire ${result.id} ajouté à la sélection`);
                        }}
                      >
                        Sélectionner
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
  
          {/* Pagination ou "Voir plus" */}
          {displayedResults.length > displayLimit && (
            <div className="mt-4 flex justify-center">
              <button 
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => setDisplayLimit(prev => prev + 50)}
              >
                Voir 50 volontaires supplémentaires
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="py-10 text-center">
          <div className="text-gray-500 mb-4">
            Aucun résultat de matching disponible. Veuillez définir des critères et lancer le matching.
          </div>
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={() => setActiveTab('criteres')}
          >
            Définir les critères
          </button>
        </div>
      )}
    </div>
  );
  const [displayedResults, setDisplayedResults] = useState([]);
  const [displayLimit, setDisplayLimit] = useState(50);

  // Onglet des statistiques
  const renderStatsTab = () => (
    <div>
      {matchingResults.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-center">
                <h3 className="text-lg text-gray-600 font-medium mb-2">Volontaires qualifiés</h3>
                <div className="text-4xl font-bold text-blue-600">
                  {matchingResults.filter(r => r.scorePercentage >= 50).length}
                </div>
                <div className="text-gray-500 mt-2">
                  sur {matchingResults.length} volontaires analysés
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-center">
                <h3 className="text-lg text-gray-600 font-medium mb-2">Matching parfait (≥90%)</h3>
                <div className="text-4xl font-bold text-green-600">
                  {matchingResults.filter(r => r.scorePercentage >= 90).length}
                </div>
                <div className="text-gray-500 mt-2">
                  {((matchingResults.filter(r => r.scorePercentage >= 90).length / matchingResults.length) * 100).toFixed(1)}% du total
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-center">
                <h3 className="text-lg text-gray-600 font-medium mb-2">Score moyen</h3>
                <div className="text-4xl font-bold text-orange-600">
                  {(matchingResults.reduce((acc, curr) => acc + curr.scorePercentage, 0) / matchingResults.length).toFixed(1)}%
                </div>
                <div className="text-gray-500 mt-2">
                  tous volontaires confondus
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg text-gray-700 font-medium mb-4">Distribution des scores</h3>
            <div className="h-64 bg-gray-100 flex items-center justify-center rounded">
              <p className="text-gray-500">Le graphique de distribution des scores sera affiché ici</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-10 text-center">
          <div className="text-gray-500 mb-4">
            Aucune statistique disponible. Veuillez lancer un matching pour générer des statistiques.
          </div>
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={() => setActiveTab('criteres')}
          >
            Définir les critères
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Navigation des onglets */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            className={`mr-1 py-3 px-4 font-medium text-sm ${
              activeTab === 'criteres'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('criteres')}
          >
            <div className="flex items-center">
              <FilterIcon className="w-4 h-4 mr-2" />
              <span>Critères d'étude</span>
            </div>
          </button>
          
          <button
            className={`mr-1 py-3 px-4 font-medium text-sm ${
              activeTab === 'resultats'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('resultats')}
          >
            <div className="flex items-center">
              <UserIcon className="w-4 h-4 mr-2" />
              <span>Résultats du matching</span>
            </div>
          </button>
          
          <button
            className={`mr-1 py-3 px-4 font-medium text-sm ${
              activeTab === 'stats'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('stats')}
          >
            <div className="flex items-center">
              <FilterIcon className="w-4 h-4 mr-2" />
              <span>Statistiques</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Contenu des onglets */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        renderContent()
      )}
    </div>
  );
};

export default EtudeMatchingSystem;