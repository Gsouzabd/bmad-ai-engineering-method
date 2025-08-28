-- =====================================================
-- AI Agent Workspace - Schema do Banco de Dados
-- =====================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- =====================================================
-- TABELAS PRINCIPAIS
-- =====================================================

-- Tabela de agentes
CREATE TABLE IF NOT EXISTS agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  prompt TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de credenciais do usuário (Google OAuth)
CREATE TABLE IF NOT EXISTS user_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id VARCHAR(255) NOT NULL,
  client_secret TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  access_token TEXT,
  token_expiry TIMESTAMP WITH TIME ZONE,
  is_valid BOOLEAN DEFAULT true,
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

-- Tabela de arquivos da base de conhecimento
CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_url TEXT NOT NULL,
  extracted_text TEXT,
  chunks_count INTEGER DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de chunks da base de conhecimento (para RAG)
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  file_id UUID REFERENCES knowledge_base(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding vector(3072), -- OpenAI text-embedding-3-large tem 3072 dimensões
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de conversas
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de mensagens
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  role VARCHAR(10) NOT NULL CHECK (role IN ('user', 'assistant')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para agents
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_created_at ON agents(created_at DESC);

-- Índices para knowledge_base
CREATE INDEX IF NOT EXISTS idx_knowledge_base_agent_id ON knowledge_base(agent_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_user_id ON knowledge_base(user_id);

-- Índices para knowledge_chunks
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_agent_id ON knowledge_chunks(agent_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_user_id ON knowledge_chunks(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_file_id ON knowledge_chunks(file_id);
-- Usar HNSW index para embeddings de alta dimensionalidade (mais de 2000 dimensões)
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding ON knowledge_chunks USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

-- Índices para conversations
CREATE INDEX IF NOT EXISTS idx_conversations_agent_id ON conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);

-- Índices para messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Índices para user_credentials
CREATE INDEX IF NOT EXISTS idx_user_credentials_user_id ON user_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_user_credentials_is_valid ON user_credentials(is_valid);

-- Índices para permission_logs
CREATE INDEX IF NOT EXISTS idx_permission_logs_user_id ON permission_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_permission_logs_agent_id ON permission_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_permission_logs_executed_at ON permission_logs(executed_at DESC);

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

-- Triggers para atualizar updated_at (com verificação de duplicação)
DROP TRIGGER IF EXISTS update_agents_updated_at ON agents;
CREATE TRIGGER update_agents_updated_at 
    BEFORE UPDATE ON agents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para busca vetorial de chunks
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding vector(3072),
  match_threshold float,
  match_count int,
  agent_id_param uuid,
  user_id_param uuid
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float,
  file_name varchar(255)
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    kc.id,
    kc.content,
    1 - (kc.embedding <=> query_embedding) as similarity,
    kb.file_name
  FROM knowledge_chunks kc
  JOIN knowledge_base kb ON kc.file_id = kb.id
  WHERE 
    kc.agent_id = agent_id_param 
    AND kc.user_id = user_id_param
    AND 1 - (kc.embedding <=> query_embedding) > match_threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS DE SEGURANÇA
-- =====================================================

-- Políticas para agents
CREATE POLICY "Users can view their own agents" ON agents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own agents" ON agents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agents" ON agents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agents" ON agents
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para knowledge_base
CREATE POLICY "Users can view their own knowledge base" ON knowledge_base
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own knowledge base" ON knowledge_base
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own knowledge base" ON knowledge_base
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own knowledge base" ON knowledge_base
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para knowledge_chunks
CREATE POLICY "Users can view their own knowledge chunks" ON knowledge_chunks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own knowledge chunks" ON knowledge_chunks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own knowledge chunks" ON knowledge_chunks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own knowledge chunks" ON knowledge_chunks
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para conversations
CREATE POLICY "Users can view their own conversations" ON conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" ON conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" ON conversations
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para messages
CREATE POLICY "Users can view messages from their conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages to their conversations" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages from their conversations" ON messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages from their conversations" ON messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );

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

-- =====================================================
-- DADOS DE EXEMPLO (OPCIONAL)
-- =====================================================

-- Inserir alguns agentes de exemplo (apenas para desenvolvimento)
-- Descomente as linhas abaixo se quiser dados de exemplo

/*
INSERT INTO agents (name, description, prompt, user_id) VALUES
(
  'Assistente de Vendas',
  'Agente especializado em vendas e atendimento ao cliente',
  'Você é um assistente de vendas especializado em ajudar clientes a encontrar os produtos ideais. Seja amigável, profissional e sempre foque em entender as necessidades do cliente antes de fazer recomendações.',
  '00000000-0000-0000-0000-000000000000'
),
(
  'Suporte Técnico',
  'Agente para suporte técnico e resolução de problemas',
  'Você é um especialista em suporte técnico. Ajude os usuários a resolver problemas de forma clara e passo a passo. Sempre confirme se a solução funcionou antes de encerrar o atendimento.',
  '00000000-0000-0000-0000-000000000000'
);
*/

-- =====================================================
-- VERIFICAÇÕES FINAIS
-- =====================================================

-- Verificar se as tabelas foram criadas
SELECT 'agents' as table_name, COUNT(*) as row_count FROM agents
UNION ALL
SELECT 'knowledge_base' as table_name, COUNT(*) as row_count FROM knowledge_base
UNION ALL
SELECT 'knowledge_chunks' as table_name, COUNT(*) as row_count FROM knowledge_chunks
UNION ALL
SELECT 'conversations' as table_name, COUNT(*) as row_count FROM conversations
UNION ALL
SELECT 'messages' as table_name, COUNT(*) as row_count FROM messages;

-- Verificar se as políticas estão ativas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('agents', 'knowledge_base', 'knowledge_chunks', 'conversations', 'messages')
ORDER BY tablename, policyname;
