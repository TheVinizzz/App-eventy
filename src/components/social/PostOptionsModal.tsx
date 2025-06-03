import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { Post } from '../../services/socialService';

const { width, height } = Dimensions.get('window');

interface PostOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  post: Post;
  currentUserId: string;
  onDeletePost?: (postId: string) => void;
  onReportPost?: (postId: string, reason: string) => Promise<{ success: boolean; message?: string } | void>;
}

const PostOptionsModal: React.FC<PostOptionsModalProps> = ({
  visible,
  onClose,
  post,
  currentUserId,
  onDeletePost,
  onReportPost,
}) => {
  const [showReportModal, setShowReportModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const isOwnPost = post.author.id === currentUserId;

  const handleDeletePost = () => {
    Alert.alert(
      'Deletar Post',
      'Tem certeza que deseja deletar este post? Esta ação não pode ser desfeita.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: () => {
            onClose();
            onDeletePost?.(post.id);
          },
        },
      ]
    );
  };

  const handleReportPost = () => {
    onClose();
    setShowReportModal(true);
  };

  const submitReport = async (reason: string) => {
    try {
      setSubmitting(true);
      
      // Call the improved report function
      const result = await onReportPost?.(post.id, reason);
      
      setShowReportModal(false);
      
      // Show success message based on server response or default
      const successMessage = result?.message || 'Sua denúncia foi enviada com sucesso. Nossa equipe irá analisar o conteúdo.';
      
      Alert.alert(
        'Denúncia Enviada',
        successMessage,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Error submitting report:', error);
      
      // Show specific error message
      const errorMessage = error?.message || 'Não foi possível enviar a denúncia. Tente novamente.';
      
      Alert.alert(
        'Erro',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  const reportReasons = [
    { id: 'spam', label: 'Spam ou conteúdo repetitivo', icon: 'warning-outline' },
    { id: 'inappropriate', label: 'Conteúdo inapropriado', icon: 'alert-circle-outline' },
    { id: 'harassment', label: 'Assédio ou bullying', icon: 'person-remove-outline' },
    { id: 'fake', label: 'Informações falsas', icon: 'ban-outline' },
    { id: 'copyright', label: 'Violação de direitos autorais', icon: 'document-text-outline' },
    { id: 'other', label: 'Outro motivo', icon: 'ellipsis-horizontal-outline' },
  ];

  if (!visible && !showReportModal) return null;

  return (
    <>
      {/* Options Modal */}
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={onClose}
      >
        <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.9)" />
        
        <View style={styles.overlay}>
          <TouchableOpacity 
            style={styles.backdrop} 
            onPress={onClose}
            activeOpacity={1}
          />
          
          <View style={styles.modalContainer}>
            {/* Handle */}
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>
            
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Opções</Text>
            </View>

            {/* Options */}
            <View style={styles.optionsContainer}>
              {isOwnPost ? (
                <TouchableOpacity
                  style={[styles.optionButton, styles.deleteButton]}
                  onPress={handleDeletePost}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionIconContainer}>
                    <Ionicons name="trash-outline" size={22} color={colors.brand.error} />
                  </View>
                  <Text style={[styles.optionText, styles.deleteText]}>Deletar Post</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.brand.error + '60'} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={handleReportPost}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionIconContainer}>
                    <Ionicons name="flag-outline" size={22} color={colors.brand.primary} />
                  </View>
                  <Text style={styles.optionText}>Denunciar Post</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.brand.textSecondary} />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.optionButton, styles.cancelButton]}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <View style={styles.optionIconContainer}>
                  <Ionicons name="close-outline" size={22} color={colors.brand.textSecondary} />
                </View>
                <Text style={[styles.optionText, styles.cancelText]}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Report Modal */}
      <Modal
        visible={showReportModal}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setShowReportModal(false)}
      >
        <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.9)" />
        
        <View style={styles.overlay}>
          <TouchableOpacity 
            style={styles.backdrop} 
            onPress={() => setShowReportModal(false)}
            activeOpacity={1}
          />
          
          <View style={styles.reportModalContainer}>
            {/* Handle */}
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>
            
            {/* Header */}
            <View style={styles.reportHeader}>
              <TouchableOpacity
                onPress={() => setShowReportModal(false)}
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={24} color={colors.brand.primary} />
              </TouchableOpacity>
              <Text style={styles.title}>Denunciar</Text>
              <View style={styles.placeholder} />
            </View>
            
            <View style={styles.reportSubtitleContainer}>
              <Text style={styles.subtitle}>
                Por que você está denunciando este post?
              </Text>
            </View>

            {/* Report Reasons */}
            <View style={styles.reasonsContainer}>
              {reportReasons.map((reason, index) => (
                <TouchableOpacity
                  key={reason.id}
                  style={[
                    styles.reasonButton,
                    index === reportReasons.length - 1 && styles.lastReasonButton
                  ]}
                  onPress={() => submitReport(reason.id)}
                  disabled={submitting}
                  activeOpacity={0.7}
                >
                  <View style={styles.reasonIconContainer}>
                    <Ionicons 
                      name={reason.icon as any} 
                      size={22} 
                      color={colors.brand.primary} 
                    />
                  </View>
                  <Text style={styles.reasonText}>{reason.label}</Text>
                  <Ionicons 
                    name="chevron-forward" 
                    size={18} 
                    color={colors.brand.textSecondary} 
                  />
                </TouchableOpacity>
              ))}
            </View>

            {submitting && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.brand.primary} />
                <Text style={styles.loadingText}>Enviando denúncia...</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: colors.brand.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  reportModalContainer: {
    backgroundColor: colors.brand.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: height * 0.75,
    paddingBottom: 40,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.brand.textSecondary + '60',
    borderRadius: 2,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.brand.textSecondary + '20',
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.brand.textSecondary + '20',
  },
  backButton: {
    padding: 4,
  },
  placeholder: {
    width: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.brand.textPrimary,
    textAlign: 'center',
  },
  reportSubtitleContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  subtitle: {
    fontSize: 14,
    color: colors.brand.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  optionsContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.brand.background + '80',
  },
  deleteButton: {
    backgroundColor: colors.brand.error + '10',
  },
  cancelButton: {
    marginTop: 8,
    backgroundColor: colors.brand.textSecondary + '10',
  },
  optionIconContainer: {
    width: 32,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.brand.textPrimary,
    flex: 1,
    marginLeft: 12,
  },
  deleteText: {
    color: colors.brand.error,
  },
  cancelText: {
    color: colors.brand.textSecondary,
  },
  reasonsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  reasonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    marginVertical: 2,
    borderRadius: 12,
    backgroundColor: colors.brand.background + '60',
    borderBottomWidth: 0.5,
    borderBottomColor: colors.brand.textSecondary + '10',
  },
  lastReasonButton: {
    borderBottomWidth: 0,
  },
  reasonIconContainer: {
    width: 32,
    alignItems: 'center',
  },
  reasonText: {
    fontSize: 16,
    color: colors.brand.textPrimary,
    flex: 1,
    marginLeft: 12,
    lineHeight: 22,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: colors.brand.card,
  },
  loadingText: {
    fontSize: 14,
    color: colors.brand.textSecondary,
    marginTop: 12,
  },
});

export default PostOptionsModal; 