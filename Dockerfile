FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY . .

# Génère le client Prisma (nécessaire même sans DB connectée)
RUN npx prisma generate 2>/dev/null || true

EXPOSE 3000

CMD ["node", "server/index.js"]
