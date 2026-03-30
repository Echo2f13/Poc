# DevOps & Deployment

> **Purpose:** Docker setup, CI/CD pipeline, environment management. Claude MUST follow these conventions for any infrastructure changes.

---

## Docker Architecture

### docker-compose.yml (Development)

```
services:
  app:
    build: .
    ports: 3000:3000
    env_file: .env.development
    depends_on: [postgres, redis]
    volumes: ./src:/app/src (hot reload)

  postgres:
    image: postgres:16-alpine
    ports: 5432:5432
    environment:
      POSTGRES_DB: app_dev
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
    volumes: pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports: 6379:6379

  adminer:
    image: adminer
    ports: 8080:8080
    depends_on: [postgres]

volumes:
  pgdata:
```

### docker-compose.prod.yml (Production)

```
services:
  app:
    image: ghcr.io/{org}/poc-app:latest
    env_file: .env.production
    depends_on: [postgres, redis]
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    volumes: pgdata:/var/lib/postgresql/data
    restart: unless-stopped
    # No port exposed externally

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    # No port exposed externally

  nginx:
    image: nginx:alpine
    ports: 80:80, 443:443
    volumes:
      - ./docker/nginx.conf:/etc/nginx/nginx.conf
      - ./frontend/dist:/usr/share/nginx/html
      - certdata:/etc/letsencrypt
    depends_on: [app]
    restart: unless-stopped

volumes:
  pgdata:
  certdata:
```

### Dockerfile (Multi-stage)

```
# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

### .dockerignore

```
node_modules
dist
.docs
.git
.env*
!.env.example
frontend/node_modules
frontend/dist
*.md
```

---

## Environment Management

### Files

| File | Purpose | Committed |
|------|---------|-----------|
| .env.example | Template with all vars and placeholder values | Yes |
| .env.development | Local dev values | No (gitignored) |
| .env.test | Test environment (used by CI) | No (gitignored) |
| .env.production | Production values | No (gitignored, set via CI/CD) |

### Startup Validation

The ConfigModule validates ALL required env vars on bootstrap using Joi:

```
ConfigModule.forRoot({
  validationSchema: Joi.object({
    PORT: Joi.number().default(3000),
    NODE_ENV: Joi.string().valid('development', 'test', 'staging', 'production').default('development'),
    DATABASE_URL: Joi.string().required(),
    JWT_SECRET: Joi.string().min(32).required(),
    REDIS_URL: Joi.string().required(),
    ...
  }),
  validationOptions: { abortEarly: true },
})
```

If any required var is missing, the app **fails immediately** with a clear error message. No silent defaults for secrets.

---

## CI/CD Pipeline (GitHub Actions)

### Workflow: `.github/workflows/ci.yml`

Triggered on: push to any branch, PR to main

```
Jobs:

1. lint (1 min)
   - npm ci
   - npm run lint
   - npm run format:check

2. typecheck (1 min)
   - npm ci
   - npx tsc --noEmit

3. test-unit (2 min)
   - npm ci
   - npm run test -- --coverage
   - Fail if coverage < 70%

4. test-e2e (3 min)
   - Start PostgreSQL service container
   - Start Redis service container
   - npm ci
   - npm run migration:run
   - npm run test:e2e

5. security (2 min)
   - npm audit --audit-level=high
   - (optional: Snyk scan)
```

### Workflow: `.github/workflows/deploy.yml`

Triggered on: push to main (after CI passes)

```
Jobs:

1. build-and-push
   - Build Docker image
   - Tag with commit SHA + 'latest'
   - Push to GitHub Container Registry

2. deploy-staging (auto)
   - SSH into staging server
   - Pull latest image
   - Run migrations
   - docker-compose up -d
   - Wait 10s, check /health endpoint
   - If health check fails → rollback to previous image

3. deploy-production (manual approval gate)
   - Same as staging but requires manual approval
   - GitHub Environment protection rule
```

---

## Nginx Configuration

```nginx
server {
    listen 80;
    server_name example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip
    gzip on;
    gzip_types text/html application/json text/css application/javascript;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    # Frontend (React SPA)
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
        expires 1h;
    }

    # Static assets with long cache
    location /assets/ {
        root /usr/share/nginx/html;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API proxy
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://app:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check (no rate limit)
    location /health {
        proxy_pass http://app:3000;
    }
}
```

---

## NPM Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `start:dev` | `nest start --watch` | Development with hot reload |
| `start:prod` | `node dist/main.js` | Production start |
| `build` | `nest build` | Compile TypeScript |
| `lint` | `eslint .` | Lint check |
| `format:check` | `prettier --check .` | Format check (CI) |
| `format` | `prettier --write .` | Auto-format |
| `test` | `jest` | Unit tests |
| `test:e2e` | `jest --config ./test/jest-e2e.json` | E2E tests |
| `test:cov` | `jest --coverage` | Coverage report |
| `migration:generate` | `typeorm migration:generate` | Auto-generate migration |
| `migration:run` | `typeorm migration:run` | Apply migrations |
| `migration:revert` | `typeorm migration:revert` | Rollback last migration |
| `seed:dev` | `ts-node seeds/dev.seed.ts` | Seed dev data |
| `seed:prod` | `ts-node seeds/prod.seed.ts` | Seed prod data |
| `docker:dev` | `docker-compose up -d` | Start dev containers |
| `docker:down` | `docker-compose down` | Stop containers |
