import express from 'express';
import WooCommerceMCPIntegration from '../mcp-woocommerce-integration.js';
import { supabase } from '../config/supabase.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

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

// Armazenar instâncias MCP por usuário
const mcpInstances = new Map();

// POST /api/woocommerce-mcp/start - Iniciar servidor MCP WooCommerce
router.post('/start', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Verificar se já existe uma instância rodando
    if (mcpInstances.has(userId)) {
      return res.status(400).json({ 
        message: 'Servidor MCP WooCommerce já está rodando para este usuário' 
      });
    }

    // Criar nova instância
    const mcpIntegration = new WooCommerceMCPIntegration();
    
    // Iniciar servidor
    await mcpIntegration.startMCPServer(userId);
    
    // Armazenar instância
    mcpInstances.set(userId, mcpIntegration);
    
    res.json({ 
      message: 'Servidor MCP WooCommerce iniciado com sucesso',
      status: 'running'
    });

  } catch (error) {
    console.error('Erro ao iniciar servidor MCP WooCommerce:', error);
    res.status(500).json({ 
      message: 'Erro ao iniciar servidor MCP WooCommerce',
      error: error.message 
    });
  }
});

// POST /api/woocommerce-mcp/stop - Parar servidor MCP WooCommerce
router.post('/stop', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const mcpInstance = mcpInstances.get(userId);
    if (!mcpInstance) {
      return res.status(400).json({ 
        message: 'Servidor MCP WooCommerce não está rodando para este usuário' 
      });
    }

    // Parar servidor
    mcpInstance.stopMCPServer();
    
    // Remover instância
    mcpInstances.delete(userId);
    
    res.json({ 
      message: 'Servidor MCP WooCommerce parado com sucesso',
      status: 'stopped'
    });

  } catch (error) {
    console.error('Erro ao parar servidor MCP WooCommerce:', error);
    res.status(500).json({ 
      message: 'Erro ao parar servidor MCP WooCommerce',
      error: error.message 
    });
  }
});

// GET /api/woocommerce-mcp/status - Status do servidor MCP
router.get('/status', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const isRunning = mcpInstances.has(userId);
    
    res.json({ 
      status: isRunning ? 'running' : 'stopped',
      message: isRunning ? 'Servidor MCP WooCommerce está rodando' : 'Servidor MCP WooCommerce não está rodando'
    });

  } catch (error) {
    console.error('Erro ao verificar status do servidor MCP WooCommerce:', error);
    res.status(500).json({ 
      message: 'Erro ao verificar status do servidor MCP WooCommerce',
      error: error.message 
    });
  }
});

// POST /api/woocommerce-mcp/execute - Executar comando MCP
router.post('/execute', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { method, params } = req.body;
    
    if (!method) {
      return res.status(400).json({ 
        message: 'Método MCP é obrigatório' 
      });
    }

    const mcpInstance = mcpInstances.get(userId);
    if (!mcpInstance) {
      return res.status(400).json({ 
        message: 'Servidor MCP WooCommerce não está rodando. Inicie-o primeiro.' 
      });
    }

    // Executar comando
    const result = await mcpInstance.sendRequest(method, params || {});
    
    res.json({ 
      success: true,
      result: result,
      method: method
    });

  } catch (error) {
    console.error('Erro ao executar comando MCP WooCommerce:', error);
    res.status(500).json({ 
      message: 'Erro ao executar comando MCP WooCommerce',
      error: error.message 
    });
  }
});

// Métodos de conveniência para operações comuns

// GET /api/woocommerce-mcp/products - Listar produtos
router.get('/products', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { perPage = 20, page = 1, category, status } = req.query;
    
    const mcpInstance = mcpInstances.get(userId);
    if (!mcpInstance) {
      return res.status(400).json({ 
        message: 'Servidor MCP WooCommerce não está rodando. Inicie-o primeiro.' 
      });
    }

    const params = { perPage, page };
    if (category) params.category = category;
    if (status) params.status = status;

    const products = await mcpInstance.getProducts(params);
    
    res.json({ 
      success: true,
      products: products,
      pagination: { perPage, page }
    });

  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    res.status(500).json({ 
      message: 'Erro ao listar produtos',
      error: error.message 
    });
  }
});

// GET /api/woocommerce-mcp/products/:id - Obter produto específico
router.get('/products/:id', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = req.params.id;
    
    const mcpInstance = mcpInstances.get(userId);
    if (!mcpInstance) {
      return res.status(400).json({ 
        message: 'Servidor MCP WooCommerce não está rodando. Inicie-o primeiro.' 
      });
    }

    const product = await mcpInstance.getProduct(productId);
    
    res.json({ 
      success: true,
      product: product
    });

  } catch (error) {
    console.error('Erro ao obter produto:', error);
    res.status(500).json({ 
      message: 'Erro ao obter produto',
      error: error.message 
    });
  }
});

// GET /api/woocommerce-mcp/orders - Listar pedidos
router.get('/orders', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { perPage = 20, page = 1, status } = req.query;
    
    const mcpInstance = mcpInstances.get(userId);
    if (!mcpInstance) {
      return res.status(400).json({ 
        message: 'Servidor MCP WooCommerce não está rodando. Inicie-o primeiro.' 
      });
    }

    const params = { perPage, page };
    if (status) params.status = status;

    const orders = await mcpInstance.getOrders(params);
    
    res.json({ 
      success: true,
      orders: orders,
      pagination: { perPage, page }
    });

  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
    res.status(500).json({ 
      message: 'Erro ao listar pedidos',
      error: error.message 
    });
  }
});

// GET /api/woocommerce-mcp/customers - Listar clientes
router.get('/customers', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { perPage = 20, page = 1 } = req.query;
    
    const mcpInstance = mcpInstances.get(userId);
    if (!mcpInstance) {
      return res.status(400).json({ 
        message: 'Servidor MCP WooCommerce não está rodando. Inicie-o primeiro.' 
      });
    }

    const customers = await mcpInstance.getCustomers({ perPage, page });
    
    res.json({ 
      success: true,
      customers: customers,
      pagination: { perPage, page }
    });

  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    res.status(500).json({ 
      message: 'Erro ao listar clientes',
      error: error.message 
    });
  }
});

// GET /api/woocommerce-mcp/reports/sales - Relatório de vendas
router.get('/reports/sales', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { dateMin, dateMax } = req.query;
    
    const mcpInstance = mcpInstances.get(userId);
    if (!mcpInstance) {
      return res.status(400).json({ 
        message: 'Servidor MCP WooCommerce não está rodando. Inicie-o primeiro.' 
      });
    }

    const params = {};
    if (dateMin) params.dateMin = dateMin;
    if (dateMax) params.dateMax = dateMax;

    const salesReport = await mcpInstance.getSalesReport(params);
    
    res.json({ 
      success: true,
      report: salesReport
    });

  } catch (error) {
    console.error('Erro ao obter relatório de vendas:', error);
    res.status(500).json({ 
      message: 'Erro ao obter relatório de vendas',
      error: error.message 
    });
  }
});

export default router;
