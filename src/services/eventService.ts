import api from './api';

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  type: string;
  imageUrl?: string;
  mediaUrls?: string[];
  isPremium: boolean;
  createdById: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  ticketBatches?: TicketBatch[];
}

export interface TicketBatch {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  sold: number;
  startSaleDate: string;
  endSaleDate: string;
  eventId: string;
  status: 'ACTIVE' | 'UPCOMING' | 'SOLD_OUT' | 'CLOSED';
}

export interface CreateEventData {
  title: string;
  description: string;
  date: string;
  location: string;
  type: string;
  imageUrl: string;
  mediaUrls: string[];
}

export interface CreateTicketBatchData {
  name: string;
  description: string;
  price: number;
  quantity: number;
  startSaleDate: string;
  endSaleDate: string;
  eventId?: string;
  tempId?: string;
}

export interface CreateEventResponse {
  event: Event;
  message: string;
}

/**
 * Create a new event
 */
export async function createEvent(eventData: CreateEventData): Promise<CreateEventResponse> {
  try {
    const response = await api.post('/events', eventData);
    return response.data;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
}

/**
 * Create ticket batches for an event
 */
export async function createTicketBatches(
  eventId: string,
  batches: CreateTicketBatchData[]
): Promise<TicketBatch[]> {
  try {
    const payload = {
      eventId: eventId,
      batches: batches
    };
    
    console.log('Sending ticket batches payload to /ticket-batches/batch:', JSON.stringify(payload, null, 2));
    
    const response = await api.post('/ticket-batches/batch', payload);
    
    console.log('Ticket batches creation response:', response.data);
    
    return response.data;
  } catch (error: any) {
    console.error('Error creating ticket batches:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
}

/**
 * Get events created by the current user
 */
export async function getMyEvents(): Promise<Event[]> {
  try {
    const response = await api.get('/events/my-events');
    return response.data;
  } catch (error) {
    console.error('Error fetching my events:', error);
    throw error;
  }
}

/**
 * Get event by ID
 */
export async function getEventById(eventId: string): Promise<Event> {
  try {
    const response = await api.get(`/events/${eventId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching event:', error);
    throw error;
  }
}

/**
 * Update an event
 */
export async function updateEvent(eventId: string, eventData: Partial<CreateEventData>): Promise<Event> {
  try {
    const response = await api.put(`/events/${eventId}`, eventData);
    return response.data;
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
}

/**
 * Delete an event
 */
export async function deleteEvent(eventId: string): Promise<void> {
  try {
    await api.delete(`/events/${eventId}`);
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
}

export default {
  createEvent,
  createTicketBatches,
  getMyEvents,
  getEventById,
  updateEvent,
  deleteEvent,
}; 