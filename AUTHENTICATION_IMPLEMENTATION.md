# Authentication Implementation - Frontend

## Overview
Implementasi lengkap sistem autentikasi frontend yang terintegrasi dengan backend Lihatin-Go API.

## File yang Dibuat/Dimodifikasi

### 1. API Service Layer
**File**: `lib/api/auth.ts`

Service layer untuk komunikasi dengan backend API. Mencakup:
- Type definitions sesuai dengan backend DTOs
- Fungsi `login()` - Autentikasi user
- Fungsi `register()` - Registrasi user baru
- Fungsi `forgotPassword()` - Request reset password
- Helper functions untuk token management (save, get, clear)
- Helper functions untuk user data management
- Function `isAuthenticated()` untuk check status login

### 2. Environment Configuration
**File**: `.env.local`

Konfigurasi untuk Backend API URL:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

**Note**: Sesuaikan URL sesuai dengan backend server yang digunakan.

### 3. Login Page
**File**: `app/auth/login/page.tsx`

Features:
- Form dengan email/username dan password
- Client-side validation
- Loading state dengan spinner
- Toast notifications untuk success/error
- Redirect otomatis:
  - Ke `/auth/verify-login` jika TOTP enabled
  - Ke `/` (home) jika login berhasil
- Token dan user data disimpan ke localStorage
- "Keep me signed in" checkbox (UI ready, logic bisa ditambahkan)

Toast Messages:
- ✅ Success: "Welcome back, {firstName}!"
- ❌ Error: "Invalid credentials. Please try again."
- ⚠️ Validation errors untuk field kosong atau invalid

### 4. Register Page
**File**: `app/auth/register/page.tsx`

Features:
- Form dengan first_name, last_name, username, email, password
- Confirm password validation
- Secret code field (optional)
- Terms & Conditions checkbox (required)
- Comprehensive client-side validation:
  - Name length (2-50 characters)
  - Username (3-30 characters, alphanumeric only)
  - Email format validation
  - Password complexity (8-50 chars, must have uppercase, lowercase, number, special char)
  - Password match confirmation
- Loading state dengan spinner
- Toast notifications untuk success/error
- Redirect ke `/auth/check-email` setelah berhasil

Toast Messages:
- ✅ Success: "Please check your email to verify your account"
- ❌ Error: Specific validation errors atau "An error occurred. Please try again."

### 5. Forgot Password Page
**File**: `app/auth/forgot-password/page.tsx`

Features:
- Form dengan email input
- Email format validation
- Loading state dengan spinner
- Toast notifications
- Redirect ke `/auth/check-email` setelah berhasil
- Backend always returns success (anti email enumeration)

Toast Messages:
- ✅ Success: "If an account with that email exists, a password reset link has been sent"
- ❌ Error: "Unable to send reset link. Please try again."

## Backend API Endpoints

### Login
```
POST /api/v1/auth/login
Content-Type: application/json

{
  "email_or_username": "string",
  "password": "string"
}

Response:
{
  "success": true,
  "data": {
    "token": {
      "access_token": "string",
      "refresh_token": "string"
    },
    "user": {
      "id": "uuid",
      "username": "string",
      "first_name": "string",
      "last_name": "string",
      "email": "string",
      "avatar": "string",
      "is_premium": boolean,
      "created_at": "string"
    },
    "auth": {
      "id": "uuid",
      "user_id": "uuid",
      "is_email_verified": boolean,
      "is_totp_enabled": boolean,
      "last_login_at": "string"
    }
  },
  "message": "string",
  "error": null
}
```

### Register
```
POST /api/v1/auth/register
Content-Type: application/json

{
  "first_name": "string",
  "last_name": "string",
  "username": "string",
  "email": "string",
  "password": "string"
}

Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "string",
      "first_name": "string",
      "last_name": "string",
      "email": "string",
      "is_premium": boolean,
      "created_at": "string"
    },
    "message": "string"
  },
  "message": "Registration successful",
  "error": null
}
```

### Forgot Password
```
POST /api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "string"
}
// OR
{
  "username": "string"
}

Response (always 200 OK):
{
  "success": true,
  "data": null,
  "message": "If an account with that email exists, a password reset link has been sent",
  "error": null
}
```

## Validation Rules

### Login
- Email/Username: Required, min 3 chars
- Password: Required, min 8 chars

### Register
- First Name: Required, 2-50 chars
- Last Name: Required, 2-50 chars
- Username: Required, 3-30 chars, alphanumeric only
- Email: Required, valid email format
- Password: Required, 8-50 chars, must contain:
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 number
  - At least 1 special character (@$!%*?&)
- Confirm Password: Must match password
- Terms & Conditions: Must be checked

### Forgot Password
- Email: Required, valid email format

## Error Handling

Semua error dari backend ditangani dengan:
1. Try-catch block
2. Toast notification dengan pesan error
3. Console.error untuk debugging
4. Loading state yang di-reset

Error responses dari backend akan menampilkan:
- `message` field sebagai description di toast
- Field-specific errors jika ada di `error` object

## Token Management

Tokens disimpan di localStorage:
- `access_token`: JWT token untuk authenticated requests
- `refresh_token`: Token untuk refresh access token
- `user`: User data (JSON string)

Helper functions tersedia:
- `saveTokens(accessToken, refreshToken)`
- `getAccessToken()`
- `getRefreshToken()`
- `clearTokens()`
- `saveUserData(user)`
- `getUserData()`
- `clearUserData()`
- `isAuthenticated()`: Check apakah user sudah login

## User Flow

### Login Flow
1. User mengisi form login
2. Client-side validation
3. API call ke `/auth/login`
4. Jika success:
   - Save tokens & user data
   - Check TOTP status
   - Redirect ke verify page (jika TOTP) atau home
5. Jika error: Show toast notification

### Register Flow
1. User mengisi form register
2. Comprehensive client-side validation
3. API call ke `/auth/register`
4. Jika success:
   - Show success toast
   - Redirect ke check-email page
5. Jika error: Show toast notification

### Forgot Password Flow
1. User mengisi email
2. Email validation
3. API call ke `/auth/forgot-password`
4. Show success toast (always, untuk security)
5. Redirect ke check-email page

## Next Steps

### TODO: Features yang bisa ditambahkan
1. **Refresh Token Logic**
   - Implement auto-refresh when access token expires
   - Add interceptor untuk handle 401 responses

2. **Persistent Login**
   - Implement "Keep me signed in" functionality
   - Use secure cookies atau extend token expiry

3. **Social Login**
   - Add Google OAuth
   - Add GitHub OAuth

4. **Password Strength Indicator**
   - Visual indicator untuk password complexity
   - Real-time feedback saat typing

5. **Email Verification Status**
   - Show banner jika email belum diverifikasi
   - Add resend verification email button

6. **Protected Routes**
   - Create middleware untuk check authentication
   - Redirect ke login jika belum authenticated

7. **User Profile Management**
   - Update profile page
   - Change password page
   - Account settings

8. **TOTP Implementation**
   - Setup TOTP page
   - Verify TOTP page
   - Recovery codes management

## Security Considerations

1. **Token Storage**: Tokens disimpan di localStorage (consider menggunakan httpOnly cookies untuk production)
2. **HTTPS Only**: Pastikan semua communication via HTTPS di production
3. **CORS**: Backend harus configure CORS dengan benar
4. **XSS Protection**: React secara default protect dari XSS, tapi tetap validate user input
5. **Password Complexity**: Enforced di client dan server
6. **Rate Limiting**: Backend sudah implement rate limiting untuk forgot password

## Testing

### Manual Testing Checklist
- [ ] Login dengan credentials valid
- [ ] Login dengan credentials invalid
- [ ] Register dengan data valid
- [ ] Register dengan email yang sudah ada
- [ ] Register dengan password yang weak
- [ ] Forgot password dengan email valid
- [ ] Forgot password dengan email invalid
- [ ] Toast notifications tampil dengan benar
- [ ] Loading states berfungsi
- [ ] Redirects berfungsi dengan benar
- [ ] Validation errors tampil dengan jelas

### Backend Requirements
Pastikan backend sudah running dan:
- [ ] CORS enabled untuk frontend URL
- [ ] Environment variables configured
- [ ] Database connected
- [ ] Redis connected (untuk session)
- [ ] Email service configured

## Environment Setup

1. Copy `.env.local` dan sesuaikan `NEXT_PUBLIC_API_URL`
2. Install dependencies: `npm install` atau `yarn install`
3. Jalankan dev server: `npm run dev` atau `yarn dev`
4. Pastikan backend API sudah running

## Troubleshooting

### CORS Error
- Pastikan backend configure CORS dengan benar
- Check `Access-Control-Allow-Origin` header di response

### Network Error
- Check apakah backend server sudah running
- Verify `NEXT_PUBLIC_API_URL` di `.env.local`
- Check browser console untuk error details

### Token Not Saved
- Check browser localStorage
- Verify browser tidak dalam private/incognito mode
- Check console untuk errors

### Toast Not Showing
- Verify Sonner toaster sudah di-configure di layout
- Check import dari `sonner` package

---

**Created**: November 16, 2025
**Last Updated**: November 16, 2025
**Version**: 1.0.0
