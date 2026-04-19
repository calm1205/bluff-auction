FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/
COPY packages/client/package.json packages/client/

RUN npm ci

COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY packages/client packages/client

ARG VITE_SERVER_URL=http://localhost:4000
ENV VITE_SERVER_URL=$VITE_SERVER_URL

RUN npm run build --workspace=@bluff-auction/client

FROM nginx:alpine
COPY --from=build /app/packages/client/dist /usr/share/nginx/html
COPY packages/client/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
