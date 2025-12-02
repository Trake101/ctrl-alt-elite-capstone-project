"""Authentication dependencies for Clerk."""
import os
import jwt
from jwt import PyJWKClient
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Get Clerk configuration
clerk_secret_key = os.getenv("CLERK_SECRET_KEY")
clerk_publishable_key = os.getenv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY") or os.getenv("CLERK_PUBLISHABLE_KEY")

if not clerk_secret_key:
    raise ValueError("CLERK_SECRET_KEY environment variable is required")

# Extract instance ID from publishable key if available
# Format: pk_test_xxxxx or pk_live_xxxxx
INSTANCE_ID = None
if clerk_publishable_key:
    parts = clerk_publishable_key.split("_")
    if len(parts) >= 3:
        INSTANCE_ID = parts[2]

# Construct JWKS URL for Clerk
# For development: https://{instance_id}.clerk.accounts.dev/.well-known/jwks.json
# For local development: https://clerk.{instance_id}.lcl.dev/.well-known/jwks.json
JWKS_URL = None
if INSTANCE_ID:
    # Try production URL first, fallback to local dev
    JWKS_URL = f"https://{INSTANCE_ID}.clerk.accounts.dev/.well-known/jwks.json"

# HTTP Bearer token security scheme
security = HTTPBearer()


async def verify_clerk_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    Verify Clerk session token and return decoded token payload.
    
    Clerk session tokens are JWT tokens that need to be verified using Clerk's JWKS endpoint.
    
    Args:
        credentials: HTTP Bearer token from Authorization header
        
    Returns:
        dict: Decoded JWT token payload
        
    Raises:
        HTTPException: If token is invalid or missing
    """
    try:
        token = credentials.credentials

        # Decode token without verification first to get issuer and algorithm
        unverified = jwt.decode(token, options={"verify_signature": False})
        algorithm = jwt.get_unverified_header(token).get("alg", "RS256")
        issuer = unverified.get("iss", "")

        # Extract instance ID from issuer URL
        # Format: https://{instance_id}.clerk.accounts.dev or https://clerk.{instance_id}.lcl.dev
        instance_id_from_token = None
        if ".clerk.accounts.dev" in issuer:
            instance_id_from_token = issuer.split("//")[1].split(".")[0]
        elif ".lcl.dev" in issuer:
            instance_id_from_token = issuer.split("clerk.")[1].split(".")[0] if "clerk." in issuer else None

        # Construct JWKS URL from token issuer or use configured one
        token_jwks_url = None
        if instance_id_from_token:
            token_jwks_url = f"https://{instance_id_from_token}.clerk.accounts.dev/.well-known/jwks.json"
        elif JWKS_URL:
            token_jwks_url = JWKS_URL

        # Clerk session tokens use RS256 and are verified via JWKS
        if algorithm == "RS256" and token_jwks_url:
            try:
                jwks_client = PyJWKClient(token_jwks_url)
                signing_key = jwks_client.get_signing_key_from_jwt(token)
                decoded_token = jwt.decode(
                    token,
                    signing_key.key,
                    algorithms=["RS256"],
                    options={"verify_exp": True, "verify_iat": True, "verify_aud": False}
                )
            except Exception as jwks_error:
                # If JWKS verification fails, log the error for debugging
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Token verification failed: {str(jwks_error)}",
                    headers={"WWW-Authenticate": "Bearer"},
                ) from jwks_error
        else:
            # Fallback: try verifying with secret key (for HS256 tokens)
            try:
                decoded_token = jwt.decode(
                    token,
                    clerk_secret_key,
                    algorithms=["HS256"],
                    options={"verify_exp": True, "verify_iat": True}
                )
            except jwt.InvalidSignatureError as exc:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Unable to verify token signature. Algorithm: {algorithm}, JWKS URL: {token_jwks_url}",
                    headers={"WWW-Authenticate": "Bearer"},
                ) from exc

        return decoded_token
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e


async def get_current_user_id(
    token_payload: dict = Depends(verify_clerk_token)
) -> str:
    """
    Extract and return the Clerk user ID from decoded token payload.

    Args:
        token_payload: Decoded JWT token payload from Clerk

    Returns:
        str: Clerk user ID (sub claim)
    """
    # Extract user_id from the token payload
    # Clerk JWT tokens contain 'sub' (subject) which is the user ID
    user_id = token_payload.get("sub") or token_payload.get("user_id")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unable to extract user ID from token",
        )
    return str(user_id)
