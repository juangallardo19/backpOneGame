# 🛠️ Guía de Configuración Completa

Instrucciones paso a paso para configurar el proyecto ONE Game (Backend + Frontend).

## 📋 Índice

1. [Requisitos Previos](#requisitos-previos)
2. [Configuración Rápida con Docker](#opción-1-configuración-con-docker-recomendado)
3. [Configuración Manual](#opción-2-configuración-manual)
4. [Configuración de OAuth2](#configuración-de-oauth2-opcional)
5. [Problemas Comunes](#problemas-comunes)

---

## 🔧 Requisitos Previos

Elige según tu método de instalación:

### Para Docker (Opción 1)
- ✅ Docker Desktop instalado ([Descargar](https://www.docker.com/products/docker-desktop))
- ✅ Docker Compose incluido en Docker Desktop

### Para Instalación Manual (Opción 2)
- ✅ Java 21 o superior ([Descargar](https://adoptium.net/))
- ✅ Node.js 20 o superior ([Descargar](https://nodejs.org/))
- ✅ PostgreSQL 15 o superior ([Descargar](https://www.postgresql.org/download/))
- ✅ Git instalado

---

## 🐳 Opción 1: Configuración con Docker (Recomendado)

La forma más rápida de empezar.

### Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/juangallardo19/backpOneGame.git
cd backpOneGame
```

### Paso 2: Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar con tu editor favorito
nano .env   # o vim, o code .env
```

**Mínimo requerido en `.env`:**
```env
DATABASE_PASSWORD=cambiar_esto_por_password_seguro
JWT_SECRET=genera_uno_nuevo_con_comando_abajo
```

**Generar JWT Secret seguro:**
```bash
# Linux/Mac:
openssl rand -base64 64

# Windows PowerShell:
[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### Paso 3: Levantar los Servicios

```bash
# Construir y levantar todos los contenedores
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f

# Ver solo logs del backend
docker-compose logs -f backend

# Ver solo logs del frontend
docker-compose logs -f frontend
```

### Paso 4: Verificar que Todo Funciona

**Espera 1-2 minutos para que los servicios inicien**, luego:

```bash
# Verificar estado de los contenedores
docker-compose ps

# Deberías ver 3 servicios "Up":
# - oneonline-postgres
# - oneonline-backend
# - oneonline-frontend
```

**Acceder a las aplicaciones:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- Backend Health: http://localhost:8080/actuator/health

### Paso 5: Crear tu Primera Cuenta

1. Abre http://localhost:3000
2. Haz clic en "REGISTRARSE"
3. Completa el formulario
4. ¡Empieza a jugar!

---

## 🔨 Opción 2: Configuración Manual

Para desarrollo avanzado o si no quieres usar Docker.

### A. Configurar Base de Datos PostgreSQL

#### En Linux/Mac:

```bash
# Instalar PostgreSQL
# Ubuntu/Debian:
sudo apt update
sudo apt install postgresql postgresql-contrib

# MacOS:
brew install postgresql@15
brew services start postgresql@15

# Crear base de datos
sudo -u postgres psql
```

#### En Windows:

1. Descargar PostgreSQL desde https://www.postgresql.org/download/windows/
2. Ejecutar instalador (recordar la contraseña del usuario `postgres`)
3. Abrir pgAdmin o psql

#### Crear Base de Datos y Usuario:

```sql
-- En psql ejecutar:
CREATE DATABASE oneonline_db;
CREATE USER oneonline_user WITH PASSWORD 'tu_password_seguro';
GRANT ALL PRIVILEGES ON DATABASE oneonline_db TO oneonline_user;

-- Dar permisos al schema
\c oneonline_db
GRANT ALL ON SCHEMA public TO oneonline_user;

-- Salir
\q
```

### B. Configurar Backend

```bash
cd backend

# 1. Copiar archivo de configuración
cp .env.example .env

# 2. Editar .env con tus valores
nano .env  # o tu editor favorito
```

**Configurar `backend/.env`:**
```env
DATABASE_URL=jdbc:postgresql://localhost:5432/oneonline_db
DATABASE_USER=oneonline_user
DATABASE_PASSWORD=tu_password_que_pusiste_arriba

JWT_SECRET=genera_uno_nuevo_con_openssl_rand_-base64_64

FRONTEND_URL=http://localhost:3000
```

**Ejecutar backend:**
```bash
# Dar permisos al script (Linux/Mac):
chmod +x gradlew

# Ejecutar:
./gradlew bootRun

# Windows:
gradlew.bat bootRun
```

El backend estará en: http://localhost:8080

### C. Configurar Frontend

**Nueva terminal:**
```bash
cd frontend

# 1. Instalar dependencias
npm install

# 2. Copiar configuración
cp .env.local.example .env.local

# 3. Editar .env.local
nano .env.local
```

**Configurar `frontend/.env.local`:**
```env
# Para desarrollo local:
NEXT_PUBLIC_API_URL=http://localhost:8080

# O para usar el backend de Railway:
# NEXT_PUBLIC_API_URL=https://oneonlinebackend-production.up.railway.app
```

**Ejecutar frontend:**
```bash
npm run dev
```

El frontend estará en: http://localhost:3000

---

## 🔐 Configuración de OAuth2 (Opcional)

Permite login con Google y GitHub.

### Google OAuth2

1. **Ir a Google Cloud Console**: https://console.cloud.google.com/

2. **Crear proyecto:**
   - Click "Crear proyecto"
   - Nombre: "ONE Game"
   - Click "Crear"

3. **Configurar pantalla de consentimiento:**
   - APIs y servicios → Pantalla de consentimiento OAuth
   - Tipo: Externo
   - Nombre de la aplicación: ONE Game
   - Correo de asistencia: tu correo
   - Agregar scopes: `email`, `profile`

4. **Crear credenciales:**
   - APIs y servicios → Credenciales
   - Crear credenciales → ID de cliente de OAuth 2.0
   - Tipo de aplicación: Aplicación web
   - URIs de redireccionamiento autorizados:
     ```
     http://localhost:8080/oauth2/callback/google
     ```
   - Click "Crear"

5. **Copiar credenciales a `.env`:**
   ```env
   GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=tu-client-secret
   ```

### GitHub OAuth2

1. **Ir a GitHub Settings**: https://github.com/settings/developers

2. **Crear OAuth App:**
   - Click "New OAuth App"
   - Application name: ONE Game
   - Homepage URL: http://localhost:8080
   - Authorization callback URL: `http://localhost:8080/oauth2/callback/github`
   - Click "Register application"

3. **Generar Client Secret:**
   - Click "Generate a new client secret"
   - Copiar el secret (solo se muestra una vez)

4. **Copiar credenciales a `.env`:**
   ```env
   GITHUB_CLIENT_ID=tu-github-client-id
   GITHUB_CLIENT_SECRET=tu-github-client-secret
   ```

5. **Reiniciar backend:**
   ```bash
   # Si usas Docker:
   docker-compose restart backend

   # Si es manual:
   # Ctrl+C y luego ./gradlew bootRun
   ```

---

## 🚀 Usar Backend de Railway (Sin DB Local)

Si no quieres configurar PostgreSQL localmente:

### Frontend → Backend Railway

**En `frontend/.env.local`:**
```env
NEXT_PUBLIC_API_URL=https://oneonlinebackend-production.up.railway.app
```

Luego:
```bash
cd frontend
npm run dev
```

¡Listo! Estás usando el backend en Railway.

---

## 🧪 Verificar Instalación

### 1. Backend Health Check
```bash
curl http://localhost:8080/actuator/health
```

Deberías ver:
```json
{"status":"UP"}
```

### 2. Probar Registro de Usuario
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "nickname": "testuser",
    "password": "Test123!"
  }'
```

### 3. Frontend
Abre http://localhost:3000 y verifica que cargan las animaciones.

---

## 📦 Comandos Útiles

### Docker

```bash
# Detener servicios
docker-compose down

# Detener y eliminar volúmenes (limpia DB)
docker-compose down -v

# Reconstruir después de cambios
docker-compose up -d --build

# Ver logs
docker-compose logs -f

# Entrar a un contenedor
docker-compose exec backend sh
docker-compose exec frontend sh
docker-compose exec postgres psql -U oneonline_user -d oneonline_db
```

### Backend

```bash
# Ejecutar tests
./gradlew test

# Limpiar build
./gradlew clean

# Build JAR
./gradlew bootJar

# Ver dependencias
./gradlew dependencies
```

### Frontend

```bash
# Dev
npm run dev

# Build
npm run build

# Producción
npm run start

# Linter
npm run lint
```

---

## ❌ Problemas Comunes

### 1. "Connection refused" al backend

**Síntomas:**
- Frontend no se conecta al backend
- Error en navegador: `ERR_CONNECTION_REFUSED`

**Solución:**
```bash
# Verificar que el backend esté corriendo
curl http://localhost:8080/actuator/health

# Si no responde, revisar logs:
docker-compose logs backend
# o si es manual, ver la terminal donde corre el backend
```

### 2. "relation does not exist" en PostgreSQL

**Síntomas:**
- Error de SQL: `ERROR: relation "users" does not exist`

**Causa:** Flyway no ejecutó las migraciones.

**Solución:**
```bash
# Verificar migraciones
docker-compose exec postgres psql -U oneonline_user -d oneonline_db -c "\dt"

# Si no hay tablas, revisar logs del backend:
docker-compose logs backend | grep Flyway

# Recrear base de datos:
docker-compose down -v
docker-compose up -d
```

### 3. "JWT secret is not configured"

**Síntomas:**
- Error al iniciar backend
- Logs: `JWT secret is too short`

**Solución:**
```bash
# Generar nuevo secret
openssl rand -base64 64

# Agregar a .env:
JWT_SECRET=el_secret_generado
```

### 4. Frontend no carga estilos

**Síntomas:**
- Página sin estilos, solo texto
- Error en consola: `Failed to load Tailwind`

**Solución:**
```bash
cd frontend
rm -rf .next node_modules
npm install
npm run dev
```

### 5. "CORS error" en navegador

**Síntomas:**
- Error en consola: `Access to fetch blocked by CORS policy`

**Solución:**
```bash
# Verificar FRONTEND_URL en backend/.env:
FRONTEND_URL=http://localhost:3000

# Si usas otro puerto, cambiarlo:
FRONTEND_URL=http://localhost:4200

# Reiniciar backend después del cambio
```

### 6. Docker no inicia (Windows)

**Síntomas:**
- Error: `Cannot connect to Docker daemon`

**Solución:**
1. Abrir Docker Desktop
2. Esperar a que inicie completamente (ícono verde)
3. Reintentar: `docker-compose up -d`

---

## 🌐 Despliegue a Producción

### Backend → Railway

1. **Crear cuenta**: https://railway.app/
2. **Nuevo proyecto**: "New Project" → "Deploy from GitHub repo"
3. **Conectar repo**: Seleccionar `backpOneGame`
4. **Configurar variables**: Settings → Variables
   ```
   DATABASE_URL=postgresql://...  (automático con Railway Postgres)
   JWT_SECRET=generar_uno_nuevo
   FRONTEND_URL=https://tu-frontend.vercel.app
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```
5. **Agregar PostgreSQL**: "+ New" → Database → PostgreSQL
6. **Deploy**: Automático al hacer push

### Frontend → Vercel

1. **Importar proyecto**: https://vercel.com/new
2. **Conectar GitHub**: Seleccionar repo `backpOneGame`
3. **Configurar**:
   - Framework Preset: Next.js
   - Root Directory: `frontend`
4. **Variables de entorno**:
   ```
   NEXT_PUBLIC_API_URL=https://tu-backend.railway.app
   ```
5. **Deploy**: Click "Deploy"

---

## 📞 Soporte

¿Problemas con la configuración?

1. **Revisa los logs**: `docker-compose logs -f`
2. **Issues en GitHub**:
   - Backend: https://github.com/juangallardo19/OneOnlineBackend/issues
   - Frontend: https://github.com/seba4s/ONE-GAME/issues
3. **Documentación**:
   - [Backend README](backend/README.md)
   - [Backend CONFIGURACION](backend/CONFIGURACION.md)
   - [Frontend README](frontend/README.md)

---

**Última actualización**: Noviembre 2025
