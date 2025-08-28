import express from 'express'
import multer from 'multer'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { authenticateToken } from './auth.js'
import { supabase } from '../config/supabase.js'

// Importar bibliotecas para extração de texto (lazy loading)
let pdf, XLSX, csv

// Função para carregar bibliotecas sob demanda
async function loadLibraries() {
  if (!pdf) {
    pdf = (await import('pdf-parse')).default
  }
  if (!XLSX) {
    XLSX = (await import('xlsx')).default
  }
  if (!csv) {
    csv = (await import('csv-parser')).default
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
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/plain'
    ]
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Tipo de arquivo não suportado'), false)
    }
  }
})

// Função para extrair texto de diferentes tipos de arquivo
async function extractTextFromFile(filePath, fileType) {
  try {
    // Carregar bibliotecas necessárias
    await loadLibraries()
    
    switch (fileType) {
      case 'application/pdf':
        const dataBuffer = fs.readFileSync(filePath)
        const pdfData = await pdf(dataBuffer)
        return pdfData.text

      case 'text/csv':
        return new Promise((resolve, reject) => {
          const results = []
          fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => {
              const text = results.map(row => Object.values(row).join(' ')).join('\n')
              resolve(text)
            })
            .on('error', reject)
        })

      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      case 'application/vnd.ms-excel':
        const workbook = XLSX.readFile(filePath)
        const sheetNames = workbook.SheetNames
        let text = ''
        
        sheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
          text += jsonData.map(row => row.join(' ')).join('\n') + '\n'
        })
        
        return text

      case 'text/plain':
        return fs.readFileSync(filePath, 'utf8')

      default:
        return ''
    }
  } catch (error) {
    console.error('Erro ao extrair texto:', error)
    return ''
  }
}

// Upload de arquivo para a base de conhecimento (versão simplificada)
router.post('/:agentId/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
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

    // Extrair texto do arquivo
    const extractedText = await extractTextFromFile(file.path, file.mimetype)

    // Salvar metadados no banco de dados (sem storage)
    const { data: dbData, error: dbError } = await supabase
      .from('knowledge_base')
      .insert({
        agent_id: agentId,
        file_name: file.originalname,
        file_size: file.size,
        file_type: file.mimetype,
        file_url: `local://${file.originalname}`, // URL local para desenvolvimento
        extracted_text: extractedText,
        user_id: user.id
      })
      .select()
      .single()

    if (dbError) {
      console.error('Erro ao salvar no banco:', dbError)
      return res.status(500).json({ error: 'Erro ao salvar metadados do arquivo' })
    }

    // Limpar arquivo temporário
    fs.unlinkSync(file.path)

    res.json({
      message: 'Arquivo enviado com sucesso',
      file: {
        id: dbData.id,
        name: dbData.file_name,
        size: dbData.file_size,
        type: dbData.file_type,
        url: dbData.file_url,
        extractedTextLength: extractedText.length
      }
    })

  } catch (error) {
    console.error('Erro no upload:', error)
    
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
      .select('id, file_name, file_size, file_type, file_url, created_at')
      .eq('agent_id', agentId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (filesError) {
      console.error('Erro ao buscar arquivos:', filesError)
      return res.status(500).json({ error: 'Erro ao buscar arquivos' })
    }

    res.json(files || [])

  } catch (error) {
    console.error('Erro ao buscar arquivos:', error)
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

    // Deletar metadados do banco de dados
    const { error: dbError } = await supabase
      .from('knowledge_base')
      .delete()
      .eq('id', fileId)
      .eq('user_id', user.id)

    if (dbError) {
      console.error('Erro ao deletar do banco:', dbError)
      return res.status(500).json({ error: 'Erro ao deletar arquivo' })
    }

    res.json({ message: 'Arquivo deletado com sucesso' })

  } catch (error) {
    console.error('Erro ao deletar arquivo:', error)
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
      .select('extracted_text, file_name')
      .eq('id', fileId)
      .eq('agent_id', agentId)
      .eq('user_id', user.id)
      .single()

    if (fileError || !file) {
      return res.status(404).json({ error: 'Arquivo não encontrado' })
    }

    res.json({
      fileName: file.file_name,
      content: file.extracted_text || 'Nenhum texto extraído'
    })

  } catch (error) {
    console.error('Erro ao buscar conteúdo:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

export default router
