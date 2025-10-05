## Cringe GPT - Fullstack ChatGPT Clone

### Quick Start (Docker)

```bash
docker compose up -d --build
```

Services:
- Backend (.NET 9): http://localhost:5278
- Frontend (React 19 via Nginx reverse proxy): http://localhost:3000
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (anonymous)
- Jaeger: http://localhost:16686

Environment knobs:
- Backend CORS origins: `CORS_ORIGINS` (comma-separated)
- OTLP endpoint: `Otlp__Endpoint` (default `http://jaeger:4317`)

### Local Development

- Backend: see `backend/docker-compose.yml` for a backend-only stack with Prometheus/Grafana/Jaeger.
- Frontend: `cd frontend && bun install && bun run dev` (set `VITE_APP_API_URL` accordingly).

### Observability

- Metrics exposed via `/metrics` on backend. Prometheus is configured in `observability/prometheus/prometheus.yml`.
- Grafana is pre-provisioned from `observability/grafana/provisioning` with Prometheus data source and a default dashboard.
- Traces exported to Jaeger via OTLP gRPC.

### Directory Layout

```
backend/
  src/                 # .NET 9 Web API source
  Dockerfile           # .NET 9 multi-stage build
  docker-compose.yml   # Backend-only stack (optional)
frontend/
  src/                 # React 19 app
  Dockerfile           # Node build -> Nginx runtime
  nginx.conf           # Reverse proxy /api -> backend
observability/
  prometheus/
    prometheus.yml
  grafana/
    provisioning/
      datasources/prometheus.yml
      dashboards/{default.yml, main-dashboard.json}
compose.yaml           # Unified stack
```

### Hotkeys & Command Palette Architecture

- Single source of truth for actions: `frontend/src/configuration/hotkeys.ts`.
- Persistent user-configurable bindings: `frontend/src/stores/hotkey-store.ts` (Zustand + localStorage) with merge to auto-include new actions.
- Global registration: `frontend/src/features/hotkeys/components/global-hotkeys-manager.tsx` binds configured shortcuts to action handlers.
- Settings integration: `Settings → Shortcuts` renders `HotkeySettingsSection` to edit bindings.
- Command Palette: `frontend/src/features/command-palette/components/command-palette.tsx` displays commands and conversation search results.
- Conversation search hook: `frontend/src/features/chat/api/search-conversations.ts` uses `useInfiniteQuery` with cursor pagination.

### Conversation Search API

- Endpoint: `GET /api/v1/conversations/search?query=...&cursor=...`.
- Response: `{ items: [...], cursor }`, items include `conversation_id`, `current_node_id`, `title`, and `payload.snippet` similar to ChatGPT.
- Backend implementation:
  - DTOs: `backend/src/DTOs/SearchDto.cs`
  - Repository: `SearchAsync` in `backend/src/Repositories/ConversationRepository.cs`
  - Service: `SearchAsync` in `backend/src/Services/ConversationService.cs`
  - Controller: `Search` in `backend/src/Controllers/v1/ConversationsController.cs`
