# ⚡ SaaS Billing API - Microservicio de Facturación
[![CI & Quality Gates](https://github.com/Bryd3n/ISII-Everything-as-Code-Demo/actions/workflows/ci.yml/badge.svg)](https://github.com/Bryd3n/ISII-Everything-as-Code-Demo/actions/workflows/ci.yml)
![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)
![Docker](https://img.shields.io/badge/docker-alpine3.20-blue)
![Architecture](https://img.shields.io/badge/architecture-Everything%20as%20Code-orange)

### Universidad Nacional Experimental de Guayana (UNEG)
**Asignatura:** Ingeniería de Software II  
**Profesor:** Mg. Félix Márquez  
**Unidad V:** Gestión de Configuración, Versionamiento y DevOps  
**Equipo:** *Ingenio y Código*  

---

## 👥 Integrantes del Equipo
* **Rhixeidys Aguilera** — V-30.851.503
* **Yonkeiner Bravo** — V-30.994.057
* **Brayan Carreño** — V-32.015.527
* **Nicole García** — V-30.809.865

---

## 📌 1. Repositorio Oficial del Proyecto (Evidencia Práctica)
Este repositorio representa la **evidencia técnica oficial del equipo** para la evaluación de la Unidad V, dando cumplimiento al requerimiento del profesor Félix Márquez:
> *«...colocar Producto V donde allí colocar la dirección del repositorio del proyecto en el cual realizaron su evaluación...»*

Integra en una arquitectura real:
1. **Flujo de Ramificación y Control de Cambios Moderno (Pregunta 1):** Rama principal `main`, rama de funcionalidad `feature/pdf-export`, plantilla de Pull Request y 3 Quality Gates automáticos.
2. **Everything as Code e Inmutabilidad (Ejercicio 2):** Microservicio Node.js en puerto 8080 empaquetado bajo un `Dockerfile` inmutable que elimina la **deriva de configuración** (*Configuration Drift*).
3. **Orquestación Declarativa y SCM Moderna (Pregunta 4):** Manifiestos versionados `.gitignore`, `Dockerfile`, `.github/workflows/ci.yml` y `docker-compose.yml`.

---

## 🏛️ 2. Estructura del Repositorio

```text
├── .github/
│   ├── pull_request_template.md # Plantilla formal de Pull Request para el equipo
│   └── workflows/
│       └── ci.yml             # Pipeline CI (3 Quality Gates automatizados)
├── src/
│   ├── app.js                 # Configuración de Express, middlewares y healthcheck
│   └── routes/
│       └── facturas.js        # Enrutador y endpoints del módulo de facturación
├── tests/
│   └── api.test.js            # 5 pruebas unitarias nativas (healthcheck, 200, 201, 400)
├── .dockerignore              # Exclusión estricta de node_modules, tests y configs
├── .gitignore                 # Filtro de pureza para la línea base de Git
├── docker-compose.yml         # Orquestación declarativa multicapa y red virtual
├── Dockerfile                 # Especificación inmutable y determinista del runtime
├── package.json               # Metadatos del proyecto y scripts de ejecución
├── package-lock.json          # Árbol determinista de dependencias fijadas
├── README.md                  # Documentación técnica general de la solución
└── server.js                  # Entrypoint principal (puerto 8080) con graceful shutdown
```

---

## 🐳 3. Infraestructura como Código y Eliminación de la Deriva

La solución erradica el problema de la **deriva de configuración** (*Configuration Drift*) y el síndrome *"en mi máquina sí funciona"* mediante la inmutabilidad de contenedores:

1. **Imagen Base Inmutable:** Se fija `node:20.17.0-alpine3.20` para evitar que actualizaciones externas alteren el comportamiento del software en futuras construcciones.
2. **Caché de Capas (BuildKit):** Se copian primero los manifiestos `package*.json` antes del código fuente, acelerando drásticamente los pipelines de CI.
3. **Instalación Determinista:** Se emplea `npm ci --only=production`, garantizando la instalación limpia y exacta del lockfile sin dependencias innecesarias de desarrollo.
4. **Seguridad DevSecOps:** Se aplica el principio de menor privilegio ejecutando bajo el usuario no root `USER node`.
5. **Paridad de Entornos (Dev/Prod Parity):** El desarrollador ejecuta en su máquina local el mismo binario sellado criptográficamente que se ejecuta en producción.

---

## ⚙️ 4. Pipeline de CI y Quality Gates

El flujo de trabajo en [`.github/workflows/ci.yml`](.github/workflows/ci.yml) implementa tres barreras de calidad automáticas antes de admitir cualquier cambio en la rama `main`:

* **Gate 1 - Pruebas Automatizadas:** `npm test` ejecuta la suite de pruebas unitarias sobre endpoints de salud y lógica de negocio.
* **Gate 2 - Auditoría de Dependencias:** `npm audit --audit-level=high` escanea vulnerabilidades conocidas en la cadena de suministro.
* **Gate 3 - Validación de Construcción Docker:** Compilación estricta del contenedor asegurando que la imagen se ensambla sin errores.

---

## 📡 5. Especificación de la API

| Método | Endpoint | Descripción | Código Éxito |
| :--- | :--- | :--- | :---: |
| `GET` | `/health` | Healthcheck activo para Docker / Kubernetes | `200 OK` |
| `GET` | `/` | Información del servicio y estado operativo | `200 OK` |
| `GET` | `/api/facturas` | Obtiene el listado de facturas emitidas | `200 OK` |
| `POST` | `/api/facturas` | Procesa y emite una nueva factura | `201 Created` |

---

## 🚀 6. Instrucciones de Ejecución

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
