# Design de Interface: Modal de Permissão e Painel de Credenciais

## Responsável: Agente UX-Expert

### Objetivo
Projetar a interface de usuário para o modal de permissão e o painel de configuração de credenciais, garantindo usabilidade e clareza.

### Componentes de Interface

1. **Modal de Permissão**
   - **Descrição**: Modal exibido no chat quando o agente detecta a necessidade de executar um tool (ex.: "Permitir leitura da planilha X?").
   - **Especificações**:
     - Título: "Permissão Necessária".
     - Texto descritivo com detalhes do tool (ex.: "O agente irá ler dados da planilha X no Google Sheets").
     - Botões: "Aceitar" (verde, primário) e "Recusar" (cinza, secundário).
     - Estilo: Minimalista, com Tailwind CSS (cores neutras, bordas arredondadas).
   - **Wireframe**:
     ```
     +-----------------------------------+
     | Permissão Necessária              |
     +-----------------------------------+
     | O agente irá ler dados da         |
     | planilha X no Google Sheets.      |
     | Deseja permitir?                  |
     +-----------------------------------+
     | [Aceitar]        [Recusar]        |
     +-----------------------------------+
     ```
   - **Implementação**:
     ```jsx
     import React from 'react';
     import Modal from 'react-modal';

     const PermissionModal = ({ isOpen, onAccept, onDecline, toolDescription }) => {
       return (
         <Modal isOpen={isOpen} onRequestClose={onDecline} className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
           <h2 className="text-xl font-bold mb-4">Permissão Necessária</h2>
           <p className="mb-6">{toolDescription}</p>
           <div className="flex justify-end gap-4">
             <button onClick={onAccept} className="bg-green-500 text-white px-4 py-2 rounded">Aceitar</button>
             <button onClick={onDecline} className="bg-gray-300 text-black px-4 py-2 rounded">Recusar</button>
           </div>
         </Modal>
       );
     };
     export default PermissionModal;
     ```

2. **Painel de Configuração de Credenciais**
   - **Descrição**: Formulário no painel do usuário para inserir e validar credenciais Google.
   - **Especificações**:
     - Campos: `Client ID`, `Client Secret`, `Refresh Token`.
     - Botão: "Validar e Salvar" (valida via OAuth 2.0 antes de salvar).
     - Feedback: Mensagem de sucesso/erro (ex.: "Credenciais válidas" ou "Erro na validação").
     - Estilo: Formulário limpo com Tailwind CSS, layout em coluna.
   - **Wireframe**:
     ```
     +-----------------------------------+
     | Configuração de Credenciais       |
     +-----------------------------------+
     | Client ID: [_________________]    |
     | Client Secret: [_____________]    |
     | Refresh Token: [_____________]    |
     +-----------------------------------+
     | [Validar e Salvar]                |
     +-----------------------------------+
     ```
   - **Implementação**:
     ```jsx
     import React, { useState } from 'react';

     const CredentialForm = ({ onSubmit }) => {
       const [clientId, setClientId] = useState('');
       const [clientSecret, setClientSecret] = useState('');
       const [refreshToken, setRefreshToken] = useState('');

       const handleSubmit = () => {
         onSubmit({ clientId, clientSecret, refreshToken });
       };

       return (
         <div className="p-6 bg-white rounded-lg shadow-lg max-w-md mx-auto">
           <h2 className="text-xl font-bold mb-4">Configuração de Credenciais</h2>
           <div className="flex flex-col gap-4">
             <input
               type="text"
               placeholder="Client ID"
               value={clientId}
               onChange={(e) => setClientId(e.target.value)}
               className="border p-2 rounded"
             />
             <input
               type="text"
               placeholder="Client Secret"
               value={clientSecret}
               onChange={(e) => setClientSecret(e.target.value)}
               className="border p-2 rounded"
             />
             <input
               type="text"
               placeholder="Refresh Token"
               value={refreshToken}
               onChange={(e) => setRefreshToken(e.target.value)}
               className="border p-2 rounded"
             />
             <button onClick={handleSubmit} className="bg-blue-500 text-white px-4 py-2 rounded">
               Validar e Salvar
             </button>
           </div>
         </div>
       );
     };
     export default CredentialForm;
     ```

### Entregáveis
- **Especificações de UI**: Modal de permissão e formulário de credenciais.
- **Wireframes**: Desenhos ASCII e código JSX para componentes.
- **Protótipo**: (Opcional) Protótipo interativo em Figma ou React.

### Próximos Passos
- Transferir para o agente **architect** para integração com o backend.
- Validar design com o usuário antes de implementar.