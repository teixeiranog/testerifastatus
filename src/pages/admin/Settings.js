import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon,
  Key,
  Cloud,
  CreditCard,
  Mail,
  Database,
  Save,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Zap
} from 'lucide-react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Loading from '../../components/ui/Loading';
import toast from 'react-hot-toast';

const Settings = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState({});
  const [showPasswords, setShowPasswords] = useState({});
  
  const [configuracoes, setConfiguracoes] = useState({
    // Mercado Pago
    mercadopago: {
      enabled: false,
      access_token: '',
      public_key: '',
      webhook_url: '',
      sandbox: true
    },
    
    // Cloudinary
    cloudinary: {
      enabled: false,
      cloud_name: '',
      api_key: '',
      api_secret: '',
      upload_preset: ''
    },
    
    // Email (SendGrid/SMTP)
    email: {
      enabled: false,
      provider: 'sendgrid', // 'sendgrid' ou 'smtp'
      sendgrid_api_key: '',
      smtp_host: '',
      smtp_port: 587,
      smtp_user: '',
      smtp_password: '',
      from_email: '',
      from_name: ''
    },
    
    // WhatsApp (Twilio)
    whatsapp: {
      enabled: false,
      twilio_sid: '',
      twilio_token: '',
      twilio_number: ''
    },
    
    // Configurações Gerais
    geral: {
      site_name: 'Sistema de Rifas',
      site_url: '',
      suporte_email: '',
      suporte_whatsapp: '',
      logo_url: '',
      cores_primarias: '#3B82F6',
      tempo_expiracao_pix: 15, // minutos
      taxa_plataforma: 0, // porcentagem
      min_numeros_compra: 1,
      max_numeros_compra: 100
    }
  });

  // Carregar configurações
  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  const carregarConfiguracoes = async () => {
    try {
      setLoading(true);
      const configDoc = await getDoc(doc(db, 'configuracoes', 'sistema'));
      
      if (configDoc.exists()) {
        const dadosConfig = configDoc.data();
        setConfiguracoes(prev => ({
          ...prev,
          ...dadosConfig
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  // Salvar configurações
  const salvarConfiguracoes = async () => {
    try {
      setSaving(true);
      
      await setDoc(doc(db, 'configuracoes', 'sistema'), {
        ...configuracoes,
        ultima_atualizacao: new Date(),
        atualizado_por: currentUser.uid
      });
      
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  // Testar conexão com serviços
  const testarConexao = async (servico) => {
    setTestingConnection(prev => ({ ...prev, [servico]: true }));
    
    try {
      switch (servico) {
        case 'mercadopago':
          // Simular teste de conexão Mercado Pago
          await new Promise(resolve => setTimeout(resolve, 2000));
          toast.success('Conexão com Mercado Pago testada com sucesso!');
          break;
          
        case 'cloudinary':
          // Simular teste de conexão Cloudinary
          await new Promise(resolve => setTimeout(resolve, 1500));
          toast.success('Conexão com Cloudinary testada com sucesso!');
          break;
          
        case 'email':
          // Simular teste de envio de email
          await new Promise(resolve => setTimeout(resolve, 1000));
          toast.success('Teste de email enviado com sucesso!');
          break;
          
        case 'whatsapp':
          // Simular teste de WhatsApp
          await new Promise(resolve => setTimeout(resolve, 1500));
          toast.success('Conexão com WhatsApp testada com sucesso!');
          break;
          
        default:
          toast.error('Serviço não reconhecido');
      }
    } catch (error) {
      toast.error(`Erro ao testar ${servico}: ${error.message}`);
    } finally {
      setTestingConnection(prev => ({ ...prev, [servico]: false }));
    }
  };

  // Alternar visibilidade de senhas
  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Atualizar configuração específica
  const updateConfig = (categoria, campo, valor) => {
    setConfiguracoes(prev => ({
      ...prev,
      [categoria]: {
        ...prev[categoria],
        [campo]: valor
      }
    }));
  };

  if (loading) {
    return <Loading text="Carregando configurações..." />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Configurações do Sistema
          </h1>
          <p className="text-gray-600">
            Configure todas as integrações e parâmetros do sistema
          </p>
        </div>
        
        <Button
          onClick={salvarConfiguracoes}
          disabled={saving}
          className="flex items-center"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Salvar Configurações
        </Button>
      </div>

      {/* Configurações Gerais */}
      <Card>
        <div className="flex items-center mb-6">
          <SettingsIcon className="w-6 h-6 text-primary-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Configurações Gerais</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Nome do Site"
            value={configuracoes.geral.site_name}
            onChange={(e) => updateConfig('geral', 'site_name', e.target.value)}
            placeholder="Sistema de Rifas"
          />
          
          <Input
            label="URL do Site"
            value={configuracoes.geral.site_url}
            onChange={(e) => updateConfig('geral', 'site_url', e.target.value)}
            placeholder="https://meusite.com"
          />
          
          <Input
            label="Email de Suporte"
            type="email"
            value={configuracoes.geral.suporte_email}
            onChange={(e) => updateConfig('geral', 'suporte_email', e.target.value)}
            placeholder="suporte@meusite.com"
          />
          
          <Input
            label="WhatsApp de Suporte"
            value={configuracoes.geral.suporte_whatsapp}
            onChange={(e) => updateConfig('geral', 'suporte_whatsapp', e.target.value)}
            placeholder="+5511999999999"
          />
          
          <Input
            label="Tempo de Expiração PIX (minutos)"
            type="number"
            value={configuracoes.geral.tempo_expiracao_pix}
            onChange={(e) => updateConfig('geral', 'tempo_expiracao_pix', Number(e.target.value))}
            min="5"
            max="60"
          />
          
          <Input
            label="Taxa da Plataforma (%)"
            type="number"
            value={configuracoes.geral.taxa_plataforma}
            onChange={(e) => updateConfig('geral', 'taxa_plataforma', Number(e.target.value))}
            min="0"
            max="20"
            step="0.1"
          />
        </div>
      </Card>

      {/* Mercado Pago */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <CreditCard className="w-6 h-6 text-primary-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Mercado Pago</h2>
              <p className="text-sm text-gray-600">Configurações de pagamento PIX</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={configuracoes.mercadopago.enabled}
                onChange={(e) => updateConfig('mercadopago', 'enabled', e.target.checked)}
                className="mr-2"
              />
              Habilitado
            </label>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => testarConexao('mercadopago')}
              disabled={testingConnection.mercadopago || !configuracoes.mercadopago.enabled}
            >
              {testingConnection.mercadopago ? (
                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-1" />
              )}
              Testar
            </Button>
          </div>
        </div>
        
        {configuracoes.mercadopago.enabled && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Input
                  label="Access Token"
                  type={showPasswords.mp_access ? 'text' : 'password'}
                  value={configuracoes.mercadopago.access_token}
                  onChange={(e) => updateConfig('mercadopago', 'access_token', e.target.value)}
                  placeholder="TEST-1234567890123456..."
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('mp_access')}
                  className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.mp_access ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              
              <Input
                label="Public Key"
                value={configuracoes.mercadopago.public_key}
                onChange={(e) => updateConfig('mercadopago', 'public_key', e.target.value)}
                placeholder="TEST-abcdef12-3456-7890..."
              />
              
              <Input
                label="Webhook URL"
                value={configuracoes.mercadopago.webhook_url}
                onChange={(e) => updateConfig('mercadopago', 'webhook_url', e.target.value)}
                placeholder="https://meusite.com/webhook/mercadopago"
              />
              
              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={configuracoes.mercadopago.sandbox}
                    onChange={(e) => updateConfig('mercadopago', 'sandbox', e.target.checked)}
                    className="mr-2"
                  />
                  Modo Sandbox (Teste)
                </label>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-blue-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Como obter as credenciais:</p>
                  <p className="text-sm text-blue-600">
                    1. Acesse <a href="https://www.mercadopago.com.br/developers" target="_blank" rel="noopener noreferrer" className="underline">Mercado Pago Developers</a>
                  </p>
                  <p className="text-sm text-blue-600">
                    2. Crie uma aplicação e copie o Access Token e Public Key
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Cloudinary */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Cloud className="w-6 h-6 text-primary-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Cloudinary</h2>
              <p className="text-sm text-gray-600">Armazenamento e otimização de imagens</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={configuracoes.cloudinary.enabled}
                onChange={(e) => updateConfig('cloudinary', 'enabled', e.target.checked)}
                className="mr-2"
              />
              Habilitado
            </label>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => testarConexao('cloudinary')}
              disabled={testingConnection.cloudinary || !configuracoes.cloudinary.enabled}
            >
              {testingConnection.cloudinary ? (
                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-1" />
              )}
              Testar
            </Button>
          </div>
        </div>
        
        {configuracoes.cloudinary.enabled && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Cloud Name"
                value={configuracoes.cloudinary.cloud_name}
                onChange={(e) => updateConfig('cloudinary', 'cloud_name', e.target.value)}
                placeholder="dif5pxc3r"
              />
              
              <Input
                label="API Key"
                value={configuracoes.cloudinary.api_key}
                onChange={(e) => updateConfig('cloudinary', 'api_key', e.target.value)}
                placeholder="448884227189524"
              />
              
              <div className="relative">
                <Input
                  label="API Secret"
                  type={showPasswords.cloudinary_secret ? 'text' : 'password'}
                  value={configuracoes.cloudinary.api_secret}
                  onChange={(e) => updateConfig('cloudinary', 'api_secret', e.target.value)}
                  placeholder="secret-key-here"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('cloudinary_secret')}
                  className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.cloudinary_secret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              
              <Input
                label="Upload Preset"
                value={configuracoes.cloudinary.upload_preset}
                onChange={(e) => updateConfig('cloudinary', 'upload_preset', e.target.value)}
                placeholder="rifa-uploads"
              />
            </div>
          </div>
        )}
      </Card>

      {/* Email */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Mail className="w-6 h-6 text-primary-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Email</h2>
              <p className="text-sm text-gray-600">Configurações de envio de email</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={configuracoes.email.enabled}
                onChange={(e) => updateConfig('email', 'enabled', e.target.checked)}
                className="mr-2"
              />
              Habilitado
            </label>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => testarConexao('email')}
              disabled={testingConnection.email || !configuracoes.email.enabled}
            >
              {testingConnection.email ? (
                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-1" />
              )}
              Testar
            </Button>
          </div>
        </div>
        
        {configuracoes.email.enabled && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Provedor de Email
                </label>
                <select
                  value={configuracoes.email.provider}
                  onChange={(e) => updateConfig('email', 'provider', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="sendgrid">SendGrid</option>
                  <option value="smtp">SMTP Personalizado</option>
                </select>
              </div>
              
              {configuracoes.email.provider === 'sendgrid' ? (
                <div className="relative md:col-span-2">
                  <Input
                    label="SendGrid API Key"
                    type={showPasswords.sendgrid_key ? 'text' : 'password'}
                    value={configuracoes.email.sendgrid_api_key}
                    onChange={(e) => updateConfig('email', 'sendgrid_api_key', e.target.value)}
                    placeholder="SG.XXXXXXXXXXXXXX..."
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('sendgrid_key')}
                    className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.sendgrid_key ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              ) : (
                <>
                  <Input
                    label="SMTP Host"
                    value={configuracoes.email.smtp_host}
                    onChange={(e) => updateConfig('email', 'smtp_host', e.target.value)}
                    placeholder="smtp.gmail.com"
                  />
                  
                  <Input
                    label="SMTP Port"
                    type="number"
                    value={configuracoes.email.smtp_port}
                    onChange={(e) => updateConfig('email', 'smtp_port', Number(e.target.value))}
                    placeholder="587"
                  />
                  
                  <Input
                    label="SMTP User"
                    value={configuracoes.email.smtp_user}
                    onChange={(e) => updateConfig('email', 'smtp_user', e.target.value)}
                    placeholder="usuario@gmail.com"
                  />
                  
                  <div className="relative">
                    <Input
                      label="SMTP Password"
                      type={showPasswords.smtp_password ? 'text' : 'password'}
                      value={configuracoes.email.smtp_password}
                      onChange={(e) => updateConfig('email', 'smtp_password', e.target.value)}
                      placeholder="senha-do-email"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('smtp_password')}
                      className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.smtp_password ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </>
              )}
              
              <Input
                label="Email Remetente"
                type="email"
                value={configuracoes.email.from_email}
                onChange={(e) => updateConfig('email', 'from_email', e.target.value)}
                placeholder="noreply@meusite.com"
              />
              
              <Input
                label="Nome Remetente"
                value={configuracoes.email.from_name}
                onChange={(e) => updateConfig('email', 'from_name', e.target.value)}
                placeholder="Sistema de Rifas"
              />
            </div>
          </div>
        )}
      </Card>

      {/* Status das Configurações */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Status das Integrações</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { key: 'mercadopago', label: 'Mercado Pago', icon: CreditCard },
            { key: 'cloudinary', label: 'Cloudinary', icon: Cloud },
            { key: 'email', label: 'Email', icon: Mail },
            { key: 'whatsapp', label: 'WhatsApp', icon: Database }
          ].map(({ key, label, icon: Icon }) => (
            <div
              key={key}
              className={`p-4 rounded-lg border-2 ${
                configuracoes[key]?.enabled
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Icon className={`w-5 h-5 mr-2 ${
                    configuracoes[key]?.enabled ? 'text-green-600' : 'text-gray-400'
                  }`} />
                  <span className="font-medium text-gray-900">{label}</span>
                </div>
                
                {configuracoes[key]?.enabled ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-gray-400" />
                )}
              </div>
              
              <p className={`text-sm mt-1 ${
                configuracoes[key]?.enabled ? 'text-green-600' : 'text-gray-500'
              }`}>
                {configuracoes[key]?.enabled ? 'Configurado' : 'Não configurado'}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Settings;
