import { createClient } from '@supabase/supabase-js'

// Configurações diretas do Supabase
const supabaseUrl = 'https://wtwcewoltqrkdosirvot.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0d2Nld29sdHFya2Rvc2lydm90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzODUwNTksImV4cCI6MjA3MTk2MTA1OX0.A_fJ1clNiV-mf4YRXGHyH4RHcN_ZtMkFypd2et25vJY'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis de ambiente do Supabase não configuradas')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
