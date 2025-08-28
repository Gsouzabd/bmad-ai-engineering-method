import express from 'express';
import { google } from 'googleapis';
import { supabase } from '../config/supabase.js';
import CryptoJS from 'crypto-js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Configuração OAuth2
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:5000/api/oauth/callback'
);

// Chave de criptografia
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-secret-key-32-chars-long!';

// Função para criptografar dados
const encrypt = (text) => {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
};

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
    
    // Em desenvolvimento, permitir tokens mock
    if ((process.env.NODE_ENV === 'development' || !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder')) && token === 'mock_token') {
      req.user = { id: '55ccaa1e-34a2-42a2-ba1f-32dfb7c6320c', email: 'dev@example.com' }
      return next()
    }
    
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

// GET /api/oauth/auth - Iniciar fluxo OAuth2
router.get('/auth', authenticateUser, async (req, res) => {
  try {
    // Buscar credenciais do usuário
    const { data: credentials, error } = await supabase
      .from('user_credentials')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (error || !credentials) {
      return res.status(400).json({ 
        message: 'Credenciais não configuradas. Configure suas credenciais OAuth2 primeiro.' 
      });
    }

    // Descriptografar client secret
    const clientSecret = decrypt(credentials.client_secret);

    // Configurar OAuth2 com as credenciais do usuário
    const userOAuth2Client = new google.auth.OAuth2(
      credentials.client_id,
      clientSecret,
      'http://localhost:5000/api/oauth/callback'
    );

    // Escopos necessários para Google Drive e Sheets
    const scopes = [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/userinfo.email'
    ];

    // Gerar URL de autorização
    const authUrl = userOAuth2Client.generateAuthUrl({
      access_type: 'offline', // Importante para obter refresh token
      scope: scopes,
      prompt: 'consent', // Força o consentimento para obter refresh token
      state: req.user.id // Passar user ID como state para segurança
    });

    res.json({ 
      authUrl,
      message: 'Redirecione o usuário para esta URL para autorizar o acesso'
    });
  } catch (error) {
    console.error('Erro ao gerar URL de autorização:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// GET /api/oauth/callback - Callback do OAuth2
router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code) {
      return res.status(400).json({ message: 'Código de autorização não fornecido' });
    }

    // Buscar credenciais do usuário
    const { data: credentials, error: credError } = await supabase
      .from('user_credentials')
      .select('*')
      .eq('user_id', state)
      .single();

    if (credError || !credentials) {
      console.error('Credenciais não encontradas para o usuário:', state);
      return res.redirect(`http://localhost:3000/credentials?error=credentials_not_found`);
    }

    // Descriptografar client secret
    const clientSecret = decrypt(credentials.client_secret);

    // Configurar OAuth2 com as credenciais do usuário
    const userOAuth2Client = new google.auth.OAuth2(
      credentials.client_id,
      clientSecret,
      'http://localhost:5000/api/oauth/callback'
    );

    // Trocar código por tokens
    const { tokens } = await userOAuth2Client.getToken(code);
    
    if (!tokens.refresh_token) {
      return res.status(400).json({ 
        message: 'Refresh token não obtido. Certifique-se de que o usuário deu consentimento completo.' 
      });
    }

    // Criptografar tokens sensíveis
    const encryptedRefreshToken = encrypt(tokens.refresh_token);
    const encryptedAccessToken = encrypt(tokens.access_token);

    // Atualizar tokens no banco
    const { data, error } = await supabase
      .from('user_credentials')
      .update({
        refresh_token: encryptedRefreshToken,
        access_token: encryptedAccessToken,
        token_expiry: new Date(tokens.expiry_date),
        is_valid: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', state)
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar tokens:', error);
      return res.status(500).json({ message: 'Erro ao salvar credenciais' });
    }

    // Redirecionar para o frontend com sucesso
    res.redirect(`http://localhost:3000/credentials?success=true`);
  } catch (error) {
    console.error('Erro no callback OAuth:', error);
    res.redirect(`http://localhost:3000/credentials?error=oauth_failed`);
  }
});

// GET /api/oauth/status - Verificar status das credenciais
router.get('/status', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_credentials')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) {
      return res.json({
        hasCredentials: false,
        message: 'Nenhuma credencial configurada'
      });
    }

    // Verificar se há tokens configurados
    const hasTokens = data.refresh_token && data.access_token;
    
    // Verificar se o token ainda é válido
    const isExpired = data.token_expiry ? new Date(data.token_expiry) < new Date() : true;
    
    res.json({
      hasCredentials: true,
      hasTokens,
      isExpired,
      is_valid: hasTokens && data.is_valid && !isExpired,
      hasTokens: hasTokens, // Garantir que está presente
      created_at: data.created_at,
      updated_at: data.updated_at
    });
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// POST /api/oauth/refresh - Renovar access token
router.post('/refresh', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_credentials')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ message: 'Credenciais não encontradas' });
    }

    // Descriptografar refresh token e client secret
    const refreshToken = decrypt(data.refresh_token);
    const clientSecret = decrypt(data.client_secret);

    // Configurar cliente OAuth2 com as credenciais do usuário
    const userOAuth2Client = new google.auth.OAuth2(
      data.client_id,
      clientSecret,
      'http://localhost:5000/api/oauth/callback'
    );

    userOAuth2Client.setCredentials({
      refresh_token: refreshToken
    });

    // Renovar access token
    const { token } = await userOAuth2Client.getAccessToken();

    if (!token) {
      throw new Error('Não foi possível renovar o access token');
    }

    // Criptografar e salvar novo access token
    const encryptedAccessToken = encrypt(token);
    const newExpiry = new Date(Date.now() + 3600 * 1000); // 1 hora

    await supabase
      .from('user_credentials')
      .update({
        access_token: encryptedAccessToken,
        token_expiry: newExpiry,
        is_valid: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', req.user.id);

    res.json({
      success: true,
      message: 'Access token renovado com sucesso',
      expires_at: newExpiry
    });
  } catch (error) {
    console.error('Erro ao renovar token:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao renovar access token: ' + error.message 
    });
  }
});

export default router;
