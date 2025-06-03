import React from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Card, Button } from '../components/ui';
import { colors, spacing, typography, borderRadius } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';

const ProfileScreen: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const userStats = {
    eventsAttended: 24,
    eventsCreated: 3,
    followers: 156,
    following: 89,
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
        // TODO: Navigate to Favorites
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
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Perfil</Text>
            <TouchableOpacity style={styles.editButton}>
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
                <TouchableOpacity style={styles.avatarEditButton}>
                  <Ionicons name="camera" size={16} color={colors.brand.primary} />
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
                      <TouchableOpacity style={styles.socialLink}>
                        <Ionicons name="logo-instagram" size={20} color={colors.brand.primary} />
                      </TouchableOpacity>
                    )}
                    {user.tiktok && (
                      <TouchableOpacity style={styles.socialLink}>
                        <Ionicons name="logo-tiktok" size={20} color={colors.brand.primary} />
                      </TouchableOpacity>
                    )}
                    {user.facebook && (
                      <TouchableOpacity style={styles.socialLink}>
                        <Ionicons name="logo-facebook" size={20} color={colors.brand.primary} />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{userStats.eventsAttended}</Text>
                <Text style={styles.statLabel}>Eventos</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{userStats.eventsCreated}</Text>
                <Text style={styles.statLabel}>Criados</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{userStats.followers}</Text>
                <Text style={styles.statLabel}>Seguidores</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{userStats.following}</Text>
                <Text style={styles.statLabel}>Seguindo</Text>
              </View>
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
            <Text style={styles.sectionTitle}>Atividade Recente</Text>
            <Card style={styles.activityCard}>
              {[
                { action: 'Participou do evento', event: 'Festival de Música 2024', time: '2 dias atrás' },
                { action: 'Curtiu o post de', event: 'Maria Santos', time: '3 dias atrás' },
                { action: 'Criou o evento', event: 'Meetup de Tecnologia', time: '1 semana atrás' },
              ].map((activity, index) => (
                <View key={index} style={styles.activityItem}>
                  <View style={styles.activityIcon}>
                    <Ionicons 
                      name="checkmark-circle" 
                      size={16} 
                      color={colors.brand.primary} 
                    />
                  </View>
                  <View style={styles.activityText}>
                    <Text style={styles.activityDescription}>
                      {activity.action} <Text style={styles.activityEvent}>{activity.event}</Text>
                    </Text>
                    <Text style={styles.activityTime}>{activity.time}</Text>
                  </View>
                </View>
              ))}
            </Card>
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
  activityCard: {
    marginHorizontal: spacing.lg,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  activityIcon: {
    marginRight: spacing.sm,
    marginTop: spacing.xs,
  },
  activityText: {
    flex: 1,
  },
  activityDescription: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
  },
  activityEvent: {
    color: colors.brand.primary,
    fontWeight: typography.fontWeights.medium,
  },
  activityTime: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.textTertiary,
    marginTop: spacing.xs,
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
    padding: spacing.xs,
  },
});

export default ProfileScreen; 