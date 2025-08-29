import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  where,
  writeBatch,
  serverTimestamp,
  batch
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../config/firebase';
import { useAuth } from './AuthContext';
import { uploadImage } from '../config/cloudinary';
import { reprocessImageWithWhiteBackground, needsReprocessing } from '../config/cloudinary';
import toast from 'react-hot-toast';

const AdminContext = createContext();

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin deve ser usado dentro de um AdminProvider');
  }
  return context;
};

export const AdminProvider = ({ children }) => {
  const { currentUser, isAdmin } = useAuth();
  const [rifas, setRifas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [estatisticas, setEstatisticas] = useState({});
  const [loading, setLoading] = useState(false);
  const [correcaoProgress, setCorrecaoProgress] = useState({
    isRunning: false,
    total: 0,
    current: 0,
    rifasCorrigidas: 0,
    imagensCorrigidas: 0
  });
  
  // Controle de operações em background
  const [backgroundOperations, setBackgroundOperations] = useState(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  // Buscar todas as rifas (para admin)
  const buscarTodasRifas = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'rifas'),
        orderBy('data_criacao', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const rifasData = [];
      
      querySnapshot.forEach((doc) => {
        const rifaData = {
          id: doc.id,
          ...doc.data()
        };
        rifasData.push(rifaData);
      });
      
      setRifas(rifasData);
      
      // Atualizar estatísticas das rifas baseado nos pedidos
      await atualizarEstatisticasRifas(rifasData);
    } catch (error) {
      console.error('Erro ao buscar rifas:', error);
      toast.error('Erro ao carregar rifas');
    } finally {
      setLoading(false);
    }
  };

  // Atualizar estatísticas das rifas baseado nos pedidos pagos
  const atualizarEstatisticasRifas = async (rifasData) => {
    try {
      console.log('🔄 Atualizando estatísticas das rifas...');
      
      // Buscar todos os pedidos pagos
      const pedidosQuery = query(
        collection(db, 'pedidos'),
        where('status_pagamento', '==', 'pago')
      );
      const pedidosSnapshot = await getDocs(pedidosQuery);
      
      // Agrupar pedidos por rifa
      const vendasPorRifa = {};
      pedidosSnapshot.forEach(doc => {
        const pedido = doc.data();
        const rifaId = pedido.id_rifa;
        
        if (!vendasPorRifa[rifaId]) {
          vendasPorRifa[rifaId] = {
            qtd_vendida: 0,
            receita_total: 0,
            participantes: new Set()
          };
        }
        
        // Calcular quantidade vendida (baseado em quantidade ou números)
        const quantidade = pedido.quantidade || pedido.numeros?.length || 0;
        vendasPorRifa[rifaId].qtd_vendida += quantidade;
        vendasPorRifa[rifaId].receita_total += pedido.valor_total || 0;
        
        // Adicionar participante único
        if (pedido.id_usuario) {
          vendasPorRifa[rifaId].participantes.add(pedido.id_usuario);
        }
      });
      
      console.log('📊 Vendas por rifa:', vendasPorRifa);
      
      // Atualizar rifas no Firestore
      const batch = writeBatch(db);
      let rifasAtualizadas = 0;
      
      for (const rifa of rifasData) {
        const vendas = vendasPorRifa[rifa.id];
        if (vendas) {
          const dadosAtualizados = {
            qtd_vendida: vendas.qtd_vendida,
            receita_total: vendas.receita_total,
            participantes: vendas.participantes.size,
            ultima_atualizacao: serverTimestamp()
          };
          
          // Só atualizar se os valores mudaram
          if (rifa.qtd_vendida !== vendas.qtd_vendida || 
              rifa.receita_total !== vendas.receita_total ||
              rifa.participantes !== vendas.participantes.size) {
            
            batch.update(doc(db, 'rifas', rifa.id), dadosAtualizados);
            rifasAtualizadas++;
            
            // Atualizar também no estado local
            rifa.qtd_vendida = vendas.qtd_vendida;
            rifa.receita_total = vendas.receita_total;
            rifa.participantes = vendas.participantes.size;
          }
        } else {
          // Se não há vendas, zerar os valores
          if (rifa.qtd_vendida !== 0 || rifa.receita_total !== 0 || rifa.participantes !== 0) {
            batch.update(doc(db, 'rifas', rifa.id), {
              qtd_vendida: 0,
              receita_total: 0,
              participantes: 0,
              ultima_atualizacao: serverTimestamp()
            });
            rifasAtualizadas++;
            
            // Atualizar também no estado local
            rifa.qtd_vendida = 0;
            rifa.receita_total = 0;
            rifa.participantes = 0;
          }
        }
      }
      
      if (rifasAtualizadas > 0) {
        await batch.commit();
        console.log(`✅ ${rifasAtualizadas} rifas atualizadas com sucesso!`);
        
        // Atualizar o estado local
        setRifas([...rifasData]);
      } else {
        console.log('ℹ️ Nenhuma rifa precisou ser atualizada');
      }
      
    } catch (error) {
      console.error('❌ Erro ao atualizar estatísticas das rifas:', error);
    }
  };

  // Criar nova rifa
  const criarRifa = async (dadosRifa, imagensFiles) => {
    try {
      setLoading(true);
      
      let imagensUrls = [];
      
      // Upload das imagens se fornecidas
      if (imagensFiles && imagensFiles.length > 0) {
        try {
          for (let i = 0; i < imagensFiles.length; i++) {
            const imagemFile = imagensFiles[i];
            
            try {
              const base64 = await uploadImage(imagemFile, 'rifas');
              imagensUrls.push(base64);
            } catch (uploadError) {
              console.error(`❌ Erro no upload da imagem ${i + 1}:`, uploadError);
              throw uploadError;
            }
          }
        } catch (error) {
          console.warn('⚠️ Erro no upload, continuando sem imagem:', error);
          // Para teste, usar imagem placeholder base64
          imagensUrls = ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1MCIgdmlld0JveD0iMCAwIDQwMCAyNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjUwIiBmaWxsPSIjZmZmZmZmIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTI1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM2NjY2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZW0gZGEgUmlmYTwvdGV4dD4KPC9zdmc+Cg=='];
        }
      } else {
        // Se não houver imagens fornecidas, usar placeholder base64
        imagensUrls = ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1MCIgdmlld0JveD0iMCAwIDQwMCAyNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjUwIiBmaWxsPSIjZmZmZmZmIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTI1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM2NjY2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZW0gZGEgUmlmYTwvdGV4dD4KPC9zdmc+Cg=='];
      }

      // Criar documento da rifa
      const rifaData = {
        ...dadosRifa,
        imagem: imagensUrls[0] || '', // Primeira imagem como principal
        imagens: imagensUrls, // Array com todas as imagens
        qtd_vendida: 0,
        participantes: 0,
        status: 'ativa',
        data_criacao: serverTimestamp(),
        criada_por: currentUser.uid,
        // Dados dos números premiados
        numeros_premiados: dadosRifa.numeros_premiados || [],
        receita_estimada: dadosRifa.receita_estimada || 0,
        custos_premiados: dadosRifa.custos_premiados || 0,
        receita_liquida: dadosRifa.receita_liquida || 0
      };

      const rifaRef = await addDoc(collection(db, 'rifas'), rifaData);

      // Criar números da rifa diretamente (versão sem Cloud Functions)
      const batchWrite = writeBatch(db);
      
      for (let i = 1; i <= dadosRifa.qtd_total; i++) {
        const numeroRef = doc(collection(db, 'numeros'));
        batchWrite.set(numeroRef, {
          id_rifa: rifaRef.id,
          numero: i,
          status: 'disponivel',
          id_usuario: null,
          data_reserva: null,
          data_compra: null
        });
      }
      
      await batchWrite.commit();

      toast.success('Rifa criada com sucesso!');
      await buscarTodasRifas();
      
      return rifaRef.id;
    } catch (error) {
      console.error('Erro ao criar rifa:', error);
      toast.error('Erro ao criar rifa');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Deletar rifa (versão otimizada com controle de conflitos)
  const deletarRifa = async (rifaId) => {
    try {
      // Verificar se já está deletando
      if (isDeleting) {
        console.log('⚠️ Operação de exclusão já em andamento, aguardando...');
        return;
      }
      
      setIsDeleting(true);
      setLoading(true);
      console.log('🚀 Iniciando exclusão da rifa:', rifaId);
      
      // Cancelar operações em background anteriores
      setBackgroundOperations(prev => {
        prev.forEach(op => {
          if (op.cancel) op.cancel();
        });
        return new Set();
      });
      
      // Primeiro: deletar a rifa imediatamente
      await deleteDoc(doc(db, 'rifas', rifaId));
      console.log('✅ Rifa deletada instantaneamente');
      
      // Atualizar lista local imediatamente
      setRifas(prev => prev.filter(rifa => rifa.id !== rifaId));
      
      // Segundo: limpeza em background com controle
      const cleanupOperation = {
        id: rifaId,
        cancel: false,
        startTime: Date.now()
      };
      
      setBackgroundOperations(prev => new Set([...prev, cleanupOperation]));
      
      // Executar limpeza em background
      setTimeout(async () => {
        // Verificar se a operação foi cancelada
        if (cleanupOperation.cancel) {
          console.log('❌ Limpeza cancelada para rifa:', rifaId);
          return;
        }
        
        try {
          console.log('🧹 Limpando dados relacionados para rifa:', rifaId);
          
          // Deletar números
          const numerosSnapshot = await getDocs(
            query(collection(db, 'numeros'), where('id_rifa', '==', rifaId))
          );
          
          if (!numerosSnapshot.empty) {
            const batch = writeBatch(db);
            numerosSnapshot.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            console.log(`✅ ${numerosSnapshot.docs.length} números deletados para rifa ${rifaId}`);
          }
          
          // Deletar pedidos
          const pedidosSnapshot = await getDocs(
            query(collection(db, 'pedidos'), where('id_rifa', '==', rifaId))
          );
          
          if (!pedidosSnapshot.empty) {
            const batch = writeBatch(db);
            pedidosSnapshot.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            console.log(`✅ ${pedidosSnapshot.docs.length} pedidos deletados para rifa ${rifaId}`);
          }
          
          console.log(`🎉 Limpeza concluída para rifa ${rifaId} em ${Date.now() - cleanupOperation.startTime}ms`);
        } catch (error) {
          console.warn(`⚠️ Erro na limpeza para rifa ${rifaId}:`, error);
        } finally {
          // Remover operação da lista
          setBackgroundOperations(prev => {
            const newSet = new Set(prev);
            newSet.delete(cleanupOperation);
            return newSet;
          });
        }
      }, 200); // Aumentado para 200ms para dar mais tempo
      
      toast.success('Rifa excluída com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao deletar rifa:', error);
      toast.error('Erro ao excluir rifa');
      throw error;
    } finally {
      setLoading(false);
      // Aguardar um pouco antes de permitir nova exclusão
      setTimeout(() => setIsDeleting(false), 500);
    }
  };

  // Corrigir imagens com fundo preto
  const corrigirImagensComFundoPreto = async () => {
    try {
      setLoading(true);
      setCorrecaoProgress({
        isRunning: true,
        total: 0,
        current: 0,
        rifasCorrigidas: 0,
        imagensCorrigidas: 0
      });
      
      let rifasCorrigidas = 0;
      let imagensCorrigidas = 0;
      
      // Buscar todas as rifas
      const rifasSnapshot = await getDocs(collection(db, 'rifas'));
      const totalRifas = rifasSnapshot.docs.length;
      
      setCorrecaoProgress(prev => ({ ...prev, total: totalRifas }));
      
      for (let i = 0; i < rifasSnapshot.docs.length; i++) {
        const rifaDoc = rifasSnapshot.docs[i];
        const rifaData = rifaDoc.data();
        let rifaModificada = false;
        
        setCorrecaoProgress(prev => ({ 
          ...prev, 
          current: i + 1,
          rifaAtual: rifaData.titulo
        }));
        
        // Verificar imagem principal
        if (rifaData.imagem && rifaData.imagem.startsWith('data:image')) {
          const precisaReprocessar = await needsReprocessing(rifaData.imagem);
          if (precisaReprocessar) {
            rifaData.imagem = await reprocessImageWithWhiteBackground(rifaData.imagem);
            rifaModificada = true;
            imagensCorrigidas++;
            setCorrecaoProgress(prev => ({ ...prev, imagensCorrigidas }));
          }
        }
        
        // Verificar array de imagens
        if (rifaData.imagens && Array.isArray(rifaData.imagens)) {
          for (let j = 0; j < rifaData.imagens.length; j++) {
            const imagem = rifaData.imagens[j];
            if (imagem && imagem.startsWith('data:image')) {
              const precisaReprocessar = await needsReprocessing(imagem);
              if (precisaReprocessar) {
                rifaData.imagens[j] = await reprocessImageWithWhiteBackground(imagem);
                rifaModificada = true;
                imagensCorrigidas++;
                setCorrecaoProgress(prev => ({ ...prev, imagensCorrigidas }));
              }
            }
          }
        }
        
        // Salvar rifa se foi modificada
        if (rifaModificada) {
          await updateDoc(doc(db, 'rifas', rifaDoc.id), {
            imagem: rifaData.imagem,
            imagens: rifaData.imagens
          });
          rifasCorrigidas++;
          setCorrecaoProgress(prev => ({ ...prev, rifasCorrigidas }));
        }
      }
      
      // Atualizar lista local
      await buscarTodasRifas();
      
      setCorrecaoProgress({
        isRunning: false,
        total: 0,
        current: 0,
        rifasCorrigidas: 0,
        imagensCorrigidas: 0
      });
      
      toast.success(`Correção concluída! ${rifasCorrigidas} rifas corrigidas, ${imagensCorrigidas} imagens processadas`);
      
    } catch (error) {
      console.error('❌ Erro ao corrigir imagens:', error);
      toast.error('Erro ao corrigir imagens');
      setCorrecaoProgress({
        isRunning: false,
        total: 0,
        current: 0,
        rifasCorrigidas: 0,
        imagensCorrigidas: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Finalizar rifa
  const finalizarRifa = async (rifaId) => {
    try {
      setLoading(true);
      
      await updateDoc(doc(db, 'rifas', rifaId), {
        status: 'finalizada',
        data_finalizacao: serverTimestamp()
      });

      toast.success('Rifa finalizada com sucesso!');
      await buscarTodasRifas();
    } catch (error) {
      console.error('Erro ao finalizar rifa:', error);
      toast.error('Erro ao finalizar rifa');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sortear vencedor
  const sortearVencedor = async (rifaId, numeroEspecifico = null) => {
    try {
      setLoading(true);
      
      // Buscar todos os números da rifa (sem filtro composto)
      const numerosQuery = query(
        collection(db, 'numeros'),
        where('id_rifa', '==', rifaId)
      );
      
      const numerosSnapshot = await getDocs(numerosQuery);
      
      if (numerosSnapshot.empty) {
        toast.error('Nenhum número encontrado para esta rifa');
        return null;
      }

      // Filtrar números vendidos no código
      const numerosVendidos = numerosSnapshot.docs.filter(doc => {
        const data = doc.data();
        return data.id_usuario && (data.status === 'vendido' || data.id_usuario);
      });

      if (numerosVendidos.length === 0) {
        toast.error('Nenhum número vendido para sortear');
        return null;
      }

      let numeroSorteado;
      
      if (numeroEspecifico) {
        // Buscar o número específico escolhido
        numeroSorteado = numerosVendidos.find(doc => {
          const data = doc.data();
          return data.numero === parseInt(numeroEspecifico);
        });
        
        if (!numeroSorteado) {
          toast.error(`Número ${numeroEspecifico} não foi vendido ou não existe`);
          return null;
        }
      } else {
        // Sortear número aleatório
        numeroSorteado = numerosVendidos[Math.floor(Math.random() * numerosVendidos.length)];
      }
      
      const numeroData = numeroSorteado.data();

      // Buscar dados do vencedor
      const vencedorDoc = await getDoc(doc(db, 'usuarios', numeroData.id_usuario));
      
      if (!vencedorDoc.exists()) {
        toast.error('Usuário vencedor não encontrado');
        return null;
      }
      
      const vencedorData = vencedorDoc.data();

      // Atualizar rifa com resultado do sorteio
      await updateDoc(doc(db, 'rifas', rifaId), {
        status: 'finalizada',
        numero_sorteado: numeroData.numero,
        vencedor_id: numeroData.id_usuario,
        vencedor_nome: vencedorData.nome,
        data_sorteio_realizado: serverTimestamp()
      });

      const resultado = {
        success: true,
        numeroSorteado: numeroData.numero,
        vencedor: {
          id: numeroData.id_usuario,
          nome: vencedorData.nome,
          email: vencedorData.email
        }
      };

      const mensagem = numeroEspecifico 
        ? `Vencedor definido: ${vencedorData.nome} - Número ${numeroData.numero}`
        : `Vencedor sorteado: ${vencedorData.nome} - Número ${numeroData.numero}`;
      
      toast.success(mensagem);
      await buscarTodasRifas();
      return resultado;
      
    } catch (error) {
      console.error('Erro ao sortear vencedor:', error);
      toast.error('Erro ao sortear vencedor');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Buscar usuários
  const buscarUsuarios = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'usuarios'),
        orderBy('data_criacao', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const usuariosData = [];
      
      querySnapshot.forEach((doc) => {
        usuariosData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setUsuarios(usuariosData);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  // Buscar pedidos
  const buscarPedidos = async (filtros = {}) => {
    try {
      console.log('AdminContext: Iniciando busca de pedidos...');
      setLoading(true);
      let q = collection(db, 'pedidos');
      
      // Aplicar filtros
      if (filtros.status) {
        q = query(q, where('status_pagamento', '==', filtros.status));
      }
      
      if (filtros.rifaId) {
        q = query(q, where('id_rifa', '==', filtros.rifaId));
      }
      
      q = query(q, orderBy('data_criacao', 'desc'));
      
      const querySnapshot = await getDocs(q);
      const pedidosData = [];
      
      console.log('AdminContext: Pedidos encontrados:', querySnapshot.size);
      
      querySnapshot.forEach((doc) => {
        const pedido = {
          id: doc.id,
          ...doc.data()
        };
        pedidosData.push(pedido);
      });
      
      console.log('AdminContext: Pedidos carregados:', pedidosData.length);
      setPedidos(pedidosData);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  // Verificar estrutura dos dados
  const verificarEstruturaDados = () => {
    console.log('=== VERIFICAÇÃO DE ESTRUTURA ===');
    
    // Verificar rifas
    console.log('Rifas:', rifas.map(r => ({
      id: r.id,
      titulo: r.titulo,
      status: r.status,
      qtd_vendida: r.qtd_vendida,
      qtd_total: r.qtd_total,
      valor: r.valor
    })));
    
    // Verificar pedidos com mais detalhes
    console.log('Pedidos detalhados:');
    pedidos.forEach((p, index) => {
      console.log(`Pedido ${index + 1}:`, {
        id: p.id,
        id_usuario: p.id_usuario,
        id_rifa: p.id_rifa,
        status_pagamento: p.status_pagamento,
        valor_total: p.valor_total,
        quantidade: p.quantidade,
        numeros: p.numeros,
        data_criacao: p.data_criacao,
        data_criacao_tipo: typeof p.data_criacao,
        tem_toDate: !!p.data_criacao?.toDate
      });
    });
    
    // Verificar usuários
    console.log('Usuários:', usuarios.map(u => ({
      id: u.id,
      nome: u.nome,
      email: u.email,
      tipo_usuario: u.tipo_usuario
    })));
    
    // Verificar estatísticas atuais
    console.log('Estatísticas atuais:', estatisticas);
    
    console.log('=== FIM VERIFICAÇÃO ===');
  };

  // Buscar estatísticas (temporariamente desabilitado - requer Cloud Functions)
  const buscarEstatisticas = async () => {
    try {
      console.log('=== DEBUG ESTATÍSTICAS ===');
      console.log('AdminContext: Buscando estatísticas');
      console.log('- Rifas:', rifas.length);
      console.log('- Pedidos:', pedidos.length);
      console.log('- Usuários:', usuarios.length);
      
      // Log detalhado dos pedidos
      console.log('- Todos os pedidos:', pedidos);
      
      // Calcular total arrecadado baseado nos pedidos pagos
      const pedidosPagos = pedidos.filter(pedido => {
        console.log('Verificando pedido:', pedido.id, 'status:', pedido.status_pagamento, 'valor:', pedido.valor_total);
        return pedido.status_pagamento === 'pago';
      });
      
      console.log('- Pedidos pagos encontrados:', pedidosPagos.length);
      console.log('- Pedidos pagos:', pedidosPagos);
      
      const totalArrecadado = pedidosPagos.reduce((total, pedido) => {
        const valor = pedido.valor_total || 0;
        console.log('Somando pedido:', pedido.id, 'valor:', valor);
        return total + valor;
      }, 0);
      
      console.log('- Total arrecadado calculado:', totalArrecadado);
      
      // Calcular participantes únicos (usuários que fizeram pedidos pagos)
      const participantesUnicos = new Set(
        pedidosPagos.map(pedido => pedido.id_usuario).filter(Boolean)
      );
      
      console.log('- Participantes únicos:', participantesUnicos.size);
      console.log('- IDs dos participantes:', Array.from(participantesUnicos));
      
      // Estatísticas simples sem Cloud Functions
      const stats = {
        totalRifas: rifas.length,
        rifasAtivas: rifas.filter(r => r.status === 'ativa').length,
        totalUsuarios: usuarios.length,
        totalArrecadado: totalArrecadado,
        totalPedidos: pedidos.length,
        pedidosPagos: pedidosPagos.length,
        participantesUnicos: participantesUnicos.size
      };
      
      console.log('- Estatísticas finais:', stats);
      console.log('=== FIM DEBUG ESTATÍSTICAS ===');
      
      setEstatisticas(stats);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  };

  // Atualizar status do usuário
  const atualizarUsuario = async (usuarioId, dadosAtualizacao) => {
    try {
      await updateDoc(doc(db, 'usuarios', usuarioId), dadosAtualizacao);
      toast.success('Usuário atualizado com sucesso!');
      await buscarUsuarios();
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast.error('Erro ao atualizar usuário');
      throw error;
    }
  };

  // Exportar dados (para relatórios)
  const exportarDados = async (tipo, rifaId = null) => {
    try {
      setLoading(true);
      
      const exportarFunction = httpsCallable(functions, 'exportarDados');
      const result = await exportarFunction({ tipo, rifaId });

      if (result.data.success) {
        // Criar download do arquivo
        const blob = new Blob([result.data.dados], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${tipo}_${rifaId || 'todos'}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success('Dados exportados com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      toast.error('Erro ao exportar dados');
    } finally {
      setLoading(false);
    }
  };

  // Atualizar rifa existente
  const atualizarRifa = async (rifaId, dadosRifa, novasImagens = [], imagensExistentes = []) => {
    try {
      setLoading(true);
      
      let imagensUrls = [...imagensExistentes];
      
      // Upload das novas imagens se fornecidas
      if (novasImagens && novasImagens.length > 0) {
        const uploadsPromises = novasImagens.map(async (file, index) => {
          try {
            return await uploadImage(file, 'rifas');
          } catch (uploadError) {
            console.error(`❌ Erro no upload da nova imagem ${index + 1}:`, uploadError);
            throw uploadError;
          }
        });
        
        const novasUrls = await Promise.all(uploadsPromises);
        imagensUrls = [...imagensUrls, ...novasUrls];
      }

      // Preparar dados da rifa
      const rifaData = {
        ...dadosRifa,
        imagem: imagensUrls[0] || '', // Primeira imagem como principal
        imagens: imagensUrls, // Array com todas as imagens
        data_atualizacao: serverTimestamp(),
      };

      const rifaRef = doc(db, 'rifas', rifaId);
      await updateDoc(rifaRef, rifaData);

      toast.success('Rifa atualizada com sucesso!');

    } catch (error) {
      console.error('AdminContext: Erro ao atualizar rifa:', error);
      
      let errorMessage = 'Erro desconhecido';
      if (error.code) {
        errorMessage = `Código: ${error.code} - ${error.message}`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error('Erro ao atualizar rifa: ' + errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados iniciais quando componente monta
  useEffect(() => {
    console.log('AdminContext: useEffect inicial, currentUser:', currentUser, 'isAdmin:', isAdmin());
    if (currentUser && isAdmin()) {
      const carregarDados = async () => {
        try {
          console.log('AdminContext: Iniciando carregamento de dados...');
          setLoading(true);
          await buscarTodasRifas();
          console.log('AdminContext: Rifas carregadas');
          await buscarUsuarios();
          console.log('AdminContext: Usuários carregados');
          await buscarPedidos();
          console.log('AdminContext: Pedidos carregados');
          // buscarEstatisticas será chamada após rifas carregarem
        } catch (error) {
          console.error('Erro ao carregar dados iniciais:', error);
        } finally {
          setLoading(false);
        }
      };
      
      carregarDados();
    } else {
      console.log('AdminContext: Usuário não é admin ou não está logado');
    }
  }, [currentUser]);

  // Buscar estatísticas quando rifas ou pedidos mudarem
  useEffect(() => {
    console.log('AdminContext: useEffect estatísticas disparado, rifas:', rifas.length, 'pedidos:', pedidos.length);
    buscarEstatisticas();
  }, [rifas, pedidos]);

  return (
    <AdminContext.Provider value={{
      rifas,
      pedidos,
      usuarios,
      loading,
      estatisticas,
      buscarTodasRifas,
      buscarPedidos,
      buscarUsuarios,
      criarRifa,
      atualizarRifa,
      finalizarRifa,
      deletarRifa,
      sortearVencedor,
      buscarEstatisticas,
      atualizarUsuario,
      exportarDados,
      corrigirImagensComFundoPreto,
      correcaoProgress,
      verificarEstruturaDados,
      atualizarEstatisticasRifas
    }}>
      {children}
    </AdminContext.Provider>
  );
};

export default AdminProvider;
