import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { 
  Ticket, 
  ticketsService, 
  CheckInResult, 
  QRValidationResult,
  CheckinStats 
} from '../services/ticketsService';
import { useAuth } from '../contexts/AuthContext';

interface UseTicketsReturn {
  tickets: Ticket[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  loadTickets: () => Promise<void>;
  refreshTickets: () => Promise<void>;
  getTicketById: (ticketId: string) => Promise<Ticket | null>;
  validateQR: (qrCode: string, eventId?: string) => Promise<QRValidationResult>;
  checkInTicket: (qrCode: string, eventId: string) => Promise<CheckInResult>;
  getEventStats: (eventId: string) => Promise<CheckinStats>;
}

export const useTickets = (): UseTicketsReturn => {
  const { isAuthenticated } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTickets = useCallback(async () => {
    if (!isAuthenticated) {
      setTickets([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log('🎫 Carregando tickets do usuário...');
      
      const userTickets = await ticketsService.getUserTickets();
      const validTickets = Array.isArray(userTickets) 
        ? userTickets.filter(ticket => ticket && ticket.id) 
        : [];
      
      setTickets(validTickets);
      console.log(`✅ ${validTickets.length} tickets carregados com sucesso`);
      
    } catch (err: any) {
      console.error('❌ Erro ao carregar tickets:', err);
      setError(err.message || 'Erro ao carregar ingressos');
      
      // Não mostrar alert se for erro de rede comum
      if (!err.message?.includes('Network Error') && !err.message?.includes('timeout')) {
        Alert.alert('Erro', 'Não foi possível carregar seus ingressos.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  const refreshTickets = useCallback(async () => {
    setRefreshing(true);
    await loadTickets();
  }, [loadTickets]);

  const getTicketById = useCallback(async (ticketId: string): Promise<Ticket | null> => {
    try {
      console.log('🎫 Buscando ticket por ID:', ticketId);
      
      const ticket = await ticketsService.getTicketById(ticketId);
      
      if (ticket) {
        console.log('✅ Ticket encontrado:', ticket.id);
      } else {
        console.log('⚠️ Ticket não encontrado');
      }
      
      return ticket;
    } catch (err: any) {
      console.error('❌ Erro ao buscar ticket:', err);
      return null;
    }
  }, []);

  const validateQR = useCallback(async (qrCode: string, eventId?: string): Promise<QRValidationResult> => {
    try {
      console.log('🔍 Validando QR code:', qrCode);
      
      const result = await ticketsService.validateTicketQR(qrCode, eventId);
      
      console.log('✅ Resultado da validação:', result);
      return result;
      
    } catch (err: any) {
      console.error('❌ Erro na validação de QR:', err);
      
      return {
        valid: false,
        message: err.message || 'Erro ao validar QR code',
        error: 'VALIDATION_ERROR',
      };
    }
  }, []);

  const checkInTicket = useCallback(async (qrCode: string, eventId: string): Promise<CheckInResult> => {
    try {
      console.log('🎫 Fazendo check-in do ticket:', qrCode);
      
      const result = await ticketsService.checkInTicket(qrCode, eventId);
      
      console.log('✅ Resultado do check-in:', result);
      
      // Recarregar tickets se o check-in foi bem-sucedido
      if (result.success) {
        await loadTickets();
      }
      
      return result;
      
    } catch (err: any) {
      console.error('❌ Erro no check-in:', err);
      
      return {
        success: false,
        message: err.message || 'Erro ao fazer check-in',
        error: 'CHECKIN_ERROR',
      };
    }
  }, [loadTickets]);

  const getEventStats = useCallback(async (eventId: string): Promise<CheckinStats> => {
    try {
      console.log('📊 Buscando estatísticas do evento:', eventId);
      
      const stats = await ticketsService.getRealtimeEventStats(eventId);
      
      console.log('✅ Estatísticas carregadas:', stats);
      return stats;
      
    } catch (err: any) {
      console.error('❌ Erro ao buscar estatísticas:', err);
      
      // Retornar estatísticas vazias em caso de erro
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
  }, []);

  // Carregar tickets quando o hook é inicializado
  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  return {
    tickets,
    loading,
    refreshing,
    error,
    loadTickets,
    refreshTickets,
    getTicketById,
    validateQR,
    checkInTicket,
    getEventStats,
  };
};

export default useTickets; 