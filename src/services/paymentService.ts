import api from './api';

// Enums e interfaces baseados no frontend web
export enum PaymentMethod {
  PIX = 'PIX',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD'
}



export interface CustomerInfoDto {
  name: string;
  email: string;
  cellphone: string;
  taxId: string;
}

export interface BatchItemDto {
  batchId: string;
  quantity: number;
}

export interface CreditCardInfoDto {
  holderName: string;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  saveCard?: boolean;
  postalCode?: string;
  addressNumber?: string;
  addressComplement?: string;
}

export interface SecureTicketPurchaseDto {
  eventId: string;
  batchItems: BatchItemDto[];
  customerInfo: CustomerInfoDto;
  paymentMethod: PaymentMethod;
  creditCardInfo?: CreditCardInfoDto;
  returnUrl?: string;
  callbackUrl?: string;
}

export interface TicketPurchaseResponseDto {
  paymentId: string;
  status: string;
  amount: {
    original: number;
    fee: number;
    total: number;
  };
  payment_url: string;
  pixInfo?: {
    qrCode: string;
    pixCode: string;
    expirationDate: string;
  };
  paymentMethod: PaymentMethod;
  eventId: string;
  customerEmail: string;
  createdAt: string;
  expirationDate: string;
  items?: Array<{
    batchId: string;
    batchName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

export interface PaymentStatusDto {
  paymentId: string;
  paid: boolean;
  status: string;
  paymentMethod?: string;
  hasTickets?: boolean;
  ticketCount?: number;
  amount?: number;
  eventTitle?: string;
}

export interface CheckoutItem {
  batchId: string;
  batchName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface EventFees {
  buyerFeePercentage: number;
  producerFeePercentage: number;
  isCustom: boolean;
  eventCreatorId: string;
  isLoaded: boolean;
}

export interface TotalWithFees {
  original: number;
  fee: number;
  total: number;
}

// Utilitários de validação e formatação
const paymentService = {
  // Formatação de moeda
  formatCurrency: (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  },

  // Validação de email
  validateEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validação de telefone
  validatePhone: (phone: string): boolean => {
    const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length === 10 || cleanPhone.length === 11;
  },

  // Validação de CPF
  validateCPF: (cpf: string): boolean => {
    const cleanCPF = cpf.replace(/\D/g, '');
    
    if (cleanCPF.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(10))) return false;

    return true;
  },

  // Máscaras
  maskCPF: (value: string): string => {
    const cleanValue = value.replace(/\D/g, '');
    return cleanValue
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .substring(0, 14);
  },

  maskPhone: (value: string): string => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length <= 10) {
      return cleanValue
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    } else {
      return cleanValue
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .substring(0, 15);
    }
  },

  maskCreditCard: (value: string): string => {
    const cleanValue = value.replace(/\D/g, '');
    return cleanValue
      .replace(/(\d{4})(\d)/, '$1 $2')
      .replace(/(\d{4})(\d)/, '$1 $2')
      .replace(/(\d{4})(\d)/, '$1 $2')
      .substring(0, 19);
  },

  // Validação de cartão de crédito
  validateCreditCard: (card: Partial<CreditCardInfoDto>): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!card.holderName?.trim()) {
      errors.push('Nome do portador é obrigatório');
    }

    const cleanCardNumber = card.cardNumber?.replace(/\s/g, '') || '';
    if (cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
      errors.push('Número do cartão inválido');
    }

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const expiryMonth = parseInt(card.expiryMonth || '0');
    const expiryYear = parseInt(card.expiryYear || '0');

    if (expiryMonth < 1 || expiryMonth > 12) {
      errors.push('Mês de expiração inválido');
    }

    if (expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)) {
      errors.push('Cartão expirado');
    }

    if (!card.cvv || card.cvv.length < 3 || card.cvv.length > 4) {
      errors.push('CVV inválido');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Calcular total com taxas
  calculateTotalWithFees: (originalAmount: number, feePercentage: number): TotalWithFees => {
    const fee = originalAmount * (feePercentage / 100);
    const total = originalAmount + fee;

    return {
      original: originalAmount,
      fee,
      total
    };
  },

  // Buscar taxas do evento
  getEventFees: async (eventId: string): Promise<EventFees> => {
    try {
      // Usar a rota correta que existe no backend
      const response = await api.get(`/fees/event/${eventId}/effective-fees`);
      return {
        ...response.data,
        isLoaded: true
      };
    } catch (error: any) {
      console.error('Erro ao buscar taxas do evento:', error);
      
      // Tentar buscar taxas padrão como fallback
      try {
        const defaultResponse = await api.get('/admin/fees/default');
        return {
          buyerFeePercentage: defaultResponse.data.buyerFeePercentage || 5,
          producerFeePercentage: defaultResponse.data.producerFeePercentage || 5,
          isCustom: false,
          eventCreatorId: '',
          isLoaded: true
        };
      } catch (defaultError) {
        console.error('Erro ao buscar taxas padrão:', defaultError);
        // Retorna taxas padrão hardcoded em caso de erro total
        return {
          buyerFeePercentage: 5,
          producerFeePercentage: 5,
          isCustom: false,
          eventCreatorId: '',
          isLoaded: true
        };
      }
    }
  },

  // Criar pagamento PIX dinâmico
  createDynamicPixPayment: async (
    eventId: string,
    eventTitle: string,
    customerInfo: CustomerInfoDto,
    batchItems: BatchItemDto[]
  ): Promise<TicketPurchaseResponseDto> => {
    try {
      const payload: SecureTicketPurchaseDto = {
        eventId,
        batchItems,
        customerInfo,
        paymentMethod: PaymentMethod.PIX
      };

      // Usar a rota correta do backend
      const response = await api.post<TicketPurchaseResponseDto>('/payment/tickets/purchase', payload);
      return response.data;
    } catch (error: any) {
      console.error('Erro no pagamento PIX:', error);
      throw new Error(error.response?.data?.message || 'Erro ao processar pagamento PIX');
    }
  },

  // Processar pagamento com cartão
  processCardPayment: async (
    eventId: string,
    eventTitle: string,
    customerInfo: CustomerInfoDto,
    creditCardInfo: CreditCardInfoDto,
    batchItems: BatchItemDto[]
  ): Promise<TicketPurchaseResponseDto> => {
    try {
      // Usar a estrutura correta para pagamento com cartão
      const payload = {
        eventId,
        eventTitle,
        customerInfo,
        creditCardData: creditCardInfo,
        batchItems
      };

      const response = await api.post<TicketPurchaseResponseDto>('/payment/credit-card', payload);
      return response.data;
    } catch (error: any) {
      console.error('Erro no pagamento com cartão:', error);
      throw new Error(error.response?.data?.message || 'Erro ao processar pagamento com cartão');
    }
  },

  // Verificar status do pagamento
  checkPaymentStatus: async (paymentId: string): Promise<PaymentStatusDto> => {
    try {
      const response = await api.get<PaymentStatusDto>(`/payment/check-status/${paymentId}`);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao verificar status do pagamento:', error);
      throw new Error(error.response?.data?.message || 'Erro ao verificar status do pagamento');
    }
  },

  // Buscar dados do pagamento por ID
  getPaymentById: async (paymentId: string): Promise<any> => {
    try {
      const response = await api.get(`/payment/billings/${paymentId}`);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao buscar dados do pagamento:', error);
      throw new Error(error.response?.data?.message || 'Erro ao buscar dados do pagamento');
    }
  },

  // Monitoramento de pagamento PIX em tempo real
  startPaymentMonitoring: (
    paymentId: string,
    onStatusChange: (status: PaymentStatusDto) => void
  ): (() => void) => {
    const intervalId = setInterval(async () => {
      try {
        const status = await paymentService.checkPaymentStatus(paymentId);
        onStatusChange(status);
        
        // Para de monitorar se o pagamento foi confirmado
        if (status.paid) {
          clearInterval(intervalId);
        }
      } catch (error) {
        console.error('Erro no monitoramento do pagamento:', error);
      }
    }, 5000); // Verifica a cada 5 segundos

    // Retorna função para parar o monitoramento
    return () => clearInterval(intervalId);
  }
};

export default paymentService; 