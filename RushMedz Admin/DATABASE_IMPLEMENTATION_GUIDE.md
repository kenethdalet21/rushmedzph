# Database Implementation Guide

## Overview
This document outlines the comprehensive database implementation for all user types in the E-Pharmacy Ecosystem. Each app now stores user data with encrypted passwords, profile images, and role-specific information.

## Database Models

### 1. UserUser (User App)
**Table Name**: `user_user`

**Fields**:
- `userId` (Long, Primary Key, Auto-generated)
- `username` (String, Unique, Required)
- `password` (String, Required, BCrypt Encrypted)
- `email` (String, Unique, Required)
- `phoneNumber` (String, Unique)
- `fullName` (String)
- `profileImageUrl` (String) - Stores user profile image URL
- `address`, `city`, `state`, `zipCode`, `country` (String)
- `role` (String, Default: "USER")
- `isActive` (Boolean, Default: true)
- `isEmailVerified` (Boolean, Default: false)
- `isPhoneVerified` (Boolean, Default: false)
- `createdAt` (LocalDateTime, Auto-generated)
- `updatedAt` (LocalDateTime, Auto-updated)
- `lastLoginAt` (LocalDateTime)

### 2. MerchantUser (Merchant App)
**Table Name**: `merchant_user`

**Fields**:
- `merchantId` (Long, Primary Key, Auto-generated)
- `username` (String, Unique, Required)
- `password` (String, Required, BCrypt Encrypted)
- `email` (String, Unique, Required)
- `phoneNumber` (String, Unique)
- `businessName` (String)
- `ownerName` (String)
- `profileImageUrl` (String) - Owner profile image
- `businessLogoUrl` (String) - Business logo image
- `businessAddress`, `businessCity`, `businessState`, `businessZipCode`, `businessCountry` (String)
- `businessLicenseNumber` (String)
- `taxIdNumber` (String)
- `role` (String, Default: "MERCHANT")
- `isActive` (Boolean, Default: true)
- `isEmailVerified` (Boolean, Default: false)
- `isPhoneVerified` (Boolean, Default: false)
- `isBusinessVerified` (Boolean, Default: false)
- `createdAt`, `updatedAt`, `lastLoginAt` (LocalDateTime)

### 3. DoctorUser (Doctor App)
**Table Name**: `doctor_user`

**Fields**:
- `doctorId` (Long, Primary Key, Auto-generated)
- `username` (String, Unique, Required)
- `password` (String, Required, BCrypt Encrypted)
- `email` (String, Unique, Required)
- `phoneNumber` (String, Unique)
- `fullName` (String)
- `profileImageUrl` (String) - Doctor profile image
- `specialization` (String)
- `licenseNumber` (String)
- `medicalDegree` (String)
- `hospitalAffiliation` (String)
- `clinicAddress`, `city`, `state`, `zipCode`, `country` (String)
- `yearsOfExperience` (Integer)
- `consultationFee` (String)
- `role` (String, Default: "DOCTOR")
- `isActive` (Boolean, Default: true)
- `isEmailVerified`, `isPhoneVerified`, `isLicenseVerified` (Boolean)
- `createdAt`, `updatedAt`, `lastLoginAt` (LocalDateTime)

### 4. DriverUser (Driver App)
**Table Name**: `driver_user`

**Fields**:
- `driverId` (Long, Primary Key, Auto-generated)
- `username` (String, Unique, Required)
- `password` (String, Required, BCrypt Encrypted)
- `email` (String, Unique, Required)
- `phoneNumber` (String, Unique)
- `fullName` (String)
- `profileImageUrl` (String) - Driver profile image
- `address`, `city`, `state`, `zipCode`, `country` (String)
- `licenseNumber` (String)
- `vehicleType`, `vehicleModel`, `vehiclePlateNumber`, `vehicleColor` (String)
- `vehicleYear` (Integer)
- `role` (String, Default: "DRIVER")
- `isActive` (Boolean, Default: true)
- `isEmailVerified`, `isPhoneVerified`, `isLicenseVerified`, `isVehicleVerified` (Boolean)
- `isAvailable` (Boolean, Default: true)
- `createdAt`, `updatedAt`, `lastLoginAt` (LocalDateTime)

### 5. AdminUser (Admin App)
**Table Name**: `admin_user`

**Fields**:
- `adminId` (Long, Primary Key, Auto-generated)
- `username` (String, Unique, Required)
- `password` (String, Required, BCrypt Encrypted)
- `email` (String, Unique, Required)
- `phoneNumber` (String, Unique)
- `fullName` (String)
- `profileImageUrl` (String) - Admin profile image
- `department` (String)
- `position` (String)
- `role` (String, Default: "ADMIN")
- `permissions` (String, Default: "ALL") - Can be: ALL, READ_ONLY, MANAGE_USERS, MANAGE_PRODUCTS, etc.
- `isActive` (Boolean, Default: true)
- `isEmailVerified`, `isPhoneVerified` (Boolean)
- `isSuperAdmin` (Boolean, Default: false)
- `createdAt`, `updatedAt`, `lastLoginAt` (LocalDateTime)

## Security Implementation

### Password Encryption
All passwords are encrypted using **BCrypt** algorithm through Spring Security's `PasswordEncoder`.

**Configuration**: `SecurityConfig.java`
```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
}
```

### Authentication Flow
1. User submits username and password
2. System looks up user in respective database table
3. Password is verified using `passwordEncoder.matches(rawPassword, hashedPassword)`
4. JWT token is generated with user role and ID
5. Last login timestamp is updated
6. User data (excluding password) is returned

## API Endpoints

### Authentication

#### Login (All User Types)
```
POST /api/auth/login
Request Body:
{
  "username": "string",
  "password": "string"
}

Response:
{
  "token": "jwt-token",
  "role": "user|merchant|doctor|driver|admin",
  "userId": number,
  "username": "string",
  "email": "string",
  "profileImageUrl": "string"
}
```

#### Registration Endpoints

**User Registration**
```
POST /api/auth/register/user
Request Body:
{
  "username": "string",
  "password": "string",
  "email": "string",
  "phoneNumber": "string",
  "fullName": "string",
  "profileImageUrl": "string" (optional)
  // ... other fields
}
```

**Merchant Registration**
```
POST /api/auth/register/merchant
Request Body:
{
  "username": "string",
  "password": "string",
  "email": "string",
  "businessName": "string",
  "profileImageUrl": "string" (optional),
  "businessLogoUrl": "string" (optional)
  // ... other fields
}
```

**Doctor Registration**
```
POST /api/auth/register/doctor
Request Body:
{
  "username": "string",
  "password": "string",
  "email": "string",
  "specialization": "string",
  "licenseNumber": "string",
  "profileImageUrl": "string" (optional)
  // ... other fields
}
```

**Driver Registration**
```
POST /api/auth/register/driver
Request Body:
{
  "username": "string",
  "password": "string",
  "email": "string",
  "licenseNumber": "string",
  "vehicleType": "string",
  "profileImageUrl": "string" (optional)
  // ... other fields
}
```

**Admin Registration**
```
POST /api/auth/register/admin
Request Body:
{
  "username": "string",
  "password": "string",
  "email": "string",
  "department": "string",
  "permissions": "string",
  "profileImageUrl": "string" (optional)
  // ... other fields
}
```

## Repository Methods

Each repository includes the following methods:

```java
// Standard JPA methods
List<Entity> findAll();
Optional<Entity> findById(Long id);
Entity save(Entity entity);
void deleteById(Long id);

// Custom finder methods
Entity findByUsername(String username);
Entity findByEmail(String email);
Entity findByPhoneNumber(String phoneNumber);
```

## Data Persistence

### Database Configuration
The application uses **H2 in-memory database** for development (configured in `application.properties`).

### Automatic Timestamps
- `createdAt`: Set automatically when entity is first persisted (`@PrePersist`)
- `updatedAt`: Updated automatically on every entity update (`@PreUpdate`)
- `lastLoginAt`: Updated manually during successful login

### Entity Lifecycle
```java
@PrePersist
protected void onCreate() {
    createdAt = LocalDateTime.now();
    updatedAt = LocalDateTime.now();
}

@PreUpdate
protected void onUpdate() {
    updatedAt = LocalDateTime.now();
}
```

## Image Storage

Profile images and business logos are stored as URLs (`profileImageUrl`, `businessLogoUrl`). 

**Recommended Implementation**:
1. Upload images to cloud storage (AWS S3, Azure Blob, etc.)
2. Store the public URL in the database
3. Display images using the stored URL

**Alternative**:
For local development, you can store images in:
- `backend/uploads/profiles/`
- `backend/uploads/business-logos/`

And serve them through a static file controller.

## Security Best Practices

1. **Password Storage**: Never store plain-text passwords. Always use BCrypt encryption.
2. **JWT Tokens**: Include user ID and role in token payload for authorization.
3. **Input Validation**: Validate all user inputs before saving to database.
4. **Unique Constraints**: Username, email, and phone number must be unique.
5. **Active Flag**: Check `isActive` flag before allowing login.
6. **Verification Flags**: Use `isEmailVerified`, `isPhoneVerified` for additional security.

## Migration Notes

If you have existing data:

1. **Backup existing data**
2. Run the application - JPA will automatically create/update tables
3. Existing passwords need to be re-encrypted:
   ```java
   // For each user
   user.setPassword(passwordEncoder.encode(user.getPassword()));
   userRepository.save(user);
   ```

## Testing

### Create Test User
```bash
curl -X POST http://localhost:8080/api/auth/register/user \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123",
    "email": "test@example.com",
    "fullName": "Test User"
  }'
```

### Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

## Next Steps

1. **File Upload Controller**: Implement image upload endpoints
2. **Profile Management**: Add endpoints to update user profiles
3. **Email Verification**: Implement email verification flow
4. **Phone Verification**: Implement OTP-based phone verification
5. **Password Reset**: Add forgot password functionality
6. **Production Database**: Configure PostgreSQL/MySQL for production

## Files Modified/Created

### Models
- `UserUser.java` - Enhanced with comprehensive fields
- `MerchantUser.java` - Enhanced with business fields
- `DoctorUser.java` - Enhanced with medical fields
- `DriverUser.java` - Enhanced with vehicle fields
- `AdminUser.java` - Enhanced with admin fields

### Security
- `SecurityConfig.java` - Added BCrypt password encoder bean

### Controllers
- `AuthController.java` - Updated with BCrypt verification and registration endpoints

### Repositories
- All user repositories - Added `findByEmail()` and `findByPhoneNumber()` methods

### Services
- All user services - Updated to use new ID field names

## Summary

All apps now have:
✅ Separate database tables with unique IDs
✅ BCrypt encrypted passwords
✅ Profile image URL storage
✅ Comprehensive user information fields
✅ Role-specific fields (business info, medical credentials, vehicle info, etc.)
✅ Verification flags for email, phone, license, etc.
✅ Automatic timestamp management
✅ Secure authentication with JWT
✅ Registration endpoints for all user types
