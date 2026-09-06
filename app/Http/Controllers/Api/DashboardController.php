<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $statusCounts = Asset::query()
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        return response()->json([
            'success' => true,
            'data' => [
                'totals' => [
                    'assets' => Asset::count(),
                    'assigned' => (int) ($statusCounts['Assigned'] ?? 0),
                    'maintenance' => (int) ($statusCounts['Under Maintenance'] ?? 0),
                    'disposed' => (int) ($statusCounts['Disposed'] ?? 0),
                ],
                'status_breakdown' => [
                    'Available' => (int) ($statusCounts['Available'] ?? 0),
                    'Assigned' => (int) ($statusCounts['Assigned'] ?? 0),
                    'Under Maintenance' => (int) ($statusCounts['Under Maintenance'] ?? 0),
                    'Disposed' => (int) ($statusCounts['Disposed'] ?? 0),
                    'Lost' => (int) ($statusCounts['Lost'] ?? 0),
                ],
                'roles' => Role::query()->withCount('permissions')->orderBy('name')->get(),
                'recent_activity' => DB::table('audit_logs')->latest('created_at')->limit(5)->get(),
            ],
        ]);
    }
}
