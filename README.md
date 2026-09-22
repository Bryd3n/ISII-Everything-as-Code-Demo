# ⚡ SaaS Billing API - Microservicio Node.js
[![CI & Quality Gates](https://github.com/Bryd3n/ISII-Everything-as-Code-Demo/actions/workflows/ci.yml/badge.svg)](https://github.com/Bryd3n/ISII-Everything-as-Code-Demo/actions/workflows/ci.yml)
![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)
![Docker](https://img.shields.io/badge/docker-alpine3.20-blue)
![Architecture](https://img.shields.io/badge/architecture-Everything%20as%20Code-orange)

Microservicio de facturación y gestión desarrollado bajo el paradigma de **Everything as Code (EaC)**, **Infraestructura Inmutable** y **Gestión de Configuración Moderna (SCM)**.

---

## 🏛️ 1. Estructura del Repositorio

El proyecto sigue una arquitectura desacoplada y modular:

```text
├── .github/
│   └── workflows/
│       └── ci.yml             # Pipeline de Integración Continua (3 Quality Gates)
├── src/
│   ├── app.js                 # Configuración del servidor Express y middlewares
│   └── routes/
│       └── facturas.js        # Enrutador y controladores del módulo de facturación
├── tests/
│   └── api.test.js            # Pruebas automatizadas (Test Runner nativo de Node.js)
├── .dockerignore              # Exclusión de artefactos en el build del contenedor
├── .gitignore                 # Filtro de pureza para la línea base del repositorio
├── docker-compose.yml         # Orquestación declarativa multicapa y red virtual
├── Dockerfile                 # Especificación inmutable y determinista del runtime
├── package.json               # Metadatos del proyecto y scripts de ejecución
├── package-lock.json          # Fijación determinista del árbol de dependencias
├── README.md                  # Documentación técnica de la solución
└── server.js                  # Entrypoint principal (puerto 8080) con graceful shutdown
```

---

## 🐳 2. Infraestructura como Código y Eliminación de la Deriva

La solución erradica el problema de la **deriva de configuración** (*Configuration Drift*) y el síndrome *"en mi máquina sí funciona"* mediante la inmutabilidad de contenedores:

1. **Imagen Base Inmutable:** Se fija `node:20.17.0-alpine3.20` para evitar que actualizaciones externas alteren el comportamiento del software en futuras construcciones.
2. **Caché de Capas (BuildKit):** Se copian primero los manifiestos `package*.json` antes del código fuente, acelerando drásticamente los pipelines de CI.
3. **Instalación Determinista:** Se emplea `npm ci --only=production`, garantizando la instalación limpia y exacta del lockfile sin dependencias innecesarias de desarrollo.
4. **Seguridad DevSecOps:** Se aplica el principio de menor privilegio ejecutando bajo el usuario no root `USER node`.
5. **Paridad de Entornos (Dev/Prod Parity):** El desarrollador ejecuta en su máquina local el mismo binario sellado criptográficamente que se ejecuta en producción.

---

## ⚙️ 3. Pipeline de CI y Quality Gates

El flujo de trabajo en [`.github/workflows/ci.yml`](.github/workflows/ci.yml) implementa tres barreras de calidad automáticas antes de admitir cualquier cambio en la rama `main`:

* **Gate 1 - Pruebas Automatizadas:** `npm test` ejecuta la suite de pruebas unitarias sobre endpoints de salud y lógica de negocio.
* **Gate 2 - Auditoría de Dependencias:** `npm audit --audit-level=high` escanea vulnerabilidades conocidas en la cadena de suministro.
* **Gate 3 - Validación de Construcción Docker:** Compilación estricta del contenedor asegurando que la imagen se ensambla sin errores.

---

## 📡 4. Especificación de la API

| Método | Endpoint | Descripción | Código Éxito |
| :--- | :--- | :--- | :---: |
| `GET` | `/health` | Healthcheck activo para Docker / Kubernetes | `200 OK` |
| `GET` | `/` | Información del servicio y estado operativo | `200 OK` |
| `GET` | `/api/facturas` | Obtiene el listado de facturas emitidas | `200 OK` |
| `POST` | `/api/facturas` | Procesa y emite una nueva factura | `201 Created` |

### Ejemplo de Petición (Emisión de Factura):
```bash
curl -X POST http://localhost:8080/api/facturas \
  -H "Content-Type: application/json" \
  -d '{"cliente": "Clinica Veterinaria San Francisco", "monto": 250.00}'
```

---

## 🚀 5. Instrucciones de Ejecución

### Con Docker Compose (Recomendado):
```bash
# Iniciar contenedor en segundo plano con reconstrucción
docker compose up -d --build

# Ver logs en vivo
docker compose logs -f

# Detener el contenedor
docker compose down
```

### Con Docker CLI:
```bash
# Construir la imagen
docker build -t isii-facturacion-app:1.0.0 .

# Ejecutar mapeando el puerto 8080
docker run -d --name isii_facturacion -p 8080:8080 isii-facturacion-app:1.0.0
```

### Ejecución Local para Desarrollo:
```bash
npm install
npm test
npm start
```
