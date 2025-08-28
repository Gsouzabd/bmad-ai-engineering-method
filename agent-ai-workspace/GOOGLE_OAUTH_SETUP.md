# Configuração Google OAuth2 - Modelo n8n

Este guia explica como configurar as credenciais OAuth2 do Google Cloud Console para integração com Google Drive e Sheets, seguindo o modelo n8n.

## 📋 Pré-requisitos

- Conta Google
- Acesso ao Google Cloud Console
- APIs do Google Drive e Sheets habilitadas

## 🚀 Passo a Passo

### 1. Acessar Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a faturação (necessário para APIs)

### 2. Habilitar APIs

1. Vá para **APIs & Services** > **Library**
2. Habilite as seguintes APIs:
   - **Google Drive API**
   - **Google Sheets API**

### 3. Configurar OAuth 2.0

1. Vá para **APIs & Services** > **Credentials**
2. Clique em **+ CREATE CREDENTIALS** > **OAuth 2.0 Client IDs**
3. Selecione **Web application**
4. Configure:
   - **Name**: `BMAD AI Integration`
   - **Authorized redirect URIs**: `http://localhost:5000/api/oauth/callback`

### 4. Obter Credenciais

Após criar, você receberá:
- **Client ID**: `179038630567-bg9gd3faaq7m20s8qo2ma4m8ukrhqrfm.apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-...` (copie e guarde com segurança)

### 5. Configurar Tela de Consentimento

1. Vá para **APIs & Services** > **OAuth consent screen**
2. Configure:
   - **User Type**: External
   - **App name**: BMAD AI Integration
   - **User support email**: seu email
   - **Developer contact information**: seu email

### 6. Adicionar Escopos

Na tela de consentimento, adicione os escopos:
- `https://www.googleapis.com/auth/drive.readonly`
- `https://www.googleapis.com/auth/spreadsheets`
- `https://www.googleapis.com/auth/userinfo.email`

## 🔧 Configuração no Sistema

### 1. Salvar Credenciais

1. Acesse a página **Credenciais** no sistema
2. Preencha:
   - **Client ID**: `179038630567-bg9gd3faaq7m20s8qo2ma4m8ukrhqrfm.apps.googleusercontent.com`
   - **Client Secret**: `GOCSPX-...` (sua chave secreta)
3. Clique em **Validar e Salvar**

### 2. Autorizar Acesso

1. Clique em **Conectar com Google**
2. Você será redirecionado para o Google
3. Autorize o acesso aos seus arquivos
4. O sistema salvará automaticamente os tokens

## 🔒 Segurança

- **Client Secret**: Nunca compartilhe ou exponha
- **Tokens**: São criptografados e armazenados com segurança
- **Escopos**: Apenas leitura de Drive e acesso a Sheets
- **RLS**: Row Level Security no banco de dados

## 🧪 Teste

Após a configuração, teste com comandos:
- "Liste arquivos no meu Google Drive"
- "Leia a planilha X do Google Sheets"

## 📝 URLs Importantes

- **Redirect URL**: `http://localhost:5000/api/oauth/callback`
- **Google Cloud Console**: https://console.cloud.google.com/
- **APIs Library**: https://console.cloud.google.com/apis/library

## ⚠️ Troubleshooting

### Erro: "redirect_uri_mismatch"
- Verifique se a URL de redirecionamento está correta no Google Cloud Console
- Deve ser exatamente: `http://localhost:5000/api/oauth/callback`

### Erro: "access_denied"
- Verifique se os escopos estão configurados corretamente
- Certifique-se de que a tela de consentimento está publicada

### Erro: "invalid_client"
- Verifique se o Client ID e Client Secret estão corretos
- Certifique-se de que as credenciais estão ativas

## 🔄 Renovação de Tokens

O sistema renova automaticamente os tokens quando necessário. Se houver problemas:

1. Vá para **Credenciais** > **Desconectar**
2. Clique em **Conectar com Google** novamente
3. Reautorize o acesso

---

**Nota**: Este sistema segue o modelo n8n, onde o usuário só precisa fornecer Client ID e Client Secret. O sistema gerencia automaticamente todo o fluxo OAuth2.
