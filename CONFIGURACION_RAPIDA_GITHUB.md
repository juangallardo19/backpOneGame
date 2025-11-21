# 🚀 Configuración Rápida de GitHub OAuth2

## ⚡ Guía Express (5 minutos)

### 1️⃣ Crear GitHub OAuth App

Abre: https://github.com/settings/developers

Click: **"New OAuth App"**

```
Application name:        ONE Game
Homepage URL:            http://localhost:3000
Callback URL:            http://localhost:8080/oauth2/callback/github
                         ⚠️ COPIA ESTO EXACTAMENTE ⚠️
```

Guarda el **Client ID** y genera un **Client Secret**

---

### 2️⃣ Configurar Backend

Copia el archivo de ejemplo:
```bash
cd backend
cp .env.example .env
```

Edita `backend/.env` y agrega tus credenciales de GitHub:

```bash
# OAUTH2 - GITHUB (PEGA TUS CREDENCIALES AQUÍ)
GITHUB_CLIENT_ID=tu_client_id_de_github_aqui
GITHUB_CLIENT_SECRET=tu_client_secret_de_github_aqui

# FRONTEND URL
FRONTEND_URL=http://localhost:3000

# DATABASE (ajusta si es necesario)
DATABASE_URL=jdbc:postgresql://localhost:5432/oneonline_db
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
```

---

### 3️⃣ Configurar Frontend

Copia el archivo de ejemplo:
```bash
cd ../frontend
cp .env.local.example .env.local
```

Edita `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
```

---

### 4️⃣ Iniciar Servicios

**Terminal 1 - Base de datos (si usas Docker):**
```bash
docker-compose up -d postgres
```

**Terminal 2 - Backend:**
```bash
cd backend
./gradlew bootRun
```

Espera a ver: `Started BackendApplication...`

**Terminal 3 - Frontend:**
```bash
cd frontend
npm install  # Solo la primera vez
npm run dev
```

Espera a ver: `Ready on http://localhost:3000`

---

### 5️⃣ Probar Login con GitHub

1. Abre: http://localhost:3000/login
2. Click en el botón **GitHub**
3. Autoriza la aplicación en GitHub
4. ¡Deberías estar dentro! 🎉

---

## ❌ Problemas Comunes

### "redirect_uri_mismatch"
- ✅ Verifica que en GitHub tengas **EXACTAMENTE**: `http://localhost:8080/oauth2/callback/github`
- ⚠️ Sin espacios, sin barra al final, exactamente esa URL

### "401 Unauthorized"
- ✅ Verifica que copiaste bien el Client ID y Client Secret
- ✅ Asegúrate que no haya espacios al inicio/final
- ✅ Regenera el Client Secret si tienes dudas

### "Email is null" o "Cannot create user"
- ✅ Ya está solucionado con la actualización del código
- ℹ️ El sistema ahora maneja emails privados de GitHub automáticamente

### El backend no inicia
```bash
# Verifica que PostgreSQL esté corriendo
docker-compose ps

# O si lo tienes instalado localmente:
sudo service postgresql status

# Crea la base de datos si no existe:
psql -U postgres -c "CREATE DATABASE oneonline_db;"
```

### El frontend no se conecta al backend
- ✅ Verifica que `NEXT_PUBLIC_API_URL=http://localhost:8080` esté en `.env.local`
- ✅ Reinicia el servidor frontend después de crear/editar `.env.local`

---

## 📝 Archivos Importantes

| Archivo | Ubicación | Para qué sirve |
|---------|-----------|----------------|
| `.env` | `/backend/` | Credenciales de GitHub, DB, JWT |
| `.env.local` | `/frontend/` | URL del backend |
| `OAuth2SuccessHandler.java` | `/backend/src/.../security/` | ✅ Ya actualizado para emails privados |

---

## 🔍 Verificar que Todo Funciona

### Backend Logs (deberías ver):
```
OAuth2 authentication successful
OAuth2 login: email=123456+usuario@users.noreply.github.com, provider=GITHUB
Redirecting to frontend: http://localhost:3000/auth/callback?token=...
```

### Frontend (deberías ver):
```
¡Bienvenido!
Autenticación exitosa
```

---

## 🆘 ¿Aún tienes problemas?

1. **Activa logs de debug** en `backend/src/main/resources/application.properties`:
   ```properties
   logging.level.org.springframework.security.oauth2=DEBUG
   logging.level.com.oneonline.backend.security=DEBUG
   ```

2. **Reinicia el backend** y observa los logs cuando hagas login

3. **Abre la consola del navegador** (F12) y busca errores

4. **Verifica las variables de entorno**:
   ```bash
   # Backend
   cd backend
   cat .env | grep GITHUB

   # Frontend
   cd frontend
   cat .env.local | grep API
   ```

---

## ✅ Checklist Final

- [ ] Creé la OAuth App en GitHub
- [ ] Copié el Client ID y Client Secret
- [ ] Creé `backend/.env` con mis credenciales
- [ ] Creé `frontend/.env.local` con la URL del backend
- [ ] PostgreSQL está corriendo
- [ ] El backend inició correctamente
- [ ] El frontend inició correctamente
- [ ] Probé el login con GitHub
- [ ] ¡Funcionó! 🎉

---

**Nota:** El código ya fue actualizado para manejar emails privados de GitHub, así que no necesitas hacer tu email público.
