#!/bin/bash

# Script de Verificación de Configuración GitHub OAuth2
# Este script verifica que todo esté configurado correctamente

echo "================================================"
echo "🔍 VERIFICADOR DE CONFIGURACIÓN GITHUB OAUTH2"
echo "================================================"
echo ""

ERRORS=0
WARNINGS=0

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funciones auxiliares
check_ok() {
    echo -e "${GREEN}✓${NC} $1"
}

check_error() {
    echo -e "${RED}✗${NC} $1"
    ((ERRORS++))
}

check_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

# 1. Verificar archivos .env
echo "📁 Verificando archivos de configuración..."
echo ""

if [ -f "backend/.env" ]; then
    check_ok "Archivo backend/.env existe"

    # Verificar GitHub Client ID
    if grep -q "^GITHUB_CLIENT_ID=" backend/.env && ! grep -q "^GITHUB_CLIENT_ID=$" backend/.env && ! grep -q "your_github_client_id" backend/.env; then
        check_ok "GITHUB_CLIENT_ID configurado"
    else
        check_error "GITHUB_CLIENT_ID no configurado en backend/.env"
        echo "   → Edita backend/.env y agrega tu Client ID de GitHub"
    fi

    # Verificar GitHub Client Secret
    if grep -q "^GITHUB_CLIENT_SECRET=" backend/.env && ! grep -q "^GITHUB_CLIENT_SECRET=$" backend/.env && ! grep -q "your_github_client_secret" backend/.env; then
        check_ok "GITHUB_CLIENT_SECRET configurado"
    else
        check_error "GITHUB_CLIENT_SECRET no configurado en backend/.env"
        echo "   → Edita backend/.env y agrega tu Client Secret de GitHub"
    fi

    # Verificar Frontend URL
    if grep -q "^FRONTEND_URL=" backend/.env; then
        FRONTEND_URL=$(grep "^FRONTEND_URL=" backend/.env | cut -d'=' -f2)
        check_ok "FRONTEND_URL configurado: $FRONTEND_URL"
    else
        check_warning "FRONTEND_URL no configurado (usará default)"
    fi

    # Verificar Database URL
    if grep -q "^DATABASE_URL=" backend/.env; then
        check_ok "DATABASE_URL configurado"
    else
        check_warning "DATABASE_URL no configurado (usará default)"
    fi

else
    check_error "Archivo backend/.env NO existe"
    echo "   → Ejecuta: cp backend/.env.example backend/.env"
    echo "   → Luego edita backend/.env con tus credenciales"
fi

echo ""

if [ -f "frontend/.env.local" ]; then
    check_ok "Archivo frontend/.env.local existe"

    # Verificar API URL
    if grep -q "^NEXT_PUBLIC_API_URL=" frontend/.env.local; then
        API_URL=$(grep "^NEXT_PUBLIC_API_URL=" frontend/.env.local | cut -d'=' -f2)
        check_ok "NEXT_PUBLIC_API_URL configurado: $API_URL"
    else
        check_warning "NEXT_PUBLIC_API_URL no configurado (usará default)"
    fi
else
    check_warning "Archivo frontend/.env.local NO existe (no es crítico)"
    echo "   → Recomendado: cp frontend/.env.local.example frontend/.env.local"
fi

echo ""
echo "================================================"

# 2. Verificar que PostgreSQL esté corriendo
echo "🐘 Verificando PostgreSQL..."
echo ""

if command -v docker &> /dev/null; then
    if docker ps | grep -q postgres; then
        check_ok "PostgreSQL corriendo en Docker"
    else
        check_warning "PostgreSQL no encontrado en Docker"
        echo "   → Ejecuta: docker-compose up -d postgres"
    fi
elif command -v pg_isready &> /dev/null; then
    if pg_isready -q; then
        check_ok "PostgreSQL corriendo localmente"
    else
        check_warning "PostgreSQL no está corriendo"
        echo "   → Ejecuta: sudo service postgresql start"
    fi
else
    check_warning "No se puede verificar PostgreSQL (docker o pg_isready no disponibles)"
fi

echo ""
echo "================================================"

# 3. Verificar puertos
echo "🔌 Verificando puertos..."
echo ""

if command -v lsof &> /dev/null; then
    if lsof -i :8080 &> /dev/null; then
        check_ok "Puerto 8080 en uso (backend corriendo)"
    else
        check_warning "Puerto 8080 libre (backend no está corriendo)"
        echo "   → Ejecuta: cd backend && ./gradlew bootRun"
    fi

    if lsof -i :3000 &> /dev/null; then
        check_ok "Puerto 3000 en uso (frontend corriendo)"
    else
        check_warning "Puerto 3000 libre (frontend no está corriendo)"
        echo "   → Ejecuta: cd frontend && npm run dev"
    fi
elif command -v netstat &> /dev/null; then
    if netstat -tuln | grep -q ":8080"; then
        check_ok "Puerto 8080 en uso (backend corriendo)"
    else
        check_warning "Puerto 8080 libre (backend no está corriendo)"
    fi

    if netstat -tuln | grep -q ":3000"; then
        check_ok "Puerto 3000 en uso (frontend corriendo)"
    else
        check_warning "Puerto 3000 libre (frontend no está corriendo)"
    fi
else
    check_warning "No se pueden verificar puertos (lsof/netstat no disponibles)"
fi

echo ""
echo "================================================"

# 4. Verificar código actualizado
echo "💾 Verificando código actualizado..."
echo ""

if grep -q "GitHub: Si el email es privado" backend/src/main/java/com/oneonline/backend/security/OAuth2SuccessHandler.java 2>/dev/null; then
    check_ok "OAuth2SuccessHandler actualizado para manejar emails privados"
else
    check_error "OAuth2SuccessHandler NO actualizado"
    echo "   → El código necesita ser actualizado para manejar emails privados de GitHub"
fi

echo ""
echo "================================================"

# 5. Verificar dependencias frontend
echo "📦 Verificando dependencias frontend..."
echo ""

if [ -d "frontend/node_modules" ]; then
    check_ok "node_modules instalados"
else
    check_warning "node_modules no instalados"
    echo "   → Ejecuta: cd frontend && npm install"
fi

echo ""
echo "================================================"
echo "📊 RESUMEN"
echo "================================================"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ TODO CONFIGURADO CORRECTAMENTE${NC}"
    echo ""
    echo "🚀 Pasos siguientes:"
    echo "   1. Inicia el backend: cd backend && ./gradlew bootRun"
    echo "   2. Inicia el frontend: cd frontend && npm run dev"
    echo "   3. Abre: http://localhost:3000/login"
    echo "   4. Click en el botón 'GitHub'"
    echo ""
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ CONFIGURACIÓN CASI COMPLETA (${WARNINGS} advertencias)${NC}"
    echo ""
    echo "Puedes continuar, pero revisa las advertencias arriba."
    echo ""
else
    echo -e "${RED}✗ CONFIGURACIÓN INCOMPLETA (${ERRORS} errores, ${WARNINGS} advertencias)${NC}"
    echo ""
    echo "Por favor corrige los errores marcados arriba antes de continuar."
    echo ""
    echo "📖 Guías disponibles:"
    echo "   - CONFIGURACION_RAPIDA_GITHUB.md (guía paso a paso)"
    echo "   - SOLUCION_GITHUB_OAUTH.md (solución detallada)"
    echo ""
fi

exit $ERRORS
