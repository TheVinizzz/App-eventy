import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Haptics from 'expo-haptics';

import { colors, spacing, typography, borderRadius } from '../theme';
import { RootStackParamList } from '../navigation/types';
import paymentService, { PaymentStatusDto } from '../services/paymentService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type PaymentSuccessScreenRouteProp = RouteProp<RootStackParamList, 'PaymentSuccess'>;
type PaymentSuccessScreenNavigationProp = StackNavigationProp<RootStackParamList, 'PaymentSuccess'>;

interface PaymentSuccessScreenProps {
  route: PaymentSuccessScreenRouteProp;
  navigation: PaymentSuccessScreenNavigationProp;
}

const PaymentSuccessScreen: React.FC<PaymentSuccessScreenProps> = () => {
  const route = useRoute<PaymentSuccessScreenRouteProp>();
  const navigation = useNavigation<PaymentSuccessScreenNavigationProp>();
  const { paymentId } = route.params;

  const [paymentData, setPaymentData] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPaymentData();
    // Trigger success haptic
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const loadPaymentData = async () => {
    try {
      const [payment, status] = await Promise.all([
        paymentService.getPaymentById(paymentId),
        paymentService.checkPaymentStatus(paymentId)
      ]);

      setPaymentData(payment);
      setPaymentStatus(status);
    } catch (error) {
      console.error('Erro ao carregar dados do pagamento:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do pagamento.');
    } finally {
      setLoading(false);
    }
  };

  const handleShareSuccess = async () => {
    try {
      const message = `🎉 Consegui meu ingresso! ${paymentData?.eventTitle || 'Evento incrível'} 🎫\n\nVou te ver lá! 🔥`;
      
      await Share.share({
        message,
        title: 'Ingresso confirmado!',
      });
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
    }
  };

  const handleGoToTickets = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navegar para Main primeiro, depois usar reset para ir para Tickets
    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'Main',
          state: {
            routes: [{ name: 'Tickets' }],
            index: 0,
          },
        },
      ],
    });
  };

  const handleGoHome = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navegar para Main primeiro, depois usar reset para ir para Home
    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'Main',
          state: {
            routes: [{ name: 'Home' }],
            index: 0,
          },
        },
      ],
    });
  };

  const renderSuccessAnimation = () => (
    <View style={styles.animationContainer}>
      <View style={styles.successIcon}>
        <LinearGradient
          colors={[colors.brand.primary, colors.brand.secondary]}
          style={styles.successGradient}
        >
          <Ionicons name="checkmark" size={60} color={colors.brand.background} />
        </LinearGradient>
      </View>
      
      {/* Confetti-like decorations */}
      <View style={[styles.confetti, styles.confetti1]} />
      <View style={[styles.confetti, styles.confetti2]} />
      <View style={[styles.confetti, styles.confetti3]} />
      <View style={[styles.confetti, styles.confetti4]} />
    </View>
  );

  const renderSuccessHeader = () => (
    <View style={styles.successHeader}>
      <Text style={styles.successTitle}>Pagamento Confirmado!</Text>
      <Text style={styles.successSubtitle}>
        {paymentStatus?.paid 
          ? 'Seu ingresso foi confirmado e já está disponível' 
          : 'Seu pagamento foi processado com sucesso'}
      </Text>
    </View>
  );

  const renderPaymentDetails = () => (
    <View style={styles.section}>
      <View style={styles.detailsCard}>
        <View style={styles.detailsHeader}>
          <Ionicons name="receipt" size={24} color={colors.brand.primary} />
          <Text style={styles.detailsTitle}>Detalhes do Pagamento</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>ID do Pagamento</Text>
          <Text style={styles.detailValue}>{paymentId}</Text>
        </View>

        {paymentData?.eventTitle && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Evento</Text>
            <Text style={styles.detailValue}>{paymentData.eventTitle}</Text>
          </View>
        )}

        {paymentData?.amount && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Valor Total</Text>
            <Text style={styles.detailValue}>
              {paymentService.formatCurrency(paymentData.amount)}
            </Text>
          </View>
        )}

        {paymentStatus?.paymentMethod && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Método de Pagamento</Text>
            <Text style={styles.detailValue}>
              {paymentStatus.paymentMethod === 'PIX' ? 'PIX' : 'Cartão de Crédito'}
            </Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Data e Hora</Text>
          <Text style={styles.detailValue}>
            {new Date().toLocaleString('pt-BR')}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Status</Text>
          <View style={styles.statusContainer}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {paymentStatus?.paid ? 'Confirmado' : 'Processando'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  const renderTicketInfo = () => {
    if (!paymentStatus?.hasTickets) return null;

    return (
      <View style={styles.section}>
        <View style={styles.ticketCard}>
          <LinearGradient
            colors={[`${colors.brand.primary}20`, `${colors.brand.secondary}20`]}
            style={styles.ticketGradient}
          >
            <View style={styles.ticketHeader}>
              <Ionicons name="ticket" size={32} color={colors.brand.primary} />
              <View style={styles.ticketHeaderText}>
                <Text style={styles.ticketTitle}>Seus Ingressos</Text>
                <Text style={styles.ticketSubtitle}>
                  {paymentStatus.ticketCount || 1} ingresso{(paymentStatus.ticketCount || 1) > 1 ? 's' : ''} confirmado{(paymentStatus.ticketCount || 1) > 1 ? 's' : ''}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.viewTicketsButton} onPress={handleGoToTickets}>
              <Text style={styles.viewTicketsText}>Ver Meus Ingressos</Text>
              <Ionicons name="arrow-forward" size={20} color={colors.brand.primary} />
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    );
  };

  const renderActionButtons = () => (
    <View style={styles.actionSection}>
      <TouchableOpacity style={styles.shareButton} onPress={handleShareSuccess}>
        <LinearGradient
          colors={[colors.brand.primary, colors.brand.secondary]}
          style={styles.shareGradient}
        >
          <Ionicons name="share" size={20} color={colors.brand.background} />
          <Text style={styles.shareButtonText}>Compartilhar</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity style={styles.homeButton} onPress={handleGoHome}>
        <Text style={styles.homeButtonText}>Voltar ao Início</Text>
      </TouchableOpacity>
    </View>
  );

  const renderNextSteps = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Próximos Passos</Text>
      
      <View style={styles.stepsList}>
        <View style={styles.stepItem}>
          <View style={styles.stepIcon}>
            <Ionicons name="mail" size={20} color={colors.brand.primary} />
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Email de Confirmação</Text>
            <Text style={styles.stepDescription}>
              Você receberá um email com todos os detalhes do seu ingresso
            </Text>
          </View>
        </View>

        <View style={styles.stepItem}>
          <View style={styles.stepIcon}>
            <Ionicons name="qr-code" size={20} color={colors.brand.primary} />
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>QR Code</Text>
            <Text style={styles.stepDescription}>
              Use o QR Code do seu ingresso para entrada no evento
            </Text>
          </View>
        </View>

        <View style={styles.stepItem}>
          <View style={styles.stepIcon}>
            <Ionicons name="calendar" size={20} color={colors.brand.primary} />
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Lembrete</Text>
            <Text style={styles.stepDescription}>
              Você receberá lembretes antes do evento começar
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
        <Text style={styles.loadingText}>Carregando...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderSuccessAnimation()}
        {renderSuccessHeader()}
        {renderPaymentDetails()}
        {renderTicketInfo()}
        {renderNextSteps()}
        {renderActionButtons()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.brand.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    marginTop: spacing.md,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  animationContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    position: 'relative',
    paddingVertical: spacing.xl,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  successGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confetti: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand.primary,
  },
  confetti1: {
    top: '20%',
    left: '20%',
    backgroundColor: colors.brand.primary,
  },
  confetti2: {
    top: '30%',
    right: '20%',
    backgroundColor: colors.brand.secondary,
  },
  confetti3: {
    top: '60%',
    left: '15%',
    backgroundColor: colors.brand.primary,
  },
  confetti4: {
    top: '70%',
    right: '15%',
    backgroundColor: colors.brand.secondary,
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.brand.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  successSubtitle: {
    fontSize: typography.fontSizes.lg,
    color: colors.brand.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.brand.textPrimary,
    marginBottom: spacing.lg,
  },
  detailsCard: {
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.brand.textPrimary,
    marginLeft: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  detailLabel: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    flex: 1,
  },
  detailValue: {
    fontSize: typography.fontSizes.md,
    fontWeight: '500',
    color: colors.brand.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  statusContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  statusBadge: {
    backgroundColor: `${colors.brand.primary}20`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.brand.primary,
  },
  statusText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: '600',
    color: colors.brand.primary,
  },
  ticketCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  ticketGradient: {
    padding: spacing.lg,
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  ticketHeaderText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  ticketTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.brand.textPrimary,
    marginBottom: spacing.xs,
  },
  ticketSubtitle: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
  },
  viewTicketsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.background,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  viewTicketsText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.brand.primary,
    marginRight: spacing.sm,
  },
  stepsList: {
    gap: spacing.lg,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.brand.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.brand.textPrimary,
    marginBottom: spacing.xs,
  },
  stepDescription: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    lineHeight: 20,
  },
  actionSection: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  shareButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  shareGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.brand.background,
    marginLeft: spacing.sm,
  },
  homeButton: {
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.brand.primary,
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.brand.primary,
  },
});

export default PaymentSuccessScreen; 