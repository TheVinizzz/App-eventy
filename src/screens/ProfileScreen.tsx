import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Card, Button } from '../components/ui';
import { colors, spacing, typography, borderRadius } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { getUserCompleteStats, UserStats } from '../services/userStatsService';
import { getUserActivities, UserActivity, getActivityIcon, getActivityColor } from '../services/userActivityService';
import { ActivitySpinner } from '../components/ui/ActivitySpinner';

const ProfileScreen: React.FC = () => {
  const { user, logout, isAdmin, updateProfileImage } = useAuth();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  
  const [userStats, setUserStats] = useState<UserStats>({
    eventsAttended: 0,
    eventsCreated: 0,
    followers: 0,
    following: 0,
    totalTickets: 0,
    activeTickets: 0,
    usedTickets: 0,
    totalSpent: 0,
    upcomingEvents: 0,
    pastEvents: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  
  // Estados para controlar primeira carga
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Carregar estatísticas reais do usuário
  useEffect(() => {
    loadUserStats();
    loadUserActivities();
  }, []);

  // Atualizar estatísticas quando a tela receber foco
  useFocusEffect(
    React.useCallback(() => {
      // Na primeira vez mostra loading, depois carrega disfarçadamente
      const shouldShowLoading = isInitialLoad;
      loadUserStats(!hasLoadedOnce);
      
      // Carrega atividades disfarçadamente apenas se não for primeira vez
      if (hasLoadedOnce) {
        loadUserActivities(false);
      }
    }, [hasLoadedOnce, isInitialLoad])
  );

  const loadUserStats = async (showLoading = true) => {
    try {
      // Só mostra loading na primeira vez ou quando explicitamente solicitado
      if (showLoading && isInitialLoad) {
        setIsLoadingStats(true);
      }
      
      console.log('📊 ProfileScreen: Loading user stats...');
      
      const stats = await getUserCompleteStats();
      setUserStats(stats);
      
      // Marca que já carregou pelo menos uma vez
      if (!hasLoadedOnce) {
        setHasLoadedOnce(true);
        setIsInitialLoad(false);
      }
      
      console.log('✅ ProfileScreen: User stats loaded successfully:', stats);
    } catch (error) {
      console.error('❌ ProfileScreen: Error loading user stats:', error);
      // Manter dados padrão em caso de erro
    } finally {
      if (showLoading && isInitialLoad) {
        setIsLoadingStats(false);
      }
    }
  };

  const loadUserActivities = async (showLoading = true) => {
    try {
      // Só mostra loading na primeira vez ou quando explicitamente solicitado
      if (showLoading && isInitialLoad) {
        setIsLoadingActivities(true);
      }
      
      console.log('🎯 ProfileScreen: Loading user activities...');
      
      const activities = await getUserActivities(5); // Limitar a 5 atividades na tela de perfil
      setUserActivities(activities);
      
      console.log('✅ ProfileScreen: User activities loaded successfully:', activities.length);
    } catch (error) {
      console.error('❌ ProfileScreen: Error loading user activities:', error);
      // Manter lista vazia em caso de erro
    } finally {
      if (showLoading && isInitialLoad) {
        setIsLoadingActivities(false);
      }
    }
  };

  const menuItems = [
    { icon: 'calendar-outline', title: 'Meus Eventos', subtitle: 'Eventos que criei' },
    { icon: 'heart-outline', title: 'Favoritos', subtitle: 'Eventos salvos' },
    { icon: 'settings-outline', title: 'Configurações', subtitle: 'Preferências do app' },
    { icon: 'help-circle-outline', title: 'Ajuda', subtitle: 'Suporte e FAQ' },
    { icon: 'information-circle-outline', title: 'Sobre', subtitle: 'Informações do app' },
  ];

  // Add admin menu item if user is admin
  if (isAdmin) {
    menuItems.unshift({
      icon: 'shield-checkmark-outline',
      title: 'Painel Admin',
      subtitle: 'Gerenciar plataforma'
    });
  }

  const handleLogout = () => {
    Alert.alert(
      'Sair da Conta',
      'Tem certeza que deseja sair da sua conta?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível sair da conta. Tente novamente.');
            }
          },
        },
      ]
    );
  };

  const handleMenuItemPress = (title: string) => {
    switch (title) {
      case 'Meus Eventos':
        navigation.navigate('MyEvents');
        break;
      case 'Favoritos':
        navigation.navigate('Favorites');
        break;
      case 'Configurações':
        // TODO: Navigate to Settings
        break;
      case 'Ajuda':
        navigation.navigate('Help');
        break;
      case 'Sobre':
        navigation.navigate('About');
        break;
      case 'Painel Admin':
        // TODO: Navigate to Admin Panel
        break;
      default:
        break;
    }
  };

  const handleImagePicker = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert(
          'Permissão Necessária',
          'Precisamos de permissão para acessar suas fotos.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Configurações', onPress: () => ImagePicker.requestMediaLibraryPermissionsAsync() }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsImageLoading(true);
        console.log('📸 ProfileScreen: Image selected, starting upload...');
        
        try {
          await updateProfileImage(result.assets[0].uri);
          
          console.log('✅ ProfileScreen: Profile image updated successfully');
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          
        } catch (error: any) {
          console.error('❌ ProfileScreen: Error uploading image:', error);
          Alert.alert(
            'Erro no Upload', 
            `Não foi possível atualizar a foto:\n${error.message || 'Erro desconhecido'}`
          );
        } finally {
          setIsImageLoading(false);
        }
      }
    } catch (error) {
      console.error('❌ ProfileScreen: Error picking image:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.brand.background} />
      
      <LinearGradient
        colors={[colors.brand.background, colors.brand.darkGray]}
        style={styles.gradient}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={false} // Nunca mostra loading no pull-to-refresh
              onRefresh={async () => {
                // Força refresh com loading disfarçado após primeira carga
                await Promise.all([
                  loadUserStats(false), 
                  loadUserActivities(false)
                ]);
              }}
              colors={[colors.brand.primary]}
              tintColor={colors.brand.primary}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Perfil</Text>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Ionicons 
                name="create-outline" 
                size={24} 
                color={colors.brand.primary} 
              />
            </TouchableOpacity>
          </View>

          {/* Profile Info */}
          <Card style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  {user?.profileImage ? (
                    <Image 
                      source={{ uri: user.profileImage }} 
                      style={styles.avatarImage}
                    />
                  ) : (
                    <Text style={styles.avatarText}>
                      {user?.name ? getInitials(user.name) : 'U'}
                    </Text>
                  )}
                </View>
                <TouchableOpacity 
                  style={styles.avatarEditButton}
                  onPress={handleImagePicker}
                  disabled={isImageLoading}
                >
                  {isImageLoading ? (
                    <ActivityIndicator size="small" color={colors.brand.primary} />
                  ) : (
                    <Ionicons name="camera" size={16} color={colors.brand.primary} />
                  )}
                </TouchableOpacity>
              </View>
              
              <View style={styles.profileInfo}>
                <View style={styles.userNameContainer}>
                  <Text style={styles.userName}>{user?.name || 'Usuário'}</Text>
                  {isAdmin && (
                    <View style={styles.adminBadge}>
                      <Ionicons name="shield-checkmark" size={16} color={colors.brand.background} />
                      <Text style={styles.adminBadgeText}>Admin</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.userEmail}>{user?.email || 'email@exemplo.com'}</Text>
                <Text style={styles.userBio}>
                  {user?.bio || 'Apaixonado por eventos incríveis! 🎉'}
                </Text>
                
                {/* Social Links */}
                {(user?.instagram || user?.tiktok || user?.facebook) && (
                  <View style={styles.socialLinks}>
                    {user.instagram && (
                      <TouchableOpacity 
                        style={styles.socialLink}
                        onPress={() => {
                          // Aqui você implementaria a abertura do link
                          console.log('Opening Instagram:', user.instagram);
                        }}
                      >
                        <Ionicons name="logo-instagram" size={20} color={colors.brand.primary} />
                        <Text style={styles.socialLinkText}>@{user.instagram}</Text>
                      </TouchableOpacity>
                    )}
                    {user.tiktok && (
                      <TouchableOpacity 
                        style={styles.socialLink}
                        onPress={() => {
                          // Aqui você implementaria a abertura do link
                          console.log('Opening TikTok:', user.tiktok);
                        }}
                      >
                        <Ionicons name="logo-tiktok" size={20} color={colors.brand.primary} />
                        <Text style={styles.socialLinkText}>@{user.tiktok}</Text>
                      </TouchableOpacity>
                    )}
                    {user.facebook && (
                      <TouchableOpacity 
                        style={styles.socialLink}
                        onPress={() => {
                          // Aqui você implementaria a abertura do link
                          console.log('Opening Facebook:', user.facebook);
                        }}
                      >
                        <Ionicons name="logo-facebook" size={20} color={colors.brand.primary} />
                        <Text style={styles.socialLinkText}>{user.facebook}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
              {(isLoadingStats && isInitialLoad) ? (
                <View style={styles.statsLoading}>
                  <ActivityIndicator size="small" color={colors.brand.primary} />
                  <Text style={styles.statsLoadingText}>Carregando estatísticas...</Text>
                </View>
              ) : (
                <>
                  <TouchableOpacity style={styles.statItem}>
                    <Text style={styles.statNumber}>{userStats.eventsAttended}</Text>
                    <Text style={styles.statLabel}>Eventos</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.statItem}>
                    <Text style={styles.statNumber}>{userStats.eventsCreated}</Text>
                    <Text style={styles.statLabel}>Criados</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.statItem}>
                    <Text style={styles.statNumber}>{userStats.followers}</Text>
                    <Text style={styles.statLabel}>Seguidores</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.statItem}>
                    <Text style={styles.statNumber}>{userStats.following}</Text>
                    <Text style={styles.statLabel}>Seguindo</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </Card>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ações Rápidas</Text>
            <View style={styles.quickActions}>
              <Button
                title="Criar Evento"
                onPress={() => navigation.navigate('CreateEvent')}
                variant="primary"
                style={styles.quickActionButton}
              />
              <Button
                title="Compartilhar Perfil"
                onPress={() => {}}
                variant="outline"
                style={styles.quickActionButton}
              />
            </View>
          </View>

          {/* Menu Items */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Menu</Text>
            {menuItems.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.menuItem}
                onPress={() => handleMenuItemPress(item.title)}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuIcon}>
                    <Ionicons 
                      name={item.icon as any} 
                      size={24} 
                      color={colors.brand.primary} 
                    />
                  </View>
                  <View style={styles.menuText}>
                    <Text style={styles.menuTitle}>{item.title}</Text>
                    <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                  </View>
                </View>
                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color={colors.brand.textSecondary} 
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Recent Activity */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Atividade Recente</Text>
            </View>
            
            {(isLoadingActivities && isInitialLoad) ? (
              <Card style={styles.activityCard}>
                <ActivitySpinner 
                  size="medium" 
                  message="Carregando suas atividades..."
                  showMessage={true}
                  color={colors.brand.primary}
                />
              </Card>
            ) : (
              <Card style={styles.activityCard}>
                {userActivities.length > 0 ? (
                userActivities.map((activity, index) => (
                  <TouchableOpacity 
                    key={activity.id} 
                    style={[
                      styles.activityItem,
                      index === userActivities.length - 1 && styles.activityItemLast
                    ]}
                    activeOpacity={0.7}
                    onPress={() => {
                      // TODO: Navegar para detalhes da atividade se aplicável
                      console.log('Activity pressed:', activity);
                    }}
                  >
                    <View style={[
                      styles.activityIconContainer,
                      { backgroundColor: getActivityColor(activity.type) + '20' }
                    ]}>
                      <Ionicons 
                        name={getActivityIcon(activity.type) as any}
                        size={16} 
                        color={getActivityColor(activity.type)} 
                      />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityDescription}>
                        {activity.action}{' '}
                        {activity.target && (
                          <Text style={styles.activityTarget}>{activity.target.title}</Text>
                        )}
                      </Text>
                      {activity.metadata?.amount && (
                        <Text style={styles.activityAmount}>
                          R$ {activity.metadata.amount.toFixed(2)}
                        </Text>
                      )}
                      <Text style={styles.activityTime}>{activity.timeAgo}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyActivity}>
                  <Ionicons 
                    name="time-outline" 
                    size={32} 
                    color={colors.brand.textTertiary} 
                  />
                  <Text style={styles.emptyActivityText}>
                    Nenhuma atividade recente
                  </Text>
                  <Text style={styles.emptyActivitySubtext}>
                    Suas atividades aparecerão aqui
                  </Text>
                </View>
              )}
              </Card>
            )}
          </View>

          {/* Logout */}
          <View style={styles.section}>
            <Button
              title="Sair da Conta"
              onPress={handleLogout}
              variant="outline"
              style={StyleSheet.flatten([styles.logoutButton, { borderColor: colors.brand.error }])}
              textStyle={{ color: colors.brand.error }}
            />
          </View>
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
  },
  editButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.brand.darkGray,
  },
  profileCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.brand.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.brand.primary,
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.brand.darkGray,
    borderWidth: 2,
    borderColor: colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    alignItems: 'center',
  },
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.xs,
  },
  adminBadge: {
    backgroundColor: colors.brand.primary,
    borderRadius: 12,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    marginLeft: spacing.xs,
  },
  adminBadgeText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    color: colors.brand.background,
  },
  userEmail: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    marginBottom: spacing.sm,
  },
  userBio: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    textAlign: 'center',
    lineHeight: typography.lineHeights.relaxed * typography.fontSizes.sm,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.opacity.cardBorder,
  },
  statsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  statsLoadingText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    marginLeft: spacing.sm,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.primary,
  },
  statLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.textSecondary,
    marginTop: spacing.xs,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
  },
  quickActionButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.opacity.cardBorder,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brand.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.medium,
    color: colors.brand.textPrimary,
  },
  menuSubtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    marginTop: spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  activityCard: {
    marginHorizontal: spacing.lg,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.opacity.cardBorder,
  },
  activityItemLast: {
    borderBottomWidth: 0,
  },
  activityIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  activityIcon: {
    marginRight: spacing.sm,
    marginTop: spacing.xs,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    flex: 1,
  },
  activityDescription: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    lineHeight: 20,
  },
  activityTarget: {
    color: colors.brand.primary,
    fontWeight: typography.fontWeights.medium,
  },
  activityEvent: {
    color: colors.brand.primary,
    fontWeight: typography.fontWeights.medium,
  },
  activityAmount: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.primary,
    fontWeight: typography.fontWeights.semibold,
    marginTop: spacing.xs,
  },
  activityTime: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.textTertiary,
    marginTop: spacing.xs,
  },
  emptyActivity: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyActivityText: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  emptyActivitySubtext: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textTertiary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  logoutButton: {
    marginHorizontal: spacing.lg,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  avatarText: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
  },
  socialLinks: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  socialLink: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  socialLinkText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    marginLeft: spacing.xs,
  },
});

export default ProfileScreen; 