# syntax=docker/dockerfile:1

# ---------- Frontend build ----------
FROM oven/bun:1.1 AS frontend-builder
WORKDIR /frontend

# Copy only files needed to install dependencies
COPY frontend/package.json frontend/bun.lock ./
RUN bun install --frozen-lockfile || bun install

# Build the SPA
COPY frontend/. .
ARG VITE_APP_API_URL=/api
ENV VITE_APP_API_URL=$VITE_APP_API_URL
RUN bun run build

# ---------- Backend build ----------
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS backend-builder
WORKDIR /src
COPY backend/src/OllamaWebuiBackend.csproj ./OllamaWebuiBackend.csproj
RUN dotnet restore "OllamaWebuiBackend.csproj"
COPY backend/src/. .
RUN dotnet publish "OllamaWebuiBackend.csproj" -c Release -o /app/publish /p:UseAppHost=false

# ---------- Runtime image ----------
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production \
    API_BASE_PATH=/api \
    ConnectionStrings__DefaultConnection="Data Source=/app/data/chatapp.db" \
    Storage__Path=/app/Storage \
    AUTO_MIGRATE=true \
    SEED_DEFAULT_ADMIN=true \
    DEFAULT_ADMIN_USERNAME=admin \
    DEFAULT_ADMIN_EMAIL=admin@example.com \
    DEFAULT_ADMIN_PASSWORD=admin \
    CORS_ORIGINS=http://localhost:8080

COPY backend/docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

COPY --from=backend-builder /app/publish ./
COPY --from=frontend-builder /frontend/dist ./wwwroot

RUN mkdir -p /app/data /app/Storage /app/Logs

EXPOSE 8080
VOLUME ["/app/data", "/app/Storage", "/app/Logs"]

ENTRYPOINT ["/entrypoint.sh"]
CMD ["dotnet", "OllamaWebuiBackend.dll"]

