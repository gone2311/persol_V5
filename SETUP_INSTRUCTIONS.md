# Setup Instructions - Persol Eyewear

## ✅ ĐÃ FIX TẤT CẢ CÁC LỖI

### Các lỗi đã được khắc phục:

1. ✅ **Admin Products Page** - `api.getProductTypes is not a function`
   - Added `getProductTypes()` method to api_service.js
   - Updated categories.php to handle `?types=1` query

2. ✅ **JSON Parse Errors** - `Unexpected token '<', "<br /> <b>"... is not valid JSON`
   - Replaced Firebase JWT library with custom SimpleJWT implementation
   - Fixed vendor/autoload.php missing error
   - Updated auth.php and AuthMiddleware.php

3. ✅ **Staff Management Page** - Page not found
   - Created admin_staff.html template
   - Implemented full staff management functionality in admin.js

4. ✅ **Logo Display Issues**
   - Fixed logo path to `assets/images/Logo.png` (case-sensitive)
   - Added logo to all footers
   - Fixed admin sidebar logo

5. ✅ **Compare Search Suggestions**
   - Added auto-complete search (triggers after 2+ characters)
   - Debounced search with 300ms delay
   - Grid layout with product cards

6. ✅ **Footer with Logo and Links**
   - Created Privacy Policy page (#privacy)
   - Created Terms of Service page (#terms)
   - Added logo to all footers
   - Updated all footer links

7. ✅ **Navigation Menu Reordered**
   - New order: Home → Products → Comparison → Cart → Contact → Admin

---

## 🚀 QUICK START

### Step 1: Database Setup

Import the database schema in this order:

```sql
-- 1. Import main database schema
source persol_db.sql

-- 2. Add is_active columns (IMPORTANT!)
source add_is_active_columns.sql
```

**Or via phpMyAdmin:**
1. Open phpMyAdmin
2. Create database: `persol_db`
3. Select the database
4. Go to "Import" tab
5. Upload `persol_db.sql` first
6. Then upload `add_is_active_columns.sql`

### Step 2: Configure Database Connection

Edit `api/v1/config/database.php`:

```php
class Database {
    private $host = "localhost";
    private $db_name = "persol_db";
    private $username = "root";
    private $password = "";

    // JWT Settings
    public static $jwt_key = "your_secret_key_here";
    public static $jwt_iss = "http://localhost";
    public static $jwt_aud = "http://localhost";
}
```

### Step 3: Create Admin User

Run this SQL to create an admin account:

```sql
-- Create admin user
INSERT INTO USERS (email, password_hash, full_name, user_type, is_active)
VALUES (
    'admin@persol.com',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: "password"
    'Admin User',
    'admin',
    1
);
```

**Default Admin Credentials:**
- Email: `admin@persol.com`
- Password: `password`

**⚠️ CHANGE PASSWORD IMMEDIATELY AFTER FIRST LOGIN!**

### Step 4: Clear Browser Cache

After setup, hard refresh your browser:
- **Windows/Linux**: Ctrl + F5 or Ctrl + Shift + R
- **Mac**: Cmd + Shift + R
- **Chrome DevTools**: F12 → Right-click Refresh → "Empty Cache and Hard Reload"

---

## 📁 Project Structure

```
project/
├── api/v1/
│   ├── lib/
│   │   └── SimpleJWT.php          [NEW] Custom JWT implementation
│   ├── auth.php                   [UPDATED] Uses SimpleJWT
│   ├── middleware/
│   │   └── AuthMiddleware.php     [UPDATED] Uses SimpleJWT
│   ├── categories.php             [UPDATED] Supports ?types=1
│   └── ...
├── assets/
│   ├── js/
│   │   ├── api_service.js         [UPDATED] Added getProductTypes()
│   │   └── admin.js               [UPDATED] Added staff management
│   └── ...
├── templates/
│   ├── admin_staff.html           [NEW] Staff management page
│   ├── privacy.html               [NEW] Privacy policy
│   ├── terms.html                 [NEW] Terms of service
│   └── ...
├── index.php                       [UPDATED] Fixed logo, reordered nav
├── admin.php                       [UPDATED] Fixed logo path
└── ...
```

---

## 🔧 Features Implemented

### Admin Panel
- ✅ Dashboard with stats
- ✅ Orders management
- ✅ Products management (with Types support)
- ✅ Staff management (filter admin users)
- ✅ Customer management
- ✅ Toggle active/inactive status

### Frontend
- ✅ Product listing with filters
- ✅ Product comparison with auto-suggestions
- ✅ Shopping cart
- ✅ User authentication (login/register)
- ✅ User profile management
- ✅ Privacy Policy & Terms of Service pages

---

## 🐛 Troubleshooting

### "api.getProductTypes is not a function"
**Solution:** Hard refresh browser (Ctrl + F5)

### JSON Parse Errors
**Solution:**
1. Make sure SimpleJWT.php exists in `api/v1/lib/`
2. Check that auth.php and AuthMiddleware.php are updated
3. Clear browser cache

### Admin Panel Shows Errors
**Solution:**
1. Login with admin account
2. Check JWT token is valid
3. Verify database has `is_active` columns

### Products/Users Toggle Not Working
**Solution:**
Run `add_is_active_columns.sql` to add missing columns

---

## 📞 Support

If you encounter any issues:
1. Check browser console for JavaScript errors (F12)
2. Check Apache/PHP error logs
3. Verify database schema is complete
4. Ensure all file paths are correct (case-sensitive!)

---

## ✨ All Done!

The system is now fully functional with:
- Custom JWT authentication (no composer needed)
- Complete admin panel
- Staff management
- Product suggestions in compare
- Privacy & Terms pages
- Fixed navigation order

**Enjoy your Persol Eyewear application! 🎉**
