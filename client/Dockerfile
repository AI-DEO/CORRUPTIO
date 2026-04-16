FROM node:20-alpine

WORKDIR /app

COPY shared/ ./shared/
COPY client/package*.json ./client/
RUN cd client && npm install

COPY client/ ./client/

WORKDIR /app/client
CMD ["npx", "vite", "--host"]
