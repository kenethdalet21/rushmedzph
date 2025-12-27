# Dashboard Metrics Linking Guide

## Overview
All dashboard metrics in DashboardTab are now fully clickable and navigate to relevant tabs based on the user's application role (admin, merchant, driver, user).

## Metric Cards & Their Destinations

### Quick Stats (Highlight Cards)
1. **Total Revenue** (₱0 green card)
   - Admin → Payments Tab (💳 view payment transactions)
   - Merchant → Payments Tab (view sales payments)
   - Driver → Earnings Tab (💰 view earnings)
   - User → Payments Tab (view transaction history)

2. **Pending Orders** (blue card with count)
   - Admin → Order Management (📦 view all pending orders)
   - Merchant → Orders Tab (view your pending orders)
   - Driver → Available Tab (📦 view available deliveries)
   - User → Orders Tab (view your pending orders)

### Metrics Grid Cards
3. **Total Orders** (📦 card)
   - Admin → Order Management Tab
   - Merchant → Orders Tab
   - Driver → History Tab (📋 view all deliveries)
   - User → Orders Tab

4. **Completed Today** (✅ card)
   - Admin → Sales Analytics Tab (💹 view analytics)
   - Merchant → Dashboard Tab (stays on dashboard)
   - Driver → History Tab (completed deliveries)
   - User → Orders Tab

5. **Active Merchants** (🏪 card)
   - Admin → Merchant Management Tab
   - Merchant → Dashboard (stays on dashboard)
   - Driver → Active Tab (🚗 active deliveries/merchants)
   - User → Browse Tab (🔍 browse merchants)

6. **Active Drivers** (🚚 card)
   - Admin → Driver Management Tab
   - Merchant → Dashboard (stays on dashboard)
   - Driver → Active Tab (🚗 your active deliveries)
   - User → Browse Tab (available delivery drivers)

7. **Total Users** (👥 card)
   - Admin → Dashboard (metric info only)
   - Merchant → Dashboard (stays on dashboard)
   - Driver → Profile Tab (👤 view profile)
   - User → Profile Tab (your profile)

8. **Avg Delivery Time** (⏱️ card)
   - Non-clickable (informational only)

## Quick Actions
All quick action buttons also navigate based on app role:

| Quick Action | Button | Admin Destination | Merchant | Driver | User |
|---|---|---|---|---|---|
| View Full Analytics | 📊 | Sales Analytics | Dashboard | History | Orders |
| Send Notifications | 🔔 | Push Notifications | Dashboard | Profile | Profile |
| System Settings | ⚙️ | System Config | Dashboard | Profile | Profile |

## Implementation Details

### DashboardTab Props
```tsx
interface DashboardTabProps {
  onNavigateToTab?: (tabId: string) => void;
  appRole?: 'admin' | 'merchant' | 'driver' | 'user';
}
```

### Usage in Different Apps

#### AdminApp
```tsx
<DashboardTab onNavigateToTab={setActiveTab} appRole="admin" />
```

#### AdminAppUnified
```tsx
<DashboardTab onNavigateToTab={setActiveTab} appRole="admin" />
```

#### MerchantApp
Each role has its own dashboard implementation with custom metrics. DashboardTab is designed to work with AdminApp variants.

#### DriverApp
Each role has its own dashboard implementation with custom metrics.

#### UserApp
Each role has its own dashboard implementation with custom metrics.

## User Experience

### For Admin Users
- Click **Total Revenue** → Jump to Payments to view payment transactions
- Click **Pending Orders** → Jump to Order Management to manage orders
- Click **Active Merchants** → Jump to Merchant Management to manage merchants
- Click **Active Drivers** → Jump to Driver Management to manage drivers
- Click **View Full Analytics** → Jump to Sales Analytics for detailed reports

### For Merchant Users
- Click **Total Revenue** → View your payment transactions
- Click **Pending Orders** → View orders awaiting fulfillment
- Click **Active Merchants** → Stay on dashboard (informational)
- Most metrics keep them on dashboard for merchant-specific data

### For Driver Users
- Click **Total Revenue** → Jump to Earnings to view earnings breakdown
- Click **Pending Orders** → Jump to Available to see available deliveries
- Click **Active Drivers** → Jump to Active to view current deliveries
- Click **Total Users** → Jump to Profile to view your driver profile

### For User Customers
- Click **Active Merchants** → Jump to Browse to shop from available merchants
- Click **Total Orders** → Jump to Orders to view order history
- Click **Total Users** → Jump to Profile to view account settings
- Click **Send Notifications** → Jump to Profile for notification preferences

## Visual Feedback

Clickable metric cards have:
- **Interactive styling**: TouchableOpacity provides feedback on press
- **Navigation callbacks**: Each card has `onPress={() => handleMetricPress('metric-id')}`
- **Fallback alerts**: If navigation is not available, users see an Alert with guidance

## Adding New Metrics

To add a new metric that's clickable:

1. Add a new `TouchableOpacity` wrapper around the metric view
2. Call `handleMetricPress('new-metric-id')` on press
3. Add the metric-id to the `tabMap` object for each app role:
   ```tsx
   const tabMap: Record<string, Record<string, string>> = {
     admin: {
       'new-metric-id': 'target-tab-id',
     },
     merchant: {
       'new-metric-id': 'target-tab-id',
     },
     driver: {
       'new-metric-id': 'target-tab-id',
     },
     user: {
       'new-metric-id': 'target-tab-id',
     },
   };
   ```

## Testing Navigation

### Test Scenario 1: Admin Dashboard
1. Open AdminApp
2. Navigate to Dashboard tab
3. Click "Total Revenue" green card
4. Verify navigation to Payments tab
5. Click back, then click "Active Drivers"
6. Verify navigation to Driver Management tab

### Test Scenario 2: Role-Specific Navigation
1. Load app with merchant role
2. Verify pending orders metric navigates to merchant's Orders tab (not Order Management)
3. Verify active merchants metric stays on dashboard
4. Verify total users navigates to merchant's dashboard

### Test Scenario 3: Quick Actions
1. Click "View Full Analytics" button
2. Verify navigation based on user role
3. Admin → Sales Analytics
4. Merchant → Dashboard (informational)
5. Driver → History Tab
6. User → Orders Tab

## Files Modified

| File | Changes |
|------|---------|
| `components/tabs/DashboardTab.tsx` | Added appRole prop, handleMetricPress handler, clickable metric cards |
| `components/AdminApp.tsx` | Pass appRole="admin" to DashboardTab |
| `components/AdminAppUnified.tsx` | Pass appRole="admin" to DashboardTab |

## Future Enhancements

1. **Real-time Updates**: Use AdminDataContext to update metrics live
2. **Custom Thresholds**: Allow users to set alerts for metric thresholds
3. **Metric Exports**: Add ability to export metric data from each view
4. **Metric Comparisons**: Show trend comparisons (today vs. yesterday, etc.)
5. **Mobile-Optimized**: Add gesture support (swipe between metrics)
6. **Accessibility**: Add haptic feedback and voice labels for screen readers
