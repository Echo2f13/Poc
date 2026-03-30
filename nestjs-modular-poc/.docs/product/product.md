# Product Requirements

> **Purpose:** Product-level feature definitions. Claude should reference this to understand the user-facing behavior expected.

---

## Application: MicroAmazon

An Amazon-inspired e-commerce demo application showcasing a production-grade SaaS architecture.

---

## User Roles

| Role | Description | Access |
|------|-------------|--------|
| Customer | Default registered user | Browse, buy, review, manage own account |
| Admin | Store manager | All customer actions + manage products/orders/users |
| Super Admin | System administrator | All admin actions + role assignment, feature flags, system config |

---

## Core User Journeys

### 1. Browse & Search
- View product catalog with grid layout
- Search products by name/description
- Filter by category, price range
- Sort by price, rating, newest
- Paginated results (20 per page)
- View product detail with description, price, stock, reviews

### 2. Shopping Cart
- Add product to cart (with quantity)
- Update quantity in cart
- Remove item from cart
- View cart with item subtotals and grand total
- Cart persists across page refreshes (server-side for logged-in users)
- Stock validation on add and checkout

### 3. Checkout & Payment
- Select shipping address (from saved addresses)
- View order summary (items, subtotal, tax 8%, total)
- Choose payment method (Card / UPI / COD)
- Enter payment details
- Submit payment
- See real-time processing status
- Receive confirmation or failure notification

### 4. Order Management
- View order history (most recent first)
- View order detail with items, payment status, timeline
- Cancel pending/confirmed orders
- Track order status progression

### 5. User Account
- Register with name, email, password
- Login/logout
- View and edit profile
- Manage shipping addresses (add, edit, set default, delete)
- View active sessions, revoke sessions
- View notification feed

### 6. Product Reviews
- Rate a product (1-5 stars) after purchase
- Write optional text review
- One review per user per product
- Average rating shown on product card and detail page

---

## Admin Journeys

### 1. Dashboard
- Today's revenue, order count, new users
- Orders by status (pie/bar chart)
- Top 5 products by revenue
- Payment success rate

### 2. Product Management
- View all products (table with search, filter, sort)
- Create new product (name, description, price, stock, category, image)
- Edit product details
- Soft-delete product (deactivate)
- Low stock alerts (stock < 10)

### 3. Order Management
- View all orders (table with status filter)
- Update order status (confirmed → processing → shipped → delivered)
- View payment details for any order
- Initiate refund for paid orders

### 4. User Management
- View all users (table with search, role filter)
- Deactivate/reactivate users
- Change user roles (admin only by super_admin)

### 5. Payment Management
- View all payments with status filter
- Force success/failure on test payments (super_admin)
- View transaction history per payment
- Configure simulation rates (super_admin)

### 6. Audit Log Viewer
- View all system activity
- Filter by entity, action, user, date range
- See before/after values for changes

---

## Tax Calculation

- Tax rate: 8% flat
- Applied to subtotal
- `tax = subtotal * 0.08`
- `total = subtotal + tax`
- Rounded to 2 decimal places

---

## Order Status Flow

```
pending → confirmed → processing → shipped → delivered
    │         │
    └─────────┴── cancelled (customer can cancel before shipped)
    │
    └── payment_failed (on payment failure)
            │
            └── pending (on payment retry success)

delivered → (no more transitions — final state)
refunded → (no more transitions — final state)
```

---

## Notifications

| Event | Title | Body Template |
|-------|-------|--------------|
| Payment success | Order Confirmed | Your order #{orderId} has been confirmed and is being processed. |
| Payment failed | Payment Failed | Payment for order #{orderId} failed: {reason}. Please retry. |
| Order shipped | Order Shipped | Your order #{orderId} has been shipped! |
| Order delivered | Order Delivered | Your order #{orderId} has been delivered. |
| Refund processed | Refund Processed | Your refund of ₹{amount} for order #{orderId} has been processed. |
| Order cancelled | Order Cancelled | Your order #{orderId} has been cancelled. |
