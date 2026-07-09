# Build from the repository ROOT so the shared Prisma schema is in context:
#   docker build -f apps/api/Dockerfile -t aria-api .
FROM node:20-alpine AS builder
WORKDIR /app

# Root manifests + shared Prisma schema
COPY package*.json ./
COPY prisma ./prisma
COPY apps/api/package*.json ./apps/api/

RUN npm install

# App source
COPY apps/api ./apps/api

RUN npx prisma generate
RUN npm run build --workspace apps/api

# ─── Runtime image ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

EXPOSE 3001
CMD ["node", "apps/api/dist/main.js"]
