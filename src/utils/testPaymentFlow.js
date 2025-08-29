// Utilitário para testar fluxo de pagamentos
import { doc, updateDoc, writeBatch, query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

// Simular diferentes cenários de pagamento
export const simularCenarioPagamento = async (pedidoId, cenario) => {
  try {
    console.log(`🎭 Simulando cenário: ${cenario} para pedido ${pedidoId}`);
    
    const pedidoRef = doc(db, 'pedidos', pedidoId);
    
    switch (cenario) {
      case 'aprovado':
        // Simular pagamento aprovado
        await updateDoc(pedidoRef, {
          status: 'concluido',
          status_pagamento: 'pago',
          data_pagamento: new Date(),
          'payment_data.status': 'approved'
        });
        
        // Atualizar números para vendido
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
        
        console.log('✅ Pagamento aprovado simulado');
        break;
        
      case 'rejeitado':
        // Simular pagamento rejeitado
        await updateDoc(pedidoRef, {
          status: 'cancelado',
          status_pagamento: 'cancelado',
          'payment_data.status': 'rejected'
        });
        
        // Liberar números
        const numerosRejeitadosQuery = query(
          collection(db, 'numeros'),
          where('id_pedido', '==', pedidoId)
        );
        const numerosRejeitadosSnapshot = await getDocs(numerosRejeitadosQuery);
        
        if (!numerosRejeitadosSnapshot.empty) {
          const batch = writeBatch(db);
          numerosRejeitadosSnapshot.docs.forEach(numeroDoc => {
            batch.update(numeroDoc.ref, {
              status: 'disponivel',
              id_usuario: null,
              id_pedido: null,
              data_reserva: null
            });
          });
          await batch.commit();
        }
        
        console.log('❌ Pagamento rejeitado simulado');
        break;
        
      case 'expirado':
        // Simular expiração
        await updateDoc(pedidoRef, {
          status: 'expirado',
          status_pagamento: 'expirado',
          data_expiracao: new Date(Date.now() - 1000) // 1 segundo no passado
        });
        
        // Liberar números
        const numerosExpiradosQuery = query(
          collection(db, 'numeros'),
          where('id_pedido', '==', pedidoId)
        );
        const numerosExpiradosSnapshot = await getDocs(numerosExpiradosQuery);
        
        if (!numerosExpiradosSnapshot.empty) {
          const batch = writeBatch(db);
          numerosExpiradosSnapshot.docs.forEach(numeroDoc => {
            batch.update(numeroDoc.ref, {
              status: 'disponivel',
              id_usuario: null,
              id_pedido: null,
              data_reserva: null
            });
          });
          await batch.commit();
        }
        
        console.log('⏰ Expiração simulada');
        break;
        
      case 'pendente':
        // Manter como pendente com mais tempo
        await updateDoc(pedidoRef, {
          status_pagamento: 'aguardando_pagamento',
          data_expiracao: new Date(Date.now() + 10 * 60 * 1000) // +10 min
        });
        
        console.log('⏳ Status pendente simulado');
        break;
        
      default:
        console.log('❓ Cenário desconhecido:', cenario);
    }
    
  } catch (error) {
    console.error('Erro ao simular cenário:', error);
  }
};

// Adicionar botões de teste ao console
export const adicionarControlesTeste = () => {
  if (process.env.NODE_ENV === 'development') {
    window.testPayment = simularCenarioPagamento;
    console.log(`
🧪 CONTROLES DE TESTE DISPONÍVEIS:
    
Para testar diferentes cenários de pagamento, use:
    
window.testPayment('PEDIDO_ID', 'aprovado')    - Aprovar pagamento
window.testPayment('PEDIDO_ID', 'rejeitado')   - Rejeitar pagamento  
window.testPayment('PEDIDO_ID', 'expirado')    - Expirar pagamento
window.testPayment('PEDIDO_ID', 'pendente')    - Manter pendente

Exemplo:
window.testPayment('abc123', 'aprovado')
    `);
  }
};

export default {
  simularCenarioPagamento,
  adicionarControlesTeste
};
