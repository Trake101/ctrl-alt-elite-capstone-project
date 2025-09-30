# ---------- Dev image (with hot-reload) ----------
  FROM node:20-alpine AS dev
  WORKDIR /usr/src/app
  
  # Install deps (cache friendly)
  COPY frontend/package*.json ./
  RUN npm ci
  
  # Copy source (compose will mount volume to override for live dev)
  COPY frontend ./
  
  EXPOSE 3000
  ENV HOST=0.0.0.0
  # command is provided by docker-compose: npm run dev
  
  # ---------- Prod image (optional) ----------
  FROM node:20-alpine AS builder
  WORKDIR /usr/src/app
  COPY frontend/package*.json ./
  RUN npm ci
  COPY frontend ./
  RUN npm run build
  
  FROM node:20-alpine AS prod
  WORKDIR /usr/src/app
  ENV NODE_ENV=production
  COPY --from=builder /usr/src/app ./
  RUN npm ci --omit=dev
  EXPOSE 3000
  CMD ["npm", "start"]
  