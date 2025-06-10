import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, ViewStyle } from 'react-native';
import { spacing } from '../theme';

export const useSafeArea = () => {
  const insets = useSafeAreaInsets();

  // Calculate smart padding for different areas
  const getBottomPadding = (includeTabBar = false) => {
    const baseTabBarHeight = 60;
    const minPadding = spacing.sm;
    
    if (includeTabBar) {
      return baseTabBarHeight + Math.max(insets.bottom, minPadding);
    }
    
    return Math.max(insets.bottom, minPadding);
  };

  const getTopPadding = () => {
    if (Platform.OS === 'ios') {
      // iOS: usa apenas o inset nativo (sem padding adicional)
      // Isso mantém o comportamento original do iOS
      return insets.top;
    } else {
      // Android: usa inset nativo + padding mínimo quando necessário
      // Garante que tenha espaço adequado mesmo quando insets.top for 0
      return Math.max(insets.top, spacing.lg);
    }
  };

  const getSidePadding = () => {
    return Math.max(insets.left, insets.right, 0);
  };

  const getTabBarHeight = () => {
    const baseHeight = 60;
    const bottomPadding = Math.max(insets.bottom, spacing.sm);
    return baseHeight + bottomPadding;
  };

  // Estilos prontos para uso direto
  const headerStyle: ViewStyle = Platform.OS === 'android' 
    ? { paddingTop: getTopPadding() }
    : {};

  const containerStyle: ViewStyle = {
    flex: 1,
    ...(Platform.OS === 'android' && { paddingTop: getTopPadding() })
  };

  const bottomContainerStyle: ViewStyle = {
    paddingBottom: getBottomPadding()
  };

  // Métodos utilitários para aplicar estilos condicionalmente
  const applyTopPadding = (baseStyle: ViewStyle = {}): ViewStyle => ({
    ...baseStyle,
    ...(Platform.OS === 'android' && { paddingTop: getTopPadding() })
  });

  const applyBottomPadding = (baseStyle: ViewStyle = {}): ViewStyle => ({
    ...baseStyle,
    paddingBottom: getBottomPadding()
  });

  const applyAllPadding = (baseStyle: ViewStyle = {}): ViewStyle => ({
    ...baseStyle,
    ...(Platform.OS === 'android' && { paddingTop: getTopPadding() }),
    paddingBottom: getBottomPadding(),
    paddingLeft: Math.max(insets.left, 0),
    paddingRight: Math.max(insets.right, 0),
  });

  return {
    // Valores originais
    insets,
    bottomPadding: getBottomPadding(),
    bottomPaddingWithTabBar: getBottomPadding(true),
    topPadding: getTopPadding(),
    sidePadding: getSidePadding(),
    tabBarHeight: getTabBarHeight(),
    hasNotch: insets.bottom > 0,
    isAndroid: Platform.OS === 'android',
    isIOS: Platform.OS === 'ios',

    // Estilos prontos
    styles: {
      header: headerStyle,
      container: containerStyle,
      bottomContainer: bottomContainerStyle,
    },

    // Métodos utilitários
    applyTopPadding,
    applyBottomPadding,
    applyAllPadding,
  };
}; 