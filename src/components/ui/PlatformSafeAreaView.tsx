import React from 'react';
import { View, ViewStyle, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../../theme';

interface PlatformSafeAreaViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  edges?: ('top' | 'right' | 'bottom' | 'left')[];
  mode?: 'padding' | 'margin';
}

/**
 * Componente SafeAreaView inteligente que aplica comportamento específico por plataforma:
 * - iOS: Usa o comportamento nativo do SafeAreaView
 * - Android: Adiciona padding customizado para status bar quando necessário
 */
export const PlatformSafeAreaView: React.FC<PlatformSafeAreaViewProps> = ({
  children,
  style,
  edges = ['top', 'right', 'bottom', 'left'],
  mode = 'padding',
}) => {
  const insets = useSafeAreaInsets();

  if (Platform.OS === 'ios') {
    // iOS: usa SafeAreaView nativo - comportamento original
    return (
      <SafeAreaView style={style} edges={edges} mode={mode}>
        {children}
      </SafeAreaView>
    );
  }

  // Android: lógica customizada
  const androidStyle: ViewStyle = {
    flex: 1,
    ...(style as object),
  };

  // Aplicar padding/margin para Android baseado nos edges especificados
  if (edges.includes('top')) {
    const topValue = Math.max(insets.top, spacing.lg);
    if (mode === 'padding') {
      androidStyle.paddingTop = topValue;
    } else {
      androidStyle.marginTop = topValue;
    }
  }

  if (edges.includes('bottom')) {
    const bottomValue = Math.max(insets.bottom, spacing.sm);
    if (mode === 'padding') {
      androidStyle.paddingBottom = bottomValue;
    } else {
      androidStyle.marginBottom = bottomValue;
    }
  }

  if (edges.includes('left')) {
    const leftValue = Math.max(insets.left, 0);
    if (mode === 'padding') {
      androidStyle.paddingLeft = leftValue;
    } else {
      androidStyle.marginLeft = leftValue;
    }
  }

  if (edges.includes('right')) {
    const rightValue = Math.max(insets.right, 0);
    if (mode === 'padding') {
      androidStyle.paddingRight = rightValue;
    } else {
      androidStyle.marginRight = rightValue;
    }
  }

  return <View style={androidStyle}>{children}</View>;
};

export default PlatformSafeAreaView; 