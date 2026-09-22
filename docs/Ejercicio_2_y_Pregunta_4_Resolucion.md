# UNIVERSIDAD NACIONAL EXPERIMENTAL DE GUAYANA
## VICERRECTORADO ACADÉMICO - COORDINACIÓN DE INGENIERÍA EN INFORMÁTICA
### ASIGNATURA: INGENIERÍA DE SOFTWARE II
**Profesor:** Mg. Félix Márquez  
**Estudiante:** Brayan (Integrante 4)  
**Unidad V:** Gestión de Configuración, Versionamiento y DevOps  
**Fecha:** Septiembre de 2026  

---

# RESOLUCIÓN DETALLADA: EJERCICIO 2 Y PREGUNTA 4
## Tópico: *Everything as Code*, Contenedorización, Inmutabilidad y Auditoría de SCM Moderna

---

## 1. EJERCICIO 2: *EVERYTHING AS CODE* Y GESTIÓN DE ENTORNOS

### 1.1. Contexto del Problema Operativo
La organización presenta una manifestación crítica del clásico síndrome *"en mi máquina sí funciona"*, originado por una gestión de configuración manual y descentralizada. Mientras los ingenieros de software preparan sus entornos locales de acuerdo con criterios heterogéneos (versiones dispersas del intérprete de Node.js, dependencias globales incompatibles y diferencias en el sistema operativo anfitrión), el equipo de operaciones aprovisiona los servidores de producción mediante scripts de Bash imperativos, no parametrizados y desprovistos de control de versiones. 

Este desacoplamiento induce el fenómeno de **deriva de configuración** (*Configuration Drift*), donde cada instancia de ejecución se convierte en un "servidor copo de nieve" (*snowflake server*): único, frágil, imposible de replicar de forma determinista y propenso a fallas catastróficas durante la puesta en producción.

---

### 1.2. Dockerización de la Aplicación Node.js (`server.js` en Puerto 8080)

Para resolver de raíz esta problemática, se implementa una especificación declarativa e inmutable mediante un archivo `Dockerfile`. El archivo se detalla y comenta minuciosamente a continuación:

```dockerfile
# ==============================================================================
# Dockerfile: Microservicio Node.js (Puerto 8080)
# Asignatura: Ingeniería de Software II (UNEG) - Unidad V: SCM & DevOps
# Integrante 4: Brayan
#
# Propósito SCM: Garantizar la inmutabilidad de la configuración, reproducibilidad
# determinista entre entornos y eliminación total de la deriva de configuración.
# ==============================================================================

# 1. IMAGEN BASE INMUTABLE:
# Se utiliza una versión explícita y fijada de Node.js sobre Alpine Linux (huella de ~40MB).
# Al fijar '20.17.0-alpine3.20' en lugar de tags mutables como 'latest', se asegura que
# reconstrucciones futuras no introduzcan regresiones por actualizaciones externas de librerías base.
FROM node:20.17.0-alpine3.20

# 2. METADATOS Y VARIABLES DE ENTORNO:
# Establecemos el entorno en producción para optimizar el consumo de memoria en V8,
# desactivar middlewares de depuración de Express y parametrizar el puerto de escucha.
ENV NODE_ENV=production \
    PORT=8080

# 3. DIRECTORIO DE TRABAJO AISLADO:
# Se define un directorio aislado dentro del sistema de archivos del contenedor,
# evitando la dispersión de artefactos en la raíz del sistema operativo huésped.
WORKDIR /usr/src/app

# 4. OPTIMIZACIÓN DE LA CACHÉ DE CAPAS (BUILD CACHING EN BUILDKIT):
# Siguiendo el principio de ordenar instrucciones desde las de menor variabilidad a las de mayor
# frecuencia de cambio, copiamos ÚNICAMENTE los manifiestos de dependencias (package*.json).
# Si el código de negocio cambia pero las dependencias no, Docker reutilizará la capa compilada.
COPY package*.json ./

# 5. INSTALACIÓN LIMPIA, ESTRICTA Y DETERMINISTA:
# 'npm ci' (Clean Install) exige la presencia de package-lock.json y resuelve el árbol exacto
# de dependencias sin alterar el lockfile. La bandera '--only=production' excluye dependencias de test
# o linters, minimizando el vector de ataque y el tamaño final de la imagen.
RUN npm ci --only=production && \
    npm cache clean --force

# 6. TRANSFERENCIA DEL CÓDIGO FUENTE:
# Se transfieren los módulos de la aplicación asignando la propiedad de archivos
# directamente al usuario no privilegiado 'node' creado por la distribución base de Alpine.
COPY --chown=node:node . .

# 7. PRINCIPIO DE MENOR PRIVILEGIO (SEGURIDAD DEVSECOPS):
# Por defecto, los contenedores ejecutan sus procesos como UID 0 (root). Cambiamos al usuario
# no root 'node'. Si la aplicación presentase una falla de ejecución remota de código (RCE),
# el atacante queda confinado dentro de un contexto sin capacidades de administración sobre el host.
USER node

# 8. DECLARACIÓN FORMAL DE PUERTO DE RED:
# Documenta formalmente hacia los orquestadores y el motor de Docker que el contenedor
# expone el socket TCP en el puerto 8080.
EXPOSE 8080

# 9. COMPROBACIÓN DE SALUD INTEGRADA (HEALTHCHECK):
# Provee un mecanismo activo de monitoreo donde el motor consulta periódicamente el endpoint
# /health. Si el proceso colapsa o entra en deadlock, el orquestador marcará el contenedor como 'unhealthy'.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# 10. INVOCACIÓN DE ENTRADA INMUTABLE (SINTAXIS EXEC):
# La forma ejecutiva JSON ["node", "server.js"] asegura que el proceso de Node se ejecute como PID 1,
# permitiéndole interceptar de manera nativa las señales POSIX del kernel (SIGTERM y SIGINT) para
# realizar cierres ordenados (graceful shutdowns) sin dejar conexiones huérfanas.
CMD ["node", "server.js"]
```

---

### 1.3. ¿Cómo este archivo resuelve el problema de la Deriva de Configuración (*Configuration Drift*)?

La **deriva de configuración** es la discrepancia gradual, acumulativa y no documentada que se produce entre distintos entornos de software (Desarrollo, Pruebas, Staging y Producción) cuando estos son modificados manualmente mediante parches ad-hoc, actualizaciones parciales de paquetes del sistema operativo o scripts de automatización no idempotentes.

El `Dockerfile` expuesto erradica este problema aplicando los siguientes pilares de la Ingeniería de Configuración moderna:

1. **Inmutabilidad del Ítem de Configuración (Contenedores Inmutables):**
   En el modelo tradicional con máquinas virtuales o servidores bare-metal, los servidores eran tratados como "mascotas" (*pets*), aplicándoles parches in-situ. Docker transforma los entornos en "ganado" (*cattle*): el software no se instala ni se actualiza dentro de un contenedor en ejecución. La imagen resultante del `Dockerfile` es un artefacto binario de sólo lectura compuesto por capas criptográficamente verificadas mediante hashes SHA-256. Cuando se requiere un cambio, se construye una nueva imagen y se destruye la anterior.
2. **Encapsulamiento Holístico del Runtime:**
   A diferencia de los scripts de Bash que dependen del estado preexistente del host (como la versión de glibc, librerías compartidas de OpenSSL o variables globales del shell), el contenedor empaqueta tanto el código fuente como el intérprete exacto de Node.js (`20.17.0`), las librerías del sistema operativo (`Alpine 3.20`), los archivos de configuración y las dependencias de NPM.
3. **Paridad de Entornos (*Dev/Prod Parity*):**
   Al regirse por el décimo principio de *The Twelve-Factor App*, el desarrollador en su estación local ejecuta con absoluta certeza el mismo contexto de ejecución binario que se desplegará en el clúster de producción. El axioma *"funciona en mi máquina"* pierde sentido, puesto que "la máquina" ahora es una unidad estandarizada, autocontenida y portátil.

---

### 1.4. Reflexión SCM: Ventajas de Trazabilidad y Auditoría de Infraestructura como Código (IaC) en Git vs. Logs Manuales de un SysAdmin

Desde la óptica de la Gestión de Configuración del Software clásica (SCM) formalizada por estándares como IEEE/ISO e IEEE SWEBOK V4, los dos pilares de control más exigentes son la **Trazabilidad** (habilidad de seguir la evolución histórica de un ítem de configuración hacia atrás y hacia adelante) y la **Auditoría de Configuración** (la verificación formal de que el sistema en producción coincide rigurosamente con la línea base aprobada).

Al contrastar la Infraestructura como Código (IaC) versionada en Git contra la administración tradicional basada en scripts de Bash no versionados y registros manuales de un SysAdmin, se evidencian diferencias estructurales determinantes:

| Dimensión SCM | Administración Tradicional (Scripts Bash & Logs Manuales) | Infraestructura como Código (IaC) en Git (`Everything as Code`) |
| :--- | :--- | :--- |
| **Definición de Línea Base (*Baseline*)** | **Ambigua y volátil.** No existe una fuente única de verdad. La "línea base" es el estado mutable acumulado en el disco del servidor tras meses de comandos manuales. | **Declarativa y Formal.** La línea base es el commit exacto en la rama principal (`main`) de Git. Cada versión de la infraestructura tiene un identificador SHA-1/SHA-256 inalterable. |
| **Trazabilidad de Cambios (*Audit Trail*)** | **Fragmentada y efímera.** Los comandos ejecutados quedan dispersos en historiales locales (`.bash_history`), logs de SSH o bitácoras en Word/Excel, susceptibles de ser borrados, truncados o no registrados por error humano. | **Total e Inmutable.** Git registra de forma criptográfica quién efectuó la modificación (`Author/Committer`), el instante exacto (`Timestamp`), el motivo formal (`Commit message`) y la aprobación colegiada (`Pull Request ID`). |
| **Control de Cambios y Aprobación** | **Ex-post y burocrático.** El SysAdmin aplica los cambios en caliente y posteriormente los documenta (si el tiempo lo permite), imposibilitando la inspección preventiva. | **Preventivo y Automatizado.** Ningún cambio toca la infraestructura sin pasar por un Pull Request con revisiones por pares (*Peer Review*) y pruebas automatizadas de validación sintáctica/seguridad en CI. |
| **Idempotencia y Reproducibilidad** | **No idempotente.** La reejecución de un script Bash imperativo (`apt-get install`, `mkdir`, `sed`) sobre un servidor ya configurado genera efectos secundarios imprevistos, fallas por colisión o estados corruptos. | **Idempotente y Determinista.** Los manifiestos declarativos definen el estado deseado. El motor de construcción o aprovisionamiento genera exactamente la misma infraestructura independientemente del número de ejecuciones. |
| **Capacidad de Recuperación (*Disaster Recovery*)** | **Manual y prolongada (alto MTTR).** Recuperar un servidor destruido requiere descifrar notas viejas, reinstalar paquetes a mano y diagnosticar incompatibilidades en caliente durante horas. | **Inmediata y Automatizada (bajo MTTR).** Un clúster completo puede ser reconstruido desde cero ejecutando el pipeline de CI/CD sobre el repositorio de Git en cuestión de minutos (*GitOps*). |
| **Auditoría Física y Funcional (FCA / PCA)** | **Prácticamente imposible.** No hay forma matemática de comprobar si un archivo binario o librería en `/usr/lib` corresponde a la versión que aprobó el comité de cambios. | **Verificación Criptográfica Continua.** Herramientas de escaneo comparan en tiempo real la firma del contenedor en producción con el hash del commit en el repositorio Git. |

---

## 2. PREGUNTA 4: ARTEFACTOS MODERNOS Y AUDITORÍA EN SCM

### 2.1. La Transición: Del "Plan de Gestión de Configuraciones" en Word a Archivos en el Repositorio

En la disciplina clásica de SCM (formalizada en la década de 1990 bajo marcos como IEEE Std 828 e ISO 9001), la gobernanza de un proyecto de software dependía del **Plan de Gestión de la Configuración del Software (SCMP)**. Este artefacto era típicamente un voluminoso documento de Microsoft Word de 80 a 150 páginas que detallaba:
* La nomenclatura permitida de directorios y ramas.
* El procedimiento manual de compilación y empaquetado de ejecutables.
* El comité de aprobación de cambios (CCB).
* Las listas de verificación de auditoría y políticas de despliegue en cintas o servidores físicos.

**La patología del modelo en Word:**
En la práctica de la ingeniería moderna, estos documentos presentaban una falla epistemológica crítica: eran **artefactos pasivos y desacoplados del código fuente**. Al redactarse en prosa humana, quedaban desactualizados tan pronto como el equipo técnico modificaba una librería o adaptaba un parámetro en el servidor. Eran documentos puramente burocráticos creados para satisfacer auditorías externas, pero carentes de utilidad operativa diaria para los desarrolladores.

**El paradigma moderno: *Everything as Code* (EaC) y GitOps:**
La revolución DevOps y la SCM contemporánea resolvieron este problema transformando las políticas operativas en **código ejecutable y versionado dentro del mismo repositorio de software**. El plan ya no describe en párrafos lo que *debería* hacerse; el repositorio contiene manifiestos declarativos que *fuerzan* de manera determinista e inapelable el cumplimiento de las políticas en cada interacción de desarrollo.

---

### 2.2. Análisis Exhaustivo de los 4 Archivos Clave de SCM Moderna

A continuación, se seleccionan, detallan y analizan **cuatro artefactos esenciales** presentes en el repositorio moderno, demostrando cómo materializan las funciones clásicas de la SCM:

```text
📦 Repositorio del Proyecto
 ├── 📄 .gitignore                 -> [Filtro de Integridad de la Línea Base]
 ├── 🐳 Dockerfile                 -> [Especificación Inmutable del Entorno]
 ├── ⚙️ .github/workflows/ci.yml   -> [Control de Cambios y Calidad Automatizado]
 └── 🐙 docker-compose.yml         -> [Topología de Configuración y Red Multicapa]
```

---

#### 1. Manifiesto `.gitignore`
* **Definición y Rol Técnico:** Archivo de texto plano interpretado por el núcleo de Git para excluir de forma proactiva patrones de archivos y directorios del árbol de seguimiento (*working tree*), impidiendo su incorporación al área de preparación (*staging area / index*) y al historial de commits.
* **Garantías de SCM:**
  * **Integridad de la Línea Base:** Impide la contaminación del repositorio con dependencias binarias o volátiles reproducibles (tales como la carpeta `node_modules/`, cachés de compilación `.tsbuildinfo`, o artefactos temporales). La línea base contiene únicamente código fuente original, reduciendo el peso del repositorio y evitando conflictos de fusión absurdos sobre archivos generados.
  * **Prevención y Seguridad DevSecOps:** Bloquea la inclusión accidental de secretos, llaves privadas RSA (`.pem`), certificados SSL y archivos de variables de entorno locales (`.env`).
  * **Control de Variabilidad Local:** Excluye metadatos específicos del sistema operativo o entorno de desarrollo integrado (como `.DS_Store`, `Thumbs.db` o configuraciones privadas de `.vscode/`), asegurando que la configuración de la máquina de un programador no contamine la de sus compañeros.

---

#### 2. Manifiesto `Dockerfile`
* **Definición y Rol Técnico:** Especificación declarativa de construcción compuesta por una secuencia jerárquica de instrucciones que el motor de contenedores ejecuta para ensamblar una imagen inmutable de sistema de archivos.
* **Garantías de SCM:**
  * **Identificación del Ítem de Configuración (SCI):** En SCM clásica, definir el "entorno de compilación" exigía inventariar el sistema operativo, parches de seguridad, versión del compilador y librerías dinámicas. El `Dockerfile` unifica todo este inventario en un único archivo de configuración auditable y versionado junto al código fuente.
  * **Reproducibilidad Absoluta:** Mediante técnicas como la fijación explícita de tags base (`node:20.17.0-alpine3.20`) y comandos no interactivos (`npm ci`), garantiza que el artefacto producido hoy sea idéntico al que se construya dentro de cinco años.
  * **Inmutabilidad y Auditoría Física:** Sustituye el antiguo manual de instalación de servidores por un artefacto que, tras compilarse, arroja un identificador de digestión criptográfica único (SHA-256), permitiendo a los auditores de calidad verificar que el código en producción no ha sufrido manipulaciones no autorizadas.

---

#### 3. Pipeline de Automatización `.github/workflows/ci.yml`
* **Definición y Rol Técnico:** Archivo estructurado en formato YAML que define el flujo de trabajo de Integración Continua y Despliegue Continuo (CI/CD) orquestado por agentes remotos ante eventos del repositorio (como `push`, `pull_request` o `release`).
* **Garantías de SCM:**
  * **Control de Cambios Automatizado (Sustitución del CCB):** Codifica las reglas de aceptación de un cambio. Ningún desarrollador puede fusionar código a la línea base principal si el workflow no culmina con éxito.
  * **Garantía de Calidad Continua (*Quality Gates*):** Ejecuta de forma determinista suites de pruebas unitarias, análisis estático de código (SAST), linter de formato y auditoría de vulnerabilidades de dependencias (`npm audit`). El plan de pruebas del antiguo documento Word ahora se ejecuta de manera obligatoria en cada commit.
  * **Trazabilidad de la Liberación:** Vincula cada versión compilada con el hash de commit y el usuario que disparó el pipeline, generando un historial de auditoría inmutable en los logs de ejecución del orquestador.

---

#### 4. Manifiesto de Orquestación `docker-compose.yml`
* **Definición y Rol Técnico:** Archivo declarativo que formaliza la composición, topología de red, políticas de persistencia y relaciones de interdependencia entre múltiples contenedores que conforman una solución de software multicapa (Frontend, Backend, Base de Datos, Broker de Mensajería).
* **Garantías de SCM:**
  * **Integridad de la Arquitectura del Sistema:** Traduce el antiguo "diagrama de despliegue" en una especificación ejecutable. Define con precisión matemática qué puertos están expuestos al exterior, qué subredes virtuales aíslan las bases de datos del tráfico público y qué variables de entorno gobiernan los enlaces entre servicios.
  * **Control de Dependencias del Sistema:** Reemplaza la configuración manual de enlaces de red locales por resolución DNS interna gestionada por Docker. Especifica el orden riguroso de inicio y las dependencias entre ítems de configuración (`depends_on` con comprobaciones de salud `service_healthy`).
  * **Reproducibilidad del Entorno Multicapa:** Permite que cualquier nuevo miembro del equipo o auditor ejecute un único comando (`docker compose up -d`) para levantar exactamente la misma arquitectura multicapa idéntica a la de producción en su estación local, sin discrepancias de configuración ni configuración manual de bases de datos.

---

### 2.3. Matriz de Garantías de SCM: Cómo cada archivo asegura la Integridad, Reproducibilidad y Control

| Archivo de Configuración Moderno | Garantía de **Integridad** (*Configuration Integrity*) | Garantía de **Reproducibilidad** (*Deterministic Execution*) | Garantía de **Control** (*Configuration Control*) |
| :--- | :--- | :--- | :--- |
| **`.gitignore`** | Mantiene la base de código pura, libre de binarios locales volátiles y previene la exposición de secretos o credenciales en el historial. | Asegura que el repositorio solo almacene código fuente primario; las dependencias se reconstruyen limpiamente sin colisiones locales. | Delimita explícitamente las fronteras del Ítem de Configuración (SCI) que está formalmente bajo control de versiones de Git. |
| **`Dockerfile`** | Empaqueta el runtime, las librerías del sistema y la aplicación en un contenedor sellado e inmutable contra manipulaciones manuales. | Construcción determinista gracias a imágenes base fijadas y comandos de instalación estricta (`npm ci --only=production`). | Cada cambio en la infraestructura requiere un commit explícito en Git con revisión de código antes de poder desplegarse. |
| **`.github/workflows/ci.yml`** | Aplica barreras de calidad (*Quality Gates*), linters y escaneos de seguridad antes de autorizar la integración de cambios. | El proceso de verificación, testeo y compilación se ejecuta en máquinas virtuales limpias idénticas en cada ejecución. | Reemplaza la aprobación manual de un comité humano por un algoritmo verificable que bloquea el merge ante cualquier fallo. |
| **`docker-compose.yml`** | Formaliza la topología de red, aislamiento de servicios y límites de memoria/CPU, blindando la cohesión del sistema multicapa. | Todo el ecosistema de servicios (BD, Backend, Cache) se levanta idéntico en cualquier host mediante un único comando declarativo. | Centraliza en un solo archivo versionable los parámetros arquitectónicos y variables de conexión entre microservicios. |

---

## 3. CONCLUSIÓN Y APORTE CRÍTICO

La transición desde los manuales y planes estáticos de SCM redactados en procesadores de texto hacia el paradigma **Everything as Code** representa uno de los saltos cualitativos más trascendentales de la Ingeniería de Software contemporánea. 

Al transformar los requerimientos de configuración, seguridad, arquitectura e infraestructura en archivos planos que conviven en el mismo repositorio Git que el código de negocio:
1. Las especificaciones se vuelven **activas y auto-ejecutables**.
2. La brecha de conocimiento entre desarrolladores y operadores desaparece (*DevOps cultural y técnico*).
3. Se alcanza un nivel de trazabilidad criptográfica y auditoría continua que la burocracia manual jamás pudo garantizar.

---

## 4. REFERENCIAS BIBLIOGRÁFICAS (FORMATO APA)

* Bass, L., Clements, P., & Kazman, R. (2021). *Software Architecture in Practice* (4th ed.). Addison-Wesley.
* Driessen, V. (2010). *A successful Git branching model*. nvie.com.
* Forsgren, N., Humble, J., & Kim, G. (2018). *Accelerate: The Science of Lean Software and DevOps: Building and Scaling High Performing Technology Organizations*. IT Revolution Press.
* Humble, J., & Farley, D. (2010). *Continuous Delivery: Reliable Software Releases through Build, Test, and Deployment Automation*. Addison-Wesley.
* IEEE Computer Society. (2014). *Guide to the Software Engineering Body of Knowledge (SWEBOK V3/V4)*. IEEE.
* Prokic, S. (2021). *Infrastructure as Code: Dynamic Infrastructure with Terraform and Docker*. Packt Publishing.
