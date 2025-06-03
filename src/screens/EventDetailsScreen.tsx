import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Share,
  Linking,
  Alert,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
  FlatList,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import RenderHtml from 'react-native-render-html';
import { colors, spacing, typography, borderRadius } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { fetchEventById, Event, TicketBatch } from '../services/eventsService';
import { useApiData } from '../hooks/useApiData';
import { getCacheConfig } from '../config/performance';
import { RootStackParamList } from '../navigation/types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const IMAGE_HEIGHT = screenHeight * 0.45;

type EventDetailsScreenRouteProp = RouteProp<RootStackParamList, 'EventDetails'>;
type EventDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EventDetails'>;

interface EventDetailsScreenProps {
  route: EventDetailsScreenRouteProp;
  navigation: EventDetailsScreenNavigationProp;
}

interface SelectedTickets {
  [batchId: string]: number;
}

const EventDetailsScreen: React.FC<EventDetailsScreenProps> = () => {
  const route = useRoute<EventDetailsScreenRouteProp>();
  const navigation = useNavigation<EventDetailsScreenNavigationProp>();
  const { eventId } = route.params;
  const { isAuthenticated } = useAuth();
  const { width: windowWidth } = useWindowDimensions();
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState<SelectedTickets>({});
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);

  // Use the caching system for event details
  const {
    data: event,
    loading,
    error,
    refresh,
    isRefreshing,
  } = useApiData(
    () => fetchEventById(eventId),
    {
      cacheKey: `event_${eventId}`,
      ...getCacheConfig('eventDetails'),
      refetchOnMount: true,
    }
  );

  // HTML rendering configuration
  const htmlContentWidth = windowWidth - (spacing.xl * 2);

  const htmlTagsStyles = {
    body: {
      color: colors.brand.textSecondary,
      fontSize: typography.fontSizes.md,
      lineHeight: typography.fontSizes.md * 1.6,
      fontFamily: 'System',
    },
    h1: {
      color: colors.brand.textPrimary,
      fontSize: typography.fontSizes.xxl,
      fontWeight: typography.fontWeights.bold,
      marginBottom: spacing.lg,
      marginTop: spacing.lg,
    },
    h2: {
      color: colors.brand.textPrimary,
      fontSize: typography.fontSizes.xl,
      fontWeight: typography.fontWeights.bold,
      marginBottom: spacing.md,
      marginTop: spacing.lg,
    },
    h3: {
      color: colors.brand.textPrimary,
      fontSize: typography.fontSizes.lg,
      fontWeight: typography.fontWeights.semibold,
      marginBottom: spacing.sm,
      marginTop: spacing.md,
    },
    p: {
      color: colors.brand.textSecondary,
      fontSize: typography.fontSizes.md,
      lineHeight: typography.fontSizes.md * 1.6,
      marginBottom: spacing.md,
    },
    strong: {
      color: colors.brand.textPrimary,
      fontWeight: typography.fontWeights.bold,
    },
    b: {
      color: colors.brand.textPrimary,
      fontWeight: typography.fontWeights.bold,
    },
    em: {
      fontStyle: 'italic' as const,
      color: colors.brand.textSecondary,
    },
    i: {
      fontStyle: 'italic' as const,
      color: colors.brand.textSecondary,
    },
    a: {
      color: colors.brand.primary,
      textDecorationLine: 'underline' as const,
    },
    ul: {
      marginBottom: spacing.md,
      paddingLeft: spacing.lg,
    },
    ol: {
      marginBottom: spacing.md,
      paddingLeft: spacing.lg,
    },
    li: {
      color: colors.brand.textSecondary,
      fontSize: typography.fontSizes.md,
      lineHeight: typography.fontSizes.md * 1.5,
      marginBottom: spacing.xs,
    },
    blockquote: {
      backgroundColor: colors.brand.darkGray,
      borderLeftWidth: 4,
      borderLeftColor: colors.brand.primary,
      paddingLeft: spacing.lg,
      paddingVertical: spacing.md,
      marginVertical: spacing.md,
      borderRadius: borderRadius.md,
    },
    code: {
      backgroundColor: colors.brand.darkGray,
      color: colors.brand.primary,
      paddingHorizontal: spacing.xs,
      paddingVertical: spacing.xs / 2,
      borderRadius: borderRadius.sm,
      fontFamily: 'monospace',
      fontSize: typography.fontSizes.sm,
    },
    pre: {
      backgroundColor: colors.brand.darkGray,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      marginVertical: spacing.md,
      overflow: 'hidden' as const,
    },
  };

  const htmlClassesStyles = {
    'event-highlight': {
      backgroundColor: 'rgba(255, 215, 0, 0.1)',
      padding: spacing.md,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: 'rgba(255, 215, 0, 0.3)',
      marginVertical: spacing.md,
    },
    'event-warning': {
      backgroundColor: 'rgba(255, 107, 107, 0.1)',
      padding: spacing.md,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: 'rgba(255, 107, 107, 0.3)',
      marginVertical: spacing.md,
    },
    'event-info': {
      backgroundColor: 'rgba(69, 183, 209, 0.1)',
      padding: spacing.md,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: 'rgba(69, 183, 209, 0.3)',
      marginVertical: spacing.md,
    },
  };

  const renderersProps = {
    img: {
      enableExperimentalPercentWidth: true,
    },
  };

  // Custom renderer for images to make them responsive
  const renderers = {
    img: ({ TDefaultRenderer, ...props }: any) => {
      const { tnode } = props;
      const { src, alt, width, height } = tnode.attributes;
      
      // Calculate responsive dimensions
      const maxWidth = htmlContentWidth;
      let imageWidth = maxWidth;
      let imageHeight = 200; // Default height
      
      if (width && height) {
        const aspectRatio = parseInt(height) / parseInt(width);
        imageWidth = Math.min(parseInt(width), maxWidth);
        imageHeight = imageWidth * aspectRatio;
      }
      
      return (
        <View style={styles.htmlImageContainer}>
          <Image
            source={{ uri: src }}
            style={[
              styles.htmlImage,
              {
                width: imageWidth,
                height: imageHeight,
                maxWidth: maxWidth,
              },
            ]}
            resizeMode="cover"
          />
          {alt && (
            <Text style={styles.htmlImageCaption}>{alt}</Text>
          )}
        </View>
      );
    },
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleShare = async () => {
    if (!event) return;
    
    try {
      await Share.share({
        message: `Confira este evento: ${event.title}\n\n${event.description?.substring(0, 100)}...`,
        title: event.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    // TODO: Implement favorite functionality with backend
  };

  const handleOpenMaps = () => {
    if (!event?.location) return;
    
    const encodedLocation = encodeURIComponent(event.location);
    const url = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
    
    Linking.openURL(url).catch(() => {
      Alert.alert('Erro', 'Não foi possível abrir o mapa');
    });
  };

  const handleTicketPurchase = () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Login necessário',
        'Você precisa estar logado para comprar ingressos.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Fazer Login', onPress: () => navigation.navigate('Login') },
        ]
      );
      return;
    }

    const totalTickets = getTotalSelectedTickets();
    if (totalTickets === 0) {
      Alert.alert('Selecione ingressos', 'Escolha pelo menos um ingresso para continuar.');
      return;
    }

    setShowTicketModal(true);
  };

  const updateTicketQuantity = (batchId: string, quantity: number) => {
    console.log('Updating ticket quantity:', { batchId, quantity });
    setSelectedTickets(prev => {
      const newSelected = { ...prev };
      
      if (quantity <= 0) {
        delete newSelected[batchId];
      } else {
        // Limit to max 10 tickets per purchase
        newSelected[batchId] = Math.min(quantity, 10);
      }
      
      console.log('New selected tickets:', newSelected);
      return newSelected;
    });
  };

  const getTotalSelectedTickets = () => {
    const total = Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0);
    console.log('Selected tickets:', selectedTickets);
    console.log('Total selected tickets:', total);
    return total;
  };

  const getTotalPrice = () => {
    if (!event?.ticketBatches) return 0;
    
    return event.ticketBatches.reduce((total, batch) => {
      const quantity = selectedTickets[batch.id] || 0;
      return total + (quantity * batch.price);
    }, 0);
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatEventTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
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

  const getImageUrls = () => {
    if (!event) return [];
    const urls = [];
    
    // Use mediaUrls if available (multiple images/videos)
    if (event.mediaUrls && event.mediaUrls.length > 0) {
      urls.push(...event.mediaUrls);
    }
    // Use images array if available
    else if (event.images && event.images.length > 0) {
      urls.push(...event.images);
    }
    // Fallback to main imageUrl
    else if (event.imageUrl) {
      urls.push(event.imageUrl);
    }
    
    return urls.length > 0 ? urls : ['https://picsum.photos/400/300?random=1'];
  };

  const renderImageCarousel = () => {
    const imageUrls = getImageUrls();
    
    return (
      <View style={styles.imageContainer}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
            setCurrentImageIndex(index);
          }}
        >
          {imageUrls.map((url, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={0.9}
              onPress={() => setShowImageGallery(true)}
            >
              <Image
                source={{ uri: url }}
                style={styles.eventImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {/* Image Indicators */}
        {imageUrls.length > 1 && (
          <View style={styles.imageIndicators}>
            {imageUrls.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  index === currentImageIndex && styles.activeIndicator,
                ]}
              />
            ))}
          </View>
        )}
        
        {/* Overlay Gradient */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.imageOverlay}
        />
        
        {/* Header Controls */}
        <View style={styles.headerControls}>
          <TouchableOpacity style={styles.controlButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.rightControls}>
            <TouchableOpacity style={styles.controlButton} onPress={handleFavorite}>
              <Ionicons 
                name={isFavorite ? "heart" : "heart-outline"} 
                size={24} 
                color={isFavorite ? colors.brand.primary : "white"} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.controlButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Premium Badge */}
        {event?.isPremium && (
          <View style={styles.premiumBadge}>
            <LinearGradient
              colors={[colors.brand.primary, colors.brand.secondary]}
              style={styles.premiumGradient}
            >
              <Ionicons name="diamond" size={16} color={colors.brand.background} />
              <Text style={styles.premiumText}>Premium</Text>
            </LinearGradient>
          </View>
        )}

        {/* Image Counter */}
        {imageUrls.length > 1 && (
          <View style={styles.imageCounter}>
            <Text style={styles.imageCounterText}>
              {currentImageIndex + 1} / {imageUrls.length}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderThumbnailGallery = () => {
    const imageUrls = getImageUrls();
    
    if (imageUrls.length <= 1) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Galeria</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbnailContainer}
        >
          {imageUrls.map((url, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.thumbnail,
                index === currentImageIndex && styles.activeThumbnail,
              ]}
              onPress={() => {
                setCurrentImageIndex(index);
                setShowImageGallery(true);
              }}
            >
              <Image
                source={{ uri: url }}
                style={styles.thumbnailImage}
                resizeMode="cover"
              />
              {index === currentImageIndex && (
                <View style={styles.thumbnailOverlay}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.brand.primary} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderTicketSection = () => {
    if (!event?.ticketBatches || event.ticketBatches.length === 0) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingressos</Text>
          <View style={styles.noTicketsContainer}>
            <Ionicons name="ticket-outline" size={48} color={colors.brand.textSecondary} />
            <Text style={styles.noTicketsText}>Ingressos não disponíveis</Text>
          </View>
        </View>
      );
    }

    const activeBatches = event.ticketBatches.filter(batch => batch.status === 'ACTIVE');
    const upcomingBatches = event.ticketBatches.filter(batch => batch.status === 'UPCOMING');

    return (
      <View style={styles.section}>
        <View style={styles.ticketSectionHeader}>
          <View style={styles.ticketIconContainer}>
            <Ionicons name="ticket" size={24} color={colors.brand.background} />
          </View>
          <View style={styles.ticketHeaderText}>
            <Text style={styles.sectionTitle}>Ingressos</Text>
            <Text style={styles.ticketSubtitle}>
              Máximo 10 ingressos por compra
            </Text>
          </View>
        </View>
        
        {/* Active Batches */}
        {activeBatches.map((batch, index) => (
          <View key={batch.id} style={styles.ticketBatch}>
            <View style={styles.ticketBatchHeader}>
              <View style={styles.ticketBatchInfo}>
                <Text style={styles.ticketBatchName}>{batch.name}</Text>
                <Text style={styles.ticketBatchDescription}>
                  {batch.description || 'Ingresso padrão'}
                </Text>
                <View style={styles.ticketBatchMeta}>
                  <Text style={styles.ticketBatchAvailable}>
                    {batch.quantity - (batch.sold || 0)} disponíveis
                  </Text>
                  <Text style={styles.ticketBatchSold}>
                    {batch.sold || 0} vendidos
                  </Text>
                </View>
              </View>
              
              <View style={styles.ticketBatchPrice}>
                <Text style={styles.priceText}>{formatPrice(batch.price)}</Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(((batch.sold || 0) / batch.quantity) * 100, 100)}%` }
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round(((batch.sold || 0) / batch.quantity) * 100)}% vendido
              </Text>
            </View>

            {/* Quantity Selector */}
            <View style={styles.quantitySelectorContainer}>
              <Text style={styles.quantityLabel}>Quantidade:</Text>
              <View style={styles.quantitySelector}>
                <TouchableOpacity
                  style={[
                    styles.quantityButton,
                    (selectedTickets[batch.id] || 0) === 0 && styles.quantityButtonDisabled,
                  ]}
                  onPress={() => updateTicketQuantity(batch.id, (selectedTickets[batch.id] || 0) - 1)}
                  disabled={(selectedTickets[batch.id] || 0) === 0}
                >
                  <Ionicons name="remove" size={16} color={colors.brand.background} />
                </TouchableOpacity>
                
                <View style={styles.quantityDisplay}>
                  <Text style={styles.quantityText}>{selectedTickets[batch.id] || 0}</Text>
                </View>
                
                <TouchableOpacity
                  style={[
                    styles.quantityButton,
                    ((selectedTickets[batch.id] || 0) >= 10 || 
                     (selectedTickets[batch.id] || 0) >= (batch.quantity - (batch.sold || 0))) && 
                    styles.quantityButtonDisabled,
                  ]}
                  onPress={() => updateTicketQuantity(batch.id, (selectedTickets[batch.id] || 0) + 1)}
                  disabled={
                    (selectedTickets[batch.id] || 0) >= 10 || 
                    (selectedTickets[batch.id] || 0) >= (batch.quantity - (batch.sold || 0))
                  }
                >
                  <Ionicons name="add" size={16} color={colors.brand.background} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Subtotal */}
            {(selectedTickets[batch.id] || 0) > 0 && (
              <View style={styles.subtotalContainer}>
                <Text style={styles.subtotalLabel}>Subtotal:</Text>
                <Text style={styles.subtotalValue}>
                  {formatPrice(batch.price * (selectedTickets[batch.id] || 0))}
                </Text>
              </View>
            )}
          </View>
        ))}
        
        {/* Upcoming Batches */}
        {upcomingBatches.length > 0 && (
          <View style={styles.upcomingSection}>
            <Text style={styles.upcomingSectionTitle}>Em breve:</Text>
            {upcomingBatches.map((batch) => (
              <View key={batch.id} style={styles.upcomingBatch}>
                <View style={styles.upcomingBatchInfo}>
                  <Text style={styles.upcomingBatchName}>{batch.name}</Text>
                  <Text style={styles.upcomingBatchDate}>
                    Disponível a partir de {formatEventDate(batch.startSaleDate.toString())}
                  </Text>
                </View>
                <Text style={styles.upcomingBatchPrice}>{formatPrice(batch.price)}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderEventStats = () => {
    if (!event) return null;

    const stats = [
      {
        icon: 'people',
        label: 'Participantes',
        value: event.attendees ? `${event.attendees}+` : '0',
      },
      {
        icon: 'star',
        label: 'Avaliação',
        value: event.rating ? event.rating.toFixed(1) : 'N/A',
      },
      {
        icon: 'ticket',
        label: 'Ingressos',
        value: event.ticketBatches?.length || 0,
      },
      {
        icon: 'time',
        label: 'Duração',
        value: event.endDate ? 'Multi-dia' : '1 dia',
      },
    ];

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estatísticas</Text>
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons name={stat.icon as any} size={20} color={colors.brand.primary} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderImageGalleryModal = () => {
    const imageUrls = getImageUrls();
    
    return (
      <Modal
        visible={showImageGallery}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageGallery(false)}
      >
        <TouchableOpacity 
          style={styles.galleryModal}
          activeOpacity={1}
          onPress={() => setShowImageGallery(false)}
        >
          <TouchableOpacity
            style={styles.galleryCloseButton}
            onPress={() => setShowImageGallery(false)}
            activeOpacity={0.7}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <View style={styles.galleryCloseButtonInner}>
              <Ionicons name="close" size={24} color="white" />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.galleryImageContainer}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <FlatList
              data={imageUrls}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={currentImageIndex}
              getItemLayout={(data, index) => ({
                length: screenWidth,
                offset: screenWidth * index,
                index,
              })}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item }}
                  style={styles.galleryImage}
                  resizeMode="contain"
                />
              )}
              onMomentumScrollEnd={(event) => {
                const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
                setCurrentImageIndex(index);
              }}
            />
          </TouchableOpacity>
          
          <View style={styles.galleryCounter}>
            <Text style={styles.galleryCounterText}>
              {currentImageIndex + 1} de {imageUrls.length}
            </Text>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  if (loading && !event) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.brand.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
          <Text style={styles.loadingText}>Carregando evento...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !event) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.brand.background} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.brand.textSecondary} />
          <Text style={styles.errorText}>Erro ao carregar evento</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.brand.background} />
        <View style={styles.errorContainer}>
          <Ionicons name="calendar-outline" size={48} color={colors.brand.textSecondary} />
          <Text style={styles.errorText}>Evento não encontrado</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleBack}>
            <Text style={styles.retryButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={colors.brand.primary}
            colors={[colors.brand.primary]}
          />
        }
      >
        {/* Image Carousel */}
        {renderImageCarousel()}
        
        {/* Content */}
        <View style={styles.content}>
          {/* Event Title and Basic Info */}
          <View style={styles.section}>
            <Text style={styles.eventTitle}>{event.title}</Text>
            
            <View style={styles.eventInfoRow}>
              <View style={styles.eventInfoItem}>
                <Ionicons name="calendar" size={20} color={colors.brand.primary} />
                <View style={styles.eventInfoText}>
                  <Text style={styles.eventInfoLabel}>Data</Text>
                  <Text style={styles.eventInfoValue}>{formatEventDate(event.date)}</Text>
                  <Text style={styles.eventInfoTime}>{formatEventTime(event.date)}</Text>
                </View>
              </View>
            </View>
            
            <TouchableOpacity style={styles.eventInfoRow} onPress={handleOpenMaps}>
              <View style={styles.eventInfoItem}>
                <Ionicons name="location" size={20} color={colors.brand.primary} />
                <View style={styles.eventInfoText}>
                  <Text style={styles.eventInfoLabel}>Local</Text>
                  <Text style={[styles.eventInfoValue, styles.locationText]}>
                    {event.location}
                  </Text>
                  <Text style={styles.mapHint}>Toque para abrir no mapa</Text>
                </View>
              </View>
            </TouchableOpacity>
            
            {event.attendees && event.attendees > 0 && (
              <View style={styles.eventInfoRow}>
                <View style={styles.eventInfoItem}>
                  <Ionicons name="people" size={20} color={colors.brand.primary} />
                  <View style={styles.eventInfoText}>
                    <Text style={styles.eventInfoLabel}>Participantes</Text>
                    <Text style={styles.eventInfoValue}>
                      {event.attendees} {event.attendees === 1 ? 'pessoa' : 'pessoas'} confirmadas
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Thumbnail Gallery */}
          {renderThumbnailGallery()}

          {/* Event Statistics */}
          {renderEventStats()}
          
          {/* Ticket Section */}
          {renderTicketSection()}
          
          {/* Event Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sobre o Evento</Text>
            <RenderHtml
              contentWidth={htmlContentWidth}
              source={{ html: event.description || '<p>Sem descrição disponível.</p>' }}
              tagsStyles={htmlTagsStyles}
              classesStyles={htmlClassesStyles}
              renderers={renderers}
              renderersProps={renderersProps}
            />
          </View>
          
          {/* Organizer Info */}
          {event.createdById && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Organizador</Text>
              <View style={styles.organizerCard}>
                <View style={styles.organizerAvatar}>
                  <Ionicons name="person" size={24} color={colors.brand.primary} />
                </View>
                <View style={styles.organizerInfo}>
                  <Text style={styles.organizerName}>Organizador do Evento</Text>
                  <Text style={styles.organizerRole}>Criador</Text>
                </View>
              </View>
            </View>
          )}
          
          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>
      
      {/* Fixed Purchase Button */}
      {event?.ticketBatches && event.ticketBatches.length > 0 && getTotalSelectedTickets() > 0 && (
        <View style={styles.purchaseContainer}>
          <View style={styles.purchaseContent}>
            <View style={styles.purchaseInfo}>
              <Text style={styles.purchaseTotal}>
                Total: {formatPrice(getTotalPrice())}
              </Text>
              <Text style={styles.purchaseQuantity}>
                {getTotalSelectedTickets()} {getTotalSelectedTickets() === 1 ? 'ingresso' : 'ingressos'}
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.purchaseButton}
              onPress={handleTicketPurchase}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.brand.primary, colors.brand.secondary]}
                style={styles.purchaseButtonGradient}
              >
                <Ionicons 
                  name="card" 
                  size={20} 
                  color={colors.brand.background} 
                  style={styles.purchaseButtonIcon}
                />
                <Text style={styles.purchaseButtonText}>
                  Comprar Ingressos
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Image Gallery Modal */}
      {renderImageGalleryModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  loadingText: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  errorText: {
    fontSize: typography.fontSizes.lg,
    color: colors.brand.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  retryButtonText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.background,
  },
  imageContainer: {
    height: IMAGE_HEIGHT,
    position: 'relative',
  },
  eventImage: {
    width: screenWidth,
    height: IMAGE_HEIGHT,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: spacing.lg,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  activeIndicator: {
    backgroundColor: colors.brand.primary,
    width: 24,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  headerControls: {
    position: 'absolute',
    top: spacing.xl,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  rightControls: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumBadge: {
    position: 'absolute',
    top: spacing.xl + 60,
    right: spacing.lg,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  premiumGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  premiumText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.background,
  },
  imageCounter: {
    position: 'absolute',
    bottom: spacing.lg + 40, // Above indicators
    right: spacing.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  imageCounterText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: 'white',
  },
  content: {
    flex: 1,
    backgroundColor: colors.brand.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    marginTop: -20,
    paddingTop: spacing.xl,
  },
  section: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xxxl,
  },
  eventTitle: {
    fontSize: typography.fontSizes.xxxl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.xl,
    lineHeight: typography.fontSizes.xxxl * 1.2,
  },
  eventInfoRow: {
    marginBottom: spacing.lg,
  },
  eventInfoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  eventInfoText: {
    flex: 1,
  },
  eventInfoLabel: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    marginBottom: spacing.xs,
  },
  eventInfoValue: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.xs,
  },
  eventInfoTime: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.primary,
    fontWeight: typography.fontWeights.medium,
  },
  locationText: {
    textDecorationLine: 'underline',
  },
  mapHint: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.textSecondary,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.lg,
  },
  noTicketsContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.md,
  },
  noTicketsText: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
  },
  ticketSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    backgroundColor: colors.brand.darkGray,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.opacity.cardBorder,
  },
  ticketIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: colors.brand.primary,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  ticketHeaderText: {
    flex: 1,
  },
  ticketSubtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    marginTop: spacing.xs,
  },
  ticketBatch: {
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  ticketBatchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketBatchInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  ticketBatchName: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.xs,
  },
  ticketBatchDescription: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    marginBottom: spacing.xs,
  },
  ticketBatchMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketBatchAvailable: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.primary,
    fontWeight: typography.fontWeights.medium,
  },
  ticketBatchSold: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.textSecondary,
  },
  ticketBatchPrice: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.primary,
    marginBottom: spacing.sm,
  },
  progressContainer: {
    marginVertical: spacing.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.brand.primary,
  },
  progressText: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.textSecondary,
    fontWeight: typography.fontWeights.medium,
    textAlign: 'right',
  },
  quantitySelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  quantityLabel: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    marginRight: spacing.md,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.primary,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  quantityButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.brand.primary,
  },
  quantityButtonDisabled: {
    opacity: 0.6,
  },
  quantityDisplay: {
    paddingHorizontal: spacing.md,
    minWidth: 40,
    textAlign: 'center',
  },
  quantityText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.background,
  },
  subtotalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtotalLabel: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
  },
  subtotalValue: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.primary,
  },
  upcomingSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.opacity.cardBorder,
  },
  upcomingSectionTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textSecondary,
    marginBottom: spacing.md,
  },
  upcomingBatch: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.opacity.cardBorder,
  },
  upcomingBatchInfo: {
    flex: 1,
  },
  upcomingBatchName: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.medium,
    color: colors.brand.textPrimary,
    marginBottom: spacing.xs,
  },
  upcomingBatchDate: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
  },
  upcomingBatchPrice: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textSecondary,
  },
  eventDescription: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    lineHeight: typography.fontSizes.md * 1.6,
  },
  organizerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.opacity.cardBorder,
  },
  organizerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  organizerInfo: {
    flex: 1,
  },
  organizerName: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.xs,
  },
  organizerRole: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
  },
  bottomSpacing: {
    height: 180, // Space for fixed purchase button + navigation menu
  },
  purchaseContainer: {
    position: 'absolute',
    bottom: 90, // Position above the navigation menu (typical tab bar height is ~80px)
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.brand.background,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 1,
    borderColor: colors.opacity.cardBorder,
  },
  purchaseContent: {
    padding: spacing.lg,
  },
  purchaseInfo: {
    marginBottom: spacing.md,
  },
  purchaseTotal: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.primary,
    textAlign: 'center',
  },
  purchaseQuantity: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    textAlign: 'center',
  },
  purchaseButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  purchaseButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  purchaseButtonIcon: {
    marginRight: spacing.sm,
  },
  purchaseButtonText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.background,
  },
  htmlImageContainer: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  htmlImage: {
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  htmlImageCaption: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: spacing.md,
  },
  thumbnailContainer: {
    padding: spacing.md,
  },
  thumbnail: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.md,
  },
  activeThumbnail: {
    borderColor: colors.brand.primary,
    borderWidth: 2,
  },
  thumbnailOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  galleryModal: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryCloseButton: {
    position: 'absolute',
    top: 60, // Safe area + extra padding
    right: spacing.lg,
    zIndex: 1000,
    padding: spacing.sm,
  },
  galleryCloseButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  galleryImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryImage: {
    width: screenWidth,
    height: screenHeight,
  },
  galleryCounter: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    padding: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: borderRadius.full,
  },
  galleryCounterText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.background,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    backgroundColor: colors.brand.darkGray,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.opacity.cardBorder,
  },
  statItem: {
    alignItems: 'center',
    width: '48%',
    marginBottom: spacing.md,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    textAlign: 'center',
  },
});

export default EventDetailsScreen; 