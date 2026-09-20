# SearchHub

SearchHub is a real-time knowledge-base platform where users can search
technical documents, use autocomplete and typo correction, filter
results, bookmark documents, and view related content. Admins can
create, update, and delete knowledge-base documents.

## Project Overview

The project is built around a custom search pipeline instead of relying
only on a database text search.

The main flow is:

``` text
React Frontend
      ↓
Node.js + Express API
      ↓
PostgreSQL
      ↓
Search Engine
      ├── Tokenization
      ├── Inverted Index
      ├── BM25 Ranking
      ├── Typo Correction
      ├── Trie Autocomplete
      └── Highlighting
```

Redis is used for caching, rate limiting, and trending searches.

RabbitMQ-based asynchronous indexing and Kafka-based analytics are
planned parts of the architecture and are currently remaining/in
progress.

## Features

### Authentication

-   User registration and login
-   JWT access tokens
-   Refresh tokens with rotation
-   Logout and refresh-token revocation
-   Password hashing using bcrypt
-   Role-based access control
-   Admin-only document management

### Search

-   Query normalization and tokenization
-   Inverted index for fast term lookup
-   BM25 relevance ranking
-   3x title boost
-   Levenshtein-based typo correction
-   Trie-based autocomplete
-   Tag filtering
-   Author filtering
-   Date filtering
-   Result highlighting
-   Pagination

### Documents

-   Create documents
-   Update documents
-   Delete documents
-   View documents
-   Markdown-style content input
-   Tags
-   Related documents based on shared tags
-   Document indexing status

### Bookmarks

-   Add/remove bookmarks
-   Bookmark status
-   View bookmarked documents

### Redis

Redis is currently used for:

-   Search-result caching
-   60-second search cache TTL
-   Search cache invalidation after document mutations
-   Rate limiting at 30 requests per minute
-   Trending search tracking using Redis sorted sets

## Search Pipeline

A typical search request follows this flow:

``` text
User Query
    ↓
Normalization
    ↓
Tokenization
    ↓
Typo Correction
    ↓
Inverted Index
    ↓
Candidate Documents
    ↓
BM25 Ranking
    ↓
3x Title Boost
    ↓
Tag / Author / Date Filters
    ↓
Highlighting
    ↓
Pagination
    ↓
Response
```

### BM25

BM25 is used to calculate relevance scores for candidate documents based
on factors such as term frequency, inverse document frequency, and
document length.

Title matches receive an additional boost so that documents with
matching query terms in their titles are ranked more strongly.

### Inverted Index

The inverted index maps terms to the documents containing those terms.

Example:

``` text
javascript → [1, 5, 17]
react      → [2, 5, 18]
node       → [7, 12]
```

The current implementation keeps this search index in application
memory. The source documents remain persisted in PostgreSQL, and the
index is rebuilt from the database when the backend starts.

### Typo Correction

If a searched term is not present in the index, Levenshtein distance is
used to find a close matching term within the configured distance.

Example:

``` text
javscript
    ↓
javascript
```

### Autocomplete

A Trie is used for prefix-based suggestions.

Example:

``` text
jav
 ↓
java
javascript
javascript tutorial
```

## Technology Stack

### Frontend

-   React
-   Vite
-   React Router
-   Axios
-   Recharts

### Backend

-   Node.js
-   Express.js
-   JWT
-   bcrypt
-   PostgreSQL

### Search

-   Custom tokenizer
-   Inverted index
-   BM25 ranking
-   Trie
-   Levenshtein distance

### Infrastructure

-   Redis
-   RabbitMQ
-   Kafka
-   WebSocket

## Database

PostgreSQL contains the main persistent application data.

Main tables:

``` text
users
documents
tags
document_tags
bookmarks
search_events
refresh_tokens
```

## RabbitMQ - Remaining / In Progress

RabbitMQ is intended to handle asynchronous document indexing.

The planned flow is:

``` text
Admin creates/updates document
          ↓
PostgreSQL
          ↓
RabbitMQ Queue
          ↓
Index Worker
          ↓
Search Index
          ↓
Document status = indexed
```

The worker is intended to process indexing jobs asynchronously with
manual acknowledgement, retries, and failure handling.

**RabbitMQ integration is currently remaining/in progress.**

## Kafka - Remaining / In Progress

Kafka is intended for event-driven analytics.

The planned events include:

``` text
search.performed
document.viewed
document.bookmarked
```

The planned flow is:

``` text
User Activity
     ↓
Backend
     ↓
Kafka
     ↓
Analytics Consumer
     ↓
Searches/min
Top Queries
Zero-result Searches
```

**Kafka analytics integration is currently remaining/in progress.**

## Redis Architecture

Search cache:

``` text
Search Request
     ↓
Redis Cache
   ↙       ↘
 HIT       MISS
 ↓          ↓
Return    Search Engine
             ↓
          Redis Cache
```

The search cache uses a 60-second TTL.

Document create/update/delete operations invalidate search cache entries
so that stale search results are not retained unnecessarily.

## API Structure

``` text
/api/auth
    POST /register
    POST /login
    POST /refresh
    POST /logout
    GET  /me

/api/documents
    GET    /
    GET    /:id
    GET    /:id/related
    POST   /
    PUT    /:id
    DELETE /:id

/api/search
    GET /?q=...
    GET /suggest?prefix=...
    GET /trending

/api/bookmarks
    GET /
    POST /toggle
    GET /:documentId/status
```

## Running Locally

### Backend

``` bash
cd backend
npm install
npm run dev
```

The backend runs on:

``` text
http://localhost:5000
```

### Frontend

``` bash
cd frontend/frontend
npm install
npm run dev
```

The frontend runs on the Vite development server.

### Redis

Redis can be run using Docker:

``` bash
docker compose up -d
```

Check Redis:

``` bash
docker exec -it searchhub-redis redis-cli ping
```

Expected:

``` text
PONG
```

## Environment Variables

Backend environment variables include:

``` env
PORT=5000
DATABASE_URL=postgresql://postgres:<password>@localhost:5432/searchhub
JWT_SECRET=<access-secret>
JWT_REFRESH_SECRET=<refresh-secret>
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://localhost:5672
KAFKA_BROKER=localhost:9092
```

Secrets should not be committed to GitHub.

## Current Project Status

### Completed

-   PostgreSQL database and schema
-   Database seed with 500+ documents
-   JWT authentication
-   Refresh-token flow
-   Role-based admin access
-   Document CRUD
-   Bookmarks
-   Custom search pipeline
-   Inverted index
-   BM25 ranking
-   Title boosting
-   Typo correction
-   Trie autocomplete
-   Search filters
-   Highlighting
-   Pagination
-   Redis search cache
-   Redis rate limiting
-   Redis trending searches
-   Admin document interface
-   Related documents

### Remaining / In Progress

-   RabbitMQ indexing worker integration and finalization
-   Kafka analytics consumer and event pipeline
-   WebSocket real-time features
-   Further dashboard analytics and live widgets
-   Final production deployment configuration
-   Final testing and documentation polish

## Future Production Scalability

For a larger production deployment, the current in-memory search index
can be replaced with a shared persistent search platform such as
OpenSearch.

A scalable architecture could use:

``` text
React
  ↓
CloudFront + S3
  ↓
Load Balancer
  ↓
Multiple Node.js API instances
  ↓
RDS PostgreSQL
  ↓
ElastiCache Redis
  ↓
RabbitMQ + Scaled Workers
  ↓
OpenSearch
  ↓
Kafka / Managed Kafka
```

This would allow the API, indexing workers, caching layer, and search
infrastructure to scale independently.

## Project Goal

The main goal of SearchHub is to demonstrate how a knowledge-base search
platform can combine traditional information retrieval, authentication,
caching, asynchronous processing, analytics, and real-time communication
into one full-stack application.
