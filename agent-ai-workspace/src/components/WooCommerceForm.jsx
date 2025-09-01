import React, { useState } from 'react';
import { ShoppingCart, Globe, Key, Lock } from 'lucide-react';

const WooCommerceForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    wordpress_site_url: '',
    woocommerce_consumer_key: '',
    woocommerce_consumer_secret: '',
    wordpress_username: '',
    wordpress_password: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* URL do Site WordPress */}
      <div>
        <label htmlFor="wordpress_site_url" className="block text-sm font-medium text-gray-700 mb-2">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-blue-500" />
            URL do Site WordPress *
          </div>
        </label>
        <input
          type="url"
          id="wordpress_site_url"
          name="wordpress_site_url"
          value={formData.wordpress_site_url}
          onChange={handleChange}
          placeholder="https://sua-loja.com"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          URL completa do seu site WordPress (ex: https://minhaloja.com)
        </p>
      </div>

      {/* Consumer Key */}
      <div>
        <label htmlFor="woocommerce_consumer_key" className="block text-sm font-medium text-gray-700 mb-2">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-green-500" />
            Consumer Key *
          </div>
        </label>
        <input
          type="text"
          id="woocommerce_consumer_key"
          name="woocommerce_consumer_key"
          value={formData.woocommerce_consumer_key}
          onChange={handleChange}
          placeholder="ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Chave do consumidor da API REST do WooCommerce
        </p>
      </div>

      {/* Consumer Secret */}
      <div>
        <label htmlFor="woocommerce_consumer_secret" className="block text-sm font-medium text-gray-700 mb-2">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-red-500" />
            Consumer Secret *
          </div>
        </label>
        <input
          type="password"
          id="woocommerce_consumer_secret"
          name="woocommerce_consumer_secret"
          value={formData.woocommerce_consumer_secret}
          onChange={handleChange}
          placeholder="cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Chave secreta da API REST do WooCommerce
        </p>
      </div>

      {/* Username WordPress (Opcional) */}
      <div>
        <label htmlFor="wordpress_username" className="block text-sm font-medium text-gray-700 mb-2">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-purple-500" />
            Usuário WordPress (Opcional)
          </div>
        </label>
        <input
          type="text"
          id="wordpress_username"
          name="wordpress_username"
          value={formData.wordpress_username}
          onChange={handleChange}
          placeholder="admin"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Nome de usuário WordPress para autenticação adicional (opcional)
        </p>
      </div>

      {/* Senha WordPress (Opcional) */}
      <div>
        <label htmlFor="wordpress_password" className="block text-sm font-medium text-gray-700 mb-2">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-purple-500" />
            Senha WordPress (Opcional)
          </div>
        </label>
        <input
          type="password"
          id="wordpress_password"
          name="wordpress_password"
          value={formData.wordpress_password}
          onChange={handleChange}
          placeholder="••••••••"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Senha WordPress para autenticação adicional (opcional)
        </p>
      </div>

      {/* Informações de Ajuda */}
      <div className="bg-blue-50 p-4 rounded-md">
        <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" />
          Como obter as credenciais?
        </h4>
        <div className="text-sm text-blue-800 space-y-2">
          <p>1. Acesse o painel administrativo do WordPress</p>
          <p>2. Vá em <strong>WooCommerce → Configurações → Avançado → API REST</strong></p>
          <p>3. Clique em "Adicionar chave"</p>
          <p>4. Configure as permissões necessárias (leitura/escrita)</p>
          <p>5. Copie a Consumer Key e Consumer Secret geradas</p>
        </div>
      </div>

      {/* Botão de Envio */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={loading || !formData.wordpress_site_url || !formData.woocommerce_consumer_key || !formData.woocommerce_consumer_secret}
          className="w-full btn-primary py-3 px-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Salvando...
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4" />
              Salvar Credenciais WooCommerce
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default WooCommerceForm;
