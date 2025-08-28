#!/bin/bash

echo "🔧 Verificando dependências para otimizações de memória..."

# Verificar se todas as dependências estão instaladas
echo "🔍 Verificando dependências..."
npm list --depth=0

echo "🎉 Verificação concluída!"
echo ""
echo "📋 Próximos passos:"
echo "1. Execute o script de limpeza de chunks duplicados:"
echo "   node fix-duplicate-chunks.js"
echo ""
echo "2. Teste o upload de um arquivo PDF para verificar as otimizações:"
echo "   npm run dev:high-memory"
echo ""
echo "3. Monitore o uso de memória durante o processamento"
