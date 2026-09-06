<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

class AuthorizeRolePermission
{
    public function handle(Request $request, Closure $next): Response
    {
        $plainTextToken = $request->bearerToken();
        $accessToken = $plainTextToken ? PersonalAccessToken::findToken($plainTextToken) : null;
        $user = $accessToken?->tokenable;

        if (!$user || !$user->is_active) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $accessToken->forceFill(['last_used_at' => now()])->save();
        $request->setUserResolver(fn () => $user);

        // Campuses and departments are shared reference data every role needs for dropdowns
        // (transfers, assets, employees, etc.); only writes to them require the system permission.
        $isLookupRead = $request->isMethod('GET') && ($request->is('api/campuses') || $request->is('api/departments'));

        if (!$request->is('api/logout') && !$request->is('api/user') && !$isLookupRead && !$this->isAllowed($user, $request)) {
            return response()->json(['success' => false, 'message' => 'Forbidden'], 403);
        }

        return $next($request);
    }

    private function isAllowed($user, Request $request): bool
    {
        [$module, $action] = $this->permissionFor($request);
        return $user->hasPermission($module, $action);
    }

    private function permissionFor(Request $request): array
    {
        $path = trim($request->path(), '/');
        $segments = explode('/', $path);
        $module = $segments[1] ?? $segments[0] ?? '';

        if (($segments[1] ?? null) === 'reports' && ($segments[2] ?? null) === 'dashboard') {
            return ['dashboard', 'view'];
        }

        $module = match ($module) {
            'reports' => 'reports',
            'user' => 'users',
            'users' => 'users',
            'assets' => 'assets',
            'asset-categories' => 'assets',
            'assignments' => 'assignments',
            'transfers' => 'transfers',
            'requests' => 'requests',
            'maintenance' => 'maintenance',
            'suppliers' => 'suppliers',
            'purchases' => 'procurement',
            'disposal' => 'disposal',
            'campuses', 'departments' => 'system',
            'employees' => 'employees',
            'audit' => 'audit',
            'roles', 'permissions' => 'system',
            default => $module,
        };

        if ($module === 'transfers' && $request->isMethod('PATCH') && $request->route('id')) {
            return ['transfers', 'approve'];
        }

        if ($module === 'requests' && $request->isMethod('PATCH') && $request->route('id')) {
            return ['requests', 'approve'];
        }
        if ($module === 'requests' && $request->isMethod('POST')) {
            return ['requests', 'create'];
        }
        if ($module === 'maintenance' && $request->isMethod('POST')) {
            return ['maintenance', 'create'];
        }

        return [$module, $request->isMethod('GET') ? 'view' : 'manage'];
    }
}
