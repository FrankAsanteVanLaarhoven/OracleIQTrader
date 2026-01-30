# Build stage
FROM node:20-alpine as build

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies with legacy peer deps to handle ajv conflicts
# react-scripts 5.0.1 has known ajv peer dependency issues
RUN yarn install --frozen-lockfile --network-timeout 100000 || yarn install --network-timeout 100000

# Copy source code
COPY . .

# Build argument for backend URL
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

# Increase Node memory limit for build and skip type checking to avoid ajv issues
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV SKIP_PREFLIGHT_CHECK=true
ENV DISABLE_ESLINT_PLUGIN=true

# Build the app - use CI=false to prevent treating warnings as errors
RUN CI=false yarn build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
