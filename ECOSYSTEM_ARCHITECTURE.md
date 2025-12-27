# 🏗️ RushMedz Ecosystem Architecture

## 🎯 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     RushMedz Ecosystem (4-App)                   │
│                     Built with React Native                      │
└─────────────────────────────────────────────────────────────────┘

                    ┌──────────────────────┐
                    │  WebSocket Event Bus │
                    │  (Real-time Updates) │
                    └──────────┬───────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
   ┌─────────┐           ┌──────────┐         ┌─────────────┐
   │ Backend │           │   Auth   │         │  Database   │
   │  API    │◄──────────┤  System  │────────►│  (Supabase) │
   │(Node.js)│           │  (JWT)   │         │   (PostgreSQL)
   └────┬────┘           └──────────┘         └─────────────┘
        │
        │ HTTP/REST + WebSocket (ws://)
        │
        ├─────────────┬─────────────┬─────────────┬─────────────┐
        │             │             │             │             │
        ▼             ▼             ▼             ▼             ▼
   ┌─────────┐  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐
   │  USER   │  │ DOCTOR   │ │ DRIVER   │ │MERCHANT  │ │ ADMIN  │
   │   APP   │  │   APP    │ │   APP    │ │   APP    │ │ PANEL  │
   │(iOS/And)│  │(iOS/And) │ │(iOS/And) │ │(iOS/And) │ │(Web)   │
   └────┬────┘  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┘
        │            │            │            │
        └────────────┼────────────┼────────────┘
                     │ Deep Linking (Inter-app navigation)
```

---

## 📱 Mobile Apps (Android APK Generation)

### 1. USER App (rushmedz-user)
```
┌─────────────────────────────────────────┐
│         User/Customer Application       │
├─────────────────────────────────────────┤
│ Features:                               │
│  • Browse nearby services               │
│  • Place orders                         │
│  • Track deliveries in real-time        │
│  • Make payments                        │
│  • Rate & review                        │
│  • Chat with service providers          │
│                                         │
│ Bundle ID: com.rushmedz.user           │
│ Deep Link: rushmedz-user://            │
│ APK Name: rushmedz-user.apk            │
│ Size: ~120 MB                          │
│ Permissions: Camera, Gallery, Location │
└─────────────────────────────────────────┘
```

### 2. DOCTOR App (rushmedz-doctor)
```
┌─────────────────────────────────────────┐
│            Doctor/Provider App          │
├─────────────────────────────────────────┤
│ Features:                               │
│  • Manage consultations                 │
│  • Receive patient requests             │
│  • Audio/video calls                    │
│  • Prescribe medications                │
│  • View earnings & payouts              │
│  • Update availability                  │
│                                         │
│ Bundle ID: com.rushmedz.doctor         │
│ Deep Link: rushmedz-doctor://          │
│ APK Name: rushmedz-doctor.apk          │
│ Size: ~130 MB                          │
│ Permissions: Camera, Microphone, Audio │
└─────────────────────────────────────────┘
```

### 3. DRIVER App (rushmedz-driver)
```
┌─────────────────────────────────────────┐
│           Driver/Delivery App           │
├─────────────────────────────────────────┤
│ Features:                               │
│  • View delivery requests               │
│  • Real-time location tracking          │
│  • Navigate to pickup/delivery          │
│  • Manage deliveries                    │
│  • View earnings & bonuses              │
│  • Customer communication               │
│                                         │
│ Bundle ID: com.rushmedz.driver         │
│ Deep Link: rushmedz-driver://          │
│ APK Name: rushmedz-driver.apk          │
│ Size: ~125 MB                          │
│ Permissions: Location (foreground),    │
│              Background Location        │
└─────────────────────────────────────────┘
```

### 4. MERCHANT App (rushmedz-merchant)
```
┌─────────────────────────────────────────┐
│          Merchant/Business App          │
├─────────────────────────────────────────┤
│ Features:                               │
│  • Manage products/services             │
│  • Inventory management                 │
│  • View orders                          │
│  • Order fulfillment                    │
│  • Generate invoices                    │
│  • Analytics & reports                  │
│                                         │
│ Bundle ID: com.rushmedz.merchant       │
│ Deep Link: rushmedz-merchant://        │
│ APK Name: rushmedz-merchant.apk        │
│ Size: ~130 MB                          │
│ Permissions: Camera, Gallery, Location │
└─────────────────────────────────────────┘
```

---

## 🔗 Inter-App Deep Linking

### Deep Link Schemes Configured

```
rushmedz-user://home
rushmedz-doctor://consultations
rushmedz-driver://deliveries
rushmedz-merchant://inventory
```

### Example User Flow
```
User App                                Doctor App
   │                                        │
   │  [Tap to consult a doctor]              │
   │                                        │
   └──► rushmedz-doctor://consultations ────┼──► [Opens Doctor App]
                                            │
                                     [Shows Available Doctors]
                                            │
                                     [User selects doctor]
                                            │
                                     [Notification to Doctor]
                                            │
                                            ├──► [Doctor App Backend]
                                            │
   [Real-time update]                      │
   ◄────────────────────────────────────────┘
```

---

## 🌐 Backend Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                    NODE.JS API SERVER                          │
│                  (Running on Port 8086)                        │
└────────────────────────────────────────────────────────────────┘

Development:  http://localhost:8086
Production:   https://api.rushmedz.com

│
├─────────────────────────────────────────────────────────────────┐
│                   API ENDPOINTS                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Auth:          /api/auth/login, /api/auth/register            │
│  Users:         /api/users/profile, /api/users/orders          │
│  Doctors:       /api/doctors/search, /api/consultations        │
│  Drivers:       /api/drivers/deliveries, /api/tracking         │
│  Merchants:     /api/merchants/products, /api/inventory        │
│  Payments:      /api/payments/process, /api/payouts            │
│  WebSocket:     ws://localhost:8086/ws/events                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

│
├─────────────────────────────────────────────────────────────────┐
│                   REAL-TIME FEATURES                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Event Channels:                                                │
│  ├─ orders:deliveries        ◄─ New orders, status changes     │
│  ├─ products:inventory       ◄─ Stock updates                  │
│  ├─ users:notifications      ◄─ Messages & alerts              │
│  ├─ doctors:consultations    ◄─ Consultation updates           │
│  ├─ drivers:tracking         ◄─ Location updates               │
│  └─ merchants:analytics      ◄─ Real-time metrics              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

│
├─────────────────────────────────────────────────────────────────┐
│              INTEGRATED SERVICES                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Payment Gateways:      PayMongo, GCash, PayPal               │
│  SMS Service:           Twilio                                 │
│  Email Service:         SendGrid                               │
│  Push Notifications:    Expo Push Service                      │
│  Storage:               AWS S3 / Local Storage                 │
│  Database:              PostgreSQL (Supabase)                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Build System (EAS Cloud)

```
┌─────────────────────────────────────────────────────────────────┐
│                  EXPO APPLICATION SERVICES (EAS)                │
│                   Cloud Build Infrastructure                    │
└─────────────────────────────────────────────────────────────────┘

                         Your Local Machine
                    (Running build-apks.ps1)
                               │
                               │ npm build
                               │
                ┌──────────────┴──────────────┐
                │                             │
                ▼                             ▼
        User App Config                Doctor App Config
        (app.json, eas.json)            (app.json, eas.json)
        │                               │
        ├─────────────────────────────┬─┤
        │                             │ │
        ▼                             ▼ ▼
    ┌──────────────────────────────────────────┐
    │   EAS CLOUD BUILD SERVERS (Expo)         │
    │   (Compiles Android APK)                 │
    ├──────────────────────────────────────────┤
    │                                          │
    │  Profile: user-preview                   │
    │  Profile: doctor-preview                 │
    │  Profile: driver-preview                 │
    │  Profile: merchant-preview               │
    │                                          │
    │  Builds take 5-10 min each               │
    │  Fully compiled APK files generated      │
    │                                          │
    └──────────────────────────────────────────┘
                    │
                    │ Upload artifacts
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
    Your EAS Dashboard    Download APKs
    (https://expo.dev)    (via browser)
        │                       │
        └───────────┬───────────┘
                    │
                    ▼
        Install on Android Device
        (adb install file.apk)
```

---

## 📊 Data Flow Example: Placing an Order

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER PLACES ORDER                            │
└─────────────────────────────────────────────────────────────────┘

User App                           Backend API              Merchant App
   │                                   │                        │
   ├──────────── POST /orders ────────►│                        │
   │ (with items, location, payment)  │                        │
   │                                   │──► Save to Database    │
   │                                   │                        │
   │                                   │──► Emit WebSocket Event
   │                                   │    "orders:created"    │
   │                                   │                        │
   │◄──────── Order Confirmation ──────┤                        │
   │ (Order ID, Status, Estimated Time)│                        │
   │                                   │                   ┌────┴─────┐
   │                                   │                   │ Receives │
   │                                   │                   │ WebSocket│
   │                                   │                   │ Event    │
   │                                   │                   └────┬─────┘
   │                                   │                        │
   │                                   │                        ▼
   │                                   │              ┌──────────────────┐
   │                                   │              │ Shows New Order  │
   │                                   │              │ (Accept/Decline) │
   │                                   │              └──────────────────┘
   │                                   │                        │
   │                                   │                   [Tap Accept]
   │                                   │                        │
   │                                   │◄─ PUT /orders/accept ──┘
   │                                   │
   │                                   │──► Emit WebSocket Event
   │◄─ WebSocket Update ───────────────┤    "orders:accepted"
   │  (Order Accepted)                  │
   │                                   │
```

---

## 🔐 Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    JWT TOKEN AUTHENTICATION                     │
└─────────────────────────────────────────────────────────────────┘

Mobile App                         Backend API
   │                                   │
   │──────── POST /login ─────────────►│
   │ (phone + OTP or email/password)   │
   │                                   │
   │                        ┌──────────┴──────────┐
   │                        │ Verify Credentials  │
   │                        │ Generate JWT Token  │
   │                        └──────────┬──────────┘
   │                                   │
   │◄─────── JWT Token ────────────────┤
   │  {                                 │
   │    token: "eyJhbGc...",           │
   │    refreshToken: "...",            │
   │    expiresIn: 24h                  │
   │  }                                 │
   │                                   │
   │ [Store token in AsyncStorage]     │
   │                                   │
   │──── GET /profile ─────────────────►│
   │ Header: Authorization: Bearer ... │
   │                                   │
   │                        ┌──────────┴──────────┐
   │                        │ Verify Token        │
   │                        │ Return User Data    │
   │                        └──────────┬──────────┘
   │                                   │
   │◄─────── User Profile ─────────────┤
   │  {                                 │
   │    userId: "...",                 │
   │    name: "...",                   │
   │    email: "...",                  │
   │    role: "user"                   │
   │  }                                │
   │                                   │
```

---

## 📦 Deployment Paths

```
┌────────────────────────────────────────────────────────────┐
│              APK Deployment Options                        │
└────────────────────────────────────────────────────────────┘

Development:
  Build Profile: development
  APK Type: Debug (larger, unoptimized)
  Use Case: Internal testing, debugging
  Distribution: Email, Slack, cloud storage

Preview/Testing:
  Build Profile: preview
  APK Type: Release (optimized, not signed)
  Use Case: Team testing, beta testing
  Distribution: TestFlight, Firebase App Distribution

Production:
  Build Profile: production
  APK Type: Release (optimized, signed)
  Use Case: Google Play Store release
  Distribution: Google Play Store
  Requirements: Play Store account, payment setup
```

---

## ✅ System Status

```
Configuration: ✅ COMPLETE
  • All 4 apps configured
  • Bundle IDs unique
  • Deep links configured
  • Backend connected
  • Permissions set

Build System: ✅ READY
  • EAS configured
  • Build profiles created
  • build-apks.ps1 ready
  • eas.json present in all apps

Ready to Generate: ✅ YES
  • Run: eas login
  • Run: .\build-apks.ps1
  • Monitor: https://expo.dev/builds
```

---

For more information, see:
- [APK_GENERATION_QUICKSTART.md](./APK_GENERATION_QUICKSTART.md)
- [BUILD_QUICK_REFERENCE.md](./BUILD_QUICK_REFERENCE.md)
- [PRE_FLIGHT_CHECKLIST.md](./PRE_FLIGHT_CHECKLIST.md)
