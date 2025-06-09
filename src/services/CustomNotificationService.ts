import { Alert, Platform, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme';

export interface EventNotificationData {
  eventId: string;
  eventTitle: string;
  eventImage: string;
  eventDate: string;
  eventLocation: string;
}

export interface EventTicketNotificationData {
  eventId: string;
  eventTitle: string;
  eventImage: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  ticketCount: number;
}

// Configurar notificações para aparecer sempre
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class CustomNotificationService {
  private static instance: CustomNotificationService;

  public static getInstance(): CustomNotificationService {
    if (!CustomNotificationService.instance) {
      CustomNotificationService.instance = new CustomNotificationService();
    }
    return CustomNotificationService.instance;
  }

  private constructor() {
    this.setupNotifications();
  }

  private async setupNotifications() {
    // Solicitar permissões automaticamente
    await this.requestPermissions();
  }

  public async showEventRatingNotification(
    eventData: EventNotificationData,
    onPress?: () => void
  ): Promise<void> {
    try {
      // Haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Solicitar permissões se necessário
      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        console.warn('Permissões de notificação não concedidas');
        return;
      }

      // Configurar o conteúdo da notificação nativa
      const notificationContent = {
        title: '⭐ Avalie este evento!',
        body: `Como foi sua experiência no "${eventData.eventTitle}"? Toque para avaliar e ajudar outros usuários!`,
        data: {
          eventId: eventData.eventId,
          eventTitle: eventData.eventTitle,
          eventImage: eventData.eventImage,
          eventDate: eventData.eventDate,
          eventLocation: eventData.eventLocation,
          type: 'rate_event',
          action: 'open_rating',
        },
        sound: 'default' as const,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        color: colors.brand.primary,
        badge: 1,
        categoryIdentifier: 'event_rating',
        // Para Android
        ...(Platform.OS === 'android' && {
          channelId: 'event-ratings',
          icon: './assets/icon.png',
          image: eventData.eventImage,
          largeIcon: eventData.eventImage,
          bigText: `📅 ${eventData.eventDate}\n📍 ${eventData.eventLocation}\n\nCompartilhe sua experiência e ajude outros usuários a escolher os melhores eventos!`,
          style: {
            type: 'bigPicture',
            picture: eventData.eventImage,
          },
        }),
        // Para iOS
        ...(Platform.OS === 'ios' && {
          subtitle: `${eventData.eventDate} • ${eventData.eventLocation}`,
        }),
      };

      // Criar canal de notificação para Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('event-ratings', {
          name: 'Avaliações de Eventos',
          description: 'Notificações para avaliar eventos que você participou',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: colors.brand.primary,
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          bypassDnd: false,
          enableLights: true,
          enableVibrate: true,
          showBadge: true,
        });
      }

      // Configurar categoria para iOS com ações
      if (Platform.OS === 'ios') {
        await Notifications.setNotificationCategoryAsync('event_rating', [
          {
            identifier: 'rate_now',
            buttonTitle: '⭐ Avaliar Agora',
            options: {
              opensAppToForeground: true,
            },
          },
          {
            identifier: 'rate_later',
            buttonTitle: 'Lembrar depois',
            options: {
              opensAppToForeground: false,
            },
          },
        ]);
      }

      // Agendar notificação imediata
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: null, // Imediata
      });

      console.log('🔔 Notificação nativa enviada:', notificationId);

      // Auto-cancelar após 1 hora se não for tocada
      setTimeout(async () => {
        try {
          await Notifications.cancelScheduledNotificationAsync(notificationId);
        } catch (error) {
          // Ignore se já foi cancelada
        }
      }, 60 * 60 * 1000); // 1 hora

    } catch (error) {
      console.error('❌ Erro ao enviar notificação nativa:', error);
    }
  }

  public async showEventTicketNotification(
    ticketData: EventTicketNotificationData
  ): Promise<void> {
    try {
      // Haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

      // Solicitar permissões se necessário
      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        console.warn('Permissões de notificação não concedidas');
        return;
      }

      const ticketText = ticketData.ticketCount === 1 ? 'ingresso' : 'ingressos';

      // Configurar o conteúdo da notificação nativa
      const notificationContent = {
        title: `🎫 Seu evento começa em 1 hora!`,
        body: `"${ticketData.eventTitle}" hoje às ${ticketData.eventTime}. Você tem ${ticketData.ticketCount} ${ticketText} disponível. Toque para ver seus ingressos!`,
        data: {
          eventId: ticketData.eventId,
          eventTitle: ticketData.eventTitle,
          eventImage: ticketData.eventImage,
          eventDate: ticketData.eventDate,
          eventTime: ticketData.eventTime,
          eventLocation: ticketData.eventLocation,
          ticketCount: ticketData.ticketCount,
          type: 'event_reminder',
          action: 'open_tickets',
        },
        sound: 'default' as const,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        color: colors.brand.primary,
        badge: ticketData.ticketCount,
        categoryIdentifier: 'event_reminder',
        // Para Android
        ...(Platform.OS === 'android' && {
          channelId: 'event-reminders',
          icon: './assets/icon.png',
          image: ticketData.eventImage,
          largeIcon: ticketData.eventImage,
          bigText: `🎫 ${ticketData.ticketCount} ${ticketText} disponível\n📅 ${ticketData.eventDate} às ${ticketData.eventTime}\n📍 ${ticketData.eventLocation}\n\nNão esqueça de levar seus ingressos!`,
          style: {
            type: 'bigPicture',
            picture: ticketData.eventImage,
          },
        }),
        // Para iOS
        ...(Platform.OS === 'ios' && {
          subtitle: `${ticketData.eventDate} às ${ticketData.eventTime} • ${ticketData.eventLocation}`,
        }),
      };

      // Criar canal de notificação para Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('event-reminders', {
          name: 'Lembretes de Eventos',
          description: 'Notificações para lembrar de eventos próximos com ingressos',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 500, 250, 500],
          lightColor: colors.brand.primary,
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          bypassDnd: true, // Importante para não perder o evento
          enableLights: true,
          enableVibrate: true,
          showBadge: true,
        });
      }

      // Configurar categoria para iOS com ações
      if (Platform.OS === 'ios') {
        await Notifications.setNotificationCategoryAsync('event_reminder', [
          {
            identifier: 'view_tickets',
            buttonTitle: '🎫 Ver Ingressos',
            options: {
              opensAppToForeground: true,
            },
          },
          {
            identifier: 'get_directions',
            buttonTitle: '📍 Como Chegar',
            options: {
              opensAppToForeground: true,
            },
          },
        ]);
      }

      // Agendar notificação imediata
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: null, // Imediata
      });

      console.log('🎫 Notificação de ingresso enviada:', notificationId);

      // Auto-cancelar após 2 horas se não for tocada
      setTimeout(async () => {
        try {
          await Notifications.cancelScheduledNotificationAsync(notificationId);
        } catch (error) {
          // Ignore se já foi cancelada
        }
      }, 2 * 60 * 60 * 1000); // 2 horas

    } catch (error) {
      console.error('❌ Erro ao enviar notificação de ingresso:', error);
    }
  }

  public async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowDisplayInCarPlay: true,
            allowCriticalAlerts: false,
            provideAppNotificationSettings: false,
            allowProvisional: false,
          },
        });
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert(
          'Permissão necessária',
          'Para receber notificações sobre avaliações de eventos, permita notificações nas configurações do app.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Configurações', onPress: () => Linking.openSettings() },
          ]
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Erro ao solicitar permissões:', error);
      return false;
    }
  }

  public setupNotificationListener(onNotificationPress: (data: any) => void) {
    // Listener para quando o app está fechado/background e usuário toca na notificação
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        console.log('🔔 Notificação tocada:', data);
        
        if (data.type === 'rate_event' || data.type === 'event_reminder') {
          // Haptic feedback
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onNotificationPress(data);
        }
      }
    );

    // Listener para notificações recebidas quando app está em primeiro plano
    const foregroundSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('🔔 Notificação recebida em primeiro plano:', notification);
        // Aqui você pode mostrar um banner customizado se quiser
      }
    );

    return {
      remove: () => {
        subscription.remove();
        foregroundSubscription.remove();
      },
    };
  }

  public async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  public async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  public async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }
}

export default CustomNotificationService; 