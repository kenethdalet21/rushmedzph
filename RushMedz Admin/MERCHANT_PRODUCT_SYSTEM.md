# Merchant Product Management System - Operational Guide

## System Overview

The Epharma Ecosystem is **FULLY OPERATIONAL** with a complete product management system that connects Merchants, Users, and the backend database.

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  MerchantApp    │────────>│  Backend API     │<────────│    UserApp      │
│  (Product CRUD) │         │  (MongoDB)       │         │  (Browse/Order) │
└─────────────────┘         └──────────────────┘         └─────────────────┘
        │                             │                            │
        └─────────────────────────────┴────────────────────────────┘
                          EventBus (Real-time sync)
```

---

## 🎯 Current Status: FULLY OPERATIONAL

### ✅ Backend (Spring Boot + MongoDB)
**Location:** `backend/src/main/java/com/epharma/ecosystem/controller/ProductController.java`

**Endpoints:**
- `GET /api/products` - Get all products (supports `?merchantId=xxx` filter)
- `GET /api/products/{id}` - Get product by ID
- `POST /api/products` - Create new product
- `PUT /api/products/{id}` - Update product
- `DELETE /api/products/{id}` - Delete product
- `GET /api/products/search?query=xxx` - Search products

**Database:** MongoDB ProductRepository stores all products with merchant attribution

---

### ✅ Frontend API Layer
**Location:** `services/api.ts`

**Configuration:**
- API Base URL: `http://localhost:8086/api`
- Environment variable: `EXPO_PUBLIC_API_BASE_URL` (optional override)

**Methods:**
```typescript
productsAPI.create(product)     // Create product
productsAPI.getAll(merchantId?) // Get all/filtered products
productsAPI.update(id, product) // Update product
productsAPI.delete(id)          // Delete product
productsAPI.search(query)       // Search products
```

---

### ✅ MerchantApp Features (OPERATIONAL)

**Location:** `components/MerchantApp.tsx`

#### 1. **Dashboard Tab** ✅
- View today's sales statistics
- See pending orders count
- Monitor low stock items
- Track total products

#### 2. **Products Tab** ✅
**Functions:**
- **Add Product** (`handleAddProduct`):
  - Opens modal with form
  - Validates name, price, stock
  - Saves to backend via `POST /api/products`
  - Broadcasts `productAdded` event
  - Updates local state
  - Shows in UserApp immediately

- **Edit Product** (`handleEditProductSave`):
  - Click product card to open edit modal
  - Updates via `PUT /api/products/{id}`
  - Broadcasts `productUpdated` event
  - Syncs across all apps

- **Delete Product** (`handleDeleteProduct`):
  - Confirmation dialog
  - Removes via `DELETE /api/products/{id}`
  - Broadcasts `productDeleted` event
  - Removes from UserApp browse

**Product Fields:**
- Name (required)
- Description
- Price (required, > 0)
- Stock (required, ≥ 0)
- Category (medicines, vitamins, supplies, wellness, etc.)
- Requires Prescription (checkbox)
- Merchant ID (auto-assigned)
- Merchant Name (from user profile)
- Image URL (defaults to placeholder)

#### 3. **Orders Tab** ✅
**Functions:**
- View orders from customers
- Update order status:
  - Pending → Accepted → Picked Up → In Transit → Delivered
- Broadcasts status changes to UserApp and DriverApp
- `handleOrderStatusUpdate` syncs with backend

#### 4. **Payouts Tab** ✅
**Functions:**
- View available and pending balance
- Request payout via modal
- Choose payout method (Bank, GCash, PayMaya)
- Enter account details
- Track payout requests

#### 5. **Profile Tab** ✅
- View merchant account info
- Business details
- Contact information

#### 6. **Logout Tab** ✅
- Safe logout with confirmation
- Clears authentication state

---

### ✅ UserApp Features (OPERATIONAL)

**Location:** `components/UserApp.tsx`

#### **Browse Tab** (Displays Merchant Products)
**Function:** `loadProducts`
- Fetches all products from `GET /api/products`
- Real-time updates via eventBus subscriptions:
  - `productAdded` - New products appear instantly
  - `productUpdated` - Price/stock changes reflect immediately
  - `productDeleted` - Removed products disappear
- Categories filter: All, Medicines, Vitamins, Supplies, Wellness
- Search functionality
- Add to cart button

#### **Cart Tab** ✅
- View cart items
- Adjust quantities
- Remove items
- Calculate total
- Checkout with payment selection

#### **Orders Tab** ✅
- View order history
- Track delivery status
- See order details
- Real-time status updates from MerchantApp

---

## 🔄 Real-Time Synchronization (EventBus)

**Location:** `services/eventBus.ts`

### Events Flow:

**When Merchant adds product:**
1. MerchantApp → `productsAPI.create()` → Backend MongoDB
2. MerchantApp → `eventBus.publish('productAdded', {product})`
3. UserApp → receives event → updates product list
4. Product appears in UserApp Browse tab **instantly**

**When Merchant updates product:**
1. MerchantApp → `productsAPI.update()` → Backend MongoDB
2. MerchantApp → `eventBus.publish('productUpdated', {product})`
3. UserApp → receives event → updates product
4. Changes reflect **immediately** without refresh

**When Merchant deletes product:**
1. MerchantApp → `productsAPI.delete()` → Backend MongoDB
2. MerchantApp → `eventBus.publish('productDeleted', {productId})`
3. UserApp → receives event → removes from list
4. Product disappears from Browse tab

---

## 🚀 How to Use the System

### For Merchants:

#### Add a Product:
1. Open MerchantApp
2. Go to **Products** tab
3. Click **+ Add Product** button
4. Fill in product details:
   - Name (e.g., "Paracetamol 500mg")
   - Description (e.g., "Pain reliever and fever reducer")
   - Price (e.g., "5.99")
   - Stock (e.g., "150")
   - Category (select from dropdown)
   - Requires Prescription (check if needed)
5. Click **Save Product**
6. Product is saved to database
7. Product appears in UserApp Browse tab immediately

#### Edit a Product:
1. Click any product card in Products tab
2. Edit modal opens
3. Update any field
4. Click **Save Changes**
5. Updates sync to database and UserApp

#### Delete a Product:
1. Click product to open edit modal
2. Click **Delete Product**
3. Confirm deletion
4. Product removed from database and all apps

#### Manage Orders:
1. Go to **Orders** tab
2. See orders from customers
3. Update status as order progresses:
   - Accept order → "Accepted"
   - Prepare order → "Ready for Pickup"
   - Driver picks up → "Picked Up"
4. Status updates reach UserApp in real-time

### For Users:

#### Browse Products:
1. Open UserApp
2. **Browse** tab shows all merchant products
3. Use category filters
4. Search by name
5. Add products to cart

#### Place Order:
1. Add items to cart
2. Go to **Cart** tab
3. Review items and total
4. Click **Checkout**
5. Select payment method
6. Confirm order
7. Order appears in merchant's Orders tab

#### Track Order:
1. Go to **Orders** tab
2. View order status
3. See real-time updates as merchant/driver progress

---

## 🗄️ Database Schema

### Product Model (MongoDB)

```json
{
  "id": "string (auto-generated)",
  "merchantId": "string (required)",
  "merchantName": "string",
  "merchantEmail": "string",
  "name": "string (required)",
  "description": "string",
  "price": "number (required, > 0)",
  "currency": "string (default: PHP)",
  "stock": "number (required, >= 0)",
  "category": "string",
  "requiresPrescription": "boolean",
  "imageUrl": "string (default: placeholder)",
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp"
}
```

---

## 🛠️ Testing the System

### 1. Start Backend:
```bash
cd backend
mvn spring-boot:run
```
Backend runs on: `http://localhost:8086`

### 2. Start Frontend:
```bash
npx expo start
```

### 3. Test Product Flow:
1. Login as Merchant
2. Add a product (e.g., "Test Medicine $10, Stock: 100")
3. Switch to User role
4. Check Browse tab - product should appear
5. Add to cart and place order
6. Switch back to Merchant
7. Check Orders tab - order should be there
8. Update order status
9. Switch to User - status should update

### 4. Test Real-Time Sync:
1. Open app on 2 devices/windows (or use Expo Dev Tools)
2. Login as Merchant on device 1
3. Login as User on device 2
4. Add product on device 1
5. Product appears on device 2 Browse tab **instantly**

---

## 🔧 Configuration

### Environment Variables
Create `.env` file in root:
```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:8086
```

For physical devices on same network:
```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.XXX:8086
```

### Backend Configuration
`backend/src/main/resources/application.properties`:
```properties
spring.data.mongodb.uri=mongodb://localhost:27017/epharma_db
server.port=8086
```

---

## 📊 System Features Summary

| Feature | MerchantApp | UserApp | Backend | Status |
|---------|------------|---------|---------|--------|
| Create Product | ✅ | - | ✅ | OPERATIONAL |
| Edit Product | ✅ | - | ✅ | OPERATIONAL |
| Delete Product | ✅ | - | ✅ | OPERATIONAL |
| Browse Products | - | ✅ | ✅ | OPERATIONAL |
| Search Products | ✅ | ✅ | ✅ | OPERATIONAL |
| Real-time Sync | ✅ | ✅ | - | OPERATIONAL |
| Order Management | ✅ | ✅ | ✅ | OPERATIONAL |
| Payout Requests | ✅ | - | ✅ | OPERATIONAL |

---

## 🎉 Summary

**The Merchant Product Management System is FULLY OPERATIONAL!**

- ✅ All CRUD operations work
- ✅ Products are stored in MongoDB database
- ✅ Merchants can add/edit/delete products
- ✅ Products appear in UserApp Browse tab
- ✅ Real-time synchronization via EventBus
- ✅ Users can browse and order products
- ✅ Order management fully functional
- ✅ All tabs and buttons operational
- ✅ Cross-app communication working

**No additional implementation needed - the system is ready to use!**

---

## 📝 Notes

- Products persist in MongoDB even after app restart
- Fallback to local state if backend is offline
- EventBus provides instant cross-app updates
- All API calls have error handling
- Merchant ID is automatically assigned from logged-in user
- Image upload can be added later (currently uses placeholder)

---

*Last Updated: December 26, 2025*
