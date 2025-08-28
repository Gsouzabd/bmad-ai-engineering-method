import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Função para formatar bytes em formato legível
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

// Função para obter estatísticas de memória do processo
function getMemoryStats() {
  const memUsage = process.memoryUsage()
  return {
    rss: formatBytes(memUsage.rss), // Resident Set Size
    heapTotal: formatBytes(memUsage.heapTotal), // Total heap allocated
    heapUsed: formatBytes(memUsage.heapUsed), // Heap actually used
    external: formatBytes(memUsage.external), // Memory used by C++ objects
    arrayBuffers: formatBytes(memUsage.arrayBuffers || 0) // ArrayBuffers and SharedArrayBuffers
  }
}

// Função para monitorar chunks no banco
async function getChunkStats() {
  try {
    const { count, error } = await supabase
      .from('knowledge_chunks')
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.error('❌ Erro ao buscar estatísticas de chunks:', error)
      return null
    }
    
    return count
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error)
    return null
  }
}

// Função para monitorar arquivos no banco
async function getFileStats() {
  try {
    const { count, error } = await supabase
      .from('knowledge_base')
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.error('❌ Erro ao buscar estatísticas de arquivos:', error)
      return null
    }
    
    return count
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error)
    return null
  }
}

// Função principal de monitoramento
async function monitorMemory() {
  console.log('📊 Monitor de Memória e Performance')
  console.log('=====================================')
  
  // Monitorar a cada 5 segundos
  setInterval(async () => {
    const timestamp = new Date().toLocaleTimeString()
    const memoryStats = getMemoryStats()
    
    console.log(`\n🕐 ${timestamp}`)
    console.log('💾 Memória do Processo:')
    console.log(`   RSS: ${memoryStats.rss}`)
    console.log(`   Heap Total: ${memoryStats.heapTotal}`)
    console.log(`   Heap Usado: ${memoryStats.heapUsed}`)
    console.log(`   External: ${memoryStats.external}`)
    console.log(`   ArrayBuffers: ${memoryStats.arrayBuffers}`)
    
    // Buscar estatísticas do banco
    const chunkCount = await getChunkStats()
    const fileCount = await getFileStats()
    
    if (chunkCount !== null) {
      console.log(`📊 Chunks no banco: ${chunkCount.toLocaleString()}`)
    }
    
    if (fileCount !== null) {
      console.log(`📁 Arquivos no banco: ${fileCount.toLocaleString()}`)
    }
    
    // Forçar garbage collection se disponível
    if (global.gc) {
      global.gc()
      console.log('🧹 Garbage collection executado')
    }
    
  }, 5000)
}

// Função para monitorar durante o processamento de um arquivo específico
async function monitorFileProcessing(fileId) {
  console.log(`🔍 Monitorando processamento do arquivo: ${fileId}`)
  
  let lastChunkCount = 0
  
  const interval = setInterval(async () => {
    try {
      // Buscar chunks específicos do arquivo
      const { count, error } = await supabase
        .from('knowledge_chunks')
        .select('*', { count: 'exact', head: true })
        .eq('file_id', fileId)
      
      if (error) {
        console.error('❌ Erro ao buscar chunks do arquivo:', error)
        return
      }
      
      const currentChunkCount = count || 0
      const newChunks = currentChunkCount - lastChunkCount
      
      if (newChunks > 0) {
        console.log(`📈 Novos chunks processados: +${newChunks} (Total: ${currentChunkCount})`)
        lastChunkCount = currentChunkCount
      }
      
      // Verificar se o processamento terminou
      const { data: fileData } = await supabase
        .from('knowledge_base')
        .select('extracted_text')
        .eq('id', fileId)
        .single()
      
      if (fileData && !fileData.extracted_text.includes('Processando')) {
        console.log('✅ Processamento do arquivo concluído!')
        clearInterval(interval)
      }
      
    } catch (error) {
      console.error('❌ Erro no monitoramento:', error)
    }
  }, 2000)
}

// Executar se chamado diretamente
const args = process.argv.slice(2)

if (args.length > 0 && args[0] === '--file') {
  const fileId = args[1]
  if (fileId) {
    monitorFileProcessing(fileId)
  } else {
    console.error('❌ ID do arquivo não fornecido')
    console.log('Uso: node memory-monitor.js --file <file_id>')
  }
} else {
  monitorMemory()
}

export { 
  monitorMemory, 
  monitorFileProcessing, 
  getMemoryStats,
  getChunkStats,
  getFileStats
}
