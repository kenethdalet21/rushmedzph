# Multi-Merchant Product Management System

## Overview
The ePharma Ecosystem supports multiple independent merchant users, each maintaining their own product catalog. Products are persisted in a centralized database but isolated by merchant ID.

## Architecture

### Merchant Identification
- **Unique ID Generation**: Each merchant receives a unique ID on signup/login
  - SignUp: `id = Math.random().toString(36).substring(7)` (random alphanumeric)
  - SignIn: Same ID generation ensures different sessions get different IDs
  - Stored in: AsyncStorage as `@epharma_merchant_user`

### Product Isolation
- **Database Level**: Products table has `merchant_id` column indexed for performance
- **API Level**: Products filtered by `?merchantId={id}` query parameter
- **Frontend Level**: MerchantApp loads only products for logged-in merchant

## Testing Multi-Merchant Scenario

### Test Case 1: Two Merchants, Different Products

**Step 1: First Merchant Setup**
```
1. Open browser → http://localhost:8085
2. Click "Select Role" → Choose "Merchant"
3. Click "Sign Up"
4. Fill form:
   - Email: merchant1@example.com
   - Password: password123
   - Business Name: First Pharmacy
   - Owner Name: John Doe
   - Phone: 09123456789
   - License: LIC001
   - Type: Pharmacy
5. Click "Sign Up" → Auto-login as Merchant 1
```

**Step 2: Merchant 1 Adds Products**
```
1. Navigate to "Products" tab
2. Click "+" button
3. Add Product 1:
   - Name: Aspirin 500mg
   - Price: 10.00
   - Stock: 100
   - Category: Medicines
4. Click "Add Product"
5. Add Product 2:
   - Name: Vitamin D 1000IU
   - Price: 15.00
   - Stock: 50
   - Category: Vitamins
```

**Step 3: Logout Merchant 1**
```
1. Click "Logout" tab
2. Confirm logout
```

**Step 4: Second Merchant Setup**
```
1. Click "Select Role" → Choose "Merchant"
2. Click "Sign Up"
3. Fill form:
   - Email: merchant2@example.com
   - Password: password456
   - Business Name: Second Pharmacy
   - Owner Name: Jane Smith
   - Phone: 09987654321
   - License: LIC002
   - Type: Hospital
4. Click "Sign Up" → Auto-login as Merchant 2
```

**Step 5: Merchant 2 Adds Different Products**
```
1. Navigate to "Products" tab (should be empty)
2. Click "+" button
3. Add Product 1:
   - Name: Paracetamol 500mg
   - Price: 5.00
   - Stock: 200
   - Category: Medicines
4. Click "Add Product"
5. Add Product 2:
   - Name: Ibuprofen 200mg
   - Price: 8.00
   - Stock: 150
   - Category: Medicines
```

**Step 6: Verify Isolation**
```
1. Logout Merchant 2
2. Login as Merchant 1 again
   - Should see: Aspirin, Vitamin D (Merchant 1's products)
   - Should NOT see: Paracetamol, Ibuprofen (Merchant 2's products)
```

### Test Case 2: User Sees All Products

**Step 1: Switch to User Role**
```
1. Merchant 1 still logged in
2. Click "Select Role" or navigate to role selector
3. Choose "User"
4. Login/Signup as any user
5. Go to "Browse" tab
```

**Expected Result**: User should see products from BOTH Merchant 1 AND Merchant 2
- Aspirin 500mg (Merchant 1)
- Vitamin D 1000IU (Merchant 1)
- Paracetamol 500mg (Merchant 2)
- Ibuprofen 200mg (Merchant 2)

### Test Case 3: Product Persistence After Logout

**Step 1: Merchant 1 Add Product**
```
1. Login as Merchant 1
2. Add "Omeprazole 20mg" priced at 20.00
3. Verify it appears in the list
4. Logout
```

**Step 2: Verify Persistence**
```
1. Login as Merchant 1 again
2. Go to Products tab
3. Should still see "Omeprazole 20mg" (persisted in database)
```

## Database Schema

### Products Table
```sql
CREATE TABLE products (
  id VARCHAR(36) PRIMARY KEY,
  merchant_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3),
  stock INT NOT NULL,
  category VARCHAR(50),
  requires_prescription BOOLEAN DEFAULT false,
  image_url VARCHAR(500),
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  
  INDEX idx_merchant_id (merchant_id),
  INDEX idx_category (category),
  INDEX idx_requires_prescription (requires_prescription)
);
```

## API Endpoints

### Get Products
```
GET /api/products                    # All products from all merchants
GET /api/products?merchantId={id}    # Products for specific merchant
```

**Example:**
```bash
# User sees all products
curl http://localhost:8086/api/products

# Merchant 1 sees only their products
curl http://localhost:8086/api/products?merchantId=abc123def456
```

### Create Product
```
POST /api/products
Content-Type: application/json

{
  "merchantId": "abc123def456",
  "name": "Aspirin 500mg",
  "description": "Pain reliever",
  "price": 10.00,
  "currency": "PHP",
  "stock": 100,
  "category": "Medicines",
  "requiresPrescription": false,
  "imageUrl": "https://via.placeholder.com/150"
}
```

### Update Product
```
PUT /api/products/{id}
Content-Type: application/json

{
  "stock": 50,
  "price": 12.00
}
```

### Delete Product
```
DELETE /api/products/{id}
```

## Key Implementation Details

### Frontend (React Native/Expo)
1. **MerchantApp.tsx**
   - Uses `user?.id` as merchantId
   - Products filtered by merchantId on load and save
   - useEffect watches `user?.id` to reload products on login/logout

2. **UserApp.tsx**
   - Calls `productsAPI.getAll()` without merchantId filter
   - Receives all products from all merchants
   - Users can browse and purchase from any merchant

### Backend (Spring Boot)
1. **ProductController.java**
   - Handles CRUD operations
   - Filters by merchantId in GET endpoint
   - Validates merchantId on create/update

2. **Product Entity**
   - UUID primary key
   - merchantId indexed for performance
   - Cascade delete not implemented (intentional - preserve audit trail)

3. **ProductRepository.java**
   - `findByMerchantId(String merchantId)` - Get merchant's products
   - `findAll()` - Get all products (for users)

### Data Flow
```
Merchant 1 (ID: abc123) adds product
    ↓
MerchantApp calls: POST /api/products
  { merchantId: "abc123", name: "Aspirin", ... }
    ↓
Backend saves to database
    ↓
MerchantApp saves to local state & publishes eventBus
    ↓
UserApp subscribes to 'productAdded' event
    ↓
UserApp also fetches all products from GET /api/products
    ↓
User sees product in Browse tab
```

## Security Considerations

### Current (Development)
- No authentication required
- merchantId generated client-side
- Anyone can create merchant account

### Production Recommendations
1. Implement JWT authentication
2. Validate merchantId on backend against authenticated user
3. Add merchant account verification
4. Implement role-based access control (RBAC)
5. Add audit logging for product modifications

## Troubleshooting

### Products not appearing for Merchant 2
- **Check**: Ensure each merchant gets unique ID
  ```
  Browser DevTools → Application → Local Storage
  Look for: @epharma_merchant_user → id field
  ```
- **Check**: ProductController is filtering correctly
  ```
  Backend logs should show: "Fetching products for merchantId: xyz"
  ```

### Products disappearing after logout
- **Check**: useEffect is watching user?.id
  - Look for console log: "MerchantApp: user changed, reloading data"
- **Check**: Database file exists
  ```
  backend/data/epharma.mv.db
  backend/data/epharma.lock.db
  ```

### User not seeing all products
- **Check**: UserApp calls productsAPI.getAll() without merchantId
  - Look for: No ?merchantId parameter in API call
- **Check**: Backend is returning all products when merchantId is null
  ```
  Backend returns all(): productRepository.findAll()
  ```

## Performance Optimizations

1. **Index on merchant_id**: Enables fast lookups for merchant-specific queries
2. **Index on category**: Enables fast category filtering
3. **Database connection pooling**: Handled by Spring Boot
4. **Pagination**: Can be added if products grow large
   ```
  GET /api/products?merchantId={id}&page=0&size=20
   ```

## Future Enhancements

1. **Batch Operations**: Add bulk product upload
2. **Product Sync**: Add WebSocket for real-time product updates
3. **Analytics**: Track which merchant's products sell best
4. **Inventory Management**: Low stock alerts per merchant
5. **Multi-warehouse**: Support multiple warehouses per merchant
6. **Merchant Dashboard**: Revenue, sales, inventory dashboards per merchant
