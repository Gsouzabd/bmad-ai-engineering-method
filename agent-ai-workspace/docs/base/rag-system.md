# Sistema RAG (Retrieval-Augmented Generation) - Base de Conhecimento

## Visão Geral

O sistema RAG implementado segue o direcionamento da OpenAI para fornecer uma base de conhecimento inteligente que permite aos agentes acessar informações específicas dos documentos carregados durante as conversas.

## Como Funciona

### 1. Upload de Arquivos
- **Formatos Suportados**: PDF, TXT, XLSX, CSV
- **Processamento Automático**: 
  - Extração de texto do arquivo
  - Divisão em chunks (pedaços) de ~1000 caracteres com overlap de 200
  - Geração de embeddings usando OpenAI text-embedding-3-large
  - Armazenamento vetorial no Supabase

### 2. Busca Semântica
- Quando o usuário faz uma pergunta, o sistema:
  - Gera embedding da pergunta
  - Busca chunks similares usando cosine similarity
  - Retorna os trechos mais relevantes
  - Injeta o contexto na conversa

### 3. Resposta Inteligente
- O agente recebe o contexto dos documentos
- Responde baseado nas informações encontradas
- Mantém a conversa contextualizada

## Endpoints da API

### Upload de Arquivo
```http
POST /api/knowledge-base/:agentId/upload
Content-Type: multipart/form-data

file: [arquivo]
```

**Resposta:**
```json
{
  "message": "Arquivo processado com sucesso para RAG",
  "file": {
    "id": "uuid",
    "name": "documento.pdf",
    "size": 1024000,
    "type": "application/pdf",
    "url": "https://...",
    "chunksCount": 15,
    "totalCharacters": 15000
  }
}
```

### Listar Arquivos
```http
GET /api/knowledge-base/:agentId/files
```

**Resposta:**
```json
[
  {
    "id": "uuid",
    "file_name": "documento.pdf",
    "file_size": 1024000,
    "file_type": "application/pdf",
    "file_url": "https://...",
    "created_at": "2024-01-01T00:00:00Z",
    "chunks_count": 15
  }
]
```

### Buscar Contexto RAG
```http
POST /api/knowledge-base/:agentId/search
Content-Type: application/json

{
  "query": "Qual é o estoque atual?",
  "limit": 5
}
```

**Resposta:**
```json
{
  "query": "Qual é o estoque atual?",
  "hasContext": true,
  "context": "[Fonte: estoque.pdf] O estoque atual é de 150 unidades...",
  "chunks": [
    {
      "id": "uuid",
      "content": "O estoque atual é de 150 unidades...",
      "similarity": 0.85,
      "file_name": "estoque.pdf"
    }
  ],
  "chunksCount": 1
}
```

### Estatísticas
```http
GET /api/knowledge-base/:agentId/stats
```

**Resposta:**
```json
{
  "totalFiles": 5,
  "totalChunks": 75,
  "totalSize": 5120000,
  "averageChunksPerFile": 15
}
```

## Integração com Chat

### Prompt Recomendado para Agentes

```text
Você é um agente especializado que utiliza a base de conhecimento anexada para buscar informações atualizadas sobre estoque e produtos.

SEMPRE que responder, use os dados dos arquivos como referência principal. Se não encontrar informações relevantes nos documentos, informe ao usuário que não tem dados suficientes sobre o assunto.

Quando receber contexto dos documentos, use essas informações para fornecer respostas precisas e atualizadas.
```

### Fluxo de Conversa

1. **Usuário faz pergunta**
2. **Sistema busca contexto RAG**
3. **Contexto é injetado no prompt**
4. **Agente responde baseado no contexto**

## Configuração do Banco de Dados

### Tabelas Necessárias

#### knowledge_base
- Armazena metadados dos arquivos
- Contém informações sobre processamento

#### knowledge_chunks
- Armazena chunks de texto
- Contém embeddings vetoriais
- Índice vetorial para busca rápida

### Função de Busca Vetorial

```sql
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding vector(3072),
  match_threshold float,
  match_count int,
  agent_id_param uuid,
  user_id_param uuid
)
```

## Configuração do Ambiente

### Variáveis de Ambiente
```env
OPENAI_API_KEY=sk-...
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
```

### Dependências
```json
{
  "openai": "^4.20.1",
  "pdf-parse": "^1.1.1",
  "xlsx": "^0.18.5",
  "csv-parser": "^3.0.0"
}
```

## Exemplo de Uso

### 1. Upload de Documento
```javascript
const formData = new FormData();
formData.append('file', file);

const response = await fetch('/api/knowledge-base/agent-id/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

### 2. Busca de Contexto
```javascript
const response = await fetch('/api/knowledge-base/agent-id/search', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    query: 'Qual é o estoque atual?'
  })
});

const context = await response.json();
```

### 3. Uso no Chat
```javascript
// Construir prompt com contexto
const prompt = `
Contexto dos documentos:
${context.context}

Pergunta do usuário: ${userMessage}

Responda baseado no contexto fornecido.
`;
```

## Vantagens do Sistema

1. **Precisão**: Respostas baseadas em documentos específicos
2. **Atualização**: Informações sempre atualizadas dos arquivos
3. **Escalabilidade**: Suporte a múltiplos documentos
4. **Performance**: Busca vetorial otimizada
5. **Segurança**: Isolamento por usuário e agente

## Limitações

1. **Tamanho de Arquivo**: Máximo 10MB por upload
2. **Tipos Suportados**: Apenas PDF, TXT, XLSX, CSV
3. **Processamento**: Pode levar alguns segundos para arquivos grandes
4. **Custo**: Geração de embeddings consome tokens da OpenAI

## Troubleshooting

### Erro de Upload
- Verificar tamanho do arquivo
- Confirmar tipo de arquivo suportado
- Verificar conexão com OpenAI

### Busca Sem Resultados
- Verificar se há documentos carregados
- Ajustar threshold de similaridade
- Verificar se a pergunta é relevante aos documentos

### Erro de Embeddings
- Verificar API key da OpenAI
- Confirmar quota disponível
- Verificar conectividade de rede
