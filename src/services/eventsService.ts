import api from './api';

export interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
}

export interface TicketBatch {
  id: string;
  name: string;
  description?: string;
  price: number;
  startSaleDate: Date | string;
  endSaleDate: Date | string;
  quantity: number;
  sold?: number;
  available?: number;
  status?: BatchStatus;
  eventId: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  shortDescription?: string;
  date: string;
  endDate?: string;
  type: EventType;
  imageUrl: string;
  images?: string[];
  mediaUrls?: string[];
  location: string;
  venue?: {
    name: string;
    address: string;
    city: string;
  };
  venueId?: string;
  isPremium?: boolean;
  featured?: boolean;
  published?: boolean;
  maxTicketsPerPurchase?: number;
  createdById?: string;
  createdAt?: string;
  updatedAt?: string;
  lowestPrice?: number;
  ticketBatches?: TicketBatch[];
  attendeesCount?: number;
  ticketsSold?: number;
  totalRevenue?: number;
}

export type EventType = 'NORMAL' | 'PREMIUM' | 'SHOW' | 'SPORTS' | 'THEATER' | 'FOOTBALL' | 'FESTIVAL' | 'WORKSHOP' | 'CONFERENCE';

export type BatchStatus = 'UPCOMING' | 'ACTIVE' | 'SOLD_OUT' | 'CLOSED';

export interface TrendingEvent {
  id: string;
  title: string;
  imageUrl: string;
  date: string;
  location: string;
  attendances: number;
  posts: number;
  reviews: number;
  tickets: number;
  activityLevel: 'low' | 'medium' | 'high' | 'trending';
  price?: string;
  category?: string;
  rating?: number;
  trendingScore?: number;
  recentActivityScore?: number;
}

export interface EventsQueryParams {
  type?: EventType;
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isPremium?: boolean;
  startDate?: string;
  endDate?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface PaginatedEvents {
  items: Event[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SalesData {
  date: string;
  count: number;
  revenue: number;
}

export interface DashboardMetrics {
  totalTickets: number;
  soldTickets: number;
  availableTickets: number;
  soldPercentage: number;
  totalRevenue: number;
  averageTicketPrice: number;
  dailySales: SalesData[];
  ticketDistribution: Array<{
    name: string;
    sold: number;
    available: number;
    price: number;
  }>;
}

export interface CreateEventDto {
  title: string;
  description?: string;
  shortDescription?: string;
  date: string;
  endDate?: string;
  type: EventType;
  imageUrl: string;
  images?: string[];
  mediaUrls?: string[];
  location: string;
  venueId?: string;
  isPremium?: boolean;
  featured?: boolean;
  published?: boolean;
  maxTicketsPerPurchase?: number;
}

export interface Affiliate {
  id: string;
  userId: string;
  eventId: string;
  commissionType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  commissionValue: number; // Percentage (0-100) or fixed amount in cents
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  affiliateCode: string; // Unique code for affiliate links
  totalSales: number;
  totalCommission: number;
  clicksCount: number;
  conversionRate: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

export interface AffiliateStats {
  totalAffiliates: number;
  activeAffiliates: number;
  totalCommissionPaid: number;
  totalSalesFromAffiliates: number;
  averageCommissionRate: number;
  topPerformers: Array<{
    affiliate: Affiliate;
    sales: number;
    commission: number;
  }>;
}

export interface CreateAffiliateDto {
  userId: string;
  eventId: string;
  commissionType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  commissionValue: number;
}

export interface UpdateAffiliateDto {
  commissionType?: 'PERCENTAGE' | 'FIXED_AMOUNT';
  commissionValue?: number;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export interface AffiliateSearchResult {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isAffiliate: boolean;
  currentCommission?: {
    type: 'PERCENTAGE' | 'FIXED_AMOUNT';
    value: number;
  };
}

// Events Service Class
class EventsService {

/**
   * Get all events with filtering, sorting and pagination
 */
  async getEvents(params: EventsQueryParams = {}): Promise<PaginatedEvents> {
  try {
      const response = await api.get('/events', { params });
    
      // Map the items to include calculated fields
      const mappedItems = response.data.items.map((event: any) => ({
      ...event,
      lowestPrice: event.ticketBatches?.length > 0 
        ? Math.min(...event.ticketBatches.map((batch: any) => batch.price))
        : null,
        location: event.venue?.name || event.location || 'Local não especificado',
        attendeesCount: event.ticketBatches?.reduce((total: number, batch: any) => total + (batch.sold || 0), 0) || 0,
        ticketsSold: event.ticketBatches?.reduce((total: number, batch: any) => total + (batch.sold || 0), 0) || 0,
        totalRevenue: event.ticketBatches?.reduce((total: number, batch: any) => total + ((batch.sold || 0) * batch.price), 0) || 0,
    }));
    
    return {
        ...response.data,
      items: mappedItems
    };
  } catch (error) {
    console.error('Failed to fetch events:', error);
      throw new Error('Não foi possível carregar os eventos');
  }
}

/**
   * Get events created by the current user
 */
  async getUserEvents(): Promise<Event[]> {
  try {
      const response = await api.get('/events/user');
      
      // Map events with calculated fields
      return response.data.map((event: any) => ({
      ...event,
      lowestPrice: event.ticketBatches?.length > 0 
        ? Math.min(...event.ticketBatches.map((batch: any) => batch.price))
        : null,
        location: event.venue?.name || event.location || 'Local não especificado',
        attendeesCount: event.attendeesCount || 0,
        ticketsSold: event.ticketsSold || 0,
        totalRevenue: event.totalRevenue || 0,
    }));
  } catch (error) {
      console.error('Failed to fetch user events:', error);
      throw new Error('Não foi possível carregar seus eventos');
  }
}

/**
   * Get user events metrics summary
   */
  async getUserMetrics(): Promise<{
    totalEvents: number;
    publishedEvents: number;
    totalRevenue: number;
    totalTicketsSold: number;
    upcomingEvents: number;
    totalAttendeesCount: number;
  }> {
    try {
      const response = await api.get('/events/user/metrics');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user metrics:', error);
      throw new Error('Não foi possível carregar métricas do usuário');
    }
  }

  /**
   * Get events by creator ID
   */
  async getEventsByCreator(creatorId: string): Promise<Event[]> {
    try {
      const response = await api.get(`/events/creator/${creatorId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch events by creator:', error);
      throw new Error('Não foi possível carregar eventos do criador');
    }
  }

  /**
   * Get all events for admin (including unpublished)
   */
  async getAllEventsForAdmin(type?: EventType): Promise<Event[]> {
  try {
      const params = type ? { type } : {};
      const response = await api.get('/events/admin', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch admin events:', error);
      throw new Error('Não foi possível carregar eventos (admin)');
    }
  }

  /**
   * Get a specific event by ID
   */
  async getEventById(id: string): Promise<Event> {
    try {
      const response = await api.get(`/events/${id}`);
      
      // Add calculated fields
      const event = response.data;
      return {
      ...event,
      lowestPrice: event.ticketBatches?.length > 0 
        ? Math.min(...event.ticketBatches.map((batch: any) => batch.price))
        : null,
        location: event.venue?.name || event.location || 'Local não especificado',
        attendeesCount: event.ticketBatches?.reduce((total: number, batch: any) => total + (batch.sold || 0), 0) || 0,
        ticketsSold: event.ticketBatches?.reduce((total: number, batch: any) => total + (batch.sold || 0), 0) || 0,
        totalRevenue: event.ticketBatches?.reduce((total: number, batch: any) => total + ((batch.sold || 0) * batch.price), 0) || 0,
      };
  } catch (error) {
      console.error('Failed to fetch event by ID:', error);
      throw new Error('Evento não encontrado');
  }
}

/**
   * Get event dashboard metrics
   */
  async getEventDashboard(eventId: string): Promise<DashboardMetrics> {
    try {
      const response = await api.get(`/events/${eventId}/dashboard`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch event dashboard:', error);
      throw new Error('Não foi possível carregar métricas do evento');
    }
  }

  /**
   * Create a new event
   */
  async createEvent(eventData: CreateEventDto): Promise<Event> {
    try {
      const response = await api.post('/events', eventData);
      return response.data;
    } catch (error) {
      console.error('Failed to create event:', error);
      throw new Error('Não foi possível criar o evento');
    }
  }

  /**
   * Update an existing event
   */
  async updateEvent(id: string, eventData: Partial<CreateEventDto>): Promise<Event> {
  try {
      const response = await api.patch(`/events/${id}`, eventData);
      return response.data;
    } catch (error) {
      console.error('Failed to update event:', error);
      throw new Error('Não foi possível atualizar o evento');
    }
  }

  /**
   * Delete an event
   */
  async deleteEvent(id: string): Promise<void> {
    try {
      await api.delete(`/events/${id}`);
    } catch (error) {
      console.error('Failed to delete event:', error);
      throw new Error('Não foi possível excluir o evento');
    }
  }

  /**
   * Generate upload URL for event image
   */
  async generateUploadUrl(filename: string = 'image.jpg'): Promise<{ uploadUrl: string; fileUrl: string }> {
    try {
      const response = await api.post('/events/upload-url', { filename });
      return response.data;
    } catch (error) {
      console.error('Failed to generate upload URL:', error);
      throw new Error('Não foi possível gerar URL de upload');
    }
  }

  /**
   * Generate upload URL for event video
   */
  async generateVideoUploadUrl(filename: string = 'video.mp4'): Promise<{ uploadUrl: string; fileUrl: string }> {
    try {
      const response = await api.post('/events/video-upload-url', { filename });
      return response.data;
    } catch (error) {
      console.error('Failed to generate video upload URL:', error);
      throw new Error('Não foi possível gerar URL de upload de vídeo');
    }
  }

  /**
   * Get ticket batches for an event
   */
  async getTicketBatches(eventId: string, status?: BatchStatus): Promise<TicketBatch[]> {
    try {
      const params = status ? { status } : {};
      const response = await api.get(`/ticket-batches/event/${eventId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch ticket batches:', error);
      throw new Error('Não foi possível carregar lotes de ingressos');
    }
  }

  /**
   * Get batch details by ID
   */
  async getBatchDetails(batchId: string): Promise<TicketBatch> {
    try {
      const response = await api.get(`/ticket-batches/${batchId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch batch details:', error);
      throw new Error('Não foi possível carregar detalhes do lote');
    }
  }

  /**
   * Save ticket batches for an event
   */
  async saveTicketBatches(eventId: string, batches: Partial<TicketBatch>[]): Promise<TicketBatch[]> {
    try {
      const response = await api.post(`/ticket-batches/event/${eventId}`, { batches });
      return response.data;
    } catch (error) {
      console.error('Failed to save ticket batches:', error);
      throw new Error('Não foi possível salvar lotes de ingressos');
    }
  }

  /**
   * Update ticket batches for an event
   */
  async updateTicketBatches(eventId: string, batches: Partial<TicketBatch>[]): Promise<TicketBatch[]> {
    try {
      const response = await api.put(`/ticket-batches/event/${eventId}`, { batches });
      return response.data;
    } catch (error) {
      console.error('Failed to update ticket batches:', error);
      throw new Error('Não foi possível atualizar lotes de ingressos');
    }
  }

  /**
   * Search events for mentions (autocomplete)
   */
  async searchEventsForMention(query: string): Promise<Array<{
    id: string;
    title: string;
    date: string;
    location: string;
    imageUrl?: string;
  }>> {
    try {
      const response = await api.get('/events/search/mention', { 
        params: { q: query } 
      });
      return response.data;
    } catch (error) {
      console.error('Failed to search events for mention:', error);
      return [];
  }
}

/**
   * Get trending events
   */
  async getTrendingEvents(limit: number = 10): Promise<Event[]> {
    try {
      const response = await api.get('/events', {
        params: {
          limit,
          sortBy: 'createdAt',
          sortOrder: 'desc',
          published: true,
        }
      });
      
      // Map events with calculated fields (same as getEvents and getUserEvents)
      return (response.data.items || []).map((event: any) => ({
        ...event,
        lowestPrice: event.ticketBatches?.length > 0 
          ? Math.min(...event.ticketBatches.map((batch: any) => batch.price))
          : null,
        location: event.venue?.name || event.location || 'Local não especificado',
        attendeesCount: event.ticketBatches?.reduce((total: number, batch: any) => total + (batch.sold || 0), 0) || 0,
        ticketsSold: event.ticketBatches?.reduce((total: number, batch: any) => total + (batch.sold || 0), 0) || 0,
        totalRevenue: event.ticketBatches?.reduce((total: number, batch: any) => total + ((batch.sold || 0) * batch.price), 0) || 0,
      }));
    } catch (error) {
      console.error('Failed to fetch trending events:', error);
      return [];
    }
  }

  /**
   * Get featured events
   */
  async getFeaturedEvents(limit: number = 10): Promise<Event[]> {
    try {
      const response = await api.get('/events', {
        params: {
          limit,
          featured: true,
          published: true,
          sortBy: 'date',
          sortOrder: 'asc',
        }
      });
      
      // Map events with calculated fields (same as getEvents and getUserEvents)
      return (response.data.items || []).map((event: any) => ({
        ...event,
        lowestPrice: event.ticketBatches?.length > 0 
          ? Math.min(...event.ticketBatches.map((batch: any) => batch.price))
          : null,
        location: event.venue?.name || event.location || 'Local não especificado',
        attendeesCount: event.ticketBatches?.reduce((total: number, batch: any) => total + (batch.sold || 0), 0) || 0,
        ticketsSold: event.ticketBatches?.reduce((total: number, batch: any) => total + (batch.sold || 0), 0) || 0,
        totalRevenue: event.ticketBatches?.reduce((total: number, batch: any) => total + ((batch.sold || 0) * batch.price), 0) || 0,
      }));
    } catch (error) {
      console.error('Failed to fetch featured events:', error);
      return [];
    }
  }

  /**
   * Get nearby events (mock implementation for now)
   */
  async getNearbyEvents(limit: number = 10): Promise<Event[]> {
    try {
      // For now, just get recent events as "nearby"
      const response = await api.get('/events', {
        params: {
          limit,
          published: true,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        }
      });
      
      // Map events with calculated fields (same as getEvents and getUserEvents)
      return (response.data.items || []).map((event: any) => ({
        ...event,
        lowestPrice: event.ticketBatches?.length > 0 
          ? Math.min(...event.ticketBatches.map((batch: any) => batch.price))
          : null,
        location: event.venue?.name || event.location || 'Local não especificado',
        attendeesCount: event.ticketBatches?.reduce((total: number, batch: any) => total + (batch.sold || 0), 0) || 0,
        ticketsSold: event.ticketBatches?.reduce((total: number, batch: any) => total + (batch.sold || 0), 0) || 0,
        totalRevenue: event.ticketBatches?.reduce((total: number, batch: any) => total + ((batch.sold || 0) * batch.price), 0) || 0,
      }));
    } catch (error) {
      console.error('Failed to fetch nearby events:', error);
      return [];
    }
  }

  /**
   * Get affiliates for an event
   */
  async getEventAffiliates(eventId: string): Promise<Affiliate[]> {
    try {
      const response = await api.get(`/events/${eventId}/affiliates`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch event affiliates:', error);
      throw new Error('Não foi possível carregar afiliados do evento');
    }
  }

  /**
   * Get affiliate statistics for an event
   */
  async getAffiliateStats(eventId: string): Promise<AffiliateStats> {
    try {
      const response = await api.get(`/events/${eventId}/affiliates/stats`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch affiliate stats:', error);
      throw new Error('Não foi possível carregar estatísticas de afiliados');
    }
  }

  /**
   * Search users to add as affiliates
   */
  async searchUsersForAffiliate(eventId: string, query: string): Promise<AffiliateSearchResult[]> {
    try {
      const response = await api.get(`/events/${eventId}/affiliates/search`, {
        params: { q: query }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to search users for affiliate:', error);
      throw new Error('Não foi possível buscar usuários');
    }
  }

  /**
   * Add user as affiliate
   */
  async addAffiliate(eventId: string, affiliateData: CreateAffiliateDto): Promise<Affiliate> {
    try {
      const response = await api.post(`/events/${eventId}/affiliates`, affiliateData);
      return response.data;
    } catch (error) {
      console.error('Failed to add affiliate:', error);
      throw new Error('Não foi possível adicionar afiliado');
    }
  }

  /**
   * Update affiliate
   */
  async updateAffiliate(eventId: string, affiliateId: string, updates: UpdateAffiliateDto): Promise<Affiliate> {
    try {
      const response = await api.patch(`/events/${eventId}/affiliates/${affiliateId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Failed to update affiliate:', error);
      throw new Error('Não foi possível atualizar afiliado');
    }
  }

  /**
   * Remove affiliate
   */
  async removeAffiliate(eventId: string, affiliateId: string): Promise<void> {
    try {
      await api.delete(`/events/${eventId}/affiliates/${affiliateId}`);
    } catch (error) {
      console.error('Failed to remove affiliate:', error);
      throw new Error('Não foi possível remover afiliado');
    }
  }

  /**
   * Generate affiliate link
   */
  async generateAffiliateLink(eventId: string, affiliateCode: string): Promise<{ link: string; shortLink: string }> {
    try {
      const response = await api.post(`/events/${eventId}/affiliates/generate-link`, {
        affiliateCode
      });
      return response.data;
    } catch (error) {
      console.error('Failed to generate affiliate link:', error);
      throw new Error('Não foi possível gerar link de afiliado');
    }
  }
}

// Export singleton instance
export const eventsService = new EventsService();

// Export individual functions for backward compatibility
export const fetchEvents = (params?: EventsQueryParams) => eventsService.getEvents(params);
export const fetchUserEvents = () => eventsService.getUserEvents();
export const fetchEventById = (id: string) => eventsService.getEventById(id);
export const fetchEventDashboard = (eventId: string) => eventsService.getEventDashboard(eventId);
export const createEvent = (eventData: CreateEventDto) => eventsService.createEvent(eventData);
export const updateEvent = (id: string, eventData: Partial<CreateEventDto>) => eventsService.updateEvent(id, eventData);
export const deleteEvent = (id: string) => eventsService.deleteEvent(id);
export const generateUploadUrl = (filename?: string) => eventsService.generateUploadUrl(filename);
export const generateVideoUploadUrl = (filename?: string) => eventsService.generateVideoUploadUrl(filename);
export const fetchTicketBatches = (eventId: string, status?: BatchStatus) => eventsService.getTicketBatches(eventId, status);
export const fetchBatchDetails = (batchId: string) => eventsService.getBatchDetails(batchId);
export const saveTicketBatches = (eventId: string, batches: Partial<TicketBatch>[]) => eventsService.saveTicketBatches(eventId, batches);
export const updateTicketBatches = (eventId: string, batches: Partial<TicketBatch>[]) => eventsService.updateTicketBatches(eventId, batches);
export const fetchTrendingEvents = (limit?: number) => eventsService.getTrendingEvents(limit);
export const fetchFeaturedEvents = (limit?: number) => eventsService.getFeaturedEvents(limit);
export const fetchNearbyEvents = (limit?: number) => eventsService.getNearbyEvents(limit);
export const searchEventsForMention = (query: string) => eventsService.searchEventsForMention(query);
export const fetchUserMetrics = () => eventsService.getUserMetrics();

// Export individual functions for affiliates
export const fetchEventAffiliates = (eventId: string) => eventsService.getEventAffiliates(eventId);
export const fetchAffiliateStats = (eventId: string) => eventsService.getAffiliateStats(eventId);
export const searchUsersForAffiliate = (eventId: string, query: string) => eventsService.searchUsersForAffiliate(eventId, query);
export const addAffiliate = (eventId: string, affiliateData: CreateAffiliateDto) => eventsService.addAffiliate(eventId, affiliateData);
export const updateAffiliate = (eventId: string, affiliateId: string, updates: UpdateAffiliateDto) => eventsService.updateAffiliate(eventId, affiliateId, updates);
export const removeAffiliate = (eventId: string, affiliateId: string) => eventsService.removeAffiliate(eventId, affiliateId);
export const generateAffiliateLink = (eventId: string, affiliateCode: string) => eventsService.generateAffiliateLink(eventId, affiliateCode);

