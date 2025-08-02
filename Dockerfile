# --- Stage 1: Install deps and build everything ---
FROM node:18-alpine AS builder

WORKDIR /app

# Firebase configuration to use during the frontend build
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID

ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY \
    VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN \
    VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID \
    VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET \
    VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID \
    VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID

# Install root (backend) deps
COPY package*.json ./
RUN npm install

# Copy all files including frontend
COPY . .

# Install frontend deps and build frontend
WORKDIR /app/client
RUN npm install && npm run build

# Go back to root to build backend
WORKDIR /app
RUN npm run build

# --- Stage 2: Runtime container ---
FROM node:18-alpine AS runner

WORKDIR /app

# Copy the entire built app
COPY --from=builder /app .

ENV NODE_ENV=production
# Render provides a PORT environment variable (usually 10000).
# EXPOSE is not required for most platforms, so omit it to avoid confusion.

CMD ["node", "dist/index.js"]
