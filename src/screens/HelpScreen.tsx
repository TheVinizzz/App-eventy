import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../theme';
import { useNavigation } from '@react-navigation/native';

const faqCategories = [
  {
    title: 'Compra de Ingressos',
    icon: 'ticket',
    questions: [
      {
        question: 'Como comprar ingressos no Even.Ty?',
        answer: 'Para comprar ingressos, basta navegar pelos eventos disponíveis, selecionar o evento desejado, escolher o tipo de ingresso e quantidade, e finalizar o pagamento. Você receberá o ingresso por e-mail e poderá acessá-lo na área "Meus Ingressos".',
      },
      {
        question: 'Posso comprar ingressos para outras pessoas?',
        answer: 'Sim! Você pode comprar ingressos para outras pessoas. Durante o processo de compra, você poderá inserir os dados dos participantes. Cada ingresso será enviado para o e-mail do respectivo participante.',
      },
      {
        question: 'Existe limite de ingressos por pessoa?',
        answer: 'O limite de ingressos varia de acordo com cada evento e é definido pelo organizador. Essa informação estará disponível na página do evento antes da compra.',
      },
      {
        question: 'Como funciona a lista de espera?',
        answer: 'Quando um evento está esgotado, você pode entrar na lista de espera. Se houver cancelamentos ou liberação de novos ingressos, você será notificado por e-mail e terá prioridade na compra.',
      },
    ],
  },
  {
    title: 'Pagamentos',
    icon: 'card',
    questions: [
      {
        question: 'Quais formas de pagamento são aceitas?',
        answer: 'Aceitamos cartões de crédito (Visa, Mastercard, Elo), cartões de débito, PIX e boleto bancário. O PIX é processado instantaneamente, enquanto o boleto pode levar até 3 dias úteis para compensação.',
      },
      {
        question: 'É seguro fazer pagamentos no Even.Ty?',
        answer: 'Sim! Utilizamos criptografia SSL e trabalhamos com processadores de pagamento certificados PCI DSS. Seus dados financeiros são protegidos pelos mais altos padrões de segurança.',
      },
      {
        question: 'Posso parcelar minha compra?',
        answer: 'Sim, oferecemos parcelamento em até 12x sem juros no cartão de crédito para compras acima de R$ 100. As condições podem variar de acordo com o evento e organizador.',
      },
      {
        question: 'Como funciona o reembolso?',
        answer: 'Os reembolsos seguem a política específica de cada evento. Em caso de cancelamento pelo organizador, o reembolso é automático. Para cancelamentos pelo comprador, consulte a política do evento na página de detalhes.',
      },
    ],
  },
  {
    title: 'Segurança e Autenticidade',
    icon: 'shield-checkmark',
    questions: [
      {
        question: 'Como garantir que meu ingresso é autêntico?',
        answer: 'Todos os ingressos do Even.Ty possuem QR Code único e criptografado. Na entrada do evento, o código é validado em tempo real, garantindo autenticidade e evitando fraudes.',
      },
      {
        question: 'Posso transferir meu ingresso para outra pessoa?',
        answer: 'A transferência de ingressos depende da política do evento. Alguns eventos permitem transferência gratuita através da plataforma, outros podem cobrar taxa ou não permitir transferências.',
      },
      {
        question: 'O que fazer se perder meu ingresso?',
        answer: 'Não se preocupe! Seus ingressos ficam salvos na sua conta. Acesse "Meus Ingressos" para visualizar e baixar novamente. Você também pode apresentar um documento com foto na entrada do evento.',
      },
      {
        question: 'Como denunciar ingressos falsos?',
        answer: 'Se suspeitar de ingressos falsos sendo vendidos fora da plataforma, entre em contato conosco imediatamente. Temos uma equipe dedicada ao combate à pirataria e fraudes.',
      },
    ],
  },
  {
    title: 'Organizadores de Eventos',
    icon: 'people',
    questions: [
      {
        question: 'Como criar um evento no Even.Ty?',
        answer: 'Cadastre-se como organizador, acesse "Criar Evento" e preencha todas as informações necessárias: título, data, local, descrição, imagens e configure os lotes de ingressos. Após aprovação, seu evento estará disponível para venda.',
      },
      {
        question: 'Qual é a taxa cobrada pela plataforma?',
        answer: 'Cobramos uma taxa competitiva sobre cada ingresso vendido, que varia de acordo com o tipo de evento e volume de vendas. Entre em contato para conhecer nossos planos e condições especiais.',
      },
      {
        question: 'Como acompanhar as vendas do meu evento?',
        answer: 'Na área do organizador, você tem acesso a um dashboard completo com relatórios de vendas em tempo real, dados dos participantes, gráficos de performance e ferramentas de gestão.',
      },
      {
        question: 'Posso cancelar ou alterar meu evento?',
        answer: 'Sim, você pode alterar informações do evento até 24h antes da data. Para cancelamentos, entre em contato conosco para orientações sobre reembolsos e procedimentos necessários.',
      },
    ],
  },
];

const contactOptions = [
  {
    title: 'Chat Online',
    description: 'Atendimento instantâneo',
    icon: 'chatbubbles',
    available: '24/7',
    action: () => Alert.alert('Chat', 'Recurso em desenvolvimento'),
  },
  {
    title: 'E-mail',
    description: 'suporte@eventy.com',
    icon: 'mail',
    available: 'Resposta em até 2h',
    action: () => Linking.openURL('mailto:suporte@eventy.com'),
  },
  {
    title: 'WhatsApp',
    description: '(11) 99999-9999',
    icon: 'logo-whatsapp',
    available: 'Seg-Sex 9h-18h',
    action: () => Linking.openURL('https://wa.me/5511999999999'),
  },
  {
    title: 'Telefone',
    description: '(11) 3333-3333',
    icon: 'call',
    available: 'Seg-Sex 9h-18h',
    action: () => Linking.openURL('tel:+551133333333'),
  },
];

interface FAQItemProps {
  question: string;
  answer: string;
  isExpanded: boolean;
  onToggle: () => void;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer, isExpanded, onToggle }) => {
  return (
    <View style={styles.faqItem}>
      <TouchableOpacity style={styles.faqQuestion} onPress={onToggle} activeOpacity={0.8}>
        <Text style={styles.questionText}>{question}</Text>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.brand.primary}
        />
      </TouchableOpacity>
      
      {isExpanded && (
        <View style={styles.faqAnswer}>
          <Text style={styles.answerText}>{answer}</Text>
        </View>
      )}
    </View>
  );
};

const HelpScreen: React.FC = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const toggleExpanded = (itemKey: string) => {
    setExpandedItems(prev =>
      prev.includes(itemKey)
        ? prev.filter(key => key !== itemKey)
        : [...prev, itemKey]
    );
  };

  const filteredCategories = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(
      q =>
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category =>
    selectedCategory ? category.title === selectedCategory : true
  ).filter(category => category.questions.length > 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color={colors.brand.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ajuda & FAQ</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={[colors.brand.primary, colors.brand.secondary]}
            style={styles.logoContainer}
          >
            <Ionicons name="help-circle" size={40} color={colors.brand.background} />
          </LinearGradient>
          
          <Text style={styles.title}>Como podemos ajudar?</Text>
          <Text style={styles.subtitle}>
            Encontre respostas para as principais dúvidas sobre nossa plataforma
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={colors.brand.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por perguntas..."
              placeholderTextColor={colors.brand.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.brand.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category Filter */}
        <View style={styles.categorySection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryContainer}>
            <TouchableOpacity
              style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={[styles.categoryText, !selectedCategory && styles.categoryTextActive]}>
                Todas
              </Text>
            </TouchableOpacity>
            {faqCategories.map((category) => (
              <TouchableOpacity
                key={category.title}
                style={[styles.categoryChip, selectedCategory === category.title && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(category.title)}
              >
                <Ionicons
                  name={category.icon as any}
                  size={16}
                  color={selectedCategory === category.title ? colors.brand.background : colors.brand.textSecondary}
                />
                <Text style={[styles.categoryText, selectedCategory === category.title && styles.categoryTextActive]}>
                  {category.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* FAQ Categories */}
        <View style={styles.faqSection}>
          {filteredCategories.map((category) => (
            <View key={category.title} style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryIconContainer}>
                  <Ionicons name={category.icon as any} size={24} color={colors.brand.primary} />
                </View>
                <Text style={styles.categoryTitle}>{category.title}</Text>
              </View>
              
              <View style={styles.questionsContainer}>
                {category.questions.map((faq, index) => {
                  const itemKey = `${category.title}-${index}`;
                  return (
                    <FAQItem
                      key={itemKey}
                      question={faq.question}
                      answer={faq.answer}
                      isExpanded={expandedItems.includes(itemKey)}
                      onToggle={() => toggleExpanded(itemKey)}
                    />
                  );
                })}
              </View>
            </View>
          ))}
        </View>

        {/* Contact Support */}
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Ainda precisa de ajuda?</Text>
          <Text style={styles.contactDescription}>
            Nossa equipe de suporte está sempre pronta para atendê-lo
          </Text>
          
          <View style={styles.contactGrid}>
            {contactOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.contactCard}
                onPress={option.action}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['rgba(255, 215, 0, 0.1)', 'transparent']}
                  style={styles.contactCardGradient}
                >
                  <View style={styles.contactIconContainer}>
                    <Ionicons name={option.icon as any} size={24} color={colors.brand.primary} />
                  </View>
                  <Text style={styles.contactTitle}>{option.title}</Text>
                  <Text style={styles.contactSubtitle}>{option.description}</Text>
                  <Text style={styles.contactAvailable}>{option.available}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Dicas Rápidas</Text>
          
          <View style={styles.tipCard}>
            <View style={styles.tipIconContainer}>
              <Ionicons name="bulb" size={20} color={colors.brand.primary} />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Mantenha seus dados atualizados</Text>
              <Text style={styles.tipDescription}>
                Verifique regularmente se seus dados de contato estão corretos para receber todas as informações importantes
              </Text>
            </View>
          </View>

          <View style={styles.tipCard}>
            <View style={styles.tipIconContainer}>
              <Ionicons name="shield-checkmark" size={20} color={colors.brand.primary} />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Compre apenas em fontes oficiais</Text>
              <Text style={styles.tipDescription}>
                Para sua segurança, adquira ingressos apenas através do Even.Ty ou organizadores oficiais
              </Text>
            </View>
          </View>

          <View style={styles.tipCard}>
            <View style={styles.tipIconContainer}>
              <Ionicons name="notifications" size={20} color={colors.brand.primary} />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Ative as notificações</Text>
              <Text style={styles.tipDescription}>
                Receba lembretes importantes sobre seus eventos e novidades da plataforma
              </Text>
            </View>
          </View>
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
  searchSection: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.opacity.cardBorder,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSizes.md,
    color: colors.brand.textPrimary,
  },
  categorySection: {
    marginBottom: spacing.xl,
  },
  categoryContainer: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.darkGray,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.opacity.cardBorder,
  },
  categoryChipActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  categoryText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    fontWeight: typography.fontWeights.semibold,
  },
  categoryTextActive: {
    color: colors.brand.background,
  },
  faqSection: {
    paddingHorizontal: spacing.xl,
    gap: spacing.xl,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
  },
  questionsContainer: {
    gap: spacing.sm,
  },
  faqItem: {
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.opacity.cardBorder,
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  questionText: {
    flex: 1,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textPrimary,
    marginRight: spacing.md,
  },
  faqAnswer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.opacity.cardBorder,
  },
  answerText: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    lineHeight: typography.fontSizes.md * 1.6,
  },
  contactSection: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  contactDescription: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: typography.fontSizes.md * 1.5,
  },
  contactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.lg,
    width: '100%',
  },
  contactCard: {
    width: '48%',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  contactCardGradient: {
    padding: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.brand.darkGray,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  contactIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  contactTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  contactSubtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
    fontWeight: typography.fontWeights.semibold,
  },
  contactAvailable: {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.textSecondary,
    textAlign: 'center',
  },
  tipsSection: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    gap: spacing.md,
  },
  tipIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textPrimary,
    marginBottom: spacing.sm,
  },
  tipDescription: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    lineHeight: typography.fontSizes.sm * 1.4,
  },
  bottomSpacing: {
    height: spacing.xxxl,
  },
});

export default HelpScreen; 