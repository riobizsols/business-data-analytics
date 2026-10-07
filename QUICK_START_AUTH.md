# 🚀 Quick Start - Authentication System

## Prerequisites Check

Ensure these are running:
- ✅ PostgreSQL (Docker container: bdata-postgres-1)
- ✅ Redis (Docker container: bdata-redis-1)
- ✅ Backend server (http://localhost:8000)
- ✅ Frontend server (http://localhost:5173)

---

## 🎯 Quick Test (2 minutes)

### Step 1: Test Backend API
```powershell
# Run the test script
.\test_auth.ps1
```

Expected output: All tests pass ✓

### Step 2: Login to Frontend
1. Open browser: http://localhost:5173/login
2. Enter credentials:
   - **Username:** `admin`
   - **Password:** `admin123`
3. Click "Sign In"

### Step 3: Verify Access
You should see:
- Dashboard with company/director stats
- Navigation bar with your username
- Logout button visible

### Step 4: Access Admin Panel (Admin Only)
1. Click the user icon (👤) in navigation
2. Or visit: http://localhost:5173/admin/users
3. You should see:
   - List of all users
   - Create User button
   - User management actions

---

## 🔐 First-Time Setup Actions

### ⚠️ IMPORTANT: Change Admin Password

1. Go to http://localhost:5173/admin/users
2. Click the **key icon** (🔑) next to admin user
3. Enter new secure password (twice)
4. Click "Update Password"
5. You'll be logged out - login again with new password

### Create Additional Users

1. Click "Create User" button
2. Fill in:
   - Username (unique)
   - Email (unique)
   - Password (min 6 characters)
   - Full Name (optional)
   - Check "Administrator privileges" if needed
3. Click "Create User"

---

## 🧪 Quick Validation Checklist

- [ ] Can login with admin/admin123
- [ ] Dashboard loads after login
- [ ] Can access Companies page
- [ ] Can access Directors page
- [ ] Can access Batch Operations page
- [ ] Admin can see User Management icon
- [ ] Admin can access /admin/users page
- [ ] Can create a new user
- [ ] Can logout successfully
- [ ] Cannot access pages after logout (redirects to login)
- [ ] New user can login with their credentials

---

## 🛠️ Troubleshooting

### "Backend not running"
```bash
cd backend
python -m uvicorn src.main:app --reload
```

### "Frontend not running"
```bash
cd frontend
npm run dev
```

### "Invalid credentials" (but they're correct)
- Check database migration ran successfully
- Verify default admin user exists:
  ```powershell
  docker exec -i bdata-postgres-1 psql -U bdata_user -d bdata_db -c "SELECT username, is_admin FROM users;"
  ```

### "Token invalid" errors
- Clear browser localStorage
- Logout and login again
- Check token expiration (24 hours)

### "Cannot access admin pages"
- Verify user has `is_admin = true`
- Check you're logged in
- Try clearing cache and re-login

---

## 📱 Mobile Testing

1. Open http://localhost:5173/login on mobile
2. Login should work on mobile browsers
3. Navigation menu should be responsive
4. All features accessible via hamburger menu

---

## 🎓 User Training Points

### For Regular Users
- Login at /login
- All pages require authentication
- Logout when done for security
- Cannot access admin features

### For Administrators
- Same as regular users, PLUS:
- Can create new users
- Can reset any user's password
- Can lock/unlock user accounts
- Can delete users (except themselves)
- Can view audit logs
- Cannot lock or delete own account

---

## 📊 What's Protected

### Public (No Auth Required)
- `/login` - Login page
- `/auth/login` - Login API
- `/health` - Health check API

### Protected (Auth Required)
- `/` - Dashboard
- `/companies` - Companies list
- `/directors` - Directors list
- `/batch/*` - Batch operations
- All API endpoints (require X-API-Key + Bearer token)

### Admin Only
- `/admin/users` - User management
- `/auth/users` - User management APIs
- `/auth/audit-log` - Audit log

---

## 🔍 Database Quick Check

View all users:
```powershell
docker exec -i bdata-postgres-1 psql -U bdata_user -d bdata_db -c "SELECT id, username, email, is_admin, is_active, is_locked FROM users;"
```

View active sessions:
```powershell
docker exec -i bdata-postgres-1 psql -U bdata_user -d bdata_db -c "SELECT user_id, expires_at, ip_address FROM user_sessions ORDER BY expires_at DESC LIMIT 5;"
```

View recent audit events:
```powershell
docker exec -i bdata-postgres-1 psql -U bdata_user -d bdata_db -c "SELECT action, created_at, ip_address FROM audit_log ORDER BY created_at DESC LIMIT 10;"
```

---

## ✅ Success Indicators

You know it's working when:
1. ✓ Can login with admin/admin123
2. ✓ Redirected to dashboard after login
3. ✓ Navigation shows username and logout button
4. ✓ Cannot access pages when logged out
5. ✓ Admin can see and use User Management
6. ✓ Logout invalidates the session
7. ✓ New users can be created and login
8. ✓ Password resets work
9. ✓ Account locking works
10. ✓ Audit log shows events

---

## 🎉 You're All Set!

The authentication system is fully functional. Start using the application securely!

**Remember to:**
- Change the default admin password
- Create user accounts for your team
- Review audit logs regularly
- Keep sessions secure

Happy analyzing! 📊🔐
