import { User } from './index';

export type Gender = 'masculine' | 'feminine' | 'non-binary' | 'prefer_not_to_say';

// Backend compatibility types
export type EvenLoveLookingFor = 'FRIENDSHIP' | 'DATING' | 'NETWORKING' | 'ANY';
export type EvenLoveShowMe = 'EVERYONE' | 'MEN' | 'WOMEN' | 'NON_BINARY';
export type EvenLoveSwipeAction = 'LIKE' | 'PASS';
export type EvenLoveMatchStatus = 'ACTIVE' | 'EXPIRED' | 'BLOCKED';
export type EvenLoveMessageType = 'TEXT' | 'IMAGE' | 'AUDIO';

export interface EvenLoveProfile {
  id: string;
  userId: string;
  eventId: string;
  user?: User; // Optional for compatibility
  displayName: string;
  age?: number; // Calculated from backend data
  gender?: Gender; // Mapped from user data
  interestedInGenders?: Gender[]; // Mapped from showMe field
  bio?: string;
  photos: string[];
  interests?: string[]; // Mapped from musicPreferences
  isActive: boolean;
  lastActiveAt?: string; // Mapped from lastActive
  location?: {
    latitude: number;
    longitude: number;
    distance?: number;
  };
  preferences?: { // Mapped from individual fields
    minAge: number;
    maxAge: number;
    maxDistance: number;
  };
  // Backend fields
  musicPreferences?: string[];
  lookingFor?: EvenLoveLookingFor;
  ageRangeMin?: number;
  ageRangeMax?: number;
  maxDistance?: number;
  showMe?: EvenLoveShowMe;
  joinedAt?: string;
  lastActive?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EvenLoveMatch {
  id: string;
  eventId: string;
  // Support both frontend and backend field names
  profile1Id?: string;
  profile2Id?: string;
  user1Id?: string;
  user2Id?: string;
  profile1?: EvenLoveProfile;
  profile2?: EvenLoveProfile;
  user1?: EvenLoveProfile;
  user2?: EvenLoveProfile;
  status: EvenLoveMatchStatus | 'pending' | 'active' | 'expired';
  matchedAt: string;
  lastMessageAt?: string;
  unreadCount?: number;
  chatStarted?: boolean;
  expiresAt?: string;
}

export interface EvenLoveMessage {
  id: string;
  matchId: string;
  senderId: string;
  content: string;
  type: EvenLoveMessageType | 'text' | 'image' | 'sticker' | 'location';
  isRead?: boolean;
  readAt?: string;
  delivered?: boolean;
  sentAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EvenLoveSwipe {
  id: string;
  eventId: string;
  swiperId: string;
  targetId?: string; // Frontend naming
  swipedId?: string; // Backend naming
  action: EvenLoveSwipeAction | 'pass' | 'like' | 'super_like';
  createdAt: string;
}

export interface EvenLoveStats {
  totalProfiles?: number;
  totalMatches?: number;
  totalMessages?: number;
  activeUsers?: number;
  profileViews?: number;
  likes?: number;
  passes?: number;
  superLikes?: number;
  // Backend compatibility
  averageSwipesPerUser?: number;
  matchRate?: number;
  peakHours?: { hour: number; activity: number }[];
}

export interface EvenLoveNotification {
  id: string;
  userId: string;
  type: 'new_match' | 'new_message' | 'profile_view' | 'super_like';
  title: string;
  message: string;
  data: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

export interface EvenLoveFilters {
  gender?: Gender[];
  minAge?: number;
  maxAge?: number;
  maxDistance?: number;
  interests?: string[];
  onlineOnly?: boolean;
  // Backend compatibility
  lookingFor?: EvenLoveLookingFor;
  showMe?: EvenLoveShowMe;
}

export interface EvenLoveSettings {
  id: string;
  userId?: string; // Frontend naming
  organizerId?: string; // Backend naming
  eventId: string;
  isEnabled?: boolean; // Backend field
  isProfileVisible?: boolean; // Frontend field
  showDistance?: boolean;
  showAge?: boolean;
  pushNotifications?: boolean;
  emailNotifications?: boolean;
  autoMatch?: boolean;
  preferences?: EvenLoveFilters;
  blockedUsers?: string[];
  // Backend fields
  minAge?: number;
  maxAge?: number;
  strictness?: 'LOW' | 'MEDIUM' | 'HIGH';
  moderationEnabled?: boolean;
  chatDuration?: number;
  geofenceRadius?: number;
  allowGroupMatching?: boolean;
  allowMusicBasedMatching?: boolean;
  allowLocationBasedMatching?: boolean;
  maxMatchesPerUser?: number;
  createdAt?: string;
  updatedAt?: string;
} 