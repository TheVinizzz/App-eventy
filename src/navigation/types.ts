export type RootStackParamList = {
  Main: undefined;
  Login: undefined;
  Register: undefined;
  EventDetails: { eventId: string };
  CreateEvent: undefined;
  Profile: undefined;
  UserProfile: { userId: string };
  Tickets: undefined;
  Payment: { eventId: string; ticketType: string };
  About: undefined;
  Help: undefined;
  MyEvents: undefined;
  CheckIn: { eventId: string };
  EventDashboard: { eventId: string };
  EventAffiliates: { eventId: string };
  Search: undefined;
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
  SearchScreen: undefined;
  EventDetails: { eventId: string };
  FilterEvents: undefined;
  UserProfile: { userId: string };
};

export type TicketsStackParamList = {
  TicketsScreen: undefined;
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