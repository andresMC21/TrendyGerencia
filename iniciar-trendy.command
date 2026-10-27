#!/bin/bash
# Trendy: levanta la base de datos, la API y la página web en macOS.
# Doble clic en Finder o: ./iniciar-trendy.command
set -uo pipefail
cd "$(dirname "$0")"
ROOT="$(pwd)"
mkdir -p .trendy-logs
exec 3>&1 4>&2
exec > >(tee .trendy-logs/iniciar.log) 2>&1

paso() { printf "\n\033[1;35m▶ %s\033[0m\n" "$1"; }
falla() { printf "\n\033[1;31m✖ %s\033[0m\n" "$1"; echo "FALLO: $1"; read -r -p "Presiona Enter para cerrar"; exit 1; }

export PATH="/opt/homebrew/bin:/usr/local/bin:/Applications/Docker.app/Contents/Resources/bin:$PATH"

paso "Node.js"
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  . "$HOME/.nvm/nvm.sh"
  nvm use 24 >/dev/null 2>&1 || nvm install 24 || falla "No se pudo instalar Node 24 con nvm"
fi
command -v node >/dev/null || falla "Node.js no está instalado"
NODE_MAJOR=$(node -p 'process.versions.node.split(".")[0]')
[ "$NODE_MAJOR" -ge 24 ] || falla "Se necesita Node 24 o superior (tienes $(node -v))"
echo "Node $(node -v)"

paso "Base de datos (docker compose)"
command -v docker >/dev/null || falla "No encuentro el comando docker"
docker info >/dev/null 2>&1 || falla "Docker no está corriendo: abre Docker Desktop"

# Un trendy-db creado antes a mano (sin docker compose) se detiene y se
# renombra a trendy-db-anterior para no perder sus datos.
if docker inspect trendy-db >/dev/null 2>&1 && \
   [ -z "$(docker inspect -f '{{index .Config.Labels "com.docker.compose.project"}}' trendy-db)" ]; then
  echo "Encontré un trendy-db anterior (sin docker compose): lo renombro a trendy-db-anterior"
  docker stop trendy-db >/dev/null
  docker rename trendy-db trendy-db-anterior || falla "No pude renombrar el trendy-db anterior"
fi

docker compose up -d --wait db || falla "No se pudo levantar la base de datos con docker compose"
echo "Base de datos lista: localhost:${DB_PORT:-5433} · base trendy · usuario trendy"

paso "API (back/)"
cd "$ROOT/back"
[ -f .env ] || cp .env.example .env
[ -d node_modules ] || npm install || falla "npm install falló en back/"
migrado=0
for intento in 1 2 3 4 5; do
  npm run migration:run && { migrado=1; break; }
  echo "La base aún no acepta conexiones, reintento en 5 s ($intento/5)..."; sleep 5
done
[ $migrado = 1 ] || falla "Las migraciones fallaron"
npm run seed || falla "El seed falló"

lsof -ti tcp:3000 | xargs kill 2>/dev/null
nohup npm run start:dev > "$ROOT/.trendy-logs/api.log" 2>&1 &
echo "Esperando la API..."
for i in $(seq 1 90); do curl -sf http://localhost:3000/api/health >/dev/null && break; sleep 1; done
curl -sf http://localhost:3000/api/health >/dev/null || falla "La API no arrancó (revisa .trendy-logs/api.log)"
echo "API lista en http://localhost:3000/api  ·  Swagger: http://localhost:3000/api/docs"

paso "Página web (web/)"
cd "$ROOT/web"
[ -d node_modules ] || npm install || falla "npm install falló en web/"
for port in 5173 8081; do lsof -ti tcp:$port | xargs kill 2>/dev/null; done
cat <<MSG

  ┌──────────────────────────────────────────────────────────┐
  │  Trendy web:  http://localhost:5173                       │
  │  API:         http://localhost:3000/api  (Swagger: /docs) │
  │  Usuario fijo: demo@trendy.local  /  Trendy123            │
  │  Para detener todo: Ctrl+C en esta ventana                │
  └──────────────────────────────────────────────────────────┘

MSG
trap 'lsof -ti tcp:3000 | xargs kill 2>/dev/null' EXIT
(sleep 4; open http://localhost:5173) &
exec 1>&3 2>&4
npm run dev
