package com.example.demo.user;

import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for UserService using Testcontainers.
 *
 * Demonstrates:
 * - Testcontainers for PostgreSQL
 * - Spring Boot test integration
 * - Real database testing
 * - Transaction rollback between tests
 * - MockMvc for API testing
 * - Dynamic property configuration
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@Transactional
@DisplayName("UserService Integration Tests")
class UserServiceIntegrationTest {

    /**
     * PostgreSQL container - started once for all tests.
     * 
     * Benefits of Testcontainers:
     * - Real database engine
     * - Automatic cleanup
     * - CI/CD compatibility
     * - Version matching production
     */
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test");

    /**
     * Configure Spring Boot to use Testcontainers database.
     */
    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        // Clean database before each test (or rely on @Transactional rollback)
        userRepository.deleteAll();
    }

    @Nested
    @DisplayName("Database Persistence")
    class DatabasePersistenceTests {

        @Test
        @DisplayName("should persist user to real database")
        void shouldPersistUserToDatabase() {
            // Arrange
            var request = new UserService.CreateUserRequest(
                    "testuser",
                    "test@example.com",
                    "SecurePass123"
            );

            // Act
            var createdUser = userService.createUser(request);

            // Assert
            var foundUser = userRepository.findById(createdUser.id());
            assertThat(foundUser)
                    .isPresent()
                    .get()
                    .satisfies(user -> {
                        assertThat(user.getUsername()).isEqualTo("testuser");
                        assertThat(user.getEmail()).isEqualTo("test@example.com");
                        assertThat(user.getPasswordHash()).isNotEmpty();
                    });
        }

        @Test
        @DisplayName("should enforce unique email constraint")
        void shouldEnforceUniqueEmailConstraint() {
            // Arrange
            var request1 = new UserService.CreateUserRequest(
                    "user1",
                    "duplicate@example.com",
                    "SecurePass123"
            );
            var request2 = new UserService.CreateUserRequest(
                    "user2",
                    "duplicate@example.com",
                    "SecurePass456"
            );

            // Act
            userService.createUser(request1);

            // Assert
            assertThatThrownBy(() -> userService.createUser(request2))
                    .isInstanceOf(UserService.UserAlreadyExistsException.class);
        }

        @Test
        @DisplayName("should find user by email")
        void shouldFindUserByEmail() {
            // Arrange
            var request = new UserService.CreateUserRequest(
                    "findme",
                    "findme@example.com",
                    "SecurePass123"
            );
            var createdUser = userService.createUser(request);

            // Act
            var foundUser = userService.authenticate("findme@example.com", "SecurePass123");

            // Assert
            assertThat(foundUser)
                    .isPresent()
                    .get()
                    .satisfies(user -> {
                        assertThat(user.id()).isEqualTo(createdUser.id());
                        assertThat(user.username()).isEqualTo("findme");
                    });
        }
    }

    @Nested
    @DisplayName("API Integration")
    class APIIntegrationTests {

        @Test
        @DisplayName("should create user via REST API")
        void shouldCreateUserViaAPI() throws Exception {
            // Arrange
            var requestBody = """
                    {
                        "username": "apiuser",
                        "email": "api@example.com",
                        "password": "SecurePass123"
                    }
                    """;

            // Act & Assert
            mockMvc.perform(post("/api/users")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.username").value("apiuser"))
                    .andExpect(jsonPath("$.email").value("api@example.com"))
                    .andExpect(jsonPath("$.id").exists());
        }

        @Test
        @DisplayName("should get user by ID via REST API")
        void shouldGetUserByIdViaAPI() throws Exception {
            // Arrange - Create user first
            var request = new UserService.CreateUserRequest(
                    "getuser",
                    "get@example.com",
                    "SecurePass123"
            );
            var createdUser = userService.createUser(request);

            // Act & Assert
            mockMvc.perform(get("/api/users/" + createdUser.id()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(createdUser.id()))
                    .andExpect(jsonPath("$.username").value("getuser"))
                    .andExpect(jsonPath("$.email").value("get@example.com"));
        }

        @Test
        @DisplayName("should return 404 for non-existent user")
        void shouldReturn404ForNonExistentUser() throws Exception {
            mockMvc.perform(get("/api/users/999999"))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("should validate request body")
        void shouldValidateRequestBody() throws Exception {
            // Invalid request - missing required fields
            var invalidRequest = """
                    {
                        "username": "ab"
                    }
                    """;

            mockMvc.perform(post("/api/users")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(invalidRequest))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("Transaction Management")
    class TransactionManagementTests {

        @Test
        @DisplayName("should rollback on error")
        void shouldRollbackOnError() {
            // Arrange
            var request1 = new UserService.CreateUserRequest(
                    "user1",
                    "transaction@example.com",
                    "SecurePass123"
            );
            var request2 = new UserService.CreateUserRequest(
                    "user2",
                    "transaction@example.com",  // Duplicate email
                    "SecurePass456"
            );

            // Act
            userService.createUser(request1);
            
            try {
                userService.createUser(request2);
            } catch (UserService.UserAlreadyExistsException e) {
                // Expected
            }

            // Assert - Only first user should exist
            var users = userRepository.findAll();
            assertThat(users)
                    .hasSize(1)
                    .allSatisfy(user -> assertThat(user.getUsername()).isEqualTo("user1"));
        }

        @Test
        @DisplayName("should handle concurrent operations")
        void shouldHandleConcurrentOperations() throws InterruptedException {
            // Arrange
            int numberOfThreads = 10;
            var threads = new Thread[numberOfThreads];

            // Act - Create users concurrently
            for (int i = 0; i < numberOfThreads; i++) {
                final int index = i;
                threads[i] = new Thread(() -> {
                    var request = new UserService.CreateUserRequest(
                            "concurrent" + index,
                            "concurrent" + index + "@example.com",
                            "SecurePass123"
                    );
                    try {
                        userService.createUser(request);
                    } catch (Exception e) {
                        // Some may fail due to constraints
                    }
                });
                threads[i].start();
            }

            // Wait for all threads
            for (Thread thread : threads) {
                thread.join();
            }

            // Assert - Should have created multiple users
            var count = userRepository.count();
            assertThat(count).isGreaterThan(0);
        }
    }

    @Nested
    @DisplayName("Performance Tests")
    @Tag("slow")
    class PerformanceTests {

        @Test
        @DisplayName("should handle bulk user creation efficiently")
        void shouldHandleBulkUserCreationEfficiently() {
            // Arrange
            int userCount = 1000;
            long startTime = System.currentTimeMillis();

            // Act
            for (int i = 0; i < userCount; i++) {
                var request = new UserService.CreateUserRequest(
                        "bulk" + i,
                        "bulk" + i + "@example.com",
                        "SecurePass123"
                );
                userService.createUser(request);
            }

            long elapsedTime = System.currentTimeMillis() - startTime;

            // Assert
            assertThat(userRepository.count()).isEqualTo(userCount);
            assertThat(elapsedTime)
                    .as("Bulk creation should complete in reasonable time")
                    .isLessThan(10000); // Less than 10 seconds
        }

        @Test
        @DisplayName("should query users efficiently")
        void shouldQueryUsersEfficiently() {
            // Arrange - Create test data
            for (int i = 0; i < 100; i++) {
                var request = new UserService.CreateUserRequest(
                        "query" + i,
                        "query" + i + "@example.com",
                        "SecurePass123"
                );
                userService.createUser(request);
            }

            // Act & Assert - Multiple queries should be fast
            long startTime = System.currentTimeMillis();
            
            for (int i = 0; i < 100; i++) {
                userService.getUser((long) i);
            }
            
            long elapsedTime = System.currentTimeMillis() - startTime;
            
            assertThat(elapsedTime)
                    .as("100 queries should complete quickly")
                    .isLessThan(1000); // Less than 1 second
        }
    }

    @Nested
    @DisplayName("Data Integrity")
    class DataIntegrityTests {

        @Test
        @DisplayName("should maintain referential integrity")
        void shouldMaintainReferentialIntegrity() {
            // This test would check foreign key constraints
            // if your User model had relationships
            
            // Example: Creating a user and related entities
            var request = new UserService.CreateUserRequest(
                    "integritytest",
                    "integrity@example.com",
                    "SecurePass123"
            );
            var user = userService.createUser(request);

            // Verify user exists
            assertThat(userRepository.findById(user.id())).isPresent();
        }

        @Test
        @DisplayName("should validate data types and constraints")
        void shouldValidateDataTypesAndConstraints() {
            // Test database-level constraints
            var user = User.builder()
                    .username("constrainttest")
                    .email("constraint@example.com")
                    .passwordHash("hashed")
                    .role(UserRole.USER)
                    .build();

            var savedUser = userRepository.save(user);

            assertThat(savedUser.getId()).isNotNull();
            assertThat(savedUser.getUsername()).hasSize("constrainttest".length());
        }
    }
}
