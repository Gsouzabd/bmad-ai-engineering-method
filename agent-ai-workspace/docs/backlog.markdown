# Backlog: AI Agent Workspace

**Data**: 28 de agosto de 2025  
**Autor**: Sarah, Dono do Produto (BMad-Method)  
**Projeto**: AI Agent Workspace (Web App)

## 1. Visão Geral
Este documento define o backlog do MVP do **AI Agent Workspace**, uma aplicação web SaaS para criação, configuração e teste de agentes de IA. O backlog inclui histórias de usuário priorizadas, critérios de aceitação e um plano de sprints para desenvolvimento, com base no PRD e wireframes.

## 2. Histórias de Usuário
As histórias são priorizadas usando o método MoSCoW e alinhadas com as funcionalidades do PRD: criar agente, definir prompt, alimentar base de conhecimento e testar em chat.

### 2.1 Must-have (Obrigatório para o MVP)
- **História 1: Criar Agente**  
  - **Descrição**: Como usuário, quero criar um novo agente de IA com nome e descrição, para que eu possa configurar um assistente personalizado.  
  - **Critérios de Aceitação**:  
    - Interface permite inserir nome (mín. 3 caracteres) e descrição (opcional, máx. 200 caracteres).  
    - Agente é salvo no Supabase com ID único.  
    - Limite de 10 agentes por usuário.  
    - Mensagem de sucesso/erro exibida após salvar.  
  - **Prioridade**: Must-have  
  - **Esforço Estimado**: 3 pontos  
  - **Dependências**: Tela de criação de agente (wireframe 3.2), endpoint POST /agents.

- **História 2: Definir Prompt**  
  - **Descrição**: Como usuário, quero definir um prompt customizado para meu agente, para que ele responda conforme minhas necessidades.  
  - **Critérios de Aceitação**:  
    - Campo de texto suporta até 1.000 caracteres.  
    - Visualização prévia do prompt antes de salvar.  
    - Validação impede prompts vazios.  
    - Prompt é salvo no Supabase e associado ao agente.  
  - **Prioridade**: Must-have  
  - **Esforço Estimado**: 3 pontos  
  - **Dependências**: Tela de definição de prompt (wireframe 3.3), endpoint PUT /agents/:agentId/prompt.

- **História 3: Alimentar Base de Conhecimento**  
  - **Descrição**: Como usuário, quero carregar arquivos (PDF, CSV, TXT, XLSX) para a base de conhecimento do agente, para que ele use esses dados em respostas.  
  - **Critérios de Aceitação**:  
    - Suporte a upload de arquivos até 10MB (PDF, CSV, TXT, XLSX).  
    - Interface de drag-and-drop ou botão "Selecionar Arquivo".  
    - Arquivo é salvo no Hetzner Object Storage; metadados no Supabase.  
    - Feedback visual (progresso, erro para formatos inválidos).  
  - **Prioridade**: Must-have  
  - **Esforço Estimado**: 5 pontos  
  - **Dependências**: Tela de upload (wireframe 3.4), endpoint POST /agents/:agentId/knowledge-base.

- **História 4: Testar Agente via Chat**  
  - **Descrição**: Como usuário, quero interagir com meu agente via chat, para testar suas respostas com base no prompt e base de conhecimento.  
  - **Critérios de Aceitação**:  
    - Interface de chat exibe mensagens do usuário e respostas do agente.  
    - Tempo de resposta ≤ 2 segundos (90% dos casos).  
    - Histórico de conversa salvo por sessão no Supabase.  
    - Indicador de "digitando" durante resposta do agente.  
  - **Prioridade**: Must-have  
  - **Esforço Estimado**: 5 pontos  
  - **Dependências**: Tela de chat (wireframe 3.5), endpoint POST /agents/:agentId/chat, integração com API de IA (Grok/OpenAI).

- **História 5: Dashboard Inicial**  
  - **Descrição**: Como usuário, quero ver uma lista dos meus agentes e criar novos, para gerenciar meu workspace.  
  - **Critérios de Aceitação**:  
    - Dashboard exibe lista de agentes (nome, descrição, última modificação).  
    - Botão "Criar Novo Agente" leva à tela de criação.  
    - Filtros rápidos (ordenar por data/nome).  
    - Navegação para editar/testar agentes.  
  - **Prioridade**: Must-have  
  - **Esforço Estimado**: 3 pontos  
  - **Dependências**: Tela inicial (wireframe 3.1).

- **História 6: Autenticação de Usuário**  
  - **Descrição**: Como usuário, quero fazer login com e-mail/senha ou OAuth, para acessar meu workspace com segurança.  
  - **Critérios de Aceitação**:  
    - Suporte a login via e-mail/senha e OAuth (ex.: Google).  
    - Autenticação via Supabase Authentication.  
    - Token JWT gerado para chamadas de API.  
    - Mensagem de erro para credenciais inválidas.  
  - **Prioridade**: Must-have  
  - **Esforço Estimado**: 3 pontos  
  - **Dependências**: Supabase Authentication.

### 2.2 Should-have (Desejável, mas não crítico para o MVP)
- **História 7: Exportar Conversas do Chat**  
  - **Descrição**: Como usuário, quero exportar o histórico de conversas do chat, para manter um registro das interações.  
  - **Critérios de Aceitação**:  
    - Botão "Exportar" gera arquivo TXT/CSV com histórico.  
    - Exportação inclui mensagens do usuário e agente.  
  - **Prioridade**: Should-have  
  - **Esforço Estimado**: 2 pontos  
  - **Dependências**: Tela de chat (wireframe 3.5).

### 2.3 Could-have (Opcional, para fases futuras)
- **História 8: Suporte a Temas Claro/Escuro**  
  - **Descrição**: Como usuário, quero alternar entre temas claro e escuro, para personalizar a interface.  
  - **Critérios de Aceitação**:  
    - Botão para alternar temas.  
    - Temas aplicados via Tailwind CSS.  
  - **Prioridade**: Could-have  
  - **Esforço Estimado**: 2 pontos  
  - **Dependências**: Frontend (React.js).

### 2.4 Won’t-have (Fora do escopo do MVP)
- Integração com ferramentas externas (ex.: Google Sheets, Slack).
- Suporte a outros formatos de arquivo (ex.: DOCX).
- Edição de mensagens no chat.

## 3. Planejamento de Sprints
**Duração**: 2 semanas por sprint  
**Equipe**: 2 desenvolvedores frontend, 2 backend, 1 UX/UI, 1 QA  
**Prazo Estimado para MVP**: 6 semanas (3 sprints)  
**Total de Pontos**: 21 pontos (Must-have)

### Sprint 1: Configuração Inicial e Autenticação
- **Histórias**: 5 (Dashboard Inicial), 6 (Autenticação de Usuário)  
- **Pontos**: 6 pontos  
- **Objetivo**: Implementar autenticação e dashboard básico para navegação.  
- **Entregáveis**:  
  - Interface do dashboard (React.js).  
  - Sistema de login com Supabase Authentication.  
  - Configuração inicial de backend (Node.js/Express) e banco (Supabase).  

### Sprint 2: Criação de Agente e Prompt
- **Histórias**: 1 (Criar Agente), 2 (Definir Prompt)  
- **Pontos**: 6 pontos  
- **Objetivo**: Permitir criação e configuração de agentes.  
- **Entregáveis**:  
  - Tela de criação de agente (React.js).  
  - Tela de definição de prompt (React.js).  
  - Endpoints POST /agents e PUT /agents/:agentId/prompt.  

### Sprint 3: Base de Conhecimento e Chat
- **Histórias**: 3 (Alimentar Base de Conhecimento), 4 (Testar Agente via Chat)  
- **Pontos**: 10 pontos  
- **Objetivo**: Completar o MVP com upload de arquivos e interface de chat.  
- **Entregáveis**:  
  - Tela de upload de base de conhecimento (React.js).  
  - Tela de chat (React.js).  
  - Endpoints POST /agents/:agentId/knowledge-base e POST /agents/:agentId/chat.  
  - Integração com Hetzner Object Storage e APIs de IA (Grok/OpenAI).  

## 4. Métricas de Sucesso
- **Métricas do Produto** (alinhadas com PRD):  
  - Média de ≥ 2 agentes criados por usuário ativo.  
  - Média de ≥ 10 conversas por agente.  
  - Taxa de retenção ≥ 70% após 3 meses.  
- **Métricas de Desenvolvimento**:  
  - Conclusão de todas as histórias Must-have em 6 semanas.  
  - Taxa de defeitos ≤ 5% durante testes de QA.  
  - Tempo de resposta da API ≤ 200ms (exceto IA, ≤ 2s).

## 5. Suposições e Riscos
- **Suposições**:  
  - Equipe pequena pode entregar o MVP em 6 semanas.  
  - Supabase e Hetzner suportam as necessidades do MVP.  
  - APIs de IA (Grok/OpenAI) são estáveis para integração.  
- **Riscos**:  
  - **Integração com IA**: Latência de APIs pode atrasar o chat.  
    - **Mitigação**: Implementar cache e fallback entre Grok/OpenAI.  
  - **Upload de Arquivos**: Extração de texto de arquivos complexos pode falhar.  
    - **Mitigação**: Limitar formatos e testar bibliotecas (ex.: pdf2json).  
  - **Cronograma**: Estimativas de esforço podem ser imprecisas.  
    - **Mitigação**: Revisar progresso no final de cada sprint.  

## 6. Próximos Passos
- Validar backlog com stakeholders.  
- Iniciar Sprint 1 (configuração inicial e autenticação).  
- Monitorar progresso com revisões semanais.  
- Preparar ambiente de desenvolvimento (React.js, Node.js, Supabase, Hetzner).