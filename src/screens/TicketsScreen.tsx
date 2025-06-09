import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, spacing, typography, borderRadius } from '../theme';
import { EventTicketCard, EventTicketCardSkeleton } from '../components/ui/EventTicketCard';
import { Ticket } from '../services/ticketsService';
import { useAuth } from '../contexts/AuthContext';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { TicketsStackParamList } from '../navigation/types';
import { useTickets } from '../hooks/useTickets';

interface TicketGroup {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventLocation?: string;
  eventImageUrl?: string;
  tickets: Ticket[];
}

const TicketsScreen: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigation = useNavigation<StackNavigationProp<TicketsStackParamList>>();
  const { tickets, loading, refreshing, refreshTickets } = useTickets();
  const [groupedTickets, setGroupedTickets] = useState<TicketGroup[]>([]);

  // Group tickets by event whenever tickets change
  useEffect(() => {
    const grouped = groupTicketsByEvent(tickets);
    setGroupedTickets(grouped);
  }, [tickets]);

  const groupTicketsByEvent = useCallback((tickets: Ticket[]): TicketGroup[] => {
    const grouped = tickets.filter(ticket => ticket && ticket.event && ticket.event.id).reduce((acc, ticket) => {
      if (!ticket?.event?.id) return acc;
      
      const eventId = ticket.event.id;
      
      if (!acc[eventId]) {
        acc[eventId] = {
          eventId,
          eventTitle: ticket.event.title,
          eventDate: ticket.event.date,
          eventLocation: ticket.event.venue?.name,
          eventImageUrl: ticket.event.imageUrl,
          tickets: [],
        };
      }
      
      acc[eventId].tickets.push(ticket);
      return acc;
    }, {} as Record<string, TicketGroup>);

    return Object.values(grouped).sort((a, b) => 
      new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
    );
  }, []);

  const handleEventPress = (group: TicketGroup) => {
    navigation.navigate('EventTickets', {
      eventId: group.eventId,
      eventTitle: group.eventTitle,
      eventDate: group.eventDate,
      eventLocation: group.eventLocation,
      eventImageUrl: group.eventImageUrl,
      tickets: group.tickets,
    });
  };

  const onRefresh = () => {
    refreshTickets();
  };

  useFocusEffect(
    useCallback(() => {
      refreshTickets();
    }, [refreshTickets])
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="ticket-outline" size={80} color={colors.brand.textSecondary} />
      <Text style={styles.emptyTitle}>Nenhum ingresso encontrado</Text>
      <Text style={styles.emptySubtitle}>
        Quando você comprar ingressos, eles aparecerão aqui.
      </Text>
    </View>
  );

  const renderSkeletonLoader = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Meus Ingressos</Text>
      </View>
      
      <ScrollView style={styles.scrollView}>
        {[1, 2, 3].map((index) => (
          <EventTicketCardSkeleton key={index} />
        ))}
      </ScrollView>
    </View>
  );

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.authContainer}>
          <Ionicons name="lock-closed" size={60} color={colors.brand.textSecondary} />
          <Text style={styles.authText}>Faça login para ver seus ingressos</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return renderSkeletonLoader();
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Meus Ingressos</Text>
        
        {tickets.length > 0 && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{tickets.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {tickets.filter(t => t && t.status === 'ACTIVE').length}
              </Text>
              <Text style={styles.statLabel}>Ativos</Text>
            </View>
          </View>
        )}
      </View>
      
      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.brand.primary}
          />
        }
      >
        {tickets.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.content}>
            {groupedTickets.map((group) => (
              <EventTicketCard
                key={group.eventId}
                eventId={group.eventId}
                eventTitle={group.eventTitle}
                eventDate={group.eventDate}
                eventLocation={group.eventLocation}
                eventImageUrl={group.eventImageUrl}
                ticketsCount={group.tickets.length}
                activeTicketsCount={group.tickets.filter(t => t && t.status === 'ACTIVE').length}
                tickets={group.tickets}
                onPress={() => handleEventPress(group)}
              />
            ))}
          </View>
        )}
      </ScrollView>


    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.brand.background,
  },

  title: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.sm,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    gap: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  statValue: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.primary,
  },
  statLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.textSecondary,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl + spacing.lg, // Espaço extra para o menu de navegação
  },
  content: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  emptySubtitle: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  authText: {
    fontSize: typography.fontSizes.lg,
    color: colors.brand.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});

export default TicketsScreen; 