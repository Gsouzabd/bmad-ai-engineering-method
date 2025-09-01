-- =====================================================
-- Configuração da Tabela WooCommerce
-- =====================================================

-- Executar este script no seu banco de dados Supabase para criar a tabela de credenciais WooCommerce

-- Tabela de credenciais WooCommerce por usuário
CREATE TABLE IF NOT EXISTS woocommerce_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  wordpress_site_url VARCHAR(500) NOT NULL,
  woocommerce_consumer_key TEXT NOT NULL,
  woocommerce_consumer_secret TEXT NOT NULL,
  wordpress_username TEXT, -- Opcional
  wordpress_password TEXT, -- Opcional
  is_valid BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_woocommerce_credentials_user_id ON woocommerce_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_woocommerce_credentials_is_valid ON woocommerce_credentials(is_valid);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_woocommerce_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_woocommerce_credentials_updated_at
  BEFORE UPDATE ON woocommerce_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_woocommerce_credentials_updated_at();

-- Comentários para documentação
COMMENT ON TABLE woocommerce_credentials IS 'Armazena credenciais de API REST do WooCommerce para cada usuário';
COMMENT ON COLUMN woocommerce_credentials.wordpress_site_url IS 'URL completa do site WordPress (ex: https://minhaloja.com)';
COMMENT ON COLUMN woocommerce_credentials.woocommerce_consumer_key IS 'Chave do consumidor da API REST do WooCommerce (criptografada)';
COMMENT ON COLUMN woocommerce_credentials.woocommerce_consumer_secret IS 'Chave secreta da API REST do WooCommerce (criptografada)';
COMMENT ON COLUMN woocommerce_credentials.wordpress_username IS 'Nome de usuário WordPress para autenticação adicional (opcional, criptografado)';
COMMENT ON COLUMN woocommerce_credentials.wordpress_password IS 'Senha WordPress para autenticação adicional (opcional, criptografada)';
COMMENT ON COLUMN woocommerce_credentials.is_valid IS 'Indica se as credenciais foram validadas e estão funcionando';

-- Política de segurança RLS (Row Level Security)
ALTER TABLE woocommerce_credentials ENABLE ROW LEVEL SECURITY;

-- Política para usuários só poderem ver suas próprias credenciais
CREATE POLICY "Users can view own woocommerce credentials" ON woocommerce_credentials
  FOR SELECT USING (auth.uid() = user_id);

-- Política para usuários só poderem inserir suas próprias credenciais
CREATE POLICY "Users can insert own woocommerce credentials" ON woocommerce_credentials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para usuários só poderem atualizar suas próprias credenciais
CREATE POLICY "Users can update own woocommerce credentials" ON woocommerce_credentials
  FOR UPDATE USING (auth.uid() = user_id);

-- Política para usuários só poderem deletar suas próprias credenciais
CREATE POLICY "Users can delete own woocommerce credentials" ON woocommerce_credentials
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- INSTRUÇÕES DE USO
-- =====================================================

/*
1. Execute este script no seu banco de dados Supabase
2. A tabela será criada automaticamente com todas as políticas de segurança
3. As credenciais serão criptografadas no backend antes de serem salvas
4. Cada usuário só pode acessar suas próprias credenciais
5. O campo is_valid será atualizado automaticamente após teste de conexão
*/
