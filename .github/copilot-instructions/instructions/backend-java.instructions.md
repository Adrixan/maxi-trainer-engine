---
applyTo: 
  - "**/*.java"
---
<java_standards>

## Java (Spring Boot / Jakarta EE)

- **Java 21 LTS** with **Spring Boot 3.3+**
- **Virtual threads** (`@Async` with virtual thread executor, or
  `Executors.newVirtualThreadPerTaskExecutor()`) for I/O-bound workloads
- **Pattern matching** for `instanceof`, `switch` expressions, and record patterns
- **Sequenced collections** (`SequencedCollection`, `SequencedMap`) for ordered access
- **Records** for DTOs, value objects, and sealed type hierarchies
- **Constructor injection** (immutability, testability) — no field injection
- **Testing:** JUnit 5 + Mockito + AssertJ
- **Build:** Maven or Gradle with version catalogs
- **SAST:** SpotBugs, PMD, or Semgrep in CI
- **GraalVM native image** for serverless/CLI tools where startup time matters

See [examples/backend/java/](../examples/backend/java/) for UserService and UserServiceTest patterns.
</java_standards>
