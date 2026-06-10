# Stage 1: Build the React application
FROM node:20-alpine AS build
WORKDIR /app

# Copy package.json và package-lock.json để tận dụng cache
COPY package*.json ./
RUN npm install

# Copy source code và build dự án
COPY . .
RUN npm run build

# Stage 2: Serve the application using Nginx
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Sao chép file cấu hình Nginx tùy chỉnh để hỗ trợ SPA Routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
