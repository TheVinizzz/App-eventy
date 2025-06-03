import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../theme';

interface CustomDateTimePickerProps {
  value: Date | null;
  onChange: (date: Date) => void;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  style?: any;
  error?: string;
}

const { width: screenWidth } = Dimensions.get('window');

const CustomDateTimePicker: React.FC<CustomDateTimePickerProps> = ({
  value,
  onChange,
  placeholder = "Selecione data e hora",
  minimumDate = new Date(),
  maximumDate,
  style,
  error,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(value || new Date());
  const [currentView, setCurrentView] = useState<'date' | 'time'>('date');

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateTime = (date: Date) => {
    return `${formatDate(date)} às ${formatTime(date)}`;
  };

  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year <= currentYear + 10; year++) {
      years.push(year);
    }
    return years;
  };

  const generateMonths = () => {
    return [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
  };

  const generateDays = (year: number, month: number) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  };

  const generateHours = () => {
    const hours = [];
    for (let hour = 0; hour < 24; hour++) {
      hours.push(hour.toString().padStart(2, '0'));
    }
    return hours;
  };

  const generateMinutes = () => {
    const minutes = [];
    for (let minute = 0; minute < 60; minute += 5) {
      minutes.push(minute.toString().padStart(2, '0'));
    }
    return minutes;
  };

  const handleConfirm = () => {
    onChange(selectedDate);
    setShowPicker(false);
  };

  const handleCancel = () => {
    setSelectedDate(value || new Date());
    setShowPicker(false);
  };

  const updateDate = (year: number, month: number, day: number) => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(year);
    newDate.setMonth(month);
    newDate.setDate(day);
    setSelectedDate(newDate);
  };

  const updateTime = (hour: number, minute: number) => {
    const newDate = new Date(selectedDate);
    newDate.setHours(hour);
    newDate.setMinutes(minute);
    setSelectedDate(newDate);
  };

  const renderDatePicker = () => {
    const years = generateYears();
    const months = generateMonths();
    const days = generateDays(selectedDate.getFullYear(), selectedDate.getMonth());

    return (
      <View style={styles.pickerContainer}>
        <Text style={styles.pickerTitle}>Selecionar Data</Text>
        
        <View style={styles.scrollContainer}>
          {/* Year Picker */}
          <View style={styles.columnContainer}>
            <Text style={styles.columnLabel}>Ano</Text>
            <ScrollView style={styles.scrollColumn} showsVerticalScrollIndicator={false}>
              {years.map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.pickerItem,
                    selectedDate.getFullYear() === year && styles.pickerItemSelected,
                  ]}
                  onPress={() => updateDate(year, selectedDate.getMonth(), selectedDate.getDate())}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      selectedDate.getFullYear() === year && styles.pickerItemTextSelected,
                    ]}
                  >
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Month Picker */}
          <View style={styles.columnContainer}>
            <Text style={styles.columnLabel}>Mês</Text>
            <ScrollView style={styles.scrollColumn} showsVerticalScrollIndicator={false}>
              {months.map((month, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.pickerItem,
                    selectedDate.getMonth() === index && styles.pickerItemSelected,
                  ]}
                  onPress={() => updateDate(selectedDate.getFullYear(), index, selectedDate.getDate())}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      selectedDate.getMonth() === index && styles.pickerItemTextSelected,
                    ]}
                  >
                    {month}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Day Picker */}
          <View style={styles.columnContainer}>
            <Text style={styles.columnLabel}>Dia</Text>
            <ScrollView style={styles.scrollColumn} showsVerticalScrollIndicator={false}>
              {days.map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.pickerItem,
                    selectedDate.getDate() === day && styles.pickerItemSelected,
                  ]}
                  onPress={() => updateDate(selectedDate.getFullYear(), selectedDate.getMonth(), day)}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      selectedDate.getDate() === day && styles.pickerItemTextSelected,
                    ]}
                  >
                    {day.toString().padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </View>
    );
  };

  const renderTimePicker = () => {
    const hours = generateHours();
    const minutes = generateMinutes();

    return (
      <View style={styles.pickerContainer}>
        <Text style={styles.pickerTitle}>Selecionar Hora</Text>
        
        <View style={styles.scrollContainer}>
          {/* Hour Picker */}
          <View style={styles.columnContainer}>
            <Text style={styles.columnLabel}>Hora</Text>
            <ScrollView style={styles.scrollColumn} showsVerticalScrollIndicator={false}>
              {hours.map((hour) => (
                <TouchableOpacity
                  key={hour}
                  style={[
                    styles.pickerItem,
                    selectedDate.getHours() === parseInt(hour) && styles.pickerItemSelected,
                  ]}
                  onPress={() => updateTime(parseInt(hour), selectedDate.getMinutes())}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      selectedDate.getHours() === parseInt(hour) && styles.pickerItemTextSelected,
                    ]}
                  >
                    {hour}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Minute Picker */}
          <View style={styles.columnContainer}>
            <Text style={styles.columnLabel}>Minuto</Text>
            <ScrollView style={styles.scrollColumn} showsVerticalScrollIndicator={false}>
              {minutes.map((minute) => (
                <TouchableOpacity
                  key={minute}
                  style={[
                    styles.pickerItem,
                    Math.floor(selectedDate.getMinutes() / 5) * 5 === parseInt(minute) && styles.pickerItemSelected,
                  ]}
                  onPress={() => updateTime(selectedDate.getHours(), parseInt(minute))}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      Math.floor(selectedDate.getMinutes() / 5) * 5 === parseInt(minute) && styles.pickerItemTextSelected,
                    ]}
                  >
                    {minute}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {/* Date and Time Display */}
      <View style={styles.inputRow}>
        {/* Date Picker */}
        <TouchableOpacity
          style={[styles.dateTimeButton, styles.dateButton, error && styles.errorBorder]}
          onPress={() => {
            setCurrentView('date');
            setShowPicker(true);
          }}
        >
          <Ionicons name="calendar" size={20} color={colors.brand.primary} />
          <Text style={[styles.dateTimeText, !value && styles.placeholderText]}>
            {value ? formatDate(value) : 'Data'}
          </Text>
        </TouchableOpacity>

        {/* Time Picker */}
        <TouchableOpacity
          style={[styles.dateTimeButton, styles.timeButton, error && styles.errorBorder]}
          onPress={() => {
            setCurrentView('time');
            setShowPicker(true);
          }}
        >
          <Ionicons name="time" size={20} color={colors.brand.primary} />
          <Text style={[styles.dateTimeText, !value && styles.placeholderText]}>
            {value ? formatTime(value) : 'Hora'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Combined Display */}
      {value && (
        <View style={styles.combinedDisplay}>
          <Ionicons name="checkmark-circle" size={16} color={colors.brand.success} />
          <Text style={styles.combinedText}>
            {formatDateTime(value)}
          </Text>
        </View>
      )}

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={16} color={colors.brand.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Custom Picker Modal */}
      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={handleCancel}>
                <Text style={styles.modalButton}>Cancelar</Text>
              </TouchableOpacity>
              
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[styles.tab, currentView === 'date' && styles.tabActive]}
                  onPress={() => setCurrentView('date')}
                >
                  <Text style={[styles.tabText, currentView === 'date' && styles.tabTextActive]}>
                    Data
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, currentView === 'time' && styles.tabActive]}
                  onPress={() => setCurrentView('time')}
                >
                  <Text style={[styles.tabText, currentView === 'time' && styles.tabTextActive]}>
                    Hora
                  </Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity onPress={handleConfirm}>
                <Text style={[styles.modalButton, styles.doneButton]}>Pronto</Text>
              </TouchableOpacity>
            </View>
            
            {currentView === 'date' ? renderDatePicker() : renderTimePicker()}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderWidth: 1,
    borderColor: colors.opacity.cardBorder,
    gap: spacing.sm,
    minHeight: 56,
  },
  dateButton: {
    flex: 2,
  },
  timeButton: {
    flex: 1,
  },
  dateTimeText: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textPrimary,
    fontWeight: typography.fontWeights.medium,
  },
  placeholderText: {
    color: colors.brand.textSecondary,
  },
  combinedDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  combinedText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.success,
    fontWeight: typography.fontWeights.medium,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  errorText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.error,
  },
  errorBorder: {
    borderColor: colors.brand.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.brand.card,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.opacity.cardBorder,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.brand.darkGray,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
  },
  tab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  tabActive: {
    backgroundColor: colors.brand.primary,
  },
  tabText: {
    fontSize: typography.fontSizes.sm,
    color: colors.brand.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  tabTextActive: {
    color: colors.brand.background,
  },
  modalButton: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.primary,
    fontWeight: typography.fontWeights.medium,
  },
  doneButton: {
    fontWeight: typography.fontWeights.bold,
  },
  pickerContainer: {
    padding: spacing.xl,
  },
  pickerTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.brand.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  scrollContainer: {
    flexDirection: 'row',
    height: 200,
  },
  columnContainer: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  columnLabel: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.brand.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  scrollColumn: {
    flex: 1,
  },
  pickerItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    marginVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  pickerItemSelected: {
    backgroundColor: colors.brand.primary,
  },
  pickerItemText: {
    fontSize: typography.fontSizes.md,
    color: colors.brand.textPrimary,
    fontWeight: typography.fontWeights.medium,
  },
  pickerItemTextSelected: {
    color: colors.brand.background,
    fontWeight: typography.fontWeights.bold,
  },
});

export default CustomDateTimePicker; 