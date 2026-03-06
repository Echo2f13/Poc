# Manish Dev — Contribution Details

## Role: Backend Core Architecture & Shared API Utilities

---

## What I Did

### 1. Designed and Built the Application Bootstrap Layer

I wrote `src/main.ts` which is the entry point of the entire server. This isn't just a boilerplate file — I had to decide the server configuration, port binding, and how the NestJS factory initializes the full module dependency graph.

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
  console.log('Application is running on: http://localhost:3000');
}
bootstrap();
```

`NestFactory.create()` recursively scans every module imported by `AppModule`, instantiates all providers into the DI container, and registers all controller routes with Express underneath. Getting this right was critical — if a module import is missing or a service isn't exported, the entire dependency chain breaks at startup.

### 2. Architected the Root Module with Static-API Routing Conflict Resolution

The `AppModule` was the hardest configuration problem in the project. I had to make a single NestJS server serve both the REST API (`/users`, `/products`, `/orders`) and the frontend static files (`/login.html`, `/products.html`, etc.) on the same port without conflicts.

```typescript
@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      exclude: ['/users*', '/products*', '/orders*'],
    }),
    UsersModule,
    ProductsModule,
    OrdersModule,
  ],
})
export class AppModule {}
```

The `exclude` array was a bug I spent time debugging — without it, Express's static middleware intercepts `/users` before NestJS's router, trying to serve a file called `users` from `public/` and returning a 404. I had to trace through the middleware execution order to figure out why API calls were failing and add the exclusion pattern for all three resource paths.

### 3. Built the Shared Frontend API Layer (`public/js/api.js`)

I wrote the shared JavaScript utility module that every frontend page depends on. This was a significant piece of work because it's the glue between the backend and all four frontend pages.

**HTTP helpers with error-safe fetch wrappers:**
```javascript
async function apiGet(path) {
  const res = await fetch(path);
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}
```

**Session management using localStorage:**
```javascript
function getCurrentUser() {
  const raw = localStorage.getItem('currentUser');
  return raw ? JSON.parse(raw) : null;
}

function requireLogin() {
  if (!getCurrentUser()) {
    window.location.href = '/login.html';
    return null;
  }
  return getCurrentUser();
}
```

**The Amazon-style navbar renderer** — dynamically builds the top navigation bar with user greeting, orders link, and cart icon. This is called on every protected page:
```javascript
function renderNavbar(activePage) {
  // Builds full navbar HTML with active state highlighting,
  // user's first name extraction, and logout handler
}
```

**Toast notification system** — a reusable popup component with CSS transition animations that auto-dismisses after 3 seconds. Had to handle the edge case of rapid successive toasts using `void toast.offsetWidth` to force a DOM reflow and restart the CSS animation.

**Product icon mapper** — a function that maps 18+ product name keywords to emoji icons, so product cards and order cards show relevant visuals without needing actual image assets.

### 4. Fixed the TypeScript `isolatedModules` Compilation Error

After all three backend modules were integrated, the build broke with `TS1272` errors. The issue was that TypeScript 5.7 with `isolatedModules: true` and `emitDecoratorMetadata: true` requires DTO classes used in decorated parameters (`@Body() createUserDto: CreateUserDto`) to be imported as value imports, not type-only imports.

I had to update all three controllers:
```typescript
// Before (broken):
import { UsersService, User } from './users.service';

// After (fixed):
import { UsersService } from './users.service';
import type { User } from './users.service';
```

The interfaces (`User`, `Product`, `Order`) are type-only since they're only used for return type annotations, but the DTO classes must remain value imports because `emitDecoratorMetadata` needs to emit their runtime constructor reference for dependency injection. This fix was applied across `users.controller.ts`, `products.controller.ts`, and `orders.controller.ts`.

### 5. Configured the Cross-Module Dependency Injection Chain

I designed the module export strategy that allows the `OrdersModule` to inject services from `UsersModule` and `ProductsModule`. This required:

- Adding `exports: [UsersService]` in `UsersModule` — making the singleton service available outside the module boundary
- Adding `exports: [ProductsService]` in `ProductsModule` — same pattern
- Adding `imports: [UsersModule, ProductsModule]` in `OrdersModule` — pulling those exported services into the Orders DI container
- Verifying that `OrdersService` constructor injection resolves correctly:

```typescript
constructor(
  private readonly usersService: UsersService,
  private readonly productsService: ProductsService,
) {}
```

This is the key architectural demonstration of the POC — NestJS modules are encapsulated by default, and services are only accessible across modules when explicitly exported and imported.

### 6. End-to-End API Testing Before Frontend Handoff

Before the frontend team started, I tested every endpoint with curl to ensure the contracts were correct:

```bash
curl http://localhost:3000/users          # 15 users returned
curl http://localhost:3000/users/1        # Single user lookup
curl -X POST http://localhost:3000/users  # User creation with auto-ID
curl http://localhost:3000/products       # 20 products returned
curl http://localhost:3000/orders         # 30 orders with enriched userName/productName
```

This caught an issue where the Orders enrichment was returning `undefined` for `userName` because the user IDs in the seed orders didn't all match existing user IDs. Fixed the seed data to ensure referential integrity.

### 7. Git Repository Setup & CI Workflow

- Initialized the repo, configured remote origin to `github.com/Echo2f13/Poc.git`
- Created `.gitignore` at root level to prevent `node_modules/` (700+ packages) and `dist/` (compiled JS) from being committed — the initial staging without `.gitignore` tried to add 6.7MB of files
- Managed all commits and pushes to main branch

---

## Files I Owned

| File | Purpose |
|---|---|
| `src/main.ts` | Server bootstrap — NestFactory, port binding, module graph initialization |
| `src/app.module.ts` | Root module — feature module imports, ServeStaticModule with API route exclusions |
| `public/js/api.js` | Shared frontend utilities — HTTP helpers, auth, navbar, toast, product icons |
| `package.json` | Dependency management — NestJS core, serve-static, TypeScript, Express |
| `tsconfig.json` | Compiler config — decorator metadata, isolated modules, strict checks |
| `.gitignore` | Version control exclusions |

---

## NestJS Concepts I Demonstrated

1. **Module Dependency Graph** — `AppModule` as root, importing feature modules that export their services
2. **Cross-Module DI** — designed the export/import chain enabling `OrdersService` to inject `UsersService` + `ProductsService`
3. **Static + API Coexistence** — `ServeStaticModule` with route exclusions to avoid middleware conflicts
4. **Decorator Metadata** — resolved `isolatedModules` + `emitDecoratorMetadata` compilation issues across all controllers
5. **Frontend-Backend Contract** — built the shared API layer (`api.js`) that all four pages consume
