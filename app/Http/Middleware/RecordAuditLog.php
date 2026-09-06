<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class RecordAuditLog
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if ($response->getStatusCode() < 200 || $response->getStatusCode() >= 300 || !$request->user() || !$this->shouldRecord($request)) {
            return $response;
        }

        $module = $this->moduleFor($request);
        DB::table('audit_logs')->insert([
            'user_id' => $request->user()->user_id,
            'table_name' => $module,
            'record_id' => (int) ($request->route('id') ?? 0),
            'action' => $this->actionFor($request, $module),
            'new_data' => json_encode(['method' => $request->method(), 'path' => $request->path()]),
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 255),
            'created_at' => now(),
        ]);

        return $response;
    }

    private function shouldRecord(Request $request): bool
    {
        return $request->isMethod('POST') || $request->isMethod('PUT') || $request->isMethod('PATCH') || $request->isMethod('DELETE');
    }

    private function moduleFor(Request $request): string
    {
        return explode('/', trim($request->path(), '/'))[1] ?? 'system';
    }

    private function actionFor(Request $request, string $module): string
    {
        if ($module === 'transfers') return 'TRANSFER';
        if ($module === 'assignments') return 'ASSIGN';
        if ($module === 'disposal') return 'DISPOSE';
        if ($request->isMethod('DELETE')) return 'DELETE';
        return $request->isMethod('POST') ? 'INSERT' : 'UPDATE';
    }
}