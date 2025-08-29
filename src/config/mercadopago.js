// Configuração do Mercado Pago
export const mercadoPagoConfig = {
  // *** TROCAR PELAS SUAS CREDENCIAIS DE TESTE ***
  accessToken: 'TEST-1234567890123456-123456-abcdef1234567890abcdef1234567890-123456789', // Sua credencial de TESTE
  publicKey: 'TEST-abcdef12-3456-7890-abcd-ef1234567890', // Sua chave pública de TESTE
  
  // URLs da API
  baseURL: 'https://api.mercadopago.com/v1',
  
  // Configurações PIX
  pixConfig: {
    expires_in: 900, // 15 minutos em segundos
    payment_method_id: 'pix'
  }
};

// Função para criar pagamento PIX
export const criarPagamentoPIX = async (dadosPagamento) => {
  try {
    const { valor, descricao, email, cpf, nome } = dadosPagamento;
    
    const paymentData = {
      transaction_amount: valor,
      description: descricao,
      payment_method_id: 'pix',
      payer: {
        email: email,
        first_name: nome,
        identification: {
          type: 'CPF',
          number: cpf
        }
      },
      notification_url: `${window.location.origin}/webhook/mercadopago`, // URL para receber notificações
      expires: true,
      date_of_expiration: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutos
    };

    console.log('🏦 Criando pagamento PIX:', paymentData);

    const response = await fetch(`${mercadoPagoConfig.baseURL}/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mercadoPagoConfig.accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `pix-${Date.now()}-${Math.random()}` // Evitar duplicação
      },
      body: JSON.stringify(paymentData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Erro API Mercado Pago:', errorData);
      throw new Error(`Erro ${response.status}: ${errorData.message || 'Falha ao criar pagamento'}`);
    }

    const payment = await response.json();
    console.log('✅ Pagamento PIX criado:', payment);

    return {
      id: payment.id,
      status: payment.status,
      qr_code: payment.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64: payment.point_of_interaction?.transaction_data?.qr_code_base64,
      ticket_url: payment.point_of_interaction?.transaction_data?.ticket_url,
      expiration_date: payment.date_of_expiration
    };

  } catch (error) {
    console.error('❌ Erro ao criar pagamento PIX:', error);
    throw error;
  }
};

// Função para verificar status do pagamento
export const verificarStatusPagamentoPIX = async (paymentId) => {
  try {
    const response = await fetch(`${mercadoPagoConfig.baseURL}/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${mercadoPagoConfig.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Erro ao verificar status do pagamento');
    }

    const payment = await response.json();
    return payment;
  } catch (error) {
    console.error('Erro ao verificar status do pagamento:', error);
    throw error;
  }
};

// Função para cancelar pagamento
export const cancelarPagamentoPIX = async (paymentId) => {
  try {
    console.log('❌ Cancelando pagamento:', paymentId);

    const response = await fetch(`${mercadoPagoConfig.baseURL}/payments/${paymentId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${mercadoPagoConfig.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'cancelled'
      })
    });

    if (!response.ok) {
      throw new Error(`Erro ${response.status}: Falha ao cancelar pagamento`);
    }

    const payment = await response.json();
    console.log('🗑️ Pagamento cancelado:', payment);

    return payment;

  } catch (error) {
    console.error('❌ Erro ao cancelar pagamento:', error);
    throw error;
  }
};
