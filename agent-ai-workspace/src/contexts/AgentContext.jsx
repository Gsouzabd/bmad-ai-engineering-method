import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'

const AgentContext = createContext({})

export const useAgents = () => {
  const context = useContext(AgentContext)
  if (!context) {
    throw new Error('useAgents must be used within an AgentProvider')
  }
  return context
}

export const AgentProvider = ({ children }) => {
  const { user } = useAuth()
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(false)

  // Buscar agentes do usuário
  const fetchAgents = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAgents(data || [])
    } catch (error) {
      console.error('Erro ao buscar agentes:', error)
    } finally {
      setLoading(false)
    }
  }

  // Criar novo agente
  const createAgent = async (name, description = '') => {
    if (!user) throw new Error('Usuário não autenticado')

    try {
      const { data, error } = await supabase
        .from('agents')
        .insert([
          {
            name,
            description,
            user_id: user.id,
          }
        ])
        .select()
        .single()

      if (error) throw error
      
      setAgents(prev => [data, ...prev])
      return data
    } catch (error) {
      console.error('Erro ao criar agente:', error)
      throw error
    }
  }

  // Atualizar agente
  const updateAgent = async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      
      setAgents(prev => prev.map(agent => 
        agent.id === id ? data : agent
      ))
      return data
    } catch (error) {
      console.error('Erro ao atualizar agente:', error)
      throw error
    }
  }

  // Deletar agente
  const deleteAgent = async (id) => {
    try {
      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setAgents(prev => prev.filter(agent => agent.id !== id))
    } catch (error) {
      console.error('Erro ao deletar agente:', error)
      throw error
    }
  }

  // Buscar agente específico
  const getAgent = async (id) => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao buscar agente:', error)
      throw error
    }
  }

  useEffect(() => {
    fetchAgents()
  }, [user])

  const value = {
    agents,
    loading,
    createAgent,
    updateAgent,
    deleteAgent,
    getAgent,
    fetchAgents,
  }

  return (
    <AgentContext.Provider value={value}>
      {children}
    </AgentContext.Provider>
  )
}
