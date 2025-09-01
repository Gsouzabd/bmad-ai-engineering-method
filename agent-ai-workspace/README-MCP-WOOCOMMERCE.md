# Integração MCP WooCommerce

## Visão Geral

Esta implementação integra o servidor MCP (Model Context Protocol) WooCommerce ao sistema principal, permitindo que agentes de IA interajam com lojas WooCommerce através de comandos naturais.

## 🏗️ Arquitetura

### Componentes Principais

1. **Servidor MCP WooCommerce** (`/backend/mcps/woocommerce-mcp-server/`)
   - Servidor MCP standalone que implementa o protocolo JSON-RPC 2.0
   - Comunica diretamente com a API REST do WooCommerce
   - Suporta todas as operações CRUD para produtos, pedidos, clientes, etc.

2. **Integração MCP** (`/backend/mcp-woocommerce-integration.js`)
   - Classe que gerencia o ciclo de vida do servidor MCP
   - Busca credenciais criptografadas do banco de dados
   - Estabelece comunicação bidirecional com o servidor MCP

3. **API de Integração** (`/backend/routes/woocommerce-mcp.js`)
   - Rotas REST para controlar o servidor MCP
   - Endpoints para iniciar/parar servidor e executar comandos
   - Métodos de conveniência para operações comuns

## 🚀 Configuração

### 1. Pré-requisitos

- Node.js 20.0.0 ou superior
- Servidor MCP WooCommerce compilado (`npm run build`)
- Credenciais WooCommerce configuradas no sistema
- Banco de dados Supabase configurado

### 2. Estrutura de Arquivos

```
agent-ai-workspace/
├── backend/
│   ├── mcps/
│   │   └── woocommerce-mcp-server/     # Servidor MCP
│   ├── mcp-woocommerce-integration.js  # Classe de integração
│   └── routes/
│       └── woocommerce-mcp.js          # Rotas da API
├── mcp-woocommerce-config.json         # Configuração MCP
└── test-woocommerce-mcp.js             # Script de teste
```

### 3. Variáveis de Ambiente

O servidor MCP usa as seguintes variáveis de ambiente:

```bash
# Obrigatórias para WooCommerce
WORDPRESS_SITE_URL=https://sua-loja.com
WOOCOMMERCE_CONSUMER_KEY=ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WOOCOMMERCE_CONSUMER_SECRET=cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Opcionais para WordPress
WORDPRESS_USERNAME=seu_usuario
WORDPRESS_PASSWORD=sua_senha
```

## 🔧 Uso

### 1. Iniciar Servidor MCP

```bash
# Via API REST
POST /api/woocommerce-mcp/start
Authorization: Bearer <token>

# Resposta
{
  "message": "Servidor MCP WooCommerce iniciado com sucesso",
  "status": "running"
}
```

### 2. Verificar Status

```bash
GET /api/woocommerce-mcp/status
Authorization: Bearer <token>

# Resposta
{
  "status": "running",
  "message": "Servidor MCP WooCommerce está rodando"
}
```

### 3. Executar Comandos

```bash
# Comando genérico
POST /api/woocommerce-mcp/execute
Authorization: Bearer <token>
{
  "method": "get_products",
  "params": {
    "perPage": 10,
    "page": 1
  }
}

# Métodos de conveniência
GET /api/woocommerce-mcp/products?perPage=10&page=1
GET /api/woocommerce-mcp/orders?status=processing
GET /api/woocommerce-mcp/customers?perPage=20
GET /api/woocommerce-mcp/reports/sales?dateMin=2024-01-01
```

### 4. Parar Servidor

```bash
POST /api/woocommerce-mcp/stop
Authorization: Bearer <token>

# Resposta
{
  "message": "Servidor MCP WooCommerce parado com sucesso",
  "status": "stopped"
}
```

## 📚 Métodos MCP Disponíveis

### Produtos
- `get_products` - Listar produtos
- `get_product` - Obter produto específico
- `create_product` - Criar novo produto
- `update_product` - Atualizar produto
- `delete_product` - Deletar produto

### Pedidos
- `get_orders` - Listar pedidos
- `get_order` - Obter pedido específico
- `create_order` - Criar novo pedido
- `update_order` - Atualizar pedido
- `delete_order` - Deletar pedido

### Clientes
- `get_customers` - Listar clientes
- `get_customer` - Obter cliente específico
- `create_customer` - Criar novo cliente
- `update_customer` - Atualizar cliente
- `delete_customer` - Deletar cliente

### Relatórios
- `get_sales_report` - Relatório de vendas
- `get_products_report` - Relatório de produtos
- `get_orders_report` - Relatório de pedidos
- `get_categories_report` - Relatório de categorias

### WordPress (Independente do WooCommerce)
- `create_post` - Criar post
- `get_posts` - Listar posts
- `update_post` - Atualizar post
- `get_post_meta` - Obter metadados do post

## 🧪 Testes

### Executar Testes

```bash
# Testar servidor MCP standalone
node test-woocommerce-mcp.js

# Testar integração completa
npm run test:mcp
```

### Testes Disponíveis

1. **Teste de Inicialização** - Verifica se o servidor inicia
2. **Teste de Métodos** - Testa métodos básicos (get_products, get_orders, etc.)
3. **Teste de Comunicação** - Verifica comunicação JSON-RPC
4. **Teste de Encerramento** - Verifica encerramento limpo

## 🔒 Segurança

### Criptografia
- Todas as credenciais são criptografadas com AES-256
- Chave de criptografia configurável via `ENCRYPTION_KEY`
- Credenciais descriptografadas apenas em memória

### Autenticação
- Todas as rotas requerem token JWT válido
- Verificação de usuário via Supabase Auth
- Isolamento de dados por usuário

### Controle de Acesso
- Cada usuário só pode acessar suas próprias credenciais
- Políticas RLS no banco de dados
- Logs de auditoria para todas as operações

## 🚨 Solução de Problemas

### Erro: "Servidor MCP não está rodando"
- Verifique se o servidor foi iniciado via `/api/woocommerce-mcp/start`
- Confirme se as credenciais WooCommerce estão configuradas
- Verifique os logs do servidor

### Erro: "Credenciais WooCommerce não encontradas"
- Configure as credenciais na página de Credenciais
- Execute o script SQL para criar a tabela
- Verifique se o usuário está autenticado

### Erro: "Timeout na requisição MCP"
- O servidor pode estar sobrecarregado
- Verifique a conectividade com o WooCommerce
- Reinicie o servidor MCP

### Erro: "API error: [mensagem]"
- Verifique as credenciais da API WooCommerce
- Confirme se o WooCommerce está ativo
- Teste a API manualmente

## 📊 Monitoramento

### Logs do Sistema
- Inicialização/parada do servidor MCP
- Execução de comandos
- Erros de comunicação
- Timeouts e falhas

### Métricas Disponíveis
- Status do servidor (running/stopped)
- Número de requisições processadas
- Tempo de resposta médio
- Taxa de erro

## 🔄 Manutenção

### Atualizações
- O servidor MCP é reiniciado automaticamente a cada requisição
- Credenciais são atualizadas em tempo real
- Não é necessário reiniciar o sistema principal

### Backup
- Credenciais são armazenadas no Supabase
- Backup automático via políticas do banco
- Exportação manual disponível via API

### Limpeza
- Servidores MCP são encerrados automaticamente
- Recursos são liberados ao parar o servidor
- Logs antigos podem ser limpos periodicamente

## 📞 Suporte

### Documentação
- [README MCP WooCommerce](../backend/mcps/woocommerce-mcp-server/README.md)
- [Guia de Integração](../backend/mcps/woocommerce-mcp-server/docs/INTEGRACAO_NODEJS_MCP.md)
- [Schema do Banco](../woocommerce-setup.sql)

### Comunidade
- Issues no GitHub
- Documentação oficial do MCP
- Fórum da comunidade WooCommerce

---

**Nota**: Esta integração usa o protocolo MCP oficial, garantindo compatibilidade e estabilidade com ferramentas MCP padrão.
