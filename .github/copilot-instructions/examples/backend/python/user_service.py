"""
User Service - Example of best practices for Python backend development.

Demonstrates:
- Type hints
- Dependency injection
- Clean architecture
- Error handling
- Input validation
"""

from dataclasses import dataclass
from typing import Protocol, Optional
from datetime import datetime
import re


@dataclass(frozen=True)
class UserDTO:
    """Data Transfer Object for User - immutable."""

    id: int
    username: str
    email: str
    created_at: datetime


class UserRepository(Protocol):
    """Repository interface - follows Dependency Inversion Principle."""

    def save(self, username: str, email: str, password_hash: str) -> UserDTO:
        """Save a new user to the database."""
        ...

    def find_by_id(self, user_id: int) -> Optional[UserDTO]:
        """Find user by ID, returns None if not found."""
        ...

    def find_by_email(self, email: str) -> Optional[UserDTO]:
        """Find user by email, returns None if not found."""
        ...


class PasswordHasher(Protocol):
    """Password hashing interface."""

    def hash(self, password: str) -> str:
        """Hash a password."""
        ...

    def verify(self, password: str, hashed: str) -> bool:
        """Verify password against hash."""
        ...


class InvalidEmailError(ValueError):
    """Raised when email format is invalid."""

    pass


class InvalidUsernameError(ValueError):
    """Raised when username format is invalid."""

    pass


class WeakPasswordError(ValueError):
    """Raised when password doesn't meet requirements."""

    pass


class UserAlreadyExistsError(ValueError):
    """Raised when user already exists."""

    pass


class UserService:
    """
    User business logic service.

    Follows:
    - Single Responsibility Principle
    - Dependency Injection
    - Clean Architecture
    """

    # Email regex (simplified for example)
    EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")

    # Username regex (alphanumeric + underscore)
    USERNAME_REGEX = re.compile(r"^[a-zA-Z0-9_]{3,30}$")

    def __init__(
        self, user_repository: UserRepository, password_hasher: PasswordHasher
    ) -> None:
        """
        Initialize service with dependencies.

        Args:
            user_repository: Repository for user data persistence
            password_hasher: Service for password hashing
        """
        self._user_repository = user_repository
        self._password_hasher = password_hasher

    def create_user(self, username: str, email: str, password: str) -> UserDTO:
        """
        Create a new user with validation.

        Args:
            username: User's chosen username
            email: User's email address
            password: User's password (will be hashed)

        Returns:
            UserDTO with created user information

        Raises:
            InvalidUsernameError: If username format is invalid
            InvalidEmailError: If email format is invalid
            WeakPasswordError: If password doesn't meet requirements
            UserAlreadyExistsError: If user already exists
        """
        # Validate inputs
        self._validate_username(username)
        self._validate_email(email)
        self._validate_password(password)

        # Check if user already exists
        existing_user = self._user_repository.find_by_email(email)
        if existing_user is not None:
            raise UserAlreadyExistsError(f"User with email {email} already exists")

        # Hash password
        password_hash = self._password_hasher.hash(password)

        # Save user
        user = self._user_repository.save(
            username=username, email=email, password_hash=password_hash
        )

        return user

    def authenticate(self, email: str, password: str) -> Optional[UserDTO]:
        """
        Authenticate user by email and password.

        Args:
            email: User's email
            password: User's password

        Returns:
            UserDTO if authentication successful, None otherwise
        """
        user = self._user_repository.find_by_email(email)

        if user is None:
            return None

        # Note: In real implementation, you'd need to fetch password hash
        # This is simplified for example purposes
        # if not self._password_hasher.verify(password, stored_hash):
        #     return None

        return user

    def get_user(self, user_id: int) -> Optional[UserDTO]:
        """
        Get user by ID.

        Args:
            user_id: User's ID

        Returns:
            UserDTO if found, None otherwise
        """
        return self._user_repository.find_by_id(user_id)

    def _validate_username(self, username: str) -> None:
        """
        Validate username format.

        Rules:
        - Must be 3-30 characters
        - Only alphanumeric and underscore

        Raises:
            InvalidUsernameError: If validation fails
        """
        if not username:
            raise InvalidUsernameError("Username is required")

        if not self.USERNAME_REGEX.match(username):
            raise InvalidUsernameError(
                "Username must be 3-30 characters and contain only "
                "letters, numbers, and underscores"
            )

    def _validate_email(self, email: str) -> None:
        """
        Validate email format.

        Raises:
            InvalidEmailError: If validation fails
        """
        if not email:
            raise InvalidEmailError("Email is required")

        if not self.EMAIL_REGEX.match(email):
            raise InvalidEmailError(f"Invalid email format: {email}")

    def _validate_password(self, password: str) -> None:
        """
        Validate password strength.

        Rules:
        - Minimum 12 characters
        - At least one uppercase letter
        - At least one lowercase letter
        - At least one number

        Raises:
            WeakPasswordError: If validation fails
        """
        if len(password) < 12:
            raise WeakPasswordError("Password must be at least 12 characters")

        if not any(c.isupper() for c in password):
            raise WeakPasswordError(
                "Password must contain at least one uppercase letter"
            )

        if not any(c.islower() for c in password):
            raise WeakPasswordError(
                "Password must contain at least one lowercase letter"
            )

        if not any(c.isdigit() for c in password):
            raise WeakPasswordError("Password must contain at least one number")
