import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('pos_user')
      return raw ? JSON.parse(raw) : null
    } catch (e) {
      return null
    }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('pos_token')
    const cachedUser = (() => {
      try { const raw = localStorage.getItem('pos_user'); return raw ? JSON.parse(raw) : null } catch(e) { return null }
    })()

    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      if (cachedUser) setUser(cachedUser)

      // Validate token and refresh user data
      api.get('/me')
        .then(res => {
          setUser(res.data.user)
          try { localStorage.setItem('pos_user', JSON.stringify(res.data.user)) } catch (e) {}
        })
        .catch(() => {
          localStorage.removeItem('pos_token')
          localStorage.removeItem('pos_user')
          delete api.defaults.headers.common['Authorization']
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const res = await api.post('/login', { email, password })
    const { user, token } = res.data
    try { localStorage.setItem('pos_token', token) } catch (e) {}
    try { localStorage.setItem('pos_user', JSON.stringify(user)) } catch (e) {}
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(user)
    return user
  }

  const logout = async () => {
    try { await api.post('/logout') } catch {}
    localStorage.removeItem('pos_token')
    localStorage.removeItem('pos_user')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
  }

  const hasRole = (role) => {
    const roleName = typeof user?.role === 'object' ? user?.role?.name : user?.role
    return roleName === role
  }
  const hasAnyRole = (roles) => {
    const roleName = typeof user?.role === 'object' ? user?.role?.name : user?.role
    return roles.includes(roleName)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, hasRole, hasAnyRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)