package com.example.demo.user;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.regex.Pattern;

/**
 * User Service - Example of Java Spring Boot best practices.
 *
 * Demonstrates:
 * - Constructor injection (recommended over field injection)
 * - Records for DTOs (Java 16+)
 * - Optional for null safety
 * - Business logic separation
 * - Transaction management
 * - Custom exceptions
 * - Pattern matching
 */
@Service
@Transactional
public class UserService {

    // Email validation pattern (simplified for example)
    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$");

    // Username validation pattern
    private static final Pattern USERNAME_PATTERN =
            Pattern.compile("^[a-zA-Z0-9_]{3,30}$");

    private static final int MIN_PASSWORD_LENGTH = 12;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Constructor injection - preferred over field injection.
     * Makes dependencies explicit and enables easier testing.
     */
    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Create a new user with validation.
     *
     * @param request the user creation request
     * @return the created user DTO
     * @throws InvalidInputException if validation fails
     * @throws UserAlreadyExistsException if user exists
     */
    public UserDTO createUser(CreateUserRequest request) {
        // Validate input
        validateUsername(request.username());
        validateEmail(request.email());
        validatePassword(request.password());

        // Check if user already exists
        if (userRepository.existsByEmail(request.email())) {
            throw new UserAlreadyExistsException(
                    "User with email %s already exists".formatted(request.email())
            );
        }

        // Create user entity
        var user = User.builder()
                .username(request.username())
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(UserRole.USER)
                .build();

        // Save and return DTO
        var savedUser = userRepository.save(user);
        return UserDTO.from(savedUser);
    }

    /**
     * Authenticate user by email and password.
     *
     * @param email the user's email
     * @param password the user's password
     * @return optional containing user DTO if authentication successful
     */
    @Transactional(readOnly = true)
    public Optional<UserDTO> authenticate(String email, String password) {
        return userRepository.findByEmail(email)
                .filter(user -> passwordEncoder.matches(password, user.getPasswordHash()))
                .map(UserDTO::from);
    }

    /**
     * Get user by ID.
     *
     * @param userId the user's ID
     * @return optional containing user DTO if found
     */
    @Transactional(readOnly = true)
    public Optional<UserDTO> getUser(Long userId) {
        return userRepository.findById(userId)
                .map(UserDTO::from);
    }

    /**
     * Update user profile.
     *
     * @param userId the user's ID
     * @param request the update request
     * @return the updated user DTO
     * @throws UserNotFoundException if user not found
     * @throws InvalidInputException if validation fails
     */
    public UserDTO updateUser(Long userId, UpdateUserRequest request) {
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + userId));

        // Validate and update username if provided
        if (request.username() != null) {
            validateUsername(request.username());
            user.setUsername(request.username());
        }

        // Validate and update email if provided
        if (request.email() != null) {
            validateEmail(request.email());

            // Check email not taken by another user
            userRepository.findByEmail(request.email())
                    .filter(existingUser -> !existingUser.getId().equals(userId))
                    .ifPresent(existingUser -> {
                        throw new UserAlreadyExistsException(
                                "Email %s is already taken".formatted(request.email())
                        );
                    });

            user.setEmail(request.email());
        }

        var savedUser = userRepository.save(user);
        return UserDTO.from(savedUser);
    }

    /**
     * Delete user by ID.
     *
     * @param userId the user's ID
     * @throws UserNotFoundException if user not found
     */
    public void deleteUser(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new UserNotFoundException("User not found: " + userId);
        }

        userRepository.deleteById(userId);
    }

    // Validation methods

    private void validateUsername(String username) {
        if (username == null || username.isBlank()) {
            throw new InvalidInputException("Username is required");
        }

        if (!USERNAME_PATTERN.matcher(username).matches()) {
            throw new InvalidInputException(
                    "Username must be 3-30 characters and contain only letters, numbers, and underscores"
            );
        }
    }

    private void validateEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new InvalidInputException("Email is required");
        }

        if (!EMAIL_PATTERN.matcher(email).matches()) {
            throw new InvalidInputException("Invalid email format: " + email);
        }
    }

    private void validatePassword(String password) {
        if (password == null || password.length() < MIN_PASSWORD_LENGTH) {
            throw new InvalidInputException(
                    "Password must be at least %d characters".formatted(MIN_PASSWORD_LENGTH)
            );
        }

        boolean hasUpper = password.chars().anyMatch(Character::isUpperCase);
        boolean hasLower = password.chars().anyMatch(Character::isLowerCase);
        boolean hasDigit = password.chars().anyMatch(Character::isDigit);

        if (!hasUpper) {
            throw new InvalidInputException("Password must contain at least one uppercase letter");
        }

        if (!hasLower) {
            throw new InvalidInputException("Password must contain at least one lowercase letter");
        }

        if (!hasDigit) {
            throw new InvalidInputException("Password must contain at least one number");
        }
    }

    // DTOs using Records (Java 16+)

    /**
     * Request to create a new user.
     */
    public record CreateUserRequest(
            String username,
            String email,
            String password
    ) {}

    /**
     * Request to update user profile.
     */
    public record UpdateUserRequest(
            String username,
            String email
    ) {}

    /**
     * User data transfer object.
     */
    public record UserDTO(
            Long id,
            String username,
            String email,
            UserRole role
    ) {
        /**
         * Factory method to create DTO from entity.
         */
        public static UserDTO from(User user) {
            return new UserDTO(
                    user.getId(),
                    user.getUsername(),
                    user.getEmail(),
                    user.getRole()
            );
        }
    }

    // Custom Exceptions

    public static class InvalidInputException extends RuntimeException {
        public InvalidInputException(String message) {
            super(message);
        }
    }

    public static class UserAlreadyExistsException extends RuntimeException {
        public UserAlreadyExistsException(String message) {
            super(message);
        }
    }

    public static class UserNotFoundException extends RuntimeException {
        public UserNotFoundException(String message) {
            super(message);
        }
    }
}
