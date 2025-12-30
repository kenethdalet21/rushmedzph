# Upgrade Progress

  ### ✅ Generate Upgrade Plan [View Log](logs\1.generatePlan.log)

  ### ✅ Confirm Upgrade Plan [View Log](logs\2.confirmPlan.log)

  ### ✅ Setup Development Environment [View Log](logs\3.setupEnvironment.log)

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

  ### ✅ Upgrade project to use `Java 21`
  
  <details>
      <summary>[ click to toggle details ]</summary>
  
  - ###
    ### ✅ Upgrade using OpenRewrite [View Log](logs\5.1.upgradeProjectUsingOpenRewrite.log)
    3 files changed, 4 insertions(+), 10 deletions(-)
    <details>
        <summary>[ click to toggle details ]</summary>
    
    #### Recipes
    - [org.openrewrite.java.migrate.UpgradeToJava21](https://docs.openrewrite.org/recipes/java/migrate/UpgradeToJava21)
    </details>
  
    ### ✅ Upgrade using Agent [View Log](logs\5.2.upgradeProjectUsingAgent.log)
    
    <details>
        <summary>[ click to toggle details ]</summary>
    
    #### Code changes
    - Apply org.openrewrite.java.migrate.UpgradeToJava21 recipe
      - Update Java language level to 21
      - Migrate deprecated APIs to Java 21 equivalents
      - Update language feature usage for Java 21 compatibility
    </details>
  
    ### ✅ Build Project [View Log](logs\5.3.buildProject.log)
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
    ### ✅ Validate CVEs [View Log](logs\6.1.validateCves.log)
    
    <details>
        <summary>[ click to toggle details ]</summary>
    
    #### Checked Dependencies
      - java:*:21
    </details>
  
    ### ✅ Validate Code Behavior Changes [View Log](logs\6.2.validateBehaviorChanges.log)
  
    ### ✅ Run Tests [View Log](logs\6.3.runTests.log)
    
    <details>
        <summary>[ click to toggle details ]</summary>
    
    #### Test result
    | Total | Passed | Failed | Skipped | Errors |
    |-------|--------|--------|---------|--------|
    | 8 | 8 | 0 | 0 | 0 |
    </details>
  </details>

  ### ✅ Summarize Upgrade [View Log](logs\7.summarizeUpgrade.log)