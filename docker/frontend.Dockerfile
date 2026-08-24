FROM node:20-alpine AS dependencies

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./

RUN npm ci


FROM node:20-alpine AS build

WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY frontend/ ./

ARG NEXT_PUBLIC_API_URL=http://localhost:5205/api

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN npm run build


FROM node:20-alpine AS final

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/package.json ./
COPY --from=build /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.ts ./next.config.ts

EXPOSE 3000

CMD ["npm", "start"]