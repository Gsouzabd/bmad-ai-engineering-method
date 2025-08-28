# Integração MCP - Google Sheets e Drive

## Visão Geral

Esta implementação adiciona integração com Google Sheets e Google Drive através do Model Context Protocol (MCP) à plataforma AI Agent Workspace. Os usuários podem configurar credenciais Google OAuth e usar comandos naturais para interagir com seus dados.

## Funcionalidades Implementadas

### 1. Configuração de Credenciais
- **Página de Credenciais**: `/credentials`
- **Validação OAuth**: Verificação automática das credenciais Google
- **Criptografia**: Armazenamento seguro de tokens
- **Interface**: Formulário intuitivo com feedback visual

### 2. Sistema de Permissões
- **Modal de Permissão**: Solicita autorização antes de executar ações
- **Logs de Auditoria**: Registra todas as permissões concedidas/negadas
- **Controle Total**: Usuário decide sobre cada ação

### 3. Tools MCP Disponíveis
- **Google Drive**:
  - `gdrive.list_files`: Listar arquivos no Drive
- **Google Sheets**:
  - `sheets.read_values`: Ler dados de planilhas
  - `sheets.write_values`: Escrever dados em planilhas

### 4. Interpretação de Comandos
- **IA Nativa**: Usa Google Gemini para interpretar comandos
- **Comandos Exemplos**:
  - "Liste arquivos no Drive"
  - "Ler células A1:B10 da planilha X"
  - "Escrever dados na planilha Y"

## Estrutura do Banco de Dados

### Tabelas Criadas

#### `user_credentials`
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- client_id (VARCHAR)
- client_secret (TEXT, criptografado)
- refresh_token (TEXT, criptografado)
- access_token (TEXT, criptografado)
- token_expiry (TIMESTAMP)
- is_valid (BOOLEAN)
- created_at, updated_at (TIMESTAMP)
```

#### `permission_logs`
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- agent_id (UUID, FK)
- tool_name (VARCHAR)
- tool_description (TEXT)
- permission_granted (BOOLEAN)
- executed_at (TIMESTAMP)
```

#### `mcp_configurations`
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- server_name (VARCHAR)
- server_config (JSONB)
- is_active (BOOLEAN)
- created_at, updated_at (TIMESTAMP)
```

## Arquivos Principais

### Frontend
- `src/pages/Credentials.jsx` - Página de configuração de credenciais
- `src/components/CredentialForm.jsx` - Formulário de credenciais
- `src/components/PermissionModal.jsx` - Modal de permissão
- `src/pages/Chat.jsx` - Chat integrado com MCP

### Backend
- `backend/routes/credentials.js` - API para gerenciar credenciais
- `backend/routes/mcp-tools.js` - API para execução de tools MCP
- `mcp-tools-schema.sql` - Schema do banco para MCP

## Configuração

### 1. Variáveis de Ambiente
```bash
# Google APIs
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GEMINI_API_KEY=your_gemini_api_key

# Criptografia
ENCRYPTION_KEY=your-32-character-encryption-key

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Instalação de Dependências
```bash
# Frontend
npm install react-modal googleapis crypto-js

# Backend
npm install googleapis crypto-js socket.io @google/generative-ai
```

### 3. Configuração do Banco
```bash
# Executar o schema MCP
psql -d your_database -f mcp-tools-schema.sql
```

## Fluxo de Uso

### 1. Configuração Inicial
1. Usuário acessa `/credentials`
2. Insere credenciais Google OAuth
3. Sistema valida e criptografa as credenciais
4. Credenciais ficam disponíveis para uso

### 2. Uso no Chat
1. Usuário digita comando natural (ex: "Liste arquivos no Drive")
2. Sistema interpreta comando via IA
3. Se necessário tool MCP, exibe modal de permissão
4. Após permissão, executa tool e retorna resultado
5. Registra log da ação

### 3. Exemplos de Comandos
```
"Liste os últimos 10 arquivos no meu Drive"
"Ler dados da planilha de vendas, células A1:D20"
"Escrever 'Teste' na célula A1 da planilha X"
```

## Segurança

### Criptografia
- Todas as credenciais sensíveis são criptografadas com AES
- Chave de criptografia configurável via variável de ambiente
- Tokens de acesso são renovados automaticamente

### Controle de Acesso
- Row Level Security (RLS) no Supabase
- Autenticação obrigatória para todas as operações
- Logs de auditoria para todas as ações

### Permissões
- Usuário deve autorizar cada ação explicitamente
- Modal claro com descrição da ação
- Possibilidade de negar qualquer operação

## Monitoramento

### Logs de Permissão
- Todas as permissões são registradas
- Inclui detalhes da ação e resultado
- Acessível via API `/api/mcp/permission-logs`

### Validação de Credenciais
- Verificação automática de validade
- Renovação automática de tokens
- Marcação de credenciais inválidas

## Próximos Passos

### Melhorias Planejadas
1. **WebSocket**: Comunicação em tempo real para permissões
2. **Mais Tools**: Integração com outros serviços Google
3. **Cache**: Cache de resultados para melhor performance
4. **Bulk Operations**: Operações em lote para múltiplos arquivos

### Extensões Possíveis
1. **Outros Provedores**: Microsoft Office, Dropbox, etc.
2. **Automação**: Agendamento de tarefas
3. **Templates**: Templates de comandos comuns
4. **Analytics**: Dashboard de uso das integrações

## Troubleshooting

### Problemas Comuns

#### Credenciais Inválidas
- Verificar se as APIs Google estão habilitadas
- Confirmar se o Client ID e Secret estão corretos
- Verificar se o Refresh Token é válido

#### Erro de Permissão
- Verificar se as credenciais estão configuradas
- Confirmar se o usuário tem acesso aos arquivos/planilhas
- Verificar logs de permissão para detalhes

#### Performance Lenta
- Verificar conexão com APIs Google
- Considerar implementar cache
- Monitorar uso de rate limits

## Suporte

Para dúvidas ou problemas:
1. Verificar logs do backend
2. Consultar logs de permissão
3. Validar credenciais Google
4. Verificar configuração do banco de dados
