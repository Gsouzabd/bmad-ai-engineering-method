# Teste de Integração: Google Sheets e Drive via MCP

## Responsável: Agente Architect

### Objetivo
Testar a integração do backend com servidores MCP e as credenciais fornecidas, garantindo execução correta dos tools e segurança.

### Configuração
- **Credenciais**:
  - Client ID: `[SEU_CLIENT_ID_AQUI]`
  - Client Secret: `[SEU_CLIENT_SECRET_AQUI]`
- **Servidores MCP**:
  - `@modelcontextprotocol/server-gdrive`
  - `@mcp/server-sheets`
- **Backend**: Node.js com Supabase e `mcp_use`.

### Casos de Teste

1. **Validação de Credenciais**:
   - **Descrição**: Testar a autenticação OAuth com as credenciais fornecidas.
   - **Passos**:
     - Configurar variáveis de ambiente:
       ```bash
       export GOOGLE_CLIENT_ID="[SEU_CLIENT_ID_AQUI]"
       export GOOGLE_CLIENT_SECRET="[SEU_CLIENT_SECRET_AQUI]"
       export GOOGLE_REDIRECT_URI="http://localhost:3000/oauth2callback"
       ```
     - Executar validação:
       ```javascript
       const { google } = require('googleapis');
       const oauth2Client = new google.auth.OAuth2(
         process.env.GOOGLE_CLIENT_ID,
         process.env.GOOGLE_CLIENT_SECRET,
         process.env.GOOGLE_REDIRECT_URI
       );

       async function testCredentials() {
         oauth2Client.setCredentials({ refresh_token: 'USER_REFRESH_TOKEN' });
         try {
           const { token } = await oauth2Client.getAccessToken();
           console.log('Token obtido:', token);
           return true;
         } catch (error) {
           console.error('Erro na autenticação:', error);
           return false;
         }
       }
       ```
     - Testar com Client Secret inválido.
   - **Resultado Esperado**:
     - Credenciais válidas: Token de acesso obtido.
     - Credenciais inválidas: Erro claro (ex.: "invalid_client").

2. **Execução de Tools**:
   - **Descrição**: Testar a execução de tools via MCP.
   - **Passos**:
     - Instalar servidores MCP:
       ```bash
       npm install -g @modelcontextprotocol/server-gdrive
       npm install -g @mcp/server-sheets
       ```
     - Configurar agente:
       ```javascript
       const { MCPAgent, MCPClient } = require('mcp_use');
       const mcpClient = new MCPClient({
         servers: {
           gdrive: { command: 'npx', args: ['@modelcontextprotocol/server-gdrive'], env: { GDRIVE_CREDENTIALS_PATH: '/path/to/credentials.json' } },
           sheets: { command: 'npx', args: ['@mcp/server-sheets'], env: { ACCESS_TOKEN: 'USER_ACCESS_TOKEN' } }
         }
       });
       const agent = new MCPAgent({ llm: 'gemini', client: mcpClient, tools: ['gdrive.list_files', 'sheets.read_values'] });

       async function testTool(tool, params) {
         const result = await mcpClient.executeTool(tool, params);
         console.log('Resultado:', result);
         return result;
       }
       ```
     - Testar:
       - `gdrive.list_files`: Listar arquivos no Drive.
       - `sheets.read_values`: Ler células A1:B10 de uma planilha de teste.
   - **Resultado Esperado**:
     - Drive: Lista de arquivos em JSON.
     - Sheets: Dados em CSV ou JSON.
     - Erro (ex.: planilha inexistente): Mensagem clara.

3. **Segurança**:
   - **Descrição**: Testar armazenamento seguro de credenciais.
   - **Passos**:
     - Inserir credenciais via painel.
     - Verificar no Supabase:
       ```javascript
       const { createClient } = require('@supabase/supabase-js');
       const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

       async function checkCredentials(userId) {
         const { data } = await supabase
           .from('user_credentials')
           .select('credentials')
           .eq('user_id', userId);
         console.log('Credenciais armazenadas:', data);
         return data;
       }
       ```
     - Tentar acessar credenciais sem autenticação.
   - **Resultado Esperado**: Credenciais criptografadas e acessíveis apenas com autenticação.

### Entregáveis
- **Plano de Teste Técnico**: Este documento, com casos de teste e scripts.
- **Relatório de Integração**: (Pós-teste) Resultados e logs.

### Próximos Passos
- Executar testes e compartilhar resultados com o agente **po**.
- Ajustar integração com base nos erros encontrados.