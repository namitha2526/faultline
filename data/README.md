# Faultline Synthetic Dataset & Seed Tooling

This directory generates and seeds synthetic error events to benchmark error grouping algorithms (legacy stack hashing vs semantic embeddings).

## Root Causes (8 Known Causes)

1. **`RC-1` - `NULL_USER_ON_LOGIN`**: Null user object during login authentication callback.
2. **`RC-2` - `PAYMENT_GATEWAY_TIMEOUT`**: Upstream payment gateway timeout during checkout charge confirmation.
3. **`RC-3` - `DASHBOARD_MISSING_FIELD`**: Missing required metrics field in dashboard analytics payload.
4. **`RC-4` - `DB_POOL_EXHAUSTED`**: PostgreSQL connection pool exhaustion under concurrent workload.
5. **`RC-5` - `INVALID_OR_EXPIRED_JWT`**: JWT bearer token signature expired or malformed.
6. **`RC-6` - `PAYLOAD_TOO_LARGE_UPLOAD`**: HTTP multipart file upload exceeds maximum size ceiling.
7. **`RC-7` - `ORG_SETTINGS_NULL_AVATAR`** *(Tricky Case 1)*: Workspace organization branding crash on undefined avatar object.
   - **Why tricky**: Features almost identical wording to `RC-1` (`TypeError: Cannot read properties of undefined (reading 'avatar_url')`), but occurs in organization settings rather than user login.
8. **`RC-8` - `REDIS_CACHE_PARTITION_DESYNC`** *(Tricky Case 2)*: Distributed Redis session store network partition.
   - **Why tricky**: One single bug triggers 4 completely disjoint call stacks (WebSocket reconnect, HTTP Auth middleware, Celery worker task, GraphQL directive). Stack hashing splits this single bug into multiple groups; embeddings unify them.

## Usage

### 1. Generate Synthetic Dataset
```bash
python data/generator.py
```
Outputs `data/ground_truth.json` containing 600 errors with full metadata.

### 2. Seed Real API
```bash
python data/seed.py --url http://localhost:8000 --key fl_demo_key_9f8e7d6c5b4a
```
Sends all 600 errors to `POST /api/errors`, validates real ingestion, and records returned server IDs.
