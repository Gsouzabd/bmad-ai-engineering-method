import express from 'express';
import { supabase } from '../config/supabase.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import CryptoJS from 'crypto-js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Configuração do Google AI (usando Gemini)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || 'sua_google_ai_api_key_aqui');

// Chave de criptografia
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-secret-key-32-chars-long!';

// Função para descriptografar dados
const decrypt = (ciphertext) => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

// Middleware para autenticação
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token de autenticação necessário' });
    }

    const token = authHeader.split(' ')[1];
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Função para obter credenciais do usuário
const getUserCredentials = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_credentials')
      .select('*')
      .eq('user_id', userId)
      .eq('is_valid', true)
      .single();

    if (error || !data) {
      throw new Error('Credenciais não encontradas ou inválidas');
    }

    return {
      clientId: data.client_id,
      clientSecret: decrypt(data.client_secret),
      refreshToken: decrypt(data.refresh_token),
      accessToken: decrypt(data.access_token)
    };
  } catch (error) {
    throw new Error('Erro ao obter credenciais: ' + error.message);
  }
};

// Função para registrar log de permissão
const logPermission = async (userId, agentId, toolName, toolDescription, permissionGranted) => {
  try {
    await supabase
      .from('permission_logs')
      .insert({
        user_id: userId,
        agent_id: agentId,
        tool_name: toolName,
        tool_description: toolDescription,
        permission_granted: permissionGranted
      });
  } catch (error) {
    console.error('Erro ao registrar log de permissão:', error);
  }
};

// Função para interpretar comando do usuário
const interpretCommand = async (userMessage, agentContext) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
Você é um assistente que interpreta comandos do usuário e decide se deve executar uma ferramenta MCP ou apenas responder.

Comandos disponíveis:
- gdrive.list_files: Listar arquivos no Google Drive
- sheets.read_values: Ler dados de uma planilha do Google Sheets
- sheets.write_values: Escrever dados em uma planilha do Google Sheets

Contexto do agente: ${agentContext}

Comando do usuário: "${userMessage}"

Responda apenas com um JSON no formato:
{
  "action": "tool" ou "ask",
  "tool": "nome_do_tool" (se action for "tool"),
  "toolDescription": "descrição clara do que será feito",
  "params": {} (parâmetros necessários para o tool),
  "message": "resposta para o usuário" (se action for "ask")
}

Exemplos:
- "Liste arquivos no Drive" → {"action": "tool", "tool": "gdrive.list_files", "toolDescription": "Listar todos os arquivos no Google Drive", "params": {}}
- "Ler células A1:B10 da planilha X" → {"action": "tool", "tool": "sheets.read_values", "toolDescription": "Ler células A1:B10 da planilha X", "params": {"spreadsheetId": "X", "range": "A1:B10"}}
- "Como você está?" → {"action": "ask", "message": "Estou funcionando perfeitamente! Como posso ajudá-lo hoje?"}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extrair JSON da resposta
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Resposta inválida do modelo');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Erro ao interpretar comando:', error);
    return {
      action: 'ask',
      message: 'Desculpe, não consegui entender seu comando. Pode reformular?'
    };
  }
};

// POST /api/mcp/interpret - Interpretar comando do usuário
router.post('/interpret', authenticateUser, async (req, res) => {
  try {
    const { message, agentId, agentContext } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Mensagem é obrigatória' });
    }

    const interpretation = await interpretCommand(message, agentContext || '');
    
    res.json(interpretation);
  } catch (error) {
    console.error('Erro ao interpretar comando:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// POST /api/mcp/request-permission - Solicitar permissão para executar tool
router.post('/request-permission', authenticateUser, async (req, res) => {
  try {
    const { agentId, toolName, toolDescription } = req.body;

    if (!agentId || !toolName || !toolDescription) {
      return res.status(400).json({ 
        message: 'Agent ID, tool name e tool description são obrigatórios' 
      });
    }

    // Verificar se o usuário tem credenciais válidas
    try {
      await getUserCredentials(req.user.id);
    } catch (error) {
      return res.status(400).json({ 
        message: 'Credenciais Google não configuradas. Configure-as primeiro.' 
      });
    }

    // Gerar ID único para a solicitação
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Em uma implementação real, você usaria WebSocket ou Server-Sent Events
    // para notificar o frontend em tempo real
    // Por enquanto, retornamos os dados para o frontend exibir o modal

    res.json({
      requestId,
      toolName,
      toolDescription,
      requiresPermission: true
    });

  } catch (error) {
    console.error('Erro ao solicitar permissão:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// POST /api/mcp/execute - Executar tool após permissão
router.post('/execute', authenticateUser, async (req, res) => {
  try {
    const { agentId, toolName, toolDescription, permissionGranted, params } = req.body;

    if (!agentId || !toolName || !toolDescription) {
      return res.status(400).json({ 
        message: 'Agent ID, tool name e tool description são obrigatórios' 
      });
    }

    // Registrar log de permissão
    await logPermission(req.user.id, agentId, toolName, toolDescription, permissionGranted);

    if (!permissionGranted) {
      return res.json({
        success: false,
        message: 'Ação cancelada pelo usuário'
      });
    }

    // Obter credenciais do usuário
    const credentials = await getUserCredentials(req.user.id);

    // Executar tool baseado no tipo
    let result;
    switch (toolName) {
      case 'gdrive.list_files':
        result = await executeGDriveListFiles(credentials, params);
        break;
      case 'sheets.read_values':
        result = await executeSheetsReadValues(credentials, params);
        break;
      case 'sheets.write_values':
        result = await executeSheetsWriteValues(credentials, params);
        break;
      default:
        throw new Error(`Tool não suportado: ${toolName}`);
    }

    res.json({
      success: true,
      result,
      message: 'Tool executado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao executar tool:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao executar tool: ' + error.message 
    });
  }
});

// Função para executar gdrive.list_files
const executeGDriveListFiles = async (credentials, params) => {
  try {
    const { google } = await import('googleapis');
    
    const oauth2Client = new google.auth.OAuth2(
      credentials.clientId,
      credentials.clientSecret
    );
    
    oauth2Client.setCredentials({
      access_token: credentials.accessToken,
      refresh_token: credentials.refreshToken
    });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    const response = await drive.files.list({
      pageSize: params.pageSize || 10,
      fields: 'files(id,name,mimeType,createdTime,modifiedTime)',
      orderBy: 'modifiedTime desc'
    });

    return {
      files: response.data.files,
      total: response.data.files.length
    };
  } catch (error) {
    throw new Error('Erro ao listar arquivos do Drive: ' + error.message);
  }
};

// Função para executar sheets.read_values
const executeSheetsReadValues = async (credentials, params) => {
  try {
    const { google } = await import('googleapis');
    
    const oauth2Client = new google.auth.OAuth2(
      credentials.clientId,
      credentials.clientSecret
    );
    
    oauth2Client.setCredentials({
      access_token: credentials.accessToken,
      refresh_token: credentials.refreshToken
    });

    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: params.spreadsheetId,
      range: params.range || 'A1:Z1000'
    });

    return {
      values: response.data.values,
      range: response.data.range,
      majorDimension: response.data.majorDimension
    };
  } catch (error) {
    throw new Error('Erro ao ler dados da planilha: ' + error.message);
  }
};

// Função para executar sheets.write_values
const executeSheetsWriteValues = async (credentials, params) => {
  try {
    const { google } = await import('googleapis');
    
    const oauth2Client = new google.auth.OAuth2(
      credentials.clientId,
      credentials.clientSecret
    );
    
    oauth2Client.setCredentials({
      access_token: credentials.accessToken,
      refresh_token: credentials.refreshToken
    });

    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
    
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: params.spreadsheetId,
      range: params.range,
      valueInputOption: 'RAW',
      resource: {
        values: params.values
      }
    });

    return {
      updatedRange: response.data.updatedRange,
      updatedRows: response.data.updatedRows,
      updatedColumns: response.data.updatedColumns,
      updatedCells: response.data.updatedCells
    };
  } catch (error) {
    throw new Error('Erro ao escrever dados na planilha: ' + error.message);
  }
};

// GET /api/mcp/permission-logs - Buscar logs de permissão
router.get('/permission-logs', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('permission_logs')
      .select(`
        *,
        agents(name)
      `)
      .eq('user_id', req.user.id)
      .order('executed_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar logs de permissão:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

export default router;
