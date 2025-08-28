import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import CredentialForm from '../components/CredentialForm';
import { Settings, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const Credentials = () => {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      setFetching(true);
      const response = await fetch('/api/credentials', {
        headers: {
          'Authorization': `Bearer ${user.access_token}`
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
          'Authorization': `Bearer ${user.access_token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao salvar credenciais');
      }

      const data = await response.json();
      setCredentials(data);
      return data;
    } catch (error) {
      throw error;
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
          'Authorization': `Bearer ${user.access_token}`
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

  const getStatusIcon = () => {
    if (!credentials) return null;
    
    if (credentials.is_valid) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else {
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusText = () => {
    if (!credentials) return 'Não configurado';
    
    if (credentials.is_valid) {
      return 'Válido';
    } else {
      return 'Inválido';
    }
  };

  const getStatusColor = () => {
    if (!credentials) return 'text-gray-500';
    
    if (credentials.is_valid) {
      return 'text-green-600';
    } else {
      return 'text-red-600';
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-2 text-dark-secondary">Carregando configurações...</p>
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
          <h1 className="text-3xl font-bold text-dark-primary">
            Configurações de Integração
          </h1>
        </div>
        <p className="text-dark-secondary">
          Configure suas credenciais do Google para integrar com Sheets e Drive
        </p>
      </div>

      {/* Status das credenciais */}
      {credentials && (
        <div className="mb-8">
          <div className="card glass-effect">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon()}
                <div>
                  <h3 className="font-semibold text-dark-primary">Status das Credenciais</h3>
                  <p className={`text-sm ${getStatusColor()}`}>
                    {getStatusText()}
                  </p>
                </div>
              </div>
              <div className="text-right text-sm text-dark-muted">
                <p>Configurado em: {new Date(credentials.created_at).toLocaleDateString('pt-BR')}</p>
                {credentials.updated_at !== credentials.created_at && (
                  <p>Atualizado em: {new Date(credentials.updated_at).toLocaleDateString('pt-BR')}</p>
                )}
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={handleDeleteCredentials}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Deletar Credenciais
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formulário de credenciais */}
      <div className="card glass-effect">
        <CredentialForm 
          onSubmit={handleSubmitCredentials}
          loading={loading}
        />
      </div>

      {/* Informações sobre a integração */}
      <div className="mt-8">
        <div className="card glass-effect">
          <h3 className="text-lg font-semibold text-dark-primary mb-4">
            Sobre a Integração MCP
          </h3>
          <div className="space-y-4 text-dark-secondary">
            <p>
              Esta integração permite que seus agentes de IA acessem e manipulem dados no Google Sheets e Google Drive 
              através do Model Context Protocol (MCP).
            </p>
            <div className="bg-blue-50 p-4 rounded-md">
              <h4 className="font-medium text-blue-900 mb-2">Funcionalidades disponíveis:</h4>
              <ul className="text-blue-800 space-y-1 text-sm">
                <li>• <strong>Google Sheets:</strong> Ler e escrever dados em planilhas</li>
                <li>• <strong>Google Drive:</strong> Listar e ler arquivos</li>
                <li>• <strong>Segurança:</strong> Todas as ações requerem sua permissão explícita</li>
                <li>• <strong>Logs:</strong> Todas as permissões são registradas para auditoria</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Credentials;
