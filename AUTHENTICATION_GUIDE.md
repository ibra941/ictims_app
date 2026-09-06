# ICTIMS Authentication & Security Features

## Overview
This document describes the authentication, session management, and rate limiting features implemented in ICTIMS to ensure security and protect against unauthorized access and brute force attacks.

## Key Features Implemented

### 1. **Mandatory Login Requirement**
- ✅ All routes are protected with the `ProtectedRoute` component
- ✅ Unauthenticated users are redirected to `/login`
- ✅ Session is restored from localStorage on app load
- ✅ If session is expired, user must login again
- ✅ Only the `/login`, `/unauthorized`, and `/404` routes are public

### 2. **Session Expiration (30 Minutes)**

#### Frontend Implementation
- **Location**: `src/context/AuthContext.tsx`
- **Session Timeout**: 30 minutes of active session
- **Warning Period**: Shows expiration warning at 5 minutes remaining
- **Automatic Logout**: User is automatically logged out when session expires

**Features**:
- Session start time is tracked in localStorage (`ictims_session_start`)
- Session expiration is checked every 10 seconds
- User receives a warning modal at 5 minutes before expiration
- User can extend session or logout
- On successful login, session timer resets

**Session Expiration Warning Component**:
- **Location**: `src/components/SessionExpirationWarning.tsx`
- Displays modal with countdown timer
- Provides options to extend session or logout
- Shows remaining time in user-friendly format (seconds/minutes)

#### Backend Implementation
- **Location**: `backend/services/AuthService.php`
- Tokens include expiration timestamp (`exp` claim)
- SESSION_TIMEOUT_SECONDS = 1800 seconds (30 minutes)
- Token format: JWT-like structure with header, payload, and signature
- Payload includes `iat` (issued at) and `exp` (expiration time)

**Backend Verification**:
- `verifyToken()` method checks token expiration
- Expired tokens return 401 Unauthorized
- Can be called via `AuthController::verifyToken()` endpoint

### 3. **Login Rate Limiting**

#### Rate Limiting Rules
- **Max Attempts**: 5 failed login attempts
- **Attempt Window**: 15 minutes
- **Initial Lockout**: 1 minute
- **Lockout Multiplier**: 2x (lockout doubles with each subsequent lockout)
- **Maximum Lockout**: 24 hours

#### Lockout Progression
```
Attempts 1-4: Account active, warnings shown
Attempt 5:    Account locked for 1 minute
Attempt 6+:   Account locked for 2 minutes (doubled)
Further:      Lockout continues to double, capped at 24 hours
```

#### Frontend Implementation
- **Location**: `src/services/rateLimitService.ts`
- Tracks login attempts per username in localStorage
- Prevents login attempts when locked out
- Displays countdown timer showing when account will unlock
- Shows warning about remaining attempts (before lockout)
- Clears rate limit on successful login

**Service Methods**:
- `checkRateLimit(identifier)`: Check if login is allowed
- `recordFailedAttempt(identifier)`: Record failed login attempt
- `clearRateLimit(identifier)`: Clear rate limit (on successful login)
- `clearAllRateLimits()`: Admin function to reset all rate limits

**Storage Format**:
```javascript
// localStorage key: ictims_login_rate_limit_{md5_hash_of_username}
{
  attempts: number,
  firstAttemptTime: timestamp,
  lastAttemptTime: timestamp,
  lockedUntil?: timestamp  // Only if locked
}
```

#### Backend Implementation
- **Location**: `backend/services/AuthService.php`
- Rate limit data stored in temp files: `/tmp/ictims_ratelimit_{hash}.json`
- Same rate limiting logic as frontend
- Returns HTTP 429 (Too Many Requests) when rate limited
- Clears rate limit on successful login

#### Login Page Updates
- **Location**: `src/pages/auth/Login.tsx`
- Checks rate limit status before allowing login
- Disables form inputs when account is locked out
- Shows countdown timer (seconds remaining)
- Displays warning about remaining attempts
- Provides user-friendly error messages

**UI Components**:
- "Account temporarily locked" warning with countdown
- "X attempts remaining" warning before lockout
- Disabled input fields during lockout
- Real-time countdown (updates every second)

### 4. **Protected Routes**

#### Route Protection Pattern
```typescript
// Example: Protected route with role-based access
<Route
  path="/users"
  element={
    <ProtectedRoute allowedRoles={['System Administrator']}>
      <UserList />
    </ProtectedRoute>
  }
/>
```

#### Current Protected Routes
- Dashboard (/)
- Assets (/assets)
- Assignments (/assignments)
- Transfers (/transfers)
- Maintenance (/maintenance)
- Suppliers (/suppliers)
- Purchases (/purchases)
- Disposal (/disposal)
- Campuses (/campuses)
- Departments (/departments)
- Employees (/employees)
- Users (/users)
- Reports (/reports)
- Audit Log (/audit)

#### Role-Based Access Control
Each protected route specifies allowed roles. Users without proper roles are redirected to `/unauthorized`.

## Security Configuration

### Key Security Settings

| Setting | Value | Purpose |
|---------|-------|---------|
| Session Timeout | 30 minutes | Prevent unauthorized access to abandoned sessions |
| Warning Period | 5 minutes | Give users time to extend session before logout |
| Check Interval | 10 seconds | Frequent checking for session expiration |
| Max Login Attempts | 5 | Prevent brute force attacks |
| Attempt Window | 15 minutes | Rate limit window for tracking attempts |
| Initial Lockout | 1 minute | Initial penalty for too many attempts |
| Max Lockout | 24 hours | Upper bound on account lockout duration |

## Testing the Features

### Testing Session Expiration
1. Login to the application
2. Stay idle for 25 minutes
3. At 25 minutes, warning modal appears
4. At 30 minutes, auto-logout occurs
5. User is redirected to login page

**Quick Testing** (modify SESSION_TIMEOUT_MS in AuthContext.tsx):
```typescript
const SESSION_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes for testing
```

### Testing Login Rate Limiting
1. Go to login page
2. Enter wrong credentials 5 times
3. Account locks for 1 minute
4. Try logging in again (blocked with countdown)
5. After 1 minute, attempt 6 fails, locks for 2 minutes
6. Wait and try again

**Clear Rate Limits** (browser console):
```javascript
// Frontend
import { rateLimitService } from './services/rateLimitService';
rateLimitService.clearAllRateLimits();

// Backend (Admin API call)
// DELETE /admin/rate-limits/{username}
```

### Testing Protected Routes
1. Without login: Try accessing `/assets` → Redirected to `/login`
2. Logout from dashboard → Redirected to `/login`
3. Session expires → Auto-logout
4. Try accessing protected route with unauthorized role → `/unauthorized` page

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                  Browser / Frontend                  │
├─────────────────────────────────────────────────────┤
│  Login.tsx                                           │
│  ├─ rateLimitService (check/record attempts)        │
│  └─ AuthService.login()                             │
│                                                      │
│  AuthContext.tsx                                    │
│  ├─ Session management (30 min timeout)             │
│  ├─ Auto-logout on expiration                       │
│  └─ SessionExpirationWarning component              │
│                                                      │
│  Layout.tsx                                         │
│  └─ SessionExpirationWarning (modal on expiration)  │
│                                                      │
│  ProtectedRoute.tsx                                 │
│  └─ Route guards + role-based access                │
└─────────────────┬──────────────────────────────────┘
                  │ HTTP Requests
                  ↓
┌─────────────────────────────────────────────────────┐
│                 PHP Backend                          │
├─────────────────────────────────────────────────────┤
│  AuthController.php                                 │
│  ├─ POST /auth/login                               │
│  ├─ POST /auth/logout                              │
│  └─ POST /auth/verify-token                        │
│                                                      │
│  AuthService.php                                    │
│  ├─ login() - with rate limiting                   │
│  ├─ verifyToken() - checks expiration              │
│  ├─ checkRateLimit()                               │
│  └─ recordFailedAttempt()                          │
│                                                      │
│  Storage: /tmp/ictims_ratelimit_*.json             │
└─────────────────────────────────────────────────────┘
```

## File Changes Summary

### New Files Created
1. `src/services/rateLimitService.ts` - Frontend rate limiting logic
2. `src/components/SessionExpirationWarning.tsx` - Session expiration modal

### Modified Files
1. `src/context/AuthContext.tsx` - Added session management and expiration
2. `src/pages/auth/Login.tsx` - Added rate limiting UI
3. `src/components/Layout.tsx` - Added SessionExpirationWarning component
4. `backend/services/AuthService.php` - Added rate limiting and token TTL
5. `backend/controllers/AuthController.php` - Added error handling for rate limiting

## Security Best Practices Implemented

✅ **Authentication Required**: All routes require login  
✅ **Session Timeout**: Auto-logout after 30 minutes of activity  
✅ **Session Warning**: Users warned before session expires  
✅ **Rate Limiting**: Prevents brute force attacks  
✅ **Exponential Backoff**: Lockout time increases with repeated attempts  
✅ **Token Expiration**: Backend validates token expiration  
✅ **Role-Based Access**: Routes protected by user roles  
✅ **Secure Storage**: Tokens/sessions stored in localStorage (frontend)  
✅ **Audit Logging**: Login/logout events logged  
✅ **Persistent Sessions**: Sessions survive page refreshes (if not expired)  

## Production Considerations

### Recommended Enhancements
1. **Use Real JWT Library**: Replace simplified JWT implementation with proper library
2. **HTTPS Only**: Ensure all authentication traffic uses HTTPS
3. **Secure Tokens**: Use HMAC-SHA256 or RS256 for token signing
4. **HttpOnly Cookies**: Consider moving tokens to HttpOnly cookies
5. **CSRF Protection**: Add CSRF tokens to state-changing requests
6. **Rate Limiting by IP**: Limit login attempts by IP address too
7. **Two-Factor Authentication**: Add 2FA for sensitive accounts
8. **Brute Force Detection**: Monitor and alert on suspicious patterns
9. **Password Policy**: Enforce strong password requirements
10. **Token Refresh**: Implement refresh token rotation

## Troubleshooting

### Session expires too quickly
- Check `SESSION_TIMEOUT_MS` in `AuthContext.tsx`
- Verify localStorage is not being cleared
- Check browser console for errors

### Rate limiting not working
- Clear localStorage: `localStorage.clear()`
- Check `rateLimitService` is imported correctly
- Verify rate limit keys in localStorage (`ictims_login_rate_limit_*`)

### Protected routes not working
- Ensure `ProtectedRoute` wraps components correctly
- Verify user has required role in `allowedRoles` array
- Check AuthContext provider is at root of app

## Support & Questions
Contact the development team for:
- Security concerns
- Session timeout adjustments
- Rate limiting policy changes
- Access control modifications
