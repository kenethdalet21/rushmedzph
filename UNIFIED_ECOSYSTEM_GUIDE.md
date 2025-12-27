# RushMedz Unified Ecosystem

## Overview

The RushMedz ecosystem is a comprehensive healthcare delivery platform that connects five interconnected applications:

1. **User/Customer App** - Browse products, upload prescriptions, book doctor consultations, track deliveries
2. **Merchant App** - Manage products, process orders, coordinate deliveries
3. **Doctor App** - Review prescriptions, conduct telemedicine consultations, manage patient records
4. **Driver App** - Accept deliveries, navigate to locations, complete deliveries
5. **Admin App** - Monitor all activities, manage users, view analytics

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         RushMedz Unified Backend                         │
│                        (Spring Boot + WebSocket)                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Products   │  │ Prescriptions│  │ Consultations│  │  Deliveries  │ │
│  │   Service    │  │   Service    │  │   Service    │  │   Service    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │   Patient    │  │ Notification │  │  Real-Time   │                   │
│  │   Records    │  │   Service    │  │    Events    │                   │
│  └──────────────┘  └──────────────┘  └──────────────┘                   │
│                                                                          │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │     WebSocket Hub     │
                    │   (STOMP over WS)     │
                    └───────────┬───────────┘
                                │
        ┌───────────┬───────────┼───────────┬───────────┐
        │           │           │           │           │
   ┌────┴────┐ ┌────┴────┐ ┌────┴────┐ ┌────┴────┐ ┌────┴────┐
   │  User   │ │Merchant │ │ Doctor  │ │ Driver  │ │  Admin  │
   │   App   │ │   App   │ │   App   │ │   App   │ │   App   │
   └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘
```

## Data Flow

### Product Lifecycle
```
Merchant App                    Backend                         User App
    │                              │                               │
    ├── Create Product ──────────►│                               │
    │                              ├── Broadcast Update ─────────►│
    │                              │                               │
    │                              │◄────────── Browse Products ───┤
    │                              │                               │
    ├── Update Stock ────────────►│                               │
    │                              ├── Real-time Update ─────────►│
    │                              │                               │
```

### Prescription Flow
```
User App          Doctor App           Backend           Merchant App
    │                  │                   │                  │
    ├─ Upload ───────────────────────────►│                  │
    │                  │                   │                  │
    │                  │◄─ New Rx Alert ───┤                  │
    │                  │                   │                  │
    │                  ├─ Review ─────────►│                  │
    │                  │                   │                  │
    │◄─ Status Update ─────────────────────┤                  │
    │                  │                   │                  │
    ├─ Place Order ──────────────────────►│                  │
    │                  │                   ├── Validate Rx ──►│
    │                  │                   │                  │
```

### Delivery Flow
```
User App     Merchant App     Backend      Driver App
    │              │             │              │
    ├─ Order ─────►│             │              │
    │              ├─ Process ──►│              │
    │              │             ├─ Assign ────►│
    │              │             │              │
    │              │             │◄─ Accept ────┤
    │◄─────────────────── Status Update ───────┤
    │              │             │              │
    │              │             │◄─ Location ──┤
    │◄───────── Live Tracking ─────────────────┤
    │              │             │              │
    │              │             │◄─ Complete ──┤
    │◄─────── Delivery Complete ───────────────┤
```

## API Endpoints

### Products API
```
GET    /api/products                    - List all products
GET    /api/products/{id}               - Get product details
POST   /api/products                    - Create product (Merchant)
PUT    /api/products/{id}               - Update product (Merchant)
DELETE /api/products/{id}               - Delete product (Merchant)
GET    /api/products/merchant/{id}      - Get merchant's products
POST   /api/products/{id}/images        - Add product image
DELETE /api/products/{id}/images/{imgId} - Remove product image
```

### Prescriptions API
```
GET    /api/prescriptions/{id}          - Get prescription
GET    /api/prescriptions/user/{userId} - User's prescriptions
GET    /api/prescriptions/pending       - Pending for review (Doctor)
POST   /api/prescriptions               - Upload prescription (User)
POST   /api/prescriptions/{id}/approve  - Approve prescription (Doctor)
POST   /api/prescriptions/{id}/reject   - Reject prescription (Doctor)
POST   /api/prescriptions/{id}/validate/{productId} - Validate for product
```

### Consultations API
```
GET    /api/consultations/{id}          - Get consultation
GET    /api/consultations/user/{userId} - User's consultations
GET    /api/consultations/doctor/{doctorId} - Doctor's consultations
POST   /api/consultations               - Request consultation (User)
POST   /api/consultations/{id}/accept   - Accept consultation (Doctor)
POST   /api/consultations/{id}/start    - Start session (Doctor)
POST   /api/consultations/{id}/end      - End session (Doctor)
GET    /api/consultations/{id}/messages - Get chat messages
POST   /api/consultations/{id}/messages - Send message
```

### Deliveries API
```
GET    /api/deliveries/{id}             - Get delivery details
GET    /api/deliveries/driver/{driverId} - Driver's deliveries
GET    /api/deliveries/user/{userId}    - User's deliveries
POST   /api/deliveries                  - Create assignment
POST   /api/deliveries/{id}/accept      - Accept delivery (Driver)
PUT    /api/deliveries/{id}/status      - Update status
PUT    /api/deliveries/driver/{id}/location - Update driver location
GET    /api/deliveries/driver/{id}/location - Get driver location
POST   /api/deliveries/{id}/complete    - Complete with proof
```

### Patient Records API
```
GET    /api/patients/{userId}           - Get patient record
PUT    /api/patients/{userId}           - Create/Update record
GET    /api/patients/doctor/{doctorId}  - Doctor's patients
POST   /api/patients/{userId}/medical-history - Add medical history
```

### Notifications API
```
GET    /api/notifications/user/{userId} - Get notifications
GET    /api/notifications/user/{userId}/unread-count - Unread count
PUT    /api/notifications/{id}/read     - Mark as read
PUT    /api/notifications/user/{userId}/read-all - Mark all read
```

## WebSocket Topics

Connect to: `ws://server:8080/ws`

### Subscribe Topics
```
/topic/products              - Product updates (all users)
/topic/orders/{orderId}      - Order updates
/topic/deliveries/{deliveryId} - Delivery location updates
/topic/consultations/{id}    - Consultation updates
/queue/user/{userId}         - User-specific notifications
/queue/merchant/{merchantId} - Merchant notifications
/queue/doctor/{doctorId}     - Doctor notifications
/queue/driver/{driverId}     - Driver notifications
```

### Message Types
```json
{
  "type": "product:update" | "prescription:update" | "consultation:update" | 
          "delivery:update" | "delivery:location" | "notification:new",
  "data": { ... }
}
```

## Frontend Services

Each app has access to ecosystem services through the `ecosystem.ts` module:

### User App Services
```typescript
import {
  browseProducts,
  uploadPrescription,
  requestConsultation,
  trackDelivery,
  onProductUpdate,
  onDeliveryUpdate,
  connectToEcosystem
} from './services/ecosystem';
```

### Merchant App Services
```typescript
import {
  createProduct,
  updateProduct,
  verifyPrescriptionForOrder,
  createDeliveryAssignment,
  findNearbyDrivers,
  onOrderUpdate
} from './services/ecosystem';
```

### Doctor App Services
```typescript
import {
  getPendingPrescriptions,
  approvePrescription,
  acceptConsultation,
  startConsultation,
  getPatientRecord,
  savePatientRecord
} from './services/ecosystem';
```

### Driver App Services
```typescript
import {
  goOnline,
  goOffline,
  updateLocation,
  acceptDelivery,
  completeDelivery,
  getEarnings,
  startLocationTracking
} from './services/ecosystem';
```

## Configuration

### Environment Variables

Each app should have these environment variables configured:

```env
EXPO_PUBLIC_API_URL=http://your-backend-server:8080/api
EXPO_PUBLIC_WS_URL=ws://your-backend-server:8080/ws
```

### Backend Configuration

In `application.properties`:
```properties
# Database
spring.datasource.url=jdbc:h2:file:./data/rushmedz
spring.datasource.driverClassName=org.h2.Driver
spring.jpa.hibernate.ddl-auto=update

# WebSocket
spring.websocket.max-text-message-size=65536
spring.websocket.max-binary-message-size=65536

# JWT
jwt.secret=your-secret-key
jwt.expiration=86400000
```

## Database Schema

The unified database includes:

- **users** - Customer/patient accounts
- **merchants** - Pharmacy/store accounts
- **doctors** - Medical professional accounts
- **drivers** - Delivery personnel accounts
- **products** - Items for sale
- **product_images** - Product photos
- **prescriptions** - Uploaded/digital prescriptions
- **prescription_items** - Medications in prescriptions
- **consultations** - Telemedicine sessions
- **chat_messages** - Consultation chat history
- **patient_records** - Medical records
- **orders** - Purchase orders
- **order_items** - Items in orders
- **delivery_assignments** - Delivery tasks
- **driver_locations** - Real-time driver positions
- **notifications** - System notifications

See `schema.sql` for complete DDL.

## Quick Start

### 1. Start Backend
```bash
cd "RushMedz Admin/backend"
mvn spring-boot:run
```

### 2. Connect Apps
Each app automatically connects when a user logs in:

```typescript
// In app initialization
useEffect(() => {
  if (user) {
    connectToEcosystem(user.id);
  }
  return () => disconnectFromEcosystem();
}, [user]);
```

### 3. Use Services
```typescript
// User browsing products
const { data: products } = await browseProducts({ category: 'Medicine' });

// Merchant creating product
await createProduct({
  name: 'Paracetamol',
  price: 5.99,
  merchantId: currentMerchant.id
});

// Doctor reviewing prescription
const pending = await getPendingPrescriptions();
await approvePrescription(pending[0].id, { validUntil: '2025-06-01' });

// Driver accepting delivery
await acceptDelivery(deliveryId);
await startLocationTracking(driverId, getLocation);
```

## Security

- All API endpoints require JWT authentication
- WebSocket connections require valid auth token
- Role-based access control (RBAC) on all endpoints
- Prescriptions validated before order completion
- Driver identity verified before assignment acceptance

## Real-Time Features

1. **Product Updates** - Users see new products instantly
2. **Prescription Status** - Users notified of approval/rejection
3. **Consultation Chat** - Real-time messaging with doctors
4. **Delivery Tracking** - Live driver location on map
5. **Push Notifications** - Instant alerts for all events

## Support

For issues or questions:
- Check `TROUBLESHOOTING.md` for common issues
- Review API documentation in Swagger UI at `/swagger-ui.html`
- Contact the development team

---

*RushMedz Unified Ecosystem v1.0*
