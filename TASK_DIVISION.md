# NestJS Modular POC — Task Division

## Project: MicroAmazon (NestJS Backend + Frontend)

---

## Team Members & Assignments

---

### 1. Manish Dev — Project Setup & App Module

**Files:**
- `src/main.ts`
- `src/app.module.ts`
- `package.json`
- `tsconfig.json`
- `.gitignore`

**Responsibilities:**
- Initialize NestJS project using `@nestjs/cli`
- Configure `AppModule` as root module importing all feature modules
- Set up `ServeStaticModule` for serving frontend files
- Configure TypeScript compiler options
- Set up project scripts (`start:dev`, `build`)
- Ensure all modules are wired together correctly

**Key Concepts to Explain:**
- How `NestFactory.create()` bootstraps the app
- How `AppModule` acts as the root dependency graph
- How `ServeStaticModule` serves static files while excluding API routes

---

### 2. Geethu — Users Module (Backend)

**Files:**
- `src/users/users.module.ts`
- `src/users/users.controller.ts`
- `src/users/users.service.ts`
- `src/users/dto/create-user.dto.ts`

**Responsibilities:**
- Create the `UsersModule` with controller and service registration
- Implement `UsersController` with routes: `GET /users`, `GET /users/:id`, `POST /users`
- Implement `UsersService` with in-memory user data (15 seed users)
- Create `CreateUserDto` for request validation
- Export `UsersService` so other modules (Orders) can inject it

**Key Concepts to Explain:**
- How `@Module()` decorator registers controllers and providers
- How `@Controller('users')` maps route prefix
- How `@Injectable()` marks a class for dependency injection
- Why `exports: [UsersService]` is needed for cross-module DI

---

### 3. Chirag — Products Module (Backend)

**Files:**
- `src/products/products.module.ts`
- `src/products/products.controller.ts`
- `src/products/products.service.ts`
- `src/products/dto/create-product.dto.ts`

**Responsibilities:**
- Create the `ProductsModule` with controller and service registration
- Implement `ProductsController` with routes: `GET /products`, `GET /products/:id`, `POST /products`
- Implement `ProductsService` with in-memory product data (20 seed products)
- Create `CreateProductDto` for request validation
- Export `ProductsService` so other modules (Orders) can inject it

**Key Concepts to Explain:**
- How constructor-based DI works: `constructor(private readonly productsService: ProductsService)`
- How `@Get()`, `@Post()`, `@Param()`, `@Body()` decorators map HTTP operations
- How services encapsulate business logic away from controllers

---

### 4. Anirudh — Orders Module (Backend)

**Files:**
- `src/orders/orders.module.ts`
- `src/orders/orders.controller.ts`
- `src/orders/orders.service.ts`
- `src/orders/dto/create-order.dto.ts`

**Responsibilities:**
- Create the `OrdersModule` importing `UsersModule` and `ProductsModule`
- Implement `OrdersController` with routes: `GET /orders`, `POST /orders`
- Implement `OrdersService` with cross-module dependency injection (inject `UsersService` + `ProductsService`)
- Enrich order responses with `userName` and `productName` from other services
- Seed 30 orders across multiple users

**Key Concepts to Explain:**
- How `imports: [UsersModule, ProductsModule]` enables cross-module DI
- How `OrdersService` constructor injects services from other modules
- How the modular architecture keeps features decoupled but connected

---

### 5. M Nikhil — Login Page (Frontend)

**Files:**
- `public/login.html`
- `public/js/login.js`
- `public/index.html`

**Responsibilities:**
- Build the sign-in page with email and password fields (Amazon-style layout)
- Implement user lookup against `GET /users` API
- Implement "Create Account" form that calls `POST /users`
- Store logged-in user in `localStorage`
- Handle validation and error messages
- Set up `index.html` redirect to login page

**Key Concepts to Explain:**
- How the frontend communicates with NestJS REST endpoints via `fetch()`
- How `localStorage` simulates session management
- How the login flow validates against backend data

---

### 6. Navya — Products Page (Frontend)

**Files:**
- `public/products.html`
- `public/js/products.js`

**Responsibilities:**
- Build the product catalog page with hero banner and product grid
- Render product cards with icons, ratings, prices, and delivery info
- Implement "Add to Cart" button that calls `POST /orders`
- Implement "Sell on MicroAmazon" collapsible form that calls `POST /products`
- Show results count and hero stats (product count, user's order count)
- Display sub-navigation bar

**Key Concepts to Explain:**
- How product data flows from NestJS backend → `GET /products` → frontend rendering
- How `POST /orders` creates a new order when user clicks "Add to Cart"
- How the frontend dynamically generates HTML from API responses

---

### 7. Rajshekar — Orders Page, Shared CSS & Utilities (Frontend)

**Files:**
- `public/orders.html`
- `public/js/orders.js`
- `public/css/style.css`
- `public/js/api.js`

**Responsibilities:**
- Build the orders page with summary dashboard cards and order history
- Render order cards with product details, status badges, and action buttons
- Filter orders client-side by logged-in user's ID
- Implement shared `api.js` utilities: `apiGet()`, `apiPost()`, `getCurrentUser()`, `logout()`, `renderNavbar()`, `showToast()`
- Build the complete shared stylesheet (navbar, buttons, cards, grid, responsive design)
- Implement the Amazon-style navbar with user greeting, orders link, and cart

**Key Concepts to Explain:**
- How shared utility functions reduce code duplication across pages
- How the navbar and toast system work as reusable components
- How CSS Grid and responsive design create the product layout
- How order data is fetched from `GET /orders` and filtered on the frontend

---

### 8. Satwik G — Admin Panel (Frontend)

**Files:**
- `public/admin.html`
- `public/js/admin.js`
- `public/css/admin.css`

**Responsibilities:**
- Build the admin panel accessible at `/admin.html`
- Display the entire database in a single dashboard view:
  - **Users table** — all users with ID, name, email
  - **Products table** — all products with ID, name, price
  - **Orders table** — all orders with ID, user ID, user name, product ID, product name
- Show summary stats at the top (total users, products, orders, revenue)
- Add a refresh button to reload all data
- Style with a distinct admin theme (dark topbar with red accent, separate from main store)

**Key Concepts to Explain:**
- How the admin page consumes all three REST endpoints (`GET /users`, `GET /products`, `GET /orders`)
- How `Promise.all()` fetches multiple endpoints in parallel
- How the admin panel is a read-only view of the entire backend state
- How the page is accessible at `/admin.html` without requiring login

---

## Summary Table

| Member | Area | Backend/Frontend | Files |
|---|---|---|---|
| **Manish Dev** | Project Setup & App Module | Backend | `main.ts`, `app.module.ts`, config files |
| **Geethu** | Users Module | Backend | `users.module.ts`, `users.controller.ts`, `users.service.ts`, DTO |
| **Chirag** | Products Module | Backend | `products.module.ts`, `products.controller.ts`, `products.service.ts`, DTO |
| **Anirudh** | Orders Module | Backend | `orders.module.ts`, `orders.controller.ts`, `orders.service.ts`, DTO |
| **M Nikhil** | Login Page | Frontend | `login.html`, `login.js`, `index.html` |
| **Navya** | Products Page | Frontend | `products.html`, `products.js` |
| **Rajshekar** | Orders Page, CSS & Utilities | Frontend | `orders.html`, `orders.js`, `style.css`, `api.js` |
| **Satwik G** | Admin Panel | Frontend | `admin.html`, `admin.js`, `admin.css` |

---

## Integration Order

The modules should be built and integrated in this sequence:

```
Step 1: Manish Dev    → Project scaffold + AppModule (others can't start without this)
Step 2: Geethu        → Users Module    ┐
        Chirag        → Products Module ├── These 3 can work in parallel
        Rajshekar     → CSS + api.js    ┘
Step 3: Anirudh       → Orders Module (depends on Users + Products being exported)
Step 4: M Nikhil      → Login Page (depends on Users API being ready)
        Navya         → Products Page (depends on Products + Orders API being ready)
Step 5: Rajshekar     → Orders Page (depends on Orders API + api.js being ready)
        Satwik G      → Admin Panel (depends on all 3 APIs being ready)
Step 6: All           → Integration testing & final review
```

---

## How to Run

```bash
cd nestjs-modular-poc
npm install
npm run start:dev
```

Open **http://localhost:3000** in your browser.

---

## API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/users` | Get all users |
| `GET` | `/users/:id` | Get user by ID |
| `POST` | `/users` | Create a new user |
| `GET` | `/products` | Get all products |
| `GET` | `/products/:id` | Get product by ID |
| `POST` | `/products` | Create a new product |
| `GET` | `/orders` | Get all orders (enriched with user/product names) |
| `POST` | `/orders` | Create a new order |
