# Build stage
FROM node:22-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# We specify the VITE_API_URL during the build so the API URL is correct.
# In a true production deployment this might be set via CI/CD,
# but for local docker-compose we can just use the exposed port.
ENV VITE_API_URL=http://localhost:5000/api
RUN npm run build

# Production stage
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
