import { spawn } from 'child_process';
import { supabase } from './config/supabase.js';
import CryptoJS from 'crypto-js';
import dotenv from 'dotenv';

dotenv.config();

// Chave de criptografia
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-secret-key-32-chars-long!';

// Função para descriptografar dados
const decrypt = (ciphertext) => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

class WooCommerceMCPIntegration {
  constructor() {
    this.mcpProcess = null;
    this.requestId = 0;
    this.pendingRequests = new Map();
    this.mcpServerPath = './mcps/woocommerce-mcp-server/build/index.js';
  }

  /**
   * Inicia o servidor MCP WooCommerce
   */
  async startMCPServer(userId) {
    try {
      // Buscar credenciais do usuário
      const { data: credentials, error } = await supabase
        .from('woocommerce_credentials')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !credentials) {
        throw new Error('Credenciais WooCommerce não encontradas');
      }

      // Descriptografar credenciais
      const siteUrl = credentials.wordpress_site_url;
      const consumerKey = decrypt(credentials.woocommerce_consumer_key);
      const consumerSecret = decrypt(credentials.woocommerce_consumer_secret);
      const username = credentials.wordpress_username ? decrypt(credentials.wordpress_username) : '';
      const password = credentials.wordpress_password ? decrypt(credentials.wordpress_password) : '';

      // Configurar variáveis de ambiente
      const env = {
        ...process.env,
        WORDPRESS_SITE_URL: siteUrl,
        WOOCOMMERCE_CONSUMER_KEY: consumerKey,
        WOOCOMMERCE_CONSUMER_SECRET: consumerSecret,
        WORDPRESS_USERNAME: username,
        WORDPRESS_PASSWORD: password
      };

      // Iniciar processo MCP
      this.mcpProcess = spawn('node', [this.mcpServerPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: env,
        cwd: process.cwd()
      });

      // Configurar handlers
      this.mcpProcess.stdout.on('data', (data) => {
        this.handleResponse(data.toString());
      });

      this.mcpProcess.stderr.on('data', (data) => {
        console.error('MCP WooCommerce Error:', data.toString());
      });

      this.mcpProcess.on('error', (error) => {
        console.error('Erro ao iniciar servidor MCP WooCommerce:', error);
      });

      this.mcpProcess.on('exit', (code) => {
        console.log(`Servidor MCP WooCommerce encerrado com código: ${code}`);
      });

      console.log('Servidor MCP WooCommerce iniciado com sucesso');
      return true;

    } catch (error) {
      console.error('Erro ao iniciar servidor MCP WooCommerce:', error);
      throw error;
    }
  }

  /**
   * Para o servidor MCP
   */
  stopMCPServer() {
    if (this.mcpProcess) {
      this.mcpProcess.kill();
      this.mcpProcess = null;
      console.log('Servidor MCP WooCommerce parado');
    }
  }

  /**
   * Envia uma requisição para o servidor MCP
   */
  async sendRequest(method, params = {}) {
    return new Promise((resolve, reject) => {
      if (!this.mcpProcess) {
        reject(new Error('Servidor MCP não está rodando'));
        return;
      }

      const requestId = ++this.requestId;
      const request = {
        jsonrpc: "2.0",
        id: requestId,
        method: method,
        params: params
      };

      // Armazenar callback para resposta
      this.pendingRequests.set(requestId, { resolve, reject });

      // Enviar requisição para o servidor MCP
      this.mcpProcess.stdin.write(JSON.stringify(request) + '\n');

      // Timeout para evitar espera infinita
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error('Timeout na requisição MCP'));
        }
      }, 30000); // 30 segundos
    });
  }

  /**
   * Processa resposta do servidor MCP
   */
  handleResponse(data) {
    try {
      const lines = data.toString().trim().split('\n');
      
      for (const line of lines) {
        if (!line) continue;
        
        const response = JSON.parse(line);
        
        if (response.id && this.pendingRequests.has(response.id)) {
          const { resolve, reject } = this.pendingRequests.get(response.id);
          this.pendingRequests.delete(response.id);

          if (response.error) {
            reject(new Error(response.error.message));
          } else {
            resolve(response.result);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao processar resposta MCP:', error);
    }
  }

  /**
   * Métodos de conveniência para operações comuns
   */
  async getProducts(params = {}) {
    return this.sendRequest('get_products', params);
  }

  async getProduct(productId) {
    return this.sendRequest('get_product', { productId });
  }

  async createProduct(productData) {
    return this.sendRequest('create_product', { productData });
  }

  async updateProduct(productId, productData) {
    return this.sendRequest('update_product', { productId, productData });
  }

  async deleteProduct(productId) {
    return this.sendRequest('delete_product', { productId });
  }

  async getOrders(params = {}) {
    return this.sendRequest('get_orders', params);
  }

  async getOrder(orderId) {
    return this.sendRequest('get_order', { orderId });
  }

  async getCustomers(params = {}) {
    return this.sendRequest('get_customers', params);
  }

  async getCustomer(customerId) {
    return this.sendRequest('get_customer', { customerId });
  }

  async getSalesReport(params = {}) {
    return this.sendRequest('get_sales_report', params);
  }
}

export default WooCommerceMCPIntegration;
