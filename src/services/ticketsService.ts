import api from './api';

export enum TicketStatus {
  ACTIVE = 'ACTIVE',
  USED = 'USED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export interface Ticket {
  id: string;
  eventId: string;
  buyerId: string;
  price: number;
  purchaseDate: string;
  status: TicketStatus;
  qrCode: string;
  checkInDate?: string;
  batchId: string;
  billingId?: string;
  event?: {
    id: string;
    title: string;
    description: string;
    date: string;
    imageUrl: string;
    venue?: {
      id: string;
      name: string;
      address: string;
      city: string;
      state: string;
    };
  };
  ticketBatch?: {
    id: string;
    name: string;
    description?: string;
    price: number;
  };
  buyer?: {
    id: string;
    name: string;
    email: string;
  };
  coupon?: {
    id: string;
    code: string;
    discount: number;
  };
}

export interface TicketGroupedByEvent {
  event: Ticket['event'];
  tickets: Ticket[];
  totalSpent: number;
  totalTickets: number;
}

export interface TicketStats {
  totalTickets: number;
  activeTickets: number;
  usedTickets: number;
  cancelledTickets: number;
  totalSpent: number;
  upcomingEvents: number;
  pastEvents: number;
}

export interface TicketValidationResult {
  valid: boolean;
  ticket?: Ticket;
  message: string;
  canUse: boolean;
}

export interface CheckInResult {
  success: boolean;
  message: string;
  ticket?: TicketCheckinInfo;
  error?: string;
  alreadyUsed?: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    profileImage?: string;
  };
}

export interface CheckinStats {
  eventId: string;
  totalTickets: number;
  checkedInTickets: number;
  pendingTickets: number;
  checkinRate: number;
  recentCheckIns: Array<{
    ticketId: string;
    userName: string;
    userEmail: string;
    checkedInAt: string;
  }>;
  lastUpdate: string;
}

export interface QRValidationResult {
  valid: boolean;
  ticket?: Ticket;
  message: string;
  canUse: boolean;
  alreadyUsed?: boolean;
  error?: string;
}

export interface TicketCheckinInfo {
  id: string;
  status: string;
  checkedInAt: string | null;
  purchaseDate: string;
  price: number;
  event: {
    id: string;
    title: string;
    date: string;
    location: string;
    venue?: any;
  };
  user: {
    id: string;
    name: string;
    email: string;
    profileImage?: string;
  };
  ticketBatch: {
    id: string;
    name: string;
    price: number;
  } | null;
}

export interface CheckinResponse {
  success: boolean;
  message: string;
  ticket: TicketCheckinInfo;
}

class TicketsService {
  private baseUrl = '/tickets';

  /**
   * Get all tickets for current user
   */
  async getUserTickets(): Promise<Ticket[]> {
    try {
      const response = await api.get(`${this.baseUrl}/my`);
      return response.data;
    } catch (error) {
      console.error('Failed to get user tickets:', error);
      throw new Error('Não foi possível carregar seus ingressos');
    }
  }

  /**
   * Get user tickets grouped by event
   */
  async getUserTicketsGrouped(): Promise<TicketGroupedByEvent[]> {
    try {
      const response = await api.get(`${this.baseUrl}/my/grouped`);
      return response.data;
    } catch (error) {
      console.error('Failed to get user tickets grouped:', error);
      throw new Error('Não foi possível carregar os eventos');
    }
  }

  /**
   * Get user ticket statistics
   */
  async getUserTicketStats(): Promise<TicketStats> {
    try {
      const response = await api.get(`${this.baseUrl}/my/stats`);
      return response.data;
    } catch (error) {
      console.error('Failed to get user ticket stats:', error);
      throw new Error('Não foi possível carregar as estatísticas');
    }
  }

  /**
   * Get single ticket details
   */
  async getTicket(ticketId: string): Promise<Ticket> {
    try {
      const response = await api.get(`${this.baseUrl}/${ticketId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get ticket:', error);
      throw new Error('Não foi possível carregar o ingresso');
    }
  }

  /**
   * Get ticket check-in info (same as web frontend)
   */
  async getTicketCheckinInfo(ticketId: string): Promise<TicketCheckinInfo> {
    try {
      console.log('🔍 Getting ticket check-in info for ID:', ticketId);
      const response = await api.get(`${this.baseUrl}/${ticketId}/checkin-info`);
      console.log('✅ Ticket check-in info response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to get ticket check-in info:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      throw error;
    }
  }

  /**
   * Perform check-in using ticket ID (same as web frontend)
   */
  async performCheckinByTicketId(ticketId: string): Promise<CheckinResponse> {
    try {
      console.log('🎫 Performing check-in for ticket ID:', ticketId);
      const response = await api.post(`${this.baseUrl}/${ticketId}/checkin`);
      console.log('✅ Check-in response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to perform check-in:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      throw error;
    }
  }

  /**
   * Check-in ticket - EXACT SAME LOGIC AS WEB FRONTEND
   */
  async checkInTicket(qrCode: string, eventId: string): Promise<CheckInResult> {
    try {
      console.log('🎯 Starting check-in process:', { qrCode, eventId });
      
      // In our system, QR Code = Ticket ID (same as web frontend)
      const ticketId = qrCode.trim();
      console.log('🎫 Using QR code as ticket ID:', ticketId);
      
      // Step 1: Get ticket check-in info (same as web frontend)
      console.log('📋 Step 1: Getting ticket check-in info...');
      
      let ticketData;
      try {
        ticketData = await this.getTicketCheckinInfo(ticketId);
      } catch (error: any) {
        // Handle specific errors like web frontend
        if (error.response?.status === 404) {
          return {
            success: false,
            message: 'Ingresso não encontrado. Verifique se o QR code está correto.',
            error: 'NOT_FOUND',
          };
        } else if (error.response?.status === 403) {
          return {
            success: false,
            message: 'Você não tem permissão para fazer check-in neste evento.',
            error: 'PERMISSION_DENIED',
          };
        } else {
          return {
            success: false,
            message: error.response?.data?.message || 'Erro ao processar o ingresso.',
            error: 'PROCESSING_ERROR',
          };
        }
      }

      console.log('✅ Got ticket data:', ticketData);

      // Step 2: Validate ticket (same logic as web frontend)
      if (ticketData.event.id !== eventId) {
        return {
          success: false,
          message: 'Este ingresso não pertence a este evento.',
          error: 'WRONG_EVENT',
          ticket: ticketData,
        };
      }

      if (ticketData.status !== 'ACTIVE') {
        return {
          success: false,
          message: 'Este ingresso não está ativo ou foi cancelado.',
          error: 'INACTIVE_TICKET',
          ticket: ticketData,
        };
      }

      if (ticketData.checkedInAt) {
        const checkinDate = new Date(ticketData.checkedInAt);
        return {
          success: false,
          message: `Check-in já foi realizado em ${checkinDate.toLocaleDateString('pt-BR')} às ${checkinDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.`,
          error: 'ALREADY_CHECKED_IN',
          ticket: ticketData,
          alreadyUsed: true,
        };
      }

      // Step 3: Perform actual check-in (same as web frontend)
      console.log('🎫 Step 2: Performing check-in...');
      const checkinResult = await this.performCheckinByTicketId(ticketId);

      return {
        success: checkinResult.success,
        message: checkinResult.success 
          ? `Check-in realizado com sucesso para ${ticketData.user.name}!`
          : checkinResult.message,
        ticket: checkinResult.ticket || ticketData,
        user: ticketData.user,
      };

    } catch (error: any) {
      console.error('❌ Check-in process failed:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao fazer check-in',
        error: 'UNKNOWN_ERROR',
      };
    }
  }

  /**
   * Cancel ticket
   */
  async cancelTicket(ticketId: string): Promise<void> {
    try {
      await api.delete(`${this.baseUrl}/${ticketId}`);
    } catch (error) {
      console.error('Failed to cancel ticket:', error);
      throw new Error('Não foi possível cancelar o ingresso');
    }
  }

  /**
   * Get ticket status color
   */
  getStatusColor(status: TicketStatus): string {
    switch (status) {
      case TicketStatus.ACTIVE:
        return '#10B981'; // Green
      case TicketStatus.USED:
        return '#6B7280'; // Gray
      case TicketStatus.CANCELLED:
        return '#EF4444'; // Red
      case TicketStatus.REFUNDED:
        return '#F59E0B'; // Orange
      default:
        return '#6B7280';
    }
  }

  /**
   * Get ticket status text
   */
  getStatusText(status: TicketStatus): string {
    switch (status) {
      case TicketStatus.ACTIVE:
        return 'Ativo';
      case TicketStatus.USED:
        return 'Utilizado';
      case TicketStatus.CANCELLED:
        return 'Cancelado';
      case TicketStatus.REFUNDED:
        return 'Reembolsado';
      default:
        return 'Desconhecido';
    }
  }

  /**
   * Check if ticket is valid for use
   */
  isTicketValid(ticket: Ticket): boolean {
    return ticket.status === TicketStatus.ACTIVE;
  }

  /**
   * Check if event is upcoming
   */
  isEventUpcoming(ticket: Ticket): boolean {
    const eventDate = new Date(ticket.event?.date || '');
    const now = new Date();
    return eventDate > now;
  }

  /**
   * Format ticket price
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  /**
   * Format time for display
   */
  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Get relative time until event
   */
  getTimeUntilEvent(eventDate: string): string {
    const date = new Date(eventDate);
    const now = new Date();
    const diffInMs = date.getTime() - now.getTime();
    
    if (diffInMs < 0) {
      return 'Evento finalizado';
    }

    const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffInMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `Em ${days} ${days === 1 ? 'dia' : 'dias'}`;
    } else if (hours > 0) {
      return `Em ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    } else {
      return 'Evento hoje';
    }
  }

  /**
   * Get real-time check-in stats for event
   */
  async getCheckinStats(eventId: string): Promise<CheckinStats> {
    try {
      const response = await api.get(`${this.baseUrl}/event/${eventId}/checkin-stats`);
      return response.data;
    } catch (error) {
      console.error('Failed to get checkin stats:', error);
      throw error;
    }
  }

  /**
   * Get event tickets (for admin/organizer)
   */
  async getEventTickets(eventId: string): Promise<Ticket[]> {
    try {
      const response = await api.get(`${this.baseUrl}?eventId=${eventId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get event tickets for ${eventId}:`, error);
      throw error;
    }
  }

  /**
   * Get real-time event stats - OPTIMIZED for continuous updates
   */
  async getRealtimeEventStats(eventId: string): Promise<CheckinStats> {
    try {
      console.log('Making realtime stats request for event:', eventId);
      const response = await api.get(`${this.baseUrl}/event/${eventId}/realtime-stats`);
      console.log('Realtime stats response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Failed to get realtime stats:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Return mock data for development/testing instead of throwing
      return {
        eventId,
        totalTickets: 150,
        checkedInTickets: 47,
        pendingTickets: 103,
        checkinRate: 31.3,
        recentCheckIns: [
          {
            ticketId: 'ticket-1',
            userName: 'João Silva',
            userEmail: 'joao@example.com',
            checkedInAt: new Date().toISOString(),
          },
          {
            ticketId: 'ticket-2',
            userName: 'Maria Santos',
            userEmail: 'maria@example.com',
            checkedInAt: new Date(Date.now() - 60000).toISOString(),
          },
        ],
        lastUpdate: new Date().toISOString(),
      };
    }
  }

  /**
   * Bulk check-in for multiple tickets (future feature)
   */
  async bulkCheckIn(qrCodes: string[], eventId: string): Promise<CheckInResult[]> {
    try {
      const response = await api.post('/tickets/bulk-checkin', {
        qrCodes,
        eventId,
      });
      return response.data;
    } catch (error) {
      console.error('Failed bulk check-in:', error);
      throw error;
    }
  }
}

export const ticketsService = new TicketsService();
export default ticketsService;

// Export individual functions for direct import
export const checkInTicket = (qrCode: string, eventId: string) => 
  ticketsService.checkInTicket(qrCode, eventId);

export const getRealtimeEventStats = (eventId: string) => 
  ticketsService.getRealtimeEventStats(eventId);

export const getCheckinStats = (eventId: string) => 
  ticketsService.getCheckinStats(eventId);

export const getEventTickets = (eventId: string) => 
  ticketsService.getEventTickets(eventId);

export const bulkCheckIn = (qrCodes: string[], eventId: string) => 
  ticketsService.bulkCheckIn(qrCodes, eventId);

export const getTicketCheckinInfo = (ticketId: string) =>
  ticketsService.getTicketCheckinInfo(ticketId);

export const getStatusColor = (status: TicketStatus | string) => {
  if (typeof status === 'string') {
    switch (status) {
      case 'ACTIVE':
        return '#10B981';
      case 'USED':
        return '#6B7280';
      case 'CANCELLED':
        return '#EF4444';
      case 'REFUNDED':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  }
  return ticketsService.getStatusColor(status);
};

export const formatTicketStatus = (status: TicketStatus | string) => {
  if (typeof status === 'string') {
    switch (status) {
      case 'ACTIVE':
        return 'Ativo';
      case 'USED':
        return 'Utilizado';
      case 'CANCELLED':
        return 'Cancelado';
      case 'REFUNDED':
        return 'Reembolsado';
      default:
        return status;
    }
  }
  return ticketsService.getStatusText(status);
};

export const formatCheckInTime = (checkInDate?: string): string => {
  if (!checkInDate) return '-';
  
  const date = new Date(checkInDate);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}; 