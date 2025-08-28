import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAgents } from '../contexts/AgentContext'
import { ArrowLeft, Bot } from 'lucide-react'
import toast from 'react-hot-toast'

const CreateAgent = () => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { createAgent } = useAgents()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error('Por favor, insira um nome para o agente')
      return
    }

    if (name.trim().length < 3) {
      toast.error('O nome deve ter pelo menos 3 caracteres')
      return
    }

    setLoading(true)
    
    try {
      const agent = await createAgent(name.trim(), description.trim())
      toast.success('Agente criado com sucesso!')
      navigate(`/agent/${agent.id}`)
    } catch (error) {
      console.error('Erro ao criar agente:', error)
      toast.error('Erro ao criar agente. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center text-sm text-dark-secondary hover:text-dark-primary mb-4 transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar ao Dashboard
        </button>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary-600/20">
              <Bot className="h-6 w-6 text-primary-400" />
            </div>
          </div>
          <div className="ml-4">
            <h1 className="text-2xl font-bold text-dark-primary">Criar Novo Agente</h1>
            <p className="text-sm text-dark-secondary">
              Configure um novo agente de IA personalizado
            </p>
          </div>
        </div>
      </div>

      {/* Formulário */}
      <div className="card gradient-card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-dark-secondary mb-2">
              Nome do Agente *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="Ex: Assistente de Vendas"
              maxLength={50}
              required
            />
            <p className="mt-1 text-xs text-dark-muted">
              {name.length}/50 caracteres
            </p>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-dark-secondary mb-2">
              Descrição (opcional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field"
              rows={4}
              placeholder="Descreva o propósito e funcionalidades do seu agente..."
              maxLength={200}
            />
            <p className="mt-1 text-xs text-dark-muted">
              {description.length}/200 caracteres
            </p>
          </div>

          <div className="bg-primary-600/10 border border-primary-500/20 rounded-lg p-4">
            <h3 className="text-sm font-medium text-primary-400 mb-2">
              Próximos passos
            </h3>
            <ul className="text-sm text-dark-secondary space-y-1">
              <li>• Configure o prompt personalizado do agente</li>
              <li>• Adicione arquivos à base de conhecimento</li>
              <li>• Teste o agente no chat interativo</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn-secondary"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="btn-primary"
            >
              {loading ? 'Criando...' : 'Criar Agente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateAgent
