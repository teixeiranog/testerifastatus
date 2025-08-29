import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Calendar, DollarSign, Hash, FileText, Image as ImageIcon } from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import toast from 'react-hot-toast';

const CreateRaffleModal = ({ isOpen, onClose, onSuccess }) => {
  const { criarRifa, loading } = useAdmin();
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    valor: '',
    qtd_total: '',
    data_sorteio: ''
  });
  const [imagensFiles, setImagensFiles] = useState([]);
  const [imagensPreviews, setImagensPreviews] = useState([]);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpar erro do campo quando usuário começar a digitar
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

    // Verificar se não excede o limite de 5 imagens
    if (imagensFiles.length + files.length > 5) {
      toast.error('Máximo de 5 imagens permitidas');
      return;
    }

    const validFiles = [];
    const newPreviews = [];

    files.forEach(file => {
      // Verificar tipo do arquivo
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} não é um arquivo de imagem válido`);
        return;
      }

      // Verificar tamanho (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} deve ter no máximo 5MB`);
        return;
      }

      validFiles.push(file);

      // Criar preview
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push({
          id: Date.now() + Math.random(),
          url: e.target.result,
          file: file
        });

        // Quando todos os previews estiverem carregados
        if (newPreviews.length === validFiles.length) {
          setImagensFiles(prev => [...prev, ...validFiles]);
          setImagensPreviews(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImagensFiles(prev => prev.filter((_, i) => i !== index));
    setImagensPreviews(prev => prev.filter((_, i) => i !== index));
  };

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
    } else {
      const dataSort = new Date(formData.data_sorteio);
      const agora = new Date();
      if (dataSort <= agora) {
        newErrors.data_sorteio = 'Data do sorteio deve ser no futuro';
      }
    }

    // Temporariamente permitir sem imagem para teste
    // if (imagensFiles.length === 0) {
    //   newErrors.imagem = 'Pelo menos uma imagem é obrigatória';
    // }

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
        data_sorteio: new Date(formData.data_sorteio)
      };

      await criarRifa(rifaData, imagensFiles);
      
      // Reset form
      setFormData({
        titulo: '',
        descricao: '',
        valor: '',
        qtd_total: '',
        data_sorteio: ''
      });
      setImagensFiles([]);
      setImagensPreviews([]);
      setErrors({});
      
      onSuccess();
    } catch (error) {
      console.error('Erro ao criar rifa:', error);
    }
  };

  const handleClose = () => {
    setFormData({
      titulo: '',
      descricao: '',
      valor: '',
      qtd_total: '',
      data_sorteio: ''
    });
    setImagensFiles([]);
    setImagensPreviews([]);
    setErrors({});
    onClose();
  };

  // Formatar data para input datetime-local
  const getMinDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Nova Rifa"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Upload de Múltiplas Imagens */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Imagens do Prêmio ({imagensPreviews.length}/5)
          </label>
          
          {/* Previews das Imagens */}
          {imagensPreviews.length > 0 && (
            <div className="mb-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
                    className="w-full h-24 object-cover rounded-lg border-2 border-gray-200 raffle-image"
                    style={{ backgroundColor: 'white' }}
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-danger-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-danger-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                  {index === 0 && (
                    <div className="absolute bottom-1 left-1 bg-primary-500 text-white text-xs px-1 rounded">
                      Principal
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
          
          {/* Upload Area */}
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
                  PNG, JPG, GIF até 5MB cada • Máximo {5 - imagensPreviews.length} imagens
                </p>
                <p className="text-xs text-primary-600">
                  A primeira imagem será a principal
                </p>
              </div>
            </div>
          )}
          
          {errors.imagem && (
            <p className="mt-1 text-sm text-danger-600">{errors.imagem}</p>
          )}
        </div>

        {/* Título */}
        <Input
          label="Título da Rifa"
          name="titulo"
          value={formData.titulo}
          onChange={handleInputChange}
          placeholder="Ex: iPhone 15 Pro Max"
          error={errors.titulo}
          icon={FileText}
        />

        {/* Descrição */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descrição
          </label>
          <textarea
            name="descricao"
            value={formData.descricao}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            placeholder="Descreva o prêmio e as regras da rifa..."
          />
          {errors.descricao && (
            <p className="mt-1 text-sm text-danger-600">{errors.descricao}</p>
          )}
        </div>

        {/* Valor e Quantidade */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <Input
            label="Quantidade de Números"
            name="qtd_total"
            type="number"
            min="1"
            value={formData.qtd_total}
            onChange={handleInputChange}
            placeholder="1000"
            error={errors.qtd_total}
            icon={Hash}
          />
        </div>

        {/* Data do Sorteio */}
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

        {/* Preview dos dados */}
        {formData.titulo && formData.valor && formData.qtd_total && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-50 p-4 rounded-lg"
          >
            <h4 className="font-semibold text-gray-900 mb-2">Preview:</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Rifa:</strong> {formData.titulo}</p>
              <p><strong>Valor total:</strong> R$ {(parseFloat(formData.valor || 0) * parseInt(formData.qtd_total || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p><strong>Números:</strong> {formData.qtd_total} números de R$ {parseFloat(formData.valor || 0).toFixed(2)} cada</p>
            </div>
          </motion.div>
        )}

        {/* Buttons */}
        <div className="flex space-x-3 pt-6">
          <Button
            type="button"
            variant="outline"
            fullWidth
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={loading}
            disabled={loading}
          >
            <Upload className="w-4 h-4 mr-2" />
            Criar Rifa
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateRaffleModal;
