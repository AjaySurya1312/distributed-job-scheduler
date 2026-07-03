# 🚀 Distributed Job Scheduler Platform

A production-grade distributed job scheduling system built using Node.js, TypeScript, Redis, PostgreSQL, BullMQ, React, Docker, and Nginx.

---

## 📌 Overview

This project is a scalable distributed job scheduling platform designed to handle background jobs efficiently with fault tolerance, retries, and real-time monitoring.

It supports:
- Job scheduling (immediate, delayed, cron)
- Distributed worker processing
- Queue management
- Real-time dashboard updates
- Worker health monitoring
- Automatic job retry system
- Fault recovery for failed workers

---

## ✨ Features

### 🔐 Authentication
- JWT-based authentication
- Secure API access

### 📦 Job System
- Create jobs (instant / delayed / scheduled)
- Retry failed jobs automatically
- Priority-based execution

### ⚙️ Distributed Workers
- Multiple worker support
- Horizontal scaling
- Worker heartbeat monitoring
- Automatic recovery of orphaned jobs

### 📊 Dashboard
- Real-time job tracking
- Queue statistics
- Worker status monitoring
- Live updates using WebSockets

---

## 🏗 System Architecture

Client → Nginx → Backend API → Redis Queue → BullMQ Workers → PostgreSQL

- Jobs are submitted via API
- Stored in PostgreSQL database
- Queued using Redis (BullMQ)
- Workers process jobs asynchronously
- Real-time updates sent via WebSockets

---

## 🛠 Tech Stack

### Backend
- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- Redis
- BullMQ
- Socket.io

### Frontend
- React
- Vite
- Tailwind CSS
- Framer Motion
- Shadcn UI

### Infrastructure
- Docker
- Docker Compose
- Nginx

---

## 📂 Project Structure

```
backend/
worker/
frontend/
docker/
docs/
```

---

## 🚀 Getting Started

### 1. Clone Repository
```bash
git clone https://github.com/AjaySurya1312/distributed-job-scheduler.git
cd distributed-job-scheduler
```

### 2. Run with Docker
```bash
docker compose up --build
```

---

## 🌐 Access

- Frontend: http://localhost
- Backend API: http://localhost:3000
- PostgreSQL: localhost:5432
- Redis: localhost:6379

---

## 📈 Future Enhancements

- Kubernetes deployment
- Prometheus + Grafana monitoring
- Multi-region scaling
- Kafka integration
- AWS cloud deployment

---

## 👨‍💻 Author

Ajay Surya  
GitHub: https://github.com/AjaySurya1312

---

## ⭐ If you like this project

Give it a ⭐ on GitHub and feel free to fork it!
