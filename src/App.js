import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar, View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Screens
import HomeScreen from './screens/Home';
import HerdScreen from './screens/Herd';
import CalendarScreen from './screens/Calendar';
import StatsScreen from './screens/Stats';
import ProfileScreen from './screens/Profile';

// Context
import { SyncProvider } from './context/SyncContext';

// Services
import DatabaseService from './services/DatabaseService';

const Tab = createBottomTabNavigator();

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState(null);

  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        console.log('App: Initializing database...');
        await DatabaseService.initialize();
        console.log('App: Database initialized successfully');
        setDbReady(true);
      } catch (error) {
        console.error('App: Database initialization failed:', error);
        setDbError(error.message);
        setDbReady(true); // Still allow app to load
      }
    };

    initializeDatabase();
  }, []);

  if (!dbReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2ecc71" />
        <Text style={{ marginTop: 16, color: '#666' }}>Iniciando base de datos...</Text>
      </View>
    );
  }

  if (dbError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Ionicons name="alert-circle" size={48} color="#e74c3c" />
        <Text style={{ marginTop: 16, fontSize: 18, fontWeight: 'bold' }}>Error de Base de Datos</Text>
        <Text style={{ marginTop: 8, color: '#666', textAlign: 'center' }}>{dbError}</Text>
      </View>
    );
  }

  return (
    <SyncProvider>
      <NavigationContainer>
        <StatusBar barStyle="dark-content" />
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;

              if (route.name === 'Inicio') {
                iconName = focused ? 'home' : 'home-outline';
              } else if (route.name === 'Hato') {
                iconName = focused ? 'paw' : 'paw-outline';
              } else if (route.name === 'Calendario') {
                iconName = focused ? 'calendar' : 'calendar-outline';
              } else if (route.name === 'KPIs') {
                iconName = focused ? 'stats-chart' : 'stats-chart-outline';
              } else if (route.name === 'Perfil') {
                iconName = focused ? 'person' : 'person-outline';
              } else if (route.name === 'Usuarios') {
                iconName = focused ? 'people' : 'people-outline';
              }

              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#2ecc71',
            tabBarInactiveTintColor: 'gray',
            headerShown: false,
            tabBarLabelStyle: { display: 'none' },
          })}
        >
          <Tab.Screen name="Inicio" component={HomeScreen} />
          <Tab.Screen name="Hato" component={HerdScreen} />
          <Tab.Screen name="Calendario" component={CalendarScreen} />
          <Tab.Screen name="KPIs" component={StatsScreen} />
          <Tab.Screen name="Usuarios" component={require('./screens/Users').default} />
          <Tab.Screen name="Perfil" component={ProfileScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </SyncProvider>
  );
}
