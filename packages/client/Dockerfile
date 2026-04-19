FROM node:24-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/
COPY packages/client/package.json packages/client/

RUN npm ci

COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY packages/client packages/client

EXPOSE 5173
CMD ["npm", "run", "dev", "--workspace=@bluff-auction/client"]
