import React, { memo, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';

interface Story {
  id: string;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO';
  author: {
    id: string;
    name: string;
    profileImage?: string;
  };
  createdAt: string;
  viewed?: boolean;
}

interface GroupedStories {
  user: {
    id: string;
    name: string;
    profileImage?: string;
  };
  stories: Story[];
  hasUnviewed: boolean;
}

interface EnhancedStoriesCircleProps {
  groupedStories: GroupedStories;
  onPress: () => void;
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  currentUserId?: string;
  style?: ViewStyle;
}

export const EnhancedStoriesCircle: React.FC<EnhancedStoriesCircleProps> = memo(({
  groupedStories,
  onPress,
  size = 'medium',
  showText = true,
  currentUserId,
  style,
}) => {
  // Configurações responsivas baseadas no tamanho
  const sizeConfig = useMemo(() => {
    switch (size) {
      case 'small':
        return {
          containerSize: 64,
          avatarSize: 56,
          borderWidth: 2,
          fontSize: typography.fontSizes.xs,
          badgeSize: 18,
        };
      case 'large':
        return {
          containerSize: 84,
          avatarSize: 76,
          borderWidth: 3,
          fontSize: typography.fontSizes.sm,
          badgeSize: 22,
        };
      default: // medium
        return {
          containerSize: 74,
          avatarSize: 66,
          borderWidth: 2.5,
          fontSize: typography.fontSizes.xs,
          badgeSize: 20,
        };
    }
  }, [size]);

  const { user, hasUnviewed, stories } = groupedStories;
  const isCurrentUser = currentUserId === user.id;
  const firstName = user.name.split(' ')[0];

  // Gradientes do Instagram para stories não visualizados
  const unviewedGradientColors = ['#FF6B6B', '#FF8E53', '#FF6B35', '#F7931E', '#FFD23F'] as const;

  // Cores para stories visualizados
  const viewedBorderColor = 'rgba(255, 255, 255, 0.4)';

  return (
    <TouchableOpacity
      style={[styles.container, { 
        width: sizeConfig.containerSize + sizeConfig.badgeSize, // Espaço extra para badges
        paddingTop: sizeConfig.badgeSize / 2, // Espaço no topo para badge
        paddingRight: sizeConfig.badgeSize / 2, // Espaço na direita para badge
      }, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Avatar Container com gradiente profissional do Instagram */}
      <View style={[styles.avatarContainer, { 
        width: sizeConfig.containerSize,
        height: sizeConfig.containerSize,
      }]}>
        {hasUnviewed ? (
          <LinearGradient
            colors={unviewedGradientColors}
            style={[styles.gradientBorder, {
              width: sizeConfig.containerSize,
              height: sizeConfig.containerSize,
              borderRadius: sizeConfig.containerSize / 2,
            }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={[styles.avatarInner, {
              width: sizeConfig.avatarSize,
              height: sizeConfig.avatarSize,
              borderRadius: sizeConfig.avatarSize / 2,
            }]}>
              <Image
                source={{
                  uri: user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1E1E1E&color=fff&size=128`
                }}
                style={[styles.avatar, {
                  width: sizeConfig.avatarSize,
                  height: sizeConfig.avatarSize,
                  borderRadius: sizeConfig.avatarSize / 2,
                }]}
              />
            </View>
          </LinearGradient>
        ) : (
          <View style={[styles.viewedBorder, {
            width: sizeConfig.containerSize,
            height: sizeConfig.containerSize,
            borderRadius: sizeConfig.containerSize / 2,
            borderWidth: sizeConfig.borderWidth,
            borderColor: viewedBorderColor,
          }]}>
            <Image
              source={{
                uri: user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1E1E1E&color=fff&size=128`
              }}
              style={[styles.avatar, {
                width: sizeConfig.avatarSize,
                height: sizeConfig.avatarSize,
                borderRadius: sizeConfig.avatarSize / 2,
              }]}
            />
          </View>
        )}

        {/* Badge para múltiplas stories */}
        {stories.length > 1 && (
          <View style={[styles.countBadge, {
            width: sizeConfig.badgeSize,
            height: sizeConfig.badgeSize,
            borderRadius: sizeConfig.badgeSize / 2,
          }]}>
            <LinearGradient
              colors={['#FFD700', '#e4e260']}
              style={[styles.countBadgeGradient, {
                width: sizeConfig.badgeSize,
                height: sizeConfig.badgeSize,
                borderRadius: sizeConfig.badgeSize / 2,
              }]}
            >
              <Text style={[styles.countText, {
                fontSize: size === 'small' ? 10 : 11,
              }]}>
                {stories.length}
              </Text>
            </LinearGradient>
          </View>
        )}

        {/* Status de vídeo (se aplicável) */}
        {stories.some(story => story.mediaType === 'VIDEO') && (
          <View style={[styles.videoBadge, {
            bottom: size === 'small' ? 2 : 4,
            left: size === 'small' ? 2 : 4,
          }]}>
            <Ionicons name="videocam" size={size === 'small' ? 10 : 12} color="white" />
          </View>
        )}
      </View>

      {/* Nome do usuário */}
      {showText && (
        <Text
          style={[styles.userName, {
            fontSize: sizeConfig.fontSize,
            marginTop: spacing.xs,
          }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {firstName}
        </Text>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center'
  },
  avatarContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientBorder: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  avatarInner: {
    backgroundColor: colors.brand.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.brand.background,
  },
  viewedBorder: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  avatar: {
    backgroundColor: colors.brand.darkGray,
  },
  countBadge: {
    position: 'absolute',
    top: 0, // Ajustado para não sair dos limites
    right: 0, // Ajustado para não sair dos limites
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.brand.background,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 10, // Garantir que fique por cima
  },
  countBadgeGradient: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  countText: {
    color: 'white',
    fontWeight: typography.fontWeights.bold,
    textAlign: 'center',
  },
  addBadge: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.brand.background,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 10, // Garantir que fique por cima
  },
  addBadgeGradient: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoBadge: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.brand.background,
  },
  userName: {
    color: colors.brand.textPrimary,
    textAlign: 'center',
    fontWeight: typography.fontWeights.medium,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default EnhancedStoriesCircle; 