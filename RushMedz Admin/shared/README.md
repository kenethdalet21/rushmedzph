# RushMedz Shared Modules

This directory contains shared configuration and utilities that should be copied to all apps in the RushMedz ecosystem.

## Files

| File | Description |
|------|-------------|
| `appConfig.ts` | Shared configuration constants (URLs, app info, event types) |
| `crossAppEventBus.ts` | WebSocket-based real-time event communication |
| `adminApi.ts` | API client for communicating with Admin dashboard |
| `index.ts` | Export all modules |
| `.env.mobile.example` | Environment variables template for mobile apps |

## Installation

Run the installation script from the Admin directory:

```powershell
.\scripts\install-cross-app-config.ps1
```

This will copy all shared files to:
- D:\RushMedz App_Final\RushMedz Doctor\shared\
- D:\RushMedz App_Final\RushMedz Driver\shared\
- D:\RushMedz App_Final\RushMedz Merchant\shared\
- D:\RushMedz App_Final\RushMedz User_Customer\shared\

## Usage

```typescript
// Import everything
import { APP_CONFIG, createEventBus, adminApi, EVENT_TYPES } from './shared';

// Or import specific modules
import { createEventBus, EVENT_TYPES } from './shared/crossAppEventBus';
import { reportStatus, notifyAdmin } from './shared/adminApi';
```

## Quick Reference

### Initialize Event Bus
```typescript
import { createEventBus } from './shared/crossAppEventBus';

// Pass your app type: 'doctor' | 'driver' | 'merchant' | 'user'
const eventBus = createEventBus('doctor');
```

### Subscribe to Events
```typescript
import { EVENT_TYPES } from './shared/crossAppEventBus';

eventBus.subscribe(EVENT_TYPES.ORDER_UPDATED, (event) => {
  console.log('Order updated:', event.payload);
});
```

### Publish Events
```typescript
// Send to Admin only
eventBus.publishToAdmin(EVENT_TYPES.DOCTOR_STATUS_CHANGED, {
  doctorId: '123',
  status: 'online'
});

// Broadcast to all apps
eventBus.broadcast(EVENT_TYPES.PRODUCT_UPDATED, {
  productId: '456',
  name: 'Updated Product'
});
```

### Report to Admin
```typescript
import { reportStatus, notifyAdmin, reportError } from './shared/adminApi';

// Report app status
await reportStatus('doctor', 'online', { activeConsultations: 3 });

// Send notification to admin
await notifyAdmin('Critical Alert', 'Server load high', 'high');

// Report error for monitoring
await reportError('doctor', new Error('Connection failed'), { userId: '123' });
```
