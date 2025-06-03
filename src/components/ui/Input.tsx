import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../theme';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  style?: ViewStyle;
  inputStyle?: TextStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error,
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  leftIcon,
  rightIcon,
  onRightIconPress,
  style,
  inputStyle,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);

  const containerStyle: ViewStyle = {
    marginBottom: spacing.md,
  };

  const labelStyle: TextStyle = {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.brand.textSecondary,
    marginBottom: spacing.xs,
  };

  const inputContainerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.inputBg,
    borderWidth: 1.5,
    borderColor: error 
      ? colors.brand.error 
      : isFocused 
        ? colors.brand.primary 
        : colors.opacity.inputBorder,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: multiline ? spacing.md : spacing.lg,
    minHeight: multiline ? 80 : 56,
  };

  const textInputStyle: TextStyle = {
    flex: 1,
    fontSize: typography.fontSizes.md,
    color: colors.brand.textPrimary,
    fontWeight: typography.fontWeights.normal,
    textAlignVertical: multiline ? 'top' : 'center',
  };

  const errorStyle: TextStyle = {
    fontSize: typography.fontSizes.xs,
    color: colors.brand.error,
    marginTop: spacing.xs,
    fontWeight: typography.fontWeights.medium,
  };

  const handleRightIconPress = () => {
    if (secureTextEntry) {
      setIsPasswordVisible(!isPasswordVisible);
    } else if (onRightIconPress) {
      onRightIconPress();
    }
  };

  const getRightIcon = () => {
    if (secureTextEntry) {
      return isPasswordVisible ? 'eye-off' : 'eye';
    }
    return rightIcon;
  };

  return (
    <View style={[containerStyle, style]}>
      {label && <Text style={labelStyle}>{label}</Text>}
      
      <View style={inputContainerStyle}>
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={colors.brand.textSecondary}
            style={{ marginRight: spacing.sm }}
          />
        )}
        
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.brand.textTertiary}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={!disabled}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[textInputStyle, inputStyle]}
        />
        
        {(rightIcon || secureTextEntry) && (
          <TouchableOpacity
            onPress={handleRightIconPress}
            style={{ marginLeft: spacing.sm }}
          >
            <Ionicons
              name={getRightIcon() as any}
              size={20}
              color={colors.brand.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && <Text style={errorStyle}>{error}</Text>}
    </View>
  );
}; 