# 🚀 Everything as Code & Gestión de Entornos (Docker + Node.js)
### Universidad Nacional Experimental de Guayana (UNEG)
**Asignatura:** Ingeniería de Software II  
**Profesor:** Mg. Félix Márquez  
**Unidad V:** Gestión de Configuración, Versionamiento y DevOps  
**Responsable:** Brayan (Integrante 4)  
**Tópicos Asignados:** Ejercicio 2 (Dockerización y Deriva de Configuración) y Pregunta 4 (Artefactos Clave de SCM)  

---

## 📌 1. Descripción del Proyecto

Este repositorio constituye la evidencia práctica y demostrativa del enfoque **Everything as Code (EaC)** e **Infraestructura Inmutable** para la Unidad V de Ingeniería de Software II.

Resuelve de raíz el clásico síndrome del desarrollo de software: **«en mi máquina sí funciona»**, erradicando la **deriva de configuración** (*Configuration Drift*) producida por configuraciones manuales heterogéneas y scripts de Bash no versionados en servidores de operaciones.

---

## 🛠️ 2. Arquitectura de Componentes y SCM Moderna

El proyecto materializa los **4 artefactos modernos de SCM** exigidos en la evaluación:

```text
📦 ISII-Everything-as-Code-Demo
 ├── 📄 .gitignore                 -> [Filtro de Integridad de la Línea Base y Prevención de Fugas]
 ├── 🐳 Dockerfile                 -> [Especificación Inmutable del Runtime y Paridad Dev/Prod]
 ├── ⚙️ .github/workflows/ci.yml   -> [Control de Cambios Automatizado con 3 Quality Gates]
 ├── 🐙 docker-compose.yml         -> [Topología Declarativa de Red y Orquestación Multicapa]
 ├── 📦 package.json & lockfile    -> [Árbol Determinista de Dependencias Transitivas]
 ├── 💻 server.js                  -> [Microservicio Express (Puerto 8080) con Endpoint /health]
 └── 📂 docs/                      -> [Documento Formal y Lámina de Defensa Oral]
      ├── Ejercicio_2_y_Pregunta_4_Resolucion.pdf
      ├── Ejercicio_2_y_Pregunta_4_Resolucion.md
      └── 01_Lamina_Defensa_Ejercicio_2_y_Pregunta_4_Brayan.png
```

---

## 🐳 3. Especificación Técnica del `Dockerfile` (Ejercicio 2)

El `Dockerfile` implementa un empaquetamiento optimizado, seguro y determinista:

```dockerfile
# 1. Imagen Base Inmutable (Alpine Linux ~40MB, versión fijada contra regresiones)
FROM node:20.17.0-alpine3.20

# 2. Variables de entorno optimizadas para producción
ENV NODE_ENV=production \
    PORT=8080

# 3. Directorio de trabajo aislado
WORKDIR /usr/src/app

# 4. Optimización de caché de capas (BuildKit)
COPY package*.json ./

# 5. Instalación determinista estricta (omite devDependencies y valida lockfile)
RUN npm ci --only=production && \
    npm cache clean --force

# 6. Copia de código con permisos de usuario no privilegiado
COPY --chown=node:node . .

# 7. Seguridad DevSecOps: Principio de Menor Privilegio (evita escape a root en el host)
USER node

# 8. Documentación de puerto de escucha
EXPOSE 8080

# 9. Healthcheck activo integrado
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# 10. Invocación EXEC (PID 1 para manejo graceful de señales SIGTERM/SIGINT)
CMD ["node", "server.js"]
```

### ¿Cómo elimina la Deriva de Configuración?
* **Inmutabilidad:** La imagen de Docker es de sólo lectura, sellada criptográficamente con hashes SHA-256. Ningún cambio se realiza en caliente sobre servidores en producción.
* **Paridad Desarrollo/Producción (*Dev/Prod Parity*):** El desarrollador ejecuta localmente el mismo binario idéntico bit por bit que corre en producción.
* **Encapsulamiento Completo:** El contenedor incluye sistema operativo (`Alpine 3.20`), runtime (`Node 20.17.0`), dependencias exactas y código fuente, eliminando cualquier dependencia del software preinstalado en el host.

---

## ⚙️ 4. Pipeline de CI y Quality Gates (`.github/workflows/ci.yml`)

El pipeline de GitHub Actions actúa como un **comité de control de cambios automatizado**, bloqueando cualquier integración a `main` si no se cumplen las 3 Quality Gates:

1. **Quality Gate 1 (Pruebas Unitarias Automatizadas):** Ejecución de suite de validación de lógica (`npm test`).
2. **Quality Gate 2 (Auditoría de Seguridad de Dependencias):** Escaneo estricto de vulnerabilidades conocidas en la cadena de suministro (`npm audit --audit-level=high`).
3. **Quality Gate 3 (Validación y Construcción del Contenedor):** Prueba de compilación inmutable de la imagen Docker (`docker build -t isii-demo-app:${{ github.sha }} .`).

---

## 📊 5. Matriz de Garantías de SCM (Pregunta 4)

| Artefacto Moderno | Garantía de **Integridad** | Garantía de **Reproducibilidad** | Garantía de **Control** |
| :--- | :--- | :--- | :--- |
| **`.gitignore`** | Base de código pura, libre de binarios volátiles (`node_modules`) y protección contra fuga de credenciales (`.env`). | Solo código fuente original; dependencias se reconstruyen limpiamente. | Delimita las fronteras del Ítem de Configuración bajo control de Git. |
| **`Dockerfile`** | Empaqueta SO, runtime y código en un contenedor sellado contra modificaciones manuales. | Construcción determinista mediante tags fijos e instalación estricta (`npm ci`). | Todo cambio de infraestructura requiere un commit auditable en Git. |
| **`.github/workflows/ci.yml`** | Aplica Quality Gates, pruebas y escaneos antes de autorizar el merge. | Verificación en máquinas virtuales limpias y homogéneas en cada commit. | Reemplaza la firma de un comité por un árbitro algorítmico verificable. |
| **`docker-compose.yml`** | Formaliza la topología de red, aislamiento de servicios y límites de recursos. | Todo el ecosistema multicapa se levanta idéntico con un solo comando. | Centraliza en un archivo versionable las variables y enlaces entre servicios. |

---

## 🚀 6. Guía Rápida de Ejecución

### Opción A: Usando Docker Compose (Recomendado)
```bash
# Levantar el servicio en segundo plano
docker compose up -d --build

# Verificar estado y healthcheck
docker compose ps

# Ver logs en tiempo real
docker compose logs -f
```

### Opción B: Construcción y Ejecución Directa con Docker
```bash
# 1. Construir la imagen
docker build -t isii-facturacion-app:1.0.0 .

# 2. Ejecutar el contenedor mapeando el puerto 8080
docker run -d --name isii_app -p 8080:8080 isii-facturacion-app:1.0.0
```

### 🧪 Pruebas de Endpoints

```bash
# 1. Verificación de salud (Healthcheck)
curl http://localhost:8080/health

# Respuesta esperada:
# {"status":"UP","timestamp":"...","uptime":...,"environment":"production"}

# 2. Simulación de procesamiento de factura
curl -X POST http://localhost:8080/api/facturas \
  -H "Content-Type: application/json" \
  -d '{"cliente": "Clinica Veterinaria San Francisco", "monto": 245.50}'

# Respuesta esperada (201 Created):
# {"id":"FAC-49120","cliente":"Clinica Veterinaria San Francisco","monto":245.5,"fecha":"...","estado":"PROCESADA"}
```

---

## 📚 7. Documentación Formal y Referencias

* 📄 Documento de Resolución Teórica Completa: [`docs/Ejercicio_2_y_Pregunta_4_Resolucion.pdf`](docs/Ejercicio_2_y_Pregunta_4_Resolucion.pdf)
* 🖼️ Lámina de Defensa Oral (16:9 con espacio para webcam): [`docs/01_Lamina_Defensa_Ejercicio_2_y_Pregunta_4_Brayan.png`](docs/01_Lamina_Defensa_Ejercicio_2_y_Pregunta_4_Brayan.png)

### Referencias Bibliográficas (APA):
* **Bass, L., Clements, P., & Kazman, R.** (2021). *Software Architecture in Practice* (4th ed.). Addison-Wesley.
* **Forsgren, N., Humble, J., & Kim, G.** (2018). *Accelerate: The Science of Lean Software and DevOps*. IT Revolution Press.
* **Humble, J., & Farley, D.** (2010). *Continuous Delivery*. Addison-Wesley.
* **IEEE Computer Society.** (2014). *Guide to the Software Engineering Body of Knowledge (SWEBOK V4)*.
* **Prokic, S.** (2021). *Infrastructure as Code: Dynamic Infrastructure with Terraform and Docker*. Packt Publishing.
