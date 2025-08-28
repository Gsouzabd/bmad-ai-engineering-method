import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  Bot, 
  Plus, 
  MessageSquare, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  User,
  Key
} from 'lucide-react'

const Layout = ({ children }) => {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Bot },
    { name: 'Criar Agente', href: '/create-agent', icon: Plus },
    { name: 'Credenciais', href: '/credentials', icon: Key },
  ]

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  return (
    <div className="min-h-screen gradient-bg">
      {/* Sidebar para desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col flex-grow sidebar glass-effect">
          <div className="flex items-center flex-shrink-0 px-6 py-4">
            <div className="p-2 rounded-lg bg-primary-600/20">
              <Bot className="h-8 w-8 text-primary-400" />
            </div>
            <h1 className="ml-3 text-xl font-bold text-gradient">
              AI Agent Workspace
            </h1>
          </div>
          
          <nav className="flex-1 px-4 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30 shadow-lg'
                      : 'text-dark-secondary hover:bg-dark-tertiary hover:text-dark-primary border border-transparent hover:border-dark-border'
                  }`}
                >
                  <item.icon className={`mr-3 h-5 w-5 transition-colors duration-200 ${
                    isActive ? 'text-primary-400' : 'text-dark-muted group-hover:text-dark-primary'
                  }`} />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          <div className="flex-shrink-0 border-t border-dark-border p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-2 rounded-lg bg-dark-tertiary">
                  <User className="h-6 w-6 text-dark-muted" />
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-dark-secondary">
                  {user?.email}
                </p>
              </div>
              <button
                onClick={handleSignOut}
                className="ml-2 p-2 text-dark-muted hover:text-red-400 rounded-lg hover:bg-dark-tertiary transition-all duration-200"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar mobile */}
      <div className={`md:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 z-40">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full sidebar glass-effect">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                onClick={() => setSidebarOpen(false)}
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full bg-dark-tertiary border border-dark-border focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <X className="h-6 w-6 text-dark-secondary" />
              </button>
            </div>
            
            <div className="flex items-center flex-shrink-0 px-6 py-4">
              <div className="p-2 rounded-lg bg-primary-600/20">
                <Bot className="h-8 w-8 text-primary-400" />
              </div>
              <h1 className="ml-3 text-xl font-bold text-gradient">
                AI Agent Workspace
              </h1>
            </div>
            
            <nav className="flex-1 px-4 space-y-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30 shadow-lg'
                        : 'text-dark-secondary hover:bg-dark-tertiary hover:text-dark-primary border border-transparent hover:border-dark-border'
                    }`}
                  >
                    <item.icon className={`mr-3 h-5 w-5 transition-colors duration-200 ${
                      isActive ? 'text-primary-400' : 'text-dark-muted group-hover:text-dark-primary'
                    }`} />
                    {item.name}
                  </Link>
                )
              })}
            </nav>

            <div className="flex-shrink-0 border-t border-dark-border p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-2 rounded-lg bg-dark-tertiary">
                    <User className="h-6 w-6 text-dark-muted" />
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-dark-secondary">
                    {user?.email}
                  </p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="ml-2 p-2 text-dark-muted hover:text-red-400 rounded-lg hover:bg-dark-tertiary transition-all duration-200"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="md:pl-64">
        {/* Header mobile */}
        <div className="md:hidden glass-effect border-b border-dark-border px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-dark-secondary hover:text-dark-primary rounded-lg hover:bg-dark-tertiary transition-all duration-200"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center">
              <div className="p-1 rounded-lg bg-primary-600/20">
                <Bot className="h-6 w-6 text-primary-400" />
              </div>
              <h1 className="ml-2 text-lg font-bold text-gradient">
                AI Agent Workspace
              </h1>
            </div>
            <div className="w-10" />
          </div>
        </div>

        {/* Conteúdo da página */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout
