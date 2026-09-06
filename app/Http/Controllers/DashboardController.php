<?php

namespace App\Http\Controllers;

use App\Models\Models\Asset;
use App\Models\Models\AssetAssignment;
use App\Models\Models\Employee;
use App\Models\Models\Department;
use App\Models\Models\Role;
use App\Models\Models\AuditLog;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index()
    {
        // Stats for the cards
        $stats = [
            [
                'label' => 'Total Assets',
                'value' => Asset::count(),
                'tone' => 'sky'
            ],
            [
                'label' => 'Available',
                'value' => Asset::where('status', 'Available')->count(),
                'tone' => 'emerald'
            ],
            [
                'label' => 'Assigned',
                'value' => Asset::where('status', 'Assigned')->count(),
                'tone' => 'amber'
            ],
            [
                'label' => 'Under Maintenance',
                'value' => Asset::where('status', 'Under Maintenance')->count(),
                'tone' => 'rose'
            ],
        ];

        // Get assets with their relationships for the table
        $assets = Asset::with(['category', 'campus', 'department'])
            ->limit(10)
            ->get()
            ->map(function ($asset) {
                return [
                    'name' => $asset->name,
                    'category' => $asset->category ? $asset->category->name : 'Uncategorized',
                    'status' => $asset->status,
                    'location' => $asset->campus ? $asset->campus->name : 'No Location',
                ];
            });

        // Get roles with permissions and user counts
        $roles = Role::withCount(['permissions', 'users'])->get();

        // Get recent activities (using audit logs)
        $recentActivities = AuditLog::with('user')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($log) {
                return [
                    'title' => $log->user ? $log->user->username . ' performed ' . $log->action : 'System action: ' . $log->action,
                    'time' => $log->created_at ? $log->created_at->diffForHumans() : 'Recently',
                ];
            });

        // If no audit logs, add some sample activities
        if ($recentActivities->isEmpty()) {
            $recentActivities = collect([
                [
                    'title' => 'System started',
                    'time' => now()->diffForHumans()
                ],
                [
                    'title' => 'Database connection established',
                    'time' => now()->subMinutes(5)->diffForHumans()
                ],
            ]);
        }

        return view('dashboard', compact('stats', 'assets', 'roles', 'recentActivities'));
    }

    // API endpoint for dashboard data
    public function apiData()
    {
        try {
            $stats = [
                'total_assets' => Asset::count(),
                'available_assets' => Asset::where('status', 'Available')->count(),
                'assigned_assets' => Asset::where('status', 'Assigned')->count(),
                'under_maintenance' => Asset::where('status', 'Under Maintenance')->count(),
                'total_employees' => Employee::where('is_active', 1)->count(),
                'total_departments' => Department::count(),
                'active_assignments' => AssetAssignment::where('status', 'Active')->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
