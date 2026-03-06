# Project Specifications — MicroAmazon POC

---

## Overview

MicroAmazon is a Proof of Concept e-commerce application built to demonstrate NestJS modular architecture. It features a backend REST API with three feature modules and a multi-page frontend mimicking the Amazon shopping experience.

---

## Tech Stack

### Backend

| Technology | Version | Purpose |
|---|---|---|
| NestJS | 11.0.1 | Backend framework (modular architecture, DI, decorators) |
| TypeScript | 5.7.3 | Typed language for backend development |
| Express | via `@nestjs/platform-express` | Underlying HTTP server |
| `@nestjs/serve-static` | Latest | Serves frontend static files from the same server |
| Node.js | 22.x | Runtime environment |
| npm | Latest | Package manager |

### Frontend

| Technology | Purpose |
|---|---|
| HTML5 | Page structure and semantic markup |
| CSS3 | Styling — CSS Grid, Flexbox, transitions, responsive design |
| Vanilla JavaScript (ES6+) | Client-side logic — fetch API, DOM manipulation, localStorage |

### Database

| Technology | Purpose |
|---|---|
| In-memory arrays | Mock database — all data is stored in service class properties |

> **Note:** No external database (MySQL, PostgreSQL, MongoDB) is used. This is intentional for a POC. Data resets on every server restart. The architecture is designed so a real database (e.g., TypeORM + PostgreSQL) can be plugged in by replacing the in-memory arrays in services with repository calls — no controller or module changes needed.

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Client (Browser)               │
│  login.html │ products.html │ orders.html │ admin│
└──────────────────────┬──────────────────────────┘
                       │ HTTP (fetch API)
                       ▼
┌─────────────────────────────────────────────────┐
│              NestJS Server (port 3000)           │
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │         ServeStaticModule               │    │
│  │    Serves public/ folder (HTML/CSS/JS)  │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│  ┌──────────┐ ┌──────────────┐ ┌────────────┐  │
│  │  Users   │ │   Products   │ │   Orders   │  │
│  │  Module  │ │    Module    │ │   Module   │  │
│  │          │ │              │ │            │  │
│  │Controller│ │  Controller  │ │ Controller │  │
│  │ Service  │ │   Service    │ │  Service   │  │
│  │   DTO    │ │     DTO      │ │    DTO     │  │
│  └──────────┘ └──────────────┘ └────────────┘  │
│        │               │            ▲    ▲      │
│        │               │            │    │      │
│        └───────────────┼── exports ─┘    │      │
│                        └──── exports ────┘      │
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │              In-Memory Store             │    │
│  │   15 Users │ 20 Products │ 30 Orders    │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

---

## API Specification

**Base URL:** `http://localhost:3000`

### Users

| Method | Endpoint | Request Body | Response |
|---|---|---|---|
| GET | `/users` | — | `[{ id, name, email }]` |
| GET | `/users/:id` | — | `{ id, name, email }` |
| POST | `/users` | `{ name, email }` | `{ id, name, email }` |

### Products

| Method | Endpoint | Request Body | Response |
|---|---|---|---|
| GET | `/products` | — | `[{ id, name, price }]` |
| GET | `/products/:id` | — | `{ id, name, price }` |
| POST | `/products` | `{ name, price }` | `{ id, name, price }` |

### Orders

| Method | Endpoint | Request Body | Response |
|---|---|---|---|
| GET | `/orders` | — | `[{ id, userId, productId, userName, productName }]` |
| POST | `/orders` | `{ userId, productId }` | `{ id, userId, productId }` |

---

## Frontend Pages

| Page | URL | Auth Required | Description |
|---|---|---|---|
| Login | `/login.html` | No | Sign in with email/password or create account |
| Products | `/products.html` | Yes | Browse product catalog, add to cart |
| Orders | `/orders.html` | Yes | View order history with summary stats |
| Admin | `/admin.html` | No | Read-only database dashboard |

---

## Seed Data

| Entity | Count | Examples |
|---|---|---|
| Users | 15 | John Smith, Jane Doe, Alice Johnson, Bob Williams, etc. |
| Products | 20 | Laptop Pro 16", Wireless Mouse, Mechanical Keyboard, etc. |
| Orders | 30 | Distributed across all users with various products |

---

## Project Structure

```
nestjs-modular-poc/
├── src/
│   ├── main.ts                        # Bootstrap
│   ├── app.module.ts                  # Root module
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── dto/create-user.dto.ts
│   ├── products/
│   │   ├── products.module.ts
│   │   ├── products.controller.ts
│   │   ├── products.service.ts
│   │   └── dto/create-product.dto.ts
│   └── orders/
│       ├── orders.module.ts
│       ├── orders.controller.ts
│       ├── orders.service.ts
│       └── dto/create-order.dto.ts
├── public/
│   ├── index.html
│   ├── login.html
│   ├── products.html
│   ├── orders.html
│   ├── admin.html
│   ├── css/
│   │   ├── style.css
│   │   └── admin.css
│   └── js/
│       ├── api.js
│       ├── login.js
│       ├── products.js
│       ├── orders.js
│       └── admin.js
├── package.json
├── tsconfig.json
└── nest-cli.json
```

---

## How to Run

```bash
git clone https://github.com/Echo2f13/Poc.git
cd Poc/nestjs-modular-poc
npm install
npm run start:dev
```

Open `http://localhost:3000` in your browser.
