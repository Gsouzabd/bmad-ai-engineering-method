import express from 'express';
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

// GET /api/woocommerce - Buscar credenciais WooCommerce do usuário
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('woocommerce_credentials')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    if (!data) {
      return res.status(404).json({ message: 'Credenciais WooCommerce não encontradas' });
    }

    // Retornar dados sem informações sensíveis
    res.json({
      id: data.id,
      user_id: data.user_id,
      wordpress_site_url: data.wordpress_site_url,
      is_valid: data.is_valid,
      created_at: data.created_at,
      updated_at: data.updated_at
    });
  } catch (error) {
    console.error('Erro ao buscar credenciais WooCommerce:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// POST /api/woocommerce - Salvar/atualizar credenciais WooCommerce
router.post('/', authenticateUser, async (req, res) => {
  try {
    const { 
      wordpress_site_url, 
      woocommerce_consumer_key, 
      woocommerce_consumer_secret,
      wordpress_username,
      wordpress_password 
    } = req.body;

    // Validação dos campos obrigatórios
    if (!wordpress_site_url || !woocommerce_consumer_key || !woocommerce_consumer_secret) {
      return res.status(400).json({ 
        message: 'URL do site WordPress, Consumer Key e Consumer Secret são obrigatórios' 
      });
    }

    // Validar formato da URL
    try {
      new URL(wordpress_site_url);
    } catch (error) {
      return res.status(400).json({ 
        message: 'URL do site WordPress inválida' 
      });
    }

    // Criptografar dados sensíveis
    const encryptedConsumerKey = encrypt(woocommerce_consumer_key);
    const encryptedConsumerSecret = encrypt(woocommerce_consumer_secret);
    const encryptedUsername = wordpress_username ? encrypt(wordpress_username) : null;
    const encryptedPassword = wordpress_password ? encrypt(wordpress_password) : null;

    // Verificar se já existem credenciais para o usuário
    const { data: existingCredentials } = await supabase
      .from('woocommerce_credentials')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    let result;
    if (existingCredentials) {
      // Atualizar credenciais existentes
      const { data, error } = await supabase
        .from('woocommerce_credentials')
        .update({
          wordpress_site_url,
          woocommerce_consumer_key: encryptedConsumerKey,
          woocommerce_consumer_secret: encryptedConsumerSecret,
          wordpress_username: encryptedUsername,
          wordpress_password: encryptedPassword,
          is_valid: false, // Será validado após teste de conexão
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
        .from('woocommerce_credentials')
        .insert({
          user_id: req.user.id,
          wordpress_site_url,
          woocommerce_consumer_key: encryptedConsumerKey,
          woocommerce_consumer_secret: encryptedConsumerSecret,
          wordpress_username: encryptedUsername,
          wordpress_password: encryptedPassword,
          is_valid: false // Será validado após teste de conexão
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
      wordpress_site_url: result.wordpress_site_url,
      is_valid: result.is_valid,
      created_at: result.created_at,
      updated_at: result.updated_at
    });

  } catch (error) {
    console.error('Erro ao salvar credenciais WooCommerce:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// POST /api/woocommerce/test - Testar conexão com WooCommerce
router.post('/test', authenticateUser, async (req, res) => {
  try {
    const { data: credentials, error } = await supabase
      .from('woocommerce_credentials')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (error || !credentials) {
      return res.status(404).json({ message: 'Credenciais WooCommerce não encontradas' });
    }

    // Descriptografar credenciais
    const consumerKey = decrypt(credentials.woocommerce_consumer_key);
    const consumerSecret = decrypt(credentials.woocommerce_consumer_secret);

    // Testar conexão com a API do WooCommerce
    const testUrl = `${credentials.wordpress_site_url}/wp-json/wc/v3/products?consumer_key=${consumerKey}&consumer_secret=${consumerSecret}&per_page=1`;
    
    const response = await fetch(testUrl);
    
    if (response.ok) {
      // Atualizar status para válido
      await supabase
        .from('woocommerce_credentials')
        .update({ is_valid: true, updated_at: new Date().toISOString() })
        .eq('user_id', req.user.id);

      res.json({ 
        message: 'Conexão com WooCommerce estabelecida com sucesso!',
        is_valid: true 
      });
    } else {
      // Atualizar status para inválido
      await supabase
        .from('woocommerce_credentials')
        .update({ is_valid: false, updated_at: new Date().toISOString() })
        .eq('user_id', req.user.id);

      res.status(400).json({ 
        message: 'Falha na conexão com WooCommerce. Verifique suas credenciais.',
        is_valid: false 
      });
    }

  } catch (error) {
    console.error('Erro ao testar conexão WooCommerce:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// DELETE /api/woocommerce - Deletar credenciais WooCommerce
router.delete('/', authenticateUser, async (req, res) => {
  try {
    const { error } = await supabase
      .from('woocommerce_credentials')
      .delete()
      .eq('user_id', req.user.id);

    if (error) throw error;

    res.json({ message: 'Credenciais WooCommerce deletadas com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar credenciais WooCommerce:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

export default router;
