import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAgents } from '../contexts/AgentContext'
import { 
  Plus, 
  MessageSquare, 
  Settings, 
  Trash2, 
  Bot,
  Search,
  Filter
} from 'lucide-react'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const { agents, loading, deleteAgent } = useAgents()
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('created_at')

  const filteredAgents = agents
    .filter(agent => 
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      }
      if (sortBy === 'created_at') {
        return new Date(b.created_at) - new Date(a.created_at)
      }
      return 0
    })

  const handleDeleteAgent = async (agentId, agentName) => {
    if (window.confirm(`Tem certeza que deseja deletar o agente "${agentName}"?`)) {
      try {
        await deleteAgent(agentId)
        toast.success('Agente deletado com sucesso!')
      } catch (error) {
        toast.error('Erro ao deletar agente')
      }
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-2 text-dark-secondary">Carregando agentes...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-dark-primary mb-2">
              Meus Agentes
            </h1>
            <p className="text-dark-secondary">
              Gerencie seus agentes de IA personalizados
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link
              to="/create-agent"
              className="btn-primary inline-flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Novo Agente
            </Link>
          </div>
        </div>
      </div>

      {/* Filtros e busca */}
      <div className="mb-8">
        <div className="card glass-effect">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-dark-muted" />
              <input
                type="text"
                placeholder="Buscar agentes..."
                className="input-field pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-dark-muted" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input-field"
              >
                <option value="created_at">Mais recentes</option>
                <option value="name">Nome A-Z</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de agentes */}
      {filteredAgents.length === 0 ? (
        <div className="text-center py-16">
          <div className="p-4 rounded-full bg-dark-tertiary w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <Bot className="h-10 w-10 text-dark-muted" />
          </div>
          <h3 className="text-lg font-semibold text-dark-primary mb-2">
            {searchTerm ? 'Nenhum agente encontrado' : 'Nenhum agente criado'}
          </h3>
          <p className="text-dark-secondary mb-6">
            {searchTerm 
              ? 'Tente ajustar os termos de busca.'
              : 'Comece criando seu primeiro agente de IA.'
            }
          </p>
          {!searchTerm && (
            <Link to="/create-agent" className="btn-primary">
              Criar Primeiro Agente
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAgents.map((agent) => (
            <div key={agent.id} className="card card-hover gradient-card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center mb-3">
                    <div className="p-2 rounded-lg bg-primary-600/20 mr-3">
                      <Bot className="h-5 w-5 text-primary-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-dark-primary">
                      {agent.name}
                    </h3>
                  </div>
                  {agent.description && (
                    <p className="text-sm text-dark-secondary mb-4 line-clamp-2">
                      {agent.description}
                    </p>
                  )}
                  <div className="flex items-center text-xs text-dark-muted">
                    <span>Criado em {formatDate(agent.created_at)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-dark-border">
                <div className="flex space-x-2">
                  <Link
                    to={`/agent/${agent.id}/chat`}
                    className="btn-primary text-sm"
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Testar
                  </Link>
                  <Link
                    to={`/agent/${agent.id}`}
                    className="btn-secondary text-sm"
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Configurar
                  </Link>
                </div>
                <button
                  onClick={() => handleDeleteAgent(agent.id, agent.name)}
                  className="p-2 text-dark-muted hover:text-red-400 rounded-lg hover:bg-dark-tertiary transition-all duration-200"
                  title="Deletar agente"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Dashboard
