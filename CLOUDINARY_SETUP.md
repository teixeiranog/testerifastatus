# 🔧 Configuração do Cloudinary

## ❌ Problema Atual
O upload de imagens está falhando porque a API Key do Cloudinary está inválida.

## ✅ Solução

### 1. Criar conta no Cloudinary
1. Acesse [cloudinary.com](https://cloudinary.com)
2. Crie uma conta gratuita
3. Faça login no dashboard

### 2. Obter credenciais
1. No dashboard, vá em **Settings** → **Access Keys**
2. Anote:
   - **Cloud Name** (ex: `dif5pxc3r`)
   - **API Key** (ex: `448884227189524`)
   - **API Secret** (não precisamos para upload)

### 3. Configurar Upload Preset
1. Vá em **Settings** → **Upload**
2. Role até **Upload presets**
3. Clique em **Add upload preset**
4. Configure:
   - **Name**: `rifa-uploads`
   - **Signing Mode**: `Unsigned`
   - **Folder**: `rifas`
5. Clique em **Save**

### 4. Criar arquivo .env
Crie um arquivo `.env` na raiz do projeto:

```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=sua-api-key-aqui
REACT_APP_FIREBASE_AUTH_DOMAIN=serrah-rifas.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=serrah-rifas
REACT_APP_FIREBASE_STORAGE_BUCKET=serrah-rifas.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abc123def456

# Cloudinary Configuration
REACT_APP_CLOUDINARY_CLOUD_NAME=seu-cloud-name
REACT_APP_CLOUDINARY_UPLOAD_PRESET=rifa-uploads
REACT_APP_CLOUDINARY_API_KEY=sua-api-key-cloudinary

# Development Configuration
REACT_APP_USE_EMULATORS=false
REACT_APP_ENVIRONMENT=development
```

### 5. Reiniciar o projeto
```bash
npm start
```

## 🔍 Teste
1. Crie uma nova rifa
2. Adicione imagens
3. Salve a rifa
4. Verifique se as imagens aparecem na página da rifa

## 🚨 Alternativa Temporária
Se não conseguir configurar o Cloudinary agora, o sistema usará imagens placeholder automaticamente.

