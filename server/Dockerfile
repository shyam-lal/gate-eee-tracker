# server/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files first to leverage Docker layer caching
COPY package*.json ./
RUN npm ci --only=production

# Copy backend source code
COPY . .

EXPOSE 8080

CMD ["node", "src/app.js"]