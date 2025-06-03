import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  Platform,
  Animated,
  PanResponder,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { Event } from '../../services/eventsService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Definir altura máxima do modal (95% da tela para ir quase até o fim)
const MODAL_MAX_HEIGHT = Platform.OS === 'ios' 
  ? screenHeight * 0.95 
  : screenHeight - (StatusBar.currentHeight || 0) - 20;

const MODAL_TOP_OFFSET = Platform.OS === 'ios' ? 40 : 20;

// Para animação de fechamento, usar altura maior que a tela
const MODAL_CLOSE_OFFSET = screenHeight + 100;

interface EventActionsModalProps {
  visible: boolean;
  onClose: () => void;
  event: Event | null;
  onViewEvent: (event: Event) => void;
  onViewDashboard: (event: Event) => void;
  onViewAffiliates: (event: Event) => void;
  onCheckIn: (event: Event) => void;
  onEditEvent: (event: Event) => void;
  onDeleteEvent: (event: Event) => void;
  onDuplicateEvent: (event: Event) => void;
}

interface ActionItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  colors: string[];
  onPress: () => void;
}

const EventActionsModal: React.FC<EventActionsModalProps> = ({
  visible,
  onClose,
  event,
  onViewEvent,
  onViewDashboard,
  onViewAffiliates,
  onCheckIn,
  onEditEvent,
  onDeleteEvent,
  onDuplicateEvent,
}) => {
  const slideAnim = useRef(new Animated.Value(MODAL_CLOSE_OFFSET)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  
  // Refs para identificar áreas específicas
  const handleContainerRef = useRef<View>(null);
  const headerRef = useRef<View>(null);
  
  // Estado para controlar se o gesture começou na área da handle
  const gestureStartedInHandle = useRef(false);

  // Gesture handling apenas para a área da handle e header
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        // Verificar se o toque começou na área da handle ou header
        const { pageY } = evt.nativeEvent;
        const modalTopPosition = MODAL_TOP_OFFSET;
        const handleAreaHeight = 60; // Handle container + parte do header
        
        const touchInHandleArea = pageY >= modalTopPosition && pageY <= modalTopPosition + handleAreaHeight;
        gestureStartedInHandle.current = touchInHandleArea;
        
        return touchInHandleArea;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Só responder ao movimento se começou na handle area e está movendo para baixo
        return gestureStartedInHandle.current && Math.abs(gestureState.dy) > 10 && gestureState.dy > 0;
      },
      onPanResponderMove: (evt, gestureState) => {
        // Só processar movimento se começou na handle area
        if (gestureStartedInHandle.current && gestureState.dy > 0) {
          slideAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        // Só fechar se começou na handle area
        if (gestureStartedInHandle.current) {
          if (gestureState.dy > 150 || gestureState.vy > 0.5) {
            closeModal();
          } else {
            Animated.spring(slideAnim, {
              toValue: 0,
              useNativeDriver: true,
              tension: 100,
              friction: 8,
            }).start();
          }
        }
        
        // Reset do estado
        gestureStartedInHandle.current = false;
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      openModal();
    } else {
      closeModalInstant();
    }
  }, [visible]);

  const openModal = () => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 8,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 8,
      }),
    ]).start();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: MODAL_CLOSE_OFFSET, // Deslizar para fora da tela
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const closeModalInstant = () => {
    slideAnim.setValue(MODAL_CLOSE_OFFSET);
    opacityAnim.setValue(0);
    scaleAnim.setValue(0.95);
  };

  const handleShareEvent = () => {
    if (!event) return;
    
    Alert.alert(
      'Compartilhar Evento',
      `Compartilhar "${event.title}" nas redes sociais e apps de mensagem`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Compartilhar', 
          onPress: () => {
            console.log('🔄 Compartilhar evento:', event.id);
            Alert.alert('Em Desenvolvimento', 'Sistema de compartilhamento será implementado em breve!');
          }
        }
      ]
    );
  };

  const handleDeleteWithConfirmation = () => {
    if (!event) return;
    
    Alert.alert(
      '⚠️ Confirmar Exclusão',
      `Tem certeza que deseja excluir "${event.title}"?\n\nEsta ação não pode ser desfeita e todos os dados relacionados serão permanentemente removidos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: () => {
            closeModal();
            setTimeout(() => onDeleteEvent(event), 300);
          }
        }
      ]
    );
  };

  if (!event) return null;

  const actions: ActionItem[] = [
    {
      id: 'view',
      title: 'Ver Evento',
      subtitle: 'Visualizar detalhes completos',
      icon: 'eye',
      colors: ['#4F46E5', '#7C3AED'], // Indigo to Purple - Professional
      onPress: () => {
        closeModal();
        setTimeout(() => onViewEvent(event), 300);
      },
    },
    {
      id: 'dashboard',
      title: 'Dashboard',
      subtitle: 'Métricas e analytics',
      icon: 'analytics',
      colors: ['#059669', '#10B981'], // Emerald - Success/Growth
      onPress: () => {
        closeModal();
        setTimeout(() => onViewDashboard(event), 300);
      },
    },
    {
      id: 'affiliates',
      title: 'Afiliados',
      subtitle: 'Sistema de afiliados',
      icon: 'people',
      colors: ['#2563EB', '#3B82F6'], // Blue - Trust/Network
      onPress: () => {
        closeModal();
        setTimeout(() => onViewAffiliates(event), 300);
      },
    },
    {
      id: 'checkin',
      title: 'Check-in',
      subtitle: 'Controlar entrada dos participantes',
      icon: 'qr-code',
      colors: ['#7C2D12', '#EA580C'], // Orange - Action/Scan
      onPress: () => {
        closeModal();
        setTimeout(() => onCheckIn(event), 300);
      },
    },
    {
      id: 'edit',
      title: 'Editar',
      subtitle: 'Modificar informações do evento',
      icon: 'create',
      colors: ['#B45309', '#F59E0B'], // Amber - Edit/Modify
      onPress: () => {
        closeModal();
        setTimeout(() => onEditEvent(event), 300);
      },
    },
    {
      id: 'duplicate',
      title: 'Duplicar',
      subtitle: 'Criar cópia com mesmas configurações',
      icon: 'copy',
      colors: ['#5B21B6', '#8B5CF6'], // Violet - Copy/Duplicate
      onPress: () => {
        closeModal();
        setTimeout(() => onDuplicateEvent(event), 300);
      },
    },
    {
      id: 'share',
      title: 'Compartilhar',
      subtitle: 'Divulgar nas redes sociais',
      icon: 'share',
      colors: ['#0369A1', '#0EA5E9'], // Sky Blue - Share/Social
      onPress: handleShareEvent,
    },
    {
      id: 'delete',
      title: 'Excluir',
      subtitle: 'Remover evento permanentemente',
      icon: 'trash',
      colors: ['#BE123C', '#F43F5E'], // Rose - Danger/Delete
      onPress: handleDeleteWithConfirmation,
    },
  ];

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={closeModal}
    >
      <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.8)" translucent />
      
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]}>
        <TouchableOpacity style={styles.backdropTouch} onPress={closeModal} />
      </Animated.View>

      {/* Modal Content */}
      <Animated.View
        style={[
          styles.modalContainer,
          {
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim }
            ],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Handle Bar - Área específica para arrastar */}
        <View ref={handleContainerRef} style={styles.handleContainer}>
          <View style={styles.handle} />
          <Text style={styles.dragHint}>Arraste para baixo para fechar</Text>
        </View>

        {/* Header - Também parte da área de drag */}
        <View ref={headerRef} style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle} numberOfLines={2}>
                {event.title}
              </Text>
              <View style={styles.eventStats}>
                <View style={styles.stat}>
                  <Ionicons name="ticket" size={14} color={colors.brand.primary} />
                  <Text style={styles.statText}>{event.ticketsSold || 0} vendidos</Text>
                </View>
                <View style={styles.stat}>
                  <Ionicons name="cash" size={14} color={colors.brand.primary} />
                  <Text style={styles.statText}>{formatCurrency(event.totalRevenue || 0)}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <Ionicons name="close" size={20} color={colors.brand.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Actions List - Área de scroll livre */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
          scrollEventThrottle={16}
        >
          <View style={styles.actionsContainer}>
            {actions.map((action, index) => (
              <Animated.View
                key={action.id}
                style={[
                  styles.actionWrapper,
                  {
                    transform: [
                      {
                        translateY: slideAnim.interpolate({
                          inputRange: [0, MODAL_CLOSE_OFFSET],
                          outputRange: [0, 50 * (index + 1)],
                          extrapolate: 'clamp',
                        }),
                      },
                    ],
                    opacity: opacityAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1 - index * 0.05],
                      extrapolate: 'clamp',
                    }),
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={action.onPress}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={action.colors as [string, string]}
                    style={styles.actionGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.actionIcon}>
                      <Ionicons name={action.icon as any} size={24} color="white" />
                    </View>
                    <View style={styles.actionContent}>
                      <Text style={styles.actionTitle}>{action.title}</Text>
                      <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.9)" />
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  backdropTouch: {
    flex: 1,
  },
  modalContainer: {
    position: 'absolute',
    top: MODAL_TOP_OFFSET,
    left: 0,
    right: 0,
    height: MODAL_MAX_HEIGHT,
    backgroundColor: colors.brand.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: colors.brand.background,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.brand.textSecondary,
    borderRadius: 2,
    opacity: 0.4,
    marginBottom: 4,
  },
  dragHint: {
    fontSize: 11,
    color: colors.brand.textSecondary,
    opacity: 0.6,
    textAlign: 'center',
  },
  header: {
    backgroundColor: colors.brand.background,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.opacity.cardBorder,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  eventInfo: {
    flex: 1,
    marginRight: 16,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.brand.textPrimary,
    marginBottom: 8,
    lineHeight: 28,
  },
  eventStats: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: colors.brand.textSecondary,
    fontWeight: '500',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brand.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    gap: 14,
  },
  actionWrapper: {
    overflow: 'hidden',
    borderRadius: 16,
  },
  actionButton: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    minHeight: 76,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: 'white',
    marginBottom: 3,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  actionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 17,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  bottomSpacing: {
    height: Platform.OS === 'ios' ? 50 : 40,
  },
});

export default EventActionsModal; 