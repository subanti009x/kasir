FROM node:24-slim AS build

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

COPY src ./src
COPY nest-cli.json tsconfig.json tsconfig.build.json ./
RUN npm run build
RUN npm prune --omit=dev

FROM node:24-slim

ENV NODE_ENV=production
ENV PORT=80

WORKDIR /app

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

RUN mkdir -p /app/uploads

EXPOSE 80
CMD ["node", "dist/src/main.js"]
