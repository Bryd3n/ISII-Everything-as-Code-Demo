/**
 * Servidor Web API - Microservicio de Facturación
 * Archivo principal de ejecución (Entrypoint)
 * Escucha en puerto 8080 (según especificación del Ejercicio 2)
 */

const app = require('./src/app');

const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
    console.log(`[BOOT] Servidor iniciado exitosamente en http://${HOST}:${PORT}`);
    console.log(`[ENV] Modo de ejecucion: ${process.env.NODE_ENV || 'development'}`);
});

// Manejo graceful shutdown ante señales de Docker / Kubernetes
const handleShutdown = (signal) => {
    console.log(`[SHUTDOWN] Señal ${signal} recibida. Finalizando conexiones...`);
    server.close(() => {
        console.log('[SHUTDOWN] Servidor cerrado ordenadamente.');
        process.exit(0);
    });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
