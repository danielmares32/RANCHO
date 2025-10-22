import React, { useState } from 'react';
import { Platform, View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';

const PlatformDatePicker = ({ 
  date, 
  onChange, 
  label, 
  style, 
  minimumDate,
  maximumDate,
  disabled = false
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [internalDate, setInternalDate] = useState(date || new Date());

  const handleDateChange = (event, selectedDate) => {
    setShowPicker(false);
    if (selectedDate) {
      setInternalDate(selectedDate);
      onChange(selectedDate);
    }
  };

  const formatDate = (dateObj) => {
    if (!dateObj) return '';
    const date = new Date(dateObj);
    return date.toISOString().split('T')[0];
  };

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, style]}>
        {label && <Text style={styles.label}>{label}</Text>}
        <input
          type="date"
          value={formatDate(internalDate)}
          onChange={(e) => {
            const newDate = new Date(e.target.value);
            setInternalDate(newDate);
            onChange(newDate);
          }}
          style={styles.webInput}
          disabled={disabled}
          min={minimumDate ? formatDate(minimumDate) : undefined}
          max={maximumDate ? formatDate(maximumDate) : undefined}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[styles.dateButton, disabled && styles.disabledButton]}
        onPress={() => !disabled && setShowPicker(true)}
        disabled={disabled}
      >
        <Text style={styles.dateText}>
          {internalDate ? internalDate.toLocaleDateString('es-MX') : 'Seleccionar fecha'}
        </Text>
        <Ionicons name="calendar" size={20} color={disabled ? COLORS.textSecondary : COLORS.primary} />
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={internalDate || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 8,
    fontWeight: '500',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: COLORS.backgroundLight,
  },
  disabledButton: {
    opacity: 0.6,
  },
  dateText: {
    color: COLORS.text,
    fontSize: 16,
  },
  webInput: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: COLORS.backgroundLight,
    color: COLORS.text,
  },
});

export default PlatformDatePicker;
