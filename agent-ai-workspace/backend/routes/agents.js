import express from 'express'
import { authenticateToken } from './auth.js'
import { supabase } from '../config/supabase.js'
import { v4 as uuidv4 } from 'uuid'

const router = express.Router()

// Buscar todos os agentes do usuário
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Em desenvolvimento, retornar agentes mock
    if (process.env.NODE_ENV === 'development' || !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder')) {
      const mockAgents = [
        {
          id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          name: 'Assistente de Vendas',
          description: 'Agente especializado em vendas e atendimento ao cliente',
          prompt: 'Você é um assistente de vendas especializado...',
          user_id: req.user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'b2c3d4e5-f6g7-8901-bcde-f23456789012',
          name: 'Suporte Técnico',
          description: 'Agente para suporte técnico e resolução de problemas',
          prompt: 'Você é um especialista em suporte técnico...',
          user_id: req.user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
      return res.json(mockAgents)
    }

    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    res.json(data || [])
  } catch (error) {
    console.error('Erro ao buscar agentes:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Buscar agente específico
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    // Em desenvolvimento, retornar agente mock
    if (process.env.NODE_ENV === 'development' || !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder')) {
      const mockAgent = {
        id: id,
        name: 'Assistente de Vendas',
        description: 'Agente especializado em vendas e atendimento ao cliente',
        prompt: 'Você é um assistente de vendas especializado...',
        user_id: req.user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      return res.json(mockAgent)
    }

    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Agente não encontrado' })
      }
      return res.status(500).json({ error: error.message })
    }

    res.json(data)
  } catch (error) {
    console.error('Erro ao buscar agente:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Criar novo agente
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body

    if (!name || name.trim().length < 3) {
      return res.status(400).json({ 
        error: 'Nome é obrigatório e deve ter pelo menos 3 caracteres' 
      })
    }

    // Em desenvolvimento, retornar agente mock criado
    if (process.env.NODE_ENV === 'development' || !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder')) {
      const mockAgent = {
        id: uuidv4(),
        name: name.trim(),
        description: description?.trim() || '',
        prompt: '',
        user_id: req.user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      return res.status(201).json(mockAgent)
    }

    // Verificar limite de agentes por usuário
    const { count } = await supabase
      .from('agents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id)

    if (count >= 10) {
      return res.status(400).json({ 
        error: 'Limite de 10 agentes atingido' 
      })
    }

    const { data, error } = await supabase
      .from('agents')
      .insert([
        {
          name: name.trim(),
          description: description?.trim() || '',
          user_id: req.user.id
        }
      ])
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    res.status(201).json(data)
  } catch (error) {
    console.error('Erro ao criar agente:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Atualizar agente
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, prompt } = req.body

    const updates = {}
    if (name !== undefined) {
      if (!name || name.trim().length < 3) {
        return res.status(400).json({ 
          error: 'Nome deve ter pelo menos 3 caracteres' 
        })
      }
      updates.name = name.trim()
    }

    if (description !== undefined) {
      updates.description = description?.trim() || ''
    }

    if (prompt !== undefined) {
      if (!prompt || prompt.trim().length === 0) {
        return res.status(400).json({ 
          error: 'Prompt não pode ser vazio' 
        })
      }
      if (prompt.trim().length > 1000) {
        return res.status(400).json({ 
          error: 'Prompt deve ter no máximo 1000 caracteres' 
        })
      }
      updates.prompt = prompt.trim()
    }

    // Em desenvolvimento, retornar agente mock atualizado
   if (process.env.NODE_ENV === 'development' || !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder')) {
      const mockAgent = {
        id: id,
        name: updates.name || 'Assistente de Vendas',
        description: updates.description || 'Agente especializado em vendas',
        prompt: updates.prompt || 'Você é um assistente especializado...',
        user_id: req.user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      return res.json(mockAgent)
    }

    const { data, error } = await supabase
      .from('agents')
      .update(updates)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Agente não encontrado' })
      }
      return res.status(500).json({ error: error.message })
    }

    res.json(data)
  } catch (error) {
    console.error('Erro ao atualizar agente:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Deletar agente
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    // Em desenvolvimento, sempre retornar sucesso
    if (process.env.NODE_ENV === 'development' || !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder')) {
      return res.json({ message: 'Agente deletado com sucesso' })
    }

    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id)

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    res.json({ message: 'Agente deletado com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar agente:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

export default router
