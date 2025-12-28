FROM node:20-alpine AS base
WORKDIR /usr/src/app

# Install yarn 3.x (uses node_modules by default, more Docker-friendly)
RUN corepack enable && corepack prepare yarn@3.6.4 --activate

# Copy only manifests first (better caching)
COPY package.json ./
# Don't copy yarn.lock for dev - let yarn regenerate it if out of sync
RUN yarn install

# ----- Dev image -----
FROM base AS dev
COPY . .
# Remove old lockfile if it exists and regenerate with node-modules mode
RUN rm -f yarn.lock && yarn install
EXPOSE 3000
ENV HOST=0.0.0.0
# Create entrypoint script to ensure dependencies are installed
RUN echo '#!/bin/sh' > /entrypoint.sh && \
    echo 'set -e' >> /entrypoint.sh && \
    echo 'corepack enable' >> /entrypoint.sh && \
    echo 'corepack prepare yarn@3.6.4 --activate' >> /entrypoint.sh && \
    echo 'cd /usr/src/app' >> /entrypoint.sh && \
    echo 'echo "Installing dependencies..."' >> /entrypoint.sh && \
    echo 'yarn install' >> /entrypoint.sh && \
    echo 'echo "Starting application..."' >> /entrypoint.sh && \
    echo 'exec "$@"' >> /entrypoint.sh && \
    chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
CMD ["yarn","dev"]

# ----- Prod build -----
FROM base AS builder
# Copy all files (including lib directory for path aliases)
COPY . .
# Remove old lockfile if it exists and regenerate with node-modules mode
RUN rm -f yarn.lock && yarn install
RUN yarn build

FROM node:20-alpine AS prod
WORKDIR /usr/src/app
ENV NODE_ENV=production

# Install yarn 3.x (uses node_modules by default, more Docker-friendly)
RUN corepack enable && corepack prepare yarn@3.6.4 --activate

# Copy package files from builder (which has the correct lockfile)
COPY --from=builder /usr/src/app/package.json ./
COPY --from=builder /usr/src/app/yarn.lock ./
RUN yarn install --production --frozen-lockfile
COPY --from=builder /usr/src/app ./
EXPOSE 3000
CMD ["yarn","start"]
