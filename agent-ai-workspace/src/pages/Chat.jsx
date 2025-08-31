import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useAgents } from '../contexts/AgentContext'
import { ArrowLeft, MessageSquare, Trash2, Plus, Loader2, Bot, Settings, Menu } from 'lucide-react'
import toast from 'react-hot-toast'
import PermissionModal from '../components/PermissionModal'
import ToolsExecutionHistory from '../components/ToolsExecutionHistory'
import ToolsSummary from '../components/ToolsSummary'
import { 
  Conversation, 
  ConversationContent, 
  ConversationScrollButton
} from '../components/conversation'
import { 
  Message, 
  MessageContent
} from '../components/message'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'

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
  const [sidebarOpen, setSidebarOpen] = useState(true)
  
  // Estados para MCP
  const [permissionModal, setPermissionModal] = useState({
    isOpen: false,
    toolName: '',
    toolDescription: '',
    onAccept: null,
    onDecline: null
  })
  const [pendingToolExecution, setPendingToolExecution] = useState(null)
  const [toolsExecution, setToolsExecution] = useState({
    isVisible: false,
    tools: []
  })
  
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
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: messageToSend,
      role: 'user',
      created_at: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])

    try {
      // Mostrar indicador de ferramentas (manter ferramentas anteriores temporariamente)
      setToolsExecution(prev => ({
        isVisible: true,
        tools: [] // Resetar apenas para a nova execução - ferramentas serão salvas na mensagem
      }))

      // Função híbrida: SSE para ferramentas + POST para resposta
      const hybridProcessing = async () => {
        console.log('🔄 Usando processamento híbrido: SSE + POST tradicional')
        
        // Gerar sessionId único para esta conversa
        const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        console.log(`📡 SessionId gerado: ${sessionId}`)
        
        // Conectar ao SSE para notificações de ferramentas
        let toolEventSource = null
        try {
          toolEventSource = new EventSource(`/api/chat/${agentId}/tools-stream/${sessionId}`)
          
          toolEventSource.addEventListener('connected', (event) => {
            console.log('🔗 SSE conectado para ferramentas')
          })
          
          toolEventSource.addEventListener('tools_requested', (event) => {
            const data = JSON.parse(event.data)
            console.log(`🔧 ${data.count} ferramenta(s) solicitada(s):`, data.tools)
          })
          
          toolEventSource.addEventListener('tool_start', (event) => {
            const data = JSON.parse(event.data)
            console.log(`🔧 Iniciando: ${data.displayName}`)
            
            // Atualizar estado das ferramentas
            setToolsExecution(prev => {
              // Verificar se a ferramenta já existe (para evitar duplicatas)
              const existingTool = prev.tools.find(tool => tool.name === data.name)
              
              if (existingTool) {
                // Atualizar ferramenta existente
                return {
                  isVisible: true,
                  tools: prev.tools.map(tool => 
                    tool.name === data.name 
                      ? { ...tool, status: 'executing', args: data.args }
                      : tool
                  )
                }
              } else {
                // Adicionar nova ferramenta
                const newTools = [...prev.tools, {
                  name: data.name,
                  displayName: data.displayName,
                  description: data.description,
                  status: 'executing',
                  args: data.args,
                  isAdditional: data.isAdditional || false
                }]
                console.log('🔧 Estado após tool_start (nova ferramenta):', newTools)
                return {
                  isVisible: true,
                  tools: newTools
                }
              }
            })
          })
          
          toolEventSource.addEventListener('tool_success', (event) => {
            const data = JSON.parse(event.data)
            console.log(`✅ Concluído: ${data.displayName}`)
            
            // Atualizar status da ferramenta
            setToolsExecution(prev => {
              const existingTool = prev.tools.find(tool => tool.name === data.name)
              
              if (existingTool) {
                // Atualizar ferramenta existente
                const updatedTools = prev.tools.map(tool => 
                  tool.name === data.name 
                    ? { ...tool, status: 'success', result: data.result }
                    : tool
                )
                console.log('✅ Estado após tool_success:', updatedTools)
                return {
                  ...prev,
                  tools: updatedTools
                }
              } else {
                // Se a ferramenta não existe (situação rara), criar e marcar como sucesso
                console.warn(`⚠️ Ferramenta ${data.name} não encontrada, criando...`)
                return {
                  ...prev,
                  tools: [...prev.tools, {
                    name: data.name,
                    displayName: data.displayName,
                    description: `Ferramenta executada`,
                    status: 'success',
                    result: data.result,
                    isAdditional: data.isAdditional || false
                  }]
                }
              }
            })
          })
          
          toolEventSource.addEventListener('tool_error', (event) => {
            const data = JSON.parse(event.data)
            console.log(`❌ Erro: ${data.displayName}`)
            
            // Atualizar status da ferramenta
            setToolsExecution(prev => {
              const existingTool = prev.tools.find(tool => tool.name === data.name)
              
              if (existingTool) {
                // Atualizar ferramenta existente
                return {
                  ...prev,
                  tools: prev.tools.map(tool => 
                    tool.name === data.name 
                      ? { ...tool, status: 'error', error: data.error }
                      : tool
                  )
                }
              } else {
                // Se a ferramenta não existe, criar e marcar como erro
                console.warn(`⚠️ Ferramenta ${data.name} não encontrada, criando...`)
                return {
                  ...prev,
                  tools: [...prev.tools, {
                    name: data.name,
                    displayName: data.displayName,
                    description: `Ferramenta com erro`,
                    status: 'error',
                    error: data.error,
                    isAdditional: data.isAdditional || false
                  }]
                }
              }
            })
          })
          
          toolEventSource.addEventListener('additional_tools_requested', (event) => {
            const data = JSON.parse(event.data)
            console.log(`🔧 ${data.count} ferramenta(s) adicional(is) solicitada(s):`, data.tools)
          })

          // =====================================================
          // EVENTOS DE STREAMING DE TEXTO
          // =====================================================
          
          toolEventSource.addEventListener('text_start', (event) => {
            const data = JSON.parse(event.data)
            console.log('🎬 Iniciando streaming de texto:', data.message)
            
            // Começar a construir mensagem streamada
            setMessages(prev => [...prev, {
              id: `stream-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              content: '',
              role: 'assistant',
              created_at: new Date().toISOString(),
              isStreaming: true
            }])
          })
          
          toolEventSource.addEventListener('text_chunk', (event) => {
            const data = JSON.parse(event.data)
            console.log('📝 Chunk de texto:', data.content)
            
            // Atualizar mensagem com novo chunk
            setMessages(prev => {
              const newMessages = [...prev]
              const lastMessage = newMessages[newMessages.length - 1]
              
              if (lastMessage && lastMessage.isStreaming) {
                lastMessage.content = data.fullContent
              }
              
              return newMessages
            })
          })
          
          toolEventSource.addEventListener('text_complete', (event) => {
            const data = JSON.parse(event.data)
            console.log('✅ Streaming de texto concluído')
            
            // Finalizar streaming
            setMessages(prev => {
              const newMessages = [...prev]
              const lastMessage = newMessages[newMessages.length - 1]
              
              if (lastMessage && lastMessage.isStreaming) {
                lastMessage.content = data.fullContent
                lastMessage.isStreaming = false
                console.log('✅ Streaming finalizado para mensagem:', lastMessage.id)
              }
              
              return newMessages
            })
          })
          
          toolEventSource.addEventListener('text_error', (event) => {
            const data = JSON.parse(event.data)
            console.error('❌ Erro no streaming de texto:', data.error)
          })
          
          toolEventSource.onerror = (error) => {
            console.error('❌ Erro no SSE de ferramentas:', error)
          }
          
        } catch (sseError) {
          console.error('❌ Erro ao conectar SSE:', sseError)
        }
        
        // Fazer requisição POST tradicional em paralelo
        const response = await fetch(`/api/chat/${agentId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getStoredToken()}`
          },
          body: JSON.stringify({
            message: messageToSend,
            conversationId: currentConversationId,
            sessionId: sessionId  // Incluir sessionId para sincronizar com SSE
          })
        })

        if (response.ok) {
          const data = await response.json()
          
          // Fechar conexão SSE
          if (toolEventSource) {
            toolEventSource.close()
            console.log('🔌 SSE de ferramentas fechado')
          }
          
          // Manter histórico de ferramentas e marcar como inativo
          let finalTools = []
          setToolsExecution(prev => {
            console.log('🔌 Estado das ferramentas ao fechar SSE:', prev.tools)
            finalTools = prev.tools.length > 0 ? prev.tools : (data.toolsExecuted || [])
            return {
              isVisible: false, // Marca como inativo, mas mantém as ferramentas
              tools: finalTools
            }
          })
          
          // Verificar se já existe uma mensagem streamada
          let shouldCreateNewMessage = true
          setMessages(prev => {
            const lastMessage = prev[prev.length - 1]
            
            // Se última mensagem é assistant (streaming ou não), apenas atualizar com ferramentas
            if (lastMessage && lastMessage.role === 'assistant') {
              console.log('🔍 Verificando mensagem existente:', {
                lastMessageContent: lastMessage.content,
                dataContent: data.content,
                isStreaming: lastMessage.isStreaming,
                shouldUpdate: lastMessage.content === data.content || lastMessage.isStreaming
              })
              // Verificar se já tem o mesmo conteúdo para evitar duplicatas
              if (lastMessage.content === data.content || lastMessage.isStreaming) {
                lastMessage.toolsExecuted = finalTools
                // Usar ID único baseado no timestamp + random para evitar duplicatas
                lastMessage.id = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                if (lastMessage.isStreaming) {
                  lastMessage.isStreaming = false // Finalizar streaming
                }
                shouldCreateNewMessage = false
                console.log('🔧 Adicionando ferramentas à mensagem existente')
                return [...prev]
              }
            }
            
            return prev
          })
          
          // Aguardar um tick para garantir que o setState foi processado
          await new Promise(resolve => setTimeout(resolve, 0))
          
          // Só criar nova mensagem se não houve streaming
          if (shouldCreateNewMessage) {
            console.log('🔧 Criando nova mensagem (sem streaming):', finalTools)
            const aiMessage = {
              id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              content: data.content,
              role: 'assistant',
              created_at: data.timestamp,
              toolsExecuted: finalTools
            }
            setMessages(prev => [...prev, aiMessage])
          } else {
            console.log('🔧 Mensagem já existia, não criando duplicata')
          }
          
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

      // Usar processamento híbrido: SSE para ferramentas + POST para resposta
      await hybridProcessing()
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      toast.error('Erro ao enviar mensagem')
      
      // Remover mensagem do usuário em caso de erro
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id))
    } finally {
      setSendingMessage(false)
      // Ocultar indicador de ferramentas em caso de erro
      setToolsExecution({
        isVisible: false,
        tools: []
      })
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
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900 text-gray-100">
      {/* Sidebar com conversas - Dark Purple Style */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-gradient-to-b from-gray-800 to-gray-900 border-r border-gray-700 flex flex-col overflow-hidden`}>
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header da sidebar */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="text-gray-300 hover:text-white hover:bg-gray-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => loadConversation(null)}
                className="text-purple-400 hover:text-purple-300 hover:bg-purple-900/30"
              >
                <Plus className="h-4 w-4 mr-1" />
                Nova
              </Button>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center shadow-lg">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-white">{agent.name}</h2>
                <p className="text-sm text-gray-400">Assistente IA</p>
              </div>
            </div>
          </div>

          {/* Lista de conversas */}
          <div className="flex-1 overflow-y-auto p-3">
            {loadingConversations ? (
              <div className="flex items-center justify-center p-6">
                <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-500" />
                <p className="text-sm">Nenhuma conversa ainda</p>
                <p className="text-xs text-gray-500 mt-1">Comece uma nova conversa!</p>
              </div>
            ) : (
              <div className="space-y-1">
                {conversations.map((conversation) => (
                  <Card
                    key={conversation.id}
                    className={`cursor-pointer transition-all duration-200 border-0 ${
                      currentConversationId === conversation.id
                        ? 'bg-gradient-to-r from-purple-900/50 to-purple-800/50 border border-purple-500/30'
                        : 'bg-gray-800/50 hover:bg-gray-700/50 border border-transparent'
                    }`}
                    onClick={() => loadConversation(conversation.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-medium truncate text-sm ${
                            currentConversationId === conversation.id 
                              ? 'text-purple-300' 
                              : 'text-gray-300'
                          }`}>
                            {conversation.title}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(conversation.updated_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => deleteConversation(conversation.id, e)}
                          className="text-gray-500 hover:text-red-400 hover:bg-red-900/30 p-1 h-6 w-6"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

                      {/* Área principal do chat */}
        <div className="flex-1 flex flex-col">
          {/* Header do chat */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="text-gray-300 hover:text-white hover:bg-gray-700"
                >
                  <Menu className="h-4 w-4" />
                </Button>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center shadow-lg">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h1 className="text-white font-semibold">
                      {currentConversationId ? 'Conversa em andamento' : 'Nova conversa'}
                    </h1>
                    <p className="text-gray-400 text-sm">
                      {agent.description}
                    </p>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-300 hover:text-white hover:bg-gray-700"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

                                   {/* Mensagens */}
          <Conversation className="flex-1 bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900/20">
            <ConversationScrollButton />
            <ConversationContent className="p-4">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-white mb-2">
                      Comece uma conversa
                    </h3>
                    <p className="text-gray-400">
                      Envie uma mensagem para começar a conversar com {agent.name}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div key={message.id} className="mb-6">
                      {/* Para mensagens da IA, mostrar sumário de ferramentas acima */}
                      {message.role === 'assistant' && message.toolsExecuted && message.toolsExecuted.length > 0 && (
                        <div className="flex justify-start mb-3">
                          <ToolsSummary tools={message.toolsExecuted} />
                        </div>
                      )}
                      
                      <Message from={message.role}>
                        <MessageContent className={`${
                          message.role === 'user' 
                            ? 'bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-600 rounded-lg shadow-lg' 
                            : 'bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg shadow-lg'
                        } p-4`}>
                          <div className="text-gray-100 whitespace-pre-wrap leading-relaxed">
                            {message.content}
                          </div>
                        </MessageContent>
                      </Message>
                    </div>
                  ))}
                  
                  {/* Indicador de ferramentas em execução */}
                  {toolsExecution.isVisible && toolsExecution.tools.length > 0 && (
                    <div className="mb-4">
                      <ToolsExecutionHistory 
                        tools={toolsExecution.tools}
                        isActive={true}
                      />
                    </div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </ConversationContent>
          </Conversation>

                                   {/* Input de mensagem - Dark Purple Style */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-t border-gray-700 p-4">
            <div className="max-w-4xl mx-auto">
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage(e)
                    }
                  }}
                  placeholder="Digite sua mensagem..."
                  className="w-full p-3 pr-12 bg-gray-700 border border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-100 placeholder-gray-400"
                  rows={1}
                  disabled={sendingMessage}
                  style={{ minHeight: '44px', maxHeight: '200px' }}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white p-2 h-8 w-8 rounded-md disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {sendingMessage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                {agent.name} pode cometer erros. Considere verificar informações importantes.
              </p>
            </div>
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
