# Contact Verification System

## Overview
The E-Pharmacy application now enforces a **contact verification requirement** for all users before they can log in. Users must verify either their email address or phone number during signup, and only verified contacts can be used for login.

## Verification Requirements

### For Users (UserApp)
- **Email Verification** OR **Phone Verification** required
- At least one contact method must be verified before login
- Verification is done via OTP sent to email or SMS
- Verified status is stored in user profile

### For Drivers (DriverApp)
- **Email Verification** OR **Phone Verification** required
- Same verification flow as users
- Phone number commonly used for delivery coordination

### For Merchants (Admin/Merchant Portal)
- **Email Verification** OR **Phone Verification** required
- Same verification flow as users and drivers

## Signup Flow with Verification

### Step 1: Signup Form
User enters:
- Email address
- Password
- Name
- Phone number

### Step 2: Account Creation
Backend creates account with:
- `emailVerified: false`
- `phoneVerified: false`

### Step 3: OTP Verification Modal
After signup, user sees verification modal with options:
- Option 1: Verify email (OTP sent via email)
- Option 2: Verify phone (OTP sent via SMS)

### Step 4: OTP Entry
User enters 6-digit OTP code they received

### Step 5: Verification Confirmation
Upon successful OTP verification:
- `emailVerified: true` (if verified via email) OR
- `phoneVerified: true` (if verified via phone)
- Account is now ready for login

## Login Flow with Verification

### Step 1: Login Credentials
User enters:
- Email OR Phone number
- Password

### Step 2: System Detects Contact Type
- If contains `@` → Email login
- If matches Philippine phone format → Phone login

### Step 3: Verification Check
Backend checks:
```
if (login is via email) {
  if (emailVerified == false) {
    throw error: "Email not verified"
  }
} else if (login is via phone) {
  if (phoneVerified == false) {
    throw error: "Phone not verified"
  }
}
```

### Step 4: Login Allowed or Denied
- ✅ **If verified**: Login successful → Dashboard
- ❌ **If NOT verified**: Error message → User must verify contact

## Error Messages

### Unverified Email
```
Your email address has not been verified.
Please verify your email before logging in.
```

### Unverified Phone
```
Your phone number has not been verified.
Please verify your phone number before logging in.
```

### How to Resolve
1. User must complete signup process
2. User must receive and enter OTP
3. Mark contact as verified
4. Then can login

## Verification Methods

### Email Verification (OTP)
1. User selects "Verify Email"
2. OTP sent to email address
3. User receives email with 6-digit code
4. User enters code in modal
5. System verifies code matches
6. Email marked as verified

**Requirements:**
- Email gateway configured (Gmail, AWS SES, SendGrid)
- User has access to email inbox
- 10-minute OTP expiration

### SMS Verification (OTP)
1. User selects "Verify Phone"
2. OTP sent via SMS to phone number
3. User receives text message with 6-digit code
4. User enters code in modal
5. System verifies code matches
6. Phone number marked as verified

**Requirements:**
- SMS gateway configured (Semaphore, Infobip, Twilio, Nexmo)
- Phone number in E.164 format (+639XXXXXXXXX)
- 10-minute OTP expiration

## Database Schema

### User Record
```typescript
interface AppUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  address: string;
  createdAt: string;
  emailVerified: boolean;    // ← New field
  phoneVerified: boolean;    // ← New field
}
```

### DriverUser Record
```typescript
interface DriverUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  vehicleType: 'motorcycle' | 'car' | 'van';
  licenseNumber: string;
  createdAt: string;
  emailVerified: boolean;    // ← New field
  phoneVerified: boolean;    // ← New field
}
```

### MerchantUser Record
```typescript
interface MerchantUser {
  id: string;
  email: string;
  businessName: string;
  ownerName: string;
  phone: string;
  licenseNumber: string;
  businessType: 'pharmacy' | 'clinic' | 'hospital';
  createdAt: string;
  emailVerified: boolean;    // ← New field
  phoneVerified: boolean;    // ← New field
}
```

## Authentication Context Changes

### UserAuthContext
```typescript
const signIn = async (emailOrPhone: string, password: string) => {
  // 1. Validate email or phone format
  // 2. Fetch user from database by email or phone
  // 3. Verify password matches
  // 4. Check verification status:
  if (isEmail && !user.emailVerified) {
    throw error: "Email not verified"
  }
  if (isPhone && !user.phoneVerified) {
    throw error: "Phone not verified"
  }
  // 5. If verified: Issue authentication token
  // 6. User logged in successfully
}
```

### DriverAuthContext
Same flow as UserAuthContext

### MerchantAuthContext
Same flow as UserAuthContext

## OTP Service Integration

### API Endpoints
```
POST /api/otp/send
- Sends OTP to email or phone

POST /api/otp/verify
- Verifies OTP code and marks contact as verified

POST /api/otp/resend
- Resends OTP if first one expired

POST /api/otp/check-verification
- Checks if contact is verified
```

### Frontend OTP Service
```typescript
// Send OTP
await OTPService.sendOTP(contactValue, contactType)

// Verify OTP
await OTPService.verifyOTP(contactValue, contactType, otpCode)

// Resend OTP
await OTPService.resendOTP(contactValue, contactType)

// Check if verified
const verified = await OTPService.checkVerification(contactValue, contactType)
```

## User Journey

### First-Time User
```
1. User installs app
2. User taps "Sign Up"
3. User enters email, password, name, phone
4. User taps "Create Account"
5. OTP modal appears
6. User selects email or phone verification
7. User receives OTP code
8. User enters 6-digit code
9. Verification successful ✓
10. User redirected to login screen
11. User can now login with verified email/phone
```

### Returning User
```
1. User opens app
2. User enters email or phone
3. User enters password
4. System checks if contact is verified
5. If verified: Login successful → Dashboard
6. If NOT verified: Error message → Cannot login
```

## Security Considerations

### Verification Status
- Verified contacts are flagged in database
- Cannot bypass verification check in code
- Backend must validate verification on every login

### Unverified Account Access
- Unverified accounts CANNOT access any features
- Unverified accounts cannot be recovered without verification
- Prevents spam/bot accounts from accessing system

### OTP Security
- 6-digit random code
- 10-minute expiration time
- 5-attempt limit before lockout
- Cannot reuse same OTP code
- One OTP per contact per session

### Multiple Contacts
- Users can have multiple emails or phones
- Only verified contacts can be used for login
- Can add/change email or phone later
- Old contacts remain verified until user changes them

## Backend Implementation Checklist

- [ ] Add `emailVerified` and `phoneVerified` columns to user table
- [ ] Create OTP verification endpoint
- [ ] Update login endpoint to check verification status
- [ ] Create resend OTP endpoint
- [ ] Create verification status check endpoint
- [ ] Implement OTP storage and validation
- [ ] Add SMS gateway configuration
- [ ] Add email gateway configuration
- [ ] Configure OTP expiration (10 minutes)
- [ ] Configure OTP attempt limit (5 attempts)
- [ ] Test verification flow end-to-end
- [ ] Test unverified account login (should fail)
- [ ] Test verified account login (should succeed)

## Testing Scenarios

### Test Case 1: New User Signs Up and Verifies Email
1. Sign up with email and password
2. OTP modal appears
3. Select "Verify Email"
4. Check email for OTP code
5. Enter OTP code
6. Verification successful
7. Login with email → Should succeed ✓

### Test Case 2: New User Signs Up and Verifies Phone
1. Sign up with phone and password
2. OTP modal appears
3. Select "Verify Phone"
4. Check SMS for OTP code
5. Enter OTP code
6. Verification successful
7. Login with phone → Should succeed ✓

### Test Case 3: Unverified User Tries to Login
1. Create user account (don't complete verification)
2. Try to login with email
3. Error: "Email not verified"
4. Cannot access dashboard
5. Must complete verification first ✓

### Test Case 4: User Verifies Email but Tries to Login with Phone
1. Sign up and verify email only
2. Try to login with phone
3. Error: "Phone not verified"
4. Can only login with verified email
5. Must verify phone separately ✓

### Test Case 5: Resend OTP
1. Sign up, select verify email
2. Don't receive OTP (or it expires)
3. Tap "Resend OTP"
4. New OTP sent
5. Enter new OTP code
6. Verification successful ✓

## Troubleshooting

### "Email not verified" Error on Login
**Problem**: User receives this error even though they signed up
**Solution**:
1. User needs to complete OTP verification from signup
2. If they closed the modal, direct them to verify from settings
3. May need password reset + verify flow

### "Phone not verified" Error
**Problem**: User tries to login with phone but gets verification error
**Solution**:
1. User must verify phone during signup or settings
2. If they only verified email, must add and verify phone
3. Each contact type must be verified separately

### OTP Not Received
**Problem**: User doesn't receive OTP code
**Solution**:
1. Check SMS/Email gateway is configured
2. Verify API keys are valid
3. Check phone number format is correct (E.164)
4. Check user's spam folder
5. Tap "Resend" to get new OTP

## Future Enhancements

- [ ] Multiple phone numbers per account
- [ ] Phone number change with re-verification
- [ ] Email address change with re-verification
- [ ] Biometric verification (fingerprint/face)
- [ ] Backup codes for account recovery
- [ ] Two-factor authentication (2FA) optional
- [ ] Verification reminder notifications
- [ ] Verification history/audit log
- [ ] Grace period for unverified accounts (48 hours)
