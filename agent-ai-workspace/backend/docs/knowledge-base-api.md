# API de Knowledge Base

Esta API permite gerenciar arquivos da base de conhecimento dos agentes usando Supabase Storage.

## Configuração Inicial

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar Supabase Storage
```bash
node setup-storage.js
```

### 3. Criar pasta de uploads temporários
```bash
mkdir uploads
```

## Endpoints

### 1. Upload de Arquivo
**POST** `/api/knowledge-base/:agentId/upload`

Faz upload de um arquivo para a base de conhecimento de um agente específico.

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Body:**
- `file`: Arquivo (PDF, CSV, XLSX, XLS, TXT)

**Resposta de Sucesso (200):**
```json
{
  "message": "Arquivo enviado com sucesso",
  "file": {
    "id": "uuid",
    "name": "documento.pdf",
    "size": 1024000,
    "type": "application/pdf",
    "url": "https://...",
    "extractedTextLength": 1500
  }
}
```

**Tipos de Arquivo Suportados:**
- PDF (`application/pdf`)
- CSV (`text/csv`)
- Excel (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`)
- Excel Legacy (`application/vnd.ms-excel`)
- Texto (`text/plain`)

**Limites:**
- Tamanho máximo: 10MB
- Arquivos são organizados por agente: `agents/{agentId}/{filename}`

### 2. Listar Arquivos
**GET** `/api/knowledge-base/:agentId/files`

Lista todos os arquivos da base de conhecimento de um agente.

**Headers:**
- `Authorization: Bearer <token>`

**Resposta de Sucesso (200):**
```json
[
  {
    "id": "uuid",
    "file_name": "documento.pdf",
    "file_size": 1024000,
    "file_type": "application/pdf",
    "file_url": "https://...",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

### 3. Deletar Arquivo
**DELETE** `/api/knowledge-base/:agentId/files/:fileId`

Remove um arquivo da base de conhecimento.

**Headers:**
- `Authorization: Bearer <token>`

**Resposta de Sucesso (200):**
```json
{
  "message": "Arquivo deletado com sucesso"
}
```

### 4. Buscar Conteúdo
**GET** `/api/knowledge-base/:agentId/files/:fileId/content`

Retorna o texto extraído de um arquivo.

**Headers:**
- `Authorization: Bearer <token>`

**Resposta de Sucesso (200):**
```json
{
  "fileName": "documento.pdf",
  "content": "Texto extraído do arquivo..."
}
```

## Fluxo de Processamento

1. **Upload**: Arquivo é recebido via multer
2. **Validação**: Verifica tipo e tamanho do arquivo
3. **Storage**: Upload para Supabase Storage
4. **Extração**: Texto é extraído do arquivo
5. **Banco**: Metadados são salvos no PostgreSQL
6. **Limpeza**: Arquivo temporário é removido

## Estrutura do Storage

```
knowledge-base/
├── agents/
│   ├── {agentId1}/
│   │   ├── {uuid1}.pdf
│   │   └── {uuid2}.csv
│   └── {agentId2}/
│       └── {uuid3}.xlsx
```

## Segurança

- **Autenticação**: Todas as rotas requerem token JWT
- **Autorização**: Usuários só acessam seus próprios arquivos
- **Validação**: Tipos de arquivo e tamanhos são validados
- **Isolamento**: Arquivos são organizados por agente e usuário

## Tratamento de Erros

### Erro de Upload (400)
```json
{
  "error": "Nenhum arquivo enviado"
}
```

### Erro de Tipo (400)
```json
{
  "error": "Tipo de arquivo não suportado"
}
```

### Erro de Agente (404)
```json
{
  "error": "Agente não encontrado"
}
```

### Erro de Arquivo (404)
```json
{
  "error": "Arquivo não encontrado"
}
```

### Erro Interno (500)
```json
{
  "error": "Erro interno do servidor"
}
```

## Exemplo de Uso

### Upload via cURL
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@documento.pdf" \
  http://localhost:3000/api/knowledge-base/agent-uuid/upload
```

### Upload via JavaScript
```javascript
const formData = new FormData()
formData.append('file', fileInput.files[0])

const response = await fetch('/api/knowledge-base/agent-uuid/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})

const result = await response.json()
```

## Monitoramento

- Logs de upload são registrados no console
- Erros são capturados e logados
- Arquivos temporários são limpos automaticamente
- Rollback em caso de falha no banco de dados
