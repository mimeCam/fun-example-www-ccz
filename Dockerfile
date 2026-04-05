# Use Node.js LTS as base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Create logs directory for error logging
RUN mkdir -p /app/logs

# Install build dependencies for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install all dependencies (needed for build)
RUN npm ci && npm cache clean --force

# Copy next.config.js and other config files
COPY next.config.js ./
COPY tsconfig.json ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY next-env.d.ts ./
COPY middleware.ts ./

# Copy source code
COPY app ./app
COPY components ./components
COPY lib ./lib
COPY types ./types
COPY public ./public

# Build Next.js application
RUN npm run build

# Set environment to production
ENV NODE_ENV=production

# Expose the application port
EXPOSE 7200

# Start the production server
CMD ["npm", "start", "--", "-p", "7200"]
