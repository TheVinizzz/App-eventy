import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { useSafeArea } from '../hooks/useSafeArea';

// Screens
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import TicketsScreen from '../screens/TicketsScreen';
import EventTicketsScreen from '../screens/EventTicketsScreen';
import CommunityScreen from '../screens/CommunityScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EventDetailsScreen from '../screens/EventDetailsScreen';

// Auth Screens
import AuthRequiredScreen from '../screens/AuthRequiredScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack Navigator for Home
const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeMain" component={HomeScreen} />
    <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
  </Stack.Navigator>
);

// Stack Navigator for Search
const SearchStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="SearchMain" component={SearchScreen} />
    <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
  </Stack.Navigator>
);

// Protected Stack for Tickets
const TicketsStack = () => {
  const { isAuthenticated } = useAuth();
  
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="TicketsMain" 
        component={isAuthenticated ? TicketsScreen : AuthRequiredScreen} 
      />
      <Stack.Screen 
        name="EventTickets" 
        component={EventTicketsScreen} 
      />
    </Stack.Navigator>
  );
};

// Protected Stack for Community
const CommunityStack = () => {
  const { isAuthenticated } = useAuth();
  
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="CommunityMain" 
        component={isAuthenticated ? CommunityScreen : AuthRequiredScreen} 
      />
    </Stack.Navigator>
  );
};

// Protected Stack for Profile
const ProfileStack = () => {
  const { isAuthenticated } = useAuth();
  
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="ProfileMain" 
        component={isAuthenticated ? ProfileScreen : AuthRequiredScreen} 
      />
    </Stack.Navigator>
  );
};

const AppNavigator: React.FC = () => {
  const { bottomPadding, isAndroid } = useSafeArea();
  
  // Calculate optimal tab bar height
  const tabBarHeight = 60 + bottomPadding;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Search':
              iconName = focused ? 'search' : 'search-outline';
              break;
            case 'Tickets':
              iconName = focused ? 'ticket' : 'ticket-outline';
              break;
            case 'Community':
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'home-outline';
          }

          return <Ionicons name={iconName} size={24} color={color} />;
        },
        tabBarActiveTintColor: colors.brand.primary,
        tabBarInactiveTintColor: colors.brand.textSecondary,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          height: tabBarHeight,
          paddingBottom: bottomPadding,
          paddingTop: spacing.xs,
          paddingHorizontal: spacing.sm,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={95}
            tint="dark"
            style={[
              StyleSheet.absoluteFill,
              {
                borderTopWidth: 1,
                borderTopColor: colors.opacity.cardBorder,
                backgroundColor: isAndroid 
                  ? 'rgba(18, 18, 18, 0.98)' 
                  : 'rgba(18, 18, 18, 0.95)',
              },
            ]}
          />
        ),
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: spacing.xs,
          justifyContent: 'center',
          alignItems: 'center',
          flex: 1,
          minHeight: 50,
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStack}
        options={{ tabBarLabel: 'Início' }}
      />
      <Tab.Screen 
        name="Search" 
        component={SearchStack}
        options={{ tabBarLabel: 'Buscar' }}
      />
      <Tab.Screen 
        name="Tickets" 
        component={TicketsStack}
        options={{ tabBarLabel: 'Ingressos' }}
      />
      <Tab.Screen 
        name="Community" 
        component={CommunityStack}
        options={{ tabBarLabel: 'Comunidade' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStack}
        options={{ tabBarLabel: 'Perfil' }}
      />
    </Tab.Navigator>
  );
};

export default AppNavigator; 