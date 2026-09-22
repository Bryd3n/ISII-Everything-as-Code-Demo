/**
 * Servidor Web API - Demostración SCM & Everything as Code
 * Asignatura: Ingeniería de Software II (UNEG)
 * Unidad V: Gestión de Configuración, Versionamiento y DevOps
 * Integrante 4: Brayan
 */

const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// Endpoint de verificación de salud (Healthcheck para Docker / Kubernetes)
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'UP',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Endpoint principal
app.get('/', (req, res) => {
    res.json({
        message: 'API de Demostración - Microservicio Node.js en Docker',
        version: '1.0.0',
        author: 'Brayan - Integrante 4 (Ingeniería de Software II)',
        status: 'Contenedor ejecutándose de forma reproducible en puerto ' + PORT
    });
});

// Simulación de endpoint de negocio (Facturación)
app.post('/api/facturas', (req, res) => {
    const { cliente, monto } = req.body;
    if (!cliente || !monto) {
        return res.status(400).json({ error: 'Campos requeridos: cliente y monto' });
    }
    res.status(201).json({
        id: 'FAC-' + Math.floor(Math.random() * 90000 + 10000),
        cliente,
        monto,
        fecha: new Date().toISOString(),
        estado: 'PROCESADA'
    });
});

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[INIT] Servidor escuchando en http://0.0.0.0:${PORT}`);
    console.log(`[INFO] Proceso ejecutándose con UID: ${process.getuid ? process.getuid() : 'N/A'}`);
});

// Cierre graceful ante señales del contenedor (SIGTERM / SIGINT)
process.on('SIGTERM', () => {
    console.log('[SHUTDOWN] Señal SIGTERM recibida. Cerrando conexiones...');
    server.close(() => {
        console.log('[SHUTDOWN] Servidor cerrado limpiamente.');
        process.exit(0);
    });
});
