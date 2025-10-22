import { ServicioService, DiagnosticoService, PartoService, TratamientoService, SecadoService } from './DataService';
import { COLORS, EVENT_COLORS } from '../constants/colors';

/**
 * Servicio para gestionar eventos del calendario, obteniendo datos de diferentes tablas
 * y formateándolos para su visualización en el calendario
 */
export class CalendarService {
  /**
   * Obtiene todos los eventos del calendario de las diferentes tablas
   * @returns {Promise<Object>} Un objeto con fechas como claves y arrays de eventos como valores
   */
  static async getAllEvents() {
    try {
      const events = {};
      
      // Obtener eventos de diferentes tablas
      await this.addServiciosToEvents(events);
      await this.addDiagnosticosToEvents(events);
      await this.addPartosToEvents(events);
      await this.addTratamientosToEvents(events);
      await this.addSecadosToEvents(events);
      
      return events;
    } catch (error) {
      console.error('Error al obtener eventos del calendario:', error);
      throw error;
    }
  }

  /**
   * Obtiene los eventos del calendario filtrados por tipo
   * @param {string} eventType - Tipo de evento (BREEDING, DIAGNOSIS, BIRTH, TREATMENT, DRYING)
   * @returns {Promise<Object>} Un objeto con fechas como claves y arrays de eventos como valores
   */
  static async getEventsByType(eventType) {
    try {
      let events = {};
      
      switch(eventType) {
        case 'BREEDING':
          await this.addServiciosToEvents(events);
          break;
        case 'DIAGNOSIS':
          await this.addDiagnosticosToEvents(events);
          break;
        case 'BIRTH':
          await this.addPartosToEvents(events);
          break;
        case 'TREATMENT':
          await this.addTratamientosToEvents(events);
          break;
        case 'DRYING':
          await this.addSecadosToEvents(events);
          break;
        default:
          events = await this.getAllEvents();
      }
      
      return events;
    } catch (error) {
      console.error('Error al obtener eventos por tipo:', error);
      throw error;
    }
  }

  /**
   * Añade los servicios reproductivos a la colección de eventos
   */
  static async addServiciosToEvents(events) {
    try {
      const servicios = await ServicioService.getServicios();
      
      // Para cada servicio, crear un evento y agregarlo a la colección
      for (const servicio of servicios) {
        const date = this.formatDate(servicio.fecha_servicio);
        
        if (!events[date]) {
          events[date] = [];
        }
        
        // Formatea la hora desde la fecha completa (si existe)
        let time = 'Todo el día';
        if (servicio.fecha_servicio.includes('T')) {
          const timeObj = new Date(servicio.fecha_servicio);
          time = timeObj.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
        }
        
        events[date].push({
          id: servicio.id_servicio, // numeric DB ID
          eventKey: `servicio_${servicio.id_servicio || servicio.local_id}`,
          type: 'BREEDING',
          title: 'Servicio',
          description: `Animal #${servicio.id_animal} - ${servicio.tipo_servicio} - Toro: ${servicio.toro}`,
          time: time,
          dbObject: servicio
        });
      }
    } catch (error) {
      console.error('Error al obtener servicios para el calendario:', error);
    }
  }

  /**
   * Añade los diagnósticos de preñez a la colección de eventos
   */
  static async addDiagnosticosToEvents(events) {
    try {
      const diagnosticos = await DiagnosticoService.getDiagnosticos();
      
      for (const diagnostico of diagnosticos) {
        const date = this.formatDate(diagnostico.fecha_diagnostico);
        
        if (!events[date]) {
          events[date] = [];
        }
        
        // Formatea la hora desde la fecha completa (si existe)
        let time = 'Todo el día';
        if (diagnostico.fecha_diagnostico.includes('T')) {
          const timeObj = new Date(diagnostico.fecha_diagnostico);
          time = timeObj.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
        }
        
        events[date].push({
          id: diagnostico.id_diagnostico, // numeric DB ID
          eventKey: `diagnostico_${diagnostico.id_diagnostico || diagnostico.local_id}`,
          type: 'DIAGNOSIS',
          title: 'Diagnóstico',
          description: `Animal #${diagnostico.id_animal} - Resultado: ${diagnostico.resultado} - ${diagnostico.dias_post_servicio} días post-servicio`,
          time: time,
          dbObject: diagnostico
        });
      }
    } catch (error) {
      console.error('Error al obtener diagnósticos para el calendario:', error);
    }
  }

  /**
   * Añade los partos a la colección de eventos
   */
  static async addPartosToEvents(events) {
    try {
      const partos = await PartoService.getPartos();
      
      for (const parto of partos) {
        const date = this.formatDate(parto.fecha_parto);
        
        if (!events[date]) {
          events[date] = [];
        }
        
        events[date].push({
          id: parto.id_parto, // numeric DB ID
          eventKey: `parto_${parto.id_parto || parto.local_id}`,
          type: 'BIRTH',
          title: 'Parto',
          description: `Animal #${parto.id_animal} - Parto #${parto.no_parto} ${parto.problemas ? '- Con problemas' : ''}`,
          time: 'Todo el día',
          dbObject: parto
        });
      }
    } catch (error) {
      console.error('Error al obtener partos para el calendario:', error);
    }
  }

  /**
   * Añade los tratamientos a la colección de eventos
   */
  static async addTratamientosToEvents(events) {
    try {
      const tratamientos = await TratamientoService.getTratamientos();
      
      for (const tratamiento of tratamientos) {
        // Agregar evento para la fecha de inicio
        const startDate = this.formatDate(tratamiento.fecha_inicio);
        
        if (!events[startDate]) {
          events[startDate] = [];
        }
        
        // Formatea la hora desde la fecha completa (si existe)
        let time = 'Todo el día';
        if (tratamiento.fecha_inicio.includes('T')) {
          const timeObj = new Date(tratamiento.fecha_inicio);
          time = timeObj.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
        }
        
        events[startDate].push({
          id: tratamiento.id_tratamiento, // numeric DB ID
          eventKey: `tratamiento_inicio_${tratamiento.id_tratamiento || tratamiento.local_id}`,
          type: 'TREATMENT',
          title: 'Inicio Tratamiento',
          description: `Animal #${tratamiento.id_animal} - ${tratamiento.medicamento} - ${tratamiento.descripcion}`,
          time: time,
          dbObject: tratamiento
        });
        
        // Agregar evento para la fecha de fin (si existe)
        if (tratamiento.fecha_fin) {
          const endDate = this.formatDate(tratamiento.fecha_fin);
          
          if (!events[endDate]) {
            events[endDate] = [];
          }
          
          // Formatea la hora desde la fecha completa (si existe)
          let endTime = 'Todo el día';
          if (tratamiento.fecha_fin.includes('T')) {
            const timeObj = new Date(tratamiento.fecha_fin);
            endTime = timeObj.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
          }
          
          events[endDate].push({
            id: tratamiento.id_tratamiento, // numeric DB ID
            eventKey: `tratamiento_fin_${tratamiento.id_tratamiento || tratamiento.local_id}`,
            type: 'TREATMENT',
            title: 'Fin Tratamiento',
            description: `Animal #${tratamiento.id_animal} - ${tratamiento.medicamento} - ${tratamiento.descripcion}`,
            time: endTime,
            dbObject: tratamiento
          });
        }
      }
    } catch (error) {
      console.error('Error al obtener tratamientos para el calendario:', error);
    }
  }

  /**
   * Añade los secados a la colección de eventos
   */
  static async addSecadosToEvents(events) {
    try {
      const secados = await SecadoService.getSecados();
      
      for (const secado of secados) {
        // Evento para fecha planeada
        if (secado.fecha_planeada) {
          const plannedDate = this.formatDate(secado.fecha_planeada);
          
          if (!events[plannedDate]) {
            events[plannedDate] = [];
          }
          
          events[plannedDate].push({
            id: secado.id_secado, // numeric DB ID
            eventKey: `secado_planeado_${secado.id_secado || secado.local_id}`,
            type: 'DRYING',
            title: 'Secado Planeado',
            description: `Animal #${secado.id_animal}`,
            time: 'Todo el día',
            dbObject: secado
          });
        }
        
        // Evento para fecha real
        if (secado.fecha_real) {
          const realDate = this.formatDate(secado.fecha_real);
          
          if (!events[realDate]) {
            events[realDate] = [];
          }
          
          events[realDate].push({
            id: secado.id_secado, // numeric DB ID
            eventKey: `secado_real_${secado.id_secado || secado.local_id}`,
            type: 'DRYING',
            title: 'Secado Realizado',
            description: `Animal #${secado.id_animal}`,
            time: 'Todo el día',
            dbObject: secado
          });
        }
      }
    } catch (error) {
      console.error('Error al obtener secados para el calendario:', error);
    }
  }

  /**
   * Formatea una fecha en formato ISO a YYYY-MM-DD
   * @param {string} dateString - Fecha en formato ISO o YYYY-MM-DD
   * @returns {string} Fecha en formato YYYY-MM-DD
   */
  static formatDate(dateString) {
    if (!dateString) return '';
    
    // Si ya está en formato YYYY-MM-DD, devolverlo
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateString;
    }
    
    // Si es un formato ISO, convertirlo a YYYY-MM-DD
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (e) {
      console.error('Error al formatear fecha:', e);
      return '';
    }
  }
  
  /**
   * Genera un objeto con las fechas marcadas para el calendario
   * @param {Object} events - Objeto con fechas y eventos
   * @param {string} selectedDate - Fecha seleccionada
   * @returns {Object} Objeto con fechas marcadas en formato para react-native-calendars
   */
  static getMarkedDates(events, selectedDate) {
    const marked = {};
    
    // Marcar fechas con eventos
    Object.keys(events).forEach(date => {
      const eventsOnDate = events[date];
      const dots = [];
      
      // Agregar un punto para cada tipo de evento
      eventsOnDate.forEach(event => {
        const color = EVENT_COLORS[event.type];
        if (color && !dots.some(dot => dot.color === color)) {
          dots.push({ color });
        }
      });
      
      marked[date] = {
        dots,
        selected: date === selectedDate,
        selectedColor: COLORS.primary,
      };
    });
    
    // Marcar la fecha seleccionada
    if (selectedDate && !marked[selectedDate]) {
      marked[selectedDate] = { selected: true, selectedColor: COLORS.primary };
    }
    
    return marked;
  }
}
