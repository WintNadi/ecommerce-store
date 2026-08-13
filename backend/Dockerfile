# Use Node.js 18 Alpine (lightweight)
FROM node:18-alpine

# Set working directory inside container
WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy all source code
COPY . .

# Expose the port your app runs on
EXPOSE 5000

# Start the application
CMD ["node", "src/server.js"]