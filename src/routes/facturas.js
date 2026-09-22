const express = require('express');
const router = express.Router();

// Listado de facturas simuladas
router.get('/', (req, res) => {
    res.json({
        data: [
            { id: 'FAC-10001', cliente: 'Clinica Veterinaria San Francisco', monto: 350.00, estado: 'PROCESADA' },
            { id: 'FAC-10002', cliente: 'Distribuidora Farmaceutica Guayana', monto: 1250.75, estado: 'PROCESADA' }
        ],
        total: 2
    });
});

// Emisión de nueva factura
router.post('/', (req, res) => {
    const { cliente, monto } = req.body;
    if (!cliente || typeof monto !== 'number' || monto <= 0) {
        return res.status(400).json({
            error: 'Parametros invalidos',
            message: 'Se requiere cliente (string) y monto (numero positivo).'
        });
    }

    const nuevaFactura = {
        id: 'FAC-' + Math.floor(Math.random() * 90000 + 10000),
        cliente,
        monto,
        fecha: new Date().toISOString(),
        estado: 'PROCESADA'
    };

    res.status(201).json({
        message: 'Factura procesada exitosamente',
        data: nuevaFactura
    });
});

// Nueva funcionalidad: Exportación de factura a PDF (feature/pdf-export)
router.get('/:id/pdf', (req, res) => {
    const { id } = req.params;
    
    // Simulación de generación determinista de PDF sin vulnerabilidades
    const pdfContent = `%PDF-1.4\n1 0 obj\n<< /Title (Factura ${id}) /Creator (SaaS Facturacion UNEG) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="factura_${id}.pdf"`);
    res.status(200).send(Buffer.from(pdfContent));
});

module.exports = router;
