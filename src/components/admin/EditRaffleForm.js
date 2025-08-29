import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, X, Upload, Calendar, DollarSign, Hash, FileText, 
  Image as ImageIcon, Award, Gift, Plus, Trash2,
  TrendingUp, Calculator, Eye, AlertTriangle, CheckCircle
} from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import toast from 'react-hot-toast';

const EditRaffleForm = ({ rifa, isVisible, onClose, onSuccess }) => {
  const { atualizarRifa, loading } = useAdmin();
  
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    valor: '',
    qtd_total: '',
    data_sorteio: ''
  });
  
  const [imagensFiles, setImagensFiles] = useState([]);
  const [imagensPreviews, setImagensPreviews] = useState([]);
  const [numerosPremiados, setNumerosPremiados] = useState([]);
  const [errors, setErrors] = useState({});

  // Carregar dados da rifa quando o componente for aberto
  useEffect(() => {
    if (rifa && isVisible) {
      setFormData({
        titulo: rifa.titulo || '',
        descricao: rifa.descricao || '',
        valor: rifa.valor?.toString() || '',
        qtd_total: rifa.qtd_total?.toString() || '',
        data_sorteio: rifa.data_sorteio ? formatDateForInput(rifa.data_sorteio) : ''
      });

      // Carregar imagens existentes
      if (rifa.imagens && rifa.imagens.length > 0) {
        const previews = rifa.imagens.map((url, index) => ({
          id: `existing_${index}`,
          url: url,
          isExisting: true
        }));
        setImagensPreviews(previews);
      }

      // Carregar números premiados existentes
      if (rifa.numeros_premiados && rifa.numeros_premiados.length > 0) {
        const premiosFormatados = rifa.numeros_premiados.map((premio, index) => ({
          id: `existing_${index}`,
          numero: premio.numero?.toString() || '',
          premio: premio.premio || '',
          valor: premio.valor?.toString() || ''
        }));
        setNumerosPremiados(premiosFormatados);
      }
    }
  }, [rifa, isVisible]);

  const formatDateForInput = (timestamp) => {
    let date;
    if (timestamp?.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;

    const currentTotal = imagensPreviews.length;
    if (currentTotal + files.length > 5) {
      toast.error('Máximo de 5 imagens permitidas');
      return;
    }

    const validFiles = [];
    const newPreviews = [];

    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} não é um arquivo de imagem válido`);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} deve ter no máximo 5MB`);
        return;
      }

      validFiles.push(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push({
          id: Date.now() + Math.random(),
          url: e.target.result,
          file: file,
          isNew: true
        });

        if (newPreviews.length === validFiles.length) {
          setImagensFiles(prev => [...prev, ...validFiles]);
          setImagensPreviews(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    const imageToRemove = imagensPreviews[index];
    
    setImagensPreviews(prev => prev.filter((_, i) => i !== index));
    
    // Se for uma imagem nova (não existente), remover do array de files
    if (!imageToRemove.isExisting) {
      setImagensFiles(prev => prev.filter((_, i) => {
        // Encontrar o índice correto no array de files
        const newImageIndex = imagensPreviews
          .slice(0, index)
          .filter(img => !img.isExisting).length;
        return i !== newImageIndex;
      }));
    }
  };

  // Sistema de Números Premiados
  const adicionarNumeroPremiado = () => {
    setNumerosPremiados(prev => [...prev, {
      id: Date.now(),
      numero: '',
      premio: '',
      valor: ''
    }]);
  };

  const removerNumeroPremiado = (id) => {
    setNumerosPremiados(prev => prev.filter(item => item.id !== id));
  };

  const atualizarNumeroPremiado = (id, campo, valor) => {
    setNumerosPremiados(prev => prev.map(item => 
      item.id === id ? { ...item, [campo]: valor } : item
    ));
  };

  // Cálculos financeiros
  const valorTotal = parseFloat(formData.valor || 0) * parseInt(formData.qtd_total || 0);
  const custosTotaisPremiados = numerosPremiados.reduce((sum, item) => 
    sum + parseFloat(item.valor || 0), 0
  );
  const receitaLiquida = valorTotal - custosTotaisPremiados;
  const margemLucro = valorTotal > 0 ? (receitaLiquida / valorTotal) * 100 : 0;

  const validateForm = () => {
    const newErrors = {};

    if (!formData.titulo.trim()) {
      newErrors.titulo = 'Título é obrigatório';
    }

    if (!formData.descricao.trim()) {
      newErrors.descricao = 'Descrição é obrigatória';
    }

    if (!formData.valor || parseFloat(formData.valor) <= 0) {
      newErrors.valor = 'Valor deve ser maior que zero';
    }

    if (!formData.qtd_total || parseInt(formData.qtd_total) <= 0) {
      newErrors.qtd_total = 'Quantidade deve ser maior que zero';
    }

    if (!formData.data_sorteio) {
      newErrors.data_sorteio = 'Data do sorteio é obrigatória';
    }

    // Validar números premiados
    const qtdTotal = parseInt(formData.qtd_total || 0);
    numerosPremiados.forEach((item, index) => {
      if (item.numero && (parseInt(item.numero) < 1 || parseInt(item.numero) > qtdTotal)) {
        newErrors[`numero_${index}`] = `Número deve estar entre 1 e ${qtdTotal}`;
      }
      if (item.numero && !item.premio.trim()) {
        newErrors[`premio_${index}`] = 'Descrição do prêmio é obrigatória';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const rifaData = {
        titulo: formData.titulo.trim(),
        descricao: formData.descricao.trim(),
        valor: parseFloat(formData.valor),
        qtd_total: parseInt(formData.qtd_total),
        data_sorteio: new Date(formData.data_sorteio),
        numeros_premiados: numerosPremiados.map(item => ({
          numero: parseInt(item.numero),
          premio: item.premio.trim(),
          valor: parseFloat(item.valor || 0)
        })).filter(item => item.numero && item.premio),
        receita_estimada: valorTotal,
        custos_premiados: custosTotaisPremiados,
        receita_liquida: receitaLiquida
      };

      // Preparar imagens (manter existentes + novas)
      const imagensExistentes = imagensPreviews
        .filter(img => img.isExisting)
        .map(img => img.url);
      
      await atualizarRifa(rifa.id, rifaData, imagensFiles, imagensExistentes);
      
      toast.success('Rifa atualizada com sucesso!');
      
      if (onSuccess) onSuccess();
      
    } catch (error) {
      console.error('Erro ao atualizar rifa:', error);
      toast.error('Erro ao atualizar rifa');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const getMinDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  if (!isVisible || !rifa) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mb-8"
    >
      <Card>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Gift className="w-6 h-6 text-primary-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Editar Rifa</h2>
              <span className={`ml-3 px-3 py-1 rounded-full text-sm font-medium ${
                rifa.status === 'ativa' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {rifa.status === 'ativa' ? 'Ativa' : 'Finalizada'}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Status da Rifa */}
          <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-600">{rifa.qtd_vendida || 0}</p>
              <p className="text-sm text-gray-600">Números Vendidos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{formatCurrency((rifa.qtd_vendida || 0) * (rifa.valor || 0))}</p>
              <p className="text-sm text-gray-600">Arrecadado</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{rifa.participantes || 0}</p>
              <p className="text-sm text-gray-600">Participantes</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Upload de Múltiplas Imagens */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagens do Prêmio ({imagensPreviews.length}/5)
              </label>
              
              {imagensPreviews.length > 0 && (
                <div className="mb-4 grid grid-cols-2 md:grid-cols-5 gap-4">
                  {imagensPreviews.map((preview, index) => (
                    <motion.div
                      key={preview.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative group"
                    >
                      <img
                        src={preview.url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                      {index === 0 && (
                        <div className="absolute bottom-1 left-1 bg-primary-500 text-white text-xs px-1 rounded">
                          Principal
                        </div>
                      )}
                      {preview.isExisting && (
                        <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                          Atual
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
              
              {imagensPreviews.length < 5 && (
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-primary-400 transition-colors">
                  <div className="space-y-1 text-center">
                    <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500">
                        <span>
                          {imagensPreviews.length === 0 ? 'Clique para fazer upload' : 'Adicionar mais imagens'}
                        </span>
                        <input
                          type="file"
                          multiple
                          className="sr-only"
                          accept="image/*"
                          onChange={handleImageChange}
                        />
                      </label>
                      <p className="pl-1">ou arraste e solte</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF até 5MB cada
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Informações Básicas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Input
                  label="Título da Rifa"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleInputChange}
                  placeholder="Ex: iPhone 15 Pro Max"
                  error={errors.titulo}
                  icon={FileText}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    name="descricao"
                    value={formData.descricao}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Descreva o prêmio e as regras da rifa..."
                  />
                  {errors.descricao && (
                    <p className="mt-1 text-sm text-red-600">{errors.descricao}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Valor por Número"
                    name="valor"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valor}
                    onChange={handleInputChange}
                    placeholder="10.00"
                    error={errors.valor}
                    icon={DollarSign}
                  />

                  <div>
                    <Input
                      label="Qtd de Números"
                      name="qtd_total"
                      type="number"
                      min="1"
                      value={formData.qtd_total}
                      onChange={handleInputChange}
                      placeholder="1000"
                      error={errors.qtd_total}
                      icon={Hash}
                    />
                    {rifa.qtd_vendida > 0 && parseInt(formData.qtd_total) < rifa.qtd_total && (
                      <p className="mt-1 text-xs text-amber-600 flex items-center">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Atenção: Reduzir quantidade pode afetar números já vendidos
                      </p>
                    )}
                  </div>
                </div>

                <Input
                  label="Data e Hora do Sorteio"
                  name="data_sorteio"
                  type="datetime-local"
                  min={getMinDateTime()}
                  value={formData.data_sorteio}
                  onChange={handleInputChange}
                  error={errors.data_sorteio}
                  icon={Calendar}
                />
              </div>

              {/* Cálculos Visuais */}
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg">
                  <div className="flex items-center mb-4">
                    <Calculator className="w-5 h-5 text-green-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Projeção Atualizada</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Receita Bruta:</span>
                      <span className="text-2xl font-bold text-green-600">
                        {formatCurrency(valorTotal)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Custos Prêmios:</span>
                      <span className="text-lg font-semibold text-red-600">
                        -{formatCurrency(custosTotaisPremiados)}
                      </span>
                    </div>
                    
                    <div className="border-t pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-900 font-medium">Lucro Líquido:</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {formatCurrency(receitaLiquida)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-gray-600">Margem:</span>
                        <span className={`text-sm font-medium ${margemLucro >= 50 ? 'text-green-600' : margemLucro >= 20 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {margemLucro.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sistema de Números Premiados */}
            <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Gift className="w-5 h-5 text-yellow-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Números Premiados</h3>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={adicionarNumeroPremiado}
                  className="flex items-center"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </div>

              <div className="space-y-3">
                {numerosPremiados.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3 items-start bg-white p-3 rounded-lg border"
                  >
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <input
                          type="number"
                          min="1"
                          max={formData.qtd_total || 9999}
                          placeholder="Número"
                          value={item.numero}
                          onChange={(e) => atualizarNumeroPremiado(item.id, 'numero', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                        {errors[`numero_${index}`] && (
                          <p className="text-xs text-red-600 mt-1">{errors[`numero_${index}`]}</p>
                        )}
                      </div>
                      
                      <input
                        type="text"
                        placeholder="Descrição do prêmio"
                        value={item.premio}
                        onChange={(e) => atualizarNumeroPremiado(item.id, 'premio', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                      
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Valor/Custo"
                        value={item.valor}
                        onChange={(e) => atualizarNumeroPremiado(item.id, 'valor', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removerNumeroPremiado(item.id)}
                      className="text-red-600 hover:text-red-700 p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}

                {numerosPremiados.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Award className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Nenhum número premiado configurado</p>
                  </div>
                )}
              </div>
            </div>

            {/* Botões */}
            <div className="flex space-x-3 pt-6">
              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={onClose}
                disabled={loading}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={loading}
                disabled={loading}
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar Alterações
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </motion.div>
  );
};

export default EditRaffleForm;
