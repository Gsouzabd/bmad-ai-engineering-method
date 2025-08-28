# Architecture Document: AI Agent Workspace

**Data**: 28 de agosto de 2025  
**Autor**: Winston, Arquiteto (BMad-Method)  
**Projeto**: AI Agent Workspace (Web App)  
**Versão**: 2.0 (Atualizada com Supabase e Hetzner)

## 1. Visão Geral
O **AI Agent Workspace** é uma aplicação web SaaS que permite criar, configurar e testar agentes de IA com prompts customizados e bases de conhecimento baseadas em arquivos, inspirada no LobeHub. Este documento detalha a arquitetura full-stack do MVP, atualizada com as preferências do stakeholder: React.js (frontend), Node.js (backend), Supabase (banco de dados) e Hetzner (infraestrutura).

## 2. Arquitetura Geral
- **Modelo**: Arquitetura em camadas (Client-Server, MVC) com separação clara entre frontend, backend e armazenamento.
- **Componentes Principais**:
  - **Frontend**: Interface web responsiva (React.js) para criação de agentes, configuração de prompts, upload de arquivos e teste via chat.
  - **Backend**: API RESTful (Node.js/Express) para gerenciar agentes, prompts, bases de conhecimento e interações de chat.
  - **Banco de Dados**: Supabase (PostgreSQL gerenciado) para armazenamento de dados de usuários, agentes e metadados.
  - **Integração com IA**: APIs externas (Grok como primária, OpenAI como fallback) para processamento de prompts e consultas à base de conhecimento.
  - **Armazenamento de Arquivos**: Hetzner Cloud Storage (Object Storage) para bases de conhecimento.

**Diagrama de Alto Nível**:
```
[Usuário] --> [Frontend: React.js] --> [Backend: Node.js/Express] --> [DB: Supabase (PostgreSQL)]
                                                  |                 --> [Storage: Hetzner Object Storage]
                                                  |                 --> [IA: Grok/OpenAI API]
```

## 3. Stack Tecnológica
- **Frontend**:
  - **Framework**: React.js (com Vite para build rápido e Tailwind CSS para estilização).
  - **Justificativa**: React é ideal para interfaces dinâmicas e responsivas, com suporte a MVPs rápidos. Tailwind acelera o design.
- **Backend**:
  - **Framework**: Node.js com Express.js.
  - **Justificativa**: Rápido para APIs RESTful, com suporte a integrações com Supabase e APIs de IA.
- **Banco de Dados**:
  - **Tipo**: Supabase (baseado em PostgreSQL, gerenciado).
  - **Justificativa**: Supabase oferece um banco relacional robusto (PostgreSQL) com ferramentas integradas para autenticação, APIs e armazenamento, simplificando o desenvolvimento do MVP. Suporta dados estruturados para agentes e metadados.
- **Armazenamento de Arquivos**:
  - **Serviço**: Hetzner Object Storage (compatível com S3).
  - **Justificativa**: Solução de armazenamento em cloud econômica e escalável, suporta arquivos (PDF, CSV, TXT, XLSX) até 10MB.
- **Integração com IA**:
  - **APIs**: Grok (xAI) como primária, OpenAI (ex.: GPT-4o) como fallback.
  - **Justificativa**: Grok alinha-se ao ecossistema xAI; OpenAI oferece robustez adicional.
- **Autenticação**:
  - **Ferramenta**: Supabase Authentication (integrada ao PostgreSQL).
  - **Justificativa**: Autenticação pronta com suporte a OAuth, e-mail/senha e redes sociais, eliminando a necessidade de Auth0/Firebase.
- **Infraestrutura**:
  - **Cloud**: Hetzner Cloud (servidores para backend, Object Storage para arquivos).
  - **Justificativa**: Hetzner oferece custo-benefício superior, com servidores escaláveis e armazenamento compatível com S3.

## 4. Design de APIs
API RESTful com endpoints principais para o MVP (inalterados do documento anterior):

- **POST /agents**  
  - Descrição: Criar um novo agente.  
  - Payload: `{ name: string, description: string }`  
  - Resposta: `{ agentId: string, name: string, description: string }`

- **PUT /agents/:agentId/prompt**  
  - Descrição: Definir prompt para um agente.  
  - Payload: `{ prompt: string }`  
  - Resposta: `{ agentId: string, prompt: string }`

- **POST /agents/:agentId/knowledge-base**  
  - Descrição: Upload de arquivo para base de conhecimento.  
  - Payload: FormData (arquivo: PDF, CSV, TXT, XLSX, max 10MB).  
  - Resposta: `{ fileId: string, status: string }`

- **POST /agents/:agentId/chat**  
  - Descrição: Iniciar/testar conversa com o agente.  
  - Payload: `{ message: string }`  
  - Resposta: `{ response: string, conversationId: string }`

**Autenticação**: Token JWT gerado pelo Supabase Authentication.

## 5. Fluxo de Dados
1. **Criação de Agente**: Usuário cria agente via frontend; backend salva metadados no Supabase (tabela `agents`).
2. **Definição de Prompt**: Usuário insere prompt; backend valida e armazena no Supabase (tabela `prompts`).
3. **Upload de Base de Conhecimento**: Usuário carrega arquivo; backend envia para Hetzner Object Storage, extrai texto (usando bibliotecas como `pdf-parse` ou `xlsx`) e armazena metadados no Supabase.
4. **Teste via Chat**: Usuário envia mensagem; backend chama API de IA (Grok/OpenAI) com prompt e dados da base de conhecimento; resposta é retornada ao frontend e salva no Supabase (tabela `conversations`).

## 6. Requisitos Não-Funcionais
- **Escalabilidade**: Suporte inicial para 1.000 usuários simultâneos, com auto-scaling no Hetzner Cloud.
- **Performance**: Tempo de resposta da API ≤ 200ms (exceto chamadas à IA, ≤ 2s).
- **Segurança**:
  - Criptografia de dados em trânsito (HTTPS/TLS).
  - Criptografia de arquivos no Hetzner Object Storage (AES-256).
  - Autenticação segura via Supabase Authentication.
- **Disponibilidade**: 99.9% uptime, garantido por Hetzner Cloud.
- **Compatibilidade**: Suporte a navegadores modernos (Chrome, Firefox, Safari).

## 7. Análise de Riscos (Elicitação Avançada)
### Riscos Identificados
1. **Limitações do Supabase**