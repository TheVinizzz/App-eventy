import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

import { colors, spacing, typography, borderRadius } from '../theme';
import { RootStackParamList } from '../navigation/types';
import { EvenLoveMessage, EvenLoveMatch } from '../types/evenLove';
import evenLoveService from '../services/evenLoveService';
import websocketService from '../services/websocketService';

const { width, height } = Dimensions.get('window');

type EvenLoveChatScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EvenLoveChat'>;
type EvenLoveChatScreenRouteProp = RouteProp<RootStackParamList, 'EvenLoveChat'>;

const EvenLoveChatScreen: React.FC = () => {
  const navigation = useNavigation<EvenLoveChatScreenNavigationProp>();
  const route = useRoute<EvenLoveChatScreenRouteProp>();
  const { eventId, matchId, matchName } = route.params;

  const [messages, setMessages] = useState<EvenLoveMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [match, setMatch] = useState<EvenLoveMatch | null>(null);

  // Refs
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      loadInitialData();
      connectWebSocket();
      
      return () => {
        websocketService.leaveMatchRoom(matchId);
      };
    }, [eventId, matchId])
  );

  useEffect(() => {
    // Animate entrance
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    // Handle typing indicator
    if (messageText.length > 0 && !isTyping) {
      setIsTyping(true);
      websocketService.sendTypingIndicator(matchId, true);
    } else if (messageText.length === 0 && isTyping) {
      setIsTyping(false);
      websocketService.sendTypingIndicator(matchId, false);
    }

    // Clear typing after 3 seconds of inactivity
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        websocketService.sendTypingIndicator(matchId, false);
      }
    }, 3000);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [messageText, isTyping, matchId]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      
      // Load match details
      const matchData = await evenLoveService.getMatch(eventId, matchId);
      setMatch(matchData);
      
      // Load messages
      const { messages: messagesData, pagination } = await evenLoveService.getMessages(eventId, matchId, 1, 50);
      setMessages(messagesData.reverse()); // Reverse to show newest at bottom
      setHasMoreMessages(pagination.page < pagination.totalPages);
      setCurrentPage(1);
      
      // Mark messages as read
      if (messagesData.length > 0) {
        const unreadMessageIds = messagesData
          .filter(msg => !msg.isRead && msg.senderId !== 'current_user_id')
          .map(msg => msg.id);
        
        if (unreadMessageIds.length > 0) {
          await evenLoveService.markMessagesAsRead(eventId, matchId);
          websocketService.markMessagesAsRead(matchId, unreadMessageIds);
        }
      }
      
    } catch (error) {
      console.error('Error loading chat data:', error);
      Alert.alert('Erro', 'Não foi possível carregar as mensagens.');
    } finally {
      setIsLoading(false);
    }
  };

  const connectWebSocket = async () => {
    try {
      if (!websocketService.isSocketConnected()) {
        await websocketService.connect(eventId);
      }
      
      // Join match room
      websocketService.joinMatchRoom(matchId);
      
      // Listen for new messages
      websocketService.on('message:new', handleNewMessage);
      
      // Listen for typing indicators
      websocketService.on('message:typing', handleTypingIndicator);
      
      // Listen for message read status
      websocketService.on('message:read', handleMessageRead);
      
    } catch (error) {
      console.error('WebSocket connection failed:', error);
    }
  };

  const handleNewMessage = (message: EvenLoveMessage) => {
    if (message.matchId === matchId) {
      setMessages(prev => [...prev, message]);
      
      // Mark as read if from other user
      if (message.senderId !== 'current_user_id') {
        evenLoveService.markMessagesAsRead(eventId, matchId);
        websocketService.markMessagesAsRead(matchId, [message.id]);
      }
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleTypingIndicator = (data: { matchId: string; userId: string; isTyping: boolean }) => {
    if (data.matchId === matchId && data.userId !== 'current_user_id') {
      setOtherUserTyping(data.isTyping);
    }
  };

  const handleMessageRead = (data: { matchId: string; messageIds: string[] }) => {
    if (data.matchId === matchId) {
      setMessages(prev => prev.map(msg => 
        data.messageIds.includes(msg.id) ? { ...msg, isRead: true } : msg
      ));
    }
  };

  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMoreMessages) return;
    
    try {
      setIsLoadingMore(true);
      const nextPage = currentPage + 1;
      
      const { messages: moreMessages, pagination } = await evenLoveService.getMessages(
        eventId, 
        matchId, 
        nextPage, 
        50
      );
      
      if (moreMessages.length > 0) {
        setMessages(prev => [...moreMessages.reverse(), ...prev]);
        setCurrentPage(nextPage);
        setHasMoreMessages(pagination.page < pagination.totalPages);
      } else {
        setHasMoreMessages(false);
      }
      
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || isSending) return;
    
    const text = messageText.trim();
    setMessageText('');
    setIsSending(true);
    
    try {
      // Send via WebSocket for real-time delivery
      websocketService.sendMessage(matchId, text, 'text');
      
      // Also send via API for persistence
      await evenLoveService.sendMessage(eventId, matchId, text, 'text');
      
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Erro', 'Não foi possível enviar a mensagem. Tente novamente.');
      setMessageText(text); // Restore message text
    } finally {
      setIsSending(false);
    }
  };

  const formatMessageTime = (createdAt: string): string => {
    const messageDate = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - messageDate.getTime());
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 1) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      return messageDate.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return messageDate.toLocaleDateString();
    }
  };

  const renderMessage = ({ item: message, index }: { item: EvenLoveMessage; index: number }) => {
    const isMyMessage = message.senderId === 'current_user_id';
    const isLastInGroup = index === messages.length - 1 || 
      messages[index + 1]?.senderId !== message.senderId;
    
    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
          isLastInGroup && (isMyMessage ? styles.myMessageBubbleLast : styles.otherMessageBubbleLast)
        ]}>
          <Text style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.otherMessageText
          ]}>
            {message.content}
          </Text>
        </View>
        
        {isLastInGroup && (
          <View style={[
            styles.messageInfo,
            isMyMessage ? styles.myMessageInfo : styles.otherMessageInfo
          ]}>
            <Text style={styles.messageTime}>
              {formatMessageTime(message.createdAt)}
            </Text>
            {isMyMessage && (
              <Ionicons 
                name={message.isRead ? "checkmark-done" : "checkmark"} 
                size={14} 
                color={message.isRead ? colors.brand.primary : "#666666"} 
              />
            )}
          </View>
        )}
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!otherUserTyping) return null;
    
    return (
      <View style={styles.typingContainer}>
        <View style={styles.typingBubble}>
          <View style={styles.typingDots}>
            <View style={[styles.typingDot, styles.typingDot1]} />
            <View style={[styles.typingDot, styles.typingDot2]} />
            <View style={[styles.typingDot, styles.typingDot3]} />
          </View>
        </View>
        <Text style={styles.typingText}>{matchName} está digitando...</Text>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.headerButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color={colors.brand.primary} />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.headerCenter} activeOpacity={0.8}>
        <LinearGradient
          colors={['rgba(255, 215, 0, 0.3)', 'rgba(255, 193, 7, 0.1)']}
          style={styles.headerAvatar}
        >
          <Ionicons name="person" size={24} color={colors.brand.primary} />
        </LinearGradient>
        
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{matchName}</Text>
          <Text style={styles.headerStatus}>
            {otherUserTyping ? 'digitando...' : 'online agora'}
          </Text>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.headerButton}
        onPress={() => Alert.alert('Opções', 'Em desenvolvimento!')}
      >
        <Ionicons name="ellipsis-vertical" size={20} color={colors.brand.primary} />
      </TouchableOpacity>
    </View>
  );

  const renderInputArea = () => (
    <View style={styles.inputContainer}>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.textInput}
          value={messageText}
          onChangeText={setMessageText}
          placeholder="Digite uma mensagem..."
          placeholderTextColor="#666666"
          multiline
          maxLength={1000}
          returnKeyType="send"
          onSubmitEditing={sendMessage}
          blurOnSubmit={false}
        />
        
        <TouchableOpacity
          style={[
            styles.sendButton,
            (messageText.trim().length === 0 || isSending) && styles.sendButtonDisabled
          ]}
          onPress={sendMessage}
          disabled={messageText.trim().length === 0 || isSending}
        >
          <LinearGradient
            colors={messageText.trim().length > 0 && !isSending 
              ? [colors.brand.primary, '#FFD700'] 
              : ['#333333', '#333333']
            }
            style={styles.sendButtonGradient}
          >
            <Ionicons 
              name={isSending ? "hourglass" : "send"} 
              size={18} 
              color={messageText.trim().length > 0 && !isSending ? "#000000" : "#666666"} 
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#151515', '#1f1f1f', '#252525']} style={styles.background}>
          <View style={styles.loadingContainer}>
            <LinearGradient
              colors={[colors.brand.primary, '#FFD700']}
              style={styles.loadingIcon}
            >
              <Ionicons name="chatbubbles" size={32} color="#000000" />
            </LinearGradient>
            <Text style={styles.loadingText}>Carregando conversa...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.brand.background} />
      
      <LinearGradient colors={['#151515', '#1f1f1f', '#252525']} style={styles.background}>
        <KeyboardAvoidingView 
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {renderHeader()}
          
          <Animated.View style={[styles.messagesContainer, { opacity: fadeAnim }]}>
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.messagesList}
              onEndReached={loadMoreMessages}
              onEndReachedThreshold={0.1}
              ListFooterComponent={renderTypingIndicator}
              inverted={false}
            />
          </Animated.View>
          
          {renderInputArea()}
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
  background: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  loadingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  loadingText: {
    fontSize: typography.fontSizes.md,
    color: '#cccccc',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    backgroundColor: '#1a1a1a',
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: 'white',
  },
  headerStatus: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.primary,
    marginTop: 2,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexGrow: 1,
  },
  messageContainer: {
    marginVertical: spacing.xs,
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: width * 0.75,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  myMessageBubble: {
    backgroundColor: colors.brand.primary,
    borderBottomRightRadius: spacing.xs,
  },
  otherMessageBubble: {
    backgroundColor: '#333333',
    borderBottomLeftRadius: spacing.xs,
  },
  myMessageBubbleLast: {
    borderBottomRightRadius: borderRadius.lg,
  },
  otherMessageBubbleLast: {
    borderBottomLeftRadius: borderRadius.lg,
  },
  messageText: {
    fontSize: typography.fontSizes.md,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#000000',
  },
  otherMessageText: {
    color: 'white',
  },
  messageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  myMessageInfo: {
    justifyContent: 'flex-end',
  },
  otherMessageInfo: {
    justifyContent: 'flex-start',
  },
  messageTime: {
    fontSize: typography.fontSizes.xs,
    color: '#666666',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  typingBubble: {
    backgroundColor: '#333333',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#666666',
  },
  typingDot1: {
    // Animation would be added here
  },
  typingDot2: {
    // Animation would be added here
  },
  typingDot3: {
    // Animation would be added here
  },
  typingText: {
    fontSize: typography.fontSizes.xs,
    color: '#666666',
    fontStyle: 'italic',
  },
  inputContainer: {
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333333',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#252525',
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    fontSize: typography.fontSizes.md,
    color: 'white',
    maxHeight: 100,
    textAlignVertical: 'center',
  },
  sendButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default EvenLoveChatScreen; 