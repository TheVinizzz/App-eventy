import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ScheduledNotification {
  id: string;
  eventId: string;
  userId: string;
  eventTitle: string;
  scheduledDate: string;
  type: 'rating_request' | 'event_reminder' | 'event_update';
  sent: boolean;
}

// Configurar como as notificações devem ser apresentadas
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  private static instance: NotificationService;
  private readonly NOTIFICATIONS_KEY = '@eventy_notifications';
  private readonly NOTIFICATION_SETTINGS_KEY = '@eventy_notification_settings';

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Inicializar serviço de notificações
  async initialize(): Promise<void> {
    try {
      // Solicitar permissões
      const { status } = await Notifications.requestPermissionsAsync();
      
      if (status !== 'granted') {
        console.warn('⚠️ Permissão de notificação negada');
        return;
      }

      console.log('🔔 Serviço de notificações inicializado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao inicializar notificações:', error);
    }
  }

  // Agendar notificação de avaliação após evento
  async scheduleRatingNotification(
    eventId: string, 
    userId: string, 
    eventTitle: string, 
    eventDate: string
  ): Promise<void> {
    try {
      // Agendar para 2 horas após o término do evento
      const eventEndDate = new Date(eventDate);
      eventEndDate.setHours(eventEndDate.getHours() + 2);

      // Para desenvolvimento, vamos usar notificação imediata por enquanto
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '⭐ Como foi sua experiência?',
          body: `Que tal avaliar o evento "${eventTitle}"? Sua opinião é muito importante!`,
          data: {
            type: 'rating_request',
            eventId,
            userId,
            eventTitle,
          },
        },
        trigger: null, // Enviar imediatamente para teste
      });

      // Salvar notificação agendada
      const notification: ScheduledNotification = {
        id: notificationId,
        eventId,
        userId,
        eventTitle,
        scheduledDate: eventEndDate.toISOString(),
        type: 'rating_request',
        sent: false
      };

      await this.saveScheduledNotification(notification);
      
      console.log(`🔔 Notificação de avaliação agendada para ${eventEndDate}`);
    } catch (error) {
      console.error('❌ Erro ao agendar notificação:', error);
    }
  }

  // Enviar notificação imediata
  async sendInstantNotification(
    title: string,
    message: string,
    data?: any,
    type: 'success' | 'info' | 'warning' | 'error' = 'info'
  ): Promise<void> {
    try {
      const icons = {
        success: '✅',
        info: 'ℹ️',
        warning: '⚠️',
        error: '❌'
      };

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${icons[type]} ${title}`,
          body: message,
          data: data || {},
        },
        trigger: null, // Enviar imediatamente
      });
    } catch (error) {
      console.error('❌ Erro ao enviar notificação:', error);
    }
  }

  // Notificação de confirmação de compra
  async sendPurchaseConfirmationNotification(eventTitle: string, quantity: number, total: number): Promise<void> {
    await this.sendInstantNotification(
      'Compra confirmada!',
      `${quantity} ingresso(s) para "${eventTitle}" - Total: R$ ${total.toFixed(2)}`,
      {
        type: 'purchase_confirmation',
        eventTitle,
        quantity,
        total,
      },
      'success'
    );
  }

  // Gerenciar notificações agendadas
  private async saveScheduledNotification(notification: ScheduledNotification): Promise<void> {
    try {
      const notifications = await this.getScheduledNotifications();
      notifications.push(notification);
      await AsyncStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error('❌ Erro ao salvar notificação:', error);
    }
  }

  private async getScheduledNotifications(): Promise<ScheduledNotification[]> {
    try {
      const stored = await AsyncStorage.getItem(this.NOTIFICATIONS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  }

  // Limpar notificações antigas
  async cleanupOldNotifications(): Promise<void> {
    try {
      const notifications = await this.getScheduledNotifications();
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const recentNotifications = notifications.filter(
        notification => new Date(notification.scheduledDate) > oneWeekAgo
      );

      await AsyncStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify(recentNotifications));
    } catch (error) {
      console.error('❌ Erro ao limpar notificações:', error);
    }
  }

  // Configurações de notificação do usuário
  async updateNotificationSettings(settings: any): Promise<void> {
    try {
      await AsyncStorage.setItem(this.NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    }
  }

  async getNotificationSettings(): Promise<any> {
    try {
      const stored = await AsyncStorage.getItem(this.NOTIFICATION_SETTINGS_KEY);
      return stored ? JSON.parse(stored) : {
        ratingReminders: true,
        eventReminders: true,
        purchaseConfirmations: true,
        marketingNotifications: false,
      };
    } catch (error) {
      return {};
    }
  }
}

export default NotificationService; 