import { colors, type Colors } from './colors';
import { spacing, borderRadius, shadows, type Spacing, type BorderRadius, type Shadows } from './spacing';
import { typography, type Typography } from './typography';

export { colors, spacing, borderRadius, shadows, typography };
export type { Colors, Spacing, BorderRadius, Shadows, Typography };

export const theme = {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
} as const;

export type Theme = typeof theme; 