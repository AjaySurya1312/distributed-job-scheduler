HEAD
# 🚀 Distributed Job Scheduler Platform

A production-grade distributed job scheduling platform built with Node.js, TypeScript, BullMQ, Redis, PostgreSQL, Prisma, React, Docker, and Nginx.

---

## 📌 Overview

The Distributed Job Scheduler Platform is designed to schedule, execute, monitor, and manage asynchronous background jobs in a scalable and fault-tolerant architecture.

The system supports:

- Distributed workers
- Real-time monitoring
- Queue management
- Scheduled jobs
- Automatic retries
- Worker heartbeat monitoring
- Job recovery
- Live dashboard

---

## ✨ Features

### Authentication
- JWT Authentication
- Role-based access
- Secure API

### Job Scheduling
- Immediate jobs
- Delayed jobs
- Cron jobs
- Retry mechanism
- Priority jobs

### Queue Management
- Multiple queues
- Queue metrics
- Queue monitoring

### Worker Management
- Worker heartbeat
- Lease management
- Auto recovery
- Crash detection

### Dashboard
- Live metrics
- Real-time updates
- Queue statistics
- Worker status
- Job analytics

---

# 🛠 Tech Stack

## Backend

- Node.js
- Express
- TypeScript
- Prisma
- PostgreSQL
- Redis
- BullMQ
- Socket.io

## Frontend

- React
- Vite
- Tailwind CSS
- Framer Motion
- Shadcn UI

## Infrastructure

- Docker
- Docker Compose
- Nginx

---

# 📂 Project Structure

```
backend/
frontend/
worker/
docker/
docs/
```

---

# 🏗 Architecture

Client

↓

Nginx

↓

Backend API

↓

Redis Queue

↓

BullMQ

↓

Worker Services

↓

PostgreSQL

---

# ⚡ Getting Started

```bash
git clone https://github.com/AjaySurya1312/distributed-job-scheduler.git

cd distributed-job-scheduler

docker compose up --build
```

---

# 📊 Future Enhancements

- Kubernetes Deployment
- Prometheus Monitoring
- Grafana Dashboard
- RabbitMQ Support
- AWS Deployment
- Horizontal Auto Scaling

---

# 👨‍💻 Author

Ajay Surya

GitHub:
https://github.com/AjaySurya1312

---

⭐ If you found this project interesting, feel free to star the repository.
=======
# Distributed Job Scheduler

A production-grade, distributed job scheduling platform built with a microservices architecture. Designed to handle high-throughput job execution, recurring tasks, real-time analytics, and graceful failure handling across multiple nodes.

## 🏗️ Architecture
The platform is built using a modern decoupled architecture:

- **Frontend (`/frontend`)**: React + TypeScript + Vite. Features a dark-mode dashboard for monitoring active jobs, queues, workers, and system analytics in real-time.
- **Backend API (`/backend`)**: Node.js + Express. Exposes RESTful APIs for creating jobs, managing queues, and serving analytical data to the dashboard.
- **Worker (`/worker`)**: Node.js + BullMQ. A stateless, highly concurrent job execution engine. Multiple workers can be spawned across different machines to scale processing power horizontally.
- **Database**: PostgreSQL (managed via Prisma ORM) for persistent storage of job metadata, execution logs, organizations, and worker telemetry.
- **Message Broker**: Redis (via BullMQ) for lightning-fast queueing, pub/sub event broadcasting, and distributed locking.

## ✨ Features
- **Job Execution & Scheduling**: Run jobs immediately, schedule them for the future, or use Cron expressions for recurring tasks.
- **Horizontal Scaling**: Simply spin up more worker instances. The lease manager ensures jobs are processed without conflicts.
- **Resilience & Dead Letter Queues**: Configurable retries, timeout management, and dead-letter queues (DLQ) for failed jobs.
- **Worker Heartbeats**: Workers actively report their CPU/Memory usage. A background lease manager automatically detects crashed workers and requeues their abandoned jobs.
- **Real-Time Monitoring**: The dashboard provides live insights into queue health, job latency, and worker resource consumption.
- **Authentication & Multi-Tenancy**: Secure login/registration with organization-level data isolation.

## 🚀 Getting Started

### Prerequisites
- Node.js v20+
- Docker & Docker Compose (for spinning up databases and Redis locally)

### Running via Docker Compose (Recommended)
You can launch the entire stack (Postgres, Redis, Backend, Worker, Frontend) with a single command:
```bash
docker compose up -d --build
```
- Dashboard: http://localhost:80
- API Backend: http://localhost:3000

### Local Development Setup
If you want to run the services individually for development:

1. **Start infrastructure**
   ```bash
   cd docker && docker compose up -d postgres redis
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   npx prisma migrate dev
   npm run dev
   ```

3. **Setup Worker**
   ```bash
   cd worker
   npm install
   npx prisma generate
   npm run dev
   ```

4. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 📂 Project Structure
```text
/
├── backend/          # Express API server & Prisma Database schema
├── worker/           # BullMQ execution engine & Scheduler
├── frontend/         # React SPA Dashboard
├── docker/           # PostgreSQL & Redis infrastructure config
└── docker-compose.yml# Full stack orchestration
```

## 🧪 Testing & Deployment (Phase 7)
- **Testing**: Ensure that you run the test suites in both `backend` and `worker` to validate task logic and API endpoints. (Test suites are powered by Jest).
- **Deployment**: The provided `Dockerfile`s in each service are highly optimized, multi-stage builds. They are production-ready and can be deployed directly to Kubernetes, AWS ECS, or DigitalOcean App Platform. Ensure that `DATABASE_URL` and `REDIS_URL` are set securely in your production environment.
e50edfd (Save current work before syncing with GitHub)
