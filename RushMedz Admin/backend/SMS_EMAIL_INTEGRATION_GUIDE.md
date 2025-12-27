# E-Pharmacy SMS & Email Gateway Integration Guide

## Overview
The E-Pharmacy application now supports multiple SMS and email providers for sending OTP verification codes. This guide explains how to configure and use these services.

## Supported SMS Providers

### 1. Semaphore (Recommended for Philippines)
**URL:** https://semaphore.co/

**Supports:**
- Globe Telecom
- Smart Communications
- Touch Mobile (TM)
- Talk n' Text
- DITO Telecommunity

**Setup Steps:**
1. Go to https://semaphore.co/
2. Sign up for a free account
3. Navigate to Dashboard → API Keys
4. Copy your API Key
5. Update `application.properties`:
   ```properties
   sms.gateway.enabled=true
   sms.gateway.provider=semaphore
   sms.gateway.api-key=YOUR_SEMAPHORE_API_KEY
   sms.gateway.sender-id=EPHARMA
   ```

**Features:**
- Philippines-focused SMS gateway
- Affordable rates
- Good uptime reliability
- Supports all major Philippine mobile carriers
- Free credits for testing

---

### 2. Infobip
**URL:** https://www.infobip.com/

**Supports:** Global + Philippines

**Setup Steps:**
1. Register at https://www.infobip.com/
2. Get your API Key from the dashboard
3. Update `application.properties`:
   ```properties
   sms.gateway.enabled=true
   sms.gateway.provider=infobip
   sms.gateway.api-key=YOUR_INFOBIP_API_KEY
   sms.gateway.sender-id=EPHARMA
   ```

**Features:**
- Global SMS coverage
- Advanced analytics
- High delivery rates
- REST API support
- Developer-friendly

---

### 3. Twilio
**URL:** https://www.twilio.com/

**Supports:** Global + Philippines

**Setup Steps:**
1. Register at https://www.twilio.com/
2. Get your Account SID and Auth Token
3. Update `application.properties`:
   ```properties
   sms.gateway.enabled=true
   sms.gateway.provider=twilio
   sms.gateway.api-key=YOUR_TWILIO_ACCOUNT_SID:AUTH_TOKEN
   sms.gateway.sender-id=YOUR_TWILIO_PHONE_NUMBER
   ```

**Features:**
- Reliable global SMS service
- Excellent documentation
- Affordable pricing
- Whatsapp integration available
- Good developer support

---

### 4. Nexmo / Vonage
**URL:** https://www.vonage.com/

**Supports:** Global + Philippines

**Setup Steps:**
1. Register at https://www.vonage.com/
2. Get your API Key and API Secret
3. Update `application.properties`:
   ```properties
   sms.gateway.enabled=true
   sms.gateway.provider=nexmo
   sms.gateway.api-key=YOUR_NEXMO_API_KEY
   sms.gateway.sender-id=EPHARMA
   ```

**Features:**
- Enterprise-grade SMS service
- Global reach
- High reliability
- Advanced routing
- Multiple API versions

---

## Supported Email Providers

### 1. Gmail SMTP
**Best for:** Development and small deployments

**Setup Steps:**
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Update `application.properties`:
   ```properties
   email.enabled=true
   email.provider=smtp
   email.from=your-email@gmail.com
   email.from-name=E-Pharmacy
   
   spring.mail.host=smtp.gmail.com
   spring.mail.port=587
   spring.mail.username=your-email@gmail.com
   spring.mail.password=your-app-password
   spring.mail.properties.mail.smtp.auth=true
   spring.mail.properties.mail.smtp.starttls.enable=true
   spring.mail.properties.mail.smtp.starttls.required=true
   ```

---

### 2. AWS SES (Simple Email Service)
**Best for:** Production deployments

**Setup Steps:**
1. Create AWS account and navigate to SES console
2. Verify your email domain
3. Get SMTP credentials from SES console
4. Update `application.properties`:
   ```properties
   email.enabled=true
   email.provider=smtp
   email.from=noreply@yourdomain.com
   email.from-name=E-Pharmacy
   
   spring.mail.host=email-smtp.YOUR_REGION.amazonaws.com
   spring.mail.port=587
   spring.mail.username=YOUR_SMTP_USERNAME
   spring.mail.password=YOUR_SMTP_PASSWORD
   spring.mail.properties.mail.smtp.auth=true
   spring.mail.properties.mail.smtp.starttls.enable=true
   ```

**Features:**
- Integrated with AWS infrastructure
- Scalable for production
- Reputation management tools
- Email authentication (SPF, DKIM)

---

### 3. SendGrid
**URL:** https://sendgrid.com/

**Best for:** Transactional emails at scale

**Setup Steps:**
1. Create account at https://sendgrid.com/
2. Generate API Key from Settings → API Keys
3. Update `application.properties`:
   ```properties
   email.enabled=true
   email.provider=sendgrid
   email.from=noreply@yourdomain.com
   email.from-name=E-Pharmacy
   
   sendgrid.api-key=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

**Features:**
- Industry-leading email delivery
- Advanced analytics and tracking
- Template builder
- Excellent documentation
- Real-time webhook notifications

---

## Configuration Priority

The application checks configurations in this order:

1. **Development Mode (Default):**
   - `sms.gateway.enabled=false`
   - `email.enabled=false`
   - All messages logged to console only

2. **Production Mode:**
   - Set `sms.gateway.enabled=true` for SMS
   - Set `email.enabled=true` for email
   - Provide all required credentials

## Environment Variables (Recommended for Production)

Instead of hardcoding credentials in `application.properties`, use environment variables:

```bash
# SMS Configuration
export SMS_GATEWAY_ENABLED=true
export SMS_GATEWAY_PROVIDER=semaphore
export SMS_GATEWAY_API_KEY=your-api-key
export SMS_GATEWAY_SENDER_ID=EPHARMA

# Email Configuration
export EMAIL_ENABLED=true
export EMAIL_PROVIDER=smtp
export MAIL_HOST=smtp.gmail.com
export MAIL_PORT=587
export MAIL_USERNAME=your-email@gmail.com
export MAIL_PASSWORD=your-app-password
```

Then reference in `application.properties`:
```properties
sms.gateway.enabled=${SMS_GATEWAY_ENABLED:false}
sms.gateway.provider=${SMS_GATEWAY_PROVIDER:semaphore}
sms.gateway.api-key=${SMS_GATEWAY_API_KEY:}
sms.gateway.sender-id=${SMS_GATEWAY_SENDER_ID:EPHARMA}

email.enabled=${EMAIL_ENABLED:false}
email.provider=${EMAIL_PROVIDER:smtp}
spring.mail.host=${MAIL_HOST:}
spring.mail.port=${MAIL_PORT:587}
spring.mail.username=${MAIL_USERNAME:}
spring.mail.password=${MAIL_PASSWORD:}
```

## Phone Number Format

The application expects phone numbers in **E.164 format**:
- International: `+639123456789` (Philippines example)
- Conversion: `09123456789` → `+639123456789`

The SMSGatewayService automatically converts E.164 format to local format when needed (e.g., `+639123456789` → `09123456789`).

## Email Customization

The OTP email includes:
- Professional HTML template
- 10-minute validity information
- Security warnings
- Company branding
- Mobile-responsive design

Customize the email template in `EmailGatewayService.buildOTPEmailBody()` method.

## Testing

### Console Testing (Development Mode)
1. Keep `sms.gateway.enabled=false` and `email.enabled=false`
2. All notifications will be logged to console
3. Check console output for OTP codes

### SMS Testing
```bash
# Test Semaphore API
curl -X POST "https://api.semaphore.co/api/sms/send" \
  -d "apikey=YOUR_API_KEY" \
  -d "number=09123456789" \
  -d "message=Test OTP: 123456" \
  -d "sendername=EPHARMA"
```

### Email Testing
1. Configure Gmail credentials
2. Set `email.enabled=true`
3. Trigger OTP signup/login
4. Check recipient mailbox (may be in spam)

## Troubleshooting

### SMS Not Sending
1. Check `sms.gateway.enabled=true`
2. Verify API key is correct
3. Check phone number format (should be E.164)
4. Review SMS gateway provider's dashboard for error logs
5. Check internet connectivity

### Email Not Sending
1. Check `email.enabled=true`
2. Verify SMTP credentials
3. Check firewall/network access to mail server
4. Review application logs for exceptions
5. Check email provider's dashboard

### Delivery Issues
1. **Semaphore:** Check SMS gateway at https://semaphore.co/dashboard
2. **Gmail:** Check if 2FA is enabled and app password is correct
3. **AWS SES:** Verify email domain is verified in SES console
4. **Twilio:** Check account balance and phone number validity
5. **SendGrid:** Review email logs in SendGrid dashboard

## Security Best Practices

1. **Never commit credentials** to version control
2. **Use environment variables** for sensitive data
3. **Enable 2FA** on provider accounts
4. **Rotate API keys** periodically
5. **Monitor delivery logs** for suspicious activity
6. **Use HTTPS** for all API calls
7. **Validate phone numbers** before sending
8. **Rate limit** OTP requests per user

## Production Checklist

- [ ] SMS gateway configured and tested
- [ ] Email provider configured and tested
- [ ] Environment variables set securely
- [ ] API keys rotated and current
- [ ] Sender ID/From address verified
- [ ] Email domain verified (if applicable)
- [ ] Rate limiting enabled
- [ ] Monitoring and alerts configured
- [ ] Backup provider configured
- [ ] Tested failover scenarios

## Cost Estimation

| Provider | SMS Cost | Email Cost | Notes |
|----------|----------|-----------|-------|
| Semaphore | $0.50-1.50/msg | - | Philippines focus, affordable |
| Infobip | Variable | Variable | Global coverage |
| Twilio | $0.0075/msg | - | Global, reliable |
| Nexmo | $0.07-0.50/msg | - | Enterprise pricing |
| Gmail | Free | Free | Limits: 500/day, non-commercial |
| AWS SES | $0.10/1000 emails | - | Production-grade |
| SendGrid | Free (100/day) | Paid plans | Best for scale |

## Support

For issues with specific providers, refer to their documentation:
- Semaphore: https://docs.semaphore.co/
- Infobip: https://www.infobip.com/docs
- Twilio: https://www.twilio.com/docs
- Vonage: https://developer.vonage.com/
- Gmail: https://support.google.com/mail/
- AWS SES: https://docs.aws.amazon.com/ses/
- SendGrid: https://sendgrid.com/docs/
