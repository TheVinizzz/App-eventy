import api from './api';

// Enums
export enum TicketStatus {
  ACTIVE = 'ACTIVE',
  USED = 'USED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  PENDING = 'PENDING',
  REFUNDED = 'REFUNDED'
}

// Interfaces
export interface TicketBatch {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity?: number;
  sold?: number;
  available?: number;
  startSaleDate?: string | Date;
  endSaleDate?: string | Date;
  eventId?: string;
  status?: 'ACTIVE' | 'UPCOMING' | 'SOLD_OUT' | 'CLOSED';
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  imageUrl?: string;
  venue?: {
    id: string;
    name: string;
    address: string;
    city: string;
  };
}

export interface Ticket {
  id: string;
  eventId: string;
  buyerId: string;
  price: number;
  purchaseDate: string;
  status: TicketStatus;
  qrCode: string;
  batchId: string;
  checkInDate?: string;
  usedAt?: string;
  event: Event;
  ticketBatch?: TicketBatch;
  billing?: {
    status: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    profileImage?: string;
  };
}

export interface CheckInResult {
  success: boolean;
  message: string;
  ticket?: Ticket;
  error?: string;
  timestamp?: string;
}

export interface QRValidationResult {
  valid: boolean;
  ticket?: Ticket;
  message: string;
  error?: string;
  canCheckIn?: boolean;
}

export interface CheckinStats {
  eventId: string;
  totalTickets: number;
  checkedInTickets: number;
  pendingTickets: number;
  checkinRate: number;
  recentCheckIns: any[];
  lastUpdate: string;
}

export interface RecentCheckIn {
  id: string;
  ticketId: string;
  buyerName: string;
  checkInTime: string;
  ticketType: string;
}

// API Functions
export async function checkInTicket(qrCode: string, eventId: string): Promise<CheckInResult> {
  try {
    console.log('🎯 Aprovando check-in (nova rota):', { qrCode, eventId });
    
    // Usar nova rota de aprovação de check-in
    const response = await api.post('/tickets/app/approve-checkin', {
      qrCode,
      eventId,
      approvedBy: 'App Mobile',
      notes: 'Check-in aprovado via app mobile',
    });

    console.log('✅ Check-in approval response:', response.data);
    
    return {
      success: response.data.success || true,
      message: response.data.message || 'Check-in aprovado e realizado com sucesso!',
      ticket: response.data.ticket,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error('❌ Erro na aprovação do check-in:', error);
    
    if (error.response?.data) {
      return {
        success: false,
        message: error.response.data.message || 'Erro ao aprovar check-in',
        error: error.response.data.error || 'CHECKIN_ERROR',
      };
    }
    
    return {
      success: false,
      message: 'Erro de conexão. Verifique sua internet e tente novamente.',
      error: 'CONNECTION_ERROR',
    };
  }
}

export async function validateTicketQR(qrCode: string, eventId?: string): Promise<QRValidationResult> {
  try {
    console.log('🔍 Validando QR code (nova rota):', { qrCode, eventId });
    
    // Usar nova rota otimizada para o app
    const response = await api.post('/tickets/app/validate-qr-detailed', {
      qrCode,
      eventId,
    });

    console.log('✅ Validation response (detailed):', response.data);
    
    return {
      valid: response.data.valid,
      ticket: response.data.ticket,
      message: response.data.message || 'QR code validado',
      canCheckIn: response.data.canCheckIn,
    };
  } catch (error: any) {
    console.error('❌ Erro na validação detalhada:', error);
    
    if (error.response?.data) {
      return {
        valid: false,
        message: error.response.data.message || 'QR code inválido',
        error: error.response.data.error,
        canCheckIn: false,
      };
    }
    
    return {
      valid: false,
      message: 'Erro de conexão. Verifique sua internet e tente novamente.',
      error: 'CONNECTION_ERROR',
      canCheckIn: false,
    };
  }
}

export async function getRealtimeEventStats(eventId: string): Promise<CheckinStats> {
  try {
    console.log('📊 Buscando estatísticas aprimoradas (nova rota):', eventId);
    
    // Usar nova rota otimizada para o dashboard do app
    const response = await api.get(`/tickets/app/event/${eventId}/dashboard-stats`);
    
    console.log('✅ Enhanced stats response:', response.data);
    
    return {
      eventId,
      totalTickets: response.data.basicStats?.totalTickets || 0,
      checkedInTickets: response.data.basicStats?.checkedInTickets || 0,
      pendingTickets: response.data.basicStats?.pendingTickets || 0,
      checkinRate: response.data.basicStats?.checkinRate || 0,
      recentCheckIns: response.data.recentActivity || [],
      lastUpdate: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error('❌ Erro ao buscar estatísticas aprimoradas:', error);
    
    // Fallback para rota original se a nova falhar
    try {
      console.log('🔄 Tentando rota original como fallback...');
      const fallbackResponse = await api.get(`/tickets/event/${eventId}/realtime-stats`);
      
      return {
        eventId,
        totalTickets: fallbackResponse.data.totalTickets || 0,
        checkedInTickets: fallbackResponse.data.checkedInTickets || 0,
        pendingTickets: fallbackResponse.data.pendingTickets || 0,
        checkinRate: fallbackResponse.data.checkinRate || 0,
        recentCheckIns: fallbackResponse.data.recentCheckIns || [],
        lastUpdate: new Date().toISOString(),
      };
    } catch (fallbackError) {
      console.error('❌ Erro também na rota de fallback:', fallbackError);
      
      return {
        eventId,
        totalTickets: 0,
        checkedInTickets: 0,
        pendingTickets: 0,
        checkinRate: 0,
        recentCheckIns: [],
        lastUpdate: new Date().toISOString(),
      };
    }
  }
}

export async function getUserTickets(): Promise<Ticket[]> {
  try {
    console.log('🎫 Buscando tickets do usuário...');
    
    const response = await api.get('/tickets/user');
    
    console.log('✅ User tickets response:', response.data);
    
    return response.data || [];
  } catch (error: any) {
    console.error('❌ Erro ao buscar tickets:', error);
    return [];
  }
}

export async function getTicketById(ticketId: string): Promise<Ticket | null> {
  try {
    console.log('🎫 Buscando ticket por ID:', ticketId);
    
    const response = await api.get(`/tickets/${ticketId}`);
    
    console.log('✅ Ticket response:', response.data);
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Erro ao buscar ticket:', error);
    return null;
  }
}

export async function getUserTicketsGroupedByEvent(): Promise<any[]> {
  try {
    console.log('🎫 Buscando tickets agrupados por evento...');
    
    const response = await api.get('/tickets/user/grouped');
    
    console.log('✅ Grouped tickets response:', response.data);
    
    return response.data || [];
  } catch (error: any) {
    console.error('❌ Erro ao buscar tickets agrupados:', error);
    return [];
  }
}

export async function rejectCheckIn(
  qrCode: string, 
  eventId: string, 
  reason?: string
): Promise<{ success: boolean; message: string }> {
  try {
    console.log('❌ Registrando rejeição de check-in:', { qrCode, eventId, reason });
    
    const response = await api.post('/tickets/app/reject-checkin', {
      qrCode,
      eventId,
      reason: reason || 'Rejeitado manualmente pelo organizador',
      rejectedBy: 'App Mobile',
    });

    console.log('✅ Rejection logged:', response.data);
    
    return {
      success: response.data.success || true,
      message: response.data.message || 'Rejeição registrada com sucesso',
    };
  } catch (error: any) {
    console.error('❌ Erro ao registrar rejeição:', error);
    
    return {
      success: false,
      message: 'Erro ao registrar rejeição',
    };
  }
}

export async function getTicketDetailsByQR(
  qrCode: string, 
  eventId?: string
): Promise<Ticket | null> {
  try {
    console.log('🔍 Buscando detalhes do ticket por QR:', { qrCode, eventId });
    
    const url = `/tickets/app/ticket-details/${encodeURIComponent(qrCode)}`;
    const params = eventId ? { eventId } : {};
    
    const response = await api.get(url, { params });
    
    console.log('✅ Ticket details response:', response.data);
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Erro ao buscar detalhes do ticket:', error);
    return null;
  }
}

// Utility functions
export function formatCheckInTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStatusColor(status: TicketStatus): string {
  switch (status) {
    case TicketStatus.ACTIVE:
      return '#00D4AA';
    case TicketStatus.USED:
      return '#8B93A1';
    case TicketStatus.CANCELLED:
      return '#FF6B6B';
    case TicketStatus.EXPIRED:
      return '#F59E0B';
    case TicketStatus.PENDING:
      return '#6B7280';
    case TicketStatus.REFUNDED:
      return '#FFB800';
    default:
      return '#8B93A1';
  }
}

export function getStatusText(status: TicketStatus): string {
  switch (status) {
    case TicketStatus.ACTIVE:
      return 'ATIVO';
    case TicketStatus.USED:
      return 'UTILIZADO';
    case TicketStatus.CANCELLED:
      return 'CANCELADO';
    case TicketStatus.EXPIRED:
      return 'EXPIRADO';
    case TicketStatus.PENDING:
      return 'PENDENTE';
    case TicketStatus.REFUNDED:
      return 'REEMBOLSADO';
    default:
      return 'DESCONHECIDO';
  }
}

// Service object for compatibility
export const ticketsService = {
  getUserTickets,
  getTicketById,
  getUserTicketsGroupedByEvent,
  checkInTicket,
  validateTicketQR,
  getRealtimeEventStats,
  formatDate,
  formatTime,
  formatCheckInTime,
  getStatusColor,
  getStatusText,
};

export default ticketsService; 