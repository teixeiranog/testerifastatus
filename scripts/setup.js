#!/usr/bin/env node

/**
 * Script de configuração inicial para o projeto RifaMax
 * Este script ajuda a configurar o projeto pela primeira vez
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('🎲 Bem-vindo ao RifaMax Setup!\n');
  console.log('Este script irá ajudá-lo a configurar o projeto pela primeira vez.\n');

  // Verificar se .env já existe
  if (fs.existsSync('.env')) {
    const override = await question('Arquivo .env já existe. Deseja sobrescrever? (y/N): ');
    if (override.toLowerCase() !== 'y') {
      console.log('Setup cancelado.');
      rl.close();
      return;
    }
  }

  console.log('📋 Vamos configurar suas credenciais do Firebase:\n');

  const firebaseApiKey = await question('Firebase API Key: ');
  const firebaseAuthDomain = await question('Firebase Auth Domain: ');
  const firebaseProjectId = await question('Firebase Project ID: ');
  const firebaseStorageBucket = await question('Firebase Storage Bucket: ');
  const firebaseMessagingSenderId = await question('Firebase Messaging Sender ID: ');
  const firebaseAppId = await question('Firebase App ID: ');

  console.log('\n☁️ Agora vamos configurar o Cloudinary:\n');

  const cloudinaryCloudName = await question('Cloudinary Cloud Name: ');
  const cloudinaryUploadPreset = await question('Cloudinary Upload Preset (default: rifa-uploads): ') || 'rifa-uploads';
  const cloudinaryApiKey = await question('Cloudinary API Key: ');

  console.log('\n🔧 Configurações opcionais:\n');

  const useEmulators = await question('Usar emuladores Firebase em desenvolvimento? (y/N): ');
  const googleAnalyticsId = await question('Google Analytics ID (opcional): ');

  // Criar arquivo .env
  const envContent = `# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=${firebaseApiKey}
REACT_APP_FIREBASE_AUTH_DOMAIN=${firebaseAuthDomain}
REACT_APP_FIREBASE_PROJECT_ID=${firebaseProjectId}
REACT_APP_FIREBASE_STORAGE_BUCKET=${firebaseStorageBucket}
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=${firebaseMessagingSenderId}
REACT_APP_FIREBASE_APP_ID=${firebaseAppId}

# Cloudinary Configuration
REACT_APP_CLOUDINARY_CLOUD_NAME=${cloudinaryCloudName}
REACT_APP_CLOUDINARY_UPLOAD_PRESET=${cloudinaryUploadPreset}
REACT_APP_CLOUDINARY_API_KEY=${cloudinaryApiKey}

# Development Configuration
REACT_APP_USE_EMULATORS=${useEmulators.toLowerCase() === 'y' ? 'true' : 'false'}
REACT_APP_ENVIRONMENT=development

# Optional: Analytics
${googleAnalyticsId ? `REACT_APP_GOOGLE_ANALYTICS_ID=${googleAnalyticsId}` : '# REACT_APP_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX'}
`;

  fs.writeFileSync('.env', envContent);

  // Atualizar arquivo de configuração do Firebase
  const firebaseConfigPath = path.join('src', 'config', 'firebase.js');
  if (fs.existsSync(firebaseConfigPath)) {
    let firebaseConfig = fs.readFileSync(firebaseConfigPath, 'utf8');
    
    // Substituir valores das variáveis de ambiente
    firebaseConfig = firebaseConfig.replace(
      /apiKey: ".*"/,
      `apiKey: "${firebaseApiKey}"`
    );
    firebaseConfig = firebaseConfig.replace(
      /authDomain: ".*"/,
      `authDomain: "${firebaseAuthDomain}"`
    );
    firebaseConfig = firebaseConfig.replace(
      /projectId: ".*"/,
      `projectId: "${firebaseProjectId}"`
    );
    firebaseConfig = firebaseConfig.replace(
      /storageBucket: ".*"/,
      `storageBucket: "${firebaseStorageBucket}"`
    );
    firebaseConfig = firebaseConfig.replace(
      /messagingSenderId: ".*"/,
      `messagingSenderId: "${firebaseMessagingSenderId}"`
    );
    firebaseConfig = firebaseConfig.replace(
      /appId: ".*"/,
      `appId: "${firebaseAppId}"`
    );

    fs.writeFileSync(firebaseConfigPath, firebaseConfig);
  }

  // Atualizar arquivo de configuração do Cloudinary
  const cloudinaryConfigPath = path.join('src', 'config', 'cloudinary.js');
  if (fs.existsSync(cloudinaryConfigPath)) {
    let cloudinaryConfig = fs.readFileSync(cloudinaryConfigPath, 'utf8');
    
    cloudinaryConfig = cloudinaryConfig.replace(
      /cloudName: '.*'/,
      `cloudName: '${cloudinaryCloudName}'`
    );
    cloudinaryConfig = cloudinaryConfig.replace(
      /uploadPreset: '.*'/,
      `uploadPreset: '${cloudinaryUploadPreset}'`
    );
    cloudinaryConfig = cloudinaryConfig.replace(
      /apiKey: '.*'/,
      `apiKey: '${cloudinaryApiKey}'`
    );

    fs.writeFileSync(cloudinaryConfigPath, cloudinaryConfig);
  }

  console.log('\n✅ Configuração concluída com sucesso!\n');
  console.log('📝 Próximos passos:\n');
  console.log('1. Configure o Mercado Pago nas Cloud Functions:');
  console.log('   firebase functions:config:set mercadopago.access_token="TEST-SUA-ACCESS-TOKEN"');
  console.log('   firebase functions:config:set app.url="http://localhost:3000"');
  console.log('\n2. Configure as regras do Firestore:');
  console.log('   firebase deploy --only firestore:rules');
  console.log('\n3. Instale as dependências das Cloud Functions:');
  console.log('   cd functions && npm install');
  console.log('\n4. Inicie o projeto:');
  console.log('   npm start');
  console.log('\n🎉 Divirta-se desenvolvendo com o RifaMax!');

  rl.close();
}

main().catch(console.error);
