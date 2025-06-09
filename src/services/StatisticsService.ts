import AsyncStorage from '@react-native-async-storage/async-storage';

export interface EventStatistics {
  eventId: string;
  participants: number;
  ticketsSold: number;
  interested: number; // pessoas que favoritaram
  rating: number;
  totalRatings: number;
  duration: string;
  revenue: number;
}

export interface EventRating {
  id: string;
  eventId: string;
  userId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  userEmail: string;
  userName: string;
}

class StatisticsService {
  private static instance: StatisticsService;
  private readonly STATS_KEY = '@eventy_statistics';
  private readonly RATINGS_KEY = '@eventy_ratings';
  private readonly PURCHASES_KEY = '@eventy_purchases';

  static getInstance(): StatisticsService {
    if (!StatisticsService.instance) {
      StatisticsService.instance = new StatisticsService();
    }
    return StatisticsService.instance;
  }

  // Buscar estatísticas de um evento
  async getEventStatistics(eventId: string): Promise<EventStatistics> {
    try {
      // Buscar dados de compras (ingressos vendidos)
      const purchases = await this.getPurchases(eventId);
      const ticketsSold = purchases.reduce((total, purchase) => total + purchase.quantity, 0);
      const participants = purchases.length; // número de compradores únicos
      const revenue = purchases.reduce((total, purchase) => total + purchase.totalAmount, 0);

      // Buscar interessados (favoritos)
      const interested = await this.getInterestedCount(eventId);

      // Buscar avaliações
      const ratings = await this.getEventRatings(eventId);
      const totalRatings = ratings.length;
      const averageRating = totalRatings > 0 
        ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / totalRatings 
        : 0;

      // Calcular duração (placeholder - seria baseado nas datas do evento)
      const duration = await this.calculateEventDuration(eventId);

      return {
        eventId,
        participants,
        ticketsSold,
        interested,
        rating: Math.round(averageRating * 10) / 10, // 1 casa decimal
        totalRatings,
        duration,
        revenue
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return {
        eventId,
        participants: 0,
        ticketsSold: 0,
        interested: 0,
        rating: 0,
        totalRatings: 0,
        duration: '1 dia',
        revenue: 0
      };
    }
  }

  // Registrar uma compra de ingresso
  async recordTicketPurchase(eventId: string, userId: string, userEmail: string, quantity: number, totalAmount: number): Promise<void> {
    try {
      const purchases = await this.getPurchases(eventId);
      const newPurchase = {
        id: Date.now().toString(),
        eventId,
        userId,
        userEmail,
        quantity,
        totalAmount,
        purchaseDate: new Date().toISOString(),
      };

      purchases.push(newPurchase);
      await AsyncStorage.setItem(`${this.PURCHASES_KEY}_${eventId}`, JSON.stringify(purchases));
    } catch (error) {
      console.error('Erro ao registrar compra:', error);
    }
  }

  // Verificar se usuário comprou ingresso
  async hasUserPurchasedTicket(eventId: string, userId: string): Promise<boolean> {
    try {
      const purchases = await this.getPurchases(eventId);
      return purchases.some(purchase => purchase.userId === userId);
    } catch (error) {
      console.error('Erro ao verificar compra:', error);
      return false;
    }
  }

  // Adicionar avaliação
  async addRating(eventId: string, userId: string, userEmail: string, userName: string, rating: number, comment?: string): Promise<void> {
    try {
      // Verificar se usuário já avaliou
      const existingRatings = await this.getEventRatings(eventId);
      const existingRating = existingRatings.find(r => r.userId === userId);
      
      if (existingRating) {
        throw new Error('Usuário já avaliou este evento');
      }

      // Verificar se usuário comprou ingresso
      const hasPurchased = await this.hasUserPurchasedTicket(eventId, userId);
      if (!hasPurchased) {
        throw new Error('Somente quem comprou ingresso pode avaliar');
      }

      const newRating: EventRating = {
        id: Date.now().toString(),
        eventId,
        userId,
        rating,
        comment,
        createdAt: new Date().toISOString(),
        userEmail,
        userName
      };

      existingRatings.push(newRating);
      await AsyncStorage.setItem(`${this.RATINGS_KEY}_${eventId}`, JSON.stringify(existingRatings));
    } catch (error) {
      console.error('Erro ao adicionar avaliação:', error);
      throw error;
    }
  }

  // Buscar avaliações de um evento
  async getEventRatings(eventId: string): Promise<EventRating[]> {
    try {
      const stored = await AsyncStorage.getItem(`${this.RATINGS_KEY}_${eventId}`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Erro ao buscar avaliações:', error);
      return [];
    }
  }

  // Verificar se usuário já avaliou
  async hasUserRated(eventId: string, userId: string): Promise<boolean> {
    try {
      const ratings = await this.getEventRatings(eventId);
      return ratings.some(rating => rating.userId === userId);
    } catch (error) {
      console.error('Erro ao verificar avaliação:', error);
      return false;
    }
  }

  private async getPurchases(eventId: string): Promise<any[]> {
    try {
      const stored = await AsyncStorage.getItem(`${this.PURCHASES_KEY}_${eventId}`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  }

  private async getInterestedCount(eventId: string): Promise<number> {
    try {
      // Por enquanto retorna 0, pode ser implementado futuramente
      // Integração com sistema de favoritos pode ser adicionada depois
      return 0;
    } catch (error) {
      return 0;
    }
  }

  private async calculateEventDuration(eventId: string): Promise<string> {
    // Placeholder - em produção seria baseado nas datas do evento
    return '1 dia';
  }

  // Limpar dados de teste
  async clearAllData(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const eventKeys = keys.filter(key => 
        key.startsWith(this.STATS_KEY) || 
        key.startsWith(this.RATINGS_KEY) ||
        key.startsWith(this.PURCHASES_KEY)
      );
      await AsyncStorage.multiRemove(eventKeys);
    } catch (error) {
      console.error('Erro ao limpar dados:', error);
    }
  }
}

export default StatisticsService; 