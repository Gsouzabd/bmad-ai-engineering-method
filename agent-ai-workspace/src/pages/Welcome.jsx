import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bot, CheckCircle, ArrowRight, Sparkles } from 'lucide-react'

const Welcome = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const navigate = useNavigate()

  const steps = [
    {
      icon: <Bot className="h-12 w-12 text-primary-400" />,
      title: 'Bem-vindo ao AI Agent Workspace!',
      description: 'Crie, configure e teste agentes de IA personalizados para suas necessidades específicas.',
      color: 'bg-primary-600/20'
    },
    {
      icon: <Sparkles className="h-12 w-12 text-yellow-400" />,
      title: 'Agentes Inteligentes',
      description: 'Configure prompts personalizados para moldar o comportamento e conhecimento dos seus agentes.',
      color: 'bg-yellow-600/20'
    },
    {
      icon: <CheckCircle className="h-12 w-12 text-green-400" />,
      title: 'Base de Conhecimento',
      description: 'Adicione arquivos e documentos para enriquecer a base de conhecimento dos seus agentes.',
      color: 'bg-green-600/20'
    }
  ]

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1)
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [currentStep, steps.length])

  const handleGetStarted = () => {
    navigate('/')
  }

  const handleSkip = () => {
    navigate('/')
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-primary-600/20 shadow-lg mb-6">
            <Bot className="h-10 w-10 text-primary-400" />
          </div>
          <h1 className="text-4xl font-bold text-dark-primary mb-4">
            Parabéns! Sua conta foi criada com sucesso
          </h1>
          <p className="text-lg text-dark-secondary">
            Vamos te ajudar a começar com o AI Agent Workspace
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-8 mb-12">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`relative p-6 rounded-xl border-2 transition-all duration-500 ${
                index <= currentStep
                  ? 'border-primary-500/30 bg-dark-card shadow-xl'
                  : 'border-dark-border bg-dark-tertiary'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${step.color}`}>
                  {step.icon}
                </div>
                <div className="flex-1">
                  <h3 className={`text-xl font-semibold mb-2 transition-colors ${
                    index <= currentStep ? 'text-dark-primary' : 'text-dark-muted'
                  }`}>
                    {step.title}
                  </h3>
                  <p className={`text-base transition-colors ${
                    index <= currentStep ? 'text-dark-secondary' : 'text-dark-muted'
                  }`}>
                    {step.description}
                  </p>
                </div>
                {index <= currentStep && (
                  <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-center space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index <= currentStep ? 'bg-primary-500' : 'bg-dark-border'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleSkip}
            className="px-6 py-3 text-dark-secondary hover:text-dark-primary font-medium transition-colors"
          >
            Pular introdução
          </button>
          <button
            onClick={handleGetStarted}
            className="btn-primary inline-flex items-center px-6 py-3"
          >
            Começar agora
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </div>

        {/* Tips */}
        <div className="mt-12 text-center">
          <div className="card gradient-card">
            <h4 className="text-lg font-semibold text-dark-primary mb-2">
              💡 Dica rápida
            </h4>
            <p className="text-dark-secondary">
              Comece criando seu primeiro agente. Você pode configurar prompts personalizados 
              e adicionar arquivos para criar um assistente especializado em suas necessidades.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Welcome
