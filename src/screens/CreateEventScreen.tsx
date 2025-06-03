import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Input, Button, Card, DateTimePicker, ImagePicker, MultipleImagePicker } from '../components/ui';
import { colors, spacing, typography, borderRadius } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import eventService, { CreateEventData, CreateTicketBatchData } from '../services/eventService';

interface EventFormData {
  title: string;
  description: string;
  date: Date | null;
  location: string;
  type: string;
  mediaUrls: string[];
}

interface TicketBatch {
  id?: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  startSaleDate: Date | null;
  endSaleDate: Date | null;
}

const EVENT_TYPES = [
  { value: 'NORMAL', label: 'Evento Geral', icon: 'calendar', description: 'Eventos corporativos, workshops, palestras' },
  { value: 'PREMIUM', label: 'Premium', icon: 'star', description: 'Eventos exclusivos com benefícios especiais' },
  { value: 'SHOW', label: 'Show Musical', icon: 'musical-notes', description: 'Concertos, festivais, apresentações musicais' },
  { value: 'SPORTS', label: 'Esportivo', icon: 'trophy', description: 'Competições, jogos, eventos esportivos' },
  { value: 'THEATER', label: 'Teatro', icon: 'library', description: 'Peças teatrais, espetáculos, performances' },
  { value: 'FOOTBALL', label: 'Futebol', icon: 'football', description: 'Jogos de futebol, campeonatos' },
];

const CreateEventScreen: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    date: null,
    location: '',
    type: 'SHOW',
    mediaUrls: [],
  });
  const [ticketBatches, setTicketBatches] = useState<TicketBatch[]>([]);
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [currentBatch, setCurrentBatch] = useState<TicketBatch>({
    name: '',
    description: '',
    price: 0,
    quantity: 0,
    startSaleDate: null,
    endSaleDate: null,
  });

  const { user } = useAuth();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const totalSteps = 3;

  const updateFormData = (field: keyof EventFormData, value: string | boolean | Date | null | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Basic Information
        return !!(formData.title && formData.date && formData.location);
      case 1: // Image and Details
        return !!(formData.type && formData.mediaUrls.length > 0); // Require at least one image
      case 2: // Ticket Batches
        return ticketBatches.length > 0;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps - 1) {
        setCurrentStep(prev => prev + 1);
      }
    } else {
      Alert.alert('Campos obrigatórios', 'Por favor, preencha todos os campos obrigatórios antes de continuar.');
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const addTicketBatch = () => {
    // Validações detalhadas
    if (!currentBatch.name.trim()) {
      Alert.alert('Campo obrigatório', 'O nome do lote é obrigatório.');
      return;
    }

    if (currentBatch.price <= 0) {
      Alert.alert('Preço inválido', 'O preço deve ser maior que zero.');
      return;
    }

    if (currentBatch.quantity <= 0) {
      Alert.alert('Quantidade inválida', 'A quantidade deve ser maior que zero.');
      return;
    }

    // Validação de datas
    const startDate = currentBatch.startSaleDate || new Date();
    const endDate = currentBatch.endSaleDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    if (startDate >= endDate) {
      Alert.alert('Datas inválidas', 'A data de início deve ser anterior à data de fim das vendas.');
      return;
    }

    const newBatch: TicketBatch = {
      id: Date.now().toString(),
      name: currentBatch.name.trim(),
      description: currentBatch.description.trim(),
      price: currentBatch.price,
      quantity: currentBatch.quantity,
      startSaleDate: startDate,
      endSaleDate: endDate,
    };

    setTicketBatches(prev => [...prev, newBatch]);
    
    // Reset form
    setCurrentBatch({
      name: '',
      description: '',
      price: 0,
      quantity: 0,
      startSaleDate: null,
      endSaleDate: null,
    });
    
    setShowBatchForm(false);

    // Feedback positivo
    Alert.alert('Sucesso', 'Lote de ingresso adicionado com sucesso!');
  };

  const removeTicketBatch = (id: string) => {
    setTicketBatches(prev => prev.filter(batch => batch.id !== id));
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) {
      Alert.alert('Erro', 'Por favor, adicione pelo menos um lote de ingressos.');
      return;
    }

    setIsLoading(true);

    try {
      // Create event data
      const eventData: CreateEventData = {
        title: formData.title,
        description: formData.description,
        date: formData.date?.toISOString() || new Date().toISOString(),
        location: formData.location,
        type: formData.type,
        imageUrl: formData.mediaUrls.length > 0 ? formData.mediaUrls[0] : '', // First image as cover
        mediaUrls: formData.mediaUrls,
      };

      console.log('Creating event with data:', eventData);

      // Create the event
      const response = await eventService.createEvent(eventData);
      console.log('Event creation response:', response);

      // Extract event ID from response
      let eventId: string;
      if (response && response.event && response.event.id) {
        eventId = response.event.id;
      } else if (response && (response as any).id) {
        eventId = (response as any).id;
      } else {
        throw new Error('Event ID not found in response');
      }

      console.log('Event created successfully with ID:', eventId);

      // Create ticket batches if any
      if (ticketBatches.length > 0) {
        // Format batches exactly as shown in the example
        const batchesPayload = ticketBatches.map(batch => ({
          name: batch.name,
          description: batch.description,
          price: batch.price,
          startSaleDate: batch.startSaleDate?.toISOString() || new Date().toISOString(),
          endSaleDate: batch.endSaleDate?.toISOString() || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          quantity: batch.quantity,
          eventId: eventId, // Include eventId in each batch
          tempId: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` // Add tempId as shown in example
        }));

        const ticketBatchPayload = {
          eventId: eventId,
          batches: batchesPayload
        };

        console.log('Creating ticket batches with payload:', JSON.stringify(ticketBatchPayload, null, 2));
        
        await eventService.createTicketBatches(eventId, batchesPayload);
        console.log('Ticket batches created successfully');
      }

      Alert.alert(
        'Sucesso!',
        'Seu evento foi criado com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating event:', error);
      
      let errorMessage = 'Ocorreu um erro ao criar o evento. Tente novamente.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Erro', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {Array.from({ length: totalSteps }, (_, index) => (
        <View key={index} style={styles.stepContainer}>
          <View
            style={[
              styles.stepCircle,
              index <= currentStep && styles.stepCircleActive,
            ]}
          >
            <Text
              style={[
                styles.stepNumber,
                index <= currentStep && styles.stepNumberActive,
              ]}
            >
              {index + 1}
            </Text>
          </View>
          {index < totalSteps - 1 && (
            <View
              style={[
                styles.stepLine,
                index < currentStep && styles.stepLineActive,
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );

  const renderBasicInformation = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Informações Básicas</Text>
      <Text style={styles.stepDescription}>
        Defina os detalhes fundamentais do seu evento
      </Text>

      <Input
        placeholder="Título do evento *"
        value={formData.title}
        onChangeText={(value) => updateFormData('title', value)}
        leftIcon="ticket"
        style={styles.input}
      />

      <DateTimePicker
        value={formData.date}
        onChange={(date) => updateFormData('date', date)}
        placeholder="Selecione data e hora *"
        minimumDate={new Date()}
        style={styles.input}
      />

      <Input
        placeholder="Local do evento *"
        value={formData.location}
        onChangeText={(value) => updateFormData('location', value)}
        leftIcon="location"
        style={styles.input}
      />
    </View>
  );

  const renderDescription = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Imagem e Detalhes</Text>
      <Text style={styles.stepDescription}>
        Adicione imagens atrativas e configure os detalhes do seu evento
      </Text>

      {/* Multiple Image Picker */}
      <MultipleImagePicker
        onImagesSelected={(imageUrls) => updateFormData('mediaUrls', imageUrls)}
        placeholder="Adicionar imagens do evento"
        currentImageUrls={formData.mediaUrls}
        maxImages={5}
      />

      <Input
        placeholder="Descrição do evento"
        value={formData.description}
        onChangeText={(value) => updateFormData('description', value)}
        leftIcon="document-text"
        multiline
        numberOfLines={6}
        style={StyleSheet.flatten([styles.input, styles.textArea])}
      />

      {/* Event Type */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Tipo de Evento *</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.typeSelector}
          contentContainerStyle={styles.typeSelectorContent}
        >
          {EVENT_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.typeOption,
                formData.type === type.value && styles.typeOptionSelected,
              ]}
              onPress={() => updateFormData('type', type.value)}
            >
              <Ionicons
                name={type.icon as any}
                size={20}
                color={formData.type === type.value ? colors.brand.background : colors.brand.primary}
              />
              <Text
                style={[
                  styles.typeOptionText,
                  formData.type === type.value && styles.typeOptionTextSelected,
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  const renderTicketBatches = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Lotes de Ingressos</Text>
      <Text style={styles.stepDescription}>
        Configure os lotes de ingressos e preços do seu evento
      </Text>

      {ticketBatches.length === 0 && (
        <Card style={styles.warningCard}>
          <View style={styles.warningContent}>
            <Ionicons name="warning" size={24} color={colors.brand.warning} />
            <View style={styles.warningTextContainer}>
              <Text style={styles.warningTitle}>Lotes de ingressos obrigatórios!</Text>
              <Text style={styles.warningText}>
                Você precisa configurar pelo menos um lote de ingressos para criar o evento.
                Use o formulário abaixo para adicionar os lotes com preços e quantidades.
              </Text>
            </View>
          </View>
        </Card>
      )}

      {/* Lista de lotes existentes */}
      {ticketBatches.length > 0 && (
        <View style={styles.batchesList}>
          <Text style={styles.batchesListTitle}>Lotes Configurados</Text>
          {ticketBatches.map((batch, index) => (
            <Card key={batch.id || index} style={styles.batchCard}>
              <View style={styles.batchHeader}>
                <View style={styles.batchInfo}>
                  <Text style={styles.batchName}>{batch.name}</Text>
                  {batch.description ? (
                    <Text style={styles.batchDescription}>{batch.description}</Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  onPress={() => removeTicketBatch(batch.id || index.toString())}
                  style={styles.removeBatchButton}
                >
                  <Ionicons name="trash" size={20} color={colors.brand.error} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.batchDetails}>
                <View style={styles.batchDetailItem}>
                  <Text style={styles.batchDetailLabel}>Preço</Text>
                  <Text style={styles.batchPrice}>R$ {batch.price.toFixed(2)}</Text>
                </View>
                <View style={styles.batchDetailItem}>
                  <Text style={styles.batchDetailLabel}>Quantidade</Text>
                  <Text style={styles.batchQuantity}>{batch.quantity} ingressos</Text>
                </View>
              </View>

              <View style={styles.batchDates}>
                <View style={styles.batchDateItem}>
                  <Text style={styles.batchDetailLabel}>Início das vendas</Text>
                  <Text style={styles.batchDateText}>
                    {batch.startSaleDate ? batch.startSaleDate.toLocaleDateString('pt-BR') : 'Não definido'}
                  </Text>
                </View>
                <View style={styles.batchDateItem}>
                  <Text style={styles.batchDetailLabel}>Fim das vendas</Text>
                  <Text style={styles.batchDateText}>
                    {batch.endSaleDate ? batch.endSaleDate.toLocaleDateString('pt-BR') : 'Não definido'}
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </View>
      )}

      {/* Botão para adicionar novo lote */}
      {!showBatchForm ? (
        <Button
          title="+ Adicionar Lote de Ingresso"
          onPress={() => setShowBatchForm(true)}
          variant="outline"
          style={styles.addBatchButton}
        />
      ) : (
        <Card style={styles.batchForm}>
          <View style={styles.batchFormHeader}>
            <Text style={styles.batchFormTitle}>Novo Lote de Ingresso</Text>
            <TouchableOpacity
              onPress={() => setShowBatchForm(false)}
              style={styles.closeBatchFormButton}
            >
              <Ionicons name="close" size={24} color={colors.brand.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.batchFormContent}>
            {/* Nome do lote */}
            <View style={styles.batchFormGroup}>
              <Text style={styles.batchFormLabel}>Nome do Lote *</Text>
              <Input
                placeholder="Ex: Lote 1, Promocional, VIP"
                value={currentBatch.name}
                onChangeText={(value) => setCurrentBatch(prev => ({ ...prev, name: value }))}
                style={styles.batchFormInput}
              />
            </View>

            {/* Descrição */}
            <View style={styles.batchFormGroup}>
              <Text style={styles.batchFormLabel}>Descrição</Text>
              <Input
                placeholder="Descrição opcional do lote"
                value={currentBatch.description}
                onChangeText={(value) => setCurrentBatch(prev => ({ ...prev, description: value }))}
                multiline
                numberOfLines={3}
                style={StyleSheet.flatten([styles.batchFormInput, styles.batchFormTextArea])}
              />
            </View>

            {/* Preço e Quantidade */}
            <View style={styles.batchFormRow}>
              <View style={styles.batchFormHalf}>
                <Text style={styles.batchFormLabel}>Preço (R$) *</Text>
                <Input
                  placeholder="0,00"
                  value={currentBatch.price > 0 ? currentBatch.price.toString() : ''}
                  onChangeText={(value) => {
                    const numericValue = parseFloat(value.replace(',', '.')) || 0;
                    setCurrentBatch(prev => ({ ...prev, price: numericValue }));
                  }}
                  keyboardType="numeric"
                  style={styles.batchFormInput}
                />
              </View>

              <View style={styles.batchFormHalf}>
                <Text style={styles.batchFormLabel}>Quantidade *</Text>
                <Input
                  placeholder="100"
                  value={currentBatch.quantity > 0 ? currentBatch.quantity.toString() : ''}
                  onChangeText={(value) => {
                    const numericValue = parseInt(value) || 0;
                    setCurrentBatch(prev => ({ ...prev, quantity: numericValue }));
                  }}
                  keyboardType="numeric"
                  style={styles.batchFormInput}
                />
              </View>
            </View>

            {/* Período de Vendas */}
            <View style={styles.batchFormGroup}>
              <Text style={styles.batchFormSectionTitle}>Período de Vendas</Text>
              <Text style={styles.batchFormSectionDescription}>
                Defina quando este lote estará disponível para venda
              </Text>
            </View>
            
            <View style={styles.batchFormGroup}>
              <Text style={styles.batchFormLabel}>Início das Vendas</Text>
              <DateTimePicker
                value={currentBatch.startSaleDate}
                onChange={(date) => setCurrentBatch(prev => ({ ...prev, startSaleDate: date }))}
                placeholder="Selecione data e hora de início"
                minimumDate={new Date()}
                style={styles.batchFormInput}
              />
            </View>

            <View style={styles.batchFormGroup}>
              <Text style={styles.batchFormLabel}>Fim das Vendas</Text>
              <DateTimePicker
                value={currentBatch.endSaleDate}
                onChange={(date) => setCurrentBatch(prev => ({ ...prev, endSaleDate: date }))}
                placeholder="Selecione data e hora de fim"
                minimumDate={currentBatch.startSaleDate || new Date()}
                style={styles.batchFormInput}
              />
            </View>

            {/* Botões de ação */}
            <View style={styles.batchFormActions}>
              <Button
                title="Cancelar"
                onPress={() => {
                  setShowBatchForm(false);
                  setCurrentBatch({
                    name: '',
                    description: '',
                    price: 0,
                    quantity: 0,
                    startSaleDate: null,
                    endSaleDate: null,
                  });
                }}
                variant="outline"
                style={styles.batchActionButton}
              />
              <Button
                title="Adicionar Lote"
                onPress={addTicketBatch}
                style={styles.batchActionButton}
              />
            </View>
          </View>
        </Card>
      )}
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderBasicInformation();
      case 1:
        return renderDescription();
      case 2:
        return renderTicketBatches();
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.brand.background} />
      
      <LinearGradient
        colors={[colors.brand.background, colors.brand.darkGray]}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={colors.brand.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Criar Evento</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Step Indicator */}
          {renderStepIndicator()}

          {/* Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {renderCurrentStep()}
          </ScrollView>

          {/* Navigation */}
          <View style={styles.navigation}>
            {currentStep > 0 && (
              <Button
                title="Anterior"
                onPress={prevStep}
                variant="outline"
                style={styles.navButton}
              />
            )}
            
            {currentStep < totalSteps - 1 ? (
              <Button
                title="Próximo"
                onPress={nextStep}
                style={currentStep === 0 ? styles.fullWidthButton : styles.navButton}
              />
            ) : (
              <Button
                title="Criar Evento"
                onPress={handleSubmit}
                loading={isLoading}
                style={StyleSheet.flatten([styles.navButton, styles.createButton])}
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand.background,
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.opacity.cardBorder,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
  },
  headerSpacer: {
    width: 40,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brand.darkGray,
    borderWidth: 2,
    borderColor: colors.opacity.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  stepNumber: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textSecondary,
  },
  stepNumberActive: {
    color: colors.brand.background,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: colors.opacity.cardBorder,
    marginHorizontal: spacing.sm,
  },
  stepLineActive: {
    backgroundColor: colors.brand.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.sm,
  },
  stepDescription: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    marginBottom: spacing.xl,
    lineHeight: typography.fontSizes.md * 1.4,
  },
  input: {
    marginBottom: spacing.lg,
  },
  textArea: {
    minHeight: 120,
  },
  sectionLabel: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.md,
  },
  eventTypesContainer: {
    marginBottom: spacing.lg,
  },
  eventTypeCard: {
    width: 160,
    padding: spacing.lg,
    marginRight: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.brand.darkGray,
    borderWidth: 2,
    borderColor: colors.opacity.cardBorder,
    alignItems: 'center',
  },
  eventTypeCardActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  eventTypeLabel: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textPrimary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  eventTypeLabelActive: {
    color: colors.brand.background,
  },
  eventTypeDescription: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  eventTypeDescriptionActive: {
    color: colors.brand.background,
  },
  warningCard: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderColor: 'rgba(255, 193, 7, 0.3)',
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  warningContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.sm,
  },
  warningText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
  },
  batchCard: {
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  batchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  batchInfo: {
    flex: 1,
  },
  batchName: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
  },
  batchDescription: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    marginBottom: spacing.md,
  },
  removeBatchButton: {
    padding: spacing.sm,
  },
  batchDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  batchDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  batchDetailLabel: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textPrimary,
    marginRight: spacing.sm,
  },
  batchPrice: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.primary,
  },
  batchQuantity: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
  },
  addBatchButton: {
    marginTop: spacing.lg,
  },
  batchForm: {
    marginTop: spacing.lg,
    padding: spacing.lg,
  },
  batchFormHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  batchFormTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
  },
  closeBatchFormButton: {
    padding: spacing.sm,
  },
  batchFormContent: {
    flex: 1,
  },
  batchFormGroup: {
    marginBottom: spacing.md,
  },
  batchFormLabel: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.sm,
  },
  batchFormInput: {
    marginBottom: spacing.md,
  },
  batchFormTextArea: {
    minHeight: 120,
  },
  batchFormRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  batchFormHalf: {
    width: '48%',
  },
  batchFormSectionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.sm,
  },
  batchFormSectionDescription: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
  },
  batchDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  batchDateItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  batchDateText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
  },
  batchFormActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  batchActionButton: {
    width: '48%',
  },
  batchesList: {
    marginBottom: spacing.lg,
  },
  batchesListTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.sm,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.opacity.cardBorder,
  },
  navButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  fullWidthButton: {
    marginHorizontal: 0,
  },
  createButton: {
    backgroundColor: colors.brand.primary,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.sm,
  },
  typeSelector: {
    marginBottom: spacing.md,
  },
  typeSelectorContent: {
    paddingHorizontal: spacing.sm,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.brand.darkGray,
    borderWidth: 2,
    borderColor: colors.opacity.cardBorder,
    gap: spacing.xs,
  },
  typeOptionSelected: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  typeOptionText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.brand.textPrimary,
  },
  typeOptionTextSelected: {
    color: colors.brand.background,
  },
});

export default CreateEventScreen; 