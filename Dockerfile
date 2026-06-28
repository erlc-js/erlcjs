FROM node:22-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate
COPY . .

RUN pnpm install
RUN pnpm docs:build

FROM nginx:alpine
COPY --from=builder /app/apps/docs/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]