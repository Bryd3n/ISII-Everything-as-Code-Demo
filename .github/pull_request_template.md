## 📋 Descripción del Cambio
<!-- Explique de manera clara y concisa el propósito de este Pull Request -->
Implementación de la funcionalidad de **Exportación de Facturas a PDF** solicitada en el módulo de facturación del SaaS.

* **Tipo de cambio:**
  - [x] Nueva funcionalidad (`feature`)
  - [ ] Corrección de error crítico (`hotfix`)
  - [ ] Refactorización / Mantenimiento
  - [ ] Ajuste de infraestructura / CI/CD

---

## 🎯 Impacto en la Arquitectura y el Sistema
<!-- Describa cómo afecta este cambio a otros módulos, endpoints o dependencias -->
* Incorpora el endpoint `GET /api/facturas/:id/pdf` para la generación y descarga determinista de comprobantes en PDF.
* No altera el esquema de base de datos ni los endpoints existentes de facturación (`GET /api/facturas` y `POST /api/facturas`).
* Respeta la paridad de entornos de ejecución y se ejecuta bajo el usuario no root `USER node` dentro del contenedor Docker.

---

## ✅ Checklist de Revisión de Calidad y Seguridad (Quality Gates)
<!-- Marque las casillas que apliquen tras verificar la solución -->
- [x] **Pruebas Automatizadas:** Se agregaron pruebas unitarias para validar la ruta de exportación y pasan con éxito (`npm test`).
- [x] **Seguridad de Dependencias:** Se auditó la librería de generación de PDF mediante `npm audit --audit-level=high` (0 vulnerabilidades críticas detectadas).
- [x] **Contenedorización Inmutable:** La imagen de Docker compila limpiamente sin advertencias de privilegios root (`docker build`).
- [x] **Línea Base Pura:** No se incluyen archivos volátiles, dependencias locales (`node_modules`) ni credenciales (`.env`).
- [x] **Documentación Actualizada:** Se documentó el endpoint y su contrato en el `README.md`.
