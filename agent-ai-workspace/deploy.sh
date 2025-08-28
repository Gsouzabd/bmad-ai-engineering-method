#!/bin/bash

echo "🚀 Iniciando deploy do AI Agent Workspace..."

# Verificar se estamos no branch correto
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
    echo "⚠️  Você está no branch $CURRENT_BRANCH. Recomendamos fazer deploy do branch main/master."
    read -p "Continuar mesmo assim? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Verificar se as variáveis de ambiente estão configuradas
if [ ! -f ".env" ]; then
    echo "❌ Arquivo .env não encontrado. Configure as variáveis de ambiente primeiro."
    exit 1
fi

if [ ! -f "backend/.env" ]; then
    echo "❌ Arquivo backend/.env não encontrado. Configure as variáveis de ambiente do backend primeiro."
    exit 1
fi

# Build do frontend
echo "📦 Fazendo build do frontend..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Erro no build do frontend"
    exit 1
fi

echo "✅ Build do frontend concluído"

# Verificar se o diretório dist foi criado
if [ ! -d "dist" ]; then
    echo "❌ Diretório dist não encontrado após o build"
    exit 1
fi

# Instalar dependências do backend (se necessário)
echo "📦 Verificando dependências do backend..."
cd backend
npm install --production

if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar dependências do backend"
    exit 1
fi

cd ..

echo ""
echo "🎉 Deploy preparado com sucesso!"
echo ""
echo "📋 Próximos passos para produção:"
echo ""
echo "1. Copie os arquivos para o servidor:"
echo "   - dist/ (frontend build)"
echo "   - backend/ (código do backend)"
echo "   - nginx.conf (configuração do nginx)"
echo "   - ecosystem.config.js (configuração do PM2)"
echo ""
echo "2. No servidor, execute:"
echo "   cd backend"
echo "   npm install --production"
echo "   pm2 start ecosystem.config.js --env production"
echo ""
echo "3. Configure o nginx:"
echo "   sudo cp nginx.conf /etc/nginx/sites-available/ai-agent-workspace"
echo "   sudo ln -s /etc/nginx/sites-available/ai-agent-workspace /etc/nginx/sites-enabled/"
echo "   sudo nginx -t"
echo "   sudo systemctl reload nginx"
echo ""
echo "4. Configure SSL com Let's Encrypt:"
echo "   sudo certbot --nginx -d your-domain.com"
echo ""
echo "🌐 A aplicação estará disponível em: https://your-domain.com"
echo ""
