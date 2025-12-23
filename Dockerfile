# ============================================
# Build stage for frontend
# ============================================
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install frontend dependencies
RUN npm install

# Copy frontend source
COPY frontend/src ./src
COPY frontend/index.html ./
COPY frontend/vite.config.js ./

# Build frontend
RUN npm run build

# ============================================
# Final stage - Backend + Frontend
# ============================================
FROM node:18-alpine

WORKDIR /usr/src/app

# Copy root package.json
COPY package*.json ./

# Install backend dependencies only
RUN npm install --omit=dev

# Copy backend source
COPY src ./src
COPY .env.example ./.env

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/frontend/dist ./public

# Expose port
EXPOSE 3000

# Start backend (which will serve frontend static files)
CMD ["node", "src/app.js"]
