# Design Técnico: Integração com Google Sheets e Drive via MCP

## Responsável: Agente Architect

### Objetivo
Projetar a arquitetura técnica para integrar agentes com Google Sheets e Drive via MCP, garantindo configuração segura de credenciais e execução de tools com permissão.

### Arquitetura Proposta
- **Frontend**: React.js com Tailwind CSS para modal de permissão e painel de credenciais.
- **Backend**: Node.js com Supabase para armazenamento de credenciais e logs de permissão.
- **Integração MCP**:
  - Servidores: `@modelcontextprotocol/server-gdrive` e `@mcp/server-sheets`.
  - Ferramentas:
    - Google Drive: `list_files`, `read_file` (Docs como Markdown, Sheets como CSV).
    - Google Sheets: `read_values`, `write_values`, `create_spreadsheet`, `clear_values`.
- **IA**: Modelo LLM (ex.: Gemini) com `langchain-google-genai` para interpretar comandos e decidir entre "ask" ou "tool".
- **Base de Conhecimento**: Base vetorizada existente para respostas contextuais.
- **Comunicação**: WebSocket para solicitações de permissão em tempo real.

### Fluxo Técnico
1. **Configuração de Credenciais**:
   - Usuário insere credenciais no painel (client ID, client secret, refresh token).
   - Backend valida via OAuth 2.0 e armazena no Supabase (JSONB, criptografado).
   - Código:
     ```javascript
     const { google } = require('googleapis');
     const { createClient } = require('@supabase/supabase-js');
     const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

     const oauth2Client = new google.auth.OAuth2(
       process.env.GOOGLE_CLIENT_ID,
       process.env.GOOGLE_CLIENT_SECRET,
       'http://localhost:3000/oauth2callback'
     );

     async function storeCredentials(userId, credentials) {
       const { data, error } = await supabase
         .from('user_credentials')
         .insert([{ user_id: userId, credentials: credentials }]);
       if (error) throw new Error('Erro ao salvar credenciais');
       return data;
     }

     async function validateCredentials(refreshToken) {
       oauth2Client.setCredentials({ refresh_token: refreshToken });
       try {
         const { token } = await oauth2Client.getAccessToken();
         return token ? true : false;
       } catch (error) {
         return false;
       }
     }
     ```

2. **Execução de Tools**:
   - Agente interpreta comando do chat (ex.: "Liste arquivos no Drive").
   - Usa `mcp_use` para integrar com servidores MCP:
     ```javascript
     const { MCPAgent, MCPClient } = require('mcp_use');
     const { GoogleGenerativeAI } = require('langchain-google-genai');

     const genAI = new GoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
     const mcpClient = new MCPClient({
       servers: {
         gdrive: { command: 'npx', args: ['@modelcontextprotocol/server-gdrive'], env: { GDRIVE_CREDENTIALS_PATH: '/path/to/credentials.json' } },
         sheets: { command: 'npx', args: ['@mcp/server-sheets'], env: { ACCESS_TOKEN: process.env.ACCESS_TOKEN } }
       }
     });

     const agent = new MCPAgent({
       llm: genAI,
       client: mcpClient,
       tools: ['gdrive.list_files', 'sheets.read_values']
     });

     async function handleChat(input) {
       const response = await agent.process(input);
       if (response.action === 'tool') {
         const permission = await requestPermission(response.toolDescription);
         if (permission) {
           const result = await mcpClient.executeTool(response.tool, response.params);
           return result;
         } else {
           return 'Ação cancelada pelo usuário.';
         }
       }
       return response.message;
     }
     ```

3. **Permissão**:
   - Backend envia solicitação de permissão via WebSocket.
   - Frontend exibe modal e retorna resposta (aceite/decline).

### Configuração de Infraestrutura
- **Servidor**: Hospedagem na Hetzner (conforme preferência anterior).
- **Variáveis de Ambiente**:
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`.
  - `SUPABASE_URL`, `SUPABASE_KEY`.
  - `GEMINI_API_KEY` (ou equivalente para o LLM).
- **Instalação de MCP**:
  ```bash
  npm install -g @modelcontextprotocol/server-gdrive
  npm install -g @mcp/server-sheets
  ```

### Entregáveis
- **Documento de Arquitetura**: Este documento, detalhando fluxo técnico e integração.
- **Especificações Técnicas**: Configuração de MCP, credenciais e comunicação WebSocket.
- **Código de Exemplo**: Snippets para validação de credenciais e execução de tools.

### Próximos Passos
- Transferir para o agente **po** para refinamento do backlog.
- Implementar integração MCP e testar chamadas.