import hashlib
import os

# A simple secret key for hashing (can be overridden by env variable)
SECRET_SALT = os.getenv("SECRET_SALT", "westminster_crm_super_secret_salt")

def hash_password(password: str) -> str:
    """Hashes a password using SHA-256 and a secret salt."""
    if not password:
        return ""
    # To prevent double hashing
    if len(password) == 64 and all(c in "0123456789abcdef" for c in password.lower()):
        return password
    
    return hashlib.sha256((password + SECRET_SALT).encode('utf-8')).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plaintext password against the hashed one."""
    if not plain_password:
        return False
        
    # If the database still has plaintext passwords (migration case)
    if len(hashed_password) != 64:
        return plain_password == hashed_password
        
    return hash_password(plain_password) == hashed_password
