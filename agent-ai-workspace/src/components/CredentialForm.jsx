import React, { useState } from 'react';
import { Eye, EyeOff, Save, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const CredentialForm = ({ onSubmit, loading = false }) => {
  const [formData, setFormData] = useState({
    clientId: '',
    clientSecret: '',
    refreshToken: ''
  });
  const [showSecrets, setShowSecrets] = useState(false);
  const [validationStatus, setValidationStatus] = useState(null); // 'success', 'error', null

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Reset validation status when user starts typing
    if (validationStatus) {
      setValidationStatus(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.clientId || !formData.clientSecret || !formData.refreshToken) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    try {
      setValidationStatus('loading');
      await onSubmit(formData);
      setValidationStatus('success');
      toast.success('Credenciais validadas e salvas com sucesso!');
    } catch (error) {
      setValidationStatus('error');
      toast.error(error.message || 'Erro ao validar credenciais');
    }
  };

  const toggleShowSecrets = () => {
    setShowSecrets(!showSecrets);
  };

  const getStatusIcon = () => {
    if (validationStatus === 'success') {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (validationStatus === 'error') {
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
    return null;
  };

  const getStatusText = () => {
    if (validationStatus === 'success') {
      return 'Credenciais válidas';
    }
    if (validationStatus === 'error') {
      return 'Erro na validação';
    }
    return '';
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Configuração de Credenciais</h2>
        {getStatusIcon()}
      </div>
      
      {getStatusText() && (
        <div className={`mb-4 p-3 rounded-md text-sm ${
          validationStatus === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {getStatusText()}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">
            Client ID
          </label>
                     <input
             type="text"
             id="clientId"
             name="clientId"
             placeholder="179038630567-6fovc3r450gd14mf0f2ajv6a46dlfiaj.apps.googleusercontent.com"
             value={formData.clientId}
             onChange={handleInputChange}
             className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
             disabled={loading}
             style={{ color: 'black' }}
           />
        </div>

        <div>
          <label htmlFor="clientSecret" className="block text-sm font-medium text-gray-700 mb-1">
            Client Secret
          </label>
          <div className="relative">
            <input
              type={showSecrets ? "text" : "password"}
              id="clientSecret"
              name="clientSecret"
              placeholder="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"
              value={formData.clientSecret}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              type="button"
              onClick={toggleShowSecrets}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              disabled={loading}
            >
              {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="refreshToken" className="block text-sm font-medium text-gray-700 mb-1">
            Refresh Token
          </label>
          <div className="relative">
            <input
              type={showSecrets ? "text" : "password"}
              id="refreshToken"
              name="refreshToken"
              placeholder="1//04dX..."
              value={formData.refreshToken}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              type="button"
              onClick={toggleShowSecrets}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              disabled={loading}
            >
              {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || validationStatus === 'loading'}
          className="w-full flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading || validationStatus === 'loading' ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {loading || validationStatus === 'loading' ? 'Validando...' : 'Validar e Salvar'}
        </button>
      </form>

      <div className="mt-4 p-3 bg-blue-50 rounded-md">
        <p className="text-sm text-blue-700">
          <strong>Como obter as credenciais:</strong>
        </p>
        <ol className="text-sm text-blue-600 mt-2 list-decimal list-inside space-y-1">
          <li>Acesse o Google Cloud Console</li>
          <li>Crie um projeto e habilite as APIs do Google Drive e Sheets</li>
          <li>Configure as credenciais OAuth 2.0</li>
          <li>Use o Client ID e Client Secret gerados</li>
          <li>Obtenha o Refresh Token através do fluxo OAuth</li>
        </ol>
      </div>
    </div>
  );
};

export default CredentialForm;
