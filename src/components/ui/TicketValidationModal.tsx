import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  Image,
  ActivityIndicator,
  Vibration,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme';
import { Ticket, TicketStatus, CheckInResult } from '../../services/ticketsService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface TicketValidationModalProps {
  visible: boolean;
  ticket: Ticket | null;
  onApprove: () => Promise<CheckInResult>;
  onReject: () => void;
  onClose: () => void;
}

export const TicketValidationModal: React.FC<TicketValidationModalProps> = ({
  visible,
  ticket,
  onApprove,
  onReject,
  onClose,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const avatarAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0.8)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      setResult(null);
      setShowResult(false);
      setIsProcessing(false);

      // Complex entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.spring(cardAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 80,
          friction: 8,
          delay: 150,
        }),
        Animated.spring(avatarAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 60,
          friction: 7,
          delay: 300,
        }),
      ]).start();

      // Shimmer effect
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Pulse animation for processing
  useEffect(() => {
    if (isProcessing) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isProcessing]);

  const handleApprove = async () => {
    if (!ticket || isProcessing) return;

    setIsProcessing(true);
    Vibration.vibrate([50, 25, 50]);

    try {
      const checkInResult = await onApprove();
      setResult(checkInResult);
      setShowResult(true);

      if (checkInResult.success) {
        Vibration.vibrate([100, 50, 100, 50, 200]);
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        Vibration.vibrate([300, 100, 300, 100, 300]);
      }
    } catch (error) {
      console.error('Erro ao aprovar check-in:', error);
      setResult({
        success: false,
        message: 'Erro interno. Tente novamente.',
        error: 'INTERNAL_ERROR',
      });
      setShowResult(true);
      Vibration.vibrate([300, 100, 300, 100, 300]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = () => {
    Vibration.vibrate([100, 50, 100]);
    onReject();
    onClose();
  };

  const getStatusConfig = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.ACTIVE:
        return {
          color: '#00D4AA',
          backgroundColor: 'rgba(0, 212, 170, 0.15)',
          borderColor: 'rgba(0, 212, 170, 0.3)',
          text: 'VÁLIDO',
          icon: 'checkmark-circle',
          canCheckIn: true,
        };
      case TicketStatus.USED:
        return {
          color: '#8B93A1',
          backgroundColor: 'rgba(139, 147, 161, 0.15)',
          borderColor: 'rgba(139, 147, 161, 0.3)',
          text: 'JÁ UTILIZADO',
          icon: 'checkmark-done',
          canCheckIn: false,
        };
      case TicketStatus.CANCELLED:
        return {
          color: '#FF6B6B',
          backgroundColor: 'rgba(255, 107, 107, 0.15)',
          borderColor: 'rgba(255, 107, 107, 0.3)',
          text: 'CANCELADO',
          icon: 'close-circle',
          canCheckIn: false,
        };
      default:
        return {
          color: '#8B93A1',
          backgroundColor: 'rgba(139, 147, 161, 0.15)',
          borderColor: 'rgba(139, 147, 161, 0.3)',
          text: 'INVÁLIDO',
          icon: 'help-circle',
          canCheckIn: false,
        };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  // Generate avatar from name
  const getAvatarFromName = (name: string) => {
    const initials = name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
    return initials;
  };

  if (!ticket) return null;

  const statusConfig = getStatusConfig(ticket.status);

  // Result Screen
  if (showResult && result) {
    return (
      <Modal visible={visible} transparent animationType="none">
        <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.9)" />
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <BlurView intensity={80} style={StyleSheet.absoluteFillObject} />
          
          <Animated.View
            style={[
              styles.resultContainer,
              { transform: [{ translateY: slideAnim }, { scale: pulseAnim }] }
            ]}
          >
                         <LinearGradient
               colors={['#0A0A0A', '#1E1E1E']}
               style={styles.resultGradient}
             />
            
            <View style={[
              styles.resultIconContainer,
              { backgroundColor: result.success ? 'rgba(0, 212, 170, 0.2)' : 'rgba(255, 107, 107, 0.2)' }
            ]}>
              <Ionicons
                name={result.success ? 'checkmark-circle' : 'close-circle'}
                size={80}
                color={result.success ? '#00D4AA' : '#FF6B6B'}
              />
            </View>
            
            <Text style={[
              styles.resultTitle,
              { color: result.success ? '#00D4AA' : '#FF6B6B' }
            ]}>
              {result.success ? 'CHECK-IN APROVADO' : 'CHECK-IN NEGADO'}
            </Text>
            
            <Text style={styles.resultMessage}>
              {result.message}
            </Text>

            {result.success && ticket.user && (
              <View style={styles.resultUserInfo}>
                <Text style={styles.resultUserName}>
                  {ticket.user.name}
                </Text>
                <Text style={styles.resultUserEmail}>
                  {ticket.user.email}
                </Text>
              </View>
            )}
          </Animated.View>
        </Animated.View>
      </Modal>
    );
  }

  // Main Modal
  return (
    <Modal visible={visible} transparent animationType="none">
      <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.9)" />
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <BlurView intensity={80} style={StyleSheet.absoluteFillObject} />
        
        <Animated.View
          style={[
            styles.modalContainer,
            { 
              transform: [
                { translateY: slideAnim },
                { scale: cardAnim }
              ] 
            }
          ]}
        >
          {/* Header with Close Button */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.brand.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
            {/* User Avatar Section */}
            <Animated.View 
              style={[
                styles.avatarSection,
                { transform: [{ scale: avatarAnim }] }
              ]}
            >
              <View style={styles.avatarContainer}>
                {ticket.user?.profileImage ? (
                  <Image
                    source={{ uri: ticket.user.profileImage }}
                    style={styles.avatarImage}
                    onError={() => {
                      // Fallback to initials if image fails to load
                      console.log('Failed to load profile image, using initials');
                    }}
                  />
                ) : (
                  <LinearGradient
                    colors={['#FFD700', '#FFC107']}
                    style={styles.avatarGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.avatarText}>
                      {getAvatarFromName(ticket.user?.name || 'Usuario')}
                    </Text>
                  </LinearGradient>
                )}
                
                {/* Shimmer effect */}
                <Animated.View
                  style={[
                    styles.shimmer,
                    {
                      opacity: shimmerAnim,
                      transform: [{
                        translateX: shimmerAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-100, 100],
                        })
                      }]
                    }
                  ]}
                />
              </View>
              
              <Text style={styles.userName}>
                {ticket.user?.name || 'Nome não disponível'}
              </Text>
              
              <Text style={styles.userEmail}>
                {ticket.user?.email || 'Email não disponível'}
              </Text>
            </Animated.View>

            {/* Status Badge */}
            <View style={[
              styles.statusBadge,
              { 
                backgroundColor: statusConfig.backgroundColor,
                borderColor: statusConfig.borderColor,
              }
            ]}>
              <Ionicons 
                name={statusConfig.icon as any} 
                size={16} 
                color={statusConfig.color} 
              />
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.text}
              </Text>
            </View>

            {/* Event Information */}
            <View style={styles.eventCard}>
              <LinearGradient
                colors={['rgba(255, 215, 0, 0.05)', 'rgba(255, 193, 7, 0.02)']}
                style={styles.eventGradient}
              />
              
              <View style={styles.eventHeader}>
                <Ionicons name="calendar" size={20} color={colors.brand.primary} />
                <Text style={styles.eventTitle}>
                  {ticket.event?.title || 'Evento'}
                </Text>
              </View>
              
              <View style={styles.eventDetails}>
                <View style={styles.eventDetailRow}>
                  <Ionicons name="location" size={16} color={colors.brand.textSecondary} />
                  <Text style={styles.eventDetailText}>
                    {ticket.event?.location || 'Local não informado'}
                  </Text>
                </View>
                
                <View style={styles.eventDetailRow}>
                  <Ionicons name="time" size={16} color={colors.brand.textSecondary} />
                  <Text style={styles.eventDetailText}>
                    {ticket.event?.date ? formatDate(ticket.event.date) : 'Data não informada'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Ticket Information */}
            <View style={styles.ticketCard}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.03)', 'rgba(255, 255, 255, 0.01)']}
                style={styles.ticketGradient}
              />
              
              <Text style={styles.sectionTitle}>Informações do Ingresso</Text>
              
              <View style={styles.ticketInfo}>
                <View style={styles.ticketRow}>
                  <Text style={styles.ticketLabel}>Tipo:</Text>
                  <Text style={styles.ticketValue}>
                    {ticket.ticketBatch?.name || 'Padrão'}
                  </Text>
                </View>
                
                <View style={styles.ticketRow}>
                  <Text style={styles.ticketLabel}>Valor:</Text>
                  <Text style={[styles.ticketValue, styles.priceText]}>
                    {formatPrice(ticket.price)}
                  </Text>
                </View>
                
                <View style={styles.ticketRow}>
                  <Text style={styles.ticketLabel}>Compra:</Text>
                  <Text style={styles.ticketValue}>
                    {ticket.purchaseDate ? formatDate(ticket.purchaseDate) : 'Data não disponível'}
                  </Text>
                </View>
                
                <View style={styles.ticketRow}>
                  <Text style={styles.ticketLabel}>ID:</Text>
                  <Text style={[styles.ticketValue, styles.idText]}>
                    {ticket.id?.substring(0, 8)}...
                  </Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.rejectButton,
                  isProcessing && styles.disabledButton
                ]}
                onPress={handleReject}
                disabled={isProcessing}
              >
                <LinearGradient
                  colors={['rgba(255, 107, 107, 0.2)', 'rgba(255, 107, 107, 0.1)']}
                  style={styles.buttonGradient}
                />
                <Ionicons name="close" size={20} color="#FF6B6B" />
                <Text style={[styles.buttonText, { color: '#FF6B6B' }]}>
                  NEGAR
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.approveButton,
                  !statusConfig.canCheckIn && styles.disabledButton,
                  isProcessing && styles.processingButton
                ]}
                onPress={handleApprove}
                disabled={!statusConfig.canCheckIn || isProcessing}
              >
                <LinearGradient
                  colors={statusConfig.canCheckIn 
                    ? ['rgba(0, 212, 170, 0.3)', 'rgba(0, 212, 170, 0.1)']
                    : ['rgba(139, 147, 161, 0.2)', 'rgba(139, 147, 161, 0.1)']
                  }
                  style={styles.buttonGradient}
                />
                
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#00D4AA" />
                ) : (
                  <Ionicons 
                    name="checkmark" 
                    size={20} 
                    color={statusConfig.canCheckIn ? '#00D4AA' : '#8B93A1'} 
                  />
                )}
                
                <Text style={[
                  styles.buttonText, 
                  { color: statusConfig.canCheckIn ? '#00D4AA' : '#8B93A1' }
                ]}>
                  {isProcessing ? 'PROCESSANDO...' : 'APROVAR'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: screenWidth * 0.92,
    maxHeight: screenHeight * 0.88,
    backgroundColor: colors.brand.card,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    paddingBottom: 0,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    paddingHorizontal: 24,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 8,
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.brand.background,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.brand.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: colors.brand.textSecondary,
    textAlign: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginVertical: 20,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  eventCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.1)',
    overflow: 'hidden',
  },
  eventGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.brand.textPrimary,
    marginLeft: 8,
    flex: 1,
  },
  eventDetails: {
    gap: 8,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventDetailText: {
    fontSize: 14,
    color: colors.brand.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  ticketCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
  },
  ticketGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.brand.textPrimary,
    marginBottom: 16,
  },
  ticketInfo: {
    gap: 12,
  },
  ticketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketLabel: {
    fontSize: 14,
    color: colors.brand.textSecondary,
    fontWeight: '500',
  },
  ticketValue: {
    fontSize: 14,
    color: colors.brand.textPrimary,
    fontWeight: '600',
  },
  priceText: {
    color: colors.brand.primary,
    fontWeight: '700',
  },
  idText: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    overflow: 'hidden',
    borderWidth: 1,
  },
  buttonGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  rejectButton: {
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  approveButton: {
    borderColor: 'rgba(0, 212, 170, 0.3)',
  },
  disabledButton: {
    opacity: 0.5,
    borderColor: 'rgba(139, 147, 161, 0.3)',
  },
  processingButton: {
    borderColor: 'rgba(0, 212, 170, 0.5)',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  
  // Result Screen Styles
  resultContainer: {
    width: screenWidth * 0.85,
    backgroundColor: colors.brand.card,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.1)',
    overflow: 'hidden',
  },
  resultGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  resultIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  resultMessage: {
    fontSize: 16,
    color: colors.brand.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  resultUserInfo: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    width: '100%',
  },
  resultUserName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.brand.textPrimary,
    marginBottom: 4,
  },
  resultUserEmail: {
    fontSize: 14,
    color: colors.brand.textSecondary,
  },
});

export default TicketValidationModal; 