import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Screens
import HomeScreen from './screens/Home';
import HerdScreen from './screens/Herd';
import CalendarScreen from './screens/Calendar';
import StatsScreen from './screens/Stats';
import ProfileScreen from './screens/Profile';

// Context
import { SyncProvider } from './context/SyncContext';

const Tab = createBottomTabNavigator();

export default function App() {
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
