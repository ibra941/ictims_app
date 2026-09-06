<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssetController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $page = max(1, (int) $request->query('page', 1));
        $perPage = min(100, max(10, (int) $request->query('per_page', 15)));

        $assets = Asset::query()
            ->with(['category', 'campus', 'department', 'supplier'])
            ->latest('created_at')
            ->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'success' => true,
            'data' => [
                'items' => $assets->getCollection()->map(function (Asset $asset): array {
                    return [
                        'id' => $asset->asset_id,
                        'name' => $asset->name,
                        'serial_number' => $asset->serial_number,
                        'status' => $asset->status,
                        'category' => $asset->category?->name,
                        'campus' => $asset->campus?->name,
                        'department' => $asset->department?->name,
                        'supplier' => $asset->supplier?->name,
                        'cost' => $asset->cost,
                        'purchase_date' => $asset->purchase_date?->toDateString(),
                    ];
                }),
                'total' => $assets->total(),
                'page' => $assets->currentPage(),
                'per_page' => $assets->perPage(),
            ],
        ]);
    }
}
