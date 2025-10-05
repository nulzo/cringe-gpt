FROM oven/bun:latest AS builder
WORKDIR /app

# Install dependencies with Bun
COPY package.json bun.lockb* package-lock.json* bun.lock* ./
# Use frozen lockfile only if a valid Bun lockfile exists; otherwise install normally
RUN bun install

# Build the app
COPY . .
ARG VITE_APP_API_URL=http://localhost:5278
ENV VITE_APP_API_URL=$VITE_APP_API_URL
RUN bun run build

FROM nginx:alpine AS runner
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]


