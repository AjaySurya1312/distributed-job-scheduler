# Distributed Job Scheduler — System Architecture

> **Author:** Principal Software Architect (Stripe-grade)
> **Version:** 1.0.0
> **Document Type:** Enterprise Architecture Specification

---

## Executive Summary

Production-grade **Distributed Job Scheduler Platform** capable of processing **millions of jobs per day** with sub-second job pickup latency, guaranteed at-least-once delivery, and full observability.

Architecturally inspired by:
- **BullMQ** — Redis-backed queue semantics
- **Sidekiq** — Worker concurrency model
- **AWS SQS + Lambda** — Decoupled queue-consumer model
- **Stripe payments pipeline** — Idempotency, retry semantics, audit trails

---

## 1. High-Level Architecture

```mermaid
graph TB
    subgraph CLIENT["Client Layer"]
        UI["React Dashboard (Vite+TS+Tailwind)"]
    end
    subgraph GATEWAY["API Gateway Layer"]
        NGINX["Nginx (Reverse Proxy + TLS)"]
        RATELIMIT["Rate Limiter (express-rate-limit)"]
    end
    subgraph API["API Server Layer (Stateless)"]
        AUTH["Auth Service (JWT + Refresh)"]
        QUEUEAPI["Queue Management API"]
        JOBAPI["Job API (CRUD + Scheduling)"]
        WSSERVER["WebSocket Server (Socket.io)"]
        DASHAPI["Dashboard / Analytics API"]
    end
    subgraph QUEUE["Queue Layer"]
        REDIS["Redis Cluster (BullMQ)"]
        IMMQ["Immediate Queue"]
        DELAYQ["Delayed Queue"]
        CRONQ["Cron Queue"]
        DLQ["Dead Letter Queue"]
    end
    subgraph WORKER["Worker Layer (Horizontally Scalable)"]
        W1["Worker Pod 1 (BullMQ Processor)"]
        W2["Worker Pod 2 (BullMQ Processor)"]
        WN["Worker Pod N"]
        HB["Heartbeat Monitor"]
        LEASE["Lease Manager"]
    end
    subgraph DB["Database Layer"]
        PG["PostgreSQL (Primary)"]
        PGREAD["PostgreSQL (Read Replica)"]
        PGPOOL["PgBouncer (Connection Pool)"]
    end

    UI --> NGINX
    NGINX --> RATELIMIT
    RATELIMIT --> AUTH & QUEUEAPI & JOBAPI & WSSERVER & DASHAPI
    AUTH & QUEUEAPI & JOBAPI --> PGPOOL
    JOBAPI --> REDIS
    DASHAPI --> PGREAD & REDIS
    PGPOOL --> PG & PGREAD
    REDIS --> IMMQ & DELAYQ & CRONQ & DLQ
    W1 & W2 & WN --> REDIS & PGPOOL
    HB --> REDIS
    LEASE --> PG
    WSSERVER --> REDIS
```

**Purpose:** Establishes separation of concerns across 6 distinct layers. No layer communicates with a non-adjacent layer directly.

**Scalability:** Stateless API servers and worker pods scale independently. PgBouncer caps DB connections.

**Reliability:** Fault isolation — a queue failure does not bring down the API.

---

## 2. Job Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> PENDING : Client submits job
    PENDING --> QUEUED : Enqueued in Redis
    PENDING --> SCHEDULED : Has cron expression
    SCHEDULED --> QUEUED : Cron triggers
    QUEUED --> RUNNING : Worker claims (SELECT FOR UPDATE SKIP LOCKED)
    RUNNING --> COMPLETED : Execution success
    RUNNING --> FAILED : Execution error
    RUNNING --> TIMED_OUT : Exceeded job_timeout
    FAILED --> RETRYING : attempts < max_retries
    TIMED_OUT --> RETRYING : Timeout counts as failure
    RETRYING --> RUNNING : Delay elapsed, re-claimed
    RETRYING --> DEAD : attempts >= max_retries
    DEAD --> DEAD_LETTER : Written to dead_letter_queue
    COMPLETED --> [*]
    DEAD_LETTER --> PENDING : Manual retry from Dashboard
```

---

## 3. Worker Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> INITIALIZING : Worker Pod Start
    INITIALIZING --> REGISTERING : Connect Redis + PG
    REGISTERING --> IDLE : Register in DB
    IDLE --> POLLING : Event-driven trigger
    POLLING --> CLAIMING : Job available in queue
    CLAIMING --> EXECUTING : Atomic claim success
    CLAIMING --> POLLING : Claim lost to another worker
    EXECUTING --> HEARTBEATING : Job running (HSET every 10s)
    HEARTBEATING --> EXECUTING : Continue processing
    EXECUTING --> SUCCEEDED : Job handler resolves
    EXECUTING --> FAILED_EXEC : Job handler throws
    SUCCEEDED --> LOGGING : Write execution log
    FAILED_EXEC --> RETRY_CHECK : Check retry policy
    RETRY_CHECK --> RESCHEDULING : attempts < maxRetries
    RETRY_CHECK --> DLQ_MOVE : attempts >= maxRetries
    RESCHEDULING --> IDLE
    DLQ_MOVE --> IDLE
    LOGGING --> IDLE
    IDLE --> DRAINING : SIGTERM received
    DRAINING --> DEREGISTERING : Finish current job
    DEREGISTERING --> [*]
```

---

## 4. Retry Flow

```mermaid
flowchart TD
    START([Job Execution Starts]) --> EXEC{Execute Job Handler}
    EXEC -->|Success| SUCCESS([Mark COMPLETED])
    EXEC -->|Error| CAPTURE[Capture Error, Increment attempts]
    CAPTURE --> CHECK{attempts < maxRetries?}
    CHECK -->|No| DLQ_ROUTE[Write to dead_letter_queue]
    CHECK -->|Yes| BACKOFF{Retry Strategy}
    BACKOFF -->|FIXED| FIXED["delay = baseDelay"]
    BACKOFF -->|LINEAR| LINEAR["delay = baseDelay x attempts"]
    BACKOFF -->|EXPONENTIAL| EXP["delay = baseDelay x 2^(attempts-1)"]
    FIXED & LINEAR & EXP --> JITTER["Add +/-20% jitter (thundering herd prevention)"]
    JITTER --> CAP{delay > maxDelay?}
    CAP -->|Yes| CAPPED["delay = maxDelay"]
    CAP -->|No| SCHEDULE
    CAPPED --> SCHEDULE[ZADD delayed zset, score = NOW + delay]
    SCHEDULE --> UPDATE_PG[UPDATE job: status=RETRYING, attempts=N]
    UPDATE_PG --> WAIT([Wait then re-claim])
```

---

## 5. Authentication Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant API as API Server
    participant PG as PostgreSQL
    participant REDIS as Redis

    Note over C,API: Registration
    C->>API: POST /api/auth/register
    API->>API: Zod validate + bcrypt.hash(password, 12)
    API->>PG: INSERT user + organization
    API->>API: generateTokenPair(userId)
    API-->>C: 201 { accessToken(15m), refreshToken(7d) }

    Note over C,API: Authenticated Request
    C->>API: GET /api/jobs [Bearer accessToken]
    API->>API: jwt.verify(token, ACCESS_SECRET)
    API->>API: RBAC check (role + org scope)
    API-->>C: 200 { jobs }

    Note over C,API: Logout
    C->>API: POST /api/auth/logout
    API->>PG: DELETE refresh_token
    API->>REDIS: SETEX blacklist:{jti} 900s
    API-->>C: 204 No Content
```

---

## 6. Worker Heartbeat Flow

```mermaid
sequenceDiagram
    participant W as Worker Pod
    participant REDIS as Redis
    participant LEASE as Lease Manager
    participant PG as PostgreSQL

    W->>PG: INSERT workers (id, hostname, status=ACTIVE)
    W->>REDIS: HSET workers:{id} { last_beat: NOW }
    W->>REDIS: EXPIRE workers:{id} 30s

    loop Every 10 seconds
        W->>REDIS: HSET + EXPIRE (refresh heartbeat)
        W->>PG: UPDATE worker_heartbeats
    end

    loop Lease Manager every 15s
        LEASE->>PG: SELECT workers WHERE last_heartbeat < NOW() - 30s
        alt Stale worker found
            LEASE->>PG: UPDATE workers SET status=DEAD
            LEASE->>PG: SELECT jobs WHERE worker_id=stale AND status=RUNNING
            LEASE->>PG: UPDATE jobs SET status=QUEUED, worker_id=NULL
            LEASE->>REDIS: LPUSH queue:wait jobIds
        end
    end
```

---

## 7. Dead Letter Queue Flow

```mermaid
sequenceDiagram
    participant W as Worker
    participant PG as PostgreSQL
    participant WS as WebSocket
    participant OPS as Operator

    Note over W: Max retries exceeded
    W->>PG: UPDATE job SET status=DEAD
    W->>PG: INSERT dead_letter_queue (job_id, failure_reason, payload_snapshot)
    W->>WS: PUBLISH { type: JOB_DEAD, jobId }
    WS-->>OPS: WebSocket push

    OPS->>PG: GET /api/dlq (paginated)
    OPS->>PG: POST /api/jobs/{id}/retry
    PG->>PG: UPDATE job SET status=PENDING, attempts=0
    PG->>PG: LPUSH queue:wait jobId
    PG-->>OPS: 202 Accepted
```

---

## 8. Queue Architecture

```mermaid
graph TB
    subgraph REDIS_QUEUES["Redis Queue Structure (BullMQ)"]
        WAIT[":{queue}:wait (List - LPUSH/BRPOP)"]
        ACTIVE[":{queue}:active (List - in-flight)"]
        DELAYED[":{queue}:delayed (ZSet - score=timestamp)"]
        COMPLETED[":{queue}:completed (ZSet - TTL 72h)"]
        FAILED[":{queue}:failed (ZSet - TTL 7d)"]
        REPEAT[":{queue}:repeat (ZSet - cron jobs)"]
        DLQ_Q[":{queue}:dlq (List - permanent)"]
    end

    subgraph PRIORITY["Priority Queues"]
        P1["Priority 1: CRITICAL"]
        P2["Priority 2: HIGH"]
        P3["Priority 3: NORMAL"]
        P4["Priority 4: LOW"]
    end

    WORKER["Worker Processor"]
    DELAYED -->|"move when due"| WAIT
    REPEAT -->|"enqueue next run"| WAIT
    WAIT -->|"BRPOPLPUSH atomic"| ACTIVE
    ACTIVE --> WORKER
    WORKER -->|success| COMPLETED
    WORKER -->|failure + retries| DELAYED
    WORKER -->|max retries| DLQ_Q
    P1 & P2 & P3 & P4 --> WORKER
```

---

## 9. Dashboard Communication Flow

```mermaid
sequenceDiagram
    participant BROWSER as Browser (React)
    participant RQ as React Query
    participant API as API Server
    participant WS as Socket.io Server
    participant REDIS as Redis PubSub

    BROWSER->>RQ: useDashboardStats() mounts
    RQ->>API: GET /api/dashboard/stats
    API->>REDIS: GET cache:dashboard:{orgId} (TTL 10s)
    alt Cache miss
        API->>API: Query PostgreSQL aggregates
        API->>REDIS: SETEX cache:dashboard:{orgId} 10s
    end
    API-->>BROWSER: 200 { stats }

    BROWSER->>WS: socket.connect(), subscribe(orgId)
    WS->>REDIS: SUBSCRIBE job-events worker-events

    loop Real-time updates
        REDIS-->>WS: PUBLISH event
        WS-->>BROWSER: socket.emit(event)
        BROWSER->>RQ: invalidateQueries
        RQ->>API: Re-fetch data
    end
```

---

## Architecture Summary Table

| Concern | Solution | Rationale |
|---------|----------|-----------|
| Job Queue | BullMQ + Redis | Atomic ops, priority, delays, cron |
| Database | PostgreSQL + Prisma | ACID, complex queries |
| Concurrency | SELECT FOR UPDATE SKIP LOCKED | Native PG, no distributed lock overhead |
| Retry | Exponential backoff + jitter | Prevents thundering herd |
| Recovery | Heartbeat + Lease Manager | Zero job loss on crash |
| Auth | JWT (15m) + Refresh (7d) | Secure, stateless, revocable |
| Real-time | Socket.io + Redis PubSub | Scales across multiple API instances |
| Deployment | Docker Compose | Reproducible, portable |
| Observability | Winston + structured logs | Queryable, production-grade |

---
*Architecture Phase Complete — Next: Database Design (Phase 2)*
