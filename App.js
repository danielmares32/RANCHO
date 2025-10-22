import './src/utils/setImmediatePolyfill';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar, Platform, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import screens
import HomeScreen from './src/screens/Home';
import HerdScreen from './src/screens/Herd';
import CalendarScreen from './src/screens/Calendar';
import StatsScreen from './src/screens/Stats';
import ProfileScreen from './src/screens/Profile';
import AnimalDetail from './src/screens/AnimalDetail';
import LocationsScreen from './src/screens/Locations';

// Import formularios de captura
import AddAnimal from './src/screens/AddAnimal';
import AddServicio from './src/screens/AddServicio';
import AddDiagnostico from './src/screens/AddDiagnostico';
import AddParto from './src/screens/AddParto';
import AddOrdena from './src/screens/AddOrdena';
import AddTratamiento from './src/screens/AddTratamiento';
import AddSecado from './src/screens/AddSecado';
import DatabaseTestScreen from './src/screens/DatabaseTestScreen';

// Import context providers
import { SyncProvider } from './src/context/SyncContext';
import { DatabaseProvider } from './src/context/DatabaseContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Crear un stack para las pantallas comunes (formularios de captura)
const FormulariesStack = createNativeStackNavigator();

// Stack Navigator para los formularios - se usará en varias secciones
// Alias: NewBreeding -> AddServicio, NewBirth -> AddParto, NewTreatment -> AddTratamiento
const FormulariesNavigator = () => (
  <FormulariesStack.Navigator screenOptions={{ headerShown: false }}>
    <FormulariesStack.Screen name="AddAnimal" component={AddAnimal} />
    <FormulariesStack.Screen name="AddServicio" component={AddServicio} />
    <FormulariesStack.Screen name="NewBreeding" component={AddServicio} />
    <FormulariesStack.Screen name="AddDiagnostico" component={AddDiagnostico} />
    <FormulariesStack.Screen name="AddParto" component={AddParto} />
    <FormulariesStack.Screen name="NewBirth" component={AddParto} />
    <FormulariesStack.Screen name="AddOrdena" component={AddOrdena} />
    <FormulariesStack.Screen name="AddTratamiento" component={AddTratamiento} />
    <FormulariesStack.Screen name="NewTreatment" component={AddTratamiento} />
    <FormulariesStack.Screen name="AddSecado" component={AddSecado} />
  </FormulariesStack.Navigator>
);

// Stack Navigator para la sección del Hato
// Alias: NewBreeding -> AddServicio, NewBirth -> AddParto, NewTreatment -> AddTratamiento
const HerdStack = createNativeStackNavigator();
const HerdStackNavigator = () => (
  <HerdStack.Navigator screenOptions={{ headerShown: false }}>
    <HerdStack.Screen name="HerdMain" component={HerdScreen} />
    <HerdStack.Screen name="AddAnimal" component={AddAnimal} />
    <HerdStack.Screen name="AddServicio" component={AddServicio} />
    <HerdStack.Screen name="NewBreeding" component={AddServicio} />
    <HerdStack.Screen name="AddDiagnostico" component={AddDiagnostico} />
    <HerdStack.Screen name="AddParto" component={AddParto} />
    <HerdStack.Screen name="NewBirth" component={AddParto} />
    <HerdStack.Screen name="AddOrdena" component={AddOrdena} />
    <HerdStack.Screen name="AddTratamiento" component={AddTratamiento} />
    <HerdStack.Screen name="NewTreatment" component={AddTratamiento} />
    <HerdStack.Screen name="AddSecado" component={AddSecado} />
    <HerdStack.Screen name="AnimalDetail" component={AnimalDetail} />
  </HerdStack.Navigator>
);

// Stack Navigator para la sección del Calendario
// Alias: NewBreeding -> AddServicio, NewBirth -> AddParto, NewTreatment -> AddTratamiento
const CalendarStack = createNativeStackNavigator();
const CalendarStackNavigator = () => (
  <CalendarStack.Navigator screenOptions={{ headerShown: false }}>
    <CalendarStack.Screen name="CalendarMain" component={CalendarScreen} />
    <CalendarStack.Screen name="AddServicio" component={AddServicio} />
    <CalendarStack.Screen name="NewBreeding" component={AddServicio} />
    <CalendarStack.Screen name="AddDiagnostico" component={AddDiagnostico} />
    <CalendarStack.Screen name="AddParto" component={AddParto} />
    <CalendarStack.Screen name="NewBirth" component={AddParto} />
    <CalendarStack.Screen name="AddTratamiento" component={AddTratamiento} />
    <CalendarStack.Screen name="NewTreatment" component={AddTratamiento} />
    <CalendarStack.Screen name="AddSecado" component={AddSecado} />
  </CalendarStack.Navigator>
);

// Stack Navigator para la sección de Perfil
const ProfileStack = createNativeStackNavigator();
const ProfileStackNavigator = () => {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen 
        name="DatabaseTest" 
        component={DatabaseTestScreen} 
        options={{ 
          title: 'Pruebas de Base de Datos',
          headerShown: true,
          headerBackTitle: 'Atrás'
        }}
      />
    </ProfileStack.Navigator>
  );
};

// Tab bar icons configuration
const getTabBarIcon = (route, focused, color, size) => {
  let iconName;

  switch (route.name) {
    case 'Inicio':
      iconName = focused ? 'home' : 'home-outline';
      break;
    case 'Hato':
      iconName = focused ? 'paw' : 'paw-outline';
      break;
    case 'Calendario':
      iconName = focused ? 'calendar' : 'calendar-outline';
      break;
    case 'KPIs':
      iconName = focused ? 'stats-chart' : 'stats-chart-outline';
      break;
    case 'Perfil':
      iconName = focused ? 'person' : 'person-outline';
      break;
    case 'Usuarios':
      iconName = focused ? 'people' : 'people-outline';
      break;
    case 'Ubicaciones':
      iconName = focused ? 'map' : 'map-outline';
      break;
    default:
      iconName = 'alert';
  }

  return <Ionicons name={iconName} size={size} color={color} />;
};

// Main App component
const App = () => {
  return (
    <DatabaseProvider>
      <SyncProvider>
        <SafeAreaProvider>
          <StatusBar barStyle="dark-content" backgroundColor="#fff" />
          <NavigationContainer>
            <Tab.Navigator
              screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => 
                  getTabBarIcon(route, focused, color, size),
                tabBarActiveTintColor: '#2ecc71',
                tabBarInactiveTintColor: '#95a5a6',
                tabBarStyle: {
                  height: Platform.OS === 'ios' ? 90 : 70,
                  paddingBottom: Platform.OS === 'ios' ? 30 : 10,
                  paddingTop: 10,
                  backgroundColor: '#fff',
                  borderTopWidth: 1,
                  borderTopColor: '#f1f2f6',
                  elevation: 5,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: -5 },
                  shadowOpacity: 0.1,
                  shadowRadius: 5,
                },
                tabBarLabelStyle: {
                  fontSize: 12,
                  marginBottom: 5,
                },
                headerShown: false,
              })}
            >
              <Tab.Screen 
                name="Inicio" 
                component={HomeScreen} 
                options={{ tabBarLabel: 'Inicio' }}
              />
              <Tab.Screen 
                name="Hato" 
                component={HerdStackNavigator} 
                options={{ tabBarLabel: 'Hato' }}
              />
              <Tab.Screen 
                name="Calendario" 
                component={CalendarStackNavigator} 
                options={{ tabBarLabel: 'Calendario' }}
              />
              <Tab.Screen 
                name="KPIs" 
                component={StatsScreen} 
                options={{ tabBarLabel: 'KPIs' }}
              />
              <Tab.Screen 
                name="Usuarios" 
                component={require('./src/screens/Users').default} 
                options={{ tabBarLabel: 'Usuarios' }}
              />
              <Tab.Screen 
                name="Ubicaciones" 
                component={LocationsScreen} 
                options={{ tabBarLabel: 'Ubicaciones' }}
              />
              <Tab.Screen 
                name="Perfil" 
                component={ProfileStackNavigator} 
                options={{ tabBarLabel: 'Perfil' }}
              />
            </Tab.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      </SyncProvider>
    </DatabaseProvider>
  );
};

export default App;
