import api from './api';

export interface UserStats {
  // Estatísticas de eventos
  eventsAttended: number;  // Eventos que o usuário tem/teve ingresso
  eventsCreated: number;   // Eventos criados pelo usuário
  
  // Estatísticas sociais
  followers: number;       // Seguidores
  following: number;       // Seguindo
  
  // Estatísticas de tickets
  totalTickets: number;
  activeTickets: number;
  usedTickets: number;
  totalSpent: number;
  upcomingEvents: number;
  pastEvents: number;
}

export interface EventMetrics {
  totalEvents: number;
  publishedEvents: number;
  totalRevenue: number;
  totalTicketsSold: number;
  upcomingEvents: number;
  totalAttendeesCount: number;
}

export interface FollowStats {
  followers: number;
  following: number;
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

/**
 * Buscar estatísticas completas do usuário atual
 */
export async function getUserCompleteStats(): Promise<UserStats> {
  try {
    console.log('🔍 UserStatsService: Fetching complete user stats...');
    
    // Fazer todas as requisições em paralelo para melhor performance
    const [followStats, ticketStats, eventMetrics] = await Promise.all([
      getFollowStats(),
      getTicketStats(),
      getEventMetrics(),
    ]);

    const stats: UserStats = {
      // Dados de eventos
      eventsAttended: ticketStats.totalTickets,
      eventsCreated: eventMetrics.totalEvents,
      
      // Dados sociais
      followers: followStats.followers,
      following: followStats.following,
      
      // Dados de tickets
      totalTickets: ticketStats.totalTickets,
      activeTickets: ticketStats.activeTickets,
      usedTickets: ticketStats.usedTickets,
      totalSpent: ticketStats.totalSpent,
      upcomingEvents: ticketStats.upcomingEvents,
      pastEvents: ticketStats.pastEvents,
    };

    console.log('✅ UserStatsService: Complete stats fetched successfully:', stats);
    return stats;
    
  } catch (error: any) {
    console.error('❌ UserStatsService: Error fetching complete stats:', error);
    
    // Retornar dados padrão em caso de erro
    const defaultStats: UserStats = {
      eventsAttended: 0,
      eventsCreated: 0,
      followers: 0,
      following: 0,
      totalTickets: 0,
      activeTickets: 0,
      usedTickets: 0,
      totalSpent: 0,
      upcomingEvents: 0,
      pastEvents: 0,
    };
    
    return defaultStats;
  }
}

/**
 * Buscar estatísticas de seguindo/seguidores
 */
export async function getFollowStats(): Promise<FollowStats> {
  try {
    console.log('📊 UserStatsService: Fetching follow stats...');
    
    const response = await api.get('/social/follow/me/stats');
    
    const stats: FollowStats = {
      followers: response.data.followers || 0,
      following: response.data.following || 0,
    };
    
    console.log('✅ UserStatsService: Follow stats fetched:', stats);
    return stats;
  } catch (error: any) {
    console.error('❌ UserStatsService: Error fetching follow stats:', error);
    return { followers: 0, following: 0 };
  }
}

/**
 * Buscar estatísticas de tickets do usuário
 */
export async function getTicketStats(): Promise<TicketStats> {
  try {
    console.log('🎫 UserStatsService: Fetching ticket stats...');
    
    const response = await api.get('/tickets/my/stats');
    
    const stats = response.data as TicketStats;
    console.log('✅ UserStatsService: Ticket stats fetched:', stats);
    
    return stats;
  } catch (error: any) {
    console.error('❌ UserStatsService: Error fetching ticket stats:', error);
    return {
      totalTickets: 0,
      activeTickets: 0,
      usedTickets: 0,
      cancelledTickets: 0,
      totalSpent: 0,
      upcomingEvents: 0,
      pastEvents: 0,
    };
  }
}

/**
 * Buscar métricas de eventos criados pelo usuário
 */
export async function getEventMetrics(): Promise<EventMetrics> {
  try {
    console.log('🎉 UserStatsService: Fetching event metrics...');
    
    const response = await api.get('/events/user/metrics');
    
    const metrics = response.data as EventMetrics;
    console.log('✅ UserStatsService: Event metrics fetched:', metrics);
    
    return metrics;
  } catch (error: any) {
    console.error('❌ UserStatsService: Error fetching event metrics:', error);
    return {
      totalEvents: 0,
      publishedEvents: 0,
      totalRevenue: 0,
      totalTicketsSold: 0,
      upcomingEvents: 0,
      totalAttendeesCount: 0,
    };
  }
}

/**
 * Buscar estatísticas para usuário específico (para perfis de outros usuários)
 */
export async function getUserStatsById(userId: string): Promise<Partial<UserStats>> {
  try {
    console.log('👤 UserStatsService: Fetching stats for user:', userId);
    
    const response = await api.get(`/social/follow/${userId}/stats`);
    
    const stats = response.data as FollowStats;
    console.log('✅ UserStatsService: User stats fetched:', stats);
    
    return {
      followers: stats.followers,
      following: stats.following,
    };
  } catch (error: any) {
    console.error('❌ UserStatsService: Error fetching user stats:', error);
    return { followers: 0, following: 0 };
  }
}

export default {
  getUserCompleteStats,
  getFollowStats,
  getTicketStats,
  getEventMetrics,
  getUserStatsById,
}; 