# Configuração do WooCommerce

Este documento explica como configurar a integração com WooCommerce no sistema de agentes de IA.

## 🚀 Funcionalidades

- **Gerenciamento de Produtos**: Listar, criar, atualizar e deletar produtos
- **Gestão de Pedidos**: Visualizar pedidos, status e informações de clientes
- **Controle de Estoque**: Monitorar níveis de estoque e atualizar quantidades
- **Relatórios de Vendas**: Acessar dados de vendas e métricas da loja

## 📋 Pré-requisitos

1. **Site WordPress** com WooCommerce ativo
2. **Permissões de API** configuradas no WooCommerce
3. **Chaves de API** (Consumer Key e Consumer Secret) geradas

## 🔧 Configuração no WordPress

### 1. Acessar Configurações da API

1. Faça login no painel administrativo do WordPress
2. Vá em **WooCommerce → Configurações → Avançado → API REST**
3. Clique em **"Adicionar chave"**

### 2. Configurar Permissões

- **Descrição**: Digite um nome para identificar a chave (ex: "Agente IA")
- **Usuário**: Selecione o usuário que terá acesso
- **Permissões**: Selecione **"Leitura/escrita"** para acesso completo

### 3. Gerar Chaves

1. Clique em **"Gerar chave da API"**
2. **IMPORTANTE**: Copie e salve a **Consumer Key** e **Consumer Secret**
3. Essas chaves só são exibidas uma vez!

## 🎯 Configuração no Sistema

### 1. Acessar Menu de Credenciais

1. Faça login no sistema
2. Vá em **Configurações → Credenciais**
3. Clique na ferramenta **WooCommerce**

### 2. Preencher Formulário

- **URL do Site WordPress**: `https://sua-loja.com`
- **Consumer Key**: `ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **Consumer Secret**: `cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **Usuário WordPress** (opcional): Para autenticação adicional
- **Senha WordPress** (opcional): Para autenticação adicional

### 3. Testar Conexão

1. Clique em **"Salvar Credenciais WooCommerce"**
2. Clique em **"Testar Conexão"** para validar
3. Aguarde a confirmação de sucesso

## 🔒 Segurança

- Todas as credenciais são **criptografadas** antes de serem salvas
- Cada usuário só pode acessar **suas próprias credenciais**
- As chaves são armazenadas de forma **segura** no banco de dados
- **Nunca** compartilhe suas chaves de API

## 📊 Uso pelos Agentes de IA

Após a configuração, seus agentes poderão usar comandos como:

```
"Liste todos os produtos da minha loja"
"Mostre os pedidos dos últimos 7 dias"
"Atualize o preço do produto 'X' para R$ 99,90"
"Qual é o estoque do produto 'Y'?"
"Crie um novo produto chamado 'Z' com preço R$ 150,00"
```

## 🚨 Solução de Problemas

### Erro de Conexão

- Verifique se a URL está correta (incluindo https://)
- Confirme se as chaves de API estão corretas
- Verifique se o WooCommerce está ativo no site
- Teste se a API REST está funcionando

### Erro de Permissões

- Verifique se as permissões da chave API estão como "Leitura/escrita"
- Confirme se o usuário da chave tem permissões adequadas
- Teste se consegue acessar a API manualmente

### Erro de Autenticação

- Verifique se as credenciais WordPress estão corretas (se fornecidas)
- Confirme se o usuário tem acesso ao WooCommerce
- Teste o login manual no WordPress

## 📞 Suporte

Se encontrar problemas:

1. Verifique as instruções acima
2. Teste a conexão manualmente
3. Verifique os logs do sistema
4. Entre em contato com o suporte técnico

## 🔄 Atualizações

- **Atualizar Credenciais**: Edite as informações no modal de configuração
- **Deletar Credenciais**: Use o botão "Deletar Credenciais" na aba de status
- **Revalidar Conexão**: Use "Testar Conexão" sempre que necessário

---

**Nota**: Esta integração usa a API REST oficial do WooCommerce, garantindo compatibilidade e estabilidade.
