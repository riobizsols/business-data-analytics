# Authentication System Documentation

## Overview

The Business Data Analytics application now includes a complete authentication and user management system with the following features:

- User login/logout
- Session management with JWT-like tokens
- Password hashing (bcrypt)
- Account locking after failed login attempts
- Admin user management interface
- Role-based access control (Admin vs Regular User)
- Audit logging

## Database Tables

### `users`
- Stores user accounts with credentials
- Fields: username, email, password_hash, full_name, is_admin, is_active, is_locked
- Tracks failed login attempts and last login time

### `user_sessions`
- Manages active user sessions
- Tokens expire after 24 hours
- Tracks IP address and user agent

### `audit_log`
- Records all significant user actions
- Includes: login/logout, user creation/modification, password changes

## Default Credentials

**Username:** `admin`  
**Password:** `admin123`

⚠️ **Important:** Change the default admin password immediately in production!

## API Endpoints

### Public Endpoints (No Authentication Required)

#### POST `/auth/login`
Login with username and password.

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "access_token": "token_here",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@bdataui.com",
    "full_name": "System Administrator",
    "is_admin": true,
    "is_active": true,
    "is_locked": false
  }
}
```

### Authenticated Endpoints (Require Bearer Token)

#### POST `/auth/logout`
Logout and invalidate current session.

**Headers:**
```
Authorization: Bearer {token}
```

#### GET `/auth/me`
Get current user information.

**Headers:**
```
Authorization: Bearer {token}
```

### Admin-Only Endpoints

#### GET `/auth/users`
List all users in the system.

**Headers:**
```
Authorization: Bearer {token}
X-API-Key: dev-key-12345
```

#### POST `/auth/users`
Create a new user account.

**Request Body:**
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "secure123",
  "full_name": "New User",
  "is_admin": false
}
```

#### PATCH `/auth/users/{user_id}`
Update user information (email, full_name, is_admin).

**Request Body:**
```json
{
  "email": "updated@example.com",
  "full_name": "Updated Name",
  "is_admin": true
}
```

#### PATCH `/auth/users/{user_id}/password`
Reset a user's password.

**Request Body:**
```json
{
  "password": "newsecurepassword"
}
```

#### PATCH `/auth/users/{user_id}/lock`
Lock or unlock a user account.

**Request Body:**
```json
{
  "is_locked": true
}
```

#### DELETE `/auth/users/{user_id}`
Delete a user account (cannot delete own account).

#### GET `/auth/audit-log`
Get audit log of recent actions.

**Query Parameters:**
- `limit` (optional): Number of records to return (default: 100)

## Frontend Routes

### `/login`
Public login page. Users are redirected here if not authenticated.

### `/admin/users`
Admin-only user management interface. Features:
- View all users with their status
- Create new users
- Reset passwords
- Lock/unlock accounts
- Delete users
- See last login times

## Security Features

### Password Security
- Passwords hashed using bcrypt
- Minimum length: 6 characters
- Passwords never stored in plain text

### Account Locking
- After 5 failed login attempts, account is automatically locked
- Only admins can unlock accounts
- Failed attempt counter resets on successful login

### Session Management
- Tokens expire after 24 hours
- All sessions revoked when:
  - User password is changed
  - User account is locked
  - Admin manually revokes sessions

### Role-Based Access
- **Regular Users:** Can access all company/director data
- **Admins:** Additionally can manage users and access audit logs

### Audit Trail
- All significant actions are logged:
  - Login/logout events
  - User creation/modification
  - Password changes
  - Account lock/unlock
  - User deletions

## Frontend Integration

### AuthContext
Provides authentication state throughout the app:

```tsx
import { useAuth } from "@/contexts/AuthContext";

function MyComponent() {
  const { user, token, login, logout, isLoading } = useAuth();
  
  // user: Current user object or null
  // token: Authentication token
  // login(username, password): Login function
  // logout(): Logout function
  // isLoading: Loading state
}
```

### AuthGuard Component
Protects routes that require authentication:

```tsx
import AuthGuard from "@/components/AuthGuard";

export default function ProtectedPage() {
  return (
    <AuthGuard>
      {/* Your protected content */}
    </AuthGuard>
  );
}
```

### Checking Admin Permissions
```tsx
const { user } = useAuth();

if (user?.is_admin) {
  // Show admin-only features
}
```

## Navigation Changes

The navigation bar now includes:
- Username display with admin badge
- User Management icon (admins only)
- Logout button
- Navigation hidden on login page and when not authenticated

## Usage Workflow

1. **Initial Setup:**
   - Database migration creates tables and default admin user
   - Admin logs in with default credentials

2. **Admin Creates Users:**
   - Navigate to User Management (gear icon)
   - Click "Create User"
   - Fill in user details and set permissions
   - Users receive their credentials

3. **Users Log In:**
   - Navigate to `/login`
   - Enter credentials
   - On success, redirected to dashboard

4. **User Management:**
   - Admins can lock accounts if needed
   - Reset passwords for users who forget
   - Delete inactive users
   - View audit log for security monitoring

## Environment Variables

No additional environment variables required. The system uses existing:
- `DATABASE_URL`: PostgreSQL connection
- `API_KEY`: Optional API key for backend routes

## Migration Instructions

The authentication system is installed by running:

```bash
# Using Docker
Get-Content backend/migrations/003_create_auth_tables.sql | docker exec -i bdata-postgres-1 psql -U bdata_user -d bdata_db

# Or using psql directly
psql -h localhost -U bdata_user -d bdata_db -f backend/migrations/003_create_auth_tables.sql
```

## Python Dependencies

Required packages (already installed):
- `passlib[bcrypt]`: Password hashing
- `python-multipart`: Form data handling

## Security Best Practices

1. **Change Default Password:** Immediately change admin password after installation
2. **Use Strong Passwords:** Enforce minimum 8-10 characters in production
3. **Regular Audits:** Review audit logs periodically
4. **Token Expiry:** Current 24-hour expiry is suitable for most use cases
5. **HTTPS:** Always use HTTPS in production
6. **Database Backups:** Include auth tables in backup strategy

## Troubleshooting

### "Account is locked" Error
- Admin must unlock the account in User Management
- Or reset failed attempts in database:
  ```sql
  UPDATE users SET is_locked = false, failed_login_attempts = 0 WHERE username = 'username';
  ```

### Session Expired
- Users need to log in again after 24 hours
- Sessions are also invalidated on password change

### Cannot Access Admin Features
- Verify user has `is_admin = true` in database
- Check that user is logged in with admin account

## Future Enhancements

Potential improvements for production:
- Email notifications for password resets
- Two-factor authentication (2FA)
- Password complexity requirements
- Session management UI
- IP whitelist/blacklist
- Rate limiting on login attempts
- OAuth integration (Google, Microsoft, etc.)

## API Testing

Example using curl:

```bash
# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Get current user (replace TOKEN)
curl http://localhost:8000/auth/me \
  -H "Authorization: Bearer TOKEN"

# List users (admin only)
curl http://localhost:8000/auth/users \
  -H "Authorization: Bearer TOKEN" \
  -H "X-API-Key: dev-key-12345"
```
