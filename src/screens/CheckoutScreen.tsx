import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Haptics from 'expo-haptics';

import { colors, spacing, typography, borderRadius } from '../theme';
import { RootStackParamList } from '../navigation/types';
import { fetchEventById, Event, TicketBatch } from '../services/eventsService';
import paymentService, { 
  CustomerInfoDto, 
  BatchItemDto, 
  CheckoutItem,
  EventFees 
} from '../services/paymentService';
import { useAuth } from '../contexts/AuthContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type CheckoutScreenRouteProp = RouteProp<RootStackParamList, 'Checkout'>;
type CheckoutScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Checkout'>;

interface CheckoutScreenProps {
  route: CheckoutScreenRouteProp;
  navigation: CheckoutScreenNavigationProp;
}

interface SelectedTickets {
  [batchId: string]: number;
}

interface FormData {
  nome: string;
  sobrenome: string;
  email: string;
  telefone: string;
  cpf: string;
}

interface FormErrors {
  nome?: string;
  sobrenome?: string;
  email?: string;
  telefone?: string;
  cpf?: string;
}

const CheckoutScreen: React.FC<CheckoutScreenProps> = () => {
  const route = useRoute<CheckoutScreenRouteProp>();
  const navigation = useNavigation<CheckoutScreenNavigationProp>();
  const { eventId, selectedTickets: initialSelectedTickets } = route.params;
  const { user } = useAuth();

  // Estados principais
  const [event, setEvent] = useState<Event | null>(null);
  const [selectedTickets, setSelectedTickets] = useState<SelectedTickets>(initialSelectedTickets || {});
  const [checkoutItems, setCheckoutItems] = useState<CheckoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [eventFees, setEventFees] = useState<EventFees>({
    buyerFeePercentage: 5,
    producerFeePercentage: 5,
    isCustom: false,
    eventCreatorId: '',
    isLoaded: false
  });

  // Estado do formulário
  const [formData, setFormData] = useState<FormData>({
    nome: user?.name?.split(' ')[0] || '',
    sobrenome: user?.name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    telefone: '',
    cpf: '',
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Carrega dados do evento e taxas
  useEffect(() => {
    loadEventData();
    loadEventFees();
  }, [eventId]);

  // Atualiza itens do checkout quando tickets ou evento mudam
  useEffect(() => {
    if (event?.ticketBatches) {
      updateCheckoutItems();
    }
  }, [selectedTickets, event]);

  const loadEventData = async () => {
    try {
      const eventData = await fetchEventById(eventId);
      setEvent(eventData);
    } catch (error) {
      console.error('Erro ao carregar evento:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do evento.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const loadEventFees = async () => {
    try {
      const fees = await paymentService.getEventFees(eventId);
      setEventFees(fees);
    } catch (error) {
      console.error('Erro ao carregar taxas:', error);
    }
  };

  const updateCheckoutItems = () => {
    if (!event?.ticketBatches) return;

    const items: CheckoutItem[] = [];
    
    Object.entries(selectedTickets).forEach(([batchId, quantity]) => {
      if (quantity > 0) {
        const batch = event.ticketBatches?.find(b => b.id === batchId);
        if (batch) {
          items.push({
            batchId,
            batchName: batch.name,
            quantity,
            unitPrice: batch.price,
            totalPrice: batch.price * quantity
          });
        }
      }
    });

    setCheckoutItems(items);
  };

  const updateTicketQuantity = (batchId: string, quantity: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    setSelectedTickets(prev => {
      const newSelected = { ...prev };
      
      if (quantity <= 0) {
        delete newSelected[batchId];
      } else {
        // Limite de 10 ingressos por compra
        newSelected[batchId] = Math.min(quantity, 10);
      }
      
      return newSelected;
    });
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.nome.trim()) {
      errors.nome = 'Nome é obrigatório';
    }

    if (!formData.sobrenome.trim()) {
      errors.sobrenome = 'Sobrenome é obrigatório';
    }

    if (!paymentService.validateEmail(formData.email)) {
      errors.email = 'Email inválido';
    }

    if (!paymentService.validatePhone(formData.telefone)) {
      errors.telefone = 'Telefone inválido';
    }

    if (!paymentService.validateCPF(formData.cpf)) {
      errors.cpf = 'CPF inválido';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    let formattedValue = value;

    // Aplicar máscaras
    if (field === 'cpf') {
      formattedValue = paymentService.maskCPF(value);
    } else if (field === 'telefone') {
      formattedValue = paymentService.maskPhone(value);
    }

    setFormData(prev => ({ ...prev, [field]: formattedValue }));
    
    // Limpar erro do campo
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const calculateSubtotal = () => {
    return checkoutItems.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const calculateFees = () => {
    const subtotal = calculateSubtotal();
    return paymentService.calculateTotalWithFees(subtotal, eventFees.buyerFeePercentage);
  };

  const handleProceedToPayment = async () => {
    Keyboard.dismiss();

    if (checkoutItems.length === 0) {
      Alert.alert('Atenção', 'Selecione pelo menos um ingresso para continuar.');
      return;
    }

    if (!validateForm()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Dados inválidos', 'Por favor, corrija os campos destacados.');
      return;
    }

    try {
      setSubmitting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Preparar dados do cliente
      const customerInfo: CustomerInfoDto = {
        name: `${formData.nome.trim()} ${formData.sobrenome.trim()}`,
        email: formData.email.trim(),
        cellphone: `+55${formData.telefone.replace(/\D/g, '')}`,
        taxId: formData.cpf.replace(/\D/g, '')
      };

      // Preparar itens do lote
      const batchItems: BatchItemDto[] = checkoutItems.map(item => ({
        batchId: item.batchId,
        quantity: item.quantity
      }));

      // Navegar para tela de pagamento
      navigation.navigate('Payment', {
        eventId,
        eventTitle: event?.title || '',
        eventDate: event?.date || '',
        eventLocation: event?.location || '',
        customerInfo,
        batchItems,
        checkoutItems,
        totalAmount: calculateFees()
      });

    } catch (error) {
      console.error('Erro ao prosseguir:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erro', 'Ocorreu um erro. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color={colors.brand.textPrimary} />
      </TouchableOpacity>
      
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>Checkout</Text>
        <Text style={styles.headerSubtitle}>Finalize sua compra</Text>
      </View>
    </View>
  );

  const renderEventSummary = () => (
    <View style={styles.section}>
      <View style={styles.eventSummary}>
        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle}>{event?.title}</Text>
          <Text style={styles.eventDate}>
            {event?.date && new Date(event.date).toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: '2-digit',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
          <Text style={styles.eventLocation}>{event?.location}</Text>
        </View>
      </View>
    </View>
  );

  const renderTicketSelection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Ingressos Selecionados</Text>
      
      {checkoutItems.map((item, index) => (
        <View key={item.batchId} style={styles.ticketItem}>
          <View style={styles.ticketInfo}>
            <Text style={styles.ticketName}>{item.batchName}</Text>
            <Text style={styles.ticketPrice}>
              {paymentService.formatCurrency(item.unitPrice)} cada
            </Text>
          </View>
          
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={[
                styles.quantityButton,
                item.quantity === 1 && styles.quantityButtonDisabled
              ]}
              onPress={() => updateTicketQuantity(item.batchId, item.quantity - 1)}
              disabled={item.quantity === 1}
            >
              <Ionicons 
                name="remove" 
                size={16} 
                color={item.quantity === 1 ? colors.brand.textSecondary : colors.brand.background} 
              />
            </TouchableOpacity>
            
            <View style={styles.quantityDisplay}>
              <Text style={styles.quantityText}>{item.quantity}</Text>
            </View>
            
            <TouchableOpacity
              style={[
                styles.quantityButton,
                item.quantity >= 10 && styles.quantityButtonDisabled
              ]}
              onPress={() => updateTicketQuantity(item.batchId, item.quantity + 1)}
              disabled={item.quantity >= 10}
            >
              <Ionicons 
                name="add" 
                size={16} 
                color={item.quantity >= 10 ? colors.brand.textSecondary : colors.brand.background} 
              />
            </TouchableOpacity>
          </View>
          
          <View style={styles.subtotalContainer}>
            <Text style={styles.subtotalValue}>
              {paymentService.formatCurrency(item.totalPrice)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderCustomerForm = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Dados do Comprador</Text>
      
      <View style={styles.formRow}>
        <View style={[styles.inputContainer, { flex: 1, marginRight: spacing.sm }]}>
          <Text style={styles.inputLabel}>Nome *</Text>
          <TextInput
            style={[
              styles.textInput,
              focusedField === 'nome' && styles.textInputFocused,
              formErrors.nome && styles.textInputError
            ]}
            value={formData.nome}
            onChangeText={(value) => handleInputChange('nome', value)}
            onFocus={() => setFocusedField('nome')}
            onBlur={() => setFocusedField(null)}
            placeholder="Seu nome"
            placeholderTextColor={colors.brand.textSecondary}
            autoCapitalize="words"
          />
          {formErrors.nome && (
            <Text style={styles.errorText}>{formErrors.nome}</Text>
          )}
        </View>
        
        <View style={[styles.inputContainer, { flex: 1, marginLeft: spacing.sm }]}>
          <Text style={styles.inputLabel}>Sobrenome *</Text>
          <TextInput
            style={[
              styles.textInput,
              focusedField === 'sobrenome' && styles.textInputFocused,
              formErrors.sobrenome && styles.textInputError
            ]}
            value={formData.sobrenome}
            onChangeText={(value) => handleInputChange('sobrenome', value)}
            onFocus={() => setFocusedField('sobrenome')}
            onBlur={() => setFocusedField(null)}
            placeholder="Seu sobrenome"
            placeholderTextColor={colors.brand.textSecondary}
            autoCapitalize="words"
          />
          {formErrors.sobrenome && (
            <Text style={styles.errorText}>{formErrors.sobrenome}</Text>
          )}
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Email *</Text>
        <TextInput
          style={[
            styles.textInput,
            focusedField === 'email' && styles.textInputFocused,
            formErrors.email && styles.textInputError
          ]}
          value={formData.email}
          onChangeText={(value) => handleInputChange('email', value)}
          onFocus={() => setFocusedField('email')}
          onBlur={() => setFocusedField(null)}
          placeholder="seu@email.com"
          placeholderTextColor={colors.brand.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {formErrors.email && (
          <Text style={styles.errorText}>{formErrors.email}</Text>
        )}
      </View>

      <View style={styles.formRow}>
        <View style={[styles.inputContainer, { flex: 1, marginRight: spacing.sm }]}>
          <Text style={styles.inputLabel}>Telefone *</Text>
          <TextInput
            style={[
              styles.textInput,
              focusedField === 'telefone' && styles.textInputFocused,
              formErrors.telefone && styles.textInputError
            ]}
            value={formData.telefone}
            onChangeText={(value) => handleInputChange('telefone', value)}
            onFocus={() => setFocusedField('telefone')}
            onBlur={() => setFocusedField(null)}
            placeholder="(11) 99999-9999"
            placeholderTextColor={colors.brand.textSecondary}
            keyboardType="phone-pad"
          />
          {formErrors.telefone && (
            <Text style={styles.errorText}>{formErrors.telefone}</Text>
          )}
        </View>
        
        <View style={[styles.inputContainer, { flex: 1, marginLeft: spacing.sm }]}>
          <Text style={styles.inputLabel}>CPF *</Text>
          <TextInput
            style={[
              styles.textInput,
              focusedField === 'cpf' && styles.textInputFocused,
              formErrors.cpf && styles.textInputError
            ]}
            value={formData.cpf}
            onChangeText={(value) => handleInputChange('cpf', value)}
            onFocus={() => setFocusedField('cpf')}
            onBlur={() => setFocusedField(null)}
            placeholder="000.000.000-00"
            placeholderTextColor={colors.brand.textSecondary}
            keyboardType="numeric"
          />
          {formErrors.cpf && (
            <Text style={styles.errorText}>{formErrors.cpf}</Text>
          )}
        </View>
      </View>
    </View>
  );

  const renderOrderSummary = () => {
    const totals = calculateFees();
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Resumo do Pedido</Text>
        
        <View style={styles.orderSummary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>
              {paymentService.formatCurrency(totals.original)}
            </Text>
          </View>
          
          {totals.fee > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Taxa de conveniência ({eventFees.buyerFeePercentage}%)
              </Text>
              <Text style={styles.summaryValue}>
                {paymentService.formatCurrency(totals.fee)}
              </Text>
            </View>
          )}
          
          <View style={styles.divider} />
          
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              {paymentService.formatCurrency(totals.total)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderContinueButton = () => (
    <View style={styles.bottomContainer}>
      <TouchableOpacity
        style={[
          styles.continueButton,
          (submitting || checkoutItems.length === 0) && styles.continueButtonDisabled
        ]}
        onPress={handleProceedToPayment}
        disabled={submitting || checkoutItems.length === 0}
      >
        <LinearGradient
          colors={
            submitting || checkoutItems.length === 0
              ? [colors.brand.textSecondary, colors.brand.textSecondary]
              : [colors.brand.primary, colors.brand.secondary]
          }
          style={styles.continueButtonGradient}
        >
          {submitting ? (
            <ActivityIndicator color={colors.brand.background} />
          ) : (
            <>
              <Text style={styles.continueButtonText}>
                Continuar para Pagamento
              </Text>
              <Ionicons name="arrow-forward" size={20} color={colors.brand.background} />
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
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
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {renderHeader()}
        
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderEventSummary()}
          {renderTicketSelection()}
          {renderCustomerForm()}
          {renderOrderSummary()}
          
          {/* Espaçamento para o botão fixo */}
          <View style={{ height: 100 }} />
        </ScrollView>
        
        {renderContinueButton()}
      </KeyboardAvoidingView>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.brand.textPrimary,
    marginBottom: spacing.md,
  },
  eventSummary: {
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  eventInfo: {
    alignItems: 'center',
  },
  eventTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: '600',
    color: colors.brand.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  eventDate: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  eventLocation: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    textAlign: 'center',
  },
  ticketItem: {
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketInfo: {
    flex: 1,
  },
  ticketName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.brand.textPrimary,
    marginBottom: spacing.xs,
  },
  ticketPrice: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonDisabled: {
    backgroundColor: colors.brand.textSecondary,
  },
  quantityDisplay: {
    width: 40,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: spacing.sm,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.brand.textPrimary,
  },
  subtotalContainer: {
    alignItems: 'flex-end',
  },
  subtotalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.brand.primary,
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
  orderSummary: {
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
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
    color: colors.brand.textPrimary,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.brand.textSecondary,
    marginVertical: spacing.md,
    opacity: 0.3,
  },
  totalRow: {
    marginBottom: 0,
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
  continueButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonGradient: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.brand.background,
    marginRight: spacing.sm,
  },
});

export default CheckoutScreen; 