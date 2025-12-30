
# Upgrade Java Project

## 🖥️ Project Information
- **Project path**: d:/Epharmacy Application/Epharma_Ecosystem/backend
- **Java version**: 21
- **Build tool type**: Maven
- **Build tool path**: C:\Maven\apache-maven-3.9.11\bin

## 🎯 Goals

- Upgrade Java to 21

## 🔀 Changes

### Test Changes
|     | Total | Passed | Failed | Skipped | Errors |
|-----|-------|--------|--------|---------|--------|
| Before | 8 | 8 | 0 | 0 | 0 |
| After | 8 | 8 | 0 | 0 | 0 |
### Dependency Changes


#### Upgraded Dependencies
| Dependency | Original Version | Current Version | Module |
|------------|------------------|-----------------|--------|
| Java | 17 | 21 | Root Module |

### Code commits

> There are uncommitted changes in the project before upgrading, which have been stashed according to user setting "appModernization.uncommittedChangesAction".

All code changes have been committed to branch `appmod/java-upgrade-20251212064752`, here are the details:
4 files changed, 7 insertions(+), 11 deletions(-)

- f9779f5 -- Upgrade project to use `Java 21` using openrewrite.
### Potential Issues

#### Behavior Changes
- [OTPService.java](../../../backend/src/main/java/com/epharma/ecosystem/service/OTPService.java)
  - [Severity: **MINOR**] [Confidence: **HIGH**] The random number generator has changed from `Math.random()` (which uses a global Random instance) to `ThreadLocalRandom.current().nextDouble()` (which uses a thread-local random generator). Both approaches generate a 6-digit OTP in the same numeric range. The functional behavior (OTP value range and randomness) remains equivalent for the purpose of OTP generation.
- [SMSGatewayService.java](../../../backend/src/main/java/com/epharma/ecosystem/service/SMSGatewayService.java)
  - [Severity: **MINOR**] [Confidence: **LOW**] The change introduces an intermediate `URI` object before converting to `URL`. For valid URLs, this is functionally equivalent. However, if `apiUrl` contains characters not allowed in a URI, this could throw an exception where previously it would not. The impact is likely minor and only affects malformed URLs.
  - [Severity: **MINOR**] [Confidence: **LOW**] The change introduces an intermediate `URI` object before converting to `URL`. For valid URLs, this is functionally equivalent. However, if `apiUrl` contains characters not allowed in a URI, this could throw an exception where previously it would not. The impact is likely minor and only affects malformed URLs.
