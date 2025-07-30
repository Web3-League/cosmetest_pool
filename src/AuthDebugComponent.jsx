import React, { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import authService from './services/authService';

const AuthDebugComponent = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [debugInfo, setDebugInfo] = useState('');
  const [testResults, setTestResults] = useState([]);

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => `${prev}\n[${timestamp}] ${message}`);
  };

  const addTestResult = (test, result, details = '') => {
    setTestResults(prev => [...prev, { 
      test, 
      result, 
      details, 
      timestamp: new Date().toLocaleTimeString() 
    }]);
  };

  const testAuthentication = async () => {
    setDebugInfo('');
    setTestResults([]);
    addLog('🧪 Début des tests d\'authentification...');

    try {
      // Test 1: Vérification de l'état d'authentification
      addLog('📋 Test 1: Vérification isAuthenticated()');
      const authStatus = await authService.isAuthenticated();
      addTestResult('isAuthenticated()', authStatus, `Retour: ${authStatus}`);
      addLog(`✓ isAuthenticated(): ${authStatus}`);

      // Test 2: Récupération de l'utilisateur
      addLog('📋 Test 2: Récupération getCurrentUser()');
      const currentUser = await authService.getCurrentUser();
      addTestResult('getCurrentUser()', currentUser !== null, `User: ${JSON.stringify(currentUser)}`);
      addLog(`✓ getCurrentUser(): ${currentUser ? 'Utilisateur trouvé' : 'Aucun utilisateur'}`);

      // Test 3: Vérification des rôles
      if (currentUser) {
        addLog('📋 Test 3: Vérification des rôles');
        const userRole = await authService.getUserRole();
        const isAdmin = await authService.isAdmin();
        const isUser = await authService.isUser();
        
        addTestResult('getUserRole()', userRole !== null, `Rôle: ${userRole}`);
        addTestResult('isAdmin()', isAdmin, `Admin: ${isAdmin}`);
        addTestResult('isUser()', isUser, `User: ${isUser}`);
        
        addLog(`✓ Rôle: ${userRole}, Admin: ${isAdmin}, User: ${isUser}`);
      }

      // Test 4: Test des permissions
      addLog('📋 Test 4: Test des permissions');
      const perm1 = await authService.hasPermission(1);
      const perm2 = await authService.hasPermission(2);
      const permArray = await authService.hasPermission([1, 2]);
      
      addTestResult('hasPermission(1)', perm1, `Permission utilisateur: ${perm1}`);
      addTestResult('hasPermission(2)', perm2, `Permission admin: ${perm2}`);
      addTestResult('hasPermission([1,2])', permArray, `Permission array: ${permArray}`);
      
      addLog(`✓ Permissions - User: ${perm1}, Admin: ${perm2}, Array: ${permArray}`);

    } catch (error) {
      addLog(`❌ Erreur pendant les tests: ${error.message}`);
      addTestResult('Tests', false, `Erreur: ${error.message}`);
    }

    addLog('🏁 Tests terminés');
  };

  const testAPIEndpoints = async () => {
    addLog('\n🌐 Test des endpoints API...');

    try {
      // Test /auth/validate
      addLog('📡 Test /auth/validate...');
      const response1 = await fetch('/api/auth/validate', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data1 = await response1.json();
      addLog(`✓ /auth/validate: ${response1.status} - ${JSON.stringify(data1)}`);
      addTestResult('/auth/validate', response1.ok, `Status: ${response1.status}, Data: ${JSON.stringify(data1)}`);

      // Test /users/me
      addLog('📡 Test /users/me...');
      const response2 = await fetch('/api/users/me', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data2 = await response2.json();
      addLog(`✓ /users/me: ${response2.status} - ${JSON.stringify(data2)}`);
      addTestResult('/users/me', response2.ok, `Status: ${response2.status}, Data: ${JSON.stringify(data2)}`);

    } catch (error) {
      addLog(`❌ Erreur API: ${error.message}`);
      addTestResult('API Tests', false, `Erreur: ${error.message}`);
    }
  };

  const testCookies = () => {
    addLog('\n🍪 Test des cookies...');
    
    // Cookies lisibles par JavaScript
    const cookies = document.cookie;
    addLog(`📋 Cookies visibles: ${cookies || 'Aucun (normal pour HttpOnly)'}`);
    
    // Test avec l'API Navigator
    if (navigator.cookieEnabled) {
      addLog('✅ Cookies activés dans le navigateur');
    } else {
      addLog('❌ Cookies désactivés dans le navigateur');
    }
    
    addTestResult('Cookies Status', navigator.cookieEnabled, `Cookies enabled: ${navigator.cookieEnabled}`);
  };

  const simulateReload = () => {
    addLog('\n🔄 Simulation du reload...');
    authService.clearCache();
    addLog('✓ Cache vidé');
    
    // Relancer la vérification d'authentification
    setTimeout(async () => {
      const authStatus = await authService.isAuthenticated();
      addLog(`🔍 État après reload simulé: ${authStatus ? 'Authentifié' : 'Non authentifié'}`);
      addTestResult('Reload Simulation', authStatus, `Auth status après reload: ${authStatus}`);
    }, 100);
  };

  const clearLogs = () => {
    setDebugInfo('');
    setTestResults([]);
  };

  const toggleDebugMode = () => {
    authService.setDebugMode(!authService._debugMode);
    addLog(`Mode debug ${authService._debugMode ? 'activé' : 'désactivé'}`);
  };

  return (
    <div style={{ padding: '20px', border: '2px solid blue', margin: '10px', fontFamily: 'monospace' }}>
      <h3>🔧 Débogage d'authentification</h3>
      
      {/* État actuel */}
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}>
        <h4>📊 État actuel:</h4>
        <p><strong>Loading:</strong> {isLoading ? '⏳ Oui' : '✅ Non'}</p>
        <p><strong>Authentifié:</strong> {isAuthenticated ? '✅ Oui' : '❌ Non'}</p>
        <p><strong>Utilisateur:</strong> {user ? `${user.login} (rôle: ${user.role})` : '❌ Aucun'}</p>
        <p><strong>User Agent:</strong> {navigator.userAgent.substring(0, 80)}...</p>
        <p><strong>Origin:</strong> {window.location.origin}</p>
      </div>

      {/* Boutons de test */}
      <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        <button onClick={testAuthentication} style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
          🧪 Test Auth
        </button>
        <button onClick={testAPIEndpoints} style={{ padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}>
          🌐 Test API
        </button>
        <button onClick={testCookies} style={{ padding: '8px 16px', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '4px' }}>
          🍪 Test Cookies
        </button>
        <button onClick={simulateReload} style={{ padding: '8px 16px', backgroundColor: '#fd7e14', color: 'white', border: 'none', borderRadius: '4px' }}>
          🔄 Simuler Reload
        </button>
        <button onClick={toggleDebugMode} style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' }}>
          🐛 Toggle Debug
        </button>
        <button onClick={clearLogs} style={{ padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}>
          🗑️ Clear
        </button>
      </div>

      {/* Résultats des tests */}
      {testResults.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h4>📊 Résultats des tests:</h4>
          <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}>
            {testResults.map((result, index) => (
              <div key={index} style={{ 
                marginBottom: '5px', 
                padding: '5px', 
                backgroundColor: result.result ? '#d4edda' : '#f8d7da',
                border: `1px solid ${result.result ? '#c3e6cb' : '#f5c6cb'}`,
                borderRadius: '3px'
              }}>
                <strong>[{result.timestamp}] {result.test}:</strong> {result.result ? '✅' : '❌'}
                {result.details && <div style={{ fontSize: '0.9em', marginTop: '3px' }}>{result.details}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logs de debug */}
      <div>
        <h4>📝 Logs de debug:</h4>
        <textarea
          value={debugInfo}
          readOnly
          style={{
            width: '100%',
            height: '300px',
            fontFamily: 'monospace',
            fontSize: '12px',
            backgroundColor: '#000',
            color: '#00ff00',
            padding: '10px',
            border: '1px solid #ccc'
          }}
          placeholder="Les logs apparaîtront ici..."
        />
      </div>
    </div>
  );
};

export default AuthDebugComponent;