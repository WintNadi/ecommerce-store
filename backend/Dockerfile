FROM node:22-alpine

WORKDIR /app

COPY backend/package*.json ./backend/

WORKDIR /app/backend

RUN npm install --only=production

COPY backend/ ./

EXPOSE 5000

CMD ["node", "src/server.js"]