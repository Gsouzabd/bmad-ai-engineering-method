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

interface ToolsSummaryProps {
  tools: ToolInfo[]
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
  const success = tools.filter(t => t.status === 'success').length
  const error = tools.filter(t => t.status === 'error').length
  
  if (error > 0) {
    return { 
      text: `${error} erro(s)`, 
      variant: 'destructive' as const,
      icon: <XCircleIcon className="size-3" />
    }
  }
  
  if (success > 0) {
    return { 
      text: `${success} ferramenta${success !== 1 ? 's' : ''}`, 
      variant: 'secondary' as const,
              icon: <CheckCircleIcon className="size-3 text-green-600" />
    }
  }
  
  return { 
    text: 'Nenhuma ferramenta', 
    variant: 'secondary' as const,
    icon: <WrenchIcon className="size-3" />
  }
}

const ToolsSummary: React.FC<ToolsSummaryProps> = ({ tools }) => {
  const [isOpen, setIsOpen] = useState(false)
  
  if (!tools || tools.length === 0) {
    return null
  }
  
  const statusSummary = getStatusSummary(tools)
  
  return (
    <div className="mb-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm"
            className="h-auto p-2 text-left hover:bg-gray-700/50 border border-gray-600 hover:border-purple-500/50 transition-all duration-200 bg-gradient-to-r from-gray-800 to-gray-700"
          >
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-gradient-to-br from-purple-500 to-purple-700 rounded-md flex items-center justify-center shadow-lg">
                <WrenchIcon className="size-2 text-white" />
              </div>
              <Badge variant={statusSummary.variant} className="text-xs gap-1 px-2 py-1 bg-gray-700 border-gray-600 text-gray-300">
                {statusSummary.icon}
                {statusSummary.text}
              </Badge>
              {isOpen ? (
                <ChevronDownIcon className="size-3 text-gray-400" />
              ) : (
                <ChevronRightIcon className="size-3 text-gray-400" />
              )}
            </div>
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-3">
          <div className="space-y-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-700 rounded-md flex items-center justify-center shadow-lg">
                <WrenchIcon className="size-3 text-white" />
              </div>
              <span className="font-medium text-gray-100">
                Ferramentas Executadas
              </span>
              <Badge variant="outline" className="text-xs border-purple-500/50 text-purple-300 bg-purple-900/30">
                {tools.length} ferramenta{tools.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            
            {tools.map((tool, index) => (
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
            ))}
            
            {tools.every(tool => tool.status === 'success') && tools.length > 0 && (
              <div className="mt-3 flex items-center justify-center gap-2 p-3 bg-green-900/30 rounded-lg border border-green-700/50">
                <CheckCircleIcon className="size-4 text-green-400" />
                <span className="text-sm text-green-300 font-medium">
                  Todas as ferramentas executadas com sucesso!
                </span>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

export default ToolsSummary
