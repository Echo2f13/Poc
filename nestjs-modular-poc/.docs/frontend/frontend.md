# Frontend Architecture

> **Purpose:** Frontend design standards for the React + TypeScript migration. Claude MUST follow these patterns when creating frontend components.

## Stack

| Tool | Purpose |
|------|---------|
| React 18 | UI framework |
| TypeScript 5.x | Type safety |
| Vite 6.x | Build tool, HMR |
| React Router 7 | Client-side routing |
| TanStack Query 5 | Server state management |
| Zustand 5 | Client state management |
| React Hook Form 7 | Form handling |
| Zod | Schema validation |
| Tailwind CSS 4 | Utility-first styling |
| shadcn/ui | Accessible component primitives |

## Directory Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── App.tsx             # Root: providers, router outlet
│   │   ├── router.tsx          # Route definitions with lazy loading
│   │   └── providers.tsx       # QueryClientProvider, AuthProvider
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/     # LoginForm, RegisterForm
│   │   │   ├── hooks/          # useAuth, useCurrentUser
│   │   │   ├── api.ts          # login(), register(), refresh()
│   │   │   ├── types.ts        # User, LoginCredentials, AuthState
│   │   │   └── store.ts        # Zustand auth store
│   │   ├── products/
│   │   │   ├── components/     # ProductCard, ProductGrid, ProductDetail, SearchBar, Filters
│   │   │   ├── hooks/          # useProducts, useProduct, useProductSearch
│   │   │   ├── api.ts          # getProducts(), getProduct()
│   │   │   └── types.ts        # Product, ProductFilters
│   │   ├── cart/
│   │   │   ├── components/     # CartDrawer, CartItem, CartSummary, CartBadge
│   │   │   ├── hooks/          # useCart, useCartMutations
│   │   │   ├── api.ts          # getCart(), addItem(), updateItem(), removeItem()
│   │   │   └── store.ts        # Zustand optimistic cart store
│   │   ├── orders/
│   │   │   ├── components/     # OrderList, OrderDetail, OrderTimeline, OrderCard
│   │   │   ├── hooks/          # useOrders, useOrder
│   │   │   ├── api.ts
│   │   │   └── types.ts
│   │   ├── payments/
│   │   │   ├── components/     # CheckoutForm, PaymentMethodSelector, ProcessingOverlay
│   │   │   ├── hooks/          # usePayment, usePaymentStatus
│   │   │   ├── api.ts
│   │   │   └── types.ts
│   │   ├── admin/
│   │   │   ├── components/     # Dashboard, UserTable, OrderTable, ProductManager, AuditLogViewer
│   │   │   ├── hooks/
│   │   │   ├── api.ts
│   │   │   └── types.ts
│   │   └── notifications/
│   │       ├── components/     # NotificationBell, NotificationDropdown, NotificationItem
│   │       ├── hooks/          # useNotifications, useUnreadCount
│   │       └── api.ts
│   ├── shared/
│   │   ├── components/
│   │   │   ├── ui/             # shadcn/ui primitives (Button, Input, Dialog, etc.)
│   │   │   ├── layout/         # AppLayout, Navbar, Sidebar, Footer
│   │   │   ├── feedback/       # Toast, Skeleton, Spinner, EmptyState, ErrorBoundary
│   │   │   └── data/           # DataTable, Pagination, SearchInput
│   │   ├── hooks/
│   │   │   ├── useDebounce.ts
│   │   │   ├── useMediaQuery.ts
│   │   │   └── usePagination.ts
│   │   ├── lib/
│   │   │   ├── api-client.ts   # Axios instance with interceptors
│   │   │   ├── query-client.ts # TanStack Query config
│   │   │   └── utils.ts        # formatCurrency, formatDate, cn()
│   │   └── types/
│   │       ├── api.ts          # ApiResponse<T>, PaginatedResponse<T>, ApiError
│   │       └── common.ts       # Role, OrderStatus, PaymentStatus enums
│   └── styles/
│       └── globals.css         # Tailwind directives, CSS custom properties
├── public/
│   └── favicon.ico
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── tailwind.config.ts
```

## State Management Strategy

| State Type | Tool | Example |
|-----------|------|---------|
| Server data | TanStack Query | Products, orders, user profile |
| Auth state | Zustand + Context | Current user, tokens, login status |
| Cart state | Zustand (optimistic) | Cart items, quantities |
| UI state | React useState | Modals, drawers, tabs |
| Form state | React Hook Form | Checkout form, login form |
| URL state | React Router searchParams | Filters, pagination, sorting |

### TanStack Query Conventions

- Query keys: `['products'], ['products', id], ['products', { page, filters }]`
- staleTime: 5 minutes for catalog data, 0 for user-specific data
- Mutations use `onMutate` for optimistic updates on cart operations
- Error handling: global `onError` in QueryClient for auth errors (auto-redirect to login on 401)

### Zustand Store Conventions

- One store per domain: `useAuthStore`, `useCartStore`
- Actions defined inside the store, not externally
- No async logic in stores — async handled by TanStack Query
- Persist cart to localStorage for guest users

## Routing

```
/                           → Redirect to /products
/login                      → LoginPage (public)
/register                   → RegisterPage (public)
/products                   → ProductListPage (public)
/products/:id               → ProductDetailPage (public)
/cart                       → CartPage (auth required)
/checkout                   → CheckoutPage (auth required)
/checkout/payment/:orderId  → PaymentPage (auth required)
/orders                     → OrderListPage (auth required)
/orders/:id                 → OrderDetailPage (auth required)
/profile                    → ProfilePage (auth required)
/admin                      → AdminDashboard (admin only)
/admin/users                → AdminUsersPage (admin only)
/admin/products             → AdminProductsPage (admin only)
/admin/orders               → AdminOrdersPage (admin only)
/admin/payments             → AdminPaymentsPage (admin only)
/admin/audit                → AdminAuditPage (admin only)
```

### Route Protection

- `<ProtectedRoute>` wrapper checks auth store, redirects to /login
- `<AdminRoute>` wrapper checks role === admin || super_admin
- TanStack Query `onError` globally handles 401 → clear auth, redirect to /login

## UI Patterns

### Loading States

- Use `<Skeleton>` components matching the shape of actual content
- Product grid: skeleton cards with shimmer animation
- Tables: skeleton rows
- Never show empty page while loading — always show skeletons

### Error States

- Route-level ErrorBoundary with retry button
- API errors: toast notification with error message
- Form errors: inline field-level errors from Zod validation
- Network errors: "Connection lost" banner at top

### Empty States

- Orders: illustration + "No orders yet — start shopping" + CTA button
- Cart: illustration + "Your cart is empty" + CTA to products
- Search: "No products match your search" + suggestion to broaden criteria

### Responsive Breakpoints

- Mobile: < 640px (single column)
- Tablet: 640-1024px (2 column grid)
- Desktop: > 1024px (3-4 column grid, sidebar layouts)

## API Client

Axios instance in `shared/lib/api-client.ts`:

- Base URL from `VITE_API_URL` env var
- Request interceptor: attach Bearer token from auth store
- Response interceptor: on 401 → attempt token refresh → retry original request
- Response interceptor: on 401 after refresh fails → clear auth, redirect to /login
- All API functions return typed responses: `ApiResponse<T>` or `PaginatedResponse<T>`

## Performance

| Technique | Implementation |
|-----------|---------------|
| Code splitting | `React.lazy()` per route feature |
| Image lazy loading | `loading="lazy"` on all product images |
| Debounced search | 300ms debounce on search input |
| Virtualization | TanStack Virtual for lists > 50 items |
| Memoization | `React.memo` on ProductCard, OrderCard |
| Prefetch | Prefetch product detail on card hover |
