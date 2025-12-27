# DriverApp Integration Testing Guide

## 🎯 Purpose
This guide provides step-by-step instructions to test the comprehensive DriverApp enhancements and verify full ecosystem integration.

---

## ✅ Pre-Testing Checklist

### 1. **Backend Status**
- [ ] Backend server is running on port 8080
- [ ] All 5 user endpoints are accessible:
  - `POST /api/auth/login`
  - `POST /api/auth/register/driver`
  - `GET /api/drivers/:id`
  - `PUT /api/drivers/:id/online`
  - `GET /api/orders?driverId=:id`

### 2. **Frontend Status**
- [ ] Expo development server is running
- [ ] Metro bundler has no errors
- [ ] Device/emulator is connected
- [ ] All apps are accessible via role selector

### 3. **Test Data**
- [ ] At least 1 driver account created
- [ ] At least 1 merchant account with products
- [ ] At least 1 user account
- [ ] Sample orders in different statuses (pending, accepted, in_transit, delivered)

---

## 🧪 Test Scenarios

### **Test 1: Driver Login & Dashboard**

**Steps:**
1. Open the app and select "Driver" role
2. Login with driver credentials
3. Verify dashboard loads successfully

**Expected Results:**
- ✅ Dashboard tab is active by default
- ✅ Welcome card shows driver name and online status
- ✅ Quick stats display (trips, earnings, distance, hours)
- ✅ Performance metrics are visible
- ✅ Notifications section appears (3 mock notifications)
- ✅ Quick action buttons render

**Pass/Fail:** ___________

---

### **Test 2: Online/Offline Toggle**

**Steps:**
1. Navigate to Dashboard
2. Toggle the online status switch OFF
3. Navigate to Available tab
4. Verify no orders are shown
5. Toggle online status back ON
6. Check Available tab again

**Expected Results:**
- ✅ Status indicator changes color (green = online, red = offline)
- ✅ Status label updates ("Online" / "Offline")
- ✅ Available orders hidden when offline
- ✅ Available orders visible when online
- ✅ Event bus publishes `driverStatusChanged` event

**Pass/Fail:** ___________

---

### **Test 3: Accept Order Flow**

**Steps:**
1. Ensure driver is online
2. Navigate to Available tab
3. Select any available order
4. Review order details (pickup, dropoff, fee)
5. Click "Accept Delivery" button
6. Check Active tab

**Expected Results:**
- ✅ Order moves from Available to Active tab
- ✅ Today's trip counter increments by 1
- ✅ Success alert shows: "Delivery accepted! Navigate to pickup location."
- ✅ Event bus publishes:
  - `driverAcceptedOrder` (with vehicle details)
  - `orderStatusChanged` (status: in_transit)
  - `orderAccepted`
- ✅ Notification added: "Order accepted"
- ✅ MerchantApp receives notification (if running)
- ✅ UserApp receives notification (if running)

**Pass/Fail:** ___________

---

### **Test 4: Complete Delivery Flow**

**Steps:**
1. Navigate to Active tab
2. Select an active delivery
3. Click "Complete Delivery" button
4. Verify delivery fee calculation
5. Check History tab
6. Check Earnings tab

**Expected Results:**
- ✅ Order moves from Active to History
- ✅ Success alert shows earnings amount
- ✅ Today's earnings update
- ✅ Today's distance updates (if order has distance)
- ✅ Total trips increment
- ✅ Notification added: "Delivery completed! Earned ₱X.XX"
- ✅ Event bus publishes:
  - `orderDelivered` (with full details)
  - `orderCompleted` (with amount)
  - `orderStatusChanged` (status: delivered)
- ✅ Earnings breakdown updates:
  - Today's earnings +₱X.XX
  - Week's earnings +₱X.XX
  - Month's earnings +₱X.XX
  - Average per delivery recalculated
- ✅ History tab shows completed order
- ✅ UserApp receives delivery notification (if running)

**Pass/Fail:** ___________

---

### **Test 5: Dashboard Quick Actions**

**Steps:**
1. Navigate to Dashboard
2. Click "Find Orders" button
3. Verify navigation to Available tab
4. Go back to Dashboard
5. Click "My Earnings" button
6. Verify navigation to Earnings tab
7. Go back to Dashboard
8. Click "History" button
9. Verify navigation to History tab
10. Go back to Dashboard
11. Click "Get Help" button
12. Verify navigation to Support tab

**Expected Results:**
- ✅ All 4 quick action buttons work
- ✅ Correct tabs open on button press
- ✅ No navigation errors or crashes

**Pass/Fail:** ___________

---

### **Test 6: Support Tab Features**

**Steps:**
1. Navigate to Support tab
2. Check emergency card
3. Review FAQ section
4. Check contact support options
5. View resources list

**Expected Results:**
- ✅ Emergency card displays hotline: 1800-EMERGENCY
- ✅ Call button is visible (red accent)
- ✅ 4 FAQ items are displayed:
  - How do I accept an order?
  - What if I can't find the address?
  - How are earnings calculated?
  - When will I receive my payment?
- ✅ 3 contact options available:
  - Live Chat
  - Email Support
  - Phone Support
- ✅ 4 resources listed:
  - Driver Guidelines
  - Training Videos
  - Terms of Service
  - Privacy Policy

**Pass/Fail:** ___________

---

### **Test 7: Profile Tab Enhancements**

**Steps:**
1. Navigate to Profile tab
2. Verify profile avatar and rating
3. Check vehicle information section
4. Review fuel level bar
5. Check settings menu

**Expected Results:**
- ✅ Driver name displays correctly
- ✅ Current rating shown (e.g., "⭐ 4.8")
- ✅ 6 vehicle details visible:
  - Vehicle Type: Motorcycle
  - License Plate: ABC-1234
  - Model: Honda Wave 110
  - Color: Black
  - Year: 2023
  - Maintenance: Good
- ✅ Fuel level progress bar displays (75%)
- ✅ 5 settings menu items:
  - Notifications
  - Language
  - Payment Method
  - Documents
  - Privacy Settings

**Pass/Fail:** ___________

---

### **Test 8: Earnings Tab Calculations**

**Steps:**
1. Note current earnings values
2. Complete a delivery (Test 4)
3. Return to Earnings tab
4. Verify calculations

**Expected Results:**
- ✅ Today's earnings increase by delivery fee
- ✅ This week's earnings increase
- ✅ This month's earnings increase
- ✅ Total deliveries count increases
- ✅ Average per delivery recalculates correctly
- ✅ All 4 earning cards display updated values
- ✅ Performance stats section shows:
  - Rating
  - Total trips
  - Completion rate
  - On-time rate

**Pass/Fail:** ___________

---

### **Test 9: History Tab Details**

**Steps:**
1. Navigate to History tab
2. Verify completed deliveries list
3. Check order details

**Expected Results:**
- ✅ All completed deliveries shown
- ✅ Each order displays:
  - Order ID (truncated)
  - Status: DELIVERED
  - Pickup address
  - Dropoff address
  - Delivery fee
  - Payment method
  - Timestamp
- ✅ Orders sorted by completion time (newest first)

**Pass/Fail:** ___________

---

### **Test 10: Cross-App Event Bus Integration**

**Setup:** Open 3 apps simultaneously (DriverApp, UserApp, MerchantApp)

**Steps:**
1. **UserApp**: Place an order
2. **MerchantApp**: Accept the order
3. **MerchantApp**: Mark order as "Ready for Pickup"
4. **DriverApp**: Check notifications and Available tab
5. **DriverApp**: Accept the order
6. **UserApp**: Verify driver details appear
7. **MerchantApp**: Verify driver assigned
8. **DriverApp**: Complete the delivery
9. **UserApp**: Verify delivery completed notification
10. **MerchantApp**: Verify order status updated

**Expected Results:**
- ✅ Step 1: UserApp publishes `orderPlaced`
- ✅ Step 2: MerchantApp publishes `merchantAcceptedOrder`
- ✅ Step 3: MerchantApp publishes `orderReadyForPickup`
  - DriverApp receives notification
  - DriverApp shows order in Available tab
- ✅ Step 5: DriverApp publishes `driverAcceptedOrder`
  - UserApp shows driver name, vehicle info
  - MerchantApp shows driver assigned
- ✅ Step 8: DriverApp publishes `orderDelivered`
  - UserApp shows "Delivered" status
  - UserApp enables rating option
  - MerchantApp updates order status
- ✅ All apps stay in sync throughout entire flow
- ✅ No errors or crashes in any app

**Pass/Fail:** ___________

---

### **Test 11: Notifications System**

**Steps:**
1. Start with dashboard (3 mock notifications)
2. Accept an order (adds notification)
3. Complete a delivery (adds notification)
4. Receive a rating from UserApp (adds notification)
5. Check notification count and list

**Expected Results:**
- ✅ Dashboard shows notification count badge
- ✅ Maximum 5 notifications displayed at once
- ✅ New notifications appear at top
- ✅ Each notification has:
  - Icon (emoji)
  - Message text
  - Timestamp
- ✅ Notifications auto-scroll if > 5 items

**Pass/Fail:** ___________

---

### **Test 12: Real-time Stats Updates**

**Steps:**
1. Note starting stats:
   - Today's trips
   - Today's earnings
   - Total trips
   - Driver rating
2. Accept 2 orders
3. Complete both orders
4. Check all stat locations:
   - Dashboard quick stats
   - Dashboard performance overview
   - Earnings tab
   - Profile tab rating

**Expected Results:**
- ✅ Today's trips: +2
- ✅ Today's earnings: +sum of both fees
- ✅ Total trips in profile: +2
- ✅ Distance covered updates (if orders have distance)
- ✅ All stats update in real-time (no refresh needed)
- ✅ Performance metrics recalculate:
  - Completion rate
  - On-time rate
  - Response time

**Pass/Fail:** ___________

---

### **Test 13: Logout Flow**

**Steps:**
1. Navigate to Logout tab
2. Click logout button
3. Confirm logout in dialog
4. Verify redirect to role selector

**Expected Results:**
- ✅ Confirmation dialog appears
- ✅ Dialog message: "Are you sure you want to logout?"
- ✅ After confirmation:
  - Driver data cleared from context
  - Return to role selector screen
  - Event bus publishes logout event
  - Driver set to offline status

**Pass/Fail:** ___________

---

### **Test 14: UI/UX & Styling**

**Steps:**
1. Navigate through all 8 tabs
2. Check visual consistency
3. Test scrolling on long lists
4. Verify touch targets
5. Check colors and icons

**Expected Results:**
- ✅ Consistent color scheme:
  - Primary Blue: #45B7D1
  - Success Green: #27AE60
  - Warning Orange: #F39C12
  - Danger Red: #E74C3C
  - Purple Accent: #9B59B6
- ✅ All cards have elevation/shadow
- ✅ Border radius consistent (12px cards, 8px buttons)
- ✅ Icons render correctly (emojis)
- ✅ Text hierarchy clear (bold titles, regular body)
- ✅ Buttons have sufficient touch area (min 44x44)
- ✅ Scrolling smooth on all tabs
- ✅ No text truncation issues
- ✅ No layout overflow errors

**Pass/Fail:** ___________

---

### **Test 15: Error Handling**

**Steps:**
1. Turn off backend server
2. Try to accept an order
3. Check error message
4. Turn backend back on
5. Retry accept order
6. Test with network errors

**Expected Results:**
- ✅ Graceful error handling:
  - Error alert shown to user
  - Console log includes error details
  - App doesn't crash
- ✅ Success after backend restored
- ✅ Loading states shown during API calls
- ✅ Timeout handling for slow connections

**Pass/Fail:** ___________

---

## 📊 Test Results Summary

| Test # | Test Name | Pass/Fail | Notes |
|--------|-----------|-----------|-------|
| 1 | Driver Login & Dashboard | | |
| 2 | Online/Offline Toggle | | |
| 3 | Accept Order Flow | | |
| 4 | Complete Delivery Flow | | |
| 5 | Dashboard Quick Actions | | |
| 6 | Support Tab Features | | |
| 7 | Profile Tab Enhancements | | |
| 8 | Earnings Tab Calculations | | |
| 9 | History Tab Details | | |
| 10 | Cross-App Event Bus Integration | | |
| 11 | Notifications System | | |
| 12 | Real-time Stats Updates | | |
| 13 | Logout Flow | | |
| 14 | UI/UX & Styling | | |
| 15 | Error Handling | | |

**Total Passed:** ___ / 15  
**Total Failed:** ___ / 15  
**Overall Status:** ___________

---

## 🐛 Bug Report Template

If any test fails, use this template to document the issue:

```
**Test Number:** 
**Test Name:** 
**Expected Behavior:** 
**Actual Behavior:** 
**Steps to Reproduce:** 
1. 
2. 
3. 

**Screenshots:** (if applicable)

**Console Errors:** 

**Device/Emulator:** 
**OS Version:** 
**App Version:** 

**Severity:** Critical / Major / Minor
**Priority:** High / Medium / Low
```

---

## 🎯 Regression Testing

After any code changes, re-run these critical tests:

**Quick Regression Suite (5-10 minutes):**
- Test 1: Login & Dashboard
- Test 3: Accept Order
- Test 4: Complete Delivery
- Test 10: Event Bus Integration

**Full Regression Suite (30-45 minutes):**
- All 15 tests

---

## 📝 Notes

- Always test on both iOS and Android if targeting multiple platforms
- Test on different screen sizes (phone, tablet)
- Check performance on older devices
- Verify accessibility features (VoiceOver, TalkBack)
- Test with slow network conditions
- Test with app backgrounding/foregrounding
- Verify data persistence after app restart

---

## ✅ Sign-Off

**Tester Name:** ___________________________  
**Test Date:** ___________________________  
**Test Duration:** ___________________________  
**Overall Assessment:** ___________________________  
**Ready for Production:** YES / NO / WITH FIXES  

**Signature:** ___________________________

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Related Docs:** DRIVER_APP_ENHANCEMENT_COMPLETE.md
