<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use App\Mail\PasswordResetLink;
use Laravel\Sanctum\PersonalAccessToken;

if (!function_exists('safeUserDisplayName')) {
    function safeUserDisplayName($record): string
    {
        $firstName = $record->first_name ?? null;
        $lastName = $record->last_name ?? null;

        $combined = trim(($firstName ?: '') . ' ' . ($lastName ?: ''));

        if ($combined !== '') {
            return $combined;
        }

        return $record->name
            ?? $record->username
            ?? $record->user_name
            ?? $record->email
            ?? 'User';
    }
}

if (!function_exists('recordLoginAttempt')) {
    function recordLoginAttempt(
        Request $request,
        ?int $userId,
        string $username,
        bool $successful
    ): void {
        $attemptCount = $successful ? 1 : DB::table('audit_logs')
            ->where('table_name', 'Authentication')
            ->where('action', 'LOGIN_FAILED')
            ->where('ip_address', $request->ip())
            ->whereJsonContains('new_data->username', $username)
            ->where('created_at', '>=', now()->subDay())
            ->count() + 1;

        DB::table('audit_logs')->insert([
            'user_id' => $userId,
            'table_name' => 'Authentication',
            'record_id' => $userId ?? 0,
            'action' => $successful ? 'LOGIN' : 'LOGIN_FAILED',
            'new_data' => json_encode([
                'event' => $successful ? 'Successful login' : 'Failed login',
                'username' => $username,
                'attempt_count_today' => $attemptCount,
            ]),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);
    }
}

// =====================
// PUBLIC ROUTES
// =====================
Route::get('/health', function () {
    return response()->json([
        'success' => true,
        'data' => ['status' => 'ok', 'app' => config('app.name', 'Laravel')]
    ]);
});

// Lightweight, unauthenticated campus list for the login screen's campus picker.
Route::get('/public/campuses', function () {
    $campuses = DB::table('campuses')
        ->select('campus_id as id', 'name', 'code', 'location')
        ->orderBy('name')
        ->get();

    return response()->json(['success' => true, 'data' => $campuses]);
});

Route::post('/login', function (Request $request) {
    try {
        $credentials = $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
            'campus' => ['nullable', 'string'],
        ]);

        $user = DB::table('users')->where('username', $credentials['username'])->where('is_active', 1)->first();

        if (!$user) {
            recordLoginAttempt($request, null, $credentials['username'], false);
            return response()->json(['success' => false, 'message' => 'Invalid credentials'], 401);
        }

        $storedPassword = $user->password_hash ?? $user->password ?? null;
        if (!$storedPassword || !Hash::check($credentials['password'], $storedPassword)) {
            recordLoginAttempt($request, $user->user_id, $credentials['username'], false);
            return response()->json(['success' => false, 'message' => 'Invalid credentials'], 401);
        }

        $authUser = \App\Models\User::find($user->user_id);
        $token = $authUser?->createToken('auth_token')->plainTextToken;

        $roleName = DB::table('roles')->where('role_id', $user->role_id)->value('name');
        $permissions = DB::table('permissions')
            ->where('role_id', $user->role_id)
            ->get(['module', 'action', 'resource'])
            ->map(fn ($permission) => $permission->module . '.' . $permission->action . ($permission->resource ? '.' . $permission->resource : ''))
            ->values();
        $campusName = null;
        $departmentName = null;

        if (!empty($user->emp_id)) {
            $employee = DB::table('employees')->where('emp_id', $user->emp_id)->first();
            if ($employee) {
                $campusName = $employee->dept_id ? DB::table('departments')->where('dept_id', $employee->dept_id)->value('campus_id') : null;
                $campusName = $campusName ? DB::table('campuses')->where('campus_id', $campusName)->value('name') : null;
                $departmentName = $employee->dept_id ? DB::table('departments')->where('dept_id', $employee->dept_id)->value('name') : null;
            }
        }

        // Only the Overall Administrator may sign in without picking a campus first.
        $selectedCampus = trim($credentials['campus'] ?? '');
        if ($selectedCampus !== '' && strcasecmp($roleName ?? '', 'Overall Administrator') !== 0) {
            if (!$campusName || strcasecmp($campusName, $selectedCampus) !== 0) {
                recordLoginAttempt($request, $user->user_id, $credentials['username'], false);
                return response()->json(['success' => false, 'message' => 'This account is not registered under the selected campus.'], 422);
            }
        }

        $firstName = $user->first_name ?? null;
        $lastName = $user->last_name ?? null;
        $displayName = safeUserDisplayName($user);

        recordLoginAttempt($request, $user->user_id, $credentials['username'], true);

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'token' => $token,
                'user' => [
                    'id' => $user->user_id,
                    'username' => $user->username,
                    'email' => $user->email,
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'name' => $displayName,
                    'role' => $roleName,
                    'role_id' => $user->role_id,
                    'permissions' => $permissions,
                    'campus' => $campusName,
                    'department' => $departmentName,
                    'isActive' => $user->is_active
                ]
            ]
        ]);
    } catch (\Exception $e) {
        return response()->json(['success' => false, 'message' => 'Login failed: ' . $e->getMessage()], 500);
    }
});

Route::post('/forgot-password', function (Request $request) {
    $data = $request->validate([
        'email' => ['required', 'email'],
        'phone' => ['required', 'string', 'min:8'],
    ]);

    $email = strtolower(trim($data['email']));
    $phone = trim($data['phone']);

    $user = DB::table('users')->whereRaw('LOWER(email) = ?', [$email])->first();
    if (!$user) {
        return response()->json(['success' => false, 'message' => 'No account found for that email address.'], 404);
    }

    $employee = $user->emp_id ? DB::table('employees')->where('emp_id', $user->emp_id)->first() : null;
    $storedPhone = $employee?->phone ?? null;

    if ($storedPhone && strtolower(trim($storedPhone)) !== strtolower($phone)) {
        return response()->json(['success' => false, 'message' => 'The phone number does not match the account on file.'], 422);
    }

    if (!$storedPhone) {
        return response()->json(['success' => false, 'message' => 'This account does not have a registered phone number for password recovery.'], 422);
    }

    $token = Str::random(64);
    DB::table('password_reset_tokens')->updateOrInsert(
        ['email' => $email],
        ['token' => Hash::make($token), 'created_at' => now()]
    );

    $fullName = safeUserDisplayName((object) [
        'first_name' => $user->first_name ?? null,
        'last_name' => $user->last_name ?? null,
        'username' => $user->username ?? null,
        'email' => $user->email ?? $email,
    ]);

    Mail::to($email)->send(new PasswordResetLink($fullName, $email, $token));

    return response()->json([
        'success' => true,
        'message' => 'A password reset email has been sent to your registered email address.',
    ]);
});

Route::post('/reset-password', function (Request $request) {
    $data = $request->validate([
        'email' => ['required', 'email'],
        'token' => ['required', 'string'],
        'password' => ['required', 'string', 'min:8', 'confirmed'],
    ]);

    $email = strtolower(trim($data['email']));
    $record = DB::table('password_reset_tokens')->where('email', $email)->first();

    if (!$record || !Hash::check($data['token'], $record->token)) {
        return response()->json(['success' => false, 'message' => 'This password reset link is invalid or has expired.'], 422);
    }

    $user = DB::table('users')->whereRaw('LOWER(email) = ?', [$email])->first();
    if (!$user) {
        return response()->json(['success' => false, 'message' => 'Account not found.'], 404);
    }

    DB::table('users')->where('user_id', $user->user_id)->update([
        'password' => Hash::make($data['password']),
        'updated_at' => now(),
    ]);

    DB::table('password_reset_tokens')->where('email', $email)->delete();

    return response()->json([
        'success' => true,
        'message' => 'Your password has been updated successfully.',
    ]);
});

Route::middleware('auth:sanctum')->post('/change-password', function (Request $request) {
    $data = $request->validate([
        'current_password' => ['required', 'string'],
        'new_password' => ['required', 'string', 'min:8', 'confirmed'],
    ]);

    $user = $request->user();
    $storedPassword = $user->password_hash ?? $user->password ?? null;

    if (!$storedPassword || !Hash::check($data['current_password'], $storedPassword)) {
        return response()->json(['success' => false, 'message' => 'Your current password is incorrect.'], 422);
    }

    $user->forceFill([
        'password' => Hash::make($data['new_password']),
        'updated_at' => now(),
    ])->save();

    return response()->json([
        'success' => true,
        'message' => 'Your password has been changed successfully.',
    ]);
});

// =====================
// USER ROUTES
// =====================
Route::middleware('role.permission')->group(function () {
Route::get('/user', function (Request $request) {
    $user = $request->user();

    if (!$user) return response()->json(['success' => false, 'message' => 'User not found'], 401);

    $roleName = DB::table('roles')->where('role_id', $user->role_id)->value('name');
    $permissions = DB::table('permissions')
        ->where('role_id', $user->role_id)
        ->get(['module', 'action', 'resource'])
        ->map(fn ($permission) => $permission->module . '.' . $permission->action . ($permission->resource ? '.' . $permission->resource : ''))
        ->values();
    $campusName = null;
    $departmentName = null;
    if ($user->emp_id) {
        $employee = DB::table('employees')->where('emp_id', $user->emp_id)->first();
        if ($employee) {
            $campusName = $employee->dept_id ? DB::table('departments')->where('dept_id', $employee->dept_id)->value('campus_id') : null;
            $campusName = $campusName ? DB::table('campuses')->where('campus_id', $campusName)->value('name') : null;
            $departmentName = $employee->dept_id ? DB::table('departments')->where('dept_id', $employee->dept_id)->value('name') : null;
        }
    }

    $firstName = $user->first_name ?? null;
    $lastName = $user->last_name ?? null;
    $displayName = safeUserDisplayName($user);

    return response()->json([
        'success' => true,
        'data' => [
            'id' => $user->user_id,
            'username' => $user->username,
            'email' => $user->email,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'name' => $displayName,
            'phone' => $user->phone ?? null,
            'role' => $roleName,
            'role_id' => $user->role_id,
            'permissions' => $permissions,
            'campus' => $campusName,
            'department' => $departmentName,
            'isActive' => $user->is_active
        ]
    ]);
});

Route::get('/users', function (Request $request) {
    $bearerToken = $request->bearerToken();
    if (!$bearerToken) return response()->json(['success' => false, 'message' => 'Token missing'], 401);

    $accessToken = PersonalAccessToken::findToken($bearerToken);
    $requestingUser = $accessToken?->tokenable;
    if (!$requestingUser) return response()->json(['success' => false, 'message' => 'Invalid token'], 401);

    $roleName = DB::table('roles')->where('role_id', $requestingUser->role_id)->value('name');
    $hasInstitutionWideAccess = strcasecmp($roleName ?? '', 'Overall Administrator') === 0;
    $requestingCampusId = DB::table('employees')
        ->join('departments', 'employees.dept_id', '=', 'departments.dept_id')
        ->where('employees.emp_id', $requestingUser->emp_id)
        ->value('departments.campus_id');
    if (!$hasInstitutionWideAccess && !$requestingCampusId) {
        return response()->json(['success' => false, 'message' => 'Your account is not assigned to a campus'], 403);
    }

    $usersQuery = DB::table('users')
        ->leftJoin('roles', 'users.role_id', '=', 'roles.role_id')
        ->select('users.*', 'roles.name as role_name')
        ->orderBy('users.user_id', 'desc');

    if (!$hasInstitutionWideAccess) {
        $usersQuery
            ->join('employees as scoped_employees', 'users.emp_id', '=', 'scoped_employees.emp_id')
            ->join('departments as scoped_departments', 'scoped_employees.dept_id', '=', 'scoped_departments.dept_id')
            ->where('scoped_departments.campus_id', $requestingCampusId);
    }

    $users = $usersQuery->get();

    $data = $users->map(function ($user) {
        $campusName = null;
        $departmentName = null;
        $employee = $user->emp_id ? DB::table('employees')->where('emp_id', $user->emp_id)->first() : null;

        if ($employee) {
            $campusName = $employee->dept_id ? DB::table('departments')->where('dept_id', $employee->dept_id)->value('campus_id') : null;
            $campusName = $campusName ? DB::table('campuses')->where('campus_id', $campusName)->value('name') : null;
            $departmentName = $employee->dept_id ? DB::table('departments')->where('dept_id', $employee->dept_id)->value('name') : null;
        }

        $firstName = $employee->first_name ?? null;
        $lastName = $employee->last_name ?? null;

        return [
            'id' => $user->user_id,
            'username' => $user->username,
            'email' => $user->email,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'name' => trim(($firstName ?: '') . ' ' . ($lastName ?: '')) ?: $user->username,
            'phone' => $employee->phone ?? null,
            'office' => $employee->office ?? null,
            'role' => $user->role_name,
            'role_id' => $user->role_id,
            'campus' => $campusName,
            'department' => $departmentName,
            'isActive' => $user->is_active,
            'created_at' => $user->created_at
        ];
    });

    return response()->json(['success' => true, 'data' => $data]);
});

Route::post('/users', function (Request $request) {
    $bearerToken = $request->bearerToken();
    if (!$bearerToken) return response()->json(['success' => false, 'message' => 'Token missing'], 401);

    $accessToken = PersonalAccessToken::findToken($bearerToken);
    $requestingUser = $accessToken?->tokenable;
    if (!$requestingUser) return response()->json(['success' => false, 'message' => 'Invalid token'], 401);

    $requestingRoleName = DB::table('roles')->where('role_id', $requestingUser->role_id)->value('name');
    $isOverallAdmin = strcasecmp($requestingRoleName ?? '', 'Overall Administrator') === 0;
    $isCampusAdmin = strcasecmp($requestingRoleName ?? '', 'Campus Administrator') === 0;
    if (!$isOverallAdmin && !$isCampusAdmin) {
        return response()->json(['success' => false, 'message' => 'You are not authorized to provision user accounts'], 403);
    }

    $requestingCampusName = DB::table('employees')
        ->join('departments', 'employees.dept_id', '=', 'departments.dept_id')
        ->join('campuses', 'departments.campus_id', '=', 'campuses.campus_id')
        ->where('employees.emp_id', $requestingUser->emp_id)
        ->value('campuses.name');

    $data = $request->validate([
        'name' => 'required|string|max:100',
        'username' => 'required|string|max:50|unique:users,username',
        'email' => 'required|email|unique:users,email|unique:employees,email',
        'password' => 'nullable|string|min:6',
        'phone' => 'nullable|string|max:20',
        'role_id' => 'required|exists:roles,role_id',
        'campus' => 'required|string',
        'department' => 'required|string',
        'office' => 'nullable|string|max:100',
    ]);

    $targetRoleName = DB::table('roles')->where('role_id', $data['role_id'])->value('name');
    $targetIsOverallAdmin = strcasecmp($targetRoleName ?? '', 'Overall Administrator') === 0;
    $targetIsCampusAdmin = strcasecmp($targetRoleName ?? '', 'Campus Administrator') === 0;

    if ($isCampusAdmin) {
        if ($targetIsOverallAdmin || $targetIsCampusAdmin) {
            return response()->json(['success' => false, 'message' => 'Campus Administrators can only provision users with roles below Campus Administrator'], 403);
        }
        if (!$requestingCampusName || strcasecmp($requestingCampusName, $data['campus']) !== 0) {
            return response()->json(['success' => false, 'message' => 'You can only provision users within your own campus'], 403);
        }
    }

    if ($targetIsOverallAdmin) {
        $overallAdminCount = DB::table('users')
            ->join('roles', 'users.role_id', '=', 'roles.role_id')
            ->whereRaw('LOWER(roles.name) = ?', ['overall administrator'])
            ->count();
        if ($overallAdminCount >= 3) {
            return response()->json(['success' => false, 'message' => 'Maximum of 3 Overall Administrator accounts allowed'], 422);
        }
    }

    $campus = DB::table('campuses')->whereRaw('LOWER(name) = ?', [strtolower($data['campus'])])->first();
    if (!$campus) {
        return response()->json(['success' => false, 'message' => 'Selected campus was not found'], 422);
    }

    $department = DB::table('departments')->where('campus_id', $campus->campus_id)->whereRaw('LOWER(name) = ?', [strtolower($data['department'])])->first();
    if (!$department) {
        return response()->json(['success' => false, 'message' => 'Selected department does not belong to the selected campus'], 422);
    }

    $nameParts = preg_split('/\s+/', trim($data['name']), 2);
    $employeeId = DB::table('employees')->insertGetId([
        'dept_id' => $department->dept_id,
        'employee_no' => 'USR-' . Str::upper(Str::random(8)),
        'first_name' => $nameParts[0],
        'last_name' => $nameParts[1] ?? '',
        'email' => $data['email'],
        'phone' => $data['phone'] ?? null,
        'office' => $data['office'] ?? null,
        'job_title' => DB::table('roles')->where('role_id', $data['role_id'])->value('name'),
        'is_active' => true,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $userId = DB::table('users')->insertGetId([
        'emp_id' => $employeeId,
        'username' => $data['username'],
        'email' => $data['email'],
        'password' => Hash::make($data['password'] ?? 'password123'),
        'role_id' => $data['role_id'],
        'is_active' => 1,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    return response()->json(['success' => true, 'message' => 'User created', 'data' => ['id' => $userId]], 201);
});

Route::put('/users/{id}', function (Request $request, $id) {
    $user = DB::table('users')->where('user_id', $id)->first();
    if (!$user) {
        return response()->json(['success' => false, 'message' => 'User not found'], 404);
    }

    $data = $request->validate([
        'name' => 'sometimes|string|max:100',
        'username' => 'sometimes|string|max:50|unique:users,username,' . $id . ',user_id',
        'email' => 'sometimes|email|unique:users,email,' . $id . ',user_id',
        'phone' => 'nullable|string|max:20',
        'role_id' => 'nullable|exists:roles,role_id',
        'campus' => 'sometimes|string',
        'department' => 'sometimes|string',
        'office' => 'nullable|string|max:100',
    ]);

    DB::table('users')->where('user_id', $id)->update(array_filter([
        'username' => $data['username'] ?? null,
        'email' => $data['email'] ?? null,
        'role_id' => $data['role_id'] ?? null,
        'updated_at' => now(),
    ], fn ($value) => $value !== null));

    $deptId = null;
    if (!empty($data['campus']) && !empty($data['department'])) {
        $campus = DB::table('campuses')->whereRaw('LOWER(name) = ?', [strtolower($data['campus'])])->first();
        $department = $campus ? DB::table('departments')->where('campus_id', $campus->campus_id)->whereRaw('LOWER(name) = ?', [strtolower($data['department'])])->first() : null;
        if (!$department) {
            return response()->json(['success' => false, 'message' => 'Selected department does not belong to the selected campus'], 422);
        }
        $deptId = $department->dept_id;
    }

    $nameParts = isset($data['name']) ? preg_split('/\s+/', trim($data['name']), 2) : null;
    $employeeUpdates = array_filter([
        'dept_id' => $deptId,
        'first_name' => $nameParts[0] ?? null,
        'last_name' => $nameParts[1] ?? ($nameParts ? '' : null),
        'email' => $data['email'] ?? null,
        'phone' => $data['phone'] ?? null,
        'office' => $data['office'] ?? null,
    ], fn ($value) => $value !== null);

    if (!empty($employeeUpdates)) {
        if ($user->emp_id) {
            DB::table('employees')->where('emp_id', $user->emp_id)->update($employeeUpdates + ['updated_at' => now()]);
        } elseif ($deptId) {
            $employeeId = DB::table('employees')->insertGetId($employeeUpdates + [
                'employee_no' => 'USR-' . Str::upper(Str::random(8)),
                'email' => $data['email'] ?? $user->email,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            DB::table('users')->where('user_id', $id)->update(['emp_id' => $employeeId, 'updated_at' => now()]);
        }
    }

    return response()->json(['success' => true, 'message' => 'User updated']);
});

Route::patch('/users/{id}/role', function (Request $request, $id) {
    $data = $request->validate([
        'role' => 'required|string'
    ]);

    // Pata role ID kwa jina
    $role = DB::table('roles')->where('name', $data['role'])->first();
    if (!$role) {
        return response()->json(['success' => false, 'message' => 'Role not found'], 404);
    }

    DB::table('users')->where('user_id', $id)->update([
        'role_id' => $role->role_id,
        'updated_at' => now(),
    ]);

    return response()->json(['success' => true, 'message' => 'Role updated']);
});

Route::patch('/users/{id}/status', function (Request $request, $id) {
    $user = DB::table('users')->where('user_id', $id)->first();
    if (!$user) return response()->json(['success' => false, 'message' => 'User not found'], 404);

    DB::table('users')->where('user_id', $id)->update([
        'is_active' => $user->is_active ? 0 : 1,
        'updated_at' => now(),
    ]);

    return response()->json(['success' => true, 'message' => 'Status toggled']);
});

Route::delete('/users/{id}', function ($id) {
    DB::table('users')->where('user_id', $id)->delete();
    return response()->json(['success' => true, 'message' => 'User deleted']);
});

Route::post('/logout', function (Request $request) {
    $token = PersonalAccessToken::findToken($request->bearerToken());
    $token?->delete();
    return response()->json(['success' => true, 'message' => 'Logged out successfully']);
});

// =====================
// ASSET ROUTES
// =====================
Route::get('/assets', function (Request $request) {
    $bearerToken = $request->bearerToken();
    if (!$bearerToken) return response()->json(['success' => false, 'message' => 'Token missing'], 401);

    $accessToken = PersonalAccessToken::findToken($bearerToken);
    $requestingUser = $accessToken?->tokenable;
    if (!$requestingUser) return response()->json(['success' => false, 'message' => 'Invalid token'], 401);

    $roleName = DB::table('roles')->where('role_id', $requestingUser->role_id)->value('name');
    $hasInstitutionWideAccess = strcasecmp($roleName ?? '', 'Overall Administrator') === 0;
    $requestingCampusId = DB::table('employees')
        ->join('departments', 'employees.dept_id', '=', 'departments.dept_id')
        ->where('employees.emp_id', $requestingUser->emp_id)
        ->value('departments.campus_id');
    if (!$hasInstitutionWideAccess && !$requestingCampusId) {
        return response()->json(['success' => false, 'message' => 'Your account is not assigned to a campus'], 403);
    }

    $assetsQuery = DB::table('assets')
        ->leftJoin('campuses', 'assets.campus_id', '=', 'campuses.campus_id')
        ->leftJoin('departments', 'assets.dept_id', '=', 'departments.dept_id')
        ->leftJoin('asset_categories', 'assets.cat_id', '=', 'asset_categories.cat_id')
        ->leftJoin('asset_assignments', function($join) {
            $join->on('asset_assignments.asset_id', '=', 'assets.asset_id')
                 ->where('asset_assignments.status', '=', 'Active');
        })
        ->leftJoin('employees', 'asset_assignments.emp_id', '=', 'employees.emp_id')
        ->select(
            'assets.*',
            'campuses.name as campus_name',
            'asset_categories.name as category_name',
            'asset_categories.type as category_type',
            'departments.name as department_name',
            'employees.first_name as assigned_first',
            'employees.last_name as assigned_last'
        )
        ->orderBy('assets.asset_id', 'desc');

    if (!$hasInstitutionWideAccess) {
        $assetsQuery->where('assets.campus_id', $requestingCampusId);
    }
    if (in_array(strtolower($roleName ?? ''), ['employee', 'lab manager'], true)) {
        $assetsQuery->where('asset_assignments.emp_id', $requestingUser->emp_id);
        if (strcasecmp($roleName ?? '', 'Lab Manager') === 0) {
            $assetsQuery->where('asset_assignments.assignment_type', 'Lab');
        }
    }

    $assets = $assetsQuery->get();

    $data = $assets->map(function ($asset) {
        return [
            'id' => $asset->asset_id,
            'assetTag' => $asset->serial_number,
            'name' => $asset->name,
            'brand' => '',
            'model' => $asset->model,
            'serialNumber' => $asset->serial_number,
            'status' => $asset->status,
            'disposalReady' => (bool) $asset->disposal_ready,
            'cost' => $asset->cost,
            'category' => $asset->category_name,
            'categoryId' => $asset->cat_id,
            'categoryType' => $asset->category_type,
            'campusId' => $asset->campus_id,
            'departmentId' => $asset->dept_id,
            'purchaseDate' => $asset->purchase_date,
            'assignedTo' => $asset->assigned_first ? $asset->assigned_first . ' ' . $asset->assigned_last : null,
            'assignedEmployeeName' => $asset->assigned_first ? $asset->assigned_first . ' ' . $asset->assigned_last : null,
            'campus' => $asset->campus_name,
            'department' => $asset->department_name,
        ];
    });

    return response()->json(['success' => true, 'data' => $data]);
});

Route::get('/asset-categories', function (Request $request) {
    $bearerToken = $request->bearerToken();
    if (!$bearerToken) return response()->json(['success' => false, 'message' => 'Token missing'], 401);

    $categories = DB::table('asset_categories')
        ->select('cat_id as id', 'name', 'code', 'type')
        ->orderBy('name')
        ->get();

    return response()->json(['success' => true, 'data' => $categories]);
});

Route::post('/assets', function (Request $request) {
    $data = $request->validate([
        'name' => 'required|string|max:200',
        'serial_number' => 'required|string|max:50|unique:assets,serial_number',
        'campus_id' => 'nullable|exists:campuses,campus_id',
        'dept_id' => 'nullable|exists:departments,dept_id',
        'cat_id' => 'nullable|exists:asset_categories,cat_id',
        'model' => 'nullable|string|max:100',
        'status' => 'nullable|string',
        'cost' => 'nullable|numeric',
        'purchase_date' => 'nullable|date',
    ]);

    $assetId = DB::table('assets')->insertGetId([
        'name' => $data['name'],
        'serial_number' => $data['serial_number'],
        'campus_id' => $data['campus_id'] ?? null,
        'dept_id' => $data['dept_id'] ?? null,
        'cat_id' => $data['cat_id'] ?? 1,
        'model' => $data['model'] ?? null,
        'status' => $data['status'] ?? 'Available',
        'cost' => $data['cost'] ?? 0,
        'purchase_date' => $data['purchase_date'] ?? null,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    return response()->json(['success' => true, 'message' => 'Asset registered', 'data' => ['id' => $assetId]], 201);
});

Route::put('/assets/{id}', function (Request $request, $id) {
    $data = $request->validate([
        'name' => 'sometimes|string|max:200',
        'serial_number' => 'sometimes|string|max:50|unique:assets,serial_number,' . $id . ',asset_id',
        'model' => 'sometimes|nullable|string|max:100',
        'cat_id' => 'sometimes|nullable|exists:asset_categories,cat_id',
        'campus_id' => 'sometimes|nullable|exists:campuses,campus_id',
        'status' => 'sometimes|string',
        'cost' => 'sometimes|numeric',
    ]);

    $updates = array_filter([
        'name' => $data['name'] ?? null,
        'serial_number' => $data['serial_number'] ?? null,
        'model' => $data['model'] ?? null,
        'cat_id' => $data['cat_id'] ?? null,
        'campus_id' => $data['campus_id'] ?? null,
        'status' => $data['status'] ?? null,
        'cost' => $data['cost'] ?? null,
    ], fn ($value) => $value !== null);
    $updates['updated_at'] = now();

    DB::table('assets')->where('asset_id', $id)->update($updates);

    return response()->json(['success' => true, 'message' => 'Asset updated']);
});

Route::delete('/assets/{id}', function ($id) {
    // Futa kwanza assignments zinazohusiana na asset hii
    DB::table('asset_assignments')->where('asset_id', $id)->delete();
    // Kisha futa asset yenyewe
    DB::table('assets')->where('asset_id', $id)->delete();
    return response()->json(['success' => true, 'message' => 'Asset deleted']);
});

// =====================
// AUDIT LOGS
// =====================
Route::get('/audit', function (Request $request) {
    $bearerToken = $request->bearerToken();
    if (!$bearerToken) return response()->json(['success' => false, 'message' => 'Token missing'], 401);

    $accessToken = PersonalAccessToken::findToken($bearerToken);
    $requestingUser = $accessToken?->tokenable;
    if (!$requestingUser) return response()->json(['success' => false, 'message' => 'Invalid token'], 401);

    $roleName = DB::table('roles')->where('role_id', $requestingUser->role_id)->value('name');
    $hasInstitutionWideAccess = strcasecmp($roleName ?? '', 'Overall Administrator') === 0;
    $hasCampusAuditAccess = in_array(strtolower($roleName ?? ''), ['campus administrator', 'audit officer', 'ict officer'], true);
    if (!$hasInstitutionWideAccess && !$hasCampusAuditAccess) {
        return response()->json(['success' => false, 'message' => 'You are not authorized to view audit logs'], 403);
    }

    $requestingCampusId = DB::table('employees')
        ->join('departments', 'employees.dept_id', '=', 'departments.dept_id')
        ->where('employees.emp_id', $requestingUser->emp_id)
        ->value('departments.campus_id');
    if (!$hasInstitutionWideAccess && !$requestingCampusId) {
        return response()->json(['success' => false, 'message' => 'Your account is not assigned to a campus'], 403);
    }

    $logsQuery = DB::table('audit_logs')
        ->leftJoin('users', 'audit_logs.user_id', '=', 'users.user_id')
        ->leftJoin('roles', 'users.role_id', '=', 'roles.role_id')
        ->leftJoin('employees', 'users.emp_id', '=', 'employees.emp_id')
        ->leftJoin('departments', 'employees.dept_id', '=', 'departments.dept_id')
        ->leftJoin('campuses', 'departments.campus_id', '=', 'campuses.campus_id')
        ->select('audit_logs.*', 'users.username as user_name', 'users.email as user_email', 'roles.name as user_role', 'departments.name as department_name', 'campuses.name as campus_name')
        ->orderBy('audit_logs.created_at', 'desc')
        ->limit(50);

    if (!$hasInstitutionWideAccess) {
        $logsQuery->where('departments.campus_id', $requestingCampusId);
    }

    $logs = $logsQuery->get();

    $data = $logs->map(function ($log) {
        $metadata = $log->new_data ? json_decode($log->new_data, true) : [];
        $displayName = $log->user_name ?? $log->user_email ?? ($metadata['username'] ?? 'Unknown user');
        $description = $metadata['event'] ?? ($log->table_name . ' ' . strtolower($log->action));
        if ($log->action === 'LOGIN_FAILED' && isset($metadata['attempt_count_today'])) {
            $description .= ' (attempt ' . $metadata['attempt_count_today'] . ' today)';
        }

        return [
            'id' => $log->log_id,
            'action' => $log->action,
            'module' => $log->table_name,
            'description' => $description,
            'userName' => $displayName,
            'userRole' => $log->user_role ?? 'System',
            'campus' => $log->campus_name ?? 'System',
            'department' => $log->department_name ?? 'System',
            'ipAddress' => $log->ip_address,
            'timestamp' => $log->created_at,
        ];
    });

    return response()->json(['success' => true, 'data' => $data]);
});

Route::delete('/audit', function (Request $request) {
    $data = $request->validate(['ids' => ['required', 'array', 'min:1'], 'ids.*' => ['integer']]);
    $requestingUser = $request->user();
    if (!$requestingUser) return response()->json(['success' => false, 'message' => 'Invalid token'], 401);

    $roleName = DB::table('roles')->where('role_id', $requestingUser->role_id)->value('name');
    $hasInstitutionWideAccess = strcasecmp($roleName ?? '', 'Overall Administrator') === 0;
    $hasCampusAuditAccess = in_array(strtolower($roleName ?? ''), ['campus administrator', 'audit officer', 'ict officer'], true);
    if (!$hasInstitutionWideAccess && !$hasCampusAuditAccess) {
        return response()->json(['success' => false, 'message' => 'You are not authorized to delete audit logs'], 403);
    }

    $logsQuery = DB::table('audit_logs')->whereIn('audit_logs.log_id', $data['ids'])->whereDate('audit_logs.created_at', '<', today());
    if (!$hasInstitutionWideAccess) {
        $requestingCampusId = DB::table('employees')
            ->join('departments', 'employees.dept_id', '=', 'departments.dept_id')
            ->where('employees.emp_id', $requestingUser->emp_id)
            ->value('departments.campus_id');
        if (!$requestingCampusId) return response()->json(['success' => false, 'message' => 'Your account is not assigned to a campus'], 403);

        $logsQuery
            ->join('users', 'audit_logs.user_id', '=', 'users.user_id')
            ->join('employees', 'users.emp_id', '=', 'employees.emp_id')
            ->join('departments', 'employees.dept_id', '=', 'departments.dept_id')
            ->where('departments.campus_id', $requestingCampusId);
    }

    $deleted = $logsQuery->delete();
    return response()->json(['success' => true, 'message' => "$deleted old audit log(s) deleted"]);
});

Route::post('/suppliers', function (Request $request) {
    $data = $request->validate([
        'name' => 'required|string|max:150',
        'contact_person' => 'required|string|max:100',
        'email' => 'required|email|max:100',
        'phone' => 'required|string|max:20',
        'address' => 'nullable|string',
        'tin' => 'required|string|max:20',
        'is_active' => 'nullable|boolean',
    ]);

    $supplierId = DB::table('suppliers')->insertGetId([
        'name' => $data['name'],
        'contact_person' => $data['contact_person'],
        'email' => $data['email'],
        'phone' => $data['phone'],
        'address' => $data['address'] ?? null,
        'tin' => $data['tin'],
        'is_active' => $data['is_active'] ?? true,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $supplier = DB::table('suppliers')->where('supp_id', $supplierId)->first();
    return response()->json(['success' => true, 'message' => 'Supplier registered successfully', 'data' => [
        'id' => $supplier->supp_id,
        'name' => $supplier->name,
        'contactPerson' => $supplier->contact_person,
        'email' => $supplier->email,
        'phone' => $supplier->phone,
        'address' => $supplier->address,
        'tin' => $supplier->tin,
        'isActive' => (bool) $supplier->is_active,
        'status' => $supplier->is_active ? 'Active' : 'Inactive',
    ]], 201);
});

// =====================
// DASHBOARD METRICS
// =====================
Route::get('/reports/dashboard', function (Request $request) {
    $bearerToken = $request->bearerToken();
    if (!$bearerToken) return response()->json(['success' => false, 'message' => 'Token missing'], 401);

    try {
        $totalAssets = DB::table('assets')->count();
        $assignedAssets = DB::table('assets')->where('status', 'Assigned')->count();
        $availableAssets = DB::table('assets')->where('status', 'Available')->count();
        $underMaintenance = DB::table('assets')->where('status', 'Under Maintenance')->count();
        $disposedAssets = DB::table('assets')->where('status', 'Disposed')->count();
        $totalValue = DB::table('assets')->sum('cost');

        $campuses = DB::table('campuses')->get();
        $campusBreakdown = $campuses->map(function ($campus) {
            return [
                'campus' => $campus->name,
                'count' => DB::table('assets')->where('campus_id', $campus->campus_id)->count(),
                'value' => DB::table('assets')->where('campus_id', $campus->campus_id)->sum('cost')
            ];
        });

        $pendingTransfers = DB::table('asset_transfers')->where('status', 'Pending')->count();

        return response()->json([
            'success' => true,
            'data' => [
                'totalAssets' => $totalAssets,
                'assignedAssets' => $assignedAssets,
                'availableAssets' => $availableAssets,
                'underMaintenance' => $underMaintenance,
                'disposedAssets' => $disposedAssets,
                'pendingTransfers' => $pendingTransfers,
                'totalAssetValue' => $totalValue,
                'campusBreakdown' => $campusBreakdown
            ]
        ]);
    } catch (\Exception $e) {
        return response()->json(['success' => false, 'message' => 'Error loading dashboard: ' . $e->getMessage()], 500);
    }
});

// =====================
// ASSIGNMENTS
// =====================
Route::get('/requests', function (Request $request) {
    $user = $request->user();
    $query = DB::table('asset_requests')
        ->join('assets', 'asset_requests.asset_id', '=', 'assets.asset_id')
        ->join('employees', 'asset_requests.emp_id', '=', 'employees.emp_id')
        ->select('asset_requests.*', 'assets.name as asset_name', 'employees.first_name', 'employees.last_name');

    if ($user->hasRole('Employee')) {
        $query->where('asset_requests.emp_id', $user->emp_id);
    }

    $requests = $query->orderByDesc('asset_requests.created_at')->get()->map(fn ($request) => [
        'id' => (string) $request->request_id,
        'assetId' => (string) $request->asset_id,
        'assetName' => $request->asset_name,
        'employeeName' => trim($request->first_name . ' ' . $request->last_name),
        'reason' => $request->reason ?? '',
        'status' => $request->status,
        'createdAt' => $request->created_at,
    ]);

    return response()->json(['success' => true, 'data' => $requests]);
});

Route::post('/requests', function (Request $request) {
    $user = $request->user();
    if (!$user || !$user->hasPermission('requests', 'create')) {
        return response()->json(['success' => false, 'message' => 'Your account is not authorized to request assets'], 403);
    }

    $employeeId = $user->emp_id;
    if (!$employeeId) {
        $campusId = null;
        $department = null;

        if (!empty($user->email)) {
            $employee = DB::table('employees')->where('email', $user->email)->first();
            if ($employee) {
                $employeeId = $employee->emp_id;
                $department = DB::table('departments')->where('dept_id', $employee->dept_id)->first();
                $campusId = $department ? $department->campus_id : null;
            }
        }

        if (!$employeeId) {
            $department = DB::table('departments')->orderBy('dept_id')->first();
            if (!$department) {
                return response()->json(['success' => false, 'message' => 'No department is available for this employee account'], 422);
            }

            $employeeId = DB::table('employees')->insertGetId([
                'dept_id' => $department->dept_id,
                'employee_no' => 'USR-' . $user->user_id,
                'first_name' => $user->first_name ?: $user->username,
                'last_name' => $user->last_name ?: '',
                'email' => $user->email,
                'phone' => null,
                'is_active' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        DB::table('users')->where('user_id', $user->user_id)->update(['emp_id' => $employeeId, 'updated_at' => now()]);
    }

    $data = $request->validate([
        'asset_id' => 'required|exists:assets,asset_id',
        'reason' => 'required|string|max:1000',
    ]);
    $asset = DB::table('assets')->where('asset_id', $data['asset_id'])->first();
    if (!$asset || $asset->status !== 'Available') {
        return response()->json(['success' => false, 'message' => 'Only available assets can be requested'], 422);
    }
    if (DB::table('asset_requests')->where('asset_id', $data['asset_id'])->where('emp_id', $employeeId)->where('status', 'Pending')->exists()) {
        return response()->json(['success' => false, 'message' => 'You already have a pending request for this asset'], 422);
    }

    $requestId = DB::table('asset_requests')->insertGetId([
        'asset_id' => $data['asset_id'],
        'emp_id' => $employeeId,
        'reason' => $data['reason'],
        'status' => 'Pending',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    return response()->json(['success' => true, 'message' => 'Asset request submitted', 'data' => ['id' => $requestId]], 201);
});

Route::patch('/requests/{id}/status', function (Request $request, $id) {
    $user = $request->user();
    if (!$user->hasRole('ICT Officer')) {
        return response()->json(['success' => false, 'message' => 'Only an ICT Officer can approve asset requests'], 403);
    }
    $data = $request->validate(['status' => 'required|in:Approved,Rejected']);
    $assetRequest = DB::table('asset_requests')->where('request_id', $id)->lockForUpdate()->first();
    if (!$assetRequest || $assetRequest->status !== 'Pending') {
        return response()->json(['success' => false, 'message' => 'Pending asset request not found'], 404);
    }

    DB::transaction(function () use ($assetRequest, $data, $user) {
        DB::table('asset_requests')->where('request_id', $assetRequest->request_id)->update([
            'status' => $data['status'],
            'approved_by' => $user->user_id,
            'updated_at' => now(),
        ]);
        if ($data['status'] === 'Approved') {
            DB::table('asset_assignments')->insert([
                'asset_id' => $assetRequest->asset_id,
                'emp_id' => $assetRequest->emp_id,
                'dept_id' => DB::table('employees')->where('emp_id', $assetRequest->emp_id)->value('dept_id'),
                'assigned_by' => $user->user_id,
                'assign_date' => now()->toDateString(),
                'status' => 'Active',
                'notes' => $assetRequest->reason,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            DB::table('assets')->where('asset_id', $assetRequest->asset_id)->update(['status' => 'Assigned', 'updated_at' => now()]);
        }
    });

    return response()->json(['success' => true, 'message' => 'Asset request updated']);
});

Route::get('/assignments', function (Request $request) {
    $requestingUser = $request->user();
    if (!$requestingUser) return response()->json(['success' => false, 'message' => 'Invalid token'], 401);

    $roleName = DB::table('roles')->where('role_id', $requestingUser->role_id)->value('name');
    $hasInstitutionWideAccess = strcasecmp($roleName ?? '', 'Overall Administrator') === 0;
    $hasCampusAssignmentAccess = in_array(strtolower($roleName ?? ''), ['campus administrator', 'ict officer'], true);
    if (!$hasInstitutionWideAccess && !$hasCampusAssignmentAccess) {
        return response()->json(['success' => false, 'message' => 'You are not authorized to view assigned assets'], 403);
    }

    $requestingCampusId = DB::table('employees')
        ->join('departments', 'employees.dept_id', '=', 'departments.dept_id')
        ->where('employees.emp_id', $requestingUser->emp_id)
        ->value('departments.campus_id');
    if (!$hasInstitutionWideAccess && !$requestingCampusId) {
        return response()->json(['success' => false, 'message' => 'Your account is not assigned to a campus'], 403);
    }

    $assignmentsQuery = DB::table('asset_assignments')
        ->leftJoin('assets', 'asset_assignments.asset_id', '=', 'assets.asset_id')
        ->leftJoin('asset_categories', 'assets.cat_id', '=', 'asset_categories.cat_id')
        ->leftJoin('employees', 'asset_assignments.emp_id', '=', 'employees.emp_id')
        ->leftJoin('departments', function ($join) {
            $join->on('departments.dept_id', '=', DB::raw('COALESCE(asset_assignments.dept_id, employees.dept_id)'));
        })
        ->leftJoin('labs', 'asset_assignments.lab_id', '=', 'labs.lab_id')
        ->leftJoin('offices', 'asset_assignments.office_id', '=', 'offices.office_id')
        ->leftJoin('campuses', 'assets.campus_id', '=', 'campuses.campus_id')
        ->select('asset_assignments.*', 'assets.name as asset_name', 'asset_categories.name as category_name', 'employees.first_name', 'employees.last_name', 'employees.office as employee_office', 'departments.name as department_name', 'labs.name as lab_name', 'offices.name as office_name', 'campuses.name as campus_name')
        ->orderByDesc('asset_assignments.assign_id');

    if (!$hasInstitutionWideAccess) {
        $assignmentsQuery->where('assets.campus_id', $requestingCampusId);
    }

    $assignments = $assignmentsQuery->get();

    $data = $assignments->map(function ($assignment) {
        return [
            'id' => $assignment->assign_id,
            'assetId' => $assignment->asset_id,
            'assetName' => $assignment->asset_name ?? 'Unknown asset',
            'assetType' => $assignment->category_name ?? 'Uncategorized',
            'employeeId' => $assignment->emp_id,
            'employeeName' => trim(($assignment->first_name ?? '') . ' ' . ($assignment->last_name ?? '')) ?: 'Unknown employee',
            'campus' => $assignment->campus_name ?? 'Unassigned campus',
            'department' => $assignment->department_name ?? 'Unassigned department',
            'assignmentType' => $assignment->assignment_type ?? 'Department',
            'location' => $assignment->lab_name ?? $assignment->office_name ?? $assignment->department_name ?? 'Unassigned location',
            'office' => $assignment->office_name ?? $assignment->employee_office,
            'status' => $assignment->status,
            'assignDate' => $assignment->assign_date,
            'expectedReturnDate' => $assignment->expected_return_date,
            'actualReturnDate' => $assignment->actual_return_date,
            'notes' => $assignment->notes ?? '',
        ];
    });

    return response()->json(['success' => true, 'data' => $data]);
});

Route::get('/assignment-locations', function (Request $request) {
    $requestingUser = $request->user();
    if (!$requestingUser) return response()->json(['success' => false, 'message' => 'Invalid token'], 401);

    $roleName = DB::table('roles')->where('role_id', $requestingUser->role_id)->value('name');
    $hasInstitutionWideAccess = strcasecmp($roleName ?? '', 'Overall Administrator') === 0;
    $requestingCampusId = DB::table('employees')->join('departments', 'employees.dept_id', '=', 'departments.dept_id')->where('employees.emp_id', $requestingUser->emp_id)->value('departments.campus_id');
    $campusId = $hasInstitutionWideAccess ? $request->integer('campus_id') : $requestingCampusId;
    if (!$campusId) return response()->json(['success' => false, 'message' => 'Select a campus first'], 422);

    $labs = DB::table('labs')->where('campus_id', $campusId)->orderBy('name')->get(['lab_id as id', 'dept_id as departmentId', DB::raw("'Lab' as type"), 'name']);
    $offices = DB::table('offices')->where('campus_id', $campusId)->orderBy('name')->get(['office_id as id', 'dept_id as departmentId', DB::raw("'Office' as type"), 'name']);
    $locations = $labs->concat($offices)->values();
    return response()->json(['success' => true, 'data' => $locations]);
});

Route::post('/assignments', function (Request $request) {
    $data = $request->validate([
        'asset_id' => 'required|exists:assets,asset_id',
        'emp_id' => 'required|exists:employees,emp_id',
        'dept_id' => 'required|exists:departments,dept_id',
        'assignment_type' => 'required|in:Department,Lab,Office',
        'location_name' => 'nullable|string|max:100',
        'assign_date' => 'nullable|date',
        'expected_return_date' => 'nullable|date|after_or_equal:assign_date',
        'notes' => 'nullable|string',
    ]);

    $requestingUser = $request->user();
    $roleName = $requestingUser ? DB::table('roles')->where('role_id', $requestingUser->role_id)->value('name') : null;
    if (!in_array(strtolower($roleName ?? ''), ['overall administrator', 'campus administrator', 'ict officer'], true)) {
        return response()->json(['success' => false, 'message' => 'Only Overall Administrators, Campus Administrators, and ICT Officers can assign assets'], 403);
    }

    $asset = DB::table('assets')->where('asset_id', $data['asset_id'])->first();
    $department = DB::table('departments')->where('dept_id', $data['dept_id'])->first();
    $employeeCampusId = DB::table('employees')->join('departments', 'employees.dept_id', '=', 'departments.dept_id')->where('employees.emp_id', $data['emp_id'])->value('departments.campus_id');
    if (!$asset || !$department || $asset->status !== 'Available' || $asset->campus_id != $department->campus_id || $employeeCampusId != $asset->campus_id) {
        return response()->json(['success' => false, 'message' => 'Asset, department, and employee must be available and belong to the same campus'], 422);
    }

    $isOverallAdmin = strcasecmp($roleName ?? '', 'Overall Administrator') === 0;
    $requestingCampusId = DB::table('employees')->join('departments', 'employees.dept_id', '=', 'departments.dept_id')->where('employees.emp_id', $requestingUser->emp_id)->value('departments.campus_id');
    if (!$isOverallAdmin && $requestingCampusId != $asset->campus_id) {
        return response()->json(['success' => false, 'message' => 'You can only assign assets from your campus'], 403);
    }

    $labId = null;
    $officeId = null;
    if ($data['assignment_type'] !== 'Department') {
        $locationName = trim($data['location_name'] ?? '');
        if ($locationName === '') return response()->json(['success' => false, 'message' => 'Enter the lab or office name'], 422);
        $locationTable = $data['assignment_type'] === 'Lab' ? 'labs' : 'offices';
        $locationKey = $data['assignment_type'] === 'Lab' ? 'lab_id' : 'office_id';
        $locationId = DB::table($locationTable)->where('campus_id', $asset->campus_id)->where('name', $locationName)->value($locationKey);
        if (!$locationId) {
            $locationId = DB::table($locationTable)->insertGetId(['campus_id' => $asset->campus_id, 'dept_id' => $data['dept_id'], 'name' => $locationName, 'created_at' => now(), 'updated_at' => now()]);
        }
        $data['assignment_type'] === 'Lab' ? $labId = $locationId : $officeId = $locationId;
    }

    $assignId = DB::table('asset_assignments')->insertGetId([
        'asset_id' => $data['asset_id'],
        'emp_id' => $data['emp_id'],
        'dept_id' => $data['dept_id'],
        'lab_id' => $labId,
        'office_id' => $officeId,
        'assignment_type' => $data['assignment_type'],
        'assigned_by' => $requestingUser->user_id,
        'assign_date' => $data['assign_date'] ?? now(),
        'expected_return_date' => $data['expected_return_date'] ?? null,
        'notes' => $data['notes'] ?? null,
        'status' => 'Active',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    DB::table('assets')->where('asset_id', $data['asset_id'])->update([
        'status' => 'Assigned',
        'updated_at' => now(),
    ]);

    return response()->json(['success' => true, 'message' => 'Asset assigned', 'data' => ['id' => $assignId]], 201);
});

// =====================
// TRANSFERS
// =====================
Route::get('/transfers', function (Request $request) {
    $bearerToken = $request->bearerToken();
    if (!$bearerToken) return response()->json(['success' => false, 'message' => 'Token missing'], 401);

    $transfers = DB::table('asset_transfers')
        ->leftJoin('assets', 'asset_transfers.asset_id', '=', 'assets.asset_id')
        ->select('asset_transfers.*', 'assets.name as asset_name')
        ->get();

    $data = $transfers->map(function ($transfer) {
        return [
            'id' => $transfer->trans_id,
            'transferNumber' => 'IAA-TRF-' . str_pad((string) $transfer->trans_id, 6, '0', STR_PAD_LEFT),
            'assetId' => $transfer->asset_id,
            'assetName' => $transfer->asset_name,
            'fromCampus' => $transfer->from_campus_id ? DB::table('campuses')->where('campus_id', $transfer->from_campus_id)->value('name') : null,
            'fromDepartment' => $transfer->from_dept_id ? DB::table('departments')->where('dept_id', $transfer->from_dept_id)->value('name') : null,
            'toCampus' => $transfer->to_campus_id ? DB::table('campuses')->where('campus_id', $transfer->to_campus_id)->value('name') : null,
            'toDepartment' => $transfer->to_dept_id ? DB::table('departments')->where('dept_id', $transfer->to_dept_id)->value('name') : null,
            'status' => $transfer->status,
            'transferDate' => $transfer->transfer_date
        ];
    });

    return response()->json(['success' => true, 'data' => $data]);
});

Route::post('/transfers', function (Request $request) {
    $user = $request->user();
    $isIctOfficer = $user?->hasRole('ICT Officer');
    $source = DB::table('employees')
        ->join('departments', 'employees.dept_id', '=', 'departments.dept_id')
        ->where('employees.emp_id', $user?->emp_id)
        ->select('employees.dept_id', 'departments.campus_id')
        ->first();
    if ($isIctOfficer && !$source) {
        return response()->json(['success' => false, 'message' => 'Your account is not linked to a source department'], 422);
    }

    $data = $request->validate([
        'asset_id' => 'required|exists:assets,asset_id',
        'to_campus_id' => 'required|exists:campuses,campus_id',
        'from_campus_id' => $isIctOfficer ? 'nullable' : 'required|exists:campuses,campus_id',
        'from_dept_id' => $isIctOfficer ? 'required|exists:departments,dept_id' : 'nullable|exists:departments,dept_id',
        'to_dept_id' => $isIctOfficer ? 'required|exists:departments,dept_id' : 'nullable|exists:departments,dept_id',
        'transfer_date' => 'nullable|date',
        'reason' => 'nullable|string',
        'status' => 'nullable|string',
    ]);

    $asset = DB::table('assets')->where('asset_id', $data['asset_id'])->first();
    if (!$asset) {
        return response()->json(['success' => false, 'message' => 'Asset not found'], 422);
    }

    $sourceCampusId = $isIctOfficer ? $source->campus_id : $data['from_campus_id'];

    if ($isIctOfficer) {
        // ICT Officers only move assets between departments within their own campus.
        if ((int) $data['to_campus_id'] !== (int) $sourceCampusId) {
            return response()->json(['success' => false, 'message' => 'ICT Officer transfers must stay within your own campus'], 422);
        }
        if ((int) $asset->campus_id !== (int) $sourceCampusId) {
            return response()->json(['success' => false, 'message' => 'You can only transfer assets from your own campus'], 422);
        }
        if ((int) $data['from_dept_id'] === (int) $data['to_dept_id']) {
            return response()->json(['success' => false, 'message' => 'Source and destination departments must be different'], 422);
        }
        if (!DB::table('departments')->where('dept_id', $data['from_dept_id'])->where('campus_id', $sourceCampusId)->exists()) {
            return response()->json(['success' => false, 'message' => 'Source department does not belong to your campus'], 422);
        }
        if ((int) $asset->dept_id !== (int) $data['from_dept_id']) {
            return response()->json(['success' => false, 'message' => 'The selected asset is not assigned to the source department'], 422);
        }
    } else {
        if ((int) $data['to_campus_id'] === (int) $sourceCampusId) {
            return response()->json(['success' => false, 'message' => 'Destination campus must differ from your source campus'], 422);
        }
    }

    if (!empty($data['to_dept_id']) && !DB::table('departments')->where('dept_id', $data['to_dept_id'])->where('campus_id', $data['to_campus_id'])->exists()) {
        return response()->json(['success' => false, 'message' => 'Destination department does not belong to the destination campus'], 422);
    }

    $transId = DB::table('asset_transfers')->insertGetId([
        'asset_id' => $data['asset_id'],
        'from_dept_id' => $isIctOfficer ? $data['from_dept_id'] : ($data['from_dept_id'] ?? null),
        'from_campus_id' => $sourceCampusId,
        'to_dept_id' => $data['to_dept_id'] ?? null,
        'to_campus_id' => $data['to_campus_id'],
        'transfer_date' => $data['transfer_date'] ?? now(),
        'reason' => $data['reason'] ?? '',
        'status' => $data['status'] ?? 'Pending',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    // Badilisha status ya asset kuwa Assigned (Pending Transfer haipo kwenye database!)
    DB::table('assets')->where('asset_id', $data['asset_id'])->update([
        'status' => 'Assigned',
        'updated_at' => now(),
    ]);

    return response()->json(['success' => true, 'message' => 'Transfer created', 'data' => ['id' => $transId]], 201);
});

Route::patch('/transfers/{id}/status', function (Request $request, $id) {
    $data = $request->validate([
        'status' => 'required|string'
    ]);

    DB::table('asset_transfers')->where('trans_id', $id)->update([
        'status' => $data['status'],
        'updated_at' => now(),
    ]);

    return response()->json(['success' => true, 'message' => 'Transfer status updated']);
});

// =====================
// MAINTENANCE
// =====================
Route::get('/maintenance', function (Request $request) {
    $bearerToken = $request->bearerToken();
    if (!$bearerToken) return response()->json(['success' => false, 'message' => 'Token missing'], 401);

    $requestingUser = PersonalAccessToken::findToken($bearerToken)?->tokenable;
    if (!$requestingUser) return response()->json(['success' => false, 'message' => 'Invalid token'], 401);
    $roleName = DB::table('roles')->where('role_id', $requestingUser->role_id)->value('name');

    $maintenanceQuery = DB::table('maintenance')
        ->leftJoin('assets', 'maintenance.asset_id', '=', 'assets.asset_id')
        ->leftJoin('campuses', 'assets.campus_id', '=', 'campuses.campus_id')
        ->select('maintenance.*', 'assets.name as asset_name')
        ->addSelect('campuses.name as campus_name')
        ->where('maintenance.status', 'In Progress');
    if (in_array(strtolower($roleName ?? ''), ['employee', 'lab manager'], true)) {
        $maintenanceQuery->where('maintenance.reported_by', $requestingUser->user_id);
    }
    $maintenance = $maintenanceQuery->get();

    $data = $maintenance->map(function ($item) {
        return [
            'id' => $item->maint_id,
            'assetId' => $item->asset_id,
            'assetName' => $item->asset_name,
            'status' => $item->status,
            'description' => $item->description,
            'campus' => $item->campus_name,
            'reportedAt' => $item->maintenance_date,
            'resolvedAt' => $item->completion_date
        ];
    });

    return response()->json(['success' => true, 'data' => $data]);
});

Route::post('/maintenance', function (Request $request) {
    $data = $request->validate([
        'asset_id' => 'required|exists:assets,asset_id',
        'description' => 'required|string',
        'request_reason' => 'required|string',
        'requester_name' => 'required|string|max:150',
        'requester_department' => 'required|string|max:150',
        'requester_contact' => 'required|string|max:150',
        'requester_signature' => 'required|string|max:150',
        'maintenance_date' => 'nullable|date',
    ]);

    $user = $request->user();
    if (!$user) return response()->json(['success' => false, 'message' => 'Invalid token'], 401);
    $roleName = DB::table('roles')->where('role_id', $user->role_id)->value('name');
    if (!in_array(strtolower($roleName ?? ''), ['employee', 'lab manager'], true)) {
        return response()->json(['success' => false, 'message' => 'Only an assigned Employee or Lab Manager may request maintenance'], 403);
    }
    $asset = DB::table('assets')->where('asset_id', $data['asset_id'])->first();
    $assignment = DB::table('asset_assignments')
        ->where('asset_id', $data['asset_id'])
        ->where('emp_id', $user->emp_id)
        ->where('status', 'Active')
        ->first();
    if (!$asset || !$assignment || $asset->status !== 'Assigned' || (strcasecmp($roleName ?? '', 'Lab Manager') === 0 && $assignment->assignment_type !== 'Lab')) {
        return response()->json(['success' => false, 'message' => 'You may only request maintenance for your active assigned asset or lab asset'], 422);
    }
    if (DB::table('maintenance')->where('asset_id', $data['asset_id'])->where('status', 'In Progress')->exists()) {
        return response()->json(['success' => false, 'message' => 'This asset already has an active maintenance request'], 422);
    }

    $result = DB::transaction(function () use ($data, $user, $asset, $assignment) {
        $maintId = DB::table('maintenance')->insertGetId([
            'asset_id' => $data['asset_id'], 'reported_by' => $user->user_id, 'description' => $data['description'],
            'request_reason' => $data['request_reason'], 'requester_name' => $data['requester_name'],
            'requester_department' => $data['requester_department'], 'requester_contact' => $data['requester_contact'],
            'requester_signature' => $data['requester_signature'], 'maintenance_date' => $data['maintenance_date'] ?? now(),
            'status' => 'In Progress', 'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('assets')->where('asset_id', $data['asset_id'])->update(['status' => 'Under Maintenance', 'updated_at' => now()]);
        DB::table('asset_assignments')->where('assign_id', $assignment->assign_id)->update(['status' => 'Returned', 'actual_return_date' => now()->toDateString(), 'updated_at' => now()]);

        $replacement = DB::table('assets')->where('campus_id', $asset->campus_id)->where('cat_id', $asset->cat_id)->where('status', 'Available')->lockForUpdate()->first();
        if (!$replacement) return ['maintenance_id' => $maintId, 'replacement_asset_id' => null];
        DB::table('asset_assignments')->insert([
            'asset_id' => $replacement->asset_id, 'emp_id' => $assignment->emp_id, 'dept_id' => $assignment->dept_id,
            'lab_id' => $assignment->lab_id, 'office_id' => $assignment->office_id, 'assignment_type' => $assignment->assignment_type,
            'assigned_by' => $user->user_id, 'assign_date' => now()->toDateString(), 'status' => 'Active',
            'notes' => 'Automatic replacement for maintenance request #' . $maintId, 'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('assets')->where('asset_id', $replacement->asset_id)->update(['status' => 'Assigned', 'updated_at' => now()]);
        return ['maintenance_id' => $maintId, 'replacement_asset_id' => $replacement->asset_id];
    });

    return response()->json(['success' => true, 'message' => $result['replacement_asset_id'] ? 'Maintenance ticket created and a replacement asset assigned' : 'Maintenance ticket created; no matching replacement asset is currently available', 'data' => $result], 201);
});

Route::patch('/maintenance/{id}/status', function (Request $request, $id) {
    $data = $request->validate([
        'status' => 'required|string',
        'notes' => 'nullable|string',
        'completion_date' => 'nullable|date',
    ]);

    $maintenance = DB::table('maintenance')->where('maint_id', $id)->first();
    if (!$maintenance) return response()->json(['success' => false, 'message' => 'Maintenance not found'], 404);
    if ($maintenance->status !== 'In Progress') {
        return response()->json(['success' => false, 'message' => 'Completed or cancelled maintenance cannot be changed'], 422);
    }
    if (!in_array($data['status'], ['Completed', 'Cancelled'], true)) {
        return response()->json(['success' => false, 'message' => 'Maintenance can only be completed or cancelled'], 422);
    }

    DB::table('maintenance')->where('maint_id', $id)->update([
        'status' => $data['status'],
        'notes' => $data['notes'] ?? null,
        'completion_date' => $data['completion_date'] ?? null,
        'updated_at' => now(),
    ]);

    if ($data['status'] === 'Completed') {
        DB::table('assets')->where('asset_id', $maintenance->asset_id)->update([
            'status' => 'Available',
            'disposal_ready' => false,
            'updated_at' => now(),
        ]);
    } else {
        DB::table('assets')->where('asset_id', $maintenance->asset_id)->update([
            'status' => 'Disposed',
            'disposal_ready' => true,
            'updated_at' => now(),
        ]);
    }

    return response()->json(['success' => true, 'message' => 'Maintenance status updated']);
});

// =====================
// SUPPLIERS
// =====================
Route::get('/suppliers', function (Request $request) {
    $bearerToken = $request->bearerToken();
    if (!$bearerToken) return response()->json(['success' => false, 'message' => 'Token missing'], 401);

    $suppliers = DB::table('suppliers')->get();
    $data = $suppliers->map(function ($supplier) {
        return [
            'id' => $supplier->supp_id,
            'name' => $supplier->name,
            'contactPerson' => $supplier->contact_person,
            'email' => $supplier->email,
            'phone' => $supplier->phone,
            'address' => $supplier->address,
            'tin' => $supplier->tin,
            'isActive' => $supplier->is_active
        ];
    });

    return response()->json(['success' => true, 'data' => $data]);
});

// =====================
// PURCHASES
// =====================
Route::get('/purchases', function (Request $request) {
    $bearerToken = $request->bearerToken();
    if (!$bearerToken) return response()->json(['success' => false, 'message' => 'Token missing'], 401);

    $purchases = DB::table('purchases')
        ->leftJoin('suppliers', 'purchases.supp_id', '=', 'suppliers.supp_id')
        ->select('purchases.*', 'suppliers.name as supplier_name')
        ->selectRaw('(SELECT COALESCE(SUM(quantity), 0) FROM purchase_items WHERE purchase_items.purch_id = purchases.purch_id) as total_quantity')
        ->orderByDesc('purchases.purch_id')
        ->get();

    $data = $purchases->map(function ($purchase) {
        return [
            'id' => $purchase->purch_id,
            'poNumber' => $purchase->po_number,
            'supplierId' => $purchase->supp_id,
            'supplierName' => $purchase->supplier_name,
            'totalAmount' => $purchase->total_amount,
            'status' => $purchase->status,
            'orderDate' => $purchase->purch_date,
            'deliveryDate' => $purchase->expected_delivery,
            'itemCount' => (int) $purchase->total_quantity,
            'itemsSummary' => $purchase->notes ?? '',
            'currency' => 'TZS',
        ];
    });

    return response()->json(['success' => true, 'data' => $data]);
});

Route::post('/purchases', function (Request $request) {
    $supplierId = $request->input('supplier_id');
    if (!$supplierId && $request->filled('supplierName')) {
        $supplierId = DB::table('suppliers')->where('name', $request->input('supplierName'))->value('supp_id');
    }

    $request->merge([
        'supplier_id' => $supplierId,
        'purch_date' => $request->input('purch_date', $request->input('orderDate')),
        'expected_delivery' => $request->input('expected_delivery', $request->input('deliveryDate')),
        'total_amount' => $request->input('total_amount', $request->input('totalAmount')),
        'status' => $request->input('status') === 'Pending' ? 'Draft' : $request->input('status'),
        'quantity' => $request->input('quantity', $request->input('itemCount')),
        'notes' => $request->input('notes', $request->input('itemsSummary')),
    ]);

    $data = $request->validate([
        'supplier_id' => 'required|exists:suppliers,supp_id',
        'purch_date' => 'required|date',
        'expected_delivery' => 'nullable|date|after_or_equal:purch_date',
        'total_amount' => 'required|numeric|min:0.01',
        'status' => 'required|in:Draft,Ordered,Received,Confirmed,Cancelled',
        'quantity' => 'required|integer|min:1',
        'notes' => 'required|string|min:3',
    ]);

    $purchase = DB::transaction(function () use ($data) {
        $nextNumber = ((int) DB::table('purchases')->lockForUpdate()->max('purch_id')) + 1;
        $poNumber = 'IAA-PO-' . date('Y') . '-' . str_pad((string) $nextNumber, 6, '0', STR_PAD_LEFT);
        $purchaseId = DB::table('purchases')->insertGetId([
            'supp_id' => $data['supplier_id'],
            'po_number' => $poNumber,
            'purch_date' => $data['purch_date'],
            'expected_delivery' => $data['expected_delivery'] ?? null,
            'total_amount' => $data['total_amount'],
            'status' => $data['status'],
            'notes' => $data['notes'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('purchase_items')->insert([
            'purch_id' => $purchaseId,
            'quantity' => $data['quantity'],
            'unit_price' => $data['total_amount'] / $data['quantity'],
            'total_price' => $data['total_amount'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return DB::table('purchases')
            ->leftJoin('suppliers', 'purchases.supp_id', '=', 'suppliers.supp_id')
            ->where('purchases.purch_id', $purchaseId)
            ->select('purchases.*', 'suppliers.name as supplier_name')
            ->first();
    });

    return response()->json(['success' => true, 'message' => 'Purchase order created successfully', 'data' => [
        'id' => $purchase->purch_id,
        'poNumber' => $purchase->po_number,
        'supplierId' => $purchase->supp_id,
        'supplierName' => $purchase->supplier_name,
        'orderDate' => $purchase->purch_date,
        'deliveryDate' => $purchase->expected_delivery,
        'totalAmount' => $purchase->total_amount,
        'status' => $purchase->status,
        'itemCount' => (int) $data['quantity'],
        'itemsSummary' => $purchase->notes,
        'currency' => 'TZS',
    ]], 201);
});

Route::patch('/purchases/{id}/status', function (Request $request, $id) {
    $data = $request->validate([
        'status' => 'required|in:Draft,Ordered,Received,Confirmed,Cancelled',
    ]);

    $existingPurchase = DB::table('purchases')->where('purch_id', $id)->first();
    if (!$existingPurchase) {
        return response()->json(['success' => false, 'message' => 'Purchase order not found'], 404);
    }
    if ($existingPurchase->status === 'Cancelled') {
        return response()->json(['success' => false, 'message' => 'Cancelled purchase orders have been returned to the supplier and cannot be changed'], 422);
    }

    $updated = DB::table('purchases')->where('purch_id', $id)->update([
        'status' => $data['status'],
        'updated_at' => now(),
    ]);

    $purchase = DB::table('purchases')
        ->leftJoin('suppliers', 'purchases.supp_id', '=', 'suppliers.supp_id')
        ->where('purchases.purch_id', $id)
        ->select('purchases.*', 'suppliers.name as supplier_name')
        ->first();

    $quantity = DB::table('purchase_items')->where('purch_id', $id)->sum('quantity');
    return response()->json(['success' => true, 'message' => 'Purchase order status updated', 'data' => [
        'id' => $purchase->purch_id,
        'poNumber' => $purchase->po_number,
        'supplierId' => $purchase->supp_id,
        'supplierName' => $purchase->supplier_name,
        'orderDate' => $purchase->purch_date,
        'deliveryDate' => $purchase->expected_delivery,
        'totalAmount' => $purchase->total_amount,
        'status' => $purchase->status,
        'itemCount' => (int) $quantity,
        'itemsSummary' => $purchase->notes ?? '',
        'currency' => 'TZS',
    ]]);
});

// =====================
// DISPOSAL
// =====================
Route::get('/disposal', function (Request $request) {
    $bearerToken = $request->bearerToken();
    if (!$bearerToken) return response()->json(['success' => false, 'message' => 'Token missing'], 401);

    $disposals = DB::table('asset_disposal')
        ->leftJoin('assets', 'asset_disposal.asset_id', '=', 'assets.asset_id')
        ->leftJoin('disposal_batches', 'asset_disposal.batch_id', '=', 'disposal_batches.batch_id')
        ->leftJoin('users', 'asset_disposal.authorized_by', '=', 'users.user_id')
        ->select('asset_disposal.*', 'assets.name as asset_name', 'users.username as recorder_username', 'users.email as recorder_email', 'disposal_batches.disposal_officer', 'disposal_batches.recipient_name', 'disposal_batches.recipient_contact', 'disposal_batches.procurement_signatory', 'disposal_batches.campus_admin_signatory')
        ->orderByDesc('asset_disposal.disposal_id')
        ->get();

    $data = $disposals->map(function ($disposal) {
        $recordedBy = trim(($disposal->recorder_username ?? '') . ' ' . ($disposal->recorder_email ?? '')) ?: 'System';
        $snapshot = $disposal->asset_snapshot ? json_decode($disposal->asset_snapshot, true) : [];

        return [
            'id' => $disposal->disposal_id,
            'batchId' => $disposal->batch_id,
            'disposalNumber' => 'IAA-DSP-' . str_pad((string) ($disposal->batch_id ?? $disposal->disposal_id), 6, '0', STR_PAD_LEFT),
            'assetId' => $disposal->asset_id,
            'assetName' => $disposal->asset_name ?? ($snapshot['name'] ?? 'Removed asset'),
            'assetTag' => $snapshot['assetTag'] ?? '',
            'method' => $disposal->method,
            'reason' => $disposal->reason,
            'disposalDate' => $disposal->disposal_date,
            'status' => 'Disposed',
            'recordedBy' => $recordedBy,
            'disposalOfficer' => $disposal->disposal_officer ?? $recordedBy,
            'recipientName' => $disposal->recipient_name ?? '',
            'recipientContact' => $disposal->recipient_contact ?? '',
            'procurementSignatory' => $disposal->procurement_signatory ?? '',
            'campusAdminSignatory' => $disposal->campus_admin_signatory ?? '',
        ];
    });

    return response()->json(['success' => true, 'data' => $data]);
});

Route::post('/disposal', function (Request $request) {
    $data = $request->validate([
        'asset_ids' => 'required|array|min:1',
        'asset_ids.*' => 'integer|exists:assets,asset_id',
        'method' => 'required|string',
        'reason' => 'required|string|min:3',
        'disposal_date' => 'nullable|date',
        'disposal_officer' => 'required|string|max:150',
        'disposal_officer_role' => 'required|string|max:100',
        'disposal_officer_campus' => 'required|string|max:150',
        'disposal_officer_signature' => 'required|string|max:150',
        'destination' => 'required|string|max:255',
        'recipient_name' => 'required|string|max:150',
        'recipient_organization' => 'required|string|max:150',
        'recipient_position' => 'required|string|max:150',
        'recipient_contact' => 'nullable|string|max:150',
        'recipient_signature' => 'required|string|max:150',
        'procurement_signatory' => 'required|string|max:150',
        'procurement_officer_email' => 'required|email|max:150',
        'campus_admin_signatory' => 'required|string|max:150',
        'campus_admin_email' => 'required|email|max:150',
    ]);

    $user = $request->user();
    $roleName = $user ? DB::table('roles')->where('role_id', $user->role_id)->value('name') : null;
    if (!in_array(strtolower($roleName ?? ''), ['overall administrator', 'campus administrator', 'ict officer'], true)) {
        return response()->json(['success' => false, 'message' => 'You are not authorized to dispose assets'], 403);
    }

    $assets = DB::table('assets')->whereIn('asset_id', $data['asset_ids'])->get();
    if ($assets->count() !== count(array_unique($data['asset_ids'])) || $assets->contains(fn ($asset) => !$asset->disposal_ready)) {
        return response()->json(['success' => false, 'message' => 'Only assets cancelled from maintenance may be disposed'], 422);
    }
    if (strcasecmp($roleName ?? '', 'Overall Administrator') !== 0) {
        $requestingCampusId = DB::table('employees')
            ->join('departments', 'employees.dept_id', '=', 'departments.dept_id')
            ->where('employees.emp_id', $user->emp_id)
            ->value('departments.campus_id');
        if (!$requestingCampusId || $assets->contains(fn ($asset) => $asset->campus_id != $requestingCampusId)) {
            return response()->json(['success' => false, 'message' => 'You can only dispose assets from your campus'], 403);
        }
    }

    $batchId = DB::transaction(function () use ($data, $user, $assets) {
        $batchId = DB::table('disposal_batches')->insertGetId([
            'authorized_by' => $user->user_id,
            'disposal_officer' => $data['disposal_officer'],
            'disposal_officer_role' => $data['disposal_officer_role'],
            'disposal_officer_campus' => $data['disposal_officer_campus'],
            'disposal_officer_signature' => $data['disposal_officer_signature'],
            'recipient_name' => $data['recipient_name'],
            'recipient_organization' => $data['recipient_organization'],
            'recipient_position' => $data['recipient_position'],
            'recipient_contact' => $data['recipient_contact'] ?? null,
            'recipient_signature' => $data['recipient_signature'],
            'disposal_date' => $data['disposal_date'] ?? now()->toDateString(),
            'method' => $data['method'],
            'reason' => $data['reason'],
            'destination' => $data['destination'],
            'procurement_signatory' => $data['procurement_signatory'],
            'procurement_officer_email' => $data['procurement_officer_email'],
            'campus_admin_signatory' => $data['campus_admin_signatory'],
            'campus_admin_email' => $data['campus_admin_email'],
            'created_at' => now(), 'updated_at' => now(),
        ]);

        foreach ($assets as $asset) {
            DB::table('asset_disposal')->insert([
                'batch_id' => $batchId, 'asset_id' => $asset->asset_id, 'authorized_by' => $user->user_id,
                'asset_snapshot' => json_encode(['assetTag' => $asset->serial_number, 'name' => $asset->name, 'model' => $asset->model]),
                'method' => $data['method'], 'reason' => $data['reason'], 'disposal_date' => $data['disposal_date'] ?? now()->toDateString(),
                'created_at' => now(), 'updated_at' => now(),
            ]);
            DB::table('asset_assignments')->where('asset_id', $asset->asset_id)->delete();
            DB::table('asset_transfers')->where('asset_id', $asset->asset_id)->delete();
            DB::table('maintenance')->where('asset_id', $asset->asset_id)->delete();
            DB::table('asset_requests')->where('asset_id', $asset->asset_id)->delete();
            DB::table('assets')->where('asset_id', $asset->asset_id)->delete();
        }
        return $batchId;
    });

    $notification = "Complete asset removal IAA-DSP-" . str_pad((string) $batchId, 6, '0', STR_PAD_LEFT)
        . " has been electronically signed by Procurement Officer " . $data['procurement_signatory']
        . " and approved by Campus Administrator " . $data['campus_admin_signatory'] . ".";
    Mail::raw($notification, function ($message) use ($data) {
        $message->to([$data['procurement_officer_email'], $data['campus_admin_email']])
            ->subject('ICTIMS Complete Asset Removal Approval');
    });

    return response()->json(['success' => true, 'message' => 'Assets permanently removed from the system and approval notifications sent', 'data' => ['batch_id' => $batchId]], 201);
});

// =====================
// CAMPUSES
// =====================
Route::get('/campuses', function (Request $request) {
    $bearerToken = $request->bearerToken();
    if (!$bearerToken) return response()->json(['success' => false, 'message' => 'Token missing'], 401);

    $campuses = DB::table('campuses')->get();
    return response()->json(['success' => true, 'data' => $campuses]);
});

Route::post('/campuses', function (Request $request) {
    if (!$request->user()->hasRole('Overall Administrator')) {
        return response()->json(['success' => false, 'message' => 'Only the Overall Administrator can add campuses'], 403);
    }

    $data = $request->validate([
        'name' => 'required|string|max:100|unique:campuses,name',
        'code' => 'required|string|max:20|unique:campuses,code',
        'location' => 'nullable|string',
        'description' => 'nullable|string',
    ]);

    $campusId = DB::table('campuses')->insertGetId([
        'name' => $data['name'],
        'code' => strtoupper($data['code']),
        'location' => $data['location'] ?? null,
        'description' => $data['description'] ?? null,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    return response()->json(['success' => true, 'message' => 'Campus added successfully', 'data' => ['id' => $campusId]], 201);
});

Route::get('/departments', function (Request $request) {
    $bearerToken = $request->bearerToken();
    if (!$bearerToken) return response()->json(['success' => false, 'message' => 'Token missing'], 401);

    $departments = DB::table('departments')
        ->leftJoin('campuses', 'departments.campus_id', '=', 'campuses.campus_id')
        ->select('departments.dept_id', 'departments.name', 'departments.code', 'departments.campus_id', 
                 'departments.description', 'departments.created_at', 'departments.updated_at', 'campuses.name as campus')
        ->orderBy('departments.name')
        ->get();

    $data = $departments->map(function ($dept) {
        $employeeCount = DB::table('employees')->where('dept_id', $dept->dept_id)->count();
        $assetCount = DB::table('assets')->where('dept_id', $dept->dept_id)->count();
        // Get HOD from employees (for now, just get the first employee as HOD - can be enhanced)
        $hod = DB::table('employees')->where('dept_id', $dept->dept_id)->orderBy('emp_id')->first();
        $hodName = $hod ? $hod->first_name . ' ' . $hod->last_name : null;
        
        return [
            'dept_id' => $dept->dept_id,
            'id' => $dept->dept_id,
            'name' => $dept->name,
            'code' => $dept->code,
            'campus_id' => $dept->campus_id,
            'campus' => $dept->campus,
            'description' => $dept->description,
            'headOfDepartment' => $hodName,
            'totalEmployees' => $employeeCount,
            'totalAssets' => $assetCount,
            'created_at' => $dept->created_at,
            'updated_at' => $dept->updated_at,
        ];
    });

    return response()->json(['success' => true, 'data' => $data]);
});

// =====================
// EMPLOYEES
// =====================
Route::get('/employees', function (Request $request) {
    $bearerToken = $request->bearerToken();
    if (!$bearerToken) return response()->json(['success' => false, 'message' => 'Token missing'], 401);

    $employees = DB::table('employees')
        ->leftJoin('departments', 'employees.dept_id', '=', 'departments.dept_id')
        ->leftJoin('campuses', 'departments.campus_id', '=', 'campuses.campus_id')
        ->select('employees.*', 'departments.name as department_name', 'campuses.name as campus_name')
        ->orderByDesc('employees.emp_id')
        ->get();

    $data = $employees->map(fn ($employee) => [
        'id' => $employee->emp_id,
        'employeeNo' => $employee->employee_no,
        'firstName' => $employee->first_name,
        'lastName' => $employee->last_name,
        'fullName' => trim($employee->first_name . ' ' . $employee->last_name),
        'email' => $employee->email,
        'phone' => $employee->phone,
        'designation' => $employee->job_title,
        'jobTitle' => $employee->job_title,
        'departmentId' => $employee->dept_id,
        'department' => $employee->department_name,
        'campus' => $employee->campus_name,
        'isActive' => (bool) $employee->is_active,
        'status' => $employee->is_active ? 'Active' : 'Inactive',
        'assignedAssetsCount' => DB::table('asset_assignments')->where('emp_id', $employee->emp_id)->where('status', 'Active')->count(),
        'createdAt' => $employee->created_at,
    ]);

    return response()->json(['success' => true, 'data' => $data]);
});

Route::post('/employees', function (Request $request) {
    $data = $request->validate([
        'employeeNumber' => 'required|string|max:20|unique:employees,employee_no',
        'fullName' => 'required|string|max:101',
        'email' => 'required|email|max:100|unique:employees,email',
        'phone' => 'nullable|string|max:20',
        'campus' => 'required|string|max:100',
        'department' => 'required|string|max:100',
        'designation' => 'required|string|max:100',
    ]);

    $campusId = DB::table('campuses')->where('name', $data['campus'])->value('campus_id');
    if (!$campusId) {
        return response()->json(['success' => false, 'message' => 'Selected campus was not found'], 422);
    }

    $department = DB::table('departments')
        ->where('campus_id', $campusId)
        ->where('name', $data['department'])
        ->first();
    if (!$department) {
        return response()->json(['success' => false, 'message' => 'Selected department does not belong to the selected campus'], 422);
    }

    $nameParts = preg_split('/\s+/', trim($data['fullName']), 2);
    $employeeId = DB::table('employees')->insertGetId([
        'dept_id' => $department->dept_id,
        'employee_no' => $data['employeeNumber'],
        'first_name' => $nameParts[0],
        'last_name' => $nameParts[1] ?? '',
        'email' => $data['email'],
        'phone' => $data['phone'] ?? null,
        'job_title' => $data['designation'],
        'is_active' => true,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    return response()->json(['success' => true, 'message' => 'Employee registered successfully', 'data' => ['id' => $employeeId]], 201);
});

Route::put('/employees/{id}', function (Request $request, $id) {
    $employee = DB::table('employees')->where('emp_id', $id)->first();
    if (!$employee) {
        return response()->json(['success' => false, 'message' => 'Employee not found'], 404);
    }

    $data = $request->validate([
        'employeeNumber' => 'required|string|max:20|unique:employees,employee_no,' . $id . ',emp_id',
        'fullName' => 'required|string|max:101',
        'email' => 'required|email|max:100|unique:employees,email,' . $id . ',emp_id',
        'phone' => 'nullable|string|max:20',
        'campus' => 'required|string|max:100',
        'department' => 'required|string|max:100',
        'designation' => 'required|string|max:100',
    ]);

    $campusId = DB::table('campuses')->where('name', $data['campus'])->value('campus_id');
    if (!$campusId) {
        return response()->json(['success' => false, 'message' => 'Selected campus was not found'], 422);
    }

    $department = DB::table('departments')
        ->where('campus_id', $campusId)
        ->where('name', $data['department'])
        ->first();
    if (!$department) {
        return response()->json(['success' => false, 'message' => 'Selected department does not belong to the selected campus'], 422);
    }

    $nameParts = preg_split('/\s+/', trim($data['fullName']), 2);
    DB::table('employees')->where('emp_id', $id)->update([
        'dept_id' => $department->dept_id,
        'employee_no' => $data['employeeNumber'],
        'first_name' => $nameParts[0],
        'last_name' => $nameParts[1] ?? '',
        'email' => $data['email'],
        'phone' => $data['phone'] ?? null,
        'job_title' => $data['designation'],
        'updated_at' => now(),
    ]);

    return response()->json(['success' => true, 'message' => 'Employee updated successfully']);
});

Route::patch('/employees/{id}/status', function (Request $request, $id) {
    $data = $request->validate(['isActive' => 'required|boolean']);

    $updated = DB::table('employees')->where('emp_id', $id)->update([
        'is_active' => $data['isActive'],
        'updated_at' => now(),
    ]);
    if (!$updated) {
        return response()->json(['success' => false, 'message' => 'Employee not found'], 404);
    }

    return response()->json(['success' => true, 'message' => $data['isActive'] ? 'Employee activated' : 'Employee deactivated']);
});

// =====================
// ROLES & PERMISSIONS (admin-configurable, no code changes required)
// =====================
Route::get('/roles', function (Request $request) {
    $roles = DB::table('roles')->orderBy('role_id')->get();
    $permissions = DB::table('permissions')->get()->groupBy('role_id');

    $data = $roles->map(function ($role) use ($permissions) {
        $rolePermissions = ($permissions[$role->role_id] ?? collect())->map(fn ($permission) => [
            'id' => $permission->perm_id,
            'module' => $permission->module,
            'action' => $permission->action,
            'resource' => $permission->resource,
        ])->values();

        return [
            'id' => $role->role_id,
            'name' => $role->name,
            'description' => $role->description,
            'permissions' => $rolePermissions,
            'userCount' => DB::table('users')->where('role_id', $role->role_id)->count(),
        ];
    });

    return response()->json(['success' => true, 'data' => $data]);
});

Route::get('/permissions/catalog', function () {
    // Static catalog of module.action combinations the admin UI can assign to a role.
    $modules = [
        'dashboard' => ['view'],
        'assets' => ['view', 'manage'],
        'assignments' => ['view', 'manage'],
        'maintenance' => ['view', 'manage'],
        'disposal' => ['view', 'manage'],
        'transfers' => ['view', 'manage', 'approve'],
        'employees' => ['view', 'manage'],
        'users' => ['view', 'manage'],
        'system' => ['view', 'manage'],
        'procurement' => ['view', 'manage'],
        'suppliers' => ['view', 'manage'],
        'requests' => ['view', 'create', 'approve', 'manage'],
        'audit' => ['view'],
        'reports' => ['view'],
        'my-assets' => ['view'],
    ];

    return response()->json(['success' => true, 'data' => $modules]);
});

Route::post('/roles', function (Request $request) {
    if (!$request->user()->hasRole('Overall Administrator')) {
        return response()->json(['success' => false, 'message' => 'Only the Overall Administrator can create roles'], 403);
    }

    $data = $request->validate([
        'name' => 'required|string|max:50|unique:roles,name',
        'description' => 'nullable|string',
        'permissions' => 'array',
        'permissions.*.module' => 'required|string',
        'permissions.*.action' => 'required|string',
        'permissions.*.resource' => 'nullable|string',
    ]);

    $roleId = DB::table('roles')->insertGetId([
        'name' => $data['name'],
        'description' => $data['description'] ?? null,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    foreach ($data['permissions'] ?? [] as $permission) {
        DB::table('permissions')->insert([
            'role_id' => $roleId,
            'module' => $permission['module'],
            'action' => $permission['action'],
            'resource' => $permission['resource'] ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    return response()->json(['success' => true, 'message' => 'Role created', 'data' => ['id' => $roleId]], 201);
});

Route::put('/roles/{id}', function (Request $request, $id) {
    if (!$request->user()->hasRole('Overall Administrator')) {
        return response()->json(['success' => false, 'message' => 'Only the Overall Administrator can update roles'], 403);
    }

    $role = DB::table('roles')->where('role_id', $id)->first();
    if (!$role) {
        return response()->json(['success' => false, 'message' => 'Role not found'], 404);
    }

    $data = $request->validate([
        'name' => 'sometimes|string|max:50|unique:roles,name,' . $id . ',role_id',
        'description' => 'nullable|string',
    ]);

    DB::table('roles')->where('role_id', $id)->update([
        'name' => $data['name'] ?? $role->name,
        'description' => array_key_exists('description', $data) ? $data['description'] : $role->description,
        'updated_at' => now(),
    ]);

    return response()->json(['success' => true, 'message' => 'Role updated']);
});

Route::put('/roles/{id}/permissions', function (Request $request, $id) {
    if (!$request->user()->hasRole('Overall Administrator')) {
        return response()->json(['success' => false, 'message' => 'Only the Overall Administrator can update permissions'], 403);
    }

    $role = DB::table('roles')->where('role_id', $id)->first();
    if (!$role) {
        return response()->json(['success' => false, 'message' => 'Role not found'], 404);
    }

    $data = $request->validate([
        'permissions' => 'array',
        'permissions.*.module' => 'required|string',
        'permissions.*.action' => 'required|string',
        'permissions.*.resource' => 'nullable|string',
    ]);

    // Replace the full permission set for this role in one transaction-like sweep.
    DB::table('permissions')->where('role_id', $id)->delete();
    foreach ($data['permissions'] ?? [] as $permission) {
        DB::table('permissions')->insert([
            'role_id' => $id,
            'module' => $permission['module'],
            'action' => $permission['action'],
            'resource' => $permission['resource'] ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    return response()->json(['success' => true, 'message' => 'Permissions updated']);
});

Route::delete('/roles/{id}', function (Request $request, $id) {
    if (!$request->user()->hasRole('Overall Administrator')) {
        return response()->json(['success' => false, 'message' => 'Only the Overall Administrator can delete roles'], 403);
    }

    $usersCount = DB::table('users')->where('role_id', $id)->count();
    if ($usersCount > 0) {
        return response()->json(['success' => false, 'message' => "Cannot delete role: {$usersCount} user(s) are still assigned to it"], 422);
    }

    DB::table('permissions')->where('role_id', $id)->delete();
    DB::table('roles')->where('role_id', $id)->delete();

    return response()->json(['success' => true, 'message' => 'Role deleted']);
});

});
