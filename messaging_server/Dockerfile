# Use the official Node.js image as a base
FROM node:18-alpine

# Install Redis server along with other dependencies
RUN apk update && apk add redis

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available) to install dependencies
COPY package*.json ./

# Install Node.js dependencies (including Redis client)
RUN npm install --omit=dev

# Copy the rest of the application files to the container
COPY . .

# Change ownership to non-root user
RUN chown -R node:node /usr/src/app

# Switch to non-root user for security
USER node

# Expose the ports for both Redis and the Node.js app
EXPOSE 4000 6379

# Set environment variables for production
ENV NODE_ENV=production

# Start Redis in the background and then start the Node.js application
CMD redis-server --daemonize yes && npm start
