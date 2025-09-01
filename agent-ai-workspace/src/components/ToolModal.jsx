import React, { useState } from 'react';
import { X, Settings, CheckCircle, AlertCircle, ExternalLink, RefreshCw, Trash2 } from 'lucide-react';
import CredentialForm from './CredentialForm';
import WooCommerceForm from './WooCommerceForm';
import toast from 'react-hot-toast';

const ToolModal = ({ 
  isOpen, 
  onClose, 
  tool, 
  credentials, 
  woocommerceCredentials,
  onCredentialsUpdate,
  onWooCommerceCredentialsUpdate,
  onOAuthLogin,
  onRefreshToken,
  onTestWooCommerceConnection,
  onDeleteCredentials,
  onDeleteWooCommerceCredentials,
  loading,
  oauthLoading 
}) => {
  const [activeTab, setActiveTab] = useState('config');

  if (!isOpen) return null;

  const getStatusIcon = () => {
    if (tool.id === 'woocommerce') {
      if (!woocommerceCredentials) return <Settings className="h-5 w-5 text-gray-500" />;
      return woocommerceCredentials.is_valid ? 
        <CheckCircle className="h-5 w-5 text-green-500" /> : 
        <AlertCircle className="h-5 w-5 text-orange-500" />;
    }
    
    if (!credentials) return <Settings className="h-5 w-5 text-gray-500" />;
    
    if (credentials.hasTokens) {
      return credentials.is_valid ? 
        <CheckCircle className="h-5 w-5 text-green-500" /> : 
        <AlertCircle className="h-5 w-5 text-orange-500" />;
    } else {
      return <Settings className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusText = () => {
    if (tool.id === 'woocommerce') {
      if (!woocommerceCredentials) return 'Não configurado';
      return woocommerceCredentials.is_valid ? 'Conectado' : 'Configurado (aguardando validação)';
    }
    
    if (!credentials) return 'Não configurado';
    
    if (credentials.hasTokens) {
      return credentials.is_valid ? 'Conectado' : 'Token Expirado';
    } else {
      return 'Configurado (aguardando OAuth)';
    }
  };

  const getStatusColor = () => {
    if (tool.id === 'woocommerce') {
      if (!woocommerceCredentials) return 'text-gray-500';
      return woocommerceCredentials.is_valid ? 'text-green-600' : 'text-orange-600';
    }
    
    if (!credentials) return 'text-gray-500';
    
    if (credentials.hasTokens) {
      return credentials.is_valid ? 'text-green-600' : 'text-orange-600';
    } else {
      return 'text-blue-600';
    }
  };

  const handleSubmitCredentials = async (formData) => {
    try {
      await onCredentialsUpdate(formData);
      setActiveTab('status');
    } catch (error) {
      toast.error('Erro ao salvar credenciais');
    }
  };

  const renderWooCommerceConfig = () => {
    if (!woocommerceCredentials) {
      return (
        <WooCommerceForm 
          onSubmit={onWooCommerceCredentialsUpdate}
          loading={loading}
        />
      );
    }

    if (!woocommerceCredentials.is_valid) {
      return (
        <div className="space-y-6">
          <div className="bg-orange-50 p-4 rounded-md">
            <h4 className="font-medium text-orange-900 mb-3 flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              Credenciais Configuradas (Aguardando Validação)
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-orange-800 font-medium">Site WordPress:</span>
                <span className="text-orange-700 font-mono text-xs bg-orange-100 px-2 py-1 rounded">
                  {woocommerceCredentials.wordpress_site_url}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-orange-800 font-medium">Status:</span>
                <span className="text-orange-700">
                  Configurado - precisa testar conexão
                </span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={onTestWooCommerceConnection}
              disabled={loading}
              className="btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Testando...' : 'Testar Conexão'}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-green-50 p-4 rounded-md">
        <h4 className="font-medium text-green-900 mb-3 flex items-center">
          <CheckCircle className="h-4 w-4 mr-2" />
          WooCommerce Conectado com Sucesso!
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-green-800 font-medium">Site WordPress:</span>
            <span className="text-green-700 font-mono text-xs bg-green-100 px-2 py-1 rounded">
              {woocommerceCredentials.wordpress_site_url}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-green-800 font-medium">Status:</span>
            <span className="text-green-700">
              Conectado e funcionando
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderGoogleConfig = () => {
    if (!credentials) {
      return (
        <CredentialForm 
          onSubmit={handleSubmitCredentials}
          loading={loading}
        />
      );
    }

    if (credentials.hasTokens && !credentials.is_valid) {
      return (
        <div className="space-y-6">
          <div className="bg-orange-50 p-4 rounded-md">
            <h4 className="font-medium text-orange-900 mb-3 flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              Credenciais Configuradas (Token Expirado)
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-orange-800 font-medium">Client ID:</span>
                <span className="text-orange-700 font-mono text-xs bg-orange-100 px-2 py-1 rounded">
                  {credentials.client_id.substring(0, 20)}...
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-orange-800 font-medium">Status:</span>
                <span className="text-orange-700">
                  Token expirado - precisa renovar
                </span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={onRefreshToken}
              disabled={loading}
              className="btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Renovando...' : 'Renovar Token'}
            </button>
          </div>
        </div>
      );
    }

    if (!credentials.hasTokens) {
      return (
        <div className="space-y-6">
          <div className="bg-green-50 p-4 rounded-md">
            <h4 className="font-medium text-green-900 mb-3 flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Credenciais Configuradas
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-green-800 font-medium">Client ID:</span>
                <span className="text-green-700 font-mono text-xs bg-green-100 px-2 py-1 rounded">
                  {credentials.client_id.substring(0, 20)}...
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-green-800 font-medium">Status:</span>
                <span className="text-green-700">
                  Aguardando autorização OAuth
                </span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={onOAuthLogin}
              disabled={oauthLoading}
              className="btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {oauthLoading ? 'Conectando...' : 'Autorizar com Google'}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-green-50 p-4 rounded-md">
        <h4 className="font-medium text-green-900 mb-3 flex items-center">
          <CheckCircle className="h-4 w-4 mr-2" />
          Configuração Completa
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-green-800 font-medium">Status:</span>
            <span className="text-green-700">
              Conectado e ativo
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderStatus = () => {
    if (tool.id === 'woocommerce') {
      if (!woocommerceCredentials) {
        return (
          <div className="text-center py-8">
            <Settings className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <h4 className="text-lg font-medium text-black-main mb-2">
              Não Configurado
            </h4>
            <p className="text-gray-600 mb-6">
              Configure as credenciais primeiro para usar o {tool.name}.
            </p>
            <button
              onClick={() => setActiveTab('config')}
              className="btn-primary px-4 py-2"
            >
              Configurar
            </button>
          </div>
        );
      }

      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <div>
                <h4 className="font-medium text-black-main">Status das Credenciais</h4>
                <p className={`text-sm ${getStatusColor()}`}>
                  {getStatusText()}
                </p>
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Site WordPress:</strong> {woocommerceCredentials.wordpress_site_url}</p>
            <p><strong>Configurado em:</strong> {new Date(woocommerceCredentials.created_at).toLocaleDateString('pt-BR')}</p>
          </div>

          <div className="flex gap-2 pt-4 border-t border-gray-200">
            {!woocommerceCredentials.is_valid && (
              <button
                onClick={onTestWooCommerceConnection}
                disabled={loading}
                className="flex items-center px-3 py-2 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
              >
                <AlertCircle className="h-4 w-4 mr-1" />
                Testar Conexão
              </button>
            )}
            <button
              onClick={onDeleteWooCommerceCredentials}
              disabled={loading}
              className="flex items-center px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Deletar Credenciais
            </button>
          </div>
        </div>
      );
    }

    if (!credentials) {
      return (
        <div className="text-center py-8">
          <Settings className="h-12 w-12 mx-auto text-gray-400 mb-2" />
          <h4 className="text-lg font-medium text-black-main mb-2">
            Não Configurado
          </h4>
          <p className="text-gray-600 mb-6">
            Configure as credenciais primeiro para usar o {tool.name}.
          </p>
          <button
            onClick={() => setActiveTab('config')}
            className="btn-primary px-4 py-2"
          >
            Configurar
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <h4 className="font-medium text-black-main">Status das Credenciais</h4>
              <p className={`text-sm ${getStatusColor()}`}>
                {getStatusText()}
              </p>
            </div>
          </div>
        </div>

        <div className="text-sm text-gray-600 space-y-2">
          <p><strong>Configurado em:</strong> {new Date(credentials.created_at).toLocaleDateString('pt-BR')}</p>
        </div>

        <div className="flex gap-2 pt-4 border-t border-gray-200">
          {credentials.hasTokens && !credentials.is_valid && (
            <button
              onClick={onRefreshToken}
              disabled={loading}
              className="flex items-center px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Renovar Token
            </button>
          )}
          <button
            onClick={onDeleteCredentials}
            disabled={loading}
            className="flex items-center px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Deletar Credenciais
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              (tool.id === 'woocommerce' && woocommerceCredentials?.is_valid) ||
              (tool.id !== 'woocommerce' && credentials?.hasTokens && credentials?.is_valid)
                ? tool.colorClass 
                : (tool.id === 'woocommerce' && woocommerceCredentials) ||
                  (tool.id !== 'woocommerce' && credentials?.hasTokens)
                ? 'bg-gradient-to-br from-orange-500 to-orange-600'
                : 'bg-gradient-to-br from-gray-400 to-gray-500'
            }`}>
              {tool.icon}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-black-main">{tool.name}</h2>
              <p className="text-sm text-gray-600">{tool.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('config')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'config'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Configuração
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'status'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Status
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'info'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Informações
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'config' && (
            <div className="space-y-6">
              {tool.id === 'woocommerce' ? (
                <div>
                  <h3 className="text-lg font-medium text-black-main mb-2">
                    Configuração do WooCommerce
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Configure suas credenciais da API REST do WooCommerce para conectar com sua loja online.
                  </p>
                  {renderWooCommerceConfig()}
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-medium text-black-main mb-2">
                    Configuração de Credenciais
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Configure suas credenciais OAuth2 do Google Cloud Console para usar o {tool.name}.
                  </p>
                  {renderGoogleConfig()}
                </div>
              )}
            </div>
          )}

          {activeTab === 'status' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-black-main mb-2">
                  Status da Conexão
                </h3>
              </div>
              {renderStatus()}
            </div>
          )}

          {activeTab === 'info' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-black-main mb-2">
                  Sobre o {tool.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {tool.description}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                <h4 className="font-medium text-black-main mb-2">Funcionalidades disponíveis:</h4>
                <ul className="text-gray-700 space-y-1 text-sm">
                  {tool.features.map((feature, index) => (
                    <li key={index}>• {feature}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-blue-50 p-4 rounded-md">
                <h4 className="font-medium text-blue-900 mb-2">Exemplos de comandos:</h4>
                <div className="space-y-2">
                  {tool.examples.map((example, index) => (
                    <div key={index} className="bg-white p-2 rounded text-xs font-mono text-blue-800">
                      "{example}"
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-md">
                <h4 className="font-medium text-green-900 mb-2">Segurança:</h4>
                <ul className="text-green-800 space-y-1 text-sm">
                  <li>• Autenticação OAuth2 segura via Google</li>
                  <li>• Credenciais criptografadas no banco de dados</li>
                  <li>• Todas as ações requerem sua autorização</li>
                  <li>• Logs de auditoria para todas as operações</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ToolModal;
