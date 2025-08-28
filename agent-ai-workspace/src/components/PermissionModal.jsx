import React from 'react';
import Modal from 'react-modal';
import { Check, X } from 'lucide-react';

const PermissionModal = ({ isOpen, onAccept, onDecline, toolDescription, toolName }) => {
  return (
    <Modal 
      isOpen={isOpen} 
      onRequestClose={onDecline} 
      className="fixed inset-0 flex items-center justify-center z-50"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50"
    >
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto m-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Permissão Necessária</h2>
          <button 
            onClick={onDecline}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-700 mb-2">
            O agente irá executar a seguinte ação:
          </p>
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm font-medium text-gray-900 mb-1">
              {toolName}
            </p>
            <p className="text-sm text-gray-600">
              {toolDescription}
            </p>
          </div>
        </div>
        
        <div className="flex justify-end gap-3">
          <button 
            onClick={onDecline} 
            className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            <X className="h-4 w-4 mr-2" />
            Recusar
          </button>
          <button 
            onClick={onAccept} 
            className="flex items-center px-4 py-2 text-white bg-green-500 hover:bg-green-600 rounded-md transition-colors"
          >
            <Check className="h-4 w-4 mr-2" />
            Aceitar
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PermissionModal;
