import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ToolModal from '../components/ToolModal';
import { Settings, CheckCircle, AlertCircle, FileText, FolderOpen } from 'lucide-react';
import toast from 'react-hot-toast';

const Credentials = () => {
  const { user, token } = useAuth();
  const [credentials, setCredentials] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Configuração das ferramentas disponíveis
  const tools = [
    {
      id: 'google-drive',
      name: 'Google Drive',
      description: 'Acesse e gerencie arquivos no seu Google Drive',
      icon: <FolderOpen className="h-6 w-6 text-white" />,
      colorClass: 'bg-gradient-to-br from-blue-500 to-blue-600',
      features: [
        'Listar arquivos e pastas',
        'Ler conteúdo de arquivos',
        'Download de arquivos',
        'Buscar arquivos por nome'
      ],
      examples: [
        'Liste arquivos no meu Google Drive',
        'Baixe o arquivo "relatorio.pdf"',
        'Busque arquivos com nome "projeto"'
      ]
    },
    {
      id: 'google-sheets',
      name: 'Google Sheets',
      description: 'Leia e escreva dados em planilhas do Google',
      icon: <FileText className="h-6 w-6 text-white" />,
      colorClass: 'bg-gradient-to-br from-green-500 to-green-600',
      features: [
        'Ler dados de planilhas',
        'Escrever dados em células',
        'Criar novas planilhas',
        'Atualizar fórmulas'
      ],
      examples: [
        'Leia dados da planilha "Relatório de Vendas"',
        'Crie uma nova planilha com os dados de clientes',
        'Adicione dados na célula A1 da planilha X'
      ]
    }
  ];

  useEffect(() => {
    fetchCredentials();
    
    // Verificar parâmetros da URL para feedback do OAuth
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      toast.success('Credenciais Google configuradas com sucesso!');
      fetchCredentials(); // Recarregar credenciais
    } else if (urlParams.get('error') === 'oauth_failed') {
      toast.error('Erro ao configurar credenciais Google. Tente novamente.');
    }
  }, []);

  const fetchCredentials = async () => {
    try {
      setFetching(true);
      const response = await fetch('/api/credentials', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCredentials(data);
      }
    } catch (error) {
      console.error('Erro ao buscar credenciais:', error);
    } finally {
      setFetching(false);
    }
  };



  const handleSubmitCredentials = async (formData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao salvar credenciais');
      }

      const data = await response.json();
      setCredentials(data);
             toast.success('Credenciais salvas! Agora clique em "Conectar com Google" para autorizar o acesso.');
      return data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async () => {
    try {
      setOauthLoading(true);
      const response = await fetch('/api/oauth/auth', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Redirecionar para o Google OAuth
        window.location.href = data.authUrl;
      } else {
        throw new Error('Erro ao iniciar fluxo OAuth');
      }
    } catch (error) {
      toast.error('Erro ao iniciar autenticação Google');
      console.error('Erro:', error);
    } finally {
      setOauthLoading(false);
    }
  };

  const handleRefreshToken = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/oauth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Token renovado com sucesso!');
        fetchCredentials(); // Recarregar status
      } else {
        throw new Error('Erro ao renovar token');
      }
    } catch (error) {
      toast.error('Erro ao renovar token');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCredentials = async () => {
    if (!window.confirm('Tem certeza que deseja deletar suas credenciais? Isso irá desabilitar a integração com Google Sheets e Drive.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/credentials', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setCredentials(null);
        toast.success('Credenciais deletadas com sucesso!');
      } else {
        throw new Error('Erro ao deletar credenciais');
      }
    } catch (error) {
      toast.error('Erro ao deletar credenciais');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  // Funções para gerenciar o modal
  const openToolModal = (tool) => {
    setSelectedTool(tool);
    setIsModalOpen(true);
  };

  const closeToolModal = () => {
    setIsModalOpen(false);
    setSelectedTool(null);
  };

  const handleCredentialsUpdate = async (formData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao salvar credenciais');
      }

      const data = await response.json();
      setCredentials(data);
      toast.success('Credenciais salvas! Agora clique em "Autorizar com Google" para conectar.');
      return data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (!credentials) return null;
    
    if (credentials.hasTokens) {
      return credentials.is_valid ? 
        <CheckCircle className="h-5 w-5 text-green-500" /> : 
        <AlertCircle className="h-5 w-5 text-orange-500" />;
    } else {
      return <Settings className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusText = () => {
    if (!credentials) return 'Não configurado';
    
    // Verificar se tem tokens OAuth configurados
    if (credentials.hasTokens) {
      return credentials.is_valid ? 'Conectado' : 'Token Expirado';
    } else {
      return 'Configurado (aguardando OAuth)';
    }
  };

  const getStatusColor = () => {
    if (!credentials) return 'text-gray-500';
    
    if (credentials.hasTokens) {
      return credentials.is_valid ? 'text-green-600' : 'text-orange-600';
    } else {
      return 'text-blue-600';
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                     <p className="mt-2 text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="h-6 w-6 text-primary-500" />
                     <h1 className="text-3xl font-bold text-black-main">
             Configurações de Integração
           </h1>
        </div>
                 <p className="text-gray-600">
           Configure suas credenciais do Google para integrar com Sheets e Drive
         </p>
      </div>

      {/* Ferramentas Disponíveis */}
      <div className="mb-8">
        <div className="card glass-effect">
          <div className="flex items-center justify-between mb-4">
                         <h3 className="text-lg font-semibold text-black-main">
               Ferramentas Disponíveis
             </h3>
            <div className="flex items-center gap-2">
              {credentials?.hasTokens && credentials?.is_valid ? (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Todas ativas</span>
                </div>
              ) : credentials?.hasTokens ? (
                <div className="flex items-center gap-1 text-orange-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Token expirado</span>
                </div>
              ) : credentials ? (
                <div className="flex items-center gap-1 text-blue-600">
                  <Settings className="h-4 w-4" />
                  <span className="text-sm font-medium">Aguardando OAuth</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-gray-600">
                  <Settings className="h-4 w-4" />
                  <span className="text-sm font-medium">Não configurado</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tools.map((tool) => (
              <div
                key={tool.id}
                onClick={() => openToolModal(tool)}
                className={`flex items-center p-4 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-md ${
                  credentials?.hasTokens && credentials?.is_valid 
                    ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 hover:from-blue-100 hover:to-blue-200' 
                    : credentials?.hasTokens 
                    ? 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200 hover:from-orange-100 hover:to-orange-200'
                    : 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 hover:from-gray-100 hover:to-gray-200'
                }`}
              >
                <div className="flex-shrink-0 mr-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    credentials?.hasTokens && credentials?.is_valid 
                      ? tool.colorClass
                      : credentials?.hasTokens 
                      ? 'bg-gradient-to-br from-orange-500 to-orange-600'
                      : 'bg-gradient-to-br from-gray-400 to-gray-500'
                  }`}>
                    {tool.icon}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                                         <h4 className="font-semibold text-black-main">{tool.name}</h4>
                    {credentials?.hasTokens && credentials?.is_valid && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {credentials?.hasTokens && !credentials?.is_valid && (
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                    )}
                    {!credentials?.hasTokens && (
                      <Settings className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                                     <p className="text-sm text-gray-600">
                     {tool.description}
                   </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {tool.features.slice(0, 3).map((feature, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {feature}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 text-xs text-blue-600 font-medium">
                    Clique para configurar →
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>💡 Dica:</strong> Clique em qualquer ferramenta para configurar suas credenciais Google OAuth2. 
              Seus agentes de IA poderão então usar comandos específicos para cada ferramenta.
            </p>
          </div>
        </div>
      </div>

                   {/* Modal da Ferramenta */}
      {selectedTool && (
        <ToolModal
          isOpen={isModalOpen}
          onClose={closeToolModal}
          tool={selectedTool}
          credentials={credentials}
          onCredentialsUpdate={handleCredentialsUpdate}
          onOAuthLogin={handleOAuthLogin}
          onRefreshToken={handleRefreshToken}
          onDeleteCredentials={handleDeleteCredentials}
          loading={loading}
          oauthLoading={oauthLoading}
        />
      )}
    </div>
  );
};

export default Credentials;
