import React, { useState } from 'react'
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from '@/components/tool'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { 
  WrenchIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon, 
  ChevronDownIcon,
  ChevronRightIcon 
} from 'lucide-react'

type ToolStatus = 'executing' | 'success' | 'error' | 'pending'

interface ToolInfo {
  name: string
  displayName?: string
  description?: string
  status: ToolStatus
  args?: any
  result?: any
  error?: string
  isAdditional?: boolean
}

interface ToolsExecutionHistoryProps {
  tools: ToolInfo[]
  isActive?: boolean // Se está executando ferramentas no momento
  isCompact?: boolean // Versão compacta para mensagens
}

const mapStatusToAIState = (status: ToolStatus) => {
  switch (status) {
    case 'pending':
      return 'input-streaming'
    case 'executing':
      return 'input-available'
    case 'success':
      return 'output-available'
    case 'error':
      return 'output-error'
    default:
      return 'input-streaming'
  }
}

const getToolIcon = (toolName: string) => {
  const iconMap: Record<string, string> = {
    'gdrive_list_files': '📁',
    'gdrive_read_file': '📄',
    'sheets_read_values': '📊',
    'sheets_write_values': '✏️'
  }
  return iconMap[toolName] || '🔧'
}

const getStatusSummary = (tools: ToolInfo[]) => {
  const executing = tools.filter(t => t.status === 'executing').length
  const success = tools.filter(t => t.status === 'success').length
  const error = tools.filter(t => t.status === 'error').length
  
  if (executing > 0) {
    return { 
      text: `${executing} executando...`, 
      variant: 'secondary' as const,
              icon: <ClockIcon className="size-3 animate-pulse text-blue-600" />
    }
  }
  
  if (error > 0) {
    return { 
      text: `${error} erro(s), ${success} sucesso(s)`, 
      variant: 'destructive' as const,
      icon: <XCircleIcon className="size-3" />
    }
  }
  
  if (success > 0) {
    return { 
      text: `${success} concluída(s)`, 
      variant: 'default' as const,
              icon: <CheckCircleIcon className="size-3 text-green-600" />
    }
  }
  
  return { 
    text: 'Aguardando...', 
    variant: 'secondary' as const,
    icon: <ClockIcon className="size-3 text-gray-400" />
  }
}

const ToolsExecutionHistory: React.FC<ToolsExecutionHistoryProps> = ({ 
  tools, 
  isActive = false,
  isCompact = false 
}) => {
  // TODOS OS HOOKS DEVEM VIR PRIMEIRO
  const [isOpen, setIsOpen] = useState(isActive) // Aberto apenas se está ativo
  
  // Atualizar estado de abertura quando isActive muda
  React.useEffect(() => {
    if (isActive && !isOpen) {
      setIsOpen(true)
    }
  }, [isActive, isOpen])
  
  const statusSummary = getStatusSummary(tools)
  
    return (
    <div className={isCompact ? "mb-2" : "mb-4"}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="outline" 
            className={`w-full justify-between h-auto text-left bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-600 hover:border-purple-500/50 hover:bg-gray-700/80 transition-all duration-200 ${isCompact ? 'p-3' : 'p-4'}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-700 rounded-md flex items-center justify-center shadow-lg">
                <WrenchIcon className="size-3 text-white" />
              </div>
              <span className="font-medium text-gray-100">
                Ferramentas MCP
              </span>
              <Badge variant={statusSummary.variant} className="text-xs gap-1 bg-gray-700 border-gray-600 text-gray-300">
                {statusSummary.icon}
                {statusSummary.text}
              </Badge>
              {tools.length > 0 && (
                <Badge variant="outline" className="text-xs border-purple-500/50 text-purple-300 bg-purple-900/30">
                  {tools.length} ferramenta{tools.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isActive && (
                <div className="size-2 bg-purple-500 rounded-full animate-pulse shadow-lg shadow-purple-500/50" />
              )}
              {isOpen ? (
                <ChevronDownIcon className="size-4 text-gray-400" />
              ) : (
                <ChevronRightIcon className="size-4 text-gray-400" />
              )}
            </div>
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-3 space-y-3">
          {tools.length === 0 ? (
            <div className="text-center py-4 text-gray-400 text-sm bg-gray-800/50 rounded-lg border border-gray-700">
              Nenhuma ferramenta executada ainda
            </div>
          ) : (
            tools.map((tool, index) => (
              <Tool key={`${tool.name}-${index}`} defaultOpen={false}>
                <ToolHeader
                  type={`${getToolIcon(tool.name)} ${tool.displayName || tool.name}${tool.isAdditional ? ' (adicional)' : ''}`}
                  state={mapStatusToAIState(tool.status)}
                />
                <ToolContent>
                  {tool.args && (
                    <ToolInput input={tool.args} />
                  )}
                  {(tool.result || tool.error) && (
                    <ToolOutput
                      output={tool.result ? (
                        <div className="text-sm max-h-32 overflow-y-auto">
                          {typeof tool.result === 'string' 
                            ? tool.result.substring(0, 500) + (tool.result.length > 500 ? '...' : '')
                            : JSON.stringify(tool.result, null, 2)
                          }
                        </div>
                      ) : undefined}
                      errorText={tool.error}
                    />
                  )}
                </ToolContent>
              </Tool>
            ))
          )}
          
          {tools.every(tool => tool.status === 'success') && tools.length > 0 && (
            <div className="mt-3 flex items-center justify-center gap-2 p-3 bg-green-900/30 rounded-lg border border-green-700/50">
              <CheckCircleIcon className="size-4 text-green-400" />
              <span className="text-sm text-green-300 font-medium">
                Todas as ferramentas executadas com sucesso!
              </span>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

export default ToolsExecutionHistory
