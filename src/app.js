const express = require('express');
const facturasRouter = require('./routes/facturas');

const app = express();

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

// Endpoint raíz informativo
app.get('/', (req, res) => {
    res.json({
        service: 'SaaS Facturacion & Gestion API',
        version: '1.0.0',
        architecture: 'Everything as Code (Docker + Node.js)',
        status: 'ONLINE'
    });
});

// Rutas de negocio
app.use('/api/facturas', facturasRouter);

// Manejo de rutas inexistentes (404)
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint no encontrado' });
});

module.exports = app;
