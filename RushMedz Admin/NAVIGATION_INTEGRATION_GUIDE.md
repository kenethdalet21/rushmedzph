# 🗺️ Real-Time Navigation & Delivery Tracking Integration Guide

## Overview

This guide documents the complete real-time navigation and delivery tracking system for the E-Pharmacy Ecosystem. The system provides:

- **Real-time delivery tracking** for users
- **Navigation management** for drivers
- **Order tracking** with ETA updates
- **Google Maps integration** for turn-by-turn directions
- **Distance & ETA calculations** using Haversine formula
- **Multi-user-type support** (Driver, User, Merchant, Admin)

## Architecture

### Components

#### 1. **NavigationScreen.tsx** - Core Navigation Component
```
Purpose: Unified navigation screen for all user types
Features:
  - Real-time route information display
  - Distance calculation (Haversine formula)
  - ETA calculation based on travel mode
  - Travel mode selection (driving, transit, walking, bicycling)
  - User-type-specific color coding
  - Integration with Google Maps
  - Detailed route information card
```

**Location**: `components/NavigationScreen.tsx`

**Key Props**:
```typescript
interface NavigationScreenProps {
  originLatitude: number;
  originLongitude: number;
  destinationLatitude: number;
  destinationLongitude: number;
  originLabel: string;
  destinationLabel: string;
  userType: 'user' | 'driver' | 'merchant' | 'admin';
  onClose: () => void;
}
```

**Usage**:
```typescript
<NavigationScreen
  originLatitude={14.5515}
  originLongitude={120.9881}
  destinationLatitude={14.5995}
  destinationLongitude={120.9842}
  originLabel="SM Mall of Asia"
  destinationLabel="Customer Location"
  userType="driver"
  onClose={() => setShowNavigation(false)}
/>
```

---

#### 2. **DeliveryTracking.tsx** - Universal Delivery Tracker
```
Purpose: Centralized delivery management for all user types
Features:
  - Unified delivery list with filtering (all, active, completed)
  - Status-based color coding
  - Integration with NavigationScreen
  - Driver information display
  - ETA countdown
  - Detailed delivery information modal
```

**Location**: `components/DeliveryTracking.tsx`

**Interface**:
```typescript
interface DeliveryTrackingProps {
  userType: 'user' | 'driver' | 'merchant' | 'admin';
  currentUserLocation?: Maps.Coordinates;
  onNavigate?: (delivery: Delivery) => void;
}
```

**Usage in Apps**:
```typescript
// In DriverApp
<DeliveryTracking userType="driver" />

// In UserApp
<DeliveryTracking userType="user" />

// In MerchantApp
<DeliveryTracking userType="merchant" />
```

---

#### 3. **DriverDeliveryManagement.tsx** - Driver-Specific Features
```
Purpose: Complete driver delivery workflow management
Features:
  - Driver dashboard with stats (completed, active, earnings, rating)
  - Real-time location display (coordinates update every 30 seconds)
  - Active delivery list with full details
  - Priority-based display (normal, urgent, express)
  - Medicine list for each delivery
  - Distance & ETA calculation
  - Action buttons: Accept, Pickup, Navigate, Complete
  - Status workflow: assigned → accepted → picked-up → delivering → delivered
```

**Location**: `components/DriverDeliveryManagement.tsx`

**Key Features**:
- **Stats Dashboard**: Shows completed deliveries, active orders, earnings, rating
- **Delivery Cards**: Shows order details, medicines, locations, ETA
- **Priority Badges**: Color-coded (normal: blue, urgent: red, express: orange)
- **Action Flow**: 
  - Assigned → Click "Accept Delivery" → Status changes to "accepted"
  - Accepted → Click "Confirm Pickup" → Status changes to "picked-up"
  - Picked-up → Click "Navigate to Customer" → Opens NavigationScreen
  - Delivering → Click "Mark as Delivered" → Status changes to "delivered"

**Integration with DriverApp**:
```typescript
// In DriverApp.tsx component
import DriverDeliveryManagement from './DriverDeliveryManagement';

export default function DriverApp() {
  return (
    <View style={{ flex: 1 }}>
      <DriverDeliveryManagement />
    </View>
  );
}
```

---

#### 4. **UserOrderTracking.tsx** - Customer-Specific Features
```
Purpose: User order tracking and delivery monitoring
Features:
  - Order list with status filtering
  - Real-time delivery tracking with driver info
  - Driver contact (call/SMS) buttons
  - ETA display with countdown
  - Medicine list and pricing
  - Order statistics (total, active, completed, spent)
  - Live driver location tracking (when in-transit)
  - "Track Delivery" button launches NavigationScreen
```

**Location**: `components/UserOrderTracking.tsx`

**Order Statuses**:
- `pending` - ⏳ Waiting for pharmacy confirmation
- `confirmed` - ✓ Pharmacy confirmed
- `processing` - ⚙️ Preparing medicines
- `ready` - 📦 Ready for driver pickup
- `assigned` - 🚗 Driver assigned
- `in-transit` - 🚗💨 Driver on the way (can track)
- `delivered` - ✅ Successfully delivered
- `cancelled` - ❌ Order cancelled

**Integration with UserApp**:
```typescript
// In UserApp.tsx component
import UserOrderTracking from './UserOrderTracking';

export default function UserApp() {
  return (
    <View style={{ flex: 1 }}>
      <UserOrderTracking />
    </View>
  );
}
```

---

### Maps Service Module

**Location**: `services/maps.ts`

**Key Functions**:

```typescript
// Distance calculation using Haversine formula
calculateDistance(
  from: Coordinates,
  to: Coordinates
): number // returns distance in kilometers

// ETA calculation based on distance and travel mode
calculateETA(
  minutes: number // estimated travel time
): string // returns formatted ETA like "15 minutes"

// Format distance for display
formatDistance(km: number): string
// Example: 12.5 → "12.5 km"

// Format duration for display
formatDuration(minutes: number): string
// Example: 45 → "45 minutes"

// Format coordinates for display
formatCoordinates(coords: Coordinates): string
// Example: { latitude: 14.5, longitude: 120.9 } → "14.50°N, 120.90°E"

// Get Google Maps directions URL
getDirectionsURL(
  from: Coordinates,
  to: Coordinates,
  mode: 'driving' | 'transit' | 'walking' | 'bicycling'
): string

// Open Google Maps app
openGoogleMaps(
  latitude: number,
  longitude: number
): void

// Open native maps app with route
openRoute(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): void
```

---

## Integration Workflow

### Step 1: Import Required Components

```typescript
import NavigationScreen from './components/NavigationScreen';
import DeliveryTracking from './components/DeliveryTracking';
import DriverDeliveryManagement from './components/DriverDeliveryManagement';
import UserOrderTracking from './components/UserOrderTracking';
import * as Maps from './services/maps';
```

### Step 2: Add to Role-Based Apps

#### For DriverApp:
```typescript
import DriverDeliveryManagement from '../components/DriverDeliveryManagement';

export default function DriverApp() {
  return (
    <View style={{ flex: 1 }}>
      <DriverDeliveryManagement />
    </View>
  );
}
```

#### For UserApp:
```typescript
import UserOrderTracking from '../components/UserOrderTracking';

export default function UserApp() {
  return (
    <View style={{ flex: 1 }}>
      <UserOrderTracking />
    </View>
  );
}
```

#### For MerchantApp:
```typescript
import DeliveryTracking from '../components/DeliveryTracking';

export default function MerchantApp() {
  return (
    <View style={{ flex: 1 }}>
      <DeliveryTracking userType="merchant" />
    </View>
  );
}
```

### Step 3: API Integration Points

Replace mock data with real API calls:

**In DeliveryTracking.tsx**:
```typescript
const loadDeliveries = async () => {
  try {
    const response = await fetch('http://backend:8080/api/deliveries', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setDeliveries(data.deliveries);
  } catch (error) {
    console.error('Error loading deliveries:', error);
  }
};
```

**In DriverDeliveryManagement.tsx**:
```typescript
const loadDeliveries = async () => {
  try {
    const response = await fetch(
      'http://backend:8080/api/driver/deliveries',
      { headers: { 'Authorization': `Bearer ${driverToken}` } }
    );
    const data = await response.json();
    setDeliveries(data.deliveries);
    setStats(data.stats);
  } catch (error) {
    console.error('Error loading driver deliveries:', error);
  }
};
```

**In UserOrderTracking.tsx**:
```typescript
const loadOrders = async () => {
  try {
    const response = await fetch(
      'http://backend:8080/api/user/orders',
      { headers: { 'Authorization': `Bearer ${userToken}` } }
    );
    const data = await response.json();
    setOrders(data.orders);
    setStats(data.stats);
  } catch (error) {
    console.error('Error loading orders:', error);
  }
};
```

---

## Real-Time Updates

### Location Update Frequency

**Driver Location Updates**:
```typescript
useEffect(() => {
  const locationInterval = setInterval(() => {
    // Request location every 30 seconds
    getCurrentLocation().then(updateDeliveryLocation);
  }, 30000); // 30 seconds

  return () => clearInterval(locationInterval);
}, []);
```

**WebSocket Integration** (Optional for real-time):
```typescript
const socket = io('http://backend:8080');

socket.on('delivery:location-update', (data) => {
  // Update driver location in real-time
  updateDeliveryLocation(data);
});

socket.on('delivery:status-change', (data) => {
  // Update delivery status immediately
  updateDeliveryStatus(data);
});
```

---

## Color Coding System

### User Type Colors:
- **Driver**: 🔵 Blue (#3498db)
- **User**: 🟢 Green (#27ae60)
- **Merchant**: 🔴 Red (#e74c3c)
- **Admin**: 🟣 Purple (#9b59b6)

### Status Colors:
- **Pending**: 🟠 Orange (#f39c12)
- **Confirmed**: 🔵 Blue (#3498db)
- **Processing**: 🟣 Purple (#9b59b6)
- **Ready**: 🟢 Green (#2ecc71)
- **In-Transit**: 🔴 Red (#e74c3c)
- **Delivered**: 🟢 Dark Green (#27ae60)
- **Cancelled**: ⚫ Gray (#95a5a6)

### Priority Colors:
- **Normal**: 🔵 Blue (#3498db)
- **Urgent**: 🔴 Red (#e74c3c)
- **Express**: 🟠 Orange (#e67e22)

---

## Testing Guide

### Test Case 1: Driver Navigation
```
1. Login as driver
2. View delivery list
3. Accept a delivery (status: assigned → accepted)
4. Confirm pickup (status: accepted → picked-up)
5. Click "Navigate to Customer"
6. Verify NavigationScreen opens with correct locations
7. Verify ETA displays correctly
8. Verify distance calculates using Haversine
9. Click "Start Navigation" to open Google Maps
```

### Test Case 2: User Order Tracking
```
1. Login as user
2. View order list
3. Check order status updates in real-time
4. When status = "in-transit", click "Track Delivery"
5. Verify driver location displays
6. Verify driver name and rating show
7. Click call/SMS buttons to verify contact
8. Verify ETA countdown updates
```

### Test Case 3: Merchant Delivery Oversight
```
1. Login as merchant
2. View all active deliveries
3. Click on delivery to see details
4. Verify pharmacy location and customer location display
5. Verify driver information shows when assigned
6. Filter by status (all, active, completed)
7. Verify sorting by priority and ETA
```

---

## Distance & ETA Calculations

### Haversine Formula
Calculates distance between two geographic coordinates:

```typescript
const R = 6371; // Earth's radius in km
const dLat = (lat2 - lat1) * Math.PI / 180;
const dLng = (lng2 - lng1) * Math.PI / 180;
const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLng/2) * Math.sin(dLng/2);
const c = 2 * Math.asin(Math.sqrt(a));
const distance = R * c;
```

### ETA Calculation
```
ETA = Distance (km) / Average Speed
Average Speed by Mode:
  - Driving: 40 km/h (urban), 80 km/h (highway)
  - Transit: 30 km/h (with stops)
  - Walking: 5 km/h
  - Bicycling: 15 km/h
```

---

## Error Handling

### Common Issues & Solutions

**Issue**: NavigationScreen doesn't open
```typescript
// Verify coordinates are valid
if (!originLatitude || !originLongitude || 
    !destinationLatitude || !destinationLongitude) {
  Alert.alert('Error', 'Invalid location coordinates');
  return;
}
```

**Issue**: ETA not displaying
```typescript
// Ensure maps service is properly imported
import * as Maps from '../services/maps';

// Verify distance calculation
const distance = Maps.calculateDistance(from, to);
const eta = Maps.calculateETA(distance / 60); // distance in km to minutes
```

**Issue**: Google Maps not opening
```typescript
// For Android: Ensure Google Maps app is installed
// For iOS: Ensure Maps app permissions granted in Info.plist
// Fallback to web directions URL
const directionsURL = Maps.getDirectionsURL(from, to, 'driving');
Linking.openURL(directionsURL);
```

---

## Performance Optimization

### Data Caching
```typescript
// Cache delivery data to reduce API calls
const [deliveriesCache, setDeliveriesCache] = useState<Map<string, Delivery>>(new Map());

const getCachedDelivery = (id: string): Delivery | null => {
  return deliveriesCache.get(id) || null;
};

const cacheDelivery = (delivery: Delivery) => {
  deliveriesCache.set(delivery.id, delivery);
};
```

### Optimized Location Updates
```typescript
// Batch location updates instead of individual calls
const batchLocationUpdates = async (deliveries: Delivery[]) => {
  const updates = deliveries.map(d => ({
    deliveryId: d.id,
    coordinates: d.currentCoordinates
  }));
  
  await fetch('/api/batch-location-update', {
    method: 'POST',
    body: JSON.stringify(updates)
  });
};
```

---

## Security Considerations

### Location Privacy
```typescript
// Don't store exact coordinates permanently
// Clear location data after delivery completion
const clearDeliveryLocation = (deliveryId: string) => {
  // Remove from state
  // Remove from cache
  // Notify backend to clear
};
```

### Authentication
```typescript
// Always verify user authorization for delivery data
const loadDeliveries = async () => {
  const token = await getAuthToken();
  if (!token) {
    redirectToLogin();
    return;
  }
  
  // Fetch with authorization
  const response = await fetch('/api/deliveries', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
};
```

---

## Future Enhancements

1. **Real-time WebSocket Updates**: Live location tracking every 10 seconds
2. **Route Optimization**: Calculate optimal delivery routes for multiple orders
3. **Traffic Integration**: Use real-time traffic data for ETA adjustments
4. **Geofencing**: Notify when driver reaches destination
5. **Delivery Photo**: Require photo proof of delivery
6. **Customer Ratings**: Rate driver and delivery after completion
7. **Vehicle Telemetry**: Track vehicle health metrics
8. **Safety Features**: Emergency SOS button, panic alerts
9. **Analytics Dashboard**: Delivery metrics, performance tracking
10. **Predictive ETA**: ML-based ETA using historical data

---

## File Summary

| File | Purpose | User Type |
|------|---------|-----------|
| `NavigationScreen.tsx` | Core navigation UI | All |
| `DeliveryTracking.tsx` | Delivery management | User/Merchant/Admin |
| `DriverDeliveryManagement.tsx` | Driver workflow | Driver |
| `UserOrderTracking.tsx` | Order tracking | User |
| `services/maps.ts` | Location utilities | All |

---

## Support & Troubleshooting

For issues with navigation features, check:
1. ✅ Google Maps API key is configured
2. ✅ Location permissions are granted
3. ✅ Coordinates format is correct (latitude/longitude)
4. ✅ Network connectivity is available
5. ✅ NavigationScreen is properly imported and props provided
6. ✅ Maps service functions are correctly called

---

**Last Updated**: 2024  
**Status**: ✅ Complete & Ready for Integration
