# 🛒 Exemplos de Chat com WooCommerce

Este documento mostra como usar o sistema de chat para interagir com sua loja WooCommerce através de comandos naturais.

## 🚀 Pré-requisitos

1. **Credenciais Configuradas**: WooCommerce configurado na página de Credenciais
2. **Agente Ativo**: Um agente de IA configurado no sistema
3. **Chat Funcionando**: Sistema de chat ativo

## 💬 Exemplos de Comandos

### 📦 **Gerenciamento de Produtos**

#### Listar Produtos
```
Usuário: "Liste os produtos da minha loja"
Agente: Vou listar os produtos da sua loja WooCommerce...
[Executa woocommerce_get_products]
Agente: Aqui estão os produtos da sua loja:
- Produto 1: R$ 29,90
- Produto 2: R$ 49,90
- Produto 3: R$ 79,90
```

#### Obter Detalhes de Produto
```
Usuário: "Mostre detalhes do produto com ID 123"
Agente: Vou buscar os detalhes do produto ID 123...
[Executa woocommerce_get_product com productId: "123"]
Agente: Produto encontrado:
Nome: Camiseta Premium
Preço: R$ 49,90
Descrição: Camiseta de algodão 100%...
```

#### Criar Novo Produto
```
Usuário: "Crie um novo produto chamado 'Caneca Personalizada' com preço R$ 25,00"
Agente: Vou criar o produto 'Caneca Personalizada' na sua loja...
[Executa woocommerce_create_product]
Agente: Produto criado com sucesso!
ID: 456
Nome: Caneca Personalizada
Preço: R$ 25,00
Status: Publicado
```

#### Atualizar Produto
```
Usuário: "Atualize o preço do produto ID 123 para R$ 39,90"
Agente: Vou atualizar o preço do produto ID 123...
[Executa woocommerce_update_product]
Agente: Preço atualizado com sucesso!
Novo preço: R$ 39,90
```

### 📋 **Gerenciamento de Pedidos**

#### Listar Pedidos
```
Usuário: "Mostre os pedidos dos últimos 7 dias"
Agente: Vou listar os pedidos recentes da sua loja...
[Executa woocommerce_get_orders]
Agente: Aqui estão os pedidos recentes:
- Pedido #1001: R$ 89,80 (Processando)
- Pedido #1002: R$ 125,50 (Concluído)
- Pedido #1003: R$ 67,90 (Processando)
```

#### Detalhes do Pedido
```
Usuário: "Quais são os detalhes do pedido #1001?"
Agente: Vou buscar os detalhes do pedido #1001...
[Executa woocommerce_get_order com orderId: "1001"]
Agente: Detalhes do Pedido #1001:
Cliente: João Silva
Itens: 2x Camiseta Premium
Total: R$ 89,80
Status: Processando
Data: 15/01/2024
```

### 👥 **Gerenciamento de Clientes**

#### Listar Clientes
```
Usuário: "Quantos clientes cadastrados eu tenho?"
Agente: Vou verificar os clientes cadastrados na sua loja...
[Executa woocommerce_get_customers]
Agente: Você tem 45 clientes cadastrados na sua loja.
Aqui estão os 10 mais recentes:
- Maria Santos (maria@email.com)
- Pedro Oliveira (pedro@email.com)
- Ana Costa (ana@email.com)
...
```

#### Detalhes do Cliente
```
Usuário: "Mostre informações do cliente Maria Santos"
Agente: Vou buscar as informações da cliente Maria Santos...
[Executa woocommerce_get_customer]
Agente: Cliente: Maria Santos
Email: maria@email.com
Telefone: (11) 99999-9999
Total de Pedidos: 8
Valor Total Gasto: R$ 456,70
Último Pedido: 10/01/2024
```

### 📊 **Relatórios e Análises**

#### Relatório de Vendas
```
Usuário: "Como foram as vendas este mês?"
Agente: Vou gerar um relatório de vendas para este mês...
[Executa woocommerce_get_sales_report]
Agente: Relatório de Vendas - Janeiro 2024:
Total de Vendas: R$ 12.450,80
Número de Pedidos: 89
Ticket Médio: R$ 139,90
Produto Mais Vendido: Camiseta Premium
```

#### Relatório de Produtos
```
Usuário: "Quais produtos estão vendendo mais?"
Agente: Vou analisar o desempenho dos produtos...
[Executa woocommerce_get_products_report]
Agente: Top 5 Produtos Mais Vendidos:
1. Camiseta Premium: 45 unidades
2. Calça Jeans: 32 unidades
3. Tênis Esportivo: 28 unidades
4. Boné: 25 unidades
5. Mochila: 22 unidades
```

## 🔧 **Comandos Avançados**

### Filtros e Paginação
```
Usuário: "Mostre apenas produtos da categoria 'Roupas'"
Agente: Vou filtrar os produtos pela categoria 'Roupas'...
[Executa woocommerce_get_products com category: "15"]
Agente: Produtos da categoria 'Roupas':
- Camiseta Básica: R$ 29,90
- Calça Jeans: R$ 89,90
- Vestido Floral: R$ 129,90
```

### Múltiplas Operações
```
Usuário: "Crie 3 produtos novos para minha coleção de verão"
Agente: Vou criar 3 produtos para sua coleção de verão...

1. Criando "Biquíni Floral"...
[Executa woocommerce_create_product]
✅ Produto 1 criado: Biquíni Floral - R$ 89,90

2. Criando "Sunga Estampada"...
[Executa woocommerce_create_product]
✅ Produto 2 criado: Sunga Estampada - R$ 69,90

3. Criando "Chapéu de Palha"...
[Executa woocommerce_create_product]
✅ Produto 3 criado: Chapéu de Palha - R$ 45,90

Coleção de verão criada com sucesso! 🏖️
```

## 🎯 **Dicas de Uso**

### 1. **Seja Específico**
- ❌ "Mostre produtos"
- ✅ "Liste os 10 produtos mais vendidos"

### 2. **Use IDs Quando Disponível**
- ❌ "Atualize o produto 'camiseta'"
- ✅ "Atualize o produto com ID 123"

### 3. **Pergunte por Relatórios**
- ❌ "Como está a loja?"
- ✅ "Gere um relatório de vendas deste mês"

### 4. **Combine Operações**
- ❌ "Crie um produto"
- ✅ "Crie um produto chamado 'X' com preço R$ Y e depois liste todos os produtos"

## 🚨 **Limitações e Observações**

### **Segurança**
- Todas as operações são registradas
- Apenas usuários autenticados podem usar
- Credenciais são criptografadas

### **Performance**
- Operações grandes podem demorar
- Use filtros para reduzir resultados
- Paginação automática para listas grandes

### **Dependências**
- WooCommerce deve estar ativo
- API REST deve estar funcionando
- Credenciais devem ser válidas

## 🔍 **Solução de Problemas**

### **Erro: "Credenciais não encontradas"**
- Verifique se configurou WooCommerce nas Credenciais
- Confirme se as credenciais estão válidas
- Teste a conexão primeiro

### **Erro: "Produto não encontrado"**
- Verifique se o ID está correto
- Use `woocommerce_get_products` para listar IDs válidos
- Confirme se o produto existe na loja

### **Erro: "Timeout"**
- Operações grandes podem demorar
- Use filtros para reduzir resultados
- Verifique a conectividade com o WooCommerce

## 📱 **Exemplo de Conversa Completa**

```
Usuário: Olá! Preciso de ajuda para gerenciar minha loja online.

Agente: Olá! Ficarei feliz em ajudar você a gerenciar sua loja WooCommerce. 
Posso ajudar com produtos, pedidos, clientes e relatórios. 
Como posso te ajudar hoje?

Usuário: Quero ver como estão as vendas este mês.

Agente: Vou gerar um relatório de vendas para este mês...
[Executa woocommerce_get_sales_report]

Excelente! Suas vendas este mês estão muito boas:
📊 Relatório de Janeiro 2024:
💰 Total de Vendas: R$ 15.670,50
📦 Número de Pedidos: 127
📈 Ticket Médio: R$ 123,39
🏆 Produto Mais Vendido: Camiseta Premium (67 unidades)

Gostaria de ver mais detalhes sobre algum produto específico ou cliente?

Usuário: Sim! Quem é meu cliente mais fiel?

Agente: Vou analisar os clientes para encontrar o mais fiel...
[Executa woocommerce_get_customers]

Analisando seus clientes, encontrei alguns muito fiéis! 
O cliente mais fiel é:

👑 **João Silva**
📧 Email: joao@email.com
📱 Telefone: (11) 99999-8888
🛒 Total de Pedidos: 23
💰 Valor Total Gasto: R$ 2.890,45
📅 Cliente desde: Março 2023
🎯 Último Pedido: 2 dias atrás

Ele compra regularmente e tem um ticket médio alto. 
Gostaria de criar uma campanha especial para clientes como ele?
```

---

**🎉 Agora você pode gerenciar sua loja WooCommerce diretamente pelo chat!**
Basta conversar naturalmente com o agente de IA e ele executará as operações necessárias.
