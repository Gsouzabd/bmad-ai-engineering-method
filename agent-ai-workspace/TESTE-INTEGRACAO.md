# 🧪 Guia de Teste - Integração MCP Google

Este guia explica como testar se a integração MCP com Google Sheets e Drive está funcionando corretamente.

## 📋 Pré-requisitos

- Backend rodando em `http://localhost:5000`
- Frontend rodando em `http://localhost:3000`
- Supabase configurado
- Google Cloud Console configurado

## 🚀 Passo a Passo para Testar

### 1. **Testar Backend**

```bash
# No diretório backend
cd agent-ai-workspace/backend
npm start
```

Verifique se não há erros no console.

### 2. **Executar Script de Teste**

```bash
# No diretório backend
node test-mcp-integration.js
```

**Resultado esperado:**
```
🧪 Iniciando testes da integração MCP...

1️⃣ Testando conexão com Supabase...
✅ Conexão com Supabase OK
   - Tabela user_credentials: 0 registros encontrados

2️⃣ Testando configuração Google OAuth...
✅ Configuração Google OAuth OK
   - Client ID configurado
   - Client Secret configurado
   - Redirect URL configurado

3️⃣ Testando criptografia...
✅ Criptografia OK
   - Dados criptografados e descriptografados corretamente

4️⃣ Testando APIs do backend...
✅ API de credenciais OK
✅ API OAuth OK

5️⃣ Verificando variáveis de ambiente...
✅ Todas as variáveis de ambiente configuradas
```

### 3. **Testar Frontend**

1. Acesse `http://localhost:3000/credentials`
2. Faça login (se necessário)
3. Configure as credenciais Google:
   - **Client ID**: `179038630567-bg9gd3faaq7m20s8qo2ma4m8ukrhqrfm.apps.googleusercontent.com`
   - **Client Secret**: `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`

### 4. **Verificar Status das Credenciais**

Após salvar as credenciais, você deve ver:
- ✅ **Status**: "Configurado (aguardando OAuth)" (azul)
- ✅ **Ícone**: ⚙️ Settings
- ✅ **Botão**: "Autorizar com Google"

### 5. **Testar Fluxo OAuth**

1. Clique em **"Autorizar com Google"**
2. Você será redirecionado para o Google
3. Autorize o acesso
4. Você será redirecionado de volta
5. **Status deve mudar para**: "Conectado" (verde)

### 6. **Testar Comandos MCP**

No chat, teste os comandos:
- `"Liste arquivos no meu Google Drive"`
- `"Leia a planilha X do Google Sheets"`

## 🔍 **Verificações Manuais**

### **Backend (Terminal)**
```bash
# Verificar logs do servidor
# Deve mostrar:
# - POST /api/credentials (ao salvar credenciais)
# - GET /api/oauth/auth (ao iniciar OAuth)
# - GET /api/oauth/callback (após autorização)
```

### **Frontend (Console do Navegador)**
```javascript
// Verificar se as credenciais estão sendo salvas
// Abra o DevTools (F12) e verifique:
// - Network tab: requisições para /api/credentials
// - Console: mensagens de sucesso/erro
```

### **Supabase (Dashboard)**
1. Acesse o dashboard do Supabase
2. Vá para **Table Editor** > **user_credentials**
3. Verifique se os registros estão sendo criados
4. Confirme que `refresh_token` e `access_token` estão preenchidos após OAuth

## ⚠️ **Problemas Comuns e Soluções**

### **Erro: "Token inválido"**
- Verifique se o backend está rodando
- Confirme se o token mock está funcionando
- Verifique as configurações do Supabase

### **Erro: "redirect_uri_mismatch"**
- Verifique se a URL de redirecionamento no Google Cloud Console está correta
- Deve ser: `http://localhost:5000/api/oauth/callback`

### **Status não muda após OAuth**
- Verifique se o callback está funcionando
- Confirme se os tokens estão sendo salvos no banco
- Verifique se `hasTokens` está sendo retornado corretamente

### **Erro de criptografia**
- Verifique se `ENCRYPTION_KEY` está configurada
- Confirme se a chave tem 32 caracteres

## ✅ **Critérios de Sucesso**

A integração está funcionando se:

1. ✅ **Backend**: Todos os testes passam
2. ✅ **Frontend**: Status mostra corretamente
3. ✅ **OAuth**: Fluxo completo funciona
4. ✅ **Banco**: Tokens são salvos criptografados
5. ✅ **Chat**: Comandos MCP funcionam

## 🎯 **Próximos Passos**

Após confirmar que tudo está funcionando:

1. **Teste comandos específicos**:
   - `"Crie uma nova planilha"`
   - `"Adicione dados à planilha X"`
   - `"Baixe o arquivo Y do Drive"`

2. **Teste cenários de erro**:
   - Token expirado
   - Credenciais inválidas
   - Permissões insuficientes

3. **Teste em produção**:
   - Configure URLs de produção
   - Teste com usuários reais
   - Monitore logs e erros

---

**🎉 Se todos os testes passaram, a integração MCP está funcionando corretamente!**
