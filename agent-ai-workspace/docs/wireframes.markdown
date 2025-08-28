# Wireframes: AI Agent Workspace

**Data**: 28 de agosto de 2025  
**Autor**: Sally, Especialista em UX (BMad-Method)  
**Projeto**: AI Agent Workspace (Web App)

## 1. Visão Geral
Este documento descreve os wireframes para o MVP do **AI Agent Workspace**, uma aplicação web SaaS que permite criar, configurar e testar agentes de IA. Os wireframes cobrem as funcionalidades principais do PRD: criar agente, definir prompt, alimentar base de conhecimento e testar via chat. O design é inspirado no LobeHub, com foco em simplicidade para pequenas empresas, agências e consultores.

## 2. Princípios de Design
- **Simplicidade**: Interfaces limpas, com poucos cliques para ações principais.
- **Feedback Claro**: Indicadores visuais para ações (ex.: upload concluído, erros).
- **Responsividade**: Layout adaptável para desktop e mobile.
- **Consistência**: Uso de Tailwind CSS para estilização uniforme (conforme arquitetura).

## 3. Wireframes

### 3.1 Tela Inicial (Dashboard)
**Descrição**: Exibe a lista de agentes criados pelo usuário, com opções para criar novo agente ou acessar configurações.  
**Elementos**:
- Barra de navegação superior: Logo, nome do usuário, logout.
- Botão "Criar Novo Agente".
- Lista de agentes (nome, descrição, última modificação).
- Filtros rápidos (ex.: ordenar por data).
**Esboço ASCII**:
```
+---------------------------+
| [Logo]  AI Agent Workspace | [Usuário] [Logout]
+---------------------------+
| [Criar Novo Agente]        |
| Filtros: [Data] [Nome]    |
+---------------------------+
| Agente 1 - Descrição curta | [Editar] [Testar]
| Agente 2 - Descrição curta | [Editar] [Testar]
+---------------------------+
```
**Especificações**:
- **Componentes React**: `<Navbar>`, `<Button>`, `<Table>` (lista de agentes).
- **Interações**: Clique em "Criar Novo Agente" leva à Tela 3.2; clique em "Testar" leva à Tela 3.5.

### 3.2 Tela de Criação de Agente
**Descrição**: Permite criar um novo agente com nome e descrição.  
**Elementos**:
- Campo de texto: Nome do agente.
- Campo de texto: Descrição (opcional).
- Botões: "Salvar" e "Cancelar".
**Esboço ASCII**:
```
+---------------------------+
| Criar Novo Agente         |
+---------------------------+
| Nome: [___________]       |
| Descrição: [____________] |
| [Salvar] [Cancelar]       |
+---------------------------+
```
**Especificações**:
- **Validação**: Nome obrigatório, mínimo 3 caracteres.
- **Feedback**: Mensagem de sucesso/erro ao salvar.
- **Componentes React**: `<Form>`, `<Input>`, `<Button>`.

### 3.3 Tela de Definição de Prompt
**Descrição**: Permite definir o prompt do agente, com visualização prévia.  
**Elementos**:
- Área de texto: Prompt (máx. 1.000 caracteres).
- Botão "Visualizar" para testar o prompt.
- Botões: "Salvar" e "Cancelar".
**Esboço ASCII**:
```
+---------------------------+
| Definir Prompt            |
+---------------------------+
| Prompt:                   |
| [_______________________] |
| [Visualizar]              |
| [Salvar] [Cancelar]       |
+---------------------------+
```
**Especificações**:
- **Validação**: Prompt não pode ser vazio.
- **Feedback**: Visualização mostra exemplo de resposta simulada.
- **Componentes React**: `<Textarea>`, `<Button>`.

### 3.4 Tela de Upload de Base de Conhecimento
**Descrição**: Permite carregar arquivos (PDF, CSV, TXT, XLSX) para a base de conhecimento.  
**Elementos**:
- Área de upload (drag-and-drop ou botão "Selecionar Arquivo").
- Lista de arquivos carregados (nome, tamanho, status).
- Botões: "Carregar" e "Remover".
**Esboço ASCII**:
```
+---------------------------+
| Base de Conhecimento      |
+---------------------------+
| [Arraste arquivos aqui]   |
| ou [Selecionar Arquivo]   |
+---------------------------+
| Arquivo1.pdf (2MB) [OK]   |
| Arquivo2.csv (1MB) [OK]   |
| [Carregar] [Remover]      |
+---------------------------+
```
**Especificações**:
- **Validação**: Arquivos até 10MB, formatos PDF, CSV, TXT, XLSX.
- **Feedback**: Barra de progresso durante upload; mensagem de erro para formatos inválidos.
- **Componentes React**: `<FileUpload>`, `<List>`, `<Button>`.

### 3.5 Tela de Teste via Chat
**Descrição**: Interface de chat para testar o agente, com histórico de conversa.  
**Elementos**:
- Área de chat: Mensagens do usuário e respostas do agente.
- Campo de texto: Inserir mensagem.
- Botão "Enviar".
**Esboço ASCII**:
```
+---------------------------+
| Testar Agente             |
+---------------------------+
| [Usuário]: Oi, como ajuda?|
| [Agente]: Estou aqui...   |
| [_______________________] |
| [Enviar]                  |
+---------------------------+
```
**Especificações**:
- **Interações**: Respostas do agente em ≤ 2 segundos (90% dos casos).
- **Feedback**: Indicador de "digitando" durante resposta do agente.
- **Componentes React**: `<ChatContainer>`, `<Input>`, `<Button>`.

## 4. Requisitos de UX
- **Responsividade**: Layouts adaptáveis para desktop (min. 1024px) e mobile (min. 320px).
- **Acessibilidade**: Suporte a leitores de tela (ARIA labels), contraste mínimo de 4.5:1.
- **Feedback Visual**: Ícones de carregamento, mensagens de erro/sucesso.
- **Navegação**: Menu lateral ou barra superior para acesso rápido às telas.

## 5. Suposições e Riscos
- **Suposições**:
  - Usuários preferem interface de drag-and-drop para upload.
  - Design inspirado no LobeHub é suficiente para o MVP.
  - Tailwind CSS atende às necessidades de estilização.
- **Riscos**:
  - **Complexidade Mobile**: Interface de chat pode ser confusa em telas pequenas.
    - **Mitigação**: Testar layouts mobile-first e simplificar elementos.
  - **Latência de IA**: Respostas lentas no chat podem frustrar usuários.
    - **Mitigação**: Cache local para respostas frequentes e fallback entre APIs (Grok/OpenAI).
  - **Usabilidade do Upload**: Usuários podem ter dificuldade com formatos de arquivo.
    - **Mitigação**: Instruções claras e validação robusta no frontend.

## 6. Próximos Passos
- Validar wireframes com stakeholders.
- Criar protótipos visuais no Figma (opcional, após aprovação).
- Planejar sprints e backlog (agente PO).
- Iniciar desenvolvimento do frontend com React.js.