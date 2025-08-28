// =====================================================
// Script de Teste - Integração MCP Google
// =====================================================

const testMCPIntegration = async () => {
  console.log('🧪 Iniciando testes da integração MCP...\n');

  // 1. Testar conexão com Supabase
  console.log('1️⃣ Testando conexão com Supabase...');
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      'https://wtwcewoltqrkdosirvot.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0d2Nld29sdHFya2Rvc2lydm90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzODUwNTksImV4cCI6MjA3MTk2MTA1OX0.A_fJ1clNiV-mf4YRXGHyH4RHcN_ZtMkFypd2et25vJY'
    );
    
    const { data, error } = await supabase
      .from('user_credentials')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Erro na conexão com Supabase:', error.message);
    } else {
      console.log('✅ Conexão com Supabase OK');
      console.log(`   - Tabela user_credentials: ${data.length} registros encontrados`);
    }
  } catch (error) {
    console.log('❌ Erro ao testar Supabase:', error.message);
  }

  // 2. Testar configuração do Google OAuth
  console.log('\n2️⃣ Testando configuração Google OAuth...');
  try {
    const { google } = await import('googleapis');
    
    const oauth2Client = new google.auth.OAuth2(
      '179038630567-bg9gd3faaq7m20s8qo2ma4m8ukrhqrfm.apps.googleusercontent.com',
      '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',
      'http://localhost:5000/api/oauth/callback'
    );
    
    console.log('✅ Configuração Google OAuth OK');
    console.log('   - Client ID configurado');
    console.log('   - Client Secret configurado');
    console.log('   - Redirect URL configurado');
  } catch (error) {
    console.log('❌ Erro na configuração Google OAuth:', error.message);
  }

  // 3. Testar criptografia
  console.log('\n3️⃣ Testando criptografia...');
  try {
    const CryptoJS = await import('crypto-js');
    const ENCRYPTION_KEY = 'bmad-ai-engineering-method-32-chars';
    
    const testData = 'test-secret-data';
    const encrypted = CryptoJS.AES.encrypt(testData, ENCRYPTION_KEY).toString();
    const decrypted = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);
    
    if (decrypted === testData) {
      console.log('✅ Criptografia OK');
      console.log('   - Dados criptografados e descriptografados corretamente');
    } else {
      console.log('❌ Erro na criptografia: dados não coincidem');
    }
  } catch (error) {
    console.log('❌ Erro na criptografia:', error.message);
  }

  // 4. Testar APIs do backend
  console.log('\n4️⃣ Testando APIs do backend...');
  try {
    const baseUrl = 'http://localhost:5000';
    
    // Testar endpoint de credenciais
    const credentialsResponse = await fetch(`${baseUrl}/api/credentials`, {
      headers: {
        'Authorization': 'Bearer mock_token'
      }
    });
    
    if (credentialsResponse.ok) {
      const credentialsData = await credentialsResponse.json();
      console.log('✅ API de credenciais OK');
      console.log('   - Endpoint respondendo corretamente');
      console.log('   - Dados retornados:', JSON.stringify(credentialsData, null, 2));
    } else {
      console.log('❌ Erro na API de credenciais:', credentialsResponse.status);
    }
    
    // Testar endpoint OAuth
    const oauthResponse = await fetch(`${baseUrl}/api/oauth/status`, {
      headers: {
        'Authorization': 'Bearer mock_token'
      }
    });
    
    if (oauthResponse.ok) {
      const oauthData = await oauthResponse.json();
      console.log('✅ API OAuth OK');
      console.log('   - Endpoint respondendo corretamente');
      console.log('   - Status OAuth:', JSON.stringify(oauthData, null, 2));
    } else {
      console.log('❌ Erro na API OAuth:', oauthResponse.status);
    }
    
  } catch (error) {
    console.log('❌ Erro ao testar APIs:', error.message);
  }

  // 5. Verificar variáveis de ambiente
  console.log('\n5️⃣ Verificando variáveis de ambiente...');
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'ENCRYPTION_KEY'
  ];
  
  let envOk = true;
  requiredEnvVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: configurado`);
    } else {
      console.log(`❌ ${varName}: não configurado`);
      envOk = false;
    }
  });
  
  if (envOk) {
    console.log('✅ Todas as variáveis de ambiente configuradas');
  } else {
    console.log('❌ Algumas variáveis de ambiente estão faltando');
  }

  console.log('\n🎯 Resumo dos Testes:');
  console.log('Para testar completamente:');
  console.log('1. Execute: node test-mcp-integration.js');
  console.log('2. Verifique se todos os testes passaram');
  console.log('3. Acesse http://localhost:3000/credentials');
  console.log('4. Configure as credenciais Google');
  console.log('5. Teste o fluxo OAuth completo');
};

// Executar testes se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testMCPIntegration().catch(console.error);
}

export { testMCPIntegration };
