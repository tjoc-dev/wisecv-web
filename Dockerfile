# Multi-stage build for production-ready WiseCV Web

# Stage 1: Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Stage 2: Production stage with nginx
FROM nginx:alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create nginx user for security
RUN addgroup -g 1001 -S nginx-group
RUN adduser -S wisecv -u 1001 -G nginx-group

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create custom nginx configuration
RUN echo 'server {\n\
    listen 80;\n\
    server_name localhost;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
\n\
    # Enable gzip compression\n\
    gzip on;\n\
    gzip_vary on;\n\
    gzip_min_length 1024;\n\
    gzip_proxied expired no-cache no-store private must-revalidate auth;\n\
    gzip_types\n\
        text/plain\n\
        text/css\n\
        text/xml\n\
        text/javascript\n\
        application/javascript\n\
        application/xml+rss\n\
        application/json;\n\
\n\
    # Security headers\n\
    add_header X-Frame-Options "SAMEORIGIN" always;\n\
    add_header X-Content-Type-Options "nosniff" always;\n\
    add_header X-XSS-Protection "1; mode=block" always;\n\
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;\n\
\n\
    # Cache static assets\n\
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {\n\
        expires 1y;\n\
        add_header Cache-Control "public, immutable";\n\
    }\n\
\n\
    # Handle client-side routing\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
\n\
    # Health check endpoint\n\
    location /health {\n\
        access_log off;\n\
        return 200 "healthy\\n";\n\
        add_header Content-Type text/plain;\n\
    }\n\
}' > /etc/nginx/conf.d/default.conf

# Remove default nginx configuration
RUN rm -f /etc/nginx/conf.d/default.conf.bak

# Change ownership of nginx html directory
RUN chown -R wisecv:nginx-group /usr/share/nginx/html

# Create nginx pid directory and set permissions
RUN mkdir -p /var/run/nginx && chown -R wisecv:nginx-group /var/run/nginx
RUN mkdir -p /var/cache/nginx && chown -R wisecv:nginx-group /var/cache/nginx
RUN mkdir -p /var/log/nginx && chown -R wisecv:nginx-group /var/log/nginx

# Update nginx.conf to run as non-root user
RUN sed -i 's/user nginx;/user wisecv;/' /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

# Switch to non-root user
USER wisecv

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start nginx
CMD ["nginx", "-g", "daemon off;"]