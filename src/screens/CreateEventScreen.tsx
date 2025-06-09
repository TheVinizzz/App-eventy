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
  Dimensions,
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
import useCacheInvalidation from '../hooks/useCacheInvalidation';

interface EventFormData {
  title: string;
  description: string;
  date: Date | null;
  location: string;
  type: string;
  mediaUrls: string[];
  evenLoveEnabled: boolean;
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
  
  // Responsiveness detection
  const screenWidth = Dimensions.get('window').width;
  const isSmallDevice = screenWidth < 375;
  const isMediumDevice = screenWidth < 414;
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    date: null,
    location: '',
    type: 'SHOW',
    mediaUrls: [],
    evenLoveEnabled: false,
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
  
  // Cache invalidation hook
  const { invalidateAfterEventCreation } = useCacheInvalidation({
    onEventCreated: async () => {
      // This will trigger refresh in MyEventsScreen when user navigates back
      console.log('🔄 Event created - cache will be invalidated when navigating back');
    },
  });

  const totalSteps = 4;

  const updateFormData = (field: keyof EventFormData, value: string | boolean | Date | null | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Basic Information
        return !!(formData.title && formData.date && formData.location);
      case 1: // Image and Details
        return !!(formData.type); // Only require type, images are optional
      case 2: // EvenLove Configuration
        return true; // Optional step
      case 3: // Ticket Batches
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
    // Validação completa antes de enviar
    if (!formData.title?.trim()) {
      Alert.alert('Campo obrigatório', 'Por favor, digite o título do evento.');
      return;
    }

    if (!formData.description?.trim()) {
      Alert.alert('Campo obrigatório', 'Por favor, digite a descrição do evento.');
      return;
    }

    if (!formData.date) {
      Alert.alert('Campo obrigatório', 'Por favor, selecione a data do evento.');
      return;
    }

    if (!formData.location?.trim()) {
      Alert.alert('Campo obrigatório', 'Por favor, digite o local do evento.');
      return;
    }

    if (!formData.type) {
      Alert.alert('Campo obrigatório', 'Por favor, selecione o tipo do evento.');
      return;
    }

    if (!validateStep(3)) {
      Alert.alert('Erro', 'Por favor, adicione pelo menos um lote de ingressos.');
      return;
    }

    setIsLoading(true);

    try {
      // Create event data with extra validation
      const eventData: CreateEventData = {
        title: formData.title?.trim() || '',
        description: formData.description?.trim() || '',
        date: formData.date?.toISOString() || new Date().toISOString(),
        location: formData.location?.trim() || '',
        type: formData.type || 'CONFERENCE',
        imageUrl: formData.mediaUrls.length > 0 ? formData.mediaUrls[0] : 'https://via.placeholder.com/800x600/FFD700/FFFFFF?text=Evento', // Default image if none provided
        mediaUrls: formData.mediaUrls.length > 0 ? formData.mediaUrls : ['https://via.placeholder.com/800x600/FFD700/FFFFFF?text=Evento'],
        evenLoveEnabled: formData.evenLoveEnabled || false,
      };

      console.log('Creating event with data:', eventData);
      console.log('📤 Full event data being sent:', JSON.stringify(eventData, null, 2));

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

      // 🚀 Invalidar cache após criar evento
      await invalidateAfterEventCreation();
      
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
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Ocorreu um erro ao criar o evento. Tente novamente.';
      
      if (error.response?.data?.message) {
        if (Array.isArray(error.response.data.message)) {
          errorMessage = `Campos obrigatórios faltando:\n${error.response.data.message.join('\n')}`;
        } else {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

              // Dados já foram logados antes da requisição

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
      {/* Header clean e minimalista */}
      <View style={styles.cleanHeader}>
        <Text style={styles.cleanTitle}>Ingressos</Text>
        <Text style={styles.cleanSubtitle}>Configure os lotes de ingressos para seu evento</Text>
      </View>

      {/* Lista de lotes existentes - Design limpo */}
      {ticketBatches.length > 0 && (
        <View style={styles.batchesContainer}>
          {ticketBatches.map((batch, index) => (
            <View key={batch.id || index} style={styles.cleanBatchCard}>
              <View style={styles.cleanBatchCardHeader}>
                <View style={styles.batchNameContainer}>
                  <Text style={styles.cleanBatchName}>{batch.name}</Text>
                  {batch.description && (
                    <Text style={styles.cleanBatchDescription}>{batch.description}</Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => removeTicketBatch(batch.id || index.toString())}
                  style={styles.cleanDeleteButton}
                >
                  <Ionicons name="close" size={20} color={colors.brand.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.batchDetailsContainer}>
                <View style={styles.cleanDetailRow}>
                  <Text style={styles.detailLabel}>Preço</Text>
                  <Text style={styles.detailValue}>R$ {batch.price.toFixed(2)}</Text>
                </View>
                <View style={styles.cleanDetailRow}>
                  <Text style={styles.detailLabel}>Quantidade</Text>
                  <Text style={styles.detailValue}>{batch.quantity} ingressos</Text>
                </View>
                <View style={styles.cleanDetailRow}>
                  <Text style={styles.detailLabel}>Vendas</Text>
                  <Text style={styles.detailValue}>
                    {batch.startSaleDate ? batch.startSaleDate.toLocaleDateString('pt-BR') : 'Imediato'} até{' '}
                    {batch.endSaleDate ? batch.endSaleDate.toLocaleDateString('pt-BR') : 'evento'}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Botão adicionar lote - Estilo iOS */}
      {!showBatchForm && (
        <TouchableOpacity 
          style={styles.addBatchButton}
          onPress={() => setShowBatchForm(true)}
        >
          <View style={styles.addButtonContent}>
            <View style={styles.addButtonIcon}>
              <Ionicons name="add" size={24} color={colors.brand.primary} />
            </View>
            <View style={styles.addButtonText}>
              <Text style={styles.addButtonTitle}>
                {ticketBatches.length === 0 ? 'Criar primeiro lote' : 'Adicionar lote'}
              </Text>
              <Text style={styles.addButtonSubtitle}>
                {ticketBatches.length === 0 
                  ? 'Configure preços e disponibilidade' 
                  : 'Criar mais um tipo de ingresso'
                }
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.brand.textSecondary} />
          </View>
        </TouchableOpacity>
      )}

      {/* Formulário redesenhado - Uma informação por vez */}
      {showBatchForm && (
        <View style={styles.cleanForm}>
          {/* Header do formulário */}
          <View style={styles.cleanFormHeader}>
            <TouchableOpacity
              onPress={() => setShowBatchForm(false)}
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={24} color={colors.brand.primary} />
            </TouchableOpacity>
            <Text style={styles.formTitle}>Novo Lote</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Campos do formulário - Mobile first */}
          <View style={styles.formContent}>
            {/* Nome do lote */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nome do lote</Text>
              <Input
                placeholder="Ex: Promocional, VIP, Pista"
                value={currentBatch.name}
                onChangeText={(value) => setCurrentBatch(prev => ({ ...prev, name: value }))}
                style={styles.cleanInput}
              />
            </View>

            {/* Descrição */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Descrição (opcional)</Text>
              <Input
                placeholder="Descreva os benefícios deste lote"
                value={currentBatch.description}
                onChangeText={(value) => setCurrentBatch(prev => ({ ...prev, description: value }))}
                multiline
                numberOfLines={3}
                style={StyleSheet.flatten([styles.cleanInput, styles.textArea])}
              />
            </View>

            {/* Preço */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Preço por ingresso</Text>
              <Input
                placeholder="0,00"
                value={currentBatch.price > 0 ? currentBatch.price.toString() : ''}
                onChangeText={(value) => {
                  const numericValue = parseFloat(value.replace(',', '.')) || 0;
                  setCurrentBatch(prev => ({ ...prev, price: numericValue }));
                }}
                keyboardType="numeric"
                style={styles.cleanInput}
              />
              <Text style={styles.inputHelper}>Valor em reais (R$)</Text>
            </View>

            {/* Quantidade */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Quantidade disponível</Text>
              <Input
                placeholder="100"
                value={currentBatch.quantity > 0 ? currentBatch.quantity.toString() : ''}
                onChangeText={(value) => {
                  const numericValue = parseInt(value) || 0;
                  setCurrentBatch(prev => ({ ...prev, quantity: numericValue }));
                }}
                keyboardType="numeric"
                style={styles.cleanInput}
              />
              <Text style={styles.inputHelper}>Número de ingressos deste lote</Text>
            </View>

            {/* Período de vendas - Completamente redesenhado */}
            <View style={styles.salesSection}>
              <Text style={styles.cleanSectionTitle}>Período de vendas</Text>
              <Text style={styles.cleanSectionSubtitle}>
                Defina quando este lote estará disponível para compra
              </Text>

              {/* Início das vendas */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Início das vendas</Text>
                <DateTimePicker
                  value={currentBatch.startSaleDate}
                  onChange={(date) => setCurrentBatch(prev => ({ ...prev, startSaleDate: date }))}
                  placeholder="Disponível imediatamente"
                  minimumDate={new Date()}
                  style={styles.cleanDatePicker}
                />
                <Text style={styles.inputHelper}>
                  Deixe vazio para disponibilizar imediatamente
                </Text>
              </View>

              {/* Fim das vendas */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Fim das vendas</Text>
                <DateTimePicker
                  value={currentBatch.endSaleDate}
                  onChange={(date) => setCurrentBatch(prev => ({ ...prev, endSaleDate: date }))}
                  placeholder="Até a data do evento"
                  minimumDate={currentBatch.startSaleDate || new Date()}
                  style={styles.cleanDatePicker}
                />
                <Text style={styles.inputHelper}>
                  Deixe vazio para vender até o evento começar
                </Text>
              </View>
            </View>
          </View>

          {/* Botão de ação único e destacado */}
          <View style={styles.formActions}>
            <TouchableOpacity
              onPress={addTicketBatch}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Criar Lote</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  const renderEvenLoveConfig = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>EvenLove ❤️</Text>
      <Text style={styles.stepDescription}>
        O EvenLove é uma funcionalidade inovadora que conecta participantes do seu evento de forma inteligente e segura. 
        Baseado em interesses, localização e preferências, criamos conexões autênticas que podem durar para sempre.
      </Text>

      {/* Enable EvenLove Toggle */}
      <Card>
        <TouchableOpacity
          style={[styles.evenLoveToggle, formData.evenLoveEnabled && styles.evenLoveToggleActive]}
          onPress={() => updateFormData('evenLoveEnabled', !formData.evenLoveEnabled)}
        >
          <View style={styles.evenLoveToggleContent}>
            <View style={styles.evenLoveToggleLeft}>
              <LinearGradient
                colors={formData.evenLoveEnabled ? ['#FF6B6B', '#FF8787'] : ['#333333', '#444444']}
                style={styles.evenLoveIcon}
              >
                <Ionicons 
                  name={formData.evenLoveEnabled ? "heart" : "heart-outline"} 
                  size={24} 
                  color={formData.evenLoveEnabled ? "#ffffff" : "#888888"} 
                />
              </LinearGradient>
              <View style={styles.evenLoveToggleText}>
                <Text style={styles.evenLoveToggleTitle}>
                  {formData.evenLoveEnabled ? 'EvenLove Ativado' : 'Ativar EvenLove'}
                </Text>
                <Text style={styles.evenLoveToggleSubtitle}>
                  {formData.evenLoveEnabled 
                    ? 'Participantes poderão se conectar durante o evento'
                    : 'Permitir que participantes se conectem'
                  }
                </Text>
              </View>
            </View>
            <View style={[styles.toggleSwitch, formData.evenLoveEnabled && styles.toggleSwitchActive]}>
              <View style={[styles.toggleThumb, formData.evenLoveEnabled && styles.toggleThumbActive]} />
            </View>
          </View>
        </TouchableOpacity>
      </Card>

      {formData.evenLoveEnabled && (
        <View style={styles.evenLoveDetails}>
          {/* Benefits */}
          <Card style={styles.evenLoveBenefits}>
            <Text style={styles.benefitsTitle}>✨ Benefícios do EvenLove</Text>
            
            <View style={styles.benefitItem}>
              <LinearGradient colors={['#4ECDC4', '#44A08D']} style={styles.benefitIcon}>
                <Ionicons name="people" size={16} color="#ffffff" />
              </LinearGradient>
              <Text style={styles.benefitText}>Conecta participantes com interesses similares</Text>
            </View>
            
            <View style={styles.benefitItem}>
              <LinearGradient colors={['#667eea', '#764ba2']} style={styles.benefitIcon}>
                <Ionicons name="shield-checkmark" size={16} color="#ffffff" />
              </LinearGradient>
              <Text style={styles.benefitText}>Ambiente seguro e moderado</Text>
            </View>
            
            <View style={styles.benefitItem}>
              <LinearGradient colors={['#f093fb', '#f5576c']} style={styles.benefitIcon}>
                <Ionicons name="chatbubbles" size={16} color="#ffffff" />
              </LinearGradient>
              <Text style={styles.benefitText}>Chat integrado para conversas</Text>
            </View>
            
            <View style={styles.benefitItem}>
              <LinearGradient colors={['#4facfe', '#00f2fe']} style={styles.benefitIcon}>
                <Ionicons name="location" size={16} color="#ffffff" />
              </LinearGradient>
              <Text style={styles.benefitText}>Baseado na localização do evento</Text>
            </View>
          </Card>

          {/* Configuration Note */}
          <Card style={styles.configNote}>
            <View style={styles.configNoteHeader}>
              <Ionicons name="settings" size={20} color={colors.brand.primary} />
              <Text style={styles.configNoteTitle}>Configurações Avançadas</Text>
            </View>
            <Text style={styles.configNoteText}>
              Após criar o evento, você poderá acessar as configurações avançadas do EvenLove no dashboard, 
              incluindo faixa etária, critérios de matching e moderação.
            </Text>
          </Card>
        </View>
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
        return renderEvenLoveConfig();
      case 3:
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

// Get screen dimensions for responsive design
const { width: screenWidth } = Dimensions.get('window');
const isSmallScreen = screenWidth < 375;
const isMediumScreen = screenWidth < 414;

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
  // EvenLove Styles
  evenLoveToggle: {
    padding: spacing.lg,
  },
  evenLoveToggleActive: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  evenLoveToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  evenLoveToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  evenLoveIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  evenLoveToggleText: {
    flex: 1,
  },
  evenLoveToggleTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.xs,
  },
  evenLoveToggleSubtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
  },
  toggleSwitch: {
    width: 48,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.brand.darkGray,
    justifyContent: 'center',
    padding: 2,
  },
  toggleSwitchActive: {
    backgroundColor: '#FF6B6B',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.brand.textSecondary,
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    backgroundColor: colors.brand.textPrimary,
    alignSelf: 'flex-end',
  },
  evenLoveDetails: {
    marginTop: spacing.lg,
  },
  evenLoveBenefits: {
    marginBottom: spacing.md,
  },
  benefitsTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.md,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  benefitIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  benefitText: {
    flex: 1,
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
  },
  configNote: {
    marginBottom: spacing.md,
  },
  configNoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  configNoteTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    marginLeft: spacing.sm,
  },
  configNoteText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    lineHeight: typography.fontSizes.sm * 1.4,
  },
  
  // ========= MODERN TICKET BATCHES STYLES =========
  modernHeader: {
    marginBottom: spacing.xl,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  headerGradient: {
    flexDirection: isSmallScreen ? 'column' : 'row',
    alignItems: 'center',
    padding: isSmallScreen ? spacing.lg : spacing.xl,
    flexWrap: 'wrap',
  },
  headerIcon: {
    width: isSmallScreen ? 48 : 64,
    height: isSmallScreen ? 48 : 64,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: isSmallScreen ? 0 : spacing.lg,
    marginBottom: isSmallScreen ? spacing.md : 0,
  },
  headerText: {
    flex: 1,
  },
  modernStepTitle: {
    fontSize: isSmallScreen ? typography.fontSizes.xl : typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.xs,
    textAlign: isSmallScreen ? 'center' : 'left',
  },
  modernStepSubtitle: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    lineHeight: typography.fontSizes.md * 1.4,
  },
  
  // Empty State
  emptyState: {
    marginBottom: spacing.xl,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  emptyStateGradient: {
    padding: isSmallScreen ? spacing.xl : spacing.xl * 1.5,
    alignItems: 'center',
  },
  emptyStateIcon: {
    marginBottom: spacing.lg,
  },
  emptyStateTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    textAlign: 'center',
    lineHeight: typography.fontSizes.md * 1.4,
    marginBottom: spacing.xl,
  },
  quickStartButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  quickStartGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  quickStartText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: 'white',
    marginLeft: spacing.sm,
  },
  
  // Modern Batches List
  modernBatchesList: {
    marginBottom: spacing.xl,
  },
  batchesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modernBatchesTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
  },
  addMoreText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.primary,
    marginLeft: spacing.xs,
  },
  
  // Modern Batch Card
  modernBatchCard: {
    marginBottom: spacing.lg,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  batchCardGradient: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modernBatchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  batchTypeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  batchColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  modernBatchName: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    flex: 1,
  },
  modernRemoveButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  modernBatchDescription: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: typography.fontSizes.sm * 1.4,
  },
  
  // Info Grid
  batchInfoGrid: {
    flexDirection: isSmallScreen ? 'column' : 'row',
    marginBottom: spacing.lg,
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  batchInfoCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  infoCardLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.textSecondary,
    marginLeft: spacing.xs,
    textTransform: 'uppercase',
    fontWeight: typography.fontWeights.semibold,
  },
  infoCardValue: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
  },
  
  // Sales Period
  salesPeriod: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  salesPeriodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  salesPeriodTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textPrimary,
    marginLeft: spacing.xs,
  },
  salesDates: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  salesDate: {
    flex: 1,
  },
  salesDateLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.textSecondary,
    textTransform: 'uppercase',
    fontWeight: typography.fontWeights.semibold,
    marginBottom: spacing.xs,
  },
  salesDateValue: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.brand.textPrimary,
  },
  salesDateSeparator: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: spacing.md,
  },
  
  // Modern Form
  modernBatchForm: {
    marginTop: spacing.xl,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  formGradient: {
    padding: isSmallScreen ? spacing.lg : spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modernFormHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  formHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  formIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  modernFormTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
  },
  modernCloseButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  modernFormContent: {
    gap: spacing.lg,
  },
  modernFormGroup: {
    gap: spacing.sm,
  },
  modernFormLabel: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textPrimary,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modernFormInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modernFormTextArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modernFormGrid: {
    flexDirection: isSmallScreen ? 'column' : 'row',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  modernFormGridItem: {
    flex: isSmallScreen ? undefined : 1,
    width: isSmallScreen ? '100%' : undefined,
    minWidth: isSmallScreen ? undefined : 120,
    gap: spacing.sm,
  },
  modernFormSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
  },
  sectionSubtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
  },
  modernFormActions: {
    flexDirection: isSmallScreen ? 'column' : 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  modernCancelButton: {
    flex: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  modernCancelText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textSecondary,
  },
  modernCreateButton: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  modernCreateText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: 'white',
  },
  
  // ========= MOBILE-OPTIMIZED SALES PERIOD STYLES =========
  salesPeriodSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: isSmallScreen ? spacing.lg : spacing.xl,
    gap: spacing.lg,
  },
  salesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  salesHeaderIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(30, 144, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  salesHeaderText: {
    flex: 1,
  },
  salesSectionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.xs,
  },
  salesSectionSubtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    lineHeight: typography.fontSizes.sm * 1.3,
  },
  
  // Date Groups
  saleDateGroup: {
    gap: spacing.md,
  },
  saleDateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  saleDateTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
  },
  saleDateHelper: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    lineHeight: typography.fontSizes.sm * 1.4,
    marginBottom: spacing.sm,
    fontStyle: 'italic',
  },
  modernSaleDatePicker: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    minHeight: 56,
  },
  
  // Separator
  salesSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  separatorDot: {
    paddingHorizontal: spacing.md,
  },
  
  // Preview
  salesPreview: {
    backgroundColor: 'rgba(138, 43, 226, 0.08)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(138, 43, 226, 0.2)',
    padding: spacing.md,
    marginTop: spacing.md,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  previewTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.primary,
    textTransform: 'uppercase',
  },
  previewContent: {
    paddingLeft: spacing.md,
  },
  previewText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    lineHeight: typography.fontSizes.sm * 1.4,
  },
  previewLabel: {
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
  },
  
  // ========= CLEAN MOBILE-FIRST STYLES =========
  cleanHeader: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: spacing.xl,
  },
  cleanTitle: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.xs,
  },
  cleanSubtitle: {
    fontSize: typography.fontSizes.lg,
    color: colors.brand.textSecondary,
    lineHeight: typography.fontSizes.lg * 1.4,
  },

  // Container de lotes existentes
  batchesContainer: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  cleanBatchCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cleanBatchCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  batchNameContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  cleanBatchName: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.xs,
  },
  cleanBatchDescription: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    lineHeight: typography.fontSizes.md * 1.3,
    fontStyle: 'italic',
  },
  cleanDeleteButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  batchDetailsContainer: {
    gap: spacing.md,
  },
  cleanDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  detailLabel: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  detailValue: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textPrimary,
    fontWeight: typography.fontWeights.semibold,
  },

  // Botão adicionar lote - Estilo iOS
  addBatchButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: spacing.xl,
  },
  addButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xl,
  },
  addButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    flex: 1,
    marginLeft: spacing.lg,
    marginRight: spacing.md,
  },
  addButtonTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.xs,
  },
  addButtonSubtitle: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    lineHeight: typography.fontSizes.md * 1.3,
  },

  // Formulário limpo
  cleanForm: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  cleanFormHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  formTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textPrimary,
  },
  headerSpacer: {
    width: 40,
  },
  formContent: {
    padding: spacing.xl,
    gap: spacing.xl,
  },
  inputGroup: {
    gap: spacing.sm,
  },
  inputLabel: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.xs,
  },
  cleanInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    fontSize: typography.fontSizes.lg,
    color: colors.brand.textPrimary,
    minHeight: 56,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputHelper: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    marginTop: spacing.xs,
    lineHeight: typography.fontSizes.sm * 1.3,
  },
  salesSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: spacing.xl,
  },
  cleanSectionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textPrimary,
  },
  cleanSectionSubtitle: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    lineHeight: typography.fontSizes.md * 1.3,
    marginTop: spacing.xs,
  },
  cleanDatePicker: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    minHeight: 56,
  },
  formActions: {
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  primaryButton: {
    backgroundColor: colors.brand.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
  },
});

export default CreateEventScreen; 