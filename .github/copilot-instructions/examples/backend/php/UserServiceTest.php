<?php

declare(strict_types=1);

namespace App\Tests\Service;

use App\Service\UserService;
use App\Repository\UserRepositoryInterface;
use App\Security\PasswordHasherInterface;
use App\Exception\InvalidInputException;
use App\Exception\UserAlreadyExistsException;
use App\Exception\UserNotFoundException;
use App\DTO\UserDTO;
use App\DTO\CreateUserRequest;
use App\DTO\UpdateUserRequest;
use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Test suite for UserService - demonstrates PHPUnit best practices.
 *
 * Uses:
 * - PHPUnit 10+ with attributes (#[Test], #[DataProvider])
 * - Mocking with createMock()
 * - Named arguments
 * - Strict types
 * - Data providers for parameterized tests
 */
final class UserServiceTest extends TestCase
{
    private UserRepositoryInterface $userRepository;
    private PasswordHasherInterface $passwordHasher;
    private UserService $userService;

    protected function setUp(): void
    {
        $this->userRepository = $this->createMock(UserRepositoryInterface::class);
        $this->passwordHasher = $this->createMock(PasswordHasherInterface::class);
        
        $this->passwordHasher
            ->method('hash')
            ->willReturn('hashed_password_123');

        $this->userService = new UserService(
            userRepository: $this->userRepository,
            passwordHasher: $this->passwordHasher,
        );
    }

    #[Test]
    public function it_creates_user_with_valid_input(): void
    {
        // Arrange
        $request = new CreateUserRequest(
            username: 'johndoe',
            email: 'john@example.com',
            password: 'SecurePass123',
        );

        $expectedUser = new UserDTO(
            id: 1,
            username: 'johndoe',
            email: 'john@example.com',
            role: 'user',
        );

        $this->userRepository
            ->expects($this->once())
            ->method('findByEmail')
            ->with('john@example.com')
            ->willReturn(null);

        $this->userRepository
            ->expects($this->once())
            ->method('save')
            ->with(
                username: 'johndoe',
                email: 'john@example.com',
                passwordHash: 'hashed_password_123',
            )
            ->willReturn($expectedUser);

        // Act
        $result = $this->userService->createUser($request);

        // Assert
        $this->assertEquals($expectedUser, $result);
    }

    #[Test]
    public function it_throws_exception_when_user_already_exists(): void
    {
        // Arrange
        $request = new CreateUserRequest(
            username: 'johndoe',
            email: 'john@example.com',
            password: 'SecurePass123',
        );

        $existingUser = new UserDTO(
            id: 1,
            username: 'existing',
            email: 'john@example.com',
            role: 'user',
        );

        $this->userRepository
            ->method('findByEmail')
            ->willReturn($existingUser);

        // Assert & Act
        $this->expectException(UserAlreadyExistsException::class);
        $this->expectExceptionMessage('User with email john@example.com already exists');

        $this->userService->createUser($request);
    }

    #[Test]
    #[DataProvider('invalidUsernameProvider')]
    public function it_rejects_invalid_usernames(string $invalidUsername, string $expectedMessage): void
    {
        // Arrange
        $request = new CreateUserRequest(
            username: $invalidUsername,
            email: 'john@example.com',
            password: 'SecurePass123',
        );

        // Assert & Act
        $this->expectException(InvalidInputException::class);
        $this->expectExceptionMessage($expectedMessage);

        $this->userService->createUser($request);
    }

    public static function invalidUsernameProvider(): array
    {
        return [
            'too short' => ['ab', 'must be 3-30 characters'],
            'too long' => [str_repeat('a', 31), 'must be 3-30 characters'],
            'invalid chars' => ['john-doe', 'contain only letters'],
            'with space' => ['john doe', 'contain only letters'],
            'empty' => ['', 'required'],
        ];
    }

    #[Test]
    #[DataProvider('invalidEmailProvider')]
    public function it_rejects_invalid_emails(string $invalidEmail): void
    {
        // Arrange
        $request = new CreateUserRequest(
            username: 'johndoe',
            email: $invalidEmail,
            password: 'SecurePass123',
        );

        // Assert & Act
        $this->expectException(InvalidInputException::class);

        $this->userService->createUser($request);
    }

    public static function invalidEmailProvider(): array
    {
        return [
            'not an email' => ['notanemail'],
            'missing domain' => ['missing@domain'],
            'no local part' => ['@nodomain.com'],
            'with spaces' => ['spaces in@email.com'],
            'empty' => [''],
        ];
    }

    #[Test]
    #[DataProvider('weakPasswordProvider')]
    public function it_rejects_weak_passwords(string $weakPassword, string $expectedMessage): void
    {
        // Arrange
        $request = new CreateUserRequest(
            username: 'johndoe',
            email: 'john@example.com',
            password: $weakPassword,
        );

        // Assert & Act
        $this->expectException(InvalidInputException::class);
        $this->expectExceptionMessage($expectedMessage);

        $this->userService->createUser($request);
    }

    public static function weakPasswordProvider(): array
    {
        return [
            'too short' => ['short', 'at least 12 characters'],
            'no uppercase' => ['nouppercase123', 'uppercase letter'],
            'no lowercase' => ['NOLOWERCASE123', 'lowercase letter'],
            'no digits' => ['NoNumbersHere', 'one number'],
        ];
    }

    #[Test]
    public function it_authenticates_user_with_valid_credentials(): void
    {
        // Arrange
        $expectedUser = new UserDTO(
            id: 1,
            username: 'johndoe',
            email: 'john@example.com',
            role: 'user',
        );

        $this->userRepository
            ->method('findByEmail')
            ->with('john@example.com')
            ->willReturn($expectedUser);

        // Act
        $result = $this->userService->authenticate('john@example.com', 'password');

        // Assert
        $this->assertEquals($expectedUser, $result);
    }

    #[Test]
    public function it_returns_null_for_nonexistent_user(): void
    {
        // Arrange
        $this->userRepository
            ->method('findByEmail')
            ->willReturn(null);

        // Act
        $result = $this->userService->authenticate('nonexistent@example.com', 'password');

        // Assert
        $this->assertNull($result);
    }

    #[Test]
    public function it_gets_user_by_id(): void
    {
        // Arrange
        $expectedUser = new UserDTO(
            id: 123,
            username: 'johndoe',
            email: 'john@example.com',
            role: 'user',
        );

        $this->userRepository
            ->expects($this->once())
            ->method('findById')
            ->with(123)
            ->willReturn($expectedUser);

        // Act
        $result = $this->userService->getUser(123);

        // Assert
        $this->assertEquals($expectedUser, $result);
    }

    #[Test]
    public function it_returns_null_when_user_not_found(): void
    {
        // Arrange
        $this->userRepository
            ->method('findById')
            ->willReturn(null);

        // Act
        $result = $this->userService->getUser(999);

        // Assert
        $this->assertNull($result);
    }

    #[Test]
    public function it_updates_user_username(): void
    {
        // Arrange
        $existingUser = new UserDTO(
            id: 1,
            username: 'oldusername',
            email: 'john@example.com',
            role: 'user',
        );

        $request = new UpdateUserRequest(
            username: 'newusername',
            email: null,
        );

        $updatedUser = new UserDTO(
            id: 1,
            username: 'newusername',
            email: 'john@example.com',
            role: 'user',
        );

        $this->userRepository
            ->method('findById')
            ->willReturn($existingUser);

        $this->userRepository
            ->expects($this->once())
            ->method('update')
            ->with(
                userId: 1,
                username: 'newusername',
                email: 'john@example.com',
            )
            ->willReturn($updatedUser);

        // Act
        $result = $this->userService->updateUser(1, $request);

        // Assert
        $this->assertEquals('newusername', $result->username);
    }

    #[Test]
    public function it_throws_exception_when_updating_nonexistent_user(): void
    {
        // Arrange
        $request = new UpdateUserRequest(username: 'newusername', email: null);

        $this->userRepository
            ->method('findById')
            ->willReturn(null);

        // Assert & Act
        $this->expectException(UserNotFoundException::class);
        $this->expectExceptionMessage('User not found: 999');

        $this->userService->updateUser(999, $request);
    }

    #[Test]
    public function it_deletes_existing_user(): void
    {
        // Arrange
        $this->userRepository
            ->method('exists')
            ->with(1)
            ->willReturn(true);

        $this->userRepository
            ->expects($this->once())
            ->method('delete')
            ->with(1);

        // Act
        $this->userService->deleteUser(1);

        // Assert - expectations verified by PHPUnit
    }

    #[Test]
    public function it_throws_exception_when_deleting_nonexistent_user(): void
    {
        // Arrange
        $this->userRepository
            ->method('exists')
            ->willReturn(false);

        // Assert & Act
        $this->expectException(UserNotFoundException::class);
        $this->expectExceptionMessage('User not found: 999');

        $this->userService->deleteUser(999);
    }
}
