# Cross-App Linking Guide

## Overview

This guide explains how to link the RushMedz Admin web app with all other apps in the ecosystem:

- **DoctorApp** - D:\RushMedz App_Final\RushMedz Doctor
- **DriverApp** - D:\RushMedz App_Final\RushMedz Driver  
- **MerchantApp** - D:\RushMedz App_Final\RushMedz Merchant
- **UserApp** - D:\RushMedz App_Final\RushMedz User_Customer

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     RushMedz Admin (Vue Web App)                │
│                     http://localhost:5173                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ REST API / WebSocket
                            │
                ┌───────────┴───────────┐
                │   Backend API Server   │
                │   http://localhost:8086│
                └───────────┬───────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   DoctorApp   │   │   DriverApp   │   │  MerchantApp  │
│   (Expo/RN)   │   │   (Expo/RN)   │   │   (Expo/RN)   │
└───────────────┘   └───────────────┘   └───────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │    UserApp    │
                    │   (Expo/RN)   │
                    └───────────────┘
```

## Quick Start

### Step 1: Install Shared Configuration

Run the installation script from PowerShell:

```powershell
cd "D:\RushMedz App_Final\RushMedz Admin"
.\scripts\install-cross-app-config.ps1
```

This copies the shared configuration files to all apps.

### Step 2: Configure Environment Variables

Create a `.env.local` file in each app with the following variables:

**For all apps:**
```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:8086
EXPO_PUBLIC_ADMIN_URL=http://localhost:5173
EXPO_PUBLIC_WS_URL=ws://localhost:8086/ws/events
```

**For Admin app (Vite):**
```env
VITE_API_BASE_URL=http://localhost:8086
VITE_DOCTOR_APP_URL=http://localhost:8081
VITE_DRIVER_APP_URL=http://localhost:8082
VITE_MERCHANT_APP_URL=http://localhost:8083
VITE_USER_APP_URL=http://localhost:8084
```

### Step 3: Initialize Event Bus in Each App

Add the following to each app's entry point:

**DoctorApp (App.tsx or index.tsx):**
```typescript
import { createEventBus, EVENT_TYPES } from './shared/crossAppEventBus';

// Initialize event bus for Doctor app
const eventBus = createEventBus('doctor');

// Listen for events from Admin
eventBus.subscribe(EVENT_TYPES.DOCTOR_STATUS_CHANGED, (event) => {
  console.log('Doctor status changed by Admin:', event.payload);
});

// Report online status to Admin
eventBus.publishToAdmin(EVENT_TYPES.DOCTOR_STATUS_CHANGED, {
  status: 'online',
  doctorId: 'doctor-123',
});
```

**DriverApp (App.tsx or index.tsx):**
```typescript
import { createEventBus, EVENT_TYPES } from './shared/crossAppEventBus';

const eventBus = createEventBus('driver');

eventBus.subscribe(EVENT_TYPES.DRIVER_ASSIGNED, (event) => {
  console.log('New delivery assigned:', event.payload);
});

eventBus.publishToAdmin(EVENT_TYPES.DRIVER_STATUS_CHANGED, {
  status: 'online',
  driverId: 'driver-456',
  location: { lat: 14.5995, lng: 120.9842 },
});
```

**MerchantApp (App.tsx or index.tsx):**
```typescript
import { createEventBus, EVENT_TYPES } from './shared/crossAppEventBus';

const eventBus = createEventBus('merchant');

eventBus.subscribe(EVENT_TYPES.ORDER_CREATED, (event) => {
  console.log('New order received:', event.payload);
});

eventBus.publishToAdmin(EVENT_TYPES.PRODUCT_ADDED, {
  productId: 'prod-789',
  name: 'Paracetamol',
  price: 15.00,
});
```

**UserApp (App.tsx or index.tsx):**
```typescript
import { createEventBus, EVENT_TYPES } from './shared/crossAppEventBus';

const eventBus = createEventBus('user');

eventBus.subscribe(EVENT_TYPES.ORDER_UPDATED, (event) => {
  console.log('Order status updated:', event.payload);
});

eventBus.subscribe(EVENT_TYPES.DRIVER_ASSIGNED, (event) => {
  console.log('Driver assigned to order:', event.payload);
});
```

## Admin Features

### App Switcher

The Admin dashboard now includes an App Switcher in the top-right corner that:
- Shows connection status for all apps
- Allows quick navigation to other app interfaces
- Displays real-time health status of each app

### Cross-App Services

The Admin app provides these services for managing other apps:

```typescript
import { useCrossApp } from '../composables/useCrossApp';

const { 
  doctorAppService,
  driverAppService,
  merchantAppService,
  userAppService,
  notificationService,
} = useCrossApp();

// Example: Get all doctors
const doctors = await doctorAppService.getDoctors();

// Example: Suspend a driver
await driverAppService.suspendDriver('driver-123', 'Policy violation');

// Example: Approve a merchant
await merchantAppService.approveMerchant('merchant-456');

// Example: Send notification to all users
await notificationService.sendToApp('user', {
  title: 'Holiday Sale!',
  message: 'Get 20% off on all medications',
});
```

## Event Types

### Order Events
- `order:created` - New order placed
- `order:updated` - Order status changed
- `order:cancelled` - Order cancelled
- `order:delivered` - Order delivered

### Driver Events
- `driver:status_changed` - Driver went online/offline
- `driver:assigned` - Driver assigned to order
- `driver:location_updated` - Driver location changed

### Merchant Events
- `merchant:status_changed` - Merchant approved/suspended
- `merchant:payout_requested` - Payout request created
- `product:added` - New product added
- `product:updated` - Product details changed
- `product:deleted` - Product removed

### Doctor Events
- `doctor:status_changed` - Doctor approved/suspended
- `doctor:consultation_started` - Consultation began
- `doctor:consultation_ended` - Consultation ended
- `doctor:prescription_created` - New prescription issued

### User Events
- `user:registered` - New user registered
- `user:wallet_topup` - Wallet top-up requested

### System Events
- `notification:sent` - Push notification sent
- `system:config_changed` - System configuration updated

## API Endpoints

The backend API provides these endpoints for cross-app communication:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/doctors` | List all doctors |
| GET | `/api/drivers` | List all drivers |
| GET | `/api/merchants` | List all merchants |
| GET | `/api/users` | List all users |
| POST | `/api/notifications/send` | Send targeted notification |
| POST | `/api/notifications/broadcast` | Broadcast to all apps |
| POST | `/api/events/publish` | Publish event via REST |
| WS | `/ws/events` | WebSocket for real-time events |

## Troubleshooting

### Apps not connecting

1. Ensure the backend API is running on port 8086
2. Check that environment variables are set correctly
3. Verify firewall allows connections on required ports
4. Check browser console for WebSocket errors

### Events not received

1. Verify event bus is initialized with correct app type
2. Check that event type matches exactly (case-sensitive)
3. Ensure WebSocket connection is established
4. Check backend logs for event routing issues

### Authentication failures

1. Verify auth token is stored correctly
2. Check token expiration
3. Ensure API endpoints require proper authentication

## File Structure

After installation, each app should have:

```
app-directory/
├── shared/
│   ├── appConfig.ts        # Shared configuration
│   ├── crossAppEventBus.ts # Event bus service
│   └── adminApi.ts         # Admin API client
├── services/
│   ├── appConfig.ts        # (copy)
│   ├── crossAppEventBus.ts # (copy)
│   └── adminApi.ts         # (copy)
└── ...
```

## Security Considerations

1. **Authentication**: All cross-app API calls should include JWT tokens
2. **Authorization**: Admin should only allow authorized operations
3. **Validation**: Validate all incoming events and data
4. **Rate Limiting**: Implement rate limiting on API endpoints
5. **HTTPS**: Use HTTPS in production environments
