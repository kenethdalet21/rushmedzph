# RushMedz Ecosystem - Copilot Instructions

## Project Overview
RushMedz is a **4-app e-pharmacy ecosystem** built with React Native (Expo 54) for mobile apps and Vue 3 for the Admin web panel, backed by Spring Boot 3.3 + Supabase.

### App Structure
```
RushMedz User_Customer/  ← Main mobile codebase (Expo/React Native + Spring Boot backend)
RushMedz Doctor/         ← Telemedicine consultations (copies shared config from User_Customer)
RushMedz Driver/         ← Delivery management (copies shared config from User_Customer)  
RushMedz Merchant/       ← Pharmacy business management (copies shared config from User_Customer)
RushMedz Admin/          ← Vue 3 web admin panel (Vite)
```

**Key insight**: All mobile apps share the same codebase structure under `RushMedz User_Customer/`. Role-specific entry points are in [RushMedz User_Customer/app-configs/](../RushMedz User_Customer/app-configs/) (e.g., `app.user.json`, `app.doctor.json`). The Doctor/Driver/Merchant folders mainly contain documentation; mobile code lives in `RushMedz User_Customer` plus the shared modules distributed via `scripts/install-cross-app-config.ps1`.

## Architecture & Data Flow

### Backend Services
- **Spring Boot API** at `localhost:8086` owns products/orders/payouts, payment orchestration, and the WebSocket bridge under `/api/*`
- **Supabase** is for auth + light storage (public client via `EXPO_PUBLIC_SUPABASE_*`); when unset, [RushMedz User_Customer/services/supabase.ts](../RushMedz User_Customer/services/supabase.ts) mocks calls and logs a warning
- **WebSocket** at `ws://localhost:8086/ws/events` drives cross-app events; on devices set `EXPO_PUBLIC_API_BASE_URL` / APP_CONFIG.WS_URL to your LAN IP

### Cross-App Communication
Apps communicate via [RushMedz User_Customer/services/crossAppEventBus.ts](../RushMedz User_Customer/services/crossAppEventBus.ts) - a WebSocket-based pub/sub system:
```typescript
// Subscribe to events
eventBus.subscribe(EVENT_TYPES.ORDER_UPDATED, (event) => handleOrder(event.payload));
// Publish events
eventBus.publish({ type: 'order:placed', payload: orderData, target: 'merchant' });
```

### Service Layer Pattern
- [RushMedz User_Customer/services/api.ts](../RushMedz User_Customer/services/api.ts) - REST API client with graceful fallbacks in dev mode
- [RushMedz User_Customer/services/ecosystemBase.ts](../RushMedz User_Customer/services/ecosystemBase.ts) - Core shared types and database operations
- [RushMedz User_Customer/services/ecosystem.ts](../RushMedz User_Customer/services/ecosystem.ts) - User-app-specific service wrappers
- [RushMedz User_Customer/services/PaymentGatewayService.ts](../RushMedz User_Customer/services/PaymentGatewayService.ts) - Unified payment processing (GCash, PayMaya, PayPal, Stripe, COD)

### Ecosystem Orchestration
- Role selection is via app-config entry points (app.user|doctor|driver|merchant.json) + APP_CONFIG env; all apps reuse shared/ modules.
- Real-time sync: `crossAppEventBus` publishes order/payment/driver status to target apps (`target: 'merchant' | 'driver' | 'doctor' | 'user' | 'all'`).
- Deep links and WS targets map roles: user→doctor for consults, merchant→driver for fulfillment, driver→user for delivery updates.
- Telemedicine: User app requests consult via `consultationService` (ecosystemBase), doctor app receives events over WS; chat/video/audio routes through the backend bridge.

## Development Workflows

### Running Mobile Apps
```powershell
cd "RushMedz User_Customer"
npm install
npm start                    # Default Expo dev server
npm run start:user           # With user app config
npm run start:merchant       # With merchant app config
npm run start:doctor         # With doctor app config (telemed flows)
npm run start:driver         # With driver app config (delivery flows)
npm run start:admin          # With admin app config (mobile admin shell)
```

### Building APKs
```powershell
# Install EAS CLI and login
npm install -g eas-cli && eas login

# Build specific app (preview = APK, production = AAB for store)
$env:APP_CONFIG="./app-configs/app.user.json"
eas build --platform android --profile user-preview
# Other roles
$env:APP_CONFIG="./app-configs/app.doctor.json"; eas build --platform android --profile doctor-preview
$env:APP_CONFIG="./app-configs/app.driver.json"; eas build --platform android --profile driver-preview
$env:APP_CONFIG="./app-configs/app.merchant.json"; eas build --platform android --profile merchant-preview
```

### Running Backend
```powershell
cd "RushMedz User_Customer/backend"
mvn spring-boot:run          # Starts on localhost:8086
```

### Running Admin Panel
```powershell
cd "RushMedz Admin"
npm install && npm run dev   # Vue 3 + Vite dev server
```

**Admin panel patterns**: Vue 3 + Vite with Pinia + Vue Router (entry [RushMedz Admin/src/main.ts](../RushMedz Admin/src/main.ts)); mirrors ecosystem data and can reuse shared config/event bus modules when copied via the shared script.

## Key Conventions

### Component Organization
- Role-specific components: `UserAppEnhanced.tsx`, `MerchantAppEnhanced.tsx`, `DriverAppEnhanced.tsx`, `DoctorApp.tsx`
- Auth components follow pattern: `{Role}Login.tsx`, `{Role}Signup.tsx`
- Contexts provide role-specific state: [RushMedz User_Customer/contexts/](../RushMedz User_Customer/contexts/)

### Type Definitions
All shared types live in [RushMedz User_Customer/types/index.ts](../RushMedz User_Customer/types/index.ts):
```typescript
type Role = 'admin' | 'merchant' | 'driver' | 'user';
type PaymentMethod = 'card' | 'gcash' | 'paymaya' | 'cod' | 'paypal' | 'razorpay' | 'wallet';
type OrderStatus = 'pending' | 'accepted' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
```

### Environment Variables
Mobile apps use `EXPO_PUBLIC_*` prefix for client-accessible vars. See [RushMedz User_Customer/services/.env.mobile.example](../RushMedz User_Customer/services/.env.mobile.example) for required variables.

### Deep Linking
Each app has unique scheme for inter-app navigation:
- `rushmedz-user://`, `rushmedz-doctor://`, `rushmedz-driver://`, `rushmedz-merchant://`

## Gotchas
- Set `APP_CONFIG=./app-configs/app.{role}.json` for any Expo start or EAS build; missing it picks defaults.
- Physical devices/tunnels need `EXPO_PUBLIC_API_BASE_URL` (and thus WS URL) set to your LAN IP; otherwise API/WebSocket calls hit localhost and fail.
- Supabase creds optional in dev; without them the client is mocked and auth/storage calls no-op with warnings.
- Expo SDK 54 / React Native 0.81 / Reanimated 4.1: keep versions aligned to avoid metro/JSI issues; clear cache if native errors appear.
- Driver app requires background location permissions; ensure Android permission set matches `app.driver.json` when testing delivery flows.

## Testing
```powershell
npm test                     # Run Jest tests
npm run test:coverage        # With coverage report
npm run test:sync            # Event bus synchronization tests
```

## Important Patterns

### Event-Driven Updates
Components subscribe to eventBus for real-time updates instead of polling:
```typescript
useEffect(() => {
  const unsubscribe = eventBus.subscribe('product:updated', (payload) => {
    setProducts(prev => prev.map(p => p.id === payload.product.id ? payload.product : p));
  });
  return () => unsubscribe();
}, []);
```

### API Error Handling
In dev mode, API calls return empty arrays on failure to allow UI development without backend:
```typescript
// services/api.ts pattern - graceful degradation in development
if (!isDev) console.error(...); else return [] as T;
```

### Shared Config Distribution
Run `.\scripts\install-cross-app-config.ps1` from Admin directory to sync shared modules to all mobile apps.
