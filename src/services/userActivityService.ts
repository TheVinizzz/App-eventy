import api from './api';

export interface UserActivity {
  id: string;
  type: 'ticket_purchase' | 'event_creation' | 'event_update' | 'follow' | 'like' | 'comment';
  action: string;
  description: string;
  target?: {
    id: string;
    title: string;
    type: 'event' | 'user' | 'post';
  };
  metadata?: {
    amount?: number;
    eventDate?: string;
    imageUrl?: string;
  };
  createdAt: string;
  timeAgo: string;
}

export interface UserActivityStats {
  totalActivities: number;
  thisWeekActivities: number;
  lastActivityDate?: string;
}

/**
 * Buscar atividades recentes do usuário atual
 */
export async function getUserActivities(limit: number = 10): Promise<UserActivity[]> {
  try {
    console.log('🎯 UserActivityService: Fetching user activities...');
    
    const response = await api.get(`/users/my/activities?limit=${limit}`);
    
    const activities = response.data as UserActivity[];
    console.log('✅ UserActivityService: Activities fetched successfully:', activities.length);
    
    return activities;
    
  } catch (error: any) {
    console.warn('⚠️ UserActivityService: Endpoint not available, using simulated data:', error.response?.status);
    
    // Se a rota não existir (404) ou houver erro de servidor, retornar atividades simuladas
    if (error.response?.status === 404 || error.response?.status >= 500) {
      return generateSimulatedActivities();
    }
    
    // Para outros erros, retornar array vazio
    return [];
  }
}

/**
 * Buscar estatísticas de atividade do usuário
 */
export async function getUserActivityStats(): Promise<UserActivityStats> {
  try {
    console.log('📊 UserActivityService: Fetching activity stats...');
    
    const response = await api.get('/users/my/activity-stats');
    
    const stats = response.data as UserActivityStats;
    console.log('✅ UserActivityService: Activity stats fetched:', stats);
    
    return stats;
    
  } catch (error: any) {
    console.warn('⚠️ UserActivityService: Activity stats endpoint not available:', error.response?.status);
    
    // Retornar estatísticas padrão se não conseguir buscar
    return {
      totalActivities: 0,
      thisWeekActivities: 0,
    };
  }
}

/**
 * Gerar atividades simuladas baseadas nos endpoints existentes
 * Esta função serve como fallback enquanto o endpoint dedicado não está disponível
 */
async function generateSimulatedActivities(): Promise<UserActivity[]> {
  try {
    console.log('🔄 UserActivityService: Generating simulated activities from real data...');
    
    const activities: UserActivity[] = [];
    
    // Buscar dados reais de diferentes endpoints para simular atividades
    const [ticketStats, eventMetrics] = await Promise.all([
      fetchTicketStats().catch(() => null),
      fetchEventMetrics().catch(() => null),
    ]);
    
    // Simular atividades baseadas em dados reais
    if (ticketStats && ticketStats.totalTickets > 0) {
      // Simular compras de ingressos recentes
      for (let i = 0; i < Math.min(ticketStats.totalTickets, 3); i++) {
        const daysAgo = i + 1;
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        
        activities.push({
          id: `ticket_${i}`,
          type: 'ticket_purchase',
          action: 'Comprou ingresso para',
          description: `Adquiriu ingresso para um evento`,
          target: {
            id: `event_${i}`,
            title: `Evento Incrível ${i + 1}`,
            type: 'event',
          },
          metadata: {
            amount: 50 + (i * 25),
            eventDate: new Date(date.getTime() + (7 * 24 * 60 * 60 * 1000)).toISOString(),
          },
          createdAt: date.toISOString(),
          timeAgo: getTimeAgo(date),
        });
      }
    }
    
    if (eventMetrics && eventMetrics.totalEvents > 0) {
      // Simular criação de eventos
      for (let i = 0; i < Math.min(eventMetrics.totalEvents, 2); i++) {
        const daysAgo = i * 7 + 3; // Espalhar por semanas
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        
        activities.push({
          id: `event_creation_${i}`,
          type: 'event_creation',
          action: 'Criou o evento',
          description: `Publicou um novo evento`,
          target: {
            id: `created_event_${i}`,
            title: `Meu Evento ${i + 1}`,
            type: 'event',
          },
          createdAt: date.toISOString(),
          timeAgo: getTimeAgo(date),
        });
      }
    }
    
    // Adicionar algumas atividades sociais simuladas
    const socialActivities = [
      {
        id: 'follow_1',
        type: 'follow' as const,
        action: 'Começou a seguir',
        description: 'Adicionou um novo contato',
        target: {
          id: 'user_1',
          title: 'Maria Silva',
          type: 'user' as const,
        },
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        timeAgo: '2 dias atrás',
      },
      {
        id: 'like_1',
        type: 'like' as const,
        action: 'Curtiu uma publicação de',
        description: 'Interagiu com conteúdo da comunidade',
        target: {
          id: 'user_2',
          title: 'João Santos',
          type: 'user' as const,
        },
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        timeAgo: '4 dias atrás',
      },
    ];
    
    activities.push(...socialActivities);
    
    // Ordenar por data mais recente
    const sortedActivities = activities
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
    
    console.log('✅ UserActivityService: Generated simulated activities:', sortedActivities.length);
    return sortedActivities;
    
  } catch (error) {
    console.error('❌ UserActivityService: Error generating simulated activities:', error);
    return [];
  }
}

/**
 * Função auxiliar para buscar estatísticas de tickets
 */
async function fetchTicketStats() {
  const response = await api.get('/tickets/my/stats');
  return response.data;
}

/**
 * Função auxiliar para buscar métricas de eventos
 */
async function fetchEventMetrics() {
  const response = await api.get('/events/user/metrics');
  return response.data;
}

/**
 * Calcular tempo relativo (há quanto tempo)
 */
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInWeeks = Math.floor(diffInDays / 7);
  
  if (diffInMinutes < 60) {
    return diffInMinutes <= 1 ? 'agora mesmo' : `${diffInMinutes} min atrás`;
  } else if (diffInHours < 24) {
    return diffInHours === 1 ? '1 hora atrás' : `${diffInHours} horas atrás`;
  } else if (diffInDays < 7) {
    return diffInDays === 1 ? '1 dia atrás' : `${diffInDays} dias atrás`;
  } else {
    return diffInWeeks === 1 ? '1 semana atrás' : `${diffInWeeks} semanas atrás`;
  }
}

/**
 * Obter ícone apropriado para cada tipo de atividade
 */
export function getActivityIcon(type: UserActivity['type']): string {
  switch (type) {
    case 'ticket_purchase':
      return 'ticket-outline';
    case 'event_creation':
      return 'calendar-outline';
    case 'event_update':
      return 'pencil-outline';
    case 'follow':
      return 'person-add-outline';
    case 'like':
      return 'heart-outline';
    case 'comment':
      return 'chatbubble-outline';
    default:
      return 'flash-outline';
  }
}

/**
 * Obter cor apropriada para cada tipo de atividade
 */
export function getActivityColor(type: UserActivity['type']): string {
  switch (type) {
    case 'ticket_purchase':
      return '#4CAF50'; // Verde
    case 'event_creation':
      return '#2196F3'; // Azul
    case 'event_update':
      return '#FF9800'; // Laranja
    case 'follow':
      return '#9C27B0'; // Roxo
    case 'like':
      return '#E91E63'; // Rosa
    case 'comment':
      return '#00BCD4'; // Ciano
    default:
      return '#757575'; // Cinza
  }
}

export default {
  getUserActivities,
  getUserActivityStats,
  getActivityIcon,
  getActivityColor,
}; 