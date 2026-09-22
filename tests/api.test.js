const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const app = require('../src/app');

let server;
let baseUrl;

test.before((t, done) => {
    // Iniciar servidor en puerto efímero para pruebas
    server = app.listen(0, '127.0.0.1', () => {
        const address = server.address();
        baseUrl = `http://127.0.0.1:${address.port}`;
        done();
    });
});

test.after((t, done) => {
    server.close(done);
});

// Helper para peticiones HTTP en pruebas nativas
function request(path, options = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, baseUrl);
        const reqOpts = {
            method: options.method || 'GET',
            headers: options.headers || {}
        };

        const req = http.request(url, reqOpts, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                let body;
                try {
                    body = JSON.parse(data);
                } catch {
                    body = data;
                }
                resolve({ status: res.statusCode, headers: res.headers, body });
            });
        });

        req.on('error', reject);

        if (options.body) {
            req.write(typeof options.body === 'object' ? JSON.stringify(options.body) : options.body);
        }
        req.end();
    });
}

test('GET /health - Debe retornar status 200 y status UP (Healthcheck Docker)', async () => {
    const res = await request('/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'UP');
    assert.ok(typeof res.body.uptime === 'number');
});

test('GET / - Debe retornar 200 y mensaje del servicio', async () => {
    const res = await request('/');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'ONLINE');
});

test('GET /api/facturas - Debe retornar lista de facturas registradas', async () => {
    const res = await request('/api/facturas');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.total >= 2);
});

test('POST /api/facturas - Debe rechazar peticiones con campos invalidos (400 Bad Request)', async () => {
    const res = await request('/api/facturas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { cliente: '' }
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error, 'Parametros invalidos');
});

test('POST /api/facturas - Debe crear una factura exitosamente (201 Created)', async () => {
    const res = await request('/api/facturas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { cliente: 'Cliente Test UNEG', monto: 199.99 }
    });
    assert.strictEqual(res.status, 201);
    assert.ok(res.body.data.id.startsWith('FAC-'));
    assert.strictEqual(res.body.data.monto, 199.99);
    assert.strictEqual(res.body.data.estado, 'PROCESADA');
});

test('GET /api/facturas/:id/pdf - Debe exportar la factura en formato application/pdf (feature/pdf-export)', async () => {
    const res = await request('/api/facturas/FAC-10001/pdf');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers['content-type'], 'application/pdf');
    assert.ok(res.headers['content-disposition'].includes('factura_FAC-10001.pdf'));
});
