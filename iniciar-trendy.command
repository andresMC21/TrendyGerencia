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

paso "Base de datos en Docker"
command -v docker >/dev/null || falla "No encuentro el comando docker"
docker info >/dev/null 2>&1 || falla "Docker no está corriendo"

DB_NAME=trendy
CID=""; DB_USER=""; DB_PASS=""; DB_PORT=""
# 0) Si ya existe el contenedor propio de Trendy (con PostGIS), se usa ese.
USAR_TRENDY_DB=0
docker ps -a --format '{{.Names}}' | grep -qx trendy-db && USAR_TRENDY_DB=1
# 1) Si no, un contenedor de Postgres ya abierto con el puerto 5432 publicado
for c in $( [ $USAR_TRENDY_DB = 1 ] || docker ps --format '{{.ID}}'); do
  img=$(docker inspect -f '{{.Config.Image}}' "$c")
  echo "$img" | grep -qiE 'postgres|postgis' || continue
  port=$(docker port "$c" 5432/tcp 2>/dev/null | head -1 | awk -F: '{print $NF}')
  [ -n "$port" ] || { echo "Contenedor $c ($img) sin puerto publicado, lo omito"; continue; }
  CID=$c; DB_PORT=$port
  envs=$(docker inspect -f '{{range .Config.Env}}{{println .}}{{end}}' "$c")
  DB_USER=$(echo "$envs" | sed -n 's/^POSTGRES_USER=//p'); DB_USER=${DB_USER:-postgres}
  DB_PASS=$(echo "$envs" | sed -n 's/^POSTGRES_PASSWORD=//p')
  echo "Usando contenedor $(docker inspect -f '{{.Name}}' "$c") ($img) en el puerto $DB_PORT"
  break
done

usar_propio() {
  echo "Usaré un contenedor propio con PostGIS: trendy-db (puerto 5433)"
  if ! docker ps -a --format '{{.Names}}' | grep -qx trendy-db; then
    docker run -d --name trendy-db -p 5433:5432 \
      -e POSTGRES_USER=trendy -e POSTGRES_PASSWORD=trendy -e POSTGRES_DB=trendy \
      postgis/postgis:16-3.4 || falla "No se pudo crear el contenedor trendy-db"
  else
    docker start trendy-db >/dev/null
  fi
  CID=trendy-db; DB_USER=trendy; DB_PASS=trendy; DB_PORT=5433
  for i in $(seq 1 30); do docker exec trendy-db pg_isready -U trendy >/dev/null 2>&1 && break; sleep 1; done
  sleep 2
}

[ -n "$CID" ] || usar_propio

psql_in() { docker exec -e PGPASSWORD="$DB_PASS" "$CID" psql -U "$DB_USER" -v ON_ERROR_STOP=1 "$@"; }

if ! psql_in -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1; then
  psql_in -d postgres -c "CREATE DATABASE $DB_NAME" || falla "No se pudo crear la base $DB_NAME"
fi
if ! psql_in -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS postgis" >/dev/null 2>&1; then
  echo "Ese Postgres no tiene PostGIS (Trendy lo necesita para la ubicación)."
  [ "$CID" = "trendy-db" ] && falla "PostGIS no disponible en trendy-db"
  usar_propio
  psql_in -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS postgis" >/dev/null || falla "PostGIS no disponible"
fi
echo "Base '$DB_NAME' lista en localhost:$DB_PORT"

paso "API (back/)"
cd "$ROOT/back"
ENC_PASS=$(node -p 'encodeURIComponent(process.argv[1])' "$DB_PASS")
[ -f .env ] && cp .env .env.bak
cat > .env <<EOF
DATABASE_URL=postgres://$DB_USER:$ENC_PASS@localhost:$DB_PORT/$DB_NAME
DB_SSL=false
JWT_SECRET=trendy-local-dev-secret
PORT=3000
NODE_ENV=development
EOF
[ -d node_modules ] || npm install || falla "npm install falló en back/"
npm run migration:run || falla "Las migraciones fallaron"
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
