import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

import { BottomTabParamList } from './types';
import { colors, spacing, borderRadius } from '../theme';
import { useSafeArea } from '../hooks/useSafeArea';
import { NAVIGATION } from '../constants';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import TicketsScreen from '../screens/TicketsScreen';
import CommunityScreen from '../screens/CommunityScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator<BottomTabParamList>();

interface TabBarIconProps {
  focused: boolean;
  color: string;
  size: number;
}

const tabBarIcons = {
  [NAVIGATION.SCREENS.HOME]: (props: TabBarIconProps) => (
    <Ionicons name={props.focused ? 'home' : 'home-outline'} {...props} />
  ),
  [NAVIGATION.SCREENS.SEARCH]: (props: TabBarIconProps) => (
    <Ionicons name={props.focused ? 'search' : 'search-outline'} {...props} />
  ),
  [NAVIGATION.SCREENS.TICKETS]: (props: TabBarIconProps) => (
    <Ionicons name={props.focused ? 'ticket' : 'ticket-outline'} {...props} />
  ),
  [NAVIGATION.SCREENS.COMMUNITY]: (props: TabBarIconProps) => (
    <Ionicons name={props.focused ? 'people' : 'people-outline'} {...props} />
  ),
  [NAVIGATION.SCREENS.PROFILE]: (props: TabBarIconProps) => (
    <Ionicons name={props.focused ? 'person' : 'person-outline'} {...props} />
  ),
};

export const BottomTabNavigator: React.FC = () => {
  const { bottomPadding, hasNotch, isAndroid } = useSafeArea();
  
  // Calculate optimal tab bar height
  const tabBarHeight = 60 + bottomPadding;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const IconComponent = tabBarIcons[route.name as keyof typeof tabBarIcons];
          return IconComponent({ focused, color, size: 24 });
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
        name={NAVIGATION.SCREENS.HOME}
        component={HomeScreen}
        options={{
          tabBarLabel: NAVIGATION.TAB_LABELS.HOME,
        }}
      />
      <Tab.Screen
        name={NAVIGATION.SCREENS.SEARCH}
        component={SearchScreen}
        options={{
          tabBarLabel: NAVIGATION.TAB_LABELS.SEARCH,
        }}
      />
      <Tab.Screen
        name={NAVIGATION.SCREENS.TICKETS}
        component={TicketsScreen}
        options={{
          tabBarLabel: NAVIGATION.TAB_LABELS.TICKETS,
          tabBarBadge: undefined, // We'll add badge logic later
        }}
      />
      <Tab.Screen
        name={NAVIGATION.SCREENS.COMMUNITY}
        component={CommunityScreen}
        options={{
          tabBarLabel: NAVIGATION.TAB_LABELS.COMMUNITY,
        }}
      />
      <Tab.Screen
        name={NAVIGATION.SCREENS.PROFILE}
        component={ProfileScreen}
        options={{
          tabBarLabel: NAVIGATION.TAB_LABELS.PROFILE,
        }}
      />
    </Tab.Navigator>
  );
}; 