# Technical Design Decisions

This document captures the core architectural decisions made for the Distributed Job Scheduler Platform and the reasoning behind them.

## 1. Why BullMQ?

**Decision:** Use BullMQ backed by Redis for message queuing and job processing.

**Rationale:**
*   **Ecosystem:** BullMQ is the industry standard for robust queueing in the Node.js ecosystem.
*   **Features:** It natively supports delayed jobs, retries with backoff strategies, rate limiting, and parent/child job relationships out of the box.
*   **Performance:** Backed by Redis Lua scripts, it offers high throughput and atomic operations, preventing race conditions among distributed workers.
*   **Alternative Considered:** RabbitMQ. Rejected because BullMQ's native integration with Node and seamless support for scheduling/delay makes it faster to implement for this specific use case.

## 2. Why PostgreSQL?

**Decision:** Use PostgreSQL as the primary relational database.

**Rationale:**
*   **ACID Compliance:** Critical for managing multi-tenant organization data, billing, and user state reliably.
*   **JSONB Support:** Allows us to store flexible job payloads and configuration parameters without strictly defining schemas for every job type, marrying the benefits of NoSQL with Relational integrity.
*   **Concurrency:** Robust MVCC (Multi-Version Concurrency Control) handles high read/write loads well.

## 3. Why Prisma ORM?

**Decision:** Use Prisma as the data modeling and access layer.

**Rationale:**
*   **Type Safety:** Prisma provides end-to-end type safety with TypeScript, drastically reducing runtime errors.
*   **Developer Experience:** The Prisma schema is highly readable and serves as an excellent source of truth for the database design. Migrations are predictable.
*   **Trade-offs:** Prisma can occasionally generate suboptimal SQL for very complex queries. For extremely hot paths (like job polling if we move away from Redis), raw SQL will be used, but Prisma covers 95% of standard CRUD efficiently.

## 4. Why JSON Web Tokens (JWT)?

**Decision:** Use JWT for stateless authentication.

**Rationale:**
*   **Statelessness:** APIs and Microservices do not need to query the database to validate a session, reducing database load.
*   **Scalability:** Services can scale horizontally without worrying about sticky sessions or centralized session stores.
*   **Trade-offs:** Token revocation is harder. We mitigate this by keeping expiration times short (e.g., 1 hour) and issuing refresh tokens.

## 5. Separation of API and Worker Processes

**Decision:** The REST API and the Job Workers run in entirely separate Node.js processes.

**Rationale:**
*   **Resource Isolation:** Heavy, CPU-bound worker tasks will not impact the latency or availability of the API responding to users.
*   **Independent Scaling:** Typically, worker processes need to scale out much further than API instances. Separation allows infrastructure to scale exactly what is needed.
