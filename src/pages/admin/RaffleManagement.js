import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  Calendar,
  Users,
  DollarSign,
  Trophy,
  Search,
  Filter,
  MoreVertical,
  Pause
} from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Loading from '../../components/ui/Loading';
import ImageCarousel from '../../components/ui/ImageCarousel';
import CreateRaffleForm from '../../components/admin/CreateRaffleForm';
import { optimizeImage } from '../../config/cloudinary';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const RaffleManagement = () => {
  const { 
    rifas, 
    loading, 
    buscarTodasRifas, 
    finalizarRifa, 
    deletarRifa,
    sortearVencedor
  } = useAdmin();
  const navigate = useNavigate();
  const [isCreateFormVisible, setIsCreateFormVisible] = useState(false);
  const [filtro, setFiltro] = useState('todas');
  const [busca, setBusca] = useState('');
  const [rifaParaExcluir, setRifaParaExcluir] = useState(null);
  const [activeTab, setActiveTab] = useState('rifas');
  const [excluindoRifa, setExcluindoRifa] = useState(null);
  const [rifaParaSortear, setRifaParaSortear] = useState(null);
  const [sorteioResultado, setSorteioResultado] = useState(null);
  const [modoSorteio, setModoSorteio] = useState('aleatorio'); // 'aleatorio' ou 'manual'
  const [numeroEscolhido, setNumeroEscolhido] = useState('');

  // Buscar rifas quando componente monta
  useEffect(() => {
    buscarTodasRifas();
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'Data não definida';
    
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return format(dateObj, "dd/MM/yyyy", { locale: ptBR });
  };

  const getProgressPercentage = (rifa) => {
    if (!rifa.qtd_total || rifa.qtd_vendida === undefined) return 0;
    return Math.round((rifa.qtd_vendida / rifa.qtd_total) * 100);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ativa':
        return 'bg-success-100 text-success-800';
      case 'finalizada':
        return 'bg-gray-100 text-gray-800';
      case 'pausada':
        return 'bg-warning-100 text-warning-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filtrarRifas = () => {
    let rifasFiltradas = rifas;

    // Filtro por status
    if (filtro !== 'todas') {
      rifasFiltradas = rifasFiltradas.filter(rifa => rifa.status === filtro);
    }

    // Filtro por busca
    if (busca) {
      rifasFiltradas = rifasFiltradas.filter(rifa =>
        rifa.titulo.toLowerCase().includes(busca.toLowerCase()) ||
        rifa.descricao?.toLowerCase().includes(busca.toLowerCase())
      );
    }

    return rifasFiltradas;
  };

  const handleFinalizarRifa = async (rifaId) => {
    const rifa = rifas.find(r => r.id === rifaId);
    if (rifa) {
      setRifaParaSortear(rifa);
    }
  };

  const handleSortearVencedor = async () => {
    if (rifaParaSortear) {
      try {
        const resultado = await sortearVencedor(rifaParaSortear.id, modoSorteio === 'manual' ? numeroEscolhido : null);
        if (resultado) {
          setSorteioResultado(resultado);
        }
      } catch (error) {
        console.error('Erro ao sortear vencedor:', error);
      }
    }
  };

  const handleFecharSorteio = () => {
    setRifaParaSortear(null);
    setSorteioResultado(null);
    setModoSorteio('aleatorio');
    setNumeroEscolhido('');
  };

  const handleDeletarRifa = async () => {
    if (rifaParaExcluir) {
      try {
        setExcluindoRifa(rifaParaExcluir.id);
        await deletarRifa(rifaParaExcluir.id);
        setRifaParaExcluir(null);
      } catch (error) {
        console.error('Erro ao deletar rifa:', error);
      } finally {
        setExcluindoRifa(null);
      }
    }
  };

  const rifasFiltradas = filtrarRifas();

  const contadores = rifas.reduce((acc, rifa) => {
    acc.total++;
    acc[rifa.status] = (acc[rifa.status] || 0) + 1;
    return acc;
  }, { total: 0, ativa: 0, finalizada: 0, pausada: 0 });

  if (loading && rifas.length === 0) {
    return <Loading text="Carregando rifas..." />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Rifas</h1>
          <p className="text-gray-600 mt-1">
            Gerencie todas as suas rifas em um só lugar
          </p>
        </div>
        
        <Button
          variant={isCreateFormVisible ? "outline" : "primary"}
          onClick={() => setIsCreateFormVisible(!isCreateFormVisible)}
          className="w-full sm:w-auto"
        >
          <Plus className="w-5 h-5 mr-2" />
          {isCreateFormVisible ? 'Cancelar' : 'Nova Rifa'}
        </Button>
      </div>



      {/* Formulário de Criação Inline */}
      <CreateRaffleForm
        isVisible={isCreateFormVisible}
        onClose={() => setIsCreateFormVisible(false)}
        onSuccess={() => {
          setIsCreateFormVisible(false);
          buscarTodasRifas();
        }}
      />

      {/* Formulário de edição removido - agora usa página dedicada */}

      {/* Quick Stats - Ocultas quando formulário de criação está aberto */}
      {!isCreateFormVisible && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-100 text-sm font-medium">Ativas</p>
                <p className="text-2xl font-bold">{contadores.ativa || 0}</p>
              </div>
              <Calendar className="w-8 h-8 text-primary-200" />
            </div>
          </Card>

          <Card className="bg-gradient-to-r from-success-500 to-success-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-success-100 text-sm font-medium">Finalizadas</p>
                <p className="text-2xl font-bold">{contadores.finalizada || 0}</p>
              </div>
              <Calendar className="w-8 h-8 text-success-200" />
            </div>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Pausadas</p>
                <p className="text-2xl font-bold">{contadores.pausada || 0}</p>
              </div>
              <Pause className="w-8 h-8 text-blue-200" />
            </div>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Receita Total</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(rifas.reduce((total, rifa) => total + (rifa.receita_total || 0), 0))}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-200" />
            </div>
          </Card>
        </div>
      )}

      {/* Background Operations Indicator */}
      {loading && (
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-center py-3">
            <div className="w-4 h-4 loading-spinner mr-3"></div>
            <p className="text-blue-700 font-medium">Operações em andamento...</p>
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por título ou descrição..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="todas">Todas</option>
              <option value="ativa">Ativas</option>
              <option value="finalizada">Finalizadas</option>
              <option value="pausada">Pausadas</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Rifas List */}
      {rifasFiltradas.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {rifasFiltradas.map((rifa, index) => {
            // Preparar URLs das imagens otimizadas
            const getOptimizedImages = () => {
              if (rifa.imagens && rifa.imagens.length > 0) {
                return rifa.imagens.map(url => optimizeImage(url, {
                  width: 400,
                  height: 250,
                  quality: 'auto',
                  crop: 'fill'
                }));
              } else if (rifa.imagem) {
                return [optimizeImage(rifa.imagem, {
                  width: 400,
                  height: 250,
                  quality: 'auto',
                  crop: 'fill'
                })];
              }
              return [];
            };

            const optimizedImages = getOptimizedImages();

            return (
              <motion.div
                key={rifa.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card 
                  className={`overflow-hidden h-full cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
                    excluindoRifa === rifa.id ? 'opacity-50 pointer-events-none' : ''
                  }`}
                  onClick={() => navigate(`/admin/rifas/editar/${rifa.id}`)}
                >
                  {/* Loading overlay para rifas sendo excluídas */}
                  {excluindoRifa === rifa.id && (
                    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                      <div className="text-center">
                        <div className="w-8 h-8 loading-spinner mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600">Excluindo...</p>
                      </div>
                    </div>
                  )}
                  {/* Image Carousel */}
                  <div className="relative">
                    <ImageCarousel
                      images={optimizedImages}
                      height="h-48"
                      autoPlay={true}
                      autoPlayInterval={4000}
                      showDots={optimizedImages.length > 1}
                      showArrows={optimizedImages.length > 1}
                    />
                    
                    {/* Status Badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(rifa.status)}`}>
                        {rifa.status === 'ativa' ? 'Ativa' : 
                         rifa.status === 'finalizada' ? 'Finalizada' : 
                         'Pausada'}
                      </span>
                    </div>

                    {/* Actions Menu */}
                    <div className="absolute top-3 right-3">
                      <div className="relative group">
                        <button 
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-all"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-600" />
                        </button>
                        
                        <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                          <div className="py-1 w-32">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/admin/rifas/editar/${rifa.id}`);
                              }}
                              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Ver
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/admin/rifas/editar/${rifa.id}`);
                              }}
                              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Edit3 className="w-4 h-4 mr-2" />
                              Editar
                            </button>
                            {rifa.status === 'ativa' && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFinalizarRifa(rifa.id);
                                }}
                                className="flex items-center w-full px-3 py-2 text-sm text-warning-700 hover:bg-warning-50"
                              >
                                <Calendar className="w-4 h-4 mr-2" />
                                Sortear
                              </button>
                            )}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setRifaParaExcluir(rifa);
                              }}
                              className="flex items-center w-full px-3 py-2 text-sm text-danger-700 hover:bg-danger-50"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Title */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {rifa.titulo}
                    </h3>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Valor</p>
                        <p className="font-semibold text-primary-600">
                          {formatCurrency(rifa.valor)}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">Vendidos</p>
                        <p className="font-semibold">
                          {rifa.qtd_vendida || 0}/{rifa.qtd_total}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">Receita</p>
                        <p className="font-semibold text-green-600">
                          {formatCurrency(rifa.receita_total || 0)}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">Participantes</p>
                        <p className="font-semibold text-blue-600">
                          {rifa.participantes || 0}
                        </p>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Progresso</span>
                        <span>{getProgressPercentage(rifa)}%</span>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${getProgressPercentage(rifa)}%` }}
                        />
                      </div>
                    </div>

                    {/* Date */}
                    <div className="text-sm text-gray-600">
                      <p>Sorteio: {formatDate(rifa.data_sorteio)}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            {rifas.length === 0 ? 'Nenhuma rifa criada' : 'Nenhuma rifa encontrada'}
          </h3>
          <p className="text-gray-500 mb-6">
            {rifas.length === 0 
              ? 'Comece criando sua primeira rifa!'
              : 'Tente ajustar os filtros de busca.'
            }
          </p>
          {rifas.length === 0 && (
            <Button
              variant="primary"
              onClick={() => setIsCreateFormVisible(true)}
            >
              <Plus className="w-5 h-5 mr-2" />
              Criar Primeira Rifa
            </Button>
          )}
        </Card>
      )}

      {/* Create Raffle Modal */}
      {/* Modal de criação removido - agora usando formulário inline */}

      {/* Modal de Sorteio */}
      <Modal
        isOpen={!!rifaParaSortear}
        onClose={handleFecharSorteio}
        title="Sortear Vencedor"
        size="lg"
      >
        <div className="space-y-6">
          {rifaParaSortear && (
            <>
              {/* Informações da Rifa */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {rifaParaSortear.titulo}
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Números vendidos:</span>
                    <span className="font-semibold ml-2">
                      {rifaParaSortear.qtd_vendida || 0}/{rifaParaSortear.qtd_total}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Participantes:</span>
                    <span className="font-semibold ml-2">
                      {rifaParaSortear.participantes || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Receita total:</span>
                    <span className="font-semibold ml-2 text-green-600">
                      {formatCurrency(rifaParaSortear.receita_total || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Data do sorteio:</span>
                    <span className="font-semibold ml-2">
                      {formatDate(rifaParaSortear.data_sorteio)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Resultado do Sorteio */}
              {sorteioResultado ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trophy className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="text-xl font-bold text-green-800 mb-2">
                    Vencedor Sorteado!
                  </h4>
                  <div className="space-y-2 text-green-700">
                    <p className="text-lg">
                      <span className="font-semibold">Número:</span> {sorteioResultado.numeroSorteado}
                    </p>
                    <p className="text-lg">
                      <span className="font-semibold">Vencedor:</span> {sorteioResultado.vencedor.nome}
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">Email:</span> {sorteioResultado.vencedor.email}
                    </p>
                  </div>
                  <div className="mt-6">
                    <Button
                      variant="primary"
                      onClick={handleFecharSorteio}
                      className="px-8"
                    >
                      Fechar
                    </Button>
                  </div>
                </div>
              ) : (
                /* Opções de Sorteio */
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <Trophy className="w-10 h-10 text-blue-600" />
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      Realizar Sorteio
                    </h4>
                    <p className="text-gray-600 mb-4">
                      Escolha como deseja realizar o sorteio:
                    </p>
                  </div>

                  {/* Opções de Sorteio */}
                  <div className="space-y-4">
                    {/* Sorteio Aleatório */}
                    <div className="flex items-center space-x-3 p-3 border rounded-lg">
                      <input
                        type="radio"
                        id="aleatorio"
                        name="modoSorteio"
                        value="aleatorio"
                        checked={modoSorteio === 'aleatorio'}
                        onChange={(e) => setModoSorteio(e.target.value)}
                        className="text-blue-600"
                      />
                      <label htmlFor="aleatorio" className="flex-1 text-left cursor-pointer">
                        <div className="font-medium text-gray-900">Sorteio Aleatório</div>
                        <div className="text-sm text-gray-600">O sistema escolhe um número vendido aleatoriamente</div>
                      </label>
                    </div>

                    {/* Sorteio Manual */}
                    <div className="flex items-center space-x-3 p-3 border rounded-lg">
                      <input
                        type="radio"
                        id="manual"
                        name="modoSorteio"
                        value="manual"
                        checked={modoSorteio === 'manual'}
                        onChange={(e) => setModoSorteio(e.target.value)}
                        className="text-blue-600"
                      />
                      <label htmlFor="manual" className="flex-1 text-left cursor-pointer">
                        <div className="font-medium text-gray-900">Escolher Número</div>
                        <div className="text-sm text-gray-600">Você escolhe um número específico para ser o vencedor</div>
                      </label>
                    </div>
                  </div>

                  {/* Campo para número manual */}
                  {modoSorteio === 'manual' && (
                    <div className="space-y-2">
                      <label htmlFor="numeroEscolhido" className="block text-sm font-medium text-gray-700">
                        Número Vencedor:
                      </label>
                      <input
                        type="number"
                        id="numeroEscolhido"
                        value={numeroEscolhido}
                        onChange={(e) => setNumeroEscolhido(e.target.value)}
                        min="1"
                        max={rifaParaSortear?.qtd_total || 1000}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={`Digite um número de 1 a ${rifaParaSortear?.qtd_total || 1000}`}
                      />
                      <p className="text-xs text-gray-500">
                        Certifique-se de que o número escolhido foi vendido
                      </p>
                    </div>
                  )}

                  <div className="flex justify-center">
                    <Button
                      variant="primary"
                      onClick={handleSortearVencedor}
                      disabled={loading || (modoSorteio === 'manual' && (!numeroEscolhido || numeroEscolhido < 1 || numeroEscolhido > (rifaParaSortear?.qtd_total || 1000)))}
                      className="px-8"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 loading-spinner mr-2"></div>
                          Sorteando...
                        </>
                      ) : (
                        modoSorteio === 'manual' ? 'Definir Vencedor' : 'Sortear Vencedor'
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!rifaParaExcluir}
        onClose={() => !excluindoRifa && setRifaParaExcluir(null)}
        title="Confirmar Exclusão"
        size="sm"
      >
        <div className="space-y-4">
          {excluindoRifa ? (
            <div className="text-center py-4">
              <div className="w-8 h-8 loading-spinner mx-auto mb-3"></div>
              <p className="text-gray-600 font-medium">Excluindo rifa...</p>
              <p className="text-sm text-gray-500">Aguarde antes de excluir outra rifa</p>
            </div>
          ) : (
            <>
              <p className="text-gray-600">
                Tem certeza que deseja excluir a rifa "{rifaParaExcluir?.titulo}"?
              </p>
              <p className="text-sm text-danger-600">
                Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos.
              </p>
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setRifaParaExcluir(null)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="danger"
                  fullWidth
                  onClick={handleDeletarRifa}
                >
                  Excluir
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>


    </div>
  );
};

export default RaffleManagement;
