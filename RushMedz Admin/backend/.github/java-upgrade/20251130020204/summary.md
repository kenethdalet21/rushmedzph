
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
| Before | 8 | 0 | 0 | 0 | 8 |
| After | 8 | 8 | 0 | 0 | 0 |
### Dependency Changes


#### Upgraded Dependencies
| Dependency | Original Version | Current Version | Module |
|------------|------------------|-----------------|--------|
| Java | 17 | 21 | Root Module |

### Code commits

All code changes have been committed to branch `appmod/java-upgrade-20251130020204`, here are the details:
5 files changed, 7 insertions(+), 13 deletions(-)

- 02c88ee -- Upgrade project to use `Java 21` using openrewrite.
### Potential Issues

#### CVEs
- org.springframework:spring-web:
  - [**MEDIUM**][CVE-2025-41234](https://github.com/advisories/GHSA-6r3c-xf4w-jxjm): Spring Framework vulnerable to a reflected file download (RFD)
