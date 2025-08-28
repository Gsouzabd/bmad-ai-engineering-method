-- =====================================================
-- Atualização do Schema - MCP Tools Integration
-- =====================================================

-- Atualizar a tabela user_credentials para permitir NULL nos tokens
-- (necessário para o modelo n8n onde tokens são obtidos via OAuth)

-- 1. Alterar refresh_token para permitir NULL
ALTER TABLE user_credentials ALTER COLUMN refresh_token DROP NOT NULL;

-- 2. Alterar access_token para permitir NULL (já deveria estar assim, mas garantindo)
ALTER TABLE user_credentials ALTER COLUMN access_token DROP NOT NULL;

-- 3. Alterar is_valid para começar como false
ALTER TABLE user_credentials ALTER COLUMN is_valid SET DEFAULT false;

-- 4. Atualizar registros existentes que podem ter is_valid = true sem tokens
UPDATE user_credentials 
SET is_valid = false 
WHERE (refresh_token IS NULL OR access_token IS NULL) AND is_valid = true;

-- 5. Verificar se as alterações foram aplicadas
SELECT 
  column_name, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_credentials' 
  AND column_name IN ('refresh_token', 'access_token', 'is_valid')
ORDER BY column_name;

-- 6. Mostrar status atual dos registros
SELECT 
  COUNT(*) as total_records,
  COUNT(refresh_token) as records_with_refresh_token,
  COUNT(access_token) as records_with_access_token,
  COUNT(*) FILTER (WHERE is_valid = true) as valid_records
FROM user_credentials;
