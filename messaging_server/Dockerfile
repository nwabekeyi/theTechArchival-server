# Use the official Node.js image as a base
FROM node:18-alpine

# Install Redis server
RUN apk update && apk add redis

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install Node.js dependencies (including redis client)
RUN npm install --omit=dev

# Copy the rest of the application files to the container
COPY . .

# Change ownership to non-root user for security
RUN chown -R node:node /usr/src/app

# Switch to non-root user
USER node

# Expose ports for Node.js app and Redis (optional, for documentation)
EXPOSE 4000 6379

# Set environment variables for production
ENV NODE_ENV=production

# Start Redis server in the background and then the Node.js app
CMD ["sh", "-c", "redis-server --daemonize yes && npm start"]