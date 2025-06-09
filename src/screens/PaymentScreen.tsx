import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActivityIndicator,
  Modal,
  Clipboard,
  Share,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Haptics from 'expo-haptics';
import QRCode from 'react-native-qrcode-svg';
import { BlurView } from 'expo-blur';

import { colors, spacing, typography, borderRadius } from '../theme';
import { RootStackParamList } from '../navigation/types';
import paymentService, { 
  PaymentMethod, 
  CreditCardInfoDto,
  TicketPurchaseResponseDto,
  PaymentStatusDto
} from '../services/paymentService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type PaymentScreenRouteProp = RouteProp<RootStackParamList, 'Payment'>;
type PaymentScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Payment'>;

interface PaymentScreenProps {
  route: PaymentScreenRouteProp;
  navigation: PaymentScreenNavigationProp;
}

interface CreditCardData {
  holderName: string;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  postalCode: string;
  addressNumber: string;
  addressComplement: string;
}

interface CreditCardErrors {
  holderName?: string;
  cardNumber?: string;
  expiryMonth?: string;
  expiryYear?: string;
  cvv?: string;
  postalCode?: string;
  addressNumber?: string;
}

// Componente para QR Code com fallback para dados muito grandes
const QRCodeWithFallback: React.FC<{
  value: string;
  pixCode: string;
  size: number;
  color: string;
  backgroundColor: string;
}> = ({ value, pixCode, size, color, backgroundColor }) => {
  const [showFallback, setShowFallback] = useState(false);

  // Verificar se o valor é muito grande (limite aproximado de 2953 caracteres para QR Code)
  useEffect(() => {
    if (value && value.length > 2900) {
      console.warn('QR Code data too large, trying with pixCode instead');
      // Se o valor original for muito grande, tentar com o pixCode
      if (pixCode && pixCode.length <= 2900) {
        // Não mostrar fallback ainda, deixar o try/catch tentar com pixCode
        return;
      } else {
        setShowFallback(true);
      }
    }
  }, [value, pixCode]);

  if (showFallback) {
    return (
      <View style={styles.qrPlaceholder}>
        <Ionicons name="qr-code-outline" size={80} color={colors.brand.textSecondary} />
        <Text style={styles.qrPlaceholderText}>QR Code muito grande</Text>
        <Text style={styles.qrPlaceholderSubtext}>Use o código PIX abaixo</Text>
      </View>
    );
  }

  if (!value) {
    return (
      <View style={styles.qrPlaceholder}>
        <Ionicons name="qr-code-outline" size={80} color={colors.brand.textSecondary} />
        <Text style={styles.qrPlaceholderText}>QR Code não disponível</Text>
        <Text style={styles.qrPlaceholderSubtext}>Use o código PIX abaixo</Text>
      </View>
    );
  }

  try {
    // Decidir qual valor usar baseado no tamanho
    const qrValue = value.length > 2900 && pixCode && pixCode.length <= 2900 ? pixCode : value;
    
    return (
      <QRCode
        value={qrValue}
        size={size}
        color={color}
        backgroundColor={backgroundColor}
        onError={() => {
          console.warn('QR Code generation failed, showing fallback');
          setShowFallback(true);
        }}
      />
    );
  } catch (error) {
    console.warn('QR Code render error:', error);
    // Tentar uma última vez com pixCode se ainda não tentamos
    if (value !== pixCode && pixCode && pixCode.length <= 2900) {
      try {
        return (
          <QRCode
            value={pixCode}
            size={size}
            color={color}
            backgroundColor={backgroundColor}
          />
        );
      } catch (secondError) {
        console.warn('QR Code with pixCode also failed:', secondError);
      }
    }
    
    setShowFallback(true);
    return (
      <View style={styles.qrPlaceholder}>
        <Ionicons name="qr-code-outline" size={80} color={colors.brand.textSecondary} />
        <Text style={styles.qrPlaceholderText}>Erro no QR Code</Text>
        <Text style={styles.qrPlaceholderSubtext}>Use o código PIX abaixo</Text>
      </View>
    );
  }
};

const PaymentScreen: React.FC<PaymentScreenProps> = () => {
  const route = useRoute<PaymentScreenRouteProp>();
  const navigation = useNavigation<PaymentScreenNavigationProp>();
  
  const {
    eventId,
    eventTitle,
    eventDate,
    eventLocation,
    customerInfo,
    batchItems,
    checkoutItems,
    totalAmount
  } = route.params;

  // Estados principais
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(PaymentMethod.PIX);
  const [processing, setProcessing] = useState(false);
  const [pixPaymentData, setPixPaymentData] = useState<any>(null);
  const [showPixModal, setShowPixModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusDto | null>(null);

  // Estados de animação
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Estados do cartão de crédito
  const [creditCardData, setCreditCardData] = useState<CreditCardData>({
    holderName: '',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    postalCode: '',
    addressNumber: '',
    addressComplement: '',
  });

  const [creditCardErrors, setCreditCardErrors] = useState<CreditCardErrors>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Monitoramento de pagamento PIX
  const paymentMonitorRef = useRef<(() => void) | null>(null);

  // Animações de entrada
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Animação de pulso para elementos de destaque
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]).start(() => pulse());
    };
    pulse();
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (paymentMonitorRef.current) {
        paymentMonitorRef.current();
      }
    };
  }, []);

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Animação de seleção suave
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    setSelectedPaymentMethod(method);
  };

  const validateCreditCard = (): boolean => {
    const errors: CreditCardErrors = {};

    if (!creditCardData.holderName.trim()) {
      errors.holderName = 'Nome do portador é obrigatório';
    }

    const validation = paymentService.validateCreditCard({
      holderName: creditCardData.holderName,
      cardNumber: creditCardData.cardNumber,
      expiryMonth: creditCardData.expiryMonth,
      expiryYear: creditCardData.expiryYear,
      cvv: creditCardData.cvv,
    });

    if (!validation.isValid) {
      validation.errors.forEach(error => {
        if (error.includes('portador')) errors.holderName = error;
        if (error.includes('cartão')) errors.cardNumber = error;
        if (error.includes('expirado')) errors.expiryMonth = error;
        if (error.includes('CVV')) errors.cvv = error;
      });
    }

    if (!creditCardData.postalCode.trim()) {
      errors.postalCode = 'CEP é obrigatório';
    }

    if (!creditCardData.addressNumber.trim()) {
      errors.addressNumber = 'Número é obrigatório';
    }

    setCreditCardErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreditCardInputChange = (field: keyof CreditCardData, value: string) => {
    let formattedValue = value;

    // Aplicar máscaras
    if (field === 'cardNumber') {
      formattedValue = paymentService.maskCreditCard(value);
    } else if (field === 'expiryMonth') {
      formattedValue = value.replace(/\D/g, '').substring(0, 2);
    } else if (field === 'expiryYear') {
      formattedValue = value.replace(/\D/g, '').substring(0, 4);
    } else if (field === 'cvv') {
      formattedValue = value.replace(/\D/g, '').substring(0, 4);
    } else if (field === 'postalCode') {
      formattedValue = value.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2').substring(0, 9);
    }

    setCreditCardData(prev => ({ ...prev, [field]: formattedValue }));
    
    // Limpar erro do campo
    if (field in creditCardErrors) {
      setCreditCardErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const processPixPayment = async () => {
    try {
      setProcessing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const response = await paymentService.createDynamicPixPayment(
        eventId,
        eventTitle,
        customerInfo,
        batchItems
      );

      // Verificar se a resposta tem os dados do PIX
      if (response.pixInfo && response.pixInfo.pixCode) {
        setPixPaymentData({
          paymentId: response.paymentId,
          qrCode: response.pixInfo.qrCode || response.pixInfo.pixCode, // Fallback para pixCode se qrCode não existir
          pixCode: response.pixInfo.pixCode,
          expirationDate: response.pixInfo.expirationDate
        });
        setShowPixModal(true);

        // Iniciar monitoramento do pagamento
        if (paymentMonitorRef.current) {
          paymentMonitorRef.current();
        }

        paymentMonitorRef.current = paymentService.startPaymentMonitoring(
          response.paymentId,
          (status) => {
            setPaymentStatus(status);
            
            if (status.paid) {
              setShowPixModal(false);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              navigation.navigate('PaymentSuccess', { paymentId: response.paymentId });
            }
          }
        );
      } else {
        throw new Error('Dados do PIX não foram retornados pelo servidor');
      }

    } catch (error: any) {
      console.error('Erro no pagamento PIX:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      let errorMessage = 'Erro ao processar pagamento PIX';
      if (error.message.includes('Cannot POST')) {
        errorMessage = 'Serviço de pagamento temporariamente indisponível. Tente novamente.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Erro no PIX', errorMessage, [
        { text: 'Tentar Novamente', onPress: () => processPixPayment() },
        { text: 'Cancelar', style: 'cancel' }
      ]);
    } finally {
      setProcessing(false);
    }
  };

  const processCardPayment = async () => {
    if (!validateCreditCard()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Dados inválidos', 'Por favor, corrija os campos destacados.');
      return;
    }

    try {
      setProcessing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const creditCardInfo: CreditCardInfoDto = {
        holderName: creditCardData.holderName,
        cardNumber: creditCardData.cardNumber.replace(/\s/g, ''),
        expiryMonth: creditCardData.expiryMonth.padStart(2, '0'),
        expiryYear: creditCardData.expiryYear,
        cvv: creditCardData.cvv,
        postalCode: creditCardData.postalCode.replace(/\D/g, ''),
        addressNumber: creditCardData.addressNumber,
        addressComplement: creditCardData.addressComplement,
      };

      const response = await paymentService.processCardPayment(
        eventId,
        eventTitle,
        customerInfo,
        creditCardInfo,
        batchItems
      );

      // Pagamento processado com sucesso
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Sempre navegar para tela de sucesso com o paymentId
      navigation.navigate('PaymentSuccess', { paymentId: response.paymentId });

    } catch (error: any) {
      console.error('Erro no pagamento com cartão:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      let errorMessage = 'Erro ao processar pagamento com cartão';
      if (error.message.includes('Payment processing error')) {
        errorMessage = error.message.replace('Payment processing error: ', '');
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Pagamento Rejeitado', errorMessage, [
        { text: 'Verificar Dados', onPress: () => {/* Voltar para o formulário */} },
        { text: 'Tentar PIX', onPress: () => setSelectedPaymentMethod(PaymentMethod.PIX) },
        { text: 'Cancelar', style: 'cancel' }
      ]);
    } finally {
      setProcessing(false);
    }
  };

  const handlePayment = async () => {
    Keyboard.dismiss();
    
    if (selectedPaymentMethod === PaymentMethod.PIX) {
      await processPixPayment();
    } else if (selectedPaymentMethod === PaymentMethod.CREDIT_CARD || selectedPaymentMethod === PaymentMethod.DEBIT_CARD) {
      await processCardPayment();
    }
  };

  const copyPixCode = async () => {
    if (pixPaymentData?.pixCode) {
      await Clipboard.setString(pixPaymentData.pixCode);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Alert.alert('Copiado!', 'Código PIX copiado para a área de transferência.');
    }
  };

  const sharePixCode = async () => {
    if (pixPaymentData?.pixCode) {
      try {
        await Share.share({
          message: `Código PIX: ${pixPaymentData.pixCode}`,
          title: 'Código PIX para pagamento',
        });
      } catch (error) {
        console.error('Erro ao compartilhar:', error);
      }
    }
  };

  const renderHeader = () => (
    <Animated.View 
      style={[
        styles.premiumHeader,
        {
          opacity: fadeAnim,
          transform: [{ translateY: Animated.multiply(slideAnim, -0.5) }],
        }
      ]}
    >
      <LinearGradient
        colors={['rgba(10, 10, 10, 0.95)', 'rgba(30, 30, 30, 0.85)']}
        style={styles.headerGradient}
      >
        <TouchableOpacity
          style={styles.premiumBackButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.brand.darkGray, colors.brand.card]}
            style={styles.backButtonGradient}
          >
            <Ionicons name="arrow-back" size={20} color={colors.brand.textPrimary} />
          </LinearGradient>
        </TouchableOpacity>
        
        <View style={styles.premiumHeaderContent}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Text style={styles.premiumHeaderTitle}>Checkout Seguro</Text>
          </Animated.View>
          <View style={styles.headerBadgeContainer}>
            <View style={styles.secureBadgeHeader}>
              <Ionicons name="shield-checkmark" size={12} color={colors.brand.success} />
              <Text style={styles.secureBadgeText}>SSL Encrypted</Text>
            </View>
            <View style={styles.lockBadge}>
              <Ionicons name="lock-closed" size={12} color={colors.brand.primary} />
              <Text style={styles.lockBadgeText}>Secure</Text>
            </View>
          </View>
        </View>

        <View style={styles.headerAmount}>
          <Text style={styles.amountLabel}>Total</Text>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Text style={styles.amountValue}>
              {paymentService.formatCurrency(totalAmount.total)}
            </Text>
          </Animated.View>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const renderOrderSummary = () => (
    <Animated.View 
      style={[
        styles.section,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }
      ]}
    >
      <View style={styles.sectionTitleContainer}>
        <Ionicons name="receipt-outline" size={20} color={colors.brand.primary} />
        <Text style={styles.sectionTitle}>Resumo do Pedido</Text>
      </View>
      
              <LinearGradient
          colors={['rgba(18, 18, 18, 0.95)', 'rgba(30, 30, 30, 0.95)']}
          style={styles.premiumOrderCard}
        >
        {/* Event Header Premium */}
        <View style={styles.premiumEventHeader}>
          <LinearGradient
            colors={[colors.brand.primary, colors.brand.secondary]}
            style={styles.eventIconContainer}
          >
            <Ionicons name="calendar" size={16} color={colors.brand.background} />
          </LinearGradient>
          <View style={styles.eventDetails}>
            <Text style={styles.premiumEventTitle}>{eventTitle}</Text>
            <Text style={styles.premiumEventDate}>
              {new Date(eventDate).toLocaleDateString('pt-BR', {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
        </View>

        {/* Premium Tickets List */}
        <View style={styles.ticketsContainer}>
          {checkoutItems.map((item, index) => (
            <Animated.View 
              key={index} 
              style={[
                styles.premiumTicketRow,
                {
                  opacity: fadeAnim,
                  transform: [{ 
                    translateX: Animated.multiply(slideAnim, index * 0.1) 
                  }],
                }
              ]}
            >
              <View style={styles.ticketQuantityBadge}>
                <Text style={styles.ticketQuantityText}>{item.quantity}</Text>
              </View>
              <View style={styles.ticketInfoContainer}>
                <Text style={styles.premiumTicketName}>{item.batchName}</Text>
                <Text style={styles.premiumTicketPrice}>
                  {paymentService.formatCurrency(item.totalPrice)}
                </Text>
              </View>
              <Ionicons name="checkmark-circle" size={16} color={colors.brand.primary} />
            </Animated.View>
          ))}
        </View>

        {/* Premium Pricing Breakdown */}
        <View style={styles.pricingContainer}>
          <View style={styles.premiumDivider} />
          
          {totalAmount.fee > 0 && (
            <>
              <View style={styles.premiumSummaryRow}>
                <Text style={styles.premiumSummaryLabel}>Subtotal</Text>
                <Text style={styles.premiumSummaryValue}>
                  {paymentService.formatCurrency(totalAmount.original)}
                </Text>
              </View>
              <View style={styles.premiumSummaryRow}>
                <View style={styles.feeContainer}>
                  <Text style={styles.premiumSummaryLabel}>Taxa de conveniência</Text>
                  <View style={styles.feeBadge}>
                    <Text style={styles.feeBadgeText}>Transparente</Text>
                  </View>
                </View>
                <Text style={styles.premiumSummaryValue}>
                  {paymentService.formatCurrency(totalAmount.fee)}
                </Text>
              </View>
              <View style={styles.premiumDivider} />
            </>
          )}

          <Animated.View 
            style={[
              styles.premiumTotalRow,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <LinearGradient
              colors={[colors.brand.primary + '20', colors.brand.secondary + '20']}
              style={styles.totalBackground}
            >
              <Text style={styles.premiumTotalLabel}>Total a Pagar</Text>
              <Text style={styles.premiumTotalValue}>
                {paymentService.formatCurrency(totalAmount.total)}
              </Text>
            </LinearGradient>
          </Animated.View>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const renderPaymentMethods = () => (
    <Animated.View 
      style={[
        styles.section,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }
      ]}
    >
      <View style={styles.sectionTitleContainer}>
        <Ionicons name="wallet-outline" size={20} color={colors.brand.primary} />
        <Text style={styles.sectionTitle}>Método de Pagamento</Text>
      </View>
      
      {/* PIX Premium */}
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[
            styles.premiumPaymentMethod,
            selectedPaymentMethod === PaymentMethod.PIX && styles.premiumPaymentMethodSelected
          ]}
          onPress={() => handlePaymentMethodSelect(PaymentMethod.PIX)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={selectedPaymentMethod === PaymentMethod.PIX 
              ? [colors.brand.primary + '20', colors.brand.secondary + '20']
              : ['rgba(18, 18, 18, 0.8)', 'rgba(30, 30, 30, 0.8)']
            }
            style={styles.premiumMethodGradient}
          >
            <View style={styles.premiumMethodHeader}>
              <LinearGradient
                colors={[colors.brand.primary, colors.brand.secondary]}
                style={styles.premiumMethodIcon}
              >
                <Ionicons name="qr-code" size={20} color={colors.brand.background} />
              </LinearGradient>
              <View style={styles.premiumMethodInfo}>
                <Text style={styles.premiumMethodTitle}>PIX</Text>
                <Text style={styles.premiumMethodSubtitle}>
                  Pagamento instantâneo e seguro
                </Text>
                <View style={styles.premiumMethodBadges}>
                  <View style={styles.instantBadge}>
                    <Text style={styles.badgeText}>Instantâneo</Text>
                  </View>
                  <View style={styles.secureBadge}>
                    <Text style={styles.badgeText}>Seguro</Text>
                  </View>
                </View>
              </View>
              <View style={styles.premiumMethodCheck}>
                {selectedPaymentMethod === PaymentMethod.PIX && (
                  <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <Ionicons name="checkmark-circle" size={24} color={colors.brand.primary} />
                  </Animated.View>
                )}
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Cartão de Crédito Premium */}
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[
            styles.premiumPaymentMethod,
            selectedPaymentMethod === PaymentMethod.CREDIT_CARD && styles.premiumPaymentMethodSelected
          ]}
          onPress={() => handlePaymentMethodSelect(PaymentMethod.CREDIT_CARD)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={selectedPaymentMethod === PaymentMethod.CREDIT_CARD 
              ? [colors.brand.primary + '20', colors.brand.secondary + '20']
              : ['rgba(18, 18, 18, 0.8)', 'rgba(30, 30, 30, 0.8)']
            }
            style={styles.premiumMethodGradient}
          >
            <View style={styles.premiumMethodHeader}>
              <LinearGradient
                colors={[colors.brand.primary, colors.brand.secondary]}
                style={styles.premiumMethodIcon}
              >
                <Ionicons name="card" size={20} color={colors.brand.background} />
              </LinearGradient>
              <View style={styles.premiumMethodInfo}>
                <Text style={styles.premiumMethodTitle}>Cartão de Crédito</Text>
                <Text style={styles.premiumMethodSubtitle}>
                  Visa, Mastercard, Elo, American Express
                </Text>
                <View style={styles.premiumMethodBadges}>
                  <View style={styles.parcelBadge}>
                    <Text style={styles.badgeText}>Parcelado</Text>
                  </View>
                </View>
              </View>
              <View style={styles.premiumMethodCheck}>
                {selectedPaymentMethod === PaymentMethod.CREDIT_CARD && (
                  <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <Ionicons name="checkmark-circle" size={24} color={colors.brand.primary} />
                  </Animated.View>
                )}
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Cartão de Débito Premium */}
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[
            styles.premiumPaymentMethod,
            selectedPaymentMethod === PaymentMethod.DEBIT_CARD && styles.premiumPaymentMethodSelected
          ]}
          onPress={() => handlePaymentMethodSelect(PaymentMethod.DEBIT_CARD)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={selectedPaymentMethod === PaymentMethod.DEBIT_CARD 
              ? [colors.brand.primary + '20', colors.brand.secondary + '20']
              : ['rgba(18, 18, 18, 0.8)', 'rgba(30, 30, 30, 0.8)']
            }
            style={styles.premiumMethodGradient}
          >
            <View style={styles.premiumMethodHeader}>
              <LinearGradient
                colors={[colors.brand.primary, colors.brand.secondary]}
                style={styles.premiumMethodIcon}
              >
                <Ionicons name="card-outline" size={20} color={colors.brand.background} />
              </LinearGradient>
              <View style={styles.premiumMethodInfo}>
                <Text style={styles.premiumMethodTitle}>Cartão de Débito</Text>
                <Text style={styles.premiumMethodSubtitle}>
                  Débito automático na conta
                </Text>
                <View style={styles.premiumMethodBadges}>
                  <View style={styles.directBadge}>
                    <Text style={styles.badgeText}>Direto</Text>
                  </View>
                </View>
              </View>
              <View style={styles.premiumMethodCheck}>
                {selectedPaymentMethod === PaymentMethod.DEBIT_CARD && (
                  <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <Ionicons name="checkmark-circle" size={24} color={colors.brand.primary} />
                  </Animated.View>
                )}
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );

  const renderCreditCardForm = () => {
    if (selectedPaymentMethod !== PaymentMethod.CREDIT_CARD && selectedPaymentMethod !== PaymentMethod.DEBIT_CARD) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dados do Cartão</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Nome no cartão *</Text>
          <TextInput
            style={[
              styles.textInput,
              focusedField === 'holderName' && styles.textInputFocused,
              creditCardErrors.holderName && styles.textInputError
            ]}
            value={creditCardData.holderName}
            onChangeText={(value) => handleCreditCardInputChange('holderName', value)}
            onFocus={() => setFocusedField('holderName')}
            onBlur={() => setFocusedField(null)}
            placeholder="Nome como está no cartão"
            placeholderTextColor={colors.brand.textSecondary}
            autoCapitalize="characters"
          />
          {creditCardErrors.holderName && (
            <Text style={styles.errorText}>{creditCardErrors.holderName}</Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Número do cartão *</Text>
          <TextInput
            style={[
              styles.textInput,
              focusedField === 'cardNumber' && styles.textInputFocused,
              creditCardErrors.cardNumber && styles.textInputError
            ]}
            value={creditCardData.cardNumber}
            onChangeText={(value) => handleCreditCardInputChange('cardNumber', value)}
            onFocus={() => setFocusedField('cardNumber')}
            onBlur={() => setFocusedField(null)}
            placeholder="0000 0000 0000 0000"
            placeholderTextColor={colors.brand.textSecondary}
            keyboardType="numeric"
            maxLength={19}
          />
          {creditCardErrors.cardNumber && (
            <Text style={styles.errorText}>{creditCardErrors.cardNumber}</Text>
          )}
        </View>

        <View style={styles.formRow}>
          <View style={[styles.inputContainer, { flex: 1, marginRight: spacing.sm }]}>
            <Text style={styles.inputLabel}>Mês *</Text>
            <TextInput
              style={[
                styles.textInput,
                focusedField === 'expiryMonth' && styles.textInputFocused,
                creditCardErrors.expiryMonth && styles.textInputError
              ]}
              value={creditCardData.expiryMonth}
              onChangeText={(value) => handleCreditCardInputChange('expiryMonth', value)}
              onFocus={() => setFocusedField('expiryMonth')}
              onBlur={() => setFocusedField(null)}
              placeholder="MM"
              placeholderTextColor={colors.brand.textSecondary}
              keyboardType="numeric"
              maxLength={2}
            />
          </View>
          
          <View style={[styles.inputContainer, { flex: 1, marginHorizontal: spacing.sm }]}>
            <Text style={styles.inputLabel}>Ano *</Text>
            <TextInput
              style={[
                styles.textInput,
                focusedField === 'expiryYear' && styles.textInputFocused,
                creditCardErrors.expiryYear && styles.textInputError
              ]}
              value={creditCardData.expiryYear}
              onChangeText={(value) => handleCreditCardInputChange('expiryYear', value)}
              onFocus={() => setFocusedField('expiryYear')}
              onBlur={() => setFocusedField(null)}
              placeholder="AAAA"
              placeholderTextColor={colors.brand.textSecondary}
              keyboardType="numeric"
              maxLength={4}
            />
          </View>
          
          <View style={[styles.inputContainer, { flex: 1, marginLeft: spacing.sm }]}>
            <Text style={styles.inputLabel}>CVV *</Text>
            <TextInput
              style={[
                styles.textInput,
                focusedField === 'cvv' && styles.textInputFocused,
                creditCardErrors.cvv && styles.textInputError
              ]}
              value={creditCardData.cvv}
              onChangeText={(value) => handleCreditCardInputChange('cvv', value)}
              onFocus={() => setFocusedField('cvv')}
              onBlur={() => setFocusedField(null)}
              placeholder="000"
              placeholderTextColor={colors.brand.textSecondary}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
            />
          </View>
        </View>

        {(creditCardErrors.expiryMonth || creditCardErrors.cvv) && (
          <Text style={styles.errorText}>
            {creditCardErrors.expiryMonth || creditCardErrors.cvv}
          </Text>
        )}

        <View style={styles.formRow}>
          <View style={[styles.inputContainer, { flex: 1, marginRight: spacing.sm }]}>
            <Text style={styles.inputLabel}>CEP *</Text>
            <TextInput
              style={[
                styles.textInput,
                focusedField === 'postalCode' && styles.textInputFocused,
                creditCardErrors.postalCode && styles.textInputError
              ]}
              value={creditCardData.postalCode}
              onChangeText={(value) => handleCreditCardInputChange('postalCode', value)}
              onFocus={() => setFocusedField('postalCode')}
              onBlur={() => setFocusedField(null)}
              placeholder="00000-000"
              placeholderTextColor={colors.brand.textSecondary}
              keyboardType="numeric"
              maxLength={9}
            />
            {creditCardErrors.postalCode && (
              <Text style={styles.errorText}>{creditCardErrors.postalCode}</Text>
            )}
          </View>
          
          <View style={[styles.inputContainer, { flex: 1, marginLeft: spacing.sm }]}>
            <Text style={styles.inputLabel}>Número *</Text>
            <TextInput
              style={[
                styles.textInput,
                focusedField === 'addressNumber' && styles.textInputFocused,
                creditCardErrors.addressNumber && styles.textInputError
              ]}
              value={creditCardData.addressNumber}
              onChangeText={(value) => handleCreditCardInputChange('addressNumber', value)}
              onFocus={() => setFocusedField('addressNumber')}
              onBlur={() => setFocusedField(null)}
              placeholder="123"
              placeholderTextColor={colors.brand.textSecondary}
            />
            {creditCardErrors.addressNumber && (
              <Text style={styles.errorText}>{creditCardErrors.addressNumber}</Text>
            )}
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Complemento</Text>
          <TextInput
            style={[
              styles.textInput,
              focusedField === 'addressComplement' && styles.textInputFocused
            ]}
            value={creditCardData.addressComplement}
            onChangeText={(value) => handleCreditCardInputChange('addressComplement', value)}
            onFocus={() => setFocusedField('addressComplement')}
            onBlur={() => setFocusedField(null)}
            placeholder="Apto, Bloco, etc."
            placeholderTextColor={colors.brand.textSecondary}
          />
        </View>
      </View>
    );
  };

  const renderPayButton = () => (
    <Animated.View 
      style={[
        styles.premiumBottomContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: Animated.multiply(slideAnim, 0.5) }],
        }
      ]}
    >
      <BlurView intensity={80} style={styles.blurContainer}>
        <View style={styles.paymentProgress}>
          <View style={styles.progressSteps}>
            <View style={[styles.progressStep, styles.progressStepCompleted]}>
              <Text style={styles.progressStepText}>1</Text>
            </View>
            <View style={styles.progressLine} />
            <View style={[styles.progressStep, styles.progressStepCompleted]}>
              <Text style={styles.progressStepText}>2</Text>
            </View>
            <View style={styles.progressLine} />
            <View style={[styles.progressStep, styles.progressStepActive]}>
              <Text style={styles.progressStepText}>3</Text>
            </View>
          </View>
          <Text style={styles.progressText}>Finalizar Pagamento</Text>
        </View>

        <Animated.View style={{ transform: [{ scale: processing ? 0.95 : 1 }] }}>
          <TouchableOpacity
            style={[
              styles.premiumPayButton,
              processing && styles.premiumPayButtonDisabled
            ]}
            onPress={handlePayment}
            disabled={processing}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                processing 
                  ? [colors.brand.textSecondary + '80', colors.brand.textSecondary + '80']
                  : [colors.brand.primary, colors.brand.secondary, colors.brand.action]
              }
              style={styles.premiumPayButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {processing ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color={colors.brand.background} size="small" />
                  <Text style={styles.loadingText}>Processando...</Text>
                </View>
              ) : (
                <View style={styles.payButtonContent}>
                  <View style={styles.payButtonLeft}>
                    <View style={styles.payButtonIconContainer}>
                      <Ionicons 
                        name={selectedPaymentMethod === PaymentMethod.PIX ? "qr-code" : "card"} 
                        size={24} 
                        color={colors.brand.background} 
                      />
                    </View>
                    <View style={styles.payButtonTextContainer}>
                      <Text style={styles.premiumPayButtonTitle}>
                        {selectedPaymentMethod === PaymentMethod.PIX 
                          ? 'Pagar com PIX' 
                          : selectedPaymentMethod === PaymentMethod.CREDIT_CARD
                          ? 'Pagar com Crédito'
                          : 'Pagar com Débito'}
                      </Text>
                      <Text style={styles.premiumPayButtonSubtitle}>
                        {selectedPaymentMethod === PaymentMethod.PIX 
                          ? 'Instantâneo e seguro' 
                          : 'Aprovação rápida'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.payButtonRight}>
                    <Text style={styles.premiumPayButtonAmount}>
                      {paymentService.formatCurrency(totalAmount.total)}
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color={colors.brand.background} />
                  </View>
                </View>
              )}
            </LinearGradient>
            
            {/* Shimmer effect para o botão */}
            {!processing && (
              <Animated.View
                style={[
                  styles.shimmerOverlay,
                  {
                    opacity: pulseAnim,
                    transform: [
                      {
                        translateX: Animated.multiply(pulseAnim, 100)
                      }
                    ]
                  }
                ]}
              />
            )}
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.securityNote}>
          <Ionicons name="shield-checkmark" size={12} color={colors.brand.success} />
          {' '}Pagamento seguro e criptografado
        </Text>
      </BlurView>
    </Animated.View>
  );

  const renderPixModal = () => (
    <Modal
      visible={showPixModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowPixModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.pixModal}>
          <View style={styles.pixModalHeader}>
            <Text style={styles.pixModalTitle}>Pagamento PIX</Text>
            <TouchableOpacity
              style={styles.pixModalClose}
              onPress={() => setShowPixModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.brand.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.pixModalContent}>
            <View style={styles.pixQRContainer}>
              {pixPaymentData?.qrCode ? (
                <QRCodeWithFallback
                  value={pixPaymentData.qrCode}
                  pixCode={pixPaymentData.pixCode}
                  size={200}
                  color={colors.brand.textPrimary}
                  backgroundColor={colors.brand.background}
                />
              ) : (
                <View style={styles.qrPlaceholder}>
                  <Ionicons name="qr-code-outline" size={80} color={colors.brand.textSecondary} />
                  <Text style={styles.qrPlaceholderText}>QR Code não disponível</Text>
                  <Text style={styles.qrPlaceholderSubtext}>Use o código PIX abaixo</Text>
                </View>
              )}
            </View>

            <Text style={styles.pixInstructions}>
              Escaneie o QR Code acima com seu app bancário ou copie o código PIX abaixo
            </Text>

            <View style={styles.pixCodeContainer}>
              <Text style={styles.pixCodeLabel}>Código PIX:</Text>
              <View style={styles.pixCodeBox}>
                <Text style={styles.pixCodeText} numberOfLines={3}>
                  {pixPaymentData?.pixCode}
                </Text>
              </View>
            </View>

            <View style={styles.pixActions}>
              <TouchableOpacity style={styles.pixActionButton} onPress={copyPixCode}>
                <Ionicons name="copy" size={20} color={colors.brand.primary} />
                <Text style={styles.pixActionText}>Copiar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.pixActionButton} onPress={sharePixCode}>
                <Ionicons name="share" size={20} color={colors.brand.primary} />
                <Text style={styles.pixActionText}>Compartilhar</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.pixStatus}>
              <Text style={styles.pixStatusText}>
                {paymentStatus?.paid 
                  ? '✅ Pagamento confirmado!' 
                  : '⏳ Aguardando pagamento...'}
              </Text>
            </View>

            <Text style={styles.pixExpiry}>
              Válido até: {pixPaymentData?.expirationDate && 
                new Date(pixPaymentData.expirationDate).toLocaleString('pt-BR')}
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {renderHeader()}
        
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderOrderSummary()}
          {renderPaymentMethods()}
          {renderCreditCardForm()}
          
          {/* Botão de pagamento integrado no fluxo */}
          <View style={styles.paymentSection}>
            <Animated.View 
              style={[
                styles.cleanPaymentContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                }
              ]}
            >
              {/* Progress indicator limpo */}
              <View style={styles.cleanProgressContainer}>
                <View style={styles.cleanProgressSteps}>
                  <View style={[styles.cleanProgressStep, styles.progressStepCompleted]}>
                    <Ionicons name="checkmark" size={16} color={colors.brand.background} />
                  </View>
                  <View style={styles.cleanProgressLine} />
                  <View style={[styles.cleanProgressStep, styles.progressStepCompleted]}>
                    <Ionicons name="checkmark" size={16} color={colors.brand.background} />
                  </View>
                  <View style={styles.cleanProgressLine} />
                  <View style={[styles.cleanProgressStep, styles.cleanProgressStepActive]}>
                    <Text style={styles.cleanProgressStepText}>3</Text>
                  </View>
                </View>
                <Text style={styles.cleanProgressText}>Finalizar Pagamento</Text>
              </View>

              {/* Resumo final do pagamento */}
              <View style={styles.finalSummaryCard}>
                <View style={styles.finalSummaryHeader}>
                  <Ionicons name="receipt-outline" size={20} color={colors.brand.primary} />
                  <Text style={styles.finalSummaryTitle}>Confirmar Pagamento</Text>
                </View>
                
                <View style={styles.finalSummaryContent}>
                  <View style={styles.finalSummaryRow}>
                    <Text style={styles.finalSummaryLabel}>Método:</Text>
                    <Text style={styles.finalSummaryValue}>
                      {selectedPaymentMethod === PaymentMethod.PIX 
                        ? 'PIX - Instantâneo' 
                        : selectedPaymentMethod === PaymentMethod.CREDIT_CARD
                        ? 'Cartão de Crédito'
                        : 'Cartão de Débito'}
                    </Text>
                  </View>
                  
                  <View style={styles.finalSummaryRow}>
                    <Text style={styles.finalSummaryLabel}>Total:</Text>
                    <Text style={styles.finalSummaryTotal}>
                      {paymentService.formatCurrency(totalAmount.total)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Botão de pagamento limpo */}
              <TouchableOpacity
                style={[
                  styles.cleanPayButton,
                  processing && styles.cleanPayButtonDisabled
                ]}
                onPress={handlePayment}
                disabled={processing}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    processing 
                      ? [colors.brand.textSecondary + '80', colors.brand.textSecondary + '80']
                      : selectedPaymentMethod === PaymentMethod.PIX
                      ? ['#22C55E', '#16A34A', '#15803D']
                      : [colors.brand.primary, colors.brand.secondary]
                  }
                  style={styles.cleanPayButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {processing ? (
                    <View style={styles.cleanLoadingContainer}>
                      <ActivityIndicator color={colors.brand.background} size="small" />
                      <Text style={styles.cleanLoadingText}>Processando...</Text>
                    </View>
                  ) : (
                    <View style={styles.cleanPayButtonContent}>
                      <View style={styles.cleanPayButtonIcon}>
                        <Ionicons 
                          name={selectedPaymentMethod === PaymentMethod.PIX ? "qr-code" : "card"} 
                          size={24} 
                          color={colors.brand.background} 
                        />
                      </View>
                      <Text style={styles.cleanPayButtonText}>
                        {selectedPaymentMethod === PaymentMethod.PIX 
                          ? `Pagar com PIX • ${paymentService.formatCurrency(totalAmount.total)}` 
                          : selectedPaymentMethod === PaymentMethod.CREDIT_CARD
                          ? `Pagar com Crédito • ${paymentService.formatCurrency(totalAmount.total)}`
                          : `Pagar com Débito • ${paymentService.formatCurrency(totalAmount.total)}`}
                      </Text>
                      <Ionicons name="arrow-forward" size={20} color={colors.brand.background} />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Indicadores de segurança */}
              <View style={styles.securityIndicators}>
                <View style={styles.securityItem}>
                  <Ionicons name="shield-checkmark" size={16} color={colors.brand.success} />
                  <Text style={styles.securityText}>Pagamento Seguro</Text>
                </View>
                <View style={styles.securityItem}>
                  <Ionicons name="lock-closed" size={16} color={colors.brand.success} />
                  <Text style={styles.securityText}>Dados Criptografados</Text>
                </View>
              </View>
            </Animated.View>
          </View>
        </ScrollView>
        
        {renderPixModal()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.brand.darkGray,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brand.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.brand.textPrimary,
  },
  headerSubtitle: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    marginTop: 2,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },

  orderCard: {
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  eventHeader: {
    marginBottom: spacing.md,
  },
  eventTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: '600',
    color: colors.brand.textPrimary,
    marginBottom: spacing.xs,
  },
  eventDate: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.primary,
  },
  ticketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  ticketName: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    flex: 1,
  },
  ticketPrice: {
    fontSize: typography.fontSizes.md,
    fontWeight: '500',
    color: colors.brand.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.brand.textSecondary,
    marginVertical: spacing.md,
    opacity: 0.3,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.brand.textPrimary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.brand.primary,
  },
  paymentMethodCard: {
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentMethodSelected: {
    borderColor: colors.brand.primary,
    backgroundColor: `${colors.brand.primary}10`,
  },
  paymentMethodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.brand.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.brand.textPrimary,
    marginBottom: spacing.xs,
  },
  paymentMethodSubtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
  },
  paymentMethodCheck: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textPrimary,
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.brand.textPrimary,
    fontSize: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  textInputFocused: {
    borderColor: colors.brand.primary,
  },
  textInputError: {
    borderColor: '#FF6B6B',
  },
  errorText: {
    fontSize: typography.fontSizes.sm,
    color: '#FF6B6B',
    marginTop: spacing.xs,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.brand.background,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.brand.darkGray,
  },
  payButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  payButtonDisabled: {
    opacity: 0.5,
  },
  payButtonGradient: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.brand.background,
    marginHorizontal: spacing.sm,
  },
  payButtonAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.brand.background,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pixModal: {
    backgroundColor: colors.brand.background,
    borderRadius: borderRadius.xl,
    width: screenWidth * 0.9,
    maxHeight: screenHeight * 0.8,
    overflow: 'hidden',
  },
  pixModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.brand.darkGray,
  },
  pixModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.brand.textPrimary,
  },
  pixModalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brand.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pixModalContent: {
    padding: spacing.lg,
  },
  pixQRContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.lg,
  },
  pixInstructions: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 24,
  },
  pixCodeContainer: {
    marginBottom: spacing.lg,
  },
  pixCodeLabel: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    marginBottom: spacing.sm,
  },
  pixCodeBox: {
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  pixCodeText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textPrimary,
    fontFamily: 'monospace',
  },
  pixActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  pixActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.darkGray,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  pixActionText: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.primary,
    marginLeft: spacing.sm,
    fontWeight: '500',
  },
  pixStatus: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  pixStatusText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: '600',
    color: colors.brand.textPrimary,
  },
  pixExpiry: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    textAlign: 'center',
  },
  
  // ========= CLEAN PAYMENT DESIGN STYLES =========
  paymentSection: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  cleanPaymentContainer: {
    gap: spacing.lg,
  },
  cleanProgressContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  cleanProgressSteps: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cleanProgressStep: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.brand.textSecondary,
  },
  cleanProgressStepActive: {
    backgroundColor: colors.brand.primary,
  },
  cleanProgressStepText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.background,
  },
  cleanProgressLine: {
    width: 40,
    height: 2,
    backgroundColor: colors.brand.primary,
    marginHorizontal: spacing.sm,
  },
  cleanProgressText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textPrimary,
  },
  finalSummaryCard: {
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  finalSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  finalSummaryTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textPrimary,
    marginLeft: spacing.sm,
  },
  finalSummaryContent: {
    gap: spacing.sm,
  },
  finalSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  finalSummaryLabel: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  finalSummaryValue: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textPrimary,
    fontWeight: typography.fontWeights.semibold,
  },
  finalSummaryTotal: {
    fontSize: typography.fontSizes.lg,
    color: colors.brand.primary,
    fontWeight: typography.fontWeights.bold,
  },
  cleanPayButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cleanPayButtonDisabled: {
    opacity: 0.6,
    elevation: 0,
    shadowOpacity: 0,
  },
  cleanPayButtonGradient: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    minHeight: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cleanLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cleanLoadingText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.background,
  },
  cleanPayButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cleanPayButtonIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cleanPayButtonText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.background,
    flex: 1,
    textAlign: 'center',
  },
  securityIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  securityText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  qrPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
    height: 200,
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.brand.textSecondary,
    borderStyle: 'dashed',
  },
  qrPlaceholderText: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
    fontWeight: '500',
  },
  qrPlaceholderSubtext: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
  },
  summaryValue: {
    fontSize: typography.fontSizes.md,
    fontWeight: '500',
    color: colors.brand.textPrimary,
  },
  // Estilos Premium do Vale do Silício
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },

  ticketQuantityBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  ticketQuantityText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: '700',
    color: colors.brand.background,
  },
  ticketInfoContainer: {
    flex: 1,
  },
  premiumTicketName: {
    fontSize: typography.fontSizes.md,
    fontWeight: '600',
    color: colors.brand.textPrimary,
    marginBottom: spacing.xs,
  },
  premiumTicketPrice: {
    fontSize: typography.fontSizes.sm,
    fontWeight: '500',
    color: colors.brand.primary,
  },
  pricingContainer: {
    marginTop: spacing.md,
  },
  premiumDivider: {
    height: 1,
    backgroundColor: colors.brand.primary + '30',
    marginVertical: spacing.md,
  },

  premiumTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.brand.textPrimary,
  },
  premiumTotalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.brand.primary,
  },
  // Premium Payment Methods
  premiumPaymentMethod: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.opacity.cardBorder,
    shadowColor: colors.opacity.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  premiumPaymentMethodSelected: {
    borderColor: colors.brand.primary,
    shadowColor: colors.brand.primary,
    shadowOpacity: 0.3,
  },
  premiumMethodGradient: {
    padding: spacing.lg,
  },
  premiumMethodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  premiumMethodInfo: {
    flex: 1,
  },
  premiumMethodTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.brand.textPrimary,
    marginBottom: spacing.xs,
  },
  premiumMethodSubtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    marginBottom: spacing.sm,
  },
  premiumMethodBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  instantBadge: {
    backgroundColor: colors.brand.primary + '20',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs,
  },
  secureBadge: {
    backgroundColor: colors.brand.success + '20',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs,
  },
  parcelBadge: {
    backgroundColor: colors.brand.info + '20',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs,
  },
  directBadge: {
    backgroundColor: colors.brand.warning + '20',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.brand.textPrimary,
  },
  premiumMethodCheck: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Premium Bottom Container & Payment Button
  premiumBottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  blurContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xl,
  },
  paymentProgress: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  progressSteps: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressStep: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.brand.textSecondary,
  },
  progressStepCompleted: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  progressStepActive: {
    backgroundColor: colors.brand.secondary,
    borderColor: colors.brand.secondary,
  },
  progressStepText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.brand.background,
  },
  progressLine: {
    width: 30,
    height: 2,
    backgroundColor: colors.brand.primary,
    marginHorizontal: spacing.xs,
  },
  progressText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    fontWeight: '500',
  },
  premiumPayButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: spacing.md,
    position: 'relative',
  },
  premiumPayButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0.1,
  },
  premiumPayButtonGradient: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.brand.background,
    marginLeft: spacing.sm,
  },
  payButtonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  payButtonIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  payButtonTextContainer: {
    flex: 1,
  },
  premiumPayButtonTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.brand.background,
    marginBottom: 2,
  },
  premiumPayButtonSubtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.background + 'CC',
    fontWeight: '500',
  },
  payButtonRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumPayButtonAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.brand.background,
    marginRight: spacing.sm,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: -100,
    right: 0,
    bottom: 0,
    width: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ skewX: '-20deg' }],
  },
  securityNote: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  // Premium Header Styles
  premiumHeader: {
    paddingTop: spacing.sm,
  },
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.opacity.cardBorder,
  },
  premiumBackButton: {
    marginRight: spacing.md,
  },
  backButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumHeaderContent: {
    flex: 1,
    alignItems: 'center',
  },
  premiumHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.brand.textPrimary,
    marginBottom: spacing.xs,
  },
  headerBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  secureBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.success + '20',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs,
  },
  secureBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.brand.success,
    marginLeft: 2,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.primary + '20',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  lockBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.brand.primary,
    marginLeft: 2,
  },
  headerAmount: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    fontWeight: '500',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.brand.primary,
  },
  
  // ========= MISSING STYLES FOR PROFESSIONAL ALIGNMENT =========
  
  // Section Title Container - FIX ICON ALIGNMENT
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center', // ✅ FIXED: Icon aligned with text
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.brand.textPrimary,
    marginLeft: spacing.sm, // ✅ FIXED: Proper spacing from icon
    lineHeight: 22, // ✅ FIXED: Consistent line height
  },
  
  // Premium Order Summary Styles
  premiumOrderCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  premiumEventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  eventIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  eventDetails: {
    flex: 1,
  },
  premiumEventTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.xs,
  },
  premiumEventDate: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.primary,
    fontWeight: typography.fontWeights.medium,
  },
  
  // Tickets Container
  ticketsContainer: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  premiumTicketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  ticketQuantityBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  ticketQuantityText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.background,
  },
  ticketInfoContainer: {
    flex: 1,
  },
  premiumTicketName: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.xs,
  },
  premiumTicketPrice: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.primary,
  },
  
  // Pricing Container - FIX TRANSPARENT OVERLAY ISSUE
  pricingContainer: {
    gap: spacing.sm,
  },
  premiumDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: spacing.sm,
  },
  premiumSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', // ✅ FIXED: Proper vertical alignment
    minHeight: 32, // ✅ FIXED: Consistent row height
    paddingVertical: spacing.xs,
  },
  premiumSummaryLabel: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.medium,
    color: colors.brand.textSecondary,
    lineHeight: 20, // ✅ FIXED: Consistent line height
  },
  premiumSummaryValue: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textPrimary,
    lineHeight: 20, // ✅ FIXED: Consistent line height
  },
  
  // Fee Container - FIX "TRANSPARENTE" OVERLAY
  feeContainer: {
    flexDirection: 'row',
    alignItems: 'center', // ✅ FIXED: Proper alignment
    flex: 1,
    gap: spacing.sm, // ✅ FIXED: Proper spacing between elements
  },
  feeBadge: {
    backgroundColor: colors.brand.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start', // ✅ FIXED: No overlay on text
    marginLeft: spacing.sm, // ✅ FIXED: Proper spacing from label
  },
  feeBadgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // Premium Total Row
  premiumTotalRow: {
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  totalBackground: {
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 56, // ✅ FIXED: Proper touch target
  },
});

export default PaymentScreen; 