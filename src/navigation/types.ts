export type RootStackParamList = {
  Main: undefined;
  Login: undefined;
  Register: undefined;
  EventDetails: { eventId: string };
  CreateEvent: undefined;
  Profile: undefined;
  UserProfile: { userId: string };
  Tickets: undefined;
  Checkout: { 
    eventId: string; 
    selectedTickets: { [batchId: string]: number }; 
  };
  Payment: { 
    eventId: string; 
    eventTitle: string;
    eventDate: string;
    eventLocation: string;
    customerInfo: any;
    batchItems: any[];
    checkoutItems: any[];
    totalAmount: any;
  };
  PaymentSuccess: { paymentId: string };
  About: undefined;
  Help: undefined;
  MyEvents: undefined;
  CheckIn: { eventId: string };
  EventDashboard: { eventId: string };
  EventAffiliates: { eventId: string };
  EditProfile: undefined;
  Search: { 
    query?: string; 
    category?: string; 
    type?: string;
    filters?: {
      type?: string;
      isPremium?: boolean;
      minPrice?: number;
      maxPrice?: number;
    };
    autoFocus?: boolean;
    openFilters?: boolean;
  } | undefined;
  Favorites: undefined;
  EvenLoveEntry: { eventId: string; eventTitle: string };
  EvenLoveMain: { eventId: string };
  EvenLoveMatches: { eventId: string };
  EvenLoveChat: { eventId: string; matchId: string; matchName: string };
  Rating: { eventId: string; eventTitle: string };
};

export type BottomTabParamList = {
  Home: undefined;
  Search: undefined;
  Tickets: undefined;
  Community: undefined;
  Profile: undefined;
};

export type HomeStackParamList = {
  HomeScreen: undefined;
  EventDetails: { eventId: string };
};

export type SearchStackParamList = {
  SearchScreen: { 
    query?: string; 
    category?: string; 
    type?: string;
    filters?: {
      type?: string;
      isPremium?: boolean;
      minPrice?: number;
      maxPrice?: number;
    };
    autoFocus?: boolean;
    openFilters?: boolean;
  } | undefined;
  EventDetails: { eventId: string };
  FilterEvents: undefined;
  UserProfile: { userId: string };
};

export type TicketsStackParamList = {
  TicketsScreen: undefined;
  EventTickets: {
    eventId: string;
    eventTitle: string;
    eventDate: string;
    eventLocation?: string;
    eventImageUrl?: string;
    tickets: any[];
  };
  TicketDetails: { ticketId: string };
  QRCode: { ticketId: string };
};

export type CommunityStackParamList = {
  CommunityScreen: undefined;
  CreatePost: undefined;
  PostDetails: { postId: string };
  UserProfile: { userId: string };
};

export type ProfileStackParamList = {
  ProfileScreen: undefined;
  EditProfile: undefined;
  MyEvents: undefined;
  Settings: undefined;
  Help: undefined;
  About: undefined;
}; 