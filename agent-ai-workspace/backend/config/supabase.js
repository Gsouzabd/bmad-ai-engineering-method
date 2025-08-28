import { createClient } from '@supabase/supabase-js'

// Configurações do Supabase
const supabaseUrl = 'https://wtwcewoltqrkdosirvot.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0d2Nld29sdHFya2Rvc2lydm90Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM4NTA1OSwiZXhwIjoyMDcxOTYxMDU5fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Variáveis de ambiente do Supabase não configuradas')
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Configuração do storage
const STORAGE_BUCKET = 'uploads'

export { STORAGE_BUCKET }
