# API de Trendy (NestJS). Al arrancar aplica migraciones, carga el seed
# (incluye el usuario fijo demo@trendy.local) y levanta la API.
FROM node:24-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["sh", "-c", "npm run migration:run:prod && npm run seed && node dist/main"]
