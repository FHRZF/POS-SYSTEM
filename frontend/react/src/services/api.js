import axios from 'axios'
 
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
})
 
// Response interceptor for error handling
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('pos_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)
 
export default api