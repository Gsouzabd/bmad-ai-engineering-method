-- Remover RLS (Row Level Security) das tabelas
-- Execute estas queries no Supabase Dashboard > SQL Editor

-- 1. Desabilitar RLS na tabela agents
ALTER TABLE agents DISABLE ROW LEVEL SECURITY;

-- 2. Desabilitar RLS na tabela conversations
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;

-- 3. Desabilitar RLS na tabela messages
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- 4. Desabilitar RLS na tabela knowledge_base
ALTER TABLE knowledge_base DISABLE ROW LEVEL SECURITY;

-- 5. Remover todas as políticas existentes (opcional)
DROP POLICY IF EXISTS "Users can view their own agents" ON agents;
DROP POLICY IF EXISTS "Users can insert their own agents" ON agents;
DROP POLICY IF EXISTS "Users can update their own agents" ON agents;
DROP POLICY IF EXISTS "Users can delete their own agents" ON agents;

DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can insert their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete their own conversations" ON conversations;

DROP POLICY IF EXISTS "Users can view messages from their conversations" ON messages;
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON messages;

DROP POLICY IF EXISTS "Users can view their own knowledge base" ON knowledge_base;
DROP POLICY IF EXISTS "Users can insert their own knowledge base" ON knowledge_base;

-- Verificar se as tabelas existem e criar se necessário
CREATE TABLE IF NOT EXISTS agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  prompt TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_type VARCHAR(50),
  extracted_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
