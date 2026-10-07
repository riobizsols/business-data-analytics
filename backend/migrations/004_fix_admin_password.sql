-- Fix admin user password with proper bcrypt hash
-- Password: admin123

-- Delete old admin user
DELETE FROM users WHERE username = 'admin';

-- Insert admin with new bcrypt hash (using bcrypt library directly)
-- This hash is for "admin123" using bcrypt
INSERT INTO users (username, email, password_hash, full_name, is_admin, is_active)
VALUES (
    'admin',
    'admin@bdataui.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeweX5BZiPKN3bWzW',
    'System Administrator',
    true,
    true
);
