import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'

// Carregar variáveis de ambiente
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Importar rotas
import authRoutes from './routes/auth.js'
import agentRoutes from './routes/agents.js'
import chatRoutes from './routes/chat.js'
import knowledgeBaseRoutes from './routes/knowledgeBase.js'
import credentialsRoutes from './routes/credentials.js'
import mcpToolsRoutes from './routes/mcp-tools.js'

const app = express()
const PORT = process.env.PORT || 5000

// Middleware de segurança
app.use(helmet())

// Configurar CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requests por IP
  message: 'Muitas requisições deste IP, tente novamente mais tarde.'
})
app.use('/api/', limiter)

// Middleware para parsing de JSON
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  next()
})

// Rotas da API
app.use('/api/auth', authRoutes)
app.use('/api/agents', agentRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/knowledge-base', knowledgeBaseRoutes)
app.use('/api/credentials', credentialsRoutes)
app.use('/api/mcp', mcpToolsRoutes)

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro:', err)
  
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ 
      error: 'Dados JSON inválidos' 
    })
  }
  
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor'
  })
})

// Rota para arquivos não encontrados
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint não encontrado' 
  })
})

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`)
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV }`)
})

export default app
