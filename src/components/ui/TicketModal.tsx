import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  Share,
  Platform,
  Image,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as Brightness from 'expo-brightness';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { Ticket, TicketStatus, ticketsService } from '../../services/ticketsService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface TicketModalProps {
  visible: boolean;
  tickets: Ticket[];
  initialTicketIndex?: number;
  onClose: () => void;
}

export const TicketModal: React.FC<TicketModalProps> = ({
  visible,
  tickets,
  initialTicketIndex = 0,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialTicketIndex);
  const [originalBrightness, setOriginalBrightness] = useState<number | null>(null);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const panY = useRef(new Animated.Value(0)).current;
  const qrScale = useRef(new Animated.Value(0.8)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideX = useRef(new Animated.Value(0)).current;
  const nextSlideX = useRef(new Animated.Value(screenWidth)).current;

  const currentTicket = tickets && tickets.length > 0 ? tickets[Math.min(currentIndex, tickets.length - 1)] : null;

  // Brightness management
  useEffect(() => {
    const manageBrightness = async () => {
      if (visible) {
        try {
          const currentBrightness = await Brightness.getBrightnessAsync();
          setOriginalBrightness(currentBrightness);
          await Brightness.setBrightnessAsync(1.0);
        } catch (error) {
          console.warn('Failed to set brightness:', error);
        }
      } else if (originalBrightness !== null) {
        try {
          await Brightness.setBrightnessAsync(originalBrightness);
          setOriginalBrightness(null);
        } catch (error) {
          console.warn('Failed to restore brightness:', error);
        }
      }
    };

    manageBrightness();

    return () => {
      if (originalBrightness !== null && !visible) {
        Brightness.setBrightnessAsync(originalBrightness).catch(console.warn);
      }
    };
  }, [visible, originalBrightness]);

  // Status pulse animation for active tickets
  useEffect(() => {
    if (currentTicket?.status === TicketStatus.ACTIVE) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [currentTicket?.status]);

  // Animation when modal opens/closes
  useEffect(() => {
    if (visible) {
      setCurrentIndex(initialTicketIndex);
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 8,
        }),
      ]).start(() => {
        // Animate QR code
        Animated.spring(qrScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
      });
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: screenHeight,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, initialTicketIndex]);

  const animateTicketChange = useCallback((newIndex: number, direction: 'left' | 'right' = 'right') => {
    const slideDistance = direction === 'right' ? -screenWidth : screenWidth;
    const nextSlideStart = direction === 'right' ? screenWidth : -screenWidth;

    // Slide out current ticket
    Animated.parallel([
      Animated.timing(slideX, {
        toValue: slideDistance,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 0.3,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Change ticket index
      setCurrentIndex(newIndex);
      
      // Reset positions for new ticket
      slideX.setValue(nextSlideStart);
      nextSlideX.setValue(0);
      
      // Slide in new ticket
      Animated.parallel([
        Animated.spring(slideX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(qrScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 120,
          friction: 8,
        }),
      ]).start();
    });
  }, []);

  const handleSwipeDown = useCallback((event: any) => {
    const { translationY, velocityY, state } = event.nativeEvent;

    if (state === State.ACTIVE) {
      if (translationY > 0) {
        panY.setValue(translationY);
        const opacity = Math.max(0.2, 1 - translationY / 500);
        fadeAnim.setValue(opacity);
      }
    } else if (state === State.END) {
      if (translationY > 120 || velocityY > 1000) {
        Animated.timing(panY, {
          toValue: screenHeight,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          panY.setValue(0);
          fadeAnim.setValue(1);
          onClose();
        });
      } else {
        Animated.parallel([
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }),
          Animated.spring(fadeAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }),
        ]).start();
      }
    }
  }, [onClose]);

  const handleSwipeHorizontal = useCallback((event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;
      const threshold = 80;

      if (translationX > threshold && currentIndex > 0) {
        animateTicketChange(currentIndex - 1, 'left');
      } else if (translationX < -threshold && currentIndex < tickets.length - 1) {
        animateTicketChange(currentIndex + 1, 'right');
      }
    }
  }, [currentIndex, tickets.length, animateTicketChange]);

  const handleShareTicket = async () => {
    try {
      const ticket = tickets[currentIndex];
      if (!ticket || !ticket.event) return;
      
      await Share.share({
        message: `🎫 Meu ingresso para ${ticket.event.title}\n\nID: ${ticket.id}\n\nEvento: ${ticket.event.title}\nData: ${formatDate(ticket.event.date)}\nLocal: ${ticket.event.venue?.name || 'Local não informado'}`,
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
          label: 'ATIVO',
          icon: 'checkmark-circle' as const,
          color: '#FFD700',
          bgColor: 'rgba(255, 215, 0, 0.15)',
          borderColor: '#FFD700',
          gradientColors: ['#FFD700', '#FFA500'] as const,
        };
      case TicketStatus.USED:
        return {
          label: 'UTILIZADO',
          icon: 'checkmark-done' as const,
          color: '#8B8B8B',
          bgColor: 'rgba(139, 139, 139, 0.15)',
          borderColor: '#8B8B8B',
          gradientColors: ['#8B8B8B', '#666666'] as const,
        };
      case TicketStatus.CANCELLED:
        return {
          label: 'CANCELADO',
          icon: 'close-circle' as const,
          color: '#B8860B',
          bgColor: 'rgba(184, 134, 11, 0.15)',
          borderColor: '#B8860B',
          gradientColors: ['#B8860B', '#8B6914'] as const,
        };
      case TicketStatus.REFUNDED:
        return {
          label: 'REEMBOLSADO',
          icon: 'arrow-undo' as const,
          color: '#DAA520',
          bgColor: 'rgba(218, 165, 32, 0.15)',
          borderColor: '#DAA520',
          gradientColors: ['#DAA520', '#B8860B'] as const,
        };
      default:
        return {
          label: 'INVÁLIDO',
          icon: 'help-circle' as const,
          color: '#8B8B8B',
          bgColor: 'rgba(139, 139, 139, 0.15)',
          borderColor: '#8B8B8B',
          gradientColors: ['#8B8B8B', '#666666'] as const,
        };
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price?: number) => {
    if (!price) return 'Gratuito';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  if (!currentTicket) return null;

  const statusConfig = getStatusConfig(currentTicket.status);

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <PanGestureHandler onHandlerStateChange={handleSwipeDown}>
          <Animated.View
            style={[
              styles.container,
              {
                transform: [
                  { translateY: Animated.add(translateY, panY) },
                ],
              },
            ]}
          >
            {/* Modern Header */}
            <LinearGradient
              colors={['rgba(0, 0, 0, 0.98)', 'rgba(26, 26, 26, 0.95)']}
              style={styles.header}
            >
              <View style={styles.dragIndicator} />
              
              <View style={styles.headerContent}>
                <TouchableOpacity style={styles.headerButton} onPress={onClose}>
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                
                <View style={styles.headerCenter}>
                  <Text style={styles.headerTitle}>Ingresso Digital</Text>
                  {tickets.length > 1 && (
                    <Text style={styles.headerSubtitle}>
                      {currentIndex + 1} de {tickets.length}
                    </Text>
                  )}
                </View>
                
                <TouchableOpacity style={styles.headerButton} onPress={handleShareTicket}>
                  <Ionicons name="share-outline" size={24} color="#FFD700" />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            <PanGestureHandler onHandlerStateChange={handleSwipeHorizontal}>
              <Animated.View style={[
                styles.ticketContainer, 
                { 
                  opacity: contentOpacity,
                  transform: [{ translateX: slideX }]
                }
              ]}>
                <ScrollView 
                  style={styles.scrollContainer}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.scrollContent}
                >
                  {/* Modern Ticket Card */}
                  <LinearGradient
                    colors={['#000000', '#1A1A1A']}
                    style={styles.ticketCard}
                  >
                    {/* Status Badge */}
                    <View style={styles.statusContainer}>
                      <Animated.View style={[
                        styles.statusBadge, 
                        { 
                          backgroundColor: statusConfig.bgColor,
                          borderColor: statusConfig.borderColor,
                          transform: [{ scale: currentTicket.status === TicketStatus.ACTIVE ? pulseAnim : 1 }]
                        }
                      ]}>
                        <LinearGradient
                          colors={statusConfig.gradientColors}
                          style={styles.statusGradient}
                        >
                          <Ionicons name={statusConfig.icon} size={16} color="#000000" />
                          <Text style={styles.statusText}>
                            {statusConfig.label}
                          </Text>
                        </LinearGradient>
                      </Animated.View>
                    </View>

                    {/* Event Title */}
                    <View style={styles.eventTitleContainer}>
                      <Text style={[
                        styles.eventTitle,
                        currentTicket.status === TicketStatus.USED && styles.eventTitleUsed
                      ]}>
                        {currentTicket.event?.title || 'Evento sem título'}
                      </Text>
                    </View>

                    {/* QR Code Section - PROTAGONISTA */}
                    <View style={styles.qrSection}>
                      <View style={styles.qrContainer}>
                        <Animated.View style={[
                          styles.qrWrapper,
                          { transform: [{ scale: qrScale }] }
                        ]}>
                          <QRCode
                            value={currentTicket.id}
                            size={180}
                            color="#000000"
                            backgroundColor="#FFFFFF"
                            logoSize={25}
                            logoBackgroundColor="#FFFFFF"
                            logoMargin={2}
                            quietZone={8}
                          />
                        </Animated.View>
                        
                        {/* Used Overlay */}
                        {currentTicket.status === TicketStatus.USED && (
                          <View style={styles.usedOverlay}>
                            <LinearGradient
                              colors={['rgba(139, 139, 139, 0.9)', 'rgba(102, 102, 102, 0.7)']}
                              style={styles.usedOverlayBg}
                            >
                              <Ionicons name="checkmark-circle" size={32} color="#FFFFFF" />
                              <Text style={styles.usedOverlayText}>UTILIZADO</Text>
                            </LinearGradient>
                          </View>
                        )}
                      </View>
                      
                      <Text style={styles.qrInstructions}>
                        Apresente este código na entrada
                      </Text>
                    </View>

                    {/* Event Details - Organized and Clean */}
                    <View style={styles.detailsSection}>
                      <View style={styles.detailCard}>
                        <View style={styles.detailItem}>
                          <View style={styles.detailIconContainer}>
                            <Ionicons name="calendar-outline" size={20} color="#FFD700" />
                          </View>
                          <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>Data e Horário</Text>
                            <Text style={[
                              styles.detailValue,
                              currentTicket.status === TicketStatus.USED && styles.detailValueUsed
                            ]}>
                              {currentTicket.event?.date ? formatDate(currentTicket.event.date) : 'Data não disponível'}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.detailCard}>
                        <View style={styles.detailItem}>
                          <View style={styles.detailIconContainer}>
                            <Ionicons name="location-outline" size={20} color="#FFD700" />
                          </View>
                          <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>Local</Text>
                            <Text style={[
                              styles.detailValue,
                              currentTicket.status === TicketStatus.USED && styles.detailValueUsed
                            ]}>
                              {currentTicket.event?.venue?.name || 'Local não informado'}
                            </Text>
                            {currentTicket.event?.venue?.address && (
                              <Text style={[
                                styles.detailSubValue,
                                currentTicket.status === TicketStatus.USED && styles.detailValueUsed
                              ]}>
                                {currentTicket.event.venue.address}
                              </Text>
                            )}
                          </View>
                        </View>
                      </View>

                      {currentTicket.ticketBatch && (
                        <View style={styles.detailCard}>
                          <View style={styles.detailItem}>
                            <View style={styles.detailIconContainer}>
                              <Ionicons name="ticket-outline" size={20} color="#FFD700" />
                            </View>
                            <View style={styles.detailContent}>
                              <Text style={styles.detailLabel}>Tipo de Ingresso</Text>
                              <Text style={[
                                styles.detailValue,
                                currentTicket.status === TicketStatus.USED && styles.detailValueUsed
                              ]}>
                                {currentTicket.ticketBatch.name}
                              </Text>
                            </View>
                          </View>
                        </View>
                      )}

                      <View style={styles.detailCard}>
                        <View style={styles.detailItem}>
                          <View style={styles.detailIconContainer}>
                            <Ionicons name="card-outline" size={20} color="#FFD700" />
                          </View>
                          <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>Valor Pago</Text>
                            <Text style={[
                              styles.detailValue,
                              currentTicket.status === TicketStatus.USED && styles.detailValueUsed
                            ]}>
                              {formatPrice(currentTicket.price)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* Ticket ID - Clean Display */}
                    <View style={styles.ticketIdSection}>
                      <LinearGradient
                        colors={['rgba(255, 215, 0, 0.1)', 'rgba(255, 215, 0, 0.05)']}
                        style={styles.ticketIdCard}
                      >
                        <Text style={styles.ticketIdLabel}>ID do Ingresso</Text>
                        <Text style={[
                          styles.ticketIdValue,
                          currentTicket.status === TicketStatus.USED && styles.ticketIdUsed
                        ]}>
                          {currentTicket.id}
                        </Text>
                      </LinearGradient>
                    </View>
                  </LinearGradient>

                  {/* Navigation Dots - Modern Style */}
                  {tickets.length > 1 && (
                    <View style={styles.dotsContainer}>
                      {tickets.map((_, index) => (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.dot,
                            index === currentIndex && styles.activeDot,
                          ]}
                          onPress={() => animateTicketChange(index, index > currentIndex ? 'right' : 'left')}
                        />
                      ))}
                    </View>
                  )}

                  {/* Swipe Instructions */}
                  <View style={styles.swipeInstructions}>
                    <Text style={styles.swipeInstructionText}>
                      {tickets.length > 1 ? 'Deslize para navegar • ' : ''}Deslize para baixo para fechar
                    </Text>
                  </View>
                </ScrollView>
              </Animated.View>
            </PanGestureHandler>
          </Animated.View>
        </PanGestureHandler>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  ticketContainer: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  ticketCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusBadge: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  statusGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 1,
  },
  eventTitleContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 30,
  },
  eventTitleUsed: {
    color: '#8B93A1',
  },
  qrSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  qrContainer: {
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  qrWrapper: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  qrInstructions: {
    fontSize: 14,
    color: 'rgba(255, 215, 0, 0.8)',
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '500',
  },
  detailsSection: {
    gap: 12,
    marginBottom: 24,
  },
  detailCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    lineHeight: 20,
  },
  detailValueUsed: {
    color: '#8B93A1',
  },
  detailSubValue: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
    lineHeight: 16,
  },
  ticketIdSection: {
    alignItems: 'center',
  },
  ticketIdCard: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    minWidth: 200,
  },
  ticketIdLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  ticketIdValue: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 1,
  },
  ticketIdUsed: {
    color: '#8B93A1',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  activeDot: {
    backgroundColor: '#FFD700',
    width: 24,
    borderRadius: 4,
  },
  swipeInstructions: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  swipeInstructionText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    fontWeight: '500',
  },
  usedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    overflow: 'hidden',
  },
  usedOverlayBg: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  usedOverlayText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
}); 