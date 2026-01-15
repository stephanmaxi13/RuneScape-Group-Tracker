# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install ALL dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build the NestJS app
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Copy only the necessary files from the builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist

# Install only production dependencies
RUN npm install --only=production

# Set environment to production
ENV NODE_ENV=production

# Expose the port your NestJS app runs on (usually 3000)
EXPOSE 3000

CMD ["node", "dist/main"]