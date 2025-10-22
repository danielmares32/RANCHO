import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Usar distintas implementaciones para web y móvil
let ChartWrapper, BarChartWrapper, PieChartWrapper;

// En entorno web, usamos componentes alternativos o mensajes
if (Platform.OS === 'web') {
  // Implementación básica para entorno web que no muestra advertencias
  const WebChartPlaceholder = ({ style, data, height, width }) => (
    <View style={[style, { height, width, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9f9f9', borderRadius: 8 }]}>
      <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>Gráfico: {data.labels?.join(', ')}</Text>
      <Text style={{ color: '#777' }}>Visualización disponible en la aplicación móvil</Text>
    </View>
  );
  
  // Asignar los componentes placeholder para web
  ChartWrapper = WebChartPlaceholder;
  BarChartWrapper = WebChartPlaceholder;
  PieChartWrapper = WebChartPlaceholder;
} else {
  // En móvil usamos los componentes normales de charts
  const charts = require('react-native-chart-kit');
  ChartWrapper = charts.LineChart;
  BarChartWrapper = charts.BarChart;
  PieChartWrapper = charts.PieChart;
}
import { COLORS } from '../constants/colors';

const screenWidth = Dimensions.get('window').width - 32;

// Mock data
const herdComposition = [
  { name: 'Vacas en producción', population: 45, color: COLORS.primary, legendFontColor: COLORS.text },
  { name: 'Vacas secas', population: 25, color: COLORS.warning, legendFontColor: COLORS.text },
  { name: 'Villona', population: 30, color: COLORS.info, legendFontColor: COLORS.text },
];

const breedingData = {
  labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
  datasets: [
    {
      data: [65, 59, 80, 81, 56, 55],
      color: (opacity = 1) => `rgba(46, 204, 113, ${opacity})`,
      strokeWidth: 2
    }
  ],
};

const pregnancyRateData = {
  labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
  datasets: [
    {
      data: [45, 50, 52, 48, 55, 58],
    },
  ],
};

const kpis = [
  { id: '1', title: 'Tasa de preñez', value: '58%', change: '+3%', isPositive: true },
  { id: '2', title: 'Intervalo entre partos', value: '405 días', change: '-5', isPositive: true },
  { id: '3', title: 'Servicios por concepción', value: '2.1', change: '-0.3', isPositive: true },
  { id: '4', title: 'Días abiertos', value: '125', change: '+8', isPositive: false },
];

export default function StatsScreen() {
  const [timeRange, setTimeRange] = useState('6m');
  const [activeTab, setActiveTab] = useState('reproduction');

  const renderKPICard = (item) => (
    <View key={item.id} style={styles.kpiCard}>
      <Text style={styles.kpiTitle}>{item.title}</Text>
      <View style={styles.kpiValueContainer}>
        <Text style={styles.kpiValue}>{item.value}</Text>
        <View style={[
          styles.kpiChange,
          item.isPositive ? styles.kpiPositive : styles.kpiNegative
        ]}>
          <Ionicons 
            name={item.isPositive ? 'trending-up' : 'trending-down'} 
            size={16} 
            color="white" 
          />
          <Text style={styles.kpiChangeText}>{item.change}</Text>
        </View>
      </View>
    </View>
  );

  const renderTimeRangeButton = (id, label) => (
    <TouchableOpacity
      key={id}
      style={[
        styles.timeRangeButton,
        timeRange === id && styles.activeTimeRangeButton
      ]}
      onPress={() => setTimeRange(id)}
    >
      <Text style={[
        styles.timeRangeButtonText,
        timeRange === id && styles.activeTimeRangeButtonText
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderTabButton = (id, icon, label) => (
    <TouchableOpacity
      key={id}
      style={[
        styles.tabButton,
        activeTab === id && styles.activeTabButton
      ]}
      onPress={() => setActiveTab(id)}
    >
      <Ionicons 
        name={icon} 
        size={20} 
        color={activeTab === id ? COLORS.primary : COLORS.textSecondary} 
      />
      <Text style={[
        styles.tabButtonText,
        { color: activeTab === id ? COLORS.primary : COLORS.textSecondary }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Time Range Selector */}
      <View style={styles.timeRangeContainer}>
        {renderTimeRangeButton('1m', '1M')}
        {renderTimeRangeButton('3m', '3M')}
        {renderTimeRangeButton('6m', '6M')}
        {renderTimeRangeButton('1y', '1A')}
        {renderTimeRangeButton('all', 'Todo')}
      </View>

      <ScrollView style={styles.scrollView}>
        {/* KPIs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Indicadores Clave</Text>
          <View style={styles.kpiContainer}>
            {kpis.map(renderKPICard)}
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {renderTabButton('reproduction', 'heart', 'Reproducción')}
          {renderTabButton('production', 'water', 'Producción')}
          {renderTabButton('health', 'medkit', 'Salud')}
        </View>

        {/* Charts */}
        {activeTab === 'reproduction' && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tasa de Preñez</Text>
              <ChartWrapper
                data={pregnancyRateData}
                width={screenWidth}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                withVerticalLines={false}
                withHorizontalLines={false}
                withDots={true}
                withShadow={false}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Servicios por Mes</Text>
              <BarChartWrapper
                data={breedingData}
                width={screenWidth}
                height={220}
                chartConfig={chartConfig}
                style={styles.chart}
                fromZero
                showBarTops={false}
                withInnerLines={false}
                withHorizontalLabels={false}
              />
            </View>
          </>
        )}

        {/* Herd Composition */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Composición del Hato</Text>
          <View style={styles.chartContainer}>
            <PieChartWrapper
              data={herdComposition}
              width={screenWidth}
              height={200}
              chartConfig={chartConfig}
              accessor={"population"}
              backgroundColor={"transparent"}
              paddingLeft={"15"}
              center={[0, 0]}
              absolute
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const chartConfig = {
  backgroundColor: "#ffffff",
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(44, 62, 80, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(44, 62, 80, ${opacity})`,
  style: {
    borderRadius: 16
  },
  propsForDots: {
    r: "4",
    strokeWidth: "2",
    stroke: COLORS.primary
  },
  propsForBackgroundLines: {
    stroke: COLORS.border,
    strokeDasharray: ""
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'ios' ? 64 : 0, // Increased top padding for iOS
  },
  scrollView: {
    flex: 1,
    // Add extra bottom padding for iOS
    paddingBottom: Platform.OS === 'ios' ? 32 : 0,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 16,
    marginBottom: 8,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 4,
  },
  timeRangeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 6,
  },
  activeTimeRangeButton: {
    backgroundColor: COLORS.primary,
  },
  timeRangeButtonText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  activeTimeRangeButtonText: {
    color: 'white',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 16,
    marginBottom: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  kpiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  kpiCard: {
    width: '50%',
    padding: 8,
  },
  kpiTitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  kpiValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text,
  },
  kpiChange: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  kpiPositive: {
    backgroundColor: COLORS.success,
  },
  kpiNegative: {
    backgroundColor: COLORS.danger,
  },
  kpiChangeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
  },
  activeTabButton: {
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
  },
  tabButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  chartContainer: {
    alignItems: 'center',
  },
  chart: {
    marginLeft: -16,
  },
});
