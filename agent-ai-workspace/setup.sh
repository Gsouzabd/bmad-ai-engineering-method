#!/bin/bash

echo "🚀 Configurando AI Agent Workspace..."

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale o Node.js 18+ primeiro."
    exit 1
fi

echo "✅ Node.js encontrado: $(node --version)"

# Verificar se npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado. Por favor, instale o npm primeiro."
    exit 1
fi

echo "✅ npm encontrado: $(npm --version)"

# Instalar dependências do frontend
echo "📦 Instalando dependências do frontend..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar dependências do frontend"
    exit 1
fi

# Instalar dependências do backend
echo "📦 Instalando dependências do backend..."
cd backend
npm install

if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar dependências do backend"
    exit 1
fi

cd ..

# Verificar se os arquivos de ambiente existem
if [ ! -f ".env" ]; then
    echo "⚠️  Arquivo .env não encontrado. Copiando exemplo..."
    cp env.example .env
    echo "📝 Configure as variáveis de ambiente no arquivo .env"
fi

if [ ! -f "backend/.env" ]; then
    echo "⚠️  Arquivo backend/.env não encontrado. Copiando exemplo..."
    cp backend/env.example backend/.env
    echo "📝 Configure as variáveis de ambiente no arquivo backend/.env"
fi

echo ""
echo "🎉 Setup concluído com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. Configure as variáveis de ambiente nos arquivos .env"
echo "2. Configure o banco de dados no Supabase (veja o README.md)"
echo "3. Execute 'npm run dev' para iniciar o frontend"
echo "4. Execute 'cd backend && npm run dev' para iniciar o backend"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:5000"
echo ""
