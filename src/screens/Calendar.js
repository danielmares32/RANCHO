import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import ActionSheet from 'react-native-actions-sheet';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { ServicioService, DiagnosticoService, TratamientoService, PartoService, SecadoService } from '../services/DataService';
import { COLORS, EVENT_COLORS } from '../constants/colors';
import { CalendarService } from '../services/CalendarService';
import { useIsFocused, useFocusEffect, useRoute } from '@react-navigation/native';

const eventTypes = [
  { id: 'all', name: 'Todos', icon: 'list' },
  { id: 'BREEDING', name: 'Servicios', icon: 'water-outline' },
  { id: 'DIAGNOSIS', name: 'Diagnósticos', icon: 'medical-outline' },
  { id: 'BIRTH', name: 'Partos', icon: 'gift-outline' },
  { id: 'TREATMENT', name: 'Tratamientos', icon: 'medkit-outline' },
  { id: 'DRYING', name: 'Secados', icon: 'timer-outline' },
];

export default function CalendarScreen({ navigation, route }) {
  const routeFromNavigation = useRoute();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedType, setSelectedType] = useState('all');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [events, setEvents] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const actionSheetRef = useRef(null);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  
  // Para detectar cuando la pantalla está enfocada
  const isFocused = useIsFocused();

  // Función para cargar los eventos del calendario
  const loadEvents = useCallback(async () => {
    try {
      setError(null);
      const allEvents = await CalendarService.getAllEvents();
      setEvents({}); // Clear events to force React to treat as a full replacement
      setEvents(allEvents);
      console.log('Updated events after reload:', allEvents);
    } catch (err) {
      console.error('Error cargando eventos:', err);
      setError('No se pudieron cargar los eventos. Intente nuevamente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Mostrar toast si venimos de agregar un servicio
  useEffect(() => {
    if (route.params?.serviceAdded) {
      setToastMessage('¡Servicio agregado exitosamente!');
      setShowToast(true);
      
      // Ocultar el toast después de 3 segundos
      const timer = setTimeout(() => {
        setShowToast(false);
        // Limpiar el parámetro para que no se muestre de nuevo
        navigation.setParams({ serviceAdded: false });
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [route.params?.serviceAdded]);

  // Cargar eventos al inicio y cuando la pantalla está en foco
  useFocusEffect(
    React.useCallback(() => {
      console.log('Calendar screen focused, loading events...');
      loadEvents();
      
      // Si venimos de agregar un servicio, mostrar el toast
      if (routeFromNavigation.params?.serviceAdded) {
        setToastMessage('¡Servicio agregado exitosamente!');
        setShowToast(true);
        
        // Ocultar el toast después de 3 segundos
        const timer = setTimeout(() => {
          setShowToast(false);
          // Limpiar el parámetro
          navigation.setParams({ serviceAdded: false });
        }, 3000);
        
        return () => clearTimeout(timer);
      }
      
      return () => {
        console.log('Calendar screen unfocused');
      };
    }, [loadEvents, routeFromNavigation.params?.serviceAdded])
  );
  
  // Also load events on initial mount
  useEffect(() => {
    console.log('Calendar component mounted, loading events...');
    loadEvents();
  }, [loadEvents]);

  // Función para refrescar la pantalla
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadEvents();
  }, [loadEvents]);

  // Manejar el cambio de tipo de evento
  const handleTypeChange = async (typeId) => {
    setSelectedType(typeId);
    setLoading(true);
    
    try {
      if (typeId === 'all') {
        const allEvents = await CalendarService.getAllEvents();
        setEvents(allEvents);
      } else {
        const filteredEvents = await CalendarService.getEventsByType(typeId);
        setEvents(filteredEvents);
      }
    } catch (err) {
      console.error('Error filtrando eventos:', err);
      setError('Error al filtrar los eventos');
    } finally {
      setLoading(false);
    }
  };

  // Obtener las fechas marcadas para el calendario
  const getMarkedDates = () => {
    return CalendarService.getMarkedDates(events, selectedDate);
  };

  // Obtener los eventos filtrados para la fecha seleccionada
  const getFilteredEvents = () => {
    return events[selectedDate] || [];
  };

  const renderEventType = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.eventType,
        selectedType === item.id && { backgroundColor: COLORS.primary }
      ]}
      onPress={() => handleTypeChange(item.id)}
    >
      <Ionicons 
        name={item.icon} 
        size={20} 
        color={selectedType === item.id ? 'white' : COLORS.text} 
      />
      <Text 
        style={[
          styles.eventTypeText,
          selectedType === item.id && { color: 'white' }
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const handleEventAction = (event) => {
    setSelectedEvent(event);
    actionSheetRef.current?.show();
  };

  const handleEdit = () => {
    if (!selectedEvent) return;

    console.log('Editing event (selectedEvent):', JSON.stringify(selectedEvent, null, 2));
    
    actionSheetRef.current?.hide();

    // Define the base screen name and additional params
    let screenName = '';
    // Standardize to use isEditMode for all edit screens
    let params = { isEditMode: true, onGoBack: loadEvents }; 

    // Map event types to their corresponding add screens and set appropriate ID parameter
    const screenMap = {
      'DIAGNOSIS': {
        name: 'AddDiagnostico',
        idParam: 'diagnosticoId'
      },
      'BREEDING': { // Match event type for Servicio events
        name: 'AddServicio',
        idParam: 'servicioId'
      },
      'TREATMENT': {
        name: 'AddTratamiento',
        idParam: 'tratamientoId'
      },
      'BIRTH': {
        name: 'AddParto',
        idParam: 'partoId'
      },
      'DRYING': {
        name: 'AddSecado',
        idParam: 'secadoId'
      }
    };

    const screenConfig = screenMap[selectedEvent.type];
    
    if (!screenConfig) {
      console.warn('Unknown event type for edit:', selectedEvent.type);
      return;
    }

    // Set the ID parameter dynamically based on the event type
    params[screenConfig.idParam] = selectedEvent.id;
    screenName = screenConfig.name;

    console.log(`Navigating to ${screenName} with params:`, JSON.stringify(params, null, 2));
    
    // Navigate to the screen with the parameters
    navigation.navigate(screenName, params);
  };

  const handleDelete = async () => {
    if (!selectedEvent) return;
    console.log('Attempting to delete event:', JSON.stringify(selectedEvent)); // Log event details
    actionSheetRef.current?.hide(); // Restore this line
    console.log('>>> About to call main Alert.alert'); // Log before main Alert
    // Platform-specific confirmation dialog for deletion
    if (typeof window !== 'undefined' && window.confirm) {
      // Web: use browser confirm dialog
      if (window.confirm('¿Estás seguro de que deseas eliminar este evento?')) {
        (async () => {
          try {
            switch(selectedEvent.type) {
              case 'BREEDING':
                await ServicioService.deleteServicio(selectedEvent.id);
                break;
              case 'DIAGNOSIS':
                await DiagnosticoService.deleteDiagnostico(selectedEvent.id);
                break;
              case 'TREATMENT':
                await TratamientoService.deleteTratamiento(selectedEvent.id);
                break;
              case 'BIRTH':
                await PartoService.deleteParto(selectedEvent.id);
                break;
              case 'DRYING':
                await SecadoService.deleteSecado(selectedEvent.id);
                break;
              default:
                console.warn('Unknown event type for delete:', selectedEvent.type);
                break;
            }
            await loadEvents();
            setSelectedDate(selectedDate); // Force calendar refresh on all platforms
            setSelectedEvent(null); // Clear selected event after deletion
            setToastMessage('Evento eliminado correctamente');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
          } catch (error) {
            console.error('Error al eliminar el evento:', error);
            window.alert('No se pudo eliminar el evento. Intente nuevamente.');
          }
        })();
      }
    } else {
      // Native: use Alert.alert
      Alert.alert(
        'Eliminar evento',
        '¿Estás seguro de que deseas eliminar este evento?',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: async () => {
              try {
                switch(selectedEvent.type) {
                  case 'BREEDING':
                    await ServicioService.deleteServicio(selectedEvent.id);
                    break;
                  case 'DIAGNOSIS':
                    await DiagnosticoService.deleteDiagnostico(selectedEvent.id);
                    break;
                  case 'TREATMENT':
                    await TratamientoService.deleteTratamiento(selectedEvent.id);
                    break;
                  case 'BIRTH':
                    await PartoService.deleteParto(selectedEvent.id);
                    break;
                  case 'DRYING':
                    await SecadoService.deleteSecado(selectedEvent.id);
                    break;
                  default:
                    console.warn('Unknown event type for delete:', selectedEvent.type);
                    break;
                }
                await loadEvents();
                setSelectedDate(selectedDate); // Force calendar refresh on all platforms
                setSelectedEvent(null); // Clear selected event after deletion
                setToastMessage('Evento eliminado correctamente');
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
              } catch (error) {
                console.error('Error al eliminar el evento:', error);
                Alert.alert('Error', 'No se pudo eliminar el evento. Intente nuevamente.');
              }
            },
          },
        ],
        { cancelable: true }
      );
    }
    console.log('>>> After calling main Alert.alert'); // Log after main Alert
  };

  // Helper functions for event rendering
  const getIconForEventType = (type) => {
    const eventType = eventTypes.find(et => et.id === type);
    return eventType ? eventType.icon : 'calendar-outline';
  };

  const getEventTypeName = (type) => {
    switch(type) {
      case 'BREEDING': return 'Servicio';
      case 'DIAGNOSIS': return 'Diagnóstico';
      case 'BIRTH': return 'Parto';
      case 'TREATMENT': return 'Tratamiento';
      case 'DRYING': return 'Secado';
      default: return 'Evento';
    }
  };

  const renderEventItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.eventCard}
      onPress={() => handleEventAction(item)}
    >
      <View style={[styles.eventColorIndicator, { backgroundColor: EVENT_COLORS[item.type] || COLORS.primary }]} />
      <View style={styles.eventContent}>
        <View style={styles.eventHeader}>
          <Text style={styles.eventTitle}>{item.title}</Text>
          <View style={styles.timeChip}>
            <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} style={styles.timeIcon} />
            <Text style={styles.eventTime}>{item.time}</Text>
          </View>
        </View>
        <Text style={styles.eventDescription} numberOfLines={2}>{item.description}</Text>
        
        <View style={styles.eventFooter}>
          <View style={styles.eventTypeChip}>
            <Ionicons 
              name={getIconForEventType(item.type)} 
              size={14} 
              color={EVENT_COLORS[item.type] || COLORS.primary} 
            />
            <Text style={[styles.eventTypeText, { color: EVENT_COLORS[item.type] || COLORS.primary }]}>
              {getEventTypeName(item.type)}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.moreButton}
            onPress={() => handleEventAction(item)}
          >
            <Ionicons name="ellipsis-horizontal" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderActionSheet = () => (
    <ActionSheet
      ref={actionSheetRef}
      containerStyle={styles.actionSheetContainer}
    >
      <View style={styles.actionSheetContent}>
        <TouchableOpacity 
          style={styles.actionSheetButton}
          onPress={handleEdit}
        >
          <Ionicons name="pencil" size={24} color={COLORS.primary} />
          <Text style={[styles.actionSheetText, { color: COLORS.primary }]}>
            Editar
          </Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity 
          style={styles.actionSheetButton}
          onPress={handleDelete}
        >
          <Ionicons name="trash" size={24} color={COLORS.danger} />
          <Text style={[styles.actionSheetText, { color: COLORS.danger }]}>
            Eliminar
          </Text>
        </TouchableOpacity>
      </View>
    </ActionSheet>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Toast Notification */}
      {showToast && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
      {/* Calendar */}
      <View style={styles.calendarContainer}>
        {loading && events && Object.keys(events).length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Cargando eventos...</Text>
          </View>
        ) : (
          <Calendar
            current={`${year}-${month < 10 ? '0' + month : month}`}
            onMonthChange={(date) => {
              setMonth(date.month);
              setYear(date.year);
            }}
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markingType={'multi-dot'}
            markedDates={getMarkedDates()}
            theme={{
              todayTextColor: COLORS.primary,
              arrowColor: COLORS.primary,
            }}
          />
        )}
      </View>
      
      <View style={styles.filterContainer}>
        <FlatList
          data={eventTypes}
          renderItem={renderEventType}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
        />
      </View>
      
      <View style={styles.eventsContainer}>
        <Text style={styles.dateHeader}>
          {new Date(selectedDate).toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </Text>
        
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadEvents}>
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={getFilteredEvents()}
            renderItem={renderEventItem}
            keyExtractor={item => item.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
            ListEmptyComponent={
              loading ? (
                <ActivityIndicator style={{marginTop: 20}} size="large" color={COLORS.primary} />
              ) : (
                <Text style={styles.emptyText}>No hay eventos para esta fecha</Text>
              )
            }
            contentContainerStyle={styles.eventsList}
          />
        )}
      </View>
      
      {/* Botón flotante para agregar nuevo evento */}
      <View style={styles.fabContainer}>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            // Navegar al formulario correspondiente usando el stack del calendario
            if (selectedType === 'all' || selectedType === 'BREEDING') {
              navigation.navigate('NewBreeding', { 
                onGoBack: loadEvents, 
                initialDate: selectedDate 
              });
            } else if (selectedType === 'DIAGNOSIS') {
              navigation.navigate('AddDiagnostico', { 
                onGoBack: loadEvents,
                initialDate: selectedDate
              });
            } else if (selectedType === 'BIRTH') {
              navigation.navigate('NewBirth', { 
                onGoBack: loadEvents,
                initialDate: selectedDate
              });
            } else if (selectedType === 'TREATMENT') {
              navigation.navigate('NewTreatment', { 
                onGoBack: loadEvents,
                initialDate: selectedDate
              });
            } else if (selectedType === 'DRYING') {
              navigation.navigate('AddSecado', { 
                onGoBack: loadEvents,
                initialDate: selectedDate
              });
            }
          }}
        >
          <Ionicons name="add" size={24} color="white" />
          <Text style={styles.addButtonText}>
            {selectedType === 'all' ? 'Nuevo Evento' :
             selectedType === 'BREEDING' ? 'Nuevo Servicio' :
             selectedType === 'DIAGNOSIS' ? 'Nuevo Diagnóstico' :
             selectedType === 'BIRTH' ? 'Nuevo Parto' :
             selectedType === 'TREATMENT' ? 'Nuevo Tratamiento' :
             selectedType === 'DRYING' ? 'Nuevo Secado' : 'Nuevo Evento'}
          </Text>
        </TouchableOpacity>
      </View>
      {renderActionSheet()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Container and Layout
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 16,
    backgroundColor: COLORS.primary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  
  // Calendar Section
  calendarContainer: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
    margin: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 200,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.text,
  },
  
  // Event Types Filter
  filterContainer: {
    paddingHorizontal: 10,
    marginVertical: 10,
  },
  eventType: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
  },
  eventTypeText: {
    marginLeft: 5,
    fontSize: 14,
    color: COLORS.text,
  },
  
  // Events List Section
  eventsContainer: {
    flex: 1,
    paddingHorizontal: 10,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginVertical: 10,
    textTransform: 'capitalize',
  },
  eventsList: {
    paddingBottom: 80, // Space for the add button
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  
  // Enhanced Event Card Styles
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  eventColorIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 4,
    height: '100%',
  },
  eventContent: {
    padding: 16,
    paddingLeft: 20, // Extra padding to account for the color indicator
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
    letterSpacing: -0.3,
    lineHeight: 20,
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timeIcon: {
    marginRight: 4,
  },
  eventTime: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  eventDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  eventTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  moreButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  
  // Error Handling
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  
  // Action Sheet
  actionSheetContainer: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 12,
  },
  actionSheetContent: {
    padding: 24,
  },
  actionSheetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  actionSheetText: {
    fontSize: 16,
    marginLeft: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 5,
  },
  
  // Floating Action Button
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  addButtonText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '500',
  },
  
  // Toast Notification
  toastContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: COLORS.success,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  toastText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});