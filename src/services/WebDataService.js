import supabase from '../config/supabase';

/**
 * WebDataService - Direct Supabase access for web platform (no SQLite)
 * This service bypasses local SQLite and connects directly to Supabase
 */

export class WebAnimalService {
  static async getAnimales() {
    try {
      const { data, error } = await supabase
        .from('animales')
        .select('*')
        .order('id_interno', { ascending: true });

      if (error) throw error;

      // Map Supabase response to match SQLite structure
      return data.map(animal => ({
        id_animal: animal.id_animal,
        nombre: animal.nombre,
        id_siniiga: animal.id_siniiga,
        id_interno: animal.id_interno,
        raza: animal.raza,
        fecha_nacimiento: animal.fecha_nacimiento,
        sexo: animal.sexo,
        estado_fisiologico: animal.estado_fisiologico,
        estatus: animal.estatus,
        photo: animal.photo,
        location: animal.location,
        sync_status: 'synced',
      }));
    } catch (error) {
      console.error('WebAnimalService: Error getting animales:', error);
      return [];
    }
  }

  static async insertAnimal(animal) {
    const { nombre, id_siniiga, id_interno, raza, fecha_nacimiento, sexo, estado_fisiologico, estatus, photo, location } = animal;

    if (!id_interno || id_interno.trim() === '') {
      throw new Error('El ID interno es obligatorio.');
    }

    try {
      const { data, error } = await supabase
        .from('animales')
        .insert({
          nombre: nombre || null,
          id_siniiga: id_siniiga || null,
          id_interno,
          raza: raza || null,
          fecha_nacimiento: fecha_nacimiento || null,
          sexo: sexo || 'Hembra',
          estado_fisiologico: estado_fisiologico || null,
          estatus: estatus || 'Activa',
          photo: photo || null,
          location: location || null,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new Error(`Ya existe un animal con el ID interno: ${id_interno}.`);
        }
        throw error;
      }

      return data.id_animal;
    } catch (error) {
      console.error('WebAnimalService: Error inserting animal:', error);
      throw error;
    }
  }

  static async getAnimalById(id_animal) {
    try {
      const { data, error } = await supabase
        .from('animales')
        .select('*')
        .eq('id_animal', id_animal)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`WebAnimalService: Error getting animal by ID ${id_animal}:`, error);
      return null;
    }
  }

  static async updateAnimal(animalData) {
    const { id_animal, nombre, id_siniiga, id_interno, raza, fecha_nacimiento, sexo, estado_fisiologico, estatus, photo, location } = animalData;

    if (!id_animal) throw new Error('ID del animal es requerido para actualizar.');
    if (!id_interno || id_interno.trim() === '') throw new Error('El ID interno es obligatorio.');

    try {
      const { error } = await supabase
        .from('animales')
        .update({
          nombre: nombre || null,
          id_siniiga: id_siniiga || null,
          id_interno,
          raza: raza || null,
          fecha_nacimiento: fecha_nacimiento || null,
          sexo: sexo || 'Hembra',
          estado_fisiologico: estado_fisiologico || null,
          estatus: estatus || 'Activa',
          photo: photo || null,
          location: location || null,
        })
        .eq('id_animal', id_animal);

      if (error) {
        if (error.code === '23505') {
          throw new Error(`Ya existe otro animal con el ID interno: ${id_interno}.`);
        }
        throw error;
      }

      return 1; // Number of rows affected
    } catch (error) {
      console.error('WebAnimalService: Error updating animal:', error);
      throw error;
    }
  }

  static async deleteAnimal(id_animal) {
    try {
      const { error } = await supabase
        .from('animales')
        .delete()
        .eq('id_animal', id_animal);

      if (error) throw error;
      return 1;
    } catch (error) {
      console.error(`WebAnimalService: Error deleting animal ${id_animal}:`, error);
      throw error;
    }
  }

  static async getPendingSyncAnimales() {
    // On web, everything is already synced
    return [];
  }

  static async markAsSynced(id_animal) {
    // No-op on web
    return;
  }
}

export class WebServicioService {
  static async getServicios() {
    try {
      const { data, error } = await supabase
        .from('servicios')
        .select('*');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('WebServicioService: Error getting servicios:', error);
      return [];
    }
  }

  static async insertServicio(servicio) {
    const { id_animal, fecha_servicio, tipo_servicio, toro, notas } = servicio;

    if (!id_animal) throw new Error('El ID del animal es obligatorio.');

    try {
      const { data, error } = await supabase
        .from('servicios')
        .insert({
          id_animal,
          fecha_servicio: fecha_servicio || null,
          tipo_servicio: tipo_servicio || null,
          toro: toro || null,
          notas: notas || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data.id_servicio;
    } catch (error) {
      console.error('WebServicioService: Error inserting servicio:', error);
      throw error;
    }
  }
}

export class WebDiagnosticoService {
  static async getDiagnosticos() {
    try {
      const { data, error } = await supabase
        .from('diagnosticos')
        .select('*');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('WebDiagnosticoService: Error getting diagnosticos:', error);
      return [];
    }
  }

  static async insertDiagnostico(diagnostico) {
    const { id_animal, fecha_diagnostico, resultado, dias_post_servicio, notas } = diagnostico;

    if (!id_animal) throw new Error('El ID del animal es obligatorio.');

    try {
      const { data, error } = await supabase
        .from('diagnosticos')
        .insert({
          id_animal,
          fecha_diagnostico: fecha_diagnostico || null,
          resultado: resultado || null,
          dias_post_servicio: dias_post_servicio || null,
          notas: notas || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data.id_diagnostico;
    } catch (error) {
      console.error('WebDiagnosticoService: Error inserting diagnostico:', error);
      throw error;
    }
  }
}

export class WebPartoService {
  static async getPartos() {
    try {
      const { data, error } = await supabase
        .from('partos')
        .select('*');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('WebPartoService: Error getting partos:', error);
      return [];
    }
  }

  static async insertParto(parto) {
    const { id_animal, fecha_parto, no_parto, problemas, dias_abiertos } = parto;

    if (!id_animal) throw new Error('El ID del animal es obligatorio.');

    try {
      const { data, error } = await supabase
        .from('partos')
        .insert({
          id_animal,
          fecha_parto: fecha_parto || null,
          no_parto: no_parto || null,
          problemas: problemas || null,
          dias_abiertos: dias_abiertos || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data.id_parto;
    } catch (error) {
      console.error('WebPartoService: Error inserting parto:', error);
      throw error;
    }
  }
}

export class WebTratamientoService {
  static async getTratamientos() {
    try {
      const { data, error } = await supabase
        .from('tratamientos')
        .select('*');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('WebTratamientoService: Error getting tratamientos:', error);
      return [];
    }
  }

  static async insertTratamiento(tratamiento) {
    const { id_animal, fecha_inicio, fecha_fin, descripcion, medicamento, dosis, frecuencia, notas } = tratamiento;

    if (!id_animal) throw new Error('El ID del animal es obligatorio.');

    try {
      const { data, error } = await supabase
        .from('tratamientos')
        .insert({
          id_animal,
          fecha_inicio: fecha_inicio || null,
          fecha_fin: fecha_fin || null,
          descripcion: descripcion || null,
          medicamento: medicamento || null,
          dosis: dosis || null,
          frecuencia: frecuencia || null,
          notas: notas || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data.id_tratamiento;
    } catch (error) {
      console.error('WebTratamientoService: Error inserting tratamiento:', error);
      throw error;
    }
  }
}

export class WebSecadoService {
  static async getSecados() {
    try {
      const { data, error } = await supabase
        .from('secados')
        .select('*');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('WebSecadoService: Error getting secados:', error);
      return [];
    }
  }

  static async insertSecado(secado) {
    const { id_animal, fecha_planeada, fecha_real, motivo, notas } = secado;

    if (!id_animal) throw new Error('El ID del animal es obligatorio.');

    try {
      const { data, error } = await supabase
        .from('secados')
        .insert({
          id_animal,
          fecha_planeada: fecha_planeada || null,
          fecha_real: fecha_real || null,
          motivo: motivo || null,
          notas: notas || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data.id_secado;
    } catch (error) {
      console.error('WebSecadoService: Error inserting secado:', error);
      throw error;
    }
  }
}

export class WebOrdenaService {
  static async getOrdenas() {
    try {
      const { data, error } = await supabase
        .from('ordenas')
        .select('*');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('WebOrdenaService: Error getting ordenas:', error);
      return [];
    }
  }

  static async insertOrdena(ordena) {
    const { id_animal, fecha_ordena, litros_am, litros_pm, total_litros, dias_en_leche } = ordena;

    if (!id_animal) throw new Error('El ID del animal es obligatorio.');

    try {
      const { data, error } = await supabase
        .from('ordenas')
        .insert({
          id_animal,
          fecha_ordena: fecha_ordena || null,
          litros_am: litros_am || null,
          litros_pm: litros_pm || null,
          total_litros: total_litros || null,
          dias_en_leche: dias_en_leche || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data.id_ordena;
    } catch (error) {
      console.error('WebOrdenaService: Error inserting ordena:', error);
      throw error;
    }
  }
}
