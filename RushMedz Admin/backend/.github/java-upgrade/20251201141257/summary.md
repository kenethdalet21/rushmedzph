
# Upgrade Java Project

## 🖥️ Project Information
- **Project path**: d:/Epharmacy Application/Epharma_Ecosystem/backend
- **Java version**: 21
- **Build tool type**: Maven
- **Build tool path**: C:\Maven\apache-maven-3.9.11\bin

## 🎯 Goals

- Upgrade Spring Boot to 3.5.x

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
| org.springframework.boot:spring-boot-starter-web | 3.3.5 | 3.5.0 | backend |
| org.springframework.boot:spring-boot-starter-data-jpa | 3.3.5 | 3.5.0 | backend |
| com.h2database:h2 | 2.2.224 | 2.3.232 | backend |
| org.springframework.boot:spring-boot-starter-validation | 3.3.5 | 3.5.0 | backend |
| org.springframework.boot:spring-boot-starter-actuator | 3.3.5 | 3.5.0 | backend |
| org.springframework.boot:spring-boot-starter-test | 3.3.5 | 3.5.0 | backend |
| org.springframework:spring-web | 6.1.14 | 6.2.8 | backend |
| org.springframework.boot:spring-boot-starter-security | 3.3.5 | 3.5.0 | backend |

### Code commits

> There are uncommitted changes in the project before upgrading, which have been stashed according to user setting "appModernization.uncommittedChangesAction".

All code changes have been committed to branch `appmod/java-upgrade-20251201141257`, here are the details:
1 file changed, 3 insertions(+), 2 deletions(-)

- 75662ea -- Upgrade Spring Boot parent to 3.4.0

- c2c6953 -- Reschedule spring-boot-maven-plugin build-info to package phase

- 85cecdd -- Upgrade Spring Boot parent to 3.5.0

- 33de0ab -- Pin spring-web to 6.2.8 to fix CVE
### Potential Issues
