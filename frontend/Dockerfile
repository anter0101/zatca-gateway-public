FROM node:22-alpine AS dependencies

WORKDIR /app

ENV HUSKY=0

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:22-alpine AS build

WORKDIR /app

ENV HUSKY=0
ENV NEXT_TELEMETRY_DISABLED=1

ARG NEXT_PUBLIC_BACKEND_URL=http://localhost
ARG NEXT_PUBLIC_APP_URL=http://localhost
ARG NEXTAUTH_SECRET=change-me-nextauth

ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET

RUN corepack enable

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HUSKY=0

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile && pnpm store prune

COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/messages ./messages
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/next.config.ts ./next.config.ts
COPY --from=build /app/node_modules ./node_modules

EXPOSE 3000

CMD ["pnpm", "start"]
