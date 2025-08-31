import express from 'express'
import multer from 'multer'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { authenticateToken } from './auth.js'
import { supabase, STORAGE_BUCKET } from '../config/supabase.js'
import OpenAI from 'openai'
import dotenv from 'dotenv'

// Carregar variáveis de ambiente
dotenv.config()

// Configurar OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sua_openai_api_key_aqui'
})

// Importar bibliotecas para extração de texto (lazy loading)
let pdf, XLSX, csv

// Função para carregar bibliotecas sob demanda
async function loadLibraries() {
  try {
    if (!pdf) {
      pdf = (await import('pdf-parse')).default
    }
    if (!XLSX) {
      XLSX = (await import('xlsx')).default
    }
    if (!csv) {
      csv = (await import('csv-parser')).default
    }
  } catch (error) {
    console.error('❌ Erro ao carregar bibliotecas:', error)
    throw error
  }
}

const router = express.Router()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configurar multer para upload temporário
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'text/csv',
      'text/plain'
    ]
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Tipo de arquivo não suportado. Use PDF, CSV ou TXT.'), false)
    }
  }
})

// =====================================================
// FUNÇÕES RAG (RETRIEVAL-AUGMENTED GENERATION)
// =====================================================

/**
 * Extrai texto de arquivo usando streaming para economizar memória
 */
async function extractTextFromFile(filePath, fileType) {
  if (!fs.existsSync(filePath)) {
    throw new Error('Arquivo não encontrado')
  }

  try {
    if (fileType === 'application/pdf') {
      return await extractTextFromPDFStream(filePath)
    } else if (fileType.includes('text/') || fileType.includes('application/json')) {
      return await extractTextFromTextFile(filePath)
    } else if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
      return await extractTextFromExcelFile(filePath)
    } else {
      throw new Error(`Tipo de arquivo não suportado: ${fileType}`)
    }
  } catch (error) {
    console.error('❌ Erro na extração de texto:', error)
    throw error
  }
}

/**
 * Extrai texto de PDF usando streaming e processamento otimizado
 */
async function extractTextFromPDFStream(filePath) {
  try {
    // Usar pdf-parse que já está instalado e é compatível com ES modules
    const pdfParse = (await import('pdf-parse')).default
    
    // Ler arquivo em chunks para economizar memória
    const dataBuffer = fs.readFileSync(filePath)
    console.log(`📄 PDF carregado: ${dataBuffer.length} bytes`)
    
    // Processar PDF com configurações otimizadas
    const pdfData = await pdfParse(dataBuffer, {
      normalizeWhitespace: true,
      disableCombineTextItems: false,
      max: 0 // Sem limite de páginas
    })
    
    const extractedText = pdfData.text || ''
    console.log(`✅ PDF processado: ${extractedText.length} caracteres`)
    
    // Forçar garbage collection após processamento
    if (global.gc) {
      global.gc()
    }
    
    return extractedText
  } catch (error) {
    console.error('❌ Erro ao processar PDF:', error)
    throw error
  }
}



/**
 * Extrai texto de arquivo de texto usando streaming
 */
async function extractTextFromTextFile(filePath) {
  return new Promise((resolve, reject) => {
    const chunks = []
    const stream = fs.createReadStream(filePath, { encoding: 'utf8' })
    
    stream.on('data', (chunk) => {
      chunks.push(chunk)
    })
    
    stream.on('end', () => {
      resolve(chunks.join(''))
    })
    
    stream.on('error', (error) => {
      reject(error)
    })
  })
}

/**
 * Extrai texto de arquivo Excel (simplificado - retorna mensagem informativa)
 */
async function extractTextFromExcelFile(filePath) {
  console.log('📊 Arquivo Excel detectado - extração simplificada')
  return 'Arquivo Excel carregado. Para extração completa de dados tabulares, considere converter para CSV ou usar ferramentas específicas para Excel.'
}

/**
 * Gera chunks de texto incrementalmente usando generator para economizar memória
 */
function* splitTextIntoChunksGenerator(text, chunkSize = 1000, overlap = 200) {
  if (!text || text.trim().length === 0) {
    console.log('⚠️ Texto vazio ou nulo, retornando sem chunks')
    return
  }

  console.log(`🔪 Iniciando divisão de texto em chunks (${text.length} chars, chunkSize: ${chunkSize}, overlap: ${overlap})`)
  
  let start = 0
  let chunkCount = 0
  const seenChunks = new Set() // Para evitar chunks duplicados
  
  while (start < text.length) {
    let end = Math.min(start + chunkSize, text.length)
    let chunk = text.substring(start, end)
    
    // Se não é o último chunk, tentar quebrar em uma palavra completa
    if (end < text.length) {
      const lastSpace = chunk.lastIndexOf(' ')
      if (lastSpace > chunkSize * 0.8) {
        chunk = chunk.substring(0, lastSpace)
        end = start + lastSpace
      }
    }
    
    const trimmedChunk = chunk.trim()
    
    // Validar tamanho do chunk (limite de tokens para embeddings)
    if (trimmedChunk.length > 50 && trimmedChunk.length <= 3000 && !seenChunks.has(trimmedChunk)) {
      seenChunks.add(trimmedChunk)
      chunkCount++
      console.log(`🔪 Gerando chunk ${chunkCount} (${trimmedChunk.length} chars)`)
      yield trimmedChunk
    }
    
    // Próximo chunk com overlap
    start = end - overlap
    if (start >= text.length) break
  }
  
  console.log(`✅ Divisão concluída: ${chunkCount} chunks únicos gerados`)
}

/**
 * Divide o texto em chunks para processamento (versão ultra simplificada)
 */
function splitTextIntoChunks(text, chunkSize = 1000, overlap = 200) {
  if (!text || text.trim().length === 0) {
    console.log('⚠️ Texto vazio ou nulo, retornando array vazio')
    return []
  }

  console.log(`🔪 Iniciando divisão de texto em chunks (${text.length} chars, chunkSize: ${chunkSize}, overlap: ${overlap})`)
  
  const chunks = []
  let start = 0
  let chunkCount = 0
  
  // ALGORITMO SIMPLIFICADO: sem overlap complexo
  while (start < text.length) {
    let end = Math.min(start + chunkSize, text.length)
    let chunk = text.substring(start, end)
    
    // Quebrar em palavra completa se possível
    if (end < text.length) {
      const lastSpace = chunk.lastIndexOf(' ')
      if (lastSpace > chunkSize * 0.7) {
        chunk = chunk.substring(0, lastSpace)
        end = start + lastSpace
      }
    }
    
    const trimmedChunk = chunk.trim()
    
    // Adicionar chunk se for válido
    if (trimmedChunk.length > 50 && trimmedChunk.length <= 3000) {
      chunks.push(trimmedChunk)
      chunkCount++
      console.log(`🔪 Gerando chunk ${chunkCount} (${trimmedChunk.length} chars)`)
    }
    
    // Avançar para o próximo chunk (sem overlap para evitar loops)
    start = end
    
    // Parar se chegou ao final
    if (start >= text.length) break
  }
  
  console.log(`✅ Divisão concluída: ${chunkCount} chunks gerados`)
  console.log(`🔍 DEBUG: Retornando array com ${chunks.length} chunks`)
  return chunks
}

/**
 * Gera embeddings para múltiplos textos usando OpenAI (otimizado para batches grandes)
 */
async function generateEmbeddingsBatch(texts) {
  try {
    console.log(`🔍 TESTE: generateEmbeddingsBatch iniciado com ${texts.length} textos`)
    
    // Validar tamanho dos textos antes de enviar
    console.log(`🔍 TESTE: Validando tamanhos dos textos...`)
    const validTexts = texts.filter(text => {
      if (text.length > 3000) {
        console.warn(`⚠️ Chunk muito grande (${text.length} chars), pulando`)
        return false
      }
      return true
    })
    
    console.log(`🔍 TESTE: ${validTexts.length} textos válidos encontrados`)
    
    if (validTexts.length === 0) {
      console.warn('⚠️ Nenhum chunk válido para processar')
      return []
    }
    
    if (validTexts.length !== texts.length) {
      console.log(`📊 Processando ${validTexts.length}/${texts.length} chunks válidos`)
    }
    
    // Tentar primeiro com text-embedding-3-large (3072 dimensões)
    // Se falhar, usar text-embedding-3-small (1536 dimensões)
    console.log(`🔍 TESTE: Chamando OpenAI API...`)
    let response
    try {
      console.log(`🔍 TESTE: Tentando text-embedding-3-large...`)
      response = await openai.embeddings.create({
        model: 'text-embedding-3-large',
        input: validTexts,
        encoding_format: 'float'
      })
      console.log(`✅ TESTE: text-embedding-3-large funcionou`)
    } catch (error) {
      console.warn('⚠️ text-embedding-3-large falhou, tentando text-embedding-3-small...')
      console.log(`🔍 TESTE: Tentando text-embedding-3-small...`)
      response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: validTexts,
        encoding_format: 'float'
      })
      console.log(`✅ TESTE: text-embedding-3-small funcionou`)
    }
    
    const embeddings = response.data.map(item => item.embedding)
    
    // Se alguns chunks foram filtrados, adicionar embeddings vazios para manter índices
    if (validTexts.length < texts.length) {
      const result = []
      let validIndex = 0
      for (let i = 0; i < texts.length; i++) {
        if (texts[i].length <= 3000) {
          result.push(embeddings[validIndex])
          validIndex++
        } else {
          // Embedding vazio para chunks muito grandes
          result.push(new Array(embeddings[0]?.length || 1536).fill(0))
        }
      }
      return result
    }
    
    return embeddings
  } catch (error) {
    console.error('❌ Erro ao gerar embeddings em lote:', error)
    
    // Em caso de erro, tentar processar chunks individualmente
    console.log('🔄 Tentando processar chunks individualmente...')
    const individualEmbeddings = []
    
    for (const text of texts) {
      try {
        if (text.length <= 3000) {
          const embedding = await generateEmbeddings(text)
          individualEmbeddings.push(embedding)
        } else {
          individualEmbeddings.push(new Array(1536).fill(0))
        }
      } catch (individualError) {
        console.error(`❌ Erro ao processar chunk individual:`, individualError)
        individualEmbeddings.push(new Array(1536).fill(0))
      }
    }
    
    return individualEmbeddings
  }
}

/**
 * Gera embedding para um texto único (mantido para compatibilidade)
 */
async function generateEmbeddings(text) {
  const embeddings = await generateEmbeddingsBatch([text])
  return embeddings[0]
}

/**
 * Processa arquivo completo usando streaming e processamento incremental
 */
async function processFileForRAG(filePath, fileType, agentId, userId, fileId) {
  console.log(`🔄 Processando arquivo para RAG: ${filePath}`)
  
  // 1. Extrair texto
  const extractedText = await extractTextFromFile(filePath, fileType)
  if (!extractedText || extractedText.trim().length === 0) {
    throw new Error('Nenhum texto extraído do arquivo')
  }
  
  console.log(`✅ Texto extraído: ${extractedText.length} caracteres`)
  
  // 2. Processar chunks incrementalmente para economizar memória
  let processedChunks = 0
  let totalChunks = 0
  let currentBatch = []
  
  console.log('🔄 Iniciando processamento incremental de chunks...')
  
  // Processar todos os chunks
  console.log(`🔍 Processando todos os chunks...`)
  const chunks = splitTextIntoChunks(extractedText, 500, 100)
  console.log(`📊 Total de chunks gerados: ${chunks.length}`)
  
  // Processar chunks em lotes
  const batchSize = 3 // Lotes pequenos para melhor controle
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize)
    console.log(`🔄 Processando lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)} (${batch.length} chunks)`)
    
    try {
      await processChunkBatch(batch, agentId, userId, fileId, i)
      processedChunks += batch.length
      console.log(`✅ Lote ${Math.floor(i / batchSize) + 1} processado com sucesso`)
    } catch (error) {
      console.error(`❌ Erro ao processar lote ${Math.floor(i / batchSize) + 1}:`, error)
      throw error
    }
    
    // Garbage collection explícito
    if (global.gc) {
      global.gc()
    }
  }
  
  console.log(`✅ Processamento concluído: ${processedChunks} chunks salvos`)
  
  return {
    totalChunks: totalChunks,
    processedChunks: processedChunks,
    totalCharacters: extractedText.length
  }
}

/**
 * Processa um lote de chunks (otimizado para memória)
 */
async function processChunkBatch(chunks, agentId, userId, fileId, startIndex) {
  try {
    console.log(`🤖 Processando lote de ${chunks.length} chunks`)
    console.log(`🔍 TESTE: Parâmetros recebidos - agentId: ${agentId}, userId: ${userId}, fileId: ${fileId}, startIndex: ${startIndex}`)
    
    // Gerar embeddings para o lote
    console.log(`🔍 TESTE: Vou chamar generateEmbeddingsBatch...`)
    const embeddings = await generateEmbeddingsBatch(chunks)
    console.log(`✅ TESTE: generateEmbeddingsBatch retornou ${embeddings.length} embeddings`)
    
    // Preparar dados para inserção em lote (sem duplicar objetos grandes)
    console.log(`📝 Preparando dados para inserção...`)
    const chunksToInsert = chunks.map((chunk, index) => ({
      agent_id: agentId,
      user_id: userId,
      file_id: fileId,
      chunk_index: startIndex + index,
      content: chunk.replace(/\0/g, ''), // Remover caracteres nulos
      embedding: embeddings[index]
    }))
    console.log(`✅ Dados preparados`)
    
    // Inserir lote no banco (sem upsert por enquanto)
    console.log(`💾 Inserindo no banco...`)
    const { error: insertError } = await supabase
      .from('knowledge_chunks')
      .insert(chunksToInsert)
    
    if (insertError) {
      console.error(`❌ Erro ao salvar lote:`, insertError)
      throw insertError
    }
    
    console.log(`💾 Lote salvo (${chunks.length} chunks)`)
    
    // Pausa mínima entre lotes
    await new Promise(resolve => setTimeout(resolve, 50))
    
  } catch (error) {
    console.error(`❌ Erro ao processar lote:`, error)
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
      match_threshold: 0.7,
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
// ENDPOINTS DA API
// =====================================================

// Upload de arquivo para a base de conhecimento
router.post('/:agentId/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    console.log('📤 Upload recebido para RAG')
    console.log('👤 Usuário:', req.user?.id)
    console.log('🤖 Agent ID:', req.params.agentId)
    console.log('📄 Arquivo:', req.file?.originalname, req.file?.mimetype, req.file?.size)
    
    const { agentId } = req.params
    const { user } = req
    const file = req.file

    if (!file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' })
    }

    // Verificar se o agente existe e pertence ao usuário
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('id', agentId)
      .eq('user_id', user.id)
      .single()

    if (agentError || !agent) {
      return res.status(404).json({ error: 'Agente não encontrado' })
    }

    // Gerar nome único para o arquivo
    const fileExtension = path.extname(file.originalname)
    const fileName = `${uuidv4()}${fileExtension}`
    const filePath = `agents/${agentId}/${fileName}`

    // Fazer upload para o Supabase Storage
    let publicUrl = ''
    try {
      const fileBuffer = fs.readFileSync(file.path)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, fileBuffer, {
          contentType: file.mimetype,
          upsert: false
        })

      if (uploadError) {
        console.error('❌ Erro no upload para storage:', uploadError)
        return res.status(500).json({ error: 'Erro no upload do arquivo' })
      }

      // Obter URL pública do arquivo
      const { data: { publicUrl: url } } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath)
      publicUrl = url
    } catch (error) {
      console.error('❌ Erro no upload para storage:', error)
      return res.status(500).json({ error: 'Erro no upload do arquivo' })
    }

    // Salvar metadados no banco de dados primeiro
    const { data: dbData, error: dbError } = await supabase
      .from('knowledge_base')
      .insert({
        agent_id: agentId,
        file_name: file.originalname,
        file_size: file.size,
        file_type: file.mimetype,
        file_url: publicUrl,
        extracted_text: 'Processando para RAG...',
        user_id: user.id,
        chunks_count: 0
      })
      .select()
      .single()

    if (dbError) {
      console.error('❌ Erro ao salvar metadados:', dbError)
      // Tentar deletar o arquivo do storage se falhou no banco
      await supabase.storage.from(STORAGE_BUCKET).remove([filePath])
      return res.status(500).json({ error: 'Erro ao salvar metadados do arquivo' })
    }

    // Limpar chunks existentes para este arquivo (se houver reprocessamento)
    console.log('🧹 Limpando chunks existentes para este arquivo...')
    const { error: deleteError } = await supabase
      .from('knowledge_chunks')
      .delete()
      .eq('file_id', dbData.id)
    
    if (deleteError) {
      console.warn('⚠️ Erro ao limpar chunks existentes:', deleteError)
    } else {
      console.log('✅ Chunks existentes removidos')
    }

    // Processar arquivo para RAG
    let processingResult
    try {
      processingResult = await processFileForRAG(file.path, file.mimetype, agentId, user.id, dbData.id)
    } catch (processingError) {
      console.error('❌ Erro no processamento RAG:', processingError)
      
      // Deletar arquivo do storage e metadados se processamento falhou
      await supabase.storage.from(STORAGE_BUCKET).remove([filePath])
      await supabase.from('knowledge_base').delete().eq('id', dbData.id)
      
      return res.status(500).json({ 
        error: 'Erro no processamento do arquivo',
        details: processingError.message 
      })
    }

    // Atualizar metadados com informações do processamento
    const { error: updateError } = await supabase
      .from('knowledge_base')
      .update({
        extracted_text: `Processado para RAG: ${processingResult.totalChunks} chunks, ${processingResult.totalCharacters} caracteres`,
        chunks_count: processingResult.processedChunks
      })
      .eq('id', dbData.id)

    if (updateError) {
      console.error('❌ Erro ao atualizar metadados:', updateError)
    }

    // Limpar arquivo temporário
    fs.unlinkSync(file.path)

    res.json({
      message: 'Arquivo processado com sucesso para RAG',
      file: {
        id: dbData.id,
        name: dbData.file_name,
        size: dbData.file_size,
        type: dbData.file_type,
        url: dbData.file_url,
        chunksCount: processingResult.processedChunks,
        totalCharacters: processingResult.totalCharacters
      }
    })

  } catch (error) {
    console.error('❌ Erro no upload:', error)
    
    // Limpar arquivo temporário se existir
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path)
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Listar arquivos da base de conhecimento
router.get('/:agentId/files', authenticateToken, async (req, res) => {
  try {
    const { agentId } = req.params
    const { user } = req

    // Verificar se o agente existe e pertence ao usuário
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('id', agentId)
      .eq('user_id', user.id)
      .single()

    if (agentError || !agent) {
      return res.status(404).json({ error: 'Agente não encontrado' })
    }

    // Buscar arquivos no banco de dados
    const { data: files, error: filesError } = await supabase
      .from('knowledge_base')
      .select('id, file_name, file_size, file_type, file_url, created_at, chunks_count')
      .eq('agent_id', agentId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (filesError) {
      console.error('❌ Erro ao buscar arquivos:', filesError)
      return res.status(500).json({ error: 'Erro ao buscar arquivos' })
    }

    res.json(files || [])

  } catch (error) {
    console.error('❌ Erro ao buscar arquivos:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Deletar arquivo da base de conhecimento
router.delete('/:agentId/files/:fileId', authenticateToken, async (req, res) => {
  try {
    const { agentId, fileId } = req.params
    const { user } = req

    // Verificar se o arquivo existe e pertence ao usuário
    const { data: file, error: fileError } = await supabase
      .from('knowledge_base')
      .select('*')
      .eq('id', fileId)
      .eq('agent_id', agentId)
      .eq('user_id', user.id)
      .single()

    if (fileError || !file) {
      return res.status(404).json({ error: 'Arquivo não encontrado' })
    }

    // Deletar chunks relacionados
    const { error: chunksError } = await supabase
      .from('knowledge_chunks')
      .delete()
      .eq('agent_id', agentId)
      .eq('user_id', user.id)
      .eq('file_id', fileId)

    if (chunksError) {
      console.error('❌ Erro ao deletar chunks:', chunksError)
    }

    // Deletar do Supabase Storage
    if (!file.file_url.includes('storage.example.com')) {
      try {
        const urlParts = file.file_url.split('/')
        const filePath = urlParts.slice(urlParts.indexOf(STORAGE_BUCKET) + 1).join('/')

        const { error: storageError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .remove([filePath])

        if (storageError) {
          console.error('❌ Erro ao deletar do storage:', storageError)
        }
      } catch (error) {
        console.error('❌ Erro ao deletar do storage:', error)
      }
    }

    // Deletar metadados do banco de dados
    const { error: dbError } = await supabase
      .from('knowledge_base')
      .delete()
      .eq('id', fileId)
      .eq('user_id', user.id)

    if (dbError) {
      console.error('❌ Erro ao deletar do banco:', dbError)
      return res.status(500).json({ error: 'Erro ao deletar arquivo' })
    }

    res.json({ message: 'Arquivo e chunks deletados com sucesso' })

  } catch (error) {
    console.error('❌ Erro ao deletar arquivo:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Buscar conteúdo de um arquivo
router.get('/:agentId/files/:fileId/content', authenticateToken, async (req, res) => {
  try {
    const { agentId, fileId } = req.params
    const { user } = req

    // Verificar se o arquivo existe e pertence ao usuário
    const { data: file, error: fileError } = await supabase
      .from('knowledge_base')
      .select('extracted_text, file_name, chunks_count')
      .eq('id', fileId)
      .eq('agent_id', agentId)
      .eq('user_id', user.id)
      .single()

    if (fileError || !file) {
      return res.status(404).json({ error: 'Arquivo não encontrado' })
    }

    // Buscar chunks do arquivo
    const { data: chunks, error: chunksError } = await supabase
      .from('knowledge_chunks')
      .select('chunk_index, content')
      .eq('file_id', fileId)
      .eq('agent_id', agentId)
      .eq('user_id', user.id)
      .order('chunk_index', { ascending: true })

    if (chunksError) {
      console.error('❌ Erro ao buscar chunks:', chunksError)
    }

    res.json({
      fileName: file.file_name,
      summary: file.extracted_text,
      chunksCount: file.chunks_count,
      chunks: chunks || []
    })

  } catch (error) {
    console.error('❌ Erro ao buscar conteúdo:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Endpoint para buscar contexto RAG (usado pelo chat)
router.post('/:agentId/search', authenticateToken, async (req, res) => {
  try {
    const { agentId } = req.params
    const { user } = req
    const { query, limit = 5 } = req.body

    if (!query) {
      return res.status(400).json({ error: 'Query é obrigatória' })
    }

    // Verificar se o agente existe e pertence ao usuário
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('id', agentId)
      .eq('user_id', user.id)
      .single()

    if (agentError || !agent) {
      return res.status(404).json({ error: 'Agente não encontrado' })
    }

    // Buscar contexto RAG
    const ragContext = await buildRAGContext(query, agentId, user.id)

    res.json({
      query: query,
      hasContext: ragContext.hasContext,
      context: ragContext.context,
      chunks: ragContext.chunks,
      chunksCount: ragContext.chunks.length
    })

  } catch (error) {
    console.error('❌ Erro na busca RAG:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Endpoint para estatísticas da base de conhecimento
router.get('/:agentId/stats', authenticateToken, async (req, res) => {
  try {
    const { agentId } = req.params
    const { user } = req

    // Verificar se o agente existe e pertence ao usuário
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('id', agentId)
      .eq('user_id', user.id)
      .single()

    if (agentError || !agent) {
      return res.status(404).json({ error: 'Agente não encontrado' })
    }

    // Buscar estatísticas
    const { data: files, error: filesError } = await supabase
      .from('knowledge_base')
      .select('chunks_count, file_size')
      .eq('agent_id', agentId)
      .eq('user_id', user.id)

    if (filesError) {
      console.error('❌ Erro ao buscar estatísticas:', filesError)
      return res.status(500).json({ error: 'Erro ao buscar estatísticas' })
    }

    const totalFiles = files.length
    const totalChunks = files.reduce((sum, file) => sum + (file.chunks_count || 0), 0)
    const totalSize = files.reduce((sum, file) => sum + (file.file_size || 0), 0)

    res.json({
      totalFiles,
      totalChunks,
      totalSize,
      averageChunksPerFile: totalFiles > 0 ? Math.round(totalChunks / totalFiles) : 0
    })

  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

export default router
