-- =====================================================
-- AI Agent Workspace - Schema Alternativo (Compatível com ivfflat)
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

-- Tabela de chunks da base de conhecimento (para RAG) - Versão compatível
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  file_id UUID REFERENCES knowledge_base(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI text-embedding-3-small tem 1536 dimensões (compatível com ivfflat)
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

-- Índices para knowledge_chunks (compatível com ivfflat)
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_agent_id ON knowledge_chunks(agent_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_user_id ON knowledge_chunks(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_file_id ON knowledge_chunks(file_id);
-- Usar ivfflat para embeddings de 1536 dimensões (compatível)
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Índices para conversations
CREATE INDEX IF NOT EXISTS idx_conversations_agent_id ON conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);

-- Índices para messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

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

-- Função para busca vetorial de chunks (versão compatível)
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  agent_id_param uuid,
  user_id_param uuid
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float,
  file_name text
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
