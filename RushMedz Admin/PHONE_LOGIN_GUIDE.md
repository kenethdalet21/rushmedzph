# Phone Number Login Feature Guide

## Overview
Both UserApp and DriverApp now support logging in using either:
- **Email address** (e.g., `user@example.com`)
- **Philippine mobile phone number** (e.g., `09123456789` or `+639123456789`)

## Supported Phone Number Formats

### Philippine Phone Numbers
The system automatically recognizes and validates Philippine phone numbers:
- **Local format**: `09XXXXXXXXX` (11 digits, starts with 09)
- **International format**: `+639XXXXXXXXX` (12 digits with +63)

### Automatic Format Detection
- Input `0912` → Recognized as Philippine mobile
- Input `+63912` → Recognized as Philippine mobile
- Input `9123` → Requires full 10-digit number after 0 or +63
- Input `test@email.com` → Recognized as email address

### Format Conversion
The app automatically converts between formats:
- `09123456789` → Stored as `+639123456789` for API calls
- `+639123456789` → Accepted as-is
- `639123456789` → Converted to `+639123456789`

## User Login (UserApp)

### Login Process
1. Open UserApp and tap "Sign In"
2. Enter either:
   - Email: `user@example.com`
   - Phone: `09123456789` or `+639123456789`
3. Enter your password
4. Tap "Sign In"

### Phone Number Detection
When a valid Philippine phone number is entered:
- A helper text appears: "📱 Philippine mobile number detected"
- The number is automatically formatted
- The system validates it before login

### Optional OTP Verification
After successful password login, users can enable OTP:
1. Check "Verify with OTP" checkbox
2. OTP will be sent to the entered phone number or email
3. Enter the 6-digit OTP code
4. Tap "Verify" to complete login

### Error Messages
- **Invalid credentials**: Phone number format not recognized or password incorrect
- **Missing fields**: Email/Phone and password are required
- **Invalid format**: 
  - Phone: Must be `09XXXXXXXXX` (11 digits) or `+639XXXXXXXXX` (12 digits with +63)
  - Email: Must contain @ and valid domain

## Driver Login (DriverApp)

### Login Process
1. Open DriverApp and tap "Sign In"
2. Enter either:
   - Email: `driver@example.com`
   - Phone: `09987654321` or `+639987654321`
3. Enter your password
4. Tap "Sign In"

### Phone Number Features (Same as UserApp)
- Automatic format detection
- Philippine number validation
- Real-time helper text display
- Optional OTP verification

### Driver-Specific Considerations
- License number is separate from phone login
- Vehicle information is stored after successful login
- Phone number can be updated in driver profile

## Implementation Details

### Frontend Validation
The apps use regex and format checking:
```typescript
// Email validation
/^[A-Za-z0-9+_.-]+@(.+)$/

// Phone validation (Philippine)
const cleaned = text.replace(/\D/g, '');
(cleaned.startsWith('63') && cleaned.length === 12) ||
(cleaned.startsWith('09') && cleaned.length === 11)
```

### Phone Number Conversion
```typescript
// Convert 09XXXXXXXXX to +639XXXXXXXXX
if (cleaned.startsWith('09')) {
  phoneNumber = '+63' + cleaned.substring(1);
}
```

### Auth Context Changes
Both `UserAuthContext` and `DriverAuthContext` now:
- Accept `emailOrPhone` parameter instead of just `email`
- Validate both email and phone formats
- Store appropriate user data based on login type
- Support OTP verification for both login methods

## API Integration (Backend)

### Current Status
- Backend OTP service: ✅ Complete
- SMS Gateway Service: ✅ Complete (Semaphore, Infobip, Twilio, Nexmo)
- Email Gateway Service: ✅ Complete (Gmail, AWS SES, SendGrid)
- Phone-based authentication: 🔄 Ready for integration

### Next Steps for Production
1. Update backend `/api/auth/login` endpoint to accept `phoneNumber` or `email`
2. Create `/api/auth/login-phone` endpoint for phone-based authentication
3. Query user database by phone number during login
4. Validate phone number format on backend
5. Send OTP to registered phone number after password verification

### Backend Login Flow (Proposed)
```
1. User enters phone/email + password
2. Frontend detects format (email vs phone)
3. Frontend calls appropriate login endpoint:
   - /api/auth/login (for email)
   - /api/auth/login-phone (for phone)
4. Backend validates credentials
5. Backend checks if OTP is enabled
6. Backend sends OTP via SMS or email
7. User verifies OTP
8. Backend returns authentication token
```

## Testing Scenarios

### Test Case 1: Email Login
- Input: `user@test.com`
- Password: `password123`
- Expected: Login successful

### Test Case 2: Phone Login (Local Format)
- Input: `09123456789`
- Password: `password123`
- Expected: Converted to `+639123456789`, login successful

### Test Case 3: Phone Login (International Format)
- Input: `+639123456789`
- Password: `password123`
- Expected: Login successful with phone recognized

### Test Case 4: Invalid Phone Format
- Input: `0912345678` (10 digits, invalid)
- Expected: Error message "Please enter a valid email address or Philippine phone number"

### Test Case 5: Invalid Email Format
- Input: `invalidemail`
- Expected: Error message "Please enter a valid email address or Philippine phone number"

### Test Case 6: OTP with Phone Login
- Login with phone: `09123456789`
- Enable OTP: Checked
- Expected: OTP sent to phone, verification modal appears

## Security Considerations

1. **Phone Number Validation**: Server-side validation required
2. **OTP Delivery**: Use verified SMS gateway (Semaphore recommended)
3. **Rate Limiting**: Implement rate limiting on login attempts
4. **Error Messages**: Don't reveal whether phone/email is registered
5. **Format Normalization**: Normalize all phone numbers to E.164 format
6. **Database Indexing**: Add index on phone field for quick lookup

## User Experience Improvements

### Current Features
✅ Real-time phone number format detection
✅ Auto-formatting as user types
✅ Helper text showing phone detected
✅ Support for both email and phone
✅ Optional OTP verification

### Future Enhancements
- [ ] Password reset via phone number
- [ ] Phone number change/update functionality
- [ ] Multiple phone numbers per account
- [ ] SMS delivery status tracking
- [ ] Phone number verification during signup
- [ ] Backup phone numbers for account recovery
- [ ] WhatsApp OTP delivery option

## Troubleshooting

### "Invalid format" Error
**Problem**: User enters phone number but gets error
**Solution**: 
- Ensure 11 digits for local format (09XXXXXXXXX)
- Ensure 12 digits with +63 for international (
+639XXXXXXXXX)
- No spaces or dashes are auto-removed

### OTP Not Received
**Problem**: OTP doesn't arrive after login
**Solution**:
- Check SMS gateway configuration (Semaphore API key)
- Verify phone number format is correct
- Check SMS provider dashboard for delivery status
- Ensure email.enabled/sms.gateway.enabled is true in backend config

### Phone Number Not Detected
**Problem**: Helper text doesn't appear for phone number
**Solution**:
- Enter complete number (11 or 12 digits)
- Remove any spaces or special characters (except + at start)
- Try both formats: 09123456789 and +639123456789

## Support

For issues with:
- **Phone validation**: Check phone format matches one of: 09XXXXXXXXX or +639XXXXXXXXX
- **Login errors**: Verify both password and login identifier are correct
- **OTP delivery**: Confirm SMS gateway is properly configured in backend
- **Backend integration**: Refer to SMS_EMAIL_INTEGRATION_GUIDE.md
