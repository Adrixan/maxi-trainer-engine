"""
Integration tests for UserService using Testcontainers.

Demonstrates:
- Real database testing with PostgreSQL container
- pytest fixtures for test isolation
- Database initialization and cleanup
- Transaction rollback between tests
- Real HTTP requests
- End-to-end workflow testing
"""

import pytest
from sqlalchemy import create_engine, Column, Integer, String, DateTime, text
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import StaticPool
from datetime import datetime
from testcontainers.postgres import PostgresContainer
import requests
from typing import Generator

# Import the actual service (adjust path as needed)
# from user_service import UserService, UserDTO, PasswordHasher, UserRepository

Base = declarative_base()


class User(Base):
    """SQLAlchemy User model for integration testing."""
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    username = Column(String(30), nullable=False, unique=True)
    email = Column(String(255), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# ======================================
# Fixtures
# ======================================

@pytest.fixture(scope='session')
def postgres_container() -> Generator[PostgresContainer, None, None]:
    """
    Start PostgreSQL container for the entire test session.
    
    Benefits of Testcontainers:
    - Real database engine (not mocked)
    - Isolated test environment
    - Automatic cleanup
    - CI/CD compatibility
    """
    with PostgresContainer('postgres:15-alpine') as container:
        # Wait for container to be ready
        container.get_connection_url()
        yield container


@pytest.fixture(scope='session')
def database_url(postgres_container: PostgresContainer) -> str:
    """Get database connection URL."""
    return postgres_container.get_connection_url(driver='psycopg2')


@pytest.fixture(scope='session')
def engine(database_url: str):
    """Create SQLAlchemy engine."""
    engine = create_engine(
        database_url,
        poolclass=StaticPool,  # Single connection for tests
        echo=True  # SQL logging
    )
    
    # Create all tables
    Base.metadata.create_all(engine)
    
    yield engine
    
    # Cleanup
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture
def db_session(engine):
    """
    Create a new database session for each test.
    
    Uses transaction rollback for test isolation:
    - Each test gets a clean database state
    - Fast (no need to drop/recreate tables)
    - Reliable isolation
    """
    connection = engine.connect()
    transaction = connection.begin()
    session = sessionmaker(bind=connection)()
    
    yield session
    
    # Rollback transaction after test
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def password_hasher():
    """Create password hasher for testing."""
    class TestPasswordHasher:
        def hash(self, password: str) -> str:
            # Use a simple hash for testing
            # In production, use bcrypt/argon2
            return f"hashed_{password}"
        
        def verify(self, password: str, hashed: str) -> bool:
            return self.hash(password) == hashed
    
    return TestPasswordHasher()


@pytest.fixture
def user_repository(db_session):
    """Create user repository with real database."""
    class SQLAlchemyUserRepository:
        def __init__(self, session):
            self.session = session
        
        def save(self, username: str, email: str, password_hash: str):
            user = User(
                username=username,
                email=email,
                password_hash=password_hash
            )
            self.session.add(user)
            self.session.commit()
            self.session.refresh(user)
            
            # Convert to DTO (simplified)
            from dataclasses import dataclass
            
            @dataclass
            class UserDTO:
                id: int
                username: str
                email: str
                created_at: datetime
            
            return UserDTO(
                id=user.id,
                username=user.username,
                email=user.email,
                created_at=user.created_at
            )
        
        def find_by_email(self, email: str):
            user = self.session.query(User).filter(User.email == email).first()
            if not user:
                return None
            
            from dataclasses import dataclass
            
            @dataclass
            class UserDTO:
                id: int
                username: str
                email: str
                created_at: datetime
            
            return UserDTO(
                id=user.id,
                username=user.username,
                email=user.email,
                created_at=user.created_at
            )
        
        def find_by_id(self, user_id: int):
            user = self.session.query(User).filter(User.id == user_id).first()
            if not user:
                return None
            
            from dataclasses import dataclass
            
            @dataclass
            class UserDTO:
                id: int
                username: str
                email: str
                created_at: datetime
            
            return UserDTO(
                id=user.id,
                username=user.username,
                email=user.email,
                created_at=user.created_at
            )
    
    return SQLAlchemyUserRepository(db_session)


# ======================================
# Integration Tests
# ======================================

class TestUserServiceIntegration:
    """Integration tests with real database."""
    
    def test_create_user_persists_to_database(
        self,
        user_repository,
        password_hasher,
        db_session
    ):
        """Should persist user to real database."""
        # Create user
        user = user_repository.save(
            username='testuser',
            email='test@example.com',
            password_hash=password_hasher.hash('SecurePass123')
        )
        
        # Verify in database
        db_user = db_session.query(User).filter(User.id == user.id).first()
        assert db_user is not None
        assert db_user.username == 'testuser'
        assert db_user.email == 'test@example.com'
        assert db_user.password_hash.startswith('hashed_')
    
    def test_create_duplicate_user_fails(
        self,
        user_repository,
        password_hasher
    ):
        """Should prevent duplicate email addresses."""
        # Create first user
        user_repository.save(
            username='user1',
            email='duplicate@example.com',
            password_hash=password_hasher.hash('Pass123')
        )
        
        # Attempt to create second user with same email
        from sqlalchemy.exc import IntegrityError
        with pytest.raises(IntegrityError):
            user_repository.save(
                username='user2',
                email='duplicate@example.com',
                password_hash=password_hasher.hash('Pass456')
            )
    
    def test_find_user_by_email(
        self,
        user_repository,
        password_hasher
    ):
        """Should find user by email address."""
        # Create user
        created_user = user_repository.save(
            username='findme',
            email='findme@example.com',
            password_hash=password_hasher.hash('Pass123')
        )
        
        # Find by email
        found_user = user_repository.find_by_email('findme@example.com')
        
        assert found_user is not None
        assert found_user.id == created_user.id
        assert found_user.username == 'findme'
    
    def test_concurrent_user_creation(
        self,
        user_repository,
        password_hasher
    ):
        """Should handle concurrent operations correctly."""
        import concurrent.futures
        
        def create_user(index):
            try:
                return user_repository.save(
                    username=f'user{index}',
                    email=f'user{index}@example.com',
                    password_hash=password_hasher.hash(f'Pass{index}')
                )
            except Exception as e:
                return None
        
        # Create 10 users concurrently
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(create_user, i) for i in range(10)]
            results = [f.result() for f in concurrent.futures.as_wait(futures)]
        
        # All should succeed
        successful = [r for r in results if r is not None]
        assert len(successful) == 10
    
    def test_database_connection_pooling(
        self,
        database_url,
        password_hasher
    ):
        """Should handle multiple connections efficiently."""
        # Create new engine with connection pool
        from sqlalchemy import create_engine
        engine = create_engine(
            database_url,
            pool_size=5,
            max_overflow=10
        )
        
        Session = sessionmaker(bind=engine)
        
        # Create multiple sessions
        sessions = [Session() for _ in range(10)]
        
        try:
            # Perform operations on each session
            for i, session in enumerate(sessions):
                user = User(
                    username=f'pooltest{i}',
                    email=f'pooltest{i}@example.com',
                    password_hash=password_hasher.hash('Pass123')
                )
                session.add(user)
                session.commit()
            
            # Verify all users created
            verify_session = Session()
            count = verify_session.query(User).filter(
                User.username.like('pooltest%')
            ).count()
            assert count == 10
            verify_session.close()
            
        finally:
            # Cleanup
            for session in sessions:
                session.close()
            engine.dispose()


class TestUserAPIIntegration:
    """
    Integration tests for REST API (example).
    
    Assumes a running FastAPI/Flask application.
    In real tests, you'd start the app in a fixture.
    """
    
    @pytest.mark.skip("Requires running API server")
    def test_create_user_via_api(self):
        """Should create user via HTTP API."""
        response = requests.post(
            'http://localhost:8000/api/users',
            json={
                'username': 'apiuser',
                'email': 'api@example.com',
                'password': 'SecurePass123'
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data['username'] == 'apiuser'
        assert data['email'] == 'api@example.com'
        assert 'id' in data
    
    @pytest.mark.skip("Requires running API server")
    def test_get_user_via_api(self):
        """Should retrieve user via HTTP API."""
        # Create user first
        create_response = requests.post(
            'http://localhost:8000/api/users',
            json={
                'username': 'getuser',
                'email': 'get@example.com',
                'password': 'SecurePass123'
            }
        )
        user_id = create_response.json()['id']
        
        # Get user
        response = requests.get(f'http://localhost:8000/api/users/{user_id}')
        
        assert response.status_code == 200
        data = response.json()
        assert data['id'] == user_id
        assert data['username'] == 'getuser'


# ======================================
# Performance Tests
# ======================================

class TestUserServicePerformance:
    """Performance and load testing."""
    
    @pytest.mark.slow
    def test_bulk_user_creation_performance(
        self,
        user_repository,
        password_hasher,
        db_session
    ):
        """Should handle bulk user creation efficiently."""
        import time
        
        start_time = time.time()
        
        # Create 1000 users
        for i in range(1000):
            user = User(
                username=f'bulk{i}',
                email=f'bulk{i}@example.com',
                password_hash=password_hasher.hash(f'Pass{i}')
            )
            db_session.add(user)
        
        db_session.commit()
        
        elapsed_time = time.time() - start_time
        
        # Should complete in reasonable time (< 5 seconds)
        assert elapsed_time < 5.0
        
        # Verify count
        count = db_session.query(User).filter(
            User.username.like('bulk%')
        ).count()
        assert count == 1000
