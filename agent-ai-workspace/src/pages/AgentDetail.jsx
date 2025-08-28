import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAgents } from '../contexts/AgentContext'
import { useAuth } from '../contexts/AuthContext'
import { 
  ArrowLeft, 
  Bot, 
  MessageSquare, 
  Upload, 
  Save,
  Eye,
  EyeOff,
  FileText,
  Trash2,
  Download,
  X
} from 'lucide-react'
import toast from 'react-hot-toast'

const AgentDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getAgent, updateAgent } = useAgents()
  const { token } = useAuth()
  const fileInputRef = useRef(null)
  
  const [agent, setAgent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  
  // Estados para knowledge base
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)

  useEffect(() => {
    const fetchAgent = async () => {
      try {
        const agentData = await getAgent(id)
        setAgent(agentData)
        setPrompt(agentData.prompt || '')
      } catch (error) {
        console.error('Erro ao buscar agente:', error)
        toast.error('Erro ao carregar agente')
        navigate('/')
      } finally {
        setLoading(false)
      }
    }

    fetchAgent()
  }, [id, getAgent, navigate])

  // Carregar arquivos da knowledge base
  useEffect(() => {
    if (agent) {
      fetchFiles()
    }
  }, [agent])

  const fetchFiles = async () => {
    setLoadingFiles(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/knowledge-base/${id}/files`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const filesData = await response.json()
        setFiles(filesData)
      } else {
        console.error('Erro ao carregar arquivos:', response.statusText)
      }
    } catch (error) {
      console.error('Erro ao carregar arquivos:', error)
    } finally {
      setLoadingFiles(false)
    }
  }

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      // Validar tipo de arquivo
      const allowedTypes = [
        'application/pdf',
        'text/csv',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/plain'
      ]
      
      if (!allowedTypes.includes(file.type)) {
        toast.error('Tipo de arquivo não suportado. Use PDF, CSV, XLSX, XLS ou TXT.')
        return
      }

      // Validar tamanho (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Tamanho máximo: 10MB')
        return
      }

      setSelectedFile(file)
      setShowUploadModal(true)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    try {
      console.log('🔄 Iniciando upload...')
      console.log('📄 Arquivo:', selectedFile.name, selectedFile.type, selectedFile.size)
      console.log('🔑 Token:', token ? 'Presente' : 'Ausente')
      console.log('🌐 API URL:', import.meta.env.VITE_API_URL)
      
      const formData = new FormData()
      formData.append('file', selectedFile)

      const url = `${import.meta.env.VITE_API_URL}/knowledge-base/${id}/upload`
      console.log('📡 URL da requisição:', url)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      console.log('📡 Status da resposta:', response.status)
      console.log('📡 Headers da resposta:', Object.fromEntries(response.headers.entries()))

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Upload bem-sucedido:', result)
        toast.success('Arquivo enviado com sucesso!')
        setShowUploadModal(false)
        setSelectedFile(null)
        fetchFiles() // Recarregar lista
      } else {
        const error = await response.json()
        console.error('❌ Erro no upload:', error)
        toast.error(error.error || 'Erro ao enviar arquivo')
      }
    } catch (error) {
      console.error('❌ Erro no upload:', error)
      toast.error('Erro ao enviar arquivo')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteFile = async (fileId) => {
    if (!confirm('Tem certeza que deseja deletar este arquivo?')) return

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/knowledge-base/${id}/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        toast.success('Arquivo deletado com sucesso!')
        fetchFiles() // Recarregar lista
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao deletar arquivo')
      }
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error)
      toast.error('Erro ao deletar arquivo')
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'application/pdf':
        return '📄'
      case 'text/csv':
        return '📊'
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      case 'application/vnd.ms-excel':
        return '📈'
      case 'text/plain':
        return '📝'
      default:
        return '📎'
    }
  }

  const handleSavePrompt = async () => {
    if (!prompt.trim()) {
      toast.error('Prompt não pode ser vazio')
      return
    }

    setSaving(true)
    try {
      const updatedAgent = await updateAgent(id, { prompt: prompt.trim() })
      setAgent(updatedAgent)
      toast.success('Prompt salvo com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar prompt:', error)
      toast.error('Erro ao salvar prompt')
    } finally {
      setSaving(false)
    }
  }

  const handlePreview = () => {
    if (!prompt.trim()) {
      toast.error('Adicione um prompt para visualizar')
      return
    }
    setShowPreview(!showPreview)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-2 text-dark-secondary">Carregando agente...</p>
        </div>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-dark-primary">Agente não encontrado</h2>
        <Link to="/" className="btn-primary mt-4">
          Voltar ao Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center text-sm text-dark-secondary hover:text-dark-primary mb-4 transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar ao Dashboard
        </button>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary-600/20">
                <Bot className="h-6 w-6 text-primary-400" />
              </div>
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-dark-primary">{agent.name}</h1>
              {agent.description && (
                <p className="text-sm text-dark-secondary">{agent.description}</p>
              )}
            </div>
          </div>
          
          <Link
            to={`/agent/${id}/chat`}
            className="btn-primary inline-flex items-center"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Testar Agente
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configuração do Prompt */}
        <div className="card gradient-card">
          <h2 className="text-lg font-semibold text-dark-primary mb-4">
            Configurar Prompt
          </h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-dark-secondary mb-2">
                Prompt do Agente *
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="input-field"
                rows={8}
                placeholder="Defina como o agente deve se comportar e responder..."
                maxLength={1000}
              />
              <p className="mt-1 text-xs text-dark-muted">
                {prompt.length}/1000 caracteres
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handlePreview}
                className="btn-secondary inline-flex items-center"
                disabled={!prompt.trim()}
              >
                {showPreview ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Ocultar Preview
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Visualizar
                  </>
                )}
              </button>
              
              <button
                onClick={handleSavePrompt}
                disabled={saving || !prompt.trim()}
                className="btn-primary inline-flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar Prompt'}
              </button>
            </div>
          </div>
        </div>

        {/* Preview do Prompt */}
        {showPreview && (
          <div className="card gradient-card">
            <h2 className="text-lg font-semibold text-dark-primary mb-4">
              Preview do Prompt
            </h2>
            
            <div className="bg-dark-tertiary rounded-lg p-4 border border-dark-border">
              <h3 className="text-sm font-medium text-dark-secondary mb-2">
                Exemplo de resposta simulada:
              </h3>
              <div className="text-sm text-dark-secondary space-y-2">
                <p><strong>Usuário:</strong> "Olá, como você pode me ajudar?"</p>
                <p><strong>Agente:</strong> "Olá! Sou um assistente configurado para ajudar com suas necessidades. Com base no prompt que você definiu, posso fornecer informações e suporte específicos. Como posso ser útil hoje?"</p>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-primary-600/10 border border-primary-500/20 rounded-lg">
              <h4 className="text-sm font-medium text-primary-400 mb-2">
                Prompt configurado:
              </h4>
              <p className="text-sm text-dark-secondary whitespace-pre-wrap">
                {prompt}
              </p>
            </div>
          </div>
        )}

        {/* Base de Conhecimento */}
        <div className="card gradient-card">
          <h2 className="text-lg font-semibold text-dark-primary mb-4">
            Base de Conhecimento
          </h2>
          
          {loadingFiles ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto"></div>
              <p className="mt-2 text-sm text-dark-secondary">Carregando arquivos...</p>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-8">
              <Upload className="mx-auto h-12 w-12 text-dark-border" />
              <h3 className="mt-2 text-sm font-medium text-dark-primary">
                Nenhum arquivo carregado
              </h3>
              <p className="mt-1 text-sm text-dark-secondary">
                Adicione arquivos para enriquecer a base de conhecimento do agente
              </p>
              <div className="mt-6">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-primary inline-flex items-center"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Carregar Arquivos
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-dark-primary">
                  Arquivos ({files.length})
                </h3>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary inline-flex items-center text-sm"
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Adicionar
                </button>
              </div>
              
              <div className="space-y-2">
                {files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-dark-tertiary rounded-lg border border-dark-border">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getFileIcon(file.file_type)}</span>
                      <div>
                        <p className="text-sm font-medium text-dark-primary">{file.file_name}</p>
                        <p className="text-xs text-dark-muted">
                          {formatFileSize(file.file_size)} • {new Date(file.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!file.file_url.includes('local://') && (
                        <a
                          href={file.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-dark-muted hover:text-dark-secondary transition-colors duration-200"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      )}
                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        className="p-1 text-dark-muted hover:text-red-400 transition-colors duration-200"
                        title="Deletar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-4 text-xs text-dark-muted">
            <p><strong>Formatos suportados:</strong> PDF, CSV, TXT, XLSX</p>
            <p><strong>Tamanho máximo:</strong> 10MB por arquivo</p>
          </div>
        </div>
      </div>

      {/* Input de arquivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.csv,.txt,.xlsx,.xls"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Modal de Upload */}
      {showUploadModal && selectedFile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="card glass-effect max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-dark-primary">
                Confirmar Upload
              </h3>
              <button
                onClick={() => {
                  setShowUploadModal(false)
                  setSelectedFile(null)
                }}
                className="text-dark-muted hover:text-dark-secondary transition-colors duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center space-x-3 p-3 bg-dark-tertiary rounded-lg border border-dark-border">
                <span className="text-lg">{getFileIcon(selectedFile.type)}</span>
                <div>
                  <p className="text-sm font-medium text-dark-primary">{selectedFile.name}</p>
                  <p className="text-xs text-dark-muted">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowUploadModal(false)
                  setSelectedFile(null)
                }}
                className="btn-secondary flex-1"
                disabled={uploading}
              >
                Cancelar
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="btn-primary flex-1 inline-flex items-center justify-center"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Enviar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Informações do Agente */}
      <div className="mt-8 card gradient-card">
        <h2 className="text-lg font-semibold text-dark-primary mb-4">
          Informações do Agente
        </h2>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-dark-secondary">Nome</label>
            <p className="mt-1 text-sm text-dark-primary">{agent.name}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-dark-secondary">Criado em</label>
            <p className="mt-1 text-sm text-dark-primary">
              {new Date(agent.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
          
          {agent.description && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-dark-secondary">Descrição</label>
              <p className="mt-1 text-sm text-dark-primary">{agent.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AgentDetail
