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
