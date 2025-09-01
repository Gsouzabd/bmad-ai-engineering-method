import express from 'express'
import { authenticateToken } from './auth.js'
import { supabase } from '../config/supabase.js'
import OpenAI from 'openai'
import dotenv from 'dotenv'

// Carregar variáveis de ambiente
dotenv.config()

// Importar funções MCP para execução das ferramentas
import { google } from 'googleapis'
import CryptoJS from 'crypto-js'

// Importar integração MCP WooCommerce
import WooCommerceMCPIntegration from '../mcp-woocommerce-integration.js'

// Configurar OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sua_openai_api_key_aqui'
})

// Chave de criptografia para credenciais
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-secret-key-32-chars-long!'

// Armazenar instâncias MCP WooCommerce por usuário
const woocommerceMCPInstances = new Map()

// Função para descriptografar dados
const decrypt = (ciphertext) => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY)
  return bytes.toString(CryptoJS.enc.Utf8)
}

// Função para obter credenciais do usuário
const getUserCredentials = async (userId) => {
  const { data, error } = await supabase
    .from('user_credentials')
    .select('*')
    .eq('user_id', userId)
    .eq('is_valid', true)
    .single()

  if (error || !data) {
    throw new Error('Credenciais Google não encontradas ou inválidas')
  }

  return {
    clientId: data.client_id,
    clientSecret: decrypt(data.client_secret),
    accessToken: decrypt(data.access_token),
    refreshToken: decrypt(data.refresh_token)
  }
}

// Função para obter credenciais WooCommerce do usuário
const getWooCommerceCredentials = async (userId) => {
  const { data, error } = await supabase
    .from('woocommerce_credentials')
    .select('*')
    .eq('user_id', userId)
    .eq('is_valid', true)
    .single()

  if (error || !data) {
    throw new Error('Credenciais WooCommerce não encontradas ou inválidas')
  }

  return data
}

// Função para obter ou criar instância MCP WooCommerce
const getWooCommerceMCPInstance = async (userId) => {
  if (!woocommerceMCPInstances.has(userId)) {
    const mcpIntegration = new WooCommerceMCPIntegration()
    await mcpIntegration.startMCPServer(userId)
    woocommerceMCPInstances.set(userId, mcpIntegration)
  }
  
  return woocommerceMCPInstances.get(userId)
}

// Função para executar ferramentas MCP
const executeMCPTool = async (toolName, params, userId) => {
  try {
    // Verificar se é uma ferramenta WooCommerce
    if (toolName.startsWith('woocommerce_')) {
      return await executeWooCommerceTool(toolName, params, userId)
    }
    
    // Verificar se é uma ferramenta Google
    if (toolName.startsWith('gdrive_') || toolName.startsWith('sheets_')) {
      const credentials = await getUserCredentials(userId)
      
      switch (toolName) {
        case 'gdrive_list_files':
          return await executeGDriveListFiles(credentials, params)
        case 'gdrive_read_file':
          return await executeGDriveReadFile(credentials, params)
        case 'sheets_read_values':
          return await executeSheetsReadValues(credentials, params)
        case 'sheets_write_values':
          return await executeSheetsWriteValues(credentials, params)
        default:
          throw new Error(`Ferramenta Google não suportada: ${toolName}`)
      }
    }
    
    throw new Error(`Ferramenta não suportada: ${toolName}`)
  } catch (error) {
    console.error(`❌ Erro ao executar ferramenta MCP ${toolName}:`, error)
    throw error
  }
}

// Função para executar ferramentas WooCommerce
const executeWooCommerceTool = async (toolName, params, userId) => {
  try {
    const mcpInstance = await getWooCommerceMCPInstance(userId)
    
    // Mapear nomes de ferramentas para métodos MCP
    const toolMapping = {
      'woocommerce_get_products': 'get_products',
      'woocommerce_get_product': 'get_product',
      'woocommerce_create_product': 'create_product',
      'woocommerce_update_product': 'update_product',
      'woocommerce_delete_product': 'delete_product',
      'woocommerce_get_orders': 'get_orders',
      'woocommerce_get_order': 'get_order',
      'woocommerce_create_order': 'create_order',
      'woocommerce_update_order': 'update_order',
      'woocommerce_delete_order': 'delete_order',
      'woocommerce_get_customers': 'get_customers',
      'woocommerce_get_customer': 'get_customer',
      'woocommerce_create_customer': 'create_customer',
      'woocommerce_update_customer': 'update_customer',
      'woocommerce_delete_customer': 'delete_customer',
      'woocommerce_get_sales_report': 'get_sales_report',
      'woocommerce_get_products_report': 'get_products_report',
      'woocommerce_get_orders_report': 'get_orders_report',
      'woocommerce_get_categories_report': 'get_categories_report'
    }
    
    const mcpMethod = toolMapping[toolName]
    if (!mcpMethod) {
      throw new Error(`Ferramenta WooCommerce não suportada: ${toolName}`)
    }
    
    // Executar comando MCP
    const result = await mcpInstance.sendRequest(mcpMethod, params)
    
    return {
      success: true,
      tool: toolName,
      result: result,
      timestamp: new Date().toISOString()
    }
    
  } catch (error) {
    throw new Error(`Erro ao executar ferramenta WooCommerce ${toolName}: ${error.message}`)
  }
}

// Função para executar gdrive.list_files
const executeGDriveListFiles = async (credentials, params) => {
  try {
    const oauth2Client = new google.auth.OAuth2(
      credentials.clientId,
      credentials.clientSecret
    )
    
    oauth2Client.setCredentials({
      access_token: credentials.accessToken,
      refresh_token: credentials.refreshToken
    })

    const drive = google.drive({ version: 'v3', auth: oauth2Client })
    
    const response = await drive.files.list({
      pageSize: params.pageSize || 10,
      fields: 'files(id,name,mimeType,createdTime,modifiedTime)',
      orderBy: 'modifiedTime desc'
    })

    return {
      files: response.data.files,
      total: response.data.files.length
    }
  } catch (error) {
    throw new Error('Erro ao listar arquivos do Drive: ' + error.message)
  }
}

// Função para executar gdrive.read_file
const executeGDriveReadFile = async (credentials, params) => {
  try {
    const oauth2Client = new google.auth.OAuth2(
      credentials.clientId,
      credentials.clientSecret
    )
    
    oauth2Client.setCredentials({
      access_token: credentials.accessToken,
      refresh_token: credentials.refreshToken
    })

    const drive = google.drive({ version: 'v3', auth: oauth2Client })
    
    // Primeiro, obter metadados do arquivo
    const fileMetadata = await drive.files.get({
      fileId: params.fileId,
      fields: 'id,name,mimeType,size'
    })
    
    let content = ''
    const mimeType = fileMetadata.data.mimeType
    
    // Verificar se é um Google Docs/Sheets/Slides (precisa de export)
    if (mimeType.includes('application/vnd.google-apps')) {
      let exportMimeType = 'text/plain'
      
      if (mimeType.includes('document')) {
        exportMimeType = 'text/plain' // Google Docs -> texto
      } else if (mimeType.includes('spreadsheet')) {
        exportMimeType = 'text/csv' // Google Sheets -> CSV
      } else if (mimeType.includes('presentation')) {
        exportMimeType = 'text/plain' // Google Slides -> texto
      }
      
      // Exportar o arquivo
      const exportResponse = await drive.files.export({
        fileId: params.fileId,
        mimeType: exportMimeType
      })
      
      content = exportResponse.data
    } else {
      // Arquivo normal - download direto
      const response = await drive.files.get({
        fileId: params.fileId,
        alt: 'media'
      })
      
      content = response.data
    }

    return {
      fileId: params.fileId,
      fileName: fileMetadata.data.name,
      mimeType: fileMetadata.data.mimeType,
      size: fileMetadata.data.size,
      content: content
    }
  } catch (error) {
    throw new Error('Erro ao ler arquivo do Drive: ' + error.message)
  }
}

// Função para executar sheets.read_values
const executeSheetsReadValues = async (credentials, params) => {
  try {
    const oauth2Client = new google.auth.OAuth2(
      credentials.clientId,
      credentials.clientSecret
    )
    
    oauth2Client.setCredentials({
      access_token: credentials.accessToken,
      refresh_token: credentials.refreshToken
    })

    const sheets = google.sheets({ version: 'v4', auth: oauth2Client })
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: params.spreadsheetId,
      range: params.range
    })

    return {
      values: response.data.values || [],
      range: response.data.range
    }
  } catch (error) {
    console.error('❌ Erro detalhado ao ler planilha:', {
      message: error.message,
      code: error.code,
      status: error.status,
      spreadsheetId: params.spreadsheetId,
      range: params.range
    })
    
    if (error.code === 404 || error.message.includes('not found')) {
      throw new Error(`Planilha não encontrada. Verifique se o ID '${params.spreadsheetId}' está correto e se você tem permissão para acessá-la.`)
    } else if (error.code === 403) {
      throw new Error(`Acesso negado à planilha '${params.spreadsheetId}'. Verifique as permissões.`)
    } else {
      throw new Error('Erro ao ler planilha: ' + error.message)
    }
  }
}

// Função para executar sheets.write_values
const executeSheetsWriteValues = async (credentials, params) => {
  try {
    const oauth2Client = new google.auth.OAuth2(
      credentials.clientId,
      credentials.clientSecret
    )
    
    oauth2Client.setCredentials({
      access_token: credentials.accessToken,
      refresh_token: credentials.refreshToken
    })

    const sheets = google.sheets({ version: 'v4', auth: oauth2Client })
    
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: params.spreadsheetId,
      range: params.range,
      valueInputOption: 'RAW',
      resource: {
        values: params.values
      }
    })

    return {
      updatedRows: response.data.updatedRows,
      updatedColumns: response.data.updatedColumns,
      updatedCells: response.data.updatedCells
    }
  } catch (error) {
    console.error('❌ Erro detalhado ao escrever na planilha:', {
      message: error.message,
      code: error.code,
      status: error.status,
      spreadsheetId: params.spreadsheetId,
      range: params.range
    })
    
    if (error.code === 404 || error.message.includes('not found')) {
      throw new Error(`Planilha não encontrada. Verifique se o ID '${params.spreadsheetId}' está correto e se você tem permissão para acessá-la.`)
    } else if (error.code === 403) {
      throw new Error(`Acesso negado à planilha '${params.spreadsheetId}'. Verifique as permissões de escrita.`)
    } else {
      throw new Error('Erro ao escrever na planilha: ' + error.message)
    }
  }
}

const router = express.Router()

// Middleware para autenticação SSE via query string
const authenticateSSE = async (req, res, next) => {
  try {
    const token = req.query.token || req.headers['authorization']?.split(' ')[1]

    if (!token) {
      return res.status(401).json({ error: 'Token de acesso necessário' })
    }

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

// Funções auxiliares para tracking de ferramentas
const getToolDisplayName = (toolName) => {
  const displayNames = {
    'gdrive_list_files': 'Listar Arquivos do Drive',
    'gdrive_read_file': 'Ler Arquivo do Drive',
    'sheets_read_values': 'Ler Planilha',
    'sheets_write_values': 'Escrever Planilha'
  }
  return displayNames[toolName] || toolName
}

const getToolDescription = (toolName, args) => {
  const descriptions = {
    'gdrive_list_files': `Buscando ${args.pageSize || 10} arquivos recentes`,
    'gdrive_read_file': `Lendo arquivo: ${args.fileName || 'documento'}`,
    'sheets_read_values': `Lendo planilha ${args.range || 'dados'}`,
    'sheets_write_values': `Escrevendo em planilha ${args.range || 'dados'}`
  }
  return descriptions[toolName] || 'Executando ferramenta'
}

// =====================================================
// FUNÇÕES RAG (RETRIEVAL-AUGMENTED GENERATION)
// =====================================================

/**
 * Gera embeddings para um texto usando OpenAI
 */
async function generateEmbeddings(text) {
  try {
    // Tentar primeiro com text-embedding-3-large (3072 dimensões)
    // Se falhar, usar text-embedding-3-small (1536 dimensões)
    let response
    try {
      response = await openai.embeddings.create({
        model: 'text-embedding-3-large',
        input: text,
        encoding_format: 'float'
      })
    } catch (error) {
      console.warn('⚠️ text-embedding-3-large falhou, tentando text-embedding-3-small...')
      response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
        encoding_format: 'float'
      })
    }
    
    return response.data[0].embedding
  } catch (error) {
    console.error('❌ Erro ao gerar embeddings:', error)
    throw error
  }
}

/**
 * Busca chunks relevantes baseado na query do usuário
 */
async function searchRelevantChunks(query, agentId, userId, limit = 5) {
  try {
    // 1. Gerar embedding da query
    const queryEmbedding = await generateEmbeddings(query)
    
    // 2. Buscar chunks similares usando cosine similarity
    const { data: chunks, error } = await supabase.rpc('match_chunks', {
      query_embedding: queryEmbedding,
      match_threshold: 0.1, // Threshold baixo para teste
      match_count: limit,
      agent_id_param: agentId,
      user_id_param: userId
    })
    
    if (error) {
      console.error('❌ Erro na busca de chunks:', error)
      return []
    }
    
    return chunks || []
  } catch (error) {
    console.error('❌ Erro na busca semântica:', error)
    return []
  }
}

/**
 * Constrói contexto RAG para o agente
 */
async function buildRAGContext(userMessage, agentId, userId) {
  try {
    // Buscar chunks relevantes
    const relevantChunks = await searchRelevantChunks(userMessage, agentId, userId)
    
    if (relevantChunks.length === 0) {
      return {
        hasContext: false,
        context: '',
        chunks: []
      }
    }
    
    // Construir contexto
    const context = relevantChunks
      .map(chunk => `[Fonte: ${chunk.file_name || 'Documento'}] ${chunk.content}`)
      .join('\n\n')
    
    return {
      hasContext: true,
      context: context,
      chunks: relevantChunks
    }
  } catch (error) {
    console.error('❌ Erro ao construir contexto RAG:', error)
    return {
      hasContext: false,
      context: '',
      chunks: []
    }
  }
}

// =====================================================
// FUNÇÕES DE CHAT
// =====================================================

/**
 * Definir ferramentas MCP para OpenAI Function Calling
 */
const getMCPTools = () => [
  // GOOGLE DRIVE E SHEETS
  {
    type: "function",
    function: {
      name: "gdrive_list_files",
      description: "Lista arquivos do Google Drive do usuário",
      parameters: {
        type: "object",
        properties: {
          pageSize: {
            type: "number",
            description: "Número máximo de arquivos a retornar (padrão: 10)"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "gdrive_read_file",
      description: "Lê o conteúdo de um arquivo específico do Google Drive",
      parameters: {
        type: "object",
        properties: {
          fileId: {
            type: "string",
            description: "ID do arquivo no Google Drive"
          },
          fileName: {
            type: "string", 
            description: "Nome do arquivo para identificação"
          }
        },
        required: ["fileId"]
      }
    }
  },
  {
    type: "function", 
    function: {
      name: "sheets_read_values",
      description: "Lê valores de uma planilha do Google Sheets",
      parameters: {
        type: "object",
        properties: {
          spreadsheetId: {
            type: "string",
            description: "ID da planilha do Google Sheets"
          },
          range: {
            type: "string", 
            description: "Intervalo de células (ex: A1:B10)"
          }
        },
        required: ["spreadsheetId", "range"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "sheets_write_values", 
      description: "Escreve valores em uma planilha do Google Sheets",
      parameters: {
        type: "object",
        properties: {
          spreadsheetId: {
            type: "string",
            description: "ID da planilha do Google Sheets"
          },
          range: {
            type: "string",
            description: "Intervalo de células (ex: A1:B10)"
          },
          values: {
            type: "array",
            description: "Array de arrays com os valores a escrever",
            items: {
              type: "array",
              items: {
                type: "string"
              }
            }
          }
        },
        required: ["spreadsheetId", "range", "values"]
      }
    }
  },
  
  // WOOCOMMERCE - PRODUTOS
  {
    type: "function",
    function: {
      name: "woocommerce_get_products",
      description: "Lista produtos da loja WooCommerce",
      parameters: {
        type: "object",
        properties: {
          perPage: {
            type: "number",
            description: "Número de produtos por página (padrão: 20)"
          },
          page: {
            type: "number",
            description: "Número da página (padrão: 1)"
          },
          category: {
            type: "string",
            description: "ID da categoria para filtrar produtos"
          },
          status: {
            type: "string",
            description: "Status do produto (publish, draft, pending, private)"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "woocommerce_get_product",
      description: "Obtém detalhes de um produto específico",
      parameters: {
        type: "object",
        properties: {
          productId: {
            type: "string",
            description: "ID do produto"
          }
        },
        required: ["productId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "woocommerce_create_product",
      description: "Cria um novo produto na loja",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Nome do produto"
          },
          type: {
            type: "string",
            description: "Tipo do produto (simple, grouped, external, variable)"
          },
          regular_price: {
            type: "string",
            description: "Preço regular do produto"
          },
          description: {
            type: "string",
            description: "Descrição completa do produto"
          },
          short_description: {
            type: "string",
            description: "Descrição curta do produto"
          },
          categories: {
            type: "array",
            description: "Array de categorias do produto",
            items: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  description: "ID da categoria"
                }
              }
            }
          }
        },
        required: ["name", "type", "regular_price"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "woocommerce_update_product",
      description: "Atualiza um produto existente",
      parameters: {
        type: "object",
        properties: {
          productId: {
            type: "string",
            description: "ID do produto a ser atualizado"
          },
          name: {
            type: "string",
            description: "Novo nome do produto"
          },
          regular_price: {
            type: "string",
            description: "Novo preço regular"
          },
          description: {
            type: "string",
            description: "Nova descrição"
          }
        },
        required: ["productId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "woocommerce_delete_product",
      description: "Deleta um produto da loja",
      parameters: {
        type: "object",
        properties: {
          productId: {
            type: "string",
            description: "ID do produto a ser deletado"
          }
        },
        required: ["productId"]
      }
    }
  },
  
  // WOOCOMMERCE - PEDIDOS
  {
    type: "function",
    function: {
      name: "woocommerce_get_orders",
      description: "Lista pedidos da loja WooCommerce",
      parameters: {
        type: "object",
        properties: {
          perPage: {
            type: "number",
            description: "Número de pedidos por página (padrão: 20)"
          },
          page: {
            type: "number",
            description: "Número da página (padrão: 1)"
          },
          status: {
            type: "string",
            description: "Status do pedido (processing, completed, cancelled, etc.)"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "woocommerce_get_order",
      description: "Obtém detalhes de um pedido específico",
      parameters: {
        type: "object",
        properties: {
          orderId: {
            type: "string",
            description: "ID do pedido"
          }
        },
        required: ["orderId"]
      }
    }
  },
  
  // WOOCOMMERCE - CLIENTES
  {
    type: "function",
    function: {
      name: "woocommerce_get_customers",
      description: "Lista clientes da loja WooCommerce",
      parameters: {
        type: "object",
        properties: {
          perPage: {
            type: "number",
            description: "Número de clientes por página (padrão: 20)"
          },
          page: {
            type: "number",
            description: "Número da página (padrão: 1)"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "woocommerce_get_customer",
      description: "Obtém detalhes de um cliente específico",
      parameters: {
        type: "object",
        properties: {
          customerId: {
            type: "string",
            description: "ID do cliente"
          }
        },
        required: ["customerId"]
      }
    }
  },
  
  // WOOCOMMERCE - RELATÓRIOS
  {
    type: "function",
    function: {
      name: "woocommerce_get_sales_report",
      description: "Obtém relatório de vendas da loja",
      parameters: {
        type: "object",
        properties: {
          dateMin: {
            type: "string",
            description: "Data mínima para o relatório (formato: YYYY-MM-DD)"
          },
          dateMax: {
            type: "string",
            description: "Data máxima para o relatório (formato: YYYY-MM-DD)"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "woocommerce_get_products_report",
      description: "Obtém relatório de produtos da loja",
      parameters: {
        type: "object",
        properties: {
          dateMin: {
            type: "string",
            description: "Data mínima para o relatório (formato: YYYY-MM-DD)"
          },
          dateMax: {
            type: "string",
            description: "Data máxima para o relatório (formato: YYYY-MM-DD)"
          }
        }
      }
    }
  }
]

/**
 * Gera resposta usando OpenAI com contexto RAG e MCP tools com SSE
 */
async function generateAIResponseWithSSE(prompt, message, ragContext = null, userId = null, agentId = null, sendEvent, conversationHistory = []) {
  try {
    // Construir o prompt do sistema
    let systemPrompt = prompt
    
    // Adicionar contexto RAG se disponível
    if (ragContext && ragContext.hasContext) {
      systemPrompt = `${prompt}

IMPORTANTE - BASE DE CONHECIMENTO:
Use as seguintes informações dos documentos carregados para responder à pergunta do usuário. Se a pergunta estiver relacionada ao conteúdo dos documentos, baseie sua resposta neles:

${ragContext.context}

INSTRUÇÕES:
- Sempre que possível, use informações da base de conhecimento para fornecer respostas precisas e detalhadas
- Se não encontrar informações relevantes nos documentos, informe ao usuário que não tem dados suficientes sobre o assunto
- Cite a fonte dos documentos quando usar informações deles
- Mantenha as respostas concisas e diretas`
    } else {
      systemPrompt = `${prompt}

NOTA: Não há documentos específicos carregados na base de conhecimento para este agente. Responda baseado no seu conhecimento geral.`
    }

    // Adicionar instruções para MCP tools
    systemPrompt += `

FERRAMENTAS DISPONÍVEIS:

GOOGLE (Drive e Sheets):
- gdrive_list_files: Para listar arquivos do Google Drive
- gdrive_read_file: Para ler o conteúdo de um arquivo específico do Google Drive (requer fileId)
- sheets_read_values: Para ler dados de planilhas Google Sheets (requer spreadsheetId VÁLIDO)
- sheets_write_values: Para escrever dados em planilhas Google Sheets

WOOCOMMERCE (Loja Online):
- woocommerce_get_products: Para listar produtos da loja
- woocommerce_get_product: Para obter detalhes de um produto específico (requer productId)
- woocommerce_create_product: Para criar um novo produto
- woocommerce_update_product: Para atualizar um produto existente (requer productId)
- woocommerce_delete_product: Para deletar um produto (requer productId)
- woocommerce_get_orders: Para listar pedidos da loja
- woocommerce_get_order: Para obter detalhes de um pedido específico (requer orderId)
- woocommerce_create_order: Para criar um novo pedido
- woocommerce_update_order: Para atualizar um pedido existente (requer orderId)
- woocommerce_delete_order: Para deletar um pedido (requer orderId)
- woocommerce_get_customers: Para listar clientes da loja
- woocommerce_get_customer: Para obter detalhes de um cliente específico (requer customerId)
- woocommerce_create_customer: Para criar um novo cliente
- woocommerce_update_customer: Para atualizar um cliente existente (requer customerId)
- woocommerce_delete_customer: Para deletar um cliente (requer customerId)
- woocommerce_get_sales_report: Para obter relatório de vendas
- woocommerce_get_products_report: Para obter relatório de produtos
- woocommerce_get_orders_report: Para obter relatório de pedidos
- woocommerce_get_categories_report: Para obter relatório de categorias

REGRAS OBRIGATÓRIAS:

1. CONTEXTO DE CONVERSA:
   - SEMPRE considere o contexto das mensagens anteriores na conversa
   - Se o usuário se refere a "essa planilha" ou "esse arquivo", use o CONTEÚDO já obtido anteriormente
   - NÃO invente IDs de planilhas ou arquivos inexistentes

2. GOOGLE DRIVE:
   - Para ler arquivos: use gdrive_list_files → gdrive_read_file
   - SEMPRE execute AMBAS as ferramentas para completar a tarefa
   - NUNCA responda que "encontrou" sem ler o conteúdo

3. GOOGLE SHEETS:
   - CRÍTICO: Use APENAS IDs do Google Drive já listados na conversa
   - O spreadsheetId deve ser o campo "id" dos arquivos listados pelo gdrive_list_files
   - EXEMPLO: Para "DESTINATÁRIOS" use ID "1PFCr8WqbvfxUTAJvpYmlvgs2vj-AaaYSmOBEEJe9aC0"
   - NUNCA use o nome do arquivo como ID (ex: "DESTINATARIOS" é ERRADO)
   - NUNCA use IDs genéricos como "1", "sheet1", etc.
   - Se não encontrar o ID na conversa, use gdrive_list_files primeiro
   
   REGRAS PARA ESCRITA SEGURA:
   - SEMPRE leia a planilha ANTES de escrever (use sheets_read_values primeiro)
   - NUNCA escreva em A1 ou células que podem conter dados importantes
   - Encontre uma célula vazia ou uma nova linha para adicionar dados
   - Se incerto sobre onde escrever, PERGUNTE ao usuário
   - Para adicionar dados, use a próxima linha vazia disponível
   
   REGRAS PARA REMOÇÃO/LIMPEZA:
   - Para REMOVER dados: use sheets_write_values com células vazias [""]
   - SEMPRE leia primeiro para identificar a linha/coluna correta
   - CRÍTICO: CONTE as linhas com CUIDADO (linha 1 = A1, linha 2 = A2, etc.)
   - VERIFIQUE o valor EXATO na planilha antes de determinar a linha
   - IMPORTANTE: Remova TODA A LINHA, não apenas uma célula
   - OBRIGATÓRIO: Use range que inclua TODAS as colunas da linha
   - EXEMPLO: Se o número está em A7, use range "A7:B7", values [["", ""]]
   - NUNCA assuma a posição - sempre confirme pelo conteúdo lido
   - CONFIRME o que foi removido depois da operação

4. ANÁLISE DE DADOS:
   - Se o usuário pedir análise de dados já obtidos, use o CONTEÚDO já lido
   - NÃO tente buscar novamente com IDs inventados
   - Processe os dados disponíveis na conversa atual
   - SEMPRE faça análises PRECISAS e DETALHADAS dos dados
   - Para ADICIONAR dados a planilhas existentes, primeiro LEIA o conteúdo atual
   - IDENTIFIQUE onde há espaço vazio para adicionar novos dados
   - CORRESPONDÊNCIA EXATA: Quando localizar um valor, determine sua posição baseada no array retornado
   - EXEMPLO: Se sheets_read_values retorna ["5581982408541", "5519999054433", "5581987654321"]
     então "5581987654321" está no índice 2 (terceiro item) = linha 3 (A3)

5. NÚMEROS DE TELEFONE BRASILEIROS:
   - Formato: 55 + DDD + número (ex: 5581987654321)
   - DDD 81 = Recife/PE, DDD 11 = São Paulo, DDD 21 = Rio de Janeiro, DDD 19 = Campinas
   - Para identificar DDD, olhe os DOIS dígitos após "55"
   - Exemplo: 5581982408541 → DDD 81 (Recife), 5519999054433 → DDD 19 (Campinas)
   - SEMPRE verifique CUIDADOSAMENTE os DDDs antes de categorizar

6. WOOCOMMERCE (LOJA ONLINE):
   - Para produtos: use woocommerce_get_products para listar, woocommerce_get_product para detalhes
   - Para pedidos: use woocommerce_get_orders para listar, woocommerce_get_order para detalhes
   - Para clientes: use woocommerce_get_customers para listar, woocommerce_get_customer para detalhes
   - Para relatórios: use woocommerce_get_sales_report, woocommerce_get_products_report, etc.
   - SEMPRE use IDs válidos quando especificados (productId, orderId, customerId)
   - Para criar/atualizar: forneça todos os dados necessários no formato correto
   - Para deletar: confirme a ação e use o ID correto
   - Use woocommerce_get_products com parâmetros como perPage, page, category, status
   - Use woocommerce_get_orders com parâmetros como perPage, page, status
   - Use woocommerce_get_customers com parâmetros como perPage, page

Use essas ferramentas SOMENTE quando necessário e com parâmetros VÁLIDOS.`

    // Construir array de mensagens com histórico
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      }
    ]

    // Adicionar histórico da conversa (se existir)
    if (conversationHistory && conversationHistory.length > 0) {
      console.log(`💭 Incluindo ${conversationHistory.length} mensagens do histórico`)
      conversationHistory.forEach(msg => {
        messages.push({
          role: msg.role,
          content: msg.content
        })
      })
      
      // Adicionar instrução específica para manter contexto
      systemPrompt += `

IMPORTANTE - CONTEXTO DA CONVERSA:
Você tem acesso ao histórico desta conversa. Use essas informações para:
- Manter referência aos IDs de planilhas e arquivos já mencionados
- Continuar operações iniciadas anteriormente
- Evitar pedir informações já fornecidas
- Manter consistência nas referências a arquivos e planilhas

REGRAS CRÍTICAS PARA PLANILHAS:
- SEMPRE use os IDs de planilhas já mencionados na conversa
- NUNCA invente novos IDs ou use nomes de arquivos como IDs
- Se precisar de um ID, use gdrive_list_files primeiro para obter a lista atualizada
- Mantenha o contexto: se o usuário disse "essa planilha", use o ID da conversa anterior`
    } else {
      console.log('💭 Nenhum histórico de conversa disponível')
    }

    // Adicionar mensagem atual do usuário
    messages.push({
      role: 'user',
      content: message
    })

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages,
      tools: getMCPTools(),
      tool_choice: "auto",
      max_tokens: 5000,
      temperature: 0.7
    })

    const responseMessage = response.choices[0].message

    // Se a IA decidiu usar uma ferramenta
    if (responseMessage.tool_calls) {
      sendEvent('tools_requested', { 
        count: responseMessage.tool_calls.length,
        message: `OpenAI solicitou ${responseMessage.tool_calls.length} ferramenta(s)`
      })
      
      const toolResults = []
      
      for (const toolCall of responseMessage.tool_calls) {
        try {
          const functionName = toolCall.function.name
          const functionArgs = JSON.parse(toolCall.function.arguments)
          
          // Enviar evento de início da ferramenta
          sendEvent('tool_start', {
            name: functionName,
            displayName: getToolDisplayName(functionName),
            description: getToolDescription(functionName, functionArgs),
            args: functionArgs
          })
          
          // Executar a ferramenta MCP correspondente
          const result = await executeMCPTool(functionName, functionArgs, userId)
          
          // Enviar evento de sucesso da ferramenta
          sendEvent('tool_success', {
            name: functionName,
            displayName: getToolDisplayName(functionName)
          })
          
          toolResults.push({
            tool_call_id: toolCall.id,
            role: "tool",
            content: JSON.stringify(result)
          })
        } catch (error) {
          console.error(`❌ Erro ao executar ferramenta ${toolCall.function.name}:`, error)
          
          // Enviar evento de erro da ferramenta
          sendEvent('tool_error', {
            name: toolCall.function.name,
            error: error.message
          })
          
          toolResults.push({
            tool_call_id: toolCall.id,
            role: "tool", 
            content: JSON.stringify({ error: error.message })
          })
        }
      }

      sendEvent('second_ai_call', { message: 'Fazendo segunda chamada à OpenAI...' })
      
      // Fazer uma segunda chamada à OpenAI com os resultados das ferramentas
      const finalResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: message
          },
          responseMessage,
          ...toolResults
        ],
        tools: getMCPTools(),
        tool_choice: "auto",
        max_tokens: 1000,
        temperature: 0.7
      })

      const finalMessage = finalResponse.choices[0].message

      // Se a OpenAI quer usar mais ferramentas, executar recursivamente
      if (finalMessage.tool_calls) {
        sendEvent('additional_tools', { 
          count: finalMessage.tool_calls.length,
          message: `OpenAI solicitou ${finalMessage.tool_calls.length} ferramenta(s) adicional(is)`
        })
        
        const additionalToolResults = []
        for (const toolCall of finalMessage.tool_calls) {
          try {
            const functionName = toolCall.function.name
            const functionArgs = JSON.parse(toolCall.function.arguments)
            
            sendEvent('tool_start', {
              name: functionName,
              displayName: getToolDisplayName(functionName),
              description: getToolDescription(functionName, functionArgs),
              args: functionArgs
            })
            
            const result = await executeMCPTool(functionName, functionArgs, userId)
            
            sendEvent('tool_success', {
              name: functionName,
              displayName: getToolDisplayName(functionName)
            })
            
            additionalToolResults.push({
              tool_call_id: toolCall.id,
              role: "tool",
              content: JSON.stringify(result)
            })
          } catch (error) {
            console.error(`❌ Erro ao executar ferramenta adicional ${toolCall.function.name}:`, error)
            
            sendEvent('tool_error', {
              name: toolCall.function.name,
              error: error.message
            })
            
            additionalToolResults.push({
              tool_call_id: toolCall.id,
              role: "tool",
              content: JSON.stringify({ error: error.message })
            })
          }
        }

        sendEvent('final_ai_call', { message: 'Chamada final à OpenAI...' })

        // Chamada final para gerar a resposta com todos os resultados
        const ultimateResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: message
            },
            responseMessage,
            ...toolResults,
            finalMessage,
            ...additionalToolResults
          ],
          max_tokens: 1000,
          temperature: 0.7
        })

        return ultimateResponse.choices[0].message.content
      }

      return finalMessage.content
    }

    return responseMessage.content
  } catch (error) {
    console.error('❌ Erro ao gerar resposta da IA:', error)
    sendEvent('ai_error', { error: error.message })
    throw error
  }
}

/**
 * Gera resposta usando OpenAI com contexto RAG e MCP tools (versão tradicional)
 */
async function generateAIResponse(prompt, message, ragContext = null, userId = null, agentId = null, req = null, sessionId = null, conversationHistory = []) {
  try {
    // Inicializar array para rastrear ferramentas executadas
    const toolsExecuted = []
    
    // Construir o prompt do sistema
    let systemPrompt = prompt
    
    // Adicionar contexto RAG se disponível
    if (ragContext && ragContext.hasContext) {
      systemPrompt = `${prompt}

IMPORTANTE - BASE DE CONHECIMENTO:
Use as seguintes informações dos documentos carregados para responder à pergunta do usuário. Se a pergunta estiver relacionada ao conteúdo dos documentos, baseie sua resposta neles:

${ragContext.context}

INSTRUÇÕES:
- Sempre que possível, use informações da base de conhecimento para fornecer respostas precisas e detalhadas
- Se não encontrar informações relevantes nos documentos, informe ao usuário que não tem dados suficientes sobre o assunto
- Cite a fonte dos documentos quando usar informações deles
- Mantenha as respostas concisas e diretas`
    } else {
      systemPrompt = `${prompt}

NOTA: Não há documentos específicos carregados na base de conhecimento para este agente. Responda baseado no seu conhecimento geral.`
    }

    // Adicionar instruções para MCP tools
    systemPrompt += `

FERRAMENTAS DISPONÍVEIS:
Você tem acesso às seguintes ferramentas do Google:
- gdrive_list_files: Para listar arquivos do Google Drive
- gdrive_read_file: Para ler o conteúdo de um arquivo específico do Google Drive (requer fileId)
- sheets_read_values: Para ler dados de planilhas Google Sheets (requer spreadsheetId VÁLIDO)
- sheets_write_values: Para escrever dados em planilhas Google Sheets

REGRAS OBRIGATÓRIAS:

1. CONTEXTO DE CONVERSA:
   - SEMPRE considere o contexto das mensagens anteriores na conversa
   - Se o usuário se refere a "essa planilha" ou "esse arquivo", use o CONTEÚDO já obtido anteriormente
   - NÃO invente IDs de planilhas ou arquivos inexistentes

2. GOOGLE DRIVE:
   - Para ler arquivos: use gdrive_list_files → gdrive_read_file
   - SEMPRE execute AMBAS as ferramentas para completar a tarefa
   - NUNCA responda que "encontrou" sem ler o conteúdo

3. GOOGLE SHEETS:
   - CRÍTICO: Use APENAS IDs do Google Drive já listados na conversa
   - O spreadsheetId deve ser o campo "id" dos arquivos listados pelo gdrive_list_files
   - EXEMPLO: Para "DESTINATÁRIOS" use ID "1PFCr8WqbvfxUTAJvpYmlvgs2vj-AaaYSmOBEEJe9aC0"
   - NUNCA use o nome do arquivo como ID (ex: "DESTINATARIOS" é ERRADO)
   - NUNCA use IDs genéricos como "1", "sheet1", etc.
   - Se não encontrar o ID na conversa, use gdrive_list_files primeiro
   
   REGRAS PARA ESCRITA SEGURA:
   - SEMPRE leia a planilha ANTES de escrever (use sheets_read_values primeiro)
   - NUNCA escreva em A1 ou células que podem conter dados importantes
   - Encontre uma célula vazia ou uma nova linha para adicionar dados
   - Se incerto sobre onde escrever, PERGUNTE ao usuário
   - Para adicionar dados, use a próxima linha vazia disponível
   
   REGRAS PARA REMOÇÃO/LIMPEZA:
   - Para REMOVER dados: use sheets_write_values com células vazias [""]
   - SEMPRE leia primeiro para identificar a linha/coluna correta
   - CRÍTICO: CONTE as linhas com CUIDADO (linha 1 = A1, linha 2 = A2, etc.)
   - VERIFIQUE o valor EXATO na planilha antes de determinar a linha
   - IMPORTANTE: Remova TODA A LINHA, não apenas uma célula
   - OBRIGATÓRIO: Use range que inclua TODAS as colunas da linha
   - EXEMPLO: Se o número está em A7, use range "A7:B7", values [["", ""]]
   - NUNCA assuma a posição - sempre confirme pelo conteúdo lido
   - CONFIRME o que foi removido depois da operação

4. ANÁLISE DE DADOS:
   - Se o usuário pedir análise de dados já obtidos, use o CONTEÚDO já lido
   - NÃO tente buscar novamente com IDs inventados
   - Processe os dados disponíveis na conversa atual
   - SEMPRE faça análises PRECISAS e DETALHADAS dos dados
   - Para ADICIONAR dados a planilhas existentes, primeiro LEIA o conteúdo atual
   - IDENTIFIQUE onde há espaço vazio para adicionar novos dados
   - CORRESPONDÊNCIA EXATA: Quando localizar um valor, determine sua posição baseada no array retornado
   - EXEMPLO: Se sheets_read_values retorna ["5581982408541", "5519999054433", "5581987654321"]
     então "5581987654321" está no índice 2 (terceiro item) = linha 3 (A3)

5. NÚMEROS DE TELEFONE BRASILEIROS:
   - Formato: 55 + DDD + número (ex: 5581987654321)
   - DDD 81 = Recife/PE, DDD 11 = São Paulo, DDD 21 = Rio de Janeiro, DDD 19 = Campinas
   - Para identificar DDD, olhe os DOIS dígitos após "55"
   - Exemplo: 5581982408541 → DDD 81 (Recife), 5519999054433 → DDD 19 (Campinas)
   - SEMPRE verifique CUIDADOSAMENTE os DDDs antes de categorizar

Use essas ferramentas SOMENTE quando necessário e com parâmetros VÁLIDOS.`

    // Construir array de mensagens com histórico
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      }
    ]

    // Adicionar histórico da conversa (se existir)
    if (conversationHistory.length > 0) {
      console.log(`💭 Incluindo ${conversationHistory.length} mensagens do histórico`)
      conversationHistory.forEach(msg => {
        messages.push({
          role: msg.role,
          content: msg.content
        })
      })
    }

    // Adicionar mensagem atual do usuário
    messages.push({
      role: 'user',
      content: message
    })

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      tools: getMCPTools(),
      tool_choice: "auto",
      max_tokens: 1000,
      temperature: 0.7
    })

    const responseMessage = response.choices[0].message

    // Se a IA decidiu usar uma ferramenta
    if (responseMessage.tool_calls) {
      console.log(`🔧 OpenAI solicitou ${responseMessage.tool_calls.length} ferramenta(s)`)
      const toolResults = []
      
      // Inicializar array de ferramentas executadas
      if (req) {
        req.toolsExecuted = req.toolsExecuted || []
      }
      
      // Notificar início das ferramentas via SSE
      if (sessionId) {
        sendToolEvent(sessionId, 'tools_requested', {
          count: responseMessage.tool_calls.length,
          tools: responseMessage.tool_calls.map(tc => tc.function.name)
        })
      }
      
      for (const toolCall of responseMessage.tool_calls) {
        const functionName = toolCall.function.name
        const functionArgs = JSON.parse(toolCall.function.arguments)
        
        console.log(`🔧 Executando ferramenta MCP: ${functionName} com args:`, functionArgs)
        
        // Adicionar ferramenta ao tracking
        const toolInfo = {
          name: functionName,
          displayName: getToolDisplayName(functionName),
          description: getToolDescription(functionName, functionArgs),
          status: 'executing',
          timestamp: new Date().toISOString(),
          args: functionArgs
        }
        
        if (req) {
          req.toolsExecuted.push(toolInfo)
        }
        
        // Notificar início da ferramenta via SSE
        if (sessionId) {
          sendToolEvent(sessionId, 'tool_start', {
            name: functionName,
            displayName: getToolDisplayName(functionName),
            description: getToolDescription(functionName, functionArgs),
            args: functionArgs
          })
        }
        
        try {
          // Executar a ferramenta MCP correspondente
          const result = await executeMCPTool(functionName, functionArgs, userId)
          console.log(`✅ Ferramenta ${functionName} executada com sucesso`)
          
          // Atualizar status para sucesso
          if (req && toolInfo) {
            toolInfo.status = 'success'
            toolInfo.completedAt = new Date().toISOString()
            toolInfo.result = result
          }
          
          // Notificar sucesso da ferramenta via SSE
          if (sessionId) {
            sendToolEvent(sessionId, 'tool_success', {
              name: functionName,
              displayName: getToolDisplayName(functionName),
              result: result
            })
          }
          
          toolResults.push({
            tool_call_id: toolCall.id,
            role: "tool",
            content: JSON.stringify(result)
          })
        } catch (error) {
          console.error(`❌ Erro ao executar ferramenta ${functionName}:`, error)
          
          // Atualizar status para erro
          if (req && toolInfo) {
            toolInfo.status = 'error'
            toolInfo.error = error.message || 'Erro desconhecido na execução da ferramenta'
            toolInfo.completedAt = new Date().toISOString()
          }
          
          // Notificar erro da ferramenta via SSE
          if (sessionId) {
            sendToolEvent(sessionId, 'tool_error', {
              name: functionName,
              displayName: getToolDisplayName(functionName),
              error: error.message || 'Erro desconhecido na execução da ferramenta'
            })
          }
          
          toolResults.push({
            tool_call_id: toolCall.id,
            role: "tool", 
            content: JSON.stringify({ error: error.message })
          })
        }
      }

      console.log(`🔄 Fazendo segunda chamada à OpenAI com ${toolResults.length} resultado(s)`)
      
      // Fazer uma segunda chamada à OpenAI com os resultados das ferramentas
      const finalResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: message
          },
          responseMessage,
          ...toolResults
        ],
        tools: getMCPTools(),
        tool_choice: "auto",
        max_tokens: 1000,
        temperature: 0.7
      })

      const finalMessage = finalResponse.choices[0].message

      // Se a OpenAI quer usar mais ferramentas, executar recursivamente
      if (finalMessage.tool_calls) {
        console.log(`🔧 OpenAI solicitou ${finalMessage.tool_calls.length} ferramenta(s) adicional(is)`)
        
        // Notificar ferramentas adicionais via SSE
        if (sessionId) {
          sendToolEvent(sessionId, 'additional_tools_requested', {
            count: finalMessage.tool_calls.length,
            tools: finalMessage.tool_calls.map(tc => tc.function.name)
          })
        }
        
        const additionalToolResults = []
        for (const toolCall of finalMessage.tool_calls) {
          try {
            const functionName = toolCall.function.name
            const functionArgs = JSON.parse(toolCall.function.arguments)
            
            console.log(`🔧 Executando ferramenta adicional: ${functionName} com args:`, functionArgs)
            
            // Notificar início da ferramenta adicional via SSE
            if (sessionId) {
              sendToolEvent(sessionId, 'tool_start', {
                name: functionName,
                displayName: getToolDisplayName(functionName),
                description: getToolDescription(functionName, functionArgs),
                args: functionArgs,
                isAdditional: true
              })
            }
            
            const result = await executeMCPTool(functionName, functionArgs, userId)
            console.log(`✅ Ferramenta adicional ${functionName} executada com sucesso`)
            
            // Notificar sucesso da ferramenta adicional via SSE
            if (sessionId) {
              sendToolEvent(sessionId, 'tool_success', {
                name: functionName,
                displayName: getToolDisplayName(functionName),
                result: result,
                isAdditional: true
              })
            }
            
            additionalToolResults.push({
              tool_call_id: toolCall.id,
              role: "tool",
              content: JSON.stringify(result)
            })
          } catch (error) {
            console.error(`❌ Erro ao executar ferramenta adicional ${toolCall.function.name}:`, error)
            
            // Notificar erro da ferramenta adicional via SSE
            if (sessionId) {
              sendToolEvent(sessionId, 'tool_error', {
                name: toolCall.function.name,
                displayName: getToolDisplayName(toolCall.function.name),
                error: error.message || 'Erro desconhecido na execução da ferramenta',
                isAdditional: true
              })
            }
            
            additionalToolResults.push({
              tool_call_id: toolCall.id,
              role: "tool",
              content: JSON.stringify({ error: error.message })
            })
          }
        }

        // Chamada final para gerar a resposta com todos os resultados (COM STREAMING)
        console.log(`🎬 Iniciando streaming da resposta final...`)
        const ultimateResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: message
            },
            responseMessage,
            ...toolResults,
            finalMessage,
            ...additionalToolResults
          ],
          max_tokens: 1000,
          temperature: 0.7,
          stream: true // ✨ ATIVAR STREAMING
        })

        // Processar stream e enviar via SSE
        const finalContent = await handleOpenAIStreamResponse(ultimateResponse, sessionId)
        console.log(`✅ Chamada final concluída com streaming`)
        return finalContent
      }

      // Se não há ferramentas adicionais, fazer streaming da resposta final
      if (sessionId && finalMessage.content) {
        console.log(`🎬 Iniciando streaming da resposta final (sem ferramentas adicionais)...`)
        // Simular streaming para consistência da UI
        sendTextStreamEvent(sessionId, 'text_start', { message: 'Iniciando resposta...' })
        
        // Enviar resposta completa como stream simulado
        const words = finalMessage.content.split(' ')
        let currentText = ''
        
        for (const word of words) {
          currentText += (currentText ? ' ' : '') + word
          sendTextStreamEvent(sessionId, 'text_chunk', { 
            content: word + ' ',
            fullContent: currentText 
          })
          
          // Pequeno delay para simular digitação
          await new Promise(resolve => setTimeout(resolve, 50))
        }
        
        sendTextStreamEvent(sessionId, 'text_complete', { 
          fullContent: finalMessage.content 
        })
        
        console.log(`✅ Streaming simulado concluído`)
      }
      
      console.log(`✅ Segunda chamada à OpenAI concluída`)
      return finalMessage.content
    }

    // Se não há ferramentas, fazer streaming da primeira resposta
    if (sessionId && responseMessage.content) {
      console.log(`🎬 Iniciando streaming da primeira resposta (sem ferramentas)...`)
      sendTextStreamEvent(sessionId, 'text_start', { message: 'Iniciando resposta...' })
      
      // Enviar resposta completa como stream simulado
      const words = responseMessage.content.split(' ')
      let currentText = ''
      
      for (const word of words) {
        currentText += (currentText ? ' ' : '') + word
        sendTextStreamEvent(sessionId, 'text_chunk', { 
          content: word + ' ',
          fullContent: currentText 
        })
        
        // Pequeno delay para simular digitação
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      
      sendTextStreamEvent(sessionId, 'text_complete', { 
        fullContent: responseMessage.content 
      })
      
      console.log(`✅ Streaming simulado da primeira resposta concluído`)
    }

    return responseMessage.content
  } catch (error) {
    console.error('❌ Erro ao gerar resposta da IA:', error)
    throw error
  }
}

// =====================================================
// SISTEMA DE NOTIFICAÇÕES SSE PARA FERRAMENTAS E TEXTO
// =====================================================

// Map para armazenar conexões SSE ativas por sessionId
const activeSSEConnections = new Map()

/**
 * Envia eventos de streaming de texto via SSE
 */
function sendTextStreamEvent(sessionId, eventType, data) {
  const sseRes = activeSSEConnections.get(sessionId)
  if (sseRes && !sseRes.destroyed) {
    try {
      sseRes.write(`event: ${eventType}\n`)
      sseRes.write(`data: ${JSON.stringify(data)}\n\n`)
    } catch (error) {
      console.error(`❌ Erro ao enviar evento SSE de texto para ${sessionId}:`, error)
      activeSSEConnections.delete(sessionId)
    }
  }
}

/**
 * Processa stream de resposta do OpenAI e envia via SSE
 */
async function handleOpenAIStreamResponse(stream, sessionId) {
  let fullContent = ''
  
  try {
    // Notificar início do streaming
    sendTextStreamEvent(sessionId, 'text_start', { message: 'Iniciando resposta...' })
    
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || ''
      if (content) {
        fullContent += content
        
        // Enviar chunk de texto via SSE
        sendTextStreamEvent(sessionId, 'text_chunk', { 
          content: content,
          fullContent: fullContent 
        })
      }
    }
    
    // Notificar fim do streaming
    sendTextStreamEvent(sessionId, 'text_complete', { 
      fullContent: fullContent 
    })
    
    return fullContent
  } catch (error) {
    sendTextStreamEvent(sessionId, 'text_error', { 
      error: error.message 
    })
    throw error
  }
}

// Função para enviar evento SSE para uma sessão específica
function sendToolEvent(sessionId, eventType, data) {
  const connection = activeSSEConnections.get(sessionId)
  if (connection && !connection.destroyed) {
    try {
      connection.write(`event: ${eventType}\n`)
      connection.write(`data: ${JSON.stringify(data)}\n\n`)
    } catch (error) {
      console.error('❌ Erro ao enviar evento SSE:', error)
      activeSSEConnections.delete(sessionId)
    }
  }
}

// Endpoint SSE apenas para notificações de ferramentas
router.get('/:agentId/tools-stream/:sessionId', (req, res) => {
  const { sessionId } = req.params
  
  console.log(`🔗 Nova conexão SSE para ferramentas: ${sessionId}`)
  
  // Configurar SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  })

  // Armazenar conexão
  activeSSEConnections.set(sessionId, res)
  
  // Enviar evento de conexão estabelecida
  sendToolEvent(sessionId, 'connected', { message: 'Conexão SSE estabelecida para ferramentas' })
  
  // Limpar conexão quando cliente desconectar
  req.on('close', () => {
    console.log(`🔌 Conexão SSE fechada: ${sessionId}`)
    activeSSEConnections.delete(sessionId)
  })
  
  res.on('close', () => {
    console.log(`🔌 Resposta SSE fechada: ${sessionId}`)
    activeSSEConnections.delete(sessionId)
  })
})

// =====================================================
// ENDPOINTS DA API
// =====================================================

// Endpoint SSE para streaming de progresso das ferramentas
router.get('/:agentId/stream', authenticateToken, async (req, res) => {
  // Configurar SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  })

  // Função para enviar eventos
  const sendEvent = (type, data) => {
    res.write(`event: ${type}\n`)
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }

  // Manter conexão viva
  const keepAlive = setInterval(() => {
    res.write(': heartbeat\n\n')
  }, 30000)

  // Limpar quando cliente desconectar
  req.on('close', () => {
    clearInterval(keepAlive)
    res.end()
  })

  // Enviar evento inicial
  sendEvent('connected', { message: 'Conexão SSE estabelecida' })
})

// Enviar mensagem para o agente com streaming SSE (sem autenticação para simplicidade)
router.get('/:agentId/stream', async (req, res) => {
  // Configurar SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  })

  const sendEvent = (type, data) => {
    res.write(`event: ${type}\n`)
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }

  try {
    const { agentId } = req.params
    const { message, conversationId, userId } = req.query
    
    // Para simplificar, vamos usar um userId fixo para teste
    // Em produção, você obteria isso da sessão ou contexto autenticado
    const actualUserId = userId || '55ccaa1e-34a2-42a2-ba1f-32dfb7c6320c'

    if (!message || !message.trim()) {
      sendEvent('error', { error: 'Mensagem é obrigatória' })
      res.end()
      return
    }

    sendEvent('message_received', { message: message.substring(0, 100) + '...' })

    // Buscar informações do agente
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .eq('user_id', actualUserId)
      .single()

    if (agentError || !agent) {
      sendEvent('error', { error: 'Agente não encontrado' })
      res.end()
      return
    }

    sendEvent('agent_found', { agentName: agent.name })

    // Buscar contexto RAG
    sendEvent('searching_rag', { message: 'Buscando contexto RAG...' })
    const ragContext = await buildRAGContext(message, agentId, actualUserId)
    
    if (ragContext.hasContext) {
      sendEvent('rag_found', { chunksCount: ragContext.chunks.length })
    } else {
      sendEvent('rag_not_found', { message: 'Nenhum contexto RAG encontrado' })
    }

    // Buscar histórico de mensagens da conversa atual (se existir)
    let conversationHistory = []
    if (currentConversationId) {
      const { data: messages } = await supabase
        .from('messages')
        .select('content, role, created_at')
        .eq('conversation_id', currentConversationId)
        .order('created_at', { ascending: true })
        .limit(20) // Limitar últimas 20 mensagens para não sobrecarregar
      
      if (messages && messages.length > 0) {
        conversationHistory = messages
        console.log(`💭 Histórico encontrado: ${messages.length} mensagens`)
      }
    }

    // Gerar resposta da IA com streaming
    sendEvent('ai_generating', { message: 'Gerando resposta da IA...' })
    
    // Modificar a função generateAIResponse para usar SSE
    const aiResponse = await generateAIResponseWithSSE(agent.prompt, message, ragContext, actualUserId, agentId, sendEvent, conversationHistory)

    // Criar ou usar conversa existente
    let currentConversationId = conversationId
    if (!currentConversationId) {
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          agent_id: agentId,
          user_id: userId,
          title: `Conversa com ${agent.name}`
        })
        .select()
        .single()

      if (convError) {
        sendEvent('error', { error: 'Erro ao criar conversa' })
        res.end()
        return
      }

      currentConversationId = newConversation.id
    }

    // Salvar mensagens
    await supabase.from('messages').insert({
      conversation_id: currentConversationId,
      content: message,
      role: 'user'
    })

    const { data: aiMessage } = await supabase
      .from('messages')
      .insert({
        conversation_id: currentConversationId,
        content: aiResponse,
        role: 'assistant'
      })
      .select()
      .single()

    // Atualizar timestamp da conversa
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', currentConversationId)

    // Enviar resposta final
    sendEvent('response_complete', {
      id: aiMessage?.id || Date.now().toString(),
      content: aiResponse,
      role: 'assistant',
      timestamp: new Date().toISOString(),
      conversationId: currentConversationId
    })

    res.end()

  } catch (error) {
    console.error('❌ Erro no chat:', error)
    sendEvent('error', { error: 'Erro interno do servidor' })
    res.end()
  }
})

// Enviar mensagem para o agente (versão tradicional)
router.post('/:agentId', authenticateToken, async (req, res) => {
  try {
    const { agentId } = req.params
    const { message, conversationId, sessionId } = req.body
    const userId = req.user.id

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Mensagem é obrigatória' })
    }

    console.log(`💬 Nova mensagem para agente ${agentId}: ${message.substring(0, 100)}...`)

    // Buscar informações do agente
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .eq('user_id', userId)
      .single()

    if (agentError || !agent) {
      return res.status(404).json({ error: 'Agente não encontrado' })
    }

    // Buscar contexto RAG
    console.log('🔍 Buscando contexto RAG...')
    const ragContext = await buildRAGContext(message, agentId, userId)
    
    if (ragContext.hasContext) {
      console.log(`📚 Contexto RAG encontrado: ${ragContext.chunks.length} chunks`)
    } else {
      console.log('📚 Nenhum contexto RAG encontrado')
    }

    // Buscar histórico de mensagens da conversa atual (se existir)
    let conversationHistory = []
    if (conversationId) {
      const { data: messages } = await supabase
        .from('messages')
        .select('content, role, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(20) // Limitar últimas 20 mensagens para não sobrecarregar
      
      if (messages && messages.length > 0) {
        conversationHistory = messages
        console.log(`💭 Histórico encontrado: ${messages.length} mensagens`)
      }
    }

    // Gerar resposta da IA
    console.log('🤖 Gerando resposta da IA...')
    const aiResponse = await generateAIResponse(agent.prompt, message, ragContext, userId, agentId, req, sessionId, conversationHistory)

    // Criar ou usar conversa existente
    let currentConversationId = conversationId
    if (!currentConversationId) {
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          agent_id: agentId,
          user_id: userId,
          title: `Conversa com ${agent.name}`
        })
        .select()
        .single()

      if (convError) {
        console.error('❌ Erro ao criar conversa:', convError)
        return res.status(500).json({ error: 'Erro ao criar conversa' })
      }

      currentConversationId = newConversation.id
    }

    // Salvar mensagem do usuário
    const { error: userMsgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: currentConversationId,
        content: message,
        role: 'user'
      })

    if (userMsgError) {
      console.error('❌ Erro ao salvar mensagem do usuário:', userMsgError)
    }

    // Salvar resposta da IA
    const { data: aiMessage, error: aiMsgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: currentConversationId,
        content: aiResponse,
        role: 'assistant'
      })
      .select()
      .single()

    if (aiMsgError) {
      console.error('❌ Erro ao salvar resposta da IA:', aiMsgError)
    }

    // Atualizar timestamp da conversa
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', currentConversationId)

    console.log('✅ Resposta gerada com sucesso')

    res.json({
      id: aiMessage?.id || Date.now().toString(),
      content: aiResponse,
      role: 'assistant',
      timestamp: new Date().toISOString(),
      conversationId: currentConversationId,
      ragContext: {
        hasContext: ragContext.hasContext,
        chunksCount: ragContext.chunks.length,
        sources: ragContext.chunks.map(chunk => chunk.file_name)
      },
      toolsExecuted: req.toolsExecuted || []
    })

  } catch (error) {
    console.error('❌ Erro no chat:', error)
    
    // Se for erro da API OpenAI, retornar mensagem específica
    if (error.message.includes('OpenAI') || error.message.includes('API')) {
      return res.status(503).json({ 
        error: 'Serviço de IA temporariamente indisponível. Tente novamente em alguns instantes.',
        details: error.message
      })
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Buscar histórico de conversas
router.get('/:agentId/conversations', authenticateToken, async (req, res) => {
  try {
    const { agentId } = req.params
    const userId = req.user.id

    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        id,
        title,
        created_at,
        updated_at,
        messages (
          id,
          content,
          role,
          created_at
        )
      `)
      .eq('agent_id', agentId)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('❌ Erro ao buscar conversas:', error)
      return res.status(500).json({ error: 'Erro ao buscar conversas' })
    }

    res.json(conversations || [])
  } catch (error) {
    console.error('❌ Erro ao buscar conversas:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Buscar mensagens de uma conversa específica
router.get('/conversations/:conversationId/messages', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params
    const userId = req.user.id

    // Verificar se a conversa pertence ao usuário
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single()

    if (convError || !conversation) {
      return res.status(404).json({ error: 'Conversa não encontrada' })
    }

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('❌ Erro ao buscar mensagens:', error)
      return res.status(500).json({ error: 'Erro ao buscar mensagens' })
    }

    res.json(messages || [])
  } catch (error) {
    console.error('❌ Erro ao buscar mensagens:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Deletar conversa
router.delete('/conversations/:conversationId', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params
    const userId = req.user.id

    // Verificar se a conversa pertence ao usuário
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single()

    if (convError || !conversation) {
      return res.status(404).json({ error: 'Conversa não encontrada' })
    }

    // Deletar conversa (as mensagens serão deletadas automaticamente por CASCADE)
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId)

    if (error) {
      console.error('❌ Erro ao deletar conversa:', error)
      return res.status(500).json({ error: 'Erro ao deletar conversa' })
    }

    res.json({ message: 'Conversa deletada com sucesso' })
  } catch (error) {
    console.error('❌ Erro ao deletar conversa:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Endpoint para testar busca RAG
router.post('/:agentId/test-rag', authenticateToken, async (req, res) => {
  try {
    const { agentId } = req.params
    const { query } = req.body
    const userId = req.user.id

    if (!query) {
      return res.status(400).json({ error: 'Query é obrigatória' })
    }

    // Verificar se o agente existe e pertence ao usuário
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('id', agentId)
      .eq('user_id', userId)
      .single()

    if (agentError || !agent) {
      return res.status(404).json({ error: 'Agente não encontrado' })
    }

    // Buscar contexto RAG
    const ragContext = await buildRAGContext(query, agentId, userId)

    // Buscar estatísticas da base de conhecimento
    const { data: stats, error: statsError } = await supabase
      .from('knowledge_base')
      .select('chunks_count, file_size')
      .eq('agent_id', agentId)
      .eq('user_id', userId)

    if (statsError) {
      console.error('❌ Erro ao buscar estatísticas:', statsError)
    }

    const totalFiles = stats?.length || 0
    const totalChunks = stats?.reduce((sum, file) => sum + (file.chunks_count || 0), 0) || 0

    res.json({
      query: query,
      hasContext: ragContext.hasContext,
      context: ragContext.context,
      chunks: ragContext.chunks,
      chunksCount: ragContext.chunks.length,
      stats: {
        totalFiles,
        totalChunks
      }
    })

  } catch (error) {
    console.error('❌ Erro no teste RAG:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})


export default router
