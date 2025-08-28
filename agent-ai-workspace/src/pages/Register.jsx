import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Bot, Eye, EyeOff, User, Mail, Lock, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  })
  
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const validatePassword = (password) => {
    setPasswordStrength({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    })
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    if (name === 'password') {
      validatePassword(value)
    }
  }

  const isPasswordValid = () => {
    return Object.values(passwordStrength).every(Boolean)
  }

  const isFormValid = () => {
    return (
      formData.name.trim() &&
      formData.email.trim() &&
      formData.password &&
      formData.confirmPassword &&
      formData.password === formData.confirmPassword &&
      isPasswordValid()
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!isFormValid()) {
      toast.error('Por favor, preencha todos os campos corretamente')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }

    setLoading(true)
    
    try {
      await signUp(formData.email, formData.password)
      toast.success('Conta criada com sucesso! Verifique seu email para confirmar.')
      navigate('/welcome')
    } catch (error) {
      console.error('Erro no cadastro:', error)
      toast.error(error.message || 'Erro ao criar conta')
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
              Crie sua conta
            </h2>
            <p className="text-dark-secondary">
              Ou{' '}
              <Link
                to="/login"
                className="font-medium text-primary-400 hover:text-primary-300 transition-colors duration-200"
              >
                faça login se já tem uma conta
              </Link>
            </p>
          </div>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Nome */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-dark-secondary mb-2">
                  Nome completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-dark-muted" />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    className="input-field pl-10"
                    placeholder="Seu nome completo"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

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
                    value={formData.email}
                    onChange={handleInputChange}
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
                    autoComplete="new-password"
                    required
                    className="input-field pl-10 pr-10"
                    placeholder="Crie uma senha forte"
                    value={formData.password}
                    onChange={handleInputChange}
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

              {/* Confirmar Senha */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-dark-secondary mb-2">
                  Confirmar senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-dark-muted" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    className="input-field pl-10 pr-10"
                    placeholder="Confirme sua senha"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-dark-muted hover:text-dark-secondary transition-colors duration-200"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Validação de senha */}
            {formData.password && (
              <div className="bg-dark-tertiary rounded-lg p-4 border border-dark-border">
                <h4 className="text-sm font-medium text-dark-secondary mb-3">
                  Sua senha deve conter:
                </h4>
                <ul className="space-y-2">
                  <li className={`flex items-center text-sm ${passwordStrength.length ? 'text-green-400' : 'text-dark-muted'}`}>
                    <CheckCircle className={`h-4 w-4 mr-2 ${passwordStrength.length ? 'text-green-400' : 'text-dark-muted'}`} />
                    Pelo menos 8 caracteres
                  </li>
                  <li className={`flex items-center text-sm ${passwordStrength.uppercase ? 'text-green-400' : 'text-dark-muted'}`}>
                    <CheckCircle className={`h-4 w-4 mr-2 ${passwordStrength.uppercase ? 'text-green-400' : 'text-dark-muted'}`} />
                    Uma letra maiúscula
                  </li>
                  <li className={`flex items-center text-sm ${passwordStrength.lowercase ? 'text-green-400' : 'text-dark-muted'}`}>
                    <CheckCircle className={`h-4 w-4 mr-2 ${passwordStrength.lowercase ? 'text-green-400' : 'text-dark-muted'}`} />
                    Uma letra minúscula
                  </li>
                  <li className={`flex items-center text-sm ${passwordStrength.number ? 'text-green-400' : 'text-dark-muted'}`}>
                    <CheckCircle className={`h-4 w-4 mr-2 ${passwordStrength.number ? 'text-green-400' : 'text-dark-muted'}`} />
                    Um número
                  </li>
                  <li className={`flex items-center text-sm ${passwordStrength.special ? 'text-green-400' : 'text-dark-muted'}`}>
                    <CheckCircle className={`h-4 w-4 mr-2 ${passwordStrength.special ? 'text-green-400' : 'text-dark-muted'}`} />
                    Um caractere especial
                  </li>
                </ul>
              </div>
            )}

            {/* Termos e condições */}
            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-dark-border rounded bg-dark-secondary"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-dark-secondary">
                Eu concordo com os{' '}
                <a href="#" className="text-primary-400 hover:text-primary-300 transition-colors duration-200">
                  Termos de Serviço
                </a>{' '}
                e{' '}
                <a href="#" className="text-primary-400 hover:text-primary-300 transition-colors duration-200">
                  Política de Privacidade
                </a>
              </label>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !isFormValid()}
                className="btn-primary w-full"
              >
                {loading ? 'Criando conta...' : 'Criar conta'}
              </button>
            </div>
          </form>

          {/* Informações adicionais */}
          <div className="text-center mt-6 pt-6 border-t border-dark-border">
            <p className="text-xs text-dark-muted">
              Ao criar uma conta, você concorda em receber emails sobre atualizações e novidades.
              Você pode cancelar a qualquer momento.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
