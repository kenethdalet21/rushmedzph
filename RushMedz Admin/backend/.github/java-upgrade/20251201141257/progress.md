# Upgrade Progress

  ### ✅ Generate Upgrade Plan [View Log](logs\1.generatePlan.log)

  ### ✅ Confirm Upgrade Plan [View Log](logs\2.confirmPlan.log)

  ### ✅ Setup Development Environment [View Log](logs\3.setupEnvironment.log)
  
  
  > There are uncommitted changes in the project before upgrading, which have been stashed according to user setting "appModernization.uncommittedChangesAction".

  ### ✅ PreCheck [View Log](logs\4.precheck.log)
  
  <details>
      <summary>[ click to toggle details ]</summary>
  
  - ###
    ### ✅ Precheck - Build project [View Log](logs\4.1.precheck-buildProject.log)
    
    <details>
        <summary>[ click to toggle details ]</summary>
    
    #### Command
    `mvn clean test-compile -q -B -fn`
    </details>
  
    ### ✅ Precheck - Validate CVEs [View Log](logs\4.2.precheck-validateCves.log)
    
    <details>
        <summary>[ click to toggle details ]</summary>
    
    #### CVE issues
    - Dependency `org.springframework:spring-web` has **1** known CVEs:
      - [CVE-2025-41234](https://github.com/advisories/GHSA-6r3c-xf4w-jxjm): Spring Framework vulnerable to a reflected file download (RFD)
        - **Severity**: **MEDIUM**
        - **Details**: ### Description
          
          In Spring Framework, versions 6.0.x as of 6.0.5, versions 6.1.x and 6.2.x, an application is vulnerable to a reflected file download (RFD) attack when it sets a “Content-Disposition” header with a non-ASCII charset, where the filename attribute is derived from user-supplied input.
          
          Specifically, an application is vulnerable when all the following are true:
          
            -  The header is prepared with `org.springframework.http.ContentDisposition`.
            -  The filename is set via `ContentDisposition.Builder#filename(String, Charset)`.
            -  The value for the filename is derived from user-supplied input.
            -  The application does not sanitize the user-supplied input.
            -  The downloaded content of the response is injected with malicious commands by the attacker (see RFD paper reference for details).
          
          
          An application is not vulnerable if any of the following is true:
          
            -  The application does not set a “Content-Disposition” response header.
            -  The header is not prepared with `org.springframework.http.ContentDisposition`.
            -  The filename is set via one of:  
               - `ContentDisposition.Builder#filename(String)`, or
               - `ContentDisposition.Builder#filename(String, ASCII)`
            -  The filename is not derived from user-supplied input.
            -  The filename is derived from user-supplied input but sanitized by the application.
            -  The attacker cannot inject malicious content in the downloaded content of the response.
          
          
          ### Affected Spring Products and VersionsSpring Framework
          
            -  6.2.0 - 6.2.7
            -  6.1.0 - 6.1.20
            -  6.0.5 - 6.0.28
            -  Older, unsupported versions are not affected
          
          
          ### Mitigation
          
          Users of affected versions should upgrade to the corresponding fixed version.
          
          | Affected version(s) | Fix version | Availability |
          | - | - | - |
          | 6.2.x | 6.2.8 | OSS |
          | 6.1.x | 6.1.21 | OSS |
          | 6.0.x | 6.0.29 | [Commercial](https://enterprise.spring.io/) |
          
          No further mitigation steps are necessary.
    </details>
  
    ### ✅ Precheck - Run tests [View Log](logs\4.3.precheck-runTests.log)
    
    <details>
        <summary>[ click to toggle details ]</summary>
    
    #### Test result
    | Total | Passed | Failed | Skipped | Errors |
    |-------|--------|--------|---------|--------|
    | 8 | 8 | 0 | 0 | 0 |
    </details>
  </details>

  ### ✅ Upgrade project to use `Spring Boot 3.4.x`
  
  <details>
      <summary>[ click to toggle details ]</summary>
  
  - ###
    ### ✅ Upgrade using Agent [View Log](logs\5.1.upgradeProjectUsingAgent.log)
    1 file changed, 1 insertion(+), 1 deletion(-)
    <details>
        <summary>[ click to toggle details ]</summary>
    
    #### Code changes
    - Upgrade Spring Boot parent to `3.4.0`
      - Update `<parent><version>` in `backend/pom.xml` from `3.3.5` to `3.4.0` to align with Milestone 1 of the upgrade plan.
    </details>
  
    ### ❗ Build Project [View Log](logs\5.2.buildProject.log)
    Build result: 0% Java files compiled
    <details>
        <summary>[ click to toggle details ]</summary>
    
    #### Command
    `mvn clean test-compile -q -B -fn`
    
    #### Errors
    - === Config File error     The below errors can be due to missing dependencies. You may have to refer     to the config files provided earlier to solve it.     'errorMessage': Failed to execute goal org.springframework.boot:spring-boot-maven-plugin:3.4.0:build-info (default) on project backend: Cannot create parent directory for 'd:\Epharmacy Application\Epharma\_Ecosystem\backend\target\classes\META-INF\build-info.properties' 
      ```
      Failed to execute goal org.springframework.boot:spring-boot-maven-plugin:3.4.0:build-info (default) on project backend: Cannot create parent directory for 'd:\Epharmacy Application\Epharma\_Ecosystem\backend\target\classes\META-INF\build-info.properties'
      ```
    </details>
  
    ### ✅ Fix Build Errors [View Log](logs\5.3.fixBuildErrors.log)
    1 file changed, 1 insertion(+), 0 deletions(-)
    <details>
        <summary>[ click to toggle details ]</summary>
    
    #### Code changes
    - Adjust plugin execution phase
      - Set `spring-boot-maven-plugin` build-info execution to run in `package` phase to avoid directory creation error during `test-compile`.
    - Rationale
      - Prevents Windows path parent directory creation error while preserving build-info generation at packaging.
    </details>
  
    ### ✅ Build Project [View Log](logs\5.4.buildProject.log)
    Build result: 100% Java files compiled
    <details>
        <summary>[ click to toggle details ]</summary>
    
    #### Command
    `mvn clean test-compile -q -B -fn`
    </details>
  </details>

  ### ✅ Upgrade project to use `Spring Boot 3.5.x`
  
  <details>
      <summary>[ click to toggle details ]</summary>
  
  - ###
    ### ✅ Upgrade using Agent [View Log](logs\6.1.upgradeProjectUsingAgent.log)
    1 file changed, 1 insertion(+), 1 deletion(-)
    <details>
        <summary>[ click to toggle details ]</summary>
    
    #### Code changes
    - Upgrade Spring Boot parent to `3.5.0`
      - Update `<parent><version>` in `backend/pom.xml` from `3.4.0` to `3.5.0` as per Milestone 2.
    - Prior change retained
      - Keep `spring-boot-maven-plugin` build-info execution bound to `package` phase.
    </details>
  
    ### ✅ Build Project [View Log](logs\6.2.buildProject.log)
    Build result: 100% Java files compiled
    <details>
        <summary>[ click to toggle details ]</summary>
    
    #### Command
    `mvn clean test-compile -q -B -fn`
    </details>
  </details>

  ### ✅ Validate & Fix
  
  <details>
      <summary>[ click to toggle details ]</summary>
  
  - ###
    ### ❗ Validate CVEs [View Log](logs\7.1.validateCves.log)
    
    <details>
        <summary>[ click to toggle details ]</summary>
    
    #### Checked Dependencies
      - org.springframework.boot:spring-boot-starter-web:3.5.0:jar
      - org.springframework.boot:spring-boot-starter-data-jpa:3.5.0:jar
      - com.h2database:h2:2.3.232:jar
      - org.springframework.boot:spring-boot-starter-validation:3.5.0:jar
      - org.springframework.boot:spring-boot-starter-actuator:3.5.0:jar
      - org.springframework.boot:spring-boot-starter-test:3.5.0:jar
      - org.springframework:spring-web:6.2.7:jar
      - org.springframework.boot:spring-boot-starter-security:3.5.0:jar
    
    #### CVE issues
    - Dependency `org.springframework:spring-web` has **1** known CVEs need to be fixed:
      - [CVE-2025-41234](https://github.com/advisories/GHSA-6r3c-xf4w-jxjm): Spring Framework vulnerable to a reflected file download (RFD)
        - **Severity**: **MEDIUM**
        - **Details**: ### Description
          
          In Spring Framework, versions 6.0.x as of 6.0.5, versions 6.1.x and 6.2.x, an application is vulnerable to a reflected file download (RFD) attack when it sets a “Content-Disposition” header with a non-ASCII charset, where the filename attribute is derived from user-supplied input.
          
          Specifically, an application is vulnerable when all the following are true:
          
            -  The header is prepared with `org.springframework.http.ContentDisposition`.
            -  The filename is set via `ContentDisposition.Builder#filename(String, Charset)`.
            -  The value for the filename is derived from user-supplied input.
            -  The application does not sanitize the user-supplied input.
            -  The downloaded content of the response is injected with malicious commands by the attacker (see RFD paper reference for details).
          
          
          An application is not vulnerable if any of the following is true:
          
            -  The application does not set a “Content-Disposition” response header.
            -  The header is not prepared with `org.springframework.http.ContentDisposition`.
            -  The filename is set via one of:  
               - `ContentDisposition.Builder#filename(String)`, or
               - `ContentDisposition.Builder#filename(String, ASCII)`
            -  The filename is not derived from user-supplied input.
            -  The filename is derived from user-supplied input but sanitized by the application.
            -  The attacker cannot inject malicious content in the downloaded content of the response.
          
          
          ### Affected Spring Products and VersionsSpring Framework
          
            -  6.2.0 - 6.2.7
            -  6.1.0 - 6.1.20
            -  6.0.5 - 6.0.28
            -  Older, unsupported versions are not affected
          
          
          ### Mitigation
          
          Users of affected versions should upgrade to the corresponding fixed version.
          
          | Affected version(s) | Fix version | Availability |
          | - | - | - |
          | 6.2.x | 6.2.8 | OSS |
          | 6.1.x | 6.1.21 | OSS |
          | 6.0.x | 6.0.29 | [Commercial](https://enterprise.spring.io/) |
          
          No further mitigation steps are necessary.
    </details>
  
    ### ✅ Fix CVE Issues [View Log](logs\7.2.fixCveIssues.log)
    1 file changed, 1 insertion(+), 1 deletion(-)
    <details>
        <summary>[ click to toggle details ]</summary>
    
    #### Code changes
    - Security: Address CVE-2025-41234
      - Set `org.springframework:spring-web` version to `6.2.8` explicitly in `backend/pom.xml` while staying on Spring Boot 3.5.0.
    - Validation
      - Build to ensure compatibility with the managed Spring Boot BOM.
    </details>
  
    ### ✅ Build Project [View Log](logs\7.3.buildProject.log)
    Build result: 100% Java files compiled
    <details>
        <summary>[ click to toggle details ]</summary>
    
    #### Command
    `mvn clean test-compile -q -B -fn`
    </details>
  
    ### ✅ Validate CVEs [View Log](logs\7.4.validateCves.log)
    
    <details>
        <summary>[ click to toggle details ]</summary>
    
    #### Checked Dependencies
      - org.springframework.boot:spring-boot-starter-web:3.5.0:jar
      - org.springframework.boot:spring-boot-starter-data-jpa:3.5.0:jar
      - com.h2database:h2:2.3.232:jar
      - org.springframework.boot:spring-boot-starter-validation:3.5.0:jar
      - org.springframework.boot:spring-boot-starter-actuator:3.5.0:jar
      - org.springframework.boot:spring-boot-starter-test:3.5.0:jar
      - org.springframework:spring-web:6.2.8:jar
      - org.springframework.boot:spring-boot-starter-security:3.5.0:jar
    </details>
  
    ### ✅ Validate Code Behavior Changes [View Log](logs\7.5.validateBehaviorChanges.log)
  
    ### ✅ Run Tests [View Log](logs\7.6.runTests.log)
    
    <details>
        <summary>[ click to toggle details ]</summary>
    
    #### Test result
    | Total | Passed | Failed | Skipped | Errors |
    |-------|--------|--------|---------|--------|
    | 8 | 8 | 0 | 0 | 0 |
    </details>
  </details>

  ### ✅ Summarize Upgrade [View Log](logs\8.summarizeUpgrade.log)