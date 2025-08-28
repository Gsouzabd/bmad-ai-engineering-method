import express from 'express';
import { google } from 'googleapis';
import CryptoJS from 'crypto-js';
import { supabase } from '../config/supabase.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Chave de criptografia (em produção, use uma chave mais segura)
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
    
    // Verificar token no Supabase
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



// GET /api/credentials - Buscar credenciais do usuário
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_credentials')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    if (!data) {
      return res.status(404).json({ message: 'Credenciais não encontradas' });
    }

    // Verificar se há tokens configurados
    const hasTokens = data.refresh_token && data.access_token;
    
    // Retornar dados sem informações sensíveis
    res.json({
      id: data.id,
      user_id: data.user_id,
      client_id: data.client_id,
      is_valid: data.is_valid,
      hasTokens: hasTokens,
      created_at: data.created_at,
      updated_at: data.updated_at
    });
  } catch (error) {
    console.error('Erro ao buscar credenciais:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// POST /api/credentials - Salvar/atualizar credenciais
router.post('/', authenticateUser, async (req, res) => {
  try {
    const { clientId, clientSecret } = req.body;

    // Validação dos campos
    if (!clientId || !clientSecret) {
      return res.status(400).json({ 
        message: 'Client ID e Client Secret são obrigatórios' 
      });
    }

    // Criptografar dados sensíveis
    const encryptedClientSecret = encrypt(clientSecret);

    // Verificar se já existem credenciais para o usuário
    const { data: existingCredentials } = await supabase
      .from('user_credentials')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    let result;
    if (existingCredentials) {
      // Atualizar credenciais existentes
      const { data, error } = await supabase
        .from('user_credentials')
        .update({
          client_id: clientId,
          client_secret: encryptedClientSecret,
          is_valid: false, // Será validado após OAuth
          updated_at: new Date().toISOString()
        })
        .eq('user_id', req.user.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Inserir novas credenciais
      const { data, error } = await supabase
        .from('user_credentials')
        .insert({
          user_id: req.user.id,
          client_id: clientId,
          client_secret: encryptedClientSecret,
          is_valid: false // Será validado após OAuth
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    // Retornar dados sem informações sensíveis
    res.json({
      id: result.id,
      user_id: result.user_id,
      client_id: result.client_id,
      is_valid: result.is_valid,
      created_at: result.created_at,
      updated_at: result.updated_at
    });

  } catch (error) {
    console.error('Erro ao salvar credenciais:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// DELETE /api/credentials - Deletar credenciais
router.delete('/', authenticateUser, async (req, res) => {
  try {
    const { error } = await supabase
      .from('user_credentials')
      .delete()
      .eq('user_id', req.user.id);

    if (error) throw error;

    res.json({ message: 'Credenciais deletadas com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar credenciais:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});



export default router;
