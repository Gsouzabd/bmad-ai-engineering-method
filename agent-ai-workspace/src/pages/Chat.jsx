import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useAgents } from '../contexts/AgentContext'
import { Send, ArrowLeft, MessageSquare, Trash2, Plus, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import PermissionModal from '../components/PermissionModal'

const Chat = () => {
  const { id: agentId } = useParams()
  const navigate = useNavigate()
  const { user, getStoredToken } = useAuth()
  const { getAgent } = useAgents()
  
  const [agent, setAgent] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversations, setConversations] = useState([])
  const [currentConversationId, setCurrentConversationId] = useState(null)
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  
  // Estados para MCP
  const [permissionModal, setPermissionModal] = useState({
    isOpen: false,
    toolName: '',
    toolDescription: '',
    onAccept: null,
    onDecline: null
  })
  const [pendingToolExecution, setPendingToolExecution] = useState(null)
  
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Buscar informações do agente
  useEffect(() => {
    const fetchAgent = async () => {
      try {
        const agentData = await getAgent(agentId)
        setAgent(agentData)
      } catch (error) {
        console.error('Erro ao buscar agente:', error)
        toast.error('Erro ao carregar informações do agente')
        navigate('/')
      }
    }

    if (agentId) {
      fetchAgent()
    }
  }, [agentId, getAgent, navigate])

  // Buscar conversas do agente
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoadingConversations(true)
        const response = await fetch(`/api/chat/${agentId}/conversations`, {
          headers: {
            'Authorization': `Bearer ${getStoredToken()}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setConversations(data)
          
          // Se não há conversas, criar uma nova
          if (data.length === 0) {
            setCurrentConversationId(null)
          }
        } else {
          console.error('Erro ao buscar conversas')
        }
      } catch (error) {
        console.error('Erro ao buscar conversas:', error)
      } finally {
        setLoadingConversations(false)
      }
    }

    if (agentId) {
      fetchConversations()
    }
  }, [agentId])

  // Buscar mensagens de uma conversa específica
  const fetchMessages = async (conversationId) => {
    try {
      setLoading(true)
             const response = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
         headers: {
           'Authorization': `Bearer ${getStoredToken()}`
         }
       })

      if (response.ok) {
        const data = await response.json()
        setMessages(data)
        setCurrentConversationId(conversationId)
      } else {
        console.error('Erro ao buscar mensagens')
        toast.error('Erro ao carregar mensagens')
      }
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error)
      toast.error('Erro ao carregar mensagens')
    } finally {
      setLoading(false)
    }
  }

  // Carregar conversa selecionada
  const loadConversation = (conversationId) => {
    if (conversationId) {
      fetchMessages(conversationId)
    } else {
      // Nova conversa
      setMessages([])
      setCurrentConversationId(null)
    }
  }

  // Deletar conversa
  const deleteConversation = async (conversationId, e) => {
    e.stopPropagation()
    
    if (!confirm('Tem certeza que deseja deletar esta conversa?')) {
      return
    }

    try {
             const response = await fetch(`/api/chat/conversations/${conversationId}`, {
         method: 'DELETE',
         headers: {
           'Authorization': `Bearer ${getStoredToken()}`
         }
       })

      if (response.ok) {
        toast.success('Conversa deletada com sucesso')
        
        // Atualizar lista de conversas
        setConversations(prev => prev.filter(conv => conv.id !== conversationId))
        
        // Se era a conversa atual, limpar mensagens
        if (currentConversationId === conversationId) {
          setMessages([])
          setCurrentConversationId(null)
        }
      } else {
        toast.error('Erro ao deletar conversa')
      }
    } catch (error) {
      console.error('Erro ao deletar conversa:', error)
      toast.error('Erro ao deletar conversa')
    }
  }

  // Função para interpretar comando MCP
  const interpretMCPCommand = async (message) => {
    try {
      const response = await fetch('/api/mcp/interpret', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getStoredToken()}`
        },
        body: JSON.stringify({
          message,
          agentId,
          agentContext: agent?.prompt || ''
        })
      })

      if (response.ok) {
        return await response.json()
      } else {
        throw new Error('Erro ao interpretar comando')
      }
    } catch (error) {
      console.error('Erro ao interpretar comando MCP:', error)
      return { action: 'ask', message: 'Desculpe, não consegui processar seu comando.' }
    }
  }

  // Função para executar tool MCP
  const executeMCPTool = async (toolName, toolDescription, params) => {
    try {
      const response = await fetch('/api/mcp/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getStoredToken()}`
        },
        body: JSON.stringify({
          agentId,
          toolName,
          toolDescription,
          permissionGranted: true,
          params
        })
      })

      if (response.ok) {
        const data = await response.json()
        return data
      } else {
        throw new Error('Erro ao executar tool')
      }
    } catch (error) {
      console.error('Erro ao executar tool MCP:', error)
      throw error
    }
  }

  // Função para solicitar permissão
  const requestPermission = (toolName, toolDescription, params) => {
    return new Promise((resolve) => {
      setPermissionModal({
        isOpen: true,
        toolName,
        toolDescription,
        onAccept: () => {
          setPermissionModal({ isOpen: false, toolName: '', toolDescription: '', onAccept: null, onDecline: null })
          resolve(true)
        },
        onDecline: () => {
          setPermissionModal({ isOpen: false, toolName: '', toolDescription: '', onAccept: null, onDecline: null })
          resolve(false)
        }
      })
    })
  }

  // Enviar mensagem com integração MCP
  const sendMessage = async (e) => {
    e.preventDefault()
    
    if (!newMessage.trim() || sendingMessage) return

    const messageToSend = newMessage.trim()
    setNewMessage('')
    setSendingMessage(true)

    // Adicionar mensagem do usuário imediatamente
    const userMessage = {
      id: Date.now().toString(),
      content: messageToSend,
      role: 'user',
      created_at: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])

    try {
      // Primeiro, interpretar o comando para ver se precisa de tool MCP
      const interpretation = await interpretMCPCommand(messageToSend)
      
      if (interpretation.action === 'tool') {
        // Solicitar permissão do usuário
        const permissionGranted = await requestPermission(
          interpretation.tool,
          interpretation.toolDescription,
          interpretation.params
        )

        if (permissionGranted) {
          // Executar tool
          const toolResult = await executeMCPTool(
            interpretation.tool,
            interpretation.toolDescription,
            interpretation.params
          )

          // Adicionar resposta com resultado do tool
          const aiMessage = {
            id: Date.now().toString() + '_tool',
            content: `✅ ${interpretation.toolDescription}\n\n${formatToolResult(toolResult.result)}`,
            role: 'assistant',
            created_at: new Date().toISOString()
          }

          setMessages(prev => [...prev, aiMessage])
        } else {
          // Usuário negou permissão
          const aiMessage = {
            id: Date.now().toString() + '_denied',
            content: '❌ Ação cancelada pelo usuário.',
            role: 'assistant',
            created_at: new Date().toISOString()
          }

          setMessages(prev => [...prev, aiMessage])
        }
      } else {
        // Comando normal - enviar para o chat tradicional
        const response = await fetch(`/api/chat/${agentId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getStoredToken()}`
          },
          body: JSON.stringify({
            message: messageToSend,
            conversationId: currentConversationId
          })
        })

        if (response.ok) {
          const data = await response.json()
          
          // Adicionar resposta da IA
          const aiMessage = {
            id: data.id,
            content: data.content,
            role: 'assistant',
            created_at: data.timestamp
          }

          setMessages(prev => [...prev, aiMessage])
          
          // Se é uma nova conversa, atualizar o ID
          if (!currentConversationId && data.conversationId) {
            setCurrentConversationId(data.conversationId)
            
            // Atualizar lista de conversas
            const newConversation = {
              id: data.conversationId,
              title: `Conversa com ${agent?.name}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
            setConversations(prev => [newConversation, ...prev])
          }
        } else {
          const errorData = await response.json()
          toast.error(errorData.error || 'Erro ao enviar mensagem')
          
          // Remover mensagem do usuário em caso de erro
          setMessages(prev => prev.filter(msg => msg.id !== userMessage.id))
        }
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      toast.error('Erro ao enviar mensagem')
      
      // Remover mensagem do usuário em caso de erro
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id))
    } finally {
      setSendingMessage(false)
    }
  }

  // Função para formatar resultado de tool
  const formatToolResult = (result) => {
    if (!result) return 'Nenhum resultado encontrado.'

    if (result.files) {
      // Resultado do Google Drive
      return `📁 **Arquivos encontrados (${result.total}):**\n\n${result.files.map(file => 
        `• **${file.name}** (${file.mimeType})\n  📅 Criado: ${new Date(file.createdTime).toLocaleDateString('pt-BR')}`
      ).join('\n\n')}`
    }

    if (result.values) {
      // Resultado do Google Sheets
      return `📊 **Dados da planilha:**\n\n${result.values.map(row => 
        row.join(' | ')
      ).join('\n')}`
    }

    return JSON.stringify(result, null, 2)
  }

  // Scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focar no input quando carregar
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  if (!agent) {
    return (
      <div className="flex items-center justify-center min-h-screen gradient-bg">
        <div className="p-4 rounded-full bg-primary-600/20">
          <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen gradient-bg">
      {/* Sidebar com conversas */}
      <div className="w-80 sidebar glass-effect flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-dark-border">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-dark-secondary hover:text-dark-primary transition-colors duration-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </button>
            <button
              onClick={() => loadConversation(null)}
              className="flex items-center text-primary-400 hover:text-primary-300 transition-colors duration-200"
            >
              <Plus className="h-4 w-4 mr-1" />
              Nova
            </button>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-600/20 rounded-lg flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-primary-400" />
            </div>
            <div>
              <h2 className="font-semibold text-dark-primary">{agent.name}</h2>
              <p className="text-sm text-dark-muted">Chat</p>
            </div>
          </div>
        </div>

        {/* Lista de conversas */}
        <div className="flex-1 overflow-y-auto">
          {loadingConversations ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-5 w-5 animate-spin text-dark-muted" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-dark-muted">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-dark-border" />
              <p>Nenhuma conversa ainda</p>
              <p className="text-sm">Comece uma nova conversa!</p>
            </div>
          ) : (
            <div className="p-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => loadConversation(conversation.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    currentConversationId === conversation.id
                      ? 'bg-primary-600/20 border border-primary-500/30 shadow-lg'
                      : 'hover:bg-dark-tertiary border border-transparent hover:border-dark-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-medium truncate ${
                        currentConversationId === conversation.id 
                          ? 'text-dark-primary' 
                          : 'text-dark-secondary'
                      }`}>
                        {conversation.title}
                      </h3>
                      <p className="text-sm text-dark-muted">
                        {new Date(conversation.updated_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <button
                      onClick={(e) => deleteConversation(conversation.id, e)}
                      className="text-dark-muted hover:text-red-400 p-1 transition-colors duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Área de chat */}
      <div className="flex-1 flex flex-col">
        {/* Header do chat */}
        <div className="glass-effect border-b border-dark-border p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary-600/20 rounded-lg flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-primary-400" />
            </div>
            <div>
              <h1 className="font-semibold text-dark-primary">
                {currentConversationId ? 'Conversa em andamento' : 'Nova conversa'}
              </h1>
              <p className="text-sm text-dark-secondary">
                {agent.description}
              </p>
            </div>
          </div>
        </div>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="p-4 rounded-full bg-primary-600/20">
                <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-dark-border" />
                <h3 className="text-lg font-medium text-dark-primary mb-2">
                  Comece uma conversa
                </h3>
                <p className="text-dark-secondary">
                  Envie uma mensagem para começar a conversar com {agent.name}
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-primary-600 text-white shadow-lg'
                      : 'bg-dark-card border border-dark-border text-dark-primary shadow-lg'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-primary-200' : 'text-dark-muted'
                  }`}>
                    {new Date(message.created_at).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input de mensagem */}
        <div className="glass-effect border-t border-dark-border p-4">
          <form onSubmit={sendMessage} className="flex space-x-4">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1 input-field"
              disabled={sendingMessage}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sendingMessage}
              className="btn-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendingMessage ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Modal de permissão MCP */}
      <PermissionModal
        isOpen={permissionModal.isOpen}
        toolName={permissionModal.toolName}
        toolDescription={permissionModal.toolDescription}
        onAccept={permissionModal.onAccept}
        onDecline={permissionModal.onDecline}
      />
    </div>
  )
}

export default Chat
