FROM node:22-alpine
WORKDIR /app

# Copy manifests only first for better layer caching
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/
COPY packages/client/package.json packages/client/

# Install (including devDeps for tsx, drizzle-kit)
RUN npm ci

# Copy source
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY packages/server packages/server

EXPOSE 4000
CMD ["npm", "run", "dev", "--workspace=@bluff-auction/server"]
