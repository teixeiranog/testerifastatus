import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
// @ts-ignore
import { MercadoPagoConfig, Payment } from 'mercadopago';
import cors from 'cors';

// Inicializar Firebase Admin
admin.initializeApp();

// Configurar CORS
const corsHandler = cors({ origin: true });

// Configurar Mercado Pago
const mercadoPago = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || 'TEST-ACCESS-TOKEN',
  options: {
    timeout: 5000,
  }
});

// Firestore reference
const db = admin.firestore();

/**
 * Criar números para uma rifa
 */
export const criarNumerosRifa = functions.https.onCall(async (data, context) => {
  try {
    // Verificar autenticação
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado');
    }

    const { rifaId, quantidade } = data;

    if (!rifaId || !quantidade) {
      throw new functions.https.HttpsError('invalid-argument', 'Parâmetros inválidos');
    }

    // Criar números em lote
    const batch = db.batch();
    
    for (let i = 1; i <= quantidade; i++) {
      const numeroRef = db.collection('numeros').doc();
      batch.set(numeroRef, {
        id_rifa: rifaId,
        numero: i,
        status: 'disponivel',
        id_usuario: null,
        data_reserva: null,
        data_compra: null
      });
    }

    await batch.commit();

    return { success: true, message: `${quantidade} números criados com sucesso` };
  } catch (error) {
    console.error('Erro ao criar números da rifa:', error);
    throw new functions.https.HttpsError('internal', 'Erro interno do servidor');
  }
});

/**
 * Reservar números para compra
 */
export const criarReservaNumeros = functions.https.onCall(async (data, context) => {
  try {
    // Verificar autenticação
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado');
    }

    const { rifaId, quantidade, userId } = data;

    if (!rifaId || !quantidade || !userId) {
      throw new functions.https.HttpsError('invalid-argument', 'Parâmetros inválidos');
    }

    // Buscar números disponíveis
    const numerosQuery = await db.collection('numeros')
      .where('id_rifa', '==', rifaId)
      .where('status', '==', 'disponivel')
      .limit(quantidade)
      .get();

    if (numerosQuery.size < quantidade) {
      throw new functions.https.HttpsError('failed-precondition', 'Números insuficientes disponíveis');
    }

    // Buscar dados da rifa
    const rifaDoc = await db.collection('rifas').doc(rifaId).get();
    if (!rifaDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Rifa não encontrada');
    }

    const rifaData = rifaDoc.data()!;
    const valorTotal = rifaData.valor * quantidade;
    const expiraEm = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

    // Criar pedido
    const pedidoRef = await db.collection('pedidos').add({
      id_usuario: userId,
      id_rifa: rifaId,
      numeros: numerosQuery.docs.map(doc => doc.data().numero),
      quantidade,
      valor_total: valorTotal,
      status_pagamento: 'reservado',
      data_criacao: admin.firestore.FieldValue.serverTimestamp(),
      expira_em: expiraEm
    });

    // Reservar números
    const batch = db.batch();
    numerosQuery.forEach(doc => {
      batch.update(doc.ref, {
        status: 'reservado',
        id_usuario: userId,
        data_reserva: admin.firestore.FieldValue.serverTimestamp(),
        id_pedido: pedidoRef.id
      });
    });

    await batch.commit();

    // Agendar cancelamento automático
            setTimeout(async () => {
          try {
            const pedidoDoc = await pedidoRef.get();
            if (pedidoDoc.exists && pedidoDoc.data()!.status_pagamento === 'reservado') {
              // Cancelar reserva automaticamente
              await cancelarReservaInternal(pedidoRef.id);
            }
          } catch (error) {
            console.error('Erro ao cancelar reserva automaticamente:', error);
          }
        }, 30 * 60 * 1000); // 30 minutos

    const pedidoData = (await pedidoRef.get()).data();

    return {
      success: true,
      pedido: {
        id: pedidoRef.id,
        ...pedidoData
      }
    };
  } catch (error) {
    console.error('Erro ao criar reserva:', error);
    throw new functions.https.HttpsError('internal', 'Erro interno do servidor');
  }
});

/**
 * Gerar pagamento PIX via Mercado Pago
 */
export const gerarPagamentoPIX = functions.https.onCall(async (data, context) => {
  try {
    // Verificar autenticação
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado');
    }

    const { pedidoId } = data;

    if (!pedidoId) {
      throw new functions.https.HttpsError('invalid-argument', 'ID do pedido é obrigatório');
    }

    // Buscar pedido
    const pedidoDoc = await db.collection('pedidos').doc(pedidoId).get();
    if (!pedidoDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Pedido não encontrado');
    }

    const pedidoData = pedidoDoc.data()!;

    // Buscar dados do usuário
    const usuarioDoc = await db.collection('usuarios').doc(pedidoData.id_usuario).get();
    if (!usuarioDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Usuário não encontrado');
    }

    const usuarioData = usuarioDoc.data()!;

    // Buscar dados da rifa
    const rifaDoc = await db.collection('rifas').doc(pedidoData.id_rifa).get();
    if (!rifaDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Rifa não encontrada');
    }

    const rifaData = rifaDoc.data()!;

    // Criar pagamento no Mercado Pago
    const payment = new Payment(mercadoPago);

    const paymentData = {
      transaction_amount: pedidoData.valor_total,
      description: `Rifa: ${rifaData.titulo} - ${pedidoData.quantidade} números`,
      payment_method_id: 'pix',
      payer: {
        email: usuarioData.email,
        first_name: usuarioData.nome.split(' ')[0],
        last_name: usuarioData.nome.split(' ').slice(1).join(' ') || 'Silva',
        identification: {
          type: 'CPF',
          number: '12345678901' // Em produção, coletar CPF real
        }
      },
      notification_url: `${functions.config().app.url}/webhook-mercadopago`,
      external_reference: pedidoId
    };

    const response = await payment.create({ body: paymentData });

    // Salvar ID do pagamento no pedido
    await pedidoDoc.ref.update({
      mercadopago_payment_id: response.id,
      qr_code: response.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64: response.point_of_interaction?.transaction_data?.qr_code_base64
    });

    return {
      success: true,
      qrCode: {
        qr_code: response.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: response.point_of_interaction?.transaction_data?.qr_code_base64,
        payment_id: response.id
      }
    };
  } catch (error) {
    console.error('Erro ao gerar PIX:', error);
    throw new functions.https.HttpsError('internal', 'Erro ao gerar pagamento PIX');
  }
});

/**
 * Webhook do Mercado Pago
 */
export const webhookMercadoPago = functions.https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    try {
      if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
      }

      const { type, data } = req.body;

      if (type === 'payment') {
        const paymentId = data.id;
        
        // Buscar pagamento no Mercado Pago
        const payment = new Payment(mercadoPago);
        const paymentInfo = await payment.get({ id: paymentId });

        if (paymentInfo.status === 'approved') {
          const pedidoId = paymentInfo.external_reference;

          // Buscar pedido
          const pedidoDoc = await db.collection('pedidos').doc(pedidoId).get();
          if (!pedidoDoc.exists) {
            res.status(404).send('Pedido não encontrado');
            return;
          }

          const pedidoData = pedidoDoc.data()!;

          // Atualizar status do pedido
          await pedidoDoc.ref.update({
            status_pagamento: 'pago',
            data_pagamento: admin.firestore.FieldValue.serverTimestamp(),
            mercadopago_payment_data: paymentInfo
          });

          // Atualizar números para "vendido"
          const numerosQuery = await db.collection('numeros')
            .where('id_rifa', '==', pedidoData.id_rifa)
            .where('id_pedido', '==', pedidoId)
            .get();

          const batch = db.batch();
          numerosQuery.forEach(doc => {
            batch.update(doc.ref, {
              status: 'vendido',
              data_compra: admin.firestore.FieldValue.serverTimestamp()
            });
          });

          // Atualizar estatísticas da rifa
          const rifaRef = db.collection('rifas').doc(pedidoData.id_rifa);
          batch.update(rifaRef, {
            qtd_vendida: admin.firestore.FieldValue.increment(pedidoData.quantidade),
            participantes: admin.firestore.FieldValue.increment(1)
          });

          await batch.commit();

          console.log(`Pagamento confirmado para pedido ${pedidoId}`);
        }
      }

      res.status(200).send('OK');
    } catch (error) {
      console.error('Erro no webhook:', error);
      res.status(500).send('Erro interno');
    }
  });
});

/**
 * Função interna para cancelar reserva
 */
const cancelarReservaInternal = async (pedidoId: string) => {
  try {
    // Buscar pedido
    const pedidoDoc = await db.collection('pedidos').doc(pedidoId).get();
    if (!pedidoDoc.exists) {
      return false;
    }

    const pedidoData = pedidoDoc.data()!;

    // Verificar se ainda está reservado
    if (pedidoData.status_pagamento !== 'reservado') {
      return true;
    }

    // Atualizar status do pedido
    await pedidoDoc.ref.update({
      status_pagamento: 'cancelado',
      data_cancelamento: admin.firestore.FieldValue.serverTimestamp()
    });

    // Liberar números
    const numerosQuery = await db.collection('numeros')
      .where('id_pedido', '==', pedidoId)
      .get();

    const batch = db.batch();
    numerosQuery.forEach(doc => {
      batch.update(doc.ref, {
        status: 'disponivel',
        id_usuario: null,
        data_reserva: null,
        id_pedido: null
      });
    });

    await batch.commit();
    return true;
  } catch (error) {
    console.error('Erro ao cancelar reserva:', error);
    return false;
  }
};

/**
 * Cancelar reserva de números
 */
export const cancelarReserva = functions.https.onCall(async (data, context) => {
  try {
    const { pedidoId } = data;

    if (!pedidoId) {
      throw new functions.https.HttpsError('invalid-argument', 'ID do pedido é obrigatório');
    }

    const result = await cancelarReservaInternal(pedidoId);
    
    if (result) {
      return { success: true, message: 'Reserva cancelada com sucesso' };
    } else {
      throw new functions.https.HttpsError('not-found', 'Pedido não encontrado');
    }
  } catch (error) {
    console.error('Erro ao cancelar reserva:', error);
    throw new functions.https.HttpsError('internal', 'Erro interno do servidor');
  }
});

/**
 * Sortear vencedor de uma rifa
 */
export const sortearVencedor = functions.https.onCall(async (data, context) => {
  try {
    // Verificar autenticação e permissão de admin
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado');
    }

    // Verificar se o usuário é admin
    const userDoc = await db.collection('usuarios').doc(context.auth.uid).get();
    const userData = userDoc.data();
    
    if (!userData || !userData.admin) {
      throw new functions.https.HttpsError('permission-denied', 'Acesso negado. Apenas administradores podem realizar sorteios.');
    }

    const { rifaId } = data;

    if (!rifaId) {
      throw new functions.https.HttpsError('invalid-argument', 'ID da rifa é obrigatório');
    }

    // Buscar números vendidos da rifa (com id_usuario preenchido)
    console.log('Buscando números vendidos para rifa:', rifaId);
    const numerosQuery = await db.collection('numeros')
      .where('id_rifa', '==', rifaId)
      .where('id_usuario', '!=', null)
      .get();

    console.log('Números com usuário encontrados:', numerosQuery.size);
    
    if (numerosQuery.empty) {
      throw new functions.https.HttpsError('failed-precondition', 'Nenhum número vendido para sortear');
    }

    // Filtrar apenas números vendidos
    const numerosVendidos = numerosQuery.docs.filter(doc => {
      const data = doc.data();
      return data.status === 'vendido' || data.id_usuario;
    });

    console.log('Números vendidos filtrados:', numerosVendidos.length);

    if (numerosVendidos.length === 0) {
      throw new functions.https.HttpsError('failed-precondition', 'Nenhum número vendido para sortear');
    }

    // Sortear número aleatório
    const numeroSorteado = numerosVendidos[Math.floor(Math.random() * numerosVendidos.length)];
    const numeroData = numeroSorteado.data();

    console.log('Número sorteado:', numeroData.numero, 'Usuário:', numeroData.id_usuario);

    // Buscar dados do vencedor
    const vencedorDoc = await db.collection('usuarios').doc(numeroData.id_usuario).get();
    
    if (!vencedorDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Usuário vencedor não encontrado');
    }
    
    const vencedorData = vencedorDoc.data()!;

    // Atualizar rifa com resultado do sorteio
    await db.collection('rifas').doc(rifaId).update({
      status: 'finalizada',
      numero_sorteado: numeroData.numero,
      vencedor_id: numeroData.id_usuario,
      vencedor_nome: vencedorData.nome,
      data_sorteio_realizado: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      numeroSorteado: numeroData.numero,
      vencedor: {
        id: numeroData.id_usuario,
        nome: vencedorData.nome,
        email: vencedorData.email
      }
    };
  } catch (error) {
    console.error('Erro ao sortear vencedor:', error);
    throw new functions.https.HttpsError('internal', 'Erro interno do servidor');
  }
});

/**
 * Deletar rifa completa (admin)
 */
export const deletarRifa = functions.https.onCall(async (data, context) => {
  try {
    // Verificar autenticação e permissão de admin
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado');
    }

    const { rifaId } = data;

    if (!rifaId) {
      throw new functions.https.HttpsError('invalid-argument', 'ID da rifa é obrigatório');
    }

    // Deletar números da rifa
    const numerosQuery = await db.collection('numeros')
      .where('id_rifa', '==', rifaId)
      .get();

    const batch = db.batch();
    numerosQuery.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Deletar pedidos da rifa
    const pedidosQuery = await db.collection('pedidos')
      .where('id_rifa', '==', rifaId)
      .get();

    pedidosQuery.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Deletar rifa
    batch.delete(db.collection('rifas').doc(rifaId));

    await batch.commit();

    return { success: true, message: 'Rifa deletada com sucesso' };
  } catch (error) {
    console.error('Erro ao deletar rifa:', error);
    throw new functions.https.HttpsError('internal', 'Erro interno do servidor');
  }
});
