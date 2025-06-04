import axios from 'axios'
import Cookies from 'js-cookie'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Intercepteur pour ajouter le token d'authentification à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Intercepteur pour gérer les erreurs d'authentification
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si l'erreur est 401 (Unauthorized), rediriger vers la page de connexion
    if (error.response && error.response.status === 401) {
      Cookies.remove('token')
      Cookies.remove('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api