import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  limit,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../config/firebase';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const RaffleContext = createContext();

export const useRaffle = () => {
  const context = useContext(RaffleContext);
  if (!context) {
    throw new Error('useRaffle deve ser usado dentro de um RaffleProvider');
  }
  return context;
};

export const RaffleProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [rifas, setRifas] = useState([]);
  const [rifaAtiva, setRifaAtiva] = useState(null);
  const [numerosRifa, setNumerosRifa] = useState([]);
  const [meusTickets, setMeusTickets] = useState([]);
  const [pedidoAtivo, setPedidoAtivo] = useState(null);
  const [loading, setLoading] = useState(false);

  // Buscar todas as rifas ativas
  const buscarRifasAtivas = async () => {
  try {
    
    const q = query(
      collection(db, 'rifas'),
      orderBy('data_criacao', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    const rifasData = snapshot.docs.map(doc => {
      const data = { id: doc.id, ...doc.data() };
      return data;
    });
    
    setRifas(rifasData);
  } catch (error) {
    console.error('❌ Erro ao buscar rifas:', error);
  }
};

  // Buscar detalhes de uma rifa específica
  const buscarRifa = async (rifaId) => {
    try {
      setLoading(true);
      const rifaDoc = await getDoc(doc(db, 'rifas', rifaId));
      
      if (rifaDoc.exists()) {
        const rifaData = {
          id: rifaDoc.id,
          ...rifaDoc.data()
        };
        
        setRifaAtiva(rifaData);
        
        // Buscar números da rifa (silenciosamente se usuário não logado)
        try {
          await buscarNumerosRifa(rifaId);
        } catch (numerosError) {
          console.log('Erro ao carregar números - continuando sem números:', numerosError);
          // Se falhar, definir array vazio para números
          setNumerosRifa([]);
        }
        
        return rifaData;
      } else {
        toast.error('Rifa não encontrada');
        return null;
      }
    } catch (error) {
      console.error('Erro ao buscar rifa:', error);
      // Só mostrar erro se não for problema de permissão
      if (!error.message.includes('permission') && !error.message.includes('PERMISSION_DENIED')) {
        toast.error('Erro ao carregar rifa');
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Buscar números de uma rifa
  const buscarNumerosRifa = async (rifaId) => {
    try {
      const q = query(
        collection(db, 'numeros'),
        where('id_rifa', '==', rifaId),
        orderBy('numero', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const numerosData = [];
      
      // Buscar informações dos compradores para números vendidos apenas se o usuário estiver logado
      // Isso evita erros de permissão quando usuários não autenticados acessam a rifa
      let usuariosData = {};
      if (currentUser) {
        const numerosVendidos = querySnapshot.docs.filter(doc => doc.data().status === 'vendido' && doc.data().id_usuario);
        const userIds = [...new Set(numerosVendidos.map(doc => doc.data().id_usuario))];
        
        if (userIds.length > 0) {
          try {
            const usuariosSnapshot = await Promise.all(
              userIds.map(userId => getDoc(doc(db, 'usuarios', userId)))
            );
            
            usuariosSnapshot.forEach((userDoc, index) => {
              if (userDoc.exists()) {
                const userData = userDoc.data();
                usuariosData[userIds[index]] = {
                  nome: userData.nome,
                  email: userData.email
                };
              }
            });
          } catch (userError) {
            console.log('Erro ao carregar informações dos compradores (provavelmente permissão):', userError.message);
            // Continuar sem as informações dos compradores
          }
        }
      }
      
      querySnapshot.forEach((doc) => {
        const numeroData = {
          id: doc.id,
          ...doc.data()
        };
        
        // Adicionar informações do comprador se o número foi vendido e usuário está logado
        if (currentUser && numeroData.status === 'vendido' && numeroData.id_usuario && usuariosData[numeroData.id_usuario]) {
          numeroData.comprador_nome = usuariosData[numeroData.id_usuario].nome;
          numeroData.comprador_email = usuariosData[numeroData.id_usuario].email;
        }
        
        numerosData.push(numeroData);
      });
      
      setNumerosRifa(numerosData);
      return numerosData;
    } catch (error) {
      console.error('Erro ao buscar números da rifa:', rifaId, error);
      
      // Verificar se é uma rifa encerrada para não mostrar erro
      try {
        const rifaDoc = await getDoc(doc(db, 'rifas', rifaId));
        if (rifaDoc.exists()) {
          const rifaData = rifaDoc.data();
          if (rifaData.numero_sorteado || rifaData.status === 'finalizada') {
            console.log('Rifa encerrada - ignorando erro de carregamento de números');
            setNumerosRifa([]);
            return [];
          }
        }
      } catch (rifaError) {
        console.error('Erro ao verificar status da rifa:', rifaError);
      }
      
      // Não mostrar erro se o usuário não estiver logado ou se for erro de permissão
      if (currentUser && !error.message.includes('permission') && !error.message.includes('PERMISSION_DENIED')) {
        toast.error('Erro ao carregar números da rifa');
      }
      
      // Retornar array vazio para permitir que a página continue funcionando
      setNumerosRifa([]);
      return [];
    }
  };

  // Comprar números da rifa (versão sem Cloud Functions)
  const comprarNumeros = async (rifaId, quantidade) => {
    try {
      if (!currentUser) {
        toast.error('Você precisa estar logado para comprar');
        return null;
      }

      setLoading(true);
      
      // Buscar números disponíveis
      const numerosQuery = query(
        collection(db, 'numeros'),
        where('id_rifa', '==', rifaId),
        where('status', '==', 'disponivel'),
        limit(quantidade)
      );
      
      const numerosSnapshot = await getDocs(numerosQuery);
      
      if (numerosSnapshot.docs.length < quantidade) {
        toast.error(`Apenas ${numerosSnapshot.docs.length} números disponíveis`);
        return null;
      }
      
      // Buscar dados da rifa
      const rifaDoc = await getDoc(doc(db, 'rifas', rifaId));
      if (!rifaDoc.exists()) {
        toast.error('Rifa não encontrada');
        return null;
      }
      
      const rifaData = rifaDoc.data();
      const valorTotal = rifaData.valor * quantidade;
      
      // Criar pedido
      const pedidoRef = doc(collection(db, 'pedidos'));
      const pedidoId = pedidoRef.id;
      
      const dataExpiracao = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
      
      const pedidoData = {
        id: pedidoId,
        id_rifa: rifaId,
        id_usuario: currentUser.uid,
        quantidade,
        valor_total: valorTotal,
        status: 'pendente',
        status_pagamento: 'reservado', // Reservado = aguardando pagamento
        data_criacao: new Date(),
        data_expiracao: dataExpiracao,
        numeros_selecionados: numerosSnapshot.docs.map(doc => doc.data().numero),
        payment_data: null,
        mercadopago_payment_id: null
      };
      

      
      // Usar batch para operações atômicas
      const batch = writeBatch(db);
      
      // Adicionar pedido
      batch.set(pedidoRef, pedidoData);
      
      // Reservar números
      numerosSnapshot.docs.forEach(numeroDoc => {
        batch.update(numeroDoc.ref, {
          status: 'reservado',
          id_usuario: currentUser.uid,
          data_reserva: new Date(),
          id_pedido: pedidoId
        });
      });
      
      await batch.commit();
      
      setPedidoAtivo(pedidoData);
      
      // Atualizar números da rifa
      await buscarNumerosRifa(rifaId);
      
      toast.success(`${quantidade} números reservados com sucesso!`);
      return pedidoData;
      
    } catch (error) {
      console.error('Erro ao comprar números:', error);
      toast.error('Erro ao processar compra: ' + error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Verificar e liberar números expirados
  const verificarNumerosExpirados = async () => {
    try {
      // Buscar pedidos pendentes expirados
      const agora = new Date();
      const pedidosQuery = query(
        collection(db, 'pedidos'),
        where('status', '==', 'pendente'),
        where('data_expiracao', '<=', agora)
      );
      
      const pedidosSnapshot = await getDocs(pedidosQuery);
      
      if (pedidosSnapshot.docs.length === 0) return;
      
      // Para cada pedido expirado, liberar os números
      for (const pedidoDoc of pedidosSnapshot.docs) {
        const pedidoData = pedidoDoc.data();
        
        // Buscar números reservados para este pedido
        const numerosQuery = query(
          collection(db, 'numeros'),
          where('id_pedido', '==', pedidoDoc.id),
          where('status', '==', 'reservado')
        );
        
        const numerosSnapshot = await getDocs(numerosQuery);
        
        if (numerosSnapshot.docs.length > 0) {
          const batch = writeBatch(db);
          
          // Liberar números
          numerosSnapshot.docs.forEach(numeroDoc => {
            batch.update(numeroDoc.ref, {
              status: 'disponivel',
              id_usuario: null,
              data_reserva: null,
              id_pedido: null
            });
          });
          
          // Marcar pedido como expirado
          batch.update(pedidoDoc.ref, {
            status: 'expirado'
          });
          
          await batch.commit();
          
          // Se é o pedido ativo do usuário, limpar
          if (pedidoAtivo?.id === pedidoDoc.id) {
            setPedidoAtivo(null);
          }
        }
      }
      
      // Atualizar rifas após liberar números
      if (rifaAtiva) {
        await buscarNumerosRifa(rifaAtiva.id);
      }
      
    } catch (error) {
      console.error('Erro ao verificar números expirados:', error);
    }
  };

  // Gerar QR Code PIX para pagamento com Mercado Pago
  const gerarPIX = async (pedidoId) => {
    try {
      setLoading(true);
      
      // Buscar dados do pedido
      const pedidoDoc = await getDoc(doc(db, 'pedidos', pedidoId));
      if (!pedidoDoc.exists()) {
        throw new Error('Pedido não encontrado');
      }
      
      const pedidoData = pedidoDoc.data();
      
      // Buscar dados da rifa
      const rifaDoc = await getDoc(doc(db, 'rifas', pedidoData.id_rifa));
      const rifaData = rifaDoc.exists() ? rifaDoc.data() : {};
      
      // Gerar QR Code PIX realista
      const valorFormatado = pedidoData.valor_total.toFixed(2).replace('.', '');
      const descricao = `Rifa: ${rifaData.titulo} - ${pedidoData.quantidade} números`;
      
      // QR Code PIX no formato EMV
      const qrCodePIX = `00020101021226870014br.gov.bcb.pix2569api.mercadopago.com/pix/v1/charges/MP_${Date.now()}5204000053039865802BR5913SERRAH RIFA6008BRASIL62070503***6304${pedidoId}`;
      
      // Simulação de resposta do Mercado Pago
      const simulatedPayment = {
        id: `MP_${Date.now()}`,
        status: 'pending',
        qr_code: qrCodePIX,
        qr_code_base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        expiration_date: pedidoData.data_expiracao?.toDate ? pedidoData.data_expiracao.toDate().toISOString() : new Date(Date.now() + 15 * 60 * 1000).toISOString()
      };
      
      // Atualizar pedido com ID do pagamento
      await updateDoc(doc(db, 'pedidos', pedidoId), {
        mercadopago_payment_id: simulatedPayment.id,
        payment_data: simulatedPayment,
        status_pagamento: 'aguardando_pagamento'
      });
      
      // Para teste: simular pagamento aprovado após 30 segundos
      setTimeout(async () => {
        try {
          console.log('🎉 Simulando pagamento aprovado...');
          await updateDoc(doc(db, 'pedidos', pedidoId), {
            status: 'concluido',
            status_pagamento: 'pago',
            data_pagamento: new Date(),
            'payment_data.status': 'approved'
          });
          
          // Atualizar status dos números para 'vendido'
          const numerosQuery = query(
            collection(db, 'numeros'),
            where('id_pedido', '==', pedidoId)
          );
          const numerosSnapshot = await getDocs(numerosQuery);
          
          if (!numerosSnapshot.empty) {
            const batch = writeBatch(db);
            numerosSnapshot.docs.forEach(numeroDoc => {
              batch.update(numeroDoc.ref, {
                status: 'vendido',
                data_compra: new Date()
              });
            });
            await batch.commit();
          }
          
          console.log('✅ Pagamento processado e números atualizados!');
          
        } catch (error) {
          console.error('Erro ao simular pagamento:', error);
        }
      }, 30000); // 30 segundos para teste
      
      return {
        qr_code: simulatedPayment.qr_code,
        qr_code_base64: simulatedPayment.qr_code_base64,
        payment_id: simulatedPayment.id,
        expiration_date: simulatedPayment.expiration_date
      };
      
    } catch (error) {
      console.error('Erro ao gerar PIX:', error);
      toast.error('Erro ao gerar pagamento PIX: ' + error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Buscar meus tickets
  const buscarMeusTickets = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const q = query(
        collection(db, 'pedidos'),
        where('id_usuario', '==', currentUser.uid),
        where('status_pagamento', 'in', ['pago', 'reservado', 'aguardando_pagamento', 'expirado', 'cancelado']),
        orderBy('data_criacao', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const ticketsData = [];
      
      for (const docSnapshot of querySnapshot.docs) {
        const pedido = {
          id: docSnapshot.id,
          ...docSnapshot.data()
        };
        
        // Buscar dados da rifa
        const rifaDoc = await getDoc(doc(db, 'rifas', pedido.id_rifa));
        if (rifaDoc.exists()) {
          pedido.rifa = rifaDoc.data();
        }
        
        // Buscar números comprados para este pedido
        const numerosQuery = query(
          collection(db, 'numeros'),
          where('id_pedido', '==', docSnapshot.id),
          where('id_usuario', '==', currentUser.uid)
        );
        const numerosSnapshot = await getDocs(numerosQuery);
        
        if (!numerosSnapshot.empty) {
          pedido.numeros = numerosSnapshot.docs.map(doc => doc.data().numero).sort((a, b) => a - b);
        } else {
          // Fallback para números selecionados (caso estejam no pedido)
          pedido.numeros = pedido.numeros_selecionados || [];
        }
        
        ticketsData.push(pedido);
      }
      
      setMeusTickets(ticketsData);
    } catch (error) {
      console.error('Erro ao buscar tickets:', error);
      toast.error('Erro ao carregar seus tickets');
    } finally {
      setLoading(false);
    }
  };

  // Verificar status do pagamento
  const verificarStatusPagamento = async (pedidoId) => {
    try {
      console.log('🔍 Verificando status do pagamento:', pedidoId);
      
      const pedidoDoc = await getDoc(doc(db, 'pedidos', pedidoId));
      
      if (!pedidoDoc.exists()) {
        console.log('❌ Pedido não encontrado:', pedidoId);
        return false;
      }
      
      const pedidoData = pedidoDoc.data();
      
      // Verificar se expirou
      const agora = new Date();
      const dataExpiracao = pedidoData.data_expiracao?.toDate ? pedidoData.data_expiracao.toDate() : new Date(pedidoData.data_expiracao);
      
      if (dataExpiracao && agora > dataExpiracao && pedidoData.status_pagamento !== 'pago') {
        console.log('⏰ Pedido expirado, atualizando status...');
        await updateDoc(doc(db, 'pedidos', pedidoId), {
          status_pagamento: 'expirado',
          status: 'expirado'
        });
        
        // Liberar números reservados
        const numerosQuery = query(
          collection(db, 'numeros'),
          where('id_pedido', '==', pedidoId)
        );
        const numerosSnapshot = await getDocs(numerosQuery);
        
        if (!numerosSnapshot.empty) {
          const batch = writeBatch(db);
          numerosSnapshot.docs.forEach(numeroDoc => {
            batch.update(numeroDoc.ref, {
              status: 'disponivel',
              id_usuario: null,
              id_pedido: null,
              data_reserva: null
            });
          });
          await batch.commit();
          console.log('🔓 Números liberados devido à expiração');
        }
        
        toast.error('Pagamento expirado. Os números foram liberados.', { id: 'pagamento-expirado' });
        return false;
      }
      
      // Verificar status do pagamento
      switch (pedidoData.status_pagamento) {
        case 'pago':
          setPedidoAtivo(null);
          toast.success('Pagamento confirmado! Seus números foram reservados.', { id: 'pagamento-confirmado' });
          
          // Atualizar números da rifa
          if (rifaAtiva) {
            await buscarNumerosRifa(rifaAtiva.id);
          }
          
          // Recarregar tickets
          await buscarMeusTickets();
          
          return true;
          
        case 'aguardando_pagamento':
        case 'reservado':
          console.log('⏳ Pagamento ainda pendente');
          return false;
          
        case 'expirado':
          toast.error('Pagamento expirado.');
          return false;
          
        case 'cancelado':
          toast.error('Pagamento cancelado.');
          return false;
          
        default:
          console.log('❓ Status desconhecido:', pedidoData.status_pagamento);
          return false;
      }
    } catch (error) {
      console.error('Erro ao verificar pagamento:', error);
      toast.error('Erro ao verificar status do pagamento');
      return false;
    }
  };

  // Cancelar pedido expirado
  const cancelarPedido = async (pedidoId) => {
    try {
      const cancelarReserva = httpsCallable(functions, 'cancelarReserva');
      await cancelarReserva({ pedidoId });
      
      setPedidoAtivo(null);
      
      // Atualizar números da rifa
      if (rifaAtiva) {
        await buscarNumerosRifa(rifaAtiva.id);
      }
      
      toast('Reserva cancelada. Os números estão disponíveis novamente.', {
        icon: 'ℹ️'
      });
    } catch (error) {
      console.error('Erro ao cancelar pedido:', error);
    }
  };

  // Atualizar estatísticas da rifa após pagamento confirmado
  const atualizarEstatisticasRifa = async (rifaId) => {
    try {
      console.log('🔄 Atualizando estatísticas da rifa:', rifaId);
      
      // Buscar todos os pedidos pagos da rifa
      const pedidosQuery = query(
        collection(db, 'pedidos'),
        where('id_rifa', '==', rifaId),
        where('status_pagamento', '==', 'pago')
      );
      const pedidosSnapshot = await getDocs(pedidosQuery);
      
      let qtd_vendida = 0;
      let receita_total = 0;
      const participantes = new Set();
      
      pedidosSnapshot.forEach(doc => {
        const pedido = doc.data();
        const quantidade = pedido.quantidade || pedido.numeros?.length || 0;
        qtd_vendida += quantidade;
        receita_total += pedido.valor_total || 0;
        
        if (pedido.id_usuario) {
          participantes.add(pedido.id_usuario);
        }
      });
      
      // Atualizar a rifa
      await updateDoc(doc(db, 'rifas', rifaId), {
        qtd_vendida: qtd_vendida,
        receita_total: receita_total,
        participantes: participantes.size,
        ultima_atualizacao: serverTimestamp()
      });
      
      console.log(`✅ Estatísticas da rifa ${rifaId} atualizadas:`, {
        qtd_vendida,
        receita_total,
        participantes: participantes.size
      });
      
      // Atualizar rifa ativa se for a mesma
      if (rifaAtiva && rifaAtiva.id === rifaId) {
        setRifaAtiva(prev => ({
          ...prev,
          qtd_vendida,
          receita_total,
          participantes: participantes.size
        }));
      }
      
    } catch (error) {
      console.error('❌ Erro ao atualizar estatísticas da rifa:', error);
    }
  };

  // Obter números disponíveis de uma rifa
  const getNumerosDisponiveis = (rifaId) => {
    return numerosRifa.filter(numero => 
      numero.id_rifa === rifaId && numero.status === 'disponivel'
    ).length;
  };

  // Obter números vendidos de uma rifa
  const getNumerosVendidos = (rifaId, userId = null) => {
    if (userId) {
      // Retornar números vendidos para um usuário específico
      return numerosRifa.filter(numero => 
        numero.id_rifa === rifaId && 
        numero.status === 'vendido' && 
        numero.id_usuario === userId
      ).length;
    } else {
      // Retornar total de números vendidos da rifa
      return numerosRifa.filter(numero => 
        numero.id_rifa === rifaId && numero.status === 'vendido'
      ).length;
    }
  };

  // Verificar se um número está disponível
  const isNumeroDisponivel = (numero, rifaId) => {
    const numeroObj = numerosRifa.find(n => 
      n.numero === numero && n.id_rifa === rifaId
    );
    return numeroObj?.status === 'disponivel';
  };

  // Escutar mudanças em tempo real no pedido ativo
  useEffect(() => {
    if (pedidoAtivo) {
      const unsubscribe = onSnapshot(
        doc(db, 'pedidos', pedidoAtivo.id),
        (doc) => {
          if (doc.exists()) {
            const pedidoData = doc.data();
            setPedidoAtivo(prev => ({ ...prev, ...pedidoData }));
            
            if (pedidoData.status_pagamento === 'pago') {
              setPedidoAtivo(null);
              // Atualizar estatísticas da rifa
              if (pedidoData.id_rifa) {
                atualizarEstatisticasRifa(pedidoData.id_rifa);
              }
              // Toast removido - já é mostrado na função verificarStatusPagamento
            }
          }
        }
      );

      return () => unsubscribe();
    }
  }, [pedidoAtivo]);

  // Carregar rifas ativas ao montar o componente
  useEffect(() => {
    buscarRifasAtivas();
  }, []);

  // Carregar meus tickets quando o usuário estiver logado
  useEffect(() => {
    if (currentUser) {
      buscarMeusTickets();
    } else {
      setMeusTickets([]);
    }
  }, [currentUser]);

  // TEMPORARIAMENTE DESABILITADO - Verificar números expirados periodicamente
  useEffect(() => {
    // DESABILITADO PARA TESTE
    return;
    
    // Se há pedido ativo pendente, não verificar expiração (usuário está tentando pagar)
    if (pedidoAtivo && pedidoAtivo.status === 'pendente') {
      return;
    }
    
    // Verificar imediatamente apenas se não há pedido ativo
    verificarNumerosExpirados();
    
    // Verificar a cada 2 minutos (menos agressivo)
    const interval = setInterval(() => {
      // Só verificar se não há pedido ativo sendo pago
      if (!pedidoAtivo || pedidoAtivo.status !== 'pendente') {
        verificarNumerosExpirados();
      }
    }, 120000); // 2 minutos
    
    return () => clearInterval(interval);
  }, [rifaAtiva, pedidoAtivo]);

  const value = {
    rifas,
    rifaAtiva,
    numerosRifa,
    meusTickets,
    pedidoAtivo,
    loading,
    buscarRifasAtivas,
    buscarRifa,
    buscarNumerosRifa,
    comprarNumeros,
    gerarPIX,
    buscarMeusTickets,
    verificarStatusPagamento,
    cancelarPedido,
    verificarNumerosExpirados,
    getNumerosDisponiveis,
    getNumerosVendidos,
    isNumeroDisponivel,
    setRifaAtiva,
    setPedidoAtivo,
    atualizarEstatisticasRifa
  };

  return (
    <RaffleContext.Provider value={value}>
      {children}
    </RaffleContext.Provider>
  );
};
