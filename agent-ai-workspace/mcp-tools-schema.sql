-- =====================================================
-- MCP Tools Integration - Schema do Banco de Dados
-- =====================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELAS PARA INTEGRAÇÃO MCP
-- =====================================================

-- Tabela de credenciais do usuário (Google OAuth)
CREATE TABLE IF NOT EXISTS user_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id VARCHAR(255) NOT NULL,
  client_secret TEXT NOT NULL,
  refresh_token TEXT, -- Permite NULL (será preenchido após OAuth)
  access_token TEXT, -- Permite NULL (será preenchido após OAuth)
  token_expiry TIMESTAMP WITH TIME ZONE,
  is_valid BOOLEAN DEFAULT false, -- Começa como false até OAuth ser completado
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Tabela de logs de permissão
CREATE TABLE IF NOT EXISTS permission_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  tool_name VARCHAR(100) NOT NULL,
  tool_description TEXT NOT NULL,
  permission_granted BOOLEAN NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de configurações MCP por usuário
CREATE TABLE IF NOT EXISTS mcp_configurations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  server_name VARCHAR(100) NOT NULL, -- 'gdrive' ou 'sheets'
  server_config JSONB NOT NULL, -- configuração do servidor MCP
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, server_name)
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para user_credentials
CREATE INDEX IF NOT EXISTS idx_user_credentials_user_id ON user_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_user_credentials_is_valid ON user_credentials(is_valid);
CREATE INDEX IF NOT EXISTS idx_user_credentials_token_expiry ON user_credentials(token_expiry);

-- Índices para permission_logs
CREATE INDEX IF NOT EXISTS idx_permission_logs_user_id ON permission_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_permission_logs_agent_id ON permission_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_permission_logs_executed_at ON permission_logs(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_permission_logs_tool_name ON permission_logs(tool_name);

-- Índices para mcp_configurations
CREATE INDEX IF NOT EXISTS idx_mcp_configurations_user_id ON mcp_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_mcp_configurations_server_name ON mcp_configurations(server_name);
CREATE INDEX IF NOT EXISTS idx_mcp_configurations_is_active ON mcp_configurations(is_active);

-- =====================================================
-- FUNÇÕES E TRIGGERS
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
DROP TRIGGER IF EXISTS update_user_credentials_updated_at ON user_credentials;
CREATE TRIGGER update_user_credentials_updated_at 
    BEFORE UPDATE ON user_credentials 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_mcp_configurations_updated_at ON mcp_configurations;
CREATE TRIGGER update_mcp_configurations_updated_at 
    BEFORE UPDATE ON mcp_configurations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para limpar tokens expirados
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
  UPDATE user_credentials 
  SET is_valid = false 
  WHERE token_expiry < NOW() AND is_valid = true;
END;
$$ language 'plpgsql';

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE user_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_configurations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS DE SEGURANÇA
-- =====================================================

-- Políticas para user_credentials
CREATE POLICY "Users can view their own credentials" ON user_credentials
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credentials" ON user_credentials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own credentials" ON user_credentials
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own credentials" ON user_credentials
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para permission_logs
CREATE POLICY "Users can view their own permission logs" ON permission_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own permission logs" ON permission_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para mcp_configurations
CREATE POLICY "Users can view their own MCP configurations" ON mcp_configurations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own MCP configurations" ON mcp_configurations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own MCP configurations" ON mcp_configurations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own MCP configurations" ON mcp_configurations
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- DADOS DE EXEMPLO (OPCIONAL)
-- =====================================================

-- Inserir configurações MCP padrão (apenas para desenvolvimento)
-- Descomente as linhas abaixo se quiser dados de exemplo

/*
INSERT INTO mcp_configurations (user_id, server_name, server_config) VALUES
(
  '00000000-0000-0000-0000-000000000000',
  'gdrive',
  '{"command": "npx", "args": ["@modelcontextprotocol/server-gdrive"], "env": {"GDRIVE_CREDENTIALS_PATH": "/path/to/credentials.json"}}'
),
(
  '00000000-0000-0000-0000-000000000000',
  'sheets',
  '{"command": "npx", "args": ["@mcp/server-sheets"], "env": {"ACCESS_TOKEN": "USER_ACCESS_TOKEN"}}'
);
*/

-- =====================================================
-- VERIFICAÇÕES FINAIS
-- =====================================================

-- Verificar se as tabelas foram criadas
SELECT 'user_credentials' as table_name, COUNT(*) as row_count FROM user_credentials
UNION ALL
SELECT 'permission_logs' as table_name, COUNT(*) as row_count FROM permission_logs
UNION ALL
SELECT 'mcp_configurations' as table_name, COUNT(*) as row_count FROM mcp_configurations;

-- Verificar se as políticas estão ativas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('user_credentials', 'permission_logs', 'mcp_configurations')
ORDER BY tablename, policyname;
