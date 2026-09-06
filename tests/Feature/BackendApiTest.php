<?php

namespace Tests\Feature;

use Tests\TestCase;

class BackendApiTest extends TestCase
{
    public function test_dashboard_endpoint_returns_summary_payload(): void
    {
        $response = $this->getJson('/api/dashboard');

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => [
                    'totals',
                    'status_breakdown',
                    'recent_activity',
                ],
            ]);
    }

    public function test_assets_endpoint_returns_empty_collection_structure(): void
    {
        $response = $this->getJson('/api/assets');

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => [
                    'items',
                    'total',
                    'page',
                    'per_page',
                ],
            ]);
    }
}
