// backend/server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Importar las rutas de autenticación
const authRoutes = require('./routes/auth'); // Nueva línea

// Middlewares
app.use(cors());
app.use(express.json());

// Conexión a MongoDB
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/sis_fp_db';

mongoose.connect(mongoURI)
    .then(() => {
        console.log('MongoDB conectado correctamente');
    })
    .catch(err => {
        console.error('Error de conexión a MongoDB:', err.message);
        process.exit(1);
    });

// Rutas de prueba (mantener si quieres, o eliminar)
app.get('/', (req, res) => {
    res.send('¡Servidor backend de SIS-FP funcionando!');
});

// Montar las rutas de autenticación
app.use('/api', authRoutes); // Nueva línea: todas las rutas en authRoutes se prefijarán con /api

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor Express escuchando en el puerto ${PORT}`);
});