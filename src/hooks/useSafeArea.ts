import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
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
    return Math.max(insets.top, spacing.md);
  };

  const getSidePadding = () => {
    return Math.max(insets.left, insets.right, 0);
  };

  const getTabBarHeight = () => {
    const baseHeight = 60;
    const bottomPadding = Math.max(insets.bottom, spacing.sm);
    return baseHeight + bottomPadding;
  };

  return {
    insets,
    bottomPadding: getBottomPadding(),
    bottomPaddingWithTabBar: getBottomPadding(true),
    topPadding: getTopPadding(),
    sidePadding: getSidePadding(),
    tabBarHeight: getTabBarHeight(),
    hasNotch: insets.bottom > 0,
    isAndroid: Platform.OS === 'android',
    isIOS: Platform.OS === 'ios',
  };
}; 