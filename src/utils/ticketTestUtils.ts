import { checkInTicket, validateTicketQR, getRealtimeEventStats, getUserTickets } from '../services/ticketsService';

/**
 * Utilitários para testar as funções de tickets
 */
export class TicketTestUtils {
  
  /**
   * Testa a conexão com a API de tickets
   */
  static async testApiConnection(): Promise<boolean> {
    try {
      console.log('🧪 Testando conexão com API de tickets...');
      
      // Tenta buscar tickets do usuário
      const tickets = await getUserTickets();
      console.log('✅ Conexão com API funcionando. Tickets encontrados:', tickets.length);
      
      return true;
    } catch (error) {
      console.error('❌ Erro na conexão com API:', error);
      return false;
    }
  }

  /**
   * Testa a validação de QR code
   */
  static async testQRValidation(qrCode: string, eventId?: string): Promise<void> {
    try {
      console.log('🧪 Testando validação de QR code...');
      
      const result = await validateTicketQR(qrCode, eventId);
      console.log('✅ Resultado da validação:', result);
      
    } catch (error) {
      console.error('❌ Erro na validação de QR:', error);
    }
  }

  /**
   * Testa o check-in de ticket
   */
  static async testCheckIn(qrCode: string, eventId: string): Promise<void> {
    try {
      console.log('🧪 Testando check-in de ticket...');
      
      const result = await checkInTicket(qrCode, eventId);
      console.log('✅ Resultado do check-in:', result);
      
    } catch (error) {
      console.error('❌ Erro no check-in:', error);
    }
  }

  /**
   * Testa as estatísticas do evento
   */
  static async testEventStats(eventId: string): Promise<void> {
    try {
      console.log('🧪 Testando estatísticas do evento...');
      
      const stats = await getRealtimeEventStats(eventId);
      console.log('✅ Estatísticas do evento:', stats);
      
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas:', error);
    }
  }

  /**
   * Executa todos os testes
   */
  static async runAllTests(eventId: string, qrCode: string): Promise<void> {
    console.log('🚀 Iniciando testes completos do sistema de tickets...');
    
    // Teste 1: Conexão com API
    await this.testApiConnection();
    
    // Teste 2: Validação de QR
    await this.testQRValidation(qrCode, eventId);
    
    // Teste 3: Estatísticas do evento
    await this.testEventStats(eventId);
    
    // Teste 4: Check-in (comentado para não fazer check-in real)
    // await this.testCheckIn(qrCode, eventId);
    
    console.log('✅ Testes completos finalizados!');
  }

  /**
   * Gera dados mock para testes
   */
  static generateMockData() {
    return {
      eventId: 'test-event-' + Date.now(),
      qrCode: 'test-qr-' + Date.now(),
      ticketId: 'test-ticket-' + Date.now(),
    };
  }
}

export default TicketTestUtils; 