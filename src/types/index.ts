export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  address: string;
  price: number;
  currency: string;
  category: string;
  imageUrl?: string;
  organizerId: string;
  organizer: User;
  attendeesCount: number;
  maxAttendees?: number;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  id: string;
  eventId: string;
  event: Event;
  buyerId: string;
  user?: User;
  type?: string;
  price: number;
  currency?: string;
  status: 'ACTIVE' | 'USED' | 'EXPIRED' | 'CANCELLED' | 'PENDING';
  qrCode: string;
  purchaseDate: string;
  usedAt?: string;
  checkInDate?: string;
  batchId?: string;
  ticketBatch?: {
    id: string;
    name: string;
    description?: string;
    price: number;
  };
  billing?: {
    status: string;
  };
}

export interface Post {
  id: string;
  content: string;
  authorId: string;
  author: User;
  eventId?: string;
  event?: Event;
  imageUrl?: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  content: string;
  postId: string;
  authorId: string;
  author: User;
  createdAt: string;
  updatedAt: string;
}

export interface Story {
  id: string;
  authorId: string;
  author: User;
  imageUrl: string;
  caption?: string;
  eventId?: string;
  event?: Event;
  viewsCount: number;
  isViewed: boolean;
  expiresAt: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'event' | 'ticket' | 'social' | 'system';
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, any>;
} 