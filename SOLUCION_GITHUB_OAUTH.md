# Solución: Configurar GitHub OAuth2

## Paso 1: Crear GitHub OAuth App

1. Ve a: https://github.com/settings/developers
2. Click en **"OAuth Apps"** → **"New OAuth App"**
3. Completa el formulario:
   - **Application name**: `ONE Game` (o el nombre que prefieras)
   - **Homepage URL**: `http://localhost:3000` (para desarrollo local)
   - **Authorization callback URL**: `http://localhost:8080/oauth2/callback/github` ⚠️ **MUY IMPORTANTE**
4. Click en **"Register application"**
5. GitHub te mostrará:
   - **Client ID**: Cópialo
   - Click en **"Generate a new client secret"** y cópialo también

## Paso 2: Configurar Variables de Entorno en el Backend

Crea o edita el archivo `/backend/.env`:

```bash
# ========================================
# OAUTH2 - GITHUB
# ========================================
GITHUB_CLIENT_ID=tu_client_id_aqui
GITHUB_CLIENT_SECRET=tu_client_secret_aqui

# ========================================
# FRONTEND CONFIGURATION
# ========================================
FRONTEND_URL=http://localhost:3000

# ========================================
# DATABASE (si no lo tienes)
# ========================================
DATABASE_URL=jdbc:postgresql://localhost:5432/oneonline_db
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres

# ========================================
# JWT SECRET (puedes usar el que está)
# ========================================
JWT_SECRET=YXNkZmphc2xrZGZqYXNsa2RqZmxrYXNqZGZsa2Fqc2RmbGtqYXNkbGZrYWpzZGxmamFsc2RramZhbHNrZGpmYWxza2RqZmxhc2tkamZhbHNrZGZq
```

## Paso 3: Configurar Variable de Entorno en el Frontend

Crea o edita el archivo `/frontend/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Paso 4: Verificar la Configuración del Backend

Asegúrate que el archivo `backend/src/main/resources/application.properties` tenga:

```properties
# OAUTH2 - GitHub
spring.security.oauth2.client.registration.github.client-id=${GITHUB_CLIENT_ID:}
spring.security.oauth2.client.registration.github.client-secret=${GITHUB_CLIENT_SECRET:}
spring.security.oauth2.client.registration.github.scope=user:email
spring.security.oauth2.client.registration.github.redirect-uri={baseUrl}/oauth2/callback/github
```

✅ **Esto ya está configurado correctamente en tu proyecto**

## Paso 5: Problema Común - Email Privado en GitHub

Si tu email en GitHub es privado, GitHub NO enviará tu email real. Tienes dos opciones:

### Opción A: Hacer tu email público en GitHub (temporal para pruebas)
1. Ve a: https://github.com/settings/emails
2. Desmarca: **"Keep my email addresses private"**

### Opción B: Modificar el código para manejar emails privados (RECOMENDADO)

El problema está en `OAuth2SuccessHandler.java` línea 132. GitHub puede devolver:
- Email real si es público
- Email tipo `12345+username@users.noreply.github.com` si es privado
- `null` si no hay permisos

**Solución:**

Modifica el método `extractEmail` en `/backend/src/main/java/com/oneonline/backend/security/OAuth2SuccessHandler.java`:

```java
private String extractEmail(OAuth2User oauth2User, String provider) {
    String email = oauth2User.getAttribute("email");

    // GitHub: Si el email es privado, usar el email noreply
    if ("GITHUB".equals(provider) && (email == null || email.isEmpty())) {
        // GitHub siempre proporciona este email aunque el email real sea privado
        String login = oauth2User.getAttribute("login");
        Integer id = oauth2User.getAttribute("id");
        if (login != null && id != null) {
            email = id + "+" + login + "@users.noreply.github.com";
        }
    }

    return email;
}
```

## Paso 6: Verificar que el Backend esté corriendo

```bash
# En la carpeta backend/
./gradlew bootRun

# O si estás usando Docker:
docker-compose up -d postgres
./gradlew bootRun
```

Deberías ver en los logs:
```
Started BackendApplication in X seconds
```

## Paso 7: Verificar que el Frontend esté corriendo

```bash
# En la carpeta frontend/
npm run dev
```

Deberías ver:
```
Ready on http://localhost:3000
```

## Paso 8: Probar el Login

1. Ve a: http://localhost:3000/login
2. Click en el botón **"GitHub"**
3. Deberías ser redirigido a GitHub para autorizar
4. Después de autorizar, serás redirigido de vuelta a: http://localhost:3000/auth/callback?token=...

## Problemas Comunes y Soluciones

### Error: "redirect_uri_mismatch"
**Causa:** La callback URL en GitHub no coincide exactamente
**Solución:** Verifica que en GitHub tengas EXACTAMENTE: `http://localhost:8080/oauth2/callback/github`

### Error: "401 Unauthorized" o "403 Forbidden"
**Causa:** Client ID o Secret incorrectos
**Solución:** Verifica que copiaste correctamente las credenciales en el archivo `.env`

### Error: "Email is null"
**Causa:** El email en GitHub es privado
**Solución:** Aplica la modificación del Paso 5 - Opción B

### El backend redirige pero el frontend muestra error
**Causa:** CORS o frontend URL incorrecta
**Solución:** Verifica que `FRONTEND_URL=http://localhost:3000` esté en el `.env` del backend

### Logs para depurar

Activa los logs de OAuth2 en `application.properties`:

```properties
logging.level.org.springframework.security.oauth2=DEBUG
logging.level.org.springframework.security.web=DEBUG
```

Reinicia el backend y revisa los logs cuando hagas login.

## Verificación Final

Si todo está configurado correctamente, deberías ver en los logs del backend:

```
OAuth2 authentication successful
OAuth2 login: email=usuario@example.com, provider=GITHUB
Redirecting to frontend: http://localhost:3000/auth/callback?token=...
```

Y en el frontend, después del login:
```
¡Bienvenido!
Autenticación exitosa
```

---

## Resumen de Archivos a Crear/Editar

1. ✅ **backend/.env** - Agregar GITHUB_CLIENT_ID y GITHUB_CLIENT_SECRET
2. ✅ **frontend/.env.local** - Agregar NEXT_PUBLIC_API_URL
3. ⚠️ **OAuth2SuccessHandler.java** - Modificar extractEmail() para manejar emails privados de GitHub
4. ✅ **GitHub OAuth App** - Crear en https://github.com/settings/developers

¿Necesitas ayuda con alguno de estos pasos?
