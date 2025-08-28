# Teste das Histórias de Usuário: Integração com Google Sheets e Drive

## Responsável: Agente PM

### Objetivo
Validar as histórias de usuário com testes específicos, usando as credenciais fornecidas, para garantir que atendem aos critérios de aceitação.

### Histórias de Usuário e Testes

1. **Configuração de Credenciais**
   - **História**: Como usuário, quero configurar credenciais do Google no painel da plataforma, para que meu agente acesse Google Sheets e Drive sem configuração manual de APIs.
   - **Teste**:
     - **Descrição**: Testar a configuração e validação das credenciais.
     - **Passos**:
       - Acessar o painel e inserir:
         - Client ID: `[SEU_CLIENT_ID_AQUI]`
         - Client Secret: `[SEU_CLIENT_SECRET_AQUI]`
       - Clicar em "Validar e Salvar".
       - Tentar inserir credenciais inválidas (ex.: Client Secret errado).
     - **Resultado Esperado**:
       - Credenciais válidas: Mensagem de sucesso e armazenamento no Supabase.
       - Credenciais inválidas: Mensagem de erro clara (ex.: "Falha na autenticação").
     - **Tarefa Associada**: *task configure-credentials-test*

2. **Permissão para Execução de Tools**
   - **História**: Como usuário, quero que o agente solicite permissão via um box de aceite/decline antes de executar tools, para garantir controle sobre as ações.
   - **Teste**:
     - **Descrição**: Testar o modal de permissão no chat.
     - **Passos**:
       - Digitar no chat: "Ler planilha X no Google Sheets".
       - Verificar se o modal aparece com descrição (ex.: "Permitir leitura da planilha X?").
       - Clicar em "Aceitar" e "Recusar" em testes separados.
     - **Resultado Esperado**:
       - Aceitar: Tool executado e resultado exibido.
       - Recusar: Mensagem "Ação cancelada pelo usuário" e log no Supabase.
     - **Tarefa Associada**: *task permission-ui-test*

3. **Execução de Tools no Chat**
   - **História**: Como usuário, quero que o agente execute tools (ex.: ler/escrever em Sheets, listar arquivos no Drive) com base no contexto do chat, usando minha base de conhecimento.
   - **Teste**:
     - **Descrição**: Testar a execução de tools com as credenciais fornecidas.
     - **Passos**:
       - Configurar credenciais no painel.
       - Digitar no chat: "Listar arquivos no meu Drive".
       - Aceitar a permissão no modal.
       - Repetir com: "Ler células A1:B10 da planilha X".
       - Testar comando ambíguo (ex.: "Ver planilha").
     - **Resultado Esperado**:
       - Drive: Lista de arquivos retornada.
       - Sheets: Dados em CSV retornados.
       - Comando ambíguo: Resposta "Por favor, especifique o ID da planilha".
     - **Tarefa Associada**: *task tool-execution-test*

### Entregáveis
- **Plano de Teste por História**: Este documento, com testes detalhados.
- **Relatório de Testes**: (Pós-teste) Resultados e evidências.

### Próximos Passos
- Transferir para o agente **ux-expert** para testar a interface do modal.
- Transferir para o agente **architect** para testar a integração MCP.