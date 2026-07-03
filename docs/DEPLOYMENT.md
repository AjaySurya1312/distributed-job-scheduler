# Deployment Guide

This document outlines the deployment strategy for the Distributed Job Scheduler Platform. The infrastructure is containerized and managed via Docker Compose for simplicity, with paths to scale to Kubernetes.

## Prerequisites
*   Docker 24.0+
*   Docker Compose V2
*   Node.js 20+ (for local CLI tooling)

## Docker Compose Deployment

The provided `docker-compose.yml` sets up the following services:
1.  **API Server** (Node.js/Express)
2.  **Worker Nodes** (Node.js/BullMQ)
3.  **PostgreSQL** (Primary Datastore)
4.  **Redis** (Queue backend)

### 1. Environment Configuration
Copy the sample environment file and configure secrets:
```bash
cp .env.example .env
# Edit .env with your secure database credentials, JWT secret, and Redis URL.
```

### 2. Startup
```bash
docker-compose up -d --build
```
This command starts all services in detached mode.

### 3. Database Migrations & Seeding
Once the PostgreSQL container is healthy, run migrations:
```bash
docker-compose exec api npx prisma migrate deploy
docker-compose exec api npm run seed
```

## Scaling Instructions

The architecture separates the API from Worker instances to allow independent scaling.

**To scale workers:**
```bash
docker-compose up -d --scale worker=5
```
*Note: Redis connections will increase linearly with worker scaling. Ensure Redis `maxclients` configuration supports the total connection pool.*

## Production Checklist

Before deploying to a true production environment, ensure the following:
- [ ] **TLS/SSL**: Terminate SSL at a reverse proxy (e.g., NGINX, Traefik, AWS ALB).
- [ ] **Redis Persistence**: Configure Redis for AOF (Append Only File) to prevent job loss on restart.
- [ ] **Database Connection Pooling**: Use PgBouncer if connections exceed native Postgres limits.
- [ ] **Secrets Management**: Do not commit `.env`. Use AWS Secrets Manager, Vault, or GitHub Secrets.
- [ ] **Resource Limits**: Define CPU and Memory limits in production orchestrator (ECS/K8s).

## Monitoring & Logging

### Application Logging
Winston is configured to output JSON logs to `stdout`. In production, these should be collected by a log aggregator like Datadog, ELK stack, or AWS CloudWatch.

### Health Checks
The API exposes a health check endpoint at `/health`. Integrate this with your load balancer to ensure traffic is only routed to healthy instances.

## Backup Strategies

*   **PostgreSQL**: Configure automated nightly pg_dump backups or use managed services (RDS) with automated snapshots.
*   **Redis**: If using a managed service (ElastiCache), enable daily backups. If self-hosting, ensure RDB snapshots are backed up to S3/Cloud Storage.
