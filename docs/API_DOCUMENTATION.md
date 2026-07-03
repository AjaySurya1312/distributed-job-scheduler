# API Documentation

## Overview

The Distributed Job Scheduler API provides RESTful endpoints to manage organizations, projects, queues, and jobs. 

*   **Base URL**: `/api/v1`
*   **Content-Type**: `application/json`

## Authentication

The API uses JSON Web Tokens (JWT) for authentication. Clients must pass the token in the Authorization header.

```http
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### 1. Authentication

#### POST `/api/v1/auth/login`
Authenticates a user and returns a JWT.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "ADMIN"
  }
}
```

### 2. Jobs

#### POST `/api/v1/projects/:projectId/jobs`
Enqueue a new job.

**Request Body:**
```json
{
  "queueId": "uuid",
  "name": "send-email",
  "payload": {
    "to": "customer@example.com",
    "template": "welcome"
  },
  "delay": 5000,
  "retryOptions": {
    "maxAttempts": 3,
    "backoff": "exponential"
  }
}
```

#### GET `/api/v1/projects/:projectId/jobs`
List and filter jobs. Supports pagination.

**Query Parameters:**
*   `status`: PENDING, ACTIVE, COMPLETED, FAILED
*   `queueId`: Filter by specific queue
*   `page`: default 1
*   `limit`: default 50

#### DELETE `/api/v1/projects/:projectId/jobs/:jobId`
Cancel or delete a pending job.

### 3. Queues

#### POST `/api/v1/projects/:projectId/queues`
Create a new queue.

**Request Body:**
```json
{
  "name": "high-priority-tasks",
  "concurrency": 10
}
```

#### POST `/api/v1/projects/:projectId/queues/:queueId/pause`
Pause a specific queue (prevents workers from picking up new jobs).

#### POST `/api/v1/projects/:projectId/queues/:queueId/resume`
Resume a paused queue.

### 4. Dashboard / Metrics

#### GET `/api/v1/projects/:projectId/metrics`
Retrieve real-time metrics for dashboard visualizations.

**Response (200 OK):**
```json
{
  "totalJobs": 15000,
  "statusCounts": {
    "COMPLETED": 14000,
    "FAILED": 500,
    "PENDING": 450,
    "ACTIVE": 50
  },
  "activeWorkers": 12,
  "queueLengths": {
    "high-priority-tasks": 100,
    "default": 350
  }
}
```

## Error Handling

Standard HTTP status codes are used alongside a consistent JSON error format.

```json
{
  "error": "Validation Error",
  "message": "The 'payload' field is required.",
  "code": 400
}
```
