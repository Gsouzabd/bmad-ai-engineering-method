import express from 'express'
import { authenticateToken } from './auth.js'
import { supabase } from '../config/supabase.js'
import OpenAI from 'openai'
import dotenv from 'dotenv'

// Carregar variáveis de ambiente
dotenv.config()

// Configurar OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sua_openai_api_key_aqui'
})

const router = express.Router()

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
 * Gera resposta usando OpenAI com contexto RAG
 */
async function generateAIResponse(prompt, message, ragContext = null) {
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

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: message
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    })

    return response.choices[0].message.content
  } catch (error) {
    console.error('❌ Erro ao gerar resposta da IA:', error)
    throw error
  }
}

// =====================================================
// ENDPOINTS DA API
// =====================================================

// Enviar mensagem para o agente
router.post('/:agentId', authenticateToken, async (req, res) => {
  try {
    const { agentId } = req.params
    const { message, conversationId } = req.body
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

    // Gerar resposta da IA
    console.log('🤖 Gerando resposta da IA...')
    const aiResponse = await generateAIResponse(agent.prompt, message, ragContext)

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
      }
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
