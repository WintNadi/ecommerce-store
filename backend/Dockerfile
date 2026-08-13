FROM node:18-alpine

WORKDIR /app

# ✅ Copy from backend folder
COPY backend/package*.json ./backend/

WORKDIR /app/backend

RUN npm install --only=production

COPY backend/ ./

EXPOSE 5000

CMD ["node", "src/server.js"]