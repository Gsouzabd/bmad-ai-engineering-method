# Refatoração do Sistema RAG - Base de Conhecimento

## 🎯 Objetivo

Refatoração completa da lógica de base de conhecimento seguindo o direcionamento da OpenAI para implementar um sistema RAG (Retrieval-Augmented Generation) interno da plataforma.

## 🔄 Mudanças Implementadas

### 1. **Sistema RAG Completo**
- ✅ Upload direto de arquivos (PDF, TXT, XLSX, CSV)
- ✅ Processamento automático com divisão em chunks
- ✅ Geração de embeddings usando OpenAI text-embedding-3-large
- ✅ Armazenamento vetorial no Supabase
- ✅ Busca semântica automática durante conversas

### 2. **Arquitetura de Banco de Dados**
- ✅ Nova tabela `knowledge_chunks` para armazenar chunks e embeddings
- ✅ Função `match_chunks` para busca vetorial com cosine similarity
- ✅ Índices vetoriais otimizados para performance
- ✅ Políticas de segurança (RLS) para isolamento de dados

### 3. **API Refatorada**
- ✅ Endpoints RAG otimizados
- ✅ Integração automática com chat
- ✅ Estatísticas e métricas de uso
- ✅ Tratamento robusto de erros

## 📁 Arquivos Modificados

### Backend
- `backend/routes/knowledgeBase.js` - Refatoração completa
- `backend/routes/chat.js` - Integração com RAG
- `supabase-schema.sql` - Nova estrutura de banco

### Documentação
- `docs/rag-system.md` - Documentação completa do sistema
- `docs/agent-prompts-rag.md` - Prompts otimizados para RAG
- `README-RAG-REFACTOR.md` - Este arquivo

## 🚀 Como Funciona

### 1. Upload de Arquivo
```javascript
// Upload automático com processamento RAG
POST /api/knowledge-base/:agentId/upload
```

**Processo:**
1. Upload do arquivo para Supabase Storage
2. Extração de texto (PDF, CSV, XLSX, TXT)
3. Divisão em chunks de ~1000 caracteres
4. Geração de embeddings para cada chunk
5. Armazenamento vetorial no banco

### 2. Busca Semântica
```javascript
// Busca automática durante conversas
POST /api/knowledge-base/:agentId/search
```

**Processo:**
1. Geração de embedding da pergunta do usuário
2. Busca de chunks similares usando cosine similarity
3. Retorno dos trechos mais relevantes
4. Injeção do contexto na conversa

### 3. Chat Inteligente
```javascript
// Chat com contexto RAG automático
POST /api/chat/:agentId
```

**Processo:**
1. Recebe pergunta do usuário
2. Busca contexto RAG automaticamente
3. Injeta contexto no prompt do agente
4. Gera resposta baseada nos documentos

## 🔧 Configuração

### 1. Banco de Dados
```sql
-- Executar schema atualizado
\i supabase-schema.sql
```

### 2. Variáveis de Ambiente
```env
OPENAI_API_KEY=sk-...
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
```

### 3. Dependências
```json
{
  "openai": "^4.20.1",
  "pdf-parse": "^1.1.1",
  "xlsx": "^0.18.5",
  "csv-parser": "^3.0.0"
}
```

## 📊 Novos Endpoints

### Knowledge Base
- `POST /:agentId/upload` - Upload com processamento RAG
- `GET /:agentId/files` - Listar arquivos processados
- `DELETE /:agentId/files/:fileId` - Deletar arquivo e chunks
- `GET /:agentId/files/:fileId/content` - Ver chunks do arquivo
- `POST /:agentId/search` - Buscar contexto RAG
- `GET /:agentId/stats` - Estatísticas da base

### Chat
- `POST /:agentId` - Chat com RAG automático
- `POST /:agentId/test-rag` - Testar busca RAG

## 🎨 Prompts Otimizados

### Exemplo para Agente de Vendas
```text
Você é um agente de vendas especializado que utiliza a base de conhecimento anexada para buscar informações atualizadas sobre estoque, produtos e políticas comerciais.

SEMPRE que responder, use os dados dos arquivos como referência principal. Se não encontrar informações relevantes nos documentos, informe ao usuário que não tem dados suficientes sobre o assunto.

INSTRUÇÕES ESPECÍFICAS:
- Use informações de estoque e preços dos documentos para fazer recomendações
- Cite a fonte dos dados quando fornecer informações específicas
- Se um produto não estiver disponível, sugira alternativas baseadas no catálogo
- Mantenha um tom profissional e prestativo
- Sempre confirme a disponibilidade antes de fazer promessas

Quando receber contexto dos documentos, use essas informações para fornecer respostas precisas e atualizadas sobre produtos, estoque e condições de venda.
```

## 📈 Vantagens da Refatoração

### 1. **Precisão**
- Respostas baseadas em documentos específicos
- Busca semântica inteligente
- Contexto relevante sempre atualizado

### 2. **Performance**
- Índices vetoriais otimizados
- Busca rápida por similaridade
- Processamento assíncrono de uploads

### 3. **Escalabilidade**
- Suporte a múltiplos documentos
- Isolamento por usuário e agente
- Arquitetura modular

### 4. **Usabilidade**
- Upload direto de arquivos
- Processamento automático
- Integração transparente com chat

## 🔍 Exemplo de Uso

### 1. Upload de Documento
```javascript
const formData = new FormData();
formData.append('file', file);

const response = await fetch('/api/knowledge-base/agent-id/upload', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});

// Resposta inclui informações de processamento
const result = await response.json();
console.log(`Processado: ${result.file.chunksCount} chunks`);
```

### 2. Chat com RAG
```javascript
const response = await fetch('/api/chat/agent-id', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    message: 'Qual é o estoque atual do produto X?'
  })
});

const result = await response.json();
console.log(`Contexto usado: ${result.ragContext.chunksCount} chunks`);
```

### 3. Teste de Busca RAG
```javascript
const response = await fetch('/api/chat/agent-id/test-rag', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    query: 'Informações sobre estoque'
  })
});

const result = await response.json();
console.log(`Encontrados: ${result.chunksCount} chunks relevantes`);
```

## 🛠️ Troubleshooting

### Erro de Upload
- Verificar tamanho do arquivo (máx 10MB)
- Confirmar tipo de arquivo suportado
- Verificar conexão com OpenAI

### Busca Sem Resultados
- Verificar se há documentos carregados
- Ajustar threshold de similaridade (padrão: 0.7)
- Verificar se a pergunta é relevante aos documentos

### Erro de Embeddings
- Verificar API key da OpenAI
- Confirmar quota disponível
- Verificar conectividade de rede

## 📚 Documentação Adicional

- [Sistema RAG Completo](docs/rag-system.md)
- [Prompts para Agentes](docs/agent-prompts-rag.md)
- [Schema do Banco](supabase-schema.sql)

## 🎉 Resultado Final

A refatoração implementa um sistema RAG completo e robusto que:

1. **Processa automaticamente** documentos carregados
2. **Busca semanticamente** informações relevantes
3. **Integra transparentemente** com o chat
4. **Fornece respostas precisas** baseadas em dados reais
5. **Mantém performance** com índices otimizados

O sistema agora segue as melhores práticas da OpenAI para RAG e oferece uma experiência de usuário superior com respostas mais precisas e contextualizadas.
