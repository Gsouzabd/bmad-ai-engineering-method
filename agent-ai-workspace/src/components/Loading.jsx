import { Loader2 } from 'lucide-react'

const Loading = () => {
  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg">
      <div className="text-center">
        <div className="p-4 rounded-full bg-primary-600/20 mb-4 mx-auto w-16 h-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
        </div>
        <p className="text-dark-secondary">Carregando...</p>
      </div>
    </div>
  )
}

export default Loading
