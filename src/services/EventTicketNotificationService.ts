import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import CustomNotificationService from './CustomNotificationService';

interface EventTicket {
  id: string;
  eventId: string;
  buyerId: string;
  status: string;
  event: {
    id: string;
    title: string;
    date: string;
    location: string;
    imageUrl?: string;
  };
  billing?: {
    status: string;
  };
}

interface ScheduledTicketNotification {
  eventId: string;
  userId: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  scheduledTime: string;
  sent: boolean;
  ticketCount: number;
}

export class EventTicketNotificationService {
  private static instance: EventTicketNotificationService;
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly STORAGE_KEY = 'scheduled_ticket_notifications';

  static getInstance(): EventTicketNotificationService {
    if (!EventTicketNotificationService.instance) {
      EventTicketNotificationService.instance = new EventTicketNotificationService();
    }
    return EventTicketNotificationService.instance;
  }

  /**
   * 🚀 Inicializar sistema de notificações de ingressos
   */
  async initialize(): Promise<void> {
    try {
      console.log('🎫 Inicializando sistema de notificações de ingressos...');
      
      // Verificar imediatamente ao inicializar
      await this.checkForNotifications();
      
      // Verificar a cada 15 minutos (mais frequente pois é 1h antes)
      this.checkInterval = setInterval(async () => {
        await this.checkForNotifications();
      }, 15 * 60 * 1000); // 15 minutos
      
      console.log('✅ Sistema de notificações de ingressos inicializado');
    } catch (error) {
      console.error('❌ Erro ao inicializar notificações de ingressos:', error);
    }
  }

  /**
   * 🎫 Verificar tickets do usuário e agendar notificações
   */
  async scheduleNotificationsForUserTickets(userId: string): Promise<void> {
    try {
      console.log('🎫 Verificando tickets do usuário para notificações pré-evento...');
      
      // Buscar todos os tickets do usuário
      const response = await api.get('/tickets/user');
      const userTickets: EventTicket[] = response.data;
      
      console.log(`📋 Encontrados ${userTickets.length} tickets do usuário`);
      
      for (const ticket of userTickets) {
        const event = ticket.event;
        if (!event || !event.date) continue;
        
        // Verificar se ticket está ativo e pago
        const isActiveTicket = ticket.status === 'ACTIVE';
        const isPaidBilling = ticket.billing?.status === 'PAID';
        
        if (!isActiveTicket || !isPaidBilling) continue;
        
        const eventDate = new Date(event.date);
        const now = new Date();
        
        // Verificar se o evento é futuro (ainda não aconteceu)
        if (eventDate > now) {
          // Calcular horário para notificação (1 hora antes)
          const notificationTime = new Date(eventDate.getTime() - 60 * 60 * 1000); // 1 hora antes
          
          // Se a notificação ainda não passou, agendar
          if (notificationTime > now) {
            await this.scheduleNotification(event.id, userId, event, notificationTime);
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Erro ao verificar tickets para notificações:', error);
    }
  }

  /**
   * ⏰ Agendar notificação para um evento específico
   */
  private async scheduleNotification(
    eventId: string, 
    userId: string, 
    event: any, 
    notificationTime: Date
  ): Promise<void> {
    try {
      // Verificar se já foi agendada
      const existing = await this.getScheduledNotifications();
      const alreadyScheduled = existing.find(n => 
        n.eventId === eventId && n.userId === userId
      );
      
      if (alreadyScheduled) {
        console.log(`📅 Notificação já agendada para evento ${event.title}`);
        return;
      }
      
      // Contar quantos ingressos o usuário tem para este evento
      const ticketResponse = await api.get('/tickets/user');
      const eventTickets = ticketResponse.data.filter((ticket: EventTicket) => 
        ticket.event?.id === eventId && 
        ticket.status === 'ACTIVE' && 
        ticket.billing?.status === 'PAID'
      );
      
      // Agendar notificação
      const notification: ScheduledTicketNotification = {
        eventId,
        userId,
        eventTitle: event.title,
        eventDate: event.date,
        eventLocation: event.location,
        scheduledTime: notificationTime.toISOString(),
        sent: false,
        ticketCount: eventTickets.length
      };
      
      await this.saveScheduledNotification(notification);
      console.log(`📅 Notificação de ingresso agendada para ${notificationTime.toLocaleString()}`);
      console.log(`🎫 ${eventTickets.length} ingresso(s) para: ${event.title}`);
      
    } catch (error) {
      console.error('❌ Erro ao agendar notificação de ingresso:', error);
    }
  }

  /**
   * 🔍 Verificar notificações que devem ser enviadas
   */
  private async checkForNotifications(): Promise<void> {
    try {
      const scheduled = await this.getScheduledNotifications();
      const now = new Date();
      
      for (const notification of scheduled) {
        if (notification.sent) continue;
        
        const scheduledTime = new Date(notification.scheduledTime);
        
        // Se chegou a hora, enviar notificação
        if (now >= scheduledTime) {
          await this.sendNotification(notification);
        }
      }
      
    } catch (error) {
      console.error('❌ Erro ao verificar notificações de ingressos:', error);
    }
  }

  /**
   * 📱 Enviar notificação de ingresso
   */
  private async sendNotification(notification: ScheduledTicketNotification): Promise<void> {
    try {
      console.log(`📱 Enviando notificação de ingresso para evento ${notification.eventTitle}...`);
      
      // Buscar dados atualizados do evento
      const eventResponse = await api.get(`/events/${notification.eventId}`);
      const event = eventResponse.data;
      
      // Verificar se ainda tem ingressos válidos
      const ticketResponse = await api.get('/tickets/user');
      const eventTickets = ticketResponse.data.filter((ticket: EventTicket) => 
        ticket.event?.id === notification.eventId && 
        ticket.status === 'ACTIVE' && 
        ticket.billing?.status === 'PAID'
      );
      
      if (eventTickets.length === 0) {
        console.log(`🎫 Não há mais ingressos válidos - cancelando notificação`);
        await this.markNotificationAsSent(notification);
        return;
      }
      
      // Preparar dados da notificação
      const eventImage = event.imageUrl || event.images?.[0] || 'https://picsum.photos/400/300?random=1';
      const eventTime = this.formatEventTime(event.date);
      
      // Enviar notificação nativa
      const notificationService = CustomNotificationService.getInstance();
      
      await notificationService.showEventTicketNotification({
        eventId: event.id,
        eventTitle: event.title,
        eventImage: eventImage,
        eventDate: this.formatEventDate(event.date),
        eventTime: eventTime,
        eventLocation: event.location,
        ticketCount: eventTickets.length
      });
      
      // Marcar como enviada
      await this.markNotificationAsSent(notification);
      
      console.log('✅ Notificação de ingresso enviada com sucesso');
      
    } catch (error) {
      console.error('❌ Erro ao enviar notificação de ingresso:', error);
    }
  }

  /**
   * 💾 Salvar notificação agendada
   */
  private async saveScheduledNotification(notification: ScheduledTicketNotification): Promise<void> {
    try {
      const existing = await this.getScheduledNotifications();
      existing.push(notification);
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(existing));
    } catch (error) {
      console.error('❌ Erro ao salvar notificação agendada:', error);
    }
  }

  /**
   * 📋 Buscar notificações agendadas
   */
  private async getScheduledNotifications(): Promise<ScheduledTicketNotification[]> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('❌ Erro ao buscar notificações agendadas:', error);
      return [];
    }
  }

  /**
   * ✅ Marcar notificação como enviada
   */
  private async markNotificationAsSent(notification: ScheduledTicketNotification): Promise<void> {
    try {
      const scheduled = await this.getScheduledNotifications();
      const index = scheduled.findIndex(n => 
        n.eventId === notification.eventId && n.userId === notification.userId
      );
      
      if (index !== -1) {
        scheduled[index].sent = true;
        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(scheduled));
      }
    } catch (error) {
      console.error('❌ Erro ao marcar notificação como enviada:', error);
    }
  }

  /**
   * 📅 Formatar data do evento
   */
  private formatEventDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    });
  }

  /**
   * 🕐 Formatar horário do evento
   */
  private formatEventTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * 🧹 Limpar notificações antigas (para desenvolvimento)
   */
  async clearAllScheduledNotifications(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      console.log('🧹 Notificações de ingressos limpas');
    } catch (error) {
      console.error('❌ Erro ao limpar notificações:', error);
    }
  }

  /**
   * 🔄 Parar sistema
   */
  destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

export const eventTicketNotificationService = EventTicketNotificationService.getInstance(); 