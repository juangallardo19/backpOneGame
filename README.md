# 🎮 ONE Game - Monorepo Full Stack

Monorepo que combina el backend y frontend del juego de cartas ONE/UNO online.

## 📁 Estructura del Proyecto

```
backpOneGame/
├── backend/          # Spring Boot 3.5.7 + Java 21
│   ├── src/
│   ├── build.gradle
│   └── README.md
├── frontend/         # Next.js 15 + TypeScript
│   ├── app/
│   ├── components/
│   ├── services/
│   ├── package.json
│   └── README.md
├── docker-compose.yml    # Orquestación de servicios
├── .env.example          # Variables de entorno
└── README.md            # Este archivo
```

## 🚀 Quick Start

### Opción 1: Desarrollo Local con Docker (Recomendado)

```bash
# 1. Clonar y configurar
git clone https://github.com/juangallardo19/backpOneGame.git
cd backpOneGame
cp .env.example .env
# Editar .env con tus credenciales

# 2. Levantar todo con Docker
docker-compose up -d

# Servicios disponibles:
# - Frontend: http://localhost:3000
# - Backend: http://localhost:8080
# - PostgreSQL: localhost:5432
```

### Opción 2: Desarrollo Manual

#### Backend (Puerto 8080)
```bash
cd backend

# 1. Configurar PostgreSQL (ver backend/CONFIGURACION.md)
# 2. Crear .env (copiar desde backend/.env.example)
# 3. Ejecutar
./gradlew bootRun
```

#### Frontend (Puerto 3000)
```bash
cd frontend

# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.local.example .env.local

# 3. Ejecutar
npm run dev
```

## ⚙️ Configuración

### Variables de Entorno Principales

**Backend** (crear `backend/.env`):
```env
# Base de datos
DATABASE_URL=jdbc:postgresql://localhost:5432/oneonline_db
DATABASE_USER=oneonline_user
DATABASE_PASSWORD=tu_password

# JWT
JWT_SECRET=genera_uno_con_openssl_rand_-base64_64

# OAuth2 (opcional)
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_secret
GITHUB_CLIENT_ID=tu_github_client_id
GITHUB_CLIENT_SECRET=tu_github_secret

# CORS
FRONTEND_URL=http://localhost:3000
```

**Frontend** (crear `frontend/.env.local`):
```env
# API Backend
NEXT_PUBLIC_API_URL=http://localhost:8080

# Si usas el backend de Railway (producción):
# NEXT_PUBLIC_API_URL=https://oneonlinebackend-production.up.railway.app
```

## 🗄️ Base de Datos

### PostgreSQL Local

```bash
# Instalar PostgreSQL
# Ubuntu/Debian:
sudo apt install postgresql

# Crear base de datos
sudo -u postgres psql
CREATE DATABASE oneonline_db;
CREATE USER oneonline_user WITH PASSWORD 'tu_password';
GRANT ALL PRIVILEGES ON DATABASE oneonline_db TO oneonline_user;
\q
```

### PostgreSQL en la Nube (Recomendado)

Opciones gratuitas:
- **Railway.app** - Clic aquí: https://railway.app/
- **Supabase** - https://supabase.com/
- **ElephantSQL** - https://www.elephantsql.com/

## 🔌 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Info del usuario actual

### Salas de Juego
- `GET /api/rooms/public` - Listar salas públicas
- `POST /api/rooms` - Crear sala
- `POST /api/rooms/{code}/join` - Unirse a sala

### Juego
- `POST /api/game/{sessionId}/start` - Iniciar partida
- `POST /api/game/{sessionId}/play` - Jugar carta
- `POST /api/game/{sessionId}/draw` - Robar carta
- `WS /ws/game/{sessionId}` - WebSocket para eventos en tiempo real

Ver documentación completa en `backend/README.md`

## 🎯 Características

### Backend
- ✅ 11 patrones de diseño implementados
- ✅ 5 estructuras de datos personalizadas
- ✅ WebSockets para juego en tiempo real
- ✅ Sistema de bots con IA
- ✅ Ranking global TOP 100
- ✅ OAuth2 (Google + GitHub)

### Frontend
- ✅ Interfaz moderna con glassmorphism
- ✅ Animaciones 3D y partículas
- ✅ Sistema de audio completo
- ✅ Soporte 2-4 jugadores
- ✅ Configuraciones personalizables

## 📦 Tecnologías

### Backend
- Java 21
- Spring Boot 3.5.7
- PostgreSQL 15
- Flyway
- JWT + OAuth2
- WebSockets

### Frontend
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS v4
- Canvas API

## 🐳 Docker

```bash
# Levantar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Detener servicios
docker-compose down

# Reconstruir después de cambios
docker-compose up -d --build
```

## 🧪 Testing

```bash
# Backend
cd backend
./gradlew test

# Frontend
cd frontend
npm test
npm run lint
```

## 🚀 Despliegue

### Backend (Railway/Heroku)
Ver instrucciones detalladas en `backend/CONFIGURACION.md`

### Frontend (Vercel)
```bash
cd frontend
vercel deploy
```

O conecta tu repo de GitHub a Vercel para deploy automático.

## 🔗 Links de Producción

- **Backend**: https://oneonlinebackend-production.up.railway.app
- **Frontend**: (Configurar después del deploy)

## 📚 Documentación Adicional

- [Backend README](backend/README.md) - Documentación completa del backend
- [Backend CONFIGURACION](backend/CONFIGURACION.md) - Guía de configuración detallada
- [Frontend README](frontend/README.md) - Documentación del frontend

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -m 'Agregar nueva característica'`)
4. Push (`git push origin feature/nueva-caracteristica`)
5. Abre un Pull Request

## 👥 Autores

**Backend**:
- Juan Gallardo

**Frontend**:
- Sebastian Lopez
- Miguel Mendoza

## 📄 Licencia

Proyecto académico - Curso de Ingeniería de Software

## 🆘 Soporte

- Backend issues: https://github.com/juangallardo19/OneOnlineBackend/issues
- Frontend issues: https://github.com/seba4s/ONE-GAME/issues
- Monorepo issues: Abrir issue en este repositorio

---

⭐ **¡Dale una estrella si te gustó el proyecto!** ⭐
