require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Configuración de la base de datos
const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'fogel',
    database: process.env.DB_NAME || 'to_lis',
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0
});

// Verificar conexión a la base de datos
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conexión a la base de datos establecida.');
        connection.release();
    } catch (err) {
        console.error('❌ Error al conectar a la base de datos:', err);
        process.exit(1);
    }
})();

// =================== Rutas para Grados ===================

// Obtener todos los grados con el nombre del profesor
app.get('/grados', async (req, res) => {
    try {
        // Realizar un JOIN entre la tabla grados y profesor
        const [rows] = await pool.query(`
            SELECT grados.id, grados.nombre, grados.grado, profesor.nombre AS profesor_nombre
            FROM grados
            LEFT JOIN profesor ON grados.profesor_id = profesor.id
        `);
        
        res.json(rows);  // Devolver los grados con el nombre del profesor
    } catch (error) {
        console.error('❌ Error al obtener grados:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Agregar un nuevo grado
app.post('/grados', async (req, res) => {
    const { nombre } = req.body;

    if (!nombre) {
        return res.status(400).json({ error: 'El nombre es obligatorio' });
    }

    try {
        const [result] = await pool.query('INSERT INTO grados (nombre) VALUES (?)', [nombre]);
        res.status(201).json({ id: result.insertId, nombre });
    } catch (error) {
        console.error('❌ Error al agregar grado:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// =================== Rutas para Profesor ===================

// Obtener todos los profesores
app.get('/profesores', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM profesor');
        res.json(rows);
    } catch (error) {
        console.error('❌ Error al obtener profesores:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Agregar un nuevo profesor
app.post('/profesores', async (req, res) => {
    const { nombre } = req.body;

    if (!nombre) {
        return res.status(400).json({ error: 'El nombre es obligatorio' });
    }

    try {
        const [result] = await pool.query('INSERT INTO profesor (nombre) VALUES (?)', [nombre]);
        res.status(201).json({ id: result.insertId, nombre });
    } catch (error) {
        console.error('❌ Error al agregar profesor:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// =================== Rutas para Tareas ===================

// Obtener todas las tareas
app.get('/tareas', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM tasks');
        res.json(rows);
    } catch (error) {
        console.error('❌ Error al obtener tareas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Agregar una nueva tarea
app.post('/tareas', async (req, res) => {
    const { titulo, descripcion, grado_id } = req.body;

    if (!titulo || !descripcion || !grado_id) {
        return res.status(400).json({ error: 'Título, descripción y grado_id son obligatorios' });
    }

    try {
        const [result] = await pool.query('INSERT INTO tasks (titulo, descripcion, grado_id) VALUES (?, ?, ?)', 
        [titulo, descripcion, grado_id]);
        res.status(201).json({ id: result.insertId, titulo, descripcion, grado_id });
    } catch (error) {
        console.error('❌ Error al agregar tarea:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${port}`);
});
