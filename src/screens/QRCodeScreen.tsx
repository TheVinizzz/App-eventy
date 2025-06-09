import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
  Dimensions,
  Animated,
  ScrollView,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../theme';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { ticketsService, Ticket, TicketStatus } from '../services/ticketsService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type QRCodeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface RouteParams {
  ticketId: string;
}

const QRCodeScreen: React.FC = () => {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [pulseAnimation] = useState(new Animated.Value(1));
  const navigation = useNavigation<QRCodeScreenNavigationProp>();
  const route = useRoute();
  const params = route.params as RouteParams;

  useEffect(() => {
    loadTicket();
  }, []);

  useEffect(() => {
    // Animate pulse for active tickets
    if (ticket?.status === TicketStatus.ACTIVE) {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();
      return () => pulseLoop.stop();
    }
  }, [ticket?.status]);

  const loadTicket = async () => {
    try {
      setLoading(true);
      
      // Buscar o ticket real da API
      const ticketData = await ticketsService.getTicketById(params.ticketId);
      
      if (ticketData) {
        setTicket(ticketData);
      } else {
        // Fallback para dados mock se não encontrar o ticket
        const mockTicket: Ticket = {
          id: params.ticketId,
          eventId: 'event-1',
          buyerId: 'user-1',
          price: 150.00,
          purchaseDate: new Date().toISOString(),
          status: TicketStatus.ACTIVE,
          qrCode: params.ticketId,
          batchId: 'batch-1',
          event: {
            id: 'event-1',
            title: 'Festival de Verão 2025',
            description: 'O maior festival de música do Brasil',
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            location: 'Estádio do Maracanã',
            imageUrl: 'https://picsum.photos/400/300?random=1',
            venue: {
              id: 'venue-1',
              name: 'Estádio do Maracanã',
              address: 'Av. Pres. Castelo Branco, Portão 3',
              city: 'Rio de Janeiro - RJ',
            },
          },
          ticketBatch: {
            id: 'batch-1',
            name: 'Pista Premium',
            description: 'Acesso à pista premium',
            price: 150.00,
          },
        };
        setTicket(mockTicket);
      }
    } catch (error) {
      console.error('Erro ao carregar ticket:', error);
      Alert.alert('Erro', 'Não foi possível carregar o ingresso');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleShareTicket = async () => {
    if (!ticket) return;

    try {
      const message = `🎫 Meu ingresso para ${ticket.event.title}\n📅 ${ticketsService.formatDate(ticket.event.date)}\n📍 ${ticket.event.venue?.name || ticket.event.location}\n\nID: ${ticket.id}`;
      
      await Share.share({
        message,
        title: 'Compartilhar Ingresso',
      });
    } catch (error) {
      console.error('Error sharing ticket:', error);
    }
  };

  const getStatusConfig = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.ACTIVE:
        return {
          color: '#00D4AA',
          backgroundColor: 'rgba(0, 212, 170, 0.15)',
          text: 'ATIVO',
          showPulse: true,
        };
      case TicketStatus.USED:
        return {
          color: '#8B93A1',
          backgroundColor: 'rgba(139, 147, 161, 0.15)',
          text: 'UTILIZADO',
          showPulse: false,
        };
      case TicketStatus.CANCELLED:
        return {
          color: '#FF6B6B',
          backgroundColor: 'rgba(255, 107, 107, 0.15)',
          text: 'CANCELADO',
          showPulse: false,
        };
      default:
        return {
          color: colors.brand.textSecondary,
          backgroundColor: colors.brand.darkGray,
          text: 'DESCONHECIDO',
          showPulse: false,
        };
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <Animated.View
            style={[
              styles.loadingQR,
              {
                transform: [{ scale: pulseAnimation }],
              },
            ]}
          >
            <Ionicons name="qr-code" size={80} color={colors.brand.primary} />
          </Animated.View>
          <Text style={styles.loadingText}>Carregando ingresso...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!ticket) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={80} color={colors.brand.textSecondary} />
          <Text style={styles.errorTitle}>Ingresso não encontrado</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusConfig = getStatusConfig(ticket.status);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.brand.textPrimary} />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Seu Ingresso</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.backgroundColor }]}>
            {statusConfig.showPulse && (
              <Animated.View style={[styles.statusPulse, { transform: [{ scale: pulseAnimation }] }]} />
            )}
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.text}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.shareButton} onPress={handleShareTicket}>
          <Ionicons name="share-outline" size={24} color={colors.brand.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Ticket Design - Mobile Optimized */}
        <View style={styles.ticketContainer}>
          {/* Ticket Holes Effect */}
          <View style={styles.ticketHoleLeft} />
          <View style={styles.ticketHoleRight} />
          
          <View style={styles.ticket}>
            {/* Top Strip */}
            <LinearGradient
              colors={statusConfig.color === '#8B93A1' ? ['#8B93A1', '#6B7280'] : [colors.brand.primary, '#4F8EF7']}
              style={styles.ticketTopStrip}
            />
            
            {/* Event Info Section */}
            <View style={styles.eventSection}>
              <View style={styles.ticketHeader}>
                <Ionicons name="ticket" size={20} color={colors.brand.primary} />
                <Text style={styles.ticketHeaderText}>Ingresso Digital</Text>
                {statusConfig.showPulse && (
                  <View style={styles.liveIndicator}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>Ao vivo</Text>
                  </View>
                )}
              </View>
              
              <Text style={styles.eventTitle} numberOfLines={2}>
                {ticket.event.title}
              </Text>
              
              <View style={styles.eventDetailsContainer}>
                <View style={styles.eventDetailRow}>
                  <Ionicons name="calendar" size={16} color={colors.brand.primary} />
                  <Text style={styles.eventDetailText}>
                    {ticketsService.formatDate(ticket.event.date)} às {ticketsService.formatTime(ticket.event.date)}
                  </Text>
                </View>
                
                <View style={styles.eventDetailRow}>
                  <Ionicons name="location" size={16} color={colors.brand.primary} />
                  <Text style={styles.eventDetailText} numberOfLines={1}>
                    {ticket.event.venue?.name || ticket.event.location}
                  </Text>
                </View>
                
                {ticket.event.venue?.address && (
                  <View style={styles.eventDetailRow}>
                    <View style={styles.addressIndent} />
                    <Text style={styles.eventAddressText} numberOfLines={2}>
                      {ticket.event.venue.address}, {ticket.event.venue.city}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Dotted Line Separator */}
            <View style={styles.separator}>
              {Array.from({ length: 30 }).map((_, index) => (
                <View key={index} style={styles.separatorDot} />
              ))}
            </View>

            {/* QR Code Section */}
            <View style={styles.qrSection}>
              <Text style={styles.qrSectionTitle}>Apresente este código na entrada</Text>
              
              <View style={[
                styles.qrContainer,
                { borderColor: statusConfig.color }
              ]}>
                <View style={styles.qrCodePlaceholder}>
                  <Ionicons 
                    name="qr-code" 
                    size={200} 
                    color={statusConfig.color === '#8B93A1' ? '#8B93A1' : colors.brand.primary} 
                  />
                </View>
                
                {/* Used Overlay */}
                {ticket.status === TicketStatus.USED && (
                  <View style={styles.usedOverlay}>
                    <Ionicons name="checkmark-circle" size={40} color="#8B93A1" />
                    <Text style={styles.usedOverlayText}>UTILIZADO</Text>
                  </View>
                )}
              </View>
              
              {/* Ticket Info */}
              <View style={styles.ticketInfoContainer}>
                <Text style={styles.ticketIdLabel}>ID do Ingresso</Text>
                <Text style={styles.ticketIdText}>{ticket.id}</Text>
                
                {ticket.ticketBatch && (
                  <View style={styles.batchInfo}>
                    <Text style={styles.batchLabel}>Tipo</Text>
                    <Text style={styles.batchText}>{ticket.ticketBatch.name}</Text>
                  </View>
                )}
                
                <View style={styles.purchaseInfo}>
                  <Text style={styles.purchaseLabel}>Comprado em</Text>
                  <Text style={styles.purchaseText}>
                    {ticketsService.formatDate(ticket.purchaseDate)}
                  </Text>
                </View>
              </View>

              {/* Used Timestamp */}
              {ticket.status === TicketStatus.USED && ticket.checkInDate && (
                <View style={styles.checkInInfo}>
                  <Ionicons name="checkmark-circle" size={16} color="#8B93A1" />
                  <Text style={styles.checkInText}>
                    Utilizado em {ticketsService.formatDate(ticket.checkInDate)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>Como usar seu ingresso</Text>
          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>1</Text>
            </View>
            <Text style={styles.instructionText}>
              Apresente este QR code na entrada do evento
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>2</Text>
            </View>
            <Text style={styles.instructionText}>
              Aguarde a validação pela equipe do evento
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>3</Text>
            </View>
            <Text style={styles.instructionText}>
              Aproveite o evento! 🎉
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand.background,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerBackButton: {
    padding: spacing.sm,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    position: 'relative',
  },
  statusPulse: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 212, 170, 0.3)',
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: 1,
  },
  shareButton: {
    padding: spacing.sm,
  },
  
  // Content
  scrollView: {
    flex: 1,
  },
  ticketContainer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    position: 'relative',
  },
  
  // Ticket Holes
  ticketHoleLeft: {
    position: 'absolute',
    left: spacing.lg,
    top: '60%',
    width: 20,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brand.background,
    zIndex: 2,
  },
  ticketHoleRight: {
    position: 'absolute',
    right: spacing.lg,
    top: '60%',
    width: 20,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brand.background,
    zIndex: 2,
  },
  
  // Ticket
  ticket: {
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  ticketTopStrip: {
    height: 8,
  },
  
  // Event Section
  eventSection: {
    padding: spacing.xl,
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  ticketHeaderText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textPrimary,
    flex: 1,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00D4AA',
  },
  liveText: {
    fontSize: typography.fontSizes.xs,
    color: '#00D4AA',
    fontWeight: typography.fontWeights.semibold,
  },
  eventTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.lg,
    lineHeight: typography.fontSizes.xl * 1.3,
  },
  eventDetailsContainer: {
    gap: spacing.md,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  eventDetailText: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    flex: 1,
  },
  addressIndent: {
    width: 16,
  },
  eventAddressText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    flex: 1,
  },
  
  // Separator
  separator: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  separatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  
  // QR Section
  qrSection: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  qrSectionTitle: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  qrContainer: {
    borderWidth: 3,
    borderStyle: 'dashed',
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    backgroundColor: colors.brand.background,
    position: 'relative',
  },
  qrCodePlaceholder: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  usedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  usedOverlayText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: '#8B93A1',
  },
  
  // Ticket Info
  ticketInfoContainer: {
    marginTop: spacing.xl,
    gap: spacing.lg,
  },
  ticketIdLabel: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    textAlign: 'center',
  },
  ticketIdText: {
    fontSize: typography.fontSizes.md,
    fontFamily: 'monospace',
    color: colors.brand.primary,
    textAlign: 'center',
    fontWeight: typography.fontWeights.semibold,
  },
  batchInfo: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  batchLabel: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
  },
  batchText: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textPrimary,
    fontWeight: typography.fontWeights.semibold,
  },
  purchaseInfo: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  purchaseLabel: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
  },
  purchaseText: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textPrimary,
  },
  checkInInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: 'rgba(139, 147, 161, 0.1)',
    borderRadius: borderRadius.lg,
  },
  checkInText: {
    fontSize: typography.fontSizes.sm,
    color: '#8B93A1',
    fontWeight: typography.fontWeights.semibold,
  },
  
  // Instructions
  instructions: {
    margin: spacing.xl,
    padding: spacing.xl,
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  instructionsTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.lg,
  },
  instructionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionNumberText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.background,
  },
  instructionText: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    flex: 1,
    lineHeight: typography.fontSizes.md * 1.4,
  },
  
  // Loading & Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xl,
  },
  loadingQR: {
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  errorTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  backButtonText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.background,
  },
  
  bottomSpacing: {
    height: spacing.xxxl * 2,
  },
});

export default QRCodeScreen; 