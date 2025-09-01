#!/usr/bin/env node

/**
 * Script de teste para o servidor MCP WooCommerce
 * 
 * Este script testa a funcionalidade básica do servidor MCP
 * sem precisar de credenciais reais do WooCommerce
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho para o servidor MCP
const mcpServerPath = path.join(__dirname, 'backend/mcps/woocommerce-mcp-server/build/index.js');

console.log('🧪 Testando servidor MCP WooCommerce...');
console.log(`📁 Caminho do servidor: ${mcpServerPath}`);
console.log('');

// Configurar variáveis de ambiente de teste
const env = {
  ...process.env,
  WORDPRESS_SITE_URL: 'https://test-site.com',
  WOOCOMMERCE_CONSUMER_KEY: 'ck_test_key',
  WOOCOMMERCE_CONSUMER_SECRET: 'cs_test_secret',
  WORDPRESS_USERNAME: 'testuser',
  WORDPRESS_PASSWORD: 'testpass'
};

console.log('🔧 Variáveis de ambiente configuradas:');
console.log(`   WORDPRESS_SITE_URL: ${env.WORDPRESS_SITE_URL}`);
console.log(`   WOOCOMMERCE_CONSUMER_KEY: ${env.WOOCOMMERCE_CONSUMER_KEY}`);
console.log(`   WOOCOMMERCE_CONSUMER_SECRET: ${env.WOOCOMMERCE_CONSUMER_SECRET}`);
console.log(`   WORDPRESS_USERNAME: ${env.WORDPRESS_USERNAME}`);
console.log(`   WORDPRESS_PASSWORD: ${env.WORDPRESS_PASSWORD}`);
console.log('');

// Iniciar servidor MCP
console.log('🚀 Iniciando servidor MCP...');
const mcpProcess = spawn('node', [mcpServerPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: env,
  cwd: __dirname
});

let serverStarted = false;
let testResults = [];

// Configurar handlers
mcpProcess.stdout.on('data', (data) => {
  const output = data.toString().trim();
  
  if (!serverStarted) {
    if (output.includes('WooCommerce MCP server running')) {
      serverStarted = true;
      console.log('✅ Servidor MCP iniciado com sucesso!');
      console.log('');
      runTests();
    }
  } else {
    // Processar respostas dos testes
    try {
      const response = JSON.parse(output);
      if (response.id && response.result) {
        testResults.push({
          id: response.id,
          success: true,
          result: response.result
        });
        console.log(`✅ Teste ${response.id} passou:`, response.result);
      } else if (response.error) {
        testResults.push({
          id: response.id,
          success: false,
          error: response.error
        });
        console.log(`❌ Teste ${response.id} falhou:`, response.error.message);
      }
    } catch (error) {
      console.log('📝 Output do servidor:', output);
    }
  }
});

mcpProcess.stderr.on('data', (data) => {
  console.error('⚠️  Erro do servidor MCP:', data.toString());
});

mcpProcess.on('error', (error) => {
  console.error('💥 Erro ao iniciar servidor MCP:', error.message);
  process.exit(1);
});

mcpProcess.on('exit', (code) => {
  console.log(`\n🏁 Servidor MCP encerrado com código: ${code}`);
  console.log('\n📊 Resumo dos testes:');
  
  const passed = testResults.filter(t => t.success).length;
  const failed = testResults.filter(t => !t.success).length;
  
  console.log(`   ✅ Passou: ${passed}`);
  console.log(`   ❌ Falhou: ${failed}`);
  console.log(`   📊 Total: ${testResults.length}`);
  
  if (failed === 0) {
    console.log('\n🎉 Todos os testes passaram! O servidor MCP está funcionando corretamente.');
  } else {
    console.log('\n⚠️  Alguns testes falharam. Verifique os logs acima.');
  }
  
  process.exit(failed === 0 ? 0 : 1);
});

// Função para executar testes
function runTests() {
  console.log('🧪 Executando testes...');
  console.log('');
  
  const tests = [
    {
      id: 1,
      method: 'get_products',
      params: { perPage: 5, page: 1 }
    },
    {
      id: 2,
      method: 'get_orders',
      params: { perPage: 3, page: 1 }
    },
    {
      id: 3,
      method: 'get_customers',
      params: { perPage: 2, page: 1 }
    },
    {
      id: 4,
      method: 'get_sales_report',
      params: {}
    }
  ];
  
  // Executar testes com delay para evitar sobrecarga
  tests.forEach((test, index) => {
    setTimeout(() => {
      console.log(`🧪 Executando teste ${test.id}: ${test.method}`);
      const request = {
        jsonrpc: "2.0",
        id: test.id,
        method: test.method,
        params: test.params
      };
      
      mcpProcess.stdin.write(JSON.stringify(request) + '\n');
    }, index * 1000); // 1 segundo entre cada teste
  });
  
  // Parar servidor após todos os testes
  setTimeout(() => {
    console.log('\n🛑 Parando servidor após testes...');
    mcpProcess.kill();
  }, tests.length * 1000 + 2000);
}

// Handler para SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  console.log('\n🛑 Recebido SIGINT, parando servidor...');
  mcpProcess.kill();
  process.exit(0);
});

console.log('⏳ Aguardando inicialização do servidor...');
console.log('   Pressione Ctrl+C para parar o teste');
console.log('');
