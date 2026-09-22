# ==============================================================================
# Dockerfile: Microservicio Node.js (Puerto 8080)
# Asignatura: Ingeniería de Software II (UNEG) - Unidad V: SCM & DevOps
# Integrante 4: Brayan
#
# Propósito SCM: Garantizar la inmutabilidad de la configuración, reproducibilidad
# determinista entre entornos y eliminación total de la deriva de configuración.
# ==============================================================================

# 1. IMAGEN BASE INMUTABLE:
# Usamos una versión específica y fijada de Node.js sobre Alpine Linux (distribución mínima de ~40MB).
# Al fijar '20.17.0-alpine3.20' en lugar de 'latest', evitamos que cambios en repositorios externos
# alteren el comportamiento del software en futuras construcciones (Construcción Determinista).
FROM node:20.17.0-alpine3.20

# 2. METADATOS Y VARIABLES DE ENTORNO:
# Definimos el entorno en producción para que librerías como Express desactiven logs innecesarios
# y optimicen el rendimiento en memoria y caché.
ENV NODE_ENV=production \
    PORT=8080

# 3. DIRECTORIO DE TRABAJO AISLADO:
# Creamos y establecemos el directorio donde vivirá la aplicación dentro del contenedor.
WORKDIR /usr/src/app

# 4. OPTIMIZACIÓN DE CACHÉ DE CAPAS (BUILD CACHING):
# Copiamos ÚNICAMENTE los manifiestos de dependencias antes que el resto del código fuente.
# Si el código de negocio cambia pero las librerías no, Docker reutilizará la capa en caché,
# acelerando el pipeline de CI/CD de minutos a segundos.
COPY package*.json ./

# 5. INSTALACIÓN LIMPIA Y DETERMINISTA:
# 'npm ci' (Clean Install) instala estrictamente las versiones fijadas en package-lock.json.
# La bandera '--only=production' ignora devDependencies (herramientas de test o linter),
# reduciendo drásticamente la superficie de ataque y el tamaño de la imagen final.
RUN npm ci --only=production && \
    npm cache clean --force

# 6. TRANSFERENCIA DEL CÓDIGO FUENTE CON PERMISOS ADECUADOS:
# Se transfiere el código de la aplicación asignando la propiedad al usuario 'node' sin privilegios.
COPY --chown=node:node . .

# 7. PRINCIPIO DE MENOR PRIVILEGIO (SEGURIDAD DEVSECOPS):
# Por defecto, los contenedores corren como 'root'. Cambiamos explícitamente al usuario 'node',
# garantizando que si la aplicación sufre una vulnerabilidad de ejecución remota de código (RCE),
# el atacante no obtenga privilegios de superusuario en el host del servidor.
USER node

# 8. DECLARACIÓN DE PUERTO (DOCUMENTACIÓN DE RED):
# Informa al motor de Docker y a los orquestadores que el contenedor escucha en el puerto 8080.
EXPOSE 8080

# 9. COMPROBACIÓN DE SALUD INTEGRADA (HEALTHCHECK):
# Permite que Docker y orquestadores detecten fallas internas del proceso sin depender de sondas externas.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# 10. COMANDO DE EJECUCIÓN (INMUTABILIDAD DE ENTRADA):
# Sintaxis EXEC (formato JSON) para que 'node server.js' se ejecute como PID 1 y reciba
# adecuadamente las señales de apagado graceful del sistema operativo (SIGTERM/SIGINT).
CMD ["node", "server.js"]
