package com.example.demo.user;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Test suite for UserService - demonstrates JUnit 5 best practices.
 *
 * Uses:
 * - JUnit 5
 * - Mockito for mocking
 * - AssertJ for fluent assertions
 * - Nested test classes for organization
 * - Parameterized tests
 * - DisplayName for readable test names
 */
@DisplayName("UserService")
class UserServiceTest {

    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private UserService userService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        userService = new UserService(userRepository, passwordEncoder);

        // Default mock behavior
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_password_123");
    }

    @Nested
    @DisplayName("createUser")
    class CreateUserTests {

        @Test
        @DisplayName("should create user with valid input")
        void shouldCreateUserWithValidInput() {
            // Arrange
            var request = new UserService.CreateUserRequest(
                    "johndoe",
                    "john@example.com",
                    "SecurePass123"
            );

            var savedUser = User.builder()
                    .id(1L)
                    .username("johndoe")
                    .email("john@example.com")
                    .passwordHash("hashed_password_123")
                    .role(UserRole.USER)
                    .build();

            when(userRepository.existsByEmail(request.email())).thenReturn(false);
            when(userRepository.save(any(User.class))).thenReturn(savedUser);

            // Act
            var result = userService.createUser(request);

            // Assert
            assertThat(result)
                    .isNotNull()
                    .satisfies(user -> {
                        assertThat(user.id()).isEqualTo(1L);
                        assertThat(user.username()).isEqualTo("johndoe");
                        assertThat(user.email()).isEqualTo("john@example.com");
                        assertThat(user.role()).isEqualTo(UserRole.USER);
                    });

            verify(passwordEncoder).encode("SecurePass123");
            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("should throw exception when user already exists")
        void shouldThrowExceptionWhenUserAlreadyExists() {
            // Arrange
            var request = new UserService.CreateUserRequest(
                    "johndoe",
                    "john@example.com",
                    "SecurePass123"
            );

            when(userRepository.existsByEmail(request.email())).thenReturn(true);

            // Act & Assert
            assertThatThrownBy(() -> userService.createUser(request))
                    .isInstanceOf(UserService.UserAlreadyExistsException.class)
                    .hasMessageContaining("john@example.com");

            verify(userRepository, never()).save(any(User.class));
        }

        @ParameterizedTest
        @DisplayName("should reject invalid usernames")
        @ValueSource(strings = {"ab", "a".repeat(31), "john-doe", "john doe", ""})
        void shouldRejectInvalidUsernames(String invalidUsername) {
            // Arrange
            var request = new UserService.CreateUserRequest(
                    invalidUsername,
                    "john@example.com",
                    "SecurePass123"
            );

            // Act & Assert
            assertThatThrownBy(() -> userService.createUser(request))
                    .isInstanceOf(UserService.InvalidInputException.class)
                    .hasMessageContainingAny("Username", "required");
        }

        @ParameterizedTest
        @DisplayName("should reject invalid emails")
        @ValueSource(strings = {"notanemail", "missing@domain", "@nodomain.com", "spaces in@email.com", ""})
        void shouldRejectInvalidEmails(String invalidEmail) {
            // Arrange
            var request = new UserService.CreateUserRequest(
                    "johndoe",
                    invalidEmail,
                    "SecurePass123"
            );

            // Act & Assert
            assertThatThrownBy(() -> userService.createUser(request))
                    .isInstanceOf(UserService.InvalidInputException.class)
                    .hasMessageContainingAny("Email", "required");
        }

        @ParameterizedTest
        @DisplayName("should reject weak passwords")
        @CsvSource({
                "short, at least 12 characters",
                "nouppercase123, uppercase letter",
                "NOLOWERCASE123, lowercase letter",
                "NoNumbers, one number"
        })
        void shouldRejectWeakPasswords(String weakPassword, String expectedMessagePart) {
            // Arrange
            var request = new UserService.CreateUserRequest(
                    "johndoe",
                    "john@example.com",
                    weakPassword
            );

            // Act & Assert
            assertThatThrownBy(() -> userService.createUser(request))
                    .isInstanceOf(UserService.InvalidInputException.class)
                    .hasMessageContaining(expectedMessagePart);
        }

        @Test
        @DisplayName("should save user with hashed password")
        void shouldSaveUserWithHashedPassword() {
            // Arrange
            var request = new UserService.CreateUserRequest(
                    "johndoe",
                    "john@example.com",
                    "SecurePass123"
            );

            var savedUser = User.builder()
                    .id(1L)
                    .username("johndoe")
                    .email("john@example.com")
                    .passwordHash("hashed_password_123")
                    .role(UserRole.USER)
                    .build();

            when(userRepository.existsByEmail(request.email())).thenReturn(false);
            when(userRepository.save(any(User.class))).thenReturn(savedUser);

            // Act
            userService.createUser(request);

            // Assert - Capture and verify the user entity
            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(userCaptor.capture());

            var capturedUser = userCaptor.getValue();
            assertThat(capturedUser.getPasswordHash()).isEqualTo("hashed_password_123");
            assertThat(capturedUser.getUsername()).isEqualTo("johndoe");
            assertThat(capturedUser.getEmail()).isEqualTo("john@example.com");
        }
    }

    @Nested
    @DisplayName("authenticate")
    class AuthenticateTests {

        @Test
        @DisplayName("should return user when credentials are valid")
        void shouldReturnUserWhenCredentialsAreValid() {
            // Arrange
            var user = User.builder()
                    .id(1L)
                    .username("johndoe")
                    .email("john@example.com")
                    .passwordHash("hashed_password")
                    .role(UserRole.USER)
                    .build();

            when(userRepository.findByEmail("john@example.com"))
                    .thenReturn(Optional.of(user));
            when(passwordEncoder.matches("password123", "hashed_password"))
                    .thenReturn(true);

            // Act
            var result = userService.authenticate("john@example.com", "password123");

            // Assert
            assertThat(result)
                    .isPresent()
                    .get()
                    .satisfies(userDTO -> {
                        assertThat(userDTO.id()).isEqualTo(1L);
                        assertThat(userDTO.username()).isEqualTo("johndoe");
                        assertThat(userDTO.email()).isEqualTo("john@example.com");
                    });
        }

        @Test
        @DisplayName("should return empty when user not found")
        void shouldReturnEmptyWhenUserNotFound() {
            // Arrange
            when(userRepository.findByEmail("nonexistent@example.com"))
                    .thenReturn(Optional.empty());

            // Act
            var result = userService.authenticate("nonexistent@example.com", "password123");

            // Assert
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("should return empty when password is incorrect")
        void shouldReturnEmptyWhenPasswordIsIncorrect() {
            // Arrange
            var user = User.builder()
                    .id(1L)
                    .username("johndoe")
                    .email("john@example.com")
                    .passwordHash("hashed_password")
                    .role(UserRole.USER)
                    .build();

            when(userRepository.findByEmail("john@example.com"))
                    .thenReturn(Optional.of(user));
            when(passwordEncoder.matches("wrongpassword", "hashed_password"))
                    .thenReturn(false);

            // Act
            var result = userService.authenticate("john@example.com", "wrongpassword");

            // Assert
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("getUser")
    class GetUserTests {

        @Test
        @DisplayName("should return user when found")
        void shouldReturnUserWhenFound() {
            // Arrange
            var user = User.builder()
                    .id(123L)
                    .username("johndoe")
                    .email("john@example.com")
                    .passwordHash("hashed_password")
                    .role(UserRole.USER)
                    .build();

            when(userRepository.findById(123L)).thenReturn(Optional.of(user));

            // Act
            var result = userService.getUser(123L);

            // Assert
            assertThat(result)
                    .isPresent()
                    .get()
                    .satisfies(userDTO -> {
                        assertThat(userDTO.id()).isEqualTo(123L);
                        assertThat(userDTO.username()).isEqualTo("johndoe");
                    });
        }

        @Test
        @DisplayName("should return empty when user not found")
        void shouldReturnEmptyWhenUserNotFound() {
            // Arrange
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            // Act
            var result = userService.getUser(999L);

            // Assert
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("updateUser")
    class UpdateUserTests {

        @Test
        @DisplayName("should update username when provided")
        void shouldUpdateUsernameWhenProvided() {
            // Arrange
            var existingUser = User.builder()
                    .id(1L)
                    .username("oldusername")
                    .email("john@example.com")
                    .passwordHash("hashed_password")
                    .role(UserRole.USER)
                    .build();

            var request = new UserService.UpdateUserRequest("newusername", null);

            when(userRepository.findById(1L)).thenReturn(Optional.of(existingUser));
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // Act
            var result = userService.updateUser(1L, request);

            // Assert
            assertThat(result.username()).isEqualTo("newusername");
            verify(userRepository).save(existingUser);
        }

        @Test
        @DisplayName("should throw exception when user not found")
        void shouldThrowExceptionWhenUserNotFound() {
            // Arrange
            var request = new UserService.UpdateUserRequest("newusername", null);
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> userService.updateUser(999L, request))
                    .isInstanceOf(UserService.UserNotFoundException.class)
                    .hasMessageContaining("999");
        }
    }

    @Nested
    @DisplayName("deleteUser")
    class DeleteUserTests {

        @Test
        @DisplayName("should delete existing user")
        void shouldDeleteExistingUser() {
            // Arrange
            when(userRepository.existsById(1L)).thenReturn(true);

            // Act
            userService.deleteUser(1L);

            // Assert
            verify(userRepository).deleteById(1L);
        }

        @Test
        @DisplayName("should throw exception when user not found")
        void shouldThrowExceptionWhenUserNotFound() {
            // Arrange
            when(userRepository.existsById(999L)).thenReturn(false);

            // Act & Assert
            assertThatThrownBy(() -> userService.deleteUser(999L))
                    .isInstanceOf(UserService.UserNotFoundException.class)
                    .hasMessageContaining("999");
        }
    }
}
