import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius } from '../theme';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { 
  fetchEventById, 
  fetchEventDashboard, 
  Event, 
  DashboardMetrics 
} from '../services/eventsService';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type EventDashboardScreenRouteProp = RouteProp<RootStackParamList, 'EventDashboard'>;
type EventDashboardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EventDashboard'>;

interface EventDashboardScreenProps {
  route: EventDashboardScreenRouteProp;
  navigation: EventDashboardScreenNavigationProp;
}

const EventDashboardScreen: React.FC<EventDashboardScreenProps> = () => {
  const navigation = useNavigation<EventDashboardScreenNavigationProp>();
  const route = useRoute<EventDashboardScreenRouteProp>();
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [event, setEvent] = useState<Event | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  const eventId = route.params?.eventId;

  useEffect(() => {
    if (!eventId) {
      Alert.alert('Erro', 'ID do evento não fornecido');
      navigation.goBack();
      return;
    }
    
    loadDashboardData();
  }, [eventId]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load event details and dashboard metrics in parallel
      const [eventData, metricsData] = await Promise.all([
        fetchEventById(eventId),
        fetchEventDashboard(eventId)
      ]);

      setEvent(eventData);
      setDashboardData(metricsData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Não foi possível carregar os dados do dashboard');
      
      // Show alert for errors
      Alert.alert(
        'Erro',
        'Não foi possível carregar os dados do dashboard. Tente novamente.',
        [
          { text: 'Voltar', onPress: () => navigation.goBack() },
          { text: 'Tentar Novamente', onPress: loadDashboardData }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const getDaySalesData = () => {
    if (!dashboardData?.dailySales || dashboardData.dailySales.length === 0) {
      return [
        { day: 'Seg', value: 0 },
        { day: 'Ter', value: 0 },
        { day: 'Qua', value: 0 },
        { day: 'Qui', value: 0 },
        { day: 'Sex', value: 0 },
        { day: 'Sab', value: 0 },
        { day: 'Dom', value: 0 }
      ];
    }

    // Convert daily sales to day names
    return dashboardData.dailySales.slice(-7).map((sale, index) => {
      const date = new Date(sale.date);
      const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
      return {
        day: dayNames[date.getDay()],
        value: sale.count
      };
    });
  };

  const getActivityData = (): Array<{
    id: number;
    type: string;
    message: string;
    time: string;
    amount: number;
  }> => {
    // Generate activity based on recent sales
    if (!dashboardData?.dailySales || dashboardData.dailySales.length === 0) {
      return [
        { id: 1, type: 'sale', message: 'Aguardando vendas...', time: '-', amount: 0 }
      ];
    }

    const activities: Array<{
      id: number;
      type: string;
      message: string;
      time: string;
      amount: number;
    }> = [];
    const recentSales = dashboardData.dailySales.slice(-3);
    
    recentSales.forEach((sale, index) => {
      if (sale.count > 0) {
        activities.push({
          id: index + 1,
          type: 'sale',
          message: `${sale.count} ${sale.count === 1 ? 'ingresso vendido' : 'ingressos vendidos'}`,
          time: format(new Date(sale.date), 'dd/MM', { locale: ptBR }),
          amount: sale.revenue
        });
      }
    });

    if (activities.length === 0) {
      return [
        { id: 1, type: 'sale', message: 'Nenhuma venda recente', time: '-', amount: 0 }
      ];
    }

    return activities;
  };

  // Show loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Carregando dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error || !event || !dashboardData) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#E74C3C" />
          <Text style={styles.errorText}>{error || 'Dados não disponíveis'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadDashboardData}>
            <Text style={styles.retryButtonText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const occupancyPercentage = dashboardData.soldPercentage.toFixed(1);
  const salesData = getDaySalesData();
  const activityData = getActivityData();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSubtitle}>{event.title}</Text>
        </View>
        
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.headerIconButton}
            onPress={() => navigation.navigate('EventAffiliates', { eventId })}
          >
            <Ionicons name="people-outline" size={22} color="#FFD700" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconButton}>
            <Ionicons name="share-outline" size={22} color="#FFD700" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {['7d', '30d', '90d'].map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.periodButtonTextActive
              ]}>
                {period === '7d' ? '7 dias' : period === '30d' ? '30 dias' : '90 dias'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Main Metrics */}
        <View style={styles.metricsContainer}>
          {/* Revenue Card */}
          <LinearGradient
            colors={['#FFD700', '#FF8C00', '#FFA500']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.metricCard, styles.revenueCard]}
          >
            <View style={styles.metricHeader}>
              <View style={styles.iconContainer}>
                <Ionicons name="cash" size={24} color="#1a1a1a" />
              </View>
              <View style={styles.growthBadge}>
                <Ionicons name="trending-up" size={12} color="#2ECC71" />
                <Text style={styles.growthText}>+12.5%</Text>
              </View>
            </View>
            <Text style={styles.metricValue}>{formatCurrency(dashboardData.totalRevenue)}</Text>
            <Text style={styles.metricLabel}>Receita Total</Text>
            <Text style={styles.metricPeriod}>Últimos 30 dias</Text>
          </LinearGradient>

          {/* Secondary Metrics */}
          <View style={styles.secondaryMetrics}>
            {/* Tickets Card */}
            <LinearGradient
              colors={['#2ECC71', '#27AE60']}
              style={styles.secondaryCard}
            >
              <View style={styles.metricHeader}>
                <Ionicons name="ticket" size={20} color="#fff" />
                <Text style={styles.smallGrowth}>+8.3%</Text>
              </View>
              <Text style={styles.secondaryValue}>
                {dashboardData.soldTickets}/{dashboardData.totalTickets}
              </Text>
              <Text style={styles.secondaryLabel}>Ingressos</Text>
              <Text style={styles.occupancyText}>{occupancyPercentage}% ocupação</Text>
            </LinearGradient>

            {/* Average Price Card */}
            <LinearGradient
              colors={['#3498DB', '#2980B9']}
              style={styles.secondaryCard}
            >
              <View style={styles.metricHeader}>
                <Ionicons name="trending-up" size={20} color="#fff" />
                <Text style={styles.smallGrowth}>+5.7%</Text>
              </View>
              <Text style={styles.secondaryValue}>{formatCurrency(dashboardData.averageTicketPrice)}</Text>
              <Text style={styles.secondaryLabel}>Preço Médio</Text>
              <Text style={styles.occupancyText}>por ingresso</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estatísticas Rápidas</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: '#2ECC7120' }]}>
              <Ionicons name="checkmark-circle" size={24} color="#2ECC71" />
              <Text style={styles.statValue}>{dashboardData.soldTickets}</Text>
              <Text style={styles.statLabel}>Vendidos</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#3498DB20' }]}>
              <Ionicons name="ticket" size={24} color="#3498DB" />
              <Text style={styles.statValue}>{dashboardData.availableTickets}</Text>
              <Text style={styles.statLabel}>Disponíveis</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#FFD70020' }]}>
              <Ionicons name="calendar" size={24} color="#FFD700" />
              <Text style={styles.statValue}>{format(parseISO(event.date), 'dd/MM', { locale: ptBR })}</Text>
              <Text style={styles.statLabel}>Data</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#9B59B620' }]}>
              <Ionicons name="location" size={24} color="#9B59B6" />
              <Text style={styles.statValue}>{event.location.split(',')[0]}</Text>
              <Text style={styles.statLabel}>Local</Text>
            </View>
          </View>
        </View>

        {/* Sales Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vendas por Dia</Text>
          <View style={styles.chartContainer}>
            <View style={styles.chart}>
              {salesData.map((item, index) => {
                const maxValue = Math.max(...salesData.map(s => s.value)) || 1;
                const height = (item.value / maxValue) * 100;
                
                return (
                  <View key={index} style={styles.chartBar}>
                    <Text style={styles.chartValue}>{item.value}</Text>
                    <View style={styles.barContainer}>
                      <View style={[styles.bar, { height: `${height}%` }]} />
                    </View>
                    <Text style={styles.chartDay}>{item.day}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Ticket Distribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Distribuição de Ingressos</Text>
          <View style={styles.distributionContainer}>
            {dashboardData.ticketDistribution.map((ticket, index) => {
              const total = ticket.sold + ticket.available;
              const percentage = total > 0 ? (ticket.sold / dashboardData.soldTickets * 100).toFixed(1) : '0.0';
              const fillPercentage = total > 0 ? (ticket.sold / total * 100) : 0;
              
              const colors = ['#FFD700', '#FF6B35', '#4ECDC4', '#45B7D1'];
              const color = colors[index % colors.length];
              
              return (
                <View key={index} style={styles.distributionItem}>
                  <View style={styles.distributionHeader}>
                    <View style={styles.distributionInfo}>
                      <View style={[styles.colorDot, { backgroundColor: color }]} />
                      <Text style={styles.ticketType}>{ticket.name}</Text>
                    </View>
                    <Text style={styles.distributionPercentage}>{percentage}%</Text>
                  </View>
                  
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          width: `${fillPercentage}%`, 
                          backgroundColor: color 
                        }
                      ]} 
                    />
                  </View>
                  
                  <Text style={styles.ticketDetails}>
                    {ticket.sold}/{ticket.sold + ticket.available} • {formatCurrency(ticket.price)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.activityHeader}>
            <Text style={styles.sectionTitle}>Atividade Recente</Text>
            <View style={styles.liveBadge}>
              <View style={styles.liveIndicator} />
              <Text style={styles.liveText}>AO VIVO</Text>
            </View>
          </View>
          
          <View style={styles.activityContainer}>
            {activityData.map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <View style={[styles.activityIcon, { 
                  backgroundColor: activity.type === 'sale' ? '#2ECC71' : '#3498DB'
                }]}>
                  <Ionicons 
                    name={activity.type === 'sale' ? 'card' : 'checkmark-circle'} 
                    size={16} 
                    color="#fff" 
                  />
                </View>
                
                <View style={styles.activityContent}>
                  <Text style={styles.activityMessage}>{activity.message}</Text>
                  {activity.amount > 0 && (
                    <Text style={styles.activityAmount}>{formatCurrency(activity.amount)}</Text>
                  )}
                </View>
                
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#ffffff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#000',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  periodSelector: {
    flexDirection: 'row',
    margin: 20,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: '#FFD700',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#999',
  },
  periodButtonTextActive: {
    color: '#000',
    fontWeight: '700',
  },
  metricsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  metricCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  revenueCard: {
    minHeight: 140,
    shadowColor: '#FFD700',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(26, 26, 26, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(46, 204, 113, 0.3)',
  },
  growthText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2ECC71',
    marginLeft: 4,
  },
  metricValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 4,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  metricLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
    textShadowColor: 'rgba(255, 255, 255, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  metricPeriod: {
    fontSize: 12,
    color: '#2a2a2a',
    fontWeight: '600',
    textShadowColor: 'rgba(255, 255, 255, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  secondaryMetrics: {
    flexDirection: 'row',
    gap: 16,
  },
  secondaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    minHeight: 120,
  },
  smallGrowth: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  secondaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  secondaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  occupancyText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  section: {
    margin: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (SCREEN_WIDTH - 64) / 2,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 20,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  chartValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  barContainer: {
    flex: 1,
    width: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 10,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 10,
    minHeight: 8,
  },
  chartDay: {
    fontSize: 10,
    color: '#999',
    marginTop: 8,
  },
  distributionContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 20,
  },
  distributionItem: {
    marginBottom: 20,
  },
  distributionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  distributionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  ticketType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  distributionPercentage: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFD700',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  ticketDetails: {
    fontSize: 12,
    color: '#999',
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    backgroundColor: '#2ECC71',
    borderRadius: 3,
    marginRight: 6,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2ECC71',
  },
  activityContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityMessage: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 2,
  },
  activityAmount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFD700',
  },
  activityTime: {
    fontSize: 11,
    color: '#999',
  },
});

export default EventDashboardScreen; 