"""
Test suite for UserService - demonstrates TDD best practices.

Uses:
- pytest
- pytest fixtures for dependency injection
- Mocking with unittest.mock
- Parameterized tests
"""

from datetime import datetime
from unittest.mock import Mock
import pytest

from user_service import (
    UserService,
    UserDTO,
    UserRepository,
    PasswordHasher,
    InvalidEmailError,
    InvalidUsernameError,
    WeakPasswordError,
    UserAlreadyExistsError,
)


@pytest.fixture
def mock_repository() -> Mock:
    """Create a mock user repository."""
    return Mock(spec=UserRepository)


@pytest.fixture
def mock_hasher() -> Mock:
    """Create a mock password hasher."""
    hasher = Mock(spec=PasswordHasher)
    hasher.hash.return_value = "hashed_password_123"
    return hasher


@pytest.fixture
def user_service(mock_repository: Mock, mock_hasher: Mock) -> UserService:
    """Create a UserService with mocked dependencies."""
    return UserService(mock_repository, mock_hasher)


class TestCreateUser:
    """Tests for create_user method - Red/Green/Refactor TDD."""

    def test_creates_user_with_valid_input(
        self, user_service: UserService, mock_repository: Mock, mock_hasher: Mock
    ) -> None:
        """Should create user when all inputs are valid."""
        # Arrange
        expected_user = UserDTO(
            id=1,
            username="johndoe",
            email="john@example.com",
            created_at=datetime.now(),
        )
        mock_repository.find_by_email.return_value = None
        mock_repository.save.return_value = expected_user

        # Act
        result = user_service.create_user(
            username="johndoe", email="john@example.com", password="SecurePass123"
        )

        # Assert
        assert result == expected_user
        mock_hasher.hash.assert_called_once_with("SecurePass123")
        mock_repository.save.assert_called_once_with(
            username="johndoe",
            email="john@example.com",
            password_hash="hashed_password_123",
        )

    def test_checks_if_user_exists(
        self, user_service: UserService, mock_repository: Mock
    ) -> None:
        """Should check if user with email already exists."""
        # Arrange
        existing_user = UserDTO(
            id=1,
            username="existing",
            email="john@example.com",
            created_at=datetime.now(),
        )
        mock_repository.find_by_email.return_value = existing_user

        # Act & Assert
        with pytest.raises(UserAlreadyExistsError):
            user_service.create_user(
                username="johndoe", email="john@example.com", password="SecurePass123"
            )

        # Should not attempt to save
        mock_repository.save.assert_not_called()

    @pytest.mark.parametrize(
        "invalid_username,error_msg",
        [
            ("ab", "must be 3-30 characters"),  # Too short
            ("a" * 31, "must be 3-30 characters"),  # Too long
            ("john-doe", "contain only letters"),  # Invalid characters
            ("john doe", "contain only letters"),  # Space
            ("", "required"),  # Empty
        ],
    )
    def test_rejects_invalid_username(
        self, user_service: UserService, invalid_username: str, error_msg: str
    ) -> None:
        """Should reject invalid username formats."""
        with pytest.raises(InvalidUsernameError, match=error_msg):
            user_service.create_user(
                username=invalid_username,
                email="john@example.com",
                password="SecurePass123",
            )

    @pytest.mark.parametrize(
        "invalid_email",
        [
            "notanemail",
            "missing@domain",
            "@nodomain.com",
            "spaces in@email.com",
            "",
        ],
    )
    def test_rejects_invalid_email(
        self, user_service: UserService, invalid_email: str
    ) -> None:
        """Should reject invalid email formats."""
        with pytest.raises(InvalidEmailError):
            user_service.create_user(
                username="johndoe", email=invalid_email, password="SecurePass123"
            )

    @pytest.mark.parametrize(
        "weak_password,error_msg",
        [
            ("short", "at least 12 characters"),
            ("nouppercase123", "uppercase letter"),
            ("NOLOWERCASE123", "lowercase letter"),
            ("NoNumbersHere", "one number"),
        ],
    )
    def test_rejects_weak_password(
        self, user_service: UserService, weak_password: str, error_msg: str
    ) -> None:
        """Should reject passwords that don't meet requirements."""
        with pytest.raises(WeakPasswordError, match=error_msg):
            user_service.create_user(
                username="johndoe", email="john@example.com", password=weak_password
            )


class TestAuthenticate:
    """Tests for authentication."""

    def test_returns_user_for_valid_credentials(
        self, user_service: UserService, mock_repository: Mock
    ) -> None:
        """Should return user when credentials are valid."""
        # Arrange
        expected_user = UserDTO(
            id=1,
            username="johndoe",
            email="john@example.com",
            created_at=datetime.now(),
        )
        mock_repository.find_by_email.return_value = expected_user

        # Act
        result = user_service.authenticate("john@example.com", "password")

        # Assert
        assert result == expected_user

    def test_returns_none_for_nonexistent_user(
        self, user_service: UserService, mock_repository: Mock
    ) -> None:
        """Should return None when user doesn't exist."""
        # Arrange
        mock_repository.find_by_email.return_value = None

        # Act
        result = user_service.authenticate("nonexistent@example.com", "password")

        # Assert
        assert result is None


class TestGetUser:
    """Tests for get_user method."""

    def test_returns_user_when_found(
        self, user_service: UserService, mock_repository: Mock
    ) -> None:
        """Should return user when ID exists."""
        # Arrange
        expected_user = UserDTO(
            id=123,
            username="johndoe",
            email="john@example.com",
            created_at=datetime.now(),
        )
        mock_repository.find_by_id.return_value = expected_user

        # Act
        result = user_service.get_user(123)

        # Assert
        assert result == expected_user
        mock_repository.find_by_id.assert_called_once_with(123)

    def test_returns_none_when_not_found(
        self, user_service: UserService, mock_repository: Mock
    ) -> None:
        """Should return None when user ID doesn't exist."""
        # Arrange
        mock_repository.find_by_id.return_value = None

        # Act
        result = user_service.get_user(999)

        # Assert
        assert result is None


# Integration test example (would use real database in practice)
class TestUserServiceIntegration:
    """
    Integration tests using test database.

    In real implementation, would use:
    - pytest-postgresql or testcontainers
    - Real database with test data
    - Transaction rollback between tests
    """

    @pytest.mark.integration
    def test_full_user_lifecycle(self) -> None:
        """
        Test complete user lifecycle.

        This is a placeholder - real implementation would:
        1. Set up test database
        2. Create user
        3. Verify user exists
        4. Authenticate user
        5. Clean up
        """
        pass  # Implementation would go here
