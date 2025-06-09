import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import CustomNotificationService, { EventNotificationData } from './CustomNotificationService';

interface EventWithTickets {
  id: string;
  title: string;
  date: string;
  location: string;
  imageUrl: string;
  hasUserTicket: boolean;
}

interface ScheduledNotification {
  eventId: string;
  userId: string;
  scheduledTime: string;
  sent: boolean;
}

export class AutoRatingNotificationService {
  private static instance: AutoRatingNotificationService;
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly STORAGE_KEY = 'scheduled_rating_notifications';

  static getInstance(): AutoRatingNotificationService {
    if (!AutoRatingNotificationService.instance) {
      AutoRatingNotificationService.instance = new AutoRatingNotificationService();
    }
    return AutoRatingNotificationService.instance;
  }

  /**
   * 🚀 Inicializar sistema de notificações automáticas
   */
  async initialize(): Promise<void> {
    try {
      console.log('🔔 Inicializando sistema de notificações automáticas...');
      
      // Verificar imediatamente ao inicializar
      await this.checkForNotifications();
      
      // Verificar a cada 30 minutos
      this.checkInterval = setInterval(async () => {
        await this.checkForNotifications();
      }, 30 * 60 * 1000); // 30 minutos
      
      console.log('✅ Sistema de notificações automáticas inicializado');
    } catch (error) {
      console.error('❌ Erro ao inicializar notificações automáticas:', error);
    }
  }

  /**
   * 🎫 Verificar eventos que o usuário participou e agendar notificações
   */
  async scheduleNotificationsForUserTickets(userId: string): Promise<void> {
    try {
      console.log('🎫 Verificando tickets do usuário para agendar notificações...');
      
      // Buscar todos os tickets do usuário
      const response = await api.get('/tickets/user');
      const userTickets = response.data;
      
      console.log(`📋 Encontrados ${userTickets.length} tickets do usuário`);
      
      for (const ticket of userTickets) {
        const event = ticket.event;
        if (!event || !event.date) continue;
        
        const eventDate = new Date(event.date);
        const now = new Date();
        
        // Verificar se o evento já aconteceu
        if (eventDate < now) {
          const timeSinceEvent = now.getTime() - eventDate.getTime();
          const hoursSinceEvent = timeSinceEvent / (1000 * 60 * 60);
          
          // Se passou mais de 24h, agendar notificação
          if (hoursSinceEvent >= 24) {
            await this.scheduleNotification(event.id, userId, event);
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
  private async scheduleNotification(eventId: string, userId: string, event: any): Promise<void> {
    try {
      // Verificar se já foi agendada
      const existing = await this.getScheduledNotifications();
      const alreadyScheduled = existing.find(n => 
        n.eventId === eventId && n.userId === userId
      );
      
      if (alreadyScheduled) {
        console.log(`📅 Notificação já agendada para evento ${eventId}`);
        return;
      }
      
      // Verificar se usuário já avaliou
      const hasReviewed = await this.checkIfUserReviewed(eventId, userId);
      if (hasReviewed) {
        console.log(`⭐ Usuário já avaliou evento ${eventId}`);
        return;
      }
      
      // Agendar notificação
      const scheduledTime = new Date(event.date);
      scheduledTime.setHours(scheduledTime.getHours() + 24);
      
      const notification: ScheduledNotification = {
        eventId,
        userId,
        scheduledTime: scheduledTime.toISOString(),
        sent: false
      };
      
      await this.saveScheduledNotification(notification);
      console.log(`📅 Notificação agendada para ${scheduledTime.toLocaleString()}`);
      
    } catch (error) {
      console.error('❌ Erro ao agendar notificação:', error);
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
      console.error('❌ Erro ao verificar notificações:', error);
    }
  }

  /**
   * 📱 Enviar notificação de avaliação
   */
  private async sendNotification(notification: ScheduledNotification): Promise<void> {
    try {
      console.log(`📱 Enviando notificação para evento ${notification.eventId}...`);
      
      // Buscar dados do evento
      const eventResponse = await api.get(`/events/${notification.eventId}`);
      const event = eventResponse.data;
      
      // Verificar novamente se não avaliou
      const hasReviewed = await this.checkIfUserReviewed(notification.eventId, notification.userId);
      if (hasReviewed) {
        console.log(`⭐ Usuário já avaliou evento - cancelando notificação`);
        await this.markNotificationAsSent(notification);
        return;
      }
      
      // Preparar dados da notificação
      const eventData: EventNotificationData = {
        eventId: event.id,
        eventTitle: event.title,
        eventImage: event.imageUrl || event.images?.[0] || 'https://picsum.photos/400/300?random=1',
        eventDate: this.formatEventDate(event.date),
        eventLocation: event.location,
      };
      
      // Enviar notificação nativa
      await CustomNotificationService.getInstance().showEventRatingNotification(eventData, () => {
        console.log('📱 Usuário clicou na notificação automática');
        // Navegação será tratada pelo CustomNotificationService
      });
      
      // Marcar como enviada
      await this.markNotificationAsSent(notification);
      
      console.log('✅ Notificação automática enviada com sucesso');
      
    } catch (error) {
      console.error('❌ Erro ao enviar notificação automática:', error);
    }
  }

  /**
   * 🔍 Verificar se usuário já avaliou o evento
   */
  private async checkIfUserReviewed(eventId: string, userId: string): Promise<boolean> {
    try {
      const response = await api.get('/social/reviews/my-reviews');
      const myReviews = response.data;
      
      return myReviews.some((review: any) => 
        review.event?.id === eventId || review.eventId === eventId
      );
    } catch (error) {
      console.log('ℹ️ Erro ao verificar avaliações - assumindo não avaliado');
      return false;
    }
  }

  /**
   * 💾 Salvar notificação agendada
   */
  private async saveScheduledNotification(notification: ScheduledNotification): Promise<void> {
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
  private async getScheduledNotifications(): Promise<ScheduledNotification[]> {
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
  private async markNotificationAsSent(notification: ScheduledNotification): Promise<void> {
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
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  /**
   * 🧹 Limpar sistema (para desenvolvimento)
   */
  async clearAllScheduledNotifications(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      console.log('🧹 Notificações agendadas limpas');
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

export const autoRatingNotificationService = AutoRatingNotificationService.getInstance(); 