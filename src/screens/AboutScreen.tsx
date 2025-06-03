import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../theme';
import { useNavigation } from '@react-navigation/native';

const { width: screenWidth } = Dimensions.get('window');

const stats = [
  {
    number: '50K+',
    label: 'Eventos Realizados',
    subtitle: 'Eventos de sucesso',
    icon: 'rocket',
  },
  {
    number: '1M+',
    label: 'Usuários Ativos',
    subtitle: 'Pessoas conectadas',
    icon: 'people',
  },
  {
    number: '10M+',
    label: 'Ingressos Vendidos',
    subtitle: 'Experiências criadas',
    icon: 'trending-up',
  },
  {
    number: '98%',
    label: 'Satisfação',
    subtitle: 'Clientes satisfeitos',
    icon: 'star',
  },
];

const values = [
  {
    title: 'Inovação',
    description: 'Sempre buscamos novas tecnologias e soluções para melhorar a experiência dos nossos usuários.',
    icon: 'bulb',
  },
  {
    title: 'Confiança',
    description: 'Construímos relacionamentos duradouros baseados na transparência e segurança.',
    icon: 'shield-checkmark',
  },
  {
    title: 'Conexão',
    description: 'Acreditamos no poder dos eventos para conectar pessoas e criar experiências memoráveis.',
    icon: 'people-circle',
  },
  {
    title: 'Excelência',
    description: 'Comprometidos em entregar sempre a melhor qualidade em nossos produtos e serviços.',
    icon: 'trophy',
  },
];

const AboutScreen: React.FC = () => {
  const navigation = useNavigation();

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color={colors.brand.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sobre o Even.Ty</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={[colors.brand.primary, colors.brand.secondary]}
            style={styles.logoContainer}
          >
            <Ionicons name="rocket" size={40} color={colors.brand.background} />
          </LinearGradient>
          
          <Text style={styles.title}>Sobre o Even.Ty</Text>
          <Text style={styles.subtitle}>
            Somos uma plataforma inovadora que conecta pessoas através de eventos incríveis. 
            Nossa missão é democratizar o acesso a experiências únicas e memoráveis.
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Nossos Números</Text>
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <LinearGradient
                  colors={['rgba(255, 215, 0, 0.1)', 'transparent']}
                  style={styles.statGradient}
                >
                  <View style={styles.statIconContainer}>
                    <Ionicons name={stat.icon as any} size={24} color={colors.brand.primary} />
                  </View>
                  <Text style={styles.statNumber}>{stat.number}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                  <Text style={styles.statSubtitle}>{stat.subtitle}</Text>
                </LinearGradient>
              </View>
            ))}
          </View>
        </View>

        {/* Mission, Vision, Purpose */}
        <View style={styles.missionSection}>
          <View style={styles.missionCard}>
            <View style={styles.missionIconContainer}>
              <Ionicons name="rocket" size={32} color={colors.brand.primary} />
            </View>
            <Text style={styles.missionTitle}>Nossa Missão</Text>
            <Text style={styles.missionDescription}>
              Democratizar o acesso a eventos e experiências únicas, conectando pessoas 
              através de uma plataforma segura, inovadora e fácil de usar.
            </Text>
          </View>

          <View style={styles.missionCard}>
            <View style={styles.missionIconContainer}>
              <Ionicons name="eye" size={32} color={colors.brand.primary} />
            </View>
            <Text style={styles.missionTitle}>Nossa Visão</Text>
            <Text style={styles.missionDescription}>
              Ser a principal plataforma de eventos da América Latina, reconhecida pela 
              excelência, inovação e impacto positivo na vida das pessoas.
            </Text>
          </View>

          <View style={styles.missionCard}>
            <View style={styles.missionIconContainer}>
              <Ionicons name="heart" size={32} color={colors.brand.primary} />
            </View>
            <Text style={styles.missionTitle}>Nosso Propósito</Text>
            <Text style={styles.missionDescription}>
              Criar momentos especiais e conexões genuínas, transformando eventos em 
              experiências inesquecíveis que enriquecem a vida das pessoas.
            </Text>
          </View>
        </View>

        {/* Values */}
        <View style={styles.valuesSection}>
          <Text style={styles.sectionTitle}>Nossos Valores</Text>
          <Text style={styles.sectionSubtitle}>
            Os princípios que guiam nossas decisões e ações
          </Text>
          
          <View style={styles.valuesGrid}>
            {values.map((value, index) => (
              <View key={index} style={styles.valueCard}>
                <View style={styles.valueIconContainer}>
                  <Ionicons name={value.icon as any} size={24} color={colors.brand.primary} />
                </View>
                <Text style={styles.valueTitle}>{value.title}</Text>
                <Text style={styles.valueDescription}>{value.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Company Info */}
        <View style={styles.companySection}>
          <Text style={styles.sectionTitle}>Nossa História</Text>
          
          <View style={styles.timelineContainer}>
            <View style={styles.timelineItem}>
              <View style={styles.timelineYear}>
                <Text style={styles.yearText}>2020</Text>
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Fundação</Text>
                <Text style={styles.timelineDescription}>
                  Even.Ty é criado com a missão de democratizar o acesso a eventos
                </Text>
              </View>
            </View>

            <View style={styles.timelineItem}>
              <View style={styles.timelineYear}>
                <Text style={styles.yearText}>2021</Text>
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Primeiro Milhão</Text>
                <Text style={styles.timelineDescription}>
                  Alcançamos 1 milhão de ingressos vendidos em nossa plataforma
                </Text>
              </View>
            </View>

            <View style={styles.timelineItem}>
              <View style={styles.timelineYear}>
                <Text style={styles.yearText}>2022</Text>
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Expansão Nacional</Text>
                <Text style={styles.timelineDescription}>
                  Expandimos para todas as capitais brasileiras
                </Text>
              </View>
            </View>

            <View style={styles.timelineItem}>
              <View style={styles.timelineYear}>
                <Text style={styles.yearText}>2023</Text>
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Tecnologia Avançada</Text>
                <Text style={styles.timelineDescription}>
                  Lançamos recursos de IA para recomendação de eventos
                </Text>
              </View>
            </View>

            <View style={styles.timelineItem}>
              <View style={styles.timelineYear}>
                <Text style={styles.yearText}>2024</Text>
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Liderança de Mercado</Text>
                <Text style={styles.timelineDescription}>
                  Nos tornamos a maior plataforma de eventos do Brasil
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Contact Section */}
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Entre em Contato</Text>
          <Text style={styles.contactDescription}>
            Tem alguma dúvida ou sugestão? Nossa equipe está sempre pronta para ajudar!
          </Text>
          
          <TouchableOpacity style={styles.contactButton}>
            <LinearGradient
              colors={[colors.brand.primary, colors.brand.secondary]}
              style={styles.contactGradient}
            >
              <Ionicons name="mail" size={20} color={colors.brand.background} />
              <Text style={styles.contactButtonText}>contato@eventy.com</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.opacity.cardBorder,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brand.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    elevation: 8,
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  title: {
    fontSize: typography.fontSizes.xxxl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSizes.lg,
    color: colors.brand.textSecondary,
    textAlign: 'center',
    lineHeight: typography.fontSizes.lg * 1.6,
  },
  statsSection: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  statCard: {
    width: (screenWidth - spacing.xl * 2 - spacing.lg) / 2,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  statGradient: {
    padding: spacing.xl,
    alignItems: 'center',
    backgroundColor: colors.brand.darkGray,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  statNumber: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.sm,
  },
  statLabel: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  statSubtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.textSecondary,
    textAlign: 'center',
  },
  missionSection: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    gap: spacing.xl,
  },
  missionCard: {
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  missionIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  missionTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  missionDescription: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    textAlign: 'center',
    lineHeight: typography.fontSizes.md * 1.6,
  },
  valuesSection: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  valuesGrid: {
    gap: spacing.lg,
  },
  valueCard: {
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  valueIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  valueTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.md,
  },
  valueDescription: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    lineHeight: typography.fontSizes.md * 1.5,
  },
  companySection: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  timelineContainer: {
    gap: spacing.xl,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
  },
  timelineYear: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  yearText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.background,
  },
  timelineContent: {
    flex: 1,
    paddingTop: spacing.sm,
  },
  timelineTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.sm,
  },
  timelineDescription: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    lineHeight: typography.fontSizes.md * 1.5,
  },
  contactSection: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  contactDescription: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: typography.fontSizes.md * 1.5,
  },
  contactButton: {
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  contactGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  contactButtonText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.background,
  },
  bottomSpacing: {
    height: spacing.xxxl,
  },
});

export default AboutScreen; 