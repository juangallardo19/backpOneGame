# ⚙️ CONFIGURACIÓN DEL PROYECTO - ONE ONLINE BACKEND

## 📋 Configuraciones Faltantes / A Completar

Este documento lista todas las configuraciones que necesitas completar antes de ejecutar el proyecto en diferentes ambientes.

---

## 🔴 CONFIGURACIONES OBLIGATORIAS

### 1. Base de Datos PostgreSQL ⚠️

**Estado**: ❌ No configurada

#### Pasos para configurar:

**Opción A: PostgreSQL Local**
```bash
# 1. Instalar PostgreSQL
# Ubuntu/Debian:
sudo apt install postgresql postgresql-contrib

# MacOS:
brew install postgresql

# Windows: Descargar desde https://www.postgresql.org/download/

# 2. Crear base de datos y usuario
sudo -u postgres psql
```

```sql
CREATE DATABASE oneonline_db;
CREATE USER oneonline_user WITH PASSWORD 'tu_password_seguro';
GRANT ALL PRIVILEGES ON DATABASE oneonline_db TO oneonline_user;
\q
```

**Opción B: PostgreSQL en la nube (Recomendado para producción)**
- **Railway.app**: https://railway.app/ (Gratis para proyectos pequeños)
- **Heroku Postgres**: https://www.heroku.com/postgres
- **Supabase**: https://supabase.com/ (Incluye PostgreSQL gratis)
- **ElephantSQL**: https://www.elephantsql.com/ (Tier gratis)

#### Actualizar application.properties:
```properties
# Opción Local:
spring.datasource.url=jdbc:postgresql://localhost:5432/oneonline_db
spring.datasource.username=oneonline_user
spring.datasource.password=tu_password_aqui

# Opción Railway/Heroku (usando variable de entorno):
spring.datasource.url=${DATABASE_URL}
```

---

### 2. Frontend URL (CORS) ⚠️

**Estado**: ❌ No configurada (por defecto: localhost:3000)

#### Configuración actual:
```properties
cors.allowed-origins=http://localhost:3000
```

#### ¿Qué hacer?

**Para desarrollo local:**
Si tu frontend corre en otro puerto, actualiza:
```properties
cors.allowed-origins=http://localhost:4200
```

**Para producción:**
```properties
# Un dominio:
cors.allowed-origins=https://tu-frontend.com

# Múltiples dominios (separados por comas):
cors.allowed-origins=https://tu-frontend.com,https://www.tu-frontend.com,https://app.tu-frontend.com
```

**Mejor práctica:**
Usar variable de entorno:
```properties
cors.allowed-origins=${FRONTEND_URL:http://localhost:3000}
```

---

### 3. JWT Secret ⚠️

**Estado**: ⚠️ Usando valor por defecto (INSEGURO en producción)

#### Valor actual (application.properties):
```properties
jwt.secret=YXNkZmphc2xrZGZqYXNsa2RqZmxrYXNqZGZsa2Fqc2RmbGtqYXNkbGZrYWpzZGxmamFsc2RramZhbHNrZGpmYWxza2RqZmxhc2tkamZhbHNrZGZq
```

**🚨 IMPORTANTE**: Este valor es un ejemplo y NO debe usarse en producción.

#### Generar nuevo JWT Secret:

**Linux/MacOS:**
```bash
openssl rand -base64 64
```

**Windows (PowerShell):**
```powershell
[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Online:**
https://generate-secret.vercel.app/64

#### Configurar:
```bash
# .env file
JWT_SECRET=tu_nuevo_secret_generado_aqui
```

O en application-prod.properties:
```properties
jwt.secret=${JWT_SECRET}
```

---

### 4. OAuth2 - Google ⚠️

**Estado**: ❌ No configurado

#### Pasos para configurar:

1. **Ir a Google Cloud Console**
   - https://console.cloud.google.com/

2. **Crear un proyecto nuevo**
   - Nombre: "ONE Online"

3. **Habilitar APIs**
   - Google+ API
   - Google People API

4. **Crear credenciales OAuth 2.0**
   - Credentials → Create Credentials → OAuth client ID
   - Application type: Web application
   - Authorized redirect URIs:
     ```
     http://localhost:8080/oauth2/callback/google
     https://tu-dominio.com/oauth2/callback/google
     ```

5. **Copiar credenciales**
   ```properties
   spring.security.oauth2.client.registration.google.client-id=tu_client_id_aqui
   spring.security.oauth2.client.registration.google.client-secret=tu_client_secret_aqui
   ```

6. **Configurar pantalla de consentimiento**
   - OAuth consent screen
   - Agregar scopes: email, profile
   - Agregar usuarios de prueba (en desarrollo)

---

### 5. OAuth2 - GitHub ⚠️

**Estado**: ❌ No configurado

#### Pasos para configurar:

1. **Ir a GitHub Settings**
   - https://github.com/settings/developers

2. **New OAuth App**
   - Application name: ONE Online
   - Homepage URL: http://localhost:8080
   - Authorization callback URL:
     ```
     http://localhost:8080/oauth2/callback/github
     https://tu-dominio.com/oauth2/callback/github
     ```

3. **Copiar credenciales**
   ```properties
   spring.security.oauth2.client.registration.github.client-id=tu_client_id_aqui
   spring.security.oauth2.client.registration.github.client-secret=tu_client_secret_aqui
   ```

---

## 🟡 CONFIGURACIONES OPCIONALES

### 6. Profiles de Spring

**Configuración actual**: Usa `application.properties` por defecto

#### Crear profiles para ambientes:

**application-dev.properties** (Desarrollo):
```properties
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
logging.level.com.oneonline.backend=DEBUG
```

**application-prod.properties** (Producción):
```properties
spring.jpa.show-sql=false
logging.level.root=WARN
logging.level.com.oneonline.backend=INFO
server.error.include-stacktrace=never
```

Activar profile:
```bash
# Desarrollo:
SPRING_PROFILES_ACTIVE=dev java -jar app.jar

# Producción:
SPRING_PROFILES_ACTIVE=prod java -jar app.jar
```

---

### 7. Logging Personalizado

**Estado**: Configuración básica presente

#### Mejorar logging para producción:

Crear `logback-spring.xml`:
```xml
<configuration>
    <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>logs/oneonline.log</file>
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <fileNamePattern>logs/oneonline-%d{yyyy-MM-dd}.log</fileNamePattern>
            <maxHistory>30</maxHistory>
        </rollingPolicy>
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss} - %msg%n</pattern>
        </encoder>
    </appender>

    <root level="INFO">
        <appender-ref ref="FILE" />
    </root>
</configuration>
```

---

### 8. Health Check y Monitoring

**Estado**: Actuator configurado básicamente

#### Exponer más endpoints (opcional):

```properties
# application.properties
management.endpoints.web.exposure.include=health,info,metrics,prometheus
management.endpoint.health.show-details=always

# Agregar información de build
management.info.git.mode=full
```

---

### 9. Caché (Redis) - OPCIONAL

**Estado**: No configurado (no es necesario para empezar)

Si tu aplicación crece, considera agregar Redis para:
- Caché de sesiones de juego
- Rate limiting
- Leaderboard en tiempo real

```gradle
// build.gradle
implementation 'org.springframework.boot:spring-boot-starter-data-redis'
```

---

## 📝 CHECKLIST DE CONFIGURACIÓN

Antes de desplegar a producción, verifica:

### Seguridad
- [ ] JWT_SECRET cambiado a valor seguro aleatorio
- [ ] Contraseñas de base de datos son seguras
- [ ] OAuth2 configurado con URLs de producción
- [ ] CORS configurado solo para dominios permitidos
- [ ] Variables sensibles en variables de entorno (no en código)

### Base de Datos
- [ ] Base de datos PostgreSQL creada
- [ ] Usuario de base de datos con permisos correctos
- [ ] Migraciones Flyway probadas
- [ ] Backup configurado (en producción)

### Frontend
- [ ] URL del frontend correcta en CORS
- [ ] WebSocket URL correcta en frontend
- [ ] OAuth2 redirect URLs actualizadas

### Logging y Monitoring
- [ ] Logs configurados para producción
- [ ] Health check funcionando
- [ ] Monitoreo configurado (opcional)

### Performance
- [ ] Pool de conexiones de base de datos configurado
- [ ] Timeouts apropiados
- [ ] Límites de request size configurados

---

## 🚀 GUÍA RÁPIDA DE DESPLIEGUE

### Desarrollo Local
```bash
# 1. Configurar PostgreSQL local
# 2. Crear .env con variables
# 3. Ejecutar:
./gradlew bootRun
```

### Despliegue Railway.app (Recomendado)
```bash
# 1. Crear cuenta en railway.app
# 2. Crear nuevo proyecto
# 3. Agregar PostgreSQL addon
# 4. Conectar repositorio GitHub
# 5. Configurar variables de entorno en Railway
# 6. Deploy automático
```

### Despliegue Heroku
```bash
# 1. Instalar Heroku CLI
# 2. Login: heroku login
# 3. Crear app: heroku create oneonline-backend
# 4. Agregar PostgreSQL: heroku addons:create heroku-postgresql
# 5. Configurar variables: heroku config:set JWT_SECRET=...
# 6. Deploy: git push heroku main
```

### Docker (Avanzado)
```bash
# 1. Build: docker build -t oneonline-backend .
# 2. Run: docker run -p 8080:8080 --env-file .env oneonline-backend
```

---

## 📞 SOPORTE

Si tienes problemas con la configuración:

1. **Revisa los logs**: `tail -f logs/oneonline.log`
2. **Verifica variables de entorno**: `echo $DATABASE_URL`
3. **Prueba conexión a BD**: `psql -h localhost -U oneonline_user -d oneonline_db`
4. **Revisa el README.md** para más detalles
5. **Contacta**: juangallardocsfn@gmail.com

---

## 🔗 RECURSOS ÚTILES

- [Spring Boot Docs](https://spring.io/projects/spring-boot)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Google OAuth2 Setup](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth2 Setup](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Railway.app Docs](https://docs.railway.app/)
- [JWT.io](https://jwt.io/)

---

**Última actualización**: Noviembre 2025
**Versión del proyecto**: 1.0.0
