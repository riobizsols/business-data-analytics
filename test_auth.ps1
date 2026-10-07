# Authentication System Test Script

Write-Host "Testing Business Data Analytics Authentication System" -ForegroundColor Cyan
Write-Host "=" * 60

# Test 1: Health Check
Write-Host "`nTest 1: Backend Health Check" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method GET
    Write-Host "✓ Backend is running" -ForegroundColor Green
    Write-Host "  Status: $($health.status)"
} catch {
    Write-Host "✗ Backend is not running" -ForegroundColor Red
    Write-Host "  Please start the backend server first"
    exit 1
}

# Test 2: Login with Admin
Write-Host "`nTest 2: Login with Default Admin" -ForegroundColor Yellow
try {
    $loginBody = @{
        username = "admin"
        password = "admin123"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "http://localhost:8000/auth/login" `
        -Method POST `
        -Body $loginBody `
        -ContentType "application/json"
    
    $token = $loginResponse.access_token
    $user = $loginResponse.user
    
    Write-Host "✓ Login successful" -ForegroundColor Green
    Write-Host "  Username: $($user.username)"
    Write-Host "  Email: $($user.email)"
    Write-Host "  Is Admin: $($user.is_admin)"
    Write-Host "  Token (first 20 chars): $($token.Substring(0, 20))..."
} catch {
    Write-Host "✗ Login failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)"
    exit 1
}

# Test 3: Get Current User
Write-Host "`nTest 3: Get Current User Info" -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    
    $currentUser = Invoke-RestMethod -Uri "http://localhost:8000/auth/me" `
        -Method GET `
        -Headers $headers
    
    Write-Host "✓ User info retrieved" -ForegroundColor Green
    Write-Host "  Username: $($currentUser.username)"
    Write-Host "  Full Name: $($currentUser.full_name)"
} catch {
    Write-Host "✗ Failed to get user info" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)"
}

# Test 4: List All Users (Admin Only)
Write-Host "`nTest 4: List All Users (Admin Access)" -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "X-API-Key" = "dev-key-12345"
    }
    
    $users = Invoke-RestMethod -Uri "http://localhost:8000/auth/users" `
        -Method GET `
        -Headers $headers
    
    Write-Host "✓ Users list retrieved" -ForegroundColor Green
    Write-Host "  Total Users: $($users.Count)"
    foreach ($u in $users) {
        $status = if ($u.is_locked) { "LOCKED" } elseif ($u.is_active) { "Active" } else { "Inactive" }
        $role = if ($u.is_admin) { "Admin" } else { "User" }
        Write-Host "  - $($u.username) ($role, $status)"
    }
} catch {
    Write-Host "✗ Failed to get users list" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)"
}

# Test 5: Test Invalid Login
Write-Host "`nTest 5: Test Invalid Credentials" -ForegroundColor Yellow
try {
    $invalidBody = @{
        username = "admin"
        password = "wrongpassword"
    } | ConvertTo-Json

    Invoke-RestMethod -Uri "http://localhost:8000/auth/login" `
        -Method POST `
        -Body $invalidBody `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Host "✗ Invalid login should have failed" -ForegroundColor Red
} catch {
    Write-Host "✓ Invalid login correctly rejected" -ForegroundColor Green
}

# Test 6: Logout
Write-Host "`nTest 6: Logout" -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    
    $logoutResponse = Invoke-RestMethod -Uri "http://localhost:8000/auth/logout" `
        -Method POST `
        -Headers $headers
    
    Write-Host "✓ Logout successful" -ForegroundColor Green
    Write-Host "  Message: $($logoutResponse.message)"
} catch {
    Write-Host "✗ Logout failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)"
}

# Test 7: Verify Token is Invalid After Logout
Write-Host "`nTest 7: Verify Token Invalidation" -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    
    Invoke-RestMethod -Uri "http://localhost:8000/auth/me" `
        -Method GET `
        -Headers $headers `
        -ErrorAction Stop
    
    Write-Host "✗ Token should be invalid after logout" -ForegroundColor Red
} catch {
    Write-Host "✓ Token correctly invalidated" -ForegroundColor Green
}

Write-Host "`n" + ("=" * 60)
Write-Host "Authentication System Tests Complete!" -ForegroundColor Cyan
Write-Host "`nNext Steps:"
Write-Host "1. Start frontend: cd frontend; npm run dev"
Write-Host "2. Visit: http://localhost:5173/login"
Write-Host "3. Login with: admin / admin123"
Write-Host "4. Access admin panel: http://localhost:5173/admin/users"
