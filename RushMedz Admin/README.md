# 🏥 Epharma Ecosystem

A comprehensive e-pharmacy delivery platform with separate interfaces for customers, merchants, drivers, and administrators. Built with React Native (Expo), Spring Boot 3.3.5, and Supabase.

## 🚀 Features

### 👤 Customer App
- Product browsing with categories (Medicines, Vitamins, Supplies, Wellness)
- Shopping cart with quantity controls
- 💳 **Checkout with 6 payment methods** (GCash, PayMaya, PayPal, Razorpay, Credit/Debit Card, COD)
- 💰 **Payment method selection modal** with real-time gateway integration
- 📜 **Transaction history** with payment status tracking
- 💸 **Refund request system** for completed orders
- Prescription upload functionality
- Real-time order tracking with payment status
- Profile management

### 🏪 Merchant Dashboard
- 💼 **Balance management** (available, pending, total earnings)
- 📊 **Revenue analytics** with daily/weekly/monthly breakdown
- 💸 **Payout request system** (bank transfer, GCash, PayMaya)
- 💰 **Payment reconciliation** with processing fee tracking
- 📈 **Payment method performance** statistics
- Product catalog management (add/edit/delete)
- Inventory tracking with low-stock alerts
- Order processing with payment status integration
- Sales analytics and performance metrics

### 🚗 Driver App
- Online/offline toggle for availability
- Active delivery tracking with pickup/dropoff details
- Available orders with distance and earnings info
- Route navigation integration
- Comprehensive earnings breakdown (daily/weekly/monthly)
- Performance stats and delivery history

### 🔐 Admin Panel
- 📊 **Platform-wide payment analytics** with real-time metrics
- 💳 **Transaction monitoring** with advanced filters (status, method, date)
- 💸 **Payout approval and management** for merchants
- 🛡️ **Fraud detection dashboard** with pattern analysis
- 📈 **Gateway health monitoring** (uptime, failure rates)
- 💰 **Financial summary** (fees, refunds, pending payouts)
- User, merchant, and driver management
- System monitoring and order oversight

## 🛠️ Tech Stack

**Frontend**: React Native (Expo 53), TypeScript, React Context API  
**Backend**: Spring Boot 3.3.5, Java 21 LTS, Maven 3.9.11  
**Database**: Supabase (PostgreSQL + Auth)  
**CI/CD**: GitHub Actions

## 📦 Quick Start

### Prerequisites
- Node.js 18+
- JDK 21 (installed at `C:\Java\jdk-21.0.8`)
- Maven 3.9.11 (installed at `C:\Maven\apache-maven-3.9.11`)
- Expo CLI: `npm install -g expo-cli`

### Installation

```bash
# Clone repository
git clone https://github.com/kdtuazon21/Epharma_Ecosystem.git
cd Epharma_Ecosystem

# Install mobile dependencies
npm install

# Start mobile app
npm start        # Development server
npm run android  # Android
npm run ios      # iOS
npm run web      # Web browser

# Start backend (separate terminal)
cd backend
mvn spring-boot:run
```

Backend runs on `http://localhost:8085`

### VS Code Tasks
- **backend: run** - Start Spring Boot
- **backend: debug** - Start with remote debugging (port 5005)

## 🗂️ Project Structure

```
Epharma_Ecosystem/
├── app/                      # Expo Router pages
├── components/               # React components
│   ├── UserAppEnhanced.tsx   # Customer app
│   ├── MerchantAppEnhanced.tsx  # Merchant dashboard
│   ├── DriverAppEnhanced.tsx    # Driver app
│   └── ...
├── contexts/                 # State management
│   ├── AuthContext.tsx
│   └── AppContext.tsx
├── services/                 # API clients
│   ├── api.ts               # REST API
│   └── supabase.ts          # Supabase client
├── types/                    # TypeScript types
├── backend/                  # Spring Boot backend
│   ├── pom.xml
│   └── src/main/java/com/epharma/ecosystem/
└── .github/workflows/        # CI/CD pipelines
```

## 🔌 API Endpoints

**Base URL**: `http://localhost:8085/api`

```
GET    /api/health                    # Health check
GET    /api/products                  # List products
POST   /api/products                  # Create product
GET    /api/orders                    # List orders
POST   /api/orders                    # Create order
PATCH  /api/orders/{id}/status        # Update order status
GET    /api/drivers/{id}/earnings     # Driver earnings
GET    /api/analytics/summary         # Platform analytics
```

## 🔒 Environment Setup

Create `services/supabase.ts` with your credentials:

```typescript
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
```

### Backend configuration (JWT, H2, Webhooks)

Edit `backend/src/main/resources/application.properties` for local/dev, or set environment variables in production.

Properties:

```properties
# JWT
jwt.secret=dev-secret-change-me
jwt.issuer=epharma-ecosystem
jwt.expiration-minutes=120

# H2 + JPA
spring.datasource.url=jdbc:h2:file:./data/epharma;AUTO_SERVER=TRUE
spring.datasource.driverClassName=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.h2.console.enabled=true
spring.h2.console.path=/h2-console

# Webhook secrets (HMAC verification)
webhook.gcash.secret=
webhook.paymaya.secret=
webhook.paypal.secret=
webhook.razorpay.secret=
```

Environment variables (recommended for production) map automatically:

- `JWT_SECRET`, `JWT_ISSUER`, `JWT_EXPIRATION_MINUTES`
- `WEBHOOK_GCASH_SECRET`, `WEBHOOK_PAYMAYA_SECRET`, `WEBHOOK_PAYPAL_SECRET`, `WEBHOOK_RAZORPAY_SECRET`

PowerShell example:

```powershell
$env:WEBHOOK_GCASH_SECRET = "your-gcash-secret"
$env:WEBHOOK_PAYMAYA_SECRET = "your-paymaya-secret"
$env:WEBHOOK_PAYPAL_SECRET = "your-paypal-secret"
$env:WEBHOOK_RAZORPAY_SECRET = "your-razorpay-secret"
$env:JWT_SECRET = "your-jwt-secret"
& "C:\Maven\apache-maven-3.9.11\bin\mvn.cmd" -f "d:/Epharmacy Application/Epharma_Ecosystem/backend/pom.xml" spring-boot:run
```

## 🧪 Testing

```bash
# Backend tests
cd backend
mvn test

# Mobile tests
npm test
```

## 🚀 Deployment

### Mobile App
```bash
npm run build           # Production build
eas build --platform android
eas build --platform ios
```

### Backend
```bash
cd backend
mvn clean package -DskipTests
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

## 📱 Key Features Implemented

✅ Full CRUD API for products, orders, merchants, drivers  
✅ Shopping cart with Context API state management  
✅ Real-time order status tracking  
✅ Earnings dashboard for drivers  
✅ Inventory management for merchants  
✅ Supabase authentication  
✅ Spring Boot actuator endpoints  
✅ GitHub Actions CI for backend  

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License

## 👥 Team

**Owner**: kdtuazon21  
**Repository**: [Epharma_Ecosystem](https://github.com/kdtuazon21/Epharma_Ecosystem)

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev/)
- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [Supabase Documentation](https://supabase.com/docs)
- [React Native Documentation](https://reactnative.dev/)

---

**Made with ❤️ for the healthcare community**
