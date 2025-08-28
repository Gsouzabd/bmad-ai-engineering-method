import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Carregar variáveis de ambiente
dotenv.config({ path: join(__dirname, '.env') })

// Debug: verificar se as variáveis estão carregadas
console.log('🔍 Debug - Variáveis de ambiente:')
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Configurada' : '❌ Não configurada')
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Configurada' : '❌ Não configurada')

export default process.env
