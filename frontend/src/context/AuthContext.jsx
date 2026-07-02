import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      authAPI.getMe()
        .then((res) => {
          setAdmin(res.data)
        })
        .catch(() => {
          localStorage.removeItem('token')
          setToken(null)
          setAdmin(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [token])

  const login = async (credentials) => {
    const res = await authAPI.login(credentials)
    const { token, admin } = res.data
    localStorage.setItem('token', token)
    setToken(token)
    setAdmin(admin)
    return admin
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('admin')
    setToken(null)
    setAdmin(null)
  }

  return (
    <AuthContext.Provider value={{ admin, token, loading, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
