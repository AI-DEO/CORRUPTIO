FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --ignore-scripts

COPY shared/package.json ./shared/
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm install

COPY client/package.json client/package-lock.json ./client/
RUN cd client && npm install

COPY shared/ ./shared/
COPY server/ ./server/
COPY client/ ./client/

RUN cd client && npx vite build

WORKDIR /app/server
RUN npx prisma generate --schema prisma/schema.prisma

ENV NODE_ENV=production
EXPOSE 3001

CMD ["sh", "-c", "echo STARTING && cd /app/server && ./node_modules/.bin/prisma db push --schema prisma/schema.prisma --accept-data-loss --skip-generate 2>&1 && echo PRISMA_DONE && echo PORT=$PORT && NODE_ENV=production PORT=${PORT:-3001} ./node_modules/.bin/tsx src/index.ts 2>&1"]
