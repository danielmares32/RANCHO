import { Platform } from 'react-native';

// Import SQLite services for native platforms
import {
  AnimalService as SQLiteAnimalService,
  ServicioService as SQLiteServicioService,
  DiagnosticoService as SQLiteDiagnosticoService,
  PartoService as SQLitePartoService,
  TratamientoService as SQLiteTratamientoService,
  SecadoService as SQLiteSecadoService,
  OrdenaService as SQLiteOrdenaService,
} from './DatabaseService';

// Import web services for web platform
import {
  WebAnimalService,
  WebServicioService,
  WebDiagnosticoService,
  WebPartoService,
  WebTratamientoService,
  WebSecadoService,
  WebOrdenaService,
} from './WebDataService';

/**
 * Platform-aware data service adapter
 * Uses SQLite on native (iOS/Android) and Supabase on web
 */

const isWeb = Platform.OS === 'web';

export const AnimalService = isWeb ? WebAnimalService : SQLiteAnimalService;
export const ServicioService = isWeb ? WebServicioService : SQLiteServicioService;
export const DiagnosticoService = isWeb ? WebDiagnosticoService : SQLiteDiagnosticoService;
export const PartoService = isWeb ? WebPartoService : SQLitePartoService;
export const TratamientoService = isWeb ? WebTratamientoService : SQLiteTratamientoService;
export const SecadoService = isWeb ? WebSecadoService : SQLiteSecadoService;
export const OrdenaService = isWeb ? WebOrdenaService : SQLiteOrdenaService;
