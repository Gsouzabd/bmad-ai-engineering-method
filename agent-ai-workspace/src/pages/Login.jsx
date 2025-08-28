import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Bot, Eye, EyeOff, Mail, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error('Por favor, preencha todos os campos')
      return
    }

    setLoading(true)
    
    try {
      await signIn(email, password)
      toast.success('Login realizado com sucesso!')
      navigate('/')
    } catch (error) {
      console.error('Erro de autenticação:', error)
      toast.error(error.message || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="card glass-effect">
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-primary-600/20 mb-4">
              <Bot className="h-8 w-8 text-primary-400" />
            </div>
            <h2 className="text-3xl font-bold text-dark-primary mb-2">
              Entre na sua conta
            </h2>
            <p className="text-dark-secondary">
              Ou{' '}
              <Link
                to="/register"
                className="font-medium text-primary-400 hover:text-primary-300 transition-colors duration-200"
              >
                crie uma nova conta
              </Link>
            </p>
          </div>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-dark-secondary mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-dark-muted" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="input-field pl-10"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Senha */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-dark-secondary mb-2">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-dark-muted" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    className="input-field pl-10 pr-10"
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-dark-muted hover:text-dark-secondary transition-colors duration-200"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Esqueci minha senha */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-dark-border rounded bg-dark-secondary"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-dark-secondary">
                  Lembrar de mim
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-primary-400 hover:text-primary-300 transition-colors duration-200">
                  Esqueceu sua senha?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </div>
          </form>

          {/* Informações adicionais */}
          <div className="text-center mt-6 pt-6 border-t border-dark-border">
            <p className="text-xs text-dark-muted">
              Ao fazer login, você concorda com nossos{' '}
              <a href="#" className="text-primary-400 hover:text-primary-300 transition-colors duration-200">
                Termos de Serviço
              </a>{' '}
              e{' '}
              <a href="#" className="text-primary-400 hover:text-primary-300 transition-colors duration-200">
                Política de Privacidade
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
