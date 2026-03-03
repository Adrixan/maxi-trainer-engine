"""
JWT Authentication Example - FastAPI with secure auth.

Demonstrates:
- JWT token generation and validation
- Password hashing with bcrypt
- Protected routes
- Refresh tokens
- Rate limiting
- Security headers
"""

from fastapi import FastAPI, Depends, HTTPException, status, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, timedelta
from typing import Optional
import jwt
import bcrypt
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Configuration
SECRET_KEY = "your-secret-key-change-in-production"  # Use environment variable
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7

app = FastAPI(title="Secure API with JWT")
security = HTTPBearer()
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ======================================
# Security Middleware
# ======================================

# CORS configuration - restrictive by default
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],  # Specific origins only
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
    max_age=3600,
)

# Trusted host middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["yourdomain.com", "*.yourdomain.com"]
)

# ======================================
# Models
# ======================================

class UserLogin(BaseModel):
    """Login credentials."""
    email: EmailStr
    password: str = Field(..., min_length=12)


class UserRegister(BaseModel):
    """Registration data."""
    username: str = Field(..., min_length=3, max_length=30)
    email: EmailStr
    password: str = Field(..., min_length=12)


class TokenResponse(BaseModel):
    """Authentication tokens."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenPayload(BaseModel):
    """JWT token payload."""
    sub: str  # Subject (user ID)
    exp: datetime  # Expiration
    type: str  # Token type (access/refresh)
    iat: datetime  # Issued at


# ======================================
# Password Hashing
# ======================================

class PasswordHasher:
    """Secure password hashing with bcrypt."""
    
    @staticmethod
    def hash(password: str) -> str:
        """Hash password with bcrypt."""
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    @staticmethod
    def verify(password: str, hashed: str) -> bool:
        """Verify password against hash."""
        return bcrypt.checkpw(
            password.encode('utf-8'),
            hashed.encode('utf-8')
        )


# ======================================
# JWT Token Management
# ======================================

class TokenManager:
    """JWT token generation and validation."""
    
    @staticmethod
    def create_access_token(user_id: str) -> str:
        """Create access token."""
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        payload = {
            "sub": user_id,
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "access"
        }
        return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    
    @staticmethod
    def create_refresh_token(user_id: str) -> str:
        """Create refresh token."""
        expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        payload = {
            "sub": user_id,
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "refresh"
        }
        return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    
    @staticmethod
    def decode_token(token: str) -> dict:
        """Decode and validate token."""
        try:
            payload = jwt.decode(
                token,
                SECRET_KEY,
                algorithms=[ALGORITHM],
                options={"verify_exp": True}
            )
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except jwt.JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )


# ======================================
# Dependencies
# ======================================

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security)
) -> str:
    """
    Dependency to get current authenticated user.
    
    Usage:
        @app.get("/protected")
        async def protected(user_id: str = Depends(get_current_user)):
            return {"user_id": user_id}
    """
    token = credentials.credentials
    payload = TokenManager.decode_token(token)
    
    # Verify token type
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )
    
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    
    return user_id


# ======================================
# Routes
# ======================================

@app.post("/auth/register", status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")  # Rate limit: 5 requests per minute
async def register(user_data: UserRegister) -> dict:
    """
    Register a new user.
    
    Security features:
    - Password hashing with bcrypt
    - Email validation
    - Rate limiting
    - Input validation
    """
    # In production, save to database
    # For demo, just return success
    
    hashed_password = PasswordHasher.hash(user_data.password)
    
    # Simulate user creation
    user_id = "user_123"  # Would come from database
    
    return {
        "message": "User registered successfully",
        "user_id": user_id,
        "username": user_data.username,
        "email": user_data.email
    }


@app.post("/auth/login", response_model=TokenResponse)
@limiter.limit("10/minute")  # Rate limit: 10 login attempts per minute
async def login(credentials: UserLogin) -> TokenResponse:
    """
    Authenticate user and return tokens.
    
    Security features:
    - Rate limiting for brute force protection
    - Secure password verification
    - JWT tokens
    - Refresh token for longer sessions
    """
    # In production, fetch user from database
    # For demo, simulate authentication
    
    # Example: Verify password
    # if not PasswordHasher.verify(credentials.password, stored_hash):
    #     raise HTTPException(
    #         status_code=status.HTTP_401_UNAUTHORIZED,
    #         detail="Incorrect email or password",
    #     )
    
    user_id = "user_123"  # Would come from database
    
    # Generate tokens
    access_token = TokenManager.create_access_token(user_id)
    refresh_token = TokenManager.create_refresh_token(user_id)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@app.post("/auth/refresh", response_model=TokenResponse)
async def refresh_token(
    credentials: HTTPAuthorizationCredentials = Security(security)
) -> TokenResponse:
    """
    Refresh access token using refresh token.
    
    Allows extending session without re-authentication.
    """
    token = credentials.credentials
    payload = TokenManager.decode_token(token)
    
    # Verify it's a refresh token
    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )
    
    user_id = payload.get("sub")
    
    # Generate new access token
    access_token = TokenManager.create_access_token(user_id)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=token,  # Keep same refresh token
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@app.post("/auth/logout")
async def logout(user_id: str = Depends(get_current_user)) -> dict:
    """
    Logout user (invalidate tokens).
    
    In production:
    - Add token to blacklist/revocation list
    - Use Redis for token blacklist with expiration
    - Clear refresh tokens from database
    """
    # Implement token revocation
    return {"message": "Successfully logged out"}


@app.get("/protected")
async def protected_route(user_id: str = Depends(get_current_user)) -> dict:
    """
    Example protected route requiring authentication.
    """
    return {
        "message": "This is a protected route",
        "user_id": user_id
    }


@app.get("/admin")
async def admin_route(
    user_id: str = Depends(get_current_user)
) -> dict:
    """
    Example admin-only route with role checking.
    
    In production:
    - Check user role from database
    - Implement RBAC (Role-Based Access Control)
    - Use additional dependency for role verification
    """
    # Example role check (would fetch from database)
    # if user_role != "admin":
    #     raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    return {
        "message": "Admin access granted",
        "user_id": user_id
    }


# ======================================
# Security Headers
# ======================================

@app.middleware("http")
async def add_security_headers(request, call_next):
    """Add security headers to all responses."""
    response = await call_next(request)
    
    # Security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    
    return response


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
