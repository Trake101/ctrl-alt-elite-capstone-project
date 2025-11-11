FROM node:20-alpine AS base
WORKDIR /usr/src/app

# Copy only manifests first (better caching)
COPY package.json ./
# If/when you add a lockfile, also copy it and switch to `npm ci`
# COPY package-lock.json ./
RUN npm install

# ----- Dev image -----
FROM base AS dev
COPY . .
EXPOSE 3000
ENV HOST=0.0.0.0
CMD ["npm","run","dev"]

# ----- Prod build -----
FROM base AS builder
COPY . .
RUN npm run build

FROM node:20-alpine AS prod
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY package.json ./
# COPY package-lock.json ./  # if present, prefer: RUN npm ci --omit=dev
RUN npm install --omit=dev
COPY --from=builder /usr/src/app ./
EXPOSE 3000
CMD ["npm","start"]
