import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  TextInput,
  Alert,
  Modal,
  FlatList,
  Switch,
  ActivityIndicator,
  Share,
  Clipboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing, typography } from '../theme';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  fetchEventAffiliates,
  fetchAffiliateStats,
  searchUsersForAffiliate,
  addAffiliate,
  updateAffiliate,
  removeAffiliate,
  generateAffiliateLink,
  fetchEventById,
  Affiliate,
  AffiliateStats,
  AffiliateSearchResult,
  CreateAffiliateDto,
  UpdateAffiliateDto,
  Event,
} from '../services/eventsService';

type EventAffiliatesScreenRouteProp = RouteProp<RootStackParamList, 'EventAffiliates'>;
type EventAffiliatesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EventAffiliates'>;

const EventAffiliatesScreen = () => {
  const navigation = useNavigation<EventAffiliatesScreenNavigationProp>();
  const route = useRoute<EventAffiliatesScreenRouteProp>();
  
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Add Affiliate Modal
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AffiliateSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Edit Affiliate Modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
  const [commissionType, setCommissionType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('PERCENTAGE');
  const [commissionValue, setCommissionValue] = useState('');
  
  const eventId = route.params.eventId;

  useEffect(() => {
    if (!eventId) {
      Alert.alert('Erro', 'ID do evento não fornecido');
      navigation.goBack();
      return;
    }
    
    loadData();
  }, [eventId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const [eventData, affiliatesData, statsData] = await Promise.all([
        fetchEventById(eventId),
        fetchEventAffiliates(eventId),
        fetchAffiliateStats(eventId)
      ]);

      setEvent(eventData);
      setAffiliates(affiliatesData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading affiliate data:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados dos afiliados');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const results = await searchUsersForAffiliate(eventId, query);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert('Erro', 'Não foi possível buscar usuários');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddAffiliate = async (user: AffiliateSearchResult) => {
    try {
      if (user.isAffiliate) {
        Alert.alert('Aviso', 'Este usuário já é um afiliado do evento');
        return;
      }

      const affiliateData: CreateAffiliateDto = {
        userId: user.id,
        eventId: eventId,
        commissionType: commissionType,
        commissionValue: parseFloat(commissionValue) || 5,
      };

      await addAffiliate(eventId, affiliateData);
      
      Alert.alert('Sucesso', 'Afiliado adicionado com sucesso!');
      setAddModalVisible(false);
      setSearchQuery('');
      setSearchResults([]);
      setCommissionValue('');
      await loadData();
    } catch (error) {
      console.error('Error adding affiliate:', error);
      Alert.alert('Erro', 'Não foi possível adicionar o afiliado');
    }
  };

  const handleEditAffiliate = async () => {
    if (!selectedAffiliate) return;

    try {
      const updates: UpdateAffiliateDto = {
        commissionType: commissionType,
        commissionValue: parseFloat(commissionValue),
      };

      await updateAffiliate(eventId, selectedAffiliate.id, updates);
      
      Alert.alert('Sucesso', 'Afiliado atualizado com sucesso!');
      setEditModalVisible(false);
      setSelectedAffiliate(null);
      setCommissionValue('');
      await loadData();
    } catch (error) {
      console.error('Error updating affiliate:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o afiliado');
    }
  };

  const handleRemoveAffiliate = (affiliate: Affiliate) => {
    Alert.alert(
      'Remover Afiliado',
      `Tem certeza que deseja remover ${affiliate.user.name} como afiliado?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeAffiliate(eventId, affiliate.id);
              Alert.alert('Sucesso', 'Afiliado removido com sucesso!');
              await loadData();
            } catch (error) {
              console.error('Error removing affiliate:', error);
              Alert.alert('Erro', 'Não foi possível remover o afiliado');
            }
          },
        },
      ]
    );
  };

  const handleToggleStatus = async (affiliate: Affiliate) => {
    try {
      const newStatus = affiliate.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      
      await updateAffiliate(eventId, affiliate.id, { status: newStatus });
      await loadData();
    } catch (error) {
      console.error('Error toggling affiliate status:', error);
      Alert.alert('Erro', 'Não foi possível alterar o status do afiliado');
    }
  };

  const handleGenerateLink = async (affiliate: Affiliate) => {
    try {
      const { link, shortLink } = await generateAffiliateLink(eventId, affiliate.affiliateCode);
      
      Alert.alert(
        'Link do Afiliado',
        `Link gerado para ${affiliate.user.name}:\n\n${shortLink}`,
        [
          { text: 'Copiar', onPress: () => Clipboard.setString(shortLink) },
          {
            text: 'Compartilhar',
            onPress: () => Share.share({
              message: `Link de afiliado para ${event?.title}: ${shortLink}`,
              url: shortLink,
            }),
          },
        ]
      );
    } catch (error) {
      console.error('Error generating affiliate link:', error);
      Alert.alert('Erro', 'Não foi possível gerar o link do afiliado');
    }
  };

  const openEditModal = (affiliate: Affiliate) => {
    setSelectedAffiliate(affiliate);
    setCommissionType(affiliate.commissionType);
    setCommissionValue(affiliate.commissionValue.toString());
    setEditModalVisible(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  };

  const formatCommission = (affiliate: Affiliate) => {
    if (affiliate.commissionType === 'PERCENTAGE') {
      return `${affiliate.commissionValue}%`;
    } else {
      return formatCurrency(affiliate.commissionValue);
    }
  };

  const renderAffiliateCard = ({ item: affiliate }: { item: Affiliate }) => (
    <View style={styles.affiliateCard}>
      <View style={styles.affiliateHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {affiliate.user.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        
        <View style={styles.affiliateInfo}>
          <Text style={styles.affiliateName}>{affiliate.user.name}</Text>
          <Text style={styles.affiliateEmail}>{affiliate.user.email}</Text>
          <Text style={styles.affiliateCode}>Código: {affiliate.affiliateCode}</Text>
        </View>
        
        <View style={styles.affiliateActions}>
          <Switch
            value={affiliate.status === 'ACTIVE'}
            onValueChange={() => handleToggleStatus(affiliate)}
            trackColor={{ false: '#767577', true: '#2ECC71' }}
            thumbColor={affiliate.status === 'ACTIVE' ? '#ffffff' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.affiliateStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{affiliate.totalSales}</Text>
          <Text style={styles.statLabel}>Vendas</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatCurrency(affiliate.totalCommission)}</Text>
          <Text style={styles.statLabel}>Comissão</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatCommission(affiliate)}</Text>
          <Text style={styles.statLabel}>Taxa</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{affiliate.conversionRate.toFixed(1)}%</Text>
          <Text style={styles.statLabel}>Conversão</Text>
        </View>
      </View>

      <View style={styles.affiliateButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => openEditModal(affiliate)}
        >
          <Ionicons name="create-outline" size={16} color="#3498DB" />
          <Text style={[styles.actionButtonText, { color: '#3498DB' }]}>Editar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.linkButton]}
          onPress={() => handleGenerateLink(affiliate)}
        >
          <Ionicons name="link-outline" size={16} color="#2ECC71" />
          <Text style={[styles.actionButtonText, { color: '#2ECC71' }]}>Link</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.removeButton]}
          onPress={() => handleRemoveAffiliate(affiliate)}
        >
          <Ionicons name="trash-outline" size={16} color="#E74C3C" />
          <Text style={[styles.actionButtonText, { color: '#E74C3C' }]}>Remover</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSearchResult = ({ item: user }: { item: AffiliateSearchResult }) => (
    <TouchableOpacity
      style={[styles.searchResultItem, user.isAffiliate && styles.disabledSearchResult]}
      onPress={() => !user.isAffiliate && handleAddAffiliate(user)}
      disabled={user.isAffiliate}
    >
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>
          {user.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      
      <View style={styles.searchResultInfo}>
        <Text style={styles.searchResultName}>{user.name}</Text>
        <Text style={styles.searchResultEmail}>{user.email}</Text>
        {user.isAffiliate && (
          <Text style={styles.alreadyAffiliateText}>Já é afiliado</Text>
        )}
      </View>
      
      {!user.isAffiliate && (
        <Ionicons name="add-circle-outline" size={24} color="#2ECC71" />
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Carregando afiliados...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Afiliados</Text>
          <Text style={styles.headerSubtitle}>{event?.title}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setAddModalVisible(true)}
        >
          <Ionicons name="add" size={24} color="#FFD700" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Stats Cards */}
        {stats && (
          <View style={styles.statsContainer}>
            <LinearGradient
              colors={['#2ECC71', '#27AE60']}
              style={styles.statCard}
            >
              <Text style={styles.statCardValue}>{stats.activeAffiliates}</Text>
              <Text style={styles.statCardLabel}>Afiliados Ativos</Text>
            </LinearGradient>
            
            <LinearGradient
              colors={['#3498DB', '#2980B9']}
              style={styles.statCard}
            >
              <Text style={styles.statCardValue}>{formatCurrency(stats.totalCommissionPaid)}</Text>
              <Text style={styles.statCardLabel}>Comissão Paga</Text>
            </LinearGradient>
            
            <LinearGradient
              colors={['#E67E22', '#D35400']}
              style={styles.statCard}
            >
              <Text style={styles.statCardValue}>{formatCurrency(stats.totalSalesFromAffiliates)}</Text>
              <Text style={styles.statCardLabel}>Vendas de Afiliados</Text>
            </LinearGradient>
          </View>
        )}

        {/* Affiliates List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Afiliados ({affiliates.length})
          </Text>
          
          {affiliates.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color="#666" />
              <Text style={styles.emptyText}>Nenhum afiliado cadastrado</Text>
              <Text style={styles.emptySubtext}>
                Adicione usuários como afiliados para venderem seus ingressos
              </Text>
            </View>
          ) : (
            <FlatList
              data={affiliates}
              renderItem={renderAffiliateCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </ScrollView>

      {/* Add Affiliate Modal */}
      <Modal
        visible={addModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setAddModalVisible(false)}>
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Adicionar Afiliado</Text>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.modalContent}>
            {/* Commission Configuration */}
            <Text style={styles.inputLabel}>Tipo de Comissão</Text>
            <View style={styles.commissionTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.commissionTypeButton,
                  commissionType === 'PERCENTAGE' && styles.commissionTypeButtonActive
                ]}
                onPress={() => setCommissionType('PERCENTAGE')}
              >
                <Text style={[
                  styles.commissionTypeText,
                  commissionType === 'PERCENTAGE' && styles.commissionTypeTextActive
                ]}>
                  Percentual (%)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.commissionTypeButton,
                  commissionType === 'FIXED_AMOUNT' && styles.commissionTypeButtonActive
                ]}
                onPress={() => setCommissionType('FIXED_AMOUNT')}
              >
                <Text style={[
                  styles.commissionTypeText,
                  commissionType === 'FIXED_AMOUNT' && styles.commissionTypeTextActive
                ]}>
                  Valor Fixo (R$)
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>
              {commissionType === 'PERCENTAGE' ? 'Percentual (%)' : 'Valor por Ingresso (R$)'}
            </Text>
            <TextInput
              style={styles.textInput}
              value={commissionValue}
              onChangeText={setCommissionValue}
              placeholder={commissionType === 'PERCENTAGE' ? 'Ex: 5' : 'Ex: 10.00'}
              keyboardType="numeric"
              placeholderTextColor="#666"
            />

            {/* Search Users */}
            <Text style={styles.inputLabel}>Buscar Usuário</Text>
            <TextInput
              style={styles.textInput}
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                searchUsers(text);
              }}
              placeholder="Digite nome ou email do usuário"
              placeholderTextColor="#666"
            />

            {isSearching && (
              <ActivityIndicator size="small" color="#FFD700" style={{ marginTop: 10 }} />
            )}

            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={(item) => item.id}
              style={styles.searchResultsList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* Edit Affiliate Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Editar Afiliado</Text>
            <TouchableOpacity onPress={handleEditAffiliate}>
              <Text style={styles.modalSaveText}>Salvar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            {selectedAffiliate && (
              <>
                <View style={styles.selectedAffiliateInfo}>
                  <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>
                      {selectedAffiliate.user.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.selectedAffiliateName}>
                      {selectedAffiliate.user.name}
                    </Text>
                    <Text style={styles.selectedAffiliateEmail}>
                      {selectedAffiliate.user.email}
                    </Text>
                  </View>
                </View>

                <Text style={styles.inputLabel}>Tipo de Comissão</Text>
                <View style={styles.commissionTypeContainer}>
                  <TouchableOpacity
                    style={[
                      styles.commissionTypeButton,
                      commissionType === 'PERCENTAGE' && styles.commissionTypeButtonActive
                    ]}
                    onPress={() => setCommissionType('PERCENTAGE')}
                  >
                    <Text style={[
                      styles.commissionTypeText,
                      commissionType === 'PERCENTAGE' && styles.commissionTypeTextActive
                    ]}>
                      Percentual (%)
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.commissionTypeButton,
                      commissionType === 'FIXED_AMOUNT' && styles.commissionTypeButtonActive
                    ]}
                    onPress={() => setCommissionType('FIXED_AMOUNT')}
                  >
                    <Text style={[
                      styles.commissionTypeText,
                      commissionType === 'FIXED_AMOUNT' && styles.commissionTypeTextActive
                    ]}>
                      Valor Fixo (R$)
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>
                  {commissionType === 'PERCENTAGE' ? 'Percentual (%)' : 'Valor por Ingresso (R$)'}
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={commissionValue}
                  onChangeText={setCommissionValue}
                  placeholder={commissionType === 'PERCENTAGE' ? 'Ex: 5' : 'Ex: 10.00'}
                  keyboardType="numeric"
                  placeholderTextColor="#666"
                />
              </>
            )}
          </View>
        </SafeAreaView>
      </Modal>
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
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statCardValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  statCardLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  affiliateCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  affiliateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  affiliateInfo: {
    flex: 1,
  },
  affiliateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  affiliateEmail: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  affiliateCode: {
    fontSize: 12,
    color: '#FFD700',
    marginTop: 4,
  },
  affiliateActions: {
    alignItems: 'center',
  },
  affiliateStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#333',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  affiliateButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  editButton: {
    borderColor: '#3498DB',
  },
  linkButton: {
    borderColor: '#2ECC71',
  },
  removeButton: {
    borderColor: '#E74C3C',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#999',
  },
  modalSaveText: {
    fontSize: 16,
    color: '#FFD700',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
    marginTop: 16,
  },
  commissionTypeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  commissionTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#333',
    alignItems: 'center',
  },
  commissionTypeButtonActive: {
    backgroundColor: '#FFD700',
  },
  commissionTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  commissionTypeTextActive: {
    color: '#1a1a1a',
  },
  textInput: {
    backgroundColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 16,
  },
  searchResultsList: {
    maxHeight: 300,
    marginTop: 16,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  disabledSearchResult: {
    opacity: 0.5,
  },
  searchResultInfo: {
    flex: 1,
    marginLeft: 12,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  searchResultEmail: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  alreadyAffiliateText: {
    fontSize: 12,
    color: '#E67E22',
    marginTop: 4,
  },
  selectedAffiliateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  selectedAffiliateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 12,
  },
  selectedAffiliateEmail: {
    fontSize: 14,
    color: '#999',
    marginLeft: 12,
    marginTop: 2,
  },
});

export default EventAffiliatesScreen; 