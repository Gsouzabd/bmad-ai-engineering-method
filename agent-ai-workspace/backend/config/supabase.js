import { createClient } from '@supabase/supabase-js'

// Configurações do Supabase
const supabaseUrl = 'https://wtwcewoltqrkdosirvot.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0d2Nld29sdHFya2Rvc2lydm90Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM4NTA1OSwiZXhwIjoyMDcxOTYxMDU5fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'

// Para desenvolvimento, usar a chave anônima se a service key não estiver configurada
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0d2Nld29sdHFya2Rvc2lydm90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzODUwNTksImV4cCI6MjA3MTk2MTA1OX0.A_fJ1clNiV-mf4YRXGHyH4RHcN_ZtMkFypd2et25vJY'

if (!supabaseUrl) {
  throw new Error('URL do Supabase não configurada')
}

// Usar service key se disponível, senão usar anon key para desenvolvimento
const apiKey = supabaseServiceKey && !supabaseServiceKey.includes('Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8') 
  ? supabaseServiceKey 
  : supabaseAnonKey

export const supabase = createClient(supabaseUrl, apiKey)

// Configuração do storage
const STORAGE_BUCKET = 'uploads'

export { STORAGE_BUCKET }
