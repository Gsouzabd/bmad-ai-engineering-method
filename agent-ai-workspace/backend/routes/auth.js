import express from 'express'
import jwt from 'jsonwebtoken'
import { supabase } from '../config/supabase.js'
import { v4 as uuidv4 } from 'uuid'

const router = express.Router()

// Middleware para verificar token JWT
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso necessário' })
  }

  try {
    // Em desenvolvimento, permitir tokens mock
    if ((process.env.NODE_ENV === 'development' || !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder')) && token === 'mock_token') {
      req.user = { id: '55ccaa1e-34a2-42a2-ba1f-32dfb7c6320c', email: 'dev@example.com' }
      return next()
    }

    // Verificar token com Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return res.status(403).json({ error: 'Token inválido' })
    }

    req.user = user
    next()
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido' })
  }
}

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' })
    }

    // Em desenvolvimento, sempre permitir login mock
    if (process.env.NODE_ENV === 'development' || !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder')) {
      return res.json({
        user: { id: '55ccaa1e-34a2-42a2-ba1f-32dfb7c6320c', email },
        session: { access_token: 'mock_token' }
      })
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return res.status(401).json({ error: error.message })
    }

    res.json({
      user: data.user,
      session: data.session
    })
  } catch (error) {
    console.error('Erro no login:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Registro
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' })
    }

    // Em desenvolvimento, sempre permitir registro mock
    if (process.env.NODE_ENV === 'development' || !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder')) {
      return res.json({
        user: { id: '55ccaa1e-34a2-42a2-ba1f-32dfb7c6320c', email },
        message: 'Usuário criado com sucesso (modo desenvolvimento).'
      })
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json({
      user: data.user,
      message: 'Usuário criado com sucesso. Verifique seu email para confirmar a conta.'
    })
  } catch (error) {
    console.error('Erro no registro:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Verificar usuário atual
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({ user: req.user })
  } catch (error) {
    console.error('Erro ao verificar usuário:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Em desenvolvimento, sempre retornar sucesso
    if (process.env.NODE_ENV === 'development' || !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder')) {
      return res.json({ message: 'Logout realizado com sucesso' })
    }

    const { error } = await supabase.auth.signOut()
    
    if (error) {
      return res.status(500).json({ error: error.message })
    }

    res.json({ message: 'Logout realizado com sucesso' })
  } catch (error) {
    console.error('Erro no logout:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Verificar sessão
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({ user: req.user })
  } catch (error) {
    console.error('Erro ao verificar sessão:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

export { router as default, authenticateToken }
