import sys
sys.path.insert(0, 'D:\\CursorPrograms\\BDataUI\\backend')

from datetime import datetime, timezone
from src.auth.security import verify_password, get_password_hash

# Test password hashing
print("Testing password functions...")
password = "admin123"

try:
    # Test hashing
    print(f"\n1. Hashing password: {password}")
    hash_result = get_password_hash(password)
    print(f"   Hash: {hash_result[:50]}...")
    
    # Test verification
    print(f"\n2. Verifying password against hash...")
    verify_result = verify_password(password, hash_result)
    print(f"   Verification result: {verify_result}")
    
    # Test with database hash
    db_hash = "$2b$12$O3j8/PwNLz6hpZDpFI5exeDG9PT8phzizgxhF3fOBeGXIcXhzhjri"
    print(f"\n3. Verifying against DB hash...")
    db_verify = verify_password(password, db_hash)
    print(f"   DB verification result: {db_verify}")
    
    print("\n✅ All tests passed!")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
