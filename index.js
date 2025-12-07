// index.js (VERSIÓN FINAL OPTIMIZADA)
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
// Permitimos cualquier origen (*). Se recomienda especificar la URL de Render.
app.use(cors()); 
app.use(express.json());

// ----------------------------------------------------
// 1. CONFIGURACIÓN DE SUPABASE Y VALIDACIÓN DE ENTORNO 🛡️
// ----------------------------------------------------
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 

// 💡 CAMBIO 1: Validar que las claves existen antes de iniciar
if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Error: Las variables SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY no están configuradas.");
    console.error("Asegúrate de configurar estas variables en el Dashboard de Render.");
    // No iniciamos el servidor si faltan claves
    // Simplemente salimos, Render intentará reiniciarlo más tarde
    process.exit(1); 
}

// Creamos el cliente Supabase con la clave de servicio
const supabase = createClient(supabaseUrl, supabaseKey);

// ----------------------------------------------------
// 2. RUTAS (ENDPOINTS)
// ----------------------------------------------------

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('MiEspejo Backend is Active and connected! 🪞');
});

/**
 * OBTIENE LOS TIPOS DE HÁBITO DE UN USUARIO
 * GET /habits/:userId
 */
app.get('/habits/:userId', async (req, res) => {
  const { userId } = req.params;

  // 💡 CAMBIO 2: Validación de parámetros
  if (!userId) {
      return res.status(400).json({ error: "Falta el parámetro userId en la URL." });
  }

  try {
    const { data, error } = await supabase
      .from('habit_types')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener hábitos: ' + err.message });
  }
});

/**
 * REGISTRA UN EVENTO (CONTADOR)
 * POST /logs/event
 * Body: { userId, habitTypeId }
 */
app.post('/logs/event', async (req, res) => {
  const { userId, habitTypeId } = req.body;

  // 💡 CAMBIO 3: Validación de body
  if (!userId || !habitTypeId) {
      return res.status(400).json({ error: "Faltan userId o habitTypeId en el cuerpo de la petición." });
  }

  try {
    const { error } = await supabase
      .from('habit_logs')
      .insert({
        user_id: userId,
        habit_type_id: habitTypeId,
        fecha_inicio: new Date().toISOString(),
      });

    if (error) throw error;
    res.status(201).json({ message: 'Evento registrado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al registrar evento: ' + err.message });
  }
});

/**
 * INICIA UNA SESIÓN (CRONÓMETRO START)
 * POST /logs/session/start
 * Body: { userId, habitTypeId }
 */
app.post('/logs/session/start', async (req, res) => {
  const { userId, habitTypeId } = req.body;

  // 💡 CAMBIO 4: Validación de body
  if (!userId || !habitTypeId) {
      return res.status(400).json({ error: "Faltan userId o habitTypeId en el cuerpo de la petición." });
  }

  try {
    const { data, error } = await supabase
      .from('habit_logs')
      .insert({
        user_id: userId,
        habit_type_id: habitTypeId,
        fecha_inicio: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) throw error;
    
    res.status(201).json({ logId: data.id });
  } catch (err) {
    res.status(500).json({ error: 'Error al iniciar sesión: ' + err.message });
  }
});

/**
 * TERMINA UNA SESIÓN (CRONÓMETRO STOP)
 * PUT /logs/session/end
 * Body: { logId, durationSeconds, notas }
 */
app.put('/logs/session/end', async (req, res) => {
  const { logId, durationSeconds, notas } = req.body;

  // 💡 CAMBIO 5: Validación de body (durationSeconds puede ser 0, por eso no usamos !durationSeconds)
  if (!logId || durationSeconds === undefined) {
      return res.status(400).json({ error: "Faltan logId o durationSeconds en el cuerpo de la petición." });
  }

  try {
    const { error } = await supabase
      .from('habit_logs')
      .update({
        fecha_fin: new Date().toISOString(),
        duracion_segundos: durationSeconds,
        notas: notas
      })
      .eq('id', logId);

    if (error) throw error;
    res.json({ message: 'Sesión finalizada correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al finalizar sesión: ' + err.message });
  }
});

// ----------------------------------------------------
// 3. INICIAR SERVIDOR
// ----------------------------------------------------
app.listen(port, () => {
  console.log(`Server corriendo en el puerto ${port}`);
});