# Database Design

> **Purpose:** Complete database schema reference. Claude MUST consult this before creating/modifying any entity, migration, or query.

## Database: PostgreSQL 16

## ORM: TypeORM 0.3.x (DataSource API)

## Connection

- Pool: min 5, max 20
- SSL: required in production
- Migrations: run on app startup in dev, manually in staging/prod
- Logging: enabled in dev (query + error), error-only in prod

---

## Schema Overview

### Entity Relationship Diagram (Text)

```
users 1──N addresses
users 1──1 carts
users 1──N orders
users 1──N reviews
users 1──N notifications
users 1──N audit_logs
users 1──N sessions

categories 1──N categories (self-ref: parent_id)
categories 1──N products

products 1──N cart_items
products 1──N order_items
products 1──N reviews

carts 1──N cart_items

orders 1──N order_items
orders 1──1 payments
orders N──1 addresses

payments 1──N transactions
```

---

## Tables

### users

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID (v7) | PK, DEFAULT gen_random_uuid() | Time-sortable |
| email | VARCHAR(255) | NOT NULL, UNIQUE | Lowercase enforced via trigger |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt, 12 rounds |
| name | VARCHAR(100) | NOT NULL | |
| role | ENUM('customer','admin','super_admin') | NOT NULL, DEFAULT 'customer' | |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | Soft-disable account |
| email_verified | BOOLEAN | NOT NULL, DEFAULT false | |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Auto-update trigger |
| deleted_at | TIMESTAMPTZ | NULL | Soft delete |

**Indexes:** `idx_users_email` UNIQUE on (email) WHERE deleted_at IS NULL

---

### addresses

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK→users ON DELETE CASCADE, NOT NULL |
| label | VARCHAR(50) | NOT NULL (e.g., "Home", "Office") |
| street | VARCHAR(255) | NOT NULL |
| city | VARCHAR(100) | NOT NULL |
| state | VARCHAR(100) | NOT NULL |
| zip | VARCHAR(20) | NOT NULL |
| country | VARCHAR(100) | NOT NULL, DEFAULT 'India' |
| is_default | BOOLEAN | NOT NULL, DEFAULT false |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |

**Indexes:** `idx_addresses_user` on (user_id)

**Rule:** Only one address per user can have is_default=true (enforced in service layer).

---

### categories

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| name | VARCHAR(100) | NOT NULL |
| slug | VARCHAR(100) | NOT NULL, UNIQUE |
| parent_id | UUID | FK→categories ON DELETE SET NULL, NULL |
| sort_order | INT | NOT NULL, DEFAULT 0 |
| is_active | BOOLEAN | NOT NULL, DEFAULT true |

**Indexes:** `idx_categories_slug` UNIQUE on (slug), `idx_categories_parent` on (parent_id)

---

### products

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| name | VARCHAR(255) | NOT NULL |
| description | TEXT | NULL |
| price | DECIMAL(10,2) | NOT NULL, CHECK(price > 0) |
| stock | INT | NOT NULL, DEFAULT 0, CHECK(stock >= 0) |
| category_id | UUID | FK→categories, NULL |
| image_url | VARCHAR(500) | NULL |
| is_active | BOOLEAN | NOT NULL, DEFAULT true |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |
| deleted_at | TIMESTAMPTZ | NULL |

**Indexes:**
- `idx_products_category` on (category_id)
- `idx_products_price` on (price)
- `idx_products_search` GIN on (name, description) using pg_trgm
- `idx_products_active` on (is_active) WHERE is_active = true AND deleted_at IS NULL

---

### carts

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK→users ON DELETE CASCADE, UNIQUE |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |

**Rule:** One cart per user. Created on first cart add, never deleted (only emptied).

---

### cart_items

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| cart_id | UUID | FK→carts ON DELETE CASCADE, NOT NULL |
| product_id | UUID | FK→products ON DELETE CASCADE, NOT NULL |
| quantity | INT | NOT NULL, CHECK(quantity > 0) |

**Indexes:** UNIQUE(cart_id, product_id)

---

### orders

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK→users ON DELETE RESTRICT, NOT NULL |
| address_id | UUID | FK→addresses ON DELETE RESTRICT, NULL |
| status | ENUM | NOT NULL, DEFAULT 'pending' |
| subtotal | DECIMAL(10,2) | NOT NULL, CHECK(subtotal >= 0) |
| tax | DECIMAL(10,2) | NOT NULL, CHECK(tax >= 0) |
| total | DECIMAL(10,2) | NOT NULL, CHECK(total > 0) |
| notes | TEXT | NULL |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |

**Order Status Enum:** `pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`, `payment_failed`, `refunded`

**Indexes:**
- `idx_orders_user` on (user_id)
- `idx_orders_status` on (status)
- `idx_orders_created` on (created_at)

---

### order_items

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| order_id | UUID | FK→orders ON DELETE CASCADE, NOT NULL |
| product_id | UUID | FK→products ON DELETE RESTRICT, NOT NULL |
| quantity | INT | NOT NULL, CHECK(quantity > 0) |
| unit_price | DECIMAL(10,2) | NOT NULL | Price snapshot at order time |

---

### payments

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| order_id | UUID | FK→orders, UNIQUE, NOT NULL |
| method | ENUM('card','upi','cod') | NULL (set on confirm) |
| status | ENUM | NOT NULL, DEFAULT 'initiated' |
| amount | DECIMAL(10,2) | NOT NULL, CHECK(amount > 0) |
| gateway_ref | VARCHAR(100) | NULL |
| idempotency_key | VARCHAR(100) | UNIQUE, NOT NULL |
| failure_reason | VARCHAR(255) | NULL |
| retry_count | INT | NOT NULL, DEFAULT 0 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |

**Payment Status Enum:** `initiated`, `pending`, `processing`, `success`, `failed`, `refund_requested`, `refunded`

**Indexes:**
- `idx_payments_order` UNIQUE on (order_id)
- `idx_payments_idempotency` UNIQUE on (idempotency_key)
- `idx_payments_status` on (status)

---

### transactions

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| payment_id | UUID | FK→payments ON DELETE RESTRICT, NOT NULL |
| type | ENUM('charge','refund','reversal') | NOT NULL |
| from_status | VARCHAR(50) | NOT NULL |
| to_status | VARCHAR(50) | NOT NULL |
| amount | DECIMAL(10,2) | NOT NULL |
| gateway_response | JSONB | NULL |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |

**Rule:** Immutable. Never updated or deleted. Append-only audit trail.

---

### reviews

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK→users ON DELETE CASCADE, NOT NULL |
| product_id | UUID | FK→products ON DELETE CASCADE, NOT NULL |
| rating | SMALLINT | NOT NULL, CHECK(rating BETWEEN 1 AND 5) |
| comment | TEXT | NULL |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |

**Indexes:** UNIQUE(user_id, product_id) — one review per user per product

---

### notifications

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK→users ON DELETE CASCADE, NOT NULL |
| type | VARCHAR(50) | NOT NULL |
| title | VARCHAR(255) | NOT NULL |
| body | TEXT | NOT NULL |
| is_read | BOOLEAN | NOT NULL, DEFAULT false |
| metadata | JSONB | NULL |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |

**Indexes:** `idx_notifications_user_unread` on (user_id) WHERE is_read = false

---

### audit_logs

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK→users ON DELETE SET NULL, NULL (system actions) |
| action | VARCHAR(50) | NOT NULL (CREATE, UPDATE, DELETE, LOGIN, LOGOUT, ROLE_CHANGE) |
| entity_type | VARCHAR(50) | NOT NULL (user, product, order, payment) |
| entity_id | UUID | NOT NULL |
| old_values | JSONB | NULL (null for CREATE) |
| new_values | JSONB | NULL (null for DELETE) |
| ip_address | INET | NULL |
| user_agent | VARCHAR(500) | NULL |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |

**Rule:** Immutable. Append-only. Never update or delete.

**Indexes:**
- `idx_audit_entity` on (entity_type, entity_id)
- `idx_audit_created` on (created_at)
- `idx_audit_user` on (user_id)

---

### sessions

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK→users ON DELETE CASCADE, NOT NULL |
| refresh_token_hash | VARCHAR(255) | NOT NULL |
| ip_address | INET | NULL |
| user_agent | VARCHAR(500) | NULL |
| expires_at | TIMESTAMPTZ | NOT NULL |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |

**Indexes:**
- `idx_sessions_user` on (user_id)
- `idx_sessions_expiry` on (expires_at)

---

### feature_flags

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| key | VARCHAR(100) | NOT NULL, UNIQUE |
| enabled | BOOLEAN | NOT NULL, DEFAULT false |
| description | TEXT | NULL |
| updated_by | UUID | FK→users, NULL |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |

---

## Migration Rules

1. Never edit a committed migration — always create a new one
2. Migration filenames: `{timestamp}-{description}.ts` (e.g., `1711234567890-create-users-table.ts`)
3. Every migration MUST have both `up()` and `down()` methods
4. Test `down()` migrations in development before committing
5. Run `npm run migration:generate` to auto-generate from entity changes
6. Run `npm run migration:run` to apply
7. Run `npm run migration:revert` to rollback last migration
8. Production migrations run via CI/CD pipeline, never manually

## Seeding Rules

1. `seeds/dev.seed.ts` — 50 users, 20 categories, 200 products, 500 orders with realistic data
2. `seeds/prod.seed.ts` — 1 super_admin user, base categories only
3. Seeds are idempotent — safe to run multiple times
4. Admin seed password comes from `ADMIN_SEED_PASSWORD` env var
