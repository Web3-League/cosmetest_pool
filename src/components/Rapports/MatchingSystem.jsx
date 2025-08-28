import React, { useState } from 'react';
import api from '../../services/api';

// Icônes simples
const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

// Mapping des critères de maquillage
const MAPPING_CRITERES = {
  // Maquillage visage
  'Fond de teint': 'fondDeTeint',
  'Poudre libre': 'poudreLibre',
  'Blush/Fard à joues': 'blushFardAJoues',
  'Correcteur de teint': 'correcteurTeint',
  'Anti-cerne': 'anticerne',
  'Base de maquillage': 'baseMaquillage',
  'Crème teintée': 'cremeTeintee',
  
  // Maquillage yeux
  'Mascara': 'mascara',
  'Mascara waterproof': 'mascaraWaterproof',
  'Crayons à yeux': 'crayonsYeux',
  'Eyeliner': 'eyeliner',
  'Fard à paupières': 'fardAPaupieres',
  'Maquillage des sourcils': 'maquillageDesSourcils',
  'Faux cils': 'fauxCils',
  
  // Maquillage lèvres
  'Rouge à lèvres': 'rougeALevres',
  'Gloss': 'gloss',
  'Crayon à lèvres': 'crayonLevres'
};

const MatchingSystem = () => {
  const [criteres, setCriteres] = useState({
    // Critères démographiques
    ageMin: 18,
    ageMax: 65,
    phototypes: [],
    sexe: '',
    
    // Critères de maquillage
    maquillageVisage: [],
    maquillageYeux: [],
    maquillageLevres: []
  });

  const [resultats, setResultats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('criteres');

  // Calcul de l'âge à partir de la date de naissance
  const calculerAge = (dateNaissance) => {
    if (!dateNaissance) return 0;
    const today = new Date();
    const birth = new Date(dateNaissance);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Calcul du score de maquillage (simple : matches/total)
  const calculerScoreMaquillage = (volontaireHC, criteresSelectionnes) => {
    // Combiner tous les critères sélectionnés
    const tousLesCriteres = [
      ...criteresSelectionnes.maquillageVisage,
      ...criteresSelectionnes.maquillageYeux,
      ...criteresSelectionnes.maquillageLevres
    ];

    if (tousLesCriteres.length === 0) return 0;

    let matches = 0;
    
    tousLesCriteres.forEach(critere => {
      const champBD = MAPPING_CRITERES[critere];
      if (champBD && volontaireHC[champBD] === 'oui') {
        matches++;
      }
    });

    // Score simple : nombre de matches / nombre total de critères
    return matches / tousLesCriteres.length;
  };

  // Exécution du matching
  const executerMatching = async () => {
    setLoading(true);
    try {
      // Récupérer tous les volontaires (filtrer les valeurs null)
      const responseVolontaires = await api.get('/volontaires/allstats');
      const volontairesData = Array.isArray(responseVolontaires.data) 
        ? responseVolontaires.data.filter(vol => vol !== null && vol !== undefined) 
        : (responseVolontaires.data?.content || []).filter(vol => vol !== null && vol !== undefined);

      // Récupérer les habitudes cosmétiques (filtrer les valeurs null)
      const responseHC = await api.get('/volontaires-hc');
      const hcData = Array.isArray(responseHC.data) 
        ? responseHC.data.filter(hc => hc !== null && hc !== undefined) 
        : (responseHC.data?.content || []).filter(hc => hc !== null && hc !== undefined);

      console.log('Données récupérées:', {
        volontaires: volontairesData.length,
        hc: hcData.length,
        premiersVolontaires: volontairesData.slice(0, 3).map(v => ({id: v?.idVol, nom: v?.nomVol})),
        premieresHC: hcData.slice(0, 3).map(h => ({id: h?.idVol, fondDeTeint: h?.fondDeTeint}))
      });

      // Traitement des résultats
      const resultatsMatching = volontairesData
        .filter(volontaire => volontaire !== null && volontaire !== undefined && volontaire.idVol)
        .map(volontaire => {
          const age = calculerAge(volontaire.dateNaissance);
          const hc = hcData.find(h => h && h.idVol && h.idVol === volontaire.idVol) || {};

          // Score démographique (âge + phototype + sexe)
          let scoreDemographique = 0;

          // Vérification de l'âge
          if (age >= criteres.ageMin && age <= criteres.ageMax) {
            scoreDemographique += 33.33; // 33% pour l'âge
          }

          // Vérification du phototype
          if (criteres.phototypes.length === 0 || criteres.phototypes.includes(volontaire.phototype)) {
            scoreDemographique += 33.33; // 33% pour le phototype
          }

          // Vérification du sexe
          if (!criteres.sexe || criteres.sexe === volontaire.sexe) {
            scoreDemographique += 33.34; // 34% pour le sexe
          }

          // Score de maquillage (simple)
          const scoreMaquillage = calculerScoreMaquillage(hc, criteres) * 100;

          // Score final adaptatif
          let scoreTotal;
          const aCriteresMaquillage = (criteres.maquillageVisage.length + criteres.maquillageYeux.length + criteres.maquillageLevres.length) > 0;
          
          if (aCriteresMaquillage) {
            // Si critères maquillage: 80% maquillage + 20% démographique
            scoreTotal = (scoreMaquillage * 0.8) + (scoreDemographique * 0.2);
          } else {
            // Si pas de critères maquillage: 100% démographique
            scoreTotal = scoreDemographique;
          }

          // Debug pour vérifier les valeurs
          if (volontaire.idVol === 3) { // Debug pour un volontaire spécifique
            console.log('Debug volontaire:', {
              id: volontaire.idVol,
              nom: volontaire.nomVol,
              criteresSelectionnes: {
                visage: criteres.maquillageVisage,
                yeux: criteres.maquillageYeux,
                levres: criteres.maquillageLevres
              },
              hcData: {
                fondDeTeint: hc.fondDeTeint,
                mascara: hc.mascara,
                rougeALevres: hc.rougeALevres
              },
              scores: {
                maquillage: scoreMaquillage,
                demographique: scoreDemographique,
                total: Math.round(scoreTotal)
              }
            });
          }

          return {
            id: volontaire.idVol,
            nom: volontaire.nomVol || 'Non défini',
            prenom: volontaire.prenomVol || 'Non défini',
            sexe: volontaire.sexe || 'Non défini',
            age,
            phototype: volontaire.phototype || 'Non défini',
            scoreMaquillage: Math.round(scoreMaquillage),
            scoreDemographique: Math.round(scoreDemographique),
            scoreTotal: Math.round(scoreTotal),
            details: volontaire
          };
        })
        .filter(r => r.scoreTotal > 0) // Garder seulement les matches pertinents
        .sort((a, b) => b.scoreTotal - a.scoreTotal);

      setResultats(resultatsMatching);
      setActiveTab('resultats');
    } catch (error) {
      console.error('Erreur lors du matching:', error);
      alert('Erreur lors du matching des volontaires');
    } finally {
      setLoading(false);
    }
  };

  // Interface des critères
  const renderCriteres = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2">Configuration du matching</h3>
        <p className="text-blue-700 text-sm mb-2">
          <strong>Score simple :</strong> Si vous sélectionnez 3 critères et que les 3 correspondent = 100%. 
          Si 2 correspondent = 67%, etc. Les critères démographiques affinent la sélection.
        </p>
        <div className="text-blue-600 text-xs">
          <strong>Exemple :</strong> Vous cherchez "Mascara + Fond de teint + Rouge à lèvres" (3 critères).
          Un volontaire utilise "Mascara + Fond de teint" = 2/3 = 67% de match.
        </div>
      </div>

      {/* Critères démographiques */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Critères démographiques</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Âge minimum</label>
            <input
              type="number"
              min="18"
              max="100"
              className="w-full p-2 border rounded-md"
              value={criteres.ageMin}
              onChange={(e) => setCriteres({...criteres, ageMin: parseInt(e.target.value)})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Âge maximum</label>
            <input
              type="number"
              min="18"
              max="100"
              className="w-full p-2 border rounded-md"
              value={criteres.ageMax}
              onChange={(e) => setCriteres({...criteres, ageMax: parseInt(e.target.value)})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Sexe</label>
            <select
              className="w-full p-2 border rounded-md"
              value={criteres.sexe}
              onChange={(e) => setCriteres({...criteres, sexe: e.target.value})}
            >
              <option value="">Tous</option>
              <option value="MASCULIN">Homme</option>
              <option value="FÉMININ">Femme</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Phototypes</label>
            <div className="flex flex-wrap gap-1">
              {['I', 'II', 'III', 'IV', 'V', 'VI'].map(type => (
                <label key={type} className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-1"
                    checked={criteres.phototypes.includes(type)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setCriteres({...criteres, phototypes: [...criteres.phototypes, type]});
                      } else {
                        setCriteres({...criteres, phototypes: criteres.phototypes.filter(p => p !== type)});
                      }
                    }}
                  />
                  <span className="text-xs">{type}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Critères de maquillage */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Critères de maquillage</h3>
        
        {/* Maquillage du visage */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-700 mb-2">Maquillage du visage</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {['Fond de teint', 'Poudre libre', 'Blush/Fard à joues', 'Correcteur de teint', 'Anti-cerne', 'Base de maquillage', 'Crème teintée'].map(item => (
              <label key={item} className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={criteres.maquillageVisage.includes(item)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setCriteres({...criteres, maquillageVisage: [...criteres.maquillageVisage, item]});
                    } else {
                      setCriteres({...criteres, maquillageVisage: criteres.maquillageVisage.filter(i => i !== item)});
                    }
                  }}
                />
                <span className="text-sm">{item}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Maquillage des yeux */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-700 mb-2">Maquillage des yeux</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {['Mascara', 'Mascara waterproof', 'Crayons à yeux', 'Eyeliner', 'Fard à paupières', 'Maquillage des sourcils', 'Faux cils'].map(item => (
              <label key={item} className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={criteres.maquillageYeux.includes(item)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setCriteres({...criteres, maquillageYeux: [...criteres.maquillageYeux, item]});
                    } else {
                      setCriteres({...criteres, maquillageYeux: criteres.maquillageYeux.filter(i => i !== item)});
                    }
                  }}
                />
                <span className="text-sm">{item}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Maquillage des lèvres */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-700 mb-2">Maquillage des lèvres</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {['Rouge à lèvres', 'Gloss', 'Crayon à lèvres'].map(item => (
              <label key={item} className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={criteres.maquillageLevres.includes(item)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setCriteres({...criteres, maquillageLevres: [...criteres.maquillageLevres, item]});
                    } else {
                      setCriteres({...criteres, maquillageLevres: criteres.maquillageLevres.filter(i => i !== item)});
                    }
                  }}
                />
                <span className="text-sm">{item}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Bouton de lancement */}
      <div className="flex justify-center">
        <div className="text-center">
          <div className="mb-2 text-sm text-gray-600">
            {(() => {
              const totalCriteres = criteres.maquillageVisage.length + criteres.maquillageYeux.length + criteres.maquillageLevres.length;
              return totalCriteres > 0 ? `${totalCriteres} critère(s) de maquillage sélectionné(s)` : 'Aucun critère de maquillage sélectionné';
            })()}
          </div>
          <button
            onClick={executerMatching}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            <SearchIcon />
            <span className="ml-2">{loading ? 'Recherche en cours...' : 'Lancer le matching'}</span>
          </button>
        </div>
      </div>
    </div>
  );

  // Interface des résultats
  const renderResultats = () => (
    <div className="space-y-6">
      {resultats.length > 0 ? (
        <>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-medium text-green-800">{resultats.length} volontaires trouvés</h3>
            <p className="text-green-700 text-sm">Classés par score de correspondance décroissant</p>
          </div>

          {/* Statistiques rapides */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <div className="text-2xl font-bold text-green-600">
                {resultats.filter(r => r.scoreTotal >= 80).length}
              </div>
              <div className="text-sm text-gray-600">Score ≥ 80%</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <div className="text-2xl font-bold text-blue-600">
                {resultats.filter(r => r.scoreTotal >= 60 && r.scoreTotal < 80).length}
              </div>
              <div className="text-sm text-gray-600">Score 60-79%</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {resultats.filter(r => r.scoreTotal >= 40 && r.scoreTotal < 60).length}
              </div>
              <div className="text-sm text-gray-600">Score 40-59%</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <div className="text-2xl font-bold text-gray-600">
                {(resultats.reduce((acc, r) => acc + r.scoreTotal, 0) / resultats.length).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Score moyen</div>
            </div>
          </div>

          {/* Tableau des résultats */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Volontaire</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Âge</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phototype</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score Maquillage</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score Démo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {resultats.slice(0, 500).map((volontaire) => (
                  <tr key={volontaire.id} className={
                    volontaire.scoreTotal >= 80 ? 'bg-green-50' :
                    volontaire.scoreTotal >= 60 ? 'bg-blue-50' :
                    volontaire.scoreTotal >= 40 ? 'bg-yellow-50' : 'bg-gray-50'
                  }>
                    <td className="px-4 py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {volontaire.nom} {volontaire.prenom}
                        </div>
                        <div className="text-sm text-gray-500">ID: {volontaire.id}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">{volontaire.age} ans</td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        {volontaire.phototype}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full" 
                            style={{ width: `${volontaire.scoreMaquillage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{volontaire.scoreMaquillage}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${volontaire.scoreDemographique}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{volontaire.scoreDemographique}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div className="w-20 bg-gray-200 rounded-full h-3 mr-2">
                          <div 
                            className={`h-3 rounded-full ${
                              volontaire.scoreTotal >= 80 ? 'bg-green-600' :
                              volontaire.scoreTotal >= 60 ? 'bg-blue-600' :
                              volontaire.scoreTotal >= 40 ? 'bg-yellow-600' : 'bg-red-600'
                            }`} 
                            style={{ width: `${volontaire.scoreTotal}%` }}
                          ></div>
                        </div>
                        <span className="text-lg font-bold">{volontaire.scoreTotal}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">Aucun résultat de matching disponible</div>
          <button 
            onClick={() => setActiveTab('criteres')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Définir les critères
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              className={`py-3 px-6 font-medium text-sm ${
                activeTab === 'criteres'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('criteres')}
            >
              <div className="flex items-center">
                <SearchIcon />
                <span className="ml-2">Critères de matching</span>
              </div>
            </button>
            
            <button
              className={`py-3 px-6 font-medium text-sm ${
                activeTab === 'resultats'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('resultats')}
            >
              <div className="flex items-center">
                <UserIcon />
                <span className="ml-2">Résultats ({resultats.length})</span>
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            activeTab === 'criteres' ? renderCriteres() : renderResultats()
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchingSystem;