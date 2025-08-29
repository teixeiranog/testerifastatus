import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shuffle,
  Play,
  Trophy,
  Gift,
  Users,
  Calendar,
  CheckCircle,
  AlertCircle,
  Download,
  Hash,
  Target,
  Crown,
  Sparkles,
  Clock,
  Eye,
  Info,
  Loader2
} from 'lucide-react';
import { 
  collection, 
  query, 
  getDocs, 
  where, 
  doc, 
  updateDoc,
  addDoc,
  orderBy,
  getDoc
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Loading from '../../components/ui/Loading';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';

const formatDate = (date) => {
  if (!date) return 'Data não disponível';
  
  const dateObj = date.toDate ? date.toDate() : new Date(date);
  return format(dateObj, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const Draw = () => {
  const [rifas, setRifas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rifaSelecionada, setRifaSelecionada] = useState(null);
  const [numerosVendidos, setNumerosVendidos] = useState([]);
  const [sorteando, setSorteando] = useState(false);
  const [numeroEscolhido, setNumeroEscolhido] = useState('');
  const [ganhador, setGanhador] = useState(null);
  const [sorteioRealizado, setSorteioRealizado] = useState(false);
  const [historicoSorteios, setHistoricoSorteios] = useState([]);
  const [modalDetalhes, setModalDetalhes] = useState(false);
  const [detalhesRifa, setDetalhesRifa] = useState(null);
  const [carregandoDetalhes, setCarregandoDetalhes] = useState(true);

  useEffect(() => {
    carregarRifas();
    carregarHistoricoSorteios();
  }, []);

  // Carregar rifas elegíveis para sorteio
  const carregarRifas = async () => {
    try {
      setLoading(true);
      
      // Buscar todas as rifas
      const qTodas = query(collection(db, 'rifas'));
      const querySnapshotTodas = await getDocs(qTodas);
      
      console.log('Total de rifas encontradas:', querySnapshotTodas.size);
      
      const rifasData = [];

      for (const docSnapshot of querySnapshotTodas.docs) {
        const rifa = {
          id: docSnapshot.id,
          ...docSnapshot.data()
        };

        console.log('Processando rifa:', rifa.titulo, 'Status:', rifa.status);

        // Verificar quantos números foram vendidos
        const numerosQuery = query(
          collection(db, 'numeros'),
          where('id_rifa', '==', rifa.id)
        );
        const numerosSnapshot = await getDocs(numerosQuery);
        
        // Filtrar números vendidos
        const numerosVendidos = numerosSnapshot.docs.filter(doc => {
          const data = doc.data();
          return data.id_usuario && (data.status === 'vendido' || data.id_usuario);
        });
        
        rifa.numerosVendidos = numerosVendidos.length;
        
        // Verificar se a rifa já foi sorteada
        rifa.jaSorteada = rifa.status === 'finalizada' || rifa.numero_sorteado;
        
        // Verificar se tem números premiados
        rifa.temNumerosPremiados = rifa.numeros_premiados && rifa.numeros_premiados.length > 0;

        console.log(`Rifa ${rifa.titulo}: ${rifa.numerosVendidos} números vendidos, sorteada: ${rifa.jaSorteada}`);
        rifasData.push(rifa);
      }

      // Ordenar rifas: primeiro as não sorteadas, depois as sorteadas
      rifasData.sort((a, b) => {
        if (a.jaSorteada === b.jaSorteada) {
          // Se ambas têm o mesmo status de sorteio, ordenar por data de criação (mais recentes primeiro)
          return new Date(b.data_criacao?.toDate?.() || b.data_criacao) - new Date(a.data_criacao?.toDate?.() || a.data_criacao);
        }
        return a.jaSorteada ? 1 : -1; // Não sorteadas primeiro
      });

      console.log('Total de rifas carregadas:', rifasData.length);
      setRifas(rifasData);
    } catch (error) {
      console.error('Erro ao carregar rifas:', error);
      toast.error('Erro ao carregar rifas');
    } finally {
      setLoading(false);
    }
  };

  // Carregar histórico de sorteios
  const carregarHistoricoSorteios = async () => {
    try {
      // Buscar rifas finalizadas (já sorteadas)
      const q = query(
        collection(db, 'rifas'),
        where('status', '==', 'finalizada')
      );

      const querySnapshot = await getDocs(q);
      const historico = [];

      for (const docSnapshot of querySnapshot.docs) {
        const rifa = {
          id: docSnapshot.id,
          ...docSnapshot.data()
        };

        // Verificar se tem dados do sorteio
        if (rifa.numero_sorteado && rifa.vencedor_id) {
          historico.push({
            id: rifa.id,
            id_rifa: rifa.id,
            rifa: rifa,
            numero_sorteado: rifa.numero_sorteado,
            vencedor_id: rifa.vencedor_id,
            vencedor_nome: rifa.vencedor_nome,
            data_sorteio: rifa.data_sorteio_realizado
          });
        }
      }

      console.log('Histórico de sorteios carregado:', historico);
      setHistoricoSorteios(historico);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  // Selecionar rifa para sorteio
  const selecionarRifa = async (rifa) => {
    try {
      // Se clicar na mesma rifa que já está selecionada, deselecionar
      if (rifaSelecionada?.id === rifa.id) {
        setRifaSelecionada(null);
        setSorteioRealizado(false);
        setGanhador(null);
        setNumeroEscolhido('');
        setNumerosVendidos([]);
        setDetalhesRifa(null);
        return;
      }

      setRifaSelecionada(rifa);
      setSorteioRealizado(false);
      setGanhador(null);
      setNumeroEscolhido('');

      // Carregar números vendidos - buscar todos os números da rifa e filtrar os vendidos
      const numerosQuery = query(
        collection(db, 'numeros'),
        where('id_rifa', '==', rifa.id),
        orderBy('numero', 'asc')
      );

      const numerosSnapshot = await getDocs(numerosQuery);
      const numeros = [];

      console.log(`Buscando números para rifa ${rifa.titulo} - Total encontrado:`, numerosSnapshot.size);

      for (const docSnapshot of numerosSnapshot.docs) {
        const numero = {
          id: docSnapshot.id,
          ...docSnapshot.data()
        };

        // Filtrar apenas números vendidos (com id_usuario preenchido)
        if (numero.id_usuario) {
          console.log(`Número vendido: ${numero.numero} - Usuário: ${numero.id_usuario}`);
          
          // Buscar dados do usuário
          const usuarioDoc = await getDoc(doc(db, 'usuarios', numero.id_usuario));
          if (usuarioDoc.exists()) {
            numero.usuario = usuarioDoc.data();
          }

          numeros.push(numero);
        }
      }

      console.log(`Números vendidos encontrados para rifa ${rifa.titulo}:`, numeros.length);

      setNumerosVendidos(numeros);

      // Se a rifa já foi sorteada, carregar detalhes do sorteio
      if (rifa.jaSorteada) {
        await carregarDetalhesSorteio(rifa);
      }

      // Carregar números premiados se existirem
      if (rifa.temNumerosPremiados) {
        await carregarNumerosPremiados(rifa);
      }

    } catch (error) {
      console.error('Erro ao selecionar rifa:', error);
      toast.error('Erro ao carregar dados da rifa');
    }
  };

  // Carregar detalhes do sorteio realizado
  const carregarDetalhesSorteio = async (rifa) => {
    try {
      // Primeiro, verificar se a rifa tem dados do sorteio diretamente
      if (rifa.numero_sorteado && rifa.vencedor_id) {
        // Buscar dados do usuário ganhador
        const usuarioDoc = await getDoc(doc(db, 'usuarios', rifa.vencedor_id));
        const usuarioData = usuarioDoc.exists() ? usuarioDoc.data() : null;
        
        setGanhador({
          numero: rifa.numero_sorteado,
          usuario: usuarioData || {
            nome: rifa.vencedor_nome || 'Usuário não encontrado',
            email: rifa.vencedor_email || '',
            telefone: rifa.vencedor_telefone || ''
          },
          data_sorteio: rifa.data_sorteio_realizado
        });
        setSorteioRealizado(true);
        return;
      }

      // Se não tem dados diretos, buscar na coleção de sorteios
      const sorteiosQuery = query(
        collection(db, 'sorteios'),
        where('id_rifa', '==', rifa.id)
      );
      const sorteiosSnapshot = await getDocs(sorteiosQuery);
      
      if (!sorteiosSnapshot.empty) {
        const sorteio = sorteiosSnapshot.docs[0].data();
        setGanhador({
          numero: sorteio.numero_sorteado,
          usuario: {
            nome: sorteio.nome_ganhador,
            email: sorteio.email_ganhador,
            telefone: sorteio.telefone_ganhador
          },
          data_sorteio: sorteio.data_sorteio
        });
        setSorteioRealizado(true);
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes do sorteio:', error);
    }
  };

  // Carregar números premiados e seus ganhadores
  const carregarNumerosPremiados = async (rifa) => {
    try {
      const numerosPremiadosData = [];

      if (rifa.numeros_premiados && rifa.numeros_premiados.length > 0) {
        // Para cada número premiado, verificar se foi vendido
        for (const numeroPremiado of rifa.numeros_premiados) {
          const numerosQuery = query(
            collection(db, 'numeros'),
            where('id_rifa', '==', rifa.id),
            where('numero', '==', numeroPremiado.numero)
          );
          const numerosSnapshot = await getDocs(numerosQuery);

          if (!numerosSnapshot.empty) {
            const numero = numerosSnapshot.docs[0].data();
            
            if (numero.id_usuario) {
              // Buscar dados do usuário
              const usuarioDoc = await getDoc(doc(db, 'usuarios', numero.id_usuario));
              if (usuarioDoc.exists()) {
                const usuario = usuarioDoc.data();
                
                numerosPremiadosData.push({
                  numero: numeroPremiado.numero,
                  premio: numeroPremiado.premio || 'Prêmio',
                  valor: numeroPremiado.valor || 0,
                  usuario: usuario,
                  data_compra: numero.data_criacao
                });
              }
            }
          }
        }
      }

      setDetalhesRifa(prev => ({
        ...prev,
        numerosPremiados: numerosPremiadosData
      }));
    } catch (error) {
      console.error('Erro ao carregar números premiados:', error);
    }
  };

  // Realizar sorteio automático
  const realizarSorteio = async () => {
    if (!rifaSelecionada) {
      toast.error('Nenhuma rifa selecionada');
      return;
    }

    if (numerosVendidos.length === 0) {
      toast.error('Nenhum número vendido para realizar o sorteio');
      return;
    }

    try {
      setSorteando(true);
      setGanhador(null);
      setSorteioRealizado(false);

      // Se número foi escolhido manualmente, usar ele
      let numeroVencedor;
      if (numeroEscolhido && numeroEscolhido.trim() !== '') {
        const numeroEscolhidoInt = parseInt(numeroEscolhido);
        const numeroExiste = numerosVendidos.find(n => n.numero === numeroEscolhidoInt);
        if (!numeroExiste) {
          toast.error(`Número ${numeroEscolhido} não foi vendido`);
          setSorteando(false);
          return;
        }
        numeroVencedor = numeroExiste;
        console.log(`Sorteio manual: número ${numeroEscolhido} selecionado`);
      } else {
        // Sorteio automático
        const indiceAleatorio = Math.floor(Math.random() * numerosVendidos.length);
        numeroVencedor = numerosVendidos[indiceAleatorio];
        console.log(`Sorteio automático: número ${numeroVencedor.numero} selecionado`);
      }

      // Animação de sorteio
      let contador = 0;
      const animacao = setInterval(() => {
        const numeroTemp = numerosVendidos[Math.floor(Math.random() * numerosVendidos.length)];
        setGanhador({
          ...numeroTemp,
          animando: true
        });
        contador++;

        if (contador >= 20) {
          clearInterval(animacao);
          
          // Mostrar resultado final
          setTimeout(() => {
            setGanhador({
              ...numeroVencedor,
              animando: false
            });
            setSorteioRealizado(true);
            salvarSorteio(numeroVencedor);
          }, 500);
        }
      }, 100);

    } catch (error) {
      console.error('Erro no sorteio:', error);
      toast.error('Erro ao realizar sorteio');
      setSorteando(false);
    }
  };

  // Salvar resultado do sorteio no banco
  const salvarSorteio = async (numeroVencedor) => {
    try {
      const sorteioData = {
        id_rifa: rifaSelecionada.id,
        numero_sorteado: numeroVencedor.numero,
        id_usuario_ganhador: numeroVencedor.id_usuario,
        nome_ganhador: numeroVencedor.usuario?.nome || 'Usuário',
        email_ganhador: numeroVencedor.usuario?.email || '',
        telefone_ganhador: numeroVencedor.usuario?.telefone || '',
        data_sorteio: new Date(),
        status: 'realizado',
        metodo: numeroEscolhido ? 'manual' : 'automatico',
        rifa_titulo: rifaSelecionada.titulo,
        rifa_valor: rifaSelecionada.valor,
        total_participantes: numerosVendidos.length,
        total_numeros: rifaSelecionada.qtd_total
      };

      // Salvar sorteio
      await addDoc(collection(db, 'sorteios'), sorteioData);

      // Atualizar status da rifa
      await updateDoc(doc(db, 'rifas', rifaSelecionada.id), {
        status: 'finalizada',
        numero_sorteado: numeroVencedor.numero,
        ganhador_id: numeroVencedor.id_usuario,
        data_sorteio_realizado: new Date()
      });

      // Atualizar número como ganhador
      await updateDoc(doc(db, 'numeros', numeroVencedor.id), {
        status: 'ganhador',
        data_sorteio: new Date()
      });

      toast.success('Sorteio realizado e salvo com sucesso!');
      
      // Recarregar dados
      carregarRifas();
      carregarHistoricoSorteios();

    } catch (error) {
      console.error('Erro ao salvar sorteio:', error);
      toast.error('Erro ao salvar resultado do sorteio');
    }
  };

  const abrirModalDetalhes = async (rifa) => {
    setCarregandoDetalhes(true);
    setDetalhesRifa(null);
    try {
      const rifaDoc = await getDoc(doc(db, 'rifas', rifa.id));
      const numerosDoc = await getDocs(query(collection(db, 'numeros'), where('id_rifa', '==', rifa.id)));
      const sorteiosDoc = await getDocs(query(collection(db, 'sorteios'), where('id_rifa', '==', rifa.id)));

      const rifaData = rifaDoc.data();
      const numerosData = numerosDoc.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const sorteiosData = sorteiosDoc.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const totalNumeros = numerosData.length;
      const totalPremiados = sorteiosData.filter(s => s.numero_sorteado).length;

      setDetalhesRifa({
        rifa: rifaData,
        totalNumeros,
        totalPremiados,
        numeros: numerosData,
        sorteios: sorteiosData,
        vencedorPrincipal: sorteiosData.find(s => s.numero_sorteado) || null,
        numerosPremiados: sorteiosData.filter(s => s.numero_sorteado).map(s => ({
          ...s,
          usuario: numerosData.find(n => n.id === s.id_usuario_ganhador)?.usuario
        }))
      });
    } catch (error) {
      console.error('Erro ao carregar detalhes da rifa:', error);
      toast.error('Erro ao carregar detalhes da rifa');
    } finally {
      setCarregandoDetalhes(false);
      setModalDetalhes(true);
    }
  };

  if (loading) {
    return <Loading fullScreen text="Carregando sorteios..." />;
  }

  return (
    <div className="space-y-3 lg:space-y-6 overflow-x-hidden max-w-full px-1 lg:px-0">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 flex items-center">
              <Shuffle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-primary-600 mr-2" />
              Sistema de Sorteios
            </h1>
            <p className="text-gray-600 mt-1 text-xs sm:text-sm">
              Visualize todas as rifas e realize sorteios de forma segura
            </p>
          </div>
          <div className="mt-2 sm:mt-0">
            <div className="flex flex-wrap items-center gap-1 lg:gap-2 text-xs lg:text-sm text-gray-500">
              <div className="flex items-center">
                <div className="w-2 h-2 lg:w-3 lg:h-3 bg-green-500 rounded-full mr-1"></div>
                <span>Sorteadas ({rifas.filter(r => r.jaSorteada).length})</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 lg:w-3 lg:h-3 bg-blue-500 rounded-full mr-1"></div>
                <span>Disponíveis ({rifas.filter(r => !r.jaSorteada && r.numerosVendidos > 0).length})</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 lg:w-3 lg:h-3 bg-yellow-500 rounded-full mr-1"></div>
                <span>Pausadas ({rifas.filter(r => r.status === 'pausada').length})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8 min-w-0">
        {/* Lista de Rifas */}
        <div className="w-full">
          <Card className="bg-white text-black border border-gray-200 h-fit min-w-0">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-black flex items-center">
                  <Gift className="w-5 h-5 mr-2 text-blue-200" />
                  Todas as Rifas
                </h2>
                <div className="flex items-center space-x-2">
                  <span className="bg-blue-400 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {rifas.length} total
                  </span>
                  <span className="bg-green-400 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {rifas.filter(r => r.jaSorteada).length} sorteadas
                  </span>
                </div>
              </div>
              
              <div className="space-y-3">
                {rifas.length > 0 ? (
                  rifas.map((rifa) => (
                    <motion.div
                      key={rifa.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 ${
                        rifaSelecionada?.id === rifa.id
                          ? 'border-blue-300 bg-blue-400 shadow-md'
                          : rifa.jaSorteada
                          ? 'border-green-300 bg-green-400 hover:border-green-200 hover:bg-green-300'
                          : rifa.status === 'pausada'
                          ? 'border-yellow-300 bg-yellow-400 hover:border-yellow-200 hover:bg-yellow-300'
                          : 'border-blue-300 bg-blue-400 hover:border-blue-200 hover:bg-blue-300 shadow-sm hover:shadow-md'
                      }`}
                      onClick={() => selecionarRifa(rifa)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white truncate text-base">
                            {rifa.titulo}
                          </h3>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-blue-100">
                            <span className="flex items-center">
                              <Users className="w-4 h-4 mr-1" />
                              {rifa.numerosVendidos} vendidos
                            </span>
                            <span className="font-medium text-white">
                              {formatCurrency(rifa.valor)}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              rifa.jaSorteada 
                                ? 'bg-green-300 text-green-900' 
                                : rifa.status === 'pausada'
                                ? 'bg-yellow-300 text-yellow-900'
                                : rifa.numerosVendidos > 0 
                                  ? 'bg-blue-300 text-blue-900'
                                  : 'bg-gray-300 text-gray-900'
                            }`}>
                              {rifa.jaSorteada ? 'Sorteada' : rifa.status === 'pausada' ? 'Pausada' : rifa.numerosVendidos > 0 ? 'Disponível' : 'Sem vendas'}
                            </span>
                            {rifa.temNumerosPremiados && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-300 text-purple-900">
                                <Gift className="w-3 h-3 mr-1" />
                                Prêmios
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end space-y-2">
                          {/* Botão Sortear para rifas não sorteadas */}
                          {!rifa.jaSorteada && rifa.numerosVendidos > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                selecionarRifa(rifa);
                              }}
                              className="text-xs px-3 py-1.5 bg-white text-blue-600 hover:bg-blue-50 border-white"
                            >
                              <Shuffle className="w-3 h-3 mr-1" />
                              Sortear
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12 text-blue-200">
                    <Gift className="w-16 h-16 mx-auto mb-4 text-blue-300" />
                    <h3 className="text-lg font-medium text-white mb-2">Nenhuma rifa encontrada</h3>
                    <p className="text-sm text-blue-200">Não há rifas cadastradas no sistema</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Sistema de Sorteio - Só aparece quando uma rifa é selecionada */}
        {rifaSelecionada && (
          <div className="w-full space-y-6">
            {/* Informações da Rifa Selecionada */}
            <Card>
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-1">
                      {rifaSelecionada.titulo}
                    </h2>
                    <div className="flex items-center space-x-3">
                      <p className="text-gray-600 text-sm">
                        {rifaSelecionada.jaSorteada ? 'Rifa finalizada' : rifaSelecionada.status === 'pausada' ? 'Rifa pausada' : 'Rifa disponível para sorteio'}
                      </p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        rifaSelecionada.jaSorteada 
                          ? 'bg-green-100 text-green-800' 
                          : rifaSelecionada.status === 'pausada'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {rifaSelecionada.jaSorteada ? 'Sorteada' : rifaSelecionada.status === 'pausada' ? 'Pausada' : 'Ativa'}
                      </span>
                      {rifaSelecionada.temNumerosPremiados && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          <Gift className="w-3 h-3 mr-1" />
                          Com Prêmios
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 sm:mt-0">
                    <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                      rifaSelecionada.jaSorteada 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-primary-100 text-primary-800'
                    }`}>
                      {numerosVendidos.length} números vendidos
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm font-medium">Total de números</p>
                        <p className="text-2xl font-bold">{rifaSelecionada.qtd_total}</p>
                      </div>
                      <Hash className="w-8 h-8 text-blue-200" />
                    </div>
                  </Card>
                  <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm font-medium">Números vendidos</p>
                        <p className="text-2xl font-bold">{numerosVendidos.length}</p>
                      </div>
                      <Users className="w-8 h-8 text-green-200" />
                    </div>
                  </Card>
                  <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm font-medium">Valor unitário</p>
                        <p className="text-2xl font-bold">{formatCurrency(rifaSelecionada.valor)}</p>
                      </div>
                      <Trophy className="w-8 h-8 text-purple-200" />
                    </div>
                  </Card>
                  <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-100 text-sm font-medium">Valor total</p>
                        <p className="text-2xl font-bold">{formatCurrency(rifaSelecionada.valor * rifaSelecionada.qtd_total)}</p>
                      </div>
                      <Target className="w-8 h-8 text-orange-200" />
                    </div>
                  </Card>
                </div>
              </div>
            </Card>

            {/* Controles de Sorteio */}
            {!rifaSelecionada.jaSorteada && rifaSelecionada.numerosVendidos > 0 && (
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <Shuffle className="w-5 h-5 mr-2 text-primary-600" />
                    Realizar Sorteio
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <Info className="w-5 h-5 text-blue-600" />
                        <span className="text-sm text-blue-800 font-medium">
                          Sorteio automático entre {numerosVendidos.length} números vendidos
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        onClick={realizarSorteio}
                        disabled={sorteando}
                        className="flex-1"
                        variant="primary"
                      >
                        {sorteando ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Sorteando...
                          </>
                        ) : (
                          <>
                            <Shuffle className="w-4 h-4 mr-2" />
                            Realizar Sorteio
                          </>
                        )}
                      </Button>
                      
                      <Button
                        onClick={abrirModalDetalhes}
                        variant="outline"
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Resultado do Sorteio Anterior - Para rifas já sorteadas */}
            {rifaSelecionada.jaSorteada && ganhador && (
              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-2 border-green-400 shadow-lg">
                <div className="p-6">
                  <div className="text-center">
                    <div className="mb-6">
                      <div className="w-20 h-20 mx-auto bg-green-400 rounded-full flex items-center justify-center mb-4 shadow-lg">
                        <Crown className="w-10 h-10 text-white" />
                      </div>
                      <h4 className="text-2xl font-bold text-white mb-2">PARABÉNS AO GANHADOR!</h4>
                    </div>
                    
                    <div className="bg-white rounded-2xl p-8 border-2 border-green-300 shadow-lg mb-6">
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-4 uppercase tracking-wide font-medium">
                          NÚMERO SORTEADO
                        </p>
                        <p className="text-5xl sm:text-7xl font-bold text-green-600 mb-8 animate-pulse">
                          {ganhador.numero.toString().padStart(3, '0')}
                        </p>
                        
                        <div className="border-t-2 border-green-200 pt-8">
                          <h4 className="text-xl font-bold text-gray-900 mb-6">
                            GANHADOR(A)
                          </h4>
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 space-y-4 border border-green-200">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                              <span className="text-gray-700 font-semibold text-lg">Nome:</span>
                              <span className="font-bold text-gray-900 text-lg break-words">{ganhador.usuario?.nome || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                              <span className="text-gray-700 font-semibold text-lg">Email:</span>
                              <span className="font-bold text-gray-900 text-sm sm:text-base break-all">{ganhador.usuario?.email || 'N/A'}</span>
                            </div>
                            {ganhador.usuario?.telefone && (
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                <span className="text-gray-700 font-semibold text-lg">Telefone:</span>
                                <span className="font-bold text-gray-900 text-lg break-words">{ganhador.usuario?.telefone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {ganhador.data_sorteio && (
                          <div className="mt-8 pt-8 border-t-2 border-green-200">
                            <p className="text-sm text-gray-600 font-medium mb-2">Data do Sorteio</p>
                            <p className="font-bold text-gray-900 text-lg">{formatDate(ganhador.data_sorteio)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center space-x-2 text-green-200 text-lg font-semibold">
                      <CheckCircle className="w-6 h-6" />
                      <span>Sorteio finalizado com sucesso!</span>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Números Premiados - Se a rifa tiver números premiados */}
            {rifaSelecionada.temNumerosPremiados && (
              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-2 border-purple-400">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
                    <Gift className="w-5 h-5 mr-2 text-purple-200" />
                    Números Premiados 
                    {detalhesRifa?.numerosPremiados ? ` (${detalhesRifa.numerosPremiados.length})` : ''}
                  </h3>
                  
                  {detalhesRifa?.numerosPremiados && detalhesRifa.numerosPremiados.length > 0 ? (
                    <div className="space-y-4">
                      {detalhesRifa.numerosPremiados.map((numeroPremiado) => (
                        <div key={`premiado-${numeroPremiado.numero}`} className="bg-purple-400 rounded-xl p-4 border border-purple-300 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-purple-300 rounded-lg flex items-center justify-center">
                                <span className="text-lg font-bold text-purple-900">
                                  {numeroPremiado.numero.toString().padStart(3, '0')}
                                </span>
                              </div>
                              <div>
                                <h4 className="font-semibold text-white">{numeroPremiado.premio}</h4>
                                <p className="text-sm text-purple-200">{numeroPremiado.usuario?.nome || 'Usuário não encontrado'}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-white">{formatCurrency(numeroPremiado.valor)}</p>
                              <p className="text-xs text-purple-200">{numeroPremiado.usuario?.email || 'Email não informado'}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Gift className="w-12 h-12 mx-auto mb-4 text-purple-300" />
                      <p className="text-purple-200">Carregando números premiados...</p>
                      <p className="text-xs text-purple-300 mt-2">Se não aparecer nada, verifique se a rifa tem números premiados configurados</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Lista de Números Vendidos */}
            {numerosVendidos.length > 0 && (
              <Card className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white border-2 border-indigo-400">
                <div className="p-2 lg:p-6">
                  <h3 className="text-base lg:text-lg font-semibold text-white mb-2 lg:mb-6 flex items-center">
                    <Users className="w-4 h-4 lg:w-5 lg:h-5 mr-2 text-indigo-200" />
                    Números Vendidos ({numerosVendidos.length})
                  </h3>
                  
                  <div 
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-1 lg:gap-2 max-h-48 lg:max-h-64 overflow-y-auto p-2 lg:p-4 bg-indigo-400 rounded-lg"
                    style={{ 
                      scrollbarWidth: 'none', 
                      msOverflowStyle: 'none',
                      WebkitScrollbar: { display: 'none' }
                    }}
                  >
                    {numerosVendidos.map((numero) => (
                      <div
                        key={numero.id}
                        className={`p-1 lg:p-2 text-center rounded-lg border-2 text-xs lg:text-sm font-bold transition-all duration-200 ${
                          ganhador && ganhador.numero === numero.numero
                            ? 'bg-yellow-100 border-yellow-400 text-yellow-800 shadow-lg scale-110'
                            : detalhesRifa?.numerosPremiados?.some(np => np.numero === numero.numero)
                            ? 'bg-purple-100 border-purple-400 text-purple-800 shadow-md'
                            : 'bg-white border-indigo-300 text-indigo-700 hover:border-indigo-400 hover:bg-indigo-50'
                        }`}
                      >
                        {numero.numero.toString().padStart(3, '0')}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}
        

        {/* Histórico de Sorteios */}
        {historicoSorteios.length > 0 && (
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-primary-600" />
                Histórico de Sorteios
              </h2>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rifa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Número
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ganhador
                      </th>
                      <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {historicoSorteios.slice(0, 10).map((sorteio) => (
                      <tr key={sorteio.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {sorteio.rifa?.titulo || 'Rifa não encontrada'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {sorteio.rifa?.valor ? formatCurrency(sorteio.rifa.valor) : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-yellow-100 text-yellow-800">
                            {sorteio.numero_sorteado?.toString().padStart(3, '0') || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {sorteio.vencedor_nome || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {sorteio.vencedor_id || 'N/A'}
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-6 py-4 text-sm text-gray-500">
                          {sorteio.data_sorteio ? formatDate(sorteio.data_sorteio) : 'N/A'}
                        </td>
                        <td className="hidden lg:table-cell px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Finalizado
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        )}

        {/* Modal de Detalhes da Rifa */}
        <Modal
          isOpen={modalDetalhes}
          onClose={() => setModalDetalhes(false)}
          title={`Detalhes: ${detalhesRifa?.rifa?.titulo || 'Rifa'}`}
          size="lg"
        >
          {carregandoDetalhes ? (
            <Loading text="Carregando detalhes..." />
          ) : detalhesRifa ? (
            <div className="space-y-6">
              {/* Informações da Rifa */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-primary-600" />
                  Informações da Rifa
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-3xl font-bold text-blue-600">{detalhesRifa.totalNumeros}</p>
                    <p className="text-sm text-gray-600 font-medium">Números Vendidos</p>
                  </div>
                  <div className="text-center bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-3xl font-bold text-green-600">{detalhesRifa.totalPremiados}</p>
                    <p className="text-sm text-gray-600 font-medium">Números Premiados</p>
                  </div>
                  <div className="text-center bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-3xl font-bold text-purple-600">{formatCurrency(detalhesRifa.rifa.valor)}</p>
                    <p className="text-sm text-gray-600 font-medium">Valor Unitário</p>
                  </div>
                </div>
              </div>

              {/* Vencedor Principal */}
              {detalhesRifa.vencedorPrincipal && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-200">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <Crown className="w-5 h-5 mr-2 text-yellow-600" />
                    Vencedor Principal
                  </h3>
                  <div className="bg-white p-6 rounded-xl border border-yellow-200 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-gray-600 font-medium mb-1">Nome</p>
                        <p className="font-semibold text-gray-900 text-lg">{detalhesRifa.vencedorPrincipal.nome}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium mb-1">Email</p>
                        <p className="font-semibold text-gray-900 text-lg">{detalhesRifa.vencedorPrincipal.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium mb-1">Telefone</p>
                        <p className="font-semibold text-gray-900 text-lg">{detalhesRifa.vencedorPrincipal.telefone || 'Não informado'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium mb-1">Número Sorteado</p>
                        <p className="font-bold text-3xl text-yellow-600">
                          {detalhesRifa.vencedorPrincipal.numero_sorteado?.toString().padStart(3, '0')}
                        </p>
                      </div>
                    </div>
                    {detalhesRifa.vencedorPrincipal.data_sorteio && (
                      <div className="mt-6 pt-6 border-t border-yellow-200">
                        <p className="text-sm text-gray-600 font-medium mb-1">Data do Sorteio</p>
                        <p className="font-semibold text-gray-900">{formatDate(detalhesRifa.vencedorPrincipal.data_sorteio)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Números Premiados */}
              {detalhesRifa.numerosPremiados.length > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <Gift className="w-5 h-5 mr-2 text-green-600" />
                    Números Premiados ({detalhesRifa.numerosPremiados.length})
                  </h3>
                  <div className="bg-white rounded-xl border border-green-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-green-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Número</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Ganhador</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Prêmio</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Valor</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-green-100">
                          {detalhesRifa.numerosPremiados.map((numero) => (
                            <tr key={`modal-premiado-${numero.numero}`} className="hover:bg-green-50 transition-colors">
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-800">
                                  {numero.numero.toString().padStart(3, '0')}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div>
                                  <p className="font-medium text-gray-900">{numero.usuario?.nome}</p>
                                  <p className="text-sm text-gray-600">{numero.usuario?.email}</p>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">{numero.premio}</td>
                              <td className="px-4 py-3 text-sm font-semibold text-gray-900">{formatCurrency(numero.valor)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Lista Completa de Números Vendidos */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-blue-600" />
                  Todos os Números Vendidos ({detalhesRifa.totalNumeros})
                </h3>
                <div className="bg-white rounded-xl border border-blue-200 p-4">
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 max-h-80 overflow-y-auto">
                    {detalhesRifa.numeros.map((numero) => (
                      <div
                        key={numero.id}
                        className={`p-2 text-center rounded-lg border-2 text-xs font-bold transition-all duration-200 ${
                          detalhesRifa.vencedorPrincipal?.numero_sorteado === numero.numero
                            ? 'bg-yellow-100 border-yellow-400 text-yellow-800 shadow-lg'
                            : detalhesRifa.numerosPremiados.some(np => np.numero === numero.numero)
                            ? 'bg-green-100 border-green-400 text-green-800 shadow-md'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        {numero.numero.toString().padStart(3, '0')}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">Nenhum detalhe disponível.</p>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default Draw;