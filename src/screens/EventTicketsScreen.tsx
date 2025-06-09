import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { colors, spacing, typography, borderRadius } from '../theme';
import { TicketCard } from '../components/ui/TicketCard';
import { TicketModal } from '../components/ui/TicketModal';
import { Ticket } from '../services/ticketsService';
import { TicketsStackParamList } from '../navigation/types';

type EventTicketsScreenRouteProp = RouteProp<TicketsStackParamList, 'EventTickets'>;
type EventTicketsScreenNavigationProp = StackNavigationProp<TicketsStackParamList, 'EventTickets'>;

interface Props {
  route: EventTicketsScreenRouteProp;
  navigation: EventTicketsScreenNavigationProp;
}

const EventTicketsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { eventId, eventTitle, eventDate, eventLocation, eventImageUrl, tickets } = route.params;
  const [selectedTickets, setSelectedTickets] = useState<Ticket[]>([]);
  const [modalVisible, setModalVisible] = useState(false);



  const handleTicketPress = (ticket: Ticket) => {
    setSelectedTickets([ticket]);
    setModalVisible(true);
  };

  const handleGoBack = () => {
    navigation.goBack();
  };





  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Header with back button and title */}
      <View style={styles.simpleHeader}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color={colors.brand.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Seus Ingressos</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      {/* Tickets List */}
      <ScrollView 
        style={styles.ticketsList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.ticketsContent}
      >
        {tickets.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            onPress={() => handleTicketPress(ticket)}
            variant="compact"
          />
        ))}
        
        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Modal */}
      <TicketModal
        visible={modalVisible}
        tickets={selectedTickets}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand.background,
  },
  
  // Simple Header
  simpleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.brand.background,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brand.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  
  // Tickets List
  ticketsList: {
    flex: 1,
  },
  ticketsContent: {
    paddingTop: spacing.lg,
  },
  bottomPadding: {
    height: spacing.xl,
  },
});

export default EventTicketsScreen; 