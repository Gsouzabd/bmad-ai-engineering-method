import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Verificar se há token salvo
  const getStoredToken = () => {
    return localStorage.getItem('token')
  }

  // Verificar se há usuário salvo
  const getStoredUser = () => {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  }

  // Salvar dados de autenticação
  const saveAuthData = (user, token) => {
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('token', token)
  }

  // Limpar dados de autenticação
  const clearAuthData = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  useEffect(() => {
    // Verificar sessão atual
    const checkSession = async () => {
      const token = getStoredToken()
      const storedUser = getStoredUser()

      if (token && storedUser) {
        try {
          // Verificar se o token ainda é válido
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })

          if (response.ok) {
            const data = await response.json()
            setUser(data.user)
          } else {
            // Token inválido, limpar dados
            clearAuthData()
            setUser(null)
          }
        } catch (error) {
          console.error('Erro ao verificar sessão:', error)
          clearAuthData()
          setUser(null)
        }
      } else {
        setUser(null)
      }
      
      setLoading(false)
    }

    checkSession()
  }, [])

  const signIn = async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao fazer login')
      }

      const data = await response.json()
      
      // Salvar dados de autenticação
      saveAuthData(data.user, data.session.access_token)
      setUser(data.user)
      
      return data
    } catch (error) {
      console.error('Erro no login:', error)
      throw error
    }
  }

  const signUp = async (email, password, name) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, name })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao criar conta')
      }

      const data = await response.json()
      
      // Em desenvolvimento, salvar dados imediatamente
      if (process.env.NODE_ENV === 'development') {
        const mockUser = { id: 'mock_user_id', email, name }
        const mockToken = 'mock_token'
        saveAuthData(mockUser, mockToken)
        setUser(mockUser)
      }
      
      return data
    } catch (error) {
      console.error('Erro no registro:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      const token = getStoredToken()
      
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      }
    } catch (error) {
      console.error('Erro no logout:', error)
    } finally {
      clearAuthData()
      setUser(null)
    }
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    getStoredToken,
    token: getStoredToken(),
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
