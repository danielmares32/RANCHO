import React from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

// Lista completa de propiedades relacionadas con responder a filtrar en web
const RESPONDER_PROPS = [
  'onStartShouldSetResponder',
  'onMoveShouldSetResponder',
  'onResponderGrant',
  'onResponderMove',
  'onResponderRelease',
  'onResponderTerminate',
  'onResponderTerminationRequest',
  'onStartShouldSetResponderCapture',
  'onMoveShouldSetResponderCapture',
  'onResponderReject',
  'onResponderStart',
  'onResponderEnd',
  'onResponderStart',
  'onTouchStart',
  'onTouchMove',
  'onTouchEnd',
  'onTouchCancel',
];

// Filtrar propiedades que causan advertencias en entorno web
const filterWebProps = (props) => {
  if (Platform.OS !== 'web') {
    return props; // En móvil, usamos todas las props sin cambios
  }
  
  // Crear un nuevo objeto sin las propiedades filtradas
  const webSafeProps = {...props};
  
  // Eliminar todas las propiedades de responder 
  RESPONDER_PROPS.forEach(prop => {
    if (prop in webSafeProps) {
      delete webSafeProps[prop];
    }
  });
  
  return webSafeProps;
};

// Componente wrapper para LineChart
export const LineChartWrapper = (props) => {
  return <LineChart {...filterWebProps(props)} />;
};

// Componente wrapper para BarChart
export const BarChartWrapper = (props) => {
  return <BarChart {...filterWebProps(props)} />;
};

// Componente wrapper para PieChart
export const PieChartWrapper = (props) => {
  return <PieChart {...filterWebProps(props)} />;
};

// Por defecto exportamos el LineChartWrapper como ChartWrapper para mantener compatibilidad
export default LineChartWrapper;
