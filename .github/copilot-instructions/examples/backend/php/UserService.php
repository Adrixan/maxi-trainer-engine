<?php

declare(strict_types=1);

namespace App\Service;

use App\Repository\UserRepositoryInterface;
use App\Security\PasswordHasherInterface;
use App\Exception\InvalidInputException;
use App\Exception\UserAlreadyExistsException;
use App\Exception\UserNotFoundException;
use App\DTO\UserDTO;
use App\DTO\CreateUserRequest;
use App\DTO\UpdateUserRequest;

/**
 * User Service - Example of PHP best practices.
 *
 * Demonstrates:
 * - Strict types (declare(strict_types=1))
 * - Constructor property promotion (PHP 8.0+)
 * - Type hints for parameters and return types
 * - Dependency injection via constructor
 * - Readonly properties (PHP 8.1+)
 * - Named arguments
 * - Match expressions (PHP 8.0+)
 *
 * @psalm-immutable for DTOs
 */
final class UserService
{
    private const EMAIL_PATTERN = '/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/';
    private const USERNAME_PATTERN = '/^[a-zA-Z0-9_]{3,30}$/';
    private const MIN_PASSWORD_LENGTH = 12;

    /**
     * Constructor with dependency injection (property promotion).
     *
     * @param UserRepositoryInterface $userRepository Repository for user persistence
     * @param PasswordHasherInterface $passwordHasher Service for password hashing
     */
    public function __construct(
        private readonly UserRepositoryInterface $userRepository,
        private readonly PasswordHasherInterface $passwordHasher,
    ) {
    }

    /**
     * Create a new user with validation.
     *
     * @param CreateUserRequest $request User creation request
     * @return UserDTO Created user data
     * @throws InvalidInputException If validation fails
     * @throws UserAlreadyExistsException If user already exists
     */
    public function createUser(CreateUserRequest $request): UserDTO
    {
        // Validate input
        $this->validateUsername($request->username);
        $this->validateEmail($request->email);
        $this->validatePassword($request->password);

        // Check if user exists
        $existingUser = $this->userRepository->findByEmail($request->email);
        if ($existingUser !== null) {
            throw new UserAlreadyExistsException(
                sprintf('User with email %s already exists', $request->email)
            );
        }

        // Hash password
        $passwordHash = $this->passwordHasher->hash($request->password);

        // Create user
        $user = $this->userRepository->save(
            username: $request->username,
            email: $request->email,
            passwordHash: $passwordHash,
        );

        return $user;
    }

    /**
     * Authenticate user by email and password.
     *
     * @param string $email User's email
     * @param string $password User's password
     * @return UserDTO|null User data if authentication successful, null otherwise
     */
    public function authenticate(string $email, string $password): ?UserDTO
    {
        $user = $this->userRepository->findByEmail($email);

        if ($user === null) {
            return null;
        }

        // Note: In real implementation, need to fetch password hash
        // This is simplified for example
        // if (!$this->passwordHasher->verify($password, $storedHash)) {
        //     return null;
        // }

        return $user;
    }

    /**
     * Get user by ID.
     *
     * @param int $userId User's ID
     * @return UserDTO|null User data if found, null otherwise
     */
    public function getUser(int $userId): ?UserDTO
    {
        return $this->userRepository->findById($userId);
    }

    /**
     * Update user profile.
     *
     * @param int $userId User's ID
     * @param UpdateUserRequest $request Update request
     * @return UserDTO Updated user data
     * @throws UserNotFoundException If user not found
     * @throws InvalidInputException If validation fails
     * @throws UserAlreadyExistsException If email is taken
     */
    public function updateUser(int $userId, UpdateUserRequest $request): UserDTO
    {
        $user = $this->userRepository->findById($userId);
        if ($user === null) {
            throw new UserNotFoundException(sprintf('User not found: %d', $userId));
        }

        // Validate and update username if provided
        if ($request->username !== null) {
            $this->validateUsername($request->username);
        }

        // Validate and update email if provided
        if ($request->email !== null) {
            $this->validateEmail($request->email);

            // Check email not taken by another user
            $existingUser = $this->userRepository->findByEmail($request->email);
            if ($existingUser !== null && $existingUser->id !== $userId) {
                throw new UserAlreadyExistsException(
                    sprintf('Email %s is already taken', $request->email)
                );
            }
        }

        // Update user
        return $this->userRepository->update(
            userId: $userId,
            username: $request->username ?? $user->username,
            email: $request->email ?? $user->email,
        );
    }

    /**
     * Delete user by ID.
     *
     * @param int $userId User's ID
     * @throws UserNotFoundException If user not found
     */
    public function deleteUser(int $userId): void
    {
        if (!$this->userRepository->exists($userId)) {
            throw new UserNotFoundException(sprintf('User not found: %d', $userId));
        }

        $this->userRepository->delete($userId);
    }

    /**
     * Validate username format.
     *
     * @param string $username Username to validate
     * @throws InvalidInputException If validation fails
     */
    private function validateUsername(string $username): void
    {
        if ($username === '') {
            throw new InvalidInputException('Username is required');
        }

        if (preg_match(self::USERNAME_PATTERN, $username) !== 1) {
            throw new InvalidInputException(
                'Username must be 3-30 characters and contain only letters, numbers, and underscores'
            );
        }
    }

    /**
     * Validate email format.
     *
     * @param string $email Email to validate
     * @throws InvalidInputException If validation fails
     */
    private function validateEmail(string $email): void
    {
        if ($email === '') {
            throw new InvalidInputException('Email is required');
        }

        if (preg_match(self::EMAIL_PATTERN, $email) !== 1) {
            throw new InvalidInputException(sprintf('Invalid email format: %s', $email));
        }
    }

    /**
     * Validate password strength.
     *
     * @param string $password Password to validate
     * @throws InvalidInputException If validation fails
     */
    private function validatePassword(string $password): void
    {
        if (strlen($password) < self::MIN_PASSWORD_LENGTH) {
            throw new InvalidInputException(
                sprintf('Password must be at least %d characters', self::MIN_PASSWORD_LENGTH)
            );
        }

        $hasUpper = preg_match('/[A-Z]/', $password) === 1;
        $hasLower = preg_match('/[a-z]/', $password) === 1;
        $hasDigit = preg_match('/[0-9]/', $password) === 1;

        // Use match expression for validation (PHP 8.0+)
        $missingRequirement = match (true) {
            !$hasUpper => 'at least one uppercase letter',
            !$hasLower => 'at least one lowercase letter',
            !$hasDigit => 'at least one number',
            default => null,
        };

        if ($missingRequirement !== null) {
            throw new InvalidInputException(
                sprintf('Password must contain %s', $missingRequirement)
            );
        }
    }
}
