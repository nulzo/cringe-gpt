<div style="width: 100%;" align="center">
  <a href="https://github.com/nulzo/cringe-gpt">
    <img src="docs/images/cringe.svg" style="width: 100%;" alt="">
  </a>
</div>

## Cringe GPT - Your Solution To AI Slop

CringeGPT is a powerful and user-friendly web interface for Ollama, designed to enhance your interaction with large language models. This application offers a wide range of features to improve your AI-assisted workflow.

### Quick Start (Docker)

```bash
docker compose up -d --build
```

## Single-container image (Kubernetes friendly)

A new multi-stage `Dockerfile` at the repo root builds the frontend, bakes the static assets into the ASP.NET backend, and exposes everything on port `8080`. The SQLite database, user uploads, and logs live under `/app/data`, `/app/Storage`, and `/app/Logs` so they can be mounted to a PVC/host path.

### Build and run locally

```bash
docker build -t ghcr.io/your-org/cringe-gpt:latest .
docker run -p 8080:8080 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/storage:/app/Storage \
  -v $(pwd)/logs:/app/Logs \
  ghcr.io/your-org/cringe-gpt:latest
```

Key environment flags (all optional, sensible defaults provided):

- `ConnectionStrings__DefaultConnection` – SQLite path (default `/app/data/chatapp.db`)
- `AUTO_MIGRATE` – run EF migrations on startup (default `true`)
- `SEED_DEFAULT_ADMIN` plus `DEFAULT_ADMIN_*` – seed admin user (default enabled)
- `CORS_ORIGINS` – comma-separated origins when not same-origin (default `http://localhost:8080`)

### Kubernetes example

A ready-to-apply manifest lives at `deploy/k8s/single-container.yaml`. Replace the image reference with your published tag:

```bash
kubectl create secret generic cringe-gpt-admin --from-literal=password="change-me"
kubectl apply -f deploy/k8s/single-container.yaml
```

The manifest:
- Creates a `ReadWriteOnce` PVC for the SQLite DB and uploads (`/app/data`, `/app/Storage`)
- Mounts an `emptyDir` for logs
- Exposes port 80 via a ClusterIP Service
- Uses `/health` for readiness/liveness